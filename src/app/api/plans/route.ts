import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkAndCleanExpiredPlanOffers } from '@/lib/planExpiry';

export async function GET() {
  try {
    await checkAndCleanExpiredPlanOffers();

    const allPlans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' }
    });

    // 1. Subscription plans — ordered by rank ascending (Free first, then tiers)
    const plans = allPlans
      .filter(p => p.planType === 'SUBSCRIPTION')
      .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));

    // 2. Audience / Add-On packs — ordered by addonRank ascending
    const addonPlans = allPlans
      .filter(p => p.planType === 'ADDON')
      .sort((a, b) => ((a as any).addonRank ?? 0) - ((b as any).addonRank ?? 0));

    return NextResponse.json({
      success: true,
      plans,
      addonPlans,
    });
  } catch (error: any) {
    console.error('Fetch Plans Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
