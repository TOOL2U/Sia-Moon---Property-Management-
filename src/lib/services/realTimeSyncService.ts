/**
 * Real-time Sync Service
 * 
 * Manages real-time synchronization between web and mobile platforms
 * using Firebase Firestore listeners and cross-platform event handling.
 */

import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  Unsubscribe,
  DocumentChange,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore'
import { getDb } from '@/lib/firebase'
import {
  SyncBooking,
  TaskAssignment,
  SyncEvent,
  BookingStatus,
  TaskStatus,
  BookingSyncFilters,
  TaskAssignmentFilters
} from '@/types/booking-sync'

export interface SyncEventHandler {
  onBookingUpdated?: (booking: SyncBooking, changeType: 'added' | 'modified' | 'removed') => void
  onTaskUpdated?: (task: TaskAssignment, changeType: 'added' | 'modified' | 'removed') => void
  onSyncEvent?: (event: SyncEvent, changeType: 'added' | 'modified' | 'removed') => void
  onError?: (error: Error, context: string) => void
}

export class RealTimeSyncService {
  private static db = getDb()
  private static activeSubscriptions: Map<string, Unsubscribe> = new Map()

  /**
   * Subscribe to real-time booking updates
   */
  static subscribeToBookings(
    handler: SyncEventHandler,
    filters?: BookingSyncFilters,
    subscriptionId: string = 'default-bookings'
  ): string {
    try {
      // Unsubscribe existing subscription with same ID
      this.unsubscribe(subscriptionId)

      let q = collection(this.db, 'bookings')

      // Apply filters
      if (filters?.status && filters.status.length > 0) {
        q = query(q, where('status', 'in', filters.status))
      }

      if (filters?.propertyIds && filters.propertyIds.length > 0) {
        q = query(q, where('propertyId', 'in', filters.propertyIds))
      }

      if (filters?.assignedStaff && filters.assignedStaff.length > 0) {
        q = query(q, where('assignedStaff', 'array-contains-any', filters.assignedStaff))
      }

      if (filters?.source && filters.source.length > 0) {
        q = query(q, where('source', 'in', filters.source))
      }

      if (filters?.syncStatus) {
        if (filters.syncStatus === 'synced') {
          q = query(q, where('lastSyncedAt', '!=', null))
        } else if (filters.syncStatus === 'pending') {
          q = query(q, where('lastSyncedAt', '==', null))
        }
      }

      q = query(q, orderBy('createdAt', 'desc'))

      const unsubscribe = onSnapshot(
        q,
        (snapshot: QuerySnapshot<DocumentData>) => {
          snapshot.docChanges().forEach((change: DocumentChange<DocumentData>) => {
            const booking: SyncBooking = {
              id: change.doc.id,
              ...change.doc.data()
            } as SyncBooking

            if (handler.onBookingUpdated) {
              handler.onBookingUpdated(booking, change.type)
            }
          })
        },
        (error) => {
          console.error('Error in booking subscription:', error)
          if (handler.onError) {
            handler.onError(error as Error, 'booking-subscription')
          }
        }
      )

      this.activeSubscriptions.set(subscriptionId, unsubscribe)
      console.log(`✅ Booking subscription active: ${subscriptionId}`)
      return subscriptionId

    } catch (error) {
      console.error('Error setting up booking subscription:', error)
      if (handler.onError) {
        handler.onError(error as Error, 'booking-subscription-setup')
      }
      return ''
    }
  }

  /**
   * Subscribe to real-time task assignment updates
   */
  static subscribeToTasks(
    handler: SyncEventHandler,
    filters?: TaskAssignmentFilters,
    subscriptionId: string = 'default-tasks'
  ): string {
    try {
      // Unsubscribe existing subscription with same ID
      this.unsubscribe(subscriptionId)

      let q = collection(this.db, 'task_assignments')

      // Apply filters
      if (filters?.status && filters.status.length > 0) {
        q = query(q, where('status', 'in', filters.status))
      }

      if (filters?.staffIds && filters.staffIds.length > 0) {
        q = query(q, where('staffId', 'in', filters.staffIds))
      }

      if (filters?.taskTypes && filters.taskTypes.length > 0) {
        q = query(q, where('taskType', 'in', filters.taskTypes))
      }

      if (filters?.priority && filters.priority.length > 0) {
        q = query(q, where('priority', 'in', filters.priority))
      }

      if (filters?.propertyIds && filters.propertyIds.length > 0) {
        q = query(q, where('propertyId', 'in', filters.propertyIds))
      }

      q = query(q, orderBy('createdAt', 'desc'))

      const unsubscribe = onSnapshot(
        q,
        (snapshot: QuerySnapshot<DocumentData>) => {
          snapshot.docChanges().forEach((change: DocumentChange<DocumentData>) => {
            const task: TaskAssignment = {
              id: change.doc.id,
              ...change.doc.data()
            } as TaskAssignment

            if (handler.onTaskUpdated) {
              handler.onTaskUpdated(task, change.type)
            }
          })
        },
        (error) => {
          console.error('Error in task subscription:', error)
          if (handler.onError) {
            handler.onError(error as Error, 'task-subscription')
          }
        }
      )

      this.activeSubscriptions.set(subscriptionId, unsubscribe)
      console.log(`✅ Task subscription active: ${subscriptionId}`)
      return subscriptionId

    } catch (error) {
      console.error('Error setting up task subscription:', error)
      if (handler.onError) {
        handler.onError(error as Error, 'task-subscription-setup')
      }
      return ''
    }
  }

  /**
   * Subscribe to sync events for monitoring cross-platform activity
   */
  static subscribeToSyncEvents(
    handler: SyncEventHandler,
    eventTypes?: SyncEvent['type'][],
    subscriptionId: string = 'default-sync-events'
  ): string {
    try {
      // Unsubscribe existing subscription with same ID
      this.unsubscribe(subscriptionId)

      let q = collection(this.db, 'sync_events')

      // Optimize query to avoid compound index requirements
      if (eventTypes && eventTypes.length > 0) {
        // Use simple query with client-side filtering for better performance
        q = query(q, orderBy('timestamp', 'desc'), limit(50))
      } else {
        q = query(q, orderBy('timestamp', 'desc'), limit(50))
      }

      const unsubscribe = onSnapshot(
        q,
        (snapshot: QuerySnapshot<DocumentData>) => {
          snapshot.docChanges().forEach((change: DocumentChange<DocumentData>) => {
            const syncEvent: SyncEvent = {
              id: change.doc.id,
              ...change.doc.data()
            } as SyncEvent

            // Apply client-side filtering for event types if specified
            const shouldInclude = !eventTypes || eventTypes.length === 0 || eventTypes.includes(syncEvent.type)

            if (shouldInclude && handler.onSyncEvent) {
              handler.onSyncEvent(syncEvent, change.type)
            }
          })
        },
        (error) => {
          console.error('Error in sync event subscription:', error)
          if (handler.onError) {
            handler.onError(error as Error, 'sync-event-subscription')
          }
        }
      )

      this.activeSubscriptions.set(subscriptionId, unsubscribe)
      console.log(`✅ Sync event subscription active: ${subscriptionId}`)
      return subscriptionId

    } catch (error) {
      console.error('Error setting up sync event subscription:', error)
      if (handler.onError) {
        handler.onError(error as Error, 'sync-event-subscription-setup')
      }
      return ''
    }
  }

  /**
   * Subscribe to pending bookings that need approval
   */
  static subscribeToPendingApprovals(
    handler: SyncEventHandler,
    subscriptionId: string = 'pending-approvals'
  ): string {
    return this.subscribeToBookings(
      handler,
      { status: ['pending_approval'] },
      subscriptionId
    )
  }

  /**
   * Subscribe to active tasks for a specific staff member
   */
  static subscribeToStaffTasks(
    staffId: string,
    handler: SyncEventHandler,
    subscriptionId?: string
  ): string {
    const id = subscriptionId || `staff-tasks-${staffId}`
    return this.subscribeToTasks(
      handler,
      { 
        staffIds: [staffId],
        status: ['assigned', 'in_progress']
      },
      id
    )
  }

  /**
   * Subscribe to tasks for a specific booking
   */
  static subscribeToBookingTasks(
    bookingId: string,
    handler: SyncEventHandler,
    subscriptionId?: string
  ): string {
    try {
      const id = subscriptionId || `booking-tasks-${bookingId}`
      
      // Unsubscribe existing subscription with same ID
      this.unsubscribe(id)

      const q = query(
        collection(this.db, 'task_assignments'),
        where('bookingId', '==', bookingId),
        orderBy('createdAt', 'desc')
      )

      const unsubscribe = onSnapshot(
        q,
        (snapshot: QuerySnapshot<DocumentData>) => {
          snapshot.docChanges().forEach((change: DocumentChange<DocumentData>) => {
            const task: TaskAssignment = {
              id: change.doc.id,
              ...change.doc.data()
            } as TaskAssignment

            if (handler.onTaskUpdated) {
              handler.onTaskUpdated(task, change.type)
            }
          })
        },
        (error) => {
          console.error('Error in booking tasks subscription:', error)
          if (handler.onError) {
            handler.onError(error as Error, 'booking-tasks-subscription')
          }
        }
      )

      this.activeSubscriptions.set(id, unsubscribe)
      console.log(`✅ Booking tasks subscription active: ${id}`)
      return id

    } catch (error) {
      console.error('Error setting up booking tasks subscription:', error)
      if (handler.onError) {
        handler.onError(error as Error, 'booking-tasks-subscription-setup')
      }
      return ''
    }
  }

  /**
   * Subscribe to high-priority sync events
   */
  static subscribeToUrgentUpdates(
    handler: SyncEventHandler,
    subscriptionId: string = 'urgent-updates'
  ): string {
    // Use optimized subscription with client-side filtering
    return this.subscribeToSyncEvents(
      {
        ...handler,
        onSyncEvent: (event, changeType) => {
          // Filter for urgent event types
          const urgentTypes = ['booking_approved', 'booking_rejected', 'staff_assigned', 'staff_created_enhanced']
          if (urgentTypes.includes(event.type) && handler.onSyncEvent) {
            handler.onSyncEvent(event, changeType)
          }
        }
      },
      undefined, // Don't use server-side filtering to avoid index requirements
      subscriptionId
    )
  }

  /**
   * Unsubscribe from a specific subscription
   */
  static unsubscribe(subscriptionId: string): boolean {
    const unsubscribe = this.activeSubscriptions.get(subscriptionId)
    if (unsubscribe) {
      unsubscribe()
      this.activeSubscriptions.delete(subscriptionId)
      console.log(`✅ Unsubscribed from: ${subscriptionId}`)
      return true
    }
    return false
  }

  /**
   * Unsubscribe from all active subscriptions
   */
  static unsubscribeAll(): void {
    this.activeSubscriptions.forEach((unsubscribe, subscriptionId) => {
      unsubscribe()
      console.log(`✅ Unsubscribed from: ${subscriptionId}`)
    })
    this.activeSubscriptions.clear()
    console.log('✅ All subscriptions cleared')
  }

  /**
   * Get list of active subscription IDs
   */
  static getActiveSubscriptions(): string[] {
    return Array.from(this.activeSubscriptions.keys())
  }

  /**
   * Check if a subscription is active
   */
  static isSubscriptionActive(subscriptionId: string): boolean {
    return this.activeSubscriptions.has(subscriptionId)
  }

  /**
   * Create a combined handler for multiple subscription types
   */
  static createCombinedHandler(handlers: {
    onBookingChange?: (booking: SyncBooking, changeType: 'added' | 'modified' | 'removed') => void
    onTaskChange?: (task: TaskAssignment, changeType: 'added' | 'modified' | 'removed') => void
    onSyncEventReceived?: (event: SyncEvent, changeType: 'added' | 'modified' | 'removed') => void
    onErrorOccurred?: (error: Error, context: string) => void
  }): SyncEventHandler {
    return {
      onBookingUpdated: handlers.onBookingChange,
      onTaskUpdated: handlers.onTaskChange,
      onSyncEvent: handlers.onSyncEventReceived,
      onError: handlers.onErrorOccurred
    }
  }

  /**
   * Setup comprehensive real-time sync for admin dashboard
   */
  static setupAdminDashboardSync(
    handlers: {
      onPendingBookingUpdate?: (booking: SyncBooking, changeType: 'added' | 'modified' | 'removed') => void
      onTaskUpdate?: (task: TaskAssignment, changeType: 'added' | 'modified' | 'removed') => void
      onUrgentEvent?: (event: SyncEvent, changeType: 'added' | 'modified' | 'removed') => void
      onError?: (error: Error, context: string) => void
    }
  ): string[] {
    const subscriptionIds: string[] = []

    // Subscribe to pending bookings
    if (handlers.onPendingBookingUpdate) {
      const pendingId = this.subscribeToPendingApprovals({
        onBookingUpdated: handlers.onPendingBookingUpdate,
        onError: handlers.onError
      })
      subscriptionIds.push(pendingId)
    }

    // Subscribe to all active tasks
    if (handlers.onTaskUpdate) {
      const tasksId = this.subscribeToTasks({
        onTaskUpdated: handlers.onTaskUpdate,
        onError: handlers.onError
      }, { status: ['assigned', 'in_progress'] }, 'admin-active-tasks')
      subscriptionIds.push(tasksId)
    }

    // Subscribe to urgent sync events
    if (handlers.onUrgentEvent) {
      const urgentId = this.subscribeToUrgentUpdates({
        onSyncEvent: handlers.onUrgentEvent,
        onError: handlers.onError
      })
      subscriptionIds.push(urgentId)
    }

    console.log(`✅ Admin dashboard sync setup complete with ${subscriptionIds.length} subscriptions`)
    return subscriptionIds
  }
}
