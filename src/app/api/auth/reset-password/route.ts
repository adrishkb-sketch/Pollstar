import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '@/lib/prisma';
import { sendResetPasswordEmail } from '@/lib/nodemailer';

/**
 * POST: Generate a 6-digit OTP verification code for password reset and email it.
 */
export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: 'Valid email address is required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      // Security best practice: don't reveal if user exists, return mock success
      return NextResponse.json({
        success: true,
        message: 'If a matching account exists, a reset code has been dispatched to your email.',
      });
    }

    // Generate 6-digit code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    // Upsert OTP record
    await prisma.oTP.upsert({
      where: { email: cleanEmail },
      update: { otp, expiresAt, createdAt: new Date() },
      create: { email: cleanEmail, otp, expiresAt },
    });

    // Send reset email
    await sendResetPasswordEmail(user.email, otp);

    return NextResponse.json({
      success: true,
      message: 'If a matching account exists, a reset code has been dispatched to your email.',
    });
  } catch (error: any) {
    console.error('Reset Password POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * PATCH: Verify the OTP reset code and securely hash & update user's password.
 */
export async function PATCH(req: Request) {
  try {
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: 'Email, verification code, and new password are required.' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must contain at least 6 characters.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    // Verify OTP
    const otpRecord = await prisma.oTP.findUnique({
      where: { email: cleanEmail },
    });

    if (!otpRecord || otpRecord.otp !== cleanOtp) {
      return NextResponse.json({ error: 'Invalid verification code.' }, { status: 400 });
    }

    if (new Date() > new Date(otpRecord.expiresAt)) {
      return NextResponse.json({ error: 'Verification code has expired. Please request a new one.' }, { status: 400 });
    }

    // Update user password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { email: cleanEmail },
      data: { passwordHash },
    });

    // Clean up OTP record
    await prisma.oTP.delete({
      where: { email: cleanEmail },
    });

    return NextResponse.json({
      success: true,
      message: 'Your password has been successfully reset! You can now log in.',
    });
  } catch (error: any) {
    console.error('Reset Password PATCH Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
