/**
 * Enhanced Notification Service
 * Handles multi-channel notifications for job assignments
 */

import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  query, 
  where, 
  getDocs,
  onSnapshot,
  orderBy,
  limit
} from 'firebase/firestore'
import { getDb } from '@/lib/firebase'

export interface NotificationData {
  id?: string
  userId: string
  type: 'job_assigned' | 'job_updated' | 'job_completed' | 'job_cancelled' | 'system_alert'
  title: string
  message: string
  data?: {
    jobId?: string
    bookingId?: string
    propertyName?: string
    taskType?: string
    priority?: 'low' | 'medium' | 'high' | 'urgent'
    scheduledDate?: string
    assignedBy?: string
    [key: string]: any
  }
  channels: ('firebase' | 'push' | 'webapp')[]
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  createdAt?: any
  readAt?: any
  deliveredAt?: any
}

export interface PushNotificationPayload {
  title: string
  body: string
  data?: Record<string, string>
  badge?: number
  sound?: string
  icon?: string
}

export class EnhancedNotificationService {
  private static db = getDb()

  /**
   * Send multi-channel notification for job assignment
   */
  static async sendJobAssignmentNotification(
    staffId: string,
    jobData: {
      jobId: string
      bookingId: string
      propertyName: string
      taskType: string
      priority: 'low' | 'medium' | 'high' | 'urgent'
      scheduledDate: string
      assignedBy: string
      assignedByName: string
    }
  ): Promise<{ success: boolean; notificationId?: string; error?: string }> {
    try {
      const notification: NotificationData = {
        userId: staffId,
        type: 'job_assigned',
        title: 'New Job Assignment',
        message: `You have been assigned a ${jobData.taskType} task at ${jobData.propertyName}`,
        data: {
          jobId: jobData.jobId,
          bookingId: jobData.bookingId,
          propertyName: jobData.propertyName,
          taskType: jobData.taskType,
          priority: jobData.priority,
          scheduledDate: jobData.scheduledDate,
          assignedBy: jobData.assignedBy,
          assignedByName: jobData.assignedByName
        },
        channels: ['firebase', 'push', 'webapp'],
        status: 'pending',
        priority: jobData.priority,
        createdAt: serverTimestamp()
      }

      // 1. Store notification in Firebase
      const notificationRef = await addDoc(
        collection(this.db, 'notifications'),
        notification
      )

      // 2. Add to staff member's notification subcollection
      await addDoc(
        collection(this.db, `staff_accounts/${staffId}/notifications`),
        {
          ...notification,
          notificationId: notificationRef.id
        }
      )

      // 3. Send push notification (if mobile app is available)
      await this.sendPushNotification(staffId, {
        title: notification.title,
        body: notification.message,
        data: {
          type: 'job_assigned',
          jobId: jobData.jobId,
          bookingId: jobData.bookingId,
          propertyName: jobData.propertyName
        },
        badge: await this.getUnreadNotificationCount(staffId)
      })

      // 4. Update notification status
      await updateDoc(notificationRef, {
        status: 'sent',
        deliveredAt: serverTimestamp()
      })

      console.log(`✅ Multi-channel notification sent to staff ${staffId}`)
      
      return {
        success: true,
        notificationId: notificationRef.id
      }
    } catch (error) {
      console.error('❌ Error sending job assignment notification:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Send push notification to mobile device
   */
  private static async sendPushNotification(
    staffId: string,
    payload: PushNotificationPayload
  ): Promise<void> {
    try {
      // Get staff member's push token
      const staffDoc = await getDocs(
        query(
          collection(this.db, 'staff_accounts'),
          where('id', '==', staffId),
          limit(1)
        )
      )

      if (staffDoc.empty) {
        console.log(`⚠️ Staff member ${staffId} not found for push notification`)
        return
      }

      const staffData = staffDoc.docs[0].data()
      const pushToken = staffData.pushToken || staffData.fcmToken

      if (!pushToken) {
        console.log(`⚠️ No push token found for staff ${staffId}`)
        return
      }

      // Send push notification via Firebase Cloud Messaging
      // This would typically use Firebase Admin SDK
      console.log(`📱 Sending push notification to ${staffId}:`, payload)
      
      // For now, we'll store the push notification request
      await addDoc(collection(this.db, 'push_notifications'), {
        staffId,
        pushToken,
        payload,
        status: 'pending',
        createdAt: serverTimestamp()
      })

    } catch (error) {
      console.error('❌ Error sending push notification:', error)
    }
  }

  /**
   * Get unread notification count for badge
   */
  private static async getUnreadNotificationCount(staffId: string): Promise<number> {
    try {
      const unreadQuery = query(
        collection(this.db, `staff_accounts/${staffId}/notifications`),
        where('status', '!=', 'read')
      )
      
      const snapshot = await getDocs(unreadQuery)
      return snapshot.size
    } catch (error) {
      console.error('Error getting unread count:', error)
      return 0
    }
  }

  /**
   * Mark notification as read
   */
  static async markNotificationAsRead(
    notificationId: string,
    staffId: string
  ): Promise<void> {
    try {
      // Update main notification
      await updateDoc(doc(this.db, 'notifications', notificationId), {
        status: 'read',
        readAt: serverTimestamp()
      })

      // Update staff's notification subcollection
      const staffNotificationsQuery = query(
        collection(this.db, `staff_accounts/${staffId}/notifications`),
        where('notificationId', '==', notificationId)
      )
      
      const snapshot = await getDocs(staffNotificationsQuery)
      snapshot.docs.forEach(async (doc) => {
        await updateDoc(doc.ref, {
          status: 'read',
          readAt: serverTimestamp()
        })
      })

    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  /**
   * Get notifications for a staff member
   */
  static async getStaffNotifications(
    staffId: string,
    limitCount: number = 50
  ): Promise<NotificationData[]> {
    try {
      const notificationsQuery = query(
        collection(this.db, `staff_accounts/${staffId}/notifications`),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      )
      
      const snapshot = await getDocs(notificationsQuery)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as NotificationData))
    } catch (error) {
      console.error('Error getting staff notifications:', error)
      return []
    }
  }

  /**
   * Set up real-time notification listener
   */
  static setupNotificationListener(
    staffId: string,
    callback: (notifications: NotificationData[]) => void
  ): () => void {
    const notificationsQuery = query(
      collection(this.db, `staff_accounts/${staffId}/notifications`),
      orderBy('createdAt', 'desc'),
      limit(50)
    )

    return onSnapshot(notificationsQuery, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as NotificationData))
      
      callback(notifications)
    })
  }

  /**
   * Send job status update notification
   */
  static async sendJobStatusUpdateNotification(
    staffId: string,
    jobData: {
      jobId: string
      propertyName: string
      newStatus: string
      updatedBy: string
    }
  ): Promise<void> {
    const notification: NotificationData = {
      userId: staffId,
      type: 'job_updated',
      title: 'Job Status Updated',
      message: `Your job at ${jobData.propertyName} status has been updated to ${jobData.newStatus}`,
      data: {
        jobId: jobData.jobId,
        propertyName: jobData.propertyName,
        newStatus: jobData.newStatus,
        updatedBy: jobData.updatedBy
      },
      channels: ['firebase', 'push', 'webapp'],
      status: 'pending',
      priority: 'medium',
      createdAt: serverTimestamp()
    }

    await this.sendNotification(staffId, notification)
  }

  /**
   * Generic notification sender
   */
  private static async sendNotification(
    staffId: string,
    notification: NotificationData
  ): Promise<void> {
    try {
      // Store in main notifications collection
      const notificationRef = await addDoc(
        collection(this.db, 'notifications'),
        notification
      )

      // Store in staff's subcollection
      await addDoc(
        collection(this.db, `staff_accounts/${staffId}/notifications`),
        {
          ...notification,
          notificationId: notificationRef.id
        }
      )

      console.log(`✅ Notification sent to staff ${staffId}`)
    } catch (error) {
      console.error('❌ Error sending notification:', error)
    }
  }
}
