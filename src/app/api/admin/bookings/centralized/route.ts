import { NextRequest, NextResponse } from 'next/server'
import { collection, getDocs, query, orderBy, where, doc, updateDoc } from 'firebase/firestore'
import { getDb } from '@/lib/firebase'

interface BookingData {
  id: string
  property?: string
  villaName?: string
  guestName: string
  guestEmail: string
  checkInDate: string
  checkOutDate: string
  nights: number
  guests: number
  price: string
  status: string
  createdAt: unknown
  updatedAt: unknown
}

/**
 * GET /api/admin/bookings/centralized
 * Get all bookings from centralized collection with filtering
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📊 ADMIN: Loading centralized bookings...')
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const property = searchParams.get('property') || 'all'
    
    const database = getDb()
    
    // Build query based on filters
    let bookingsQuery = query(
      collection(database, 'bookings'),
      orderBy('createdAt', 'desc')
    )
    
    // Add status filter if specified
    if (status !== 'all') {
      bookingsQuery = query(
        collection(database, 'bookings'),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      )
    }
    
    const snapshot = await getDocs(bookingsQuery)
    const bookings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      // Ensure timestamps are serializable
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
    })) as BookingData[]
    
    // Apply property filter if provided
    let filteredBookings = bookings
    if (property && property !== 'all') {
      filteredBookings = bookings.filter((booking: BookingData) => 
        booking.property?.toLowerCase().includes(property.toLowerCase()) ||
        booking.villaName?.toLowerCase().includes(property.toLowerCase())
      )
    }
    
    // Group bookings by status for admin dashboard
    const groupedBookings = {
      pending_approval: filteredBookings.filter(b => b.status === 'pending_approval'),
      approved: filteredBookings.filter(b => b.status === 'approved'),
      rejected: filteredBookings.filter(b => b.status === 'rejected'),
      all: filteredBookings
    }
    
    console.log(`✅ ADMIN: Loaded ${filteredBookings.length} centralized bookings`)
    
    return NextResponse.json({
      success: true,
      bookings: filteredBookings,
      grouped: groupedBookings,
      total: filteredBookings.length,
      filters: { status, property }
    })
    
  } catch (error) {
    console.error('❌ ADMIN: Error loading centralized bookings:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load bookings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/bookings/centralized
 * Update booking status (approve/reject)
 */
export async function PATCH(request: NextRequest) {
  try {
    console.log('🔄 ADMIN: Processing booking status update...')
    
    const { bookingId, status, adminNotes, adminUserId } = await request.json()
    
    if (!bookingId || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: bookingId, status' },
        { status: 400 }
      )
    }
    
    const database = getDb()
    const bookingRef = doc(database, 'bookings', bookingId)
    
    // Update booking status
    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
      ...(adminNotes && { adminNotes }),
      ...(adminUserId && { processedBy: adminUserId })
    }

    if (status === 'approved') {
      updateData.approvedAt = new Date()
    } else if (status === 'rejected') {
      updateData.rejectedAt = new Date()
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await updateDoc(bookingRef, updateData as any)
    
    console.log(`✅ ADMIN: Booking ${bookingId} status updated to ${status}`)
    
    return NextResponse.json({
      success: true,
      message: `Booking ${status} successfully`,
      bookingId,
      status
    })
    
  } catch (error) {
    console.error('❌ ADMIN: Error updating booking status:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update booking status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
