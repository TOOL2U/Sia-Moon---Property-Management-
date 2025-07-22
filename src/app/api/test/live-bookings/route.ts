import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/firebase'
import { collection, getDocs, query, limit } from 'firebase/firestore'

/**
 * Test API to check live_bookings collection
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing live_bookings collection access...')
    
    const db = getDb()
    
    // Simple query to get all documents from live_bookings
    const liveBookingsQuery = query(collection(db, 'live_bookings'), limit(10))
    const snapshot = await getDocs(liveBookingsQuery)
    
    const bookings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    console.log(`✅ Found ${bookings.length} documents in live_bookings collection`)
    
    if (bookings.length > 0) {
      console.log('📋 Sample booking:', {
        id: bookings[0].id,
        guestName: bookings[0].guestName,
        status: bookings[0].status,
        propertyName: bookings[0].propertyName,
        createdAt: bookings[0].createdAt
      })
    }
    
    return NextResponse.json({
      success: true,
      message: `Found ${bookings.length} bookings in live_bookings collection`,
      count: bookings.length,
      bookings: bookings.map(booking => ({
        id: booking.id,
        guestName: booking.guestName,
        status: booking.status,
        propertyName: booking.propertyName,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        createdAt: booking.createdAt
      }))
    })
    
  } catch (error) {
    console.error('❌ Error testing live_bookings collection:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to access live_bookings collection',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
