import { NextRequest, NextResponse } from 'next/server'
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  updateDoc
} from 'firebase/firestore'
import { getDb } from '@/lib/firebase'
import { 
  TaskAssignment, 
  StaffAssignmentAction,
  StaffAssignmentResponse,
  TaskStatus,
  TaskPriority,
  SyncEvent 
} from '@/types/booking-sync'

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
 * Get staff profile by ID
 */
async function getStaffProfile(staffId: string) {
  try {
    const database = getDb()
    const staffRef = doc(database, 'staff', staffId)
    const staffDoc = await getDoc(staffRef)
    
    if (staffDoc.exists()) {
      return { id: staffDoc.id, ...staffDoc.data() }
    }
    return null
  } catch (error) {
    console.error(`Error fetching staff profile ${staffId}:`, error)
    return null
  }
}

/**
 * POST /api/bookings/assign-staff
 * Assign staff members to a booking with task creation
 */
export async function POST(request: NextRequest) {
  try {
    console.log('👥 STAFF ASSIGNMENT: Processing assignment request')
    
    const body = await request.json()
    const { 
      bookingId, 
      staffIds, 
      assignedBy, 
      assignedByName, 
      tasks, 
      generalInstructions,
      specialRequirements,
      deadline 
    } = body
    
    // Validate required fields
    if (!bookingId || !staffIds || !Array.isArray(staffIds) || staffIds.length === 0 || !assignedBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: bookingId, staffIds (array), assignedBy' },
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
    
    // Validate staff members exist
    const staffProfiles = []
    for (const staffId of staffIds) {
      const staff = await getStaffProfile(staffId)
      if (!staff) {
        return NextResponse.json(
          { success: false, error: `Staff member ${staffId} not found` },
          { status: 404 }
        )
      }
      staffProfiles.push(staff)
    }
    
    const timestamp = serverTimestamp()
    const createdTasks: TaskAssignment[] = []
    
    // Create tasks for each staff member
    for (const staffProfile of staffProfiles) {
      // Create default tasks if none provided
      const staffTasks = tasks && tasks.length > 0 ? tasks : [
        {
          taskType: 'check_in' as const,
          title: 'Guest Check-in',
          description: 'Assist with guest check-in process',
          priority: 'medium' as TaskPriority,
          scheduledDate: bookingData.checkInDate,
          estimatedDuration: 30
        },
        {
          taskType: 'cleaning' as const,
          title: 'Property Preparation',
          description: 'Prepare property for guest arrival',
          priority: 'high' as TaskPriority,
          scheduledDate: bookingData.checkInDate,
          estimatedDuration: 120
        }
      ]
      
      for (const task of staffTasks) {
        const taskAssignment: Omit<TaskAssignment, 'id'> = {
          bookingId,
          staffId: staffProfile.id,
          assignedBy,
          title: task.title,
          description: task.description || '',
          taskType: task.taskType,
          priority: task.priority || 'medium',
          status: 'assigned' as TaskStatus,
          progress: 0,
          scheduledDate: task.scheduledDate,
          estimatedDuration: task.estimatedDuration,
          propertyName: bookingData.property || bookingData.propertyName || 'Unknown Property',
          propertyId: bookingData.propertyId,
          notes: generalInstructions || '',
          createdAt: timestamp as any,
          updatedAt: timestamp as any,
          syncVersion: 1,
          lastSyncedAt: timestamp as any
        }
        
        const taskRef = await addDoc(collection(database, 'task_assignments'), taskAssignment)
        createdTasks.push({ id: taskRef.id, ...taskAssignment } as TaskAssignment)
        
        // Create sync event for each task
        await createSyncEvent(
          'staff_assigned',
          taskRef.id,
          'task',
          assignedBy,
          assignedByName || 'Unknown Admin',
          {
            action: 'task_assigned',
            bookingId,
            staffId: staffProfile.id,
            staffName: staffProfile.name,
            taskType: task.taskType,
            property: bookingData.property || bookingData.propertyName
          }
        )
      }
    }
    
    // Update booking with assigned staff
    const bookingUpdates = {
      assignedStaff: staffIds,
      assignedTasks: createdTasks.map(task => task.id),
      updatedAt: timestamp,
      syncVersion: (bookingData.syncVersion || 1) + 1,
      lastSyncedAt: timestamp
    }
    
    await updateDoc(bookingRef, bookingUpdates)
    
    // Create staff assignment action record
    const assignmentAction: Omit<StaffAssignmentAction, 'id'> = {
      bookingId,
      staffIds,
      assignedBy,
      assignedByName: assignedByName || 'Unknown Admin',
      timestamp: timestamp as any,
      tasks: tasks || [],
      generalInstructions,
      specialRequirements,
      deadline,
      notifyStaff: true,
      urgentNotification: false
    }
    
    await addDoc(collection(database, 'staff_assignments'), assignmentAction)
    
    // Create main sync event for booking update
    await createSyncEvent(
      'staff_assigned',
      bookingId,
      'booking',
      assignedBy,
      assignedByName || 'Unknown Admin',
      {
        action: 'staff_assigned',
        staffCount: staffIds.length,
        taskCount: createdTasks.length,
        property: bookingData.property || bookingData.propertyName,
        guest: bookingData.guestName
      }
    )
    
    console.log(`✅ STAFF ASSIGNMENT: ${staffIds.length} staff assigned to booking ${bookingId}`)
    console.log(`✅ STAFF ASSIGNMENT: ${createdTasks.length} tasks created`)
    
    const response: StaffAssignmentResponse = {
      success: true,
      bookingId,
      assignedStaff: staffProfiles,
      createdTasks,
      assignedBy,
      assignedAt: timestamp as any,
      message: `${staffIds.length} staff members assigned with ${createdTasks.length} tasks created`,
      syncedToMobile: true,
      notificationsSent: ['mobile_app', 'staff_notifications']
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('❌ STAFF ASSIGNMENT: Error processing assignment:', error)
    
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
 * GET /api/bookings/assign-staff
 * Get staff assignments and available staff
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('bookingId')
    const getAvailableStaff = searchParams.get('available') === 'true'
    
    const database = getDb()
    
    if (bookingId) {
      // Get assignments for specific booking
      const q = query(
        collection(database, 'task_assignments'),
        where('bookingId', '==', bookingId)
      )
      
      const snapshot = await getDocs(q)
      const assignments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      return NextResponse.json({
        success: true,
        bookingId,
        assignments,
        count: assignments.length
      })
    } else if (getAvailableStaff) {
      // Get available staff members
      const q = query(
        collection(database, 'staff'),
        where('status', '==', 'active')
      )
      
      const snapshot = await getDocs(q)
      const availableStaff = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      return NextResponse.json({
        success: true,
        availableStaff,
        count: availableStaff.length
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Please specify bookingId or set available=true' },
        { status: 400 }
      )
    }
    
  } catch (error) {
    console.error('❌ Error fetching assignment data:', error)
    
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
