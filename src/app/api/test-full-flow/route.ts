import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/env'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Testing full Supabase authentication and data flow...')
    
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
    let testUserId: string | null = null

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
        testUserId = authData.user.id

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

        // Test 3: Create a property for the user
        try {
          console.log('🔍 Creating test property for user...')
          const { data: property, error: propertyError } = await supabaseAdmin
            .from('properties')
            .insert({
              owner_id: authData.user.id,
              name: 'Test Villa',
              description: 'A test property for integration testing',
              address: '123 Test Street',
              city: 'Test City',
              country: 'Test Country',
              bedrooms: 3,
              bathrooms: 2,
              max_guests: 6,
              price_per_night: 150.00,
              currency: 'USD',
              amenities: ['WiFi', 'Pool', 'Kitchen'],
              images: ['https://example.com/test-image.jpg'],
              is_active: true
            })
            .select()
            .single()

          tests.push({
            name: 'Create Property',
            success: !propertyError,
            error: propertyError?.message || null,
            data: property || null
          })

          if (property) {
            // Test 4: Create a booking for the property
            try {
              console.log('🔍 Creating test booking...')
              const { data: booking, error: bookingError } = await supabaseAdmin
                .from('bookings')
                .insert({
                  property_id: property.id,
                  guest_name: 'Test Guest',
                  guest_email: 'guest@example.com',
                  guest_phone: '+1234567890',
                  check_in: '2024-08-01',
                  check_out: '2024-08-07',
                  guests: 4,
                  total_amount: 900.00,
                  currency: 'USD',
                  status: 'confirmed',
                  booking_source: 'direct'
                })
                .select()
                .single()

              tests.push({
                name: 'Create Booking',
                success: !bookingError,
                error: bookingError?.message || null,
                data: booking || null
              })
            } catch (error) {
              tests.push({
                name: 'Create Booking',
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                data: null
              })
            }

            // Test 5: Create a task for the property
            try {
              console.log('🔍 Creating test task...')
              const { data: task, error: taskError } = await supabaseAdmin
                .from('tasks')
                .insert({
                  property_id: property.id,
                  title: 'Test Cleaning Task',
                  description: 'A test cleaning task',
                  task_type: 'cleaning',
                  status: 'pending',
                  priority: 'normal',
                  assigned_to: authData.user.id,
                  due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                  cost: 100.00,
                  currency: 'USD'
                })
                .select()
                .single()

              tests.push({
                name: 'Create Task',
                success: !taskError,
                error: taskError?.message || null,
                data: task || null
              })
            } catch (error) {
              tests.push({
                name: 'Create Task',
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                data: null
              })
            }
          }
        } catch (error) {
          tests.push({
            name: 'Create Property',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            data: null
          })
        }

        // Test 6: Create a notification for the user
        try {
          console.log('🔍 Creating test notification...')
          const { data: notification, error: notificationError } = await supabaseAdmin
            .from('notifications')
            .insert({
              user_id: authData.user.id,
              type: 'in_app',
              category: 'system_alert',
              title: 'Welcome to Test',
              message: 'This is a test notification',
              data: { test: true },
              status: 'pending',
              priority: 'normal',
              channels: ['in_app']
            })
            .select()
            .single()

          tests.push({
            name: 'Create Notification',
            success: !notificationError,
            error: notificationError?.message || null,
            data: notification || null
          })
        } catch (error) {
          tests.push({
            name: 'Create Notification',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            data: null
          })
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

    // Clean up: Delete the test user and all associated data
    if (testUserId) {
      try {
        console.log('🔍 Cleaning up test user and data...')
        await supabaseAdmin.auth.admin.deleteUser(testUserId)
        console.log('✅ Test user and data cleaned up')
      } catch (error) {
        console.warn('⚠️ Failed to clean up test user:', error)
      }
    }

    // Calculate overall success
    const successfulTests = tests.filter(test => test.success).length
    const totalTests = tests.length
    const overallSuccess = successfulTests === totalTests

    console.log(`✅ Full flow test completed: ${successfulTests}/${totalTests} tests passed`)

    return NextResponse.json({
      success: overallSuccess,
      message: `${successfulTests}/${totalTests} tests passed`,
      tests,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Full flow test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      tests: []
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint with { "email": "test@example.com", "password": "testpassword123", "fullName": "Test User" } to test full authentication and data flow'
  })
}
