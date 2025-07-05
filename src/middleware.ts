import { type NextRequest, NextResponse } from 'next/server'
// TODO: Re-enable for Supabase production deployment
// import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(_request: NextRequest) {
  // TEMPORARILY DISABLED: Middleware disabled during development
  // TODO: Re-enable for Supabase production deployment

  console.log('🔍 Middleware disabled - using Supabase auth without middleware')
  return NextResponse.next()

  // Skip middleware if authentication is bypassed
  // if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
  //   return
  // }

  // Skip middleware if Supabase is not configured
  // if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  //   return
  // }

  // return await updateSession(request)
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
