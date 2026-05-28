import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

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

// POST: Public endpoint to raise an issue
export async function POST(req: Request) {
  try {
    const { email, description, pageUrl } = await req.json();

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Contact email address is required.' }, { status: 400 });
    }

    if (!description || !description.trim()) {
      return NextResponse.json({ error: 'Issue description is required.' }, { status: 400 });
    }

    const newIssue = await prisma.supportIssue.create({
      data: {
        email: email.trim(),
        description: description.trim(),
        pageUrl: pageUrl || null,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ success: true, issue: newIssue });
  } catch (error: any) {
    console.error('Raise Issue API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET: Admin only - lists all issues
export async function GET() {
  try {
    const admin = await getAuthAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const issues = await prisma.supportIssue.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, issues });
  } catch (error: any) {
    console.error('Fetch Support Issues API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH: Admin only - updates support issue status
export async function PATCH(req: Request) {
  try {
    const admin = await getAuthAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { issueId, status } = await req.json();

    if (!issueId || !status) {
      return NextResponse.json({ error: 'Issue ID and Status are required.' }, { status: 400 });
    }

    const updatedIssue = await prisma.supportIssue.update({
      where: { id: issueId },
      data: { status },
    });

    await prisma.auditLog.create({
      data: {
        action: 'RESOLVE_ISSUE',
        adminId: admin.id,
        details: `Admin changed support issue status for ID ${issueId} to "${status}"`,
      },
    });

    return NextResponse.json({ success: true, issue: updatedIssue });
  } catch (error: any) {
    console.error('Update Support Issue API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
