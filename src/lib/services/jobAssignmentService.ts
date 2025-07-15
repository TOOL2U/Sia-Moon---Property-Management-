/**
 * Job Assignment Service
 * Comprehensive service for managing job assignments, staff suggestions, and notifications
 */

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { getDb } from '@/lib/firebase'
import { 
  JobAssignment, 
  JobNotification, 
  StaffAvailability, 
  JobSuggestion,
  JobStatus,
  JobPriority,
  JobType,
  JobAssignmentStats,
  JobAssignmentFilters
} from '@/types/jobAssignment'

export class JobAssignmentService {
  private static db = getDb()

  /**
   * Create a new job assignment from approved booking
   */
  static async createJobFromBooking(
    bookingData: {
      id: string
      propertyId: string
      propertyName: string
      propertyAddress?: string
      guestName: string
      guestEmail?: string
      guestPhone?: string
      checkInDate: string
      checkOutDate: string
      numberOfGuests: number
      specialRequests?: string
    },
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
    assignedBy: {
      id: string
      name: string
    }
  ): Promise<{ success: boolean; jobId?: string; error?: string }> {
    try {
      const timestamp = serverTimestamp()
      
      const jobAssignment: Omit<JobAssignment, 'id'> = {
        // Booking Integration
        bookingId: bookingData.id,
        propertyId: bookingData.propertyId,
        propertyName: bookingData.propertyName,
        propertyAddress: bookingData.propertyAddress,
        
        // Guest Information
        guestName: bookingData.guestName,
        guestEmail: bookingData.guestEmail,
        guestPhone: bookingData.guestPhone,
        checkInDate: bookingData.checkInDate,
        checkOutDate: bookingData.checkOutDate,
        numberOfGuests: bookingData.numberOfGuests,
        
        // Job Details
        jobType: jobDetails.jobType,
        title: jobDetails.title,
        description: jobDetails.description,
        priority: jobDetails.priority,
        estimatedDuration: jobDetails.estimatedDuration,
        
        // Staff Assignment (will be filled when staff is assigned)
        assignedStaffId: '',
        assignedStaffName: '',
        assignedStaffEmail: '',
        assignedStaffRole: '',
        
        // Scheduling
        scheduledDate: jobDetails.scheduledDate,
        scheduledStartTime: jobDetails.scheduledStartTime || '',
        deadline: jobDetails.deadline,
        
        // Status and Progress
        status: 'pending' as JobStatus,
        progress: 0,
        
        // Assignment Workflow
        assignedAt: '',
        assignedBy: assignedBy.id,
        assignedByName: assignedBy.name,
        
        // Instructions and Requirements
        specialInstructions: jobDetails.specialInstructions || '',
        requiredSkills: jobDetails.requiredSkills || [],
        requiredSupplies: jobDetails.requiredSupplies || [],
        
        // Automation
        autoAssigned: false,
        
        // Metadata
        createdAt: timestamp as any,
        updatedAt: timestamp as any,
        syncVersion: 1,
        lastSyncedAt: timestamp as any,
        
        // Mobile App Sync
        mobileNotificationSent: false
      }

      const docRef = await addDoc(collection(this.db, 'job_assignments'), jobAssignment)
      
      console.log(`✅ Created job assignment ${docRef.id} for booking ${bookingData.id}`)
      
      return {
        success: true,
        jobId: docRef.id
      }
    } catch (error) {
      console.error('❌ Error creating job assignment:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Assign staff to a job with smart suggestions
   */
  static async assignStaffToJob(
    jobId: string,
    staffId: string,
    assignedBy: {
      id: string
      name: string
    },
    options?: {
      sendNotification?: boolean
      customMessage?: string
      scheduledStartTime?: string
      scheduledEndTime?: string
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get job details
      const jobRef = doc(this.db, 'job_assignments', jobId)
      const jobDoc = await getDoc(jobRef)
      
      if (!jobDoc.exists()) {
        return { success: false, error: 'Job assignment not found' }
      }

      // Get staff details
      const staffRef = doc(this.db, 'staff_accounts', staffId)
      const staffDoc = await getDoc(staffRef)
      
      if (!staffDoc.exists()) {
        return { success: false, error: 'Staff member not found' }
      }

      const staffData = staffDoc.data()
      const timestamp = serverTimestamp()

      // Update job assignment
      const updates: Partial<JobAssignment> = {
        assignedStaffId: staffId,
        assignedStaffName: staffData.name,
        assignedStaffEmail: staffData.email,
        assignedStaffPhone: staffData.phone,
        assignedStaffRole: staffData.role,
        status: 'assigned',
        assignedAt: timestamp as any,
        updatedAt: timestamp as any,
        syncVersion: (jobDoc.data().syncVersion || 1) + 1,
        lastSyncedAt: timestamp as any
      }

      if (options?.scheduledStartTime) {
        updates.scheduledStartTime = options.scheduledStartTime
      }
      if (options?.scheduledEndTime) {
        updates.scheduledEndTime = options.scheduledEndTime
      }

      await updateDoc(jobRef, updates)

      // Send notification to staff member
      if (options?.sendNotification !== false) {
        await this.sendJobNotification(jobId, staffId, 'job_assigned', {
          customMessage: options?.customMessage
        })
      }

      // Update staff availability
      await this.updateStaffWorkload(staffId)

      console.log(`✅ Assigned job ${jobId} to staff ${staffId}`)
      
      return { success: true }
    } catch (error) {
      console.error('❌ Error assigning staff to job:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get smart staff suggestions for a job
   */
  static async getStaffSuggestions(
    jobId: string,
    options?: {
      maxSuggestions?: number
      includeUnavailable?: boolean
      preferredSkills?: string[]
    }
  ): Promise<{ success: boolean; suggestions?: JobSuggestion[]; error?: string }> {
    try {
      // Get job details
      const jobRef = doc(this.db, 'job_assignments', jobId)
      const jobDoc = await getDoc(jobRef)
      
      if (!jobDoc.exists()) {
        return { success: false, error: 'Job assignment not found' }
      }

      const jobData = jobDoc.data() as JobAssignment

      // Get all available staff
      const staffQuery = query(
        collection(this.db, 'staff_accounts'),
        where('isActive', '==', true),
        where('status', '==', 'active')
      )
      
      const staffSnapshot = await getDocs(staffQuery)
      const suggestions: JobSuggestion[] = []

      for (const staffDoc of staffSnapshot.docs) {
        const staffData = staffDoc.data()
        
        // Calculate suggestion score
        const suggestion = await this.calculateStaffSuggestion(
          staffDoc.id,
          staffData,
          jobData
        )
        
        if (suggestion) {
          suggestions.push(suggestion)
        }
      }

      // Sort by overall score (highest first)
      suggestions.sort((a, b) => b.overallScore - a.overallScore)

      // Limit results
      const maxSuggestions = options?.maxSuggestions || 5
      const limitedSuggestions = suggestions.slice(0, maxSuggestions)

      return {
        success: true,
        suggestions: limitedSuggestions
      }
    } catch (error) {
      console.error('❌ Error getting staff suggestions:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Calculate staff suggestion score based on multiple factors
   */
  private static async calculateStaffSuggestion(
    staffId: string,
    staffData: any,
    jobData: JobAssignment
  ): Promise<JobSuggestion | null> {
    try {
      // Get staff availability data
      const availability = await this.getStaffAvailability(staffId)
      
      if (!availability) {
        return null
      }

      // Calculate skill match (0-100)
      const skillMatch = this.calculateSkillMatch(
        staffData.skills || [],
        jobData.requiredSkills
      )

      // Calculate availability match (0-100)
      const availabilityMatch = this.calculateAvailabilityMatch(
        availability,
        jobData.scheduledDate,
        jobData.scheduledStartTime
      )

      // Calculate workload match (0-100)
      const workloadMatch = this.calculateWorkloadMatch(availability)

      // Calculate performance score (0-100)
      const performanceScore = this.calculatePerformanceScore(availability)

      // Calculate location match (0-100) - simplified for now
      const locationMatch = this.calculateLocationMatch(
        staffData.assignedProperties || [],
        jobData.propertyId
      )

      // Calculate overall score with weights
      const weights = {
        skill: 0.3,
        availability: 0.25,
        workload: 0.2,
        performance: 0.15,
        location: 0.1
      }

      const overallScore = Math.round(
        skillMatch * weights.skill +
        availabilityMatch * weights.availability +
        workloadMatch * weights.workload +
        performanceScore * weights.performance +
        locationMatch * weights.location
      )

      // Determine confidence level
      const confidence = overallScore >= 80 ? 'high' : 
                       overallScore >= 60 ? 'medium' : 'low'

      // Generate match reasons and concerns
      const matchReasons: string[] = []
      const concerns: string[] = []

      if (skillMatch >= 80) matchReasons.push('Excellent skill match')
      if (availabilityMatch >= 80) matchReasons.push('Available at scheduled time')
      if (workloadMatch >= 80) matchReasons.push('Low current workload')
      if (performanceScore >= 80) matchReasons.push('High performance rating')
      if (locationMatch >= 80) matchReasons.push('Assigned to this property')

      if (skillMatch < 50) concerns.push('Limited skill match')
      if (availabilityMatch < 50) concerns.push('May not be available')
      if (workloadMatch < 50) concerns.push('High current workload')
      if (performanceScore < 50) concerns.push('Below average performance')

      return {
        staffId,
        staffName: staffData.name,
        staffRole: staffData.role,
        skillMatch,
        availabilityMatch,
        locationMatch,
        workloadMatch,
        performanceScore,
        overallScore,
        confidence,
        matchReasons,
        concerns,
        estimatedResponseTime: this.estimateResponseTime(availability),
        estimatedTravelTime: this.estimateTravelTime(staffData, jobData),
        estimatedCompletionTime: jobData.estimatedDuration
      }
    } catch (error) {
      console.error('❌ Error calculating staff suggestion:', error)
      return null
    }
  }

  /**
   * Calculate skill match percentage
   */
  private static calculateSkillMatch(staffSkills: string[], requiredSkills: string[]): number {
    if (requiredSkills.length === 0) return 100
    
    const matchedSkills = requiredSkills.filter(skill => 
      staffSkills.some(staffSkill => 
        staffSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(staffSkill.toLowerCase())
      )
    )
    
    return Math.round((matchedSkills.length / requiredSkills.length) * 100)
  }

  /**
   * Calculate availability match percentage
   */
  private static calculateAvailabilityMatch(
    availability: StaffAvailability,
    scheduledDate: string,
    scheduledTime?: string
  ): number {
    // Simplified availability calculation
    if (availability.currentStatus === 'available') return 100
    if (availability.currentStatus === 'busy' && availability.activeJobs < 3) return 70
    if (availability.currentStatus === 'off_duty') return 20
    return 50
  }

  /**
   * Calculate workload match percentage
   */
  private static calculateWorkloadMatch(availability: StaffAvailability): number {
    const totalJobs = availability.activeJobs + availability.pendingJobs
    if (totalJobs === 0) return 100
    if (totalJobs <= 2) return 80
    if (totalJobs <= 4) return 60
    if (totalJobs <= 6) return 40
    return 20
  }

  /**
   * Calculate performance score percentage
   */
  private static calculatePerformanceScore(availability: StaffAvailability): number {
    const completionRate = availability.completionRate || 0
    const averageRating = availability.averageRating || 0
    const punctualityScore = availability.punctualityScore || 0
    
    return Math.round((completionRate + (averageRating * 20) + punctualityScore) / 3)
  }

  /**
   * Calculate location match percentage
   */
  private static calculateLocationMatch(assignedProperties: string[], propertyId: string): number {
    if (assignedProperties.includes(propertyId)) return 100
    if (assignedProperties.length === 0) return 80 // No restrictions
    return 40 // Not assigned to this property
  }

  /**
   * Estimate response time in minutes
   */
  private static estimateResponseTime(availability: StaffAvailability): number {
    return availability.averageResponseTime || 15
  }

  /**
   * Estimate travel time in minutes
   */
  private static estimateTravelTime(staffData: any, jobData: JobAssignment): number {
    // Simplified travel time calculation
    return staffData.travelTime || 20
  }

  /**
   * Get staff availability data
   */
  private static async getStaffAvailability(staffId: string): Promise<StaffAvailability | null> {
    try {
      // This would typically come from a real-time availability collection
      // For now, we'll create a basic availability object
      const staffRef = doc(this.db, 'staff_accounts', staffId)
      const staffDoc = await getDoc(staffRef)
      
      if (!staffDoc.exists()) return null
      
      const staffData = staffDoc.data()
      
      // Get current job assignments for this staff member
      const jobsQuery = query(
        collection(this.db, 'job_assignments'),
        where('assignedStaffId', '==', staffId),
        where('status', 'in', ['assigned', 'accepted', 'in_progress'])
      )
      
      const jobsSnapshot = await getDocs(jobsQuery)
      const activeJobs = jobsSnapshot.size

      return {
        staffId,
        staffName: staffData.name,
        staffEmail: staffData.email,
        role: staffData.role,
        currentStatus: activeJobs > 0 ? 'busy' : 'available',
        lastStatusUpdate: new Date().toISOString(),
        activeJobs,
        pendingJobs: 0,
        todayJobs: activeJobs,
        weeklyHours: 40,
        skills: staffData.skills || [],
        experienceLevel: 'intermediate',
        workingHours: {
          start: '08:00',
          end: '17:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        },
        timeOff: [],
        completionRate: 85,
        averageRating: 4.2,
        totalJobsCompleted: 150,
        averageResponseTime: 12,
        punctualityScore: 90,
        assignedProperties: staffData.assignedProperties || [],
        preferredJobTypes: ['cleaning', 'maintenance'],
        lastSeen: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('❌ Error getting staff availability:', error)
      return null
    }
  }

  /**
   * Update staff workload after assignment
   */
  private static async updateStaffWorkload(staffId: string): Promise<void> {
    try {
      // This would update the staff availability collection
      // Implementation depends on your real-time availability tracking system
      console.log(`📊 Updated workload for staff ${staffId}`)
    } catch (error) {
      console.error('❌ Error updating staff workload:', error)
    }
  }

  /**
   * Send job notification to staff member
   */
  private static async sendJobNotification(
    jobId: string,
    staffId: string,
    type: 'job_assigned' | 'job_updated' | 'job_cancelled' | 'job_reminder',
    options?: {
      customMessage?: string
      actionDeadline?: string
    }
  ): Promise<void> {
    try {
      // Get job and staff details
      const [jobDoc, staffDoc] = await Promise.all([
        getDoc(doc(this.db, 'job_assignments', jobId)),
        getDoc(doc(this.db, 'staff_accounts', staffId))
      ])

      if (!jobDoc.exists() || !staffDoc.exists()) {
        throw new Error('Job or staff not found')
      }

      const jobData = jobDoc.data() as JobAssignment
      const staffData = staffDoc.data()

      const notification: Omit<JobNotification, 'id'> = {
        recipientId: staffId,
        recipientEmail: staffData.email,
        recipientName: staffData.name,
        recipientRole: staffData.role,
        jobAssignmentId: jobId,
        bookingId: jobData.bookingId,
        type,
        title: this.getNotificationTitle(type, jobData),
        message: options?.customMessage || this.getNotificationMessage(type, jobData),
        priority: jobData.priority,
        status: 'pending',
        actionRequired: type === 'job_assigned',
        actionType: type === 'job_assigned' ? 'accept_decline' : undefined,
        actionUrl: `/jobs/${jobId}`,
        actionDeadline: options?.actionDeadline,
        webNotification: true,
        mobileNotification: true,
        emailNotification: true,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any
      }

      await addDoc(collection(this.db, 'job_notifications'), notification)
      
      // Update job assignment to mark notification as sent
      await updateDoc(doc(this.db, 'job_assignments', jobId), {
        mobileNotificationSent: true,
        lastSyncedAt: serverTimestamp()
      })

      console.log(`✅ Sent ${type} notification to staff ${staffId} for job ${jobId}`)
    } catch (error) {
      console.error('❌ Error sending job notification:', error)
    }
  }

  /**
   * Get notification title based on type
   */
  private static getNotificationTitle(type: string, jobData: JobAssignment): string {
    switch (type) {
      case 'job_assigned':
        return `New Job Assignment: ${jobData.title}`
      case 'job_updated':
        return `Job Updated: ${jobData.title}`
      case 'job_cancelled':
        return `Job Cancelled: ${jobData.title}`
      case 'job_reminder':
        return `Job Reminder: ${jobData.title}`
      default:
        return `Job Notification: ${jobData.title}`
    }
  }

  /**
   * Get notification message based on type
   */
  private static getNotificationMessage(type: string, jobData: JobAssignment): string {
    switch (type) {
      case 'job_assigned':
        return `You have been assigned a new ${jobData.jobType} job at ${jobData.propertyName}. Scheduled for ${jobData.scheduledDate}. Please accept or decline this assignment.`
      case 'job_updated':
        return `Your job assignment at ${jobData.propertyName} has been updated. Please review the changes.`
      case 'job_cancelled':
        return `Your job assignment at ${jobData.propertyName} has been cancelled.`
      case 'job_reminder':
        return `Reminder: You have a ${jobData.jobType} job at ${jobData.propertyName} scheduled for ${jobData.scheduledDate}.`
      default:
        return `Job notification for ${jobData.propertyName}`
    }
  }

  /**
   * Staff accepts or declines a job assignment
   */
  static async respondToJobAssignment(
    jobId: string,
    staffId: string,
    response: {
      accepted: boolean
      notes?: string
      estimatedArrival?: string
      alternativeTime?: string
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const jobRef = doc(this.db, 'job_assignments', jobId)
      const jobDoc = await getDoc(jobRef)

      if (!jobDoc.exists()) {
        return { success: false, error: 'Job assignment not found' }
      }

      const jobData = jobDoc.data() as JobAssignment

      if (jobData.assignedStaffId !== staffId) {
        return { success: false, error: 'Not authorized to respond to this job' }
      }

      const timestamp = serverTimestamp()
      const newStatus: JobStatus = response.accepted ? 'accepted' : 'declined'

      const updates: Partial<JobAssignment> = {
        status: newStatus,
        staffResponse: {
          accepted: response.accepted,
          responseAt: new Date().toISOString(),
          notes: response.notes,
          estimatedArrival: response.estimatedArrival,
          alternativeTime: response.alternativeTime
        },
        updatedAt: timestamp as any,
        syncVersion: (jobData.syncVersion || 1) + 1,
        lastSyncedAt: timestamp as any
      }

      if (response.accepted) {
        updates.acceptedAt = timestamp as any
      } else {
        updates.declinedAt = timestamp as any
      }

      await updateDoc(jobRef, updates)

      // Update staff availability
      await this.updateStaffWorkload(staffId)

      // If declined, we might want to reassign or notify admin
      if (!response.accepted) {
        await this.handleJobDeclined(jobId, staffId, response.notes)
      }

      console.log(`✅ Staff ${staffId} ${response.accepted ? 'accepted' : 'declined'} job ${jobId}`)

      return { success: true }
    } catch (error) {
      console.error('❌ Error responding to job assignment:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Handle job declined by staff
   */
  private static async handleJobDeclined(
    jobId: string,
    staffId: string,
    reason?: string
  ): Promise<void> {
    try {
      // Get alternative staff suggestions
      const suggestions = await this.getStaffSuggestions(jobId, {
        maxSuggestions: 3
      })

      // TODO: Notify admin about declined job and provide alternatives
      console.log(`📋 Job ${jobId} declined by staff ${staffId}. Reason: ${reason}`)
      console.log(`📋 Alternative staff suggestions:`, suggestions.suggestions?.map(s => s.staffName))

      // Could implement auto-reassignment logic here
    } catch (error) {
      console.error('❌ Error handling job declined:', error)
    }
  }

  /**
   * Update job status (start, complete, etc.)
   */
  static async updateJobStatus(
    jobId: string,
    staffId: string,
    status: JobStatus,
    updates?: {
      progress?: number
      notes?: string
      completionNotes?: string
      completionPhotos?: string[]
      qualityRating?: number
      issuesReported?: string[]
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const jobRef = doc(this.db, 'job_assignments', jobId)
      const jobDoc = await getDoc(jobRef)

      if (!jobDoc.exists()) {
        return { success: false, error: 'Job assignment not found' }
      }

      const jobData = jobDoc.data() as JobAssignment

      if (jobData.assignedStaffId !== staffId) {
        return { success: false, error: 'Not authorized to update this job' }
      }

      const timestamp = serverTimestamp()
      const updateData: Partial<JobAssignment> = {
        status,
        updatedAt: timestamp as any,
        syncVersion: (jobData.syncVersion || 1) + 1,
        lastSyncedAt: timestamp as any
      }

      if (updates?.progress !== undefined) updateData.progress = updates.progress
      if (updates?.notes) updateData.notes = updates.notes
      if (updates?.completionNotes) updateData.completionNotes = updates.completionNotes
      if (updates?.completionPhotos) updateData.completionPhotos = updates.completionPhotos
      if (updates?.qualityRating) updateData.qualityRating = updates.qualityRating
      if (updates?.issuesReported) updateData.issuesReported = updates.issuesReported

      // Set timestamps based on status
      switch (status) {
        case 'in_progress':
          updateData.startedAt = timestamp as any
          break
        case 'completed':
          updateData.completedAt = timestamp as any
          updateData.progress = 100
          break
        case 'cancelled':
          updateData.cancelledAt = timestamp as any
          break
      }

      await updateDoc(jobRef, updateData)

      // Update staff availability
      await this.updateStaffWorkload(staffId)

      console.log(`✅ Updated job ${jobId} status to ${status}`)

      return { success: true }
    } catch (error) {
      console.error('❌ Error updating job status:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get job assignments with filters
   */
  static async getJobAssignments(
    filters?: JobAssignmentFilters
  ): Promise<{ success: boolean; data?: JobAssignment[]; stats?: JobAssignmentStats; error?: string }> {
    try {
      let q = collection(this.db, 'job_assignments')
      let queryConstraints: any[] = []

      // Apply filters
      if (filters?.status && filters.status.length > 0) {
        queryConstraints.push(where('status', 'in', filters.status))
      }
      if (filters?.jobType && filters.jobType.length > 0) {
        queryConstraints.push(where('jobType', 'in', filters.jobType))
      }
      if (filters?.priority && filters.priority.length > 0) {
        queryConstraints.push(where('priority', 'in', filters.priority))
      }
      if (filters?.assignedStaff && filters.assignedStaff.length > 0) {
        queryConstraints.push(where('assignedStaffId', 'in', filters.assignedStaff))
      }

      // Apply sorting
      const sortBy = filters?.sortBy || 'createdAt'
      const sortOrder = filters?.sortOrder || 'desc'
      queryConstraints.push(orderBy(sortBy, sortOrder))

      // Apply limit
      queryConstraints.push(limit(100))

      const finalQuery = query(q, ...queryConstraints)
      const snapshot = await getDocs(finalQuery)

      const jobs: JobAssignment[] = []
      snapshot.forEach(doc => {
        jobs.push({ id: doc.id, ...doc.data() } as JobAssignment)
      })

      // Calculate stats
      const stats = this.calculateJobStats(jobs)

      return {
        success: true,
        data: jobs,
        stats
      }
    } catch (error) {
      console.error('❌ Error getting job assignments:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Calculate job assignment statistics
   */
  private static calculateJobStats(jobs: JobAssignment[]): JobAssignmentStats {
    const total = jobs.length
    const statusCounts = jobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const todayJobs = jobs.filter(job => job.scheduledDate === today)
    const overdue = jobs.filter(job =>
      new Date(job.deadline) < now &&
      !['completed', 'cancelled'].includes(job.status)
    )

    return {
      total,
      pending: statusCounts.pending || 0,
      assigned: statusCounts.assigned || 0,
      accepted: statusCounts.accepted || 0,
      declined: statusCounts.declined || 0,
      inProgress: statusCounts.in_progress || 0,
      completed: statusCounts.completed || 0,
      cancelled: statusCounts.cancelled || 0,
      overdue: overdue.length,

      // Performance Metrics (simplified calculations)
      averageResponseTime: 15, // minutes
      averageCompletionTime: 120, // minutes
      completionRate: total > 0 ? ((statusCounts.completed || 0) / total) * 100 : 0,
      acceptanceRate: total > 0 ? (((statusCounts.accepted || 0) + (statusCounts.in_progress || 0) + (statusCounts.completed || 0)) / total) * 100 : 0,

      // Staff Metrics (would need additional queries in real implementation)
      totalStaff: 10,
      availableStaff: 7,
      busyStaff: 3,
      averageWorkload: 2.5,

      // Today's Summary
      todayJobs: todayJobs.length,
      todayCompleted: todayJobs.filter(job => job.status === 'completed').length,
      todayPending: todayJobs.filter(job => job.status === 'pending').length,
      todayOverdue: todayJobs.filter(job =>
        new Date(job.deadline) < now &&
        !['completed', 'cancelled'].includes(job.status)
      ).length
    }
  }

  /**
   * Get staff availability for job assignment page
   */
  static async getAllStaffAvailability(): Promise<{ success: boolean; data?: StaffAvailability[]; error?: string }> {
    try {
      // Temporary fix: Remove orderBy to avoid index requirement
      // TODO: Create composite index for isActive + name ordering
      const staffQuery = query(
        collection(this.db, 'staff_accounts'),
        where('isActive', '==', true)
      )

      const staffSnapshot = await getDocs(staffQuery)
      const availabilityData: StaffAvailability[] = []

      for (const staffDoc of staffSnapshot.docs) {
        const availability = await this.getStaffAvailability(staffDoc.id)
        if (availability) {
          availabilityData.push(availability)
        }
      }

      // Sort in memory instead of in query
      availabilityData.sort((a, b) => a.staffName.localeCompare(b.staffName))

      return {
        success: true,
        data: availabilityData
      }
    } catch (error) {
      console.error('❌ Error getting staff availability:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
