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
    if (!freePlan) {
      freePlan = await prisma.plan.create({
        data: {
          name: 'Free',
          description: 'Our standard free tier with access to all basic and premium features.',
          price: 0.0,
          billingCycle: 'MONTHLY',
          features: {
            singleChoice: true,
            bordaCount: true,
            knockoutBracket: true,
            multipageSurveys: true,
            sentimentAnalysis: true,
            dropOffTracking: true,
            crossTabulation: true,
            geolocations: true,
            domainLocking: true,
            otpVerification: true,
            collaborations: true,
            inboxMessages: true,
            dataExport: true
          }
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

    // Auto-assign Free plan if missing
    if (!user.planId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { planId: freePlan.id },
        include: { plan: true }
      });
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
