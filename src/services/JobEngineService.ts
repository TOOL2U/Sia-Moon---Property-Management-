/**
 * Job Engine Service - Phase 4
 * 
 * Core system logic for booking → job automation.
 * This service is responsible for creating, updating, and managing
 * all operational jobs based on booking lifecycle events.
 * 
 * CRITICAL: This is system-driven, not user-driven.
 */

import { getDb } from '@/lib/firebase'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'

import { 
  Job, 
  JobCreationRequest, 
  JobStatusUpdate, 
  JobQuery, 
  JobValidationResult,
  JOB_TIMING_CONFIG,
  JOB_ROLE_MAPPING,
  JOB_WORKFLOW
} from '@/types/job'
import AutoDispatchService from '@/services/AutoDispatchService'

export class JobEngineService {
  private static db = getDb()
  private static readonly COLLECTION_NAME = 'operational_jobs'

  /**
   * BOOKING → JOB AUTOMATION
   * Creates all required jobs when a booking is confirmed
   */
  static async createJobsFromBooking(request: JobCreationRequest): Promise<{
    success: boolean
    jobIds: string[]
    jobs: Job[]
    error?: string
  }> {
    try {
      console.log(`🏗️ Creating jobs for booking ${request.bookingId}`)

      // Validate booking data
      const validation = this.validateJobCreationRequest(request)
      if (!validation.valid) {
        return {
          success: false,
          jobIds: [],
          jobs: [],
          error: `Validation failed: ${validation.errors.join(', ')}`
        }
      }

      // Calculate job schedule based on checkout
      const jobSchedule = this.calculateJobSchedule(request.checkOutDate)
      
      // Create all jobs in the standard workflow
      const createdJobs: Job[] = []
      const jobIds: string[] = []

      for (const workflowStep of JOB_WORKFLOW.STANDARD_SEQUENCE) {
        const job = this.createJobFromWorkflowStep(
          request, 
          workflowStep, 
          jobSchedule
        )

        // Save job to Firestore
        const jobDocRef = await addDoc(
          collection(this.db, this.COLLECTION_NAME),
          this.prepareJobForFirestore(job)
        )

        const savedJob = { ...job, jobId: jobDocRef.id }
        createdJobs.push(savedJob)
        jobIds.push(jobDocRef.id)

        console.log(`✅ Created ${job.jobType} job: ${jobDocRef.id}`)

        // PHASE 5: Trigger auto-dispatch for new job
        try {
          const autoDispatchCheck = AutoDispatchService.shouldTriggerAutoDispatch(savedJob)
          if (autoDispatchCheck.shouldTrigger) {
            const offerResult = await AutoDispatchService.triggerOfferCreationForNewJob(savedJob)
            if (offerResult.success) {
              console.log(`🚀 Auto-dispatch offer created: ${offerResult.offerId} for job ${savedJob.jobId}`)
            } else {
              console.warn(`⚠️ Auto-dispatch failed for job ${savedJob.jobId}: ${offerResult.error}`)
            }
          } else {
            console.log(`⏭️ Auto-dispatch skipped for job ${savedJob.jobId}: ${autoDispatchCheck.reason}`)
          }
        } catch (error) {
          console.error(`❌ Auto-dispatch error for job ${savedJob.jobId}:`, error)
          // Don't fail job creation if auto-dispatch fails
        }
      }

      // Log job creation event
      await this.logJobEvent('jobs_created_from_booking', {
        bookingId: request.bookingId,
        jobIds,
        jobCount: createdJobs.length,
        checkOutDate: request.checkOutDate
      })

      console.log(`🎯 Successfully created ${createdJobs.length} jobs for booking ${request.bookingId}`)

      return {
        success: true,
        jobIds,
        jobs: createdJobs
      }

    } catch (error) {
      console.error('❌ Error creating jobs from booking:', error)
      return {
        success: false,
        jobIds: [],
        jobs: [],
        error: error instanceof Error ? error.message : 'Job creation failed'
      }
    }
  }

  /**
   * BOOKING MODIFICATION HANDLER
   * Updates job schedules when booking is modified
   */
  static async handleBookingModification(
    bookingId: string,
    newCheckOutDate: Date,
    modifications: {
      guestName?: string
      propertyName?: string
      specialInstructions?: string
    }
  ): Promise<{
    success: boolean
    modifiedJobs: string[]
    unassignedJobs: string[]
    error?: string
  }> {
    try {
      console.log(`🔄 Handling booking modification for ${bookingId}`)

      // Get all existing jobs for this booking
      const existingJobs = await this.getJobsByBookingId(bookingId)
      
      if (existingJobs.length === 0) {
        console.log(`⚠️ No existing jobs found for booking ${bookingId}`)
        return { success: true, modifiedJobs: [], unassignedJobs: [] }
      }

      // Calculate new schedule
      const newSchedule = this.calculateJobSchedule(newCheckOutDate)
      
      const modifiedJobIds: string[] = []
      const unassignedJobIds: string[] = []

      // Update each job
      for (const job of existingJobs) {
        const updates: Partial<Job> = {
          updatedAt: new Date(),
          ...modifications
        }

        // Update timing based on job type
        const newTiming = this.getJobTiming(job.jobType, newSchedule)
        updates.scheduledStart = newTiming.start
        updates.scheduledEnd = newTiming.end

        // If job is already assigned, unassign it due to timing change
        if (job.assignedStaffId && job.status === 'assigned') {
          updates.assignedStaffId = null
          updates.status = 'pending'
          updates.assignedAt = undefined
          unassignedJobIds.push(job.jobId)
          
          console.log(`🔄 Unassigned job ${job.jobId} due to schedule change`)
        }

        // Update job in Firestore
        await updateDoc(
          doc(this.db, this.COLLECTION_NAME, job.jobId),
          this.prepareJobUpdatesForFirestore(updates)
        )

        modifiedJobIds.push(job.jobId)
      }

      // Log modification event
      await this.logJobEvent('jobs_modified_from_booking', {
        bookingId,
        modifiedJobs: modifiedJobIds,
        unassignedJobs: unassignedJobIds,
        newCheckOutDate
      })

      console.log(`✅ Modified ${modifiedJobIds.length} jobs for booking ${bookingId}`)

      return {
        success: true,
        modifiedJobs: modifiedJobIds,
        unassignedJobs: unassignedJobIds
      }

    } catch (error) {
      console.error('❌ Error handling booking modification:', error)
      return {
        success: false,
        modifiedJobs: [],
        unassignedJobs: [],
        error: error instanceof Error ? error.message : 'Modification failed'
      }
    }
  }

  /**
   * BOOKING CANCELLATION HANDLER
   * Cancels all related jobs when booking is cancelled
   */
  static async handleBookingCancellation(bookingId: string): Promise<{
    success: boolean
    cancelledJobs: string[]
    releasedStaff: string[]
    error?: string
  }> {
    try {
      console.log(`❌ Handling booking cancellation for ${bookingId}`)

      // Get all jobs for this booking
      const jobs = await this.getJobsByBookingId(bookingId)
      
      const cancelledJobIds: string[] = []
      const releasedStaffIds: string[] = []

      for (const job of jobs) {
        // Track staff that will be released
        if (job.assignedStaffId) {
          releasedStaffIds.push(job.assignedStaffId)
        }

        // Cancel the job
        await updateDoc(
          doc(this.db, this.COLLECTION_NAME, job.jobId),
          {
            status: 'cancelled',
            cancelledAt: serverTimestamp(),
            assignedStaffId: null,
            updatedAt: serverTimestamp(),
            completionNotes: 'Cancelled due to booking cancellation'
          }
        )

        cancelledJobIds.push(job.jobId)
      }

      // Log cancellation event
      await this.logJobEvent('jobs_cancelled_from_booking', {
        bookingId,
        cancelledJobs: cancelledJobIds,
        releasedStaff: releasedStaffIds
      })

      console.log(`✅ Cancelled ${cancelledJobIds.length} jobs for booking ${bookingId}`)

      return {
        success: true,
        cancelledJobs: cancelledJobIds,
        releasedStaff: releasedStaffIds
      }

    } catch (error) {
      console.error('❌ Error handling booking cancellation:', error)
      return {
        success: false,
        cancelledJobs: [],
        releasedStaff: [],
        error: error instanceof Error ? error.message : 'Cancellation failed'
      }
    }
  }

  /**
   * ROLE ENFORCEMENT
   * Get jobs visible to specific staff role
   */
  static async getJobsForStaffRole(
    staffId: string,
    staffRole: string,
    filters?: Partial<JobQuery>
  ): Promise<{
    success: boolean
    jobs: Job[]
    error?: string
  }> {
    try {
      console.log(`👷 Getting jobs for staff role: ${staffRole}`)

      // Build query with role enforcement
      const queryConstraints = [
        where('requiredRole', '==', staffRole)
      ]

      // Add staff assignment filter (assigned jobs only)
      if (staffId) {
        queryConstraints.push(where('assignedStaffId', '==', staffId))
      }

      // Add additional filters
      if (filters?.status) {
        queryConstraints.push(where('status', '==', filters.status))
      }

      if (filters?.jobType) {
        queryConstraints.push(where('jobType', '==', filters.jobType))
      }

      // Execute query
      const q = query(
        collection(this.db, this.COLLECTION_NAME),
        ...queryConstraints,
        orderBy('scheduledStart', 'asc')
      )

      const querySnapshot = await getDocs(q)
      const jobs: Job[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        jobs.push(this.convertFirestoreDocToJob(doc.id, data))
      })

      // Additional date range filtering (client-side)
      let filteredJobs = jobs
      if (filters?.dateRange) {
        filteredJobs = jobs.filter(job =>
          job.scheduledStart >= filters.dateRange!.start &&
          job.scheduledStart <= filters.dateRange!.end
        )
      }

      console.log(`✅ Found ${filteredJobs.length} jobs for role ${staffRole}`)

      return {
        success: true,
        jobs: filteredJobs
      }

    } catch (error) {
      console.error('❌ Error getting jobs for staff role:', error)
      return {
        success: false,
        jobs: [],
        error: error instanceof Error ? error.message : 'Query failed'
      }
    }
  }

  /**
   * JOB STATUS UPDATE
   * Update job status with validation and tracking
   */
  static async updateJobStatus(update: JobStatusUpdate): Promise<{
    success: boolean
    job?: Job
    error?: string
  }> {
    try {
      console.log(`🔄 Updating job ${update.jobId} to status: ${update.status}`)

      // Get current job
      const currentJob = await this.getJobById(update.jobId)
      if (!currentJob) {
        return {
          success: false,
          error: 'Job not found'
        }
      }

      // Validate status transition
      const validTransition = this.isValidStatusTransition(
        currentJob.status, 
        update.status
      )
      
      if (!validTransition) {
        return {
          success: false,
          error: `Invalid status transition: ${currentJob.status} → ${update.status}`
        }
      }

      // Prepare update data
      const updateData: Partial<Job> = {
        status: update.status,
        updatedAt: new Date()
      }

      // Add status-specific fields
      switch (update.status) {
        case 'assigned':
          updateData.assignedStaffId = update.assignedStaffId
          updateData.assignedAt = new Date()
          break
        case 'in_progress':
          updateData.startedAt = new Date()
          break
        case 'completed':
          updateData.completedAt = new Date()
          if (update.completionData) {
            updateData.completionNotes = update.completionData.notes
            updateData.rating = update.completionData.rating
            updateData.issues = update.completionData.issues
            updateData.photosUploaded = update.completionData.photosUploaded
          }
          break
        case 'cancelled':
          updateData.cancelledAt = new Date()
          updateData.assignedStaffId = null
          break
      }

      // Update in Firestore
      await updateDoc(
        doc(this.db, this.COLLECTION_NAME, update.jobId),
        this.prepareJobUpdatesForFirestore(updateData)
      )

      // Get updated job
      const updatedJob = await this.getJobById(update.jobId)

      // Log status change event
      await this.logJobEvent('job_status_updated', {
        jobId: update.jobId,
        oldStatus: currentJob.status,
        newStatus: update.status,
        updatedBy: update.updatedBy
      })

      console.log(`✅ Job ${update.jobId} status updated to ${update.status}`)

      return {
        success: true,
        job: updatedJob!
      }

    } catch (error) {
      console.error('❌ Error updating job status:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Status update failed'
      }
    }
  }

  /**
   * GET ALL JOBS (Admin view)
   * Returns all jobs with filtering
   */
  static async getAllJobs(filters?: Partial<JobQuery>): Promise<{
    success: boolean
    jobs: Job[]
    stats: {
      total: number
      pending: number
      assigned: number
      inProgress: number
      completed: number
      cancelled: number
      byType: Record<string, number>
    }
    error?: string
  }> {
    try {
      console.log('📋 Getting all jobs for admin view')

      // Build query
      const queryConstraints = []

      if (filters?.status) {
        queryConstraints.push(where('status', '==', filters.status))
      }

      if (filters?.jobType) {
        queryConstraints.push(where('jobType', '==', filters.jobType))
      }

      if (filters?.bookingId) {
        queryConstraints.push(where('bookingId', '==', filters.bookingId))
      }

      if (filters?.assignedStaffId) {
        queryConstraints.push(where('assignedStaffId', '==', filters.assignedStaffId))
      }

      // Execute query
      const q = queryConstraints.length > 0 
        ? query(
            collection(this.db, this.COLLECTION_NAME),
            ...queryConstraints,
            orderBy('createdAt', 'desc')
          )
        : query(
            collection(this.db, this.COLLECTION_NAME),
            orderBy('createdAt', 'desc')
          )

      const querySnapshot = await getDocs(q)
      const jobs: Job[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        jobs.push(this.convertFirestoreDocToJob(doc.id, data))
      })

      // Apply date range filter (client-side)
      let filteredJobs = jobs
      if (filters?.dateRange) {
        filteredJobs = jobs.filter(job =>
          job.scheduledStart >= filters.dateRange!.start &&
          job.scheduledStart <= filters.dateRange!.end
        )
      }

      // Calculate stats
      const stats = {
        total: filteredJobs.length,
        pending: filteredJobs.filter(j => j.status === 'pending').length,
        assigned: filteredJobs.filter(j => j.status === 'assigned').length,
        inProgress: filteredJobs.filter(j => j.status === 'in_progress').length,
        completed: filteredJobs.filter(j => j.status === 'completed').length,
        cancelled: filteredJobs.filter(j => j.status === 'cancelled').length,
        byType: {
          cleaning: filteredJobs.filter(j => j.jobType === 'cleaning').length,
          inspection: filteredJobs.filter(j => j.jobType === 'inspection').length,
          maintenance: filteredJobs.filter(j => j.jobType === 'maintenance').length
        }
      }

      console.log(`✅ Retrieved ${filteredJobs.length} jobs`)

      return {
        success: true,
        jobs: filteredJobs,
        stats
      }

    } catch (error) {
      console.error('❌ Error getting all jobs:', error)
      return {
        success: false,
        jobs: [],
        stats: { total: 0, pending: 0, assigned: 0, inProgress: 0, completed: 0, cancelled: 0, byType: {} },
        error: error instanceof Error ? error.message : 'Query failed'
      }
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  private static validateJobCreationRequest(request: JobCreationRequest): JobValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (!request.bookingId) errors.push('Booking ID is required')
    if (!request.propertyId) errors.push('Property ID is required')
    if (!request.guestName) errors.push('Guest name is required')
    if (!request.propertyName) errors.push('Property name is required')
    if (!request.checkOutDate) errors.push('Check-out date is required')

    if (request.checkOutDate && request.checkOutDate < new Date()) {
      warnings.push('Check-out date is in the past')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  private static calculateJobSchedule(checkOutDate: Date): {
    cleaning: { start: Date; end: Date }
    inspection: { start: Date; end: Date }
  } {
    // Cleaning starts CLEANING_DELAY_AFTER_CHECKOUT minutes after checkout
    const cleaningStart = new Date(
      checkOutDate.getTime() + (JOB_TIMING_CONFIG.CLEANING_DELAY_AFTER_CHECKOUT * 60 * 1000)
    )
    const cleaningEnd = new Date(
      cleaningStart.getTime() + (JOB_TIMING_CONFIG.DURATION.cleaning * 60 * 1000)
    )

    // Inspection starts BUFFER_BETWEEN_JOBS minutes after cleaning ends
    const inspectionStart = new Date(
      cleaningEnd.getTime() + (JOB_TIMING_CONFIG.BUFFER_BETWEEN_JOBS * 60 * 1000)
    )
    const inspectionEnd = new Date(
      inspectionStart.getTime() + (JOB_TIMING_CONFIG.DURATION.inspection * 60 * 1000)
    )

    return {
      cleaning: { start: cleaningStart, end: cleaningEnd },
      inspection: { start: inspectionStart, end: inspectionEnd }
    }
  }

  private static createJobFromWorkflowStep(
    request: JobCreationRequest,
    workflowStep: any,
    schedule: any
  ): Omit<Job, 'jobId'> {
    const timing = this.getJobTiming(workflowStep.type, schedule)
    
    return {
      bookingId: request.bookingId,
      propertyId: request.propertyId,
      jobType: workflowStep.type,
      requiredRole: workflowStep.requiredRole,
      scheduledStart: timing.start,
      scheduledEnd: timing.end,
      status: 'pending',
      assignedStaffId: null,
      createdBy: 'system',
      priority: this.determineJobPriority(workflowStep.type, request.checkOutDate),
      estimatedDuration: JOB_TIMING_CONFIG.DURATION[workflowStep.type as keyof typeof JOB_TIMING_CONFIG.DURATION],
      guestName: request.guestName,
      propertyName: request.propertyName,
      checkInDate: request.checkInDate,
      checkOutDate: request.checkOutDate,
      requirements: this.getJobRequirements(workflowStep.type),
      specialInstructions: request.specialInstructions,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  private static getJobTiming(jobType: string, schedule: any): { start: Date; end: Date } {
    switch (jobType) {
      case 'cleaning':
        return schedule.cleaning
      case 'inspection':
        return schedule.inspection
      default:
        return schedule.cleaning // fallback
    }
  }

  private static determineJobPriority(
    jobType: string, 
    checkOutDate: Date
  ): Job['priority'] {
    const now = new Date()
    const hoursUntilCheckout = (checkOutDate.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (hoursUntilCheckout < 2) return 'critical'
    if (hoursUntilCheckout < 12) return 'high'
    if (hoursUntilCheckout < 24) return 'medium'
    return 'low'
  }

  private static getJobRequirements(jobType: string): string[] {
    switch (jobType) {
      case 'cleaning':
        return [
          'Complete deep cleaning checklist',
          'Change all linens',
          'Sanitize all surfaces',
          'Restock amenities',
          'Document with photos'
        ]
      case 'inspection':
        return [
          'Verify cleaning quality',
          'Check property condition',
          'Test all amenities',
          'Document any issues',
          'Approve guest readiness'
        ]
      case 'maintenance':
        return [
          'Address reported issues',
          'Test functionality',
          'Document repairs',
          'Update property status'
        ]
      default:
        return []
    }
  }

  private static isValidStatusTransition(
    currentStatus: Job['status'], 
    newStatus: Job['status']
  ): boolean {
    const validTransitions: Record<Job['status'], Job['status'][]> = {
      pending: ['offered', 'assigned', 'cancelled'],
      offered: ['assigned', 'pending', 'cancelled'],
      assigned: ['in_progress', 'pending', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
      completed: [], // Final state
      cancelled: []  // Final state
    }

    return validTransitions[currentStatus]?.includes(newStatus) || false
  }

  private static async getJobsByBookingId(bookingId: string): Promise<Job[]> {
    const q = query(
      collection(this.db, this.COLLECTION_NAME),
      where('bookingId', '==', bookingId)
    )

    const querySnapshot = await getDocs(q)
    const jobs: Job[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      jobs.push(this.convertFirestoreDocToJob(doc.id, data))
    })

    return jobs
  }

  private static async getJobById(jobId: string): Promise<Job | null> {
    const jobDoc = await getDoc(doc(this.db, this.COLLECTION_NAME, jobId))
    
    if (!jobDoc.exists()) {
      return null
    }

    return this.convertFirestoreDocToJob(jobDoc.id, jobDoc.data())
  }

  private static convertFirestoreDocToJob(id: string, data: any): Job {
    // Handle both scheduledStart and scheduledFor field names
    const scheduledStart = data.scheduledStart?.toDate?.() || data.scheduledFor?.toDate?.() || data.scheduledDate?.toDate?.() || new Date()
    const scheduledEnd = data.scheduledEnd?.toDate?.() || data.dueBy?.toDate?.() || new Date()
    
    // Extract property name from title if not in propertyName field
    let propertyName = data.propertyName
    if (!propertyName && data.title) {
      // Title format is usually "Job Type - Property Name"
      const parts = data.title.split(' - ')
      if (parts.length > 1) {
        propertyName = parts.slice(1).join(' - ')
      }
    }
    
    return {
      jobId: id,
      bookingId: data.bookingId,
      propertyId: data.propertyId,
      jobType: data.jobType,
      requiredRole: data.requiredRole,
      scheduledStart: scheduledStart,
      scheduledEnd: scheduledEnd,
      status: data.status,
      assignedStaffId: data.assignedStaffId,
      createdBy: data.createdBy,
      priority: data.priority,
      estimatedDuration: data.estimatedDuration,
      guestName: data.guestName,
      propertyName: propertyName,
      checkInDate: data.checkInDate?.toDate() || new Date(),
      checkOutDate: data.checkOutDate?.toDate() || new Date(),
      requirements: data.requirements || [],
      specialInstructions: data.specialInstructions,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      assignedAt: data.assignedAt?.toDate(),
      startedAt: data.startedAt?.toDate(),
      completedAt: data.completedAt?.toDate(),
      cancelledAt: data.cancelledAt?.toDate(),
      completionNotes: data.completionNotes,
      rating: data.rating,
      issues: data.issues,
      photosUploaded: data.photosUploaded
    }
  }

  private static prepareJobForFirestore(job: Omit<Job, 'jobId'>): any {
    return {
      ...job,
      scheduledStart: job.scheduledStart,
      scheduledEnd: job.scheduledEnd,
      checkInDate: job.checkInDate,
      checkOutDate: job.checkOutDate,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
  }

  private static prepareJobUpdatesForFirestore(updates: Partial<Job>): any {
    const firestoreUpdates: any = { ...updates }
    
    // Convert Date objects to Timestamps
    if (updates.scheduledStart) firestoreUpdates.scheduledStart = updates.scheduledStart
    if (updates.scheduledEnd) firestoreUpdates.scheduledEnd = updates.scheduledEnd
    if (updates.assignedAt) firestoreUpdates.assignedAt = updates.assignedAt
    if (updates.startedAt) firestoreUpdates.startedAt = updates.startedAt
    if (updates.completedAt) firestoreUpdates.completedAt = updates.completedAt
    if (updates.cancelledAt) firestoreUpdates.cancelledAt = updates.cancelledAt
    
    firestoreUpdates.updatedAt = serverTimestamp()
    
    return firestoreUpdates
  }

  private static async logJobEvent(eventType: string, data: any): Promise<void> {
    try {
      await addDoc(collection(this.db, 'job_events'), {
        eventType,
        data,
        timestamp: serverTimestamp()
      })
    } catch (error) {
      console.error('❌ Error logging job event:', error)
      // Don't throw - logging failures shouldn't break job operations
    }
  }
}

export default JobEngineService
