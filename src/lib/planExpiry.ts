/**
 * planExpiry.ts
 * Shared helper to check if a user's subscription plan has expired
 * and auto-revert them to the default free plan if so.
 */
import prisma from '@/lib/prisma';

/**
 * Computes the expiry date for a newly purchased plan based on billing cycle.
 */
export function computePlanExpiresAt(billingCycle: string): Date | null {
  const now = new Date();
  switch (billingCycle.toUpperCase()) {
    case 'MONTHLY':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    case 'QUARTERLY':
      return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    case 'YEARLY':
      return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    case 'TWO_YEAR':
    case 'TWO_YEARS':
      return new Date(now.getTime() + 730 * 24 * 60 * 60 * 1000);
    case 'LIFETIME':
    case 'ONE_TIME':
      return null; // Never expires
    default:
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  }
}

/**
 * Formats a billing cycle string for display.
 */
export function formatBillingCycle(cycle: string): string {
  switch (cycle?.toUpperCase()) {
    case 'MONTHLY': return 'Monthly';
    case 'QUARTERLY': return 'Quarterly (3 Months)';
    case 'YEARLY': return 'Yearly (1 Year)';
    case 'TWO_YEAR':
    case 'TWO_YEARS': return '2 Years';
    case 'LIFETIME': return 'Lifetime';
    case 'ONE_TIME': return 'One-Time';
    default: return cycle || 'Monthly';
  }
}

/**
 * Gets the savings label for a billing cycle vs monthly.
 */
export function getBillingCycleSavingsLabel(cycle: string, monthlyPrice: number, cyclePrice: number): string | null {
  if (!monthlyPrice || monthlyPrice <= 0) return null;
  const months = cycle === 'QUARTERLY' ? 3 : cycle === 'YEARLY' ? 12 : (cycle === 'TWO_YEAR' || cycle === 'TWO_YEARS') ? 24 : 1;
  const equivalentMonthly = cyclePrice / months;
  const savingsPct = Math.round(((monthlyPrice - equivalentMonthly) / monthlyPrice) * 100);
  if (savingsPct > 0) return `Save ${savingsPct}%`;
  return null;
}

/**
 * Checks if a user's plan has expired and reverts to free if needed.
 * Should be called on authenticated API endpoints.
 * Returns the updated user object (or unchanged if no expiry happened).
 */
export async function checkAndExpirePlan(userId: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        planId: true,
        planExpiresAt: true,
        isLifetimePlan: true,
        domainPlanExpiry: true,
      }
    });

    if (!user) return;

    const now = new Date();

    // Check if domain plan has expired
    if (user.domainPlanExpiry && user.domainPlanExpiry < now) {
      // Revert domain-assigned plan to free
      const freePlan = await prisma.plan.findFirst({ where: { name: 'Free' } });
      await prisma.user.update({
        where: { id: userId },
        data: {
          planId: freePlan?.id || null,
          domainPlanExpiry: null,
          planExpiresAt: null,
          planBillingCycle: 'MONTHLY',
          isLifetimePlan: false,
        }
      });
      return;
    }

    // Skip expiry check for lifetime plans or free users (no planExpiresAt)
    if (!user.planId || user.isLifetimePlan || !user.planExpiresAt) return;

    // Check if subscription has expired
    if (user.planExpiresAt < now) {
      const freePlan = await prisma.plan.findFirst({ where: { name: 'Free' } });
      await prisma.user.update({
        where: { id: userId },
        data: {
          planId: freePlan?.id || null,
          planExpiresAt: null,
          planBillingCycle: 'MONTHLY',
          isLifetimePlan: false,
        }
      });
    }
  } catch (err) {
    // Non-fatal — log and continue
    console.error('[planExpiry] checkAndExpirePlan error:', err);
  }
}
