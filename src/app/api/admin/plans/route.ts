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

  return prisma.user.findUnique({
    where: { id: payload.userId },
  });
}

// GET: list all plans
export async function GET() {
  try {
    const admin = await getAuthAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const plans = await prisma.plan.findMany({
      include: {
        _count: {
          select: { users: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({ success: true, plans });
  } catch (error: any) {
    console.error('Fetch Plans Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: create a new plan
export async function POST(req: Request) {
  try {
    const admin = await getAuthAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      name, description, price, isFree, currency, billingCycle, planType,
      packQuantity, freePerks, comboTypes, badgeColor, badgeLabel,
      hasFreeTrial, freeTrialDays, freeTrialFeatures, pollSubtypes,
      isActive, features
    } = body;

    if (!name || !features) {
      return NextResponse.json({ error: 'Plan name and features are required.' }, { status: 400 });
    }

    const existing = await prisma.plan.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json({ error: 'Plan name must be unique.' }, { status: 409 });
    }

    const newPlan = await prisma.plan.create({
      data: {
        name,
        description: description || null,
        price: isFree ? 0 : parseFloat(price || '0'),
        isFree: !!isFree,
        currency: currency || 'USD',
        billingCycle: billingCycle || 'MONTHLY',
        planType: planType || 'SUBSCRIPTION',
        packQuantity: packQuantity ? parseInt(packQuantity) : null,
        freePerks: freePerks ? parseInt(freePerks) : 0,
        comboTypes: comboTypes || null,
        badgeColor: badgeColor || '#a855f7',
        badgeLabel: badgeLabel || null,
        hasFreeTrial: !!hasFreeTrial,
        freeTrialDays: freeTrialDays ? parseInt(freeTrialDays) : null,
        freeTrialFeatures: freeTrialFeatures || null,
        pollSubtypes: pollSubtypes || null,
        isActive: isActive !== false,
        features,
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'CREATE_PLAN',
        adminId: admin.id,
        details: `Admin created plan: "${name}" (${planType || 'SUBSCRIPTION'}, ${isFree ? 'FREE' : `${currency || 'USD'} ${price}`})`
      }
    });

    return NextResponse.json({ success: true, plan: newPlan });
  } catch (error: any) {
    console.error('Create Plan API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH: edit a plan (all fields editable anytime)
export async function PATCH(req: Request) {
  try {
    const admin = await getAuthAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { planId, bulkTransfer, targetPlanId, ...updateFields } = body;

    // Handle bulk user transfer between plans
    if (bulkTransfer && targetPlanId) {
      if (planId) {
        const count = await prisma.user.updateMany({
          where: { planId },
          data: { planId: targetPlanId },
        });

        await prisma.auditLog.create({
          data: {
            action: 'BULK_TRANSFER_PLAN',
            adminId: admin.id,
            details: `Admin transferred ${count.count} users from plan ${planId} to ${targetPlanId}`,
          }
        });

        return NextResponse.json({ success: true, transferred: count.count });
      } else if (body.userIds && Array.isArray(body.userIds)) {
        const count = await prisma.user.updateMany({
          where: { id: { in: body.userIds } },
          data: { planId: targetPlanId },
        });

        await prisma.auditLog.create({
          data: {
            action: 'BULK_TRANSFER_USER_LIST',
            adminId: admin.id,
            details: `Admin transferred ${count.count} selected users to plan ${targetPlanId}`,
          }
        });

        return NextResponse.json({ success: true, transferred: count.count });
      }
    }

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required.' }, { status: 400 });
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found.' }, { status: 404 });
    }

    // If changing name, ensure uniqueness
    if (updateFields.name && updateFields.name !== plan.name) {
      const existing = await prisma.plan.findUnique({ where: { name: updateFields.name } });
      if (existing) {
        return NextResponse.json({ error: 'Plan name must be unique.' }, { status: 409 });
      }
    }

    const data: any = {};
    if (updateFields.name !== undefined) data.name = updateFields.name;
    if (updateFields.description !== undefined) data.description = updateFields.description;
    if (updateFields.isFree !== undefined) {
      data.isFree = updateFields.isFree;
      if (updateFields.isFree) data.price = 0;
    }
    if (updateFields.price !== undefined && !updateFields.isFree) data.price = parseFloat(updateFields.price);
    if (updateFields.currency !== undefined) data.currency = updateFields.currency;
    if (updateFields.billingCycle !== undefined) data.billingCycle = updateFields.billingCycle;
    if (updateFields.planType !== undefined) data.planType = updateFields.planType;
    if (updateFields.packQuantity !== undefined) data.packQuantity = updateFields.packQuantity ? parseInt(updateFields.packQuantity) : null;
    if (updateFields.freePerks !== undefined) data.freePerks = parseInt(updateFields.freePerks) || 0;
    if (updateFields.comboTypes !== undefined) data.comboTypes = updateFields.comboTypes;
    if (updateFields.badgeColor !== undefined) data.badgeColor = updateFields.badgeColor;
    if (updateFields.badgeLabel !== undefined) data.badgeLabel = updateFields.badgeLabel;
    if (updateFields.hasFreeTrial !== undefined) data.hasFreeTrial = updateFields.hasFreeTrial;
    if (updateFields.freeTrialDays !== undefined) data.freeTrialDays = updateFields.freeTrialDays ? parseInt(updateFields.freeTrialDays) : null;
    if (updateFields.freeTrialFeatures !== undefined) data.freeTrialFeatures = updateFields.freeTrialFeatures;
    if (updateFields.pollSubtypes !== undefined) data.pollSubtypes = updateFields.pollSubtypes;
    if (updateFields.isActive !== undefined) data.isActive = updateFields.isActive;
    if (updateFields.features !== undefined) data.features = updateFields.features;

    const updatedPlan = await prisma.plan.update({
      where: { id: planId },
      data,
    });

    await prisma.auditLog.create({
      data: {
        action: 'MODIFY_PLAN',
        adminId: admin.id,
        details: `Admin modified plan: "${plan.name}" -> "${updatedPlan.name}" (${updatedPlan.planType}, ${updatedPlan.isFree ? 'FREE' : `${updatedPlan.currency} ${updatedPlan.price}`})`
      }
    });

    return NextResponse.json({ success: true, plan: updatedPlan });
  } catch (error: any) {
    console.error('Modify Plan API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: remove a plan
export async function DELETE(req: Request) {
  try {
    const admin = await getAuthAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const planId = searchParams.get('planId');

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required.' }, { status: 400 });
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found.' }, { status: 404 });
    }

    if (plan.name === 'Free') {
      return NextResponse.json({ error: 'The default Free plan cannot be deleted.' }, { status: 400 });
    }

    await prisma.plan.delete({ where: { id: planId } });

    await prisma.auditLog.create({
      data: {
        action: 'DELETE_PLAN',
        adminId: admin.id,
        details: `Admin deleted plan: "${plan.name}"`
      }
    });

    return NextResponse.json({ success: true, message: 'Plan deleted successfully.' });
  } catch (error: any) {
    console.error('Delete Plan API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
