/**
 * API endpoint to create a sample confirmed booking for testing job creation
 */

import { getDb } from '@/lib/firebase'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Creating sample confirmed booking for testing...')

    const db = getDb()

    // Create sample booking data
    const sampleBooking = {
      // Guest information
      guestName: 'John Test Guest',
      guestEmail: 'test@example.com',
      guestPhone: '+1234567890',
      numberOfGuests: 2,

      // Property information
      propertyId: 'test-property-001',
      propertyName: 'Test Villa Paradise',
      propertyAddress: '123 Test Beach Road, Test Island',

      // Booking dates (tomorrow to day after tomorrow)
      checkIn: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T15:00:00.000Z',
      checkOut: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T11:00:00.000Z',

      // Booking details
      status: 'pending', // Will be approved manually to trigger job creation
      totalAmount: 500,
      paymentStatus: 'paid',
      source: 'test_system',

      // Special requests
      specialRequests: 'Test booking for automatic job creation system',
      notes: 'This is a test booking created to verify automatic job creation',

      // Metadata
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: 'TEST_SYSTEM',

      // Flags
      isTestBooking: true,
      jobsCreated: false // Will be set to true when jobs are created
    }

    // Create the booking in live_bookings collection
    const bookingRef = await addDoc(collection(db, 'live_bookings'), sampleBooking)

    console.log(`✅ Created sample booking: ${bookingRef.id}`)

    return NextResponse.json({
      success: true,
      bookingId: bookingRef.id,
      message: 'Sample confirmed booking created successfully',
      bookingData: {
        ...sampleBooking,
        id: bookingRef.id
      }
    })

  } catch (error) {
    console.error('❌ Error creating sample booking:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}
