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
  return prisma.user.findUnique({ where: { id: payload.userId } });
}

export async function GET() {
  try {
    const admin = await getAuthAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notices = await prisma.notice.findMany({
      include: {
        referencedNotice: true,
      },
      orderBy: { publishedAt: 'desc' },
    });

    return NextResponse.json({ success: true, notices });
  } catch (error: any) {
    console.error('Fetch Admin Notices Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAuthAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, content, targetType, priority, publishedAt, referencedNoticeId } = await req.json();

    if (!title || !content || !targetType || !priority) {
      return NextResponse.json({ error: 'Title, content, targetType and priority are required.' }, { status: 400 });
    }

    const newNotice = await prisma.notice.create({
      data: {
        title,
        content,
        targetType,
        priority,
        publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
        referencedNoticeId: referencedNoticeId || null,
      },
      include: {
        referencedNotice: true,
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'CREATE_NOTICE',
        adminId: admin.id,
        details: `Admin created platform notice: "${title}" for audience "${targetType}"`,
      }
    });

    return NextResponse.json({ success: true, notice: newNotice });
  } catch (error: any) {
    console.error('Create Notice Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = await getAuthAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Notice ID is required.' }, { status: 400 });
    }

    await prisma.notice.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        action: 'DELETE_NOTICE',
        adminId: admin.id,
        details: `Admin deleted notice ID: ${id}`,
      }
    });

    return NextResponse.json({ success: true, message: 'Notice deleted successfully' });
  } catch (error: any) {
    console.error('Delete Notice Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
