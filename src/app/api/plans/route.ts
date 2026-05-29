import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const ADDON_TYPES = ['ADDON', 'POLL_PACK', 'SURVEY_PACK', 'EXAM_PACK', 'COMBO_PACK'];

export async function GET() {
  try {
    const allPlans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' }
    });

    // 1. Subscription plans (Recurring access to all features)
    const plans = allPlans.filter(p => p.planType === 'SUBSCRIPTION');
    
    // 2. Individual Entity Packs (credit packages like polls-only, surveys-only, combos)
    const entityPlans = allPlans.filter(p => ['POLL_PACK', 'SURVEY_PACK', 'EXAM_PACK', 'COMBO_PACK'].includes(p.planType));
    
    // 3. Premium Advanced Add-Ons
    const addonPlans = allPlans.filter(p => p.planType === 'ADDON');

    return NextResponse.json({ 
      success: true, 
      plans, 
      entityPlans, 
      addonPlans 
    });
  } catch (error: any) {
    console.error('Fetch Plans Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
