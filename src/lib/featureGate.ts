import prisma from '@/lib/prisma';

export interface PlanFeatures {
  [key: string]: boolean;
}

/**
 * Checks if a user has access to a specific feature key.
 */
export async function checkFeatureAccess(
  userId: string,
  featureKey: string,
): Promise<{ allowed: boolean; reason?: string }> {
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

    const plan = user.plan;
    const isFree = !plan || plan.isFree || plan.name.toLowerCase() === 'free';

    // If paid subscription is active, unlock ALL possible premium features!
    if (!isFree) {
      return { allowed: true };
    }

    // Free plan restrictions mapping
    const freePlanAllowedKeys = new Set([
      'openPublicPolls',
      'realTimeLiveResults',
      'singleChoiceMultiSelect',
      'multipleQuestionTypes',
      'anonymousResponses',
      'mcqSingleCorrect',
      'trueOrFalse',
      'premiumDarkMode',
    ]);

    if (freePlanAllowedKeys.has(featureKey)) {
      return { allowed: true };
    }

    return { 
      allowed: false, 
      reason: `The premium feature "${featureKey}" is locked on the Free tier. Upgrade your subscription to gain access to all premium features instantly.` 
    };
  } catch (e) {
    console.error(e);
    return { allowed: true }; // Safe fallback
  }
}

/**
 * Checks if a creator can use a specific poll subtype.
 */
export async function checkPollSubtypeAccess(
  userId: string,
  subtype: 'mcq' | 'ranked' | 'multi' | 'knockout',
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { plan: true },
    });

    if (!user) return false;
    if (user.role === 'ADMIN') return true;

    const plan = user.plan;
    const isFree = !plan || plan.isFree || plan.name.toLowerCase() === 'free';

    // If paid subscription is active, unlock ALL subtypes!
    if (!isFree) {
      return true;
    }

    // Free plan allows MCQ and True/False (represented by mcq/multi)
    if (subtype === 'mcq' || subtype === 'multi') {
      return true;
    }

    return false; // Ranked choice and Knockout tournaments are locked on free
  } catch (e) {
    console.error(e);
    return true; // Safe fallback
  }
}

