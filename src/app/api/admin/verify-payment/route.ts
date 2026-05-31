import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/jwt';

import { computePlanExpiresAt } from '@/lib/planExpiry';

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

export async function POST(req: Request) {
  try {
    const admin = await getAuthAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoiceId, action, rejectionReason } = await req.json();

    if (!invoiceId || !action) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { plan: true, user: true }
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.paymentStatus !== 'PENDING') {
      return NextResponse.json({ error: 'This invoice has already been processed' }, { status: 400 });
    }

    if (action === 'APPROVE') {
      // Re-calculate the plan expires at starting from NOW (approval time)
      const isLifetime = invoice.billingCycle === 'LIFETIME' || invoice.billingCycle === 'ONE_TIME';
      let planExpiresAt: Date | null = null;
      
      if (!isLifetime) {
        if (invoice.isAddon) {
          // If it's an addon, it co-terminates with the user's active subscription plan
          const user = await prisma.user.findUnique({
            where: { id: invoice.userId },
            select: { planExpiresAt: true }
          });
          planExpiresAt = user?.planExpiresAt || null;
        } else {
          // Calculate standard subscription duration starting from NOW
          planExpiresAt = computePlanExpiresAt(invoice.billingCycle);
        }
      }

      // 1. Mark invoice as COMPLETED, update its expiration date, and clear screenshot
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { 
          paymentStatus: 'COMPLETED',
          planExpiresAt,
          screenshotUrl: null  // Remove screenshot after verification to save storage
        }
      });

      // 2. Activate plan for user (if it is not an add-on plan)
      if (!invoice.isAddon) {
        await prisma.user.update({
          where: { id: invoice.userId },
          data: {
            planId: invoice.planId,
            planExpiresAt: planExpiresAt,
            planBillingCycle: invoice.billingCycle,
            isLifetimePlan: isLifetime
          }
        });
      }

      // 3. Process MLM splits
      await distributeCommissions(invoice.userId, invoice.amountPaid);

    } else if (action === 'REJECT') {
      // Mark invoice as REJECTED with admin-provided reason, and clear screenshot
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          paymentStatus: 'REJECTED',
          rejectionReason: rejectionReason || 'Payment could not be verified.',
          screenshotUrl: null  // Remove screenshot after rejection to save storage
        }
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Verify Payment API Error:', error);
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

  const l1Referrer = await prisma.user.findUnique({
    where: { id: user.referredById },
    select: { id: true, email: true, referredById: true }
  });
  if (l1Referrer) {
    const amount = (finalPrice * l1Percentage) / 100;
    if (amount > 0) {
      await addWalletFunds(l1Referrer.id, amount, `Level 1 Referral: User ${user.email} purchased plan`);
    }

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
