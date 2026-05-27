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
    const rp = verifyRefreshToken(refreshToken);
    if (rp) payload = { userId: rp.userId, email: rp.email, role: rp.role };
  }
  if (!payload) return null;
  return prisma.user.findUnique({ where: { id: payload.userId } });
}

function generateCode(length = 7): string {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * POST /api/polls/[id]/shortlink
 * Generates (or returns existing) short code for a poll.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pollId } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const poll = await prisma.poll.findUnique({ where: { id: pollId } });
    if (!poll) return NextResponse.json({ error: 'Poll not found' }, { status: 404 });

    // Only creator or admin may generate shortlinks
    if (poll.creatorId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Return existing code if already generated
    if (poll.shortCode) {
      return NextResponse.json({ shortCode: poll.shortCode });
    }

    // Generate a unique code (retry on collision)
    let code = generateCode();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.poll.findUnique({ where: { shortCode: code } });
      if (!existing) break;
      code = generateCode();
      attempts++;
    }

    const updated = await prisma.poll.update({
      where: { id: pollId },
      data: { shortCode: code },
    });

    return NextResponse.json({ shortCode: updated.shortCode });
  } catch (err) {
    console.error('[shortlink POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/polls/[id]/shortlink
 * Returns the current short code (or null) for a poll.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pollId } = await params;
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      select: { shortCode: true },
    });
    if (!poll) return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    return NextResponse.json({ shortCode: poll.shortCode ?? null });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
