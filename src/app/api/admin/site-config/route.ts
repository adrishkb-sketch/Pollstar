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
  return prisma.user.findUnique({ where: { id: payload.userId } });
}

// GET: list all site config entries
export async function GET() {
  try {
    const configs = await prisma.siteConfig.findMany({
      orderBy: { key: 'asc' },
    });
    return NextResponse.json({ success: true, configs });
  } catch (error: any) {
    console.error('Fetch SiteConfig Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: create or update a site config entry (upsert)
export async function POST(req: Request) {
  try {
    const admin = await getAuthAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { key, value } = await req.json();
    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key and value are required.' }, { status: 400 });
    }

    const config = await prisma.siteConfig.upsert({
      where: { key },
      update: { value, updatedBy: admin.id },
      create: { key, value, updatedBy: admin.id },
    });

    await prisma.auditLog.create({
      data: {
        action: 'EDIT_SITE_CONFIG',
        adminId: admin.id,
        details: `Admin updated site config "${key}"`,
      }
    });

    return NextResponse.json({ success: true, config });
  } catch (error: any) {
    console.error('Update SiteConfig Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH: bulk update multiple site config entries
export async function PATCH(req: Request) {
  try {
    const admin = await getAuthAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entries } = await req.json();
    if (!Array.isArray(entries)) {
      return NextResponse.json({ error: 'Entries array is required.' }, { status: 400 });
    }

    for (const { key, value } of entries) {
      if (key && value !== undefined) {
        await prisma.siteConfig.upsert({
          where: { key },
          update: { value, updatedBy: admin.id },
          create: { key, value, updatedBy: admin.id },
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        action: 'BULK_EDIT_SITE_CONFIG',
        adminId: admin.id,
        details: `Admin bulk-updated ${entries.length} site config entries`,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Bulk Update SiteConfig Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
