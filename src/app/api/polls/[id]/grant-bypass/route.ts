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
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: pollId } = await params;
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
    });

    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    // Only creator or admin can grant bypass
    if (poll.creatorId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { voterId } = await req.json();

    if (!voterId) {
      return NextResponse.json({ error: 'voterId is required' }, { status: 400 });
    }

    const voter = await prisma.allowedVoter.findFirst({
      where: { id: voterId, pollId },
    });

    if (!voter) {
      return NextResponse.json({ error: 'Voter not found in this poll' }, { status: 404 });
    }

    // Set bypass to exactly 30 seconds from now
    const bypassOtpUntil = new Date(Date.now() + 30000);

    await prisma.allowedVoter.update({
      where: { id: voter.id },
      data: { bypassOtpUntil, bypassRequested: false },
    });

    return NextResponse.json({ success: true, message: '30s bypass granted', bypassOtpUntil });
  } catch (error: any) {
    console.error('Grant Bypass API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
