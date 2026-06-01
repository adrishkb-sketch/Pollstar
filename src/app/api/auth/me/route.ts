import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken, verifyRefreshToken, generateAccessToken, getCookieOptions } from '@/lib/jwt';
import { checkAndExpirePlan, checkAndCleanExpiredPlanOffers } from '@/lib/planExpiry';
import { getCache, setCache } from '@/lib/serverCache';

const FREE_PLAN_FEATURES = {
  openPublicPolls: true,
  realTimeLiveResults: true,
  singleChoiceMultiSelect: true,
  multipleQuestionTypes: true,
  anonymousResponses: true,
  mcqSingleCorrect: true,
  trueOrFalse: true,
  premiumDarkMode: true,
};

/**
 * Returns (or creates) the Free plan, cached for 10 minutes.
 * Never runs an UPDATE on every request — features only sync once per cache TTL.
 */
async function getOrCreateFreePlan() {
  const CACHE_KEY = 'free_plan';
  const cached = getCache<{ id: string; name: string }>(CACHE_KEY);
  if (cached) return cached;

  let freePlan = await prisma.plan.findUnique({ where: { name: 'Free' } });
  if (!freePlan) {
    freePlan = await prisma.plan.create({
      data: {
        name: 'Free',
        description: 'Our standard free tier with access to all basic features.',
        price: 0.0,
        isFree: true,
        billingCycle: 'MONTHLY',
        features: FREE_PLAN_FEATURES,
      },
    });
  }
  setCache(CACHE_KEY, { id: freePlan.id, name: freePlan.name }, 10 * 60 * 1000); // 10 min
  return freePlan;
}

/**
 * Returns email domain mappings, cached for 10 minutes.
 * These almost never change.
 */
async function getEmailDomainMappings() {
  const CACHE_KEY = 'email_domain_mappings';
  const cached = getCache<any[]>(CACHE_KEY);
  if (cached) return cached;
  const mappings = await prisma.emailDomainMapping.findMany({ include: { plan: true } });
  setCache(CACHE_KEY, mappings, 10 * 60 * 1000);
  return mappings;
}

/**
 * Returns maintenance mode status, cached for 30 seconds.
 */
async function getMaintenanceMode(): Promise<boolean> {
  const CACHE_KEY = 'maintenance_mode';
  const cached = getCache<boolean>(CACHE_KEY);
  if (cached !== null) return cached;
  const config = await prisma.siteConfig.findUnique({ where: { key: 'maintenance_mode_enabled' } });
  const isOn = config?.value === 'true';
  setCache(CACHE_KEY, isOn, 30 * 1000); // 30 seconds
  return isOn;
}

/**
 * Returns global display currency, cached for 10 minutes.
 */
async function getGlobalDisplayCurrency(): Promise<string> {
  const CACHE_KEY = 'global_display_currency';
  const cached = getCache<string>(CACHE_KEY);
  if (cached) return cached;
  const config = await prisma.siteConfig.findUnique({ where: { key: 'global_display_currency' } });
  const currency = config?.value || 'INR';
  setCache(CACHE_KEY, currency, 10 * 60 * 1000);
  return currency;
}

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    const refreshToken = cookieStore.get('refreshToken')?.value;

    let payload = accessToken ? verifyAccessToken(accessToken) : null;
    let newAccessToken: string | null = null;

    if (!payload && refreshToken) {
      const refreshPayload = verifyRefreshToken(refreshToken);
      if (refreshPayload) {
        payload = { userId: refreshPayload.userId, email: refreshPayload.email, role: refreshPayload.role };
        newAccessToken = generateAccessToken(payload);
      }
    }

    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
    }

    // ── Parallelize all independent startup work ─────────────────────────────
    const [user, freePlan, maintenanceOn, globalDisplayCurrency, mappings] = await Promise.all([
      prisma.user.findUnique({ where: { id: payload.userId }, include: { plan: true } }),
      getOrCreateFreePlan(),
      getMaintenanceMode(),
      getGlobalDisplayCurrency(),
      getEmailDomainMappings(),
      checkAndCleanExpiredPlanOffers(), // throttled to run at most once/5 min
    ]).then(results => results); // .then() just for clarity; returns the same array

    let currentUser = user;

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // ── Plan expiry check (only runs actual DB write if plan is expired) ──────
    const planExpired = await checkAndExpirePlan(currentUser.id);

    // Re-fetch user only if something changed (plan expiry or missing data)
    const needsRefetch = planExpired || !currentUser.referralCode || !currentUser.planId ||
      (!currentUser.planId && !currentUser.plan);

    if (needsRefetch) {
      const refreshedUser = await prisma.user.findUnique({
        where: { id: currentUser.id },
        include: { plan: true },
      });
      if (refreshedUser) currentUser = refreshedUser;
    }

    // ── Auto-heal missing referral code ──────────────────────────────────────
    if (!currentUser.referralCode) {
      const uniqueReferralCode = 'ref_' + Math.random().toString(36).substring(2, 9);
      currentUser = await prisma.user.update({
        where: { id: currentUser.id },
        data: { referralCode: uniqueReferralCode },
        include: { plan: true },
      }) || currentUser;
    }

    // ── Auto-upgrade if email matches whitelisted domain ─────────────────────
    if (!currentUser.planId || currentUser.plan?.name === 'Free') {
      let autoUpgradePlan = null;
      let matchingMapping: any = null;
      for (const mapping of mappings) {
        const domainSuffix = mapping.domain.startsWith('@') ? mapping.domain : `@${mapping.domain}`;
        if (currentUser.email.toLowerCase().endsWith(domainSuffix.toLowerCase())) {
          autoUpgradePlan = mapping.plan;
          matchingMapping = mapping;
          break;
        }
      }

      if (autoUpgradePlan && currentUser.planId !== autoUpgradePlan.id) {
        const domainExpiry = matchingMapping?.durationMonths
          ? new Date(Date.now() + matchingMapping.durationMonths * 30 * 24 * 60 * 60 * 1000)
          : null;
        currentUser = await prisma.user.update({
          where: { id: currentUser.id },
          data: {
            planId: autoUpgradePlan.id,
            domainPlanExpiry: domainExpiry,
            planBillingCycle: domainExpiry ? 'MONTHLY' : 'LIFETIME',
            isLifetimePlan: !domainExpiry,
          },
          include: { plan: true },
        });
      }
    }

    // ── Auto-assign Free plan if still missing planId ────────────────────────
    if (!currentUser.planId) {
      currentUser = await prisma.user.update({
        where: { id: currentUser.id },
        data: { planId: freePlan.id },
        include: { plan: true },
      });
    }

    // ── Maintenance mode check ───────────────────────────────────────────────
    if (maintenanceOn && currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { maintenance: true, error: 'Platform is currently undergoing scheduled maintenance.' },
        { status: 503 }
      );
    }

    // Fetch user's COMPLETED active add-on invoices to find the highest addonRank
    // PENDING/REJECTED UPI invoices are excluded — no access granted until verified
    const activeAddons = await prisma.invoice.findMany({
      where: {
        userId: currentUser.id,
        isAddon: true,
        paymentStatus: 'COMPLETED',
        OR: [
          { planExpiresAt: null },
          { planExpiresAt: { gte: new Date() } }
        ]
      },
      include: { plan: true }
    });
    const activeAddonRank = activeAddons.reduce((maxRank, inv) => {
      const rank = inv.plan?.addonRank ?? 0;
      return rank > maxRank ? rank : maxRank;
    }, 0);

    let userPlanObj = currentUser.plan;
    if (userPlanObj && userPlanObj.name.toLowerCase() !== 'free' && !userPlanObj.isFree) {
      const allFeatures: Record<string, boolean> = {
        openPublicPolls: true,
        realTimeLiveResults: true,
        liveGeolocationMap: true,
        liveVoteTicker: true,
        viralVoteIndicators: true,
        rankedChoiceBordaCount: true,
        quadraticVoting: true,
        singleChoiceMultiSelect: true,
        enableDragAndDropPodium: true,
        opinionChatbox: true,
        sentimentReactions: true,
        voterLeaderboard: true,
        multipleChartTypes: true,
        voteTimelineGraph: true,
        multiRoundPolls: true,
        revoteChangeVote: true,
        knockoutBracket: true,
        enableScenarioSimulator: true,
        enableAiProjection: true,
        multipleQuestionTypes: true,
        longFormTextResponses: true,
        starEmojiRatings: true,
        matrixGridQuestions: true,
        yesnoToggleQuestions: true,
        fileUploadQuestions: true,
        conditionalLogicBranching: true,
        multiPageSurveys: true,
        questionRandomizationSurvey: true,
        responseTimeLimits: true,
        requiredVsOptionalQuestions: true,
        inputValidationRules: true,
        realTimeResponseDashboard: true,
        aiSentimentAnalysis: true,
        wordCloudGenerator: true,
        aiSummaryReport: true,
        automatedReminders: true,
        completionRateTracking: true,
        anonymousResponses: true,
        targetedDistribution: true,
        responseFilteringSegmentation: true,
        saveResumeLater: true,
        enableDropOffTracking: true,
        enableCrossTabulation: true,
        timedExams: true,
        fullScreenLockdown: true,
        tabSwitchDetection: true,
        copyPastePrevention: true,
        cheatProbabilityScore: true,
        perQuestionMarks: true,
        autoGradingEngine: true,
        manualGradingInterface: true,
        pageBreaksSections: true,
        dragAndDropQuestionOrderingExam: true,
        detailedScoreReports: true,
        classPerformanceAnalytics: true,
        weaknessAnalysis: true,
        aiConceptExplanations: true,
        printableResultsPdf: true,
        bulkResultsExport: true,
        emailResultsToStudents: true,
        teacherGradebook: true,
        scheduledStartEnd: true,
        questionHints: true,
        negativeMarking: true,
        studentRosterManagement: true,
        timePerQuestionAnalytics: true,
        inbuiltScientificCalculator: true,
        saveResumeLaterExam: true,
        liveWebcamProctoring: true,
        mcqSingleCorrect: true,
        mcqMultipleCorrect: true,
        shortAnswerQuestionsSaq: true,
        longAnswerQuestionsLaq: true,
        trueOrFalse: true,
        fillInTheBlanks: true,
        matchTheFollowing: true,
        numericalInput: true,
        fileUploadAnswers: true,
        studentWhiteboardQuestion: true,
        otpVoterVerification: true,
        closedVoterLists: true,
        customBranding: true,
        customBrandingThemes: true,
        creatorScribbleCanvas: true,
        premiumDarkMode: true,
        organizationAccounts: true,
        apiWebhooks: true,
        deviceFingerprinting: true,
        exportResults: true,
        enableDomainRestriction: true,
        collaborations: true,
        enableDirectInbox: true,
        removeAdvertisements: true,
        embedCode: true,
        linkShortener: true,
      };
      userPlanObj = {
        ...userPlanObj,
        features: allFeatures,
        pollSubtypes: 'mcq,ranked,multi,knockout',
      };
    }

    const response = NextResponse.json({
      success: true,
      globalDisplayCurrency,
      user: {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
        approved: currentUser.approvedByAdmin,
        createdAt: currentUser.createdAt,
        profileCompleted: currentUser.profileCompleted,
        fullName: currentUser.fullName,
        avatar: currentUser.avatar,
        phoneNumber: currentUser.phoneNumber,
        occupation: currentUser.occupation,
        institution: currentUser.institution,
        studyField: currentUser.studyField,
        gradYear: currentUser.gradYear,
        jobTitle: currentUser.jobTitle,
        industry: currentUser.industry,
        educatorSubject: currentUser.educatorSubject,
        educatorDept: currentUser.educatorDept,
        researchDomain: currentUser.researchDomain,
        researchPos: currentUser.researchPos,
        otherDetail: currentUser.otherDetail,
        bio: currentUser.bio,
        gender: currentUser.gender,
        primaryPurpose: currentUser.primaryPurpose,
        verificationStatus: currentUser.verificationStatus,
        verificationReason: currentUser.verificationReason,
        verificationDocUrl: currentUser.verificationDocUrl,
        isVerifiedUser: currentUser.isVerifiedUser,
        isBanned: currentUser.isBanned,
        isSuspended: currentUser.isSuspended,
        suspensionUntil: currentUser.suspensionUntil,
        suspensionReason: currentUser.suspensionReason,
        isActivityRestricted: currentUser.isActivityRestricted,
        plan: userPlanObj,
        referralCode: currentUser.referralCode,
        twoFactorEnabled: currentUser.twoFactorEnabled,
        planExpiresAt: currentUser.planExpiresAt,
        planBillingCycle: currentUser.planBillingCycle,
        isLifetimePlan: currentUser.isLifetimePlan,
        domainPlanExpiry: currentUser.domainPlanExpiry,
        activeAddonRank,
      },
    });

    if (newAccessToken) {
      const hostHeader = req.headers.get('host');
      const cookieOptions = getCookieOptions(hostHeader);
      response.cookies.set('accessToken', newAccessToken, { ...cookieOptions, maxAge: 3600 });
    }

    return response;
  } catch (error) {
    console.error('Me Auth Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
