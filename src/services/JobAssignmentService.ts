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
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  writeBatch,
  onSnapshot,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import FCMNotificationService from './FCMNotificationService'

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
  private jobsCollection = collection(db, 'jobs')
  private notificationsCollection = collection(db, 'notifications')
  private staffCollection = collection(db, 'staff_accounts')

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
      const jobData: JobData = {
        id: jobId,
        
        // Booking Reference
        bookingId: bookingData.id,
        bookingRef: {
          id: bookingData.id,
          guestName: bookingData.guestName || bookingData.guest_name || 'Unknown Guest',
          propertyName: bookingData.propertyName || bookingData.property || 'Unknown Property',
          checkInDate: bookingData.checkInDate || bookingData.checkIn || bookingData.check_in || '',
          checkOutDate: bookingData.checkOutDate || bookingData.checkOut || bookingData.check_out || '',
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
        assignedAt: serverTimestamp(),
        assignedBy,
        
        // Job Status
        status: 'assigned',
        statusHistory: [
          {
            status: 'pending',
            timestamp: serverTimestamp(),
            updatedBy: 'system',
            notes: 'Job created from booking approval'
          },
          {
            status: 'assigned',
            timestamp: serverTimestamp(),
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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        
        // Mobile Sync Optimization
        lastSyncedAt: serverTimestamp(),
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
        lastNotificationAt: null,
        notificationAcknowledgedAt: null,
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
        jobQuery = query(jobQuery, limit(filters.limit))
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
      const jobRef = doc(this.jobsCollection, jobId)
      const jobDoc = await getDoc(jobRef)

      if (!jobDoc.exists()) {
        throw new Error('Job not found')
      }

      const currentJob = jobDoc.data() as JobData

      // Prepare status history entry
      const statusHistoryEntry = {
        status: newStatus,
        timestamp: serverTimestamp(),
        updatedBy,
        notes
      }

      // Prepare update data
      const updateData: Partial<JobData> = {
        status: newStatus,
        statusHistory: [...(currentJob.statusHistory || []), statusHistoryEntry],
        updatedAt: serverTimestamp(),
        lastSyncedAt: serverTimestamp(),
        syncVersion: (currentJob.syncVersion || 0) + 1,
        ...additionalData
      }

      // Add completion timestamp if job is completed
      if (newStatus === 'completed') {
        updateData.completedAt = serverTimestamp()
      }

      // Add verification timestamp if job is verified
      if (newStatus === 'verified') {
        updateData.verifiedAt = serverTimestamp()
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
            sentAt: notificationData.sendPush ? serverTimestamp() : null
          },
          email: {
            sent: notificationData.sendEmail || false,
            sentAt: notificationData.sendEmail ? serverTimestamp() : null
          }
        },
        createdAt: serverTimestamp(),
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
        limit(10)
      )

      const activeJobsSnapshot = await getDocs(activeJobsQuery)
      const activeJobs: any[] = []

      activeJobsSnapshot.forEach((doc) => {
        const job = doc.data() as JobData
        activeJobs.push({
          id: job.id,
          title: job.title,
          propertyName: job.propertyRef.name,
          scheduledTime: job.scheduledStartTime || 'TBD',
          priority: job.priority,
          status: job.status,
          location: {
            address: job.location.address,
            distance: '0 km' // Can be calculated with geolocation
          }
        })
      })

      // Get today's schedule
      const today = new Date().toISOString().split('T')[0]
      const todayJobsQuery = query(
        this.jobsCollection,
        where('assignedStaffId', '==', staffId),
        where('scheduledDate', '==', today),
        orderBy('scheduledStartTime', 'asc')
      )

      const todayJobsSnapshot = await getDocs(todayJobsQuery)
      const todaySchedule: any[] = []

      todayJobsSnapshot.forEach((doc) => {
        const job = doc.data() as JobData
        todaySchedule.push({
          jobId: job.id,
          time: job.scheduledStartTime || 'TBD',
          duration: job.estimatedDuration,
          propertyName: job.propertyRef.name,
          jobType: job.jobType
        })
      })

      // Calculate performance stats (simplified)
      const completedJobsQuery = query(
        this.jobsCollection,
        where('assignedStaffId', '==', staffId),
        where('status', '==', 'completed')
      )

      const completedJobsSnapshot = await getDocs(completedJobsQuery)
      const completedCount = completedJobsSnapshot.size

      // Get unread notifications count
      const unreadNotificationsQuery = query(
        this.notificationsCollection,
        where('recipientId', '==', staffId),
        where('readAt', '==', null)
      )

      const unreadNotificationsSnapshot = await getDocs(unreadNotificationsQuery)
      const unreadCount = unreadNotificationsSnapshot.size

      // Prepare dashboard data
      const dashboardData = {
        staffId,
        activeJobs,
        todaySchedule,
        stats: {
          completedToday: 0, // Can be calculated with date filtering
          completedThisWeek: 0, // Can be calculated with date filtering
          completedTotal: completedCount,
          averageRating: 4.8, // Placeholder - can be calculated from reviews
          onTimePercentage: 95 // Placeholder - can be calculated from completion times
        },
        unreadNotifications: unreadCount,
        urgentNotifications: 0, // Can be calculated from notification priorities
        lastUpdated: serverTimestamp(),
        cacheExpiry: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
      }

      // Update staff dashboard document
      const dashboardRef = doc(db, 'staff_dashboard', staffId)
      await updateDoc(dashboardRef, dashboardData).catch(async () => {
        // Create if doesn't exist
        await addDoc(collection(db, 'staff_dashboard'), { id: staffId, ...dashboardData })
      })

      console.log(`📊 Staff dashboard updated for ${staffId}`)

    } catch (error) {
      console.error('❌ Error updating staff dashboard:', error)
    }
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
          const staffSkills = staff.skills || []
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
    let jobQuery = query(this.jobsCollection, orderBy('createdAt', 'desc'), limit(50))

    if (filters?.staffId) {
      jobQuery = query(jobQuery, where('assignedStaffId', '==', filters.staffId))
    }

    if (filters?.status) {
      jobQuery = query(jobQuery, where('status', '==', filters.status))
    }

    return onSnapshot(jobQuery, (snapshot) => {
      const jobs: JobData[] = []
      snapshot.forEach((doc) => {
        jobs.push({ id: doc.id, ...doc.data() } as JobData)
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
        notificationAcknowledgedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      // Update notification document if provided
      if (notificationId) {
        const notificationRef = doc(db, 'staff_notifications', notificationId)
        await updateDoc(notificationRef, {
          readAt: serverTimestamp(),
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
        lastActive: serverTimestamp(),
        notificationsEnabled: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      // Use token as document ID to prevent duplicates
      const tokenRef = doc(db, 'staff_device_tokens', deviceToken)
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
        collection(db, 'staff_notifications'),
        where('staffId', '==', staffId),
        orderBy('createdAt', 'desc'),
        limit(limit)
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
}

export default JobAssignmentService.getInstance()
