import { NextRequest, NextResponse } from 'next/server'
import { doc, updateDoc, getDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore'
import { getDb } from '@/lib/firebase'
import { withMobileAuth, createMobileSuccessResponse, createMobileErrorResponse } from '@/lib/middleware/mobileAuth'

interface AssignmentUpdateData {
  status: 'accepted' | 'in-progress' | 'completed' | 'cancelled'
  notes?: string
  photos?: string[]
  timeSpent?: number // minutes
  updatedBy: string // staff ID
  timestamp: string // ISO date
}

/**
 * Create a sync event for assignment updates
 */
async function createSyncEvent(
  assignmentId: string,
  changes: Record<string, any>,
  updatedBy: string
): Promise<void> {
  try {
    const database = getDb()
    
    const syncEvent = {
      type: 'assignment_updated',
      entityId: assignmentId,
      entityType: 'assignment',
      triggeredBy: updatedBy,
      triggeredByName: updatedBy,
      timestamp: serverTimestamp(),
      changes,
      platform: 'mobile',
      synced: false
    }

    await addDoc(collection(database, 'sync_events'), syncEvent)
    console.log(`✅ Sync event created for assignment ${assignmentId}`)
  } catch (error) {
    console.error('❌ Error creating sync event:', error)
  }
}

/**
 * Validate assignment update data
 */
function validateAssignmentUpdateData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!data.status) {
    errors.push('Status is required')
  } else if (!['accepted', 'in-progress', 'completed', 'cancelled'].includes(data.status)) {
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
 * PATCH /api/mobile/assignments/[assignmentId]
 * Update assignment status from mobile app
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  return withMobileAuth(async (req, auth) => {
    try {
      const { assignmentId } = await params
      console.log(`📱 Mobile API: Updating assignment ${assignmentId}`)
      
      // Parse request body
      const updateData: AssignmentUpdateData = await request.json()
      console.log('📋 Assignment update data:', updateData)
      
      // Validate update data
      const validation = validateAssignmentUpdateData(updateData)
      if (!validation.isValid) {
        console.log('❌ Validation failed:', validation.errors)
        return createMobileErrorResponse(
          `Validation failed: ${validation.errors.join(', ')}`,
          400
        )
      }
      
      const database = getDb()
      const assignmentRef = doc(database, 'task_assignments', assignmentId)
      
      // Check if assignment exists
      const assignmentDoc = await getDoc(assignmentRef)
      if (!assignmentDoc.exists()) {
        return createMobileErrorResponse('Assignment not found', 404)
      }
      
      const currentData = assignmentDoc.data()
      console.log('📋 Current assignment status:', currentData.status)
      
      // Prepare update data
      const updateFields: any = {
        status: updateData.status,
        updatedAt: serverTimestamp(),
        lastSyncedAt: serverTimestamp(),
        mobileLastSync: Date.now(),
        lastUpdatedBy: updateData.updatedBy
      }
      
      // Add optional fields if provided
      if (updateData.notes) {
        updateFields.notes = updateData.notes
        updateFields.mobileNotes = updateData.notes
      }
      
      if (updateData.photos && updateData.photos.length > 0) {
        updateFields.photos = updateData.photos
        updateFields.mobilePhotos = updateData.photos
      }
      
      if (updateData.timeSpent) {
        updateFields.timeSpent = updateData.timeSpent
        updateFields.actualTimeSpent = updateData.timeSpent
      }
      
      // Add status-specific timestamps
      if (updateData.status === 'accepted' && currentData.status !== 'accepted') {
        updateFields.acceptedAt = serverTimestamp()
        updateFields.acceptedBy = updateData.updatedBy
      } else if (updateData.status === 'in-progress' && currentData.status !== 'in-progress') {
        updateFields.startedAt = serverTimestamp()
        updateFields.startedBy = updateData.updatedBy
      } else if (updateData.status === 'completed' && currentData.status !== 'completed') {
        updateFields.completedAt = serverTimestamp()
        updateFields.completedBy = updateData.updatedBy
      } else if (updateData.status === 'cancelled' && currentData.status !== 'cancelled') {
        updateFields.cancelledAt = serverTimestamp()
        updateFields.cancelledBy = updateData.updatedBy
      }
      
      // Update the assignment
      await updateDoc(assignmentRef, updateFields)
      
      // Create sync event
      await createSyncEvent(assignmentId, {
        oldStatus: currentData.status,
        newStatus: updateData.status,
        updatedBy: updateData.updatedBy,
        notes: updateData.notes,
        timeSpent: updateData.timeSpent,
        taskType: currentData.taskType || currentData.type,
        bookingId: currentData.bookingId
      }, updateData.updatedBy)
      
      console.log(`✅ Assignment ${assignmentId} updated successfully`)
      
      return createMobileSuccessResponse({
        assignmentId,
        oldStatus: currentData.status,
        newStatus: updateData.status,
        updatedAt: new Date().toISOString(),
        syncTimestamp: Date.now()
      }, 'Assignment updated successfully')
      
    } catch (error) {
      console.error('❌ Error updating assignment:', error)
      return createMobileErrorResponse(
        'Failed to update assignment',
        500
      )
    }
  })(request)
}

/**
 * GET /api/mobile/assignments/[assignmentId]
 * Get specific assignment details for mobile app
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  return withMobileAuth(async (req, auth) => {
    try {
      const { assignmentId } = await params
      console.log(`📱 Mobile API: Fetching assignment ${assignmentId}`)
      
      const database = getDb()
      const assignmentRef = doc(database, 'task_assignments', assignmentId)
      const assignmentDoc = await getDoc(assignmentRef)
      
      if (!assignmentDoc.exists()) {
        return createMobileErrorResponse('Assignment not found', 404)
      }
      
      const assignmentData = { id: assignmentDoc.id, ...assignmentDoc.data() }
      
      // Convert to mobile format
      const mobileAssignment = {
        id: assignmentData.id,
        staffId: (assignmentData as any).staffId || (assignmentData as any).assignedTo || '',
        staffName: (assignmentData as any).staffName || (assignmentData as any).assignedToName || 'Unknown Staff',
        bookingId: (assignmentData as any).bookingId || (assignmentData as any).relatedBooking || '',
        propertyId: (assignmentData as any).propertyId || (assignmentData as any).bookingId || '',
        propertyName: (assignmentData as any).propertyName || (assignmentData as any).property || 'Unknown Property',
        taskType: (assignmentData as any).taskType || (assignmentData as any).type || 'cleaning',
        title: (assignmentData as any).title || (assignmentData as any).taskTitle || 'Task',
        description: (assignmentData as any).description || (assignmentData as any).notes || '',
        scheduledDate: (assignmentData as any).scheduledDate || (assignmentData as any).dueDate || new Date().toISOString().split('T')[0],
        scheduledTime: (assignmentData as any).scheduledTime || (assignmentData as any).time || '09:00',
        status: (assignmentData as any).status || 'pending',
        priority: (assignmentData as any).priority || 'medium',
        notes: (assignmentData as any).notes || (assignmentData as any).description || '',
        photos: (assignmentData as any).photos || (assignmentData as any).mobilePhotos || [],
        timeSpent: (assignmentData as any).timeSpent || (assignmentData as any).actualTimeSpent || 0
      }
      
      console.log(`✅ Returning assignment details for ${assignmentId}`)
      
      return createMobileSuccessResponse({
        assignment: mobileAssignment,
        lastSync: Date.now()
      })
      
    } catch (error) {
      console.error('❌ Error fetching assignment:', error)
      return createMobileErrorResponse(
        'Failed to fetch assignment',
        500
      )
    }
  })(request)
}
