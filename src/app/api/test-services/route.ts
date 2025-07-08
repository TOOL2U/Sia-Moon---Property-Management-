import { NextRequest, NextResponse } from 'next/server'
import SupabaseService from '@/lib/supabaseService'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing webapp services with Supabase...')
    
    const tests = []

    // Test 1: Test SupabaseService.getAllUsers()
    try {
      console.log('🔍 Testing SupabaseService.getAllUsers()...')
      const result = await SupabaseService.getAllUsers()
      
      tests.push({
        name: 'SupabaseService.getAllUsers()',
        success: result.success,
        error: result.error || null,
        data: result.data || [],
        count: Array.isArray(result.data) ? result.data.length : 0
      })
    } catch (error) {
      tests.push({
        name: 'SupabaseService.getAllUsers()',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
        count: 0
      })
    }

    // Test 2: Test SupabaseService.getAllProperties()
    try {
      console.log('🔍 Testing SupabaseService.getAllProperties()...')
      const result = await SupabaseService.getAllProperties()
      
      tests.push({
        name: 'SupabaseService.getAllProperties()',
        success: result.success,
        error: result.error || null,
        data: result.data || [],
        count: Array.isArray(result.data) ? result.data.length : 0
      })
    } catch (error) {
      tests.push({
        name: 'SupabaseService.getAllProperties()',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
        count: 0
      })
    }

    // Test 3: Test SupabaseService.getAllBookings()
    try {
      console.log('🔍 Testing SupabaseService.getAllBookings()...')
      const result = await SupabaseService.getAllBookings()
      
      tests.push({
        name: 'SupabaseService.getAllBookings()',
        success: result.success,
        error: result.error || null,
        data: result.data || [],
        count: Array.isArray(result.data) ? result.data.length : 0
      })
    } catch (error) {
      tests.push({
        name: 'SupabaseService.getAllBookings()',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
        count: 0
      })
    }

    // Test 4: Test SupabaseService.getAllTasks()
    try {
      console.log('🔍 Testing SupabaseService.getAllTasks()...')
      const result = await SupabaseService.getAllTasks()
      
      tests.push({
        name: 'SupabaseService.getAllTasks()',
        success: result.success,
        error: result.error || null,
        data: result.data || [],
        count: Array.isArray(result.data) ? result.data.length : 0
      })
    } catch (error) {
      tests.push({
        name: 'SupabaseService.getAllTasks()',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
        count: 0
      })
    }

    // Test 5: Test SupabaseService.getAllReports()
    try {
      console.log('🔍 Testing SupabaseService.getAllReports()...')
      const result = await SupabaseService.getAllReports()
      
      tests.push({
        name: 'SupabaseService.getAllReports()',
        success: result.success,
        error: result.error || null,
        data: result.data || [],
        count: Array.isArray(result.data) ? result.data.length : 0
      })
    } catch (error) {
      tests.push({
        name: 'SupabaseService.getAllReports()',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
        count: 0
      })
    }

    // Test 6: Test SupabaseService.getNotificationsByUser() with demo user
    try {
      console.log('🔍 Testing SupabaseService.getNotificationsByUser()...')
      const result = await SupabaseService.getNotificationsByUser('demo-user-id')
      
      tests.push({
        name: 'SupabaseService.getNotificationsByUser()',
        success: result.success,
        error: result.error || null,
        data: result.data || [],
        count: Array.isArray(result.data) ? result.data.length : 0
      })
    } catch (error) {
      tests.push({
        name: 'SupabaseService.getNotificationsByUser()',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
        count: 0
      })
    }

    // Test 7: Test SupabaseService.getNotificationPreferences() with demo user
    try {
      console.log('🔍 Testing SupabaseService.getNotificationPreferences()...')
      const result = await SupabaseService.getNotificationPreferences('demo-user-id')
      
      tests.push({
        name: 'SupabaseService.getNotificationPreferences()',
        success: result.success,
        error: result.error || null,
        data: result.data || null,
        hasData: !!result.data
      })
    } catch (error) {
      tests.push({
        name: 'SupabaseService.getNotificationPreferences()',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
        hasData: false
      })
    }

    // Test 8: Test SupabaseService.getAllVillaOnboardings()
    try {
      console.log('🔍 Testing SupabaseService.getAllVillaOnboardings()...')
      const result = await SupabaseService.getAllVillaOnboardings()
      
      tests.push({
        name: 'SupabaseService.getAllVillaOnboardings()',
        success: result.success,
        error: result.error || null,
        data: result.data || [],
        count: Array.isArray(result.data) ? result.data.length : 0
      })
    } catch (error) {
      tests.push({
        name: 'SupabaseService.getAllVillaOnboardings()',
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

    console.log(`✅ Webapp services test completed: ${successfulTests}/${totalTests} tests passed`)

    return NextResponse.json({
      success: overallSuccess,
      message: `${successfulTests}/${totalTests} tests passed`,
      tests,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_DEV_SESSION_BYPASS: process.env.NEXT_PUBLIC_DEV_SESSION_BYPASS,
        NEXT_PUBLIC_BYPASS_AUTH: process.env.NEXT_PUBLIC_BYPASS_AUTH,
        supabaseConfigured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Webapp services test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      tests: []
    }, { status: 500 })
  }
}
