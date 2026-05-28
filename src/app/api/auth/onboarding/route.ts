import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/jwt';

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

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      fullName,
      avatar,
      phoneNumber,
      occupation,
      institution,
      studyField,
      gradYear,
      jobTitle,
      industry,
      educatorSubject,
      educatorDept,
      researchDomain,
      researchPos,
      otherDetail,
      bio,
      gender,
    } = body;

    if (!fullName || !avatar || !phoneNumber || !occupation || !gender) {
      return NextResponse.json({ error: 'Missing compulsory profile fields' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        fullName,
        avatar,
        phoneNumber,
        occupation,
        gender,
        institution: institution || null,
        studyField: studyField || null,
        gradYear: gradYear ? parseInt(gradYear, 10) : null,
        jobTitle: jobTitle || null,
        industry: industry || null,
        educatorSubject: educatorSubject || null,
        educatorDept: educatorDept || null,
        researchDomain: researchDomain || null,
        researchPos: researchPos || null,
        otherDetail: otherDetail || null,
        bio: bio || null,
        profileCompleted: true,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error('Onboarding API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
