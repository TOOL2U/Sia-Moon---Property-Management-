/**
 * Advanced Calendar Event Service
 * Comprehensive calendar integration with real-time synchronization
 * Handles automated workflows for bookings, jobs, and staff assignments
 */

import { db } from '@/lib/firebase'
import { clientToast as toast } from '@/utils/clientToast'
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import AIAutomationService from './AIAutomationService'

// Calendar event types with visual coding
export const CALENDAR_EVENT_TYPES = {
  BOOKING: {
    type: 'booking',
    color: '#3B82F6', // Blue
    backgroundColor: '#1E40AF',
    textColor: '#FFFFFF',
    priority: 'high',
  },
  CLEANING: {
    type: 'cleaning',
    color: '#10B981', // Green
    backgroundColor: '#059669',
    textColor: '#FFFFFF',
    priority: 'high',
  },
  MAINTENANCE: {
    type: 'maintenance',
    color: '#F59E0B', // Orange
    backgroundColor: '#D97706',
    textColor: '#FFFFFF',
    priority: 'medium',
  },
  CHECK_IN_PREP: {
    type: 'check_in_prep',
    color: '#8B5CF6', // Purple
    backgroundColor: '#7C3AED',
    textColor: '#FFFFFF',
    priority: 'high',
  },
  INSPECTION: {
    type: 'inspection',
    color: '#EAB308', // Yellow
    backgroundColor: '#CA8A04',
    textColor: '#000000',
    priority: 'medium',
  },
} as const

// Enhanced calendar event interface
export interface EnhancedCalendarEvent {
  id: string
  eventType:
    | 'booking'
    | 'cleaning'
    | 'maintenance'
    | 'check_in_prep'
    | 'inspection'
  propertyId: string
  propertyName?: string
  staffId?: string
  staffName?: string
  startDate: Timestamp
  endDate: Timestamp
  title: string
  description: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  bookingId?: string
  jobId?: string
  guestName?: string
  priority: 'low' | 'medium' | 'high'
  estimatedDuration?: number
  requiredSkills?: string[]
  color: string
  backgroundColor: string
  textColor: string
  createdAt: Timestamp
  createdBy: string
  lastModified?: Timestamp
  modifiedBy?: string
  automatedCreation: boolean
  conflictResolved?: boolean
}

// Calendar view types
export type CalendarViewType = 'day' | 'week' | 'month' | 'property' | 'staff'

// Calendar filter options
export interface CalendarFilters {
  propertyIds?: string[]
  staffIds?: string[]
  eventTypes?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  status?: string[]
}

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

  // DISABLE calendar event creation to prevent duplicates
  // Calendar now reads directly from jobs and bookings collections
  private readonly DISABLE_CALENDAR_EVENT_CREATION = true

  // Real-time listeners for synchronization
  private bookingListener: (() => void) | null = null
  private jobListener: (() => void) | null = null
  private calendarListener: (() => void) | null = null
  private isInitialized = false

  // Performance tracking
  private syncMetrics = {
    eventsCreated: 0,
    eventsUpdated: 0,
    eventsDeleted: 0,
    syncErrors: 0,
    averageSyncTime: 0,
  }

  // Color coding for different event types (legacy support)
  private readonly EVENT_COLORS = {
    'check-in': '#3B82F6', // Blue
    'check-out': '#F97316', // Orange
    cleaning: '#10B981', // Green
    maintenance: '#F59E0B', // Yellow
    inspection: '#8B5CF6', // Purple
    setup: '#EC4899', // Pink
    security: '#6B7280', // Gray
    default: '#6366F1', // Indigo
  }

  /**
   * Clean event data to remove undefined values before saving to Firebase
   */
  private cleanEventData(eventData: any): any {
    const cleaned: any = {}

    for (const [key, value] of Object.entries(eventData)) {
      if (value !== undefined && value !== null) {
        cleaned[key] = value
      }
    }

    // Ensure required fields have default values
    if (!cleaned.propertyName) {
      cleaned.propertyName = 'Unknown Property'
    }
    if (!cleaned.assignedStaff) {
      cleaned.assignedStaff = 'Unassigned'
    }
    if (!cleaned.description) {
      cleaned.description = 'No description available'
    }
    if (!cleaned.title) {
      cleaned.title = 'Untitled Event'
    }

    return cleaned
  }

  /**
   * Check if data is test/mock data
   */
  private isTestData(data: any): boolean {
    const testIndicators = [
      // Test IDs
      data.id?.includes('test_'),
      data.id?.includes('mock_'),
      data.id?.includes('demo_'),
      data.id?.includes('sample_'),

      // Test property names
      data.propertyName?.includes('Sunset Paradise'),
      data.propertyName?.includes('Ocean View Villa'),
      data.propertyName?.includes('Test Property'),
      data.propertyName?.includes('Paradise Villa'),
      data.propertyName?.includes('Villa Sia Moon Test'),
      data.property?.includes('Sunset Paradise'),
      data.property?.includes('Ocean View Villa'),
      data.property?.includes('Test Property'),

      // Test staff names
      data.assignedStaffName?.includes('Maria Santos'),
      data.assignedStaffName?.includes('John Chen'),
      data.assignedStaffName?.includes('Test Staff'),
      data.assignedStaffName?.includes('Carlos Rodriguez'),
      data.assignedStaff?.includes('Maria Santos'),
      data.assignedStaff?.includes('John Chen'),
      data.assignedStaff?.includes('Test Staff'),

      // Test guest names
      data.guestName?.includes('Test Guest'),
      data.guestName?.includes('John Doe'),
      data.guestName?.includes('Jane Smith'),
      data.guest_name?.includes('Test Guest'),

      // Test titles
      data.title?.includes('Test '),
      data.title?.includes('Sample '),
      data.title?.includes('Mock '),
      data.title?.includes('Demo '),

      // Test job types
      data.jobType?.includes('test'),
      data.jobType?.includes('sample'),
    ]

    return testIndicators.some((indicator) => indicator === true)
  }

  /**
   * 1. BOOKING-TO-CALENDAR INTEGRATION
   * Create calendar events when booking is approved
   */
  async createEventsFromBooking(
    bookingId: string
  ): Promise<{ success: boolean; eventIds?: string[]; error?: string }> {
    try {
      console.log(`📅 Creating calendar events for booking: ${bookingId}`)

      // DISABLED: Calendar event creation to prevent duplicates
      if (this.DISABLE_CALENDAR_EVENT_CREATION) {
        console.log(`⏭️ Calendar event creation disabled - calendar reads directly from bookings`)
        return { success: true, eventIds: [] }
      }

      // Skip test/mock bookings
      if (this.isTestData({ id: bookingId })) {
        console.log(`⏭️ Skipping test/mock booking: ${bookingId}`)
        return { success: true, eventIds: [] }
      }

      // Try to find booking in multiple collections
      const collections = ['bookings', 'pending_bookings', 'live_bookings', 'bookings_approved']
      let booking: BookingData | null = null

      for (const collectionName of collections) {
        try {
          const bookingRef = doc(db, collectionName, bookingId)
          const bookingSnap = await getDoc(bookingRef)

          if (bookingSnap.exists()) {
            booking = {
              id: bookingSnap.id,
              ...bookingSnap.data(),
            } as BookingData
            console.log(
              `✅ Found booking ${bookingId} in ${collectionName} collection`
            )
            break
          }
        } catch (error) {
          console.warn(`⚠️ Error checking ${collectionName}:`, error)
        }
      }

      if (!booking) {
        throw new Error(`Booking ${bookingId} not found in any collection`)
      }

      // Additional check for test data in booking content
      if (this.isTestData(booking)) {
        console.log(`⏭️ Skipping test/mock booking data: ${bookingId}`)
        return { success: true, eventIds: [] }
      }

      // Validate required booking data with flexible field names
      const checkInDate = booking.checkIn || booking.checkInDate
      const checkOutDate = booking.checkOut || booking.checkOutDate
      const propertyName =
        booking.propertyName ||
        booking.property ||
        booking.propertyId ||
        'Unknown Property'

      if (!checkInDate || !checkOutDate) {
        throw new Error(
          'Booking missing required data: checkIn/checkInDate or checkOut/checkOutDate'
        )
      }

      // Ensure propertyName is never undefined
      const safePropertyName = propertyName || 'Unknown Property'

      const eventIds: string[] = []

      // Create check-in event with robust date parsing
      const checkInEventId = `checkin_${bookingId}_${Date.now()}`
      const checkInStartDate = this.parseFlexibleDate(checkInDate)
      const checkInEndDate = new Date(
        checkInStartDate.getTime() + 2 * 60 * 60 * 1000
      ) // 2 hours

      const checkInEvent: CalendarEventData = {
        id: checkInEventId,
        title: `Check-in: ${safePropertyName}`,
        propertyId: booking.propertyId || null,
        staffId: booking.assignedStaffId || null,
        status: 'pending',
        type: 'check-in',
        startDate: checkInStartDate.toISOString(),
        endDate: checkInEndDate.toISOString(),
        color: this.EVENT_COLORS['check-in'],
        sourceId: bookingId,
        sourceType: 'booking',
        propertyName: safePropertyName,
        assignedStaff: booking.assignedStaffName || 'Unassigned',
        description: `Guest check-in for ${booking.guestName || 'Guest'} • ${booking.guests || 1} guests • Total: ${booking.price ? `$${booking.price}` : 'N/A'}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      // Create check-out event with robust date parsing
      const checkOutEventId = `checkout_${bookingId}_${Date.now()}`
      const checkOutStartDate = this.parseFlexibleDate(checkOutDate)
      const checkOutEndDate = new Date(
        checkOutStartDate.getTime() + 2 * 60 * 60 * 1000
      ) // 2 hours

      const checkOutEvent: CalendarEventData = {
        id: checkOutEventId,
        title: `Check-out: ${safePropertyName}`,
        propertyId: booking.propertyId || null,
        staffId: booking.assignedStaffId || null,
        status: 'pending',
        type: 'check-out',
        startDate: checkOutStartDate.toISOString(),
        endDate: checkOutEndDate.toISOString(),
        color: this.EVENT_COLORS['check-out'],
        sourceId: bookingId,
        sourceType: 'booking',
        propertyName: safePropertyName,
        assignedStaff: booking.assignedStaffName || 'Unassigned',
        description: `Guest check-out for ${booking.guestName || 'Guest'} • ${booking.guests || 1} guests • Total: ${booking.price ? `$${booking.price}` : 'N/A'}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      // Validate and clean data before saving to Firebase
      const cleanCheckInEvent = this.cleanEventData(checkInEvent)
      const cleanCheckOutEvent = this.cleanEventData(checkOutEvent)

      // Save events to Firebase
      await setDoc(
        doc(db, this.CALENDAR_EVENTS_COLLECTION, checkInEventId),
        cleanCheckInEvent
      )
      await setDoc(
        doc(db, this.CALENDAR_EVENTS_COLLECTION, checkOutEventId),
        cleanCheckOutEvent
      )

      eventIds.push(checkInEventId, checkOutEventId)

      console.log(
        `✅ Created ${eventIds.length} calendar events for booking ${bookingId}`
      )
      return { success: true, eventIds }
    } catch (error) {
      console.error('❌ Error creating calendar events from booking:', error)
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create calendar events',
      }
    }
  }

  /**
   * 2. JOB-TO-CALENDAR INTEGRATION
   * Create calendar event when job is created
   */
  async createEventFromJob(
    jobId: string,
    collection: string = 'job_assignments'
  ): Promise<{ success: boolean; eventId?: string; error?: string }> {
    try {
      console.log(
        `📅 Creating calendar event for job: ${jobId} from ${collection}`
      )

      // DISABLED: Calendar event creation to prevent duplicates
      if (this.DISABLE_CALENDAR_EVENT_CREATION) {
        console.log(`⏭️ Calendar event creation disabled - calendar reads directly from jobs`)
        return { success: true, eventId: undefined }
      }

      // Skip test/mock jobs
      if (this.isTestData({ id: jobId })) {
        console.log(`⏭️ Skipping test/mock job: ${jobId}`)
        return { success: true, eventId: undefined }
      }

      // Get job data from Firebase - try multiple collections with retry
      let jobRef = doc(db, collection, jobId)
      let jobSnap = await getDoc(jobRef)

      // Fallback to other collections if not found
      if (!jobSnap.exists() && collection !== 'jobs') {
        console.log(
          `📅 Job ${jobId} not found in ${collection}, trying 'jobs' collection`
        )
        jobRef = doc(db, 'jobs', jobId)
        jobSnap = await getDoc(jobRef)
      }

      // Try additional collections
      if (!jobSnap.exists()) {
        const additionalCollections = ['task_assignments', 'enhanced_jobs']
        for (const altCollection of additionalCollections) {
          console.log(
            `📅 Job ${jobId} not found, trying '${altCollection}' collection`
          )
          jobRef = doc(db, altCollection, jobId)
          jobSnap = await getDoc(jobRef)
          if (jobSnap.exists()) {
            console.log(`✅ Found job ${jobId} in ${altCollection} collection`)
            break
          }
        }
      }

      if (!jobSnap.exists()) {
        console.warn(
          `⚠️ Job ${jobId} not found in any collection, this might be a timing issue`
        )
        throw new Error(`Job ${jobId} not found in any collection`)
      }

      const job = { id: jobSnap.id, ...jobSnap.data() } as JobData

      // Additional check for test data in job content
      if (this.isTestData(job)) {
        console.log(`⏭️ Skipping test/mock job data: ${jobId}`)
        return { success: true, eventId: undefined }
      }

      // Handle different data structures for jobs vs job_assignments
      const title = job.title || job.jobType || 'Untitled Job'

      // More comprehensive date field mapping
      const scheduledDate =
        job.scheduledDate ||
        job.scheduledStartDate ||
        job.deadline ||
        job.checkInDate ||
        job.checkOutDate ||
        (job.createdAt &&
        typeof job.createdAt === 'object' &&
        job.createdAt.toDate
          ? job.createdAt.toDate().toISOString().split('T')[0]
          : null) ||
        new Date().toISOString().split('T')[0] // Fallback to today

      const jobType = job.type || job.jobType || job.category || 'task'
      const propertyName =
        job.propertyName ||
        job.propertyId ||
        job.property ||
        (job.propertyRef && job.propertyRef.name) ||
        'Unknown Property'

      // Ensure propertyName is never undefined
      const safePropertyName = propertyName || 'Unknown Property'

      const assignedStaff =
        job.assignedStaffName ||
        job.assignedStaff ||
        (job.assignedStaffRef && job.assignedStaffRef.name) ||
        'Unassigned'
      const description = job.description || `${jobType} job`

      // Debug logging for date parsing
      console.log(`📅 Job ${jobId} date fields:`, {
        scheduledDate,
        scheduledTime: job.scheduledTime,
        scheduledStartTime: job.scheduledStartTime,
        scheduledEndTime: job.scheduledEndTime,
        deadline: job.deadline,
        estimatedDuration: job.estimatedDuration,
      })

      // Validate required job data with flexible field names
      if (!title) {
        throw new Error(`Job missing required data: title="${title}"`)
      }

      // If no valid scheduled date, use a reasonable default
      let finalScheduledDate = scheduledDate
      if (!scheduledDate || scheduledDate === 'undefined') {
        console.warn(
          `⚠️ Job ${jobId} has no valid scheduled date, using current time`
        )
        finalScheduledDate = new Date().toISOString().split('T')[0]
        console.log(`📅 Using fallback date: ${finalScheduledDate}`)
      }

      // Calculate start and end times with robust date parsing
      let startDate: Date

      try {
        if (job.scheduledTime && finalScheduledDate) {
          // Combine date and time strings
          const timeStr = job.scheduledTime.includes(':')
            ? job.scheduledTime
            : `${job.scheduledTime}:00`
          startDate = new Date(`${finalScheduledDate}T${timeStr}`)
        } else if (job.scheduledStartTime) {
          // Handle various date formats
          startDate = this.parseFlexibleDate(job.scheduledStartTime)
        } else if (finalScheduledDate) {
          startDate = this.parseFlexibleDate(finalScheduledDate)
        } else {
          // Fallback to current time
          startDate = new Date()
        }

        // Validate the parsed date
        if (isNaN(startDate.getTime())) {
          console.warn(
            `⚠️ Invalid start date for job ${jobId}, using current time`
          )
          startDate = new Date()
        }
      } catch (error) {
        console.warn(`⚠️ Error parsing start date for job ${jobId}:`, error)
        startDate = new Date()
      }

      let endDate: Date

      try {
        if (job.endTime && finalScheduledDate) {
          const timeStr = job.endTime.includes(':')
            ? job.endTime
            : `${job.endTime}:00`
          endDate = new Date(`${finalScheduledDate}T${timeStr}`)
        } else if (job.scheduledEndTime) {
          endDate = this.parseFlexibleDate(job.scheduledEndTime)
        } else if (job.estimatedDuration && !isNaN(job.estimatedDuration)) {
          endDate = new Date(
            startDate.getTime() + job.estimatedDuration * 60 * 1000
          )
        } else {
          endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000) // Default 2 hours
        }

        // Validate the parsed date
        if (isNaN(endDate.getTime())) {
          console.warn(
            `⚠️ Invalid end date for job ${jobId}, using start date + 2 hours`
          )
          endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000)
        }
      } catch (error) {
        console.warn(`⚠️ Error parsing end date for job ${jobId}:`, error)
        endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000)
      }

      // Determine color based on job type
      const normalizedJobType = jobType.toLowerCase()
      const color =
        this.EVENT_COLORS[normalizedJobType] || this.EVENT_COLORS.default

      // Create calendar event
      const eventId = `job_${jobId}_${Date.now()}`
      const calendarEvent: CalendarEventData = {
        id: eventId,
        title: title,
        propertyId: job.propertyId || null,
        staffId: job.assignedStaffId || null,
        status: job.assignedStaffId ? 'assigned' : (job.status as 'pending' | 'assigned' | 'completed' | 'cancelled' | 'in-progress') || 'pending',
        type: jobType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        color,
        sourceId: jobId,
        sourceType: 'job',
        propertyName: safePropertyName,
        assignedStaff: assignedStaff,
        description: `${description} • Priority: ${job.priority || 'Normal'} • Duration: ${job.estimatedDuration || 120} min`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      // Validate and clean data before saving to Firebase
      const cleanCalendarEvent = this.cleanEventData(calendarEvent)

      // Save event to Firebase
      await setDoc(
        doc(db, this.CALENDAR_EVENTS_COLLECTION, eventId),
        cleanCalendarEvent
      )

      console.log(`✅ Created calendar event ${eventId} for job ${jobId}`)
      return { success: true, eventId }
    } catch (error) {
      console.error('❌ Error creating calendar event from job:', error)
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create calendar event',
      }
    }
  }

  /**
   * 3. JOB ASSIGNMENT INTEGRATION
   * Update calendar event when job is assigned to staff
   */
  async updateEventForJobAssignment(
    jobId: string,
    staffId: string,
    staffName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(
        `📅 Updating calendar event for job assignment: ${jobId} → ${staffName}`
      )

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

      eventsSnap.docs.forEach((eventDoc) => {
        const eventRef = doc(db, this.CALENDAR_EVENTS_COLLECTION, eventDoc.id)
        batch.update(eventRef, {
          staffId,
          assignedStaff: staffName,
          status: 'assigned',
          updatedAt: serverTimestamp(),
        })
        updatedCount++
      })

      await batch.commit()

      console.log(
        `✅ Updated ${updatedCount} calendar events for job assignment`
      )
      return { success: true }
    } catch (error) {
      console.error(
        '❌ Error updating calendar event for job assignment:',
        error
      )
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update calendar event',
      }
    }
  }

  /**
   * 4. JOB COMPLETION WORKFLOW
   * Handle calendar event when job is completed
   */
  async handleJobCompletion(
    jobId: string,
    completionAction: 'keep' | 'remove' | 'archive' = 'keep'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(
        `📅 Handling job completion for: ${jobId} (action: ${completionAction})`
      )

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

      eventsSnap.docs.forEach((eventDoc) => {
        const eventRef = doc(db, this.CALENDAR_EVENTS_COLLECTION, eventDoc.id)

        switch (completionAction) {
          case 'keep':
            // Keep event with completed status and green color
            batch.update(eventRef, {
              status: 'completed',
              color: this.EVENT_COLORS.cleaning, // Green for completed
              updatedAt: serverTimestamp(),
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
              updatedAt: serverTimestamp(),
            })
            break
        }
        processedCount++
      })

      await batch.commit()

      // Schedule automatic removal after 24 hours if action is 'remove'
      if (completionAction === 'remove') {
        setTimeout(
          async () => {
            try {
              await this.removeCompletedJobEvents(jobId)
            } catch (error) {
              console.error('❌ Error in delayed event removal:', error)
            }
          },
          24 * 60 * 60 * 1000
        ) // 24 hours
      }

      console.log(
        `✅ Processed ${processedCount} calendar events for job completion`
      )
      return { success: true }
    } catch (error) {
      console.error('❌ Error handling job completion:', error)
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to handle job completion',
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

    eventsSnap.docs.forEach((eventDoc) => {
      batch.delete(doc(db, this.CALENDAR_EVENTS_COLLECTION, eventDoc.id))
    })

    await batch.commit()
    console.log(
      `🗑️ Removed ${eventsSnap.size} completed job events for ${jobId}`
    )
  }

  /**
   * Remove calendar events by job ID (public method for job deletion/completion)
   */
  async removeEventByJobId(jobId: string): Promise<{ success: boolean; removedCount?: number; error?: string }> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized')
      }

      // Find all calendar events for this job
      const eventsQuery = query(
        collection(db, this.CALENDAR_EVENTS_COLLECTION),
        where('sourceId', '==', jobId),
        where('sourceType', '==', 'job')
      )

      const eventsSnap = await getDocs(eventsQuery)

      if (eventsSnap.empty) {
        console.log(`📅 No calendar events found for job ${jobId}`)
        return { success: true, removedCount: 0 }
      }

      // Delete all events for this job
      const batch = writeBatch(db)
      eventsSnap.docs.forEach((eventDoc) => {
        batch.delete(doc(db, this.CALENDAR_EVENTS_COLLECTION, eventDoc.id))
      })

      await batch.commit()

      const removedCount = eventsSnap.size
      console.log(`🗑️ Removed ${removedCount} calendar events for job ${jobId}`)

      return { success: true, removedCount }
    } catch (error) {
      console.error(`❌ Error removing calendar events for job ${jobId}:`, error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Update existing calendar event
   */
  async updateEvent(
    eventId: string,
    updates: Partial<CalendarEventData>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Clean the updates to remove undefined values
      const cleanUpdates = this.cleanEventData(updates)

      const eventRef = doc(db, this.CALENDAR_EVENTS_COLLECTION, eventId)
      await updateDoc(eventRef, {
        ...cleanUpdates,
        updatedAt: serverTimestamp(),
      })

      console.log(`✅ Updated calendar event: ${eventId}`)
      return { success: true }
    } catch (error) {
      console.error('❌ Error updating calendar event:', error)
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to update event',
      }
    }
  }

  /**
   * Delete calendar event
   */
  async deleteEvent(
    eventId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await deleteDoc(doc(db, this.CALENDAR_EVENTS_COLLECTION, eventId))
      console.log(`🗑️ Deleted calendar event: ${eventId}`)
      return { success: true }
    } catch (error) {
      console.error('❌ Error deleting calendar event:', error)
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to delete event',
      }
    }
  }

  /**
   * Clean up orphaned events (events whose source records no longer exist)
   */
  async cleanupOrphanedEvents(): Promise<{
    success: boolean
    removedCount?: number
    error?: string
  }> {
    try {
      console.log('🧹 Starting cleanup of orphaned calendar events...')

      const eventsSnap = await getDocs(
        collection(db, this.CALENDAR_EVENTS_COLLECTION)
      )
      const batch = writeBatch(db)
      let removedCount = 0

      for (const eventDoc of eventsSnap.docs) {
        const event = eventDoc.data() as CalendarEventData

        // Check if source record still exists
        let sourceExists = false
        try {
          const sourceCollection =
            event.sourceType === 'booking'
              ? this.BOOKINGS_COLLECTION
              : this.JOBS_COLLECTION
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

      console.log(
        `✅ Cleanup complete: removed ${removedCount} orphaned events`
      )
      return { success: true, removedCount }
    } catch (error) {
      console.error('❌ Error during cleanup:', error)
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to cleanup orphaned events',
      }
    }
  }

  /**
   * REAL-TIME INTEGRATION METHODS
   */

  /**
   * Set up real-time listener for booking approvals
   */
  setupBookingApprovalListener(
    callback: (bookingId: string) => void
  ): () => void {
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
  setupJobAssignmentListener(
    callback: (jobId: string, staffId: string, staffName: string) => void
  ): () => void {
    const jobsQuery = collection(db, this.JOBS_COLLECTION)

    return onSnapshot(jobsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const job = change.doc.data()
          const previousJob = change.doc.metadata.fromCache
            ? null
            : change.doc.data()

          // Check if staff assignment changed
          if (
            job.assignedStaffId &&
            job.assignedStaffId !== previousJob?.assignedStaffId
          ) {
            callback(
              change.doc.id,
              job.assignedStaffId,
              job.assignedStaffName || 'Unknown Staff'
            )
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
        calendarEventsCreatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error('Error marking booking calendar events created:', error)
    }
  }

  /**
   * Mark job as having calendar event created
   */
  async markJobCalendarEventCreated(
    jobId: string,
    collection: string = 'job_assignments'
  ): Promise<void> {
    try {
      const jobRef = doc(db, collection, jobId)
      await updateDoc(jobRef, {
        calendarEventCreated: true,
        calendarEventCreatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error('Error marking job calendar event created:', error)
    }
  }

  /**
   * Parse flexible date formats including Firebase Timestamps
   */
  private parseFlexibleDate(dateInput: any): Date {
    if (!dateInput) {
      return new Date()
    }

    // Handle Firebase Timestamp
    if (dateInput && typeof dateInput === 'object' && dateInput.toDate) {
      return dateInput.toDate()
    }

    // Handle Firebase Timestamp with seconds/nanoseconds
    if (dateInput && typeof dateInput === 'object' && dateInput.seconds) {
      return new Date(dateInput.seconds * 1000)
    }

    // Handle string dates
    if (typeof dateInput === 'string') {
      // Try ISO format first
      let date = new Date(dateInput)
      if (!isNaN(date.getTime())) {
        return date
      }

      // Try common date formats
      const formats = [
        dateInput,
        `${dateInput}T00:00:00`,
        `${dateInput}T00:00:00.000Z`,
      ]

      for (const format of formats) {
        date = new Date(format)
        if (!isNaN(date.getTime())) {
          return date
        }
      }
    }

    // Handle number (timestamp)
    if (typeof dateInput === 'number') {
      return new Date(dateInput)
    }

    // Fallback
    console.warn('⚠️ Could not parse date:', dateInput)
    return new Date()
  }

  /**
   * Update calendar event status when job status changes
   */
  async updateEventStatus(
    jobId: string,
    status: string,
    updates?: {
      progress?: number
      notes?: string
      completionNotes?: string
      updatedBy?: string
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(
        `📅 Updating calendar event status for job ${jobId}: ${status}`
      )

      // Find calendar event by source ID
      const eventsQuery = query(
        collection(db, this.CALENDAR_EVENTS_COLLECTION),
        where('sourceId', '==', jobId),
        where('sourceType', '==', 'job')
      )

      const eventsSnapshot = await getDocs(eventsQuery)

      if (eventsSnapshot.empty) {
        console.warn(`⚠️ No calendar event found for job ${jobId}`)
        return { success: false, error: 'Calendar event not found' }
      }

      // Update all matching events (there should typically be only one)
      const updatePromises = eventsSnapshot.docs.map(async (eventDoc) => {
        const updateData: Partial<CalendarEventData> = {
          status: status as 'pending' | 'assigned' | 'completed' | 'cancelled' | 'in-progress',
          updatedAt: serverTimestamp(),
        }

        // Update description with progress and notes
        if (updates) {
          const currentEvent = eventDoc.data() as CalendarEventData
          let description = currentEvent.description || ''

          if (updates.progress !== undefined) {
            description += ` • Progress: ${updates.progress}%`
          }

          if (updates.notes) {
            description += ` • Notes: ${updates.notes}`
          }

          if (updates.completionNotes && status === 'completed') {
            description += ` • Completion: ${updates.completionNotes}`
          }

          updateData.description = description
        }

        // Update color based on status
        if (status === 'completed') {
          updateData.color = '#10B981' // Green
        } else if (status === 'in_progress') {
          updateData.color = '#F59E0B' // Amber
        } else if (status === 'cancelled') {
          updateData.color = '#EF4444' // Red
        }

        // Clean the update data to remove undefined values
        const cleanUpdateData = this.cleanEventData(updateData)

        await updateDoc(
          doc(db, this.CALENDAR_EVENTS_COLLECTION, eventDoc.id),
          cleanUpdateData
        )
      })

      await Promise.all(updatePromises)

      console.log(
        `✅ Updated ${eventsSnapshot.docs.length} calendar event(s) for job ${jobId}`
      )
      return { success: true }
    } catch (error) {
      console.error('❌ Error updating calendar event status:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Initialize real-time calendar synchronization
   */
  async initializeRealTimeSync(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ Calendar real-time sync already initialized')
      return
    }

    try {
      console.log('🔄 Initializing calendar real-time synchronization...')

      // Check if AI automation is enabled
      const aiEnabled = await AIAutomationService.isEnabled()

      if (!aiEnabled) {
        console.log(
          '⚠️ AI automation disabled - calendar sync will not monitor automated events'
        )
        return
      }

      // Set up booking listener for automatic calendar creation
      this.setupBookingListener()

      // Set up job listener for job-related calendar events
      this.setupJobListener()

      this.isInitialized = true
      console.log(
        '✅ Calendar real-time synchronization initialized successfully'
      )
    } catch (error) {
      console.error('❌ Error initializing calendar real-time sync:', error)
    }
  }

  /**
   * Set up listener for confirmed bookings
   */
  private setupBookingListener(): void {
    if (this.bookingListener) {
      this.bookingListener()
      this.bookingListener = null
    }

    const bookingsRef = collection(db, this.BOOKINGS_COLLECTION)
    const confirmedBookingsQuery = query(
      bookingsRef,
      where('status', '==', 'confirmed')
    )

    this.bookingListener = onSnapshot(
      confirmedBookingsQuery,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' || change.type === 'modified') {
            const bookingId = change.doc.id
            const bookingData = change.doc.data()

            // Create calendar event for booking within 5 seconds
            this.createBookingCalendarEvent({
              id: bookingId,
              ...bookingData,
            })
          } else if (change.type === 'removed') {
            // Remove calendar events for cancelled bookings
            this.removeBookingCalendarEvents(change.doc.id)
          }
        })
      },
      (error) => {
        console.error('❌ Error in booking listener:', error)
        this.syncMetrics.syncErrors++
      }
    )

    console.log('🔍 Monitoring confirmed bookings for calendar synchronization')
  }

  /**
   * Set up listener for job assignments
   */
  private setupJobListener(): void {
    if (this.jobListener) {
      this.jobListener()
      this.jobListener = null
    }

    const jobsRef = collection(db, this.JOBS_COLLECTION)
    const assignedJobsQuery = query(
      jobsRef,
      where('status', 'in', ['assigned', 'in_progress', 'completed'])
    )

    this.jobListener = onSnapshot(
      assignedJobsQuery,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' || change.type === 'modified') {
            const jobId = change.doc.id
            const jobData = change.doc.data()

            // Create or update calendar event for job
            this.createJobCalendarEvent({
              id: jobId,
              ...jobData,
            })
          } else if (change.type === 'removed') {
            // Remove calendar events for deleted jobs
            this.removeJobCalendarEvents(change.doc.id)
          }
        })
      },
      (error) => {
        console.error('❌ Error in job listener:', error)
        this.syncMetrics.syncErrors++
      }
    )

    console.log('🔍 Monitoring job assignments for calendar synchronization')
  }

  /**
   * Create enhanced calendar event for booking
   */
  private async createBookingCalendarEvent(booking: any): Promise<void> {
    const startTime = Date.now()

    try {
      // Skip if test data
      if (this.isTestData(booking)) {
        return
      }

      const eventConfig = CALENDAR_EVENT_TYPES.BOOKING
      const startDate =
        booking.checkInDate instanceof Timestamp
          ? booking.checkInDate
          : Timestamp.fromDate(new Date(booking.checkInDate))
      const endDate =
        booking.checkOutDate instanceof Timestamp
          ? booking.checkOutDate
          : Timestamp.fromDate(new Date(booking.checkOutDate))

      // Ensure propertyName is never undefined
      const safePropertyName =
        booking.propertyName ||
        booking.property ||
        booking.propertyId ||
        'Unknown Property'

      const calendarEvent: Partial<EnhancedCalendarEvent> = {
        eventType: 'booking',
        propertyId: booking.propertyId,
        propertyName: safePropertyName,
        startDate,
        endDate,
        title: `Booking: ${booking.guestName}`,
        description: `Guest: ${booking.guestName}\nProperty: ${safePropertyName}\nGuests: ${booking.numberOfGuests || 'N/A'}`,
        status: 'confirmed',
        bookingId: booking.id,
        guestName: booking.guestName,
        priority: eventConfig.priority as 'high',
        color: eventConfig.color,
        backgroundColor: eventConfig.backgroundColor,
        textColor: eventConfig.textColor,
        createdAt: serverTimestamp(),
        createdBy: 'CALENDAR_AUTO_SYNC',
        automatedCreation: true,
        conflictResolved: false,
      }

      // Check for conflicts before creating
      const hasConflict = await this.checkPropertyAvailabilityConflict(
        booking.propertyId,
        startDate.toDate(),
        endDate.toDate(),
        booking.id
      )

      if (hasConflict) {
        console.warn(
          `⚠️ Property availability conflict detected for booking ${booking.id}`
        )
        calendarEvent.conflictResolved = false
        calendarEvent.description += '\n⚠️ CONFLICT DETECTED'
      }

      // Validate and clean data before saving to Firebase
      const cleanCalendarEvent = this.cleanEventData(calendarEvent)

      const eventRef = doc(collection(db, this.CALENDAR_EVENTS_COLLECTION))
      await setDoc(eventRef, cleanCalendarEvent)

      this.syncMetrics.eventsCreated++
      this.updateAverageSyncTime(Date.now() - startTime)

      console.log(`📅 Created booking calendar event for ${booking.guestName}`)
      toast.success(`📅 Calendar updated for ${booking.guestName}`)
    } catch (error) {
      console.error('❌ Error creating booking calendar event:', error)
      this.syncMetrics.syncErrors++
    }
  }

  /**
   * Create enhanced calendar event for job
   */
  private async createJobCalendarEvent(job: any): Promise<void> {
    const startTime = Date.now()

    try {
      // Skip if test data
      if (this.isTestData(job)) {
        return
      }

      // Determine event type based on job type
      let eventConfig = CALENDAR_EVENT_TYPES.MAINTENANCE // Default
      let eventType: EnhancedCalendarEvent['eventType'] = 'maintenance'

      if (job.type?.includes('cleaning')) {
        eventConfig = CALENDAR_EVENT_TYPES.CLEANING
        eventType = 'cleaning'
      } else if (job.type?.includes('check_in_prep')) {
        eventConfig = CALENDAR_EVENT_TYPES.CHECK_IN_PREP
        eventType = 'check_in_prep'
      } else if (job.type?.includes('inspection')) {
        eventConfig = CALENDAR_EVENT_TYPES.INSPECTION
        eventType = 'inspection'
      }

      const startDate =
        job.scheduledDate instanceof Timestamp
          ? job.scheduledDate
          : Timestamp.fromDate(new Date(job.scheduledDate))

      // Calculate end date based on estimated duration
      const endTime = new Date(
        startDate.toDate().getTime() + (job.estimatedDuration || 60) * 60 * 1000
      )
      const endDate = Timestamp.fromDate(endTime)

      // Ensure propertyName is never undefined
      const safePropertyName =
        job.propertyName || job.property || job.propertyId || 'Unknown Property'

      const calendarEvent: Partial<EnhancedCalendarEvent> = {
        eventType,
        propertyId: job.propertyId,
        propertyName: safePropertyName,
        staffId: job.assignedStaff,
        staffName: job.assignedStaffName,
        startDate,
        endDate,
        title: job.title || job.type,
        description: `${job.description || ''}\nStaff: ${job.assignedStaffName || 'Unassigned'}\nDuration: ${job.estimatedDuration || 60} minutes`,
        status: job.status,
        jobId: job.id,
        priority: job.priority || (eventConfig.priority as 'medium'),
        estimatedDuration: job.estimatedDuration,
        requiredSkills: job.requiredSkills,
        color: eventConfig.color,
        backgroundColor: eventConfig.backgroundColor,
        textColor: eventConfig.textColor,
        createdAt: serverTimestamp(),
        createdBy: 'CALENDAR_AUTO_SYNC',
        automatedCreation: true,
        conflictResolved: false,
      }

      // Check for existing calendar event for this job
      const existingEventQuery = query(
        collection(db, this.CALENDAR_EVENTS_COLLECTION),
        where('jobId', '==', job.id)
      )

      const existingEvents = await getDocs(existingEventQuery)

      if (existingEvents.empty) {
        // Create new event
        const cleanCalendarEvent = this.cleanEventData(calendarEvent)
        const eventRef = doc(collection(db, this.CALENDAR_EVENTS_COLLECTION))
        await setDoc(eventRef, cleanCalendarEvent)
        this.syncMetrics.eventsCreated++
        console.log(`📅 Created job calendar event: ${job.title}`)
      } else {
        // Update existing event
        const cleanCalendarEvent = this.cleanEventData(calendarEvent)
        const existingEvent = existingEvents.docs[0]
        await updateDoc(existingEvent.ref, {
          ...cleanCalendarEvent,
          lastModified: serverTimestamp(),
          modifiedBy: 'CALENDAR_AUTO_SYNC',
        })
        this.syncMetrics.eventsUpdated++
        console.log(`📅 Updated job calendar event: ${job.title}`)
      }

      this.updateAverageSyncTime(Date.now() - startTime)
      toast.success(`📅 Calendar updated for ${job.title}`)
    } catch (error) {
      console.error('❌ Error creating job calendar event:', error)
      this.syncMetrics.syncErrors++
    }
  }

  /**
   * Check for property availability conflicts
   */
  private async checkPropertyAvailabilityConflict(
    propertyId: string,
    startDate: Date,
    endDate: Date,
    excludeBookingId?: string
  ): Promise<boolean> {
    try {
      const eventsQuery = query(
        collection(db, this.CALENDAR_EVENTS_COLLECTION),
        where('propertyId', '==', propertyId),
        where('eventType', '==', 'booking'),
        where('status', '==', 'confirmed')
      )

      const events = await getDocs(eventsQuery)

      for (const eventDoc of events.docs) {
        const event = eventDoc.data()

        // Skip the current booking
        if (event.bookingId === excludeBookingId) {
          continue
        }

        const eventStart = event.startDate.toDate()
        const eventEnd = event.endDate.toDate()

        // Check for overlap
        if (startDate < eventEnd && endDate > eventStart) {
          return true // Conflict found
        }
      }

      return false // No conflict
    } catch (error) {
      console.error('❌ Error checking property availability conflict:', error)
      return false
    }
  }

  /**
   * Update average sync time metric
   */
  private updateAverageSyncTime(syncTime: number): void {
    const totalEvents =
      this.syncMetrics.eventsCreated + this.syncMetrics.eventsUpdated
    this.syncMetrics.averageSyncTime =
      (this.syncMetrics.averageSyncTime * (totalEvents - 1) + syncTime) /
      totalEvents
  }

  /**
   * Get calendar synchronization metrics
   */
  getSyncMetrics() {
    return { ...this.syncMetrics }
  }

  /**
   * Reset synchronization metrics
   */
  resetSyncMetrics(): void {
    this.syncMetrics = {
      eventsCreated: 0,
      eventsUpdated: 0,
      eventsDeleted: 0,
      syncErrors: 0,
      averageSyncTime: 0,
    }
    console.log('📊 Calendar sync metrics reset')
  }

  /**
   * Check for conflicts with existing calendar events
   */
  async checkForConflicts(
    propertyName: string,
    checkInDate: Date,
    checkOutDate: Date
  ): Promise<any[]> {
    try {
      console.log(`🔍 Checking for calendar conflicts for ${propertyName}`)

      if (!db) {
        console.error('❌ Firebase not initialized')
        return []
      }

      // Query for events that might overlap with the booking period
      const eventsQuery = query(
        collection(db, this.CALENDAR_EVENTS_COLLECTION),
        where('propertyName', '==', propertyName)
      )

      const eventsSnapshot = await getDocs(eventsQuery)
      const conflicts: any[] = []

      eventsSnapshot.forEach((doc) => {
        const event = doc.data()
        const eventStart = new Date(event.startDate)
        const eventEnd = new Date(event.endDate)

        // Check for date overlap
        if (
          (checkInDate >= eventStart && checkInDate < eventEnd) ||
          (checkOutDate > eventStart && checkOutDate <= eventEnd) ||
          (checkInDate <= eventStart && checkOutDate >= eventEnd)
        ) {
          conflicts.push({
            type: 'calendar_event_overlap',
            conflictingEventId: doc.id,
            conflictingEventTitle: event.title,
            conflictingEventType: event.type,
            conflictingDates: {
              start: event.startDate,
              end: event.endDate
            },
            severity: this.getConflictSeverity(event.type)
          })
        }
      })

      console.log(`🔍 Found ${conflicts.length} calendar conflicts`)
      return conflicts

    } catch (error) {
      console.error('❌ Error checking for calendar conflicts:', error)
      return []
    }
  }

  /**
   * Determine conflict severity based on event type
   */
  private getConflictSeverity(eventType: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (eventType) {
      case 'reservation':
      case 'booking':
        return 'critical'
      case 'maintenance':
      case 'cleaning':
        return 'high'
      case 'inspection':
        return 'medium'
      case 'meeting':
      case 'other':
        return 'low'
      default:
        return 'medium'
    }
  }

  /**
   * Clean up listeners
   */
  cleanup(): void {
    if (this.bookingListener) {
      this.bookingListener()
      this.bookingListener = null
    }

    if (this.jobListener) {
      this.jobListener()
      this.jobListener = null
    }

    if (this.calendarListener) {
      this.calendarListener()
      this.calendarListener = null
    }

    this.isInitialized = false
    console.log('🧹 Calendar Event Service cleaned up')
  }
}

// Export singleton instance
const calendarEventService = new CalendarEventService()
export default calendarEventService
