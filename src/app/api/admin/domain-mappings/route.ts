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

export async function GET() {
  try {
    const admin = await getAuthAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mappings = await prisma.emailDomainMapping.findMany({
      include: {
        plan: {
          select: { name: true, badgeColor: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, mappings });
  } catch (error: any) {
    console.error('Fetch Domain Mappings Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAuthAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { domain, planId, durationMonths } = await req.json();

    if (!domain || !planId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Clean domain format: e.g. "school.edu" or "@school.edu". We will save it without the leading "@" for consistency.
    let cleanDomain = domain.trim().toLowerCase();
    if (cleanDomain.startsWith('@')) {
      cleanDomain = cleanDomain.substring(1);
    }

    if (!cleanDomain) {
      return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 });
    }

    // Check if mapping already exists
    const existing = await prisma.emailDomainMapping.findUnique({
      where: { domain: cleanDomain }
    });
    if (existing) {
      return NextResponse.json({ error: 'Domain mapping already exists' }, { status: 400 });
    }

    const mapping = await prisma.emailDomainMapping.create({
      data: {
        domain: cleanDomain,
        planId,
        durationMonths: durationMonths ? parseInt(durationMonths) : null,
      },
      include: {
        plan: {
          select: { name: true, badgeColor: true }
        }
      }
    });

    return NextResponse.json({ success: true, mapping });
  } catch (error: any) {
    console.error('Create Domain Mapping Error:', error);
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
      return NextResponse.json({ error: 'Missing mapping ID' }, { status: 400 });
    }

    await prisma.emailDomainMapping.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Domain mapping deleted successfully' });
  } catch (error: any) {
    console.error('Delete Domain Mapping Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
