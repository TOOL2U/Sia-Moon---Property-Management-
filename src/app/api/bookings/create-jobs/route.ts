/**
 * API endpoint to create standard jobs for confirmed bookings
 */

import { getDb } from '@/lib/firebase'
import { automaticJobCreationService } from '@/services/AutomaticJobCreationService'
import { doc, getDoc } from 'firebase/firestore'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { bookingId } = await request.json()

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: 'Booking ID is required' },
        { status: 400 }
      )
    }

    console.log(`📋 Manual job creation requested for booking: ${bookingId}`)

    // Get booking data
    const db = getDb()
    const bookingRef = doc(db, 'bookings', bookingId)
    const bookingSnap = await getDoc(bookingRef)

    if (!bookingSnap.exists()) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      )
    }

    const bookingData = { id: bookingSnap.id, ...bookingSnap.data() }

    // Validate booking status
    if (!['approved', 'confirmed'].includes(bookingData.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Booking status must be 'approved' or 'confirmed', current status: ${bookingData.status}`
        },
        { status: 400 }
      )
    }

    // Check if jobs already created
    if (bookingData.jobsCreated) {
      return NextResponse.json(
        {
          success: false,
          error: 'Jobs already created for this booking',
          existingJobIds: bookingData.createdJobIds || []
        },
        { status: 409 }
      )
    }

    // Create jobs
    const result = await automaticJobCreationService.createJobsForBooking(bookingData)

    if (result.success) {
      console.log(`✅ Successfully created ${result.jobsCreated} jobs for booking ${bookingId}`)

      return NextResponse.json({
        success: true,
        message: `Created ${result.jobsCreated} standard jobs`,
        jobIds: result.jobIds,
        jobsCreated: result.jobsCreated
      })
    } else {
      console.error(`❌ Failed to create jobs for booking ${bookingId}:`, result.error)

      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ Error in create-jobs API:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('bookingId')

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: 'Booking ID is required' },
        { status: 400 }
      )
    }

    // Get booking data to check job creation status
    const db = getDb()
    const bookingRef = doc(db, 'bookings', bookingId)
    const bookingSnap = await getDoc(bookingRef)

    if (!bookingSnap.exists()) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      )
    }

    const bookingData = bookingSnap.data()

    return NextResponse.json({
      success: true,
      bookingId,
      status: bookingData.status,
      jobsCreated: bookingData.jobsCreated || false,
      jobsCreatedAt: bookingData.jobsCreatedAt || null,
      createdJobIds: bookingData.createdJobIds || [],
      assignedStaff: bookingData.assignedStaff || null,
      jobCreationError: bookingData.jobCreationError || null
    })

  } catch (error) {
    console.error('❌ Error checking job creation status:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}
