import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/jwt';

export async function GET() {
  try {
    const maintenanceConfig = await prisma.siteConfig.findUnique({
      where: { key: 'maintenance_mode_enabled' }
    });

    const isMaintenance = maintenanceConfig?.value === 'true';

    // Verify if active user is an admin to enable bypass
    let isAdmin = false;
    try {
      const cookieStore = await cookies();
      const accessToken = cookieStore.get('accessToken')?.value;
      const refreshToken = cookieStore.get('refreshToken')?.value;

      let payload = accessToken ? verifyAccessToken(accessToken) : null;
      if (!payload && refreshToken) {
        payload = verifyRefreshToken(refreshToken);
      }

      if (payload && payload.role === 'ADMIN') {
        isAdmin = true;
      }
    } catch {
      // Ignored: not authenticated or token invalid
    }

    return NextResponse.json({
      success: true,
      maintenance: isMaintenance,
      isAdmin
    });
  } catch (error: any) {
    console.error('Maintenance Check API Error:', error);
    return NextResponse.json({ success: false, maintenance: false, isAdmin: false });
  }
}
