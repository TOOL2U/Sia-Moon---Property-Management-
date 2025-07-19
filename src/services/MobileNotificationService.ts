import { getDb } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore'

/**
 * Service for handling mobile app notifications
 * Manages FCM tokens, notification documents, and push notifications
 */
export class MobileNotificationService {
  /**
   * Create a notification document for mobile app consumption
   */
  static async createJobNotification(
    staffFirebaseUid: string,
    jobId: string,
    jobData: any,
    notificationType: 'job_assigned' | 'job_updated' | 'job_reminder' = 'job_assigned'
  ): Promise<{ success: boolean; notificationId?: string; message: string }> {
    try {
      console.log(`📱 Creating mobile notification for staff UID: ${staffFirebaseUid}, job: ${jobId}`)
      const db = getDb()

      const notificationData = {
        // Core notification fields
        staffId: staffFirebaseUid, // Firebase UID for mobile app queries
        jobId: jobId,
        type: notificationType,
        title: this.getNotificationTitle(notificationType, jobData),
        body: this.getNotificationBody(notificationType, jobData),
        
        // Job details for mobile app
        jobData: {
          id: jobId,
          title: jobData.title || 'New Job Assignment',
          description: jobData.description || '',
          priority: jobData.priority || 'medium',
          status: jobData.status || 'assigned',
          scheduledDate: jobData.scheduledDate,
          scheduledStartTime: jobData.scheduledStartTime,
          deadline: jobData.deadline,
          estimatedDuration: jobData.estimatedDuration,
          specialInstructions: jobData.specialInstructions,
          requiredSkills: jobData.requiredSkills || [],
          requiredSupplies: jobData.requiredSupplies || [],
          assignedStaffId: staffFirebaseUid,
          assignedStaffRef: jobData.assignedStaffRef
        },

        // Notification metadata
        read: false,
        delivered: false,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        
        // FCM payload for push notifications
        fcmPayload: {
          notification: {
            title: this.getNotificationTitle(notificationType, jobData),
            body: this.getNotificationBody(notificationType, jobData),
            icon: '/icons/job-notification.png',
            badge: '/icons/badge.png'
          },
          data: {
            type: notificationType,
            jobId: jobId,
            staffId: staffFirebaseUid,
            action: 'open_job_details',
            timestamp: Date.now().toString()
          }
        }
      }

      // Create notification document
      const notificationRef = await addDoc(collection(db, 'notifications'), notificationData)
      
      console.log(`✅ Created notification document: ${notificationRef.id}`)

      // Update job with notification reference
      await updateDoc(doc(db, 'jobs', jobId), {
        mobileNotificationId: notificationRef.id,
        mobileNotificationSent: true,
        mobileNotificationTimestamp: serverTimestamp(),
        lastUpdated: serverTimestamp()
      })

      return {
        success: true,
        notificationId: notificationRef.id,
        message: `Notification created successfully for job ${jobId}`
      }
    } catch (error) {
      console.error('❌ Error creating mobile notification:', error)
      return {
        success: false,
        message: `Failed to create notification: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Register FCM token for a staff member
   */
  static async registerFCMToken(
    staffFirebaseUid: string,
    fcmToken: string,
    platform: 'ios' | 'android' | 'web' = 'android'
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`📱 Registering FCM token for staff UID: ${staffFirebaseUid}`)
      const db = getDb()

      const tokenData = {
        staffId: staffFirebaseUid,
        token: fcmToken,
        platform: platform,
        active: true,
        createdAt: serverTimestamp(),
        lastUsed: serverTimestamp()
      }

      await addDoc(collection(db, 'fcm_tokens'), tokenData)
      
      console.log(`✅ FCM token registered successfully`)

      return {
        success: true,
        message: 'FCM token registered successfully'
      }
    } catch (error) {
      console.error('❌ Error registering FCM token:', error)
      return {
        success: false,
        message: `Failed to register FCM token: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Get notification title based on type
   */
  private static getNotificationTitle(type: string, jobData: any): string {
    switch (type) {
      case 'job_assigned':
        return '🔔 New Job Assignment'
      case 'job_updated':
        return '📝 Job Updated'
      case 'job_reminder':
        return '⏰ Job Reminder'
      default:
        return '📱 Notification'
    }
  }

  /**
   * Get notification body based on type
   */
  private static getNotificationBody(type: string, jobData: any): string {
    const jobTitle = jobData.title || 'New Job'
    
    switch (type) {
      case 'job_assigned':
        return `You have been assigned: ${jobTitle}`
      case 'job_updated':
        return `Job updated: ${jobTitle}`
      case 'job_reminder':
        return `Reminder: ${jobTitle} is scheduled soon`
      default:
        return `Update for: ${jobTitle}`
    }
  }

  /**
   * Create notification for test job assignment
   */
  static async createTestJobNotification(
    staffFirebaseUid: string,
    jobId: string,
    jobData: any
  ): Promise<{ success: boolean; notificationId?: string; message: string }> {
    console.log(`🧪 Creating TEST job notification for staff UID: ${staffFirebaseUid}`)
    
    const testJobData = {
      ...jobData,
      title: `⚠️ TEST JOB: ${jobData.title || 'Villa Cleaning'}`,
      description: 'This is a test job for mobile app integration. Please accept this job to test the mobile app functionality.',
      specialInstructions: 'This is a test job. Please accept and test the mobile workflow.'
    }

    return await this.createJobNotification(
      staffFirebaseUid,
      jobId,
      testJobData,
      'job_assigned'
    )
  }
}

export default MobileNotificationService
