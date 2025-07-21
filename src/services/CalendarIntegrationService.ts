/**
 * Calendar Integration Service
 * Handles automated workflows for booking and job calendar integration
 */

import { db } from '@/lib/firebase'
import { clientToast as toast } from '@/utils/clientToast'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import AIAutomationService from './AIAutomationService'
import AIBookingApprovalService from './AIBookingApprovalService'
import CalendarEventService from './CalendarEventService'
import FinancialReportingService from './FinancialReportingService'
import NotificationService from './NotificationService'
import SmartJobAssignmentService from './SmartJobAssignmentService'

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
      // Initialize AI Booking Approval Service
      await AIBookingApprovalService.initialize()

      // Initialize Smart Job Assignment Service
      await SmartJobAssignmentService.initialize()

      // Initialize Calendar Event Service real-time sync
      await CalendarEventService.initializeRealTimeSync()

      // Initialize Financial Reporting Service
      await FinancialReportingService.initialize()

      // Initialize Notification Service
      await NotificationService.initialize()

      // Set up booking approval workflow
      this.setupBookingApprovalWorkflow()

      // Set up job creation workflow
      this.setupJobCreationWorkflow()

      // Set up job assignment workflow
      this.setupJobAssignmentWorkflow()

      // Set up job status change listener
      this.setupJobStatusChangeListener()

      console.log('✅ Calendar Integration Service initialized successfully')
    } catch (error) {
      console.error(
        '❌ Error initializing Calendar Integration Service:',
        error
      )
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

    this.bookingListener = onSnapshot(
      bookingsQuery,
      async (snapshot) => {
        for (const change of snapshot.docChanges()) {
          if (change.type === 'added' || change.type === 'modified') {
            const booking = { id: change.doc.id, ...change.doc.data() }

            // Check if calendar events already created
            if (
              !booking.calendarEventsCreated &&
              booking.status === 'approved'
            ) {
              await this.handleBookingApproval(booking.id, booking)
            }
          }
        }
      },
      (error) => {
        console.error('❌ Error in booking approval listener:', error)
      }
    )
  }

  /**
   * Handle individual booking approval
   */
  private async handleBookingApproval(
    bookingId: string,
    bookingData: any
  ): Promise<void> {
    try {
      console.log(`📅 Processing booking approval: ${bookingId}`)

      // Check if AI automation is enabled
      const aiEnabled = await AIAutomationService.isEnabled()

      if (!aiEnabled) {
        console.log(
          `⚠️ AI automation disabled - skipping automatic calendar event creation for booking ${bookingId}`
        )
        toast.warning(
          '⚠️ AI automation disabled - calendar events must be created manually'
        )
        return
      }

      // Create calendar events for check-in and check-out
      const result =
        await CalendarEventService.createEventsFromBooking(bookingId)

      if (result.success) {
        // Mark booking as having calendar events created
        await CalendarEventService.markBookingCalendarEventsCreated(bookingId)

        console.log(`✅ Calendar events created for booking ${bookingId}`)
        toast.success(
          `📅 Calendar events created for ${bookingData.propertyName || 'booking'}`
        )
      } else {
        console.error(
          `❌ Failed to create calendar events for booking ${bookingId}:`,
          result.error
        )
        toast.error(`Failed to create calendar events: ${result.error}`)
      }
    } catch (error) {
      console.error('❌ Error handling booking approval:', error)
      toast.error('Error processing booking approval')
    }
  }

  /**
   * 2. JOB CREATION WORKFLOW
   * Automatically create calendar events when job assignments are created
   */
  private setupJobCreationWorkflow(): void {
    console.log('🔧 Setting up job assignment creation workflow...')

    // Listen to both job collections for comprehensive coverage
    const jobAssignmentsQuery = collection(db, 'job_assignments')
    const jobsQuery = collection(db, 'jobs')

    // Primary listener for job_assignments collection
    this.jobListener = onSnapshot(
      jobAssignmentsQuery,
      async (snapshot) => {
        for (const change of snapshot.docChanges()) {
          if (change.type === 'added') {
            const job = { id: change.doc.id, ...change.doc.data() }

            // Skip test jobs immediately
            if (job.id.includes('test_job_flow') || job.id.includes('temp_')) {
              console.log(
                `⏭️ Skipping test/temporary job in listener: ${job.id}`
              )
              continue
            }

            // Check if calendar event already created
            if (!job.calendarEventCreated) {
              // Validate job has minimum required data
              if (job.title || job.jobType) {
                // Add a small delay to handle timing issues with Firebase
                setTimeout(async () => {
                  await this.handleJobCreation(job.id, job, 'job_assignments')
                }, 1000) // 1 second delay
              } else {
                console.log(
                  `⏭️ Skipping job ${job.id} - missing title and jobType`
                )
              }
            }
          }
        }
      },
      (error) => {
        console.error('❌ Error in job assignments listener:', error)
      }
    )
  }

  /**
   * Handle individual job creation with retry mechanism
   */
  private async handleJobCreation(
    jobId: string,
    jobData: any,
    collection: string = 'job_assignments'
  ): Promise<void> {
    try {
      console.log(`📅 Processing job creation: ${jobId} from ${collection}`)

      // Check if AI automation is enabled
      const aiEnabled = await AIAutomationService.isEnabled()

      if (!aiEnabled) {
        console.log(
          `⚠️ AI automation disabled - skipping automatic calendar event creation for job ${jobId}`
        )
        return
      }

      // Skip if calendar event already created
      if (jobData.calendarEventCreated) {
        console.log(`⏭️ Calendar event already created for job ${jobId}`)
        return
      }

      // Skip test jobs or temporary jobs
      if (jobId.includes('test_job_flow') || jobId.includes('temp_')) {
        console.log(`⏭️ Skipping test/temporary job: ${jobId}`)
        return
      }

      // Validate job data before attempting calendar creation
      if (!jobData.title && !jobData.jobType) {
        console.warn(
          `⚠️ Job ${jobId} has no title or jobType, skipping calendar creation`
        )
        return
      }

      // Create calendar event for job with retry
      const result = await this.createCalendarEventWithRetry(
        jobId,
        collection,
        3
      )

      if (result.success) {
        // Mark job as having calendar event created
        await CalendarEventService.markJobCalendarEventCreated(
          jobId,
          collection
        )

        console.log(`✅ Calendar event created for job ${jobId}`)
        toast.success(
          `📅 Calendar event created for job: ${jobData.title || jobData.jobType || 'New Job'}`
        )
      } else {
        console.error(
          `❌ Failed to create calendar event for job ${jobId}:`,
          result.error
        )

        // Only show toast for non-temporary errors
        if (
          !result.error?.includes('not found') &&
          !result.error?.includes('test_job')
        ) {
          toast.error(`Failed to create calendar event: ${result.error}`)
        }
      }
    } catch (error) {
      console.error('❌ Error handling job creation:', error)

      // Only show toast for non-temporary errors
      if (
        !error.message?.includes('not found') &&
        !error.message?.includes('test_job')
      ) {
        toast.error('Error processing job creation')
      }
    }
  }

  /**
   * Create calendar event with retry mechanism
   */
  private async createCalendarEventWithRetry(
    jobId: string,
    collection: string,
    maxRetries: number
  ): Promise<{ success: boolean; error?: string }> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          `📅 Attempt ${attempt}/${maxRetries} to create calendar event for job ${jobId}`
        )

        const result = await CalendarEventService.createEventFromJob(
          jobId,
          collection
        )

        if (result.success) {
          return { success: true }
        } else if (
          result.error?.includes('not found') &&
          attempt < maxRetries
        ) {
          // Wait before retrying for "not found" errors
          console.log(
            `⏳ Job ${jobId} not found, waiting ${attempt * 2} seconds before retry...`
          )
          await new Promise((resolve) => setTimeout(resolve, attempt * 2000))
          continue
        } else {
          return { success: false, error: result.error }
        }
      } catch (error) {
        if (error.message?.includes('not found') && attempt < maxRetries) {
          console.log(
            `⏳ Job ${jobId} not found, waiting ${attempt * 2} seconds before retry...`
          )
          await new Promise((resolve) => setTimeout(resolve, attempt * 2000))
          continue
        } else {
          return { success: false, error: error.message }
        }
      }
    }

    return { success: false, error: `Failed after ${maxRetries} attempts` }
  }

  /**
   * 3. JOB ASSIGNMENT WORKFLOW
   * Update calendar events when jobs are assigned to staff
   */
  private setupJobAssignmentWorkflow(): void {
    console.log('👥 Setting up job assignment workflow...')

    // Listen to job_assignments collection for staff assignment changes
    const jobAssignmentsQuery = collection(db, 'job_assignments')

    this.jobAssignmentListener = onSnapshot(
      jobAssignmentsQuery,
      async (snapshot) => {
        for (const change of snapshot.docChanges()) {
          if (change.type === 'modified') {
            const job = { id: change.doc.id, ...change.doc.data() }
            const previousData = change.doc.metadata.fromCache
              ? null
              : change.doc.data()

            // Check if staff assignment changed (status changed to 'assigned' or staff ID changed)
            if (
              job.assignedStaffId &&
              (job.status === 'assigned' || job.status === 'accepted')
            ) {
              await this.handleJobAssignment(
                job.id,
                job.assignedStaffId,
                job.assignedStaffName || 'Unknown Staff'
              )
            }
          }
        }
      },
      (error) => {
        console.error('❌ Error in job assignment listener:', error)
      }
    )
  }

  /**
   * Handle individual job assignment
   */
  private async handleJobAssignment(
    jobId: string,
    staffId: string,
    staffName: string
  ): Promise<void> {
    try {
      console.log(`👤 Processing job assignment: ${jobId} → ${staffName}`)

      // Check if AI automation is enabled
      const aiEnabled = await AIAutomationService.isEnabled()

      if (!aiEnabled) {
        console.log(
          `⚠️ AI automation disabled - skipping automatic calendar event update for job assignment ${jobId}`
        )
        return
      }

      // Update calendar event with staff assignment
      const result = await CalendarEventService.updateEventForJobAssignment(
        jobId,
        staffId,
        staffName
      )

      if (result.success) {
        console.log(`✅ Calendar event updated for job assignment ${jobId}`)
        toast.success(`📅 Job assigned to ${staffName}`)
      } else {
        console.error(
          `❌ Failed to update calendar event for job assignment ${jobId}:`,
          result.error
        )
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
  async handleJobCompletion(
    jobId: string,
    completionAction: 'keep' | 'remove' | 'archive' = 'keep'
  ): Promise<void> {
    try {
      console.log(
        `✅ Processing job completion: ${jobId} (${completionAction})`
      )

      const result = await CalendarEventService.handleJobCompletion(
        jobId,
        completionAction
      )

      if (result.success) {
        console.log(`✅ Calendar event processed for job completion ${jobId}`)

        switch (completionAction) {
          case 'keep':
            toast.success('📅 Job completed - event kept on calendar')
            break
          case 'remove':
            toast.success(
              '📅 Job completed - event will be removed in 24 hours'
            )
            break
          case 'archive':
            toast.success('📅 Job completed - event archived')
            break
        }
      } else {
        console.error(
          `❌ Failed to process calendar event for job completion ${jobId}:`,
          result.error
        )
        toast.error(`Failed to process completion: ${result.error}`)
      }
    } catch (error) {
      console.error('❌ Error handling job completion:', error)
      toast.error('Error processing job completion')
    }
  }

  /**
   * 5. JOB STATUS CHANGE LISTENER
   * Listen for job status changes and handle calendar event cleanup
   */
  private setupJobStatusChangeListener(): void {
    console.log('📊 Setting up job status change listener...')

    if (!db) {
      console.error('❌ Firebase not initialized - cannot set up job status listener')
      return
    }

    // Listen to jobs collection for status changes and deletions
    const jobsQuery = collection(db, 'jobs')

    this.jobListener = onSnapshot(
      jobsQuery,
      async (snapshot) => {
        for (const change of snapshot.docChanges()) {
          const job = { id: change.doc.id, ...change.doc.data() }

          if (change.type === 'modified') {
            // Handle job status changes
            const previousData = change.doc.metadata.fromCache ? null : change.doc.data()

            // Check if job was completed or cancelled
            if (job.status === 'completed' || job.status === 'verified' || job.status === 'cancelled') {
              console.log(`✅ Job status changed to ${job.status}, removing calendar event: ${job.id}`)

              await CalendarEventService.removeEventByJobId(job.id)
              toast.success(`📅 Calendar updated - ${job.status} job removed`)
            }
          } else if (change.type === 'removed') {
            // Handle job deletion
            console.log(`🗑️ Job deleted, removing calendar event: ${change.doc.id}`)

            await CalendarEventService.removeEventByJobId(change.doc.id)
            toast.success('📅 Calendar updated - deleted job removed')
          }
        }
      },
      (error) => {
        console.error('❌ Error in job status listener:', error)
      }
    )
  }

  /**
   * UTILITY METHODS
   */

  /**
   * Setup job status change listener (public method)
   * Can be called from external components to enable real-time calendar cleanup
   */
  static setupJobStatusChangeListener(): (() => void) | null {
    console.log('📊 Setting up job status change listener...')

    if (!db) {
      console.error('❌ Firebase not initialized - cannot set up job status listener')
      return null
    }

    // Listen to jobs collection for status changes and deletions
    const jobsQuery = collection(db, 'jobs')

    const unsubscribe = onSnapshot(
      jobsQuery,
      async (snapshot) => {
        for (const change of snapshot.docChanges()) {
          const job = { id: change.doc.id, ...change.doc.data() }

          if (change.type === 'modified') {
            // Check if job was completed or cancelled
            if (job.status === 'completed' || job.status === 'verified' || job.status === 'cancelled') {
              console.log(`✅ Job status changed to ${job.status}, removing calendar event: ${job.id}`)

              try {
                await CalendarEventService.removeEventByJobId(job.id)
                toast.success(`📅 Calendar updated - ${job.status} job removed`)
              } catch (error) {
                console.error(`❌ Error removing calendar event for job ${job.id}:`, error)
              }
            }
          } else if (change.type === 'removed') {
            // Handle job deletion
            console.log(`�️ Job deleted, removing calendar event: ${change.doc.id}`)

            try {
              await CalendarEventService.removeEventByJobId(change.doc.id)
              toast.success('📅 Calendar updated - deleted job removed')
            } catch (error) {
              console.error(`❌ Error removing calendar event for deleted job ${change.doc.id}:`, error)
            }
          }
        }
      },
      (error) => {
        console.error('❌ Error in job status listener:', error)
      }
    )

    return unsubscribe
  }

  /**
   * Cleanup orphaned calendar events
   */
  async cleanupOrphanedEvents(): Promise<void> {
    try {
      console.log('🧹 Starting cleanup of orphaned calendar events...')

      const result = await CalendarEventService.cleanupOrphanedEvents()

      if (result.success) {
        console.log(
          `✅ Cleanup complete: removed ${result.removedCount || 0} orphaned events`
        )
        if (result.removedCount && result.removedCount > 0) {
          toast.success(
            `🧹 Cleaned up ${result.removedCount} orphaned calendar events`
          )
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
   * Clean up ALL test/mock calendar events
   */
  async cleanupTestJobEvents(): Promise<void> {
    try {
      console.log('🧹 Cleaning up ALL test/mock calendar events...')

      // Use the CalendarEventService to handle the cleanup
      const result = await CalendarEventService.cleanupOrphanedEvents()

      if (result.success) {
        console.log('✅ Calendar cleanup completed successfully')
        toast.success(`🧹 Cleaned up calendar events successfully`)
      } else {
        console.error('❌ Calendar cleanup failed:', result.error)
        toast.error(`❌ Cleanup failed: ${result.error}`)
      }
    } catch (error) {
      console.error('❌ Error cleaning up test calendar events:', error)
      toast.error(
        `❌ Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Clean up test/mock calendar events (alternative implementation)
   */
  async cleanupTestJobEventsAlternative(): Promise<void> {
    try {
      console.log('🧹 Cleaning up ALL test/mock calendar events...')

      // Import Firebase functions with error handling
      const firestore = await import('firebase/firestore').catch((err) => {
        console.error('Failed to import firebase/firestore:', err)
        throw new Error('Firebase import failed')
      })

      const firebase = await import('@/lib/firebase').catch((err) => {
        console.error('Failed to import firebase config:', err)
        throw new Error('Firebase config import failed')
      })

      const { collection, getDocs, deleteDoc, doc } = firestore
      const { db } = firebase

      if (!db) {
        throw new Error('Firebase database not initialized')
      }

      const calendarEventsRef = collection(db, 'calendarEvents')

      // Get all calendar events to check for test data
      const allEventsSnapshot = await getDocs(calendarEventsRef)

      if (allEventsSnapshot.empty) {
        console.log('✅ No calendar events found')
        toast.success('✅ No calendar events found to clean up')
        return
      }

      const testEventIds: string[] = []

      allEventsSnapshot.forEach((eventDoc) => {
        const data = eventDoc.data()
        const isTestEvent =
          // Test job IDs
          data.sourceId?.includes('test_job') ||
          data.sourceId?.includes('temp_') ||
          data.id?.includes('test_') ||
          // Mock property names
          data.propertyName?.includes('Sunset Paradise') ||
          data.propertyName?.includes('Ocean View Villa') ||
          data.propertyName?.includes('Test Property') ||
          data.propertyName?.includes('Paradise Villa') ||
          data.propertyName?.includes('Villa Sia Moon Test') ||
          // Mock staff names
          data.assignedStaff?.includes('Maria Santos') ||
          data.assignedStaff?.includes('John Chen') ||
          data.assignedStaff?.includes('Test Staff') ||
          data.assignedStaff?.includes('Carlos Rodriguez') ||
          // Test titles
          data.title?.includes('Test ') ||
          data.title?.includes('Sample ') ||
          data.title?.includes('Mock ') ||
          data.title?.includes('Demo ') ||
          // Test descriptions
          data.description?.includes('test') ||
          data.description?.includes('sample') ||
          data.description?.includes('mock') ||
          data.description?.includes('demo')

        if (isTestEvent) {
          testEventIds.push(eventDoc.id)
          console.log(`🗑️ Marking for deletion: ${data.title} (${eventDoc.id})`)
        }
      })

      if (testEventIds.length === 0) {
        console.log('✅ No test/mock calendar events found to clean up')
        return
      }

      console.log(
        `🧹 Found ${testEventIds.length} test/mock calendar events to delete`
      )

      // Delete test calendar events in batches
      const batchSize = 10
      for (let i = 0; i < testEventIds.length; i += batchSize) {
        const batch = testEventIds.slice(i, i + batchSize)
        const deletePromises = batch.map((eventId) =>
          deleteDoc(doc(db, 'calendarEvents', eventId))
        )
        await Promise.all(deletePromises)
        console.log(`🗑️ Deleted batch ${Math.floor(i / batchSize) + 1}`)
      }

      console.log(
        `✅ Cleaned up ${testEventIds.length} test/mock calendar events`
      )
      toast.success(
        `✅ Cleaned up ${testEventIds.length} test/mock calendar events`
      )
    } catch (error) {
      console.error('❌ Error cleaning up test calendar events:', error)
      toast.error(
        `❌ Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Destroy all listeners
   */
  destroy(): void {
    console.log('🔄 Destroying Calendar Integration Service...')

    // Cleanup AI Booking Approval Service
    AIBookingApprovalService.cleanup()

    // Cleanup Smart Job Assignment Service
    SmartJobAssignmentService.cleanup()

    // Cleanup Calendar Event Service
    CalendarEventService.cleanup()

    // Cleanup Financial Reporting Service
    FinancialReportingService.cleanup()

    // Cleanup Notification Service
    NotificationService.cleanup()

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
