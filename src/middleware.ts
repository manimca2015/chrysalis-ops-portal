
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('__session')?.value;

  // Protect /app and /dashboard routes
  if (request.nextUrl.pathname.startsWith('/app') || request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Ideally we verify the token here with Admin SDK, but since Middleware runs in Edge
    // and Admin SDK is Node.js only, we rely on the secure httpOnly cookie set by our API.
    // For production-grade security, one could use jose to verify the JWT signature 
    // manually if the public keys are cached.
  }

  // Redirect from login if already has session
  if (request.nextUrl.pathname === '/login' && session) {
    return NextResponse.redirect(new URL('/app/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*', '/dashboard/:path*', '/login'],
};
