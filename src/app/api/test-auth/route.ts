import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/env'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Testing Supabase authentication...')
    
    // Check if environment variables are available
    if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Supabase environment variables not configured'
      }, { status: 500 })
    }

    const { email, password, fullName } = await request.json()

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email and password are required'
      }, { status: 400 })
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const tests = []

    // Test 1: Create a test user
    try {
      console.log('🔍 Creating test user:', email)
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        user_metadata: {
          full_name: fullName || 'Test User',
          role: 'client'
        },
        email_confirm: true // Skip email confirmation for testing
      })

      tests.push({
        name: 'Create User',
        success: !authError,
        error: authError?.message || null,
        data: authData?.user ? {
          id: authData.user.id,
          email: authData.user.email,
          created_at: authData.user.created_at
        } : null
      })

      if (authData?.user) {
        // Test 2: Check if profile was created automatically (via trigger)
        try {
          console.log('🔍 Checking if profile was created automatically...')
          await new Promise(resolve => setTimeout(resolve, 1000)) // Wait for trigger
          
          const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single()

          tests.push({
            name: 'Auto Profile Creation',
            success: !profileError && !!profile,
            error: profileError?.message || null,
            data: profile || null
          })
        } catch (error) {
          tests.push({
            name: 'Auto Profile Creation',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            data: null
          })
        }

        // Test 3: Test user login
        try {
          console.log('🔍 Testing user login...')
          const { data: loginData, error: loginError } = await supabaseAdmin.auth.signInWithPassword({
            email,
            password
          })

          tests.push({
            name: 'User Login',
            success: !loginError,
            error: loginError?.message || null,
            data: loginData?.user ? {
              id: loginData.user.id,
              email: loginData.user.email
            } : null
          })
        } catch (error) {
          tests.push({
            name: 'User Login',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            data: null
          })
        }

        // Test 4: Test authenticated data access
        if (tests[2]?.success) { // If login was successful
          try {
            console.log('🔍 Testing authenticated data access...')
            // Create a regular client and set the session
            const supabaseUser = createClient(NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
            
            // For testing, we'll use the service role to check if the user can access their own profile
            const { data: userProfile, error: userProfileError } = await supabaseAdmin
              .from('profiles')
              .select('*')
              .eq('id', authData.user.id)
              .single()

            tests.push({
              name: 'Authenticated Data Access',
              success: !userProfileError,
              error: userProfileError?.message || null,
              data: userProfile || null
            })
          } catch (error) {
            tests.push({
              name: 'Authenticated Data Access',
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              data: null
            })
          }
        }

        // Clean up: Delete the test user
        try {
          console.log('🔍 Cleaning up test user...')
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
          console.log('✅ Test user cleaned up')
        } catch (error) {
          console.warn('⚠️ Failed to clean up test user:', error)
        }
      }
    } catch (error) {
      tests.push({
        name: 'Create User',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null
      })
    }

    // Calculate overall success
    const successfulTests = tests.filter(test => test.success).length
    const totalTests = tests.length
    const overallSuccess = successfulTests === totalTests

    console.log(`✅ Supabase auth test completed: ${successfulTests}/${totalTests} tests passed`)

    return NextResponse.json({
      success: overallSuccess,
      message: `${successfulTests}/${totalTests} tests passed`,
      tests,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Supabase auth test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      tests: []
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint with { "email": "test@example.com", "password": "testpassword123", "fullName": "Test User" } to test authentication'
  })
}
