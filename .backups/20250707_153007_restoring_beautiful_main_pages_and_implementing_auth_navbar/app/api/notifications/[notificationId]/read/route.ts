import { NextRequest, NextResponse } from 'next/server'
import DatabaseService from '@/lib/dbService'

/**
 * API Route: PUT /api/notifications/[notificationId]/read
 * 
 * Mark a notification as read
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const { notificationId } = await params
    
    if (!notificationId) {
      return NextResponse.json({
        success: false,
        error: 'Notification ID is required'
      }, { status: 400 })
    }
    
    console.log(`📢 API: Marking notification ${notificationId} as read`)
    
    // Mark notification as read
    const result = await DatabaseService.markNotificationAsRead(notificationId)
    
    if (result.error) {
      return NextResponse.json({
        success: false,
        error: result.error.message
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Notification marked as read',
      notification: result.data
    })
    
  } catch (error) {
    console.error('❌ Error marking notification as read:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
