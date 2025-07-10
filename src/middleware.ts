import { type NextRequest, NextResponse } from 'next/server'
import { isDevelopmentBypass, isDevelopmentSessionBypass } from '@/lib/env'

export async function middleware(request: NextRequest) {
  console.log('🔍 MIDDLEWARE: Processing request for:', request.nextUrl.pathname)

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
    '/api/booking-test',  // Webhook endpoint for Make.com integration
    '/test-booking-trigger'  // Test interface for webhook testing
  ]

  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route =>
    request.nextUrl.pathname === route ||
    request.nextUrl.pathname.startsWith('/api/test-') ||
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.includes('.') ||
    request.nextUrl.pathname.startsWith('/favicon')
  )

  console.log('🔍 MIDDLEWARE: isPublicRoute:', isPublicRoute, 'for path:', request.nextUrl.pathname)

  if (isPublicRoute) {
    console.log('🔍 MIDDLEWARE: Public route, allowing access')
    return NextResponse.next()
  }

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
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
