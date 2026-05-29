import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/jwt';
import { sendExamResultsReleasedEmail } from '@/lib/nodemailer';

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

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: pollId } = await params;
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const poll = (await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        settings: true,
        votes: true
      }
    })) as any;

    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    // Only creator or admin or collaborator can release results
    if (poll.creatorId !== user.id && user.role !== 'ADMIN') {
      const isCollab = await prisma.pollCollaborator.findUnique({
        where: {
          pollId_userId: {
            pollId,
            userId: user.id
          }
        }
      });
      if (!isCollab) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Update settings: resultsReleased = true
    if (poll.settings) {
      await prisma.pollSettings.update({
        where: { pollId },
        data: { resultsReleased: true }
      });
    } else {
      await prisma.pollSettings.create({
        data: {
          pollId,
          resultsReleased: true
        }
      });
    }

    // Send emails to examinees/students
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const analysisUrl = `${protocol}://${host}/poll/${pollId}/analysis`;

    const emailPromises = poll.votes.map(async (v: any) => {
      const recipientEmail = v.email || v.userIdentifier;
      if (!recipientEmail) return;

      let scoreEarned = 0;
      let scoreTotal = 0;
      try {
        const answersObj = typeof v.answers === 'string' ? JSON.parse(v.answers) : v.answers;
        const examScore = answersObj?.__examScore;
        if (examScore) {
          scoreEarned = examScore.earned || 0;
          scoreTotal = examScore.total || 0;
        }
      } catch (e) {
        console.error('Failed to parse answers for vote:', v.id, e);
      }

      try {
        await sendExamResultsReleasedEmail({
          email: recipientEmail,
          pollTitle: poll.title,
          scoreEarned,
          scoreTotal,
          analysisUrl
        });
      } catch (emailErr) {
        console.error('Failed to send release email to:', recipientEmail, emailErr);
      }
    });

    await Promise.all(emailPromises);

    return NextResponse.json({ success: true, message: 'Results released and emails sent successfully.' });
  } catch (error: any) {
    console.error('Release Results API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
