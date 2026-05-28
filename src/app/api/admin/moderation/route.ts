import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/jwt';

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

// GET: list flagged content items
export async function GET() {
  try {
    const admin = await getAuthAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const logs = await prisma.contentModeration.findMany({
      include: {
        poll: {
          include: {
            creator: {
              select: {
                id: true,
                fullName: true,
                email: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    console.error('Fetch Moderation Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH: resolve a moderation item
export async function PATCH(req: Request) {
  try {
    const admin = await getAuthAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, action } = await req.json(); // action: "APPROVE" (mark safe, make ACTIVE), "REJECT" (keep blocked/DRAFT)
    if (!id || !action) {
      return NextResponse.json({ error: 'Missing ID or action' }, { status: 400 });
    }

    const mod = await prisma.contentModeration.findUnique({
      where: { id },
      include: { poll: true }
    });

    if (!mod) {
      return NextResponse.json({ error: 'Moderation item not found' }, { status: 404 });
    }

    const statusVal = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    const pollStatusVal = action === 'APPROVE' ? 'ACTIVE' : 'DRAFT';

    // Update moderation log
    const updatedMod = await prisma.contentModeration.update({
      where: { id },
      data: {
        status: statusVal,
        reviewedBy: admin.email,
      }
    });

    // Update poll status
    await prisma.poll.update({
      where: { id: mod.pollId },
      data: {
        status: pollStatusVal
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'RESOLVE_MODERATION',
        adminId: admin.id,
        details: `Admin resolved moderation #${id} as ${statusVal} for poll "${mod.poll.title}" (Poll set to ${pollStatusVal})`
      }
    });

    return NextResponse.json({ success: true, moderation: updatedMod });
  } catch (error: any) {
    console.error('Update Moderation Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
