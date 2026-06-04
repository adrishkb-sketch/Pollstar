import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { phone, token } = await req.json();

    if (!phone || !token) {
      return NextResponse.json({ error: 'Phone number and test token are required' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const cleanToken = token.trim().toUpperCase();

    const configKey = `sms-test-token:${cleanPhone}`;

    await prisma.siteConfig.upsert({
      where: { key: configKey },
      update: { value: `PENDING:${cleanToken}` },
      create: {
        key: configKey,
        value: `PENDING:${cleanToken}`
      }
    });

    return NextResponse.json({ success: true, message: 'Test token registered successfully.' });

  } catch (error: any) {
    console.error('Setup SMS Test Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
