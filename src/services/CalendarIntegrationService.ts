/**
 * Calendar Integration Service
 * Handles automated workflows for booking and job calendar integration
 */

import { db } from '@/lib/firebase'
import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore'
import CalendarEventService from './CalendarEventService'
import { clientToast as toast } from '@/utils/clientToast'

class CalendarIntegrationService {
  private bookingListener: (() => void) | null = null
  private jobListener: (() => void) | null = null
  private jobAssignmentListener: (() => void) | null = null

  /**
   * Initialize all calendar integration workflows
   */
  async initialize(): Promise<void> {
    console.log('🔄 Initializing Calendar Integration Service...')
    
    try {
      // Set up booking approval workflow
      this.setupBookingApprovalWorkflow()
      
      // Set up job creation workflow
      this.setupJobCreationWorkflow()
      
      // Set up job assignment workflow
      this.setupJobAssignmentWorkflow()
      
      console.log('✅ Calendar Integration Service initialized successfully')
      
    } catch (error) {
      console.error('❌ Error initializing Calendar Integration Service:', error)
      toast.error('Failed to initialize calendar integration')
    }
  }

  /**
   * 1. BOOKING APPROVAL WORKFLOW
   * Automatically create calendar events when bookings are approved
   */
  private setupBookingApprovalWorkflow(): void {
    console.log('📋 Setting up booking approval workflow...')
    
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('status', '==', 'approved')
    )
    
    this.bookingListener = onSnapshot(bookingsQuery, async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type === 'added' || change.type === 'modified') {
          const booking = { id: change.doc.id, ...change.doc.data() }
          
          // Check if calendar events already created
          if (!booking.calendarEventsCreated && booking.status === 'approved') {
            await this.handleBookingApproval(booking.id, booking)
          }
        }
      }
    }, (error) => {
      console.error('❌ Error in booking approval listener:', error)
    })
  }

  /**
   * Handle individual booking approval
   */
  private async handleBookingApproval(bookingId: string, bookingData: any): Promise<void> {
    try {
      console.log(`📅 Processing booking approval: ${bookingId}`)
      
      // Create calendar events for check-in and check-out
      const result = await CalendarEventService.createEventsFromBooking(bookingId)
      
      if (result.success) {
        // Mark booking as having calendar events created
        await CalendarEventService.markBookingCalendarEventsCreated(bookingId)
        
        console.log(`✅ Calendar events created for booking ${bookingId}`)
        toast.success(`📅 Calendar events created for ${bookingData.propertyName || 'booking'}`)
        
      } else {
        console.error(`❌ Failed to create calendar events for booking ${bookingId}:`, result.error)
        toast.error(`Failed to create calendar events: ${result.error}`)
      }
      
    } catch (error) {
      console.error('❌ Error handling booking approval:', error)
      toast.error('Error processing booking approval')
    }
  }

  /**
   * 2. JOB CREATION WORKFLOW
   * Automatically create calendar events when jobs are created
   */
  private setupJobCreationWorkflow(): void {
    console.log('🔧 Setting up job creation workflow...')
    
    const jobsQuery = collection(db, 'jobs')
    
    this.jobListener = onSnapshot(jobsQuery, async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type === 'added') {
          const job = { id: change.doc.id, ...change.doc.data() }
          
          // Check if calendar event already created
          if (!job.calendarEventCreated) {
            await this.handleJobCreation(job.id, job)
          }
        }
      }
    }, (error) => {
      console.error('❌ Error in job creation listener:', error)
    })
  }

  /**
   * Handle individual job creation
   */
  private async handleJobCreation(jobId: string, jobData: any): Promise<void> {
    try {
      console.log(`📅 Processing job creation: ${jobId}`)
      
      // Create calendar event for job
      const result = await CalendarEventService.createEventFromJob(jobId)
      
      if (result.success) {
        // Mark job as having calendar event created
        await CalendarEventService.markJobCalendarEventCreated(jobId)
        
        console.log(`✅ Calendar event created for job ${jobId}`)
        toast.success(`📅 Calendar event created for job: ${jobData.title || 'New Job'}`)
        
      } else {
        console.error(`❌ Failed to create calendar event for job ${jobId}:`, result.error)
        toast.error(`Failed to create calendar event: ${result.error}`)
      }
      
    } catch (error) {
      console.error('❌ Error handling job creation:', error)
      toast.error('Error processing job creation')
    }
  }

  /**
   * 3. JOB ASSIGNMENT WORKFLOW
   * Update calendar events when jobs are assigned to staff
   */
  private setupJobAssignmentWorkflow(): void {
    console.log('👥 Setting up job assignment workflow...')
    
    const jobsQuery = collection(db, 'jobs')
    
    this.jobAssignmentListener = onSnapshot(jobsQuery, async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type === 'modified') {
          const job = { id: change.doc.id, ...change.doc.data() }
          const previousData = change.doc.metadata.fromCache ? null : change.doc.data()
          
          // Check if staff assignment changed
          if (job.assignedStaffId && job.assignedStaffId !== previousData?.assignedStaffId) {
            await this.handleJobAssignment(job.id, job.assignedStaffId, job.assignedStaffName || 'Unknown Staff')
          }
        }
      }
    }, (error) => {
      console.error('❌ Error in job assignment listener:', error)
    })
  }

  /**
   * Handle individual job assignment
   */
  private async handleJobAssignment(jobId: string, staffId: string, staffName: string): Promise<void> {
    try {
      console.log(`👤 Processing job assignment: ${jobId} → ${staffName}`)
      
      // Update calendar event with staff assignment
      const result = await CalendarEventService.updateEventForJobAssignment(jobId, staffId, staffName)
      
      if (result.success) {
        console.log(`✅ Calendar event updated for job assignment ${jobId}`)
        toast.success(`📅 Job assigned to ${staffName}`)
        
      } else {
        console.error(`❌ Failed to update calendar event for job assignment ${jobId}:`, result.error)
        toast.error(`Failed to update calendar event: ${result.error}`)
      }
      
    } catch (error) {
      console.error('❌ Error handling job assignment:', error)
      toast.error('Error processing job assignment')
    }
  }

  /**
   * 4. JOB COMPLETION WORKFLOW
   * Handle calendar events when jobs are completed
   */
  async handleJobCompletion(jobId: string, completionAction: 'keep' | 'remove' | 'archive' = 'keep'): Promise<void> {
    try {
      console.log(`✅ Processing job completion: ${jobId} (${completionAction})`)
      
      const result = await CalendarEventService.handleJobCompletion(jobId, completionAction)
      
      if (result.success) {
        console.log(`✅ Calendar event processed for job completion ${jobId}`)
        
        switch (completionAction) {
          case 'keep':
            toast.success('📅 Job completed - event kept on calendar')
            break
          case 'remove':
            toast.success('📅 Job completed - event will be removed in 24 hours')
            break
          case 'archive':
            toast.success('📅 Job completed - event archived')
            break
        }
        
      } else {
        console.error(`❌ Failed to process calendar event for job completion ${jobId}:`, result.error)
        toast.error(`Failed to process completion: ${result.error}`)
      }
      
    } catch (error) {
      console.error('❌ Error handling job completion:', error)
      toast.error('Error processing job completion')
    }
  }

  /**
   * UTILITY METHODS
   */

  /**
   * Cleanup orphaned calendar events
   */
  async cleanupOrphanedEvents(): Promise<void> {
    try {
      console.log('🧹 Starting cleanup of orphaned calendar events...')
      
      const result = await CalendarEventService.cleanupOrphanedEvents()
      
      if (result.success) {
        console.log(`✅ Cleanup complete: removed ${result.removedCount || 0} orphaned events`)
        if (result.removedCount && result.removedCount > 0) {
          toast.success(`🧹 Cleaned up ${result.removedCount} orphaned calendar events`)
        }
      } else {
        console.error('❌ Cleanup failed:', result.error)
        toast.error(`Cleanup failed: ${result.error}`)
      }
      
    } catch (error) {
      console.error('❌ Error during cleanup:', error)
      toast.error('Error during cleanup')
    }
  }

  /**
   * Destroy all listeners
   */
  destroy(): void {
    console.log('🔄 Destroying Calendar Integration Service...')
    
    if (this.bookingListener) {
      this.bookingListener()
      this.bookingListener = null
    }
    
    if (this.jobListener) {
      this.jobListener()
      this.jobListener = null
    }
    
    if (this.jobAssignmentListener) {
      this.jobAssignmentListener()
      this.jobAssignmentListener = null
    }
    
    console.log('✅ Calendar Integration Service destroyed')
  }
}

// Export singleton instance
const calendarIntegrationService = new CalendarIntegrationService()
export default calendarIntegrationService
