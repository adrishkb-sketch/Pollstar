import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/jwt';

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  if (!token) return null;

  const payload = verifyAccessToken(token);
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

    let closedPolls;
    if (user.role === 'ADMIN') {
      closedPolls = await prisma.poll.findMany({
        where: { isOpenVoting: false },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          settings: {
            select: {
              identifierLabel: true,
              confirmer1Label: true,
              confirmer2Label: true,
            },
          },
          allowedVoters: {
            select: {
              identifier: true,
              confirmer1: true,
              confirmer2: true,
              email: true,
            },
          },
        },
      });
    } else {
      closedPolls = await prisma.poll.findMany({
        where: { creatorId: user.id, isOpenVoting: false },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          settings: {
            select: {
              identifierLabel: true,
              confirmer1Label: true,
              confirmer2Label: true,
            },
          },
          allowedVoters: {
            select: {
              identifier: true,
              confirmer1: true,
              confirmer2: true,
              email: true,
            },
          },
        },
      });
    }

    // Filter to only include polls that actually have allowed voters configured
    const templates = closedPolls.filter((p) => p.allowedVoters.length > 0);

    return NextResponse.json({ success: true, templates });
  } catch (error: any) {
    console.error('Fetch Voter Templates API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
