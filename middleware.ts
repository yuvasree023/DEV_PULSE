/**
 * Next.js App Router Middleware
 * 
 * Enforces authentication redirects across the DEV_PULSE application:
 * Unauthenticated -> /login -> /onboarding -> /dashboard
 * 
 * Works seamlessly with Vercel Edge Middleware and Next.js App Router deployments.
 */

// Simple lightweight mock or import when running under Next.js runtime
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Extract auth token and onboarding status from cookies or headers
  const authToken = request.cookies.get('devpulse_auth_token')?.value;
  const onboardingComplete = request.cookies.get('devpulse_onboarding_complete')?.value === 'true';

  // Public paths accessible without authentication
  const isPublicRoute =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/_next');

  // Rule 1: Unauthenticated visitors trying to access protected routes are redirected to /login
  if (!authToken && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Rule 2: Authenticated users visiting public landing / login page
  if (authToken && (pathname === '/' || pathname === '/login' || pathname === '/signup')) {
    if (!onboardingComplete) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Rule 3: Authenticated users who have not completed integration onboarding attempting to access /dashboard
  if (authToken && !onboardingComplete && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  // Rule 4: Authenticated users who have completed onboarding can access requested protected route
  return NextResponse.next();
}

// Route matcher configuration
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
