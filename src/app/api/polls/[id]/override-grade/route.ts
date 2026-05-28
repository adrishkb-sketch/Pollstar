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
 * POST: Manually overrides the score and feedback for a specific examinee's question.
 */
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

    // Only creator or admin can grade
    if (poll.creatorId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { voteId, questionId, marksAwarded, feedback } = await req.json();

    if (!voteId || !questionId || typeof marksAwarded !== 'number') {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Find the Vote
    const vote = await prisma.vote.findUnique({
      where: { id: voteId },
    });

    if (!vote || vote.pollId !== pollId) {
      return NextResponse.json({ error: 'Vote not found' }, { status: 404 });
    }

    // Parse the current answers object
    let answersObj: any = {};
    try {
      answersObj = typeof vote.answers === 'string' ? JSON.parse(vote.answers) : vote.answers;
    } catch (e) {
      console.error('Failed to parse vote answers:', e);
      answersObj = {};
    }

    if (!answersObj.__examBreakdown) {
      answersObj.__examBreakdown = {};
    }

    if (questionId === 'TOTAL') {
      if ((marksAwarded * 2) % 1 !== 0) {
        return NextResponse.json({ error: 'Marks must be in multiples of 0.5 points' }, { status: 400 });
      }

      if (!answersObj.__examScore) {
        answersObj.__examScore = { earned: 0.0, total: 10.0 };
      }
      
      if (marksAwarded < 0 || marksAwarded > (answersObj.__examScore.total || 100.0)) {
        return NextResponse.json({ error: `Marks awarded must be between 0 and ${answersObj.__examScore.total || 100.0}` }, { status: 400 });
      }

      answersObj.__examScore.earned = marksAwarded;

      const updatedVote = await prisma.vote.update({
        where: { id: voteId },
        data: {
          answers: JSON.stringify(answersObj),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Final total score successfully overridden.',
        vote: {
          id: updatedVote.id,
          answers: answersObj,
        },
      });
    }

    // Retrieve question to get maxMarks
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const maxMarks = question.marks || 0.0;

    // Validate marks bounds
    if (marksAwarded < 0 || marksAwarded > maxMarks) {
      return NextResponse.json({ error: `Marks awarded must be between 0 and the maximum of ${maxMarks} marks` }, { status: 400 });
    }

    // Check 0.5 increments
    if ((marksAwarded * 2) % 1 !== 0) {
      return NextResponse.json({ error: 'Marks must be in multiples of 0.5 points' }, { status: 400 });
    }

    // Update the question's breakdown
    const currentQBreakdown = answersObj.__examBreakdown[questionId] || {};
    answersObj.__examBreakdown[questionId] = {
      ...currentQBreakdown,
      marksAwarded,
      maxMarks,
      feedback: feedback || currentQBreakdown.feedback || 'Manually graded by examiner.',
      isAIGraded: false,
      isOverridden: true,
    };

    // Recalculate total score
    let totalEarned = 0.0;
    let totalMax = 0.0;

    Object.keys(answersObj.__examBreakdown).forEach((qId) => {
      const qb = answersObj.__examBreakdown[qId];
      if (qb) {
        totalEarned += qb.marksAwarded || 0.0;
        totalMax += qb.maxMarks || 0.0;
      }
    });

    answersObj.__examScore = {
      earned: totalEarned,
      total: totalMax,
    };

    // Save updated vote
    const updatedVote = await prisma.vote.update({
      where: { id: voteId },
      data: {
        answers: JSON.stringify(answersObj),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Grade successfully overridden and saved.',
      vote: {
        id: updatedVote.id,
        answers: answersObj,
      },
    });
  } catch (error: any) {
    console.error('Override Grade API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
