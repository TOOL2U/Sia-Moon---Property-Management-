/**
 * 🔔 Notification Service
 * 
 * Handles all notification triggers for live mode operation:
 * - Booking confirmations
 * - Job assignments
 * - Escalation alerts
 * - Financial upload alerts
 */

import { NOTIFICATION_CONFIG } from '@/ai-system/AI_WebApp_DevTeam_Config'

// Notification types
export interface NotificationData {
  type: 'booking_confirmation' | 'job_assignment' | 'escalation_alert' | 'financial_upload_alert'
  recipient: {
    email?: string
    phone?: string
    name?: string
  }
  data: any
  priority: 'low' | 'medium' | 'high' | 'urgent'
  channels: ('email' | 'sms' | 'calendar' | 'push')[]
}

// Email notification data
interface EmailNotification {
  to: string
  subject: string
  body: string
  html?: string
  attachments?: any[]
}

// SMS notification data
interface SMSNotification {
  to: string
  message: string
}

// Calendar event data
interface CalendarEvent {
  title: string
  description: string
  startTime: string
  endTime: string
  location?: string
  attendees?: string[]
}

/**
 * Send booking confirmation notifications
 */
export async function sendBookingConfirmation(bookingData: {
  bookingId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  serviceName: string
  serviceDate: string
  serviceTime: string
  propertyAddress: string
  totalAmount: number
  assignedStaff?: {
    name: string
    phone: string
    eta: string
  }
}): Promise<boolean> {
  if (!NOTIFICATION_CONFIG.bookingConfirmation) {
    console.log('📧 Booking confirmation notifications disabled')
    return false
  }

  console.log('📧 Sending booking confirmation notifications...')

  try {
    const notifications: Promise<any>[] = []

    // Customer email confirmation
    if (NOTIFICATION_CONFIG.emailEnabled && bookingData.customerEmail) {
      const customerEmail: EmailNotification = {
        to: bookingData.customerEmail,
        subject: `Booking Confirmed - ${bookingData.serviceName}`,
        body: `Dear ${bookingData.customerName},

Your booking has been confirmed!

Booking Details:
- Service: ${bookingData.serviceName}
- Date: ${bookingData.serviceDate}
- Time: ${bookingData.serviceTime}
- Location: ${bookingData.propertyAddress}
- Total: ฿${bookingData.totalAmount.toLocaleString()}
- Booking ID: ${bookingData.bookingId}

${bookingData.assignedStaff ? `Assigned Staff: ${bookingData.assignedStaff.name}
Estimated Arrival: ${bookingData.assignedStaff.eta}
Staff Contact: ${bookingData.assignedStaff.phone}` : 'Staff assignment in progress...'}

Thank you for choosing our services!

Best regards,
Sia Moon Property Management`,
        html: generateBookingConfirmationHTML(bookingData)
      }

      notifications.push(sendEmail(customerEmail))
    }

    // Customer SMS confirmation
    if (NOTIFICATION_CONFIG.smsEnabled && bookingData.customerPhone) {
      const customerSMS: SMSNotification = {
        to: bookingData.customerPhone,
        message: `Booking confirmed! ${bookingData.serviceName} on ${bookingData.serviceDate} at ${bookingData.serviceTime}. Booking ID: ${bookingData.bookingId}. ${bookingData.assignedStaff ? `Staff: ${bookingData.assignedStaff.name}, ETA: ${bookingData.assignedStaff.eta}` : 'Staff assignment pending.'}`
      }

      notifications.push(sendSMS(customerSMS))
    }

    // Wait for all notifications to complete
    await Promise.all(notifications)
    
    console.log('✅ Booking confirmation notifications sent successfully')
    return true

  } catch (error) {
    console.error('❌ Failed to send booking confirmation notifications:', error)
    return false
  }
}

/**
 * Send job assignment notifications to staff
 */
export async function sendJobAssignment(assignmentData: {
  staffName: string
  staffEmail: string
  staffPhone: string
  bookingId: string
  serviceName: string
  serviceDate: string
  serviceTime: string
  customerName: string
  customerPhone: string
  propertyAddress: string
  specialInstructions?: string
  estimatedDuration: string
}): Promise<boolean> {
  if (!NOTIFICATION_CONFIG.jobAssignment) {
    console.log('👥 Job assignment notifications disabled')
    return false
  }

  console.log('👥 Sending job assignment notifications...')

  try {
    const notifications: Promise<any>[] = []

    // Staff email assignment
    if (NOTIFICATION_CONFIG.emailEnabled && assignmentData.staffEmail) {
      const staffEmail: EmailNotification = {
        to: assignmentData.staffEmail,
        subject: `New Job Assignment - ${assignmentData.serviceName}`,
        body: `Hello ${assignmentData.staffName},

You have been assigned a new job:

Job Details:
- Service: ${assignmentData.serviceName}
- Date: ${assignmentData.serviceDate}
- Time: ${assignmentData.serviceTime}
- Duration: ${assignmentData.estimatedDuration}
- Location: ${assignmentData.propertyAddress}
- Booking ID: ${assignmentData.bookingId}

Customer Information:
- Name: ${assignmentData.customerName}
- Phone: ${assignmentData.customerPhone}

${assignmentData.specialInstructions ? `Special Instructions:
${assignmentData.specialInstructions}` : ''}

Please confirm your availability and arrival time.

Best regards,
Sia Moon Property Management`,
        html: generateJobAssignmentHTML(assignmentData)
      }

      notifications.push(sendEmail(staffEmail))
    }

    // Staff SMS assignment
    if (NOTIFICATION_CONFIG.smsEnabled && assignmentData.staffPhone) {
      const staffSMS: SMSNotification = {
        to: assignmentData.staffPhone,
        message: `New job assigned: ${assignmentData.serviceName} on ${assignmentData.serviceDate} at ${assignmentData.serviceTime}. Location: ${assignmentData.propertyAddress}. Customer: ${assignmentData.customerName} (${assignmentData.customerPhone}). Job ID: ${assignmentData.bookingId}`
      }

      notifications.push(sendSMS(staffSMS))
    }

    // Calendar event for staff
    if (NOTIFICATION_CONFIG.calendarEnabled) {
      const calendarEvent: CalendarEvent = {
        title: `${assignmentData.serviceName} - ${assignmentData.customerName}`,
        description: `Job Assignment\n\nService: ${assignmentData.serviceName}\nCustomer: ${assignmentData.customerName}\nPhone: ${assignmentData.customerPhone}\nLocation: ${assignmentData.propertyAddress}\nBooking ID: ${assignmentData.bookingId}${assignmentData.specialInstructions ? `\n\nSpecial Instructions:\n${assignmentData.specialInstructions}` : ''}`,
        startTime: `${assignmentData.serviceDate}T${assignmentData.serviceTime}:00`,
        endTime: calculateEndTime(assignmentData.serviceDate, assignmentData.serviceTime, assignmentData.estimatedDuration),
        location: assignmentData.propertyAddress,
        attendees: [assignmentData.staffEmail]
      }

      notifications.push(createCalendarEvent(calendarEvent))
    }

    await Promise.all(notifications)
    
    console.log('✅ Job assignment notifications sent successfully')
    return true

  } catch (error) {
    console.error('❌ Failed to send job assignment notifications:', error)
    return false
  }
}

/**
 * Send escalation alerts to management
 */
export async function sendEscalationAlert(escalationData: {
  type: 'high_value' | 'fraud_detected' | 'system_error' | 'customer_complaint'
  severity: 'medium' | 'high' | 'critical'
  title: string
  description: string
  relatedBookingId?: string
  relatedAmount?: number
  actionRequired: string
  escalatedBy: string
}): Promise<boolean> {
  if (!NOTIFICATION_CONFIG.escalationAlert) {
    console.log('🚨 Escalation alert notifications disabled')
    return false
  }

  console.log('🚨 Sending escalation alert notifications...')

  try {
    const managementEmails = [
      'admin@siamoon.com',
      'manager@siamoon.com',
      'operations@siamoon.com'
    ]

    const notifications: Promise<any>[] = []

    // Management email alerts
    if (NOTIFICATION_CONFIG.emailEnabled) {
      for (const email of managementEmails) {
        const alertEmail: EmailNotification = {
          to: email,
          subject: `🚨 ${escalationData.severity.toUpperCase()} ALERT: ${escalationData.title}`,
          body: `ESCALATION ALERT

Severity: ${escalationData.severity.toUpperCase()}
Type: ${escalationData.type.replace('_', ' ').toUpperCase()}
Escalated By: ${escalationData.escalatedBy}
Time: ${new Date().toISOString()}

Description:
${escalationData.description}

${escalationData.relatedBookingId ? `Related Booking: ${escalationData.relatedBookingId}` : ''}
${escalationData.relatedAmount ? `Amount Involved: ฿${escalationData.relatedAmount.toLocaleString()}` : ''}

ACTION REQUIRED:
${escalationData.actionRequired}

Please review and take appropriate action immediately.

Sia Moon Property Management System`,
          html: generateEscalationAlertHTML(escalationData)
        }

        notifications.push(sendEmail(alertEmail))
      }
    }

    await Promise.all(notifications)
    
    console.log('✅ Escalation alert notifications sent successfully')
    return true

  } catch (error) {
    console.error('❌ Failed to send escalation alert notifications:', error)
    return false
  }
}

/**
 * Send financial upload alerts
 */
export async function sendFinancialUploadAlert(uploadData: {
  fileName: string
  uploadedBy: string
  totalAmount: number
  category: string
  status: 'approved' | 'rejected' | 'flagged'
  reason?: string
  anomaliesDetected?: string[]
}): Promise<boolean> {
  if (!NOTIFICATION_CONFIG.financialUploadAlert) {
    console.log('💰 Financial upload alert notifications disabled')
    return false
  }

  console.log('💰 Sending financial upload alert notifications...')

  try {
    const financeEmails = [
      'finance@siamoon.com',
      'admin@siamoon.com'
    ]

    const notifications: Promise<any>[] = []

    // Finance team email alerts
    if (NOTIFICATION_CONFIG.emailEnabled) {
      for (const email of financeEmails) {
        const alertEmail: EmailNotification = {
          to: email,
          subject: `Financial Upload ${uploadData.status.toUpperCase()}: ${uploadData.fileName}`,
          body: `Financial Upload Notification

File: ${uploadData.fileName}
Uploaded By: ${uploadData.uploadedBy}
Total Amount: ฿${uploadData.totalAmount.toLocaleString()}
Category: ${uploadData.category}
Status: ${uploadData.status.toUpperCase()}
Time: ${new Date().toISOString()}

${uploadData.reason ? `Reason: ${uploadData.reason}` : ''}

${uploadData.anomaliesDetected && uploadData.anomaliesDetected.length > 0 ? `Anomalies Detected:
${uploadData.anomaliesDetected.map(a => `- ${a}`).join('\n')}` : ''}

${uploadData.status === 'flagged' ? 'IMMEDIATE REVIEW REQUIRED' : uploadData.status === 'rejected' ? 'UPLOAD REJECTED - INVESTIGATION NEEDED' : 'Upload processed successfully'}

Sia Moon Property Management System`,
          html: generateFinancialUploadAlertHTML(uploadData)
        }

        notifications.push(sendEmail(alertEmail))
      }
    }

    await Promise.all(notifications)
    
    console.log('✅ Financial upload alert notifications sent successfully')
    return true

  } catch (error) {
    console.error('❌ Failed to send financial upload alert notifications:', error)
    return false
  }
}

// Helper functions for actual notification delivery
async function sendEmail(emailData: EmailNotification): Promise<boolean> {
  // In production, integrate with your email service (SendGrid, AWS SES, etc.)
  console.log('📧 Email sent:', emailData.to, emailData.subject)
  return true
}

async function sendSMS(smsData: SMSNotification): Promise<boolean> {
  // In production, integrate with your SMS service (Twilio, AWS SNS, etc.)
  console.log('📱 SMS sent:', smsData.to, smsData.message.substring(0, 50) + '...')
  return true
}

async function createCalendarEvent(eventData: CalendarEvent): Promise<boolean> {
  // In production, integrate with calendar service (Google Calendar, Outlook, etc.)
  console.log('📅 Calendar event created:', eventData.title, eventData.startTime)
  return true
}

// Helper functions for HTML generation
function generateBookingConfirmationHTML(data: any): string {
  return `<h2>Booking Confirmed</h2><p>Your booking details...</p>`
}

function generateJobAssignmentHTML(data: any): string {
  return `<h2>New Job Assignment</h2><p>Job details...</p>`
}

function generateEscalationAlertHTML(data: any): string {
  return `<h2>🚨 Escalation Alert</h2><p>Alert details...</p>`
}

function generateFinancialUploadAlertHTML(data: any): string {
  return `<h2>Financial Upload Alert</h2><p>Upload details...</p>`
}

function calculateEndTime(date: string, time: string, duration: string): string {
  // Simple duration calculation - in production, use proper date library
  const [hours, minutes] = time.split(':').map(Number)
  const durationHours = parseInt(duration) || 2
  const endHours = hours + durationHours
  return `${date}T${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`
}
