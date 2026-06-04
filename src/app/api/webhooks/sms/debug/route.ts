import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const config = await prisma.siteConfig.findUnique({
      where: { key: 'sms-gateway-debug' }
    });
    const logs = config ? JSON.parse(config.value) : [];
    return NextResponse.json({ logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
