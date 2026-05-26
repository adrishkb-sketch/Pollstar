import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/jwt';
import { sendPollInvitationEmail, sendPollClosedEmail, sendPollScheduleUpdatedEmail } from '@/lib/nodemailer';

// Helper to authenticate user from cookies
async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  if (!token) return null;

  const payload = verifyAccessToken(token);
  if (!payload) return null;

  return prisma.user.findUnique({
    where: { id: payload.userId },
  });
}

/**
 * GET: Retrieves a single poll by ID.
 * Returns questions, options, settings, and stats.
 * If authorized as creator or admin, includes the list of allowed voters and individual vote logs.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: pollId } = await params;
    const user = await getAuthUser();

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        questions: {
          include: { options: true },
        },
        settings: true,
        votes: true,
        allowedVoters: true,
      },
    });

    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    // Check if requester is creator or admin
    const isCreatorOrAdmin = user && (poll.creatorId === user.id || user.role === 'ADMIN');

    // Build statistics
    const stats: Record<string, any> = {};
    for (const q of poll.questions) {
      stats[q.id] = {};
      q.options.forEach((o) => {
        stats[q.id][o.id] = { text: o.text, count: 0 };
      });
    }

    // Calculate normal choices or ranked border points
    poll.votes.forEach((v) => {
      try {
        const answers = typeof v.answers === 'string' ? JSON.parse(v.answers) : v.answers;
        Object.keys(answers).forEach((qId) => {
          const ans = answers[qId];
          const question = poll.questions.find((q) => q.id === qId);

          if (question) {
            if (question.type === 'RANKED' && Array.isArray(ans)) {
              // Borda Count weights
              const numOptions = question.options.length;
              ans.forEach((optId: string, index: number) => {
                if (stats[qId] && stats[qId][optId]) {
                  stats[qId][optId].count += numOptions - index;
                }
              });
            } else if (question.type === 'SINGLE' && typeof ans === 'string') {
              if (stats[qId] && stats[qId][ans]) {
                stats[qId][ans].count += 1;
              }
            } else if (question.type === 'KNOCKOUT' && ans && typeof ans.winner === 'string') {
              if (stats[qId] && stats[qId][ans.winner]) {
                stats[qId][ans.winner].count += 1;
              }
            }
          }
        });
      } catch (e) {
        console.error('Error parsing vote answers:', e);
      }
    });

    // Clean data if the user is a normal voter (not creator/admin)
    const cleanedPoll = {
      id: poll.id,
      title: poll.title,
      description: poll.description,
      posterUrl: poll.posterUrl,
      isOpenVoting: poll.isOpenVoting,
      isAnonymous: poll.isAnonymous,
      isResultPublic: poll.isResultPublic,
      startTime: poll.startTime,
      endTime: poll.endTime,
      status: poll.status,
      questions: poll.questions,
      settings: poll.settings,
      stats,
      totalVotes: poll.votes.length,
      // Only include logs and allowed voter list if creator or admin
      allowedVoters: isCreatorOrAdmin ? poll.allowedVoters : undefined,
      votes: isCreatorOrAdmin
        ? poll.votes.map((v) => {
            const showIdentity = !poll.isAnonymous || (user && user.role === 'ADMIN');
            return {
              id: v.id,
              userIdentifier: showIdentity ? v.userIdentifier : 'Anonymous',
              email: showIdentity ? v.email : 'Anonymous',
              ipAddress: v.ipAddress,
              isp: v.isp,
              flaggedSuspicious: v.flaggedSuspicious,
              createdAt: v.createdAt,
              answers: showIdentity ? (typeof v.answers === 'string' ? JSON.parse(v.answers) : v.answers) : undefined,
            };
          })
        : undefined,
    };

    return NextResponse.json({ success: true, poll: cleanedPoll, isOwner: isCreatorOrAdmin });
  } catch (error: any) {
    console.error('Fetch Poll API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE: Deletes a poll by ID.
 * Allowed only for the creator or an admin.
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    if (poll.creatorId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.poll.delete({
      where: { id: pollId },
    });

    // Write audit log if deleted by admin overriding
    if (user.role === 'ADMIN' && poll.creatorId !== user.id) {
      await prisma.auditLog.create({
        data: {
          action: 'DELETE_POLL',
          adminId: user.id,
          pollId: pollId,
          details: `Admin deleted poll: "${poll.title}" (creatorId: ${poll.creatorId})`,
        },
      });
    }

    return NextResponse.json({ success: true, message: 'Poll deleted successfully' });
  } catch (error: any) {
    console.error('Delete Poll API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * PATCH: Updates a poll's status or configuration.
 * e.g., Transitioning from DRAFT -> ACTIVE or ending early.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: pollId } = await params;
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { allowedVoters: true, votes: true },
    });

    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    // Only creator or admin can update status
    if (poll.creatorId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { status, isResultPublic, title, description, posterUrl, questionText, options, hideResultsUntilEnd, startTime, endTime } = await req.json();

    const updateData: any = {};
    if (status) {
      updateData.status = status;
    }
    if (isResultPublic !== undefined) {
      updateData.isResultPublic = !!isResultPublic;
    }
    if (title) {
      updateData.title = title;
    }
    if (description) {
      updateData.description = description;
    }
    if (posterUrl !== undefined) {
      updateData.posterUrl = posterUrl;
    }
    const originalStartTime = poll.startTime;
    const originalEndTime = poll.endTime;

    let scheduleUpdated = false;
    let newStartVal: Date | null = null;
    let newEndVal: Date | null = null;

    if (startTime) {
      newStartVal = new Date(startTime);
      updateData.startTime = newStartVal;
      if (!originalStartTime || originalStartTime.getTime() !== newStartVal.getTime()) {
        scheduleUpdated = true;
      }
    }
    if (endTime) {
      newEndVal = new Date(endTime);
      updateData.endTime = newEndVal;
      if (!originalEndTime || originalEndTime.getTime() !== newEndVal.getTime()) {
        scheduleUpdated = true;
      }
    }

    const updatedPoll = await prisma.$transaction(async (tx) => {
      // 1. Update Poll details
      const pollObj = await tx.poll.update({
        where: { id: pollId },
        data: updateData,
      });

      // Update PollSettings
      if (hideResultsUntilEnd !== undefined) {
        await tx.pollSettings.upsert({
          where: { pollId: pollId },
          create: {
            pollId: pollId,
            hideResultsUntilEnd: !!hideResultsUntilEnd,
          },
          update: {
            hideResultsUntilEnd: !!hideResultsUntilEnd,
          },
        });
      }

      // 2. Update Question Text
      if (questionText) {
        const question = await tx.question.findFirst({
          where: { pollId },
        });
        if (question) {
          await tx.question.update({
            where: { id: question.id },
            data: { questionText },
          });

          // 3. Update existing option labels
          if (options && Array.isArray(options)) {
            for (const opt of options) {
              if (opt.id && opt.text) {
                await tx.option.update({
                  where: { id: opt.id },
                  data: { text: opt.text },
                });
              }
            }
          }
        }
      }

      return pollObj;
    }, {
      maxWait: 15000,
      timeout: 20000,
    });

    // Audit logs for admin actions
    if (user.role === 'ADMIN' && poll.creatorId !== user.id) {
      await prisma.auditLog.create({
        data: {
          action: 'MODIFY_POLL',
          adminId: user.id,
          pollId: pollId,
          details: `Admin patched poll. Status: ${status || 'unchanged'}. Public: ${isResultPublic !== undefined ? isResultPublic : 'unchanged'}`,
        },
      });
    }

    // If poll was just moved to ACTIVE (published) and closed voting, invite voters now
    if (status === 'ACTIVE' && poll.status === 'DRAFT' && !poll.isOpenVoting && poll.allowedVoters.length) {
      const host = req.headers.get('host') || 'localhost:3000';
      const protocol = req.headers.get('x-forwarded-proto') || 'http';
      const inviteLink = `${protocol}://${host}/poll/${poll.id}`;

      poll.allowedVoters.forEach((voter) => {
        sendPollInvitationEmail(
          voter.email,
          poll.title,
          inviteLink,
          poll.description
        ).catch((e) => console.error('Failed to send invite email to:', voter.email, e));
      });
    }

    // If poll was just moved to ENDED (closed), send poll closed notification to everyone
    if (status === 'ENDED' && poll.status !== 'ENDED') {
      const host = req.headers.get('host') || 'localhost:3000';
      const protocol = req.headers.get('x-forwarded-proto') || 'http';
      const reportUrl = `${protocol}://${host}/poll/${poll.id}`;

      if (!poll.isOpenVoting && poll.allowedVoters.length) {
        poll.allowedVoters.forEach((voter) => {
          sendPollClosedEmail({
            email: voter.email,
            pollTitle: poll.title,
            reportUrl,
          }).catch((e) => console.error('Failed to send poll closed email:', e));
        });
      } else if (poll.votes && poll.votes.length) {
        const uniqueVoters = Array.from(new Set(poll.votes.map((v) => v.email).filter(Boolean)));
        uniqueVoters.forEach((email) => {
          sendPollClosedEmail({
            email: email as string,
            pollTitle: poll.title,
            reportUrl,
          }).catch((e) => console.error('Failed to send poll closed email:', e));
        });
      }
    }

    if (scheduleUpdated) {
      const finalStart = newStartVal || originalStartTime;
      const finalEnd = newEndVal || originalEndTime;
      
      if (finalStart && finalEnd) {
        const host = req.headers.get('host') || 'localhost:3000';
        const protocol = req.headers.get('x-forwarded-proto') || 'http';
        const pollUrl = `${protocol}://${host}/poll/${pollId}`;

        if (!poll.isOpenVoting && poll.allowedVoters.length) {
          poll.allowedVoters.forEach((voter) => {
            sendPollScheduleUpdatedEmail({
              email: voter.email,
              pollTitle: poll.title,
              newStartTime: finalStart,
              newEndTime: finalEnd,
              pollUrl,
            }).catch((e) => console.error('Failed to send schedule update email to voter:', voter.email, e));
          });
        } else if (poll.votes && poll.votes.length) {
          const uniqueVoters = Array.from(new Set(poll.votes.map((v) => v.email).filter(Boolean)));
          uniqueVoters.forEach((email) => {
            sendPollScheduleUpdatedEmail({
              email: email as string,
              pollTitle: poll.title,
              newStartTime: finalStart,
              newEndTime: finalEnd,
              pollUrl,
            }).catch((e) => console.error('Failed to send schedule update email to voter:', email, e));
          });
        }
      }
    }

    // Trigger dynamic socket update to all connected poll dashboard clients
    if ((global as any).io) {
      (global as any).io.to(`poll-${pollId}`).emit('poll-status-update', { status: updatedPoll.status });
    }

    return NextResponse.json({ success: true, poll: updatedPoll });
  } catch (error: any) {
    console.error('Update Poll API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
