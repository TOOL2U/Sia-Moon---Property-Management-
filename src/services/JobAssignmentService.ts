/**
 * Job Assignment Service
 * Handles all job-related operations including creation, assignment, and Firebase sync
 * Optimized for mobile app synchronization and real-time updates
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
  onSnapshot
} from 'firebase/firestore'
import { getDb } from '@/lib/firebase'

// Job status workflow
export type JobStatus = 
  | 'pending'      // Job created, waiting for staff acceptance
  | 'assigned'     // Job assigned to staff member
  | 'accepted'     // Staff accepted the job
  | 'in_progress'  // Staff started working on the job
  | 'completed'    // Staff completed the job
  | 'verified'     // Admin verified job completion
  | 'cancelled'    // Job was cancelled

// Job types
export type JobType = 
  | 'cleaning'
  | 'maintenance' 
  | 'inspection'
  | 'setup'
  | 'checkout'
  | 'emergency'

// Priority levels
export type JobPriority = 'low' | 'medium' | 'high' | 'urgent'

// Job data structure matching Firebase schema
export interface JobData {
  id?: string
  
  // Booking Reference
  bookingId: string
  bookingRef: {
    id: string
    guestName: string
    propertyName: string
    checkInDate: string
    checkOutDate: string
    guestCount?: number
    totalAmount?: number
  }
  
  // Property Reference
  propertyId: string
  propertyRef: {
    id: string
    name: string
    address: string
    coordinates?: {
      latitude: number
      longitude: number
    }
    accessInstructions?: string
  }
  
  // Job Details
  jobType: JobType
  title: string
  description: string
  priority: JobPriority
  
  // Scheduling
  scheduledDate: string
  scheduledStartTime?: string
  scheduledEndTime?: string
  estimatedDuration: number // minutes
  deadline: string
  
  // Staff Assignment
  assignedStaffId: string
  assignedStaffRef: {
    id: string
    name: string
    phone?: string
    role: string
    skills: string[]
  }
  
  // Assignment Details
  assignedAt: Timestamp | string
  assignedBy: {
    id: string
    name: string
  }
  
  // Job Status
  status: JobStatus
  statusHistory: Array<{
    status: JobStatus
    timestamp: Timestamp | string
    updatedBy: string
    notes?: string
  }>
  
  // Requirements
  requiredSkills: string[]
  specialInstructions?: string
  requiredSupplies?: string[]
  
  // Location & Access
  location: {
    address: string
    coordinates?: {
      latitude: number
      longitude: number
    }
    accessInstructions?: string
    parkingInstructions?: string
  }
  
  // Completion Data
  completedAt?: Timestamp | string
  completionPhotos?: string[]
  completionNotes?: string
  verifiedAt?: Timestamp | string
  verifiedBy?: {
    id: string
    name: string
  }
  
  // Client Reference
  clientId?: string
  clientRef?: {
    id: string
    name: string
    email?: string
  }
  
  // Timestamps
  createdAt: Timestamp | string
  updatedAt: Timestamp | string
  
  // Mobile Sync Optimization
  lastSyncedAt?: Timestamp | string
  syncVersion: number
  mobileOptimized: {
    thumbnailPhoto?: string
    essentialData: {
      title: string
      address: string
      scheduledTime: string
      priority: JobPriority
    }
  }

  // Notification System
  notificationSent?: boolean
  notificationId?: string
  mobileNotificationPending?: boolean
  lastNotificationAt?: Timestamp | string
  notificationAcknowledgedAt?: Timestamp | string
  pushNotificationSent?: boolean
}

// Staff notification data
export interface StaffNotificationData {
  staffId: string
  jobId: string
  type: 'job_assigned' | 'job_updated' | 'job_cancelled'
  title: string
  message: string
  priority: JobPriority
  sendPush?: boolean
  sendEmail?: boolean
}

class JobAssignmentService {
  private static instance: JobAssignmentService
  private get jobsCollection() { return collection(getDb(), 'jobs') }
  private get notificationsCollection() { return collection(getDb(), 'notifications') }
  private get staffCollection() { return collection(getDb(), 'staff_accounts') }

  static getInstance(): JobAssignmentService {
    if (!JobAssignmentService.instance) {
      JobAssignmentService.instance = new JobAssignmentService()
    }
    return JobAssignmentService.instance
  }

  /**
   * Create a new job from booking data
   */
  async createJobFromBooking(
    bookingData: any,
    jobDetails: {
      jobType: JobType
      title: string
      description: string
      priority: JobPriority
      estimatedDuration: number
      requiredSkills: string[]
      specialInstructions?: string
      requiredSupplies?: string[]
      scheduledDate: string
      scheduledStartTime?: string
      deadline: string
    },
    assignedStaffId: string,
    assignedBy: { id: string; name: string }
  ): Promise<{ success: boolean; jobId?: string; error?: string }> {
    try {
      console.log('🔧 Creating job from booking:', bookingData.id)
      console.log('👤 Assigning to staff:', assignedStaffId)

      // Get staff details
      const staffDoc = await getDoc(doc(this.staffCollection, assignedStaffId))
      if (!staffDoc.exists()) {
        throw new Error('Assigned staff member not found')
      }

      const staffData = staffDoc.data()
      if (!staffData.isActive) {
        throw new Error('Cannot assign job to inactive staff member')
      }

      // Generate job ID
      const jobRef = doc(this.jobsCollection)
      const jobId = jobRef.id

      // Prepare job data
      // Helper to convert any date format to ISO string for mobile app
      const formatDateForMobile = (dateField: any): string => {
        if (!dateField) return '';
        if (dateField.toDate) return dateField.toDate().toISOString().split('T')[0]; // Firestore Timestamp
        if (typeof dateField === 'string') {
          const date = new Date(dateField);
          return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : dateField;
        }
        if (dateField instanceof Date) return dateField.toISOString().split('T')[0];
        return String(dateField);
      };

      const jobData: JobData = {
        id: jobId,
        
        // Booking Reference
        bookingId: bookingData.id,
        bookingRef: {
          id: bookingData.id,
          guestName: bookingData.guestName || bookingData.guest_name || 'Unknown Guest',
          propertyName: bookingData.propertyName || bookingData.property || 'Unknown Property',
          checkInDate: formatDateForMobile(bookingData.checkInDate || bookingData.checkIn || bookingData.check_in),
          checkOutDate: formatDateForMobile(bookingData.checkOutDate || bookingData.checkOut || bookingData.check_out),
          guestCount: bookingData.guestCount || bookingData.numberOfGuests || bookingData.guests || 1,
          totalAmount: bookingData.price || bookingData.amount || bookingData.total || 0
        },
        
        // Property Reference (simplified for now, can be enhanced with property service)
        propertyId: bookingData.propertyId || `property_${bookingData.id}`,
        propertyRef: {
          id: bookingData.propertyId || `property_${bookingData.id}`,
          name: bookingData.propertyName || bookingData.property || 'Unknown Property',
          address: bookingData.propertyAddress || bookingData.address || 'Address not provided',
          accessInstructions: bookingData.accessInstructions || 'Contact property manager for access'
        },
        
        // Job Details
        jobType: jobDetails.jobType,
        title: jobDetails.title,
        description: jobDetails.description,
        priority: jobDetails.priority,
        
        // Scheduling
        scheduledDate: jobDetails.scheduledDate,
        scheduledStartTime: jobDetails.scheduledStartTime,
        scheduledEndTime: this.calculateEndTime(jobDetails.scheduledStartTime, jobDetails.estimatedDuration),
        estimatedDuration: jobDetails.estimatedDuration,
        deadline: jobDetails.deadline,
        
        // Staff Assignment
        assignedStaffId,
        assignedStaffRef: {
          id: assignedStaffId,
          name: staffData.name,
          phone: staffData.phone,
          role: staffData.role,
          skills: staffData.skills || []
        },
        
        // Assignment Details
        assignedAt: Timestamp.now(),
        assignedBy,

        // Job Status
        status: 'assigned',
        statusHistory: [
          {
            status: 'pending',
            timestamp: Timestamp.now(),
            updatedBy: 'system',
            notes: 'Job created from booking approval'
          },
          {
            status: 'assigned',
            timestamp: Timestamp.now(),
            updatedBy: assignedBy.id,
            notes: `Assigned to ${staffData.name}`
          }
        ],
        
        // Requirements
        requiredSkills: jobDetails.requiredSkills,
        specialInstructions: jobDetails.specialInstructions,
        requiredSupplies: jobDetails.requiredSupplies,
        
        // Location & Access
        location: {
          address: bookingData.propertyAddress || bookingData.address || 'Address not provided',
          accessInstructions: bookingData.accessInstructions || 'Contact property manager for access'
        },
        
        // Client Reference (can be enhanced with client service)
        clientId: bookingData.clientId || 'default_client',
        clientRef: {
          id: bookingData.clientId || 'default_client',
          name: bookingData.clientName || 'Property Owner',
          email: bookingData.clientEmail
        },
        
        // Timestamps
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),

        // Mobile Sync Optimization
        lastSyncedAt: Timestamp.now(),
        syncVersion: 1,
        mobileOptimized: {
          essentialData: {
            title: jobDetails.title,
            address: bookingData.propertyAddress || bookingData.address || 'Address not provided',
            scheduledTime: jobDetails.scheduledStartTime || 'TBD',
            priority: jobDetails.priority
          }
        },

        // Notification System - Will trigger Cloud Function
        notificationSent: false,
        mobileNotificationPending: true,
        lastNotificationAt: undefined,
        notificationAcknowledgedAt: undefined,
        pushNotificationSent: false
      }

      // Create job document
      await addDoc(this.jobsCollection, jobData)

      console.log('✅ Job created successfully:', jobId)

      // Send notification to staff member
      await this.sendStaffNotification({
        staffId: assignedStaffId,
        jobId,
        type: 'job_assigned',
        title: 'New Job Assignment',
        message: `You have been assigned: ${jobDetails.title}`,
        priority: jobDetails.priority,
        sendPush: true
      })

      // Update staff dashboard (for mobile optimization)
      await this.updateStaffDashboard(assignedStaffId)

      return { success: true, jobId }

    } catch (error) {
      console.error('❌ Error creating job:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create job'
      }
    }
  }

  /**
   * Get all jobs with optional filtering
   */
  async getJobs(filters?: {
    staffId?: string
    status?: JobStatus
    dateRange?: { start: string; end: string }
    limit?: number
  }): Promise<{ success: boolean; jobs?: JobData[]; error?: string }> {
    try {
      let jobQuery = query(this.jobsCollection, orderBy('createdAt', 'desc'))

      // Apply filters
      if (filters?.staffId) {
        jobQuery = query(jobQuery, where('assignedStaffId', '==', filters.staffId))
      }

      if (filters?.status) {
        jobQuery = query(jobQuery, where('status', '==', filters.status))
      }

      if (filters?.limit) {
        jobQuery = query(jobQuery, firestoreLimit(filters.limit))
      }

      const querySnapshot = await getDocs(jobQuery)
      const jobs: JobData[] = []

      querySnapshot.forEach((doc) => {
        jobs.push({ id: doc.id, ...doc.data() } as JobData)
      })

      return { success: true, jobs }

    } catch (error) {
      console.error('❌ Error fetching jobs:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch jobs'
      }
    }
  }

  /**
   * Update job status
   */
  async updateJobStatus(
    jobId: string,
    newStatus: JobStatus,
    updatedBy: string,
    notes?: string,
    additionalData?: Partial<JobData>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔄 Updating job status: ${jobId} -> ${newStatus}`)

      const jobRef = doc(this.jobsCollection, jobId)
      const jobDoc = await getDoc(jobRef)

      if (!jobDoc.exists()) {
        console.error(`❌ Job not found in database: ${jobId}`)
        console.log('🔍 Checking jobs collection for debugging...')

        // Debug: List all jobs to see what's in the collection
        const allJobsQuery = query(this.jobsCollection, firestoreLimit(10))
        const allJobsSnapshot = await getDocs(allJobsQuery)
        console.log(`📋 Found ${allJobsSnapshot.size} jobs in collection:`)
        allJobsSnapshot.forEach(doc => {
          console.log(`  - ${doc.id}: ${doc.data().title || 'No title'}`)
        })

        throw new Error(`Job not found: ${jobId}`)
      }

      const currentJob = jobDoc.data() as JobData

      // Prepare status history entry
      const statusHistoryEntry = {
        status: newStatus,
        timestamp: Timestamp.now(),
        updatedBy,
        notes
      }

      // Prepare update data (filter out undefined values)
      const cleanAdditionalData = additionalData ? Object.fromEntries(
        Object.entries(additionalData).filter(([_, value]) => value !== undefined)
      ) : {}

      const updateData: any = {
        status: newStatus,
        statusHistory: [...(currentJob.statusHistory || []), statusHistoryEntry],
        updatedAt: Timestamp.now(),
        lastSyncedAt: Timestamp.now(),
        syncVersion: (currentJob.syncVersion || 0) + 1,
        ...cleanAdditionalData
      }

      // Add completion timestamp if job is completed
      if (newStatus === 'completed') {
        updateData.completedAt = Timestamp.now()
      }

      // Add verification timestamp if job is verified
      if (newStatus === 'verified') {
        updateData.verifiedAt = Timestamp.now()
      }

      await updateDoc(jobRef, updateData)

      // Send notification to staff if status changed
      if (currentJob.assignedStaffId && newStatus !== currentJob.status) {
        await this.sendStaffNotification({
          staffId: currentJob.assignedStaffId,
          jobId,
          type: 'job_updated',
          title: 'Job Status Updated',
          message: `Job status changed to: ${newStatus}`,
          priority: currentJob.priority,
          sendPush: true
        })
      }

      // Update staff dashboard
      await this.updateStaffDashboard(currentJob.assignedStaffId)

      console.log(`✅ Job ${jobId} status updated to: ${newStatus}`)
      return { success: true }

    } catch (error) {
      console.error('❌ Error updating job status:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update job status'
      }
    }
  }

  /**
   * Send notification to staff member
   */
  private async sendStaffNotification(notificationData: StaffNotificationData): Promise<void> {
    try {
      const notification = {
        id: doc(this.notificationsCollection).id,
        recipientId: notificationData.staffId,
        recipientType: 'staff',
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        relatedJobId: notificationData.jobId,
        priority: notificationData.priority,
        status: 'sent',
        readAt: null,
        channels: {
          push: {
            sent: notificationData.sendPush || false,
            sentAt: notificationData.sendPush ? Timestamp.now() : null
          },
          email: {
            sent: notificationData.sendEmail || false,
            sentAt: notificationData.sendEmail ? Timestamp.now() : null
          }
        },
        createdAt: Timestamp.now(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }

      await addDoc(this.notificationsCollection, notification)
      console.log(`📱 Notification sent to staff ${notificationData.staffId}`)

    } catch (error) {
      console.error('❌ Error sending staff notification:', error)
    }
  }

  /**
   * Update staff dashboard for mobile optimization
   */
  private async updateStaffDashboard(staffId: string): Promise<void> {
    try {
      // Get staff's active jobs
      const activeJobsQuery = query(
        this.jobsCollection,
        where('assignedStaffId', '==', staffId),
        where('status', 'in', ['assigned', 'accepted', 'in_progress']),
        orderBy('scheduledDate', 'asc'),
        firestoreLimit(10)
      )

      const activeJobsSnapshot = await getDocs(activeJobsQuery)
      const activeJobs: any[] = []

      activeJobsSnapshot.forEach((doc) => {
        const job = doc.data() as JobData
        activeJobs.push({
          id: job.id,
          title: job.title || 'Untitled Job',
          propertyName: job.propertyRef?.name || 'Unknown Property',
          scheduledTime: job.scheduledStartTime || 'TBD',
          priority: job.priority || 'medium',
          status: job.status || 'pending',
          location: {
            address: job.location?.address || 'Location not specified',
            distance: '0 km' // Can be calculated with geolocation
          }
        })
      })

      // Get today's schedule
      const today = new Date().toISOString().split('T')[0]
      let todaySchedule: any[] = []
      
      try {
        const todayJobsQuery = query(
          this.jobsCollection,
          where('assignedStaffId', '==', staffId),
          where('scheduledDate', '==', today),
          orderBy('scheduledStartTime', 'asc')
        )

        const todayJobsSnapshot = await getDocs(todayJobsQuery)

        todayJobsSnapshot.forEach((doc) => {
          const job = doc.data() as JobData
          todaySchedule.push({
            jobId: job.id,
            time: job.scheduledStartTime || 'TBD',
            duration: job.estimatedDuration || '1 hour',
            propertyName: job.propertyRef?.name || 'Unknown Property',
            jobType: job.jobType || 'general'
          })
        })
      } catch (indexError) {
        console.warn('⚠️ Index not ready for today schedule query, using fallback:', indexError)
        // Fallback: get all jobs for this staff and filter client-side
        const allJobsQuery = query(
          this.jobsCollection,
          where('assignedStaffId', '==', staffId)
        )
        const allJobsSnapshot = await getDocs(allJobsQuery)
        allJobsSnapshot.forEach((doc) => {
          const job = doc.data() as JobData
          if (job.scheduledDate === today) {
            todaySchedule.push({
              jobId: job.id,
              time: job.scheduledStartTime || 'TBD',
              duration: job.estimatedDuration || '1 hour',
              propertyName: job.propertyRef?.name || 'Unknown Property',
              jobType: job.jobType || 'general'
            })
          }
        })
      }

      // Calculate performance stats (simplified)
      let completedCount = 0
      try {
        const completedJobsQuery = query(
          this.jobsCollection,
          where('assignedStaffId', '==', staffId),
          where('status', '==', 'completed')
        )

        const completedJobsSnapshot = await getDocs(completedJobsQuery)
        completedCount = completedJobsSnapshot.size
      } catch (indexError) {
        console.warn('⚠️ Index not ready for completed jobs query, using fallback:', indexError)
        // Fallback: get all jobs for this staff and filter client-side
        const allJobsQuery = query(
          this.jobsCollection,
          where('assignedStaffId', '==', staffId)
        )
        const allJobsSnapshot = await getDocs(allJobsQuery)
        allJobsSnapshot.forEach((doc) => {
          const job = doc.data() as JobData
          if (job.status === 'completed') {
            completedCount++
          }
        })
      }

      // Get unread notifications count
      const unreadNotificationsQuery = query(
        this.notificationsCollection,
        where('recipientId', '==', staffId),
        where('readAt', '==', null)
      )

      const unreadNotificationsSnapshot = await getDocs(unreadNotificationsQuery)
      const unreadCount = unreadNotificationsSnapshot.size

      // Filter out any undefined values from arrays
      const cleanActiveJobs = activeJobs.filter(job => job && job.id)
      const cleanTodaySchedule = todaySchedule.filter(item => item && item.jobId)

      // Prepare dashboard data with no undefined values
      const dashboardData = {
        staffId: staffId || '',
        activeJobs: cleanActiveJobs,
        todaySchedule: cleanTodaySchedule,
        stats: {
          completedToday: 0, // TODO: Calculate with date filtering
          completedThisWeek: 0, // TODO: Calculate with date filtering
          completedTotal: completedCount || 0,
          averageRating: 0, // TODO: Calculate from reviews
          onTimePercentage: 0 // TODO: Calculate from completion times
        },
        unreadNotifications: unreadCount || 0,
        urgentNotifications: 0, // Can be calculated from notification priorities
        lastUpdated: Timestamp.now(),
        cacheExpiry: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
      }

      // Clean the dashboard data to remove any undefined values
      const cleanDashboardData = this.removeUndefinedValues(dashboardData)

      // Update staff dashboard document
      const dashboardRef = doc(getDb(), 'staff_dashboard', staffId)
      await updateDoc(dashboardRef, cleanDashboardData).catch(async () => {
        // Create if doesn't exist
        await addDoc(collection(getDb(), 'staff_dashboard'), { id: staffId, ...cleanDashboardData })
      })

      console.log(`📊 Staff dashboard updated for ${staffId}`)

    } catch (error) {
      console.error('❌ Error updating staff dashboard:', error)
    }
  }

  /**
   * Remove undefined values from an object recursively
   */
  private removeUndefinedValues(obj: any): any {
    if (obj === null || obj === undefined) {
      return null
    }

    if (Array.isArray(obj)) {
      return obj.filter(item => item !== undefined).map(item => this.removeUndefinedValues(item))
    }

    if (typeof obj === 'object') {
      const cleaned: any = {}
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          cleaned[key] = this.removeUndefinedValues(value)
        }
      }
      return cleaned
    }

    return obj
  }

  /**
   * Calculate end time based on start time and duration
   */
  private calculateEndTime(startTime?: string, duration?: number): string | undefined {
    if (!startTime || !duration) return undefined

    try {
      const [hours, minutes] = startTime.split(':').map(Number)
      const startDate = new Date()
      startDate.setHours(hours, minutes, 0, 0)

      const endDate = new Date(startDate.getTime() + duration * 60 * 1000)

      return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`
    } catch (error) {
      console.error('Error calculating end time:', error)
      return undefined
    }
  }

  /**
   * Get available staff members for assignment
   */
  async getAvailableStaff(filters?: {
    skills?: string[]
    date?: string
    excludeStaffIds?: string[]
  }): Promise<{ success: boolean; staff?: any[]; error?: string }> {
    try {
      let staffQuery = query(
        this.staffCollection,
        where('isActive', '==', true),
        orderBy('name', 'asc')
      )

      const staffSnapshot = await getDocs(staffQuery)
      let availableStaff: any[] = []

      staffSnapshot.forEach((doc) => {
        const staff = { id: doc.id, ...doc.data() }

        // Filter by skills if specified
        if (filters?.skills && filters.skills.length > 0) {
          const staffSkills = (staff as any).skills || []
          const hasRequiredSkills = filters.skills.some(skill =>
            staffSkills.includes(skill)
          )
          if (!hasRequiredSkills) return
        }

        // Exclude specific staff if specified
        if (filters?.excludeStaffIds?.includes(staff.id)) return

        availableStaff.push(staff)
      })

      return { success: true, staff: availableStaff }

    } catch (error) {
      console.error('❌ Error fetching available staff:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch available staff'
      }
    }
  }

  /**
   * Real-time job listener for admin dashboard
   */
  subscribeToJobs(
    callback: (jobs: JobData[]) => void,
    filters?: { staffId?: string; status?: JobStatus }
  ): () => void {
    let jobQuery = query(this.jobsCollection, orderBy('createdAt', 'desc'), firestoreLimit(50))

    if (filters?.staffId) {
      jobQuery = query(jobQuery, where('assignedStaffId', '==', filters.staffId))
    }

    if (filters?.status) {
      jobQuery = query(jobQuery, where('status', '==', filters.status))
    }

    return onSnapshot(jobQuery, (snapshot) => {
      const jobs: JobData[] = []
      console.log(`📋 Job subscription update: ${snapshot.size} jobs found`)
      snapshot.forEach((doc) => {
        const docData = doc.data()
        // Always use Firebase document ID, ignore any custom 'id' field in the data
        const jobData = {
          ...docData,
          id: doc.id  // Firebase document ID always takes precedence
        } as JobData
        jobs.push(jobData)
        console.log(`  - Job: ${doc.id} (${jobData.title || 'No title'}) - Status: ${jobData.status}`)

        // Debug: Show if there was a custom ID field that got overridden
        if (docData.id && docData.id !== doc.id) {
          console.log(`    ⚠️  Custom ID field '${docData.id}' overridden with Firebase ID '${doc.id}'`)
        }
      })
      callback(jobs)
    })
  }

  /**
   * Acknowledge notification from mobile app
   */
  async acknowledgeNotification(
    jobId: string,
    staffId: string,
    notificationId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📱 Acknowledging notification for job ${jobId} by staff ${staffId}`)

      // Update job document to clear mobile notification flag
      const jobRef = doc(this.jobsCollection, jobId)
      await updateDoc(jobRef, {
        mobileNotificationPending: false,
        notificationAcknowledgedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })

      // Update notification document if provided
      if (notificationId) {
        const notificationRef = doc(getDb(), 'staff_notifications', notificationId)
        await updateDoc(notificationRef, {
          readAt: Timestamp.now(),
          status: 'read'
        })
      }

      console.log(`✅ Notification acknowledged for job ${jobId}`)
      return { success: true }

    } catch (error) {
      console.error('❌ Error acknowledging notification:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to acknowledge notification'
      }
    }
  }

  /**
   * Register device token for push notifications
   */
  async registerDeviceToken(
    staffId: string,
    deviceToken: string,
    platform: 'ios' | 'android' | 'web' = 'web'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📱 Registering device token for staff ${staffId}`)

      const tokenData = {
        staffId,
        deviceToken,
        platform,
        appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
        lastActive: Timestamp.now(),
        notificationsEnabled: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }

      // Use token as document ID to prevent duplicates
      const tokenRef = doc(getDb(), 'staff_device_tokens', deviceToken)
      await setDoc(tokenRef, tokenData, { merge: true })

      console.log(`✅ Device token registered for staff ${staffId}`)
      return { success: true }

    } catch (error) {
      console.error('❌ Error registering device token:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to register device token'
      }
    }
  }

  /**
   * Get staff notifications
   */
  async getStaffNotifications(
    staffId: string,
    limit: number = 20,
    unreadOnly: boolean = false
  ): Promise<{ success: boolean; notifications?: any[]; error?: string }> {
    try {
      let notificationsQuery = query(
        collection(getDb(), 'staff_notifications'),
        where('staffId', '==', staffId),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limit)
      )

      if (unreadOnly) {
        notificationsQuery = query(
          notificationsQuery,
          where('readAt', '==', null)
        )
      }

      const querySnapshot = await getDocs(notificationsQuery)
      const notifications: any[] = []

      querySnapshot.forEach((doc) => {
        notifications.push({ id: doc.id, ...doc.data() })
      })

      return { success: true, notifications }

    } catch (error) {
      console.error('❌ Error fetching staff notifications:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch notifications'
      }
    }
  }

  /**
   * Modular extension point for future features
   */
  async executeExtension(
    extensionName: string,
    data: any
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
      // Extension registry for future features
      const extensions: Record<string, (data: any) => Promise<any>> = {
        'ai-auto-assign': this.aiAutoAssign.bind(this),
        'drag-drop-reassign': this.dragDropReassign.bind(this),
        'bulk-assign': this.bulkAssign.bind(this),
        'smart-scheduling': this.smartScheduling.bind(this)
      }

      const extension = extensions[extensionName]
      if (!extension) {
        throw new Error(`Extension '${extensionName}' not found`)
      }

      const result = await extension(data)
      return { success: true, result }

    } catch (error) {
      console.error(`❌ Error executing extension '${extensionName}':`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Extension execution failed'
      }
    }
  }

  // Placeholder methods for future extensions
  private async aiAutoAssign(data: any): Promise<any> {
    // TODO: Implement AI-powered auto-assignment
    console.log('🤖 AI Auto-assign extension called with:', data)
    return { message: 'AI auto-assign not yet implemented' }
  }

  private async dragDropReassign(data: any): Promise<any> {
    // TODO: Implement drag-and-drop reassignment
    console.log('🖱️ Drag-drop reassign extension called with:', data)
    return { message: 'Drag-drop reassign not yet implemented' }
  }

  private async bulkAssign(data: any): Promise<any> {
    // TODO: Implement bulk assignment
    console.log('📦 Bulk assign extension called with:', data)
    return { message: 'Bulk assign not yet implemented' }
  }

  private async smartScheduling(data: any): Promise<any> {
    // TODO: Implement smart scheduling
    console.log('🧠 Smart scheduling extension called with:', data)
    return { message: 'Smart scheduling not yet implemented' }
  }

  /**
   * Create a manual job (not tied to a booking)
   */
  async createManualJob(jobData: any, createdBy: any): Promise<{ success: boolean; jobId?: string; error?: string }> {
    try {
      console.log('🔧 Creating manual job:', jobData.title)

      // Validate required fields
      if (!jobData.title || !jobData.assignedStaffId || !jobData.propertyId) {
        return {
          success: false,
          error: 'Missing required fields: title, assignedStaffId, propertyId'
        }
      }

      // Get staff and property references
      const staffRef = doc(this.staffCollection, jobData.assignedStaffId)
      const staffDoc = await getDoc(staffRef)

      if (!staffDoc.exists()) {
        return {
          success: false,
          error: 'Assigned staff member not found'
        }
      }

      // Get property reference (try properties collection)
      const propertiesCollection = collection(getDb(), 'properties')
      const propertyRef = doc(propertiesCollection, jobData.propertyId)
      const propertyDoc = await getDoc(propertyRef)

      let propertyData = null
      if (propertyDoc.exists()) {
        propertyData = propertyDoc.data()
      }

      const staffData = staffDoc.data()

      // Create the job document (DO NOT include custom 'id' field)
      const jobDocument = {
        // Spread jobData but exclude any 'id' field to avoid confusion
        jobType: jobData.jobType,
        title: jobData.title,
        description: jobData.description,
        priority: jobData.priority,
        estimatedDuration: jobData.estimatedDuration,
        scheduledDate: jobData.scheduledDate,
        scheduledStartTime: jobData.scheduledStartTime,
        deadline: jobData.deadline,
        specialInstructions: jobData.specialInstructions,
        requiredSkills: jobData.requiredSkills || [],
        requiredSupplies: jobData.requiredSupplies || [],
        propertyId: jobData.propertyId,
        assignedStaffId: jobData.assignedStaffId,
        status: jobData.status,
        createdBy: jobData.createdBy,
        isManualJob: jobData.isManualJob,
        relatedBookingId: jobData.relatedBookingId,
        // Add references
        assignedStaffRef: {
          id: staffData.id || jobData.assignedStaffId,
          name: staffData.name || 'Unknown Staff',
          email: staffData.email,
          phone: staffData.phone,
          role: staffData.role
        },
        propertyRef: propertyData ? {
          id: propertyData.id || jobData.propertyId,
          name: propertyData.name || propertyData.title || 'Unknown Property',
          address: propertyData.address || propertyData.location || 'Address not available'
        } : {
          id: jobData.propertyId,
          name: 'Unknown Property',
          address: 'Address not available'
        },
        statusHistory: [{
          status: 'pending',
          timestamp: new Date().toISOString(),
          updatedBy: createdBy.name || createdBy.id,
          notes: 'Job created manually'
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Add the job to Firestore
      const docRef = await addDoc(this.jobsCollection, jobDocument)
      console.log('✅ Manual job created with ID:', docRef.id)

      // TODO: Send notification to assigned staff
      console.log('📱 Job notification would be sent to staff:', jobData.assignedStaffId)

      return {
        success: true,
        jobId: docRef.id
      }
    } catch (error) {
      console.error('❌ Error creating manual job:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create job'
      }
    }
  }
}

export default JobAssignmentService.getInstance()
