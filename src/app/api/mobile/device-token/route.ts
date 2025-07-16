/**
 * Mobile Device Token Registration API
 * Handles FCM device token registration for push notifications
 */

import { NextRequest, NextResponse } from 'next/server'
import JobAssignmentService from '@/services/JobAssignmentService'

// Mobile API authentication headers
const MOBILE_API_KEY = 'sia-moon-mobile-app-2025-secure-key'
const MOBILE_SECRET = 'mobile-app-sync-2025-secure'

/**
 * Authenticate mobile app requests
 */
function authenticateMobileRequest(request: NextRequest): boolean {
  const apiKey = request.headers.get('X-API-Key')
  const mobileSecret = request.headers.get('X-Mobile-Secret')
  
  return apiKey === MOBILE_API_KEY && mobileSecret === MOBILE_SECRET
}

/**
 * POST /api/mobile/device-token
 * Register device token for push notifications
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate mobile request
    if (!authenticateMobileRequest(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized mobile request' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { staffId, deviceToken, platform, appVersion } = body

    console.log('📱 Mobile device token registration:', { staffId, platform, appVersion })

    // Validate required fields
    if (!staffId || !deviceToken || !platform) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: staffId, deviceToken, platform' },
        { status: 400 }
      )
    }

    // Register device token via service
    const result = await JobAssignmentService.registerDeviceToken(
      staffId,
      deviceToken,
      platform
    )

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    console.log(`✅ Device token registered for staff ${staffId}`)

    return NextResponse.json({
      success: true,
      data: {
        staffId,
        platform,
        registeredAt: new Date().toISOString()
      },
      message: 'Device token registered successfully'
    })

  } catch (error) {
    console.error('❌ Mobile device token registration API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to register device token'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/mobile/device-token
 * Remove device token (on logout or app uninstall)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate mobile request
    if (!authenticateMobileRequest(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized mobile request' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const deviceToken = searchParams.get('token')

    if (!deviceToken) {
      return NextResponse.json(
        { success: false, error: 'Missing device token parameter' },
        { status: 400 }
      )
    }

    console.log('📱 Mobile device token removal:', deviceToken.substring(0, 20) + '...')

    // Remove device token via FCM service
    const FCMNotificationService = (await import('@/services/FCMNotificationService')).default
    await FCMNotificationService.removeDeviceToken(deviceToken)

    console.log(`✅ Device token removed`)

    return NextResponse.json({
      success: true,
      message: 'Device token removed successfully'
    })

  } catch (error) {
    console.error('❌ Mobile device token removal API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to remove device token'
      },
      { status: 500 }
    )
  }
}
