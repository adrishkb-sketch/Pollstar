import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/jwt';

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

    // Verify creator or collaborator status
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { collaborators: true },
    });

    if (!poll) {
      return NextResponse.json({ error: 'Poll/Exam not found' }, { status: 404 });
    }

    const isCreator = poll.creatorId === user.id;
    const isCollaborator = poll.collaborators.some(c => c.userId === user.id);
    const isAdmin = user.role === 'ADMIN';

    if (!isCreator && !isCollaborator && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { action, voteId, studentIdentifier } = await req.json();

    if (!action || !['approve', 'cancel'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
    }

    // 1. Process Approved integrity status
    if (action === 'approve') {
      if (voteId) {
        const vote = await prisma.vote.findUnique({
          where: { id: voteId },
        });

        if (vote) {
          let answersObj: any = {};
          try {
            answersObj = typeof vote.answers === 'string' ? JSON.parse(vote.answers) : vote.answers;
          } catch (_) {}

          // Delete screenshots to clear student privacy records immediately
          delete answersObj.__webcamFrame;
          delete answersObj.__screenFrame;

          // Clear proctor logs or mark focus warnings as cleared
          if (Array.isArray(answersObj.__proctorLogs)) {
            answersObj.__proctorLogs = answersObj.__proctorLogs.map((log: string) => 
              log.replace('⚠️', '✅ (Cleared)').replace('🚨', '✅ (Cleared)')
            );
          }

          await prisma.vote.update({
            where: { id: voteId },
            data: {
              flaggedSuspicious: false,
              answers: JSON.stringify(answersObj),
            },
          });
        }
      }
      return NextResponse.json({ success: true, message: 'Examinee proctor feeds successfully approved and cleared.' });
    }

    // 2. Process Cancelled/Voided integrity status
    if (action === 'cancel') {
      // Broadcast Socket.io cancel-exam event to kick off/terminate current student browser proctoring
      if (studentIdentifier) {
        const ioInstance = (global as any).io;
        if (ioInstance) {
          ioInstance.to(`poll-${pollId}`).emit('cancel-exam', {
            pollId,
            studentId: studentIdentifier,
            identifier: studentIdentifier,
          });
          console.log(`[Proctor Action] Broadcast cancel-exam event for student: ${studentIdentifier}`);
        }
      }

      if (voteId) {
        const vote = await prisma.vote.findUnique({
          where: { id: voteId },
        });

        if (vote) {
          let answersObj: any = {};
          try {
            answersObj = typeof vote.answers === 'string' ? JSON.parse(vote.answers) : vote.answers;
          } catch (_) {}

          // Set cancelled states
          answersObj.__examCancelled = true;
          answersObj.__markingStatus = 'CANCELLED';

          // Zero out the evaluation score in the database
          if (answersObj.__examScore) {
            answersObj.__examScore.earned = 0.0;
          } else {
            answersObj.__examScore = { earned: 0.0, total: 10.0 };
          }

          await prisma.vote.update({
            where: { id: voteId },
            data: {
              flaggedSuspicious: true,
              answers: JSON.stringify(answersObj),
            },
          });
        }
      }

      return NextResponse.json({ success: true, message: 'Examinee exam successfully cancelled and voided.' });
    }

    return NextResponse.json({ error: 'Unhandled action' }, { status: 400 });
  } catch (error: any) {
    console.error('Proctor Action API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
