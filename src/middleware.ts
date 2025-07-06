import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/signup',
    '/developers',
    '/status'
  ]

  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route =>
    request.nextUrl.pathname === route ||
    request.nextUrl.pathname.startsWith('/api/test-') ||
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.includes('.') ||
    request.nextUrl.pathname.startsWith('/favicon')
  )

  // Allow bypass only in development with explicit env var
  const isDevelopmentBypass = process.env.NODE_ENV === 'development' &&
                             process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true' &&
                             process.env.NEXT_PUBLIC_VERCEL_ENV !== 'production'

  // Temporary development session bypass for SSR sync issues
  const isDevelopmentSessionBypass = process.env.NODE_ENV === 'development' &&
                                   process.env.NEXT_PUBLIC_DEV_SESSION_BYPASS === 'true'

  if (isPublicRoute || isDevelopmentBypass || isDevelopmentSessionBypass) {
    if (isDevelopmentBypass) {
      console.warn('🚨 AUTH BYPASS ENABLED - DEVELOPMENT ONLY')
    }
    if (isDevelopmentSessionBypass) {
      console.warn('🔄 SESSION BYPASS ENABLED - DEVELOPMENT SSR SYNC WORKAROUND')
    }
    return NextResponse.next()
  }

  // Protect all other routes with Supabase auth
  try {
    return await updateSession(request)
  } catch (error) {
    console.error('❌ Middleware auth error:', error)
    // Redirect to login on auth failure
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
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
