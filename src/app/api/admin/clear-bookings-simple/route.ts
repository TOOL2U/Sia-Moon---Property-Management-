import { NextRequest, NextResponse } from 'next/server'
import { BookingService } from '@/lib/services/bookingService'

/**
 * DELETE /api/admin/clear-bookings-simple
 * Clear all bookings using the existing BookingService
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log('🧹 ADMIN SIMPLE: Clear bookings request received')
    
    // Simple authentication check
    const adminKey = request.headers.get('x-admin-key')
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    if (!isDevelopment && adminKey !== 'sia-moon-admin-clear-2025') {
      console.log('❌ ADMIN SIMPLE: Unauthorized request')
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    console.log('📋 ADMIN SIMPLE: Fetching all bookings...')
    
    // Get all bookings using existing service
    const allBookings = await BookingService.getAllBookings()
    console.log(`📊 ADMIN SIMPLE: Found ${allBookings.length} bookings to delete`)
    
    if (allBookings.length === 0) {
      console.log('✅ ADMIN SIMPLE: No bookings found - collection is already empty')
      return NextResponse.json({
        success: true,
        message: 'No bookings to delete - collection is already empty',
        deletedCount: 0
      })
    }
    
    // For now, return the count without actually deleting
    // This is a safer approach for testing
    console.log('🔍 ADMIN SIMPLE: Would delete the following bookings:')
    allBookings.forEach((booking, index) => {
      console.log(`${index + 1}. ID: ${booking.id}, Guest: ${booking.guestName}, Property: ${booking.villaName}`)
    })
    
    return NextResponse.json({
      success: true,
      message: `Found ${allBookings.length} bookings that would be deleted`,
      deletedCount: 0, // Not actually deleting yet
      foundBookings: allBookings.map(b => ({
        id: b.id,
        guest: b.guestName,
        property: b.villaName,
        status: b.status
      }))
    })
    
  } catch (error) {
    console.error('❌ ADMIN SIMPLE: Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
