import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Retrieve OTP
    const otpRecord = await prisma.oTP.findUnique({
      where: { email: cleanEmail },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'No verification code found for this email' },
        { status: 400 }
      );
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Check expiration
    if (new Date() > otpRecord.expiresAt) {
      return NextResponse.json(
        { error: 'Verification code has expired' },
        { status: 400 }
      );
    }

    // Verify user in database
    const user = await prisma.user.update({
      where: { email: cleanEmail },
      data: { verified: true },
    });

    // Delete OTP record
    await prisma.oTP.delete({
      where: { email: cleanEmail },
    });

    // Create session payload
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Set secure HTTP-only cookies
    const response = NextResponse.json({
      success: true,
      message: 'Account verified successfully!',
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
    console.error('Verify Route Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
