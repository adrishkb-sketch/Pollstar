import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/jwt';
import { sendPollCollaboratorInvitationEmail } from '@/lib/nodemailer';
import { checkFeatureAccess } from '@/lib/featureGate';

// Helper to authenticate user from cookies
async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  const refreshToken = cookieStore.get('refreshToken')?.value;

  let payload = token ? verifyAccessToken(token) : null;

  if (!payload && refreshToken) {
    const refreshPayload = verifyRefreshToken(refreshToken);
    if (refreshPayload) {
      payload = {
        userId: refreshPayload.userId,
        email: refreshPayload.email,
        role: refreshPayload.role,
      };
    }
  }

  if (!payload) return null;

  return prisma.user.findUnique({
    where: { id: payload.userId },
  });
}

/**
 * GET: List all collaborators for a poll.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: pollId } = await params;
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
    });

    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    // Only creator or admin can view collaborators
    if (poll.creatorId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const collaborators = await prisma.pollCollaborator.findMany({
      where: { pollId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            verified: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ success: true, collaborators });
  } catch (error: any) {
    console.error('GET Collaborators Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST: Invite/add a collaborator by email.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: pollId } = await params;
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
    });

    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    // Only creator or admin can add collaborators
    if (poll.creatorId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate collaborations plan feature check for poll creator
    const creatorAccess = await checkFeatureAccess(poll.creatorId, 'collaborations');
    if (!creatorAccess.allowed) {
      return NextResponse.json({ error: "The poll creator's subscription plan does not support workspace collaborations. Please upgrade." }, { status: 403 });
    }

    const { email } = await req.json();
    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const targetEmail = email.trim().toLowerCase();

    // Cannot add self as a collaborator
    const creatorUser = await prisma.user.findUnique({
      where: { id: poll.creatorId },
    });

    if (creatorUser?.email.toLowerCase() === targetEmail) {
      return NextResponse.json({ error: 'You are the creator of this poll.' }, { status: 400 });
    }

    let targetUser = await prisma.user.findUnique({
      where: { email: targetEmail },
    });

    let isNewUser = false;
    if (!targetUser) {
      // Pre-create the user as unverified with a placeholder password hash
      targetUser = await prisma.user.create({
        data: {
          email: targetEmail,
          passwordHash: 'INVITED_PLACEHOLDER',
          verified: false,
          approvedByAdmin: false,
        },
      });
      isNewUser = true;
    }

    // Validate collaborations plan feature check for the invited user
    const inviteeAccess = await checkFeatureAccess(targetUser.id, 'collaborations');
    if (!inviteeAccess.allowed) {
      if (isNewUser) {
        await prisma.user.delete({ where: { id: targetUser.id } });
      }
      return NextResponse.json({ error: "The invited collaborator is not on a subscription plan that supports workspace collaborations. Both accounts must have collaborations enabled." }, { status: 403 });
    }

    // Check if already a collaborator
    const existingCollab = await prisma.pollCollaborator.findUnique({
      where: {
        pollId_userId: {
          pollId,
          userId: targetUser.id,
        },
      },
    });

    if (existingCollab) {
      return NextResponse.json({ error: 'User is already a collaborator.' }, { status: 400 });
    }

    // Create collaborator entry
    const newCollaborator = await prisma.pollCollaborator.create({
      data: {
        pollId,
        userId: targetUser.id,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            verified: true,
          },
        },
      },
    });

    // Send email invitation
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const isRegistered = !isNewUser && targetUser.verified;
    const inviteLink = isRegistered
      ? `${protocol}://${host}/dashboard`
      : `${protocol}://${host}/signup?email=${encodeURIComponent(targetEmail)}`;

    await sendPollCollaboratorInvitationEmail(targetEmail, poll.title, inviteLink, isRegistered);

    return NextResponse.json({ success: true, collaborator: newCollaborator });
  } catch (error: any) {
    console.error('POST Collaborator Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * PATCH: Update collaborator role or transfer ownership.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: pollId } = await params;
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
    });

    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    // Only creator or admin can update roles or transfer ownership
    if (poll.creatorId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, role } = await req.json();
    if (!userId || !role) {
      return NextResponse.json({ error: 'User ID and Role are required' }, { status: 400 });
    }

    if (role === 'OWNER') {
      // Execute Poll Ownership Transfer!
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { plan: true }
      });

      if (!targetUser) {
        return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
      }

      // Check collaborations plan feature check for both inviter and invitee
      const creatorAccess = await checkFeatureAccess(poll.creatorId, 'collaborations');
      const inviteeAccess = await checkFeatureAccess(targetUser.id, 'collaborations');
      if (!creatorAccess.allowed || !inviteeAccess.allowed) {
        return NextResponse.json({ error: 'Both users must have collaborations enabled on their subscription plans to transfer ownership.' }, { status: 403 });
      }

      // Check target user's quota limits for poll.pollType
      // Check target user's quota limits for poll.pollType
      if (targetUser.role !== 'ADMIN') {
        const plan = targetUser.plan;
        const isFreePlan = !plan || plan.name.toLowerCase() === 'free';

        // ── 1. Subscription Billing Cycle ────────────────────────────────────
        let cycleStart: Date;
        let cycleEnd: Date;

        if (isFreePlan || !targetUser.planExpiresAt) {
          const now = new Date();
          const ann = new Date(targetUser.createdAt);
          ann.setFullYear(now.getFullYear());
          ann.setMonth(now.getMonth());
          if (ann > now) ann.setMonth(ann.getMonth() - 1);
          cycleStart = ann;
          cycleEnd = new Date(ann);
          cycleEnd.setMonth(cycleEnd.getMonth() + 1);
        } else {
          const expEnd = new Date(targetUser.planExpiresAt);
          const expStart = new Date(targetUser.planExpiresAt);
          const cycle = (targetUser.planBillingCycle || 'MONTHLY').toUpperCase();
          if (cycle === 'MONTHLY') expStart.setMonth(expStart.getMonth() - 1);
          else if (cycle === 'QUARTERLY') expStart.setMonth(expStart.getMonth() - 3);
          else if (cycle === 'YEARLY') expStart.setMonth(expStart.getMonth() - 12);
          else if (cycle === 'TWO_YEAR' || cycle === 'TWO_YEARS') expStart.setMonth(expStart.getMonth() - 24);
          else expStart.setMonth(expStart.getMonth() - 1);
          cycleStart = expStart;
          cycleEnd = expEnd;
        }

        // Base limits from plan
        let subLimitPolls: number = isFreePlan ? 3 : (plan?.maxPolls ?? -1);
        let subLimitSurveys: number = isFreePlan ? 3 : (plan?.maxSurveys ?? -1);
        let subLimitExams: number = isFreePlan ? 3 : (plan?.maxExams ?? -1);

        // Override with duration-specific limits if available
        if (plan && plan.durations && !isFreePlan) {
          const durs = plan.durations as any;
          const cycle = targetUser.planBillingCycle || 'MONTHLY';
          if (durs[cycle] && durs[cycle].enabled) {
            const cfg = durs[cycle];
            if (cfg.maxPolls !== undefined && cfg.maxPolls !== '') subLimitPolls = parseInt(cfg.maxPolls);
            if (cfg.maxSurveys !== undefined && cfg.maxSurveys !== '') subLimitSurveys = parseInt(cfg.maxSurveys);
            if (cfg.maxExams !== undefined && cfg.maxExams !== '') subLimitExams = parseInt(cfg.maxExams);
          }
        }

        // Only apply subscription limits for SUBSCRIPTION plan type (not packs)
        const planType = plan?.planType || 'SUBSCRIPTION';
        const isSubBased = !['POLL_PACK', 'SURVEY_PACK', 'EXAM_PACK', 'COMBO_PACK'].includes(planType);

        // Count usage in current billing cycle (for subscription-based plans)
        const [subUsedPolls, subUsedSurveys, subUsedExams] = await Promise.all([
          prisma.poll.count({ where: { creatorId: targetUser.id, pollType: 'POLL', createdAt: { gte: cycleStart, lt: cycleEnd } } }),
          prisma.poll.count({ where: { creatorId: targetUser.id, pollType: 'SURVEY', createdAt: { gte: cycleStart, lt: cycleEnd } } }),
          prisma.poll.count({ where: { creatorId: targetUser.id, pollType: 'EXAM', createdAt: { gte: cycleStart, lt: cycleEnd } } }),
        ]);

        // ── 2. Pack / Addon quota (all-time, lifetime) ───────────────────────────
        const addonInvoices = await prisma.invoice.findMany({
          where: { userId: targetUser.id, isAddon: true },
          include: { plan: true },
        });

        let packAllowedPolls = 0;
        let packAllowedSurveys = 0;
        let packAllowedExams = 0;

        const nowTime = new Date();

        for (const inv of addonInvoices) {
          const p = inv.plan;
          if (!p) continue;

          // Check if this pack is still valid
          const isValid = !inv.planExpiresAt || new Date(inv.planExpiresAt) > nowTime;
          if (!isValid) continue;

          const qty = (p.packQuantity ?? 0) + (p.freePerks ?? 0);

          switch (p.planType) {
            case 'POLL_PACK':
              packAllowedPolls += qty;
              break;
            case 'SURVEY_PACK':
              packAllowedSurveys += qty;
              break;
            case 'EXAM_PACK':
              packAllowedExams += qty;
              break;
            case 'COMBO_PACK': {
              const types: string[] = Array.isArray(p.comboTypes) ? (p.comboTypes as string[]) : [];
              const perType = types.length > 0 ? Math.floor(qty / types.length) : 0;
              if (types.includes('POLL')) packAllowedPolls += perType;
              if (types.includes('SURVEY')) packAllowedSurveys += perType;
              if (types.includes('EXAM')) packAllowedExams += perType;
              break;
            }
            case 'ADDON': {
              if (p.maxPolls && p.maxPolls > 0) packAllowedPolls += p.maxPolls;
              if (p.maxSurveys && p.maxSurveys > 0) packAllowedSurveys += p.maxSurveys;
              if (p.maxExams && p.maxExams > 0) packAllowedExams += p.maxExams;
              break;
            }
            default:
              break;
          }
        }

        // All-time usage counts (for pack/entity quota tracking)
        const [activePolls, activeSurveys, activeExams, deletedPolls, deletedSurveys, deletedExams] = await Promise.all([
          prisma.poll.count({ where: { creatorId: targetUser.id, pollType: 'POLL' } }),
          prisma.poll.count({ where: { creatorId: targetUser.id, pollType: 'SURVEY' } }),
          prisma.poll.count({ where: { creatorId: targetUser.id, pollType: 'EXAM' } }),
          prisma.deletedPoll.count({ where: { creatorId: targetUser.id, pollType: 'POLL' } }),
          prisma.deletedPoll.count({ where: { creatorId: targetUser.id, pollType: 'SURVEY' } }),
          prisma.deletedPoll.count({ where: { creatorId: targetUser.id, pollType: 'EXAM' } }),
        ]);

        const allTimePolls   = Math.max(activePolls,   deletedPolls);
        const allTimeSurveys = Math.max(activeSurveys, deletedSurveys);
        const allTimeExams   = Math.max(activeExams,   deletedExams);

        // ── 3. Build combined totals ─────────────────────────────────────────────
        const totalAllowedPolls = isSubBased
          ? (subLimitPolls === -1 ? -1 : subLimitPolls + packAllowedPolls)
          : packAllowedPolls;
        const totalAllowedSurveys = isSubBased
          ? (subLimitSurveys === -1 ? -1 : subLimitSurveys + packAllowedSurveys)
          : packAllowedSurveys;
        const totalAllowedExams = isSubBased
          ? (subLimitExams === -1 ? -1 : subLimitExams + packAllowedExams)
          : packAllowedExams;

        const totalUsedPolls = isSubBased ? subUsedPolls : allTimePolls;
        const totalUsedSurveys = isSubBased ? subUsedSurveys : allTimeSurveys;
        const totalUsedExams = isSubBased ? subUsedExams : allTimeExams;

        // Perform validation check for the transferred poll's type
        const targetType = poll.pollType === 'SURVEY' ? 'SURVEY' : poll.pollType === 'EXAM' ? 'EXAM' : 'POLL';
        const allowed = targetType === 'SURVEY' ? totalAllowedSurveys : targetType === 'EXAM' ? totalAllowedExams : totalAllowedPolls;
        const used = targetType === 'SURVEY' ? totalUsedSurveys : targetType === 'EXAM' ? totalUsedExams : totalUsedPolls;
        const activeLabel = targetType === 'SURVEY' ? 'surveys' : targetType === 'EXAM' ? 'exams' : 'polls';

        if (allowed !== -1 && used >= allowed) {
          return NextResponse.json({
            error: `Target user has reached their maximum quota of ${allowed} ${activeLabel}. Ownership transfer failed.`
          }, { status: 403 });
        }
      }

      // Atomically transfer ownership and set original owner as EDITOR
      await prisma.$transaction([
        prisma.pollCollaborator.deleteMany({
          where: { pollId, userId: targetUser.id }
        }),
        prisma.poll.update({
          where: { id: pollId },
          data: { creatorId: targetUser.id }
        }),
        prisma.pollCollaborator.upsert({
          where: {
            pollId_userId: { pollId, userId: user.id }
          },
          update: { role: 'EDITOR' },
          create: { pollId, userId: user.id, role: 'EDITOR' }
        })
      ]);

      return NextResponse.json({ success: true, message: 'Poll ownership successfully transferred to target user. You have been assigned as an Editor.' });
    } else {
      // Standard role update (VIEWER or EDITOR)
      const updatedCollaborator = await prisma.pollCollaborator.update({
        where: {
          pollId_userId: { pollId, userId }
        },
        data: { role },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              verified: true,
            }
          }
        }
      });

      return NextResponse.json({ success: true, collaborator: updatedCollaborator });
    }
  } catch (error: any) {
    console.error('PATCH Collaborator Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE: Remove a collaborator.
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: pollId } = await params;
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
    });

    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    // Only creator or admin can remove collaborators
    if (poll.creatorId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await prisma.pollCollaborator.delete({
      where: {
        pollId_userId: {
          pollId,
          userId,
        },
      },
    });

    return NextResponse.json({ success: true, message: 'Collaborator removed successfully' });
  } catch (error: any) {
    console.error('DELETE Collaborator Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
