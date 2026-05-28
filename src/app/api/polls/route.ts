import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/jwt';
import { sendPollInvitationEmail } from '@/lib/nodemailer';

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
          })),
        });
      }

      return poll;
    });

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
          description
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
