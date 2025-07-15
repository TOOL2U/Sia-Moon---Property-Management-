/**
 * Booking Sync Service
 * 
 * Handles booking approvals, staff assignments, and cross-platform synchronization
 * between web and mobile applications via Firebase Firestore.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore'
import { getDb } from '@/lib/firebase'
import {
  SyncBooking,
  BookingApprovalAction,
  StaffAssignmentAction,
  TaskAssignment,
  BookingStatus,
  TaskStatus,
  SyncEvent,
  BookingSyncFilters,
  TaskAssignmentFilters
} from '@/types/booking-sync'

export class BookingSyncService {
  private static db = getDb()

  /**
   * Approve a booking with cross-platform sync
   */
  static async approveBooking(
    bookingId: string,
    adminId: string,
    adminName: string,
    notes?: string
  ): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      const response = await fetch('/api/bookings/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          action: 'approve',
          adminId,
          adminName,
          notes
        })
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to approve booking')
      }

      return {
        success: true,
        message: 'Booking approved successfully and synced to mobile app'
      }
    } catch (error) {
      console.error('Error approving booking:', error)
      return {
        success: false,
        message: 'Failed to approve booking',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Reject a booking with cross-platform sync
   */
  static async rejectBooking(
    bookingId: string,
    adminId: string,
    adminName: string,
    reason?: string,
    notes?: string
  ): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      const response = await fetch('/api/bookings/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          action: 'reject',
          adminId,
          adminName,
          reason,
          notes
        })
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to reject booking')
      }

      return {
        success: true,
        message: 'Booking rejected successfully and synced to mobile app'
      }
    } catch (error) {
      console.error('Error rejecting booking:', error)
      return {
        success: false,
        message: 'Failed to reject booking',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Assign staff to a booking with task creation
   */
  static async assignStaffToBooking(
    bookingId: string,
    staffIds: string[],
    assignedBy: string,
    assignedByName: string,
    tasks?: Array<{
      taskType: TaskAssignment['taskType']
      title: string
      description?: string
      priority?: TaskAssignment['priority']
      scheduledDate?: string
      estimatedDuration?: number
    }>,
    options?: {
      generalInstructions?: string
      specialRequirements?: string
      deadline?: string
    }
  ): Promise<{ success: boolean; message: string; createdTasks?: TaskAssignment[]; error?: string }> {
    try {
      const response = await fetch('/api/bookings/assign-staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          staffIds,
          assignedBy,
          assignedByName,
          tasks,
          ...options
        })
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to assign staff')
      }

      return {
        success: true,
        message: `${staffIds.length} staff members assigned successfully`,
        createdTasks: result.createdTasks
      }
    } catch (error) {
      console.error('Error assigning staff:', error)
      return {
        success: false,
        message: 'Failed to assign staff',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get pending bookings that need approval
   */
  static async getPendingBookings(): Promise<SyncBooking[]> {
    try {
      const response = await fetch('/api/bookings/approve')
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch pending bookings')
      }

      return result.pendingBookings || []
    } catch (error) {
      console.error('Error fetching pending bookings:', error)
      return []
    }
  }

  /**
   * Get available staff for assignment
   */
  static async getAvailableStaff(): Promise<any[]> {
    try {
      const response = await fetch('/api/bookings/assign-staff?available=true')
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch available staff')
      }

      return result.availableStaff || []
    } catch (error) {
      console.error('Error fetching available staff:', error)
      return []
    }
  }

  /**
   * Get task assignments for a booking
   */
  static async getBookingAssignments(bookingId: string): Promise<TaskAssignment[]> {
    try {
      const response = await fetch(`/api/bookings/assign-staff?bookingId=${bookingId}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch assignments')
      }

      return result.assignments || []
    } catch (error) {
      console.error('Error fetching booking assignments:', error)
      return []
    }
  }

  /**
   * Get approval history for a booking
   */
  static async getBookingApprovalHistory(bookingId: string): Promise<BookingApprovalAction[]> {
    try {
      const response = await fetch(`/api/bookings/approve?bookingId=${bookingId}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch approval history')
      }

      return result.approvals || []
    } catch (error) {
      console.error('Error fetching approval history:', error)
      return []
    }
  }

  /**
   * Listen to real-time booking updates
   */
  static subscribeToBookingUpdates(
    callback: (bookings: SyncBooking[]) => void,
    filters?: BookingSyncFilters
  ): Unsubscribe {
    try {
      let q = collection(this.db, 'bookings')
      
      if (filters?.status && filters.status.length > 0) {
        q = query(q, where('status', 'in', filters.status))
      }
      
      return onSnapshot(q, (snapshot) => {
        const bookings: SyncBooking[] = []
        snapshot.forEach((doc) => {
          bookings.push({ id: doc.id, ...doc.data() } as SyncBooking)
        })
        callback(bookings)
      })
    } catch (error) {
      console.error('Error setting up booking subscription:', error)
      return () => {} // Return empty unsubscribe function
    }
  }

  /**
   * Listen to real-time task assignment updates
   */
  static subscribeToTaskUpdates(
    callback: (tasks: TaskAssignment[]) => void,
    filters?: TaskAssignmentFilters
  ): Unsubscribe {
    try {
      let q = collection(this.db, 'task_assignments')
      
      if (filters?.status && filters.status.length > 0) {
        q = query(q, where('status', 'in', filters.status))
      }
      
      if (filters?.staffIds && filters.staffIds.length > 0) {
        q = query(q, where('staffId', 'in', filters.staffIds))
      }
      
      return onSnapshot(q, (snapshot) => {
        const tasks: TaskAssignment[] = []
        snapshot.forEach((doc) => {
          tasks.push({ id: doc.id, ...doc.data() } as TaskAssignment)
        })
        callback(tasks)
      })
    } catch (error) {
      console.error('Error setting up task subscription:', error)
      return () => {} // Return empty unsubscribe function
    }
  }

  /**
   * Get recent sync events for monitoring
   */
  static async getRecentSyncEvents(limit: number = 50): Promise<SyncEvent[]> {
    try {
      const q = query(
        collection(this.db, 'sync_events'),
        orderBy('timestamp', 'desc'),
        limit(limit)
      )
      
      const snapshot = await getDocs(q)
      const events: SyncEvent[] = []
      
      snapshot.forEach((doc) => {
        events.push({ id: doc.id, ...doc.data() } as SyncEvent)
      })
      
      return events
    } catch (error) {
      console.error('Error fetching sync events:', error)
      return []
    }
  }

  /**
   * Mark sync events as processed
   */
  static async markSyncEventsProcessed(eventIds: string[]): Promise<void> {
    try {
      const updatePromises = eventIds.map(eventId => 
        updateDoc(doc(this.db, 'sync_events', eventId), {
          synced: true,
          syncedAt: serverTimestamp()
        })
      )
      
      await Promise.all(updatePromises)
      console.log(`✅ Marked ${eventIds.length} sync events as processed`)
    } catch (error) {
      console.error('Error marking sync events as processed:', error)
    }
  }
}
