/**
 * Smart Job Assignment Service
 * Automatically creates and assigns operational jobs after booking approval
 */

import { db } from '@/lib/firebase'
import { clientToast as toast } from '@/utils/clientToast'
import {
  Timestamp,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import AIAutomationService from './AIAutomationService'

// Job types that are automatically created for bookings
export const OPERATIONAL_JOB_TYPES = {
  PRE_CLEANING: {
    id: 'pre_cleaning',
    name: 'Pre-Arrival Cleaning',
    description: 'Deep cleaning before guest arrival',
    estimatedDuration: 180, // minutes
    priority: 'high',
    requiredSkills: ['cleaning', 'housekeeping'],
    scheduleBefore: 24, // hours before check-in
  },
  CHECK_IN_PREP: {
    id: 'check_in_prep',
    name: 'Check-in Preparation',
    description: 'Prepare property for guest arrival',
    estimatedDuration: 60,
    priority: 'high',
    requiredSkills: ['hospitality', 'maintenance'],
    scheduleBefore: 4, // hours before check-in
  },
  POST_CLEANING: {
    id: 'post_cleaning',
    name: 'Post-Departure Cleaning',
    description: 'Cleaning after guest departure',
    estimatedDuration: 120,
    priority: 'medium',
    requiredSkills: ['cleaning', 'housekeeping'],
    scheduleAfter: 2, // hours after check-out
  },
  MAINTENANCE_CHECK: {
    id: 'maintenance_check',
    name: 'Property Maintenance Check',
    description: 'Inspect property condition after guest stay',
    estimatedDuration: 45,
    priority: 'medium',
    requiredSkills: ['maintenance', 'inspection'],
    scheduleAfter: 1, // hours after check-out
  },
} as const

// Processing configuration for enhanced performance
const PROCESSING_CONFIG = {
  maxConcurrentAssignments: 3,
  assignmentTimeoutSeconds: 30,
  retryAttempts: 3,
  retryDelayMs: 1000,
  successRateTarget: 95, // Target 95%+ successful assignment rate
}

// Assignment queue for managing concurrent processing
interface AssignmentQueue {
  bookingId: string
  booking: Booking
  timestamp: Date
  retryCount: number
}

// Detailed scoring breakdown for audit logging
interface StaffScoringBreakdown {
  staffId: string
  staffName: string
  totalScore: number
  skillMatchScore: number
  performanceScore: number
  workloadScore: number
  experienceScore: number
  skillsMatched: string[]
  currentWorkload: number
  completedJobsOfType: number
  isSelected: boolean
  availability: string
  workingHoursMatch: boolean
}

// Performance analytics for monitoring
interface AssignmentMetrics {
  totalAssignments: number
  successfulAssignments: number
  failedAssignments: number
  averageAssignmentTime: number
  successRate: number
}

// Staff performance metrics for assignment optimization
interface StaffPerformance {
  completionRate: number
  averageRating: number
  onTimeCompletion: number
  jobsCompleted: number
  specializations: string[]
}

// Staff availability and workload
interface StaffWorkload {
  currentJobs: number
  upcomingJobs: number
  availableHours: number
  lastAssigned: Date | null
}

// Booking interface
interface Booking {
  id: string
  propertyId: string
  propertyName?: string
  checkInDate: Timestamp | Date
  checkOutDate: Timestamp | Date
  guestName: string
  status: string
  [key: string]: any
}

// Staff interface
interface Staff {
  id: string
  name: string
  email: string
  skills: string[]
  availability: 'available' | 'busy' | 'unavailable'
  workingHours: {
    start: string
    end: string
    days: string[]
  }
  performance?: StaffPerformance
  [key: string]: any
}

// Job interface
interface Job {
  id: string
  type: string
  title: string
  description: string
  propertyId: string
  bookingId: string
  scheduledDate: Timestamp
  estimatedDuration: number
  priority: 'low' | 'medium' | 'high'
  requiredSkills: string[]
  assignedStaff: string | null
  assignedStaffName?: string
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  createdAt: Timestamp
  createdBy: string
  [key: string]: any
}

class SmartJobAssignmentService {
  private bookingListener: (() => void) | null = null
  private isInitialized = false
  private processingBookings: ProcessingState = {}
  private assignmentQueue: AssignmentQueue[] = []
  private isProcessingQueue = false
  private metrics: AssignmentMetrics = {
    totalAssignments: 0,
    successfulAssignments: 0,
    failedAssignments: 0,
    averageAssignmentTime: 0,
    successRate: 0,
  }

  /**
   * Initialize the Smart Job Assignment Service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ Smart Job Assignment Service already initialized')
      return
    }

    try {
      console.log('🤖 Initializing Smart Job Assignment Service...')

      // Check if AI automation is enabled
      const aiEnabled = await AIAutomationService.isEnabled()

      if (!aiEnabled) {
        console.log(
          '⚠️ AI automation disabled - Smart Job Assignment Service will not monitor bookings'
        )
        return
      }

      // Set up listener for confirmed bookings
      this.setupConfirmedBookingsListener()

      this.isInitialized = true
      console.log('✅ Smart Job Assignment Service initialized successfully')
    } catch (error) {
      console.error(
        '❌ Error initializing Smart Job Assignment Service:',
        error
      )
    }
  }

  /**
   * Set up listener for confirmed bookings
   */
  private setupConfirmedBookingsListener(): void {
    // Clear any existing listener
    if (this.bookingListener) {
      this.bookingListener()
      this.bookingListener = null
    }

    // Create query for confirmed bookings that haven't been processed for jobs
    const bookingsRef = collection(db, 'bookings')
    const confirmedBookingsQuery = query(
      bookingsRef,
      where('status', '==', 'confirmed'),
      where('jobsCreated', '!=', true) // Only process bookings that haven't had jobs created yet
    )

    // Set up real-time listener
    this.bookingListener = onSnapshot(
      confirmedBookingsQuery,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          // Process newly confirmed bookings
          if (change.type === 'added' || change.type === 'modified') {
            const bookingId = change.doc.id
            const bookingData = change.doc.data() as Booking
            bookingData.id = bookingId

            // Only process if jobs haven't been created yet
            if (!bookingData.jobsCreated) {
              this.addToProcessingQueue(bookingId, bookingData)
            }
          }
        })
      },
      (error) => {
        console.error('❌ Error in confirmed bookings listener:', error)
      }
    )

    console.log('🔍 Monitoring confirmed bookings for automatic job creation')
  }

  /**
   * Add booking to processing queue with retry logic
   */
  private addToProcessingQueue(bookingId: string, booking: Booking): void {
    // Skip if already processing this booking
    if (this.processingBookings[bookingId]) {
      console.log(`⏭️ Already processing booking ${bookingId}, skipping`)
      return
    }

    console.log(`➕ Adding booking ${bookingId} to processing queue`)
    this.assignmentQueue.push({
      bookingId,
      booking,
      timestamp: new Date(),
      retryCount: 0,
    })
    this.processingBookings[bookingId] = true

    // Start processing queue if not already processing
    if (!this.isProcessingQueue) {
      this.processAssignmentQueue()
    }
  }

  /**
   * Process the assignment queue with concurrency control
   */
  private async processAssignmentQueue(): Promise<void> {
    if (this.isProcessingQueue || this.assignmentQueue.length === 0) {
      return
    }

    this.isProcessingQueue = true
    console.log(
      `🔄 Processing assignment queue (${this.assignmentQueue.length} items)`
    )

    try {
      // Process up to maxConcurrentAssignments bookings at once
      const batchSize = Math.min(
        PROCESSING_CONFIG.maxConcurrentAssignments,
        this.assignmentQueue.length
      )
      const batch = this.assignmentQueue.splice(0, batchSize)

      // Process each booking in parallel with timeout
      await Promise.all(
        batch.map(async (queueItem) => {
          const startTime = Date.now()

          try {
            await Promise.race([
              this.processBookingForJobs(queueItem.booking),
              new Promise((_, reject) =>
                setTimeout(
                  () => reject(new Error('Assignment timeout')),
                  PROCESSING_CONFIG.assignmentTimeoutSeconds * 1000
                )
              ),
            ])

            // Update metrics
            this.updateMetrics(true, Date.now() - startTime)
          } catch (error) {
            console.error(
              `❌ Error processing booking ${queueItem.bookingId}:`,
              error
            )

            // Retry logic
            if (queueItem.retryCount < PROCESSING_CONFIG.retryAttempts) {
              queueItem.retryCount++
              console.log(
                `🔄 Retrying booking ${queueItem.bookingId} (attempt ${queueItem.retryCount})`
              )

              // Add back to queue with delay
              setTimeout(() => {
                this.assignmentQueue.push(queueItem)
              }, PROCESSING_CONFIG.retryDelayMs * queueItem.retryCount)
            } else {
              // Max retries exceeded
              this.updateMetrics(false, Date.now() - startTime)
              await this.markBookingError(queueItem.bookingId, error)
            }
          } finally {
            // Mark as no longer processing
            this.processingBookings[queueItem.bookingId] = false
          }
        })
      )

      // Continue processing queue if items remain
      if (this.assignmentQueue.length > 0) {
        setTimeout(() => this.processAssignmentQueue(), 100)
      } else {
        this.isProcessingQueue = false
        console.log('✅ Assignment queue processing complete')
      }
    } catch (error) {
      console.error('❌ Error processing assignment queue:', error)
      this.isProcessingQueue = false
    }
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(success: boolean, processingTime: number): void {
    this.metrics.totalAssignments++

    if (success) {
      this.metrics.successfulAssignments++
    } else {
      this.metrics.failedAssignments++
    }

    // Update average processing time
    this.metrics.averageAssignmentTime =
      (this.metrics.averageAssignmentTime *
        (this.metrics.totalAssignments - 1) +
        processingTime) /
      this.metrics.totalAssignments

    // Update success rate
    this.metrics.successRate =
      (this.metrics.successfulAssignments / this.metrics.totalAssignments) * 100

    // Log metrics periodically
    if (this.metrics.totalAssignments % 10 === 0) {
      console.log(
        `📊 Assignment Metrics: ${this.metrics.successRate.toFixed(1)}% success rate, ${this.metrics.averageAssignmentTime.toFixed(0)}ms avg time`
      )
    }
  }

  /**
   * Process a confirmed booking to create operational jobs
   */
  private async processBookingForJobs(booking: Booking): Promise<void> {
    console.log(`🔧 Creating operational jobs for booking ${booking.id}`)

    try {
      // Check if AI automation is still enabled
      const aiEnabled = await AIAutomationService.isEnabled()
      if (!aiEnabled) {
        console.log(
          `⚠️ AI automation disabled - skipping job creation for booking ${booking.id}`
        )
        return
      }

      // Create operational jobs for this booking
      const createdJobs = await this.createOperationalJobs(booking)

      if (createdJobs.length > 0) {
        // Assign staff to each job with detailed analytics
        const assignmentResults: StaffScoringBreakdown[] = []

        for (const job of createdJobs) {
          const result = await this.assignOptimalStaffWithAnalytics(job)
          if (result) {
            assignmentResults.push(result)
          }
        }

        // Mark booking as having jobs created
        await updateDoc(doc(db, 'bookings', booking.id), {
          jobsCreated: true,
          jobsCreatedAt: serverTimestamp(),
          jobsCreatedBy: 'AI_SMART_ASSIGNMENT',
          assignmentResults: assignmentResults.map((r) => ({
            jobType: r.staffId,
            assignedStaff: r.staffName,
            score: r.totalScore,
          })),
        })

        console.log(
          `✅ Created and assigned ${createdJobs.length} operational jobs for booking ${booking.id}`
        )
        toast.success(
          `🤖 AI created ${createdJobs.length} jobs for ${booking.guestName}`
        )

        // Log comprehensive assignment summary
        await this.logToAuditTrail({
          action: 'booking_jobs_created',
          bookingId: booking.id,
          guestName: booking.guestName,
          jobsCreated: createdJobs.length,
          assignmentResults: assignmentResults,
          processingTime: Date.now(),
          aiEnabled: true,
        })
      }
    } catch (error) {
      console.error(
        `❌ Error processing booking ${booking.id} for jobs:`,
        error
      )

      // Log error to audit trail
      await this.logToAuditTrail({
        action: 'job_creation_error',
        bookingId: booking.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        aiEnabled: true,
      })
    }
  }

  /**
   * Create operational jobs for a booking
   */
  private async createOperationalJobs(booking: Booking): Promise<Job[]> {
    const jobs: Job[] = []
    const checkInDate =
      booking.checkInDate instanceof Timestamp
        ? booking.checkInDate.toDate()
        : new Date(booking.checkInDate)
    const checkOutDate =
      booking.checkOutDate instanceof Timestamp
        ? booking.checkOutDate.toDate()
        : new Date(booking.checkOutDate)

    try {
      // Create pre-arrival jobs
      for (const [key, jobType] of Object.entries(OPERATIONAL_JOB_TYPES)) {
        if ('scheduleBefore' in jobType) {
          const scheduledDate = new Date(
            checkInDate.getTime() - jobType.scheduleBefore * 60 * 60 * 1000
          )

          const job: Partial<Job> = {
            type: jobType.id,
            title: jobType.name,
            description: `${jobType.description} for ${booking.guestName}`,
            propertyId: booking.propertyId,
            propertyName: booking.propertyName,
            bookingId: booking.id,
            scheduledDate: Timestamp.fromDate(scheduledDate),
            estimatedDuration: jobType.estimatedDuration,
            priority: jobType.priority as 'low' | 'medium' | 'high',
            requiredSkills: jobType.requiredSkills,
            assignedStaff: null,
            status: 'pending',
            createdAt: serverTimestamp(),
            createdBy: 'AI_SMART_ASSIGNMENT',
            guestName: booking.guestName,
          }

          const jobRef = doc(collection(db, 'jobs'))
          await setDoc(jobRef, job)

          jobs.push({ ...job, id: jobRef.id } as Job)
          console.log(
            `📋 Created ${jobType.name} job for booking ${booking.id}`
          )
        }
      }

      // Create post-departure jobs
      for (const [key, jobType] of Object.entries(OPERATIONAL_JOB_TYPES)) {
        if ('scheduleAfter' in jobType) {
          const scheduledDate = new Date(
            checkOutDate.getTime() + jobType.scheduleAfter * 60 * 60 * 1000
          )

          const job: Partial<Job> = {
            type: jobType.id,
            title: jobType.name,
            description: `${jobType.description} for ${booking.guestName}`,
            propertyId: booking.propertyId,
            propertyName: booking.propertyName,
            bookingId: booking.id,
            scheduledDate: Timestamp.fromDate(scheduledDate),
            estimatedDuration: jobType.estimatedDuration,
            priority: jobType.priority as 'low' | 'medium' | 'high',
            requiredSkills: jobType.requiredSkills,
            assignedStaff: null,
            status: 'pending',
            createdAt: serverTimestamp(),
            createdBy: 'AI_SMART_ASSIGNMENT',
            guestName: booking.guestName,
          }

          const jobRef = doc(collection(db, 'jobs'))
          await setDoc(jobRef, job)

          jobs.push({ ...job, id: jobRef.id } as Job)
          console.log(
            `📋 Created ${jobType.name} job for booking ${booking.id}`
          )
        }
      }

      return jobs
    } catch (error) {
      console.error('❌ Error creating operational jobs:', error)
      throw error
    }
  }

  /**
   * Assign optimal staff to a job with detailed analytics and scoring breakdown
   */
  private async assignOptimalStaffWithAnalytics(
    job: Job
  ): Promise<StaffScoringBreakdown | null> {
    console.log(
      `👤 Finding optimal staff for job ${job.id} (${job.title}) with analytics`
    )

    try {
      // Get all available staff
      const availableStaff = await this.getAvailableStaff(
        job.scheduledDate,
        job.requiredSkills
      )

      if (availableStaff.length === 0) {
        console.log(`⚠️ No available staff found for job ${job.id}`)
        await this.logToAuditTrail({
          action: 'no_staff_available',
          jobId: job.id,
          jobType: job.type,
          requiredSkills: job.requiredSkills,
          scheduledDate: job.scheduledDate,
          reason: 'No staff available with required skills',
          aiEnabled: true,
        })
        return null
      }

      // Score and rank staff with detailed breakdown
      const staffScores = await this.scoreStaffForJobWithBreakdown(
        job,
        availableStaff
      )

      // Select the best staff member
      const bestStaff = staffScores[0]

      if (bestStaff) {
        // Assign the job to the best staff member
        await this.assignJobToStaff(job, bestStaff.staff)

        // Mark as selected in breakdown
        bestStaff.isSelected = true

        console.log(
          `✅ Assigned job ${job.id} to ${bestStaff.staff.name} (score: ${bestStaff.totalScore.toFixed(2)})`
        )

        // Log detailed assignment with all candidates considered
        await this.logToAuditTrail({
          action: 'job_assigned_with_analytics',
          jobId: job.id,
          jobType: job.type,
          selectedStaff: {
            id: bestStaff.staff.id,
            name: bestStaff.staff.name,
            score: bestStaff.totalScore,
          },
          allCandidates: staffScores.map((s) => ({
            id: s.staff.id,
            name: s.staff.name,
            score: s.totalScore,
            skillMatch: s.skillMatchScore,
            performance: s.performanceScore,
            workload: s.workloadScore,
            experience: s.experienceScore,
          })),
          scheduledDate: job.scheduledDate,
          reason: 'AI optimal assignment with analytics',
          aiEnabled: true,
        })

        return {
          staffId: bestStaff.staff.id,
          staffName: bestStaff.staff.name,
          totalScore: bestStaff.totalScore,
          skillMatchScore: bestStaff.skillMatchScore,
          performanceScore: bestStaff.performanceScore,
          workloadScore: bestStaff.workloadScore,
          experienceScore: bestStaff.experienceScore,
          skillsMatched: bestStaff.skillsMatched,
          currentWorkload: bestStaff.currentWorkload,
          completedJobsOfType: bestStaff.completedJobsOfType,
          isSelected: true,
          availability: bestStaff.staff.availability,
          workingHoursMatch: bestStaff.workingHoursMatch,
        }
      }

      return null
    } catch (error) {
      console.error(`❌ Error assigning staff to job ${job.id}:`, error)

      await this.logToAuditTrail({
        action: 'staff_assignment_error',
        jobId: job.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        aiEnabled: true,
      })

      return null
    }
  }

  /**
   * Assign optimal staff to a job using AI logic (legacy method)
   */
  private async assignOptimalStaff(job: Job): Promise<void> {
    console.log(`👤 Finding optimal staff for job ${job.id} (${job.title})`)

    try {
      // Get all available staff
      const availableStaff = await this.getAvailableStaff(
        job.scheduledDate,
        job.requiredSkills
      )

      if (availableStaff.length === 0) {
        console.log(`⚠️ No available staff found for job ${job.id}`)
        await this.logToAuditTrail({
          action: 'no_staff_available',
          jobId: job.id,
          jobType: job.type,
          requiredSkills: job.requiredSkills,
          scheduledDate: job.scheduledDate,
          reason: 'No staff available with required skills',
          aiEnabled: true,
        })
        return
      }

      // Score and rank staff based on multiple factors
      const staffScores = await this.scoreStaffForJob(job, availableStaff)

      // Select the best staff member
      const bestStaff = staffScores[0]

      if (bestStaff) {
        // Assign the job to the best staff member
        await this.assignJobToStaff(job, bestStaff.staff)

        console.log(
          `✅ Assigned job ${job.id} to ${bestStaff.staff.name} (score: ${bestStaff.score.toFixed(2)})`
        )
      }
    } catch (error) {
      console.error(`❌ Error assigning staff to job ${job.id}:`, error)

      await this.logToAuditTrail({
        action: 'staff_assignment_error',
        jobId: job.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        aiEnabled: true,
      })
    }
  }

  /**
   * Get available staff for a specific time and skill requirements
   */
  private async getAvailableStaff(
    scheduledDate: Timestamp,
    requiredSkills: string[]
  ): Promise<Staff[]> {
    try {
      // Get all staff members
      const staffRef = collection(db, 'staff')
      const staffSnapshot = await getDocs(staffRef)

      const availableStaff: Staff[] = []

      for (const staffDoc of staffSnapshot.docs) {
        const staff = { id: staffDoc.id, ...staffDoc.data() } as Staff

        // Check basic availability
        if (staff.availability !== 'available') {
          continue
        }

        // Check if staff has required skills
        const hasRequiredSkills = requiredSkills.some((skill) =>
          staff.skills?.includes(skill)
        )

        if (!hasRequiredSkills) {
          continue
        }

        // Check if staff is available at the scheduled time
        const isAvailableAtTime = await this.isStaffAvailableAtTime(
          staff,
          scheduledDate
        )

        if (isAvailableAtTime) {
          availableStaff.push(staff)
        }
      }

      return availableStaff
    } catch (error) {
      console.error('❌ Error getting available staff:', error)
      return []
    }
  }

  /**
   * Check if staff is available at a specific time
   */
  private async isStaffAvailableAtTime(
    staff: Staff,
    scheduledDate: Timestamp
  ): Promise<boolean> {
    try {
      const date = scheduledDate.toDate()
      const dayOfWeek = date
        .toLocaleDateString('en-US', { weekday: 'long' })
        .toLowerCase()

      // Check working hours
      if (
        staff.workingHours?.days &&
        !staff.workingHours.days.includes(dayOfWeek)
      ) {
        return false
      }

      // Check for conflicting jobs at the same time
      const jobsRef = collection(db, 'jobs')
      const conflictingJobsQuery = query(
        jobsRef,
        where('assignedStaff', '==', staff.id),
        where('status', 'in', ['assigned', 'in_progress'])
      )

      const conflictingJobs = await getDocs(conflictingJobsQuery)

      for (const jobDoc of conflictingJobs.docs) {
        const existingJob = jobDoc.data()
        const existingJobDate = existingJob.scheduledDate.toDate()
        const existingJobEnd = new Date(
          existingJobDate.getTime() + existingJob.estimatedDuration * 60 * 1000
        )

        // Check for time overlap
        const newJobEnd = new Date(date.getTime() + 120 * 60 * 1000) // Assume 2 hour buffer

        if (date < existingJobEnd && newJobEnd > existingJobDate) {
          return false // Time conflict
        }
      }

      return true
    } catch (error) {
      console.error('❌ Error checking staff availability:', error)
      return false
    }
  }

  /**
   * Score staff members for a job with detailed breakdown for analytics
   */
  private async scoreStaffForJobWithBreakdown(
    job: Job,
    availableStaff: Staff[]
  ): Promise<StaffScoringBreakdown[]> {
    const staffScores: StaffScoringBreakdown[] = []

    for (const staff of availableStaff) {
      // Skill match score (40% weight)
      const skillMatchData = this.calculateSkillMatchWithDetails(
        staff.skills || [],
        job.requiredSkills
      )
      const skillMatchScore = skillMatchData.score * 0.4

      // Performance score (30% weight)
      const performanceScore =
        this.calculatePerformanceScore(staff.performance) * 0.3

      // Workload balance score (20% weight)
      const workloadData = await this.calculateWorkloadScoreWithDetails(staff)
      const workloadScore = workloadData.score * 0.2

      // Historical job type experience (10% weight)
      const experienceData = await this.calculateExperienceScoreWithDetails(
        staff,
        job.type
      )
      const experienceScore = experienceData.score * 0.1

      // Check working hours compatibility
      const workingHoursMatch = await this.checkWorkingHoursCompatibility(
        staff,
        job.scheduledDate
      )

      const totalScore =
        skillMatchScore + performanceScore + workloadScore + experienceScore

      staffScores.push({
        staffId: staff.id,
        staffName: staff.name,
        totalScore,
        skillMatchScore: skillMatchData.score,
        performanceScore: this.calculatePerformanceScore(staff.performance),
        workloadScore: workloadData.score,
        experienceScore: experienceData.score,
        skillsMatched: skillMatchData.matchedSkills,
        currentWorkload: workloadData.currentJobs,
        completedJobsOfType: experienceData.completedJobs,
        isSelected: false,
        availability: staff.availability,
        workingHoursMatch,
        staff, // Include full staff object for assignment
      } as StaffScoringBreakdown & { staff: Staff })
    }

    // Sort by score (highest first)
    return staffScores.sort((a, b) => b.totalScore - a.totalScore)
  }

  /**
   * Calculate skill match with detailed breakdown
   */
  private calculateSkillMatchWithDetails(
    staffSkills: string[],
    requiredSkills: string[]
  ): { score: number; matchedSkills: string[] } {
    if (requiredSkills.length === 0) {
      return { score: 1, matchedSkills: [] }
    }

    const matchedSkills = staffSkills.filter((skill) =>
      requiredSkills.includes(skill)
    )
    const score = matchedSkills.length / requiredSkills.length

    return { score, matchedSkills }
  }

  /**
   * Calculate workload score with detailed breakdown
   */
  private async calculateWorkloadScoreWithDetails(
    staff: Staff
  ): Promise<{ score: number; currentJobs: number }> {
    try {
      // Count current assigned jobs
      const jobsRef = collection(db, 'jobs')
      const assignedJobsQuery = query(
        jobsRef,
        where('assignedStaff', '==', staff.id),
        where('status', 'in', ['assigned', 'in_progress'])
      )

      const assignedJobs = await getDocs(assignedJobsQuery)
      const currentJobs = assignedJobs.size

      // Return inverse workload score (less work = higher score)
      const score = Math.max(0, 1 - currentJobs / 10) // Normalize to 0-1 scale

      return { score, currentJobs }
    } catch (error) {
      console.error('❌ Error calculating workload score:', error)
      return { score: 0.5, currentJobs: 0 }
    }
  }

  /**
   * Calculate experience score with detailed breakdown
   */
  private async calculateExperienceScoreWithDetails(
    staff: Staff,
    jobType: string
  ): Promise<{ score: number; completedJobs: number }> {
    try {
      // Count completed jobs of this type
      const jobsRef = collection(db, 'jobs')
      const experienceQuery = query(
        jobsRef,
        where('assignedStaff', '==', staff.id),
        where('type', '==', jobType),
        where('status', '==', 'completed')
      )

      const completedJobs = await getDocs(experienceQuery)
      const completedJobsCount = completedJobs.size

      // Return experience score (more experience = higher score)
      const score = Math.min(completedJobsCount / 10, 1) // Normalize to 0-1 scale

      return { score, completedJobs: completedJobsCount }
    } catch (error) {
      console.error('❌ Error calculating experience score:', error)
      return { score: 0, completedJobs: 0 }
    }
  }

  /**
   * Check working hours compatibility
   */
  private async checkWorkingHoursCompatibility(
    staff: Staff,
    scheduledDate: Timestamp
  ): Promise<boolean> {
    try {
      const date = scheduledDate.toDate()
      const dayOfWeek = date
        .toLocaleDateString('en-US', { weekday: 'long' })
        .toLowerCase()

      // Check working hours
      if (
        staff.workingHours?.days &&
        !staff.workingHours.days.includes(dayOfWeek)
      ) {
        return false
      }

      return true
    } catch (error) {
      console.error('❌ Error checking working hours compatibility:', error)
      return false
    }
  }

  /**
   * Score staff members for a job based on multiple factors (legacy method)
   */
  private async scoreStaffForJob(
    job: Job,
    availableStaff: Staff[]
  ): Promise<Array<{ staff: Staff; score: number }>> {
    const staffScores: Array<{ staff: Staff; score: number }> = []

    for (const staff of availableStaff) {
      let score = 0

      // Skill match score (40% weight)
      const skillMatchScore = this.calculateSkillMatchScore(
        staff.skills || [],
        job.requiredSkills
      )
      score += skillMatchScore * 0.4

      // Performance score (30% weight)
      const performanceScore = this.calculatePerformanceScore(staff.performance)
      score += performanceScore * 0.3

      // Workload balance score (20% weight)
      const workloadScore = await this.calculateWorkloadScore(staff)
      score += workloadScore * 0.2

      // Historical job type experience (10% weight)
      const experienceScore = await this.calculateExperienceScore(
        staff,
        job.type
      )
      score += experienceScore * 0.1

      staffScores.push({ staff, score })
    }

    // Sort by score (highest first)
    return staffScores.sort((a, b) => b.score - a.score)
  }

  /**
   * Calculate skill match score
   */
  private calculateSkillMatchScore(
    staffSkills: string[],
    requiredSkills: string[]
  ): number {
    if (requiredSkills.length === 0) return 1

    const matchingSkills = staffSkills.filter((skill) =>
      requiredSkills.includes(skill)
    )
    return matchingSkills.length / requiredSkills.length
  }

  /**
   * Calculate performance score
   */
  private calculatePerformanceScore(performance?: StaffPerformance): number {
    if (!performance) return 0.5 // Default score for new staff

    const completionWeight = 0.4
    const ratingWeight = 0.3
    const onTimeWeight = 0.3

    const completionScore = Math.min(performance.completionRate / 100, 1)
    const ratingScore = Math.min(performance.averageRating / 5, 1)
    const onTimeScore = Math.min(performance.onTimeCompletion / 100, 1)

    return (
      completionScore * completionWeight +
      ratingScore * ratingWeight +
      onTimeScore * onTimeWeight
    )
  }

  /**
   * Calculate workload balance score (lower workload = higher score)
   */
  private async calculateWorkloadScore(staff: Staff): Promise<number> {
    try {
      // Count current assigned jobs
      const jobsRef = collection(db, 'jobs')
      const assignedJobsQuery = query(
        jobsRef,
        where('assignedStaff', '==', staff.id),
        where('status', 'in', ['assigned', 'in_progress'])
      )

      const assignedJobs = await getDocs(assignedJobsQuery)
      const currentWorkload = assignedJobs.size

      // Return inverse workload score (less work = higher score)
      return Math.max(0, 1 - currentWorkload / 10) // Normalize to 0-1 scale
    } catch (error) {
      console.error('❌ Error calculating workload score:', error)
      return 0.5
    }
  }

  /**
   * Calculate experience score for specific job type
   */
  private async calculateExperienceScore(
    staff: Staff,
    jobType: string
  ): Promise<number> {
    try {
      // Count completed jobs of this type
      const jobsRef = collection(db, 'jobs')
      const experienceQuery = query(
        jobsRef,
        where('assignedStaff', '==', staff.id),
        where('type', '==', jobType),
        where('status', '==', 'completed')
      )

      const completedJobs = await getDocs(experienceQuery)
      const experienceCount = completedJobs.size

      // Return experience score (more experience = higher score)
      return Math.min(experienceCount / 10, 1) // Normalize to 0-1 scale
    } catch (error) {
      console.error('❌ Error calculating experience score:', error)
      return 0
    }
  }

  /**
   * Assign a job to a specific staff member
   */
  private async assignJobToStaff(job: Job, staff: Staff): Promise<void> {
    try {
      // Update job with staff assignment
      await runTransaction(db, async (transaction) => {
        const jobRef = doc(db, 'jobs', job.id)

        transaction.update(jobRef, {
          assignedStaff: staff.id,
          assignedStaffName: staff.name,
          assignedStaffEmail: staff.email,
          status: 'assigned',
          assignedAt: serverTimestamp(),
          assignedBy: 'AI_SMART_ASSIGNMENT',
        })
      })

      // Send notification to staff (placeholder for now)
      await this.sendStaffNotification(staff, job)

      // Log successful assignment
      await this.logToAuditTrail({
        action: 'job_assigned',
        jobId: job.id,
        jobType: job.type,
        staffId: staff.id,
        staffName: staff.name,
        scheduledDate: job.scheduledDate,
        reason: 'AI optimal assignment',
        aiEnabled: true,
      })

      // Log AI decision for dashboard tracking
      try {
        const AILogsService = (await import('./AILogsService')).default
        await AILogsService.logAIDecision({
          type: 'job_assigned',
          refId: job.id,
          refType: 'job',
          timestamp: serverTimestamp(),
          reason: 'AI optimal assignment based on workload and skills',
          confidence: 0.85,
          metadata: {
            jobId: job.id,
            staffId: staff.id,
            staffName: staff.name,
            propertyId: job.propertyId,
            propertyName: job.propertyName,
            jobType: job.type,
            estimatedDuration: job.estimatedDuration,
          },
          system: 'SMART_JOB_ASSIGNMENT',
          status: 'success',
        })
      } catch (logError) {
        console.warn('Failed to log AI decision:', logError)
      }

      console.log(`✅ Successfully assigned job ${job.id} to ${staff.name}`)
      toast.success(`🤖 AI assigned ${job.title} to ${staff.name}`)
    } catch (error) {
      console.error(
        `❌ Error assigning job ${job.id} to staff ${staff.name}:`,
        error
      )
      throw error
    }
  }

  /**
   * Send notification to staff about job assignment
   */
  private async sendStaffNotification(staff: Staff, job: Job): Promise<void> {
    try {
      // Create notification document
      const notificationRef = doc(collection(db, 'notifications'))
      await setDoc(notificationRef, {
        recipientId: staff.id,
        recipientEmail: staff.email,
        type: 'job_assignment',
        title: 'New Job Assignment',
        message: `You have been assigned: ${job.title}`,
        jobId: job.id,
        jobTitle: job.title,
        scheduledDate: job.scheduledDate,
        priority: job.priority,
        read: false,
        createdAt: serverTimestamp(),
        createdBy: 'AI_SMART_ASSIGNMENT',
      })

      console.log(`📧 Notification sent to ${staff.name} for job ${job.id}`)
    } catch (error) {
      console.error(`❌ Error sending notification to ${staff.name}:`, error)
    }
  }

  /**
   * Log to audit trail
   */
  private async logToAuditTrail(logData: any): Promise<void> {
    try {
      const auditLogRef = doc(collection(db, 'auditLogs'))
      await setDoc(auditLogRef, {
        ...logData,
        timestamp: serverTimestamp(),
        system: 'AI_SMART_JOB_ASSIGNMENT',
      })
    } catch (error) {
      console.error('❌ Failed to write to audit log:', error)
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): AssignmentMetrics {
    return { ...this.metrics }
  }

  /**
   * Reset performance metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalAssignments: 0,
      successfulAssignments: 0,
      failedAssignments: 0,
      averageAssignmentTime: 0,
      successRate: 0,
    }
    console.log('📊 Assignment metrics reset')
  }

  /**
   * Get queue status for monitoring
   */
  getQueueStatus(): {
    queueLength: number
    isProcessing: boolean
    processingBookings: string[]
  } {
    return {
      queueLength: this.assignmentQueue.length,
      isProcessing: this.isProcessingQueue,
      processingBookings: Object.keys(this.processingBookings).filter(
        (id) => this.processingBookings[id]
      ),
    }
  }

  /**
   * Clean up listeners
   */
  cleanup(): void {
    if (this.bookingListener) {
      this.bookingListener()
      this.bookingListener = null
    }

    // Clear processing state
    this.processingBookings = {}
    this.assignmentQueue = []
    this.isProcessingQueue = false

    this.isInitialized = false
    console.log('🧹 Smart Job Assignment Service cleaned up')
  }
}

// Export singleton instance
const smartJobAssignmentService = new SmartJobAssignmentService()
export default smartJobAssignmentService
