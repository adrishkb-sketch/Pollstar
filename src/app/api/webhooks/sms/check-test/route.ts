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
    
    // Find all test token configs
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
      return configPhone.slice(-10) === cleanPhone.slice(-10);
    });

    if (!matchedConfig) {
      return NextResponse.json({ verified: false, error: 'No test registered' });
    }

    if (matchedConfig.value === 'VERIFIED') {
      return NextResponse.json({ verified: true });
    }

    return NextResponse.json({ verified: false });

  } catch (error: any) {
    console.error('Check SMS Test Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
