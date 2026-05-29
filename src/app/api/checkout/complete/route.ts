import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/jwt';
import { computePlanExpiresAt, formatBillingCycle } from '@/lib/planExpiry';

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
    include: { plan: true }
  });
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      planId, 
      couponCode, 
      billingName, 
      billingAddress, 
      billingCity, 
      billingZip, 
      billingPhone,
      duration,       // user-selected billing cycle: MONTHLY | QUARTERLY | YEARLY | TWO_YEAR | LIFETIME
      isAddon,        // boolean: true if purchasing an add-on plan
    } = await req.json();

    if (!planId) {
      return NextResponse.json({ error: 'Missing Plan ID' }, { status: 400 });
    }

    const plan = await prisma.plan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Enforce: Add-ons require an active recurring (non-free) subscription
    if (isAddon || plan.planType === 'ADDON') {
      const hasActiveSub = user.planId && !user.plan?.isFree && (user.isLifetimePlan || (user.planExpiresAt && user.planExpiresAt > new Date()));
      if (!hasActiveSub) {
        return NextResponse.json({ error: 'Add-on plans require an active paid subscription.' }, { status: 403 });
      }
    }

    // Determine effective billing cycle and base price
    let basePrice = plan.price;
    let selectedBillingCycle = duration || plan.billingCycle;

    if (duration && plan.durations) {
      const durationsConfig = plan.durations as any;
      if (durationsConfig[duration] && durationsConfig[duration].enabled) {
        basePrice = parseFloat(durationsConfig[duration].price || '0');
        selectedBillingCycle = duration;
      }
    }

    // For free or one-time plans, use plan's billing cycle
    if (plan.isFree) {
      basePrice = 0;
      selectedBillingCycle = 'LIFETIME';
    }

    let finalPrice = basePrice;
    let discountAmount = 0;

    // Apply coupon discount if provided
    if (couponCode) {
      const formattedCode = couponCode.trim().toUpperCase();
      const coupon = await prisma.coupon.findUnique({
        where: { code: formattedCode }
      });

      if (coupon && coupon.isActive) {
        const now = new Date();
        const validDates = now >= new Date(coupon.startDate) && now <= new Date(coupon.endDate);
        
        let validFirstTime = true;
        if (coupon.firstTimeOnly && user.planId) {
          const currentPlan = await prisma.plan.findUnique({
            where: { id: user.planId }
          });
          if (currentPlan && currentPlan.price > 0) {
            validFirstTime = false;
          }
        }

        if (validDates && validFirstTime) {
          if (coupon.discountType === 'FREE') {
            discountAmount = basePrice;
          } else if (coupon.discountType === 'PERCENTAGE') {
            discountAmount = (basePrice * coupon.discountValue) / 100;
          } else { // FLAT
            discountAmount = coupon.discountValue;
          }

          if (discountAmount > basePrice) {
            discountAmount = basePrice;
          }

          finalPrice = Math.max(0, basePrice - discountAmount);
        }
      }
    }

    // Determine plan expiry based on billing cycle
    const isLifetime = selectedBillingCycle === 'LIFETIME' || selectedBillingCycle === 'ONE_TIME';
    const planExpiresAt = isLifetime ? null : computePlanExpiresAt(selectedBillingCycle);
    const isAddonPlan = !!(isAddon || plan.planType === 'ADDON' || plan.planType === 'POLL_PACK' || plan.planType === 'SURVEY_PACK' || plan.planType === 'EXAM_PACK' || plan.planType === 'COMBO_PACK');

    // Build invoice notes
    const billingCycleLabel = formatBillingCycle(selectedBillingCycle);
    let invoiceNotes = `Plan: ${plan.name} | Billing: ${billingCycleLabel}`;
    if (isLifetime) invoiceNotes += ' | Lifetime Access — No future renewals required';
    if (planExpiresAt) invoiceNotes += ` | Valid until: ${planExpiresAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    if (discountAmount > 0 && couponCode) invoiceNotes += ` | Coupon: ${couponCode.toUpperCase()} (saved ${plan.currency === 'INR' ? '₹' : plan.currency === 'EUR' ? '€' : '$'}${discountAmount.toFixed(2)})`;
    if (isAddonPlan) invoiceNotes += ' | Add-On Plan';

    // Update user plan (only for non-add-on subscription plans)
    if (!isAddonPlan) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          planId: plan.id,
          planExpiresAt,
          planBillingCycle: selectedBillingCycle,
          isLifetimePlan: isLifetime,
        }
      });
    }

    // Create Invoice
    const invoice = await prisma.invoice.create({
      data: {
        userId: user.id,
        planId: plan.id,
        amountPaid: finalPrice,
        couponCode: couponCode || null,
        billingName: billingName || user.fullName || 'Valued Creator',
        billingAddress: billingAddress || 'N/A',
        billingCity: billingCity || 'N/A',
        billingZip: billingZip || 'N/A',
        billingPhone: billingPhone || null,
        billingCycle: selectedBillingCycle,
        isAddon: isAddonPlan,
        planExpiresAt,
        notes: invoiceNotes,
      }
    });

    // Process MLM Referral commission splits
    await distributeCommissions(user.id, finalPrice);

    return NextResponse.json({
      success: true,
      message: isLifetime
        ? `🎉 Welcome to ${plan.name} — Lifetime Access Activated!`
        : `Successfully subscribed to ${plan.name} (${billingCycleLabel})!`,
      planName: plan.name,
      finalPricePaid: finalPrice,
      billingCycle: selectedBillingCycle,
      planExpiresAt,
      isLifetime,
      invoiceId: invoice.id,
    });
  } catch (error: any) {
    console.error('Checkout Complete Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


async function distributeCommissions(userId: string, finalPrice: number) {
  if (finalPrice <= 0) return;

  let config = await prisma.siteConfig.findUnique({
    where: { key: 'global_referral_percentage' }
  });
  const l1Percentage = config ? parseFloat(config.value) : 10;
  const l2Percentage = l1Percentage / 2;
  const l3Percentage = l1Percentage / 4;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      referredById: true
    }
  });

  if (!user || !user.referredById) return;

  // Level 1 Referrer
  const l1Referrer = await prisma.user.findUnique({
    where: { id: user.referredById },
    select: { id: true, email: true, referredById: true }
  });
  if (l1Referrer) {
    const amount = (finalPrice * l1Percentage) / 100;
    if (amount > 0) {
      await addWalletFunds(l1Referrer.id, amount, `Level 1 Referral: User ${user.email} purchased plan`);
    }

    // Level 2 Referrer
    if (l1Referrer.referredById) {
      const l2Referrer = await prisma.user.findUnique({
        where: { id: l1Referrer.referredById },
        select: { id: true, email: true, referredById: true }
      });
      if (l2Referrer) {
        const amount2 = (finalPrice * l2Percentage) / 100;
        if (amount2 > 0) {
          await addWalletFunds(l2Referrer.id, amount2, `Level 2 Referral: Sub-user ${user.email} purchased plan`);
        }

        // Level 3 Referrer
        if (l2Referrer.referredById) {
          const l3Referrer = await prisma.user.findUnique({
            where: { id: l2Referrer.referredById },
            select: { id: true, email: true }
          });
          if (l3Referrer) {
            const amount3 = (finalPrice * l3Percentage) / 100;
            if (amount3 > 0) {
              await addWalletFunds(l3Referrer.id, amount3, `Level 3 Referral: Sub-user ${user.email} purchased plan`);
            }
          }
        }
      }
    }
  }
}

async function addWalletFunds(userId: string, amount: number, description: string) {
  let wallet = await prisma.wallet.findUnique({
    where: { userId }
  });

  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        userId,
        balance: 0,
        totalEarned: 0,
        totalWithdrawn: 0
      }
    });
  }

  await prisma.$transaction([
    prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: wallet.balance + amount,
        totalEarned: wallet.totalEarned + amount
      }
    }),
    prisma.transaction.create({
      data: {
        walletId: wallet.id,
        amount,
        type: 'EARNING',
        description
      }
    })
  ]);
}
