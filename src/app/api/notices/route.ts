import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/jwt';

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  const refreshToken = cookieStore.get('refreshToken')?.value;

  let payload = token ? verifyAccessToken(token) : null;

  if (!payload && refreshToken) {
    const refreshPayload = verifyRefreshToken(refreshToken);
    if (refreshPayload) {
      payload = {
        userId: refreshPayload.userId,
        email: refreshPayload.email,
        role: refreshPayload.role,
      };
    }
  }

  if (!payload) return null;

  return prisma.user.findUnique({
    where: { id: payload.userId },
    include: { plan: true },
  });
}

export async function GET() {
  try {
    const user = await getAuthUser();
    const now = new Date();

    let targetTypes = ['ALL'];
    if (user) {
      targetTypes.push('REGISTERED');
      if (user.plan?.name) {
        targetTypes.push(user.plan.name); // e.g. "Free", "Elite"
      }
    }

    const notices = await prisma.notice.findMany({
      where: {
        publishedAt: { lte: now },
        targetType: { in: targetTypes }
      },
      include: {
        referencedNotice: true,
      },
      orderBy: { publishedAt: 'desc' },
    });

    return NextResponse.json({ success: true, notices });
  } catch (error: any) {
    console.error('Fetch User Notices Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
