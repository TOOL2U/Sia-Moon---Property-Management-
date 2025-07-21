import { db } from '@/lib/firebase'
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { NextRequest, NextResponse } from 'next/server'

// Use existing Firebase instance

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Manual booking approval trigger: Processing request...')

    const body = await request.json()
    const { bookingId, triggeredBy } = body

    // Validate required fields
    if (!bookingId) {
      console.error('❌ Missing required field: bookingId')
      return NextResponse.json(
        { success: false, error: 'Missing required field: bookingId' },
        { status: 400 }
      )
    }

    console.log('🔄 Triggering booking approval workflow for:', bookingId)

    if (!db) {
      return NextResponse.json({ success: false, error: 'Firebase not initialized' }, { status: 500 })
    }

    // Get booking details
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
      currentStatus: bookingData.status
    })

    // Update booking status to approved to trigger the workflow
    await updateDoc(bookingRef, {
      status: 'approved',
      approvedAt: serverTimestamp(),
      approvedBy: triggeredBy || 'manual_trigger',
      updatedAt: serverTimestamp()
    })

    console.log('✅ Booking status updated to approved')

    // Call the booking approval webhook to process the workflow
    const webhookUrl = `${request.nextUrl.origin}/api/booking-approval-webhook`

    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bookingId,
        oldStatus: bookingData.status,
        newStatus: 'approved',
        triggeredBy: triggeredBy || 'manual_trigger'
      })
    })

    const webhookResult = await webhookResponse.json()

    if (!webhookResponse.ok) {
      console.error('❌ Webhook call failed:', webhookResult)
      return NextResponse.json(
        {
          success: false,
          error: 'Workflow trigger failed',
          details: webhookResult
        },
        { status: 500 }
      )
    }

    console.log('🎉 Booking approval workflow triggered successfully')

    return NextResponse.json({
      success: true,
      message: 'Booking approval workflow triggered successfully',
      bookingId,
      workflowResult: webhookResult.result,
      triggeredBy: triggeredBy || 'manual_trigger'
    })

  } catch (error) {
    console.error('❌ Manual booking approval trigger error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint for testing and documentation
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Manual Booking Approval Trigger is active',
    description: 'Manually trigger the automated booking approval workflow for testing',
    endpoints: {
      trigger: 'POST /api/trigger-booking-approval',
      webhook: 'POST /api/booking-approval-webhook'
    },
    usage: {
      method: 'POST',
      body: {
        bookingId: 'string (required) - ID of the booking to approve',
        triggeredBy: 'string (optional) - Who triggered the approval'
      }
    },
    workflow: [
      '1. Updates booking status to "approved"',
      '2. Triggers automated availability check',
      '3. Creates calendar events if no conflicts',
      '4. Uses AI to resolve conflicts if detected',
      '5. Sends notifications to all stakeholders',
      '6. Updates booking record with results'
    ]
  })
}
