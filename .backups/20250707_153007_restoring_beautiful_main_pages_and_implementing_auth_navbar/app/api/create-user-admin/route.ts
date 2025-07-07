import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/env'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Creating user with service role...')
    
    // Check if environment variables are available
    if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Supabase environment variables not configured'
      }, { status: 500 })
    }

    const { email, password, userData } = await request.json()

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

    // Step 1: Create the user in auth.users
    console.log('🔍 Creating auth user:', email)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        full_name: userData?.full_name || email.split('@')[0],
        role: userData?.role || 'client'
      },
      email_confirm: true // Skip email confirmation for development
    })

    if (authError) {
      console.error('❌ Auth user creation failed:', authError)
      return NextResponse.json({
        success: false,
        error: authError.message
      }, { status: 400 })
    }

    if (!authData?.user) {
      return NextResponse.json({
        success: false,
        error: 'User creation failed - no user returned'
      }, { status: 400 })
    }

    console.log('✅ Auth user created:', authData.user.id)

    // Step 2: Manually create the profile (since trigger might not work)
    try {
      console.log('🔍 Creating profile for user:', authData.user.id)
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          full_name: userData?.full_name || email.split('@')[0],
          role: userData?.role || 'client'
        })
        .select()
        .single()

      if (profileError) {
        console.warn('⚠️ Profile creation failed, but user exists:', profileError)
        // Don't fail the whole process if profile creation fails
      } else {
        console.log('✅ Profile created successfully:', profileData)
      }
    } catch (profileErr) {
      console.warn('⚠️ Profile creation error:', profileErr)
      // Don't fail the whole process
    }

    // Step 3: Create default notification preferences
    try {
      console.log('🔍 Creating notification preferences for user:', authData.user.id)
      const { error: prefsError } = await supabaseAdmin
        .from('notification_preferences')
        .insert({
          user_id: authData.user.id,
          email_notifications: true,
          push_notifications: true,
          booking_updates: true,
          maintenance_alerts: true,
          payment_reminders: true,
          marketing_emails: false
        })

      if (prefsError) {
        console.warn('⚠️ Notification preferences creation failed:', prefsError)
        // Don't fail the whole process
      } else {
        console.log('✅ Notification preferences created')
      }
    } catch (prefsErr) {
      console.warn('⚠️ Notification preferences error:', prefsErr)
      // Don't fail the whole process
    }

    console.log('✅ User creation completed successfully')

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        created_at: authData.user.created_at
      }
    })

  } catch (error) {
    console.error('❌ Service role user creation failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint with { "email": "test@example.com", "password": "testpassword123", "userData": {...} } to create a user with service role'
  })
}
