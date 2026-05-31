import { NextResponse } from 'next/server';
import { getCookieOptions } from '@/lib/jwt';

export async function POST(req: Request) {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });

  const hostHeader = req.headers.get('host');
  const cookieOptions = getCookieOptions(hostHeader);

  // Overwrite cookies with maxAge=0 to delete them
  response.cookies.set('accessToken', '', { ...cookieOptions, maxAge: 0 });
  response.cookies.set('refreshToken', '', { ...cookieOptions, maxAge: 0 });

  return response;
}
