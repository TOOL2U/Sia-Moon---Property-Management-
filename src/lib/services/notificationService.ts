import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { getDb } from '@/lib/firebase'

export interface NotificationData {
  type: 'booking_approved' | 'booking_rejected' | 'task_created' | 'conflict_detected' | 'system_alert'
  title: string
  message: string
  recipientId?: string
  recipientEmail?: string
  bookingId?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  actionRequired?: boolean
  actionUrl?: string
  metadata?: Record<string, unknown>
}

export class NotificationService {
  
  /**
   * Send notification to user/admin
   */
  static async sendNotification(notification: NotificationData): Promise<boolean> {
    try {
      console.log('📧 NOTIFICATION: Sending notification...')
      console.log('📧 Type:', notification.type)
      console.log('📧 Recipient:', notification.recipientEmail || notification.recipientId)
      
      const database = getDb()
      
      // Save notification to Firebase
      const notificationDoc = {
        ...notification,
        status: 'sent',
        createdAt: serverTimestamp(),
        readAt: null
      }
      
      await addDoc(collection(database, 'notifications'), notificationDoc)
      
      // TODO: Integrate with email service (SendGrid, Resend, etc.)
      // await this.sendEmail(notification)
      
      console.log('✅ NOTIFICATION: Notification saved to database')
      return true
      
    } catch (error) {
      console.error('❌ NOTIFICATION: Error sending notification:', error)
      return false
    }
  }
  
  /**
   * Send booking approval notification
   */
  static async notifyBookingApproved(bookingData: {
    id: string
    guestName: string
    villaName: string
    checkInDate: string
    clientEmail?: string
    adminEmail?: string
  }): Promise<void> {
    try {
      // Notify property owner/client
      if (bookingData.clientEmail) {
        await this.sendNotification({
          type: 'booking_approved',
          title: 'New Booking Approved',
          message: `A booking for ${bookingData.villaName} by ${bookingData.guestName} has been approved for ${bookingData.checkInDate}.`,
          recipientEmail: bookingData.clientEmail,
          bookingId: bookingData.id,
          priority: 'high',
          actionRequired: true,
          actionUrl: `/dashboard/bookings/${bookingData.id}`
        })
      }
      
      // Notify admin
      if (bookingData.adminEmail) {
        await this.sendNotification({
          type: 'booking_approved',
          title: 'Booking Processed',
          message: `Booking ${bookingData.id} has been approved and assigned.`,
          recipientEmail: bookingData.adminEmail,
          bookingId: bookingData.id,
          priority: 'medium',
          actionRequired: false
        })
      }
      
    } catch (error) {
      console.error('❌ NOTIFICATION: Error sending approval notifications:', error)
    }
  }
  
  /**
   * Send task creation notification
   */
  static async notifyTaskCreated(taskData: {
    taskId: string
    title: string
    assignedTo: string
    dueDate: string
    bookingId?: string
  }): Promise<void> {
    try {
      await this.sendNotification({
        type: 'task_created',
        title: 'New Task Assigned',
        message: `You have been assigned a new task: ${taskData.title}. Due: ${taskData.dueDate}`,
        recipientId: taskData.assignedTo,
        bookingId: taskData.bookingId,
        priority: 'medium',
        actionRequired: true,
        actionUrl: `/dashboard/tasks/${taskData.taskId}`,
        metadata: {
          taskId: taskData.taskId,
          dueDate: taskData.dueDate
        }
      })
      
    } catch (error) {
      console.error('❌ NOTIFICATION: Error sending task notification:', error)
    }
  }
  
  /**
   * Send system alert
   */
  static async sendSystemAlert(alert: {
    title: string
    message: string
    severity: 'info' | 'warning' | 'error' | 'critical'
    adminEmails: string[]
  }): Promise<void> {
    try {
      const priority = alert.severity === 'critical' ? 'urgent' : 
                     alert.severity === 'error' ? 'high' : 'medium'
      
      for (const email of alert.adminEmails) {
        await this.sendNotification({
          type: 'system_alert',
          title: alert.title,
          message: alert.message,
          recipientEmail: email,
          priority,
          actionRequired: alert.severity === 'critical' || alert.severity === 'error'
        })
      }
      
    } catch (error) {
      console.error('❌ NOTIFICATION: Error sending system alert:', error)
    }
  }
  
  /**
   * TODO: Implement email sending
   */
  private static async sendEmail(notification: NotificationData): Promise<boolean> {
    // This would integrate with your email service
    // Example: SendGrid, Resend, AWS SES, etc.
    
    console.log('📧 EMAIL: Would send email notification')
    console.log('📧 To:', notification.recipientEmail)
    console.log('📧 Subject:', notification.title)
    console.log('📧 Body:', notification.message)
    
    return true
  }
}
