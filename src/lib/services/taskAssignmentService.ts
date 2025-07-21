/**
 * Task Assignment Service
 *
 * Manages task assignments, staff coordination, and cross-platform synchronization
 * for booking-related tasks between web and mobile applications.
 */

import { getDb } from '@/lib/firebase'
import {
    SyncEvent,
    TaskAssignment,
    TaskAssignmentFilters,
    TaskStatus
} from '@/types/booking-sync'
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    Unsubscribe,
    updateDoc,
    where
} from 'firebase/firestore'

export class TaskAssignmentService {
  private static get db() {
    const database = getDb()
    if (!database) throw new Error("Firebase not initialized")
    return database
  }

  /**
   * Create a new task assignment
   */
  static async createTask(
    taskData: Omit<TaskAssignment, 'id' | 'createdAt' | 'updatedAt' | 'syncVersion' | 'lastSyncedAt'>
  ): Promise<{ success: boolean; taskId?: string; error?: string }> {
    try {
      const timestamp = serverTimestamp()

      const task: Omit<TaskAssignment, 'id'> = {
        ...taskData,
        createdAt: timestamp as any,
        updatedAt: timestamp as any,
        syncVersion: 1,
        lastSyncedAt: timestamp as any
      }

      const docRef = await addDoc(collection(this.db, 'task_assignments'), task)

      // Create sync event
      await this.createSyncEvent(
        'staff_assigned',
        docRef.id,
        'task',
        taskData.assignedBy,
        'System',
        {
          action: 'task_created',
          taskType: taskData.taskType,
          staffId: taskData.staffId,
          bookingId: taskData.bookingId
        }
      )

      console.log(`✅ Task created successfully: ${docRef.id}`)
      return { success: true, taskId: docRef.id }
    } catch (error) {
      console.error('Error creating task:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Update task status and progress
   */
  static async updateTaskStatus(
    taskId: string,
    status: TaskStatus,
    progress?: number,
    staffNotes?: string,
    completionNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const timestamp = serverTimestamp()
      const updates: Record<string, any> = {
        status,
        updatedAt: timestamp,
        syncVersion: 1, // Will be incremented based on current value
        lastSyncedAt: timestamp
      }

      if (progress !== undefined) updates.progress = progress
      if (staffNotes) updates.staffNotes = staffNotes
      if (completionNotes) updates.completionNotes = completionNotes
      if (status === 'completed') updates.completedAt = timestamp
      if (status === 'in_progress' && !updates.actualStartTime) {
        updates.actualStartTime = timestamp
      }
      if (status === 'completed' && !updates.actualEndTime) {
        updates.actualEndTime = timestamp
      }

      // Get current task to increment sync version
      const taskRef = doc(this.db, 'task_assignments', taskId)
      const taskDoc = await getDoc(taskRef)

      if (!taskDoc.exists()) {
        return { success: false, error: 'Task not found' }
      }

      const currentData = taskDoc.data()
      updates.syncVersion = (currentData.syncVersion || 1) + 1

      await updateDoc(taskRef, updates)

      // Create sync event
      await this.createSyncEvent(
        'task_completed',
        taskId,
        'task',
        'staff_member', // This would be the actual staff member ID in real implementation
        'Staff Member',
        {
          action: 'status_updated',
          newStatus: status,
          progress,
          taskType: currentData.taskType,
          bookingId: currentData.bookingId
        }
      )

      console.log(`✅ Task ${taskId} status updated to ${status}`)
      return { success: true }
    } catch (error) {
      console.error('Error updating task status:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get tasks for a specific booking
   */
  static async getTasksForBooking(bookingId: string): Promise<TaskAssignment[]> {
    try {
      const q = query(
        collection(this.db, 'task_assignments'),
        where('bookingId', '==', bookingId),
        orderBy('createdAt', 'desc')
      )

      const snapshot = await getDocs(q)
      const tasks: TaskAssignment[] = []

      snapshot.forEach((doc) => {
        tasks.push({ id: doc.id, ...doc.data() } as TaskAssignment)
      })

      return tasks
    } catch (error) {
      console.error('Error fetching tasks for booking:', error)
      return []
    }
  }

  /**
   * Get tasks assigned to a specific staff member
   */
  static async getTasksForStaff(
    staffId: string,
    filters?: TaskAssignmentFilters
  ): Promise<TaskAssignment[]> {
    try {
      let q = query(
        collection(this.db, 'task_assignments'),
        where('staffId', '==', staffId)
      )

      if (filters?.status && filters.status.length > 0) {
        q = query(q, where('status', 'in', filters.status))
      }

      if (filters?.taskTypes && filters.taskTypes.length > 0) {
        q = query(q, where('taskType', 'in', filters.taskTypes))
      }

      q = query(q, orderBy('createdAt', 'desc'))

      const snapshot = await getDocs(q)
      const tasks: TaskAssignment[] = []

      snapshot.forEach((doc) => {
        tasks.push({ id: doc.id, ...doc.data() } as TaskAssignment)
      })

      // Apply date range filter if specified (client-side filtering)
      if (filters?.dateRange) {
        const startDate = new Date(filters.dateRange.start)
        const endDate = new Date(filters.dateRange.end)

        return tasks.filter(task => {
          const taskDate = new Date(task.scheduledDate || task.createdAt)
          return taskDate >= startDate && taskDate <= endDate
        })
      }

      return tasks
    } catch (error) {
      console.error('Error fetching tasks for staff:', error)
      return []
    }
  }

  /**
   * Get all tasks with optional filters
   */
  static async getAllTasks(filters?: TaskAssignmentFilters): Promise<TaskAssignment[]> {
    try {
      let q = collection(this.db, 'task_assignments')

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

      const snapshot = await getDocs(q)
      const tasks: TaskAssignment[] = []

      snapshot.forEach((doc) => {
        tasks.push({ id: doc.id, ...doc.data() } as TaskAssignment)
      })

      // Apply date range filter if specified (client-side filtering)
      if (filters?.dateRange) {
        const startDate = new Date(filters.dateRange.start)
        const endDate = new Date(filters.dateRange.end)

        return tasks.filter(task => {
          const taskDate = new Date(task.scheduledDate || task.createdAt)
          return taskDate >= startDate && taskDate <= endDate
        })
      }

      return tasks
    } catch (error) {
      console.error('Error fetching all tasks:', error)
      return []
    }
  }

  /**
   * Delete a task assignment
   */
  static async deleteTask(taskId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get task data before deletion for sync event
      const taskRef = doc(this.db, 'task_assignments', taskId)
      const taskDoc = await getDoc(taskRef)

      if (!taskDoc.exists()) {
        return { success: false, error: 'Task not found' }
      }

      const taskData = taskDoc.data()

      await deleteDoc(taskRef)

      // Create sync event
      await this.createSyncEvent(
        'task_completed', // Using completed as closest match for deletion
        taskId,
        'task',
        'admin',
        'Admin',
        {
          action: 'task_deleted',
          taskType: taskData.taskType,
          staffId: taskData.staffId,
          bookingId: taskData.bookingId
        }
      )

      console.log(`✅ Task ${taskId} deleted successfully`)
      return { success: true }
    } catch (error) {
      console.error('Error deleting task:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get task statistics for a staff member
   */
  static async getStaffTaskStats(staffId: string): Promise<{
    total: number
    completed: number
    inProgress: number
    assigned: number
    overdue: number
    completionRate: number
    averageCompletionTime: number
  }> {
    try {
      const tasks = await this.getTasksForStaff(staffId)

      const stats = {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        inProgress: tasks.filter(t => t.status === 'in_progress').length,
        assigned: tasks.filter(t => t.status === 'assigned').length,
        overdue: 0,
        completionRate: 0,
        averageCompletionTime: 0
      }

      // Calculate overdue tasks
      const now = new Date()
      stats.overdue = tasks.filter(task => {
        if (task.status === 'completed') return false
        if (!task.scheduledDate) return false
        return new Date(task.scheduledDate) < now
      }).length

      // Calculate completion rate
      if (stats.total > 0) {
        stats.completionRate = (stats.completed / stats.total) * 100
      }

      // Calculate average completion time (in hours)
      const completedTasks = tasks.filter(t =>
        t.status === 'completed' &&
        t.actualStartTime &&
        t.actualEndTime
      )

      if (completedTasks.length > 0) {
        const totalTime = completedTasks.reduce((sum, task) => {
          const start = new Date(task.actualStartTime as any)
          const end = new Date(task.actualEndTime as any)
          return sum + (end.getTime() - start.getTime())
        }, 0)

        stats.averageCompletionTime = totalTime / completedTasks.length / (1000 * 60 * 60) // Convert to hours
      }

      return stats
    } catch (error) {
      console.error('Error calculating staff task stats:', error)
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        assigned: 0,
        overdue: 0,
        completionRate: 0,
        averageCompletionTime: 0
      }
    }
  }

  /**
   * Subscribe to real-time task updates
   */
  static subscribeToTaskUpdates(
    callback: (tasks: TaskAssignment[]) => void,
    filters?: TaskAssignmentFilters
  ): Unsubscribe {
    try {
      let q = collection(this.db, 'task_assignments')

      if (filters?.staffIds && filters.staffIds.length > 0) {
        q = query(q, where('staffId', 'in', filters.staffIds))
      }

      if (filters?.status && filters.status.length > 0) {
        q = query(q, where('status', 'in', filters.status))
      }

      q = query(q, orderBy('createdAt', 'desc'))

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
   * Create a sync event for cross-platform tracking
   */
  private static async createSyncEvent(
    type: SyncEvent['type'],
    entityId: string,
    entityType: SyncEvent['entityType'],
    triggeredBy: string,
    triggeredByName: string,
    changes: Record<string, any> = {}
  ): Promise<void> {
    try {
      const syncEvent: Omit<SyncEvent, 'id'> = {
        type,
        entityId,
        entityType,
        triggeredBy,
        triggeredByName,
        timestamp: serverTimestamp() as any,
        changes,
        platform: 'web',
        synced: false
      }

      await addDoc(collection(this.db, 'sync_events'), syncEvent)
      console.log(`✅ Sync event created: ${type} for ${entityType} ${entityId}`)
    } catch (error) {
      console.error('❌ Error creating sync event:', error)
    }
  }
}
