import { NextRequest, NextResponse } from 'next/server'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { getDb } from '@/lib/firebase'
import { withMobileAuth, createMobileSuccessResponse, createMobileErrorResponse } from '@/lib/middleware/mobileAuth'

interface SyncRequest {
  lastSyncTimestamp: number
  staffId?: string
  deviceId?: string
  platform: 'mobile'
  pendingChanges: {
    bookings: Array<{id: string, type: string, data: any, timestamp: number}>
    assignments: Array<{id: string, type: string, data: any, timestamp: number}>
  }
}

interface SyncResponse {
  success: boolean
  data: {
    bookings: any[]
    assignments: any[]
    properties?: any[]
    lastSyncTimestamp: number
  }
  message?: string
}

/**
 * Convert Firestore timestamp to number for comparison
 */
function timestampToNumber(timestamp: any): number {
  if (!timestamp) return 0
  if (timestamp.toDate) return timestamp.toDate().getTime()
  if (timestamp.seconds) return timestamp.seconds * 1000
  if (typeof timestamp === 'number') return timestamp
  return new Date(timestamp).getTime()
}

/**
 * Process pending changes from mobile app
 */
async function processPendingChanges(pendingChanges: SyncRequest['pendingChanges']): Promise<{
  processedBookings: number
  processedAssignments: number
  errors: string[]
}> {
  const database = getDb()
  let processedBookings = 0
  let processedAssignments = 0
  const errors: string[] = []

  try {
    // Process booking changes
    for (const change of pendingChanges.bookings) {
      try {
        if (change.type === 'update') {
          const bookingRef = doc(database, 'bookings', change.id)
          await updateDoc(bookingRef, {
            ...change.data,
            updatedAt: serverTimestamp(),
            mobileLastSync: Date.now(),
            syncedFromMobile: true
          })
          processedBookings++
        }
      } catch (error) {
        console.error(`❌ Error processing booking change ${change.id}:`, error)
        errors.push(`Failed to process booking ${change.id}`)
      }
    }

    // Process assignment changes
    for (const change of pendingChanges.assignments) {
      try {
        if (change.type === 'update') {
          const assignmentRef = doc(database, 'task_assignments', change.id)
          await updateDoc(assignmentRef, {
            ...change.data,
            updatedAt: serverTimestamp(),
            mobileLastSync: Date.now(),
            syncedFromMobile: true
          })
          processedAssignments++
        }
      } catch (error) {
        console.error(`❌ Error processing assignment change ${change.id}:`, error)
        errors.push(`Failed to process assignment ${change.id}`)
      }
    }

  } catch (error) {
    console.error('❌ Error processing pending changes:', error)
    errors.push('Failed to process some pending changes')
  }

  return { processedBookings, processedAssignments, errors }
}

/**
 * Fetch updated data since last sync
 */
async function fetchUpdatedData(lastSyncTimestamp: number, staffId?: string): Promise<{
  bookings: any[]
  assignments: any[]
  properties: any[]
}> {
  const database = getDb()
  const lastSync = new Date(lastSyncTimestamp)

  try {
    // Fetch updated bookings
    let bookingsQuery = query(
      collection(database, 'bookings'),
      where('updatedAt', '>', Timestamp.fromDate(lastSync)),
      orderBy('updatedAt', 'desc'),
      limit(100)
    )

    const bookingsSnapshot = await getDocs(bookingsQuery)
    const bookings = bookingsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert timestamps to ISO strings for mobile
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString(),
      approvedAt: doc.data().approvedAt?.toDate?.()?.toISOString()
    }))

    // Fetch updated assignments
    let assignmentsQuery = query(
      collection(database, 'task_assignments'),
      where('updatedAt', '>', Timestamp.fromDate(lastSync)),
      orderBy('updatedAt', 'desc'),
      limit(100)
    )

    // Filter by staff if specified
    if (staffId) {
      assignmentsQuery = query(
        collection(database, 'task_assignments'),
        where('staffId', '==', staffId),
        where('updatedAt', '>', Timestamp.fromDate(lastSync)),
        orderBy('updatedAt', 'desc'),
        limit(100)
      )
    }

    const assignmentsSnapshot = await getDocs(assignmentsQuery)
    const assignments = assignmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert timestamps to ISO strings for mobile
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString(),
      scheduledDate: doc.data().scheduledDate || new Date().toISOString().split('T')[0]
    }))

    // Fetch properties (basic info, not filtered by timestamp)
    const propertiesQuery = query(
      collection(database, 'properties'),
      limit(50)
    )

    const propertiesSnapshot = await getDocs(propertiesQuery)
    const properties = propertiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    return { bookings, assignments, properties }

  } catch (error) {
    console.error('❌ Error fetching updated data:', error)
    return { bookings: [], assignments: [], properties: [] }
  }
}

/**
 * Create sync event for tracking
 */
async function createSyncEvent(
  staffId: string | undefined,
  deviceId: string | undefined,
  syncStats: any
): Promise<void> {
  try {
    const database = getDb()
    
    const syncEvent = {
      type: 'mobile_sync',
      entityId: deviceId || 'unknown',
      entityType: 'device',
      triggeredBy: staffId || 'mobile_app',
      triggeredByName: staffId || 'Mobile App',
      timestamp: serverTimestamp(),
      changes: syncStats,
      platform: 'mobile',
      synced: true
    }

    await addDoc(collection(database, 'sync_events'), syncEvent)
  } catch (error) {
    console.error('❌ Error creating sync event:', error)
  }
}

/**
 * POST /api/mobile/sync
 * Bidirectional sync between mobile app and webapp
 */
export async function POST(request: NextRequest) {
  return withMobileAuth(async (req, auth) => {
    try {
      console.log('📱 Mobile API: Starting bidirectional sync')
      
      // Parse request body
      const syncRequest: SyncRequest = await request.json()
      console.log('📋 Sync request:', {
        lastSyncTimestamp: syncRequest.lastSyncTimestamp,
        staffId: syncRequest.staffId,
        deviceId: syncRequest.deviceId,
        pendingChangesCount: {
          bookings: syncRequest.pendingChanges.bookings.length,
          assignments: syncRequest.pendingChanges.assignments.length
        }
      })

      // Validate sync request
      if (!syncRequest.lastSyncTimestamp || typeof syncRequest.lastSyncTimestamp !== 'number') {
        return createMobileErrorResponse('Invalid lastSyncTimestamp', 400)
      }

      if (syncRequest.platform !== 'mobile') {
        return createMobileErrorResponse('Invalid platform', 400)
      }

      // Process pending changes from mobile
      const changeResults = await processPendingChanges(syncRequest.pendingChanges)
      console.log('📋 Processed pending changes:', changeResults)

      // Fetch updated data since last sync
      const updatedData = await fetchUpdatedData(
        syncRequest.lastSyncTimestamp,
        syncRequest.staffId
      )
      console.log('📋 Fetched updated data:', {
        bookings: updatedData.bookings.length,
        assignments: updatedData.assignments.length,
        properties: updatedData.properties.length
      })

      // Create sync event for tracking
      const syncStats = {
        processedBookings: changeResults.processedBookings,
        processedAssignments: changeResults.processedAssignments,
        fetchedBookings: updatedData.bookings.length,
        fetchedAssignments: updatedData.assignments.length,
        errors: changeResults.errors
      }

      await createSyncEvent(syncRequest.staffId, syncRequest.deviceId, syncStats)

      const currentTimestamp = Date.now()

      console.log(`✅ Mobile sync completed successfully`)

      return createMobileSuccessResponse({
        bookings: updatedData.bookings,
        assignments: updatedData.assignments,
        properties: updatedData.properties,
        lastSyncTimestamp: currentTimestamp,
        syncStats: {
          processed: {
            bookings: changeResults.processedBookings,
            assignments: changeResults.processedAssignments
          },
          fetched: {
            bookings: updatedData.bookings.length,
            assignments: updatedData.assignments.length,
            properties: updatedData.properties.length
          },
          errors: changeResults.errors
        }
      }, 'Sync completed successfully')

    } catch (error) {
      console.error('❌ Error during mobile sync:', error)
      return createMobileErrorResponse(
        'Sync failed',
        500
      )
    }
  })(request)
}
