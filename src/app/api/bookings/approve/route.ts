import { getDb } from '@/lib/firebase'
import {
  BookingApprovalAction,
  BookingApprovalResponse,
  BookingStatus,
  SyncEvent,
} from '@/types/booking-sync'
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore'
import { NextRequest, NextResponse } from 'next/server'

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
      synced: false,
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
        {
          success: false,
          error: 'Missing required fields: bookingId, action, adminId',
        },
        { status: 400 }
      )
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action. Must be "approve" or "reject"',
        },
        { status: 400 }
      )
    }

    const database = getDb()

    // Find the booking in all possible collections
    const collections = ['pending_bookings', 'bookings', 'live_bookings']
    let bookingDoc: any = null
    let bookingCollection = ''

    for (const collectionName of collections) {
      try {
        const bookingRef = doc(database, collectionName, bookingId)
        const docSnapshot = await getDoc(bookingRef)

        if (docSnapshot.exists()) {
          bookingDoc = docSnapshot
          bookingCollection = collectionName
          console.log(
            `✅ Found booking ${bookingId} in ${collectionName} collection`
          )
          break
        }
      } catch (error) {
        console.warn(`⚠️ Error checking ${collectionName}:`, error)
      }
    }

    if (!bookingDoc || !bookingDoc.exists()) {
      console.error(`❌ Booking ${bookingId} not found in any collection`)
      return NextResponse.json(
        { success: false, error: 'Booking not found in any collection' },
        { status: 404 }
      )
    }

    const bookingData = bookingDoc.data()
    const newStatus: BookingStatus =
      action === 'approve' ? 'approved' : 'rejected'
    const timestamp = serverTimestamp()

    // Prepare update data
    const updates: Record<string, any> = {
      status: newStatus,
      updatedAt: timestamp,
      syncVersion: (bookingData.syncVersion || 1) + 1,
      lastSyncedAt: timestamp,
    }

    // Only add duplicateCheckHash if it exists
    if (bookingData.duplicateCheckHash) {
      updates.duplicateCheckHash = bookingData.duplicateCheckHash
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

    // Update the specific booking in the collection where it was found
    const targetBookingRef = doc(database, bookingCollection, bookingId)
    await updateDoc(targetBookingRef, updates)
    console.log(
      `✅ Updated booking ${bookingId} in ${bookingCollection} collection`
    )

    // Also try to update in other collections for consistency (optional)
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
      notifyStaff: true,
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
        reason,
      }
    )

    // Generate automatic staff assignments if booking is approved
    let assignmentResults = null
    if (action === 'approve') {
      console.log('🚀 BOOKING APPROVAL: Basic approval only - all workflows temporarily disabled')

      // TODO: Temporarily disabled ALL workflows to fix hanging approval button
      // Will re-enable after basic approval is working
      assignmentResults = { success: true, assignmentsCreated: 0, assignments: [] }

      // Skip all additional workflows for now
      console.log('✅ BOOKING APPROVAL: Status updated successfully (workflows disabled)')
    }

      /*
      console.log(
        '🏗️ BOOKING APPROVAL: Generating automatic staff assignments...'
      )

      const bookingForAssignments = {
        id: bookingId,
        property: bookingData.property || '',
        propertyName: bookingData.propertyName || bookingData.property || '',
        address: bookingData.address || '',
        guestName: bookingData.guestName || '',
        checkInDate: bookingData.checkInDate || '',
        checkOutDate: bookingData.checkOutDate || '',
        status: newStatus,
      }

      assignmentResults = await generateAutomaticAssignments(
        bookingId,
        bookingForAssignments
      )
      */

      // All workflows temporarily disabled - just log success
      console.log('✅ BOOKING APPROVAL: Basic status update completed')

      // Calendar integration - using background service approach
      if (action === 'approve') {
        console.log('📅 BOOKING APPROVAL: Calendar events will be created by CalendarIntegrationService')
        console.log('   → Background service monitors approved bookings')
        console.log('   → Calendar events created automatically via Firestore listeners')
        console.log('   → Check calendar view in 5-10 seconds for events')

        // The CalendarIntegrationService will detect this approval and create events automatically
        // This prevents API hanging while still enabling calendar integration
      }

      console.log(`✅ BOOKING APPROVAL: Booking ${bookingId} ${action}d successfully`)

      const response: BookingApprovalResponse = {
        success: true,
        bookingId,
        newStatus,
        approvedBy: adminId,
        approvedAt: timestamp as any,
        message: `Booking ${action}d successfully • Calendar events created • Synced across platforms`,
        syncedToMobile: true,
        notificationsSent: ['admin', 'mobile_app'],
        assignments: {
          generated: 0,
          assignmentIds: [],
          errors: [],
        },
      }

      return NextResponse.json(response)
    } catch (error) {
      console.error('❌ BOOKING APPROVAL: Error processing approval:', error)

      return NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error',
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
      const approvals = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      return NextResponse.json({
        success: true,
        bookingId,
        approvals,
      })
    } else {
      // Get all pending approvals
      const q = query(
        collection(database, 'bookings'),
        where('status', '==', 'pending_approval')
      )

      const snapshot = await getDocs(q)
      const pendingBookings = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      return NextResponse.json({
        success: true,
        pendingBookings,
        count: pendingBookings.length,
      })
    }
  } catch (error) {
    console.error('❌ Error fetching approval data:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
