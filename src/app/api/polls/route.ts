import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/jwt';
import { sendPollInvitationEmail } from '@/lib/nodemailer';

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
 * GET: Lists all polls created by the authenticated user.
 * If user is ADMIN, lists ALL polls.
 */
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let polls;
    if (user.role === 'ADMIN') {
      polls = await prisma.poll.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          creator: { select: { email: true } },
          questions: { include: { options: true } },
          votes: true,
          settings: true,
        },
      });
    } else {
      polls = await prisma.poll.findMany({
        where: { creatorId: user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          questions: { include: { options: true } },
          votes: true,
          settings: true,
        },
      });
    }

    return NextResponse.json({ success: true, polls });
  } catch (error: any) {
    console.error('List Polls API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST: Creates a new poll including questions, options, settings, and allowed voters.
 */
export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Creator must be approved by ADMIN to create polls (except ADMIN themselves)
    if (!user.approvedByAdmin && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Your account is pending admin approval. You cannot create polls yet.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      description,
      posterUrl,
      isOpenVoting,
      isAnonymous,
      isResultPublic,
      startTime,
      endTime,
      status, // 'DRAFT' | 'ACTIVE'
      questions, // array
      settings,  // object
      allowedVoters, // array (only for closed voting)
    } = body;

    if (!title || !description || !startTime || !endTime || !questions || !questions.length) {
      return NextResponse.json(
        { error: 'Missing compulsory poll creation parameters' },
        { status: 400 }
      );
    }

    // Execute atomic transaction to write all layers of the poll
    const newPoll = await prisma.$transaction(async (tx) => {
      // 1. Create Poll
      const poll = await tx.poll.create({
        data: {
          creatorId: user.id,
          title,
          description,
          posterUrl: posterUrl || null,
          isOpenVoting: !!isOpenVoting,
          isAnonymous: !!isAnonymous,
          isResultPublic: !!isResultPublic,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          status: status === 'ACTIVE' ? 'ACTIVE' : 'DRAFT',
        },
      });

      // 2. Create Questions and Options
      for (const q of questions) {
        const question = await tx.question.create({
          data: {
            pollId: poll.id,
            questionText: q.questionText,
            type: (q.type === 'RANKED' || q.type === 'KNOCKOUT') ? q.type : 'SINGLE',
          },
        });

        // Add Options
        if (q.options && q.options.length) {
          await tx.option.createMany({
            data: q.options.map((optText: string) => ({
              questionId: question.id,
              text: optText,
            })),
          });
        }
      }

      // 3. Create Settings
      await tx.pollSettings.create({
        data: {
          pollId: poll.id,
          limitOneVotePerUser: !!settings?.limitOneVotePerUser,
          limitOneVotePerIP: !!settings?.limitOneVotePerIP,
          limitOneVotePerISP: !!settings?.limitOneVotePerISP,
          hideResultsUntilEnd: !!settings?.hideResultsUntilEnd,
          identifierLabel: body.identifierLabel || 'Roll Number',
          confirmer1Label: body.confirmer1Label || 'Student Name',
          confirmer2Label: body.confirmer2Label || 'Parent Name',
        },
      });

      // 4. If Closed voting, import allowed voters
      if (!isOpenVoting && allowedVoters && allowedVoters.length) {
        await tx.allowedVoter.createMany({
          data: allowedVoters.map((voter: any) => ({
            pollId: poll.id,
            identifier: voter.identifier,
            confirmer1: voter.confirmer1,
            confirmer2: voter.confirmer2 || null,
            email: voter.email,
          })),
        });
      }

      return poll;
    });

    // If published immediately (ACTIVE) and closed voting, invite voters via email in background
    if (newPoll.status === 'ACTIVE' && !isOpenVoting && allowedVoters && allowedVoters.length) {
      // In background, dispatch invitations
      const host = req.headers.get('host') || 'localhost:3000';
      const protocol = req.headers.get('x-forwarded-proto') || 'http';
      const inviteLink = `${protocol}://${host}/poll/${newPoll.id}`;

      allowedVoters.forEach((voter: any) => {
        sendPollInvitationEmail(
          voter.email,
          title,
          inviteLink,
          description
        ).catch((e) => console.error('Failed to send invite email to:', voter.email, e));
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Poll created successfully!',
      pollId: newPoll.id,
    });
  } catch (error: any) {
    console.error('Create Poll API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
