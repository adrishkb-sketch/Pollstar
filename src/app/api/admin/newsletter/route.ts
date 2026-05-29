import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/jwt';
import { sendNewsletterBroadcastEmail } from '@/lib/nodemailer';

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

// GET: list all subscribers
export async function GET() {
  try {
    const admin = await getAuthAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscribers = await prisma.newsletterSubscriber.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, subscribers });
  } catch (error: any) {
    console.error('Fetch Newsletter Subscribers Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: send broadcast message
export async function POST(req: Request) {
  try {
    const admin = await getAuthAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, content } = await req.json();
    if (!title || !title.trim() || !content || !content.trim()) {
      return NextResponse.json({ error: 'Title and content are required.' }, { status: 400 });
    }

    const activeSubscribers = await prisma.newsletterSubscriber.findMany({
      where: { isActive: true }
    });

    if (activeSubscribers.length === 0) {
      return NextResponse.json({ success: true, sentCount: 0, message: 'No active subscribers to broadcast to.' });
    }

    const emailPromises = activeSubscribers.map(async (sub) => {
      try {
        await sendNewsletterBroadcastEmail(sub.email, title, content);
      } catch (err) {
        console.error('Error sending newsletter broadcast to:', sub.email, err);
      }
    });

    await Promise.all(emailPromises);

    await prisma.auditLog.create({
      data: {
        action: 'NEWSLETTER_BROADCAST',
        adminId: admin.id,
        details: `Admin sent newsletter broadcast: "${title}" to ${activeSubscribers.length} active subscribers.`
      }
    });

    return NextResponse.json({ success: true, sentCount: activeSubscribers.length, message: `Newsletter broadcasted successfully to ${activeSubscribers.length} subscribers!` });
  } catch (error: any) {
    console.error('Newsletter Broadcast Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
