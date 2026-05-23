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
 * GET: Lists all registered creators.
 */
export async function GET() {
  try {
    const admin = await getAuthAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const creators = await prisma.user.findMany({
      where: { role: 'USER' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        verified: true,
        approvedByAdmin: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, creators });
  } catch (error: any) {
    console.error('Admin Fetch Users API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * PATCH: Approves or revokes a creator.
 */
export async function PATCH(req: Request) {
  try {
    const admin = await getAuthAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, approve } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { approvedByAdmin: !!approve },
    });

    // Write audit log entry
    await prisma.auditLog.create({
      data: {
        action: approve ? 'APPROVE_USER' : 'REVOKE_USER',
        adminId: admin.id,
        details: `${approve ? 'Approved' : 'Revoked approval for'} user: ${updatedUser.email} (ID: ${userId})`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `User approval state successfully ${approve ? 'verified' : 'revoked'}.`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        approved: updatedUser.approvedByAdmin,
      },
    });
  } catch (error: any) {
    console.error('Admin Update User API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE: Deletes a registered creator account.
 */
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

    // Find user to log their email
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent Admin from deleting themselves
    if (targetUser.id === admin.id) {
      return NextResponse.json({ error: 'You cannot delete your own admin account' }, { status: 400 });
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
        details: `Deleted creator account: ${targetUser.email} (ID: ${userId})`,
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
