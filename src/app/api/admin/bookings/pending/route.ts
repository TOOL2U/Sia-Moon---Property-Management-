import { NextRequest, NextResponse } from 'next/server'
import { BookingService } from '@/lib/services/bookingService'

/**
 * GET /api/admin/bookings/pending
 * 
 * Fetch all pending bookings for admin review
 * This endpoint is used by the admin dashboard and diagnostic tools
 */
export async function GET() {
  try {
    console.log('📋 Admin API: Fetching pending bookings...')
    
    // Get all pending bookings
    const pendingBookings = await BookingService.getPendingBookings()
    
    console.log(`✅ Admin API: Found ${pendingBookings.length} pending bookings`)
    
    return NextResponse.json({
      success: true,
      bookings: pendingBookings,
      count: pendingBookings.length,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Admin API: Error fetching pending bookings:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch pending bookings',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * POST /api/admin/bookings/pending
 * 
 * Update booking status (approve/reject)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookingId, action, adminNotes } = body
    
    console.log(`📝 Admin API: ${action} booking ${bookingId}`)
    
    if (!bookingId || !action) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: bookingId and action'
      }, { status: 400 })
    }
    
    if (!['approved', 'rejected'].includes(action)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid action. Must be "approved" or "rejected"'
      }, { status: 400 })
    }
    
    // Update booking status
    const success = await BookingService.updateBookingStatus(bookingId, action, adminNotes)
    
    if (success) {
      console.log(`✅ Admin API: Booking ${bookingId} ${action} successfully`)
      
      return NextResponse.json({
        success: true,
        message: `Booking ${action} successfully`,
        bookingId,
        action,
        timestamp: new Date().toISOString()
      })
    } else {
      console.error(`❌ Admin API: Failed to ${action} booking ${bookingId}`)
      
      return NextResponse.json({
        success: false,
        error: `Failed to ${action} booking`,
        bookingId,
        action
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ Admin API: Error updating booking status:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update booking status',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
