/**
 * Calendar Event Service
 * Comprehensive calendar integration for Sia Moon Property Management
 * Handles automated workflows for bookings, jobs, and staff assignments
 */

import { db } from '@/lib/firebase'
import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  writeBatch
} from 'firebase/firestore'

// Type definitions for comprehensive calendar integration
interface BookingData {
  id: string
  propertyName?: string
  propertyId?: string
  checkIn?: string
  checkOut?: string
  guestName?: string
  guestEmail?: string
  assignedStaffId?: string
  assignedStaffName?: string
  bookingType?: string
  status?: string
  createdAt?: any
  approvedAt?: any
  [key: string]: any
}

interface JobData {
  id: string
  title: string
  description?: string
  propertyId?: string
  propertyName?: string
  assignedStaffId?: string
  assignedStaffName?: string
  scheduledDate?: string
  scheduledTime?: string
  endTime?: string
  status?: string
  type?: string
  bookingId?: string
  createdAt?: any
  [key: string]: any
}

interface CalendarEventData {
  id: string
  title: string
  propertyId: string | null
  staffId: string | null
  status: 'pending' | 'assigned' | 'in-progress' | 'completed' | 'cancelled'
  type: string
  startDate: string
  endDate: string
  color: string
  sourceId: string // booking ID or job ID
  sourceType: 'booking' | 'job'
  propertyName?: string
  assignedStaff?: string
  description?: string
  createdAt: any
  updatedAt: any
}

class CalendarEventService {
  private readonly CALENDAR_EVENTS_COLLECTION = 'calendarEvents'
  private readonly BOOKINGS_COLLECTION = 'bookings'
  private readonly JOBS_COLLECTION = 'jobs'
  private readonly STAFF_COLLECTION = 'staff_accounts'
  private readonly PROPERTIES_COLLECTION = 'properties'

  // Color coding for different event types
  private readonly EVENT_COLORS = {
    'check-in': '#3B82F6',      // Blue
    'check-out': '#F97316',     // Orange
    'cleaning': '#10B981',      // Green
    'maintenance': '#F59E0B',   // Yellow
    'inspection': '#8B5CF6',    // Purple
    'setup': '#EC4899',         // Pink
    'security': '#6B7280',      // Gray
    'default': '#6366F1'        // Indigo
  }

  /**
   * 1. BOOKING-TO-CALENDAR INTEGRATION
   * Create calendar events when booking is approved
   */
  async createEventsFromBooking(bookingId: string): Promise<{ success: boolean; eventIds?: string[]; error?: string }> {
    try {
      console.log(`📅 Creating calendar events for booking: ${bookingId}`)

      // Get booking data from Firebase
      const bookingRef = doc(db, this.BOOKINGS_COLLECTION, bookingId)
      const bookingSnap = await getDoc(bookingRef)

      if (!bookingSnap.exists()) {
        throw new Error(`Booking ${bookingId} not found`)
      }

      const booking = { id: bookingSnap.id, ...bookingSnap.data() } as BookingData

      // Validate required booking data
      if (!booking.checkIn || !booking.checkOut || !booking.propertyName) {
        throw new Error('Booking missing required data: checkIn, checkOut, or propertyName')
      }

      const eventIds: string[] = []

      // Create check-in event
      const checkInEventId = `checkin_${bookingId}_${Date.now()}`
      const checkInEvent: CalendarEventData = {
        id: checkInEventId,
        title: `Check-in: ${booking.propertyName}`,
        propertyId: booking.propertyId || null,
        staffId: booking.assignedStaffId || null,
        status: 'pending',
        type: 'check-in',
        startDate: new Date(booking.checkIn).toISOString(),
        endDate: new Date(new Date(booking.checkIn).getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
        color: this.EVENT_COLORS['check-in'],
        sourceId: bookingId,
        sourceType: 'booking',
        propertyName: booking.propertyName,
        assignedStaff: booking.assignedStaffName || 'Unassigned',
        description: `Guest check-in for ${booking.guestName || 'Guest'}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      // Create check-out event
      const checkOutEventId = `checkout_${bookingId}_${Date.now()}`
      const checkOutEvent: CalendarEventData = {
        id: checkOutEventId,
        title: `Check-out: ${booking.propertyName}`,
        propertyId: booking.propertyId || null,
        staffId: booking.assignedStaffId || null,
        status: 'pending',
        type: 'check-out',
        startDate: new Date(booking.checkOut).toISOString(),
        endDate: new Date(new Date(booking.checkOut).getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
        color: this.EVENT_COLORS['check-out'],
        sourceId: bookingId,
        sourceType: 'booking',
        propertyName: booking.propertyName,
        assignedStaff: booking.assignedStaffName || 'Unassigned',
        description: `Guest check-out for ${booking.guestName || 'Guest'}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      // Save events to Firebase
      await setDoc(doc(db, this.CALENDAR_EVENTS_COLLECTION, checkInEventId), checkInEvent)
      await setDoc(doc(db, this.CALENDAR_EVENTS_COLLECTION, checkOutEventId), checkOutEvent)

      eventIds.push(checkInEventId, checkOutEventId)

      console.log(`✅ Created ${eventIds.length} calendar events for booking ${bookingId}`)
      return { success: true, eventIds }

    } catch (error) {
      console.error('❌ Error creating calendar events from booking:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create calendar events'
      }
    }
  }

  /**
   * 2. JOB-TO-CALENDAR INTEGRATION
   * Create calendar event when job is created
   */
  async createEventFromJob(jobId: string): Promise<{ success: boolean; eventId?: string; error?: string }> {
    try {
      console.log(`📅 Creating calendar event for job: ${jobId}`)

      // Get job data from Firebase
      const jobRef = doc(db, this.JOBS_COLLECTION, jobId)
      const jobSnap = await getDoc(jobRef)

      if (!jobSnap.exists()) {
        throw new Error(`Job ${jobId} not found`)
      }

      const job = { id: jobSnap.id, ...jobSnap.data() } as JobData

      // Validate required job data
      if (!job.title || !job.scheduledDate) {
        throw new Error('Job missing required data: title or scheduledDate')
      }

      // Calculate start and end times
      const startDate = job.scheduledTime
        ? new Date(`${job.scheduledDate}T${job.scheduledTime}:00`)
        : new Date(job.scheduledDate)

      const endDate = job.endTime
        ? new Date(`${job.scheduledDate}T${job.endTime}:00`)
        : new Date(startDate.getTime() + 2 * 60 * 60 * 1000) // Default 2 hours

      // Determine color based on job type
      const jobType = job.type?.toLowerCase() || 'default'
      const color = this.EVENT_COLORS[jobType] || this.EVENT_COLORS.default

      // Create calendar event
      const eventId = `job_${jobId}_${Date.now()}`
      const calendarEvent: CalendarEventData = {
        id: eventId,
        title: job.title,
        propertyId: job.propertyId || null,
        staffId: job.assignedStaffId || null,
        status: job.assignedStaffId ? 'assigned' : 'pending',
        type: job.type || 'task',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        color,
        sourceId: jobId,
        sourceType: 'job',
        propertyName: job.propertyName || 'Unknown Property',
        assignedStaff: job.assignedStaffName || 'Unassigned',
        description: job.description || `${job.type || 'Task'} job`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      // Save event to Firebase
      await setDoc(doc(db, this.CALENDAR_EVENTS_COLLECTION, eventId), calendarEvent)

      console.log(`✅ Created calendar event ${eventId} for job ${jobId}`)
      return { success: true, eventId }

    } catch (error) {
      console.error('❌ Error creating calendar event from job:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create calendar event'
      }
    }
  }

  /**
   * 3. JOB ASSIGNMENT INTEGRATION
   * Update calendar event when job is assigned to staff
   */
  async updateEventForJobAssignment(jobId: string, staffId: string, staffName: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📅 Updating calendar event for job assignment: ${jobId} → ${staffName}`)

      // Find calendar event for this job
      const eventsQuery = query(
        collection(db, this.CALENDAR_EVENTS_COLLECTION),
        where('sourceId', '==', jobId),
        where('sourceType', '==', 'job')
      )

      const eventsSnap = await getDocs(eventsQuery)

      if (eventsSnap.empty) {
        console.warn(`No calendar event found for job ${jobId}`)
        return { success: false, error: 'Calendar event not found for job' }
      }

      // Update all related events (should typically be just one)
      const batch = writeBatch(db)
      let updatedCount = 0

      eventsSnap.docs.forEach(eventDoc => {
        const eventRef = doc(db, this.CALENDAR_EVENTS_COLLECTION, eventDoc.id)
        batch.update(eventRef, {
          staffId,
          assignedStaff: staffName,
          status: 'assigned',
          updatedAt: serverTimestamp()
        })
        updatedCount++
      })

      await batch.commit()

      console.log(`✅ Updated ${updatedCount} calendar events for job assignment`)
      return { success: true }

    } catch (error) {
      console.error('❌ Error updating calendar event for job assignment:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update calendar event'
      }
    }
  }

  /**
   * 4. JOB COMPLETION WORKFLOW
   * Handle calendar event when job is completed
   */
  async handleJobCompletion(jobId: string, completionAction: 'keep' | 'remove' | 'archive' = 'keep'): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📅 Handling job completion for: ${jobId} (action: ${completionAction})`)

      // Find calendar event for this job
      const eventsQuery = query(
        collection(db, this.CALENDAR_EVENTS_COLLECTION),
        where('sourceId', '==', jobId),
        where('sourceType', '==', 'job')
      )

      const eventsSnap = await getDocs(eventsQuery)

      if (eventsSnap.empty) {
        console.warn(`No calendar event found for completed job ${jobId}`)
        return { success: true } // Not an error if no event exists
      }

      const batch = writeBatch(db)
      let processedCount = 0

      eventsSnap.docs.forEach(eventDoc => {
        const eventRef = doc(db, this.CALENDAR_EVENTS_COLLECTION, eventDoc.id)

        switch (completionAction) {
          case 'keep':
            // Keep event with completed status and green color
            batch.update(eventRef, {
              status: 'completed',
              color: this.EVENT_COLORS.cleaning, // Green for completed
              updatedAt: serverTimestamp()
            })
            break

          case 'remove':
            // Remove event immediately
            batch.delete(eventRef)
            break

          case 'archive':
            // Mark as archived (could be filtered out in UI)
            batch.update(eventRef, {
              status: 'completed',
              archived: true,
              archivedAt: serverTimestamp(),
              color: this.EVENT_COLORS.cleaning,
              updatedAt: serverTimestamp()
            })
            break
        }
        processedCount++
      })

      await batch.commit()

      // Schedule automatic removal after 24 hours if action is 'remove'
      if (completionAction === 'remove') {
        setTimeout(async () => {
          try {
            await this.removeCompletedJobEvents(jobId)
          } catch (error) {
            console.error('❌ Error in delayed event removal:', error)
          }
        }, 24 * 60 * 60 * 1000) // 24 hours
      }

      console.log(`✅ Processed ${processedCount} calendar events for job completion`)
      return { success: true }

    } catch (error) {
      console.error('❌ Error handling job completion:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to handle job completion'
      }
    }
  }

  /**
   * UTILITY METHODS
   */

  /**
   * Remove completed job events (used for delayed removal)
   */
  private async removeCompletedJobEvents(jobId: string): Promise<void> {
    const eventsQuery = query(
      collection(db, this.CALENDAR_EVENTS_COLLECTION),
      where('sourceId', '==', jobId),
      where('sourceType', '==', 'job'),
      where('status', '==', 'completed')
    )

    const eventsSnap = await getDocs(eventsQuery)
    const batch = writeBatch(db)

    eventsSnap.docs.forEach(eventDoc => {
      batch.delete(doc(db, this.CALENDAR_EVENTS_COLLECTION, eventDoc.id))
    })

    await batch.commit()
    console.log(`🗑️ Removed ${eventsSnap.size} completed job events for ${jobId}`)
  }

  /**
   * Update existing calendar event
   */
  async updateEvent(eventId: string, updates: Partial<CalendarEventData>): Promise<{ success: boolean; error?: string }> {
    try {
      const eventRef = doc(db, this.CALENDAR_EVENTS_COLLECTION, eventId)
      await updateDoc(eventRef, {
        ...updates,
        updatedAt: serverTimestamp()
      })

      console.log(`✅ Updated calendar event: ${eventId}`)
      return { success: true }

    } catch (error) {
      console.error('❌ Error updating calendar event:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update event'
      }
    }
  }

  /**
   * Delete calendar event
   */
  async deleteEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await deleteDoc(doc(db, this.CALENDAR_EVENTS_COLLECTION, eventId))
      console.log(`🗑️ Deleted calendar event: ${eventId}`)
      return { success: true }

    } catch (error) {
      console.error('❌ Error deleting calendar event:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete event'
      }
    }
  }

  /**
   * Clean up orphaned events (events whose source records no longer exist)
   */
  async cleanupOrphanedEvents(): Promise<{ success: boolean; removedCount?: number; error?: string }> {
    try {
      console.log('🧹 Starting cleanup of orphaned calendar events...')

      const eventsSnap = await getDocs(collection(db, this.CALENDAR_EVENTS_COLLECTION))
      const batch = writeBatch(db)
      let removedCount = 0

      for (const eventDoc of eventsSnap.docs) {
        const event = eventDoc.data() as CalendarEventData

        // Check if source record still exists
        let sourceExists = false
        try {
          const sourceCollection = event.sourceType === 'booking' ? this.BOOKINGS_COLLECTION : this.JOBS_COLLECTION
          const sourceRef = doc(db, sourceCollection, event.sourceId)
          const sourceSnap = await getDoc(sourceRef)
          sourceExists = sourceSnap.exists()
        } catch (error) {
          console.warn(`Error checking source for event ${eventDoc.id}:`, error)
        }

        if (!sourceExists) {
          batch.delete(doc(db, this.CALENDAR_EVENTS_COLLECTION, eventDoc.id))
          removedCount++
        }
      }

      if (removedCount > 0) {
        await batch.commit()
      }

      console.log(`✅ Cleanup complete: removed ${removedCount} orphaned events`)
      return { success: true, removedCount }

    } catch (error) {
      console.error('❌ Error during cleanup:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cleanup orphaned events'
      }
    }
  }

  /**
   * REAL-TIME INTEGRATION METHODS
   */

  /**
   * Set up real-time listener for booking approvals
   */
  setupBookingApprovalListener(callback: (bookingId: string) => void): () => void {
    const bookingsQuery = query(
      collection(db, this.BOOKINGS_COLLECTION),
      where('status', '==', 'approved')
    )

    return onSnapshot(bookingsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const booking = change.doc.data()
          if (booking.status === 'approved' && !booking.calendarEventsCreated) {
            callback(change.doc.id)
          }
        }
      })
    })
  }

  /**
   * Set up real-time listener for job creation
   */
  setupJobCreationListener(callback: (jobId: string) => void): () => void {
    const jobsQuery = collection(db, this.JOBS_COLLECTION)

    return onSnapshot(jobsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const job = change.doc.data()
          if (!job.calendarEventCreated) {
            callback(change.doc.id)
          }
        }
      })
    })
  }

  /**
   * Set up real-time listener for job assignments
   */
  setupJobAssignmentListener(callback: (jobId: string, staffId: string, staffName: string) => void): () => void {
    const jobsQuery = collection(db, this.JOBS_COLLECTION)

    return onSnapshot(jobsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const job = change.doc.data()
          const previousJob = change.doc.metadata.fromCache ? null : change.doc.data()

          // Check if staff assignment changed
          if (job.assignedStaffId && job.assignedStaffId !== previousJob?.assignedStaffId) {
            callback(change.doc.id, job.assignedStaffId, job.assignedStaffName || 'Unknown Staff')
          }
        }
      })
    })
  }

  /**
   * Mark booking as having calendar events created
   */
  async markBookingCalendarEventsCreated(bookingId: string): Promise<void> {
    try {
      const bookingRef = doc(db, this.BOOKINGS_COLLECTION, bookingId)
      await updateDoc(bookingRef, {
        calendarEventsCreated: true,
        calendarEventsCreatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error marking booking calendar events created:', error)
    }
  }

  /**
   * Mark job as having calendar event created
   */
  async markJobCalendarEventCreated(jobId: string): Promise<void> {
    try {
      const jobRef = doc(db, this.JOBS_COLLECTION, jobId)
      await updateDoc(jobRef, {
        calendarEventCreated: true,
        calendarEventCreatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error marking job calendar event created:', error)
    }
  }
}

// Export singleton instance
const calendarEventService = new CalendarEventService()
export default calendarEventService
