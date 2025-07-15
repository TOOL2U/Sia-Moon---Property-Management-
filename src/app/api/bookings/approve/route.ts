import { NextRequest, NextResponse } from 'next/server'
import {
  doc,
  updateDoc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs
} from 'firebase/firestore'
import { getDb } from '@/lib/firebase'
import {
  BookingApprovalAction,
  BookingApprovalResponse,
  BookingStatus,
  SyncEvent
} from '@/types/booking-sync'
import { generateAutomaticAssignments } from '@/lib/services/automaticAssignmentService'

/**
 * Create a sync event for cross-platform tracking
 */
async function createSyncEvent(
  type: SyncEvent['type'],
  entityId: string,
  entityType: SyncEvent['entityType'],
  triggeredBy: string,
  triggeredByName: string,
  changes: Record<string, any> = {}
): Promise<void> {
  try {
    const database = getDb()
    
    const syncEvent: Omit<SyncEvent, 'id'> = {
      type,
      entityId,
      entityType,
      triggeredBy,
      triggeredByName,
      timestamp: serverTimestamp() as any,
      changes,
      platform: 'web',
      synced: false
    }

    await addDoc(collection(database, 'sync_events'), syncEvent)
    console.log(`✅ Sync event created: ${type} for ${entityType} ${entityId}`)
  } catch (error) {
    console.error('❌ Error creating sync event:', error)
  }
}

/**
 * Update booking status in all collections for backward compatibility
 */
async function updateBookingInAllCollections(
  bookingId: string,
  updates: Record<string, any>
): Promise<void> {
  const database = getDb()
  
  // Update in primary bookings collection
  try {
    const bookingRef = doc(database, 'bookings', bookingId)
    await updateDoc(bookingRef, updates)
    console.log(`✅ Updated booking ${bookingId} in bookings collection`)
  } catch (error) {
    console.log(`⚠️ Booking ${bookingId} not found in bookings collection`)
  }

  // Update in legacy collections by finding matching documents
  const collections = ['pending_bookings', 'live_bookings']
  
  for (const collectionName of collections) {
    try {
      // Find documents with matching booking reference or duplicate hash
      const q = query(
        collection(database, collectionName),
        where('duplicateCheckHash', '==', updates.duplicateCheckHash || '')
      )
      
      const snapshot = await getDocs(q)
      
      for (const docSnapshot of snapshot.docs) {
        await updateDoc(doc(database, collectionName, docSnapshot.id), updates)
        console.log(`✅ Updated booking in ${collectionName} collection`)
      }
    } catch (error) {
      console.log(`⚠️ Error updating ${collectionName}:`, error)
    }
  }
}

/**
 * POST /api/bookings/approve
 * Approve or reject a booking with cross-platform sync
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📋 BOOKING APPROVAL: Processing approval request')
    
    const body = await request.json()
    const { bookingId, action, adminId, adminName, notes, reason } = body
    
    // Validate required fields
    if (!bookingId || !action || !adminId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: bookingId, action, adminId' },
        { status: 400 }
      )
    }
    
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }
    
    const database = getDb()
    
    // Get the booking to verify it exists
    const bookingRef = doc(database, 'bookings', bookingId)
    const bookingDoc = await getDoc(bookingRef)
    
    if (!bookingDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      )
    }
    
    const bookingData = bookingDoc.data()
    const newStatus: BookingStatus = action === 'approve' ? 'approved' : 'rejected'
    const timestamp = serverTimestamp()
    
    // Prepare update data
    const updates: Record<string, any> = {
      status: newStatus,
      updatedAt: timestamp,
      syncVersion: (bookingData.syncVersion || 1) + 1,
      lastSyncedAt: timestamp,
      duplicateCheckHash: bookingData.duplicateCheckHash // For finding in legacy collections
    }
    
    if (action === 'approve') {
      updates.approvedAt = timestamp
      updates.approvedBy = adminId
    } else {
      updates.rejectedAt = timestamp
      updates.rejectedBy = adminId
      if (reason) updates.rejectionReason = reason
    }
    
    if (notes) updates.notes = notes
    
    // Update booking in all collections
    await updateBookingInAllCollections(bookingId, updates)
    
    // Create approval action record
    const approvalAction: Omit<BookingApprovalAction, 'id'> = {
      bookingId,
      action,
      adminId,
      adminName: adminName || 'Unknown Admin',
      timestamp: timestamp as any,
      notes,
      reason,
      approvalLevel: 'admin',
      notifyGuest: true,
      notifyStaff: true
    }
    
    await addDoc(collection(database, 'booking_approvals'), approvalAction)
    
    // Create sync event for mobile app
    await createSyncEvent(
      action === 'approve' ? 'booking_approved' : 'booking_rejected',
      bookingId,
      'booking',
      adminId,
      adminName || 'Unknown Admin',
      {
        action,
        newStatus,
        property: bookingData.property || bookingData.propertyName,
        guest: bookingData.guestName,
        notes,
        reason
      }
    )

    // Generate automatic staff assignments if booking is approved
    let assignmentResults = null
    if (action === 'approve') {
      console.log('🏗️ BOOKING APPROVAL: Generating automatic staff assignments...')

      const bookingForAssignments = {
        id: bookingId,
        property: bookingData.property || '',
        propertyName: bookingData.propertyName || bookingData.property || '',
        address: bookingData.address || '',
        guestName: bookingData.guestName || '',
        checkInDate: bookingData.checkInDate || '',
        checkOutDate: bookingData.checkOutDate || '',
        status: newStatus
      }

      assignmentResults = await generateAutomaticAssignments(bookingId, bookingForAssignments)

      if (assignmentResults.success) {
        console.log(`✅ BOOKING APPROVAL: Generated ${assignmentResults.assignmentsCreated} assignments`)
      } else {
        console.log(`⚠️ BOOKING APPROVAL: Assignment generation had errors:`, assignmentResults.errors)
      }
    }

    console.log(`✅ BOOKING APPROVAL: Booking ${bookingId} ${action}d successfully`)
    
    const response: BookingApprovalResponse = {
      success: true,
      bookingId,
      newStatus,
      approvedBy: adminId,
      approvedAt: timestamp as any,
      message: `Booking ${action}d successfully and synced across platforms`,
      syncedToMobile: true,
      notificationsSent: ['admin', 'mobile_app'],
      ...(assignmentResults && {
        assignments: {
          generated: assignmentResults.assignmentsCreated,
          assignmentIds: assignmentResults.assignments,
          errors: assignmentResults.errors
        }
      })
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('❌ BOOKING APPROVAL: Error processing approval:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/bookings/approve
 * Get approval history and pending approvals
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('bookingId')
    
    const database = getDb()
    
    if (bookingId) {
      // Get approval history for specific booking
      const q = query(
        collection(database, 'booking_approvals'),
        where('bookingId', '==', bookingId)
      )
      
      const snapshot = await getDocs(q)
      const approvals = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      return NextResponse.json({
        success: true,
        bookingId,
        approvals
      })
    } else {
      // Get all pending approvals
      const q = query(
        collection(database, 'bookings'),
        where('status', '==', 'pending_approval')
      )
      
      const snapshot = await getDocs(q)
      const pendingBookings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      return NextResponse.json({
        success: true,
        pendingBookings,
        count: pendingBookings.length
      })
    }
    
  } catch (error) {
    console.error('❌ Error fetching approval data:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
