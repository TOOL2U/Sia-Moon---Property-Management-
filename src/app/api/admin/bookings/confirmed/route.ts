import { NextRequest, NextResponse } from 'next/server'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { getDb } from '@/lib/firebase'

export async function GET(request: NextRequest) {
  try {
    console.log('📋 ADMIN: Loading confirmed bookings')
    
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const maxResults = limitParam ? parseInt(limitParam) : 50
    
    // Query confirmed_bookings collection
    const confirmedRef = collection(getDb(), 'confirmed_bookings')
    const confirmedQuery = query(
      confirmedRef,
      orderBy('createdAt', 'desc'),
      limit(maxResults)
    )
    
    const snapshot = await getDocs(confirmedQuery)
    const bookings = snapshot.docs.map(doc => ({
      id: doc.id,
      collection: 'confirmed_bookings',
      ...doc.data()
    }))
    
    console.log(`✅ ADMIN: Loaded ${bookings.length} confirmed bookings`)
    
    return NextResponse.json({
      success: true,
      bookings,
      count: bookings.length,
      collection: 'confirmed_bookings'
    })
    
  } catch (error) {
    console.error('❌ ADMIN: Error loading confirmed bookings:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      bookings: []
    }, { status: 500 })
  }
}
