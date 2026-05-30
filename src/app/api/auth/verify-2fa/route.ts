import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Fetch OTP record
    const otpRecord = await prisma.oTP.findUnique({
      where: { email: cleanEmail }
    });

    if (!otpRecord) {
      return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 400 });
    }

    // 2. Validate code matches
    if (otpRecord.otp !== otp) {
      return NextResponse.json({ error: 'Incorrect verification code. Please check your email.' }, { status: 400 });
    }

    // 3. Check expiration
    if (new Date() > otpRecord.expiresAt) {
      await prisma.oTP.delete({ where: { email: cleanEmail } });
      return NextResponse.json({ error: 'Verification code has expired. Please log in again to request a new code.' }, { status: 400 });
    }

    // 4. Delete the OTP record upon success
    await prisma.oTP.delete({ where: { email: cleanEmail } });

    // 5. Find the user
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    // 6. Generate access & refresh tokens
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // 7. Save tokens in HTTPOnly cookies
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        approved: user.approvedByAdmin,
      },
    });

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = `HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=Lax; Path=/;`;

    response.headers.append(
      'Set-Cookie',
      `accessToken=${accessToken}; ${cookieOptions} Max-Age=3600` // 1h
    );
    response.headers.append(
      'Set-Cookie',
      `refreshToken=${refreshToken}; ${cookieOptions} Max-Age=604800` // 7d
    );

    return response;
  } catch (error: any) {
    console.error('Verify 2FA Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
