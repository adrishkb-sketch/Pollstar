import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const configKey = `sms-test-token:${cleanPhone}`;

    const config = await prisma.siteConfig.findUnique({
      where: { key: configKey }
    });

    if (!config) {
      return NextResponse.json({ verified: false, error: 'No test registered' });
    }

    if (config.value === 'VERIFIED') {
      return NextResponse.json({ verified: true });
    }

    return NextResponse.json({ verified: false });

  } catch (error: any) {
    console.error('Check SMS Test Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
