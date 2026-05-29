import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/jwt';

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  let payload = token ? verifyAccessToken(token) : null;

  if (!payload) {
    const refreshToken = cookieStore.get('refreshToken')?.value;
    if (refreshToken) {
      payload = verifyRefreshToken(refreshToken);
    }
  }

  if (!payload) return null;

  return prisma.user.findUnique({
    where: { id: payload.userId },
  });
}

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invoices = await prisma.invoice.findMany({
      where: { userId: user.id },
      include: {
        plan: {
          select: { name: true, badgeColor: true, currency: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, invoices });
  } catch (error: any) {
    console.error('Fetch Invoices Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
