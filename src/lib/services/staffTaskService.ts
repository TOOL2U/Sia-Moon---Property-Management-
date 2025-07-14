/**
 * Staff Task Service
 * Handles CRUD operations for staff tasks and automation
 */

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore'
import { getDb } from '@/lib/firebase'
import { 
  StaffTask, 
  StaffTaskFilters, 
  StaffStats, 
  StaffTaskResponse, 
  StaffTaskListResponse,
  TASK_TEMPLATES,
  PROPERTY_STAFF_ASSIGNMENTS
} from '@/types/staff'

export class StaffTaskService {
  
  /**
   * Create automated tasks when booking is approved
   */
  static async createTasksForApprovedBooking(bookingData: {
    id: string
    guestName: string
    guestEmail?: string
    villaName: string
    checkInDate: string
    checkOutDate: string
    guests?: number
    price?: number
    specialRequests?: string
    clientId?: string
  }): Promise<{ success: boolean; taskIds?: string[]; error?: string }> {
    try {
      console.log('🎯 STAFF TASKS: Creating automated tasks for approved booking:', bookingData.id)
      
      const database = getDb()
      const taskIds: string[] = []
      
      // Determine task template based on booking characteristics
      let taskTemplate = TASK_TEMPLATES.standard_checkin
      
      // Use luxury template for high-value bookings
      if (bookingData.price && bookingData.price > 15000) {
        taskTemplate = TASK_TEMPLATES.luxury_booking
        console.log('💎 Using luxury booking template for high-value booking')
      }
      
      // Add maintenance tasks if special requests indicate need
      if (bookingData.specialRequests?.toLowerCase().includes('maintenance') ||
          bookingData.specialRequests?.toLowerCase().includes('repair')) {
        taskTemplate = [...taskTemplate, ...TASK_TEMPLATES.maintenance_required]
        console.log('🔧 Adding maintenance tasks based on special requests')
      }
      
      // Get assigned staff for this property
      const assignedStaff = this.getAssignedStaffForProperty(bookingData.villaName)
      console.log('👥 Assigned staff for property:', assignedStaff)
      
      // Create tasks for each assigned staff member
      for (const staffId of assignedStaff) {
        // Get staff info (in real app, fetch from staff collection)
        const staffInfo = await this.getStaffInfo(staffId)
        
        // Filter tasks relevant to this staff member's role
        const relevantTasks = taskTemplate.filter(template => 
          this.isTaskRelevantForStaff(template.type, staffInfo.role)
        )
        
        for (const template of relevantTasks) {
          // Calculate scheduling
          const checkInDate = new Date(bookingData.checkInDate)
          const scheduledDate = new Date(checkInDate)
          
          // Schedule cleaning 1 day before check-in
          if (template.type === 'cleaning') {
            scheduledDate.setDate(scheduledDate.getDate() - 1)
          }
          // Schedule check-in prep on check-in day
          else if (template.type === 'checkin_prep') {
            // Keep same day but earlier time
          }
          // Schedule maintenance 2 days before check-in
          else if (template.type === 'maintenance') {
            scheduledDate.setDate(scheduledDate.getDate() - 2)
          }
          
          // Create deadline (usually 2 hours before check-in)
          const deadline = new Date(checkInDate)
          deadline.setHours(deadline.getHours() - 2)
          
          const newTask: Omit<StaffTask, 'id'> = {
            bookingId: bookingData.id,
            staffId: staffId,
            staffName: staffInfo.name,
            staffEmail: staffInfo.email,
            
            // Booking details
            propertyName: bookingData.villaName,
            guestName: bookingData.guestName,
            guestEmail: bookingData.guestEmail,
            checkInDate: bookingData.checkInDate,
            checkOutDate: bookingData.checkOutDate,
            guests: bookingData.guests,
            
            // Task details
            taskType: template.type,
            title: template.title,
            description: template.description,
            priority: template.priority,
            estimatedDuration: template.estimatedDuration,
            
            // Status
            status: 'assigned',
            
            // Scheduling
            scheduledDate: scheduledDate.toISOString().split('T')[0],
            deadline: deadline.toISOString(),
            
            // Additional data
            requiredSupplies: template.requiredSupplies,
            specialInstructions: bookingData.specialRequests,
            
            // Metadata
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system_automation',
            autoCreated: true,
            automationRules: [`booking_approved_${template.type}`]
          }
          
          // Save to Firebase
          const docRef = await addDoc(collection(database, 'staff_tasks'), {
            ...newTask,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          })
          
          taskIds.push(docRef.id)
          console.log(`✅ Created ${template.type} task for ${staffInfo.name}: ${docRef.id}`)
        }
      }
      
      console.log(`🎉 Successfully created ${taskIds.length} automated tasks for booking ${bookingData.id}`)
      
      return {
        success: true,
        taskIds
      }
      
    } catch (error) {
      console.error('❌ Error creating automated tasks:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create tasks'
      }
    }
  }
  
  /**
   * Get tasks assigned to specific staff member
   */
  static async getTasksForStaff(
    staffId: string, 
    filters: StaffTaskFilters = {}
  ): Promise<StaffTaskListResponse> {
    try {
      console.log('📋 Fetching tasks for staff:', staffId)
      
      const database = getDb()
      let tasksQuery = query(
        collection(database, 'staff_tasks'),
        where('staffId', '==', staffId)
      )
      
      // Apply filters
      if (filters.status) {
        tasksQuery = query(tasksQuery, where('status', '==', filters.status))
      }
      
      if (filters.taskType) {
        tasksQuery = query(tasksQuery, where('taskType', '==', filters.taskType))
      }
      
      if (filters.priority) {
        tasksQuery = query(tasksQuery, where('priority', '==', filters.priority))
      }
      
      // Add ordering
      const sortField = filters.sortBy || 'deadline'
      tasksQuery = query(tasksQuery, orderBy(sortField, filters.sortOrder || 'asc'))
      
      const snapshot = await getDocs(tasksQuery)
      const tasks: StaffTask[] = []
      
      snapshot.forEach(doc => {
        const data = doc.data()
        tasks.push({
          id: doc.id,
          ...data,
          // Convert Firestore timestamps
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
          confirmedAt: data.confirmedAt?.toDate?.()?.toISOString() || data.confirmedAt,
          startedAt: data.startedAt?.toDate?.()?.toISOString() || data.startedAt,
          completedAt: data.completedAt?.toDate?.()?.toISOString() || data.completedAt
        } as StaffTask)
      })
      
      // Apply date range filter in memory (since Firestore has limitations)
      let filteredTasks = tasks
      if (filters.dateRange) {
        filteredTasks = tasks.filter(task => {
          const taskDate = task.scheduledDate
          return taskDate >= filters.dateRange!.start && taskDate <= filters.dateRange!.end
        })
      }
      
      // Calculate stats
      const stats = this.calculateStaffStats(filteredTasks)
      
      console.log(`✅ Found ${filteredTasks.length} tasks for staff ${staffId}`)
      
      return {
        success: true,
        data: filteredTasks,
        stats
      }
      
    } catch (error) {
      console.error('❌ Error fetching staff tasks:', error)
      return {
        success: false,
        data: [],
        stats: this.getEmptyStats(),
        error: error instanceof Error ? error.message : 'Failed to fetch tasks'
      }
    }
  }
  
  /**
   * Update task status (confirm, start, complete)
   */
  static async updateTaskStatus(
    taskId: string, 
    status: 'confirmed' | 'in_progress' | 'completed' | 'cancelled',
    notes?: string
  ): Promise<StaffTaskResponse> {
    try {
      console.log(`📝 Updating task ${taskId} status to ${status}`)
      
      const database = getDb()
      const taskRef = doc(database, 'staff_tasks', taskId)
      
      const updateData: Record<string, unknown> = {
        status,
        updatedAt: serverTimestamp()
      }
      
      // Add timestamp for status change
      const now = serverTimestamp()
      switch (status) {
        case 'confirmed':
          updateData.confirmedAt = now
          break
        case 'in_progress':
          updateData.startedAt = now
          break
        case 'completed':
          updateData.completedAt = now
          if (notes) updateData.completionNotes = notes
          break
        case 'cancelled':
          updateData.cancelledAt = now
          if (notes) updateData.notes = notes
          break
      }
      
      await updateDoc(taskRef, updateData)
      
      // Get updated task
      const updatedDoc = await getDoc(taskRef)
      if (!updatedDoc.exists()) {
        throw new Error('Task not found after update')
      }
      
      const updatedTask = {
        id: updatedDoc.id,
        ...updatedDoc.data()
      } as StaffTask
      
      console.log(`✅ Task ${taskId} status updated to ${status}`)
      
      return {
        success: true,
        data: updatedTask,
        message: `Task ${status === 'completed' ? 'completed' : status} successfully`
      }
      
    } catch (error) {
      console.error('❌ Error updating task status:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update task'
      }
    }
  }
  
  /**
   * Get staff info (mock data for now, replace with actual staff service)
   */
  private static async getStaffInfo(staffId: string): Promise<{
    id: string
    name: string
    email: string
    role: string
  }> {
    // Mock staff data - replace with actual database query
    const mockStaff: Record<string, { name: string; email: string; role: string }> = {
      'staff_cleaner_001': { name: 'Maria Santos', email: 'maria@example.com', role: 'cleaner' },
      'staff_cleaner_002': { name: 'John Smith', email: 'john@example.com', role: 'cleaner' },
      'staff_cleaner_003': { name: 'Lisa Wong', email: 'lisa@example.com', role: 'cleaner' },
      'staff_cleaner_004': { name: 'Carlos Rodriguez', email: 'carlos@example.com', role: 'cleaner' },
      'staff_maintenance_001': { name: 'Mike Johnson', email: 'mike@example.com', role: 'maintenance' },
      'staff_maintenance_002': { name: 'David Lee', email: 'david@example.com', role: 'maintenance' },
      'staff_maintenance_003': { name: 'Sarah Brown', email: 'sarah@example.com', role: 'maintenance' }
    }
    
    const staff = mockStaff[staffId] || { name: 'Unknown Staff', email: 'unknown@example.com', role: 'cleaner' }
    
    return {
      id: staffId,
      ...staff
    }
  }
  
  /**
   * Get assigned staff for property
   */
  private static getAssignedStaffForProperty(propertyName: string): string[] {
    // Check specific property assignments first
    if (PROPERTY_STAFF_ASSIGNMENTS[propertyName as keyof typeof PROPERTY_STAFF_ASSIGNMENTS]) {
      return PROPERTY_STAFF_ASSIGNMENTS[propertyName as keyof typeof PROPERTY_STAFF_ASSIGNMENTS] as string[]
    }
    
    // Fallback to region-based assignments
    if (propertyName.toLowerCase().includes('beach') || propertyName.toLowerCase().includes('ocean')) {
      return PROPERTY_STAFF_ASSIGNMENTS.default_beach as string[]
    } else if (propertyName.toLowerCase().includes('mountain') || propertyName.toLowerCase().includes('highland')) {
      return PROPERTY_STAFF_ASSIGNMENTS.default_mountain as string[]
    } else if (propertyName.toLowerCase().includes('downtown') || propertyName.toLowerCase().includes('urban')) {
      return PROPERTY_STAFF_ASSIGNMENTS.default_city as string[]
    }
    
    // Default assignment
    return ['staff_cleaner_001', 'staff_maintenance_001']
  }
  
  /**
   * Check if task is relevant for staff role
   */
  private static isTaskRelevantForStaff(taskType: string, staffRole: string): boolean {
    const roleTaskMapping = {
      cleaner: ['cleaning', 'checkin_prep', 'checkout_process', 'inspection'],
      maintenance: ['maintenance', 'inspection'],
      supervisor: ['cleaning', 'maintenance', 'checkin_prep', 'checkout_process', 'inspection', 'custom'],
      admin: ['cleaning', 'maintenance', 'checkin_prep', 'checkout_process', 'inspection', 'custom']
    }
    
    return roleTaskMapping[staffRole as keyof typeof roleTaskMapping]?.includes(taskType) || false
  }
  
  /**
   * Calculate staff statistics
   */
  private static calculateStaffStats(tasks: StaffTask[]): StaffStats {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    const stats: StaffStats = {
      totalTasks: tasks.length,
      pendingTasks: tasks.filter(t => t.status === 'assigned').length,
      inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      overdueeTasks: tasks.filter(t => {
        const deadline = new Date(t.deadline)
        return deadline < now && !['completed', 'cancelled'].includes(t.status)
      }).length,
      todayTasks: tasks.filter(t => t.scheduledDate === today).length,
      upcomingTasks: tasks.filter(t => t.scheduledDate >= tomorrow).length,
      averageCompletionTime: 0, // Calculate based on completed tasks
      completionRate: 0
    }
    
    // Calculate completion rate
    if (stats.totalTasks > 0) {
      stats.completionRate = (stats.completedTasks / stats.totalTasks) * 100
    }
    
    // Calculate average completion time
    const completedTasks = tasks.filter(t => t.status === 'completed' && t.startedAt && t.completedAt)
    if (completedTasks.length > 0) {
      const totalTime = completedTasks.reduce((sum, task) => {
        const started = new Date(task.startedAt!).getTime()
        const completed = new Date(task.completedAt!).getTime()
        return sum + (completed - started)
      }, 0)
      stats.averageCompletionTime = totalTime / completedTasks.length / (1000 * 60) // in minutes
    }
    
    return stats
  }
  
  /**
   * Get empty stats object
   */
  private static getEmptyStats(): StaffStats {
    return {
      totalTasks: 0,
      pendingTasks: 0,
      inProgressTasks: 0,
      completedTasks: 0,
      overdueeTasks: 0,
      todayTasks: 0,
      upcomingTasks: 0,
      averageCompletionTime: 0,
      completionRate: 0
    }
  }
  
  /**
   * Get tasks by date range (for calendar view)
   */
  static async getTasksByDateRange(
    staffId: string,
    startDate: string,
    endDate: string
  ): Promise<StaffTask[]> {
    try {
      const response = await this.getTasksForStaff(staffId, {
        dateRange: { start: startDate, end: endDate },
        sortBy: 'scheduledDate',
        sortOrder: 'asc'
      })
      
      return response.data
      
    } catch (error) {
      console.error('❌ Error fetching tasks by date range:', error)
      return []
    }
  }
  
  /**
   * Get overdue tasks for staff
   */
  static async getOverdueTasks(staffId: string): Promise<StaffTask[]> {
    try {
      const response = await this.getTasksForStaff(staffId)
      const now = new Date()
      
      return response.data.filter(task => {
        const deadline = new Date(task.deadline)
        return deadline < now && !['completed', 'cancelled'].includes(task.status)
      })
      
    } catch (error) {
      console.error('❌ Error fetching overdue tasks:', error)
      return []
    }
  }
}
