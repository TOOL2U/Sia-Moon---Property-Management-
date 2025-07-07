import { NextRequest, NextResponse } from 'next/server'
import SupabaseService from '@/lib/supabaseService'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing webapp in development mode with bypass...')
    
    // Note: Testing with current environment settings
    
    const tests = []

    // Test 1: Test SupabaseService.getAllUsers() with development bypass
    try {
      console.log('🔍 Testing SupabaseService.getAllUsers() with development bypass...')
      const result = await SupabaseService.getAllUsers()
      
      tests.push({
        name: 'SupabaseService.getAllUsers() (Development Bypass)',
        success: result.success,
        error: result.error || null,
        data: result.data || [],
        count: Array.isArray(result.data) ? result.data.length : 0,
        isDevelopmentBypass: true
      })
    } catch (error) {
      tests.push({
        name: 'SupabaseService.getAllUsers() (Development Bypass)',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
        count: 0,
        isDevelopmentBypass: true
      })
    }

    // Test 2: Test SupabaseService.getAllProperties() with development bypass
    try {
      console.log('🔍 Testing SupabaseService.getAllProperties() with development bypass...')
      const result = await SupabaseService.getAllProperties()
      
      tests.push({
        name: 'SupabaseService.getAllProperties() (Development Bypass)',
        success: result.success,
        error: result.error || null,
        data: result.data || [],
        count: Array.isArray(result.data) ? result.data.length : 0,
        isDevelopmentBypass: true
      })
    } catch (error) {
      tests.push({
        name: 'SupabaseService.getAllProperties() (Development Bypass)',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
        count: 0,
        isDevelopmentBypass: true
      })
    }

    // Test 3: Test SupabaseService.getAllBookings() with development bypass
    try {
      console.log('🔍 Testing SupabaseService.getAllBookings() with development bypass...')
      const result = await SupabaseService.getAllBookings()
      
      tests.push({
        name: 'SupabaseService.getAllBookings() (Development Bypass)',
        success: result.success,
        error: result.error || null,
        data: result.data || [],
        count: Array.isArray(result.data) ? result.data.length : 0,
        isDevelopmentBypass: true
      })
    } catch (error) {
      tests.push({
        name: 'SupabaseService.getAllBookings() (Development Bypass)',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
        count: 0,
        isDevelopmentBypass: true
      })
    }

    // Test 4: Test SupabaseService.getAllTasks() with development bypass
    try {
      console.log('🔍 Testing SupabaseService.getAllTasks() with development bypass...')
      const result = await SupabaseService.getAllTasks()
      
      tests.push({
        name: 'SupabaseService.getAllTasks() (Development Bypass)',
        success: result.success,
        error: result.error || null,
        data: result.data || [],
        count: Array.isArray(result.data) ? result.data.length : 0,
        isDevelopmentBypass: true
      })
    } catch (error) {
      tests.push({
        name: 'SupabaseService.getAllTasks() (Development Bypass)',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
        count: 0,
        isDevelopmentBypass: true
      })
    }

    // Test 5: Test SupabaseService.getAllReports() with development bypass
    try {
      console.log('🔍 Testing SupabaseService.getAllReports() with development bypass...')
      const result = await SupabaseService.getAllReports()
      
      tests.push({
        name: 'SupabaseService.getAllReports() (Development Bypass)',
        success: result.success,
        error: result.error || null,
        data: result.data || [],
        count: Array.isArray(result.data) ? result.data.length : 0,
        isDevelopmentBypass: true
      })
    } catch (error) {
      tests.push({
        name: 'SupabaseService.getAllReports() (Development Bypass)',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
        count: 0,
        isDevelopmentBypass: true
      })
    }

    // Test 6: Test SupabaseService.getNotificationsByUser() with proper UUID
    try {
      console.log('🔍 Testing SupabaseService.getNotificationsByUser() with proper UUID...')
      const testUuid = '550e8400-e29b-41d4-a716-446655440000' // Valid UUID format
      const result = await SupabaseService.getNotificationsByUser(testUuid)
      
      tests.push({
        name: 'SupabaseService.getNotificationsByUser() (Proper UUID)',
        success: result.success,
        error: result.error || null,
        data: result.data || [],
        count: Array.isArray(result.data) ? result.data.length : 0,
        isDevelopmentBypass: true
      })
    } catch (error) {
      tests.push({
        name: 'SupabaseService.getNotificationsByUser() (Proper UUID)',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
        count: 0,
        isDevelopmentBypass: true
      })
    }

    // Test 7: Test SupabaseService.getNotificationPreferences() with proper UUID
    try {
      console.log('🔍 Testing SupabaseService.getNotificationPreferences() with proper UUID...')
      const testUuid = '550e8400-e29b-41d4-a716-446655440000' // Valid UUID format
      const result = await SupabaseService.getNotificationPreferences(testUuid)
      
      tests.push({
        name: 'SupabaseService.getNotificationPreferences() (Proper UUID)',
        success: result.success,
        error: result.error || null,
        data: result.data || null,
        hasData: !!result.data,
        isDevelopmentBypass: true
      })
    } catch (error) {
      tests.push({
        name: 'SupabaseService.getNotificationPreferences() (Proper UUID)',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
        hasData: false,
        isDevelopmentBypass: true
      })
    }

    // Test 8: Test SupabaseService.getAllVillaOnboardings() with development bypass
    try {
      console.log('🔍 Testing SupabaseService.getAllVillaOnboardings() with development bypass...')
      const result = await SupabaseService.getAllVillaOnboardings()
      
      tests.push({
        name: 'SupabaseService.getAllVillaOnboardings() (Development Bypass)',
        success: result.success,
        error: result.error || null,
        data: result.data || [],
        count: Array.isArray(result.data) ? result.data.length : 0,
        isDevelopmentBypass: true
      })
    } catch (error) {
      tests.push({
        name: 'SupabaseService.getAllVillaOnboardings() (Development Bypass)',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
        count: 0,
        isDevelopmentBypass: true
      })
    }

    // Environment variables remain unchanged

    // Calculate overall success
    const successfulTests = tests.filter(test => test.success).length
    const totalTests = tests.length
    const overallSuccess = successfulTests === totalTests

    console.log(`✅ Development mode test completed: ${successfulTests}/${totalTests} tests passed`)

    return NextResponse.json({
      success: overallSuccess,
      message: `${successfulTests}/${totalTests} tests passed in development mode`,
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
    console.error('❌ Development mode test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      tests: []
    }, { status: 500 })
  }
}
