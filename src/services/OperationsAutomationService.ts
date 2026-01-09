/**
 * Operations Automation Service - Phase 3
 * Fully automate property operations from booking confirmation to property ready state
 * 
 * AUTOMATION FLOWS:
 * 1. Booking → Operational Timeline Creation
 * 2. Automatic Checkout Trigger
 * 3. Cleaning Workflow Automation
 * 4. Inspection Workflow Automation  
 * 5. Issue Handling & Resolution
 */

import { getDb } from '@/lib/firebase'
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  orderBy,
  writeBatch
} from 'firebase/firestore'

// Task status flow: pending → in_progress → completed → approved
export type TaskStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'approved' | 'failed' | 'cancelled'

export type TaskType = 'checkin_prep' | 'checkout_process' | 'cleaning' | 'inspection' | 'maintenance' | 'setup'

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface OperationalTask {
  id?: string
  bookingId: string
  propertyId: string
  propertyName: string
  guestName: string
  
  // Task details
  title: string
  description: string
  taskType: TaskType
  priority: TaskPriority
  status: TaskStatus
  
  // Scheduling
  scheduledDateTime: Date
  estimatedDuration: number // minutes
  actualStartTime?: Date
  actualEndTime?: Date
  
  // Assignment
  assignedStaffId?: string
  assignedStaffName?: string
  assignedStaffEmail?: string
  assignedAt?: Date
  
  // Completion data
  completedAt?: Date
  approvedAt?: Date
  completionNotes?: string
  photosUploaded?: string[] // URLs to uploaded photos
  checklistCompleted?: boolean
  
  // Dependencies
  dependsOn?: string[] // IDs of tasks that must complete first
  triggersNext?: string[] // IDs of tasks this will trigger when completed
  
  // Issue tracking
  issuesFound?: boolean
  issueDescription?: string
  resolutionRequired?: boolean
  
  // Metadata
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface BookingTimeline {
  bookingId: string
  propertyId: string
  checkInDate: Date
  checkOutDate: Date
  tasks: OperationalTask[]
  currentPhase: 'pre_arrival' | 'occupied' | 'checkout' | 'cleaning' | 'inspection' | 'ready'
  completionPercentage: number
  estimatedReadyTime?: Date
  actualReadyTime?: Date
}

export interface NotificationPayload {
  type: 'task_assigned' | 'task_due' | 'task_completed' | 'issue_found' | 'timeline_complete'
  recipientId: string
  recipientEmail: string
  title: string
  message: string
  taskId?: string
  bookingId: string
  urgency: 'low' | 'medium' | 'high' | 'urgent'
  metadata?: any
}

class OperationsAutomationService {
  private readonly TASKS_COLLECTION = 'operational_tasks'
  private readonly BOOKINGS_COLLECTION = 'bookings'
  private readonly TIMELINES_COLLECTION = 'booking_timelines'
  private readonly STAFF_COLLECTION = 'staff_accounts'
  private readonly NOTIFICATIONS_COLLECTION = 'notifications'
  
  private timelineListeners: Map<string, () => void> = new Map()
  private checkoutMonitor: (() => void) | null = null

  /**
   * FLOW 1: Booking → Operational Timeline Creation
   * When booking is confirmed, automatically generate complete operational timeline
   */
  async createOperationalTimeline(bookingId: string, bookingData: any): Promise<BookingTimeline> {
    console.log(`🎯 Creating operational timeline for booking ${bookingId}`)
    
    const checkInDate = new Date(bookingData.checkInDate)
    const checkOutDate = new Date(bookingData.checkOutDate)
    
    // Generate all required tasks
    const tasks = this.generateStandardTasks(bookingId, bookingData, checkInDate, checkOutDate)
    
    // Create timeline
    const timeline: BookingTimeline = {
      bookingId,
      propertyId: bookingData.propertyId,
      checkInDate,
      checkOutDate,
      tasks,
      currentPhase: 'pre_arrival',
      completionPercentage: 0
    }
    
    // Save timeline to database
    await addDoc(collection(getDb(), this.TIMELINES_COLLECTION), {
      ...timeline,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: 'OPERATIONS_AUTOMATION'
    })
    
    // Create individual task documents
    const batch = writeBatch(getDb())
    
    for (const task of tasks) {
      const taskRef = doc(collection(getDb(), this.TASKS_COLLECTION))
      batch.set(taskRef, {
        ...task,
        id: taskRef.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    }
    
    await batch.commit()
    
    // Start monitoring this timeline
    this.startTimelineMonitoring(bookingId)
    
    console.log(`✅ Created operational timeline with ${tasks.length} tasks`)
    return timeline
  }

  /**
   * Generate standard operational tasks for a booking
   */
  private generateStandardTasks(
    bookingId: string, 
    bookingData: any, 
    checkInDate: Date, 
    checkOutDate: Date
  ): OperationalTask[] {
    const tasks: OperationalTask[] = []
    const now = new Date()

    // Task 1: Pre-arrival Setup (24h before check-in)
    tasks.push({
      bookingId,
      propertyId: bookingData.propertyId,
      propertyName: bookingData.propertyName,
      guestName: bookingData.guestName,
      title: 'Pre-arrival Property Setup',
      description: 'Deep cleaning, amenity stocking, and final preparation before guest arrival',
      taskType: 'checkin_prep',
      priority: 'high',
      status: 'pending',
      scheduledDateTime: new Date(checkInDate.getTime() - (24 * 60 * 60 * 1000)),
      estimatedDuration: 180, // 3 hours
      triggersNext: [], // Will be populated with IDs after creation
      createdAt: now,
      updatedAt: now,
      createdBy: 'OPERATIONS_AUTOMATION'
    })

    // Task 2: Guest Check-in (Informational)
    tasks.push({
      bookingId,
      propertyId: bookingData.propertyId,
      propertyName: bookingData.propertyName,
      guestName: bookingData.guestName,
      title: 'Guest Check-in',
      description: 'Guest self check-in via key box - informational event',
      taskType: 'checkin_prep',
      priority: 'medium',
      status: 'pending',
      scheduledDateTime: checkInDate,
      estimatedDuration: 0, // Informational
      dependsOn: [], // Will be populated with previous task ID
      createdAt: now,
      updatedAt: now,
      createdBy: 'OPERATIONS_AUTOMATION'
    })

    // Task 3: Checkout Process (CRITICAL - triggers all subsequent tasks)
    tasks.push({
      bookingId,
      propertyId: bookingData.propertyId,
      propertyName: bookingData.propertyName,
      guestName: bookingData.guestName,
      title: 'Guest Checkout Process',
      description: 'Mark booking as checked-out and trigger cleaning workflow',
      taskType: 'checkout_process',
      priority: 'urgent',
      status: 'pending',
      scheduledDateTime: checkOutDate,
      estimatedDuration: 30,
      triggersNext: [], // Will trigger cleaning
      createdAt: now,
      updatedAt: now,
      createdBy: 'OPERATIONS_AUTOMATION'
    })

    // Task 4: Post-checkout Cleaning
    tasks.push({
      bookingId,
      propertyId: bookingData.propertyId,
      propertyName: bookingData.propertyName,
      guestName: bookingData.guestName,
      title: 'Post-checkout Cleaning',
      description: 'Complete property cleaning including all rooms, bathrooms, linens, and common areas',
      taskType: 'cleaning',
      priority: 'high',
      status: 'pending',
      scheduledDateTime: new Date(checkOutDate.getTime() + (30 * 60 * 1000)), // 30 min after checkout
      estimatedDuration: 150, // 2.5 hours
      dependsOn: [], // Will depend on checkout
      triggersNext: [], // Will trigger inspection
      createdAt: now,
      updatedAt: now,
      createdBy: 'OPERATIONS_AUTOMATION'
    })

    // Task 5: Property Inspection
    tasks.push({
      bookingId,
      propertyId: bookingData.propertyId,
      propertyName: bookingData.propertyName,
      guestName: bookingData.guestName,
      title: 'Property Inspection',
      description: 'Inspect property condition, review cleaning quality, check for damage or maintenance issues',
      taskType: 'inspection',
      priority: 'high',
      status: 'pending',
      scheduledDateTime: new Date(checkOutDate.getTime() + (3 * 60 * 60 * 1000)), // 3 hours after checkout
      estimatedDuration: 60,
      dependsOn: [], // Will depend on cleaning
      createdAt: now,
      updatedAt: now,
      createdBy: 'OPERATIONS_AUTOMATION'
    })

    // Set up dependencies after all tasks are created
    tasks[1].dependsOn = [`${tasks[0].bookingId}_checkin_prep`] // Check-in depends on setup
    tasks[3].dependsOn = [`${tasks[2].bookingId}_checkout_process`] // Cleaning depends on checkout
    tasks[4].dependsOn = [`${tasks[3].bookingId}_cleaning`] // Inspection depends on cleaning

    // Set up triggers
    tasks[0].triggersNext = [`${tasks[1].bookingId}_checkin_prep`]
    tasks[2].triggersNext = [`${tasks[3].bookingId}_cleaning`]
    tasks[3].triggersNext = [`${tasks[4].bookingId}_inspection`]

    return tasks
  }

  /**
   * FLOW 2: Automatic Checkout Trigger
   * Monitor for checkout time and automatically trigger checkout process
   */
  startCheckoutMonitoring(): void {
    console.log('🔍 Starting automatic checkout monitoring...')
    
    const now = new Date()
    
    // Monitor tasks due for checkout
    const checkoutQuery = query(
      collection(getDb(), this.TASKS_COLLECTION),
      where('taskType', '==', 'checkout_process'),
      where('status', '==', 'pending'),
      where('scheduledDateTime', '<=', Timestamp.fromDate(now))
    )

    this.checkoutMonitor = onSnapshot(checkoutQuery, (snapshot) => {
      snapshot.docs.forEach(async (doc) => {
        const task = doc.data() as OperationalTask
        console.log(`🚪 Checkout time reached for booking ${task.bookingId}`)
        
        await this.triggerCheckoutProcess(task.bookingId, doc.id)
      })
    })
  }

  /**
   * Trigger the checkout process for a booking
   */
  async triggerCheckoutProcess(bookingId: string, checkoutTaskId: string): Promise<void> {
    console.log(`🚪 Triggering checkout process for booking ${bookingId}`)
    
    const batch = writeBatch(getDb())
    
    // 1. Mark booking as checked-out
    const bookingRef = doc(getDb(), this.BOOKINGS_COLLECTION, bookingId)
    batch.update(bookingRef, {
      status: 'checked_out',
      checkedOutAt: serverTimestamp(),
      checkedOutBy: 'AUTOMATIC_CHECKOUT'
    })
    
    // 2. Mark checkout task as completed
    const checkoutTaskRef = doc(getDb(), this.TASKS_COLLECTION, checkoutTaskId)
    batch.update(checkoutTaskRef, {
      status: 'completed',
      completedAt: serverTimestamp(),
      completionNotes: 'Automatic checkout triggered at scheduled time'
    })
    
    // 3. Trigger cleaning task
    const cleaningTask = await this.getNextTaskInSequence(bookingId, 'cleaning')
    if (cleaningTask) {
      const cleaningTaskRef = doc(getDb(), this.TASKS_COLLECTION, cleaningTask.id!)
      batch.update(cleaningTaskRef, {
        status: 'assigned',
        triggeredAt: serverTimestamp()
      })
      
      // 4. Notify cleaner
      await this.notifyStaff({
        type: 'task_assigned',
        recipientId: cleaningTask.assignedStaffId || '',
        recipientEmail: cleaningTask.assignedStaffEmail || '',
        title: 'Cleaning Task Assigned',
        message: `Property ${cleaningTask.propertyName} is ready for post-checkout cleaning`,
        taskId: cleaningTask.id,
        bookingId,
        urgency: 'high'
      })
    }
    
    await batch.commit()
    console.log(`✅ Checkout process completed for booking ${bookingId}`)
  }

  /**
   * FLOW 3: Cleaning Workflow Automation
   * Handle cleaning task assignment, monitoring, and completion validation
   */
  async handleCleaningWorkflow(taskId: string, taskData: OperationalTask): Promise<void> {
    console.log(`🧹 Handling cleaning workflow for task ${taskId}`)
    
    // Auto-assign to available cleaner if not assigned
    if (!taskData.assignedStaffId) {
      const cleaner = await this.findAvailableStaff(['cleaning', 'housekeeping'])
      if (cleaner) {
        await updateDoc(doc(getDb(), this.TASKS_COLLECTION, taskId), {
          assignedStaffId: cleaner.id,
          assignedStaffName: cleaner.name,
          assignedStaffEmail: cleaner.email,
          assignedAt: serverTimestamp(),
          status: 'assigned'
        })
        
        // Notify cleaner
        await this.notifyStaff({
          type: 'task_assigned',
          recipientId: cleaner.id,
          recipientEmail: cleaner.email,
          title: 'Cleaning Task Assigned',
          message: `You have been assigned to clean ${taskData.propertyName}`,
          taskId,
          bookingId: taskData.bookingId,
          urgency: 'high'
        })
        
        console.log(`👤 Assigned cleaning task to ${cleaner.name}`)
      }
    }
  }

  /**
   * Handle cleaning task completion and trigger inspection
   */
  async handleCleaningCompletion(taskId: string, completionData: {
    photosUploaded: string[]
    checklistCompleted: boolean
    completionNotes: string
  }): Promise<void> {
    console.log(`✅ Processing cleaning completion for task ${taskId}`)
    
    // Validate completion requirements
    if (!completionData.photosUploaded || completionData.photosUploaded.length === 0) {
      throw new Error('Photo upload is required for cleaning completion')
    }
    
    if (!completionData.checklistCompleted) {
      throw new Error('Cleaning checklist must be completed')
    }
    
    const batch = writeBatch(getDb())
    
    // 1. Mark cleaning task as completed
    const taskRef = doc(getDb(), this.TASKS_COLLECTION, taskId)
    batch.update(taskRef, {
      status: 'completed',
      completedAt: serverTimestamp(),
      photosUploaded: completionData.photosUploaded,
      checklistCompleted: true,
      completionNotes: completionData.completionNotes
    })
    
    // 2. Get task data to find booking
    const taskDoc = await getDocs(query(
      collection(getDb(), this.TASKS_COLLECTION),
      where('id', '==', taskId)
    ))
    
    if (!taskDoc.empty) {
      const task = taskDoc.docs[0].data() as OperationalTask
      
      // 3. Trigger inspection task
      const inspectionTask = await this.getNextTaskInSequence(task.bookingId, 'inspection')
      if (inspectionTask) {
        const inspectionTaskRef = doc(getDb(), this.TASKS_COLLECTION, inspectionTask.id!)
        batch.update(inspectionTaskRef, {
          status: 'assigned',
          triggeredAt: serverTimestamp()
        })
        
        // 4. Notify inspector
        if (inspectionTask.assignedStaffEmail) {
          await this.notifyStaff({
            type: 'task_assigned',
            recipientId: inspectionTask.assignedStaffId || '',
            recipientEmail: inspectionTask.assignedStaffEmail,
            title: 'Inspection Task Ready',
            message: `Cleaning completed for ${task.propertyName} - ready for inspection`,
            taskId: inspectionTask.id,
            bookingId: task.bookingId,
            urgency: 'medium'
          })
        }
      }
    }
    
    await batch.commit()
    console.log(`🔍 Cleaning completed, inspection triggered`)
  }

  /**
   * FLOW 4: Inspection Workflow Automation
   * Handle inspection assignment, completion, and issue resolution
   */
  async handleInspectionWorkflow(taskId: string, inspectionResult: {
    passed: boolean
    photosReviewed: boolean
    issuesFound?: {
      description: string
      severity: 'low' | 'medium' | 'high'
      requiresBlocking: boolean
    }[]
    approvalNotes: string
  }): Promise<void> {
    console.log(`🔍 Processing inspection for task ${taskId}`)
    
    const batch = writeBatch(getDb())
    const taskRef = doc(getDb(), this.TASKS_COLLECTION, taskId)
    
    if (inspectionResult.passed) {
      // Inspection passed - mark property as ready
      batch.update(taskRef, {
        status: 'approved',
        approvedAt: serverTimestamp(),
        completionNotes: inspectionResult.approvalNotes
      })
      
      // Mark booking as ready
      const taskDoc = await getDocs(query(
        collection(getDb(), this.TASKS_COLLECTION),
        where('id', '==', taskId)
      ))
      
      if (!taskDoc.empty) {
        const task = taskDoc.docs[0].data() as OperationalTask
        const bookingRef = doc(getDb(), this.BOOKINGS_COLLECTION, task.bookingId)
        batch.update(bookingRef, {
          status: 'ready',
          readyAt: serverTimestamp(),
          inspectionPassed: true
        })
        
        await this.completeBookingCycle(task.bookingId)
      }
      
      console.log(`✅ Inspection passed - property marked as ready`)
    } else {
      // Inspection failed - create maintenance tasks
      batch.update(taskRef, {
        status: 'failed',
        failedAt: serverTimestamp(),
        issuesFound: true,
        issueDescription: inspectionResult.issuesFound?.map(i => i.description).join('; '),
        resolutionRequired: true
      })
      
      // Create maintenance tasks for each issue
      if (inspectionResult.issuesFound) {
        for (const issue of inspectionResult.issuesFound) {
          await this.createMaintenanceTask(taskId, issue)
        }
      }
      
      console.log(`❌ Inspection failed - maintenance tasks created`)
    }
    
    await batch.commit()
  }

  /**
   * FLOW 5: Issue Handling & Resolution
   * Create maintenance tasks and handle calendar blocking if needed
   */
  async createMaintenanceTask(inspectionTaskId: string, issue: {
    description: string
    severity: 'low' | 'medium' | 'high'
    requiresBlocking: boolean
  }): Promise<void> {
    console.log(`🔧 Creating maintenance task for issue: ${issue.description}`)
    
    // Get inspection task data
    const inspectionDoc = await getDocs(query(
      collection(getDb(), this.TASKS_COLLECTION),
      where('id', '==', inspectionTaskId)
    ))
    
    if (inspectionDoc.empty) return
    
    const inspectionTask = inspectionDoc.docs[0].data() as OperationalTask
    
    const maintenanceTask: OperationalTask = {
      bookingId: inspectionTask.bookingId,
      propertyId: inspectionTask.propertyId,
      propertyName: inspectionTask.propertyName,
      guestName: inspectionTask.guestName,
      title: `Maintenance: ${issue.description}`,
      description: `Resolve issue found during inspection: ${issue.description}`,
      taskType: 'maintenance',
      priority: issue.severity === 'high' ? 'urgent' : issue.severity === 'medium' ? 'high' : 'medium',
      status: 'pending',
      scheduledDateTime: new Date(), // ASAP
      estimatedDuration: issue.severity === 'high' ? 240 : 120,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'INSPECTION_AUTOMATION'
    }
    
    // Save maintenance task
    await addDoc(collection(getDb(), this.TASKS_COLLECTION), maintenanceTask)
    
    // Block calendar if issue requires it
    if (issue.requiresBlocking) {
      await this.blockPropertyCalendar(inspectionTask.propertyId, issue.description)
    }
    
    // Notify management
    await this.notifyStaff({
      type: 'issue_found',
      recipientId: 'management',
      recipientEmail: 'management@siamoon.com',
      title: 'Property Issue Requires Attention',
      message: `Issue found at ${inspectionTask.propertyName}: ${issue.description}`,
      urgency: issue.severity === 'high' ? 'urgent' : 'high',
      bookingId: inspectionTask.bookingId,
      metadata: { severity: issue.severity, requiresBlocking: issue.requiresBlocking }
    })
  }

  /**
   * Complete the booking operational cycle
   */
  async completeBookingCycle(bookingId: string): Promise<void> {
    console.log(`🎉 Completing booking cycle for ${bookingId}`)
    
    // Update timeline
    const timelineQuery = query(
      collection(getDb(), this.TIMELINES_COLLECTION),
      where('bookingId', '==', bookingId)
    )
    
    const timelineSnapshot = await getDocs(timelineQuery)
    if (!timelineSnapshot.empty) {
      const timelineRef = timelineSnapshot.docs[0].ref
      await updateDoc(timelineRef, {
        currentPhase: 'ready',
        completionPercentage: 100,
        actualReadyTime: serverTimestamp(),
        completedAt: serverTimestamp()
      })
    }
    
    // Notify management of completion
    await this.notifyStaff({
      type: 'timeline_complete',
      recipientId: 'management',
      recipientEmail: 'management@siamoon.com', 
      title: 'Property Operational Cycle Complete',
      message: `Booking ${bookingId} has completed all operational tasks and is ready for next guest`,
      urgency: 'low',
      bookingId
    })
    
    console.log(`✅ Booking cycle complete - property ready for next guest`)
  }

  /**
   * Utility: Find available staff by skills
   */
  private async findAvailableStaff(requiredSkills: string[]): Promise<any> {
    const staffQuery = query(
      collection(getDb(), this.STAFF_COLLECTION),
      where('status', '==', 'active')
    )
    
    const snapshot = await getDocs(staffQuery)
    const availableStaff: any[] = []
    
    snapshot.forEach((doc) => {
      const staff = doc.data()
      // Simple skill matching - in production, implement more sophisticated matching
      if (staff.skills && staff.skills.some((skill: string) => requiredSkills.includes(skill))) {
        availableStaff.push({ id: doc.id, ...staff })
      }
    })
    
    return availableStaff.length > 0 ? availableStaff[0] : null
  }

  /**
   * Utility: Get next task in sequence
   */
  private async getNextTaskInSequence(bookingId: string, taskType: TaskType): Promise<OperationalTask | null> {
    const taskQuery = query(
      collection(getDb(), this.TASKS_COLLECTION),
      where('bookingId', '==', bookingId),
      where('taskType', '==', taskType)
    )
    
    const snapshot = await getDocs(taskQuery)
    return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as OperationalTask
  }

  /**
   * Utility: Send notifications to staff
   */
  private async notifyStaff(notification: NotificationPayload): Promise<void> {
    try {
      await addDoc(collection(getDb(), this.NOTIFICATIONS_COLLECTION), {
        ...notification,
        createdAt: serverTimestamp(),
        read: false
      })
      
      console.log(`📬 Notification sent to ${notification.recipientEmail}: ${notification.title}`)
    } catch (error) {
      console.error('❌ Error sending notification:', error)
    }
  }

  /**
   * Utility: Block property calendar for maintenance
   */
  private async blockPropertyCalendar(propertyId: string, reason: string): Promise<void> {
    // This would integrate with your CalendarAvailabilityService
    console.log(`🚫 Calendar blocked for property ${propertyId}: ${reason}`)
    // Implementation depends on your calendar blocking service
  }

  /**
   * Start monitoring a specific booking timeline
   */
  private startTimelineMonitoring(bookingId: string): void {
    const tasksQuery = query(
      collection(getDb(), this.TASKS_COLLECTION),
      where('bookingId', '==', bookingId),
      orderBy('scheduledDateTime')
    )

    const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
      // Monitor task status changes and trigger next steps
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const task = { id: change.doc.id, ...change.doc.data() } as OperationalTask
          this.handleTaskStatusChange(task)
        }
      })
    })

    this.timelineListeners.set(bookingId, unsubscribe)
  }

  /**
   * Handle task status changes and trigger workflow automation
   */
  private async handleTaskStatusChange(task: OperationalTask): Promise<void> {
    switch (task.taskType) {
      case 'cleaning':
        if (task.status === 'in_progress') {
          await this.handleCleaningWorkflow(task.id!, task)
        }
        break
      
      case 'inspection':
        if (task.status === 'completed') {
          // Inspection completion is handled by the inspector via UI
        }
        break
        
      case 'checkout_process':
        if (task.status === 'pending' && new Date() >= task.scheduledDateTime) {
          await this.triggerCheckoutProcess(task.bookingId, task.id!)
        }
        break
    }
  }

  /**
   * Stop all monitoring
   */
  stopAllMonitoring(): void {
    if (this.checkoutMonitor) {
      this.checkoutMonitor()
      this.checkoutMonitor = null
    }
    
    this.timelineListeners.forEach(unsubscribe => unsubscribe())
    this.timelineListeners.clear()
    
    console.log('🔄 Operations monitoring stopped')
  }
}

// Export singleton
export const operationsAutomationService = new OperationsAutomationService()
export default operationsAutomationService
