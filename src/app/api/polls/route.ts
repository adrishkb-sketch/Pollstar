import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/jwt';
import { sendPollInvitationEmail } from '@/lib/nodemailer';
import { moderateContent } from '@/lib/contentModerator';
import { checkFeatureAccess, checkPollSubtypeAccess } from '@/lib/featureGate';
import { checkAndExpirePlan } from '@/lib/planExpiry';

// Helper to authenticate user from cookies
async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  const refreshToken = cookieStore.get('refreshToken')?.value;

  let payload = token ? verifyAccessToken(token) : null;

  if (!payload && refreshToken) {
    const refreshPayload = verifyRefreshToken(refreshToken);
    if (refreshPayload) {
      payload = {
        userId: refreshPayload.userId,
        email: refreshPayload.email,
        role: refreshPayload.role,
      };
    }
  }

  if (!payload) return null;

  // Run a robust check/expiry check on access
  await checkAndExpirePlan(payload.userId);

  return prisma.user.findUnique({
    where: { id: payload.userId },
  });
}

/**
 * GET: Lists all polls created by the authenticated user.
 * If user is ADMIN, lists ALL polls.
 */
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let polls;
    if (user.role === 'ADMIN') {
      polls = await prisma.poll.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          creator: { select: { email: true, isVerifiedUser: true, fullName: true } },
          questions: { include: { options: true } },
          votes: true,
          settings: true,
          collaborators: {
            include: {
              user: { select: { email: true } }
            }
          }
        },
      });
    } else {
      polls = await prisma.poll.findMany({
        where: {
          OR: [
            { creatorId: user.id },
            { collaborators: { some: { userId: user.id } } }
          ]
        },
        orderBy: { createdAt: 'desc' },
        include: {
          creator: { select: { email: true, isVerifiedUser: true, fullName: true } },
          questions: { include: { options: true } },
          votes: true,
          settings: true,
          collaborators: {
            include: {
              user: { select: { email: true } }
            }
          }
        },
      });
    }

    // Auto-expire: batch-transition any ACTIVE polls whose endTime has passed
    const now = new Date();
    const expiredPolls = polls.filter(
      (p: any) => p.status === 'ACTIVE' && p.endTime && now > new Date(p.endTime)
    );
    if (expiredPolls.length > 0) {
      await prisma.poll.updateMany({
        where: {
          id: { in: expiredPolls.map((p: any) => p.id) },
          status: 'ACTIVE',
        },
        data: { status: 'ENDED' },
      });
      // Reflect locally so the response is accurate
      expiredPolls.forEach((p: any) => { p.status = 'ENDED'; });
    }

    return NextResponse.json({ success: true, polls });
  } catch (error: any) {
    console.error('List Polls API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST: Creates a new poll including questions, options, settings, and allowed voters.
 */
export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify email verification status
    if (!user.verified) {
      return NextResponse.json(
        { error: 'Please verify your email via signup OTP before creating sessions.' },
        { status: 403 }
      );
    }

    // Check Activity Restriction
    if (user.isActivityRestricted && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Your account activities have been restricted by the Administrator. You cannot create new polls or surveys.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      description,
      posterUrl,
      isOpenVoting,
      isAnonymous,
      isResultPublic,
      startTime,
      endTime,
      status, // 'DRAFT' | 'ACTIVE'
      questions, // array
      settings,  // object
      allowedVoters, // array (only for closed voting)
      pollType, // 'POLL' | 'SURVEY'
    } = body;

    if (!title || !description || !startTime || !endTime || !questions || !questions.length) {
      return NextResponse.json(
        { error: 'Missing compulsory poll creation parameters' },
        { status: 400 }
      );
    }

    // Plan Gating Checks
    if (user.role !== 'ADMIN') {
      const userWithPlan = await prisma.user.findUnique({
        where: { id: user.id },
        include: { plan: true },
      });

      if (userWithPlan) {
        const plan = userWithPlan.plan;
        const isFreePlan = !plan || plan.name.toLowerCase() === 'free';

        // ── 1. Subscription Billing Cycle ────────────────────────────────────
        let cycleStart: Date;
        let cycleEnd: Date;

        if (isFreePlan || !userWithPlan.planExpiresAt) {
          const now = new Date();
          const ann = new Date(userWithPlan.createdAt);
          ann.setFullYear(now.getFullYear());
          ann.setMonth(now.getMonth());
          if (ann > now) ann.setMonth(ann.getMonth() - 1);
          cycleStart = ann;
          cycleEnd = new Date(ann);
          cycleEnd.setMonth(cycleEnd.getMonth() + 1);
        } else {
          const expEnd = new Date(userWithPlan.planExpiresAt);
          const expStart = new Date(userWithPlan.planExpiresAt);
          const cycle = (userWithPlan.planBillingCycle || 'MONTHLY').toUpperCase();
          if (cycle === 'MONTHLY') expStart.setMonth(expStart.getMonth() - 1);
          else if (cycle === 'QUARTERLY') expStart.setMonth(expStart.getMonth() - 3);
          else if (cycle === 'YEARLY') expStart.setMonth(expStart.getMonth() - 12);
          else if (cycle === 'TWO_YEAR' || cycle === 'TWO_YEARS') expStart.setMonth(expStart.getMonth() - 24);
          else expStart.setMonth(expStart.getMonth() - 1);
          cycleStart = expStart;
          cycleEnd = expEnd;
        }

        // Base limits from plan
        let subLimitPolls: number = isFreePlan ? 3 : (plan?.maxPolls ?? -1);
        let subLimitSurveys: number = isFreePlan ? 3 : (plan?.maxSurveys ?? -1);
        let subLimitExams: number = isFreePlan ? 3 : (plan?.maxExams ?? -1);

        // Override with duration-specific limits if available
        if (plan && plan.durations && !isFreePlan) {
          const durs = plan.durations as any;
          const cycle = userWithPlan.planBillingCycle || 'MONTHLY';
          if (durs[cycle] && durs[cycle].enabled) {
            const cfg = durs[cycle];
            if (cfg.maxPolls !== undefined && cfg.maxPolls !== '') subLimitPolls = parseInt(cfg.maxPolls);
            if (cfg.maxSurveys !== undefined && cfg.maxSurveys !== '') subLimitSurveys = parseInt(cfg.maxSurveys);
            if (cfg.maxExams !== undefined && cfg.maxExams !== '') subLimitExams = parseInt(cfg.maxExams);
          }
        }

        // Only apply subscription limits for SUBSCRIPTION plan type (not packs)
        const planType = plan?.planType || 'SUBSCRIPTION';
        const isSubBased = !['POLL_PACK', 'SURVEY_PACK', 'EXAM_PACK', 'COMBO_PACK'].includes(planType);

        // Count usage in current billing cycle (for subscription-based plans)
        const [subUsedPolls, subUsedSurveys, subUsedExams] = await Promise.all([
          prisma.poll.count({ where: { creatorId: user.id, pollType: 'POLL', createdAt: { gte: cycleStart, lt: cycleEnd } } }),
          prisma.poll.count({ where: { creatorId: user.id, pollType: 'SURVEY', createdAt: { gte: cycleStart, lt: cycleEnd } } }),
          prisma.poll.count({ where: { creatorId: user.id, pollType: 'EXAM', createdAt: { gte: cycleStart, lt: cycleEnd } } }),
        ]);

        // ── 2. Pack / Addon quota (all-time, lifetime) ───────────────────────────
        const addonInvoices = await prisma.invoice.findMany({
          where: { userId: user.id, isAddon: true },
          include: { plan: true },
        });

        let packAllowedPolls = 0;
        let packAllowedSurveys = 0;
        let packAllowedExams = 0;

        let expiredCapacityPolls = 0;
        let expiredCapacitySurveys = 0;
        let expiredCapacityExams = 0;

        const nowTime = new Date();

        for (const inv of addonInvoices) {
          const p = inv.plan;
          if (!p) continue;

          // Check if this pack is still valid
          const isValid = !inv.planExpiresAt || new Date(inv.planExpiresAt) > nowTime;

          const qty = (p.packQuantity ?? 0) + (p.freePerks ?? 0);

          let allowedPolls = 0;
          let allowedSurveys = 0;
          let allowedExams = 0;

          switch (p.planType) {
            case 'POLL_PACK':
              allowedPolls = qty;
              break;
            case 'SURVEY_PACK':
              allowedSurveys = qty;
              break;
            case 'EXAM_PACK':
              allowedExams = qty;
              break;
            case 'COMBO_PACK': {
              const types: string[] = Array.isArray(p.comboTypes) ? (p.comboTypes as string[]) : [];
              const perType = types.length > 0 ? Math.floor(qty / types.length) : 0;
              if (types.includes('POLL')) allowedPolls = perType;
              if (types.includes('SURVEY')) allowedSurveys = perType;
              if (types.includes('EXAM')) allowedExams = perType;
              break;
            }
            case 'ADDON': {
              if (p.maxPolls && p.maxPolls > 0) allowedPolls = p.maxPolls;
              if (p.maxSurveys && p.maxSurveys > 0) allowedSurveys = p.maxSurveys;
              if (p.maxExams && p.maxExams > 0) allowedExams = p.maxExams;
              break;
            }
            default:
              break;
          }

          if (isValid) {
            packAllowedPolls += allowedPolls;
            packAllowedSurveys += allowedSurveys;
            packAllowedExams += allowedExams;
          } else {
            expiredCapacityPolls += allowedPolls;
            expiredCapacitySurveys += allowedSurveys;
            expiredCapacityExams += allowedExams;
          }
        }

        // All-time usage counts (for pack/entity quota tracking)
        const [activePolls, activeSurveys, activeExams, deletedPolls, deletedSurveys, deletedExams] = await Promise.all([
          prisma.poll.count({ where: { creatorId: user.id, pollType: 'POLL' } }),
          prisma.poll.count({ where: { creatorId: user.id, pollType: 'SURVEY' } }),
          prisma.poll.count({ where: { creatorId: user.id, pollType: 'EXAM' } }),
          prisma.deletedPoll.count({ where: { creatorId: user.id, pollType: 'POLL' } }),
          prisma.deletedPoll.count({ where: { creatorId: user.id, pollType: 'SURVEY' } }),
          prisma.deletedPoll.count({ where: { creatorId: user.id, pollType: 'EXAM' } }),
        ]);

        const allTimePolls   = Math.max(activePolls,   deletedPolls);
        const allTimeSurveys = Math.max(activeSurveys, deletedSurveys);
        const allTimeExams   = Math.max(activeExams,   deletedExams);

        // Overlapping pack depletion: adjustedPackUsed = max(0, allTime - expiredCapacity)
        const adjustedPackUsedPolls   = Math.max(0, allTimePolls   - expiredCapacityPolls);
        const adjustedPackUsedSurveys = Math.max(0, allTimeSurveys - expiredCapacitySurveys);
        const adjustedPackUsedExams   = Math.max(0, allTimeExams   - expiredCapacityExams);

        // ── 3. Build combined totals ─────────────────────────────────────────────
        const totalAllowedPolls = isSubBased
          ? (subLimitPolls === -1 ? -1 : subLimitPolls + packAllowedPolls)
          : packAllowedPolls;
        const totalAllowedSurveys = isSubBased
          ? (subLimitSurveys === -1 ? -1 : subLimitSurveys + packAllowedSurveys)
          : packAllowedSurveys;
        const totalAllowedExams = isSubBased
          ? (subLimitExams === -1 ? -1 : subLimitExams + packAllowedExams)
          : packAllowedExams;

        const totalUsedPolls = isSubBased ? subUsedPolls + adjustedPackUsedPolls : adjustedPackUsedPolls;
        const totalUsedSurveys = isSubBased ? subUsedSurveys + adjustedPackUsedSurveys : adjustedPackUsedSurveys;
        const totalUsedExams = isSubBased ? subUsedExams + adjustedPackUsedExams : adjustedPackUsedExams;


        // Perform validation check for the current requested creation type
        const targetType = pollType === 'SURVEY' ? 'SURVEY' : pollType === 'EXAM' ? 'EXAM' : 'POLL';
        const allowed = targetType === 'SURVEY' ? totalAllowedSurveys : targetType === 'EXAM' ? totalAllowedExams : totalAllowedPolls;
        const used = targetType === 'SURVEY' ? totalUsedSurveys : targetType === 'EXAM' ? totalUsedExams : totalUsedPolls;
        const activeLabel = targetType === 'SURVEY' ? 'surveys' : targetType === 'EXAM' ? 'exams' : 'polls';
        const planName = plan ? plan.name : 'Free';

        if (allowed !== -1 && used >= allowed) {
          return NextResponse.json({
            error: `You have reached the maximum allowance of ${allowed} ${activeLabel} on your current plan ("${planName}"). Please buy a credit add-on pack or upgrade your plan to create more.`
          }, { status: 403 });
        }
      }

      const typeKey = pollType === 'SURVEY' ? 'multipageSurveys' : pollType === 'EXAM' ? 'teacherGradebook' : 'openPublicPolls';
      const access = await checkFeatureAccess(user.id, typeKey);
      if (!access.allowed) {
        return NextResponse.json({ error: access.reason || 'Feature not allowed on your plan.' }, { status: 403 });
      }

      // Check poll subtype permissions for each question
      for (const q of questions) {
        if (q.type === 'RANKED') {
          const ok = await checkPollSubtypeAccess(user.id, 'ranked');
          if (!ok) return NextResponse.json({ error: 'Ranked Choice Polls are not allowed on your current plan.' }, { status: 403 });
        }
        if (q.type === 'KNOCKOUT') {
          const ok = await checkPollSubtypeAccess(user.id, 'knockout');
          if (!ok) return NextResponse.json({ error: 'Knockout Bracket Tournaments are not allowed on your current plan.' }, { status: 403 });
        }
        if (q.type === 'MULTI_SELECT') {
          const ok = await checkPollSubtypeAccess(user.id, 'multi');
          if (!ok) return NextResponse.json({ error: 'Multiple Correct Choice questions are not allowed on your current plan.' }, { status: 403 });
        }
        if (q.type === 'FILE_UPLOAD') {
          const res = await checkFeatureAccess(user.id, 'fileUploadQuestions');
          if (!res.allowed) return NextResponse.json({ error: 'File Upload Questions are not allowed on your current plan.' }, { status: 403 });
        }
      }
    }

    // Execute atomic transaction to write all layers of the poll
    const newPoll = await prisma.$transaction(async (tx) => {
      // 1. Create Poll
      const poll = await tx.poll.create({
        data: {
          creatorId: user.id,
          title,
          description,
          posterUrl: posterUrl || null,
          isOpenVoting: !!isOpenVoting,
          isAnonymous: !!isAnonymous,
          isResultPublic: !!isResultPublic,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          status: status === 'ACTIVE' ? 'ACTIVE' : 'DRAFT',
          pollType: pollType === 'SURVEY' ? 'SURVEY' : pollType === 'EXAM' ? 'EXAM' : 'POLL',
        },
      });

      // 2. Create Questions and Options
      for (const q of questions) {
        const question = await tx.question.create({
          data: {
            pollId: poll.id,
            questionText: q.questionText,
            type: ['RANKED', 'KNOCKOUT', 'MULTIPLE_CHOICE', 'SHORT_TEXT', 'LONG_TEXT', 'RATING', 'MULTI_SELECT', 'FILE_UPLOAD'].includes(q.type)
              ? q.type
              : 'SINGLE',
            pageNumber: q.pageNumber || 1,
            order: q.order || 1,
            logicRules: q.logicRules ? q.logicRules : null,
            correctAnswer: q.correctAnswer || null,
            correctAnswers: q.correctAnswers ? q.correctAnswers : null,
            marks: q.marks !== undefined ? parseFloat(q.marks) : 0.0,
            inputConstraint: q.inputConstraint || 'NONE',
            fileUploadDriveUrl: q.fileUploadDriveUrl || null,
            enableWhiteboard: !!q.enableWhiteboard,
          },
        });

        // Add Options
        if (q.options && q.options.length) {
          await tx.option.createMany({
            data: q.options.map((optText: string) => ({
              questionId: question.id,
              text: optText,
            })),
          });
        }
      }

      // 3. Create Settings
      await tx.pollSettings.create({
        data: {
          pollId: poll.id,
          limitOneVotePerUser: !!settings?.limitOneVotePerUser,
          limitOneVotePerIP: !!settings?.limitOneVotePerIP,
          limitOneVotePerISP: !!settings?.limitOneVotePerISP,
          hideResultsUntilEnd: !!settings?.hideResultsUntilEnd,
          collectEmail: !!settings?.collectEmail,
          postEmailMessage: settings?.postEmailMessage || null,
          enableDropOffTracking: !!settings?.enableDropOffTracking,
          enableSemanticAnalysis: !!settings?.enableSemanticAnalysis,
          enableCrossTabulation: !!settings?.enableCrossTabulation,
          enableTimeAnalytics: !!settings?.enableTimeAnalytics,
          publicShowMaps: settings?.publicShowMaps !== false,
          publicShowCharts: settings?.publicShowCharts !== false,
          publicShowStats: settings?.publicShowStats !== false,
          enableConfidenceSlider: !!settings?.enableConfidenceSlider,
          postSurveyAction: settings?.postSurveyAction || null,
          identifierLabel: body.identifierLabel || 'Roll Number',
          confirmer1Label: body.confirmer1Label || 'Student Name',
          confirmer2Label: body.confirmer2Label || 'Parent Name',
          enableDragAndDropPodium: !!settings?.enableDragAndDropPodium,
          enableHotStreaks: !!settings?.enableHotStreaks,
          enableLiveTicker: !!settings?.enableLiveTicker,
          enableFomoPopups: !!settings?.enableFomoPopups,
          enableSmartDebrief: !!settings?.enableSmartDebrief,
          leaderboardVisibility: settings?.leaderboardVisibility || "HIDDEN",
          enablePreferenceFlowMap: !!settings?.enablePreferenceFlowMap,
          enableHeadToHeadMatrix: !!settings?.enableHeadToHeadMatrix,
          enableConsensusScore: !!settings?.enableConsensusScore,
          enablePolarizationDetector: !!settings?.enablePolarizationDetector,
          enableKingmakerAnalysis: !!settings?.enableKingmakerAnalysis,
          enableRankHeatmap: !!settings?.enableRankHeatmap,
          enableRankConfidence: !!settings?.enableRankConfidence,
          enableScenarioSimulator: !!settings?.enableScenarioSimulator,
          enableTieBreakerEngine: !!settings?.enableTieBreakerEngine,
          rankedTieBreakerRule: settings?.rankedTieBreakerRule || "FIRST_PLACE",
          enableRankCompleteness: !!settings?.enableRankCompleteness,
          rankedCompletenessRule: settings?.rankedCompletenessRule || "PARTIAL",
          enablePodiumResults: !!settings?.enablePodiumResults,
          enableCoalitionFinder: !!settings?.enableCoalitionFinder,
          enableMinorityProtection: !!settings?.enableMinorityProtection,
          enableAuditReplay: !!settings?.enableAuditReplay,
          // Single Choice features
          enableQuadraticVoting: !!settings?.enableQuadraticVoting,
          enableAiProjection: !!settings?.enableAiProjection,
          enableCohortCrossTab: !!settings?.enableCohortCrossTab,
          enableSentimentChat: !!settings?.enableSentimentChat,
          enableSwingMap: !!settings?.enableSwingMap,
          // Knockout features
          enableBracketPredictions: !!settings?.enableBracketPredictions,
          enableDoubleElimination: !!settings?.enableDoubleElimination,
          enableUnderdogTracker: !!settings?.enableUnderdogTracker,
          enableOptionStatsCards: !!settings?.enableOptionStatsCards,
          enableSuddenDeath: !!settings?.enableSuddenDeath,

          // Verification Matrices
          verificationMethod: settings?.verificationMethod || 'EMAIL',
          verificationType: settings?.verificationType || 'OTP',

          // Online Testing / Exam Engine Toggles
          examTimerDuration: settings?.examTimerDuration ? parseInt(settings.examTimerDuration, 10) : null,
          enableProctorCamera: !!settings?.enableProctorCamera,
          enableProctorMicrophone: !!settings?.enableProctorMicrophone,
          proctorDriveFolderUrl: settings?.proctorDriveFolderUrl || null,
          enableAutoSubmitOnTabLeave: !!settings?.enableAutoSubmitOnTabLeave,
          enableAutoSubmitOnCacheClear: !!settings?.enableAutoSubmitOnCacheClear,
          enableAutoSubmitOnLeave: !!settings?.enableAutoSubmitOnLeave,
          resultsReleased: !!settings?.resultsReleased,

          // Custom White-Label Branding
          enableCustomBranding: !!settings?.enableCustomBranding,
          customLogoUrl: settings?.customLogoUrl || null,
          customBrandingText: settings?.customBrandingText || null,

          // Additional 30 Advanced Features suite toggles
          enableShuffleQuestions: !!settings?.enableShuffleQuestions,
          enableShuffleOptions: !!settings?.enableShuffleOptions,
          enableCopyPasteBlock: !!settings?.enableCopyPasteBlock,
          enableInstantFeedback: !!settings?.enableInstantFeedback,
          enableNegativeMarking: !!settings?.enableNegativeMarking,
          enableCalculator: !!settings?.enableCalculator,
          enableOtpBypass: !!settings?.enableOtpBypass,
          enableStrictTimeBuffer: !!settings?.enableStrictTimeBuffer,
          enableTabDepartureSound: !!settings?.enableTabDepartureSound,

          enableDemographicWeighting: !!settings?.enableDemographicWeighting,
          enableVpnBlocking: !!settings?.enableVpnBlocking,
          enableWriteInOptions: !!settings?.enableWriteInOptions,

          enableCustomNavLabels: !!settings?.enableCustomNavLabels,
          enablePreOnboarding: !!settings?.enablePreOnboarding,
          enableBranchingLogic: !!settings?.enableBranchingLogic,
          enableDomainRestriction: !!settings?.enableDomainRestriction,
          enableDirectInbox: !!settings?.enableDirectInbox,
          enableDraftSave: !!settings?.enableDraftSave,
          customTheme: settings?.customTheme || "MIDNIGHT",
          enableSaveAndResumeLater: !!settings?.enableSaveAndResumeLater,
          studentWhiteboardDriveUrl: settings?.studentWhiteboardDriveUrl || null,
        },
      });

      // 4. If Closed voting, import allowed voters
      if (!isOpenVoting && allowedVoters && allowedVoters.length) {
        await tx.allowedVoter.createMany({
          data: allowedVoters.map((voter: any) => ({
            pollId: poll.id,
            identifier: voter.identifier,
            confirmer1: voter.confirmer1,
            confirmer2: voter.confirmer2 || null,
            email: voter.email,
            phone: voter.phone || null,
            password: voter.password || null,
            voterAuthType: voter.voterAuthType || 'GLOBAL',
          })),
        });
      }

      return poll;
    });

    // Content Moderation: scan for explicit/offensive content
    const moderationResult = moderateContent({
      title,
      description,
      questions: questions.map((q: any) => ({
        questionText: q.questionText || q.text || '',
        options: (q.options || []).map((o: any) => ({ text: typeof o === 'string' ? o : o.text || '' })),
        correctAnswer: q.correctAnswer || undefined,
      })),
    });

    if (moderationResult.flagged) {
      // Set poll to ON_HOLD
      await prisma.poll.update({
        where: { id: newPoll.id },
        data: { status: 'ON_HOLD' },
      });

      // Create moderation record
      await prisma.contentModeration.create({
        data: {
          pollId: newPoll.id,
          reason: moderationResult.reasons.join('; '),
          flaggedText: moderationResult.flaggedTexts.join(' | '),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Your content has been put on hold for review. It contains language that requires administrator approval before publishing.',
        pollId: newPoll.id,
        moderated: true,
        reasons: moderationResult.reasons,
      });
    }

    // If published immediately (ACTIVE) and closed voting, invite voters via email in background
    if (newPoll.status === 'ACTIVE' && !isOpenVoting && allowedVoters && allowedVoters.length) {
      // In background, dispatch invitations
      const host = req.headers.get('host') || 'localhost:3000';
      const protocol = req.headers.get('x-forwarded-proto') || 'http';
      const inviteLink = `${protocol}://${host}/poll/${newPoll.id}`;

      allowedVoters.forEach((voter: any) => {
        sendPollInvitationEmail(
          voter.email,
          title,
          inviteLink,
          description,
          pollType
        ).catch((e) => console.error('Failed to send invite email to:', voter.email, e));
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Poll created successfully!',
      pollId: newPoll.id,
    });
  } catch (error: any) {
    console.error('Create Poll API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
