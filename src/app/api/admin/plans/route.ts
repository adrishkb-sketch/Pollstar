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

    const { name, description, price, billingCycle, features } = await req.json();

    if (!name || price === undefined || !billingCycle || !features) {
      return NextResponse.json({ error: 'Missing required plan settings parameters' }, { status: 400 });
    }

    const existing = await prisma.plan.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json({ error: 'Plan name must be unique' }, { status: 409 });
    }

    const newPlan = await prisma.plan.create({
      data: {
        name,
        description: description || null,
        price: parseFloat(price),
        billingCycle,
        features
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'CREATE_PLAN',
        adminId: admin.id,
        details: `Admin created new subscription plan: "${name}" (${billingCycle}, price: ${price})`
      }
    });

    return NextResponse.json({ success: true, plan: newPlan });
  } catch (error: any) {
    console.error('Create Plan API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH: edit a plan
export async function PATCH(req: Request) {
  try {
    const admin = await getAuthAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId, name, description, price, billingCycle, features } = await req.json();

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // If changing name, ensure uniqueness
    if (name && name !== plan.name) {
      const existing = await prisma.plan.findUnique({ where: { name } });
      if (existing) {
        return NextResponse.json({ error: 'Plan name must be unique' }, { status: 409 });
      }
    }

    const updatedPlan = await prisma.plan.update({
      where: { id: planId },
      data: {
        name: name || undefined,
        description: description !== undefined ? description : undefined,
        price: price !== undefined ? parseFloat(price) : undefined,
        billingCycle: billingCycle || undefined,
        features: features || undefined
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'MODIFY_PLAN',
        adminId: admin.id,
        details: `Admin modified subscription plan: "${plan.name}" -> new settings: "${updatedPlan.name}" (${updatedPlan.billingCycle}, price: ${updatedPlan.price})`
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
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    if (plan.name === 'Free') {
      return NextResponse.json({ error: 'The default Free plan cannot be deleted' }, { status: 400 });
    }

    await prisma.plan.delete({ where: { id: planId } });

    await prisma.auditLog.create({
      data: {
        action: 'DELETE_PLAN',
        adminId: admin.id,
        details: `Admin deleted subscription plan: "${plan.name}"`
      }
    });

    return NextResponse.json({ success: true, message: 'Plan deleted successfully' });
  } catch (error: any) {
    console.error('Delete Plan API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
