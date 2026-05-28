import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '@/lib/prisma';
import { sendOTPEmail } from '@/lib/nodemailer';

export async function POST(req: Request) {
  try {
    // Check if new signups are suspended by admin
    const signupConfig = await prisma.siteConfig.findUnique({
      where: { key: 'new_signups_enabled' }
    });
    if (signupConfig && signupConfig.value === 'false') {
      return NextResponse.json(
        { error: 'Platform registration is currently suspended by system administrators.' },
        { status: 403 }
      );
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists and is verified
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser && existingUser.verified) {
      return NextResponse.json(
        { error: 'Email is already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Write or update user (if they signed up before but never verified)
    if (existingUser) {
      await prisma.user.update({
        where: { email },
        data: { passwordHash },
      });
    } else {
      await prisma.user.create({
        data: {
          email,
          passwordHash,
          verified: false,
          approvedByAdmin: false,
        },
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Save OTP to DB (upsert based on email)
    await prisma.oTP.upsert({
      where: { email },
      update: { otp, expiresAt },
      create: { email, otp, expiresAt },
    });

    // Send email
    await sendOTPEmail(email, otp);

    return NextResponse.json({
      success: true,
      message: 'OTP sent to email. Please verify within 5 minutes.',
    });
  } catch (error: any) {
    console.error('Signup Route Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
