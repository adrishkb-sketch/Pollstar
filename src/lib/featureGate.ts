import prisma from '@/lib/prisma';

export interface PlanFeatures {
  [key: string]: boolean;
}

/**
 * Checks if a user has access to a specific feature key based on their plan, trials, and packaging.
 * If the user is an ADMIN, they have bypass access to everything.
 * If the user's plan is not set, we default to the "Free" plan features or basic fallbacks.
 */
export async function checkFeatureAccess(userId: string, featureKey: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  try {
    // 1. Fetch user with plan
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { plan: true },
    });

    if (!user) {
      return { allowed: false, reason: 'User not found.' };
    }

    // Admins have absolute power
    if (user.role === 'ADMIN') {
      return { allowed: true };
    }

    // 2. Resolve Plan
    let plan = user.plan;
    if (!plan) {
      // Find default Free plan
      plan = await prisma.plan.findFirst({
        where: { name: 'Free' }
      });
    }

    if (!plan) {
      // Basic fallback if no plan is set and default Free plan is missing
      const basicAllowedKeys = ['singleChoice', 'openPublicPolls', 'mcqSingleCorrect'];
      if (basicAllowedKeys.includes(featureKey)) {
        return { allowed: true };
      }
      return { allowed: false, reason: 'No active subscription plan or default features found.' };
    }

    // Check if plan is active
    if (!plan.isActive) {
      return { allowed: false, reason: 'Your subscription tier is currently inactive. Please contact support.' };
    }

    // 3. Check Free Trial Status
    if (plan.hasFreeTrial) {
      const trialDays = plan.freeTrialDays || 7;
      const trialExpiry = new Date(user.createdAt.getTime() + trialDays * 24 * 60 * 60 * 1000);
      const isTrialActive = new Date() < trialExpiry;

      if (isTrialActive) {
        // Check trial allowed features
        const trialFeats = plan.freeTrialFeatures as any;
        if (trialFeats && typeof trialFeats === 'object' && trialFeats[featureKey]) {
          return { allowed: true };
        }
      }
    }

    // 4. Check Pack Quantity Limitations
    if (plan.planType !== 'SUBSCRIPTION') {
      const allowedCount = (plan.packQuantity || 0) + (plan.freePerks || 0);
      
      // Determine what type of pack we are checking
      if (plan.planType === 'POLL_PACK' && (featureKey.toLowerCase().includes('poll') || featureKey === 'singleChoice')) {
        const createdCount = await prisma.poll.count({
          where: { creatorId: user.id }
        });
        if (createdCount >= allowedCount) {
          return {
            allowed: false,
            reason: `You have exhausted your Poll Pack allowance of ${allowedCount} polls.`
          };
        }
      } else if (plan.planType === 'SURVEY_PACK' && featureKey.toLowerCase().includes('survey')) {
        // Count surveys
        const createdCount = await prisma.poll.count({
          where: { creatorId: user.id, pollType: 'SURVEY' }
        });
        if (createdCount >= allowedCount) {
          return {
            allowed: false,
            reason: `You have exhausted your Survey Pack allowance of ${allowedCount} surveys.`
          };
        }
      } else if (plan.planType === 'EXAM_PACK' && featureKey.toLowerCase().includes('exam')) {
        // Count exams
        const createdCount = await prisma.poll.count({
          where: { creatorId: user.id, pollType: 'EXAM' }
        });
        if (createdCount >= allowedCount) {
          return {
            allowed: false,
            reason: `You have exhausted your Exam Pack allowance of ${allowedCount} exams.`
          };
        }
      } else if (plan.planType === 'COMBO_PACK') {
        const comboTypesRaw = plan.comboTypes;
        const comboTypes: string[] = comboTypesRaw 
          ? (typeof comboTypesRaw === 'string' 
             ? comboTypesRaw.split(',') 
             : (Array.isArray(comboTypesRaw) ? comboTypesRaw.map(String) : [])) 
          : [];
        
        // If checking a poll feature, ensure POLL is in combo
        if (featureKey.toLowerCase().includes('poll') && !comboTypes.includes('POLL')) {
          return { allowed: false, reason: 'Your combo pack does not include Poll features.' };
        }
        if (featureKey.toLowerCase().includes('survey') && !comboTypes.includes('SURVEY')) {
          return { allowed: false, reason: 'Your combo pack does not include Survey features.' };
        }
        if (featureKey.toLowerCase().includes('exam') && !comboTypes.includes('EXAM')) {
          return { allowed: false, reason: 'Your combo pack does not include Exam features.' };
        }

        // Check aggregate counts
        const createdCount = await prisma.poll.count({
          where: { creatorId: user.id }
        });
        if (createdCount >= allowedCount) {
          return {
            allowed: false,
            reason: `You have exhausted your Combo Pack allowance of ${allowedCount} total items.`
          };
        }
      }
    }

    // 5. Standard Feature Check
    const planFeats = plan.features as any;
    if (planFeats && typeof planFeats === 'object' && planFeats[featureKey]) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: `The feature "${featureKey}" is not included in your current "${plan.name}" plan.`
    };
  } catch (error) {
    console.error('Error in checkFeatureAccess:', error);
    return { allowed: false, reason: 'An error occurred checking feature permissions.' };
  }
}

/**
 * Checks if a creator can use a specific poll subtype (e.g. MCQ, ranked, multi, knockout)
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

  // If pollSubtypes is not specified, default to allow all for compatibility
  if (!plan.pollSubtypes) return true;

  const rawSubtypes = plan.pollSubtypes;
  const allowedTypes: string[] = rawSubtypes
    ? (typeof rawSubtypes === 'string'
       ? rawSubtypes.split(',')
       : (Array.isArray(rawSubtypes) ? rawSubtypes.map(String) : []))
    : [];
  return allowedTypes.includes(subtype);
}
