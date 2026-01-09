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

    // If booking is approved, also copy it to bookings_approved collection
    if (action === 'approve') {
      try {
        const approvedBookingData = {
          ...bookingData,
          ...updates,
          originalCollection: bookingCollection,
          movedToApprovedAt: serverTimestamp()
        }

        await addDoc(collection(database, 'bookings_approved'), approvedBookingData)
        console.log(`✅ Copied approved booking ${bookingId} to bookings_approved collection`)
      } catch (error) {
        console.error('❌ Error copying to bookings_approved:', error)
        // Don't fail the whole operation if this fails
      }
    }

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

    // Generate automatic jobs if booking is approved
    let jobCreationResult = null
    if (action === 'approve') {
      console.log('🚀 BOOKING APPROVAL: Creating automatic jobs for approved booking')

      try {
        // Import the job creation service
        const { default: AutomaticJobCreationService } = await import('@/services/AutomaticJobCreationService')
        
        // Prepare booking data for job creation
        const bookingForJobs = {
          id: bookingId,
          status: 'approved',
          propertyId: bookingData.propertyId || bookingData.property_id || '',
          propertyName: bookingData.propertyName || bookingData.property || '',
          property: bookingData.property || bookingData.propertyName || '',
          address: bookingData.address || '',
          guestName: bookingData.guestName || bookingData.guest_name || '',
          guestEmail: bookingData.guestEmail || bookingData.guest_email || '',
          guestPhone: bookingData.guestPhone || bookingData.guest_phone || '',
          checkIn: bookingData.checkIn || bookingData.checkInDate || bookingData.check_in,
          checkOut: bookingData.checkOut || bookingData.checkOutDate || bookingData.check_out,
          checkInDate: bookingData.checkInDate || bookingData.checkIn || bookingData.check_in,
          checkOutDate: bookingData.checkOutDate || bookingData.checkOut || bookingData.check_out,
          guests: bookingData.guests || bookingData.guestCount || 2,
          specialRequests: bookingData.specialRequests || bookingData.special_requests || '',
        }

        console.log('📋 Booking data prepared for job creation:', {
          bookingId,
          propertyId: bookingForJobs.propertyId,
          propertyName: bookingForJobs.propertyName,
          checkIn: bookingForJobs.checkIn,
          checkOut: bookingForJobs.checkOut,
        })

        // Create jobs
        jobCreationResult = await AutomaticJobCreationService.createJobsForBooking(bookingForJobs)

        if (jobCreationResult.success) {
          console.log(`✅ Created ${jobCreationResult.jobIds?.length || 0} jobs for booking ${bookingId}`)
        } else {
          console.error(`❌ Job creation failed:`, jobCreationResult.error)
        }
      } catch (error) {
        console.error('❌ Error creating jobs:', error)
        jobCreationResult = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          jobIds: []
        }
      }

      // Create calendar events for approved booking
      try {
        console.log('📅 Creating calendar events for approved booking')
        const { default: CalendarEventService } = await import('@/services/CalendarEventService')
        
        const calendarResult = await CalendarEventService.createEventsFromBooking(bookingId)
        
        if (calendarResult.success) {
          console.log(`✅ Created ${calendarResult.eventIds?.length || 0} calendar events`)
        } else {
          console.error('❌ Calendar event creation failed:', calendarResult.error)
        }
      } catch (error) {
        console.error('❌ Error creating calendar events:', error)
      }
    }

    console.log(`✅ BOOKING APPROVAL: Booking ${bookingId} ${action}d successfully`)

    const jobCount = jobCreationResult?.jobIds?.length || 0
      const jobStatus = jobCreationResult?.success ? 'created' : 'failed'

      const response: BookingApprovalResponse = {
        success: true,
        bookingId,
        newStatus,
        approvedBy: adminId,
        approvedAt: timestamp as any,
        message: `Booking ${action}d successfully • ${jobCount} jobs ${jobStatus} • Synced across platforms`,
        syncedToMobile: true,
        notificationsSent: ['admin', 'mobile_app'],
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
