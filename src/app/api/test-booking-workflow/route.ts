import { db } from '@/lib/firebase'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // 🔴 CRITICAL SECURITY: Prevent test endpoint access in production
    if (process.env.NODE_ENV === 'production') {
      console.log('🚫 Test endpoint blocked in production environment')
      return NextResponse.json(
        { 
          error: 'Test endpoints are disabled in production',
          message: 'This endpoint is only available in development mode'
        },
        { status: 403 }
      )
    }

    console.log('🧪 Testing complete booking approval workflow...')

    const body = await request.json()
    const {
      propertyName = 'Test Villa',
      guestName = 'Test Guest',
      guestEmail = 'test@example.com',
      checkInDate,
      checkOutDate,
      createConflicts = false
    } = body

    // Set default dates if not provided
    const defaultCheckIn = new Date()
    defaultCheckIn.setDate(defaultCheckIn.getDate() + 7) // 7 days from now

    const defaultCheckOut = new Date()
    defaultCheckOut.setDate(defaultCheckOut.getDate() + 10) // 10 days from now

    const finalCheckInDate = checkInDate || defaultCheckIn.toISOString().split('T')[0]
    const finalCheckOutDate = checkOutDate || defaultCheckOut.toISOString().split('T')[0]

    console.log('📋 Creating test booking with:', {
      propertyName,
      guestName,
      checkIn: finalCheckInDate,
      checkOut: finalCheckOutDate,
      createConflicts
    })

    // Step 1: Create a test booking in pending_approval status
    const testBookingData = {
      propertyName,
      guestName,
      guestEmail,
      checkInDate: finalCheckInDate,
      checkOutDate: finalCheckOutDate,
      guestCount: 2,
      price: 500,
      specialRequests: 'Test booking for workflow demonstration',
      status: 'pending_approval',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      source: 'workflow_test',
      testBooking: true
    }

    if (!db) {
      return NextResponse.json({ success: false, error: 'Firebase not initialized' }, { status: 500 })
    }

    const bookingRef = await addDoc(collection(db, 'pending_bookings'), testBookingData)
    const bookingId = bookingRef.id

    console.log('✅ Test booking created:', bookingId)

    // Step 2: Optionally create conflicts for testing AI resolution
    if (createConflicts) {
      console.log('🔧 Creating test conflicts...')

      // Create a conflicting calendar event
      const conflictEventData = {
        title: 'Test Maintenance Event',
        propertyName,
        startDate: finalCheckInDate,
        endDate: finalCheckInDate,
        type: 'maintenance',
        status: 'scheduled',
        createdAt: serverTimestamp(),
        testEvent: true,
        description: 'Test conflict for workflow demonstration'
      }

      if (db) {
        await addDoc(collection(db, 'calendarEvents'), conflictEventData)
        console.log('✅ Test conflict event created')
      }
    }

    // Step 3: Trigger the booking approval workflow
    console.log('🚀 Triggering booking approval workflow...')

    const triggerUrl = `${request.nextUrl.origin}/api/trigger-booking-approval`

    const triggerResponse = await fetch(triggerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bookingId,
        triggeredBy: 'workflow_test'
      })
    })

    const triggerResult = await triggerResponse.json()

    if (!triggerResponse.ok) {
      console.error('❌ Workflow trigger failed:', triggerResult)
      return NextResponse.json(
        {
          success: false,
          error: 'Workflow trigger failed',
          details: triggerResult,
          testBookingId: bookingId
        },
        { status: 500 }
      )
    }

    console.log('🎉 Complete booking approval workflow test completed successfully!')

    return NextResponse.json({
      success: true,
      message: 'Complete booking approval workflow test completed successfully',
      testResults: {
        bookingCreated: {
          bookingId,
          propertyName,
          guestName,
          checkInDate: finalCheckInDate,
          checkOutDate: finalCheckOutDate,
          status: 'pending_approval → approved'
        },
        conflictsCreated: createConflicts,
        workflowTriggered: true,
        workflowResult: triggerResult.workflowResult
      },
      nextSteps: [
        'Check the AI Logs dashboard to see the workflow execution',
        'Verify calendar events were created (if no conflicts)',
        'Check notifications were sent to property managers and guests',
        'Review conflict resolution (if conflicts were created)',
        'Examine the updated booking record in Firebase'
      ],
      dashboardLinks: {
        aiLogs: '/dashboard/ai?section=logs',
        bookings: '/backoffice?tab=bookings',
        calendar: '/backoffice?tab=calendar'
      }
    })
  } catch (error) {
    console.error('❌ Booking workflow test error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Booking workflow test failed'
      },
      { status: 500 }
    )
  }
}

// GET endpoint for test documentation
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Booking Approval Workflow Test Endpoint',
    description: 'Create a test booking and trigger the complete automated approval workflow',
    endpoints: {
      test: 'POST /api/test-booking-workflow',
      trigger: 'POST /api/trigger-booking-approval',
      webhook: 'POST /api/booking-approval-webhook'
    },
    testOptions: {
      method: 'POST',
      body: {
        propertyName: 'string (optional) - Property name for test booking',
        guestName: 'string (optional) - Guest name for test booking',
        guestEmail: 'string (optional) - Guest email for notifications',
        checkInDate: 'string (optional) - Check-in date (YYYY-MM-DD)',
        checkOutDate: 'string (optional) - Check-out date (YYYY-MM-DD)',
        createConflicts: 'boolean (optional) - Create test conflicts for AI resolution'
      }
    },
    workflowSteps: [
      '1. Create test booking in pending_approval status',
      '2. Optionally create calendar conflicts for testing',
      '3. Trigger automated approval workflow',
      '4. Perform availability check',
      '5. AI conflict resolution (if conflicts exist)',
      '6. Calendar integration and event creation',
      '7. Database updates with workflow results',
      '8. Automated notifications to all stakeholders'
    ],
    exampleUsage: {
      basicTest: {
        method: 'POST',
        body: {}
      },
      conflictTest: {
        method: 'POST',
        body: {
          propertyName: 'Maya House',
          guestName: 'John Doe',
          guestEmail: 'john@example.com',
          createConflicts: true
        }
      }
    }
  })
}