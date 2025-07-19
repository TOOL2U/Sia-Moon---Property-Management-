/**
 * Expo Push Token Registration API
 * Handles Expo push token registration for mobile app notifications
 */

import { NextRequest, NextResponse } from 'next/server'
import ExpoPushService from '@/services/ExpoPushService'

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
 * POST /api/mobile/expo-token
 * Register Expo push token for a staff member
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
    const { staffId, expoPushToken, platform, appVersion } = body

    console.log('📱 Expo push token registration:', { staffId, platform, appVersion })

    // Validate required fields
    if (!staffId || !expoPushToken || !platform) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: staffId, expoPushToken, platform' },
        { status: 400 }
      )
    }

    // Validate token format
    if (!ExpoPushService.isValidExpoPushToken(expoPushToken)) {
      return NextResponse.json(
        { success: false, error: 'Invalid Expo push token format' },
        { status: 400 }
      )
    }

    // Store token via service
    const result = await ExpoPushService.storeExpoPushToken(
      staffId,
      expoPushToken,
      platform,
      appVersion || '1.0.0'
    )

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    console.log(`✅ Expo push token registered for staff ${staffId}`)

    return NextResponse.json({
      success: true,
      data: {
        staffId,
        platform,
        registeredAt: new Date().toISOString()
      },
      message: 'Expo push token registered successfully'
    })

  } catch (error) {
    console.error('❌ Expo push token registration API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to register Expo push token'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/mobile/expo-token
 * Remove Expo push token (on logout or app uninstall)
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
    const staffId = searchParams.get('staffId')

    if (!staffId) {
      return NextResponse.json(
        { success: false, error: 'Missing staffId parameter' },
        { status: 400 }
      )
    }

    console.log('📱 Expo push token removal for staff:', staffId)

    // Remove token via service
    const result = await ExpoPushService.removeExpoPushToken(staffId)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    console.log(`✅ Expo push token removed for staff ${staffId}`)

    return NextResponse.json({
      success: true,
      message: 'Expo push token removed successfully'
    })

  } catch (error) {
    console.error('❌ Expo push token removal API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to remove Expo push token'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/mobile/expo-token
 * Check if staff member has a valid Expo push token
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate mobile request
    if (!authenticateMobileRequest(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized mobile request' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get('staffId')

    if (!staffId) {
      return NextResponse.json(
        { success: false, error: 'Missing staffId parameter' },
        { status: 400 }
      )
    }

    // Get tokens for this staff member
    const result = await ExpoPushService.getStaffExpoPushTokens([staffId])

    return NextResponse.json({
      success: true,
      hasValidToken: result.tokens.length > 0,
      tokenCount: result.tokens.length
    })

  } catch (error) {
    console.error('❌ Expo push token check API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to check Expo push token'
      },
      { status: 500 }
    )
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-Mobile-Secret',
    },
  })
}
