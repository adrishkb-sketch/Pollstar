import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/jwt';
import { sendFinalGradedReportCardEmail } from '@/lib/nodemailer';

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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pollId } = await params;
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        settings: true,
        votes: true,
      },
    });

    if (!poll) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Only creator or admin can finalize
    if (poll.creatorId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse current postEmailMessage JSON to see if already finalized
    let examMeta: any = {};
    if (poll.settings?.postEmailMessage) {
      try {
        examMeta = JSON.parse(poll.settings.postEmailMessage);
      } catch (e) {
        // Fallback if it was a plain text previously
        examMeta = { plainText: poll.settings.postEmailMessage };
      }
    }

    if (examMeta.isFinalPublished) {
      return NextResponse.json(
        { error: 'This exam report has already been finalized and published.' },
        { status: 400 }
      );
    }

    // Mark as final published
    examMeta.isFinalPublished = true;

    await prisma.pollSettings.update({
      where: { pollId },
      data: {
        resultsReleased: true,
        postEmailMessage: JSON.stringify(examMeta),
      },
    });

    // Send final graded report card emails
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const host = req.headers.get('host') || 'localhost:3000';
    const analysisUrl = `${protocol}://${host}/poll/${pollId}/analysis`;

    const emailPromises = poll.votes.map(async (v) => {
      const recipientEmail = v.email || v.userIdentifier;
      if (!recipientEmail || !recipientEmail.includes('@')) return;

      let scoreEarned = 0;
      let scoreTotal = 0;
      let feedbackSummary = '';

      try {
        const answersObj = typeof v.answers === 'string' ? JSON.parse(v.answers) : v.answers;
        const score = answersObj?.__examScore;
        if (score) {
          scoreEarned = score.earned || 0;
          scoreTotal = score.total || 0;
        }

        // Build brief summary feedback
        const breakdown = answersObj?.__examBreakdown || {};
        const feedbackList: string[] = [];
        Object.keys(breakdown).forEach((qId) => {
          const qb = breakdown[qId];
          if (qb && qb.feedback) {
            feedbackList.push(qb.feedback);
          }
        });
        feedbackSummary = feedbackList.slice(0, 3).join(' | ');
      } catch (e) {
        console.error('Failed to parse score for email finalization:', v.id, e);
      }

      try {
        await sendFinalGradedReportCardEmail({
          email: recipientEmail,
          examTitle: poll.title,
          scoreEarned,
          scoreTotal,
          analysisUrl,
          feedbackSummary: feedbackSummary || undefined,
        });
      } catch (err) {
        console.error('Failed to send final report card email to:', recipientEmail, err);
      }
    });

    await Promise.all(emailPromises);

    // Save audit log
    await prisma.auditLog.create({
      data: {
        action: 'FINAL_PUBLISH',
        pollId,
        details: `Exam grades finalized and report cards dispatched by ${user.fullName || user.email}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Exam report card grades finalized and emailed successfully!',
    });
  } catch (error: any) {
    console.error('Finalize Exam API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
