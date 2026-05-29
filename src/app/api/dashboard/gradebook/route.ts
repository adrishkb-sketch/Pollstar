import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/jwt';
import { checkFeatureAccess } from '@/lib/featureGate';

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

export async function GET(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const access = await checkFeatureAccess(user.id, 'teacherGradebook');
    if (!access.allowed) {
      return NextResponse.json({ 
        error: access.reason || 'Upgrade to premium to access the cumulative gradebook.' 
      }, { status: 403 });
    }

    // 1. Fetch all polls, surveys, and exams created by this user
    const polls = await prisma.poll.findMany({
      where: { creatorId: user.id },
      include: {
        settings: true,
        allowedVoters: true,
        votes: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (polls.length === 0) {
      return NextResponse.json({
        success: true,
        headers: [],
        rows: [],
      });
    }

    // Map of unique examinees/candidates by (email/phone/name) keys
    const studentMap = new Map<string, {
      name: string;
      email: string;
      phone: string;
      attempts: Record<string, {
        voteId?: string;
        pollId: string;
        pollTitle: string;
        pollType: string;
        scoreEarned?: number;
        scoreTotal?: number;
        voted: boolean;
        choices?: string;
      }>;
    }>();

    // Headers representing columns in our gradebook grid
    const columnsHeader = polls.map((p) => ({
      id: p.id,
      title: p.title,
      type: p.pollType, // POLL, SURVEY, EXAM
    }));

    // Populate registry of students
    polls.forEach((p) => {
      // 1. Register from AllowedVoters first (for closed invitations roster)
      p.allowedVoters.forEach((av) => {
        const key = (av.email || av.phone || av.confirmer1).trim().toLowerCase();
        if (!studentMap.has(key)) {
          studentMap.set(key, {
            name: av.confirmer1 || 'Anonymous Student',
            email: av.email || '',
            phone: av.phone || '',
            attempts: {},
          });
        }

        const student = studentMap.get(key)!;
        student.attempts[p.id] = {
          pollId: p.id,
          pollTitle: p.title,
          pollType: p.pollType,
          voted: false,
        };
      });

      // 2. Correlation from actual Votes (voted details)
      p.votes.forEach((v) => {
        const email = v.email || '';
        const name = v.userIdentifier || '';
        const key = (email || name).trim().toLowerCase();

        if (key) {
          if (!studentMap.has(key)) {
            studentMap.set(key, {
              name: name || 'Guest Student',
              email: email || '',
              phone: '',
              attempts: {},
            });
          }

          const student = studentMap.get(key)!;
          let scoreEarned: number | undefined;
          let scoreTotal: number | undefined;
          let choicesStr = '';

          try {
            const parsedAnswers = typeof v.answers === 'string' ? JSON.parse(v.answers) : v.answers;
            
            // Extract Exam Scores
            if (p.pollType === 'EXAM' && parsedAnswers?.__examScore) {
              scoreEarned = parsedAnswers.__examScore.earned ?? 0.0;
              scoreTotal = parsedAnswers.__examScore.total ?? 0.0;
            }

            // Group normal choices selections for tooltips
            const cleanAns = { ...parsedAnswers };
            delete cleanAns.__confidence;
            delete cleanAns.__examBreakdown;
            delete cleanAns.__examScore;
            choicesStr = Object.values(cleanAns).join(', ');

          } catch (e) {
            console.error(e);
          }

          student.attempts[p.id] = {
            voteId: v.id,
            pollId: p.id,
            pollTitle: p.title,
            pollType: p.pollType,
            voted: true,
            scoreEarned,
            scoreTotal,
            choices: choicesStr,
          };
        }
      });
    });

    // Format grid rows
    const rows = Array.from(studentMap.values()).map((student, idx) => {
      const rowData: Record<string, any> = {
        key: String(idx + 1),
        name: student.name,
        email: student.email || 'N/A',
        phone: student.phone || 'N/A',
      };

      columnsHeader.forEach((col) => {
        const attempt = student.attempts[col.id];
        if (attempt) {
          if (attempt.pollType === 'EXAM') {
            rowData[col.id] = attempt.voted && attempt.scoreEarned !== undefined
              ? {
                  voteId: attempt.voteId,
                  status: 'VOTED',
                  score: `${attempt.scoreEarned} / ${attempt.scoreTotal}`,
                  scoreEarned: attempt.scoreEarned,
                  scoreTotal: attempt.scoreTotal,
                }
              : { status: 'ABSENT', score: '-' };
          } else {
            rowData[col.id] = attempt.voted
              ? { status: 'VOTED', score: 'Voted', tooltip: attempt.choices }
              : { status: 'PENDING', score: '-' };
          }
        } else {
          rowData[col.id] = { status: 'NONE', score: '-' };
        }
      });

      return rowData;
    });

    return NextResponse.json({
      success: true,
      headers: columnsHeader,
      rows,
    });
  } catch (error: any) {
    console.error('Cumulative Gradebook API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
