import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/jwt';

async function getAuthAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  let payload = token ? verifyAccessToken(token) : null;

  if (!payload) {
    const refreshToken = cookieStore.get('refreshToken')?.value;
    if (refreshToken) {
      payload = verifyRefreshToken(refreshToken);
    }
  }

  if (!payload || payload.role !== 'ADMIN') return null;

  return prisma.user.findUnique({
    where: { id: payload.userId },
  });
}

export async function POST() {
  try {
    const admin = await getAuthAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the Elite plan
    const elitePlan = await prisma.plan.findFirst({
      where: { name: { equals: 'Elite', mode: 'insensitive' } }
    });

    if (!elitePlan) {
      return NextResponse.json({ error: 'Elite plan not found in database' }, { status: 404 });
    }

    // Update all users who currently have the Elite plan
    const updateResult = await prisma.user.updateMany({
      where: { planId: elitePlan.id },
      data: {
        isLifetimePlan: true,
        planExpiresAt: null
      }
    });

    // Create an audit log
    await prisma.auditLog.create({
      data: {
        action: 'MIGRATE_ELITE_LIFETIME',
        adminId: admin.id,
        details: `Migrated ${updateResult.count} Elite plan users to Lifetime status.`
      }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${updateResult.count} Elite plan users to Lifetime status!`,
      count: updateResult.count
    });
  } catch (error: any) {
    console.error('Migrate Elite Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
