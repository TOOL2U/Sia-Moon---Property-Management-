import { NextRequest, NextResponse } from 'next/server'
import { NotificationService } from '@/lib/notifications/notificationService'

/**
 * API Route: POST /api/notifications/bulk
 * 
 * Send notifications to multiple users
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userIds,
      category,
      title,
      message,
      data,
      priority = 'normal',
      channels,
      emailSubject,
      emailTemplate,
      pushTitle,
      pushBody,
      pushUrl
    } = body
    
    // Validate required fields
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'userIds must be a non-empty array'
      }, { status: 400 })
    }
    
    if (!category || !title || !message) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: category, title, message'
      }, { status: 400 })
    }
    
    console.log(`📢 API: Sending bulk notification to ${userIds.length} users: ${title}`)
    
    // Send bulk notifications
    const results = await NotificationService.sendBulkNotification(userIds, {
      category,
      title,
      message,
      data,
      priority,
      channels,
      emailSubject,
      emailTemplate,
      pushTitle,
      pushBody,
      pushUrl
    })
    
    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length
    
    return NextResponse.json({
      success: true,
      message: `Bulk notification sent: ${successCount} successful, ${failureCount} failed`,
      summary: {
        total: userIds.length,
        successful: successCount,
        failed: failureCount
      },
      results
    })
    
  } catch (error) {
    console.error('❌ Error in bulk notification API:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * API Route: GET /api/notifications/bulk
 * 
 * Get information about the bulk notifications API
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Bulk notifications API is operational',
    description: 'Send notifications to multiple users at once',
    example_request: {
      userIds: ['user-1', 'user-2', 'user-3'],
      category: 'system_alert',
      title: 'System Maintenance',
      message: 'Scheduled maintenance will occur tonight from 2-4 AM.',
      priority: 'high',
      channels: ['email', 'push', 'in_app']
    },
    use_cases: [
      'System-wide announcements',
      'Emergency notifications',
      'Marketing campaigns',
      'Maintenance alerts'
    ]
  })
}
