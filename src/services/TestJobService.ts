/**
 * Test Job Service
 * This service is for testing mobile job integration only
 * Enhanced with better Firebase integration and diagnostic capabilities
 */

import { getDb } from '@/lib/firebase'
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { nanoid } from 'nanoid'

class TestJobService {
  // For diagnostic purposes
  static debug: boolean = true
  static lastJobId: string | null = null
  static lastNotificationId: string | null = null

  /**
   * Log a debug message if debug mode is enabled
   * @param message The message to log
   * @param data Optional data to include in the log
   */
  static debugLog(message: string, data?: any) {
    if (this.debug) {
      console.log(`🧪 [TestJobService] ${message}`)
      if (data) {
        console.log(data)
      }
    }
  }

  /**
   * Create a test job to send to mobile app
   * @param options Optional configuration for the test job
   */
  static async createTestJob(
    options: {
      useSpecificStaffId?: string
      useSpecificUserId?: string
      priority?: 'low' | 'medium' | 'high'
      jobType?: string
      notificationMessage?: string
      forceManualStaffInfo?: boolean // Force using manual staff info even if no staff in DB
      manualStaffInfo?: {
        staffId: string
        userId: string
        name: string
        email: string
      }
    } = {}
  ) {
    try {
      console.log('🧪 Creating test job in Firebase...')
      const db = getDb()

      // Use manual staff info if provided
      if (options.forceManualStaffInfo && options.manualStaffInfo) {
        console.log('ℹ️ Using manually provided staff information')
        return this.createTestJobWithStaffInfo(
          options.manualStaffInfo.staffId,
          options.manualStaffInfo.userId,
          options.manualStaffInfo.name,
          options.manualStaffInfo.email,
          options
        )
      }

      // Get all active staff members
      const staffCollection = collection(db, 'staff_accounts')

      // Create a query that prioritizes staff with userIds if available
      const staffQuery = query(staffCollection, where('isActive', '==', true))
      const staffDocs = await getDocs(staffQuery)

      let staffId = options.useSpecificStaffId || ''
      let staffName = ''
      let staffEmail = ''
      let userId = options.useSpecificUserId || ''

      // First, try to find staff@siamoon.com specifically
      if (!staffDocs.empty) {
        for (const staffDoc of staffDocs.docs) {
          const staffData = staffDoc.data()
          if (staffData.email === 'staff@siamoon.com') {
            staffId = staffDoc.id
            staffName = staffData.name || 'Staff Member'
            staffEmail = staffData.email
            // Use firebaseUid if available, otherwise fallback to userId
            userId = staffData.firebaseUid || staffData.userId
            console.log(
              `✅ Using target staff: ${staffName} (${staffEmail}) with Firebase UID: ${userId}`
            )
            break
          }
        }
      }

      // If staff@siamoon.com not found, fallback to first active staff with Firebase UID
      if (!staffId && !staffDocs.empty) {
        console.log(
          '⚠️ staff@siamoon.com not found, using first available staff with Firebase UID...'
        )
        for (const staffDoc of staffDocs.docs) {
          const staffData = staffDoc.data()
          const firebaseUid = staffData.firebaseUid || staffData.userId
          if (firebaseUid) {
            staffId = staffDoc.id
            staffName = staffData.name || 'Staff Member'
            staffEmail = staffData.email || 'staff@example.com'
            userId = firebaseUid
            console.log(
              `✅ Using fallback staff: ${staffName} (${staffEmail}) with Firebase UID: ${userId}`
            )
            break
          }
        }
      }

      // If no staff found with userId, use fallback
      if (!staffId) {
        staffId = 'staff001'
        staffName = 'Test Staff'
        userId = 'user001' // Fallback user ID
        staffEmail = 'teststaff@example.com'
        console.warn('⚠️ No staff with userId found - using fallback values')
      }

      const now = new Date()
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      // Format dates
      const todayFormatted = now.toISOString().split('T')[0]
      const tomorrowFormatted = tomorrow.toISOString().split('T')[0]

      // Generate a unique job ID with test prefix
      const jobId = `test_job_${nanoid(6)}`

      // Create test job data
      // Note: Using 'any' to bypass TypeScript errors for custom fields
      const testJob: any = {
        // Booking Reference
        bookingId: `test_booking_${nanoid(6)}`,
        bookingRef: {
          id: `test_booking_${nanoid(6)}`,
          guestName: 'Michael Thompson',
          propertyName: 'Ante cliffe Villa',
          checkInDate: todayFormatted,
          checkOutDate: tomorrowFormatted,
          guestCount: 6,
        },

        // Property Reference
        propertyId: `ante_cliffe_villa_id`,
        propertyRef: {
          id: `ante_cliffe_villa_id`,
          name: 'Ante cliffe Villa',
          coordinates: {
            latitude: 7.9985,
            longitude: 98.2965,
          },
          googleMapsLink: 'https://maps.google.com/?q=7.9985,98.2965',
        },

        // Job Details
        jobType: 'cleaning',
        title: 'Villa Cleaning - Ante cliffe',
        description: 'Villa cleaning job for Ante cliffe property.',
        priority: 'medium',

        // Scheduling
        scheduledDate: todayFormatted,
        scheduledStartTime: '14:00',
        scheduledEndTime: '16:00',
        estimatedDuration: 120, // 2 hours
        deadline: tomorrowFormatted,

        // Staff Assignment - CRITICAL: Use Firebase UID for mobile app compatibility
        assignedStaffId: userId, // Firebase UID for mobile app queries
        assignedStaffDocId: staffId, // Staff document ID for web app reference
        userId: userId, // Legacy field for backward compatibility
        assignedStaffRef: {
          id: staffId, // Staff document ID
          firebaseUid: userId, // Firebase UID
          name: staffName,
          role: 'Maintenance',
          skills: ['cleaning', 'attention_to_detail'],
        },
        // Add user reference in a separate property that won't cause type issues
        userRef: {
          userId: userId,
          staffDocId: staffId,
        },

        // Assignment Details
        assignedAt: now.toISOString(),
        assignedBy: {
          id: 'admin',
          name: 'System Admin',
        },

        // Job Status - start with pending, will update to assigned after creation
        status: 'pending',
        statusHistory: [
          {
            status: 'pending',
            timestamp: now.toISOString(),
            updatedBy: 'admin',
            notes: 'Test job created for mobile app testing',
          },
        ],

        // Requirements
        requiredSkills: ['cleaning', 'attention_to_detail'],
        specialInstructions:
          'Ante cliffe Villa test cleaning job. Property has 4 bedrooms, 3 bathrooms. Please check pool maintenance equipment. Emergency contact: Khun Somchai +66 85 123 4567.',

        // Location & Access
        location: {
          address: '89/12 Moo 6, Kamala Beach, Kathu District, Phuket 83150, Thailand',
          coordinates: {
            latitude: 7.9985,
            longitude: 98.2965,
          },
          accessInstructions: 'Main gate access code: 9876. Villa door access code: 2468. Wi-Fi: AnteCliffeVilla / Pass: Beach2024!',
          parkingInstructions: 'Covered parking available for 2 cars. Additional street parking on Kamala Beach Road.',
        },

        // Timestamps
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),

        // Mobile Sync Optimization - Enhanced Structure
        syncVersion: 1,
        mobileOptimized: {
          // CRITICAL DATA - Always send first, highest priority
          critical: {
            title: 'Villa Cleaning - Ante cliffe',
            googleMapsLink: 'https://maps.google.com/?q=7.9985,98.2965',
            accessCodes: '9876 / 2468',
            emergencyContact: '+66 85 123 4567',
            scheduledTime: '14:00',
            jobType: 'cleaning'
          },
          
          // JOB-SPECIFIC DATA - Send after job acceptance
          jobDetails: {
            type: 'cleaning',
            estimatedDuration: '2 hours',
            suppliesRequired: ['All-purpose cleaner', 'Vacuum', 'Mop', 'Pool cleaning kit'],
            checklist: [
              'Clean all 4 bedrooms',
              'Clean 3 bathrooms', 
              'Kitchen deep clean',
              'Pool maintenance check',
              'Garden area tidy'
            ],
            specialInstructions: 'Focus on pool area - check equipment'
          },
          
          // PROPERTY CONTEXT - Load on-demand
          propertyContext: {
            layout: '4BR/3BA villa with pool',
            guestStatus: 'checked-out',
            lastCleaning: '3 days ago',
            previousIssues: ['Pool pump needed attention last visit'],
            specialNotes: ['Automatic gate - closes after 30 seconds', 'Pool equipment shed behind villa']
          },
          
          // COMPLETION TRACKING - For job finish
          completion: {
            photoRequired: true,
            photoRequirements: ['Before/after pool area', 'Completed bedrooms', 'Kitchen final state'],
            reportFields: ['cleaning_completed', 'issues_found', 'supplies_used'],
            nextSteps: ['Report any equipment issues', 'Lock all doors', 'Set security system']
          }
        },

        // Required for mobile notification system
        notificationSent: true,
        mobileNotificationPending: true,
      }

      // Save to Firebase with pending status first
      console.log('💾 Saving test job to Firebase...')
      const jobRef = await addDoc(collection(db, 'jobs'), testJob)
      console.log(`✅ Test job created with ID: ${jobRef.id}`)

      // Wait a moment to ensure the document is created
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Update to assigned status to trigger notifications
      await updateDoc(doc(db, 'jobs', jobRef.id), {
        status: 'assigned',
        assignedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        statusHistory: [
          {
            status: 'pending',
            timestamp: now.toISOString(),
            updatedBy: 'admin',
            notes: 'Test job created for mobile app testing',
          },
          {
            status: 'assigned',
            timestamp: new Date().toISOString(),
            updatedBy: 'admin',
            notes: 'Test job assigned to staff',
          },
        ],
      })
      console.log(`✅ Job ${jobRef.id} updated to assigned status`)

      // Create notification in staff_notifications collection
      const notificationData = {
        jobId: jobRef.id,
        staffId: staffId,
        userId: userId, // Add the userId for the notification
        staffName: staffName,
        staffEmail: staffEmail,
        jobTitle: testJob.title,
        jobType: testJob.jobType,
        priority: testJob.priority,
        propertyName: testJob.propertyRef.name,
        propertyAddress: testJob.location.address,
        scheduledDate: testJob.scheduledDate,
        scheduledStartTime: testJob.scheduledStartTime,
        estimatedDuration: testJob.estimatedDuration,
        specialInstructions: testJob.specialInstructions,
        type: 'job_assigned',
        status: 'pending',
        readAt: null,
        actionRequired: true,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      }

      const notificationRef = await addDoc(
        collection(db, 'staff_notifications'),
        notificationData
      )
      console.log(`✅ Notification created with ID: ${notificationRef.id}`)

      return {
        success: true,
        jobId: jobRef.id,
        notificationId: notificationRef.id,
        staffId: staffId,
        userId: userId,
        staffName: staffName,
        staffEmail: staffEmail,
      }
    } catch (error) {
      console.error('❌ Error creating test job:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Assign test job to a specific staff member
   */
  static async assignTestJob(
    jobId: string,
    staffId: string,
    staffName: string = 'Test Staff'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🧪 Assigning test job ${jobId} to staff ${staffId}...`)

      const db = getDb()
      const now = new Date()

      // Try to get staff data from Firebase to get userId
      let userId = ''
      try {
        const staffDoc = await getDoc(doc(db, 'staff_accounts', staffId))
        if (staffDoc.exists()) {
          const staffData = staffDoc.data()
          userId = staffData.userId || ''
          console.log(`✅ Found userId: ${userId} for staff ${staffId}`)
        }
      } catch (err) {
        console.warn(
          `⚠️ Could not get staff document, using default userId: ${err}`
        )
      }

      // Use provided staff details directly
      const staffDetails = {
        id: staffId,
        name: staffName,
        role: 'staff',
        skills: ['cleaning', 'maintenance'],
      }

      // Update the job with staff details - CRITICAL: Use Firebase UID for mobile compatibility
      await updateDoc(doc(db, 'jobs', jobId), {
        assignedStaffId: userId || 'user001', // Firebase UID for mobile app queries
        assignedStaffDocId: staffId, // Staff document ID for web app reference
        userId: userId || 'user001', // Legacy field
        assignedStaffRef: {
          id: staffId, // Staff document ID
          firebaseUid: userId, // Firebase UID
          name: staffDetails.name,
          role: staffDetails.role || 'staff',
          skills: staffDetails.skills || [],
        },
        status: 'assigned',
        statusHistory: [
          {
            status: 'pending',
            timestamp: now.toISOString(),
            updatedBy: 'admin',
            notes: 'Test job created for mobile app testing',
          },
          {
            status: 'assigned',
            timestamp: now.toISOString(),
            updatedBy: 'admin',
            notes: 'Test job assigned to staff',
          },
        ],
        updatedAt: now.toISOString(),
        syncVersion: 2,
        mobileNotificationPending: true,
      })

      // Create enhanced notification for the mobile app
      const notificationData = {
        jobId: jobId,
        staffId: staffId,
        userId: userId || 'user001',
        staffName: staffName,
        staffEmail: 'test@example.com',
        
        // CRITICAL INFO - Immediate display
        jobTitle: 'Villa Cleaning - Ante cliffe',
        jobType: 'cleaning',
        propertyName: 'Ante cliffe Villa',
        googleMapsLink: 'https://maps.google.com/?q=7.9985,98.2965',
        scheduledStartTime: '14:00',
        accessCodes: '9876 / 2468',
        emergencyContact: '+66 85 123 4567',
        estimatedDuration: '2 hours',
        
        // METADATA
        type: 'job_assigned',
        status: 'pending',
        readAt: null,
        actionRequired: true,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      }

      const notificationRef = await addDoc(
        collection(db, 'staff_notifications'),
        notificationData
      )
      console.log(`✅ Notification created with ID: ${notificationRef.id}`)

      console.log(`✅ Test job ${jobId} assigned to staff ${staffId}`)

      return { success: true }
    } catch (error) {
      console.error('❌ Error assigning test job:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Verify Firebase connection
   */
  static async verifyFirebaseConnection(): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      console.log('🧪 Verifying Firebase connection...')

      const db = getDb()
      if (!db) {
        throw new Error('Firebase DB instance not available')
      }

      // Try to read a document to verify connection
      try {
        const testQuery = query(collection(db, 'staff_accounts'), limit(1))
        const testSnapshot = await getDocs(testQuery)
        console.log(
          `✅ Firebase connection verified successfully: Read ${testSnapshot.size} document(s)`
        )
      } catch (readError) {
        throw new Error(
          `Firebase connection established but read failed: ${readError instanceof Error ? readError.message : 'Unknown error'}`
        )
      }

      return { success: true }
    } catch (error) {
      console.error('❌ Error verifying Firebase connection:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Verify that staff accounts have userIds set up
   * This is critical for mobile app integration
   */
  static async verifyStaffUserIds(): Promise<{
    success: boolean
    staffWithUserIds: number
    staffMissingUserIds: number
    totalStaff: number
    error?: string
  }> {
    try {
      console.log('🧪 Checking staff accounts for userId fields...')

      const db = getDb()

      const staffQuery = query(
        collection(db, 'staff_accounts'),
        where('isActive', '==', true)
      )
      const staffSnapshot = await getDocs(staffQuery)

      if (staffSnapshot.empty) {
        console.log('ℹ️ No active staff accounts found')
        return {
          success: true,
          staffWithUserIds: 0,
          staffMissingUserIds: 0,
          totalStaff: 0,
        }
      }

      let staffWithUserIds = 0
      let staffMissingUserIds = 0

      staffSnapshot.forEach((doc) => {
        const data = doc.data() as Record<string, any>
        if (data.userId) {
          staffWithUserIds++
        } else {
          staffMissingUserIds++
          console.warn(
            `⚠️ Staff account ${doc.id} (${data.name || 'No name'}) is missing userId field`
          )
        }
      })

      const totalStaff = staffSnapshot.size

      if (staffMissingUserIds > 0) {
        console.warn(
          `⚠️ CRITICAL: Found ${staffMissingUserIds} staff accounts missing userId field!`
        )
        console.warn(
          '⚠️ Staff without userIds will not see their jobs in the mobile app'
        )
        console.warn('⚠️ Run the staff-fix.js script to fix this issue')
      } else if (staffWithUserIds > 0) {
        console.log(
          `✅ All ${staffWithUserIds} staff accounts have userId field`
        )
      }

      return {
        success: true,
        staffWithUserIds,
        staffMissingUserIds,
        totalStaff,
      }
    } catch (error) {
      console.error('❌ Error checking staff userIds:', error)
      return {
        success: false,
        staffWithUserIds: 0,
        staffMissingUserIds: 0,
        totalStaff: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Verify if a job was properly created in Firebase
   * @param jobId The ID of the job to verify
   */
  static async verifyJobCreated(jobId: string): Promise<{
    exists: boolean
    jobData?: any
    notificationExists?: boolean
    notificationData?: any
    error?: string
  }> {
    try {
      console.log(`🧪 Verifying job ${jobId} in Firebase...`)

      const db = getDb()

      // Check if the job exists
      const jobDoc = await getDoc(doc(db, 'jobs', jobId))
      if (!jobDoc.exists()) {
        return { exists: false, error: 'Job document does not exist' }
      }

      const jobData = jobDoc.data()
      console.log('✅ Job exists in Firebase')
      this.debugLog('Job data:', jobData)

      // Check for related notifications
      const notificationsQuery = query(
        collection(db, 'staff_notifications'),
        where('jobId', '==', jobId),
        limit(1)
      )

      const notificationsSnapshot = await getDocs(notificationsQuery)
      const notificationExists = !notificationsSnapshot.empty

      if (notificationExists) {
        const notificationData = notificationsSnapshot.docs[0].data()
        console.log(
          `✅ Found notification with ID: ${notificationsSnapshot.docs[0].id}`
        )
        this.debugLog('Notification data:', notificationData)

        return {
          exists: true,
          jobData,
          notificationExists: true,
          notificationData,
        }
      }

      return {
        exists: true,
        jobData,
        notificationExists: false,
      }
    } catch (error) {
      console.error('❌ Error verifying job:', error)
      return {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Check for recent test jobs in Firebase
   */
  static async checkRecentTestJobs(): Promise<{
    success: boolean
    jobs?: Array<Record<string, any>>
    count?: number
    error?: string
  }> {
    try {
      console.log('🧪 Checking for recent test jobs in Firebase...')

      const db = getDb()

      // Query for jobs with test_ in the title or ID
      const jobsQuery = query(
        collection(db, 'jobs'),
        orderBy('createdAt', 'desc'),
        limit(5)
      )

      const jobsSnapshot = await getDocs(jobsQuery)

      if (jobsSnapshot.empty) {
        console.log('ℹ️ No recent jobs found')
        return { success: true, jobs: [], count: 0 }
      }

      // Using any[] type for safety
      const jobs: Array<Record<string, any>> = []

      jobsSnapshot.forEach((doc) => {
        const data = doc.data()
        const id = doc.id
        const job: Record<string, any> = { id, ...data }

        // Check if this is a test job
        if (
          (typeof job.title === 'string' && job.title.includes('TEST JOB')) ||
          (typeof id === 'string' && id.includes('test_job'))
        ) {
          jobs.push(job)
        }
      })

      console.log(`✅ Found ${jobs.length} recent test jobs`)
      this.debugLog('Recent test jobs:', jobs)

      return { success: true, jobs, count: jobs.length }
    } catch (error) {
      console.error('❌ Error checking recent test jobs:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Check recent notifications for a specific staff member
   */
  static async checkStaffNotifications(staffId: string): Promise<{
    success: boolean
    notifications?: any[]
    count?: number
    error?: string
  }> {
    try {
      console.log(`🧪 Checking notifications for staff ${staffId}...`)

      const db = getDb()

      const notificationsQuery = query(
        collection(db, 'staff_notifications'),
        where('staffId', '==', staffId),
        orderBy('createdAt', 'desc'),
        limit(10)
      )

      const notificationsSnapshot = await getDocs(notificationsQuery)

      if (notificationsSnapshot.empty) {
        console.log(`ℹ️ No notifications found for staff ${staffId}`)
        return { success: true, notifications: [], count: 0 }
      }

      const notifications = notificationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      console.log(
        `✅ Found ${notifications.length} notifications for staff ${staffId}`
      )
      this.debugLog('Staff notifications:', notifications)

      return { success: true, notifications, count: notifications.length }
    } catch (error) {
      console.error('❌ Error checking staff notifications:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Create a test job with specific staff information
   * This helper method is used by createTestJob when staff info is provided
   */
  static async createTestJobWithStaffInfo(
    staffId: string,
    userId: string,
    staffName: string,
    staffEmail: string,
    options: {
      priority?: 'low' | 'medium' | 'high'
      jobType?: string
      notificationMessage?: string
    } = {}
  ) {
    try {
      console.log(
        `🧪 Creating test job for staff ${staffName} (${staffId}) with userId: ${userId}`
      )
      const db = getDb()

      const now = new Date()
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      // Format dates
      const todayFormatted = now.toISOString().split('T')[0]
      const tomorrowFormatted = tomorrow.toISOString().split('T')[0]

      // Generate a unique job ID with test prefix
      const jobId = `test_job_${nanoid(6)}`

      // Create test job data with comprehensive Ante cliffe Villa information
      // Note: Using 'any' to bypass TypeScript errors for custom fields
      const testJob: any = {
        // Booking Reference
        bookingId: `test_booking_${nanoid(6)}`,
        bookingRef: {
          id: `test_booking_${nanoid(6)}`,
          guestName: 'Test Guest - Mobile App Integration',
          propertyName: 'Ante cliffe Villa',
          checkInDate: todayFormatted,
          checkOutDate: tomorrowFormatted,
          guestCount: 6,
        },

        // Property Reference - Ante cliffe Villa with comprehensive details
        propertyId: `ante_cliffe_villa_001`,
        propertyRef: {
          id: `ante_cliffe_villa_001`,
          name: 'Ante cliffe Villa',
          address: '456/78 Moo 3, Choeng Thale, Thalang District, Phuket 83110, Thailand',
          coordinates: {
            latitude: 7.9985, // Choeng Thale, Phuket coordinates
            longitude: 98.2965,
          },
          // Comprehensive property details
          bedrooms: 4,
          bathrooms: 3,
          maxGuests: 8,
          landSizeSqm: 800,
          villaSizeSqm: 320,
          yearBuilt: 2018,
          // Amenities
          amenities: [
            'Private Pool',
            'Ocean View',
            'Garden',
            'Air Conditioning',
            'WiFi',
            'Parking',
            'Kitchen',
            'Laundry',
            'BBQ Area',
            'Security System'
          ],
          hasPool: true,
          hasGarden: true,
          hasAirConditioning: true,
          hasParking: true,
          hasLaundry: true,
          hasBackupPower: true,
          // Utilities
          electricityProvider: 'PEA (Provincial Electricity Authority)',
          waterSource: 'Municipal Water Supply',
          internetProvider: 'True Online',
          internetPackage: 'Fiber 200/100 Mbps',
          // Access & Security
          hasSmartLock: true,
          hasSecuritySystem: true,
          gateRemoteDetails: 'Automatic gate with remote control',
          // Contact & Emergency
          emergencyContactName: 'Khun Somchai (Property Manager)',
          emergencyContactPhone: '+66 85 123 4567',
          // Location details
          distanceToBeach: 0.8, // km
          distanceToAirport: 12.5, // km  
          distanceToCenter: 2.1, // km to Bang Tao center
          neighborhood: 'Bang Tao Beach Area',
          landmarks: ['Bang Tao Beach', 'Lotus Tesco', 'Blue Tree Phuket', 'Boat Avenue']
        },

        // Job Details
        jobType: options.jobType || 'cleaning',
        title: `Villa Cleaning - Ante cliffe`,
        description: 'Villa cleaning job for Ante cliffe property.',
        priority: options.priority || 'medium',

        // Scheduling
        scheduledDate: todayFormatted,
        scheduledStartTime: '14:00',
        scheduledEndTime: '16:00',
        estimatedDuration: 120, // 2 hours
        deadline: tomorrowFormatted,

        // Staff Assignment - CRITICAL: Use Firebase UID for mobile app compatibility
        assignedStaffId: userId, // Firebase UID for mobile app queries
        assignedStaffDocId: staffId, // Staff document ID for web app reference
        userId: userId, // Legacy field for backward compatibility
        assignedStaffRef: {
          id: staffId, // Staff document ID
          firebaseUid: userId, // Firebase UID
          name: staffName,
          role: 'Maintenance',
          skills: ['cleaning', 'attention_to_detail'],
        },
        // Add user reference in a separate property that won't cause type issues
        userRef: {
          userId: userId,
        },

        // Assignment Details
        assignedAt: now.toISOString(),
        assignedBy: {
          id: 'admin',
          name: 'System Admin',
        },

        // Job Status - start with pending, will update to assigned after creation
        status: 'pending',
        statusHistory: [
          {
            status: 'pending',
            timestamp: now.toISOString(),
            updatedBy: 'admin',
            notes: 'Test job created for mobile app testing',
          },
        ],

        // Requirements
        requiredSkills: ['cleaning', 'attention_to_detail'],
        specialInstructions:
          'Ante cliffe Villa test cleaning job. Property has 4 bedrooms, 3 bathrooms. Please check pool maintenance equipment. Emergency contact: Khun Somchai +66 85 123 4567.',

        // Location & Access
        location: {
          address: '89/12 Moo 6, Kamala Beach, Kathu District, Phuket 83150, Thailand',
          coordinates: {
            latitude: 7.9985,
            longitude: 98.2965,
          },
          accessInstructions: 'Main gate access code: 9876. Villa door access code: 2468. Wi-Fi: AnteCliffeVilla / Pass: Beach2024!',
          parkingInstructions: 'Covered parking available for 2 cars. Additional street parking on Kamala Beach Road.',
        },

        // Timestamps
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),

        // Mobile Sync Optimization - Enhanced Structure
        syncVersion: 1,
        mobileOptimized: {
          // CRITICAL DATA - Always send first, highest priority
          critical: {
            title: 'Villa Cleaning - Ante cliffe',
            googleMapsLink: 'https://maps.google.com/?q=7.9985,98.2965',
            accessCodes: '9876 / 2468',
            emergencyContact: '+66 85 123 4567',
            scheduledTime: '14:00',
            jobType: options.jobType || 'cleaning'
          },
          
          // JOB-SPECIFIC DATA - Send after job acceptance
          jobDetails: {
            type: options.jobType || 'cleaning',
            estimatedDuration: '2 hours',
            suppliesRequired: ['All-purpose cleaner', 'Vacuum', 'Mop', 'Pool cleaning kit'],
            checklist: [
              'Clean all 4 bedrooms',
              'Clean 3 bathrooms', 
              'Kitchen deep clean',
              'Pool maintenance check',
              'Garden area tidy'
            ],
            specialInstructions: 'Focus on pool area - check equipment',
            priority: options.priority || 'medium'
          },
          
          // PROPERTY CONTEXT - Load on-demand
          propertyContext: {
            layout: '4BR/3BA villa with pool',
            guestStatus: 'checked-out',
            lastCleaning: '3 days ago',
            previousIssues: ['Pool pump needed attention last visit'],
            specialNotes: ['Automatic gate - closes after 30 seconds', 'Pool equipment shed behind villa'],
            safetyNotes: ['Steep driveway when wet', 'Pool area can be slippery']
          },
          
          // NAVIGATION & LOCATION - Enhanced location data
          locationData: {
            googleMapsLink: 'https://maps.google.com/?q=7.9985,98.2965',
            landmarks: 'Blue Tree Phuket shopping center nearby',
            parkingInstructions: 'Covered parking for 2 cars, gate remote in villa',
            accessInstructions: 'Main gate: 9876, Villa door: 2468'
          },
          
          // COMPLETION TRACKING - For job finish
          completion: {
            photoRequired: true,
            photoRequirements: ['Before/after pool area', 'Completed bedrooms', 'Kitchen final state'],
            reportFields: ['cleaning_completed', 'issues_found', 'supplies_used', 'time_spent'],
            nextSteps: ['Report any equipment issues', 'Lock all doors', 'Set security system'],
            completionConfirmation: 'photo'
          }
        },

        // Required for mobile notification system
        notificationSent: true,
        mobileNotificationPending: true,
      }

      // Save to Firebase with pending status first
      console.log('💾 Saving test job to Firebase...')
      const jobRef = await addDoc(collection(db, 'jobs'), testJob)
      console.log(`✅ Test job created with ID: ${jobRef.id}`)

      // Store the job ID for reference
      this.lastJobId = jobRef.id

      // Wait a moment to ensure the document is created
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Update to assigned status to trigger notifications
      await updateDoc(doc(db, 'jobs', jobRef.id), {
        status: 'assigned',
        assignedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        statusHistory: [
          {
            status: 'pending',
            timestamp: now.toISOString(),
            updatedBy: 'admin',
            notes: 'Test job created for mobile app testing',
          },
          {
            status: 'assigned',
            timestamp: new Date().toISOString(),
            updatedBy: 'admin',
            notes: 'Test job assigned to staff',
          },
        ],
      })
      console.log(`✅ Job ${jobRef.id} updated to assigned status`)

      // Create notification in staff_notifications collection
      const notificationData = {
        jobId: jobRef.id,
        staffId: staffId,
        userId: userId, // Add the userId for the notification
        staffName: staffName,
        staffEmail: staffEmail,
        jobTitle: testJob.title,
        jobType: testJob.jobType,
        priority: testJob.priority,
        propertyName: testJob.propertyRef.name,
        propertyAddress: testJob.location.address,
        scheduledDate: testJob.scheduledDate,
        scheduledStartTime: testJob.scheduledStartTime,
        estimatedDuration: testJob.estimatedDuration,
        specialInstructions: testJob.specialInstructions,
        type: 'job_assigned',
        status: 'pending',
        readAt: null,
        actionRequired: true,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      }

      const notificationRef = await addDoc(
        collection(db, 'staff_notifications'),
        notificationData
      )
      console.log(`✅ Notification created with ID: ${notificationRef.id}`)

      // Store the notification ID for reference
      this.lastNotificationId = notificationRef.id

      // Create mobile notification for the mobile app
      console.log('📱 Creating mobile notification for mobile app...')
      try {
        // Import MobileNotificationService dynamically to avoid import issues
        const { MobileNotificationService } = await import(
          './MobileNotificationService'
        )

        const mobileNotificationResult =
          await MobileNotificationService.createTestJobNotification(
            userId, // Firebase UID for mobile app queries
            jobRef.id,
            testJob
          )

        if (mobileNotificationResult.success) {
          console.log(
            `✅ Mobile notification created: ${mobileNotificationResult.notificationId}`
          )
        } else {
          console.warn(
            `⚠️ Mobile notification failed: ${mobileNotificationResult.message}`
          )
        }
      } catch (error) {
        console.warn('⚠️ Failed to create mobile notification:', error)
      }

      return {
        success: true,
        jobId: jobRef.id,
        notificationId: notificationRef.id,
        staffId: staffId,
        userId: userId,
        staffName: staffName,
        staffEmail: staffEmail,
      }
    } catch (error) {
      console.error('❌ Error creating test job:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get all active staff with userIds to help with testing
   */
  static async listActiveStaffWithUserIds(): Promise<{
    success: boolean
    staff?: Array<Record<string, any>>
    count?: number
    error?: string
  }> {
    try {
      console.log('🧪 Listing active staff with userIds...')

      const db = getDb()

      const staffQuery = query(
        collection(db, 'staff_accounts'),
        where('isActive', '==', true)
      )

      const staffSnapshot = await getDocs(staffQuery)

      if (staffSnapshot.empty) {
        console.log('ℹ️ No active staff accounts found')
        return { success: true, staff: [], count: 0 }
      }

      const staffWithUserIds: Array<Record<string, any>> = []

      staffSnapshot.forEach((doc) => {
        const data = doc.data()
        const id = doc.id
        const staff: Record<string, any> = { id, ...data }

        // Only include staff with userIds
        if (staff.userId) {
          staffWithUserIds.push(staff)
        }
      })

      console.log(
        `✅ Found ${staffWithUserIds.length} active staff with userIds out of ${staffSnapshot.size} total`
      )

      if (staffWithUserIds.length === 0) {
        console.warn(
          '⚠️ No staff accounts with userIds found - this will cause mobile integration issues'
        )
      }

      this.debugLog('Staff with userIds:', staffWithUserIds)

      return {
        success: true,
        staff: staffWithUserIds,
        count: staffWithUserIds.length,
      }
    } catch (error) {
      console.error('❌ Error listing staff with userIds:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}

export default TestJobService
