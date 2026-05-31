import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/jwt';
import { checkFeatureAccess } from '@/lib/featureGate';
import { checkAndExpirePlan } from '@/lib/planExpiry';

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

  await checkAndExpirePlan(payload.userId);

  return prisma.user.findUnique({
    where: { id: payload.userId },
    include: { plan: true },
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
        isLocked?: boolean;
      }>;
    }>();

    // Headers representing columns in our gradebook grid
    const columnsHeader = polls.map((p) => ({
      id: p.id,
      title: p.title,
      type: p.pollType, // POLL, SURVEY, EXAM
    }));

    // Fetch user addon invoices for participant limit lookup
    const addonInvoices = await prisma.invoice.findMany({
      where: { userId: user.id, isAddon: true, paymentStatus: 'COMPLETED' },
      include: { plan: true },
    });
    const invoicePlanMap = new Map<string, any>();
    addonInvoices.forEach(inv => {
      if (inv.plan) invoicePlanMap.set(inv.id, inv.plan);
    });
    const creatorPlan = user.plan;
    let anyExceeded = false;

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

      // 2. Correlation from actual Votes (voted details) with participant limits
      let participantLimit = 5000;
      if (p.invoiceId) {
        const plan = invoicePlanMap.get(p.invoiceId);
        if (plan) {
          const limitVal = p.pollType === 'SURVEY' 
            ? plan.maxParticipantsSurvey 
            : p.pollType === 'EXAM' 
              ? plan.maxParticipantsExam 
              : plan.maxParticipantsPoll;
          if (limitVal !== null && limitVal !== undefined && limitVal !== -1) {
            participantLimit = limitVal;
          }
        }
      } else if (creatorPlan) {
        let limit = p.pollType === 'SURVEY' 
          ? creatorPlan.maxParticipantsSurvey 
          : p.pollType === 'EXAM' 
            ? creatorPlan.maxParticipantsExam 
            : creatorPlan.maxParticipantsPoll;

        if (creatorPlan.durations && user.planBillingCycle) {
          const durs = creatorPlan.durations as any;
          const cycle = user.planBillingCycle;
          if (durs[cycle] && durs[cycle].enabled) {
            const cfg = durs[cycle];
            if (p.pollType === 'POLL' && cfg.maxParticipantsPoll) limit = parseInt(cfg.maxParticipantsPoll);
            if (p.pollType === 'SURVEY' && cfg.maxParticipantsSurvey) limit = parseInt(cfg.maxParticipantsSurvey);
            if (p.pollType === 'EXAM' && cfg.maxParticipantsExam) limit = parseInt(cfg.maxParticipantsExam);
          }
        }
        if (limit !== null && limit !== undefined && limit !== -1) {
          participantLimit = limit;
        }
      }

      // Sort votes chronologically and slice
      const sortedVotes = [...p.votes].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const allowedVoteIds = new Set(sortedVotes.slice(0, participantLimit).map(v => v.id));
      if (sortedVotes.length > participantLimit) {
        anyExceeded = true;
      }

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
          
          if (!allowedVoteIds.has(v.id)) {
            // This vote is locked/truncated under participant limits
            student.attempts[p.id] = {
              voteId: v.id,
              pollId: p.id,
              pollTitle: p.title,
              pollType: p.pollType,
              voted: true,
              isLocked: true,
            };
            return;
          }

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
            isLocked: false,
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
          if (attempt.isLocked) {
            rowData[col.id] = { status: 'LOCKED', score: '🔒 Locked (Upgrade)' };
          } else if (attempt.pollType === 'EXAM') {
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

    // Calculate enabled types based on plans and active pack addon invoices
    const enabledTypes = new Set<string>();
    if (user.role === 'ADMIN') {
      enabledTypes.add('POLL');
      enabledTypes.add('SURVEY');
      enabledTypes.add('EXAM');
    } else {
      const now = new Date();
      const plan = user.plan;
      if (plan) {
        const isPack = ['POLL_PACK', 'SURVEY_PACK', 'EXAM_PACK', 'COMBO_PACK', 'ADDON'].includes(plan.planType);
        if (isPack) {
          if (plan.planType === 'POLL_PACK') enabledTypes.add('POLL');
          else if (plan.planType === 'SURVEY_PACK') enabledTypes.add('SURVEY');
          else if (plan.planType === 'EXAM_PACK') enabledTypes.add('EXAM');
          else if (plan.planType === 'COMBO_PACK') {
            const comboTypes: string[] = Array.isArray(plan.comboTypes) ? (plan.comboTypes as string[]) : [];
            comboTypes.forEach(t => enabledTypes.add(t));
          } else if (plan.planType === 'ADDON') {
            if (plan.maxPolls && plan.maxPolls > 0) enabledTypes.add('POLL');
            if (plan.maxSurveys && plan.maxSurveys > 0) enabledTypes.add('SURVEY');
            if (plan.maxExams && plan.maxExams > 0) enabledTypes.add('EXAM');
          }
        } else {
          let subLimitPolls: number = plan.name.toLowerCase() === 'free' ? 3 : (plan.maxPolls ?? -1);
          let subLimitSurveys: number = plan.name.toLowerCase() === 'free' ? 3 : (plan.maxSurveys ?? -1);
          let subLimitExams: number = plan.name.toLowerCase() === 'free' ? 3 : (plan.maxExams ?? -1);

          if (plan.durations && plan.name.toLowerCase() !== 'free') {
            const durs = plan.durations as any;
            const cycle = user.planBillingCycle || 'MONTHLY';
            if (durs[cycle] && durs[cycle].enabled) {
              const cfg = durs[cycle];
              if (cfg.maxPolls !== undefined && cfg.maxPolls !== '') subLimitPolls = parseInt(cfg.maxPolls);
              if (cfg.maxSurveys !== undefined && cfg.maxSurveys !== '') subLimitSurveys = parseInt(cfg.maxSurveys);
              if (cfg.maxExams !== undefined && cfg.maxExams !== '') subLimitExams = parseInt(cfg.maxExams);
            }
          }

          if (subLimitPolls !== 0) enabledTypes.add('POLL');
          if (subLimitSurveys !== 0) enabledTypes.add('SURVEY');
          if (subLimitExams !== 0) enabledTypes.add('EXAM');
        }
      }

      // Add addon invoices (already fetched at top, reuse)
      for (const inv of addonInvoices) {
        const p = inv.plan;
        if (!p) continue;
        const isValid = !inv.planExpiresAt || new Date(inv.planExpiresAt) > now;
        if (!isValid) continue;

        switch (p.planType) {
          case 'POLL_PACK':
            enabledTypes.add('POLL');
            break;
          case 'SURVEY_PACK':
            enabledTypes.add('SURVEY');
            break;
          case 'EXAM_PACK':
            enabledTypes.add('EXAM');
            break;
          case 'COMBO_PACK': {
            const types: string[] = Array.isArray(p.comboTypes) ? (p.comboTypes as string[]) : [];
            types.forEach(t => enabledTypes.add(t));
            break;
          }
          case 'ADDON': {
            if (p.maxPolls && p.maxPolls > 0) enabledTypes.add('POLL');
            if (p.maxSurveys && p.maxSurveys > 0) enabledTypes.add('SURVEY');
            if (p.maxExams && p.maxExams > 0) enabledTypes.add('EXAM');
            break;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      headers: columnsHeader,
      rows,
      enabledTypes: Array.from(enabledTypes),
      hasExceededLimit: anyExceeded,
    });
  } catch (error: any) {
    console.error('Cumulative Gradebook API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
