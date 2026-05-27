import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendOTPEmail, sendLowPriorityAccessEmail } from '@/lib/nodemailer';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-pollstar-2026-auth-access';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pollId } = await params;
    const body = await req.json();
    const { step } = body;

    // Retrieve Poll Settings
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { settings: true },
    });

    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    if (poll.isOpenVoting) {
      return NextResponse.json(
        { error: 'Open voting polls do not require credential verification' },
        { status: 400 }
      );
    }

    if (poll.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: `This poll is currently not accepting votes. Status: ${poll.status}` },
        { status: 400 }
      );
    }

    // Step 0: Lookup Identifier and fetch associated confirmers/labels
    if (step === 'LOOKUP_IDENTIFIER') {
      const { identifier } = body;
      if (!identifier) {
        return NextResponse.json({ error: 'Unique identifier is required' }, { status: 400 });
      }

      const allowedVoter = await prisma.allowedVoter.findFirst({
        where: {
          pollId,
          identifier: { equals: identifier.trim(), mode: 'insensitive' },
        },
      });

      if (!allowedVoter) {
        return NextResponse.json({ 
          error: `Voter record not found. Please double-check your unique identifier value.` 
        }, { status: 404 });
      }

      if (allowedVoter.voted && poll.settings?.limitOneVotePerUser) {
        if (!poll.isResultPublic) {
          return NextResponse.json({ 
            error: 'Your unique identifier has already cast a vote in this poll. Results are private.' 
          }, { status: 403 });
        }
      }

      return NextResponse.json({
        success: true,
        voterId: allowedVoter.id,
        confirmer1Value: allowedVoter.confirmer1,
        confirmer2Value: allowedVoter.confirmer2 || '',
        emailValue: allowedVoter.email,
        labels: {
          identifierLabel: poll.settings?.identifierLabel || 'Roll Number',
          confirmer1Label: poll.settings?.confirmer1Label || 'Student Name',
          confirmer2Label: poll.settings?.confirmer2Label || 'Parent Name',
        }
      });
    }

    // Step 1: Check identifier/confirmers and request OTP
    if (step === 'REQUEST_OTP') {
      const { identifier, confirmer1, confirmer2, email, voterId } = body;

      if (!identifier || !confirmer1 || !email) {
        return NextResponse.json(
          { error: 'Identifier, Confirmer 1, and Email are compulsory fields' },
          { status: 400 }
        );
      }

      // Check AllowedVoter list
      const allowedVoter = await prisma.allowedVoter.findFirst({
        where: {
          pollId,
          ...(voterId ? { id: voterId } : {}),
          identifier: { equals: identifier.trim(), mode: 'insensitive' },
          confirmer1: { equals: confirmer1.trim(), mode: 'insensitive' },
          email: { equals: email.trim(), mode: 'insensitive' },
        },
      });

      if (!allowedVoter) {
        return NextResponse.json(
          { error: 'Credentials do not match the authorized voter list for this poll.' },
          { status: 401 }
        );
      }

      // If Confirmer 2 is configured in the database, double check it matches
      if (allowedVoter.confirmer2 && (!confirmer2 || allowedVoter.confirmer2.trim().toLowerCase() !== confirmer2.trim().toLowerCase())) {
        return NextResponse.json(
          { error: 'Secondary confirmation field value is incorrect.' },
          { status: 401 }
        );
      }

      // If user limits is checked and voter already voted
      if (allowedVoter.voted && poll.settings?.limitOneVotePerUser) {
        if (!poll.isResultPublic) {
          return NextResponse.json(
            { error: 'You have already cast your vote in this poll. Results are private.' },
            { status: 403 }
          );
        }
      }

      // Check if Creator granted a temporary 30-second OTP bypass
      if (
        allowedVoter.bypassOtpUntil &&
        allowedVoter.bypassOtpUntil > new Date()
      ) {
        const voterToken = jwt.sign(
          {
            voterId: allowedVoter.id,
            identifier: allowedVoter.identifier,
            email: allowedVoter.email,
            pollId,
          },
          JWT_SECRET,
          { expiresIn: '15m' }
        );
        return NextResponse.json({
          success: true,
          isBypassGranted: true,
          message:
            'OTP Bypass allowed for you by poll creator. Redirecting to ballot...',
          voterToken,
          hasVotedAlready: allowedVoter.voted,
        });
      }


      // If low priority, bypass OTP entirely!
      const isLowPriority = poll.description && /\[priority:\s*LOW\]/i.test(poll.description);
      if (isLowPriority) {
        const protocol = req.headers.get('x-forwarded-proto') || 'http';
        const host = req.headers.get('host') || 'localhost:3000';
        const pollUrl = `${protocol}://${host}/poll/${pollId}`;

        sendLowPriorityAccessEmail({
          email: allowedVoter.email,
          pollTitle: poll.title,
          pollUrl,
        }).catch((e) => console.error('Failed to send low priority access notice:', e));

        const voterToken = jwt.sign(
          {
            voterId: allowedVoter.id,
            identifier: allowedVoter.identifier,
            email: allowedVoter.email,
            pollId,
          },
          JWT_SECRET,
          { expiresIn: '15m' }
        );
        return NextResponse.json({
          success: true,
          isLowPriority: true,
          message: 'Identity confirmed! Access granted (Low Priority Mode).',
          voterToken,
          hasVotedAlready: allowedVoter.voted,
        });
      }

      // Generate 6-digit verification code
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Upsert OTP
      await prisma.oTP.upsert({
        where: { email: email.trim() },
        update: { otp, expiresAt },
        create: { email: email.trim(), otp, expiresAt },
      });

      // Dispatch mail
      await sendOTPEmail(email.trim(), otp);

      return NextResponse.json({
        success: true,
        message: 'Identity confirmed! An OTP has been sent to your email to verify and cast your vote.',
      });
    }

    // Step 2: Verify OTP code and issue a short-lived voterToken
    if (step === 'VERIFY_OTP') {
      const { email, otp } = body;

      if (!email || !otp) {
        return NextResponse.json(
          { error: 'Email and verification OTP are required' },
          { status: 400 }
        );
      }

      const otpRecord = await prisma.oTP.findUnique({
        where: { email: email.trim() },
      });

      if (!otpRecord || otpRecord.otp !== otp || new Date() > otpRecord.expiresAt) {
        return NextResponse.json(
          { error: 'Verification code is invalid or has expired' },
          { status: 400 }
        );
      }

      // Find the allowed voter record to bind details
      const allowedVoter = await prisma.allowedVoter.findFirst({
        where: {
          pollId,
          email: { equals: email.trim(), mode: 'insensitive' },
        },
      });

      if (!allowedVoter) {
        return NextResponse.json(
          { error: 'Authorized voter matching this email was not found' },
          { status: 404 }
        );
      }

      // Clean up OTP record
      await prisma.oTP.delete({
        where: { email: email.trim() },
      });

      // Generate short-lived (15 minutes) voter verification token
      const voterToken = jwt.sign(
        {
          voterId: allowedVoter.id,
          identifier: allowedVoter.identifier,
          email: allowedVoter.email,
          pollId,
        },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      return NextResponse.json({
        success: true,
        message: 'OTP verified successfully!',
        voterToken,
        hasVotedAlready: allowedVoter.voted,
      });
    }

    // Step 3: Check if bypass was granted (used for polling during SOS request)
    if (step === 'CHECK_BYPASS') {
      const { email, voterId } = body;
      if (!voterId && !email) {
        return NextResponse.json({ error: 'Voter reference is required' }, { status: 400 });
      }

      const allowedVoter = await prisma.allowedVoter.findFirst({
        where: {
          pollId,
          ...(voterId ? { id: voterId } : { email: { equals: email.trim(), mode: 'insensitive' } }),
        },
      });

      if (!allowedVoter) {
        return NextResponse.json({ error: 'Voter not found' }, { status: 404 });
      }

      if (
        allowedVoter.bypassOtpUntil &&
        allowedVoter.bypassOtpUntil > new Date()
      ) {
        if (allowedVoter.bypassRequested) {
          await prisma.allowedVoter.update({
            where: { id: allowedVoter.id },
            data: { bypassRequested: false }
          });
        }
        const voterToken = jwt.sign(
          {
            voterId: allowedVoter.id,
            identifier: allowedVoter.identifier,
            email: allowedVoter.email,
            pollId,
          },
          JWT_SECRET,
          { expiresIn: '15m' }
        );
        return NextResponse.json({
          success: true,
          granted: true,
          voterToken,
          hasVotedAlready: allowedVoter.voted,
        });
      }

      return NextResponse.json({ success: true, granted: false });
    }

    return NextResponse.json({ error: 'Invalid verification step' }, { status: 400 });
  } catch (error: any) {
    console.error('Verify Voter API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
