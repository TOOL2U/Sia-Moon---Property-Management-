import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  console.log('🔍 MIDDLEWARE: Processing request for:', pathname)

  // Early return for booking webhooks and APIs - highest priority
  if (pathname === '/api/booking-test' || pathname.startsWith('/api/booking-test/') ||
      pathname === '/api/bookings' || pathname.startsWith('/api/bookings/')) {
    console.log('🔓 MIDDLEWARE: Booking API endpoint detected, allowing access immediately')
    return NextResponse.next()
  }

  // Early return for other API test endpoints and debug endpoints
  if (pathname.startsWith('/api/test-') ||
      pathname.startsWith('/api/test/') ||
      pathname.startsWith('/api/onboarding-webhook') ||
      pathname.startsWith('/api/debug/')) {
    console.log('🔓 MIDDLEWARE: Test/Debug API endpoint detected, allowing access')
    return NextResponse.next()
  }

  // Early return for Next.js internal routes and static assets
  if (pathname.startsWith('/_next/') || 
      pathname.includes('.') || 
      pathname.startsWith('/favicon') ||
      pathname.startsWith('/_vercel') ||
      pathname.startsWith('/static/')) {
    return NextResponse.next()
  }

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/signup',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/developers',
    '/status',
    '/test-browser-webhook',
    '/test-webhook',
    '/test-signup-webhook',
    '/test-signup-webhook-new',
    '/test-booking-trigger'
  ]

  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route => pathname === route)

  console.log('🔍 MIDDLEWARE: isPublicRoute:', isPublicRoute, 'for path:', pathname)

  if (isPublicRoute) {
    console.log('🔓 MIDDLEWARE: Public route, allowing access')
    return NextResponse.next()
  }

  // Development bypass check
  const isDevelopmentBypass = process.env.NODE_ENV === 'development' && 
                             process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true'
  
  const isDevelopmentSessionBypass = process.env.NODE_ENV === 'development' && 
                                   process.env.NEXT_PUBLIC_SESSION_BYPASS === 'true'

  console.log('🔍 MIDDLEWARE: isDevelopmentBypass:', isDevelopmentBypass)
  console.log('🔍 MIDDLEWARE: isDevelopmentSessionBypass:', isDevelopmentSessionBypass)

  if (isDevelopmentBypass || isDevelopmentSessionBypass) {
    if (isDevelopmentBypass) {
      console.warn('🚨 AUTH BYPASS ENABLED - DEVELOPMENT ONLY')
    }
    if (isDevelopmentSessionBypass) {
      console.warn('🔄 SESSION BYPASS ENABLED - DEVELOPMENT SSR SYNC WORKAROUND')
    }
    return NextResponse.next()
  }

  // Check for authentication token in cookies
  const authToken = request.cookies.get('auth-token')?.value
  const firebaseToken = request.cookies.get('firebase-auth-token')?.value

  console.log('🔍 MIDDLEWARE: Checking authentication tokens...')
  console.log('🔍 MIDDLEWARE: authToken:', authToken ? 'EXISTS' : 'MISSING')
  console.log('🔍 MIDDLEWARE: firebaseToken:', firebaseToken ? 'EXISTS' : 'MISSING')

  // For now, let's be more strict and require a valid, non-empty token
  const hasValidToken = (authToken && authToken.length > 10) || (firebaseToken && firebaseToken.length > 10)

  if (!hasValidToken) {
    console.log('🔒 MIDDLEWARE: No valid authentication token found, redirecting to login')
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Allow authenticated requests to proceed
  console.log('✅ MIDDLEWARE: Valid authentication token found, allowing access')
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
