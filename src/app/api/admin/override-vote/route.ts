import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

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

    const oldAnswers = vote.answers;
    const pollId = vote.pollId;

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

    // WebSocket Live Update Broadcast (Real-Time Chart Sync on Override)
    if ((global as any).io) {
      const questions = await prisma.question.findMany({
        where: { pollId },
        include: { options: true },
      });
      const allVotes = await prisma.vote.findMany({
        where: { pollId },
      });

      const stats: Record<string, any> = {};
      questions.forEach((q) => {
        stats[q.id] = {};
        q.options.forEach((o) => {
          stats[q.id][o.id] = { text: o.text, count: 0 };
        });
      });

      allVotes.forEach((v) => {
        try {
          const ans = typeof v.answers === 'string' ? JSON.parse(v.answers) : v.answers;
          Object.keys(ans).forEach((qId) => {
            const val = ans[qId];
            const question = questions.find((q) => q.id === qId);

            if (question) {
              if (question.type === 'RANKED' && Array.isArray(val)) {
                const numOpts = question.options.length;
                val.forEach((optId: string, idx: number) => {
                  if (stats[qId] && stats[qId][optId]) {
                    stats[qId][optId].count += numOpts - idx;
                  }
                });
              } else if (question.type === 'SINGLE' && typeof val === 'string') {
                if (stats[qId] && stats[qId][val]) {
                  stats[qId][val].count += 1;
                }
              } else if (question.type === 'KNOCKOUT' && val && typeof val.winner === 'string') {
                if (stats[qId] && stats[qId][val.winner]) {
                  stats[qId][val.winner].count += 1;
                }
              }
            }
          });
        } catch (e) {
          console.error(e);
        }
      });

      (global as any).io.to(`poll-${pollId}`).emit('vote-cast', {
        stats,
        totalVotes: allVotes.length,
        newVote: {
          ipAddress: updatedVote.ipAddress,
          isp: updatedVote.isp,
          flaggedSuspicious: updatedVote.flaggedSuspicious,
          createdAt: updatedVote.createdAt,
        },
      });
    }

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
