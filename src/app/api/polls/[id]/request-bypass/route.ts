import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: pollId } = await params;
    const body = await req.json();
    const { email, voterId } = body;

    if (!email && !voterId) {
      return NextResponse.json({ error: 'Voter reference is required' }, { status: 400 });
    }

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
    });

    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    // Find the allowed voter for this poll and start a five-minute request window.
    const allowedVoter = await prisma.allowedVoter.findFirst({
      where: {
        pollId,
        ...(voterId ? { id: voterId } : { email: { equals: email.trim(), mode: 'insensitive' } }),
      },
    });

    if (!allowedVoter) {
      return NextResponse.json({ error: 'Voter not found in this poll' }, { status: 404 });
    }

    const requestExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.allowedVoter.update({
      where: { id: allowedVoter.id },
      data: { bypassRequested: true, bypassOtpUntil: requestExpiresAt },
    });

    return NextResponse.json({ success: true, message: 'Bypass request sent to creator.', requestExpiresAt });
  } catch (error: any) {
    console.error('Request Bypass API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
