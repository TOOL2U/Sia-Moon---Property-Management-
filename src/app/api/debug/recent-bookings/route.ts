import { NextRequest, NextResponse } from 'next/server'
import { collection, getDocs, query, orderBy, limit, Firestore } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Use the centralized Firebase db instance

// Helper function to ensure db is available
function getDb(): Firestore {
  if (!db) {
    throw new Error('Firebase database not initialized')
  }
  return db
}

export async function GET() {
  try {
    console.log('🔍 BOOKINGS DEBUG: Fetching recent bookings from Firebase...')
    
    // Get recent bookings from live_bookings collection
    const q = query(
      collection(db, 'live_bookings'),
      orderBy('receivedAt', 'desc'),
      limit(10)
    )
    
    const querySnapshot = await getDocs(q)
    const bookings: any[] = []
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      bookings.push({
        id: doc.id,
        villaName: data.villaName,
        guestName: data.guestName,
        clientId: data.clientId,
        matchConfidence: data.matchConfidence,
        bookingSource: data.bookingSource,
        receivedAt: data.receivedAt,
        originalPayload: data.originalPayload,
        // Include all data for debugging
        allData: data
      })
    })
    
    console.log(`🔍 BOOKINGS DEBUG: Found ${bookings.length} recent bookings`)
    
    // Look specifically for "Donkey House" bookings
    const donkeyBookings = bookings.filter(b => 
      b.villaName && b.villaName.toLowerCase().includes('donkey')
    )
    
    console.log('🔍 BOOKINGS DEBUG: Donkey House bookings:', donkeyBookings)
    
    // Get the most recent booking for detailed analysis
    const mostRecent = bookings[0]
    
    return NextResponse.json({
      success: true,
      totalBookings: bookings.length,
      recentBookings: bookings,
      donkeyBookings,
      mostRecentBooking: mostRecent,
      debug: {
        lastBookingVillaName: mostRecent?.villaName,
        lastBookingClientId: mostRecent?.clientId,
        lastBookingMatchConfidence: mostRecent?.matchConfidence,
        lastBookingSource: mostRecent?.bookingSource
      }
    })
    
  } catch (error) {
    console.error('❌ BOOKINGS DEBUG: Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch bookings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
