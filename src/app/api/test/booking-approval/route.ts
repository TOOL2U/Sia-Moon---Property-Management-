import { NextRequest, NextResponse } from 'next/server'
import { BookingService } from '@/lib/services/bookingService'

/**
 * API Route: POST /api/test/booking-approval
 * 
 * Test the enhanced booking approval process with client profile matching
 */
export async function POST(request: NextRequest) {
  try {
    const { bookingId, status, adminNotes } = await request.json()

    if (!bookingId) {
      return NextResponse.json({
        success: false,
        error: 'Booking ID is required'
      }, { status: 400 })
    }

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({
        success: false,
        error: 'Status must be either "approved" or "rejected"'
      }, { status: 400 })
    }

    console.log(`🧪 Testing booking approval for: ${bookingId}`)
    console.log(`📝 Status: ${status}`)
    console.log(`💬 Admin notes: ${adminNotes || 'None'}`)

    // Use the enhanced booking approval process
    const result = await BookingService.updateBookingStatus(bookingId, status, adminNotes)

    if (result) {
      const responseData: Record<string, unknown> = {
        success: true,
        message: `Booking ${status} successfully`,
        bookingId,
        status
      }

      if (status === 'approved') {
        responseData.clientMatchingTriggered = true
        responseData.note = 'Client profile matching was automatically triggered'
      }

      return NextResponse.json(responseData)
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to update booking status'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Error in booking approval test:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * API Route: GET /api/test/booking-approval
 * 
 * Get test instructions for booking approval
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    title: 'Booking Approval Test API',
    description: 'Test the enhanced booking approval process with automatic client profile matching',
    usage: {
      method: 'POST',
      endpoint: '/api/test/booking-approval',
      body: {
        bookingId: 'string (required) - The ID of the booking to approve/reject',
        status: 'string (required) - "approved" or "rejected"',
        adminNotes: 'string (optional) - Admin notes for the approval/rejection'
      }
    },
    workflow: [
      '1. Updates the booking status in the database',
      '2. If status is "approved", automatically triggers client profile matching',
      '3. Searches for client profiles with matching property names',
      '4. If match found, adds booking to client profile',
      '5. Updates booking with client match information',
      '6. Returns success response with details'
    ],
    testSteps: [
      '1. First, create a test booking using /api/booking-test',
      '2. Note the booking ID from the response',
      '3. Call this endpoint with status "approved"',
      '4. Check the response for clientMatchingTriggered: true',
      '5. Verify the booking appears in the matched client profile'
    ]
  })
}
