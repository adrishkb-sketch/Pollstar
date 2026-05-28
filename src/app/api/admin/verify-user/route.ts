import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/jwt';

async function getAuthAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  let payload = token ? verifyAccessToken(token) : null;

  if (!payload) {
    const refreshToken = cookieStore.get('refreshToken')?.value;
    if (refreshToken) {
      payload = verifyRefreshToken(refreshToken);
    }
  }

  if (!payload || payload.role !== 'ADMIN') return null;

  return prisma.user.findUnique({
    where: { id: payload.userId },
  });
}

export async function POST(req: Request) {
  try {
    const admin = await getAuthAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, action, reason } = await req.json();

    if (!userId || !action) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let updatedUser;

    if (action === 'APPROVE') {
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          verificationStatus: 'VERIFIED',
          isVerifiedUser: true,
          verificationReason: null,
        }
      });

      await prisma.auditLog.create({
        data: {
          action: 'VERIFY_USER',
          adminId: admin.id,
          details: `Admin approved verification for user: ${targetUser.email}`,
        }
      });
    } else if (action === 'REJECT') {
      if (!reason || !reason.trim()) {
        return NextResponse.json({ error: 'A reason must be provided for rejection' }, { status: 400 });
      }

      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          verificationStatus: 'REJECTED',
          isVerifiedUser: false,
          verificationReason: reason,
        }
      });

      await prisma.auditLog.create({
        data: {
          action: 'REJECT_VERIFICATION',
          adminId: admin.id,
          details: `Admin rejected verification for user: ${targetUser.email}. Reason: ${reason}`,
        }
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error('Verify User API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
