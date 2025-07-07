import { type NextRequest, NextResponse } from 'next/server'
import { isDevelopmentBypass, isDevelopmentSessionBypass } from '@/lib/env'

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

  if (isPublicRoute || isDevelopmentBypass || isDevelopmentSessionBypass) {
    if (isDevelopmentBypass) {
      console.warn('🚨 AUTH BYPASS ENABLED - DEVELOPMENT ONLY')
    }
    if (isDevelopmentSessionBypass) {
      console.warn('🔄 SESSION BYPASS ENABLED - DEVELOPMENT SSR SYNC WORKAROUND')
    }
    return NextResponse.next()
  }

  // For now, allow all routes since Supabase auth is removed
  // TODO: Implement new authentication middleware when ready
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
