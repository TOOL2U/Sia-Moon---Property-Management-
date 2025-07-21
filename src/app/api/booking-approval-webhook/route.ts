import { db } from '@/lib/firebase'
import { BookingApprovalWorkflow } from '@/services/BookingApprovalWorkflow'
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore'
import { NextRequest, NextResponse } from 'next/server'

// Use existing Firebase instance

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Booking Approval Webhook: Processing request...')

    const body = await request.json()
    const { bookingId, oldStatus, newStatus, triggeredBy } = body

    // Validate required fields
    if (!bookingId || !oldStatus || !newStatus) {
      console.error('❌ Missing required fields:', { bookingId, oldStatus, newStatus })
      return NextResponse.json(
        { success: false, error: 'Missing required fields: bookingId, oldStatus, newStatus' },
        { status: 400 }
      )
    }

    // Only process approvals (pending_approval -> approved)
    if (oldStatus !== 'pending_approval' || newStatus !== 'approved') {
      console.log('📋 Booking status change not relevant for approval workflow:', { oldStatus, newStatus })
      return NextResponse.json({
        success: true,
        message: 'Status change not relevant for approval workflow',
        processed: false
      })
    }

    console.log('✅ Processing booking approval:', { bookingId, triggeredBy })

    // Get booking details
    if (!db) {
      return NextResponse.json({ success: false, error: 'Firebase not initialized' }, { status: 500 })
    }

    const bookingRef = doc(db, 'pending_bookings', bookingId)
    const bookingSnap = await getDoc(bookingRef)

    if (!bookingSnap.exists()) {
      console.error('❌ Booking not found:', bookingId)
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      )
    }

    const bookingData = bookingSnap.data()
    console.log('📋 Booking data retrieved:', {
      id: bookingId,
      property: bookingData.propertyName,
      guest: bookingData.guestName,
      checkIn: bookingData.checkInDate,
      checkOut: bookingData.checkOutDate
    })

    // Initialize the booking approval workflow
    const workflow = new BookingApprovalWorkflow()

    // Start the automated approval process
    const result = await workflow.processApprovedBooking({
      bookingId,
      bookingData,
      triggeredBy: triggeredBy || 'system'
    })

    // Log the workflow execution
    await addDoc(collection(db, 'ai_action_logs'), {
      timestamp: serverTimestamp(),
      agent: 'booking-approval-workflow',
      action: 'process_approved_booking',
      bookingId,
      result,
      triggeredBy: triggeredBy || 'system',
      success: result.success,
      details: {
        availabilityCheck: result.availabilityCheck,
        calendarIntegration: result.calendarIntegration,
        conflictResolution: result.conflictResolution || null,
        notifications: result.notifications
      }
    })

    console.log('🎉 Booking approval workflow completed:', result)

    return NextResponse.json({
      success: true,
      message: 'Booking approval workflow completed',
      result
    })

  } catch (error) {
    console.error('❌ Booking approval webhook error:', error)

    // Log the error
    try {
      if (db) {
        await addDoc(collection(db, 'ai_action_logs'), {
          timestamp: serverTimestamp(),
          agent: 'booking-approval-workflow',
          action: 'process_approved_booking_error',
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false
        })
      }
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Booking Approval Webhook is active',
    endpoints: {
      webhook: 'POST /api/booking-approval-webhook',
      description: 'Processes booking status changes from pending_approval to approved'
    },
    requiredFields: ['bookingId', 'oldStatus', 'newStatus'],
    optionalFields: ['triggeredBy']
  })
}
