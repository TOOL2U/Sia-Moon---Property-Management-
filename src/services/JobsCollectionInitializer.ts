/**
 * Jobs Collection Initializer
 * Creates the jobs collection in Firestore if it doesn't exist
 * and ensures proper structure for mobile app integration
 */

import { getDb } from '@/lib/firebase'
import {
    addDoc,
    collection,
    getDocs,
    limit,
    query,
    serverTimestamp
} from 'firebase/firestore'

export class JobsCollectionInitializer {
  private static readonly JOBS_COLLECTION = 'jobs'
  private static readonly STAFF_NOTIFICATIONS_COLLECTION = 'staff_notifications'

  // Known staff@siamoon.com Firebase UID
  private static readonly STAFF_SIAMOON_UID = 'gTtR5gSKOtUEweLwchSnVreylMy1'
  private static readonly STAFF_SIAMOON_EMAIL = 'staff@siamoon.com'

  /**
   * Initialize the jobs collection if it doesn't exist
   */
  static async initializeJobsCollection(): Promise<{
    success: boolean
    message: string
    collectionsCreated: string[]
    error?: string
  }> {
    try {
      console.log('🔧 Initializing jobs collection...')
      const db = getDb()
      const collectionsCreated: string[] = []

      // Check if jobs collection exists by trying to query it
      const jobsQuery = query(collection(db, this.JOBS_COLLECTION), limit(1))
      const jobsSnapshot = await getDocs(jobsQuery)

      if (jobsSnapshot.empty) {
        console.log('📋 Jobs collection is empty, creating initial structure...')

        // Create a sample job document to establish the collection
        const sampleJob = {
          // Collection structure marker
          _isStructureDocument: true,
          _createdBy: 'JobsCollectionInitializer',
          _purpose: 'Establish collection structure for mobile app integration',

          // Standard job fields
          jobId: 'structure_sample_job',
          title: '📋 Collection Structure Sample',
          jobType: 'system',
          status: 'completed',
          priority: 'low',

          // Staff assignment fields
          assignedStaffId: this.STAFF_SIAMOON_UID,
          assignedStaffDocId: 'staff_sample',
          userId: this.STAFF_SIAMOON_UID,

          // Property information
          propertyName: 'System Structure Sample',
          propertyAddress: 'N/A',

          // Scheduling
          scheduledDate: new Date().toISOString().split('T')[0],
          scheduledStartTime: '00:00',
          estimatedDuration: 0,

          // Mobile integration flags
          notificationSent: false,
          mobileNotificationPending: false,
          syncVersion: 1,

          // Timestamps
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          completedAt: serverTimestamp()
        }

        await addDoc(collection(db, this.JOBS_COLLECTION), sampleJob)
        collectionsCreated.push(this.JOBS_COLLECTION)
        console.log('✅ Jobs collection created with structure document')
      } else {
        console.log('✅ Jobs collection already exists')
      }

      // Check staff_notifications collection
      const notificationsQuery = query(collection(db, this.STAFF_NOTIFICATIONS_COLLECTION), limit(1))
      const notificationsSnapshot = await getDocs(notificationsQuery)

      if (notificationsSnapshot.empty) {
        console.log('📱 Staff notifications collection is empty, creating initial structure...')

        const sampleNotification = {
          // Collection structure marker
          _isStructureDocument: true,
          _createdBy: 'JobsCollectionInitializer',
          _purpose: 'Establish collection structure for mobile notifications',

          // Notification targeting
          jobId: 'structure_sample_job',
          staffId: 'staff_sample',
          userId: this.STAFF_SIAMOON_UID,
          staffName: 'Structure Sample',

          // Notification content
          title: '📋 Collection Structure Sample',
          message: 'This is a structure sample for mobile notifications',
          type: 'system',
          priority: 'low',

          // Job summary
          jobTitle: '📋 Collection Structure Sample',
          jobType: 'system',
          propertyName: 'System Structure Sample',
          scheduledDate: new Date().toISOString().split('T')[0],
          scheduledStartTime: '00:00',

          // Notification status
          read: true,
          delivered: true,

          // Timestamps
          createdAt: serverTimestamp(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }

        await addDoc(collection(db, this.STAFF_NOTIFICATIONS_COLLECTION), sampleNotification)
        collectionsCreated.push(this.STAFF_NOTIFICATIONS_COLLECTION)
        console.log('✅ Staff notifications collection created with structure document')
      } else {
        console.log('✅ Staff notifications collection already exists')
      }

      return {
        success: true,
        message: `Collections initialized successfully. Created: ${collectionsCreated.join(', ') || 'none (already existed)'}`,
        collectionsCreated
      }

    } catch (error) {
      console.error('❌ Error initializing jobs collection:', error)
      return {
        success: false,
        message: 'Failed to initialize jobs collection',
        collectionsCreated: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Create a test job specifically for staff@siamoon.com
   */
  static async createTestJobForStaffSiamoon(): Promise<{
    success: boolean
    jobId?: string
    notificationId?: string
    message: string
    error?: string
  }> {
    try {
      console.log('🧪 Creating test job for staff@siamoon.com...')
      const db = getDb()

      // First ensure collections exist
      await this.initializeJobsCollection()

      // Create test job
      const testJob = {
        // Job identification
        jobId: `test_job_${Date.now()}`,
        bookingId: `test_booking_${Date.now()}`,

        // Staff assignment (CRITICAL for mobile app)
        assignedStaffId: this.STAFF_SIAMOON_UID,
        assignedStaffDocId: 'staff_siamoon',
        userId: this.STAFF_SIAMOON_UID,
        assignedStaffRef: 'staff_siamoon', // Reference to staff document

        // Job details
        title: '🧪 TEST JOB: Villa Cleaning for Mobile App',
        jobType: 'cleaning',
        priority: 'medium',
        status: 'assigned',

        // Property information
        propertyName: 'Ante cliffe Villa',
        propertyAddress: '123 Test Street, Test City',

        // Scheduling
        scheduledDate: new Date().toISOString().split('T')[0],
        scheduledStartTime: '14:00',
        estimatedDuration: 120,
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
        description: 'Test job created from admin panel for mobile app testing',
        specialInstructions: 'This is a test job - please acknowledge receipt in mobile app',
        requiredSkills: ['cleaning', 'basic_maintenance'],
        requiredSupplies: ['cleaning_supplies', 'basic_tools'],

        // Additional fields for mobile app compatibility
        bookingId: `test_booking_${Date.now()}`,
        propertyId: 'test_property_001',

        // Mobile integration flags
        notificationSent: true,
        mobileNotificationPending: true,
        syncVersion: 1,

        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        assignedAt: serverTimestamp()
      }

      const jobRef = await addDoc(collection(db, this.JOBS_COLLECTION), testJob)
      console.log(`✅ Test job created with ID: ${jobRef.id}`)

      // Create notification for mobile app
      const notification = {
        // Notification targeting
        jobId: jobRef.id,
        staffId: 'staff_siamoon',
        userId: this.STAFF_SIAMOON_UID,
        staffName: 'Staff Member',

        // Notification content
        title: 'New Job Assignment',
        message: 'You have been assigned a new cleaning job at Ante cliffe Villa',
        type: 'job_assignment',
        priority: 'medium',

        // Job summary for mobile app
        jobTitle: testJob.title,
        jobType: testJob.jobType,
        propertyName: testJob.propertyName,
        scheduledDate: testJob.scheduledDate,
        scheduledStartTime: testJob.scheduledStartTime,

        // Notification status
        read: false,
        delivered: false,

        // Timestamps
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }

      const notificationRef = await addDoc(collection(db, this.STAFF_NOTIFICATIONS_COLLECTION), notification)
      console.log(`✅ Notification created with ID: ${notificationRef.id}`)

      // Send actual push notifications to mobile app
      await this.sendPushNotifications(testJob, jobRef.id)

      return {
        success: true,
        jobId: jobRef.id,
        notificationId: notificationRef.id,
        message: `Test job created successfully for ${this.STAFF_SIAMOON_EMAIL}`
      }

    } catch (error) {
      console.error('❌ Error creating test job:', error)
      return {
        success: false,
        message: 'Failed to create test job',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Send push notifications to mobile app using multiple services
   */
  private static async sendPushNotifications(jobData: any, jobId: string): Promise<void> {
    try {
      console.log('📱 Sending push notifications for job:', jobId)

      // Import notification services dynamically
      const [
        { MobileNotificationService },
        fcmServiceModule,
        { ExpoPushService }
      ] = await Promise.all([
        import('./MobileNotificationService'),
        import('./FCMNotificationService'),
        import('./ExpoPushService')
      ])

      // FCMNotificationService is exported as default singleton instance
      const fcmService = fcmServiceModule.default

      // 1. Create mobile notification document (for in-app notifications)
      console.log('📱 Job data being sent to MobileNotificationService:', {
        staffUid: this.STAFF_SIAMOON_UID,
        jobId: jobId,
        jobDataKeys: Object.keys(jobData),
        hasAssignedStaffRef: 'assignedStaffRef' in jobData,
        hasDeadline: 'deadline' in jobData
      })

      const mobileNotificationResult = await MobileNotificationService.createJobNotification(
        this.STAFF_SIAMOON_UID,
        jobId,
        jobData,
        'job_assigned'
      )

      if (mobileNotificationResult.success) {
        console.log('✅ Mobile notification document created:', mobileNotificationResult.notificationId)
      } else {
        console.warn('⚠️ Failed to create mobile notification document')
      }

      // 2. Send FCM push notification
      const fcmResult = await fcmService.sendNotificationToStaff(
        'staff_siamoon', // Staff document ID
        {
          title: 'New Job Assignment',
          body: `You have been assigned: ${jobData.title}`,
          data: {
            type: 'job_assignment',
            jobId: jobId,
            staffId: this.STAFF_SIAMOON_UID,
            action: 'open_job_details'
          },
          icon: '/icons/job-notification.png',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK'
        }
      )

      if (fcmResult.success) {
        console.log('✅ FCM notification sent successfully')
      } else {
        console.warn('⚠️ FCM notification failed:', fcmResult.error)
      }

      // 3. Send Expo push notification
      const expoResult = await ExpoPushService.sendToStaff(
        ['staff_siamoon'], // Staff IDs
        'New Job Assignment',
        `You have been assigned: ${jobData.title}`,
        {
          type: 'job_assignment',
          jobId: jobId,
          staffId: this.STAFF_SIAMOON_UID,
          action: 'open_job_details'
        }
      )

      if (expoResult.success) {
        console.log('✅ Expo push notification sent successfully')
      } else {
        console.warn('⚠️ Expo push notification failed:', expoResult.error)
      }

      console.log('📱 Push notification sending completed')

    } catch (error) {
      console.error('❌ Error sending push notifications:', error)
      console.error('📱 Notification services may not be properly configured, but job creation will continue')
      // Don't throw error - notification failure shouldn't break job creation
    }
  }

  /**
   * Verify collections exist and are properly structured
   */
  static async verifyCollections(): Promise<{
    success: boolean
    collections: { [key: string]: { exists: boolean; documentCount: number } }
    message: string
  }> {
    try {
      const db = getDb()
      const collections = {}

      // Check jobs collection
      const jobsQuery = query(collection(db, this.JOBS_COLLECTION), limit(10))
      const jobsSnapshot = await getDocs(jobsQuery)
      collections[this.JOBS_COLLECTION] = {
        exists: !jobsSnapshot.empty,
        documentCount: jobsSnapshot.size
      }

      // Check staff_notifications collection
      const notificationsQuery = query(collection(db, this.STAFF_NOTIFICATIONS_COLLECTION), limit(10))
      const notificationsSnapshot = await getDocs(notificationsQuery)
      collections[this.STAFF_NOTIFICATIONS_COLLECTION] = {
        exists: !notificationsSnapshot.empty,
        documentCount: notificationsSnapshot.size
      }

      return {
        success: true,
        collections,
        message: 'Collections verified successfully'
      }

    } catch (error) {
      console.error('❌ Error verifying collections:', error)
      return {
        success: false,
        collections: {},
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

export default JobsCollectionInitializer
