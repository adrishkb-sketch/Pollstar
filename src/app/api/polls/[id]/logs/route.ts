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
 * GET: Fetches all audit logs for a specific poll.
 * Accessible only to poll Creator, Admin, or registered collaborators.
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
      include: { collaborators: true },
    });

    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    // Check permissions
    const isCollaborator = poll.collaborators.some((c) => c.userId === user.id);
    const isCreatorOrAdmin = poll.creatorId === user.id || user.role === 'ADMIN' || isCollaborator;

    if (!isCreatorOrAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch chronological audit logs
    const auditLogs = await prisma.auditLog.findMany({
      where: { pollId },
      orderBy: { timestamp: 'desc' },
      include: {
        admin: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, logs: auditLogs });
  } catch (error: any) {
    console.error('Fetch Poll Logs API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
