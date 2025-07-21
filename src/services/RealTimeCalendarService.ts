import { db } from '@/lib/firebase'
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  serverTimestamp,
  Timestamp
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
      collection(db, 'calendarEvents'),
      orderBy('startDate', 'asc')
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
