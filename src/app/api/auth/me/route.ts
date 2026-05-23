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

    // Retrieve fresh user info from the database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        approvedByAdmin: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
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
