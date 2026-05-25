import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

async function getAuthAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  if (!token) return null;

  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== 'ADMIN') return null;

  return prisma.user.findUnique({
    where: { id: payload.userId },
  });
}

/**
 * GET: Lists all polls, options, and votes for admin auditing.
 */
export async function GET() {
  try {
    const admin = await getAuthAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const polls = await prisma.poll.findMany({
      include: {
        creator: { select: { email: true } },
        questions: {
          include: { options: true }
        },
        votes: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, polls });
  } catch (error: any) {
    console.error('Admin Fetch Polls Audit API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * PATCH: Admin overrides a closed/closed-type ballot answer.
 */
export async function PATCH(req: Request) {
  try {
    const admin = await getAuthAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { voteId, newAnswers } = await req.json();

    if (!voteId || !newAnswers) {
      return NextResponse.json({ error: 'Vote ID and newAnswers are required' }, { status: 400 });
    }

    const vote = await prisma.vote.findUnique({
      where: { id: voteId },
      include: { poll: true }
    });

    if (!vote) {
      return NextResponse.json({ error: 'Vote record not found' }, { status: 404 });
    }

    // Verify if the poll is closed or is a closed (non-open) voting type poll
    const isPollClosed = vote.poll.status === 'ENDED' || !vote.poll.isOpenVoting;
    if (!isPollClosed) {
      return NextResponse.json({ 
        error: 'Vote Override Restricted: Admin can only override votes for closed polls or closed-type authenticated polls.' 
      }, { status: 400 });
    }

    const oldAnswers = vote.answers;

    // Persist overridden answers
    const updatedVote = await prisma.vote.update({
      where: { id: voteId },
      data: {
        answers: JSON.stringify(newAnswers),
      },
    });

    // Write audit log entry
    await prisma.auditLog.create({
      data: {
        action: 'OVERRIDE_VOTE',
        adminId: admin.id,
        details: `Overridden vote ID: ${voteId} (Voter: ${vote.userIdentifier}, Poll: ${vote.poll.title}). Old Answers: ${oldAnswers} -> New Answers: ${JSON.stringify(newAnswers)}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Ballot successfully overridden by Admin.',
      vote: updatedVote,
    });
  } catch (error: any) {
    console.error('Admin Vote Override API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
