import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/jwt';

async function getIsAdmin() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    let payload = token ? verifyAccessToken(token) : null;

    if (!payload) {
      const refreshToken = cookieStore.get('refreshToken')?.value;
      if (refreshToken) {
        payload = verifyRefreshToken(refreshToken);
      }
    }

    return payload && payload.role === 'ADMIN';
  } catch (e) {
    return false;
  }
}

// GET: list jobs (public gets only active, admin gets all)
export async function GET() {
  try {
    const isAdmin = await getIsAdmin();
    
    const jobs = await prisma.jobPosting.findMany({
      where: isAdmin ? {} : { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, jobs });
  } catch (error: any) {
    console.error('Fetch Jobs API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: create job posting (Admin only)
export async function POST(req: Request) {
  try {
    const isAdmin = await getIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, department, location, type, description, isActive } = body;

    if (!title || !department || !description) {
      return NextResponse.json({ error: 'Title, Department, and Description are required.' }, { status: 400 });
    }

    const job = await prisma.jobPosting.create({
      data: {
        title,
        department,
        location: location || 'Remote',
        type: type || 'FULL_TIME',
        description,
        isActive: isActive !== false
      }
    });

    return NextResponse.json({ success: true, job });
  } catch (error: any) {
    console.error('Create Job API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH: update job posting (Admin only)
export async function PATCH(req: Request) {
  try {
    const isAdmin = await getIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, title, department, location, type, description, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Job Posting ID is required.' }, { status: 400 });
    }

    const existing = await prisma.jobPosting.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Job posting not found.' }, { status: 404 });
    }

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (department !== undefined) data.department = department;
    if (location !== undefined) data.location = location;
    if (type !== undefined) data.type = type;
    if (description !== undefined) data.description = description;
    if (isActive !== undefined) data.isActive = isActive;

    const updatedJob = await prisma.jobPosting.update({
      where: { id },
      data
    });

    return NextResponse.json({ success: true, job: updatedJob });
  } catch (error: any) {
    console.error('Update Job API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: remove job posting (Admin only)
export async function DELETE(req: Request) {
  try {
    const isAdmin = await getIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Job Posting ID is required.' }, { status: 400 });
    }

    await prisma.jobPosting.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Job posting removed successfully.' });
  } catch (error: any) {
    console.error('Delete Job API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
