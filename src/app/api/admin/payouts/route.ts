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

// GET: load pending and historical payouts, wallet stats, and global referral percentage
export async function GET() {
  try {
    const admin = await getAuthAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get payouts
    const payouts = await prisma.payoutRequest.findMany({
      include: {
        user: {
          select: { email: true, fullName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get global referral percentage config
    let config = await prisma.siteConfig.findUnique({
      where: { key: 'global_referral_percentage' }
    });
    if (!config) {
      config = await prisma.siteConfig.create({
        data: { key: 'global_referral_percentage', value: '10' }
      });
    }

    // Calculate quick monetization/referral stats
    const totalEarnedAggregate = await prisma.wallet.aggregate({
      _sum: {
        totalEarned: true,
        balance: true,
        totalWithdrawn: true
      }
    });

    const outstandingPending = payouts
      .filter(p => p.status === 'PENDING')
      .reduce((sum, p) => sum + p.amount, 0);

    const stats = {
      totalEarned: totalEarnedAggregate._sum.totalEarned || 0,
      currentOutstandingBalance: totalEarnedAggregate._sum.balance || 0,
      totalWithdrawn: totalEarnedAggregate._sum.totalWithdrawn || 0,
      pendingPayoutsCount: payouts.filter(p => p.status === 'PENDING').length,
      pendingPayoutsAmount: outstandingPending
    };

    return NextResponse.json({
      success: true,
      payouts,
      globalReferralPercentage: config.value,
      stats
    });
  } catch (error: any) {
    console.error('Fetch Payouts Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: update configuration OR process clear/reject payout actions
export async function POST(req: Request) {
  try {
    const admin = await getAuthAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Case 1: Update global referral percentage
    if (body.globalReferralPercentage !== undefined) {
      const pct = parseFloat(body.globalReferralPercentage);
      if (isNaN(pct) || pct < 0 || pct > 100) {
        return NextResponse.json({ error: 'Invalid percentage value. Must be between 0 and 100.' }, { status: 400 });
      }

      await prisma.siteConfig.upsert({
        where: { key: 'global_referral_percentage' },
        update: { value: pct.toString() },
        create: { key: 'global_referral_percentage', value: pct.toString() }
      });

      return NextResponse.json({ success: true, message: 'Global referral percentage updated' });
    }

    // Case 2: Process payout request status (clear/reject)
    const { payoutRequestId, action } = body;
    if (!payoutRequestId || !action) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const payout = await prisma.payoutRequest.findUnique({
      where: { id: payoutRequestId },
      include: { user: { include: { wallet: true } } }
    });

    if (!payout) {
      return NextResponse.json({ error: 'Payout request not found' }, { status: 404 });
    }

    if (payout.status !== 'PENDING') {
      return NextResponse.json({ error: 'Payout request is already processed' }, { status: 400 });
    }

    const wallet = payout.user.wallet;
    if (!wallet) {
      return NextResponse.json({ error: 'User wallet not found' }, { status: 404 });
    }

    if (action === 'CLEAR') {
      // Find the pending transaction first
      const pendingTx = await prisma.transaction.findFirst({
        where: {
          walletId: wallet.id,
          amount: -payout.amount,
          description: { contains: 'Pending' }
        },
        orderBy: { createdAt: 'desc' }
      });

      const txs: any[] = [
        prisma.payoutRequest.update({
          where: { id: payoutRequestId },
          data: { status: 'CLEARED' }
        }),
        prisma.wallet.update({
          where: { id: wallet.id },
          data: {
            totalWithdrawn: { increment: payout.amount }
          }
        })
      ];

      if (pendingTx) {
        txs.push(
          prisma.transaction.update({
            where: { id: pendingTx.id },
            data: {
              description: `Cleared payout via ${payout.method} (${payout.details})`
            }
          })
        );
      } else {
        txs.push(
          prisma.transaction.create({
            data: {
              walletId: wallet.id,
              amount: -payout.amount,
              type: 'PAYOUT',
              description: `Cleared payout via ${payout.method} (${payout.details})`
            }
          })
        );
      }

      await prisma.$transaction(txs);

      return NextResponse.json({ success: true, message: 'Payout request cleared successfully' });
    } else if (action === 'REJECT') {
      // Reject payout: return money back to user wallet balance
      await prisma.$transaction([
        prisma.payoutRequest.update({
          where: { id: payoutRequestId },
          data: { status: 'REJECTED' }
        }),
        prisma.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: { increment: payout.amount }
          }
        }),
        prisma.transaction.create({
          data: {
            walletId: wallet.id,
            amount: payout.amount,
            type: 'EARNING',
            description: `Refunded rejected payout request of ${payout.amount.toFixed(2)}`
          }
        })
      ]);

      return NextResponse.json({ success: true, message: 'Payout request rejected and refunded successfully' });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Process Payout Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
