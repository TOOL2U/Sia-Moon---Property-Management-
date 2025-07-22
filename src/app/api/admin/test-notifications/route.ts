import { NextRequest, NextResponse } from 'next/server'

/**
 * Test Notifications API
 * Tests various notification services to debug mobile app notification issues
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, staffId, testMessage } = body

    console.log(`🧪 Testing notifications - Action: ${action}`)

    switch (action) {
      case 'test_fcm':
        return await testFCMNotifications(staffId, testMessage)

      case 'test_expo':
        return await testExpoNotifications(staffId, testMessage)

      case 'test_mobile_service':
        return await testMobileNotificationService(staffId, testMessage)

      case 'check_tokens':
        return await checkDeviceTokens(staffId)

      case 'register_test_token':
        return await registerTestToken(staffId, body.token, body.platform)

      case 'create_test_job':
        return await createTestJobDirect()

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action parameter' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('❌ Test Notifications API Error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function testFCMNotifications(staffId: string, testMessage: string) {
  try {
    const { FCMNotificationService } = await import('@/services/FCMNotificationService')

    const fcmService = new FCMNotificationService()
    const result = await fcmService.sendNotificationToStaff(
      staffId || 'staff_siamoon',
      {
        title: '🧪 FCM Test Notification',
        body: testMessage || 'This is a test FCM notification from the admin panel',
        data: {
          type: 'test',
          timestamp: Date.now().toString(),
          source: 'admin_panel'
        }
      }
    )

    return NextResponse.json({
      success: result.success,
      service: 'FCM',
      message: result.success ? 'FCM notification sent successfully' : 'FCM notification failed',
      details: result,
      error: result.error
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      service: 'FCM',
      message: 'FCM test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function testExpoNotifications(staffId: string, testMessage: string) {
  try {
    const { ExpoPushService } = await import('@/services/ExpoPushService')

    const result = await ExpoPushService.sendToStaff(
      [staffId || 'staff_siamoon'],
      '🧪 Expo Test Notification',
      testMessage || 'This is a test Expo notification from the admin panel',
      {
        type: 'test',
        timestamp: Date.now().toString(),
        source: 'admin_panel'
      }
    )

    return NextResponse.json({
      success: result.success,
      service: 'Expo',
      message: result.success ? 'Expo notification sent successfully' : 'Expo notification failed',
      details: result,
      error: result.error
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      service: 'Expo',
      message: 'Expo test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function testMobileNotificationService(staffId: string, testMessage: string) {
  try {
    const { MobileNotificationService } = await import('@/services/MobileNotificationService')

    const result = await MobileNotificationService.createJobNotification(
      'gTtR5gSKOtUEweLwchSnVreylMy1', // staff@siamoon.com UID
      `test_job_${Date.now()}`,
      {
        title: '🧪 Mobile Service Test Job',
        description: testMessage || 'This is a test job notification from the admin panel',
        priority: 'medium',
        status: 'assigned',
        scheduledDate: new Date().toISOString().split('T')[0],
        scheduledStartTime: '14:00',
        estimatedDuration: 60
      },
      'job_assigned'
    )

    return NextResponse.json({
      success: result.success,
      service: 'MobileNotificationService',
      message: result.message,
      notificationId: result.notificationId
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      service: 'MobileNotificationService',
      message: 'Mobile notification service test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function checkDeviceTokens(staffId: string) {
  try {
    const { getDb } = await import('@/lib/firebase')
    const { collection, query, where, getDocs } = await import('firebase/firestore')

    const db = getDb()

    // Check FCM tokens
    const fcmQuery = query(collection(db, 'fcm_device_tokens'), where('staffId', '==', staffId || 'staff_siamoon'))
    const fcmSnapshot = await getDocs(fcmQuery)
    const fcmTokens = fcmSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    // Check Expo tokens in staff_accounts
    const staffQuery = query(collection(db, 'staff_accounts'), where('email', '==', 'staff@siamoon.com'))
    const staffSnapshot = await getDocs(staffQuery)
    const staffData = staffSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    return NextResponse.json({
      success: true,
      message: 'Device tokens retrieved',
      data: {
        fcmTokens: fcmTokens,
        fcmTokenCount: fcmTokens.length,
        staffAccounts: staffData,
        staffAccountCount: staffData.length,
        expoTokens: staffData.filter(staff => staff.expoPushToken).map(staff => ({
          id: staff.id,
          email: staff.email,
          expoPushToken: staff.expoPushToken,
          platform: staff.expoPushTokenPlatform,
          lastUpdated: staff.expoPushTokenUpdatedAt
        }))
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to check device tokens',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function registerTestToken(staffId: string, token: string, platform: string) {
  try {
    if (!token) {
      return NextResponse.json({
        success: false,
        message: 'Token is required'
      })
    }

    const { MobileNotificationService } = await import('@/services/MobileNotificationService')

    const result = await MobileNotificationService.registerFCMToken(
      'gTtR5gSKOtUEweLwchSnVreylMy1', // staff@siamoon.com UID
      token,
      platform as 'ios' | 'android' | 'web'
    )

    return NextResponse.json({
      success: result.success,
      message: result.message,
      service: 'MobileNotificationService'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to register test token',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function createTestJobDirect() {
  try {
    const { JobsCollectionInitializer } = await import('@/services/JobsCollectionInitializer')

    const result = await JobsCollectionInitializer.createTestJobForStaffSiamoon()

    return NextResponse.json({
      success: result.success,
      message: result.message,
      jobId: result.jobId,
      notificationId: result.notificationId,
      service: 'JobsCollectionInitializer'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to create test job directly',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'check_tokens') {
      return await checkDeviceTokens(searchParams.get('staffId') || 'staff_siamoon')
    }

    return NextResponse.json({
      success: true,
      message: 'Test Notifications API is running',
      availableActions: [
        'test_fcm',
        'test_expo',
        'test_mobile_service',
        'check_tokens',
        'register_test_token',
        'create_test_job'
      ]
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'GET request failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
