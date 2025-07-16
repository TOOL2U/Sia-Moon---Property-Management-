/**
 * Firebase Cloud Functions for Job Assignment Notifications
 * Automatically triggers when jobs are assigned to staff members
 * Sends real-time notifications and FCM push notifications
 */

import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp()
}

const db = admin.firestore()
const messaging = admin.messaging()

// Job notification data structure
interface JobNotificationData {
  jobId: string
  staffId: string
  staffName: string
  staffEmail: string
  jobTitle: string
  jobType: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  propertyName: string
  propertyAddress: string
  scheduledDate: string
  scheduledStartTime?: string
  estimatedDuration: number
  specialInstructions?: string
  createdAt: admin.firestore.Timestamp
  notificationSent: boolean
  pushNotificationSent: boolean
}

// Staff device token interface
interface StaffDeviceToken {
  staffId: string
  deviceToken: string
  platform: 'ios' | 'android'
  appVersion: string
  lastActive: admin.firestore.Timestamp
  notificationsEnabled: boolean
}

/**
 * Cloud Function: Trigger on job assignment
 * Listens for new jobs or status changes to 'assigned'
 */
export const onJobAssigned = functions.firestore
  .document('jobs/{jobId}')
  .onWrite(async (change, context) => {
    try {
      const jobId = context.params.jobId
      const beforeData = change.before.exists ? change.before.data() : null
      const afterData = change.after.exists ? change.after.data() : null

      // Check if this is a job assignment (new job or status changed to assigned)
      const isNewAssignment = (
        (!beforeData && afterData?.status === 'assigned') || // New job assigned
        (beforeData?.status !== 'assigned' && afterData?.status === 'assigned') || // Status changed to assigned
        (beforeData?.assignedStaffId !== afterData?.assignedStaffId && afterData?.assignedStaffId) // Staff reassigned
      )

      if (!isNewAssignment || !afterData?.assignedStaffId) {
        console.log(`⏭️ Skipping notification for job ${jobId} - not a new assignment`)
        return null
      }

      console.log(`🔔 Processing job assignment notification for job ${jobId}`)

      // Get staff information
      const staffDoc = await db.collection('staff_accounts').doc(afterData.assignedStaffId).get()
      
      if (!staffDoc.exists) {
        console.error(`❌ Staff member ${afterData.assignedStaffId} not found`)
        return null
      }

      const staffData = staffDoc.data()!

      // Prepare notification data
      const notificationData: JobNotificationData = {
        jobId,
        staffId: afterData.assignedStaffId,
        staffName: staffData.name || 'Unknown Staff',
        staffEmail: staffData.email || '',
        jobTitle: afterData.title || 'New Job Assignment',
        jobType: afterData.jobType || 'general',
        priority: afterData.priority || 'medium',
        propertyName: afterData.propertyRef?.name || 'Unknown Property',
        propertyAddress: afterData.location?.address || 'Address not provided',
        scheduledDate: afterData.scheduledDate || new Date().toISOString().split('T')[0],
        scheduledStartTime: afterData.scheduledStartTime,
        estimatedDuration: afterData.estimatedDuration || 120,
        specialInstructions: afterData.specialInstructions,
        createdAt: admin.firestore.Timestamp.now(),
        notificationSent: false,
        pushNotificationSent: false
      }

      // Create notification document in staff_notifications collection
      const notificationRef = await db.collection('staff_notifications').add({
        ...notificationData,
        type: 'job_assigned',
        status: 'pending',
        readAt: null,
        actionRequired: true,
        expiresAt: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        )
      })

      console.log(`✅ Created notification document: ${notificationRef.id}`)

      // Update job document with notification flag for mobile app
      await db.collection('jobs').doc(jobId).update({
        notificationSent: true,
        notificationId: notificationRef.id,
        mobileNotificationPending: true,
        lastNotificationAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now()
      })

      // Send FCM push notification
      await sendPushNotification(notificationData)

      // Update staff dashboard for real-time UI updates
      await updateStaffDashboard(afterData.assignedStaffId, notificationData)

      // Log successful notification
      await logNotificationEvent(jobId, afterData.assignedStaffId, 'job_assigned', true)

      console.log(`🎉 Job assignment notification completed for job ${jobId}`)
      return null

    } catch (error) {
      console.error('❌ Error in job assignment notification:', error)
      
      // Log error for monitoring
      await logNotificationEvent(
        context.params.jobId, 
        change.after.data()?.assignedStaffId || 'unknown',
        'job_assigned',
        false,
        error instanceof Error ? error.message : 'Unknown error'
      )
      
      throw error
    }
  })

/**
 * Send FCM push notification to staff member's devices
 */
async function sendPushNotification(notificationData: JobNotificationData): Promise<void> {
  try {
    console.log(`📱 Sending push notification to staff ${notificationData.staffId}`)

    // Get staff device tokens
    const deviceTokensQuery = await db
      .collection('staff_device_tokens')
      .where('staffId', '==', notificationData.staffId)
      .where('notificationsEnabled', '==', true)
      .get()

    if (deviceTokensQuery.empty) {
      console.log(`⚠️ No device tokens found for staff ${notificationData.staffId}`)
      return
    }

    const deviceTokens: string[] = []
    const tokenDocs: StaffDeviceToken[] = []

    deviceTokensQuery.forEach(doc => {
      const tokenData = doc.data() as StaffDeviceToken
      deviceTokens.push(tokenData.deviceToken)
      tokenDocs.push(tokenData)
    })

    // Prepare FCM message
    const message = {
      notification: {
        title: '🎯 New Job Assignment',
        body: `${notificationData.jobTitle} at ${notificationData.propertyName}`
      },
      data: {
        type: 'job_assigned',
        jobId: notificationData.jobId,
        jobType: notificationData.jobType,
        priority: notificationData.priority,
        propertyName: notificationData.propertyName,
        scheduledDate: notificationData.scheduledDate,
        scheduledStartTime: notificationData.scheduledStartTime || '',
        estimatedDuration: notificationData.estimatedDuration.toString(),
        specialInstructions: notificationData.specialInstructions || '',
        timestamp: new Date().toISOString()
      },
      android: {
        notification: {
          icon: 'ic_notification',
          color: '#6366f1', // Indigo color matching app theme
          channelId: 'job_assignments',
          priority: notificationData.priority === 'urgent' ? 'high' : 'default',
          sound: 'default'
        },
        data: {
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
          route: `/jobs/${notificationData.jobId}`
        }
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: '🎯 New Job Assignment',
              body: `${notificationData.jobTitle} at ${notificationData.propertyName}`
            },
            badge: 1,
            sound: 'default',
            category: 'JOB_ASSIGNMENT'
          }
        },
        fcmOptions: {
          imageUrl: 'https://siamoon.com/assets/notification-icon.png'
        }
      },
      tokens: deviceTokens
    }

    // Send multicast message
    const response = await messaging.sendMulticast(message)

    console.log(`📤 Push notification sent: ${response.successCount}/${deviceTokens.length} successful`)

    // Handle failed tokens (remove invalid ones)
    if (response.failureCount > 0) {
      const failedTokens: string[] = []
      
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(`❌ Failed to send to token ${idx}:`, resp.error)
          
          // Remove invalid tokens
          if (resp.error?.code === 'messaging/invalid-registration-token' ||
              resp.error?.code === 'messaging/registration-token-not-registered') {
            failedTokens.push(deviceTokens[idx])
          }
        }
      })

      // Clean up invalid tokens
      for (const failedToken of failedTokens) {
        await db.collection('staff_device_tokens')
          .where('deviceToken', '==', failedToken)
          .get()
          .then(snapshot => {
            snapshot.forEach(doc => doc.ref.delete())
          })
      }
    }

    // Update notification status
    await db.collection('staff_notifications')
      .where('jobId', '==', notificationData.jobId)
      .where('staffId', '==', notificationData.staffId)
      .get()
      .then(snapshot => {
        snapshot.forEach(doc => {
          doc.ref.update({
            pushNotificationSent: true,
            pushNotificationSentAt: admin.firestore.Timestamp.now(),
            pushNotificationResponse: {
              successCount: response.successCount,
              failureCount: response.failureCount
            }
          })
        })
      })

  } catch (error) {
    console.error('❌ Error sending push notification:', error)
    throw error
  }
}

/**
 * Update staff dashboard with new job notification
 */
async function updateStaffDashboard(staffId: string, notificationData: JobNotificationData): Promise<void> {
  try {
    const dashboardRef = db.collection('staff_dashboard').doc(staffId)
    
    await dashboardRef.set({
      staffId,
      pendingJobs: FieldValue.increment(1),
      unreadNotifications: FieldValue.increment(1),
      lastJobAssigned: {
        jobId: notificationData.jobId,
        jobTitle: notificationData.jobTitle,
        propertyName: notificationData.propertyName,
        assignedAt: admin.firestore.Timestamp.now()
      },
      lastUpdated: admin.firestore.Timestamp.now(),
      notificationBadge: FieldValue.increment(1)
    }, { merge: true })

    console.log(`📊 Updated dashboard for staff ${staffId}`)

  } catch (error) {
    console.error('❌ Error updating staff dashboard:', error)
    throw error
  }
}

/**
 * Log notification events for monitoring and analytics
 */
async function logNotificationEvent(
  jobId: string,
  staffId: string,
  eventType: string,
  success: boolean,
  error?: string
): Promise<void> {
  try {
    await db.collection('notification_logs').add({
      jobId,
      staffId,
      eventType,
      success,
      error: error || null,
      timestamp: admin.firestore.Timestamp.now(),
      metadata: {
        functionName: 'onJobAssigned',
        version: '1.0.0'
      }
    })
  } catch (logError) {
    console.error('❌ Error logging notification event:', logError)
    // Don't throw here to avoid breaking the main flow
  }
}

/**
 * Cloud Function: Handle notification acknowledgment from mobile app
 */
export const onNotificationAcknowledged = functions.firestore
  .document('staff_notifications/{notificationId}')
  .onUpdate(async (change, context) => {
    try {
      const beforeData = change.before.data()
      const afterData = change.after.data()

      // Check if notification was read/acknowledged
      if (!beforeData.readAt && afterData.readAt) {
        const notificationId = context.params.notificationId
        
        console.log(`✅ Notification ${notificationId} acknowledged by staff ${afterData.staffId}`)

        // Update job document to clear mobile notification flag
        if (afterData.jobId) {
          await db.collection('jobs').doc(afterData.jobId).update({
            mobileNotificationPending: false,
            notificationAcknowledgedAt: admin.firestore.Timestamp.now()
          })
        }

        // Update staff dashboard
        await db.collection('staff_dashboard').doc(afterData.staffId).update({
          unreadNotifications: FieldValue.increment(-1),
          notificationBadge: FieldValue.increment(-1),
          lastNotificationRead: admin.firestore.Timestamp.now()
        })

        // Log acknowledgment
        await logNotificationEvent(
          afterData.jobId,
          afterData.staffId,
          'notification_acknowledged',
          true
        )
      }

      return null
    } catch (error) {
      console.error('❌ Error handling notification acknowledgment:', error)
      throw error
    }
  })

/**
 * Scheduled function: Clean up expired notifications
 */
export const cleanupExpiredNotifications = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    try {
      console.log('🧹 Starting cleanup of expired notifications')

      const expiredQuery = await db
        .collection('staff_notifications')
        .where('expiresAt', '<', admin.firestore.Timestamp.now())
        .get()

      const batch = db.batch()
      let deleteCount = 0

      expiredQuery.forEach(doc => {
        batch.delete(doc.ref)
        deleteCount++
      })

      if (deleteCount > 0) {
        await batch.commit()
        console.log(`🗑️ Deleted ${deleteCount} expired notifications`)
      } else {
        console.log('✨ No expired notifications to clean up')
      }

      return null
    } catch (error) {
      console.error('❌ Error cleaning up expired notifications:', error)
      throw error
    }
  })
