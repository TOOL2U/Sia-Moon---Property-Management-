import { NextRequest, NextResponse } from 'next/server'
import { AIPropertyMatchingService } from '@/lib/services/aiPropertyMatchingService'
import { collection, getDocs, query, orderBy, limit, doc, setDoc, Timestamp } from 'firebase/firestore'
import { getDb } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing AI property matching system')
    
    const { action, bookingId, testData } = await request.json()
    
    if (action === 'create_test_booking') {
      // Create a test booking for matching
      const testBooking = testData || {
        property: 'Villa Mango Beach',
        address: '55/45 Moo 8 Koh Phangan',
        guestName: 'AI Test User',
        guestEmail: 'aitest@example.com',
        checkInDate: '2025-08-15',
        checkOutDate: '2025-08-20',
        nights: 5,
        guests: 2,
        price: 30000,
        subject: 'AI Matching Test Booking',
        emailDate: new Date().toISOString(),
        status: 'approved', // Set as approved to trigger matching
        source: 'ai_matching_test',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }
      
      // Save to pending_bookings
      const pendingRef = doc(collection(getDb(), 'pending_bookings'))
      await setDoc(pendingRef, testBooking)
      const testBookingId = pendingRef.id
      
      console.log('✅ Test booking created:', testBookingId)
      
      // Now test the matching
      const matchResult = await AIPropertyMatchingService.matchAndAssignBooking(testBookingId, testBooking)
      
      return NextResponse.json({
        success: true,
        message: 'Test booking created and AI matching attempted',
        testBookingId,
        testBooking,
        matchResult
      })
    }
    
    if (action === 'match_existing' && bookingId) {
      // Test matching on existing booking
      console.log('🧪 Testing AI matching on existing booking:', bookingId)
      
      // Get booking data
      const pendingRef = doc(getDb(), 'pending_bookings', bookingId)
      const pendingSnap = await (await import('firebase/firestore')).getDoc(pendingRef)
      
      if (!pendingSnap.exists()) {
        return NextResponse.json({
          success: false,
          error: 'Booking not found'
        }, { status: 404 })
      }
      
      const bookingData = pendingSnap.data()
      const matchResult = await AIPropertyMatchingService.matchAndAssignBooking(bookingId, bookingData)
      
      return NextResponse.json({
        success: true,
        message: 'AI matching attempted on existing booking',
        bookingId,
        bookingData,
        matchResult
      })
    }
    
    if (action === 'test_property_search') {
      // Test property search functionality
      const searchTerm = testData?.propertyName || 'Villa Mango Beach'
      console.log('🧪 Testing property search for:', searchTerm)
      
      const match = await AIPropertyMatchingService.findPropertyMatch(searchTerm)
      
      return NextResponse.json({
        success: true,
        message: 'Property search test completed',
        searchTerm,
        match
      })
    }
    
    if (action === 'list_recent_bookings') {
      // List recent bookings for testing
      const pendingQuery = query(
        collection(getDb(), 'pending_bookings'),
        orderBy('createdAt', 'desc'),
        limit(5)
      )
      
      const pendingSnapshot = await getDocs(pendingQuery)
      const recentBookings = pendingSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      return NextResponse.json({
        success: true,
        message: 'Recent bookings retrieved',
        recentBookings
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action. Supported actions: create_test_booking, match_existing, test_property_search, list_recent_bookings'
    }, { status: 400 })

  } catch (error) {
    console.error('❌ AI property matching test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: 'AI Property Matching Test API',
      endpoints: {
        POST: 'Test AI property matching functionality'
      },
      actions: {
        create_test_booking: 'Create a test booking and attempt AI matching',
        match_existing: 'Test AI matching on existing booking (requires bookingId)',
        test_property_search: 'Test property search functionality (requires testData.propertyName)',
        list_recent_bookings: 'List recent bookings for testing'
      },
      examples: {
        create_test_booking: {
          action: 'create_test_booking',
          testData: {
            property: 'Villa Sunset Paradise',
            address: '123 Beach Road',
            guestName: 'Test User',
            guestEmail: 'test@example.com',
            checkInDate: '2025-09-01',
            checkOutDate: '2025-09-05',
            nights: 4,
            guests: 2,
            price: 25000
          }
        },
        match_existing: {
          action: 'match_existing',
          bookingId: 'your-booking-id-here'
        },
        test_property_search: {
          action: 'test_property_search',
          testData: {
            propertyName: 'Villa Mango Beach'
          }
        }
      }
    })
  } catch (error) {
    console.error('❌ AI property matching test API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Service unavailable'
    }, { status: 503 })
  }
}
