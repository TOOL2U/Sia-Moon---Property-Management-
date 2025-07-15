import { NextRequest, NextResponse } from 'next/server'
import { doc, updateDoc, getDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore'
import { getDb } from '@/lib/firebase'
import { withMobileAuth, createMobileSuccessResponse, createMobileErrorResponse } from '@/lib/middleware/mobileAuth'

interface BookingUpdateData {
  status: 'confirmed' | 'in-progress' | 'completed' | 'cancelled'
  updatedBy: string // staff ID
  notes?: string
  photos?: string[]
  checklistCompleted?: string[]
  timeSpent?: number // minutes
  timestamp: string // ISO date
}

/**
 * Create a sync event for booking updates
 */
async function createSyncEvent(
  bookingId: string,
  changes: Record<string, any>,
  updatedBy: string
): Promise<void> {
  try {
    const database = getDb()
    
    const syncEvent = {
      type: 'booking_updated',
      entityId: bookingId,
      entityType: 'booking',
      triggeredBy: updatedBy,
      triggeredByName: updatedBy,
      timestamp: serverTimestamp(),
      changes,
      platform: 'mobile',
      synced: false
    }

    await addDoc(collection(database, 'sync_events'), syncEvent)
    console.log(`✅ Sync event created for booking ${bookingId}`)
  } catch (error) {
    console.error('❌ Error creating sync event:', error)
  }
}

/**
 * Validate booking update data
 */
function validateUpdateData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!data.status) {
    errors.push('Status is required')
  } else if (!['confirmed', 'in-progress', 'completed', 'cancelled'].includes(data.status)) {
    errors.push('Invalid status value')
  }
  
  if (!data.updatedBy) {
    errors.push('updatedBy (staff ID) is required')
  }
  
  if (!data.timestamp) {
    errors.push('Timestamp is required')
  } else if (isNaN(Date.parse(data.timestamp))) {
    errors.push('Invalid timestamp format')
  }
  
  if (data.timeSpent && (typeof data.timeSpent !== 'number' || data.timeSpent < 0)) {
    errors.push('timeSpent must be a positive number')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * PATCH /api/bookings/[bookingId]
 * Update booking status from mobile app
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  return withMobileAuth(async (req, auth) => {
    try {
      const { bookingId } = params
      console.log(`📱 Mobile API: Updating booking ${bookingId}`)
      
      // Parse request body
      const updateData: BookingUpdateData = await request.json()
      console.log('📋 Update data:', updateData)
      
      // Validate update data
      const validation = validateUpdateData(updateData)
      if (!validation.isValid) {
        console.log('❌ Validation failed:', validation.errors)
        return createMobileErrorResponse(
          `Validation failed: ${validation.errors.join(', ')}`,
          400
        )
      }
      
      const database = getDb()
      const bookingRef = doc(database, 'bookings', bookingId)
      
      // Check if booking exists
      const bookingDoc = await getDoc(bookingRef)
      if (!bookingDoc.exists()) {
        return createMobileErrorResponse('Booking not found', 404)
      }
      
      const currentData = bookingDoc.data()
      console.log('📋 Current booking status:', currentData.status)
      
      // Prepare update data
      const updateFields: any = {
        status: updateData.status,
        updatedAt: serverTimestamp(),
        lastSyncedAt: serverTimestamp(),
        mobileLastSync: Date.now()
      }
      
      // Add optional fields if provided
      if (updateData.notes) {
        updateFields.notes = updateData.notes
      }
      
      if (updateData.photos && updateData.photos.length > 0) {
        updateFields.photos = updateData.photos
      }
      
      if (updateData.checklistCompleted && updateData.checklistCompleted.length > 0) {
        updateFields.checklistCompleted = updateData.checklistCompleted
      }
      
      if (updateData.timeSpent) {
        updateFields.timeSpent = updateData.timeSpent
      }
      
      // Add status-specific timestamps
      if (updateData.status === 'confirmed' && currentData.status !== 'confirmed') {
        updateFields.confirmedAt = serverTimestamp()
        updateFields.confirmedBy = updateData.updatedBy
      } else if (updateData.status === 'in-progress' && currentData.status !== 'in-progress') {
        updateFields.startedAt = serverTimestamp()
        updateFields.startedBy = updateData.updatedBy
      } else if (updateData.status === 'completed' && currentData.status !== 'completed') {
        updateFields.completedAt = serverTimestamp()
        updateFields.completedBy = updateData.updatedBy
      }
      
      // Update the booking
      await updateDoc(bookingRef, updateFields)
      
      // Create sync event
      await createSyncEvent(bookingId, {
        oldStatus: currentData.status,
        newStatus: updateData.status,
        updatedBy: updateData.updatedBy,
        notes: updateData.notes,
        timeSpent: updateData.timeSpent
      }, updateData.updatedBy)
      
      console.log(`✅ Booking ${bookingId} updated successfully`)
      
      return createMobileSuccessResponse({
        bookingId,
        oldStatus: currentData.status,
        newStatus: updateData.status,
        updatedAt: new Date().toISOString(),
        syncTimestamp: Date.now()
      }, 'Booking updated successfully')
      
    } catch (error) {
      console.error('❌ Error updating booking:', error)
      return createMobileErrorResponse(
        'Failed to update booking',
        500
      )
    }
  })(request)
}

/**
 * GET /api/bookings/[bookingId]
 * Get specific booking details for mobile app
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  return withMobileAuth(async (req, auth) => {
    try {
      const { bookingId } = params
      console.log(`📱 Mobile API: Fetching booking ${bookingId}`)
      
      const database = getDb()
      const bookingRef = doc(database, 'bookings', bookingId)
      const bookingDoc = await getDoc(bookingRef)
      
      if (!bookingDoc.exists()) {
        return createMobileErrorResponse('Booking not found', 404)
      }
      
      const bookingData = { id: bookingDoc.id, ...bookingDoc.data() }
      
      // Convert to mobile format (reuse function from main route)
      const mobileBooking = {
        id: bookingData.id,
        propertyId: bookingData.id,
        propertyName: bookingData.property || bookingData.propertyName || 'Unknown Property',
        propertyAddress: bookingData.address || 'Address not available',
        guestName: bookingData.guestName || 'Unknown Guest',
        guestEmail: bookingData.guestEmail || '',
        guestPhone: bookingData.guestPhone || bookingData.phone || '',
        checkIn: bookingData.checkInDate || bookingData.checkIn || '',
        checkOut: bookingData.checkOutDate || bookingData.checkOut || '',
        status: bookingData.status || 'approved',
        totalAmount: bookingData.totalAmount || bookingData.price || 0,
        paymentStatus: bookingData.paymentStatus || 'pending',
        specialRequests: bookingData.specialRequests || bookingData.notes || '',
        assignedStaff: bookingData.assignedStaff || [],
        tasks: bookingData.tasks || [],
        createdAt: bookingData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        approvedAt: bookingData.approvedAt?.toDate?.()?.toISOString() || bookingData.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      }
      
      console.log(`✅ Returning booking details for ${bookingId}`)
      
      return createMobileSuccessResponse({
        booking: mobileBooking,
        lastSync: Date.now()
      })
      
    } catch (error) {
      console.error('❌ Error fetching booking:', error)
      return createMobileErrorResponse(
        'Failed to fetch booking',
        500
      )
    }
  })(request)
}
