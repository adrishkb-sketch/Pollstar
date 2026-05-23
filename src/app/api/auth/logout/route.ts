import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });

  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = `HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=Lax; Path=/;`;

  // Overwrite cookies with zero Max-Age to delete them
  response.headers.append(
    'Set-Cookie',
    `accessToken=; ${cookieOptions} Max-Age=0`
  );
  response.headers.append(
    'Set-Cookie',
    `refreshToken=; ${cookieOptions} Max-Age=0`
  );

  return response;
}
