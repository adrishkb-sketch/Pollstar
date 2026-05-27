import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/jwt';

// Helper to authenticate user from cookies
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

/**
 * GET: Retrieve messages for a poll.
 * If authenticated creator, can supply ?voterIdentifier to get a thread, or none to get all threads.
 * If voter, must supply ?voterIdentifier to get their thread.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: pollId } = await params;
    const { searchParams } = new URL(req.url);
    const voterIdentifier = searchParams.get('voterIdentifier');

    const user = await getAuthUser();
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
    });

    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    const isCreator = user && (poll.creatorId === user.id || user.role === 'ADMIN');

    if (isCreator) {
      if (voterIdentifier) {
        // Retrieve thread with specific voter
        const messages = await prisma.directMessage.findMany({
          where: { pollId, senderIdentifier: voterIdentifier },
          orderBy: { createdAt: 'asc' },
        });
        return NextResponse.json({ success: true, messages });
      } else {
        // Retrieve all messages for creator to group by thread
        const messages = await prisma.directMessage.findMany({
          where: { pollId },
          orderBy: { createdAt: 'asc' },
        });
        return NextResponse.json({ success: true, messages });
      }
    } else {
      // Must supply voterIdentifier to see own thread
      if (!voterIdentifier) {
        return NextResponse.json({ error: 'Voter identifier is required' }, { status: 400 });
      }

      const messages = await prisma.directMessage.findMany({
        where: { pollId, senderIdentifier: voterIdentifier },
        orderBy: { createdAt: 'asc' },
      });

      return NextResponse.json({ success: true, messages });
    }
  } catch (error: any) {
    console.error('GET Messages Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST: Send a message.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: pollId } = await params;
    const { text, voterIdentifier, isFromCreator } = await req.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
    }
    if (!voterIdentifier || !voterIdentifier.trim()) {
      return NextResponse.json({ error: 'Voter identifier is required' }, { status: 400 });
    }

    const user = await getAuthUser();
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
    });

    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    if (isFromCreator) {
      // Verify creator authentication
      if (!user || (poll.creatorId !== user.id && user.role !== 'ADMIN')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const newMessage = await prisma.directMessage.create({
      data: {
        pollId,
        senderIdentifier: voterIdentifier.trim(),
        text: text.trim(),
        isFromCreator: !!isFromCreator,
      },
    });

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error: any) {
    console.error('POST Message Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
