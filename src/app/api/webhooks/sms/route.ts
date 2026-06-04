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
    let rawBodyText = '';
    if (req.method === 'POST') {
      try {
        rawBodyText = await req.text();
        if (rawBodyText) {
          try {
            body = JSON.parse(rawBodyText);
          } catch (e) {
            // Try parsing url-encoded values
            const params = new URLSearchParams(rawBodyText);
            const parsed: any = {};
            params.forEach((val, key) => {
              parsed[key] = val;
            });
            if (Object.keys(parsed).length > 0 && Array.from(params.keys()).some(k => ['sender', 'text', 'message', 'from'].includes(k))) {
              body = parsed;
            } else {
              // Try form data parsing
              body = { rawText: rawBodyText };
            }
          }
        }
      } catch (err) {
        console.error('Webhook body read error:', err);
      }
    }

    // Extract fields dynamically from common webhook parameters
    const sender = (body.from || body.sender || body.phone || searchParams.get('from') || searchParams.get('sender') || searchParams.get('phone') || '').trim();
    const text = (body.text || body.message || body.msg || body.body || searchParams.get('text') || searchParams.get('message') || searchParams.get('msg') || searchParams.get('body') || '').trim();
    const creatorPhone = (body.creator || body.creatorPhone || searchParams.get('creator') || searchParams.get('creatorPhone') || '').trim();

    const cleanSender = sender.replace(/\D/g, '');
    const cleanText = text.toUpperCase();

    // Persist log for live diagnostics
    try {
      const debugKey = 'sms-gateway-debug';
      const existing = await prisma.siteConfig.findUnique({ where: { key: debugKey } });
      let logs = [];
      if (existing) {
        try {
          logs = JSON.parse(existing.value);
        } catch (e) {}
      }
      logs.push({
        timestamp: new Date().toISOString(),
        method: req.method,
        headers: {
          contentType: req.headers.get('content-type'),
          userAgent: req.headers.get('user-agent'),
        },
        rawBody: rawBodyText,
        parsedBody: body,
        query: Object.fromEntries(searchParams.entries()),
        resolved: {
          sender,
          text,
          creatorPhone,
          cleanSender,
          cleanText
        }
      });
      // Keep only last 20 logs
      logs = logs.slice(-20);
      await prisma.siteConfig.upsert({
        where: { key: debugKey },
        update: { value: JSON.stringify(logs) },
        create: { key: debugKey, value: JSON.stringify(logs) }
      });
    } catch (logErr) {
      console.error('Failed to log webhook debug data:', logErr);
    }

    if (!sender || !text) {
      return NextResponse.json({ error: 'sender and text/message are required parameters' }, { status: 400 });
    }

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
