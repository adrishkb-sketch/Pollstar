import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/jwt';
import { sendPollCollaboratorInvitationEmail } from '@/lib/nodemailer';

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
 * GET: List all collaborators for a poll.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    // Only creator or admin can view collaborators
    if (poll.creatorId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const collaborators = await prisma.pollCollaborator.findMany({
      where: { pollId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            verified: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ success: true, collaborators });
  } catch (error: any) {
    console.error('GET Collaborators Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST: Invite/add a collaborator by email.
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

    // Only creator or admin can add collaborators
    if (poll.creatorId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email } = await req.json();
    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const targetEmail = email.trim().toLowerCase();

    // Cannot add self as a collaborator
    const creatorUser = await prisma.user.findUnique({
      where: { id: poll.creatorId },
    });

    if (creatorUser?.email.toLowerCase() === targetEmail) {
      return NextResponse.json({ error: 'You are the creator of this poll.' }, { status: 400 });
    }

    let targetUser = await prisma.user.findUnique({
      where: { email: targetEmail },
    });

    let isNewUser = false;
    if (!targetUser) {
      // Pre-create the user as unverified with a placeholder password hash
      targetUser = await prisma.user.create({
        data: {
          email: targetEmail,
          passwordHash: 'INVITED_PLACEHOLDER',
          verified: false,
          approvedByAdmin: false,
        },
      });
      isNewUser = true;
    }

    // Check if already a collaborator
    const existingCollab = await prisma.pollCollaborator.findUnique({
      where: {
        pollId_userId: {
          pollId,
          userId: targetUser.id,
        },
      },
    });

    if (existingCollab) {
      return NextResponse.json({ error: 'User is already a collaborator.' }, { status: 400 });
    }

    // Create collaborator entry
    const newCollaborator = await prisma.pollCollaborator.create({
      data: {
        pollId,
        userId: targetUser.id,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            verified: true,
          },
        },
      },
    });

    // Send email invitation
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const isRegistered = !isNewUser && targetUser.verified;
    const inviteLink = isRegistered
      ? `${protocol}://${host}/dashboard`
      : `${protocol}://${host}/signup?email=${encodeURIComponent(targetEmail)}`;

    await sendPollCollaboratorInvitationEmail(targetEmail, poll.title, inviteLink, isRegistered);

    return NextResponse.json({ success: true, collaborator: newCollaborator });
  } catch (error: any) {
    console.error('POST Collaborator Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE: Remove a collaborator.
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

    // Only creator or admin can remove collaborators
    if (poll.creatorId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await prisma.pollCollaborator.delete({
      where: {
        pollId_userId: {
          pollId,
          userId,
        },
      },
    });

    return NextResponse.json({ success: true, message: 'Collaborator removed successfully' });
  } catch (error: any) {
    console.error('DELETE Collaborator Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
