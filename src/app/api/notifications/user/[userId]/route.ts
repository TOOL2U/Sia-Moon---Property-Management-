import { NextRequest, NextResponse } from 'next/server'
import DatabaseService from '@/lib/dbService'

/**
 * API Route: GET /api/notifications/user/[userId]
 * 
 * Get all notifications for a specific user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }
    
    console.log(`📢 API: Fetching notifications for user ${userId}`)
    
    // Get user notifications
    const notificationsResult = await DatabaseService.getNotificationsByUser(userId)
    
    if (notificationsResult.error) {
      return NextResponse.json({
        success: false,
        error: notificationsResult.error.message
      }, { status: 500 })
    }
    
    const notifications = notificationsResult.data || []
    const unreadCount = notifications.filter(n => n.status !== 'read').length
    
    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
      total: notifications.length
    })
    
  } catch (error) {
    console.error('❌ Error fetching user notifications:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
