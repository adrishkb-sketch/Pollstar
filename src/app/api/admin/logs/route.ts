import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/jwt';

// Helper to confirm admin privileges
async function getAuthAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  if (!token) return null;

  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== 'ADMIN') return null;

  return prisma.user.findUnique({
    where: { id: payload.userId },
  });
}

/**
 * GET: Lists all system audit logs.
 */
export async function GET() {
  try {
    const admin = await getAuthAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      include: {
        admin: { select: { email: true } },
        poll: { select: { title: true } },
      },
    });

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    console.error('Admin Logs API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
