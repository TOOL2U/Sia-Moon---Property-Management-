import { db } from '@/lib/firebase'
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  serverTimestamp,
  Timestamp,
  setDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore'

/**
 * 🔄 Real-Time Calendar Service
 * 
 * Manages real-time calendar synchronization, conflict detection,
 * and live updates across all connected clients
 */

export interface CalendarEvent {
  id: string
  title: string
  type: 'booking' | 'job' | 'maintenance' | 'blocked'
  subType?: string
  startDate: string
  endDate: string
  propertyName: string
  propertyId?: string
  assignedStaff?: string
  staffId?: string
  status: string
  color: string
  description?: string
  bookingId?: string
  jobId?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface CalendarUpdate {
  type: 'created' | 'updated' | 'deleted'
  event: CalendarEvent
  timestamp: number
  userId?: string
  source: 'booking' | 'job' | 'manual' | 'system'
}

export interface ConflictAlert {
  id: string
  type: 'booking_overlap' | 'staff_double_booking' | 'maintenance_conflict'
  severity: 'low' | 'medium' | 'high' | 'critical'
  conflictingEvents: CalendarEvent[]
  affectedProperty: string
  suggestedResolution?: string
  timestamp: number
  resolved: boolean
}

class RealTimeCalendarService {
  private listeners: Map<string, () => void> = new Map()
  private eventCallbacks: Map<string, (update: CalendarUpdate) => void> = new Map()
  private conflictCallbacks: Map<string, (conflict: ConflictAlert) => void> = new Map()
  private activeEvents: Map<string, CalendarEvent> = new Map()
  private jobSyncActive = false

  /**
   * 🔄 NEW: Subscribe to job updates and sync to calendar
   * This creates/updates calendar events automatically when jobs change status
   */
  subscribeToJobUpdates(): string {
    if (this.jobSyncActive) {
      console.log('⚠️ Job sync already active')
      return 'job_sync_active'
    }

    const subscriptionId = `job_sync_${Date.now()}`

    if (!db) {
      console.error('❌ Firebase not initialized')
      return subscriptionId
    }

    const jobsQuery = query(
      collection(db, 'operational_jobs'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(jobsQuery, async (snapshot) => {
      console.log(`🔄 Job sync: Processing ${snapshot.docChanges().length} changes`)

      for (const change of snapshot.docChanges()) {
        const jobData = { id: change.doc.id, ...change.doc.data() } as any

        try {
          if (change.type === 'added') {
            await this.createCalendarEventFromJob(jobData)
          } else if (change.type === 'modified') {
            await this.updateCalendarEventFromJob(jobData)
          } else if (change.type === 'removed') {
            await this.deleteCalendarEventForJob(jobData.id)
          }
        } catch (error) {
          console.error(`❌ Error syncing job ${jobData.id} to calendar:`, error)
        }
      }
    }, (error) => {
      console.error('❌ Job sync subscription error:', error)
    })

    this.listeners.set(subscriptionId, unsubscribe)
    this.jobSyncActive = true

    console.log('✅ Job sync to calendar activated')
    return subscriptionId
  }

  /**
   * Create calendar event from job
   */
  private async createCalendarEventFromJob(job: any) {
    if (!db) return

    const calendarEventId = `job-${job.id}`

    // Check if calendar event already exists
    const existingEvent = await getDoc(doc(db, 'calendar_events', calendarEventId))
    if (existingEvent.exists()) {
      console.log(`⏭️ Calendar event already exists for job ${job.id}`)
      return
    }

    const startDate = job.scheduledStart?.toDate ? job.scheduledStart.toDate() : new Date(job.scheduledStart || Date.now())
    const durationMinutes = job.duration || 120 // Default 2 hours
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000)

    const calendarEvent = {
      title: job.title || job.jobType || 'Cleaning Job',
      type: 'job',
      start: Timestamp.fromDate(startDate),
      end: Timestamp.fromDate(endDate),
      propertyName: job.propertyName || 'Unknown Property',
      propertyId: job.propertyId || '',
      assignedStaff: job.assignedStaffName || '',
      staffId: job.assignedStaffId || '',
      status: job.status || 'pending',
      color: this.getJobStatusColor(job.status || 'pending'),
      description: job.description || job.specialInstructions || '',
      jobId: job.id,
      priority: job.priority || 'medium',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }

    await setDoc(doc(db, 'calendar_events', calendarEventId), calendarEvent)
    console.log(`✅ Calendar event created for job ${job.id} (${job.status}) - Color: ${calendarEvent.color}`)
  }

  /**
   * Update calendar event when job status changes
   */
  private async updateCalendarEventFromJob(job: any) {
    if (!db) return

    const calendarEventId = `job-${job.id}`
    const eventRef = doc(db, 'calendar_events', calendarEventId)
    
    const existingEvent = await getDoc(eventRef)
    if (!existingEvent.exists()) {
      console.log(`📝 Creating calendar event for existing job ${job.id}`)
      await this.createCalendarEventFromJob(job)
      return
    }

    const newColor = this.getJobStatusColor(job.status || 'pending')
    const updates: any = {
      status: job.status || 'pending',
      color: newColor,
      updatedAt: serverTimestamp()
    }

    // Update other fields if changed
    if (job.assignedStaffName) updates.assignedStaff = job.assignedStaffName
    if (job.assignedStaffId) updates.staffId = job.assignedStaffId
    if (job.title) updates.title = job.title

    await updateDoc(eventRef, updates)
    console.log(`🔄 Calendar event updated for job ${job.id}: ${job.status} → ${newColor}`)
  }

  /**
   * Delete calendar event when job is deleted
   */
  private async deleteCalendarEventForJob(jobId: string) {
    if (!db) return

    const calendarEventId = `job-${jobId}`
    const eventRef = doc(db, 'calendar_events', calendarEventId)
    
    const existingEvent = await getDoc(eventRef)
    if (existingEvent.exists()) {
      await deleteDoc(eventRef)
      console.log(`🗑️ Calendar event deleted for job ${jobId}`)
    }
  }

  /**
   * Get color based on job status
   */
  private getJobStatusColor(status: string): string {
    const colors: Record<string, string> = {
      pending: '#FFA500',      // 🟠 Orange - Job pending assignment/acceptance
      accepted: '#4169E1',     // 🔵 Royal Blue - Staff accepted, not started
      in_progress: '#9370DB',  // 🟣 Purple - Staff actively working
      completed: '#228B22',    // 🟢 Forest Green - Job finished
      cancelled: '#808080',    // ⚫ Gray - Job cancelled
      failed: '#DC143C'        // 🔴 Crimson - Job failed
    }

    return colors[status] || colors.pending
  }

  /**
   * Subscribe to real-time calendar updates
   */
  subscribeToCalendarUpdates(
    callback: (update: CalendarUpdate) => void,
    filters?: {
      propertyName?: string
      dateRange?: { start: string; end: string }
      eventTypes?: string[]
    }
  ): string {
    const subscriptionId = `calendar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Build query based on filters
    let calendarQuery = query(
      collection(db, 'calendar_events'),
      orderBy('start', 'asc')
    )

    if (filters?.propertyName) {
      calendarQuery = query(calendarQuery, where('propertyName', '==', filters.propertyName))
    }

    // Set up real-time listener
    const unsubscribe = onSnapshot(calendarQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const eventData = { id: change.doc.id, ...change.doc.data() } as CalendarEvent
        
        // Apply additional filters
        if (filters?.eventTypes && !filters.eventTypes.includes(eventData.type)) {
          return
        }

        if (filters?.dateRange) {
          const eventStart = new Date(eventData.startDate)
          const filterStart = new Date(filters.dateRange.start)
          const filterEnd = new Date(filters.dateRange.end)
          
          if (eventStart < filterStart || eventStart > filterEnd) {
            return
          }
        }

        const update: CalendarUpdate = {
          type: change.type as 'added' | 'modified' | 'removed',
          event: eventData,
          timestamp: Date.now(),
          source: this.determineEventSource(eventData)
        }

        // Update local cache
        if (change.type === 'added' || change.type === 'modified') {
          this.activeEvents.set(eventData.id, eventData)
        } else if (change.type === 'removed') {
          this.activeEvents.delete(eventData.id)
        }

        // Check for conflicts on new/updated events
        if (change.type === 'added' || change.type === 'modified') {
          this.checkForConflicts(eventData)
        }

        callback(update)
      })
    }, (error) => {
      console.error('❌ Real-time calendar subscription error:', error)
    })

    this.listeners.set(subscriptionId, unsubscribe)
    this.eventCallbacks.set(subscriptionId, callback)

    console.log('✅ Real-time calendar subscription created:', subscriptionId)
    return subscriptionId
  }

  /**
   * Subscribe to conflict alerts
   */
  subscribeToConflictAlerts(callback: (conflict: ConflictAlert) => void): string {
    const subscriptionId = `conflicts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const conflictQuery = query(
      collection(db, 'calendar_conflicts'),
      where('resolved', '==', false),
      orderBy('timestamp', 'desc')
    )

    const unsubscribe = onSnapshot(conflictQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const conflictData = { id: change.doc.id, ...change.doc.data() } as ConflictAlert
          callback(conflictData)
        }
      })
    })

    this.listeners.set(subscriptionId, unsubscribe)
    this.conflictCallbacks.set(subscriptionId, callback)

    return subscriptionId
  }

  /**
   * Check for conflicts when events are added/updated
   */
  private async checkForConflicts(newEvent: CalendarEvent) {
    const conflicts: CalendarEvent[] = []
    const newStart = new Date(newEvent.startDate)
    const newEnd = new Date(newEvent.endDate)

    // Check against all active events
    this.activeEvents.forEach((existingEvent) => {
      // Skip self-comparison
      if (existingEvent.id === newEvent.id) return

      const existingStart = new Date(existingEvent.startDate)
      const existingEnd = new Date(existingEvent.endDate)

      // Check for date overlap
      const hasDateOverlap = (
        (newStart >= existingStart && newStart < existingEnd) ||
        (newEnd > existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd)
      )

      if (hasDateOverlap) {
        // Check conflict type
        if (newEvent.propertyName === existingEvent.propertyName) {
          // Same property conflict
          if (newEvent.type === 'booking' && existingEvent.type === 'booking') {
            conflicts.push(existingEvent)
          } else if (newEvent.type === 'maintenance' || existingEvent.type === 'maintenance') {
            conflicts.push(existingEvent)
          }
        }

        // Staff double-booking
        if (newEvent.staffId && existingEvent.staffId === newEvent.staffId) {
          conflicts.push(existingEvent)
        }
      }
    })

    // Create conflict alert if conflicts found
    if (conflicts.length > 0) {
      await this.createConflictAlert(newEvent, conflicts)
    }
  }

  /**
   * Create conflict alert in database
   */
  private async createConflictAlert(newEvent: CalendarEvent, conflictingEvents: CalendarEvent[]) {
    try {
      const conflictType = this.determineConflictType(newEvent, conflictingEvents)
      const severity = this.calculateConflictSeverity(newEvent, conflictingEvents)

      const conflictAlert: Omit<ConflictAlert, 'id'> = {
        type: conflictType,
        severity,
        conflictingEvents: [newEvent, ...conflictingEvents],
        affectedProperty: newEvent.propertyName,
        suggestedResolution: this.generateResolutionSuggestion(conflictType, newEvent, conflictingEvents),
        timestamp: Date.now(),
        resolved: false
      }

      await addDoc(collection(db, 'calendar_conflicts'), {
        ...conflictAlert,
        createdAt: serverTimestamp()
      })

      console.log('⚠️ Conflict alert created:', conflictType, severity)

    } catch (error) {
      console.error('❌ Error creating conflict alert:', error)
    }
  }

  /**
   * Determine event source based on event data
   */
  private determineEventSource(event: CalendarEvent): 'booking' | 'job' | 'manual' | 'system' {
    if (event.bookingId) return 'booking'
    if (event.jobId) return 'job'
    if (event.type === 'maintenance') return 'system'
    return 'manual'
  }

  /**
   * Determine conflict type
   */
  private determineConflictType(newEvent: CalendarEvent, conflicts: CalendarEvent[]): ConflictAlert['type'] {
    const hasBookingConflict = conflicts.some(e => e.type === 'booking')
    const hasStaffConflict = conflicts.some(e => e.staffId === newEvent.staffId)
    const hasMaintenanceConflict = conflicts.some(e => e.type === 'maintenance')

    if (hasStaffConflict) return 'staff_double_booking'
    if (hasMaintenanceConflict) return 'maintenance_conflict'
    if (hasBookingConflict) return 'booking_overlap'
    
    return 'booking_overlap' // default
  }

  /**
   * Calculate conflict severity
   */
  private calculateConflictSeverity(newEvent: CalendarEvent, conflicts: CalendarEvent[]): ConflictAlert['severity'] {
    const hasBookingConflict = conflicts.some(e => e.type === 'booking')
    const hasUrgentJob = conflicts.some(e => e.priority === 'urgent')
    const conflictCount = conflicts.length

    if (hasBookingConflict || hasUrgentJob) return 'critical'
    if (conflictCount > 2) return 'high'
    if (conflictCount > 1) return 'medium'
    return 'low'
  }

  /**
   * Generate resolution suggestion
   */
  private generateResolutionSuggestion(
    type: ConflictAlert['type'], 
    newEvent: CalendarEvent, 
    conflicts: CalendarEvent[]
  ): string {
    switch (type) {
      case 'booking_overlap':
        return 'Contact guests to reschedule or find alternative accommodation'
      case 'staff_double_booking':
        return 'Reassign one of the conflicting jobs to another staff member'
      case 'maintenance_conflict':
        return 'Reschedule maintenance to avoid guest disruption'
      default:
        return 'Manual review required to resolve conflict'
    }
  }

  /**
   * Unsubscribe from updates
   */
  unsubscribe(subscriptionId: string) {
    const unsubscribe = this.listeners.get(subscriptionId)
    if (unsubscribe) {
      unsubscribe()
      this.listeners.delete(subscriptionId)
      this.eventCallbacks.delete(subscriptionId)
      this.conflictCallbacks.delete(subscriptionId)
      console.log('✅ Unsubscribed from real-time updates:', subscriptionId)
    }
  }

  /**
   * Get current active events
   */
  getActiveEvents(): CalendarEvent[] {
    return Array.from(this.activeEvents.values())
  }

  /**
   * Cleanup all subscriptions
   */
  cleanup() {
    this.listeners.forEach((unsubscribe) => unsubscribe())
    this.listeners.clear()
    this.eventCallbacks.clear()
    this.conflictCallbacks.clear()
    this.activeEvents.clear()
    console.log('✅ Real-time calendar service cleaned up')
  }
}

// Export singleton instance
export const realTimeCalendarService = new RealTimeCalendarService()
export default realTimeCalendarService
