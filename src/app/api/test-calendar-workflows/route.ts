import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'

/**
 * 🧪 Calendar Workflows Test API
 * 
 * Comprehensive testing for booking and job calendar integration workflows
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { testType, ...testData } = body

    console.log('🧪 Testing calendar workflows:', testType)

    switch (testType) {
      case 'booking-confirmation':
        return await testBookingConfirmation(testData)
      
      case 'job-lifecycle':
        return await testJobLifecycle(testData)
      
      case 'full-workflow':
        return await testFullWorkflow(testData)
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid test type. Use: booking-confirmation, job-lifecycle, or full-workflow'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Test booking confirmation workflow
 */
async function testBookingConfirmation(testData: any) {
  console.log('🏨 Testing booking confirmation workflow...')

  // Step 1: Create a test booking
  const bookingData = {
    guestName: testData.guestName || 'Test Guest',
    guestEmail: testData.guestEmail || 'test@example.com',
    propertyName: testData.propertyName || 'Maya House',
    checkInDate: testData.checkInDate || '2026-08-01',
    checkOutDate: testData.checkOutDate || '2026-08-05',
    status: 'approved',
    totalAmount: 1500,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }

  const bookingRef = await addDoc(collection(db, 'pending_bookings'), bookingData)
  console.log('✅ Test booking created:', bookingRef.id)

  // Step 2: Trigger confirmation webhook
  const confirmationResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/booking-confirmation-webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bookingId: bookingRef.id,
      oldStatus: 'approved',
      newStatus: 'confirmed',
      triggeredBy: 'test-api'
    })
  })

  const confirmationResult = await confirmationResponse.json()

  return NextResponse.json({
    success: true,
    testType: 'booking-confirmation',
    results: {
      bookingCreated: {
        id: bookingRef.id,
        ...bookingData
      },
      confirmationWorkflow: confirmationResult
    }
  })
}

/**
 * Test job lifecycle workflow
 */
async function testJobLifecycle(testData: any) {
  console.log('🔧 Testing job lifecycle workflow...')

  // Step 1: Create a test job
  const jobData = {
    title: testData.title || 'Test Maintenance Job',
    description: testData.description || 'Testing job calendar integration',
    type: testData.type || 'maintenance',
    propertyId: testData.propertyId || 'test-property-1',
    propertyName: testData.propertyName || 'Maya House',
    status: 'unassigned',
    priority: 'medium',
    scheduledDate: testData.scheduledDate || '2026-08-01T10:00:00Z',
    estimatedDuration: 120, // 2 hours
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }

  const jobRef = await addDoc(collection(db, 'job_assignments'), jobData)
  console.log('✅ Test job created:', jobRef.id)

  const results: any = {
    jobCreated: {
      id: jobRef.id,
      ...jobData
    },
    statusChanges: []
  }

  // Step 2: Test status changes
  const statusFlow = ['assigned', 'accepted', 'in-progress', 'completed']
  let previousStatus = 'unassigned'

  for (const newStatus of statusFlow) {
    console.log(`🔄 Testing status change: ${previousStatus} -> ${newStatus}`)

    const statusResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/job-status-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: jobRef.id,
        oldStatus: previousStatus,
        newStatus: newStatus,
        triggeredBy: 'test-api'
      })
    })

    const statusResult = await statusResponse.json()
    results.statusChanges.push({
      from: previousStatus,
      to: newStatus,
      result: statusResult
    })

    previousStatus = newStatus
  }

  return NextResponse.json({
    success: true,
    testType: 'job-lifecycle',
    results
  })
}

/**
 * Test full workflow (booking + job)
 */
async function testFullWorkflow(testData: any) {
  console.log('🎯 Testing full calendar workflow...')

  // Run both tests
  const bookingTest = await testBookingConfirmation({
    guestName: 'Full Workflow Guest',
    propertyName: testData.propertyName || 'Maya House',
    checkInDate: '2026-09-01',
    checkOutDate: '2026-09-05'
  })

  const jobTest = await testJobLifecycle({
    title: 'Pre-arrival Cleaning',
    type: 'cleaning',
    propertyName: testData.propertyName || 'Maya House',
    scheduledDate: '2026-08-31T14:00:00Z'
  })

  const bookingResult = await bookingTest.json()
  const jobResult = await jobTest.json()

  return NextResponse.json({
    success: true,
    testType: 'full-workflow',
    results: {
      booking: bookingResult.results,
      job: jobResult.results
    }
  })
}

// GET endpoint for test options
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Calendar Workflows Test API',
    availableTests: {
      'booking-confirmation': {
        description: 'Test booking confirmation and calendar integration',
        parameters: {
          guestName: 'string (optional)',
          guestEmail: 'string (optional)', 
          propertyName: 'string (optional)',
          checkInDate: 'string (optional)',
          checkOutDate: 'string (optional)'
        }
      },
      'job-lifecycle': {
        description: 'Test complete job lifecycle with status-based calendar updates',
        parameters: {
          title: 'string (optional)',
          description: 'string (optional)',
          type: 'string (optional)',
          propertyName: 'string (optional)',
          scheduledDate: 'string (optional)'
        }
      },
      'full-workflow': {
        description: 'Test both booking and job workflows together',
        parameters: {
          propertyName: 'string (optional)'
        }
      }
    },
    usage: {
      method: 'POST',
      body: {
        testType: 'booking-confirmation | job-lifecycle | full-workflow',
        '...testParameters': 'based on test type'
      }
    }
  })
}
