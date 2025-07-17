/**
 * Optimized Sync Service
 * 
 * Provides fallback sync functionality that doesn't require complex Firebase indexes.
 * This service can be used while Firebase indexes are being built.
 */

import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  limit,
  Unsubscribe,
  DocumentChange,
  QuerySnapshot,
  DocumentData,
  addDoc,
  serverTimestamp
} from 'firebase/firestore'
import { getDb } from '@/lib/firebase'
import {
  SyncBooking,
  TaskAssignment,
  SyncEvent,
  BookingSyncFilters,
  TaskAssignmentFilters
} from '@/types/booking-sync'

export interface OptimizedSyncEventHandler {
  onBookingUpdated?: (booking: SyncBooking, changeType: 'added' | 'modified' | 'removed') => void
  onTaskUpdated?: (task: TaskAssignment, changeType: 'added' | 'modified' | 'removed') => void
  onSyncEvent?: (event: SyncEvent, changeType: 'added' | 'modified' | 'removed') => void
  onError?: (error: Error, context: string) => void
}

export class OptimizedSyncService {
  private static db = getDb()
  private static activeSubscriptions: Map<string, Unsubscribe> = new Map()

  /**
   * Subscribe to bookings with simple queries (no compound indexes required)
   */
  static subscribeToBookings(
    handler: OptimizedSyncEventHandler,
    subscriptionId: string = 'optimized-bookings'
  ): string {
    try {
      this.unsubscribe(subscriptionId)

      // Use simple query without compound filters
      const q = query(
        collection(this.db, 'bookings'),
        orderBy('createdAt', 'desc'),
        limit(50)
      )

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
          console.error('Error in optimized booking subscription:', error)
          if (handler.onError) {
            handler.onError(error as Error, 'optimized-booking-subscription')
          }
        }
      )

      this.activeSubscriptions.set(subscriptionId, unsubscribe)
      console.log(`✅ Optimized booking subscription active: ${subscriptionId}`)
      return subscriptionId

    } catch (error) {
      console.error('Error setting up optimized booking subscription:', error)
      if (handler.onError) {
        handler.onError(error as Error, 'optimized-booking-subscription-setup')
      }
      return ''
    }
  }

  /**
   * Subscribe to tasks with simple queries
   */
  static subscribeToTasks(
    handler: OptimizedSyncEventHandler,
    subscriptionId: string = 'optimized-tasks'
  ): string {
    try {
      this.unsubscribe(subscriptionId)

      // Use simple query without compound filters
      const q = query(
        collection(this.db, 'task_assignments'),
        orderBy('createdAt', 'desc'),
        limit(50)
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
          console.error('Error in optimized task subscription:', error)
          if (handler.onError) {
            handler.onError(error as Error, 'optimized-task-subscription')
          }
        }
      )

      this.activeSubscriptions.set(subscriptionId, unsubscribe)
      console.log(`✅ Optimized task subscription active: ${subscriptionId}`)
      return subscriptionId

    } catch (error) {
      console.error('Error setting up optimized task subscription:', error)
      if (handler.onError) {
        handler.onError(error as Error, 'optimized-task-subscription-setup')
      }
      return ''
    }
  }

  /**
   * Subscribe to sync events with simple query (no type filtering)
   */
  static subscribeToSyncEvents(
    handler: OptimizedSyncEventHandler,
    subscriptionId: string = 'optimized-sync-events'
  ): string {
    try {
      this.unsubscribe(subscriptionId)

      // Use simple query - just timestamp ordering
      const q = query(
        collection(this.db, 'sync_events'),
        orderBy('timestamp', 'desc'),
        limit(30)
      )

      const unsubscribe = onSnapshot(
        q,
        (snapshot: QuerySnapshot<DocumentData>) => {
          snapshot.docChanges().forEach((change: DocumentChange<DocumentData>) => {
            const syncEvent: SyncEvent = {
              id: change.doc.id,
              ...change.doc.data()
            } as SyncEvent

            if (handler.onSyncEvent) {
              handler.onSyncEvent(syncEvent, change.type)
            }
          })
        },
        (error) => {
          console.error('Error in optimized sync event subscription:', error)
          if (handler.onError) {
            handler.onError(error as Error, 'optimized-sync-event-subscription')
          }
        }
      )

      this.activeSubscriptions.set(subscriptionId, unsubscribe)
      console.log(`✅ Optimized sync event subscription active: ${subscriptionId}`)
      return subscriptionId

    } catch (error) {
      console.error('Error setting up optimized sync event subscription:', error)
      if (handler.onError) {
        handler.onError(error as Error, 'optimized-sync-event-subscription-setup')
      }
      return ''
    }
  }

  /**
   * Setup optimized admin dashboard sync (fallback version)
   */
  static setupOptimizedAdminSync(
    handlers: {
      onBookingUpdate?: (booking: SyncBooking, changeType: 'added' | 'modified' | 'removed') => void
      onTaskUpdate?: (task: TaskAssignment, changeType: 'added' | 'modified' | 'removed') => void
      onSyncEvent?: (event: SyncEvent, changeType: 'added' | 'modified' | 'removed') => void
      onError?: (error: Error, context: string) => void
    }
  ): string[] {
    const subscriptionIds: string[] = []

    // Subscribe to bookings
    if (handlers.onBookingUpdate) {
      const bookingId = this.subscribeToBookings({
        onBookingUpdated: (booking, changeType) => {
          // Client-side filtering for pending bookings
          if (booking.status === 'pending_approval') {
            handlers.onBookingUpdate?.(booking, changeType)
          }
        },
        onError: handlers.onError
      }, 'optimized-admin-bookings')
      subscriptionIds.push(bookingId)
    }

    // Subscribe to tasks
    if (handlers.onTaskUpdate) {
      const taskId = this.subscribeToTasks({
        onTaskUpdated: (task, changeType) => {
          // Client-side filtering for active tasks
          if (task.status === 'assigned' || task.status === 'in_progress') {
            handlers.onTaskUpdate?.(task, changeType)
          }
        },
        onError: handlers.onError
      }, 'optimized-admin-tasks')
      subscriptionIds.push(taskId)
    }

    // Subscribe to sync events
    if (handlers.onSyncEvent) {
      const syncId = this.subscribeToSyncEvents({
        onSyncEvent: (event, changeType) => {
          // Client-side filtering for urgent events
          const urgentTypes = ['booking_approved', 'booking_rejected', 'staff_assigned', 'staff_created_enhanced']
          if (urgentTypes.includes(event.type)) {
            handlers.onSyncEvent?.(event, changeType)
          }
        },
        onError: handlers.onError
      }, 'optimized-admin-sync')
      subscriptionIds.push(syncId)
    }

    console.log(`✅ Optimized admin sync setup complete with ${subscriptionIds.length} subscriptions`)
    return subscriptionIds
  }

  /**
   * Create sync event (simplified version)
   */
  static async createSyncEvent(
    type: string,
    entityId: string,
    entityType: string,
    triggeredBy: string,
    triggeredByName: string,
    changes: Record<string, any> = {}
  ): Promise<void> {
    try {
      const syncEvent = {
        type,
        entityId,
        entityType,
        triggeredBy,
        triggeredByName,
        timestamp: serverTimestamp(),
        changes,
        platform: 'web',
        synced: false
      }

      await addDoc(collection(this.db, 'sync_events'), syncEvent)
      console.log(`✅ Optimized sync event created: ${type} for ${entityType} ${entityId}`)
    } catch (error) {
      console.error('❌ Error creating optimized sync event:', error)
    }
  }

  /**
   * Unsubscribe from a specific subscription
   */
  static unsubscribe(subscriptionId: string): boolean {
    const unsubscribe = this.activeSubscriptions.get(subscriptionId)
    if (unsubscribe) {
      unsubscribe()
      this.activeSubscriptions.delete(subscriptionId)
      console.log(`✅ Unsubscribed from optimized: ${subscriptionId}`)
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
      console.log(`✅ Unsubscribed from optimized: ${subscriptionId}`)
    })
    this.activeSubscriptions.clear()
    console.log('✅ All optimized subscriptions cleared')
  }

  /**
   * Get list of active subscription IDs
   */
  static getActiveSubscriptions(): string[] {
    return Array.from(this.activeSubscriptions.keys())
  }
}
