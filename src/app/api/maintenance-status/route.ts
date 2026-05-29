import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const config = await prisma.siteConfig.findUnique({
      where: { key: 'maintenance_mode_enabled' },
    });

    return NextResponse.json({
      success: true,
      maintenance_mode: config?.value === 'true',
    });
  } catch (error: any) {
    console.error('Fetch Maintenance Status Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
