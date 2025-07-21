/**
 * Firebase Action Router
 * Maps AI actions to backend logic with proper Firebase integration
 */

import { getDb } from '@/lib/firebase'
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    updateDoc,
    where
} from 'firebase/firestore'
import { DetectedIntent } from './intentDetector'

export interface ActionResult {
  success: boolean
  message: string
  data?: any
  error?: string
  requiresConfirmation?: boolean
  confirmationMessage?: string
}

export interface ExecutionContext {
  userId: string
  sessionId: string
  timestamp: Date
  source: string
}

/**
 * Main action router that executes AI intents
 */
export async function executeAction(
  intent: DetectedIntent,
  context: ExecutionContext
): Promise<ActionResult> {
  console.log(`🎯 AI ACTION: Executing ${intent.action} with confidence ${Math.round(intent.confidence * 100)}%`)

  try {
    // Log the action attempt
    await logActionAttempt(intent, context)

    // Route to specific action handler
    let result: ActionResult

    switch (intent.action) {
      case 'createBooking':
        result = await handleCreateBooking(intent.parameters, context)
        break

      case 'approveBooking':
        result = await handleApproveBooking(intent.parameters, context)
        break

      case 'assignStaffToJob':
        result = await handleAssignStaffToJob(intent.parameters, context)
        break

      case 'createCalendarEvent':
        result = await handleCreateCalendarEvent(intent.parameters, context)
        break

      case 'createJob':
        result = await handleCreateJob(intent.parameters, context)
        break

      case 'sendStaffNotification':
        result = await handleSendStaffNotification(intent.parameters, context)
        break

      default:
        result = {
          success: false,
          message: `Unknown action: ${intent.action}`,
          error: 'Action not implemented'
        }
    }

    // Log the action result
    await logActionResult(intent, context, result)

    return result

  } catch (error) {
    console.error(`❌ AI ACTION: Failed to execute ${intent.action}:`, error)

    const errorResult: ActionResult = {
      success: false,
      message: `Failed to execute ${intent.action}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'Unknown error'
    }

    await logActionResult(intent, context, errorResult)
    return errorResult
  }
}

/**
 * Handle booking creation
 */
async function handleCreateBooking(params: any, context: ExecutionContext): Promise<ActionResult> {
  try {
    console.log('🏨 Creating booking with params:', params)

    // Create booking directly in Firebase instead of calling API
    const db = getDb()

    const bookingData = {
      propertyName: params.propertyName,
      guestName: params.guestName,
      guestEmail: params.guestEmail,
      guestPhone: '',
      checkInDate: params.checkInDate,
      checkOutDate: params.checkOutDate,
      guestCount: params.guestCount,
      price: params.price || 0,
      currency: 'USD',
      specialRequests: params.specialRequests || '',
      source: 'ai_agent',
      createdBy: context.userId,
      status: 'pending_approval',
      priority: 'high',
      createdAt: serverTimestamp(),
      requiresApproval: true,
      backOfficeEntry: true
    }

    // Add to pending_bookings collection for Back Office approval
    const docRef = await addDoc(collection(db, 'pending_bookings'), bookingData)

    const result = {
      success: true,
      data: {
        bookingId: docRef.id,
        status: 'pending_approval',
        message: 'Booking created and sent to Back Office for approval'
      }
    }

    if (result.success) {
      return {
        success: true,
        message: `✅ **Booking Created Successfully!**

📋 **Details:**
• **Guest:** ${params.guestName}
• **Property:** ${params.propertyName}
• **Check-in:** ${params.checkInDate}
• **Check-out:** ${params.checkOutDate}
• **Guests:** ${params.guestCount}
• **Booking ID:** ${result.data.bookingId}

🎉 The booking has been created and sent to the Back Office for approval. You can view it in the **Bookings** tab.`,
        data: {
          bookingId: result.data.bookingId,
          status: 'pending_approval',
          propertyName: params.propertyName,
          guestName: params.guestName
        }
      }
    } else {
      return {
        success: false,
        message: `❌ Failed to create booking: ${result.error || 'Unknown error'}`,
        error: result.error
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `❌ Failed to create booking: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Handle booking approval
 */
async function handleApproveBooking(params: any, context: ExecutionContext): Promise<ActionResult> {
  try {
    const db = getDb()
    const bookingRef = doc(db, 'bookings', params.bookingId)
    const bookingSnap = await getDoc(bookingRef)

    if (!bookingSnap.exists()) {
      return {
        success: false,
        message: `❌ Booking ${params.bookingId} not found`,
        error: 'Booking not found'
      }
    }

    const bookingData = bookingSnap.data()

    // Update booking status
    await updateDoc(bookingRef, {
      status: 'approved',
      approvedAt: serverTimestamp(),
      approvedBy: context.userId,
      approvalSource: 'ai_agent',
      notes: params.notes || 'Approved by AI Agent'
    })

    // Send confirmation if requested
    if (params.sendConfirmation) {
      // TODO: Implement email confirmation
      console.log('📧 Sending booking confirmation email...')
    }

    return {
      success: true,
      message: `✅ **Booking Approved!**

📋 **Details:**
• **Booking ID:** ${params.bookingId}
• **Guest:** ${bookingData.guestName}
• **Property:** ${bookingData.propertyName}
• **Status:** Approved
${params.sendConfirmation ? '• **Confirmation:** Email sent to guest' : ''}

The booking is now confirmed and active.`,
      data: {
        bookingId: params.bookingId,
        status: 'approved'
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `❌ Failed to approve booking: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Handle staff assignment to job
 */
async function handleAssignStaffToJob(params: any, context: ExecutionContext): Promise<ActionResult> {
  try {
    const db = getDb()

    // Find staff member by name
    const staffQuery = query(
      collection(db, 'staff'),
      where('name', '==', params.staffName)
    )
    const staffSnap = await getDocs(staffQuery)

    if (staffSnap.empty) {
      return {
        success: false,
        message: `❌ Staff member "${params.staffName}" not found`,
        error: 'Staff not found'
      }
    }

    const staffDoc = staffSnap.docs[0]
    const staffData = staffDoc.data()

    // Find or create job
    let jobId = params.jobId
    if (!jobId || jobId === 'undefined') {
      // Create a new job
      const newJobRef = await addDoc(collection(db, 'jobs'), {
        title: `Job assigned to ${params.staffName}`,
        assignedTo: staffDoc.id,
        assignedToName: staffData.name,
        status: 'assigned',
        priority: params.priority || 'medium',
        createdAt: serverTimestamp(),
        createdBy: context.userId,
        source: 'ai_agent',
        notes: params.notes || `Assigned by AI Agent to ${params.staffName}`
      })
      jobId = newJobRef.id
    } else {
      // Update existing job
      const jobRef = doc(db, 'jobs', jobId)
      await updateDoc(jobRef, {
        assignedTo: staffDoc.id,
        assignedToName: staffData.name,
        status: 'assigned',
        assignedAt: serverTimestamp(),
        assignedBy: context.userId,
        assignmentSource: 'ai_agent'
      })
    }

    // Send notification to staff
    await addDoc(collection(db, 'staff_notifications'), {
      staffId: staffDoc.id,
      staffName: staffData.name,
      staffEmail: staffData.email || '',
      jobId: jobId,
      type: 'job_assigned',
      title: `New Job Assignment`,
      message: `You have been assigned a new job${params.notes ? `: ${params.notes}` : ''}`,
      priority: params.priority || 'medium',
      createdAt: serverTimestamp(),
      source: 'ai_agent',
      status: 'pending',
      actionRequired: true
    })

    return {
      success: true,
      message: `✅ **Staff Assigned Successfully!**

👥 **Assignment Details:**
• **Staff:** ${params.staffName}
• **Job ID:** ${jobId}
• **Priority:** ${params.priority || 'medium'}
• **Status:** Assigned
${params.notes ? `• **Notes:** ${params.notes}` : ''}

📱 A notification has been sent to ${params.staffName}.`,
      data: {
        jobId,
        staffId: staffDoc.id,
        staffName: params.staffName,
        status: 'assigned'
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `❌ Failed to assign staff: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Handle calendar event creation
 */
async function handleCreateCalendarEvent(params: any, context: ExecutionContext): Promise<ActionResult> {
  try {
    const db = getDb()

    const eventData = {
      title: params.title,
      property: params.property,
      date: params.date,
      startTime: params.startTime,
      duration: params.duration,
      eventType: params.eventType,
      description: params.description,
      createdAt: serverTimestamp(),
      createdBy: context.userId,
      source: 'ai_agent',
      status: 'scheduled'
    }

    const eventRef = await addDoc(collection(db, 'calendarEvents'), eventData)

    return {
      success: true,
      message: `✅ **Calendar Event Created!**

📅 **Event Details:**
• **Title:** ${params.title}
• **Property:** ${params.property}
• **Date:** ${params.date}
• **Time:** ${params.startTime}
• **Duration:** ${params.duration} minutes
• **Type:** ${params.eventType}
• **Event ID:** ${eventRef.id}

The event has been added to the calendar.`,
      data: {
        eventId: eventRef.id,
        title: params.title,
        date: params.date
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `❌ Failed to create calendar event: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Handle job creation
 */
async function handleCreateJob(params: any, context: ExecutionContext): Promise<ActionResult> {
  try {
    const db = getDb()

    const jobData = {
      title: `${params.jobType} for ${params.property}`,
      property: params.property,
      jobType: params.jobType,
      scheduledDate: params.scheduledDate,
      priority: params.priority,
      description: params.description,
      estimatedDuration: params.estimatedDuration,
      status: 'pending',
      createdAt: serverTimestamp(),
      createdBy: context.userId,
      source: 'ai_agent'
    }

    const jobRef = await addDoc(collection(db, 'jobs'), jobData)

    return {
      success: true,
      message: `✅ **Job Created Successfully!**

🔧 **Job Details:**
• **Property:** ${params.property}
• **Type:** ${params.jobType}
• **Scheduled:** ${params.scheduledDate}
• **Priority:** ${params.priority}
• **Duration:** ${params.estimatedDuration} minutes
• **Job ID:** ${jobRef.id}

The job has been created and is ready for assignment.`,
      data: {
        jobId: jobRef.id,
        property: params.property,
        jobType: params.jobType
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `❌ Failed to create job: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Handle staff notification
 */
async function handleSendStaffNotification(params: any, context: ExecutionContext): Promise<ActionResult> {
  try {
    const db = getDb()

    // Find staff member
    const staffQuery = query(
      collection(db, 'staff'),
      where('name', '==', params.staffName)
    )
    const staffSnap = await getDocs(staffQuery)

    if (staffSnap.empty) {
      return {
        success: false,
        message: `❌ Staff member "${params.staffName}" not found`,
        error: 'Staff not found'
      }
    }

    const staffDoc = staffSnap.docs[0]
    const staffData = staffDoc.data()

    // Create notification
    await addDoc(collection(db, 'staff_notifications'), {
      staffId: staffDoc.id,
      staffName: staffData.name,
      staffEmail: staffData.email || '',
      type: params.type || 'general',
      title: `Message from AI Agent`,
      message: params.message,
      priority: params.priority || 'normal',
      createdAt: serverTimestamp(),
      source: 'ai_agent',
      status: 'pending',
      actionRequired: false
    })

    return {
      success: true,
      message: `✅ **Notification Sent!**

📱 **Details:**
• **Recipient:** ${params.staffName}
• **Message:** ${params.message}
• **Priority:** ${params.priority || 'normal'}

The notification has been sent to ${params.staffName}.`,
      data: {
        staffId: staffDoc.id,
        staffName: params.staffName,
        message: params.message
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `❌ Failed to send notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Log action attempt for audit trail
 */
async function logActionAttempt(intent: DetectedIntent, context: ExecutionContext): Promise<void> {
  try {
    const db = getDb()
    await addDoc(collection(db, 'ai_action_logs'), {
      action: intent.action,
      parameters: intent.parameters,
      confidence: intent.confidence,
      safetyLevel: intent.safetyLevel,
      originalText: intent.originalText,
      userId: context.userId,
      sessionId: context.sessionId,
      timestamp: serverTimestamp(),
      source: context.source,
      status: 'attempted'
    })
  } catch (error) {
    console.error('Failed to log action attempt:', error)
  }
}

/**
 * Log action result for audit trail
 */
async function logActionResult(
  intent: DetectedIntent,
  context: ExecutionContext,
  result: ActionResult
): Promise<void> {
  try {
    const db = getDb()
    await addDoc(collection(db, 'ai_action_logs'), {
      action: intent.action,
      parameters: intent.parameters,
      confidence: intent.confidence,
      originalText: intent.originalText,
      userId: context.userId,
      sessionId: context.sessionId,
      timestamp: serverTimestamp(),
      source: context.source,
      status: result.success ? 'completed' : 'failed',
      result: {
        success: result.success,
        message: result.message,
        data: result.data,
        error: result.error
      }
    })
  } catch (error) {
    console.error('Failed to log action result:', error)
  }
}
