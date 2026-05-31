import prisma from '@/lib/prisma';

/**
 * Calculates the dynamic participant limit for a given poll/survey/exam creator,
 * summing up the base subscription plan limit and any active, completed add-on boosts.
 */
export async function getDynamicParticipantLimit(creatorId: string, pollType: string): Promise<number> {
  const targetType = pollType === 'SURVEY' ? 'SURVEY' : pollType === 'EXAM' ? 'EXAM' : 'POLL';

  const creator = await prisma.user.findUnique({
    where: { id: creatorId },
    include: { plan: true }
  });

  let baseLimit = 5000; // default backup

  if (creator) {
    let plan = creator.plan;
    if (!plan) {
      plan = await prisma.plan.findFirst({
        where: { OR: [{ isFree: true }, { name: { equals: 'Free', mode: 'insensitive' } }] }
      });
    }

    if (plan) {
      let limit = targetType === 'SURVEY'
        ? plan.maxParticipantsSurvey
        : targetType === 'EXAM'
          ? plan.maxParticipantsExam
          : plan.maxParticipantsPoll;

      // Check for duration configurations
      if (plan.durations && creator.planBillingCycle) {
        const durs = plan.durations as any;
        const cycle = creator.planBillingCycle;
        if (durs[cycle] && durs[cycle].enabled) {
          const cfg = durs[cycle];
          if (targetType === 'POLL' && cfg.maxParticipantsPoll) limit = parseInt(cfg.maxParticipantsPoll);
          if (targetType === 'SURVEY' && cfg.maxParticipantsSurvey) limit = parseInt(cfg.maxParticipantsSurvey);
          if (targetType === 'EXAM' && cfg.maxParticipantsExam) limit = parseInt(cfg.maxParticipantsExam);
        }
      }

      if (limit !== null && limit !== undefined && limit !== -1) {
        baseLimit = limit;
      }
    }
  }

  // Sum up active completed add-on packs' participant limits
  const now = new Date();
  const addonInvoices = await prisma.invoice.findMany({
    where: {
      userId: creatorId,
      isAddon: true,
      paymentStatus: 'COMPLETED',
      OR: [
        { planExpiresAt: null },
        { planExpiresAt: { gte: now } }
      ]
    },
    include: { plan: true }
  });

  let boostLimit = 0;
  for (const inv of addonInvoices) {
    if (inv.plan) {
      const p = inv.plan;
      let matchesCategory = false;
      if (p.planType === 'POLL_PACK' && targetType === 'POLL') matchesCategory = true;
      else if (p.planType === 'SURVEY_PACK' && targetType === 'SURVEY') matchesCategory = true;
      else if (p.planType === 'EXAM_PACK' && targetType === 'EXAM') matchesCategory = true;
      else if (p.planType === 'COMBO_PACK') {
        const types = Array.isArray(p.comboTypes) ? (p.comboTypes as string[]) : [];
        if (types.includes(targetType)) matchesCategory = true;
      } else if (p.planType === 'ADDON') {
        matchesCategory = true;
      }

      if (matchesCategory) {
        const val = targetType === 'SURVEY'
          ? p.maxParticipantsSurvey
          : targetType === 'EXAM'
            ? p.maxParticipantsExam
            : p.maxParticipantsPoll;
        
        if (val !== null && val !== undefined && val > 0) {
          boostLimit += val;
        }
      }
    }
  }

  return baseLimit + boostLimit;
}
