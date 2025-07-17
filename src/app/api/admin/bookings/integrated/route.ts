import { NextRequest, NextResponse } from 'next/server'
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  limit as firestoreLimit,
  startAfter,
  doc,
  getDoc,
  addDoc
} from 'firebase/firestore'
import { getDb } from '@/lib/firebase'

/**
 * GET /api/admin/bookings/integrated
 * Integrated endpoint for Back Office bookings tab
 * Fetches bookings from all sources for unified management
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const limit = parseInt(searchParams.get('limit') || '50')
    const source = searchParams.get('source') || 'all'
    const property = searchParams.get('property') || 'all'

    console.log('📋 Loading integrated bookings for Back Office...')
    console.log(`🔍 Filters: status=${status}, limit=${limit}, source=${source}, property=${property}`)

    const db = getDb()
    const allBookings: any[] = []

    // 1. Load from pending_bookings collection (highest priority)
    try {
      let pendingQuery = query(
        collection(db, 'pending_bookings'),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limit)
      )

      if (status !== 'all' && status === 'pending') {
        pendingQuery = query(
          collection(db, 'pending_bookings'),
          where('status', '==', 'pending_approval'),
          orderBy('createdAt', 'desc'),
          firestoreLimit(limit)
        )
      }

      const pendingSnapshot = await getDocs(pendingQuery)
      const pendingBookings = pendingSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        source: 'pending_collection',
        priority: 'high' // Pending bookings have high priority
      }))

      allBookings.push(...pendingBookings)
      console.log(`✅ Loaded ${pendingBookings.length} pending bookings`)
    } catch (error) {
      console.error('❌ Error loading pending bookings:', error)
    }

    // 2. Load from bookings collection (main collection)
    try {
      let bookingsQuery = query(
        collection(db, 'bookings'),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limit)
      )

      if (status !== 'all') {
        bookingsQuery = query(
          collection(db, 'bookings'),
          where('status', '==', status),
          orderBy('createdAt', 'desc'),
          firestoreLimit(limit)
        )
      }

      const bookingsSnapshot = await getDocs(bookingsQuery)
      const mainBookings = bookingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        source: 'main_collection',
        priority: 'medium'
      }))

      allBookings.push(...mainBookings)
      console.log(`✅ Loaded ${mainBookings.length} main bookings`)
    } catch (error) {
      console.error('❌ Error loading main bookings:', error)
    }

    // 3. Load from live_bookings collection (real-time bookings)
    try {
      let liveQuery = query(
        collection(db, 'live_bookings'),
        orderBy('timestamp', 'desc'),
        firestoreLimit(limit)
      )

      const liveSnapshot = await getDocs(liveQuery)
      const liveBookings = liveSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        source: 'live_collection',
        priority: 'medium'
      }))

      allBookings.push(...liveBookings)
      console.log(`✅ Loaded ${liveBookings.length} live bookings`)
    } catch (error) {
      console.error('❌ Error loading live bookings:', error)
    }

    // 4. Remove duplicates (prefer pending > main > live)
    const uniqueBookings = allBookings.reduce((acc, booking) => {
      const existingIndex = acc.findIndex((b: any) => b.id === booking.id)
      
      if (existingIndex === -1) {
        acc.push(booking)
      } else {
        // Keep the booking with higher priority
        const existing = acc[existingIndex]
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        
        if (priorityOrder[booking.priority as keyof typeof priorityOrder] > priorityOrder[existing.priority as keyof typeof priorityOrder]) {
          acc[existingIndex] = booking
        }
      }
      
      return acc
    }, [] as any[])

    // 5. Apply additional filters
    let filteredBookings = uniqueBookings

    if (property !== 'all') {
      filteredBookings = filteredBookings.filter((booking: any) =>
        booking.propertyName === property ||
        booking.property === property
      )
    }

    if (source !== 'all') {
      filteredBookings = filteredBookings.filter((booking: any) =>
        booking.source === source ||
        booking.bookingSource === source
      )
    }

    // 6. Sort by priority and date
    filteredBookings.sort((a: any, b: any) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      const priorityDiff = priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder]
      
      if (priorityDiff !== 0) return priorityDiff
      
      // If same priority, sort by date (newest first)
      const dateA = new Date(a.createdAt?.toDate?.() || a.createdAt || a.timestamp?.toDate?.() || a.timestamp || 0)
      const dateB = new Date(b.createdAt?.toDate?.() || b.createdAt || b.timestamp?.toDate?.() || b.timestamp || 0)
      
      return dateB.getTime() - dateA.getTime()
    })

    // 7. Calculate statistics
    const stats = {
      total: filteredBookings.length,
      pending: filteredBookings.filter((b: any) =>
        b.status === 'pending' ||
        b.status === 'pending_approval'
      ).length,
      approved: filteredBookings.filter((b: any) =>
        b.status === 'approved' ||
        b.status === 'confirmed'
      ).length,
      rejected: filteredBookings.filter((b: any) =>
        b.status === 'rejected'
      ).length,
      todayCheckIns: filteredBookings.filter((b: any) => {
        const checkIn = new Date(b.checkInDate || b.checkIn || b.check_in || 0)
        const today = new Date()
        return checkIn.toDateString() === today.toDateString()
      }).length,
      sources: {
        pending: filteredBookings.filter((b: any) => b.source === 'pending_collection').length,
        main: filteredBookings.filter((b: any) => b.source === 'main_collection').length,
        live: filteredBookings.filter((b: any) => b.source === 'live_collection').length
      }
    }

    console.log(`📊 Integrated bookings stats:`, stats)

    return NextResponse.json({
      success: true,
      data: {
        bookings: filteredBookings,
        stats,
        totalCollections: 3,
        filters: {
          status,
          property,
          source,
          limit
        }
      },
      message: `Loaded ${filteredBookings.length} integrated bookings from ${stats.sources.pending + stats.sources.main + stats.sources.live} total records`
    })

  } catch (error) {
    console.error('❌ Error in integrated bookings endpoint:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to load integrated bookings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * POST /api/admin/bookings/integrated
 * Create a new booking that flows to Back Office for approval
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('📝 Creating new booking for Back Office approval...')
    
    // Validate required fields
    const requiredFields = ['guestName', 'propertyName', 'checkInDate', 'checkOutDate']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      }, { status: 400 })
    }

    const db = getDb()
    
    // Create booking in pending_bookings collection for Back Office approval
    const bookingData = {
      guestName: body.guestName,
      guestEmail: body.guestEmail || '',
      guestPhone: body.guestPhone || '',
      propertyName: body.propertyName,
      propertyAddress: body.propertyAddress || '',
      checkInDate: body.checkInDate,
      checkOutDate: body.checkOutDate,
      guestCount: body.guestCount || 1,
      price: body.price || 0,
      currency: body.currency || 'USD',
      specialRequests: body.specialRequests || '',
      source: body.source || 'back_office',
      status: 'pending_approval',
      priority: 'high',
      createdAt: new Date(),
      createdBy: body.createdBy || 'admin',
      requiresApproval: true,
      backOfficeEntry: true
    }

    // Add to pending_bookings collection
    const docRef = await addDoc(collection(db, 'pending_bookings'), bookingData)
    
    console.log(`✅ Booking created for Back Office approval: ${docRef.id}`)

    return NextResponse.json({
      success: true,
      data: {
        bookingId: docRef.id,
        status: 'pending_approval',
        message: 'Booking created and sent to Back Office for approval'
      }
    })

  } catch (error) {
    console.error('❌ Error creating booking for Back Office:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create booking',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
