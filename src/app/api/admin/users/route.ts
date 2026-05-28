import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

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

// GET: Lists all registered users (USER role and optional admin view, ordered by signup date)
export async function GET() {
  try {
    const admin = await getAuthAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const creators = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        plan: true,
        polls: {
          include: {
            questions: {
              include: { options: true }
            },
            votes: true
          }
        },
        _count: {
          select: { polls: true }
        }
      }
    });

    return NextResponse.json({ success: true, creators });
  } catch (error: any) {
    console.error('Admin Fetch Users API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH: Updates moderation, plans, or verification flags
export async function PATCH(req: Request) {
  try {
    const admin = await getAuthAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { userId, action, ban, suspend, suspensionUntil, suspensionReason, restrict, planId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.role === 'ADMIN') {
      return NextResponse.json({ error: 'Moderation of administrative accounts is forbidden' }, { status: 403 });
    }

    let updateData: any = {};
    let logMessage = '';

    if (action === 'BAN') {
      updateData.isBanned = !!ban;
      logMessage = `${ban ? 'Banned' : 'Unbanned'} user account: ${targetUser.email}`;
    } else if (action === 'SUSPEND') {
      updateData.isSuspended = !!suspend;
      updateData.suspensionUntil = suspend && suspensionUntil ? new Date(suspensionUntil) : null;
      updateData.suspensionReason = suspend ? suspensionReason : null;
      logMessage = `${suspend ? 'Suspended' : 'Lifted suspension for'} user: ${targetUser.email}. Until: ${suspensionUntil || 'indefinite'}. Reason: ${suspensionReason || 'none'}`;
    } else if (action === 'RESTRICT') {
      updateData.isActivityRestricted = !!restrict;
      logMessage = `${restrict ? 'Restricted' : 'Restored'} activity privileges for user: ${targetUser.email}`;
    } else if (action === 'CHANGE_PLAN') {
      if (!planId) return NextResponse.json({ error: 'Plan ID is required for subscription changes' }, { status: 400 });
      const plan = await prisma.plan.findUnique({ where: { id: planId } });
      if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
      
      updateData.planId = planId;
      logMessage = `Changed subscription plan for user: ${targetUser.email} to: "${plan.name}"`;
    } else {
      return NextResponse.json({ error: 'Invalid moderation action request' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: { plan: true }
    });

    // Write audit log entry
    await prisma.auditLog.create({
      data: {
        action: action,
        adminId: admin.id,
        details: logMessage,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Moderation status successfully synchronized.',
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Admin Update User API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Deletes user permanently (same as before)
export async function DELETE(req: Request) {
  try {
    const admin = await getAuthAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.role === 'ADMIN') {
      return NextResponse.json({ error: 'You cannot delete administrative accounts' }, { status: 403 });
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId },
    });

    // Write audit log entry
    await prisma.auditLog.create({
      data: {
        action: 'DELETE_USER',
        adminId: admin.id,
        details: `Deleted user account: ${targetUser.email} (ID: ${userId})`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.email} successfully deleted.`,
    });
  } catch (error: any) {
    console.error('Admin Delete User API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
