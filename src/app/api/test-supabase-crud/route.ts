import { NextResponse } from 'next/server'
import SupabaseService from '@/lib/supabaseService'

export async function GET() {
  try {
    console.log('🧪 Starting CRUD operations tests...')
    
    const results = {
      environment: {
        nodeEnv: process.env.NODE_ENV,
        devBypass: process.env.NEXT_PUBLIC_DEV_SESSION_BYPASS,
        developmentMode: process.env.NODE_ENV === 'development' && 
                        process.env.NEXT_PUBLIC_DEV_SESSION_BYPASS === 'true'
      },
      crudTests: {
        notifications: {
          create: { success: false, error: null, data: null },
          update: { success: false, error: null, data: null },
          markAsRead: { success: false, error: null, data: null }
        },
        notificationPreferences: {
          update: { success: false, error: null, data: null }
        },
        properties: {
          getByOwner: { success: false, error: null, dataCount: 0 }
        },
        bookings: {
          getByProperty: { success: false, error: null, dataCount: 0 }
        }
      },
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0
      }
    }

    console.log(`🔧 Development mode: ${results.environment.developmentMode}`)

    // Test Notification CRUD Operations
    console.log('🔔 Testing notification CRUD operations...')
    
    // Test Create Notification
    try {
      console.log('  ➕ Testing createNotification...')
      const createResult = await SupabaseService.createNotification({
        user_id: 'demo-user-id',
        type: 'in_app',
        category: 'system_alert',
        title: 'Test Notification',
        message: 'This is a test notification created by the test suite.',
        data: { test: true },
        priority: 'normal',
        channels: ['in_app']
      })
      results.crudTests.notifications.create.success = createResult.success
      results.crudTests.notifications.create.error = createResult.error?.message || null
      results.crudTests.notifications.create.data = createResult.data
      results.summary.totalTests++
      if (createResult.success) results.summary.passedTests++
      else results.summary.failedTests++
    } catch (error) {
      results.crudTests.notifications.create.error = error.message
      results.summary.totalTests++
      results.summary.failedTests++
    }

    // Test Update Notification
    try {
      console.log('  ✏️ Testing updateNotification...')
      const updateResult = await SupabaseService.updateNotification('test-notification-id', {
        title: 'Updated Test Notification',
        status: 'read'
      })
      results.crudTests.notifications.update.success = updateResult.success
      results.crudTests.notifications.update.error = updateResult.error?.message || null
      results.crudTests.notifications.update.data = updateResult.data
      results.summary.totalTests++
      if (updateResult.success) results.summary.passedTests++
      else results.summary.failedTests++
    } catch (error) {
      results.crudTests.notifications.update.error = error.message
      results.summary.totalTests++
      results.summary.failedTests++
    }

    // Test Mark Notification as Read
    try {
      console.log('  👁️ Testing markNotificationAsRead...')
      const markReadResult = await SupabaseService.markNotificationAsRead('test-notification-id')
      results.crudTests.notifications.markAsRead.success = markReadResult.success
      results.crudTests.notifications.markAsRead.error = markReadResult.error?.message || null
      results.crudTests.notifications.markAsRead.data = markReadResult.data
      results.summary.totalTests++
      if (markReadResult.success) results.summary.passedTests++
      else results.summary.failedTests++
    } catch (error) {
      results.crudTests.notifications.markAsRead.error = error.message
      results.summary.totalTests++
      results.summary.failedTests++
    }

    // Test Notification Preferences Update
    try {
      console.log('  ⚙️ Testing updateNotificationPreferences...')
      const updatePrefsResult = await SupabaseService.updateNotificationPreferences('demo-user-id', {
        email_notifications: false,
        push_notifications: true,
        marketing_emails: false
      })
      results.crudTests.notificationPreferences.update.success = updatePrefsResult.success
      results.crudTests.notificationPreferences.update.error = updatePrefsResult.error?.message || null
      results.crudTests.notificationPreferences.update.data = updatePrefsResult.data
      results.summary.totalTests++
      if (updatePrefsResult.success) results.summary.passedTests++
      else results.summary.failedTests++
    } catch (error) {
      results.crudTests.notificationPreferences.update.error = error.message
      results.summary.totalTests++
      results.summary.failedTests++
    }

    // Test Properties by Owner
    try {
      console.log('  🏠 Testing getPropertiesByOwner...')
      const propertiesResult = await SupabaseService.getPropertiesByOwner('demo-user-id')
      results.crudTests.properties.getByOwner.success = propertiesResult.success
      results.crudTests.properties.getByOwner.error = propertiesResult.error?.message || null
      results.crudTests.properties.getByOwner.dataCount = propertiesResult.data?.length || 0
      results.summary.totalTests++
      if (propertiesResult.success) results.summary.passedTests++
      else results.summary.failedTests++
    } catch (error) {
      results.crudTests.properties.getByOwner.error = error.message
      results.summary.totalTests++
      results.summary.failedTests++
    }

    // Test Bookings by Property
    try {
      console.log('  📅 Testing getBookingsByProperty...')
      const bookingsResult = await SupabaseService.getBookingsByProperty('demo-property-1')
      results.crudTests.bookings.getByProperty.success = bookingsResult.success
      results.crudTests.bookings.getByProperty.error = bookingsResult.error?.message || null
      results.crudTests.bookings.getByProperty.dataCount = bookingsResult.data?.length || 0
      results.summary.totalTests++
      if (bookingsResult.success) results.summary.passedTests++
      else results.summary.failedTests++
    } catch (error) {
      results.crudTests.bookings.getByProperty.error = error.message
      results.summary.totalTests++
      results.summary.failedTests++
    }

    console.log(`✅ CRUD tests completed: ${results.summary.passedTests}/${results.summary.totalTests} passed`)

    return NextResponse.json(results, { status: 200 })
  } catch (error) {
    console.error('❌ CRUD test suite failed:', error)
    return NextResponse.json({
      error: 'CRUD test suite failed',
      message: error.message
    }, { status: 500 })
  }
}
