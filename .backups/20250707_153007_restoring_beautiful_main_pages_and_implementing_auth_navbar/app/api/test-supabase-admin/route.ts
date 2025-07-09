import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/env'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing Supabase connection with service role...')
    
    // Check if environment variables are available
    if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Supabase environment variables not configured',
        tests: []
      }, { status: 500 })
    }

    // Create admin client with service role key (bypasses RLS)
    const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const tests = []

    // Test 1: Test profiles table
    try {
      console.log('🔍 Testing profiles table with service role...')
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(5)

      tests.push({
        name: 'Profiles Table Query (Service Role)',
        success: !profilesError,
        error: profilesError?.message || null,
        data: profiles || [],
        count: profiles?.length || 0
      })
    } catch (error) {
      tests.push({
        name: 'Profiles Table Query (Service Role)',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
        count: 0
      })
    }

    // Test 2: Test properties table
    try {
      console.log('🔍 Testing properties table with service role...')
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .limit(5)

      tests.push({
        name: 'Properties Table Query (Service Role)',
        success: !propertiesError,
        error: propertiesError?.message || null,
        data: properties || [],
        count: properties?.length || 0
      })
    } catch (error) {
      tests.push({
        name: 'Properties Table Query (Service Role)',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
        count: 0
      })
    }

    // Test 3: Test bookings table
    try {
      console.log('🔍 Testing bookings table with service role...')
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .limit(5)

      tests.push({
        name: 'Bookings Table Query (Service Role)',
        success: !bookingsError,
        error: bookingsError?.message || null,
        data: bookings || [],
        count: bookings?.length || 0
      })
    } catch (error) {
      tests.push({
        name: 'Bookings Table Query (Service Role)',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
        count: 0
      })
    }

    // Test 4: Test tasks table
    try {
      console.log('🔍 Testing tasks table with service role...')
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .limit(5)

      tests.push({
        name: 'Tasks Table Query (Service Role)',
        success: !tasksError,
        error: tasksError?.message || null,
        data: tasks || [],
        count: tasks?.length || 0
      })
    } catch (error) {
      tests.push({
        name: 'Tasks Table Query (Service Role)',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
        count: 0
      })
    }

    // Test 5: Test reports table
    try {
      console.log('🔍 Testing reports table with service role...')
      const { data: reports, error: reportsError } = await supabase
        .from('reports')
        .select('*')
        .limit(5)

      tests.push({
        name: 'Reports Table Query (Service Role)',
        success: !reportsError,
        error: reportsError?.message || null,
        data: reports || [],
        count: reports?.length || 0
      })
    } catch (error) {
      tests.push({
        name: 'Reports Table Query (Service Role)',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
        count: 0
      })
    }

    // Test 6: Test notifications table
    try {
      console.log('🔍 Testing notifications table with service role...')
      const { data: notifications, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .limit(5)

      tests.push({
        name: 'Notifications Table Query (Service Role)',
        success: !notificationsError,
        error: notificationsError?.message || null,
        data: notifications || [],
        count: notifications?.length || 0
      })
    } catch (error) {
      tests.push({
        name: 'Notifications Table Query (Service Role)',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
        count: 0
      })
    }

    // Test 7: Test notification_preferences table
    try {
      console.log('🔍 Testing notification_preferences table with service role...')
      const { data: preferences, error: preferencesError } = await supabase
        .from('notification_preferences')
        .select('*')
        .limit(5)

      tests.push({
        name: 'Notification Preferences Table Query (Service Role)',
        success: !preferencesError,
        error: preferencesError?.message || null,
        data: preferences || [],
        count: preferences?.length || 0
      })
    } catch (error) {
      tests.push({
        name: 'Notification Preferences Table Query (Service Role)',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
        count: 0
      })
    }

    // Calculate overall success
    const successfulTests = tests.filter(test => test.success).length
    const totalTests = tests.length
    const overallSuccess = successfulTests === totalTests

    console.log(`✅ Supabase admin connection test completed: ${successfulTests}/${totalTests} tests passed`)

    return NextResponse.json({
      success: overallSuccess,
      message: `${successfulTests}/${totalTests} tests passed`,
      tests,
      supabaseUrl: NEXT_PUBLIC_SUPABASE_URL,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Supabase admin connection test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      tests: []
    }, { status: 500 })
  }
}
