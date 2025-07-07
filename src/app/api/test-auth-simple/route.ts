import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } from '@/lib/env'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Testing simple Supabase authentication...')
    
    const { email, password, fullName } = await request.json()

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email and password are required'
      }, { status: 400 })
    }

    // Check if environment variables are available
    if (!NEXT_PUBLIC_SUPABASE_URL || !NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Supabase environment variables not configured'
      }, { status: 500 })
    }

    // Create regular client for server-side use
    const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)

    const tests = []

    // Test 1: Try to sign up a user
    try {
      console.log('🔍 Attempting user signup:', email)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || 'Test User',
            role: 'client'
          }
        }
      })

      console.log('📝 Signup result:', { 
        user: data?.user ? 'Created' : 'Not created',
        session: data?.session ? 'Session created' : 'No session',
        error: error?.message || 'No error'
      })

      tests.push({
        name: 'User Signup',
        success: !error && !!data?.user,
        error: error?.message || null,
        data: data?.user ? {
          id: data.user.id,
          email: data.user.email,
          email_confirmed_at: data.user.email_confirmed_at,
          created_at: data.user.created_at
        } : null,
        session: !!data?.session
      })

      // If signup was successful, try to sign in
      if (!error && data?.user) {
        try {
          console.log('🔍 Attempting user signin:', email)
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          })

          tests.push({
            name: 'User Signin',
            success: !signInError && !!signInData?.user,
            error: signInError?.message || null,
            data: signInData?.user ? {
              id: signInData.user.id,
              email: signInData.user.email
            } : null,
            session: !!signInData?.session
          })

          // Clean up: Sign out
          if (signInData?.session) {
            await supabase.auth.signOut()
            console.log('✅ User signed out')
          }
        } catch (error) {
          tests.push({
            name: 'User Signin',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            data: null,
            session: false
          })
        }
      }
    } catch (error) {
      console.error('❌ Signup error:', error)
      tests.push({
        name: 'User Signup',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
        session: false
      })
    }

    // Calculate overall success
    const successfulTests = tests.filter(test => test.success).length
    const totalTests = tests.length
    const overallSuccess = successfulTests === totalTests

    console.log(`✅ Simple auth test completed: ${successfulTests}/${totalTests} tests passed`)

    return NextResponse.json({
      success: overallSuccess,
      message: `${successfulTests}/${totalTests} tests passed`,
      tests,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Simple auth test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      tests: []
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint with { "email": "test@example.com", "password": "testpassword123", "fullName": "Test User" } to test simple authentication'
  })
}
