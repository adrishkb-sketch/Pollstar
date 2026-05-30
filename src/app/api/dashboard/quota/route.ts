import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/jwt';
import { checkAndExpirePlan } from '@/lib/planExpiry';

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  const refreshToken = cookieStore.get('refreshToken')?.value;

  let payload = token ? verifyAccessToken(token) : null;
  if (!payload && refreshToken) {
    const rp = verifyRefreshToken(refreshToken);
    if (rp) payload = { userId: rp.userId, email: rp.email, role: rp.role };
  }
  if (!payload) return null;

  // Run a robust check/expiry check on access
  await checkAndExpirePlan(payload.userId);

  return prisma.user.findUnique({
    where: { id: payload.userId },
    include: { plan: true },
  });
}

/**
 * Returns the full quota picture for the authenticated user:
 *   subscription: { limitPolls, limitSurveys, limitExams, usedPolls, usedSurveys, usedExams, cycleStart, cycleEnd }
 *   packs:        { allowedPolls, allowedSurveys, allowedExams, usedPolls, usedSurveys, usedExams }
 *   total:        { allowedPolls, allowedSurveys, allowedExams, usedPolls, usedSurveys, usedExams }
 */
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const plan = user.plan;
    const isFreePlan = !plan || plan.name.toLowerCase() === 'free';

    // ── 1. Subscription quota ────────────────────────────────────────────────
    // Determine billing cycle window
    let cycleStart: Date;
    let cycleEnd: Date;

    if (isFreePlan || !user.planExpiresAt) {
      // Free plan resets monthly on signup anniversary
      const now = new Date();
      const ann = new Date(user.createdAt);
      ann.setFullYear(now.getFullYear());
      ann.setMonth(now.getMonth());
      if (ann > now) ann.setMonth(ann.getMonth() - 1);
      cycleStart = ann;
      cycleEnd = new Date(ann);
      cycleEnd.setMonth(cycleEnd.getMonth() + 1);
    } else {
      const expEnd = new Date(user.planExpiresAt);
      const expStart = new Date(user.planExpiresAt);
      const cycle = (user.planBillingCycle || 'MONTHLY').toUpperCase();
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
      const cycle = user.planBillingCycle || 'MONTHLY';
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
    // Fetch all addon invoices for the user with their plan details
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

    const now = new Date();

    for (const inv of addonInvoices) {
      const p = inv.plan;
      if (!p) continue;

      // Check if this pack is still valid
      const isValid = !inv.planExpiresAt || new Date(inv.planExpiresAt) > now;
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
    // We use Math.max(active, deleted) so that deleting a creation doesn't
    // reset/bypass the quota – the higher of the two counts wins.
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

    // Fetch deletion-history ledger for the dashboard "Deleted Items" panel
    const deletedPollsList = await prisma.deletedPoll.findMany({
      where: { creatorId: user.id },
      orderBy: { deletedAt: 'desc' },
      take: 100,
    });

    // ── 3. Build combined totals ─────────────────────────────────────────────
    const adjustedPackUsedPolls = Math.max(0, allTimePolls - expiredCapacityPolls);
    const adjustedPackUsedSurveys = Math.max(0, allTimeSurveys - expiredCapacitySurveys);
    const adjustedPackUsedExams = Math.max(0, allTimeExams - expiredCapacityExams);

    // For subscription-based plans: cycle limits + active pack add-ons
    // For pack plans (individual/combo): just active pack quota
    const totalAllowedPolls = isSubBased
      ? (subLimitPolls === -1 ? -1 : subLimitPolls + packAllowedPolls)
      : packAllowedPolls;
    const totalAllowedSurveys = isSubBased
      ? (subLimitSurveys === -1 ? -1 : subLimitSurveys + packAllowedSurveys)
      : packAllowedSurveys;
    const totalAllowedExams = isSubBased
      ? (subLimitExams === -1 ? -1 : subLimitExams + packAllowedExams)
      : packAllowedExams;

    // Used counts: subscription cycle count + active pack used count
    const totalUsedPolls = isSubBased ? subUsedPolls + adjustedPackUsedPolls : adjustedPackUsedPolls;
    const totalUsedSurveys = isSubBased ? subUsedSurveys + adjustedPackUsedSurveys : adjustedPackUsedSurveys;
    const totalUsedExams = isSubBased ? subUsedExams + adjustedPackUsedExams : adjustedPackUsedExams;

    return NextResponse.json({
      success: true,
      planType,
      isSubBased,
      subscription: {
        limitPolls: subLimitPolls,
        limitSurveys: subLimitSurveys,
        limitExams: subLimitExams,
        usedPolls: subUsedPolls,
        usedSurveys: subUsedSurveys,
        usedExams: subUsedExams,
        cycleStart: cycleStart.toISOString(),
        cycleEnd: cycleEnd.toISOString(),
      },
      packs: {
        allowedPolls: packAllowedPolls,
        allowedSurveys: packAllowedSurveys,
        allowedExams: packAllowedExams,
        usedPolls: adjustedPackUsedPolls,
        usedSurveys: adjustedPackUsedSurveys,
        usedExams: adjustedPackUsedExams,
      },
      total: {
        allowedPolls: totalAllowedPolls,
        allowedSurveys: totalAllowedSurveys,
        allowedExams: totalAllowedExams,
        usedPolls: totalUsedPolls,
        usedSurveys: totalUsedSurveys,
        usedExams: totalUsedExams,
      },
      deletedItems: deletedPollsList,
    });
  } catch (err: any) {
    console.error('Quota API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
