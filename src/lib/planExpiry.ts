/**
 * planExpiry.ts
 * Shared helper to check if a user's subscription plan has expired
 * and auto-revert them to the default free plan if so.
 */
import prisma from '@/lib/prisma';
import { getCache, setCache } from '@/lib/serverCache';


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
 * Returns true if a plan revert happened (caller should re-fetch user), false otherwise.
 */
export async function checkAndExpirePlan(userId: string): Promise<boolean> {
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

    if (!user) return false;

    const now = new Date();

    // Check if domain plan has expired
    if (user.domainPlanExpiry && user.domainPlanExpiry < now) {
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
      return true;
    }

    // Skip expiry check for lifetime plans or free users (no planExpiresAt)
    if (!user.planId || user.isLifetimePlan || !user.planExpiresAt) return false;

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
      return true;
    }

    return false;
  } catch (err) {
    console.error('[planExpiry] checkAndExpirePlan error:', err);
    return false;
  }
}




/**
 * Scans all plans in the database to see if any active base-level or duration-specific
 * offers have expired. If an offer has expired (offerEndDate is in the past),
 * reverts its price to originalPrice and clears the originalPrice and offerEndDate.
 */
export async function checkAndCleanExpiredPlanOffers(): Promise<void> {
  // Throttle: run at most once every 5 minutes server-wide
  const CACHE_KEY = 'plan_offer_cleanup_ran';
  const TTL_MS = 5 * 60 * 1000; // 5 minutes
  if (getCache(CACHE_KEY)) return;
  setCache(CACHE_KEY, true, TTL_MS);

  try {
    const plans = await prisma.plan.findMany();
    const now = new Date();


    for (const plan of plans) {
      let changed = false;
      let updatedPrice = plan.price;
      let updatedOriginalPrice = plan.originalPrice;
      let updatedOfferEndDate = plan.offerEndDate;
      let updatedDurations = plan.durations;

      // 1. Check base plan level offer expiration
      if (plan.offerEndDate && new Date(plan.offerEndDate) < now) {
        if (plan.originalPrice && plan.originalPrice > 0) {
          updatedPrice = plan.originalPrice;
        }
        updatedOriginalPrice = 0.0;
        updatedOfferEndDate = null;
        changed = true;
      }

      // 2. Check durations pricing matrix offer expirations
      if (plan.durations && typeof plan.durations === 'object') {
        const durs = JSON.parse(JSON.stringify(plan.durations));
        let dursChanged = false;
        
        for (const key of Object.keys(durs)) {
          const config = durs[key];
          if (config && config.enabled && config.offerEndDate) {
            const dateVal = new Date(config.offerEndDate);
            if (!isNaN(dateVal.getTime()) && dateVal < now) {
              // Expiry occurred! Revert price to originalPrice
              const origVal = parseFloat(config.originalPrice || '0');
              if (origVal > 0) {
                config.price = origVal.toFixed(2);
              }
              config.originalPrice = '';
              config.offerEndDate = '';
              dursChanged = true;
            }
          }
        }
        
        if (dursChanged) {
          updatedDurations = durs;
          changed = true;
        }
      }

      if (changed) {
        const updateData: any = {
          price: updatedPrice,
          originalPrice: updatedOriginalPrice,
          offerEndDate: updatedOfferEndDate,
        };
        // Only include durations if they were actually modified
        if (updatedDurations !== plan.durations) {
          updateData.durations = updatedDurations;
        }
        await prisma.plan.update({
          where: { id: plan.id },
          data: updateData,
        });
        console.log(`[planExpiry] Reverted expired offer for plan: ${plan.name}`);
      }

    }
  } catch (err) {
    console.error('[planExpiry] checkAndCleanExpiredPlanOffers error:', err);
  }
}

