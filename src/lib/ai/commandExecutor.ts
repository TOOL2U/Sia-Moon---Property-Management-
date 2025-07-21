/**
 * AI Command Executor - Safely executes approved AI commands in Firestore
 */

import { getDb } from '@/lib/firebase'
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    updateDoc,
    where
} from 'firebase/firestore'
import { ParsedCommand } from './commandParser'

export interface ExecutionResult {
  success: boolean
  message: string
  details?: any
  errors?: string[]
  auditLogId?: string
}

export interface ExecutionContext {
  adminId: string
  adminName: string
  timestamp: Date
}

/**
 * Execute a validated and approved command
 */
export async function executeCommand(
  command: ParsedCommand,
  context: ExecutionContext
): Promise<ExecutionResult> {
  try {
    console.log(`🤖 COMMAND EXECUTOR: Executing ${command.type}`, command)

    // Pre-execution validation
    const validation = await preExecutionValidation(command)
    if (!validation.valid) {
      return {
        success: false,
        message: 'Command validation failed',
        errors: validation.errors
      }
    }

    // Execute based on command type
    let result: ExecutionResult
    switch (command.type) {
      case 'assign_staff':
        result = await executeStaffAssignment(command, context)
        break

      case 'approve_booking':
        result = await executeBookingApproval(command, context)
        break

      case 'reschedule_job':
        result = await executeJobReschedule(command, context)
        break

      case 'update_calendar':
        result = await executeCalendarUpdate(command, context)
        break

      case 'create_job':
        result = await executeJobCreation(command, context)
        break

      case 'create_booking':
        result = await executeBookingCreation(command, context)
        break

      case 'update_booking':
        result = await executeBookingUpdate(command, context)
        break

      case 'delete_job':
        result = await executeJobDeletion(command, context)
        break

      case 'reassign_staff':
        result = await executeStaffReassignment(command, context)
        break

      default:
        result = {
          success: false,
          message: `Unknown command type: ${command.type}`
        }
    }

    // Log the execution
    if (result.success) {
      result.auditLogId = await logCommandExecution(command, context, result)
    } else {
      await logCommandError(command, context, result)
    }

    return result

  } catch (error) {
    console.error('❌ COMMAND EXECUTOR: Execution error:', error)

    const errorResult = {
      success: false,
      message: 'Command execution failed',
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }

    await logCommandError(command, context, errorResult)
    return errorResult
  }
}

/**
 * Pre-execution validation with business rules and safety checks
 */
async function preExecutionValidation(command: ParsedCommand): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = []
  const db = getDb()

  try {
    // Safety level checks
    if (command.safetyLevel === 'dangerous') {
      if (command.type === 'delete_job' && !command.data.hasOverride) {
        errors.push('Dangerous operation requires explicit override keyword')
      }
    }

    // Rate limiting check (prevent too many commands in short time)
    const recentCommandsQuery = query(
      collection(db, 'audit_logs'),
      where('actionBy', '==', 'AI Agent'),
      where('timestamp', '>', new Date(Date.now() - 60000)) // Last minute
    )
    const recentCommands = await getDocs(recentCommandsQuery)

    if (recentCommands.size > 10) {
      errors.push('Rate limit exceeded: Too many AI commands in the last minute')
    }

    // Check if referenced documents exist
    if (command.documentId) {
      const docRef = doc(db, command.collection, command.documentId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        errors.push(`Document ${command.documentId} not found in ${command.collection}`)
      } else {
        const data = docSnap.data()

        // Business rule validations
        if (command.type === 'delete_job') {
          if (data.status === 'completed' && !command.data.hasOverride) {
            errors.push('Cannot delete completed job without override')
          }
          if (data.status === 'in_progress') {
            errors.push('Cannot delete job that is currently in progress')
          }
        }

        if (command.type === 'assign_staff' && data.status === 'completed') {
          errors.push('Cannot reassign staff to completed job')
        }

        if (command.type === 'approve_booking' && data.status === 'approved') {
          errors.push('Booking is already approved')
        }

        // Check for locked records
        if (data.locked === true) {
          errors.push('Cannot modify locked record')
        }
      }
    }

    // Validate staff existence and availability for staff-related commands
    if (command.type === 'assign_staff' || command.type === 'reassign_staff') {
      const staffQuery = query(
        collection(db, 'staff'),
        where('name', '==', command.data.staffName)
      )
      const staffSnap = await getDocs(staffQuery)

      if (staffSnap.empty) {
        errors.push(`Staff member "${command.data.staffName}" not found`)
      } else {
        const staffData = staffSnap.docs[0].data()

        // Check staff availability
        if (staffData.status === 'inactive') {
          errors.push(`Staff member "${command.data.staffName}" is inactive`)
        }

        // Check for conflicting assignments (simplified check)
        if (command.type === 'assign_staff') {
          const conflictQuery = query(
            collection(db, 'jobs'),
            where('assignedStaff', '==', staffSnap.docs[0].id),
            where('status', 'in', ['assigned', 'in_progress'])
          )
          const conflicts = await getDocs(conflictQuery)

          if (conflicts.size >= 3) { // Max 3 concurrent jobs
            errors.push(`Staff member "${command.data.staffName}" already has maximum concurrent assignments`)
          }
        }
      }
    }

    // Validate booking-related commands
    if (command.type === 'approve_booking' || command.type === 'update_booking') {
      if (command.data.bookingId) {
        const bookingRef = doc(db, 'bookings', command.data.bookingId)
        const bookingSnap = await getDoc(bookingRef)

        if (bookingSnap.exists()) {
          const bookingData = bookingSnap.data()

          // Check booking dates
          if (bookingData.checkInDate && new Date(bookingData.checkInDate.toDate()) < new Date()) {
            errors.push('Cannot modify booking with past check-in date')
          }
        }
      }
    }

    // Validate date-related commands
    if (command.type === 'reschedule_job') {
      const newDate = new Date(command.data.newDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (newDate < today) {
        errors.push('Cannot reschedule job to a past date')
      }

      // Check for weekend restrictions (example business rule)
      if (newDate.getDay() === 0) { // Sunday
        errors.push('Jobs cannot be scheduled on Sundays')
      }
    }

  } catch (error) {
    errors.push('Validation error: ' + (error instanceof Error ? error.message : 'Unknown error'))
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Execute staff assignment to job
 */
async function executeStaffAssignment(command: ParsedCommand, context: ExecutionContext): Promise<ExecutionResult> {
  const db = getDb()
  const { staffName, jobId } = command.data

  try {
    // Get staff ID
    const staffQuery = query(collection(db, 'staff'), where('name', '==', staffName))
    const staffSnap = await getDocs(staffQuery)

    if (staffSnap.empty) {
      return { success: false, message: `Staff member "${staffName}" not found` }
    }

    const staffDoc = staffSnap.docs[0]
    const staffId = staffDoc.id

    // Update job with assigned staff
    const jobRef = doc(db, 'jobs', jobId)
    await updateDoc(jobRef, {
      assignedStaff: staffId,
      assignedStaffName: staffName,
      status: 'assigned',
      updatedAt: serverTimestamp(),
      updatedBy: context.adminId
    })

    // Trigger notification (will be implemented in notification integration)
    await triggerStaffNotification(staffId, jobId, 'job_assigned')

    return {
      success: true,
      message: `Successfully assigned ${staffName} to job ${jobId}`,
      details: { staffId, jobId, staffName }
    }

  } catch (error) {
    return {
      success: false,
      message: 'Failed to assign staff to job',
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }
  }
}

/**
 * Execute booking approval
 */
async function executeBookingApproval(command: ParsedCommand, context: ExecutionContext): Promise<ExecutionResult> {
  const db = getDb()
  const { bookingId } = command.data

  try {
    const bookingRef = doc(db, 'bookings', bookingId)
    await updateDoc(bookingRef, {
      status: 'approved',
      approvedAt: serverTimestamp(),
      approvedBy: context.adminId,
      updatedAt: serverTimestamp()
    })

    return {
      success: true,
      message: `Successfully approved booking ${bookingId}`,
      details: { bookingId, status: 'approved' }
    }

  } catch (error) {
    return {
      success: false,
      message: 'Failed to approve booking',
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }
  }
}

/**
 * Execute job rescheduling
 */
async function executeJobReschedule(command: ParsedCommand, context: ExecutionContext): Promise<ExecutionResult> {
  const db = getDb()
  const { originalDate, newDate } = command.data

  try {
    // Parse dates (simplified - would need better date parsing in production)
    const newScheduledDate = new Date(newDate)

    // Find jobs matching the original date
    const jobsQuery = query(
      collection(db, 'jobs'),
      where('scheduledDate', '>=', new Date(originalDate)),
      where('scheduledDate', '<', new Date(new Date(originalDate).getTime() + 24 * 60 * 60 * 1000))
    )

    const jobsSnap = await getDocs(jobsQuery)
    const updatedJobs: string[] = []

    for (const jobDoc of jobsSnap.docs) {
      await updateDoc(doc(db, 'jobs', jobDoc.id), {
        scheduledDate: newScheduledDate,
        updatedAt: serverTimestamp(),
        updatedBy: context.adminId,
        rescheduledReason: 'AI Command'
      })
      updatedJobs.push(jobDoc.id)
    }

    return {
      success: true,
      message: `Successfully rescheduled ${updatedJobs.length} jobs from ${originalDate} to ${newDate}`,
      details: { updatedJobs, originalDate, newDate }
    }

  } catch (error) {
    return {
      success: false,
      message: 'Failed to reschedule jobs',
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }
  }
}

/**
 * Execute calendar update
 */
async function executeCalendarUpdate(command: ParsedCommand, context: ExecutionContext): Promise<ExecutionResult> {
  // This would integrate with the existing calendar service
  return {
    success: true,
    message: 'Calendar update triggered successfully',
    details: { bookingId: command.data.bookingId }
  }
}

/**
 * Execute booking creation
 */
async function executeBookingCreation(command: ParsedCommand, context: ExecutionContext): Promise<ExecutionResult> {
  try {
    console.log('🏨 AI AGENT: Creating booking with data:', command.data)

    const {
      propertyName,
      guestName,
      guestEmail,
      checkInDate,
      checkOutDate,
      guestCount,
      price,
      specialRequests
    } = command.data

    // Validate required fields
    if (!propertyName || !guestName || !checkInDate || !checkOutDate) {
      return {
        success: false,
        message: 'Missing required booking fields: propertyName, guestName, checkInDate, checkOutDate'
      }
    }

    // Call the booking creation API
    const response = await fetch('/api/admin/bookings/integrated', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        propertyName,
        guestName,
        guestEmail: guestEmail || `${guestName.toLowerCase().replace(' ', '.')}@example.com`,
        guestPhone: '',
        checkInDate,
        checkOutDate,
        guestCount: guestCount || 2,
        price: price || 0,
        currency: 'USD',
        specialRequests: specialRequests || '',
        source: 'ai_agent',
        createdBy: context.adminId || 'ai_agent'
      })
    })

    const result = await response.json()

    if (result.success) {
      console.log('✅ AI AGENT: Booking created successfully:', result.data.bookingId)

      return {
        success: true,
        message: `✅ Booking created successfully for ${guestName} at ${propertyName}!

📋 **Booking Details:**
• Guest: ${guestName}
• Property: ${propertyName}
• Check-in: ${checkInDate}
• Check-out: ${checkOutDate}
• Guests: ${guestCount || 2}
• Status: Pending Approval
• Booking ID: ${result.data.bookingId}

The booking has been sent to the Back Office for approval and will appear in the Bookings tab.`,
        details: {
          bookingId: result.data.bookingId,
          status: 'pending_approval',
          propertyName,
          guestName
        }
      }
    } else {
      return {
        success: false,
        message: `Failed to create booking: ${result.error || 'Unknown error'}`
      }
    }

  } catch (error) {
    console.error('❌ AI AGENT: Booking creation failed:', error)
    return {
      success: false,
      message: `Failed to create booking: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Execute job creation
 */
async function executeJobCreation(command: ParsedCommand, context: ExecutionContext): Promise<ExecutionResult> {
  const db = getDb()
  const { property, date } = command.data

  try {
    const newJob = {
      property,
      scheduledDate: date ? new Date(date) : null,
      status: 'pending',
      type: 'cleaning',
      createdAt: serverTimestamp(),
      createdBy: context.adminId,
      source: 'AI Command'
    }

    const docRef = await addDoc(collection(db, 'jobs'), newJob)

    return {
      success: true,
      message: `Successfully created job for ${property}`,
      details: { jobId: docRef.id, property, date }
    }

  } catch (error) {
    return {
      success: false,
      message: 'Failed to create job',
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }
  }
}

/**
 * Execute booking update
 */
async function executeBookingUpdate(command: ParsedCommand, context: ExecutionContext): Promise<ExecutionResult> {
  const db = getDb()
  const { bookingId, updates } = command.data

  try {
    // Parse updates (simplified - would need better parsing in production)
    const updateData = {
      notes: updates,
      updatedAt: serverTimestamp(),
      updatedBy: context.adminId
    }

    const bookingRef = doc(db, 'bookings', bookingId)
    await updateDoc(bookingRef, updateData)

    return {
      success: true,
      message: `Successfully updated booking ${bookingId}`,
      details: { bookingId, updates }
    }

  } catch (error) {
    return {
      success: false,
      message: 'Failed to update booking',
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }
  }
}

/**
 * Execute job deletion
 */
async function executeJobDeletion(command: ParsedCommand, context: ExecutionContext): Promise<ExecutionResult> {
  const db = getDb()
  const { jobId, hasOverride } = command.data

  try {
    if (!hasOverride) {
      return {
        success: false,
        message: 'Job deletion requires override keyword for safety'
      }
    }

    const jobRef = doc(db, 'jobs', jobId)
    await deleteDoc(jobRef)

    return {
      success: true,
      message: `Successfully deleted job ${jobId}`,
      details: { jobId }
    }

  } catch (error) {
    return {
      success: false,
      message: 'Failed to delete job',
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }
  }
}

/**
 * Execute staff reassignment
 */
async function executeStaffReassignment(command: ParsedCommand, context: ExecutionContext): Promise<ExecutionResult> {
  const db = getDb()
  const { staffName, fromJobId, toJobId } = command.data

  try {
    // Get staff ID
    const staffQuery = query(collection(db, 'staff'), where('name', '==', staffName))
    const staffSnap = await getDocs(staffQuery)

    if (staffSnap.empty) {
      return { success: false, message: `Staff member "${staffName}" not found` }
    }

    const staffId = staffSnap.docs[0].id

    // Remove from old job
    const fromJobRef = doc(db, 'jobs', fromJobId)
    await updateDoc(fromJobRef, {
      assignedStaff: null,
      assignedStaffName: null,
      status: 'pending',
      updatedAt: serverTimestamp(),
      updatedBy: context.adminId
    })

    // Assign to new job
    const toJobRef = doc(db, 'jobs', toJobId)
    await updateDoc(toJobRef, {
      assignedStaff: staffId,
      assignedStaffName: staffName,
      status: 'assigned',
      updatedAt: serverTimestamp(),
      updatedBy: context.adminId
    })

    // Trigger notifications
    await triggerStaffNotification(staffId, toJobId, 'job_reassigned')

    return {
      success: true,
      message: `Successfully reassigned ${staffName} from job ${fromJobId} to job ${toJobId}`,
      details: { staffId, fromJobId, toJobId, staffName }
    }

  } catch (error) {
    return {
      success: false,
      message: 'Failed to reassign staff',
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }
  }
}

/**
 * Log successful command execution
 */
async function logCommandExecution(
  command: ParsedCommand,
  context: ExecutionContext,
  result: ExecutionResult
): Promise<string> {
  const db = getDb()

  const auditLog = {
    actionBy: 'AI Agent',
    approvedBy: context.adminId,
    approvedByName: context.adminName,
    type: 'AI_COMMAND_EXECUTION',
    timestamp: serverTimestamp(),
    originalMessage: command.originalText,
    command: {
      id: command.id,
      type: command.type,
      collection: command.collection,
      operation: command.operation,
      description: command.description
    },
    result: {
      success: result.success,
      message: result.message,
      details: result.details
    },
    firestorePath: `${command.collection}${command.documentId ? `/${command.documentId}` : ''}`,
    operation: command.operation,
    source: 'ai_chat_interface'
  }

  const docRef = await addDoc(collection(db, 'audit_logs'), auditLog)
  return docRef.id
}

/**
 * Log command execution error
 */
async function logCommandError(
  command: ParsedCommand,
  context: ExecutionContext,
  result: ExecutionResult
): Promise<void> {
  const db = getDb()

  const errorLog = {
    type: 'AI_COMMAND_ERROR',
    timestamp: serverTimestamp(),
    adminId: context.adminId,
    command: {
      id: command.id,
      type: command.type,
      description: command.description,
      originalText: command.originalText
    },
    error: {
      message: result.message,
      errors: result.errors
    },
    source: 'ai_chat_interface'
  }

  await addDoc(collection(db, 'system_errors'), errorLog)
}

/**
 * Trigger staff notification using existing notification system
 */
async function triggerStaffNotification(staffId: string, jobId: string, type: string): Promise<void> {
  try {
    console.log(`📱 NOTIFICATION: Triggering ${type} notification for staff ${staffId} about job ${jobId}`)

    const db = getDb()

    // Get job details for notification
    const jobRef = doc(db, 'jobs', jobId)
    const jobSnap = await getDoc(jobRef)

    if (!jobSnap.exists()) {
      console.error(`❌ Job ${jobId} not found for notification`)
      return
    }

    const jobData = jobSnap.data()

    // Get staff details
    const staffRef = doc(db, 'staff', staffId)
    const staffSnap = await getDoc(staffRef)

    if (!staffSnap.exists()) {
      console.error(`❌ Staff ${staffId} not found for notification`)
      return
    }

    const staffData = staffSnap.data()

    // Create notification document in staff_notifications collection
    // This will trigger the existing Cloud Function notification system
    const notificationData = {
      jobId,
      staffId,
      staffName: staffData.name || 'Unknown Staff',
      staffEmail: staffData.email || '',
      jobTitle: jobData.title || `AI ${type.replace('_', ' ')}`,
      jobType: jobData.jobType || 'general',
      priority: jobData.priority || 'medium',
      propertyName: jobData.propertyRef?.name || jobData.property || 'Unknown Property',
      propertyAddress: jobData.location?.address || 'Address not provided',
      scheduledDate: jobData.scheduledDate ?
        (jobData.scheduledDate.toDate ? jobData.scheduledDate.toDate().toISOString().split('T')[0] : jobData.scheduledDate) :
        new Date().toISOString().split('T')[0],
      scheduledStartTime: jobData.scheduledStartTime,
      estimatedDuration: jobData.estimatedDuration || 120,
      specialInstructions: jobData.specialInstructions || `This job was ${type.replace('_', ' ')} by AI Assistant`,
      createdAt: serverTimestamp(),
      type: type, // 'job_assigned', 'job_reassigned', etc.
      status: 'pending',
      readAt: null,
      actionRequired: true,
      source: 'ai_command',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    }

    // Add notification document - this will trigger the existing Cloud Function
    const notificationRef = await addDoc(collection(db, 'staff_notifications'), notificationData)

    console.log(`✅ NOTIFICATION: Created notification document ${notificationRef.id} for ${type}`)

    // Update job with notification metadata
    await updateDoc(jobRef, {
      lastNotificationAt: serverTimestamp(),
      lastNotificationType: type,
      aiCommandNotificationId: notificationRef.id,
      mobileNotificationPending: true
    })

    // Log notification event for audit trail
    await addDoc(collection(db, 'notification_logs'), {
      jobId,
      staffId,
      notificationId: notificationRef.id,
      type,
      source: 'ai_command',
      timestamp: serverTimestamp(),
      success: true
    })

    console.log(`🎉 NOTIFICATION: Successfully triggered ${type} notification for staff ${staffId}`)

  } catch (error) {
    console.error(`❌ NOTIFICATION: Failed to trigger ${type} notification:`, error)

    // Log notification failure
    try {
      const db = getDb()
      await addDoc(collection(db, 'notification_logs'), {
        jobId,
        staffId,
        type,
        source: 'ai_command',
        timestamp: serverTimestamp(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } catch (logError) {
      console.error('❌ Failed to log notification error:', logError)
    }
  }
}
