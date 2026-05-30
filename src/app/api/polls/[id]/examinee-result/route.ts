import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/jwt';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-pollstar-2026-auth-access';

async function getAuthUserEmail() {
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
  return payload.email;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: pollId } = await params;
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const voterToken = searchParams.get('voterToken');

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        settings: true,
        questions: {
          include: { options: true }
        }
      }
    });

    if (!poll) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    if (poll.pollType !== 'EXAM') {
      return NextResponse.json({ error: 'This poll is not an examination' }, { status: 400 });
    }

    // Safeguard: Check if results are released or instant feedback is enabled
    const now = new Date();
    const isInstant = !!poll.settings?.enableInstantFeedback;
    const isHideUntilEnd = !!poll.settings?.hideResultsUntilEnd;
    const isReleasedSetting = !!poll.settings?.resultsReleased;

    let isReleased = false;
    if (isInstant) {
      isReleased = true;
    } else if (isHideUntilEnd) {
      isReleased = now > new Date(poll.endTime);
    } else {
      isReleased = isReleasedSetting;
    }

    if (!isReleased) {
      return NextResponse.json({
        success: false,
        resultsReleased: false,
        message: isHideUntilEnd 
          ? '🔒 Exam results are withheld until the examination period ends.'
          : '🔒 Exam results are currently withheld. The examiner has not released score reports yet.'
      }, { status: 200 });
    }

    // Authenticate candidate
    let voterEmail = email;
    let voterIdentifier = '';

    if (!voterEmail) {
      voterEmail = await getAuthUserEmail();
    }

    if (!voterEmail && voterToken) {
      try {
        const decoded = jwt.verify(voterToken, JWT_SECRET) as any;
        if (decoded.pollId === pollId) {
          voterEmail = decoded.email;
          voterIdentifier = decoded.identifier;
        }
      } catch (e) {
        console.error('Invalid voter token in examinee-result api:', e);
      }
    }

    if (!voterEmail) {
      return NextResponse.json({
        success: false,
        resultsReleased: true,
        requiresLogin: true,
        message: 'Authentication required. Please log in or identify your email address to access your graded analysis.'
      }, { status: 200 });
    }

    // Find the student's vote
    const vote = await prisma.vote.findFirst({
      where: {
        pollId,
        OR: [
          { email: { equals: voterEmail, mode: 'insensitive' } },
          { userIdentifier: { equals: voterEmail, mode: 'insensitive' } }
        ]
      }
    });

    if (!vote) {
      return NextResponse.json({
        success: false,
        resultsReleased: true,
        voted: false,
        message: 'No submission found for this examinee. You may have missed the examination.'
      }, { status: 200 });
    }

    // Parse the answers details
    let answersObj: any = {};
    try {
      answersObj = typeof vote.answers === 'string' ? JSON.parse(vote.answers) : vote.answers;
    } catch (e) {
      console.error(e);
    }

    const examBreakdown = answersObj?.__examBreakdown || {};
    const examScore = answersObj?.__examScore || { earned: 0.0, total: 0.0 };

    // Fetch all votes for this exam to calculate peer rank and class average
    const allVotes = await prisma.vote.findMany({
      where: { pollId },
      select: { answers: true }
    });

    const scoresList: number[] = [];
    allVotes.forEach((v) => {
      try {
        const parsedV = typeof v.answers === 'string' ? JSON.parse(v.answers) : v.answers;
        const score = parsedV?.__examScore;
        if (score) {
          scoresList.push(score.earned || 0.0);
        }
      } catch (e) {}
    });

    scoresList.sort((a, b) => b - a);

    const studentEarned = examScore.earned || 0.0;
    const peerRank = scoresList.indexOf(studentEarned) + 1;
    const totalSubmissions = scoresList.length;
    const classAverage = totalSubmissions > 0 
      ? Number((scoresList.reduce((acc, curr) => acc + curr, 0) / totalSubmissions).toFixed(2))
      : 0.0;

    // Format output with strict security (returning only this examinee's context)
    const resultDetails = {
      poll: {
        id: poll.id,
        title: poll.title,
        description: poll.description,
        startTime: poll.startTime,
        endTime: poll.endTime,
        settings: poll.settings,
      },
      examinee: {
        email: vote.email,
        identifier: vote.userIdentifier,
        ipAddress: vote.ipAddress,
        device: vote.device,
        flaggedSuspicious: vote.flaggedSuspicious,
        timeSpent: vote.timeSpent,
        createdAt: vote.createdAt,
        markingStatus: answersObj?.__markingStatus || 'FULLY_MARKED',
      },
      score: examScore,
      cohortStats: {
        peerRank,
        totalSubmissions,
        classAverage,
        highestScore: scoresList[0] || 0.0,
      },
      questions: poll.questions.map((q) => {
        const qb = examBreakdown[q.id] || {};
        return {
          id: q.id,
          questionText: q.questionText,
          type: q.type,
          marks: q.marks,
          options: q.options,
          correctAnswer: q.correctAnswer,
          correctAnswers: q.correctAnswers,
          candidateAnswer: qb.answer || null,
          marksAwarded: qb.marksAwarded ?? 0.0,
          feedback: qb.feedback || 'No feedback calculated.',
          isAIGraded: qb.isAIGraded ?? true,
        };
      })
    };

    return NextResponse.json({
      success: true,
      resultsReleased: true,
      voted: true,
      result: resultDetails
    });
  } catch (error: any) {
    console.error('Fetch examinee result API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
