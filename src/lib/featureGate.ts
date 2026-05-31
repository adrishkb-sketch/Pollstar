import prisma from '@/lib/prisma';

export interface PlanFeatures {
  [key: string]: boolean;
}

/**
 * Checks if a user has access to a specific feature key.
 *
 * NOTE: All features are currently unlocked for all plan tiers.
 * Plans differentiate only on item quotas (maxPolls/Surveys/Exams) and
 * participant quotas (maxParticipants*). Feature-key gating infrastructure
 * is preserved here so it can be re-enabled in the future without a large refactor.
 */
export async function checkFeatureAccess(
  _userId: string,
  _featureKey: string,
): Promise<{ allowed: boolean; reason?: string }> {
  return { allowed: true };
}

/**
 * Checks if a creator can use a specific poll subtype.
 * Currently always returns true — all subtypes available on all plans.
 */
export async function checkPollSubtypeAccess(
  _userId: string,
  _subtype: 'mcq' | 'ranked' | 'multi' | 'knockout',
): Promise<boolean> {
  return true;
}
