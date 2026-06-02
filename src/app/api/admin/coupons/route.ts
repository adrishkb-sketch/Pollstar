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

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, coupons });
  } catch (error: any) {
    console.error('Fetch Coupons Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAuthAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code, discountType, discountValue, startDate, endDate, firstTimeOnly, planId, billingCycle, maxUses } = await req.json();

    if (!code || !discountType || discountValue === undefined || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const formattedCode = code.trim().toUpperCase();

    // Check if code is unique
    const existing = await prisma.coupon.findUnique({
      where: { code: formattedCode }
    });
    if (existing) {
      return NextResponse.json({ error: 'Coupon code already exists' }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: formattedCode,
        discountType,
        discountValue: parseFloat(discountValue),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        firstTimeOnly: !!firstTimeOnly,
        planId: planId || null,
        billingCycle: billingCycle || null,
        maxUses: maxUses !== undefined && maxUses !== null ? parseInt(String(maxUses), 10) : null,
        isActive: true
      }
    });

    return NextResponse.json({ success: true, coupon });
  } catch (error: any) {
    console.error('Create Coupon Error:', error);
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
      return NextResponse.json({ error: 'Missing coupon ID' }, { status: 400 });
    }

    await prisma.coupon.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error: any) {
    console.error('Delete Coupon Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
