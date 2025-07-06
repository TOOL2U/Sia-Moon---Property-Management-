import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  console.log('🔍 Middleware - User detected:', !!user, user?.email, 'Path:', request.nextUrl.pathname)
  if (userError) {
    console.log('❌ Middleware - Auth error:', userError.message)
  }

  // Check for session cookies as fallback
  const sessionCookie = request.cookies.get('sb-alkogpgjxpshoqsfgqef-auth-token')
  console.log('🍪 Middleware - Session cookie present:', !!sessionCookie)

  // Protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/properties',
    '/bookings',
    '/admin',
    '/onboard'
  ]

  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  // Development mode: More permissive auth for SSR session sync issues
  const isDevelopment = process.env.NODE_ENV === 'development'

  // If accessing a protected route without authentication, redirect to login
  if (isProtectedRoute && !user) {
    // In development, check if this might be a session sync issue
    if (isDevelopment) {
      console.log('⚠️  Development mode: Session sync issue detected, redirecting to login')
      console.log('   This is normal during development when client/server auth is out of sync')
    }

    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Role-based access control for dashboard routes
  if (user && request.nextUrl.pathname.startsWith('/dashboard/')) {
    try {
      // Get user profile to check role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile) {
        const userRole = profile.role
        const requestedRole = request.nextUrl.pathname.split('/')[2] // client or staff

        // If user is trying to access wrong dashboard, redirect to correct one
        if (userRole !== requestedRole) {
          const url = request.nextUrl.clone()
          url.pathname = userRole === 'staff' ? '/dashboard/staff' : '/dashboard/client'
          return NextResponse.redirect(url)
        }
      }
    } catch (error) {
      console.error('Error checking user role:', error)
      // If there's an error getting the profile, redirect to login
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      return NextResponse.redirect(url)
    }
  }

  // TEMPORARILY DISABLED: If user is authenticated and tries to access auth pages, redirect to dashboard
  // This is disabled to allow testing of authentication flow
  /*
  if (user && request.nextUrl.pathname.startsWith('/auth/')) {
    console.log('🔄 Middleware - Redirecting authenticated user from auth page to dashboard')
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      console.log('📝 Middleware - Profile found:', !!profile, profile?.role)

      if (profile) {
        const url = request.nextUrl.clone()
        url.pathname = profile.role === 'staff' ? '/dashboard/staff' : '/dashboard/client'
        console.log('🔄 Middleware - Redirecting to:', url.pathname)
        return NextResponse.redirect(url)
      }
    } catch (error) {
      console.error('❌ Middleware - Error checking user role for redirect:', error)
    }
  }
  */

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
