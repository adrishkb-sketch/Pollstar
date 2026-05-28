import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken, verifyRefreshToken, generateAccessToken } from '@/lib/jwt';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    const refreshToken = cookieStore.get('refreshToken')?.value;

    let payload = accessToken ? verifyAccessToken(accessToken) : null;
    let newAccessToken: string | null = null;

    // Check refresh token fallback if access token is invalid
    if (!payload && refreshToken) {
      const refreshPayload = verifyRefreshToken(refreshToken);
      if (refreshPayload) {
        payload = {
          userId: refreshPayload.userId,
          email: refreshPayload.email,
          role: refreshPayload.role,
        };
        newAccessToken = generateAccessToken(payload);
      }
    }

    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized session' },
        { status: 401 }
      );
    }

    // Ensure default plan exists
    let freePlan = await prisma.plan.findUnique({
      where: { name: 'Free' }
    });

    const basicFreeFeatures = {
      openPublicPolls: true,
      realTimeLiveResults: true,
      singleChoiceMultiSelect: true,
      multipleQuestionTypes: true,
      anonymousResponses: true,
      mcqSingleCorrect: true,
      trueOrFalse: true,
      premiumDarkMode: true
    };

    if (!freePlan) {
      freePlan = await prisma.plan.create({
        data: {
          name: 'Free',
          description: 'Our standard free tier with access to all basic features.',
          price: 0.0,
          billingCycle: 'MONTHLY',
          features: basicFreeFeatures
        }
      });
    } else {
      // Force update Free plan features to the new basic set to align everything
      freePlan = await prisma.plan.update({
        where: { id: freePlan.id },
        data: {
          features: basicFreeFeatures,
          description: 'Our standard free tier with access to all basic features.'
        }
      });
    }

    // Retrieve fresh user info from the database
    let user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        plan: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Auto-heal missing referral code
    if (!user.referralCode) {
      const uniqueReferralCode = 'ref_' + Math.random().toString(36).substring(2, 9);
      user = await prisma.user.update({
        where: { id: user.id },
        data: { referralCode: uniqueReferralCode },
        include: { plan: true }
      });
    }

    // Auto-upgrade if email matches whitelisted domain mapping
    const mappings = await prisma.emailDomainMapping.findMany({
      include: { plan: true }
    });

    let autoUpgradePlan = null;
    for (const mapping of mappings) {
      const domainSuffix = mapping.domain.startsWith('@') ? mapping.domain : `@${mapping.domain}`;
      if (user.email.toLowerCase().endsWith(domainSuffix.toLowerCase())) {
        autoUpgradePlan = mapping.plan;
        break;
      }
    }

    if (autoUpgradePlan && (!user.planId || user.plan?.name === 'Free') && user.planId !== autoUpgradePlan.id) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { planId: autoUpgradePlan.id },
        include: { plan: true }
      });
    }

    // Auto-assign Free plan if still missing planId
    if (!user.planId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { planId: freePlan.id },
        include: { plan: true }
      });
    }

    // Check if maintenance mode is active
    const maintenanceConfig = await prisma.siteConfig.findUnique({
      where: { key: 'maintenance_mode_enabled' }
    });
    if (maintenanceConfig && maintenanceConfig.value === 'true' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { maintenance: true, error: 'Platform is currently undergoing scheduled maintenance.' },
        { status: 503 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        approved: user.approvedByAdmin,
        createdAt: user.createdAt,
        profileCompleted: user.profileCompleted,
        fullName: user.fullName,
        avatar: user.avatar,
        phoneNumber: user.phoneNumber,
        occupation: user.occupation,
        institution: user.institution,
        studyField: user.studyField,
        gradYear: user.gradYear,
        jobTitle: user.jobTitle,
        industry: user.industry,
        educatorSubject: user.educatorSubject,
        educatorDept: user.educatorDept,
        researchDomain: user.researchDomain,
        researchPos: user.researchPos,
        otherDetail: user.otherDetail,
        bio: user.bio,
        gender: user.gender,
        primaryPurpose: user.primaryPurpose,
        verificationStatus: user.verificationStatus,
        verificationReason: user.verificationReason,
        verificationDocUrl: user.verificationDocUrl,
        isVerifiedUser: user.isVerifiedUser,
        isBanned: user.isBanned,
        isSuspended: user.isSuspended,
        suspensionUntil: user.suspensionUntil,
        suspensionReason: user.suspensionReason,
        isActivityRestricted: user.isActivityRestricted,
        plan: user.plan,
        referralCode: user.referralCode,
      },
    });

    // Write rotated access token back to client if generated
    if (newAccessToken) {
      const isProduction = process.env.NODE_ENV === 'production';
      const cookieOptions = `HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=Lax; Path=/;`;
      response.headers.append(
        'Set-Cookie',
        `accessToken=${newAccessToken}; ${cookieOptions} Max-Age=3600`
      );
    }

    return response;
  } catch (error) {
    console.error('Me Auth Route Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
