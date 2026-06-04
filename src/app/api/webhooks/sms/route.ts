import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  return handleSms(req);
}

export async function POST(req: Request) {
  return handleSms(req);
}

async function handleSms(req: Request) {
  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams;

    let body: any = {};
    if (req.method === 'POST') {
      try {
        body = await req.json();
      } catch (e) {
        try {
          const formData = await req.formData();
          body = Object.fromEntries(formData.entries());
        } catch (err) {}
      }
    }

    // Extract fields dynamically from common webhook parameters
    const sender = (body.from || body.sender || body.phone || searchParams.get('from') || searchParams.get('sender') || searchParams.get('phone') || '').trim();
    const text = (body.text || body.message || body.msg || body.body || searchParams.get('text') || searchParams.get('message') || searchParams.get('msg') || searchParams.get('body') || '').trim();
    const creatorPhone = (body.creator || body.creatorPhone || searchParams.get('creator') || searchParams.get('creatorPhone') || '').trim();

    if (!sender || !text) {
      return NextResponse.json({ error: 'sender and text/message are required parameters' }, { status: 400 });
    }

    const cleanSender = sender.replace(/\D/g, '');
    const cleanText = text.toUpperCase();

    // 1. Check if it's a test token for gateway setup
    if (cleanText.startsWith('#TEST-')) {
      const cleanCreator = creatorPhone ? creatorPhone.replace(/\D/g, '') : cleanSender;
      
      // Let's find all configs matching 'sms-test-token:*'
      const allConfigs = await prisma.siteConfig.findMany({
        where: {
          key: {
            startsWith: 'sms-test-token:'
          }
        }
      });

      // Find the one that matches the last 10 digits
      const matchedConfig = allConfigs.find(config => {
        const configPhone = config.key.replace('sms-test-token:', '');
        return configPhone.slice(-10) === cleanCreator.slice(-10);
      });

      if (matchedConfig && matchedConfig.value === `PENDING:${cleanText}`) {
        await prisma.siteConfig.update({
          where: { key: matchedConfig.key },
          data: { value: 'VERIFIED' }
        });

        const matchedPhone = matchedConfig.key.replace('sms-test-token:', '');

        // Trigger Socket.io notification
        const io = (global as any).io;
        if (io) {
          io.emit('sms-gateway-verified', { phone: matchedPhone, verified: true });
        }

        return NextResponse.json({ success: true, message: 'Gateway test verified successfully!' });
      }

      return NextResponse.json({ error: 'Test token not found or already verified' }, { status: 400 });
    }

    // 2. Otherwise, treat as a Voter verification token (e.g. #VOTE-9941)
    // Lookup allowed voter with matching active OTP code
    const candidates = await prisma.allowedVoter.findMany({
      where: {
        otp: cleanText,
        otpExpiresAt: { gte: new Date() }
      },
      include: {
        poll: true
      }
    });

    if (candidates.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired OTP token' }, { status: 404 });
    }

    // Find candidate where phone number matches cleanSender (compare last 10 digits to handle country code prefix differences)
    const voterMatch = candidates.find(c => {
      if (!c.phone) return false;
      const cleanVoterPhone = c.phone.replace(/\D/g, '');
      return cleanVoterPhone.slice(-10) === cleanSender.slice(-10);
    });

    if (!voterMatch) {
      return NextResponse.json({ error: 'Sender phone number does not match whitelisted voter for this token' }, { status: 403 });
    }

    // Mark as verified
    await prisma.allowedVoter.update({
      where: { id: voterMatch.id },
      data: {
        otp: 'VERIFIED',
        otpExpiresAt: new Date(Date.now() + 2 * 60 * 1000) // Keep verified status active for 2 minutes to allow polling/sync
      }
    });

    // Notify browser via socket
    const io = (global as any).io;
    if (io) {
      io.to(`poll-${voterMatch.pollId}`).emit('sms-verified', {
        voterId: voterMatch.id,
        identifier: voterMatch.identifier,
        success: true
      });
    }

    return NextResponse.json({ success: true, message: 'Voter verified successfully!' });

  } catch (error: any) {
    console.error('SMS Gateway Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
