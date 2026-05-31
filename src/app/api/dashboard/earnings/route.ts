import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/jwt';

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

// GET: Fetch wallet details, transactions, and payout requests for the logged-in user
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure wallet exists
    let wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: user.id,
          balance: 0.0,
          totalEarned: 0.0,
          totalWithdrawn: 0.0
        },
        include: {
          transactions: true
        }
      });
    }

    const payoutRequests = await prisma.payoutRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    // Fetch users who signed up using this user's referral code
    const referredUsers = await prisma.user.findMany({
      where: { referredById: user.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true,
        plan: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Fetch global referral percentage config and minimum withdrawal amount
    const [referralConfig, minWithdrawalConfig] = await Promise.all([
      prisma.siteConfig.findUnique({ where: { key: 'global_referral_percentage' } }),
      prisma.siteConfig.findUnique({ where: { key: 'min_withdrawal_amount' } })
    ]);
    const globalReferralPercentage = referralConfig ? parseFloat(referralConfig.value) : 10;
    const minimumWithdrawalAmount = minWithdrawalConfig ? parseFloat(minWithdrawalConfig.value) : 0;

    return NextResponse.json({
      success: true,
      wallet,
      payoutRequests,
      referredUsers,
      globalReferralPercentage,
      minimumWithdrawalAmount
    });
  } catch (error: any) {
    console.error('Fetch Dashboard Earnings Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Request a payout
export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, method, details } = await req.json();

    if (!amount || !method || !details) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const requestAmount = parseFloat(amount);
    if (isNaN(requestAmount) || requestAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than zero' }, { status: 400 });
    }

    // Enforce platform minimum withdrawal threshold
    const minWithdrawalConfig = await prisma.siteConfig.findUnique({
      where: { key: 'min_withdrawal_amount' }
    });
    const minimumWithdrawalAmount = minWithdrawalConfig ? parseFloat(minWithdrawalConfig.value) : 0;
    if (minimumWithdrawalAmount > 0 && requestAmount < minimumWithdrawalAmount) {
      return NextResponse.json({
        error: `Minimum withdrawal amount is ${minimumWithdrawalAmount.toFixed(2)}. Please request at least this amount.`
      }, { status: 400 });
    }

    let wallet = await prisma.wallet.findUnique({
      where: { userId: user.id }
    });

    if (!wallet || wallet.balance < requestAmount) {
      return NextResponse.json({ error: 'Insufficient wallet balance for withdrawal' }, { status: 400 });
    }

    // Process payout request: lock requested funds from user's wallet
    const [payoutRequest] = await prisma.$transaction([
      prisma.payoutRequest.create({
        data: {
          userId: user.id,
          amount: requestAmount,
          method,
          details,
          status: 'PENDING'
        }
      }),
      prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: requestAmount }
        }
      }),
      prisma.transaction.create({
        data: {
          walletId: wallet.id,
          amount: -requestAmount,
          type: 'PAYOUT',
          description: `Requested payout via ${method} (Pending clearance)`
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      message: 'Payout request submitted successfully. Awaiting admin clearance.',
      payoutRequest
    });
  } catch (error: any) {
    console.error('Create Payout Request Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
