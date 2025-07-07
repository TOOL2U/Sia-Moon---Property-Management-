import { NextRequest, NextResponse } from 'next/server'
import { NotificationService } from '@/lib/notifications/notificationService'

/**
 * API Route: POST /api/notifications
 * 
 * Send a notification to a user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
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
    if (!userId || !category || !title || !message) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: userId, category, title, message'
      }, { status: 400 })
    }
    
    console.log(`📢 API: Sending notification to user ${userId}: ${title}`)
    
    // Send the notification
    const result = await NotificationService.sendNotification({
      userId,
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
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Notification sent successfully',
        notificationId: result.notificationId,
        deliveryResults: result.deliveryResults
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        deliveryResults: result.deliveryResults
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ Error in notification API:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * API Route: GET /api/notifications
 * 
 * Get information about the notifications API
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Notifications API is operational',
    endpoints: {
      send_notification: 'POST /api/notifications',
      send_bulk: 'POST /api/notifications/bulk',
      get_user_notifications: 'GET /api/notifications/user/[userId]',
      mark_read: 'PUT /api/notifications/[notificationId]/read'
    },
    documentation: {
      description: 'Notification system API for email, push, and in-app notifications',
      features: [
        'Multi-channel notification delivery',
        'Email notifications via Make.com webhook',
        'Push notifications via OneSignal',
        'In-app notification management',
        'User preference management'
      ],
      example_request: {
        userId: 'user-id',
        category: 'task_assigned',
        title: 'New Task Assigned',
        message: 'You have been assigned a new cleaning task.',
        data: {
          task_id: 'task-123',
          property_name: 'Villa Paradise'
        },
        priority: 'normal',
        channels: ['email', 'push', 'in_app']
      }
    }
  })
}
