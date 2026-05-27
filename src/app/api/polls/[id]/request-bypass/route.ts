import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: pollId } = await params;
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
    });

    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    // Find the allowed voter for this poll and email
    const allowedVoter = await prisma.allowedVoter.findFirst({
      where: {
        pollId,
        email: { equals: email.trim(), mode: 'insensitive' },
      },
    });

    if (!allowedVoter) {
      return NextResponse.json({ error: 'Voter not found in this poll' }, { status: 404 });
    }

    // Set bypassRequested to true
    await prisma.allowedVoter.update({
      where: { id: allowedVoter.id },
      data: { bypassRequested: true },
    });

    return NextResponse.json({ success: true, message: 'Bypass request sent to creator.' });
  } catch (error: any) {
    console.error('Request Bypass API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
