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

    const { email, password, referralCode, ref } = await req.json();

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

    let referredById: string | null = null;
    const refCode = referralCode || ref;
    if (refCode) {
      const referringUser = await prisma.user.findUnique({
        where: { referralCode: refCode },
      });
      if (referringUser) {
        referredById = referringUser.id;
      }
    }

    const uniqueReferralCode = 'ref_' + Math.random().toString(36).substring(2, 9);

    // Write or update user (if they signed up before but never verified)
    if (existingUser) {
      const updateData: any = { passwordHash };
      if (!existingUser.referralCode) {
        updateData.referralCode = uniqueReferralCode;
      }
      if (referredById && !existingUser.referredById) {
        updateData.referredById = referredById;
      }
      await prisma.user.update({
        where: { email },
        data: updateData,
      });
    } else {
      await prisma.user.create({
        data: {
          email,
          passwordHash,
          verified: false,
          approvedByAdmin: true,
          referralCode: uniqueReferralCode,
          referredById,
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

    // Send email — propagate failure so user sees real error
    try {
      await sendOTPEmail(email, otp);
    } catch (emailErr: any) {
      console.error('Signup OTP Email Send Failed:', emailErr);
      // Clean up the OTP record so user can retry cleanly
      await prisma.oTP.delete({ where: { email } }).catch(() => {});
      return NextResponse.json(
        { error: 'We could not deliver the verification email. Please check the email address and try again, or contact support.' },
        { status: 503 }
      );
    }

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
