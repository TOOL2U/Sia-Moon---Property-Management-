/**
 * Booking Lifecycle Hook Service - Phase 4
 * 
 * Integrates JobEngineService with booking lifecycle events.
 * This ensures jobs are automatically created, modified, and cancelled
 * whenever booking state changes.
 * 
 * CRITICAL: This service listens to booking events and triggers job operations.
 */

import JobEngineService from './JobEngineService'
import { JobCreationRequest } from '@/types/job'

export interface BookingEvent {
  bookingId: string
  propertyId: string
  propertyName: string
  guestName: string
  checkInDate: Date
  checkOutDate: Date
  status: 'pending' | 'confirmed' | 'modified' | 'cancelled'
  specialInstructions?: string
}

export interface BookingModification {
  bookingId: string
  changes: {
    checkOutDate?: Date
    guestName?: string
    propertyName?: string
    specialInstructions?: string
  }
}

export class BookingJobHookService {
  
  /**
   * Handle booking confirmation
   * Automatically creates all required jobs for the booking
   */
  static async handleBookingConfirmed(booking: BookingEvent): Promise<{
    success: boolean
    jobsCreated: string[]
    error?: string
  }> {
    try {
      console.log(`📅 Booking confirmed - creating jobs for ${booking.bookingId}`)

      if (booking.status !== 'confirmed') {
        return {
          success: false,
          jobsCreated: [],
          error: 'Booking must be confirmed to create jobs'
        }
      }

      // Prepare job creation request
      const jobRequest: JobCreationRequest = {
        bookingId: booking.bookingId,
        propertyId: booking.propertyId,
        guestName: booking.guestName,
        propertyName: booking.propertyName,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        requirements: [],
        specialInstructions: booking.specialInstructions
      }

      // Create jobs using JobEngineService
      const result = await JobEngineService.createJobsFromBooking(jobRequest)

      if (!result.success) {
        console.error('❌ Failed to create jobs:', result.error)
        return {
          success: false,
          jobsCreated: [],
          error: result.error
        }
      }

      console.log(`✅ Created ${result.jobIds.length} jobs for booking ${booking.bookingId}`)
      
      return {
        success: true,
        jobsCreated: result.jobIds
      }

    } catch (error) {
      console.error('❌ Error in booking confirmation handler:', error)
      return {
        success: false,
        jobsCreated: [],
        error: error instanceof Error ? error.message : 'Job creation failed'
      }
    }
  }

  /**
   * Handle booking modification
   * Updates existing jobs to match new booking details
   */
  static async handleBookingModified(modification: BookingModification): Promise<{
    success: boolean
    modifiedJobs: string[]
    unassignedJobs: string[]
    error?: string
  }> {
    try {
      console.log(`🔄 Booking modified - updating jobs for ${modification.bookingId}`)

      const { changes } = modification

      if (!changes.checkOutDate) {
        // If checkout date doesn't change, just update other details
        return this.handleMinorBookingUpdates(modification)
      }

      // Handle major modification (timing change)
      const result = await JobEngineService.handleBookingModification(
        modification.bookingId,
        changes.checkOutDate,
        {
          guestName: changes.guestName,
          propertyName: changes.propertyName,
          specialInstructions: changes.specialInstructions
        }
      )

      if (!result.success) {
        console.error('❌ Failed to modify jobs:', result.error)
        return {
          success: false,
          modifiedJobs: [],
          unassignedJobs: [],
          error: result.error
        }
      }

      console.log(`✅ Modified ${result.modifiedJobs.length} jobs for booking ${modification.bookingId}`)

      return {
        success: true,
        modifiedJobs: result.modifiedJobs,
        unassignedJobs: result.unassignedJobs
      }

    } catch (error) {
      console.error('❌ Error in booking modification handler:', error)
      return {
        success: false,
        modifiedJobs: [],
        unassignedJobs: [],
        error: error instanceof Error ? error.message : 'Job modification failed'
      }
    }
  }

  /**
   * Handle booking cancellation
   * Cancels all associated jobs and releases staff
   */
  static async handleBookingCancelled(bookingId: string): Promise<{
    success: boolean
    cancelledJobs: string[]
    releasedStaff: string[]
    error?: string
  }> {
    try {
      console.log(`❌ Booking cancelled - cancelling jobs for ${bookingId}`)

      const result = await JobEngineService.handleBookingCancellation(bookingId)

      if (!result.success) {
        console.error('❌ Failed to cancel jobs:', result.error)
        return {
          success: false,
          cancelledJobs: [],
          releasedStaff: [],
          error: result.error
        }
      }

      console.log(`✅ Cancelled ${result.cancelledJobs.length} jobs for booking ${bookingId}`)

      return {
        success: true,
        cancelledJobs: result.cancelledJobs,
        releasedStaff: result.releasedStaff
      }

    } catch (error) {
      console.error('❌ Error in booking cancellation handler:', error)
      return {
        success: false,
        cancelledJobs: [],
        releasedStaff: [],
        error: error instanceof Error ? error.message : 'Job cancellation failed'
      }
    }
  }

  /**
   * Handle minor booking updates (no timing changes)
   */
  private static async handleMinorBookingUpdates(modification: BookingModification): Promise<{
    success: boolean
    modifiedJobs: string[]
    unassignedJobs: string[]
    error?: string
  }> {
    try {
      // Get all jobs for the booking
      const jobsResult = await JobEngineService.getAllJobs({
        bookingId: modification.bookingId
      })

      if (!jobsResult.success) {
        return {
          success: false,
          modifiedJobs: [],
          unassignedJobs: [],
          error: jobsResult.error
        }
      }

      const modifiedJobIds: string[] = []

      // Update each job with new details
      for (const job of jobsResult.jobs) {
        const updates: any = {}

        if (modification.changes.guestName) {
          updates.guestName = modification.changes.guestName
        }

        if (modification.changes.propertyName) {
          updates.propertyName = modification.changes.propertyName
        }

        if (modification.changes.specialInstructions) {
          updates.specialInstructions = modification.changes.specialInstructions
        }

        if (Object.keys(updates).length > 0) {
          const updateResult = await JobEngineService.updateJobStatus({
            jobId: job.jobId,
            status: job.status, // Keep same status
            updatedBy: 'system'
          })

          if (updateResult.success) {
            modifiedJobIds.push(job.jobId)
          }
        }
      }

      return {
        success: true,
        modifiedJobs: modifiedJobIds,
        unassignedJobs: [] // No unassignments for minor updates
      }

    } catch (error) {
      console.error('❌ Error handling minor booking updates:', error)
      return {
        success: false,
        modifiedJobs: [],
        unassignedJobs: [],
        error: error instanceof Error ? error.message : 'Update failed'
      }
    }
  }

  /**
   * Validate booking data before job operations
   */
  static validateBookingForJobs(booking: BookingEvent): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!booking.bookingId) errors.push('Booking ID is required')
    if (!booking.propertyId) errors.push('Property ID is required')
    if (!booking.propertyName) errors.push('Property name is required')
    if (!booking.guestName) errors.push('Guest name is required')
    if (!booking.checkOutDate) errors.push('Check-out date is required')

    if (booking.checkOutDate && booking.checkOutDate < new Date()) {
      errors.push('Check-out date cannot be in the past')
    }

    if (booking.checkInDate && booking.checkOutDate && booking.checkInDate >= booking.checkOutDate) {
      errors.push('Check-in date must be before check-out date')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Get jobs status summary for a booking
   */
  static async getBookingJobsSummary(bookingId: string): Promise<{
    success: boolean
    summary: {
      total: number
      pending: number
      assigned: number
      inProgress: number
      completed: number
      cancelled: number
      nextDue?: {
        jobType: string
        scheduledStart: Date
        assignedStaff?: string
      }
    }
    error?: string
  }> {
    try {
      const result = await JobEngineService.getAllJobs({ bookingId })

      if (!result.success) {
        return {
          success: false,
          summary: { total: 0, pending: 0, assigned: 0, inProgress: 0, completed: 0, cancelled: 0 },
          error: result.error
        }
      }

      const jobs = result.jobs
      const summary = {
        total: jobs.length,
        pending: jobs.filter(j => j.status === 'pending').length,
        assigned: jobs.filter(j => j.status === 'assigned').length,
        inProgress: jobs.filter(j => j.status === 'in_progress').length,
        completed: jobs.filter(j => j.status === 'completed').length,
        cancelled: jobs.filter(j => j.status === 'cancelled').length
      }

      // Find next due job
      const upcomingJobs = jobs
        .filter(j => ['pending', 'assigned'].includes(j.status))
        .sort((a, b) => a.scheduledStart.getTime() - b.scheduledStart.getTime())

      const nextDue = upcomingJobs.length > 0 ? {
        jobType: upcomingJobs[0].jobType,
        scheduledStart: upcomingJobs[0].scheduledStart,
        assignedStaff: upcomingJobs[0].assignedStaffId || undefined
      } : undefined

      return {
        success: true,
        summary: { ...summary, nextDue }
      }

    } catch (error) {
      console.error('❌ Error getting booking jobs summary:', error)
      return {
        success: false,
        summary: { total: 0, pending: 0, assigned: 0, inProgress: 0, completed: 0, cancelled: 0 },
        error: error instanceof Error ? error.message : 'Summary failed'
      }
    }
  }
}

export default BookingJobHookService
