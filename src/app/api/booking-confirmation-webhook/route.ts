import { db } from '@/lib/firebase'
import { BookingApprovalWorkflow } from '@/services/BookingApprovalWorkflow'
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore'
import { NextRequest, NextResponse } from 'next/server'

/**
 * 📅 Booking Confirmation Webhook
 *
 * Triggers calendar integration when booking status changes to "confirmed"
 * This is the production-ready workflow for automatic calendar event creation
 */

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Booking Confirmation Webhook: Processing request...')

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

    // Only process confirmations (approved -> confirmed)
    if (oldStatus !== 'approved' || newStatus !== 'confirmed') {
      console.log('📋 Booking status change not relevant for confirmation workflow:', { oldStatus, newStatus })
      return NextResponse.json({
        success: true,
        message: 'Status change not relevant for confirmation workflow',
        processed: false
      })
    }

    console.log('✅ Processing booking confirmation:', { bookingId, triggeredBy })

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

    // Initialize and run the booking approval workflow for calendar integration
    const workflow = new BookingApprovalWorkflow()

    const result = await workflow.processApprovedBooking({
      bookingId,
      bookingData,
      triggeredBy: triggeredBy || 'booking-confirmation-webhook'
    })

    console.log('🎯 Booking confirmation workflow result:', {
      success: result.success,
      calendarIntegration: result.calendarIntegration?.success,
      eventIds: result.calendarIntegration?.eventIds?.length || 0
    })

    // Log the workflow execution
    await addDoc(collection(db, 'ai_action_logs'), {
      timestamp: serverTimestamp(),
      agent: 'booking-confirmation-workflow',
      action: 'process_confirmed_booking',
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

    if (result.success) {
      console.log('✅ Booking confirmation workflow completed successfully')
      return NextResponse.json({
        success: true,
        message: 'Booking confirmation workflow completed successfully',
        result,
        calendarEvents: result.calendarIntegration?.eventIds || []
      })
    } else {
      console.error('❌ Booking confirmation workflow failed:', result.message)
      return NextResponse.json({
        success: false,
        message: result.message || 'Booking confirmation workflow failed',
        result
      }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Booking confirmation webhook error:', error)

    // Log the error
    try {
      if (db) {
        await addDoc(collection(db, 'ai_action_logs'), {
          timestamp: serverTimestamp(),
          agent: 'booking-confirmation-webhook',
          action: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false
        })
      }
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Booking Confirmation Webhook is active',
    description: 'This webhook triggers calendar integration when booking status changes to "confirmed"',
    usage: {
      method: 'POST',
      body: {
        bookingId: 'string (required)',
        oldStatus: 'string (required)',
        newStatus: 'string (required)',
        triggeredBy: 'string (optional)'
      }
    }
  })
}
