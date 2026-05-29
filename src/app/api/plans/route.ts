import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const ADDON_TYPES = ['ADDON', 'POLL_PACK', 'SURVEY_PACK', 'EXAM_PACK', 'COMBO_PACK'];

export async function GET() {
  try {
    const allPlans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' }
    });

    // Separate subscription plans from add-on packs
    const plans = allPlans.filter(p => !ADDON_TYPES.includes(p.planType));
    const addonPlans = allPlans.filter(p => ADDON_TYPES.includes(p.planType));

    return NextResponse.json({ success: true, plans, addonPlans });
  } catch (error: any) {
    console.error('Fetch Plans Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
