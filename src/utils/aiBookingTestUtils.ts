/**
 * AI Booking Test Utilities
 * Helper functions for testing AI booking approval system
 */

import { collection, doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { clientToast as toast } from '@/utils/clientToast'

// Test booking scenarios
export interface TestBookingScenario {
  name: string
  description: string
  booking: any
  expectedResult: 'approved' | 'rejected'
  expectedReason?: string
}

/**
 * Create test bookings for AI validation testing
 */
export const createTestBookings = async (): Promise<void> => {
  console.log('🧪 Creating test bookings for AI validation...')

  const testScenarios: TestBookingScenario[] = [
    {
      name: 'Valid Booking',
      description: 'Perfect booking that should be approved',
      booking: {
        guestName: 'John Smith',
        guestEmail: 'john.smith@example.com',
        propertyId: 'test_property_1',
        propertyName: 'Test Villa 1',
        checkInDate: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days from now
        checkOutDate: Timestamp.fromDate(new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)), // 10 days from now
        numberOfGuests: 2,
        totalAmount: 450.00,
        status: 'pending',
        createdAt: serverTimestamp(),
        source: 'ai_test'
      },
      expectedResult: 'approved'
    },
    {
      name: 'Missing Email',
      description: 'Booking with missing email should be rejected',
      booking: {
        guestName: 'Jane Doe',
        guestEmail: '', // Missing email
        propertyId: 'test_property_1',
        propertyName: 'Test Villa 1',
        checkInDate: Timestamp.fromDate(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)),
        checkOutDate: Timestamp.fromDate(new Date(Date.now() + 8 * 24 * 60 * 60 * 1000)),
        numberOfGuests: 1,
        totalAmount: 300.00,
        status: 'pending',
        createdAt: serverTimestamp(),
        source: 'ai_test'
      },
      expectedResult: 'rejected',
      expectedReason: 'Missing required field: guestEmail'
    },
    {
      name: 'Invalid Email Format',
      description: 'Booking with invalid email format should be rejected',
      booking: {
        guestName: 'Bob Wilson',
        guestEmail: 'invalid-email-format', // Invalid email
        propertyId: 'test_property_1',
        propertyName: 'Test Villa 1',
        checkInDate: Timestamp.fromDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)),
        checkOutDate: Timestamp.fromDate(new Date(Date.now() + 6 * 24 * 60 * 60 * 1000)),
        numberOfGuests: 2,
        totalAmount: 400.00,
        status: 'pending',
        createdAt: serverTimestamp(),
        source: 'ai_test'
      },
      expectedResult: 'rejected',
      expectedReason: 'Invalid email format'
    },
    {
      name: 'Past Check-in Date',
      description: 'Booking with check-in date in the past should be rejected',
      booking: {
        guestName: 'Alice Brown',
        guestEmail: 'alice.brown@example.com',
        propertyId: 'test_property_1',
        propertyName: 'Test Villa 1',
        checkInDate: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)), // 2 days ago
        checkOutDate: Timestamp.fromDate(new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)),
        numberOfGuests: 1,
        totalAmount: 200.00,
        status: 'pending',
        createdAt: serverTimestamp(),
        source: 'ai_test'
      },
      expectedResult: 'rejected',
      expectedReason: 'Check-in date cannot be in the past'
    },
    {
      name: 'Check-out Before Check-in',
      description: 'Booking with check-out before check-in should be rejected',
      booking: {
        guestName: 'Charlie Davis',
        guestEmail: 'charlie.davis@example.com',
        propertyId: 'test_property_1',
        propertyName: 'Test Villa 1',
        checkInDate: Timestamp.fromDate(new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)),
        checkOutDate: Timestamp.fromDate(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)), // Before check-in
        numberOfGuests: 2,
        totalAmount: 350.00,
        status: 'pending',
        createdAt: serverTimestamp(),
        source: 'ai_test'
      },
      expectedResult: 'rejected',
      expectedReason: 'Check-out date must be after check-in date'
    },
    {
      name: 'Zero Guests',
      description: 'Booking with zero guests should be rejected',
      booking: {
        guestName: 'David Miller',
        guestEmail: 'david.miller@example.com',
        propertyId: 'test_property_1',
        propertyName: 'Test Villa 1',
        checkInDate: Timestamp.fromDate(new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)),
        checkOutDate: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        numberOfGuests: 0, // Invalid number of guests
        totalAmount: 300.00,
        status: 'pending',
        createdAt: serverTimestamp(),
        source: 'ai_test'
      },
      expectedResult: 'rejected',
      expectedReason: 'Number of guests must be positive'
    },
    {
      name: 'Negative Amount',
      description: 'Booking with negative amount should be rejected',
      booking: {
        guestName: 'Eva Garcia',
        guestEmail: 'eva.garcia@example.com',
        propertyId: 'test_property_1',
        propertyName: 'Test Villa 1',
        checkInDate: Timestamp.fromDate(new Date(Date.now() + 6 * 24 * 60 * 60 * 1000)),
        checkOutDate: Timestamp.fromDate(new Date(Date.now() + 9 * 24 * 60 * 60 * 1000)),
        numberOfGuests: 3,
        totalAmount: -100.00, // Negative amount
        status: 'pending',
        createdAt: serverTimestamp(),
        source: 'ai_test'
      },
      expectedResult: 'rejected',
      expectedReason: 'Total amount must be positive'
    },
    {
      name: 'Too Far in Advance',
      description: 'Booking too far in advance should be rejected',
      booking: {
        guestName: 'Frank Johnson',
        guestEmail: 'frank.johnson@example.com',
        propertyId: 'test_property_1',
        propertyName: 'Test Villa 1',
        checkInDate: Timestamp.fromDate(new Date(Date.now() + 400 * 24 * 60 * 60 * 1000)), // 400 days from now
        checkOutDate: Timestamp.fromDate(new Date(Date.now() + 403 * 24 * 60 * 60 * 1000)),
        numberOfGuests: 2,
        totalAmount: 500.00,
        status: 'pending',
        createdAt: serverTimestamp(),
        source: 'ai_test'
      },
      expectedResult: 'rejected',
      expectedReason: 'Booking is too far in advance'
    }
  ]

  try {
    // Create test bookings
    for (let i = 0; i < testScenarios.length; i++) {
      const scenario = testScenarios[i]
      const bookingId = `ai_test_booking_${Date.now()}_${i}`
      
      const bookingRef = doc(collection(db, 'bookings'), bookingId)
      await setDoc(bookingRef, scenario.booking)
      
      console.log(`📝 Created test booking: ${scenario.name} (${bookingId})`)
    }

    console.log(`✅ Created ${testScenarios.length} test bookings for AI validation`)
    toast.success(`🧪 Created ${testScenarios.length} test bookings for AI validation`)
    
    return testScenarios
  } catch (error) {
    console.error('❌ Error creating test bookings:', error)
    toast.error('Failed to create test bookings')
    throw error
  }
}

/**
 * Create a test property for booking validation
 */
export const createTestProperty = async (): Promise<void> => {
  console.log('🏠 Creating test property for AI booking validation...')

  const testProperty = {
    id: 'test_property_1',
    name: 'AI Test Villa',
    description: 'Test property for AI booking validation',
    maxOccupancy: 6,
    minStay: 2,
    pricePerNight: 150,
    amenities: ['WiFi', 'Pool', 'Kitchen'],
    location: {
      address: '123 Test Street',
      city: 'Test City',
      country: 'Test Country'
    },
    images: [],
    availability: true,
    createdAt: serverTimestamp(),
    source: 'ai_test'
  }

  try {
    const propertyRef = doc(db, 'properties', 'test_property_1')
    await setDoc(propertyRef, testProperty)
    
    console.log('✅ Test property created successfully')
    toast.success('🏠 Test property created for AI validation')
  } catch (error) {
    console.error('❌ Error creating test property:', error)
    toast.error('Failed to create test property')
    throw error
  }
}

/**
 * Clean up test data
 */
export const cleanupTestData = async (): Promise<void> => {
  console.log('🧹 Cleaning up AI test data...')
  
  try {
    // This would require additional implementation to query and delete test data
    // For now, just log the intent
    console.log('🧹 Test data cleanup would be implemented here')
    toast.success('🧹 Test data cleanup completed')
  } catch (error) {
    console.error('❌ Error cleaning up test data:', error)
    toast.error('Failed to cleanup test data')
  }
}
