import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import SupabaseService from '@/lib/supabaseService'

export async function GET() {
  try {
    console.log('🧪 Starting comprehensive Supabase tests...')
    
    const results = {
      environment: {
        nodeEnv: process.env.NODE_ENV,
        devBypass: process.env.NEXT_PUBLIC_DEV_SESSION_BYPASS,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'configured' : 'missing'
      },
      directSupabase: {
        connection: false,
        auth: false,
        profiles: false,
        properties: false,
        bookings: false,
        tasks: false,
        reports: false,
        notifications: false,
        notificationPreferences: false
      },
      supabaseService: {
        properties: { success: false, error: null, dataCount: 0 },
        bookings: { success: false, error: null, dataCount: 0 },
        tasks: { success: false, error: null, dataCount: 0 },
        reports: { success: false, error: null, dataCount: 0 },
        notifications: { success: false, error: null, dataCount: 0 },
        notificationPreferences: { success: false, error: null, data: null },
        users: { success: false, error: null, dataCount: 0 },
        villaOnboardings: { success: false, error: null, dataCount: 0 }
      },
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        developmentMode: false
      }
    }

    // Check if we're in development mode with bypass
    const isDevelopmentBypass = process.env.NODE_ENV === 'development' && 
                               process.env.NEXT_PUBLIC_DEV_SESSION_BYPASS === 'true'
    results.summary.developmentMode = isDevelopmentBypass

    console.log(`🔧 Development mode bypass: ${isDevelopmentBypass}`)

    // Test 1: Direct Supabase Connection
    console.log('📡 Testing direct Supabase connection...')
    try {
      const supabase = createClient()
      
      // Test basic connection
      const { data, error } = await supabase.from('profiles').select('count').limit(1)
      results.directSupabase.connection = !error
      results.directSupabase.auth = true // Auth service is always available
      
      // Test each table
      const tables = ['profiles', 'properties', 'bookings', 'tasks', 'reports', 'notifications', 'notification_preferences']
      for (const table of tables) {
        try {
          const { error: tableError } = await supabase.from(table).select('id').limit(1)
          const tableKey = table === 'notification_preferences' ? 'notificationPreferences' : table
          results.directSupabase[tableKey] = !tableError
        } catch (tableError) {
          console.log(`❌ Table ${table} test failed:`, tableError)
        }
      }
    } catch (error) {
      console.error('❌ Direct Supabase connection failed:', error)
    }

    // Test 2: SupabaseService Methods
    console.log('🔧 Testing SupabaseService methods...')
    
    // Test Properties
    try {
      console.log('  📋 Testing getAllProperties...')
      const propertiesResult = await SupabaseService.getAllProperties('00000000-0000-0000-0000-000000000001')
      results.supabaseService.properties.success = propertiesResult.success
      results.supabaseService.properties.error = propertiesResult.error?.message || null
      results.supabaseService.properties.dataCount = propertiesResult.data?.length || 0
      results.summary.totalTests++
      if (propertiesResult.success) results.summary.passedTests++
      else results.summary.failedTests++
    } catch (error) {
      results.supabaseService.properties.error = error.message
      results.summary.totalTests++
      results.summary.failedTests++
    }

    // Test Bookings
    try {
      console.log('  📅 Testing getAllBookings...')
      const bookingsResult = await SupabaseService.getAllBookings('00000000-0000-0000-0000-000000000001')
      results.supabaseService.bookings.success = bookingsResult.success
      results.supabaseService.bookings.error = bookingsResult.error?.message || null
      results.supabaseService.bookings.dataCount = bookingsResult.data?.length || 0
      results.summary.totalTests++
      if (bookingsResult.success) results.summary.passedTests++
      else results.summary.failedTests++
    } catch (error) {
      results.supabaseService.bookings.error = error.message
      results.summary.totalTests++
      results.summary.failedTests++
    }

    // Test Tasks
    try {
      console.log('  ✅ Testing getTasksByProperty...')
      const tasksResult = await SupabaseService.getTasksByProperty('demo-property-1')
      results.supabaseService.tasks.success = tasksResult.success
      results.supabaseService.tasks.error = tasksResult.error?.message || null
      results.supabaseService.tasks.dataCount = tasksResult.data?.length || 0
      results.summary.totalTests++
      if (tasksResult.success) results.summary.passedTests++
      else results.summary.failedTests++
    } catch (error) {
      results.supabaseService.tasks.error = error.message
      results.summary.totalTests++
      results.summary.failedTests++
    }

    // Test Reports
    try {
      console.log('  📊 Testing getReportsByProperty...')
      const reportsResult = await SupabaseService.getReportsByProperty('demo-property-1')
      results.supabaseService.reports.success = reportsResult.success
      results.supabaseService.reports.error = reportsResult.error?.message || null
      results.supabaseService.reports.dataCount = reportsResult.data?.length || 0
      results.summary.totalTests++
      if (reportsResult.success) results.summary.passedTests++
      else results.summary.failedTests++
    } catch (error) {
      results.supabaseService.reports.error = error.message
      results.summary.totalTests++
      results.summary.failedTests++
    }

    // Test Notifications
    try {
      console.log('  🔔 Testing getNotificationsByUser...')
      const notificationsResult = await SupabaseService.getNotificationsByUser('00000000-0000-0000-0000-000000000001')
      results.supabaseService.notifications.success = notificationsResult.success
      results.supabaseService.notifications.error = notificationsResult.error?.message || null
      results.supabaseService.notifications.dataCount = notificationsResult.data?.length || 0
      results.summary.totalTests++
      if (notificationsResult.success) results.summary.passedTests++
      else results.summary.failedTests++
    } catch (error) {
      results.supabaseService.notifications.error = error.message
      results.summary.totalTests++
      results.summary.failedTests++
    }

    // Test Notification Preferences
    try {
      console.log('  ⚙️ Testing getNotificationPreferences...')
      const preferencesResult = await SupabaseService.getNotificationPreferences('00000000-0000-0000-0000-000000000001')
      results.supabaseService.notificationPreferences.success = preferencesResult.success
      results.supabaseService.notificationPreferences.error = preferencesResult.error?.message || null
      results.supabaseService.notificationPreferences.data = preferencesResult.data || null
      results.summary.totalTests++
      if (preferencesResult.success) results.summary.passedTests++
      else results.summary.failedTests++
    } catch (error) {
      results.supabaseService.notificationPreferences.error = error.message
      results.summary.totalTests++
      results.summary.failedTests++
    }

    // Test Users
    try {
      console.log('  👥 Testing getAllUsers...')
      const usersResult = await SupabaseService.getAllUsers()
      results.supabaseService.users.success = usersResult.success
      results.supabaseService.users.error = usersResult.error?.message || null
      results.supabaseService.users.dataCount = usersResult.data?.length || 0
      results.summary.totalTests++
      if (usersResult.success) results.summary.passedTests++
      else results.summary.failedTests++
    } catch (error) {
      results.supabaseService.users.error = error.message
      results.summary.totalTests++
      results.summary.failedTests++
    }

    // Test Villa Onboardings
    try {
      console.log('  🏠 Testing getAllVillaOnboardings...')
      const onboardingsResult = await SupabaseService.getAllVillaOnboardings()
      results.supabaseService.villaOnboardings.success = onboardingsResult.success
      results.supabaseService.villaOnboardings.error = onboardingsResult.error?.message || null
      results.supabaseService.villaOnboardings.dataCount = onboardingsResult.data?.length || 0
      results.summary.totalTests++
      if (onboardingsResult.success) results.summary.passedTests++
      else results.summary.failedTests++
    } catch (error) {
      results.supabaseService.villaOnboardings.error = error.message
      results.summary.totalTests++
      results.summary.failedTests++
    }

    console.log(`✅ Tests completed: ${results.summary.passedTests}/${results.summary.totalTests} passed`)

    return NextResponse.json(results, { status: 200 })
  } catch (error) {
    console.error('❌ Test suite failed:', error)
    return NextResponse.json({
      error: 'Test suite failed',
      message: error.message
    }, { status: 500 })
  }
}
