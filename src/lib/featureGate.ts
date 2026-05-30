import prisma from '@/lib/prisma';

export interface PlanFeatures {
  [key: string]: boolean;
}

// Map of feature keys to their corresponding categories
const pollKeys = new Set([
  'openPublicPolls', 'realTimeLiveResults', 'liveGeolocationMap', 'liveVoteTicker', 
  'viralVoteIndicators', 'rankedChoiceBordaCount', 'quadraticVoting', 'singleChoiceMultiSelect', 
  'enableDragAndDropPodium', 'opinionChatbox', 'sentimentReactions', 'voterLeaderboard', 
  'multipleChartTypes', 'voteTimelineGraph', 'multiRoundPolls', 'revoteChangeVote', 
  'knockoutBracket', 'enableScenarioSimulator', 'enableAiProjection', 'singleChoice'
]);

const surveyKeys = new Set([
  'multipleQuestionTypes', 'longFormTextResponses', 'starEmojiRatings', 'matrixGridQuestions', 
  'yesnoToggleQuestions', 'fileUploadQuestions', 'conditionalLogicBranching', 'multiPageSurveys', 
  'questionRandomizationSurvey', 'responseTimeLimits', 'requiredVsOptionalQuestions', 'inputValidationRules', 
  'realTimeResponseDashboard', 'aiSentimentAnalysis', 'wordCloudGenerator', 'aiSummaryReport', 
  'automatedReminders', 'completionRateTracking', 'anonymousResponses', 'targetedDistribution', 
  'responseFilteringSegmentation', 'saveResumeLater', 'enableDropOffTracking', 'enableCrossTabulation'
]);

const examKeys = new Set([
  'timedExams', 'fullScreenLockdown', 'tabSwitchDetection', 'copyPastePrevention', 
  'cheatProbabilityScore', 'perQuestionMarks', 'autoGradingEngine', 'manualGradingInterface', 
  'pageBreaksSections', 'dragAndDropQuestionOrderingExam', 'detailedScoreReports', 'classPerformanceAnalytics', 
  'weaknessAnalysis', 'aiConceptExplanations', 'printableResultsPdf', 'bulkResultsExport', 
  'emailResultsToStudents', 'teacherGradebook', 'scheduledStartEnd', 'questionHints', 
  'negativeMarking', 'studentRosterManagement', 'timePerQuestionAnalytics', 'inbuiltScientificCalculator', 
  'saveResumeLaterExam', 'liveWebcamProctoring',
  // Exam question types
  'mcqSingleCorrect', 'mcqMultipleCorrect', 'shortAnswerQuestionsSaq', 'longAnswerQuestionsLaq', 
  'trueOrFalse', 'fillInTheBlanks', 'matchTheFollowing', 'numericalInput', 'fileUploadAnswers', 
  'studentWhiteboardQuestion'
]);

function getFeatureCategory(featureKey: string): 'POLL' | 'SURVEY' | 'EXAM' | 'PLATFORM' {
  if (pollKeys.has(featureKey) || featureKey.toLowerCase().includes('poll')) {
    return 'POLL';
  }
  if (surveyKeys.has(featureKey) || featureKey.toLowerCase().includes('survey')) {
    return 'SURVEY';
  }
  if (examKeys.has(featureKey) || featureKey.toLowerCase().includes('exam') || featureKey.toLowerCase().includes('gradebook')) {
    return 'EXAM';
  }
  return 'PLATFORM';
}

/**
 * Checks if a user has access to a specific feature key based on their plan and active pack invoices.
 */
export async function checkFeatureAccess(userId: string, featureKey: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { plan: true },
    });

    if (!user) {
      return { allowed: false, reason: 'User not found.' };
    }

    if (user.role === 'ADMIN') {
      return { allowed: true };
    }

    let plan = user.plan;
    if (!plan) {
      plan = await prisma.plan.findFirst({
        where: { name: 'Free' }
      });
    }

    if (!plan) {
      const basicAllowedKeys = ['singleChoice', 'openPublicPolls', 'mcqSingleCorrect'];
      if (basicAllowedKeys.includes(featureKey)) {
        return { allowed: true };
      }
      return { allowed: false, reason: 'No active subscription plan or default features found.' };
    }

    if (!plan.isActive) {
      return { allowed: false, reason: 'Your subscription tier is currently inactive. Please contact support.' };
    }

    const enabledCategories = new Set<string>();
    const now = new Date();

    const addCategoriesForPlan = (p: any) => {
      if (p.planType === 'SUBSCRIPTION') {
        enabledCategories.add('POLL');
        enabledCategories.add('SURVEY');
        enabledCategories.add('EXAM');
      } else if (p.planType === 'POLL_PACK') {
        enabledCategories.add('POLL');
      } else if (p.planType === 'SURVEY_PACK') {
        enabledCategories.add('SURVEY');
      } else if (p.planType === 'EXAM_PACK') {
        enabledCategories.add('EXAM');
      } else if (p.planType === 'COMBO_PACK') {
        const comboTypesRaw = p.comboTypes;
        const comboTypes: string[] = comboTypesRaw 
          ? (typeof comboTypesRaw === 'string' 
             ? comboTypesRaw.split(',') 
             : (Array.isArray(comboTypesRaw) ? comboTypesRaw.map(String) : [])) 
          : [];
        if (comboTypes.includes('POLL')) enabledCategories.add('POLL');
        if (comboTypes.includes('SURVEY')) enabledCategories.add('SURVEY');
        if (comboTypes.includes('EXAM')) enabledCategories.add('EXAM');
      } else if (p.planType === 'ADDON') {
        if (p.maxPolls && p.maxPolls > 0) enabledCategories.add('POLL');
        if (p.maxSurveys && p.maxSurveys > 0) enabledCategories.add('SURVEY');
        if (p.maxExams && p.maxExams > 0) enabledCategories.add('EXAM');
      }
    };

    // Check base plan (if active and not expired)
    const isBasePlanActive = plan.isActive && (!user.planExpiresAt || new Date(user.planExpiresAt) > now || user.isLifetimePlan);
    if (isBasePlanActive) {
      addCategoriesForPlan(plan);
    }

    // Check active addon/pack invoices
    const addonInvoices = await prisma.invoice.findMany({
      where: { userId: user.id, isAddon: true },
      include: { plan: true },
    });

    for (const inv of addonInvoices) {
      if (inv.plan && (!inv.planExpiresAt || new Date(inv.planExpiresAt) > now)) {
        addCategoriesForPlan(inv.plan);
      }
    }

    // If user has subscription, they have access to everything
    if (enabledCategories.has('POLL') && enabledCategories.has('SURVEY') && enabledCategories.has('EXAM')) {
      return { allowed: true };
    }

    const category = getFeatureCategory(featureKey);

    if (category === 'PLATFORM') {
      return { allowed: true }; // Platform features are always accessible
    }

    if (enabledCategories.has(category)) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: `The category "${category}" is not active or accessible under your current plans.`
    };
  } catch (error) {
    console.error('Error in checkFeatureAccess:', error);
    return { allowed: false, reason: 'An error occurred checking feature permissions.' };
  }
}

/**
 * Checks if a creator can use a specific poll subtype.
 */
export async function checkPollSubtypeAccess(userId: string, subtype: 'mcq' | 'ranked' | 'multi' | 'knockout'): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { plan: true },
  });

  if (!user || user.role === 'ADMIN') return true;
  
  let plan = user.plan;
  if (!plan) {
    plan = await prisma.plan.findFirst({ where: { name: 'Free' } });
  }

  if (!plan || !plan.isActive) return false;

  const now = new Date();
  const enabledCategories = new Set<string>();

  const addCategoriesForPlan = (p: any) => {
    if (p.planType === 'SUBSCRIPTION') {
      enabledCategories.add('POLL');
    } else if (p.planType === 'POLL_PACK') {
      enabledCategories.add('POLL');
    } else if (p.planType === 'COMBO_PACK') {
      const comboTypesRaw = p.comboTypes;
      const comboTypes: string[] = comboTypesRaw 
        ? (typeof comboTypesRaw === 'string' 
           ? comboTypesRaw.split(',') 
           : (Array.isArray(comboTypesRaw) ? comboTypesRaw.map(String) : [])) 
        : [];
      if (comboTypes.includes('POLL')) enabledCategories.add('POLL');
    } else if (p.planType === 'ADDON') {
      if (p.maxPolls && p.maxPolls > 0) enabledCategories.add('POLL');
    }
  };

  const isBasePlanActive = plan.isActive && (!user.planExpiresAt || new Date(user.planExpiresAt) > now || user.isLifetimePlan);
  if (isBasePlanActive) {
    addCategoriesForPlan(plan);
  }

  const addonInvoices = await prisma.invoice.findMany({
    where: { userId: user.id, isAddon: true },
    include: { plan: true },
  });

  for (const inv of addonInvoices) {
    if (inv.plan && (!inv.planExpiresAt || new Date(inv.planExpiresAt) > now)) {
      addCategoriesForPlan(inv.plan);
    }
  }

  // If POLL is enabled, allow all subtypes
  return enabledCategories.has('POLL');
}

