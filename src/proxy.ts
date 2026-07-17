import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decodeToken } from '@/lib/auth';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('voluntrip_session')?.value;
  const { pathname } = request.nextUrl;

  // Static files, api routes (except protected API), public shares
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const isPublicRoute = pathname === '/login' || pathname.startsWith('/share');
  const isApiRoute = pathname.startsWith('/api');
  const isApiAuthRoute = pathname.startsWith('/api/auth');
  const isPublicApiRoute = pathname.startsWith('/api/share') && request.method === 'GET'; // GET share is public

  // Validate session status
  let isSessionValid = false;
  if (token) {
    const payload = decodeToken(token);
    if (payload && payload.exp && payload.exp * 1000 > Date.now()) {
      isSessionValid = true;
    }
  }

  // Handle protected web pages
  if (!isPublicRoute && !isApiRoute) {
    if (!isSessionValid) {
      // Redirect to login if accessing dashboard/trips without session
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
    // Root path "/" redirects to "/dashboard" if session is valid
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Redirect to dashboard if logged-in user tries to access /login or /
  if (pathname === '/login' || pathname === '/') {
    if (isSessionValid) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Handle protected API endpoints
  if (isApiRoute && !isApiAuthRoute && !isPublicApiRoute) {
    if (!isSessionValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
