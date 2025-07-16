/**
 * Mobile Notification Acknowledgment API
 * Handles notification acknowledgment from mobile app
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
 * POST /api/mobile/notifications/acknowledge
 * Acknowledge notification from mobile app
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
    const { jobId, staffId, notificationId } = body

    console.log('📱 Mobile notification acknowledgment:', { jobId, staffId, notificationId })

    // Validate required fields
    if (!jobId || !staffId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: jobId, staffId' },
        { status: 400 }
      )
    }

    // Acknowledge notification via service
    const result = await JobAssignmentService.acknowledgeNotification(
      jobId,
      staffId,
      notificationId
    )

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    console.log(`✅ Notification acknowledged for job ${jobId} by staff ${staffId}`)

    return NextResponse.json({
      success: true,
      data: {
        jobId,
        staffId,
        acknowledgedAt: new Date().toISOString()
      },
      message: 'Notification acknowledged successfully'
    })

  } catch (error) {
    console.error('❌ Mobile notification acknowledgment API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to acknowledge notification'
      },
      { status: 500 }
    )
  }
}
