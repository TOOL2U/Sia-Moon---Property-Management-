/**
 * Intelligent Notification and Reminder Service
 * Real-time notifications for job assignments, reminders, and escalations
 */

import { db } from '@/lib/firebase'
import { clientToast as toast } from '@/utils/clientToast'
import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import AIAutomationService from './AIAutomationService'

// Notification interface
export interface Notification {
  id: string
  recipientId: string
  recipientType: 'staff' | 'admin'
  type:
    | 'job_assignment'
    | 'job_reminder'
    | 'job_overdue'
    | 'admin_alert'
    | 'job_accepted'
    | 'system_announcement'
  priority: 'low' | 'medium' | 'high'
  title: string
  message: string
  jobId?: string
  propertyId?: string
  propertyName?: string
  scheduledFor?: Timestamp
  deliveryChannels: ('push' | 'email' | 'sms' | 'in_app')[]
  deliveryStatus: 'pending' | 'sent' | 'delivered' | 'failed'
  read: boolean
  readAt?: Timestamp
  actionButtons?: Array<{
    label: string
    action: string
    style?: 'primary' | 'secondary' | 'danger'
  }>
  metadata?: {
    jobType?: string
    estimatedDuration?: number
    staffName?: string
    propertyAddress?: string
    specialInstructions?: string
  }
  createdAt: Timestamp
  sentAt?: Timestamp
  retryCount: number
  maxRetries: number
}

// Notification preferences interface
export interface NotificationPreferences {
  staffId: string
  channels: {
    push: boolean
    email: boolean
    sms: boolean
    inApp: boolean
  }
  workingHours: {
    start: string
    end: string
    days: string[]
  }
  doNotDisturb: {
    enabled: boolean
    start?: string
    end?: string
  }
  priorities: {
    high: ('push' | 'email' | 'sms' | 'in_app')[]
    medium: ('push' | 'email' | 'sms' | 'in_app')[]
    low: ('push' | 'email' | 'sms' | 'in_app')[]
  }
}

// Notification metrics
export interface NotificationMetrics {
  totalSent: number
  deliverySuccessRate: number
  averageDeliveryTime: number
  responseRate: number
  unacceptedJobs: number
  escalatedJobs: number
  lastNotificationSent: Date | null
}

// Job acceptance timeout configuration
const JOB_ACCEPTANCE_TIMEOUT = 30 * 60 * 1000 // 30 minutes in milliseconds
const PRE_JOB_REMINDER_TIME = 60 * 60 * 1000 // 60 minutes in milliseconds
const MAX_RETRY_ATTEMPTS = 3
const RETRY_DELAY_BASE = 1000 // 1 second base delay

class NotificationService {
  private jobListener: (() => void) | null = null
  private reminderInterval: NodeJS.Timeout | null = null
  private escalationInterval: NodeJS.Timeout | null = null
  private isInitialized = false

  // Performance tracking
  private metrics: NotificationMetrics = {
    totalSent: 0,
    deliverySuccessRate: 0,
    averageDeliveryTime: 0,
    responseRate: 0,
    unacceptedJobs: 0,
    escalatedJobs: 0,
    lastNotificationSent: null,
  }

  /**
   * Initialize the Notification Service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ Notification Service already initialized')
      return
    }

    try {
      console.log('🔔 Initializing Notification Service...')

      // Check if AI automation is enabled
      const aiEnabled = await AIAutomationService.isEnabled()

      if (!aiEnabled) {
        console.log(
          '⚠️ AI automation disabled - Notification service will not monitor automated events'
        )
        return
      }

      // Set up job assignment listener
      this.setupJobAssignmentListener()

      // Set up reminder scheduler
      this.setupReminderScheduler()

      // Set up escalation monitor
      this.setupEscalationMonitor()

      this.isInitialized = true
      console.log('✅ Notification Service initialized successfully')
    } catch (error) {
      console.error('❌ Error initializing Notification Service:', error)
    }
  }

  /**
   * Set up listener for job assignments
   */
  private setupJobAssignmentListener(): void {
    if (this.jobListener) {
      this.jobListener()
      this.jobListener = null
    }

    const jobsRef = collection(db, 'jobs')
    const assignedJobsQuery = query(
      jobsRef,
      where('status', '==', 'assigned'),
      where('notificationSent', '!=', true) // Only process jobs that haven't had notifications sent
    )

    this.jobListener = onSnapshot(
      assignedJobsQuery,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' || change.type === 'modified') {
            const jobId = change.doc.id
            const jobData = change.doc.data()

            // Send job assignment notification
            if (jobData.assignedStaff && !jobData.notificationSent) {
              this.sendJobAssignmentNotification({
                id: jobId,
                ...jobData,
              })
            }
          }
        })
      },
      (error) => {
        console.error('❌ Error in job assignment listener:', error)
      }
    )

    console.log('🔔 Monitoring job assignments for notifications')
  }

  /**
   * Send job assignment notification to staff
   */
  private async sendJobAssignmentNotification(job: any): Promise<void> {
    const startTime = Date.now()

    try {
      console.log(`🔔 Sending job assignment notification for job ${job.id}`)

      // Check if AI automation is still enabled
      const aiEnabled = await AIAutomationService.isEnabled()
      if (!aiEnabled) {
        console.log(
          `⚠️ AI automation disabled - skipping notification for job ${job.id}`
        )
        return
      }

      // Get staff preferences
      const preferences = await this.getStaffNotificationPreferences(
        job.assignedStaff
      )

      // Determine delivery channels based on priority and preferences
      const deliveryChannels = this.determineDeliveryChannels(
        'high',
        preferences
      )

      // Create notification
      const notification: Partial<Notification> = {
        recipientId: job.assignedStaff,
        recipientType: 'staff',
        type: 'job_assignment',
        priority: 'high',
        title: `New Job Assignment: ${job.title}`,
        message: `You have been assigned a new job at ${job.propertyName}. Scheduled for ${this.formatDateTime(job.scheduledDate)}.`,
        jobId: job.id,
        propertyId: job.propertyId,
        propertyName: job.propertyName,
        scheduledFor: job.scheduledDate,
        deliveryChannels,
        deliveryStatus: 'pending',
        read: false,
        actionButtons: [
          { label: 'Accept Job', action: 'accept_job', style: 'primary' },
          { label: 'View Details', action: 'view_job', style: 'secondary' },
          {
            label: 'Request Reassignment',
            action: 'request_reassignment',
            style: 'danger',
          },
        ],
        metadata: {
          jobType: job.type,
          estimatedDuration: job.estimatedDuration,
          staffName: job.assignedStaffName,
          specialInstructions: job.specialInstructions,
        },
        createdAt: serverTimestamp(),
        retryCount: 0,
        maxRetries: MAX_RETRY_ATTEMPTS,
      }

      // Save notification to database
      const notificationRef = doc(collection(db, 'notifications'))
      await setDoc(notificationRef, notification)

      // Send via configured channels
      await this.deliverNotification(
        notificationRef.id,
        notification as Notification
      )

      // Mark job as notification sent
      await updateDoc(doc(db, 'jobs', job.id), {
        notificationSent: true,
        notificationSentAt: serverTimestamp(),
        notificationId: notificationRef.id,
      })

      // Update metrics
      this.updateMetrics(true, Date.now() - startTime)

      console.log(`✅ Job assignment notification sent for job ${job.id}`)
      toast.success(`🔔 Notification sent to ${job.assignedStaffName}`)
    } catch (error) {
      console.error(
        `❌ Error sending job assignment notification for job ${job.id}:`,
        error
      )
      this.updateMetrics(false, Date.now() - startTime)

      // Log error to audit trail
      await this.logToAuditTrail({
        action: 'notification_send_error',
        jobId: job.id,
        recipientId: job.assignedStaff,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      })
    }
  }

  /**
   * Get staff notification preferences
   */
  private async getStaffNotificationPreferences(
    staffId: string
  ): Promise<NotificationPreferences> {
    try {
      const preferencesQuery = query(
        collection(db, 'notificationPreferences'),
        where('staffId', '==', staffId),
        limit(1)
      )

      const preferencesSnapshot = await getDocs(preferencesQuery)

      if (!preferencesSnapshot.empty) {
        return preferencesSnapshot.docs[0].data() as NotificationPreferences
      }

      // Return default preferences
      return {
        staffId,
        channels: {
          push: true,
          email: true,
          sms: false,
          inApp: true,
        },
        workingHours: {
          start: '08:00',
          end: '18:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        },
        doNotDisturb: {
          enabled: false,
        },
        priorities: {
          high: ['push', 'in_app'],
          medium: ['push', 'in_app'],
          low: ['in_app'],
        },
      }
    } catch (error) {
      console.error('❌ Error getting staff notification preferences:', error)
      // Return safe defaults
      return {
        staffId,
        channels: { push: true, email: false, sms: false, inApp: true },
        workingHours: {
          start: '08:00',
          end: '18:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        },
        doNotDisturb: { enabled: false },
        priorities: {
          high: ['push', 'in_app'],
          medium: ['in_app'],
          low: ['in_app'],
        },
      }
    }
  }

  /**
   * Determine delivery channels based on priority and preferences
   */
  private determineDeliveryChannels(
    priority: 'low' | 'medium' | 'high',
    preferences: NotificationPreferences
  ): ('push' | 'email' | 'sms' | 'in_app')[] {
    const priorityChannels = preferences.priorities[priority] || ['in_app']

    // Filter by enabled channels
    return priorityChannels.filter((channel) => {
      switch (channel) {
        case 'push':
          return preferences.channels.push
        case 'email':
          return preferences.channels.email
        case 'sms':
          return preferences.channels.sms
        case 'in_app':
          return preferences.channels.inApp
        default:
          return false
      }
    })
  }

  /**
   * Deliver notification via configured channels
   */
  private async deliverNotification(
    notificationId: string,
    notification: Notification
  ): Promise<void> {
    try {
      const deliveryPromises: Promise<void>[] = []

      // Send via each configured channel
      for (const channel of notification.deliveryChannels) {
        switch (channel) {
          case 'push':
            deliveryPromises.push(this.sendPushNotification(notification))
            break
          case 'email':
            deliveryPromises.push(this.sendEmailNotification(notification))
            break
          case 'sms':
            deliveryPromises.push(this.sendSMSNotification(notification))
            break
          case 'in_app':
            // In-app notifications are handled by the database record itself
            break
        }
      }

      // Wait for all deliveries to complete
      await Promise.allSettled(deliveryPromises)

      // Update notification status
      await updateDoc(doc(db, 'notifications', notificationId), {
        deliveryStatus: 'sent',
        sentAt: serverTimestamp(),
      })
    } catch (error) {
      console.error('❌ Error delivering notification:', error)

      // Update notification status to failed
      await updateDoc(doc(db, 'notifications', notificationId), {
        deliveryStatus: 'failed',
        retryCount: notification.retryCount + 1,
      })

      // Schedule retry if under max attempts
      if (notification.retryCount < notification.maxRetries) {
        setTimeout(
          () => {
            this.retryNotificationDelivery(notificationId, notification)
          },
          RETRY_DELAY_BASE * Math.pow(2, notification.retryCount)
        )
      }
    }
  }

  /**
   * Send push notification (placeholder - would integrate with FCM)
   */
  private async sendPushNotification(
    notification: Notification
  ): Promise<void> {
    // Placeholder for Firebase Cloud Messaging integration
    console.log(
      `📱 Push notification sent to ${notification.recipientId}: ${notification.title}`
    )
  }

  /**
   * Send email notification (placeholder)
   */
  private async sendEmailNotification(
    notification: Notification
  ): Promise<void> {
    // Placeholder for email service integration
    console.log(
      `📧 Email notification sent to ${notification.recipientId}: ${notification.title}`
    )
  }

  /**
   * Send SMS notification (placeholder)
   */
  private async sendSMSNotification(notification: Notification): Promise<void> {
    // Placeholder for SMS service integration
    console.log(
      `📱 SMS notification sent to ${notification.recipientId}: ${notification.title}`
    )
  }

  /**
   * Format date and time for notifications
   */
  private formatDateTime(timestamp: Timestamp): string {
    const date = timestamp.toDate()
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  /**
   * Update notification metrics
   */
  private updateMetrics(success: boolean, deliveryTime: number): void {
    this.metrics.totalSent++

    if (success) {
      // Update delivery success rate
      const successfulDeliveries =
        Math.round(
          (this.metrics.deliverySuccessRate * (this.metrics.totalSent - 1)) /
            100
        ) + 1
      this.metrics.deliverySuccessRate =
        (successfulDeliveries / this.metrics.totalSent) * 100

      // Update average delivery time
      this.metrics.averageDeliveryTime =
        (this.metrics.averageDeliveryTime * (this.metrics.totalSent - 1) +
          deliveryTime) /
        this.metrics.totalSent
    } else {
      // Recalculate success rate
      const successfulDeliveries = Math.round(
        (this.metrics.deliverySuccessRate * (this.metrics.totalSent - 1)) / 100
      )
      this.metrics.deliverySuccessRate =
        (successfulDeliveries / this.metrics.totalSent) * 100
    }

    this.metrics.lastNotificationSent = new Date()
  }

  /**
   * Log to audit trail
   */
  private async logToAuditTrail(logData: any): Promise<void> {
    try {
      const auditLogRef = doc(collection(db, 'auditLogs'))
      await setDoc(auditLogRef, {
        ...logData,
        timestamp: serverTimestamp(),
        system: 'NOTIFICATION_SERVICE',
      })
    } catch (error) {
      console.error('❌ Failed to write to audit log:', error)
    }
  }

  /**
   * Set up reminder scheduler
   */
  private setupReminderScheduler(): void {
    // Check for upcoming jobs every 5 minutes
    this.reminderInterval = setInterval(
      async () => {
        await this.checkForUpcomingJobs()
      },
      5 * 60 * 1000
    )

    console.log('⏰ Reminder scheduler initialized')
  }

  /**
   * Set up escalation monitor
   */
  private setupEscalationMonitor(): void {
    // Check for unaccepted and overdue jobs every 10 minutes
    this.escalationInterval = setInterval(
      async () => {
        await this.checkForUnacceptedJobs()
        await this.checkForOverdueJobs()
      },
      10 * 60 * 1000
    )

    console.log('🚨 Escalation monitor initialized')
  }

  /**
   * Check for upcoming jobs that need reminders
   */
  private async checkForUpcomingJobs(): Promise<void> {
    try {
      const now = new Date()
      const reminderTime = new Date(now.getTime() + PRE_JOB_REMINDER_TIME)

      // Query jobs scheduled within the next hour that haven't had reminders sent
      const jobsQuery = query(
        collection(db, 'jobs'),
        where('status', 'in', ['assigned', 'accepted']),
        where('scheduledDate', '>=', Timestamp.fromDate(now)),
        where('scheduledDate', '<=', Timestamp.fromDate(reminderTime)),
        where('reminderSent', '!=', true)
      )

      const jobsSnapshot = await getDocs(jobsQuery)

      for (const jobDoc of jobsSnapshot.docs) {
        const job = { id: jobDoc.id, ...jobDoc.data() }
        await this.sendJobReminder(job)
      }
    } catch (error) {
      console.error('❌ Error checking for upcoming jobs:', error)
    }
  }

  /**
   * Send job reminder notification
   */
  private async sendJobReminder(job: any): Promise<void> {
    try {
      const preferences = await this.getStaffNotificationPreferences(
        job.assignedStaff
      )
      const deliveryChannels = this.determineDeliveryChannels(
        'medium',
        preferences
      )

      // Check if job is accepted for reminder urgency
      const isUrgent = !job.jobAccepted
      const priority = isUrgent ? 'high' : 'medium'

      const notification: Partial<Notification> = {
        recipientId: job.assignedStaff,
        recipientType: 'staff',
        type: 'job_reminder',
        priority,
        title: isUrgent
          ? `URGENT: Job Starting Soon - Not Accepted`
          : `Reminder: Job Starting in 1 Hour`,
        message: `${job.title} at ${job.propertyName} starts at ${this.formatDateTime(job.scheduledDate)}. ${isUrgent ? 'Please accept this job immediately.' : 'Please prepare for your upcoming job.'}`,
        jobId: job.id,
        propertyId: job.propertyId,
        propertyName: job.propertyName,
        scheduledFor: job.scheduledDate,
        deliveryChannels: isUrgent ? ['push', 'in_app'] : deliveryChannels,
        deliveryStatus: 'pending',
        read: false,
        actionButtons: isUrgent
          ? [
              {
                label: 'Accept Job Now',
                action: 'accept_job',
                style: 'primary',
              },
              { label: 'Call Admin', action: 'call_admin', style: 'danger' },
            ]
          : [
              { label: 'View Job', action: 'view_job', style: 'primary' },
              {
                label: 'Get Directions',
                action: 'get_directions',
                style: 'secondary',
              },
            ],
        metadata: {
          jobType: job.type,
          estimatedDuration: job.estimatedDuration,
          staffName: job.assignedStaffName,
          specialInstructions: job.specialInstructions,
        },
        createdAt: serverTimestamp(),
        retryCount: 0,
        maxRetries: MAX_RETRY_ATTEMPTS,
      }

      const notificationRef = doc(collection(db, 'notifications'))
      await setDoc(notificationRef, notification)

      await this.deliverNotification(
        notificationRef.id,
        notification as Notification
      )

      // Mark reminder as sent
      await updateDoc(doc(db, 'jobs', job.id), {
        reminderSent: true,
        reminderSentAt: serverTimestamp(),
      })

      console.log(`⏰ Job reminder sent for job ${job.id}`)
    } catch (error) {
      console.error(`❌ Error sending job reminder for job ${job.id}:`, error)
    }
  }

  /**
   * Check for unaccepted jobs past timeout
   */
  private async checkForUnacceptedJobs(): Promise<void> {
    try {
      const timeoutThreshold = new Date(Date.now() - JOB_ACCEPTANCE_TIMEOUT)

      const unacceptedJobsQuery = query(
        collection(db, 'jobs'),
        where('status', '==', 'assigned'),
        where('jobAccepted', '!=', true),
        where('assignedAt', '<=', Timestamp.fromDate(timeoutThreshold)),
        where('escalationSent', '!=', true)
      )

      const unacceptedJobs = await getDocs(unacceptedJobsQuery)

      for (const jobDoc of unacceptedJobs.docs) {
        const job = { id: jobDoc.id, ...jobDoc.data() }
        await this.sendAdminEscalation(job, 'unaccepted')
        this.metrics.unacceptedJobs++
      }
    } catch (error) {
      console.error('❌ Error checking for unaccepted jobs:', error)
    }
  }

  /**
   * Check for overdue jobs
   */
  private async checkForOverdueJobs(): Promise<void> {
    try {
      const now = new Date()

      const overdueJobsQuery = query(
        collection(db, 'jobs'),
        where('status', 'in', ['assigned', 'accepted']),
        where('scheduledDate', '<', Timestamp.fromDate(now)),
        where('overdueEscalationSent', '!=', true)
      )

      const overdueJobs = await getDocs(overdueJobsQuery)

      for (const jobDoc of overdueJobs.docs) {
        const job = { id: jobDoc.id, ...jobDoc.data() }
        await this.sendAdminEscalation(job, 'overdue')
        this.metrics.escalatedJobs++
      }
    } catch (error) {
      console.error('❌ Error checking for overdue jobs:', error)
    }
  }

  /**
   * Send admin escalation notification
   */
  private async sendAdminEscalation(
    job: any,
    escalationType: 'unaccepted' | 'overdue'
  ): Promise<void> {
    try {
      const title =
        escalationType === 'unaccepted'
          ? `Job Not Accepted: ${job.title}`
          : `Overdue Job: ${job.title}`

      const message =
        escalationType === 'unaccepted'
          ? `Job assigned to ${job.assignedStaffName} has not been accepted within 30 minutes. Immediate action required.`
          : `Job assigned to ${job.assignedStaffName} is overdue (scheduled: ${this.formatDateTime(job.scheduledDate)}). Please investigate.`

      // Get all admin users
      const adminQuery = query(
        collection(db, 'users'),
        where('role', '==', 'admin')
      )

      const adminSnapshot = await getDocs(adminQuery)

      // Send notification to each admin
      for (const adminDoc of adminSnapshot.docs) {
        const admin = adminDoc.data()

        const notification: Partial<Notification> = {
          recipientId: admin.id || adminDoc.id,
          recipientType: 'admin',
          type: 'admin_alert',
          priority: 'high',
          title,
          message,
          jobId: job.id,
          propertyId: job.propertyId,
          propertyName: job.propertyName,
          scheduledFor: job.scheduledDate,
          deliveryChannels: ['push', 'email', 'in_app'],
          deliveryStatus: 'pending',
          read: false,
          actionButtons: [
            { label: 'Reassign Job', action: 'reassign_job', style: 'primary' },
            {
              label: 'Contact Staff',
              action: 'contact_staff',
              style: 'secondary',
            },
            { label: 'Mark Urgent', action: 'mark_urgent', style: 'danger' },
          ],
          metadata: {
            jobType: job.type,
            estimatedDuration: job.estimatedDuration,
            staffName: job.assignedStaffName,
            escalationType,
          },
          createdAt: serverTimestamp(),
          retryCount: 0,
          maxRetries: MAX_RETRY_ATTEMPTS,
        }

        const notificationRef = doc(collection(db, 'notifications'))
        await setDoc(notificationRef, notification)

        await this.deliverNotification(
          notificationRef.id,
          notification as Notification
        )
      }

      // Mark escalation as sent
      const updateField =
        escalationType === 'unaccepted'
          ? 'escalationSent'
          : 'overdueEscalationSent'
      await updateDoc(doc(db, 'jobs', job.id), {
        [updateField]: true,
        [`${updateField}At`]: serverTimestamp(),
      })

      console.log(
        `🚨 Admin escalation sent for ${escalationType} job ${job.id}`
      )
    } catch (error) {
      console.error(
        `❌ Error sending admin escalation for job ${job.id}:`,
        error
      )
    }
  }

  /**
   * Retry notification delivery
   */
  private async retryNotificationDelivery(
    notificationId: string,
    notification: Notification
  ): Promise<void> {
    try {
      console.log(
        `🔄 Retrying notification delivery for ${notificationId} (attempt ${notification.retryCount + 1})`
      )

      // Update retry count
      await updateDoc(doc(db, 'notifications', notificationId), {
        retryCount: notification.retryCount + 1,
      })

      // Attempt delivery again
      await this.deliverNotification(notificationId, {
        ...notification,
        retryCount: notification.retryCount + 1,
      })
    } catch (error) {
      console.error(
        `❌ Error retrying notification delivery for ${notificationId}:`,
        error
      )
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
        readAt: serverTimestamp(),
      })

      console.log(`✅ Notification ${notificationId} marked as read`)
    } catch (error) {
      console.error(`❌ Error marking notification as read:`, error)
    }
  }

  /**
   * Handle job acceptance
   */
  async handleJobAcceptance(
    jobId: string,
    staffId: string,
    acceptanceMethod: string = 'web'
  ): Promise<void> {
    try {
      // Update job status
      await runTransaction(db, async (transaction) => {
        const jobRef = doc(db, 'jobs', jobId)
        const jobDoc = await transaction.get(jobRef)

        if (jobDoc.exists()) {
          transaction.update(jobRef, {
            jobAccepted: true,
            acceptedAt: serverTimestamp(),
            acceptedVia: acceptanceMethod,
            status: 'accepted',
          })
        }
      })

      // Send confirmation to admin
      await this.sendJobAcceptanceConfirmation(jobId, staffId)

      console.log(`✅ Job ${jobId} accepted by staff ${staffId}`)
      toast.success('Job accepted successfully')
    } catch (error) {
      console.error(`❌ Error handling job acceptance:`, error)
      toast.error('Failed to accept job')
    }
  }

  /**
   * Send job acceptance confirmation to admin
   */
  private async sendJobAcceptanceConfirmation(
    jobId: string,
    staffId: string
  ): Promise<void> {
    try {
      // Get job details
      const jobDoc = await getDocs(
        query(collection(db, 'jobs'), where('id', '==', jobId), limit(1))
      )

      if (jobDoc.empty) return

      const job = jobDoc.docs[0].data()

      // Get admin users
      const adminQuery = query(
        collection(db, 'users'),
        where('role', '==', 'admin')
      )

      const adminSnapshot = await getDocs(adminQuery)

      // Send confirmation to each admin
      for (const adminDoc of adminSnapshot.docs) {
        const admin = adminDoc.data()

        const notification: Partial<Notification> = {
          recipientId: admin.id || adminDoc.id,
          recipientType: 'admin',
          type: 'job_accepted',
          priority: 'low',
          title: `Job Accepted: ${job.title}`,
          message: `${job.assignedStaffName} has accepted the job at ${job.propertyName}.`,
          jobId,
          propertyId: job.propertyId,
          propertyName: job.propertyName,
          scheduledFor: job.scheduledDate,
          deliveryChannels: ['in_app'],
          deliveryStatus: 'pending',
          read: false,
          metadata: {
            jobType: job.type,
            staffName: job.assignedStaffName,
          },
          createdAt: serverTimestamp(),
          retryCount: 0,
          maxRetries: 1,
        }

        const notificationRef = doc(collection(db, 'notifications'))
        await setDoc(notificationRef, notification)

        await this.deliverNotification(
          notificationRef.id,
          notification as Notification
        )
      }
    } catch (error) {
      console.error('❌ Error sending job acceptance confirmation:', error)
    }
  }

  /**
   * Get notification metrics
   */
  getMetrics(): NotificationMetrics {
    return { ...this.metrics }
  }

  /**
   * Clean up listeners and intervals
   */
  cleanup(): void {
    if (this.jobListener) {
      this.jobListener()
      this.jobListener = null
    }

    if (this.reminderInterval) {
      clearInterval(this.reminderInterval)
      this.reminderInterval = null
    }

    if (this.escalationInterval) {
      clearInterval(this.escalationInterval)
      this.escalationInterval = null
    }

    this.isInitialized = false
    console.log('🧹 Notification Service cleaned up')
  }
}

// Export singleton instance
const notificationService = new NotificationService()
export default notificationService
