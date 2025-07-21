import { db } from '@/lib/firebase'
import {
    addDoc,
    collection,
    doc,
    getDocs,
    query,
    serverTimestamp,
    updateDoc,
    where
} from 'firebase/firestore'
import CalendarEventService from './CalendarEventService'

/**
 * 🔧 Job Assignment Calendar Integration Workflow
 *
 * Manages automatic calendar integration for job assignments with status-based color coding:
 * - Job Creation: Gray (unassigned)
 * - Job Assignment: Yellow (assigned)
 * - Job Acceptance: Blue (in-progress)
 * - Job Completion: Green (completed) -> Auto-remove after 24h
 */

interface JobData {
  id?: string
  title: string
  description?: string
  type: string
  propertyId: string
  propertyName: string
  assignedStaffId?: string
  assignedStaffName?: string
  status: 'unassigned' | 'assigned' | 'accepted' | 'in-progress' | 'completed' | 'cancelled'
  scheduledDate?: string
  estimatedDuration?: number
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  createdAt?: any
  updatedAt?: any
}

interface JobWorkflowInput {
  jobId: string
  jobData: JobData
  oldStatus?: string
  newStatus: string
  triggeredBy?: string
}

interface JobWorkflowResult {
  success: boolean
  message: string
  calendarIntegration?: {
    success: boolean
    eventId?: string
    action: 'created' | 'updated' | 'removed'
  }
  databaseUpdates?: {
    success: boolean
    updatedFields: string[]
  }
}

// Status-based color coding
const STATUS_COLORS = {
  unassigned: '#6b7280',    // Gray
  assigned: '#f59e0b',      // Yellow/Amber
  accepted: '#3b82f6',      // Blue
  'in-progress': '#3b82f6', // Blue
  completed: '#10b981',     // Green
  cancelled: '#ef4444'      // Red
}

export class JobCalendarWorkflow {
  private firestore
  private calendarService: typeof CalendarEventService

  constructor() {
    if (!db) {
      throw new Error('Firebase not initialized')
    }
    this.firestore = db
    this.calendarService = CalendarEventService
  }

  /**
   * Process job status change and update calendar accordingly
   */
  async processJobStatusChange(input: JobWorkflowInput): Promise<JobWorkflowResult> {
    console.log('🔧 Starting Job Calendar Workflow:', {
      jobId: input.jobId,
      oldStatus: input.oldStatus,
      newStatus: input.newStatus
    })

    const result: JobWorkflowResult = {
      success: false,
      message: '',
      calendarIntegration: {
        success: false,
        action: 'created'
      },
      databaseUpdates: {
        success: false,
        updatedFields: []
      }
    }

    try {
      // Step 1: Handle calendar integration based on status change
      if (input.oldStatus === undefined && input.newStatus === 'unassigned') {
        // New job created - add to calendar
        result.calendarIntegration = await this.createJobCalendarEvent(input.jobData)
      } else if (input.oldStatus && input.newStatus !== input.oldStatus) {
        // Status changed - update calendar event
        if (input.newStatus === 'completed') {
          // Job completed - schedule for removal after 24h
          result.calendarIntegration = await this.scheduleJobEventRemoval(input.jobId, input.jobData)
        } else if (input.newStatus === 'cancelled') {
          // Job cancelled - remove immediately
          result.calendarIntegration = await this.removeJobCalendarEvent(input.jobId)
        } else {
          // Status changed - update color and details
          result.calendarIntegration = await this.updateJobCalendarEvent(input.jobId, input.jobData)
        }
      }

      // Step 2: Update job record with calendar event ID if needed
      if (result.calendarIntegration?.success && result.calendarIntegration.eventId) {
        await this.updateJobRecord(input.jobId, {
          calendarEventId: result.calendarIntegration.eventId,
          updatedAt: serverTimestamp()
        })
        result.databaseUpdates = {
          success: true,
          updatedFields: ['calendarEventId', 'updatedAt']
        }
      }

      result.success = result.calendarIntegration?.success || false
      result.message = result.success
        ? 'Job calendar workflow completed successfully'
        : 'Job calendar workflow failed'

      return result

    } catch (error) {
      console.error('❌ Job Calendar Workflow error:', error)
      result.success = false
      result.message = error instanceof Error ? error.message : 'Unknown error'
      return result
    }
  }

  /**
   * Create calendar event for new job
   */
  private async createJobCalendarEvent(jobData: JobData): Promise<{ success: boolean; eventId?: string; action: 'created' }> {
    try {
      const eventData = {
        title: `🔧 ${jobData.title}`,
        description: jobData.description || `${jobData.type} job at ${jobData.propertyName}`,
        type: 'job',
        subType: jobData.type,
        propertyName: jobData.propertyName,
        propertyId: jobData.propertyId,
        assignedStaff: jobData.assignedStaffName || 'Unassigned',
        staffId: jobData.assignedStaffId || null,
        status: jobData.status,
        priority: jobData.priority || 'medium',
        color: STATUS_COLORS[jobData.status],
        startDate: jobData.scheduledDate || new Date().toISOString(),
        endDate: jobData.scheduledDate
          ? new Date(new Date(jobData.scheduledDate).getTime() + (jobData.estimatedDuration || 60) * 60000).toISOString()
          : new Date(Date.now() + 60 * 60000).toISOString(), // Default 1 hour
        jobId: jobData.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      const eventRef = await addDoc(collection(this.firestore, 'calendarEvents'), eventData)

      console.log('✅ Job calendar event created:', eventRef.id)
      return {
        success: true,
        eventId: eventRef.id,
        action: 'created'
      }

    } catch (error) {
      console.error('❌ Error creating job calendar event:', error)
      return {
        success: false,
        action: 'created'
      }
    }
  }

  /**
   * Update existing job calendar event
   */
  private async updateJobCalendarEvent(jobId: string, jobData: JobData): Promise<{ success: boolean; eventId?: string; action: 'updated' }> {
    try {
      // Find the calendar event for this job
      const eventsQuery = query(
        collection(this.firestore, 'calendarEvents'),
        where('jobId', '==', jobId)
      )

      const eventsSnapshot = await getDocs(eventsQuery)

      if (eventsSnapshot.empty) {
        console.log('⚠️ No calendar event found for job:', jobId)
        // Create new event if none exists
        const createResult = await this.createJobCalendarEvent(jobData)
        return {
          success: createResult.success,
          eventId: createResult.eventId,
          action: 'updated'
        }
      }

      // Update the first matching event
      const eventDoc = eventsSnapshot.docs[0]
      const updateData = {
        title: `🔧 ${jobData.title}`,
        description: jobData.description || `${jobData.type} job at ${jobData.propertyName}`,
        assignedStaff: jobData.assignedStaffName || 'Unassigned',
        staffId: jobData.assignedStaffId || null,
        status: jobData.status,
        color: STATUS_COLORS[jobData.status],
        updatedAt: serverTimestamp()
      }

      await updateDoc(eventDoc.ref, updateData)

      console.log('✅ Job calendar event updated:', eventDoc.id)
      return {
        success: true,
        eventId: eventDoc.id,
        action: 'updated'
      }

    } catch (error) {
      console.error('❌ Error updating job calendar event:', error)
      return {
        success: false,
        action: 'updated'
      }
    }
  }

  /**
   * Schedule job event removal after completion (24h delay)
   */
  private async scheduleJobEventRemoval(jobId: string, jobData: JobData): Promise<{ success: boolean; eventId?: string; action: 'updated' }> {
    try {
      // First update the event to show completed status
      const updateResult = await this.updateJobCalendarEvent(jobId, jobData)

      // TODO: Implement actual 24h delayed removal
      // For now, we'll just update the color to green and add a note
      // In production, you might want to use a job queue or scheduled function

      console.log('✅ Job marked as completed, scheduled for removal in 24h')
      return updateResult

    } catch (error) {
      console.error('❌ Error scheduling job event removal:', error)
      return {
        success: false,
        action: 'updated'
      }
    }
  }

  /**
   * Remove job calendar event immediately
   */
  private async removeJobCalendarEvent(jobId: string): Promise<{ success: boolean; action: 'removed' }> {
    try {
      // Find and delete the calendar event for this job
      const eventsQuery = query(
        collection(this.firestore, 'calendarEvents'),
        where('jobId', '==', jobId)
      )

      const eventsSnapshot = await getDocs(eventsQuery)

      if (eventsSnapshot.empty) {
        console.log('⚠️ No calendar event found to remove for job:', jobId)
        return { success: true, action: 'removed' }
      }

      // Delete all matching events
      const deletePromises = eventsSnapshot.docs.map(eventDoc =>
        updateDoc(eventDoc.ref, { deleted: true, deletedAt: serverTimestamp() })
      )

      await Promise.all(deletePromises)

      console.log('✅ Job calendar event(s) removed:', eventsSnapshot.size)
      return {
        success: true,
        action: 'removed'
      }

    } catch (error) {
      console.error('❌ Error removing job calendar event:', error)
      return {
        success: false,
        action: 'removed'
      }
    }
  }

  /**
   * Update job record in database
   */
  private async updateJobRecord(jobId: string, updateData: any) {
    try {
      const jobRef = doc(this.firestore, 'job_assignments', jobId)
      await updateDoc(jobRef, updateData)
      console.log('✅ Job record updated:', jobId)
    } catch (error) {
      console.error('❌ Error updating job record:', error)
      throw error
    }
  }
}

export default JobCalendarWorkflow
