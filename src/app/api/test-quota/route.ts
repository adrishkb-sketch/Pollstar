import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: { plan: true },
      take: 5
    });

    const plans = await prisma.plan.findMany();

    const invoices = await prisma.invoice.findMany({
      include: { plan: true },
      take: 10
    });

    return NextResponse.json({
      success: true,
      users,
      plans,
      invoices
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
