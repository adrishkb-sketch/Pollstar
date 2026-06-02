import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/jwt';
import { checkAndCleanExpiredPlanOffers } from '@/lib/planExpiry';

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  let payload = token ? verifyAccessToken(token) : null;

  if (!payload) {
    const refreshToken = cookieStore.get('refreshToken')?.value;
    if (refreshToken) {
      payload = verifyRefreshToken(refreshToken);
    }
  }

  if (!payload) return null;

  return prisma.user.findUnique({
    where: { id: payload.userId },
  });
}

export async function POST(req: Request) {
  try {
    await checkAndCleanExpiredPlanOffers();

    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { couponCode, planId, duration } = await req.json();

    if (!couponCode || !planId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const plan = await prisma.plan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const formattedCode = couponCode.trim().toUpperCase();

    const coupon = await prisma.coupon.findUnique({
      where: { code: formattedCode }
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon code not found' }, { status: 404 });
    }

    if (!coupon.isActive) {
      return NextResponse.json({ error: 'Coupon is inactive' }, { status: 400 });
    }

    const now = new Date();
    if (now < new Date(coupon.startDate) || now > new Date(coupon.endDate)) {
      return NextResponse.json({ error: 'Coupon code has expired or is not yet active' }, { status: 400 });
    }

    // Plan wise Coupon verification check
    if (coupon.planId && coupon.planId !== planId) {
      return NextResponse.json({ error: 'This coupon code is not valid for the selected plan' }, { status: 400 });
    }

    // Plan duration / billing cycle wise Coupon verification check
    if (coupon.billingCycle && duration && coupon.billingCycle.toUpperCase() !== duration.toUpperCase()) {
      return NextResponse.json({ error: `This coupon code is only valid for ${coupon.billingCycle.toLowerCase()} subscriptions` }, { status: 400 });
    }

    // Maximum usage count verification check
    if (coupon.maxUses !== null && coupon.usesCount >= coupon.maxUses) {
      return NextResponse.json({ error: 'This coupon code has reached its maximum usage limit' }, { status: 400 });
    }

    if (coupon.firstTimeOnly) {
      // Check if current user is already on a premium plan
      if (user.planId) {
        const currentPlan = await prisma.plan.findUnique({
          where: { id: user.planId }
        });
        if (currentPlan && currentPlan.price > 0) {
          return NextResponse.json({ error: 'This coupon is valid for first-time buyers only' }, { status: 400 });
        }
      }
    }

    // Calculate discount
    let discountAmount = 0;
    let planPrice = plan.price;

    if (duration && plan.durations) {
      const durationsConfig = plan.durations as any;
      if (durationsConfig[duration] && durationsConfig[duration].enabled) {
        planPrice = parseFloat(durationsConfig[duration].price || '0');
      }
    }

    if (coupon.discountType === 'FREE') {
      discountAmount = planPrice;
    } else if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = (planPrice * coupon.discountValue) / 100;
    } else { // FLAT
      discountAmount = coupon.discountValue;
    }

    if (discountAmount > planPrice) {
      discountAmount = planPrice;
    }

    const finalPrice = Math.max(0, planPrice - discountAmount);

    return NextResponse.json({
      success: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue
      },
      originalPrice: planPrice,
      discountAmount,
      finalPrice
    });
  } catch (error: any) {
    console.error('Apply Coupon Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
