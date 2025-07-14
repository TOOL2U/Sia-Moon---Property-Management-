import { NextResponse } from 'next/server'

/**
 * GET /api/admin/list-bookings
 * Simple endpoint to check what bookings exist
 */
export async function GET() {
  try {
    console.log('📋 ADMIN: List bookings request received')
    
    // Try to use the existing BookingService
    const { BookingService } = await import('@/lib/services/bookingService')
    
    console.log('📋 ADMIN: Fetching all bookings...')
    const allBookings = await BookingService.getAllBookings()
    
    console.log(`📊 ADMIN: Found ${allBookings.length} bookings`)
    
    return NextResponse.json({
      success: true,
      count: allBookings.length,
      bookings: allBookings.map(booking => ({
        id: booking.id,
        guestName: booking.guestName,
        villaName: booking.villaName,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        status: booking.status,
        receivedAt: booking.receivedAt
      }))
    })
    
  } catch (error) {
    console.error('❌ ADMIN: Error listing bookings:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to list bookings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
