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

// GET: list all job postings for admin
export async function GET() {
  try {
    const admin = await getAuthAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobs = await prisma.jobPosting.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, jobs });
  } catch (error: any) {
    console.error('Fetch Admin Careers Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: create a job posting
export async function POST(req: Request) {
  try {
    const admin = await getAuthAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, department, location, type, description, requirements, isActive } = body;

    if (!title || !department || !location || !type || !description) {
      return NextResponse.json({ error: 'Missing required job parameters' }, { status: 400 });
    }

    const job = await prisma.jobPosting.create({
      data: {
        title,
        department,
        location,
        type,
        description,
        requirements: requirements || '',
        isActive: isActive !== false
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'CREATE_JOB',
        adminId: admin.id,
        details: `Admin created job posting: "${title}" in "${department}"`
      }
    });

    return NextResponse.json({ success: true, job });
  } catch (error: any) {
    console.error('Create Job API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH: modify a job posting
export async function PATCH(req: Request) {
  try {
    const admin = await getAuthAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { jobId, title, department, location, type, description, requirements, isActive } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required.' }, { status: 400 });
    }

    const existing = await prisma.jobPosting.findUnique({ where: { id: jobId } });
    if (!existing) {
      return NextResponse.json({ error: 'Job posting not found.' }, { status: 404 });
    }

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (department !== undefined) data.department = department;
    if (location !== undefined) data.location = location;
    if (type !== undefined) data.type = type;
    if (description !== undefined) data.description = description;
    if (requirements !== undefined) data.requirements = requirements;
    if (isActive !== undefined) data.isActive = isActive;

    const updatedJob = await prisma.jobPosting.update({
      where: { id: jobId },
      data,
    });

    await prisma.auditLog.create({
      data: {
        action: 'MODIFY_JOB',
        adminId: admin.id,
        details: `Admin modified job posting: "${existing.title}" -> "${updatedJob.title}"`
      }
    });

    return NextResponse.json({ success: true, job: updatedJob });
  } catch (error: any) {
    console.error('Modify Job API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: remove a job posting
export async function DELETE(req: Request) {
  try {
    const admin = await getAuthAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required.' }, { status: 400 });
    }

    const existing = await prisma.jobPosting.findUnique({ where: { id: jobId } });
    if (!existing) {
      return NextResponse.json({ error: 'Job posting not found.' }, { status: 404 });
    }

    await prisma.jobPosting.delete({ where: { id: jobId } });

    await prisma.auditLog.create({
      data: {
        action: 'DELETE_JOB',
        adminId: admin.id,
        details: `Admin deleted job posting: "${existing.title}"`
      }
    });

    return NextResponse.json({ success: true, message: 'Job posting deleted successfully.' });
  } catch (error: any) {
    console.error('Delete Job API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
