/**
 * Auto-Dispatch Integration Service - Phase 5
 * Integrates offer creation with existing job creation workflow
 * Triggers when jobs are created or become unassigned
 */

import OfferEngineService from '@/services/OfferEngineService'
import AuditService from '@/services/AuditService'
import { Job } from '@/types/job'
import { OfferCreationRequest } from '@/types/job-offers'

export default class AutoDispatchService {
  
  /**
   * Trigger A: When a new job is created and is pending
   * Called from JobEngineService after job creation
   */
  static async triggerOfferCreationForNewJob(job: Job): Promise<{
    success: boolean
    offerId?: string
    error?: string
  }> {
    try {
      console.log(`🚀 Auto-dispatch trigger for new job: ${job.jobId}`)

      // Only create offers for pending jobs within dispatch window
      if (job.status !== 'pending') {
        console.log(`⏭️ Skipping offer creation - job status is ${job.status}`)
        return {
          success: true,
          error: 'Job status not eligible for auto-dispatch'
        }
      }

      // Check if job is scheduled within next 14 days (configurable)
      const daysDiff = Math.ceil((job.scheduledStart.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      if (daysDiff > 14) { // Will be made configurable in dispatch settings
        console.log(`⏭️ Skipping offer creation - job scheduled too far in future (${daysDiff} days)`)
        return {
          success: true,
          error: 'Job scheduled outside dispatch window'
        }
      }

      // Create offer request
      const offerRequest: OfferCreationRequest = {
        jobId: job.jobId,
        propertyId: job.propertyId,
        requiredRole: job.requiredRole,
        scheduledStart: job.scheduledStart,
        scheduledEnd: job.scheduledEnd,
        estimatedDuration: job.estimatedDuration,
        priority: job.priority,
        attemptNumber: 1,
        createdBy: 'system'
      }

      // Create the offer
      const result = await OfferEngineService.createOffer(offerRequest)

      if (!result.success) {
        console.error(`❌ Failed to create offer for job ${job.jobId}: ${result.error}`)
        return result
      }

      console.log(`✅ Auto-dispatch offer created: ${result.offerId} for job ${job.jobId}`)

      return {
        success: true,
        offerId: result.offerId
      }

    } catch (error) {
      console.error('❌ Error in auto-dispatch trigger:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown auto-dispatch error'
      }
    }
  }

  /**
   * Trigger B: When a job becomes unassigned again (staff cancellation, etc.)
   * Creates a new offer with incremented attempt number
   */
  static async triggerOfferCreationForUnassignedJob(
    job: Job, 
    previousAttemptNumber: number = 1
  ): Promise<{
    success: boolean
    offerId?: string
    error?: string
  }> {
    try {
      console.log(`🔄 Auto-dispatch trigger for unassigned job: ${job.jobId}`)

      // Only create offers for jobs that are back to pending
      if (job.status !== 'pending') {
        console.log(`⏭️ Skipping re-offer creation - job status is ${job.status}`)
        return {
          success: true,
          error: 'Job status not eligible for re-dispatch'
        }
      }

      const nextAttemptNumber = previousAttemptNumber + 1

      // Check if we've exceeded max attempts
      if (nextAttemptNumber > 3) { // Will be made configurable
        console.log(`⛔ Max attempts reached for job ${job.jobId} (attempt ${nextAttemptNumber})`)
        
        // Log escalation event
        await AuditService.logEscalationTriggered(
          job.jobId,
          job.propertyId,
          previousAttemptNumber,
          nextAttemptNumber,
          'automatic'
        )

        return {
          success: false,
          error: 'Max auto-dispatch attempts reached - requires manual intervention'
        }
      }

      // Create escalated offer request
      const offerRequest: OfferCreationRequest = {
        jobId: job.jobId,
        propertyId: job.propertyId,
        requiredRole: job.requiredRole,
        scheduledStart: job.scheduledStart,
        scheduledEnd: job.scheduledEnd,
        estimatedDuration: job.estimatedDuration,
        priority: job.priority,
        attemptNumber: nextAttemptNumber,
        createdBy: 'system'
      }

      // Create the escalated offer
      const result = await OfferEngineService.createOffer(offerRequest)

      if (!result.success) {
        console.error(`❌ Failed to create escalated offer for job ${job.jobId}: ${result.error}`)
        return result
      }

      console.log(`✅ Escalated offer created: ${result.offerId} for job ${job.jobId} (attempt ${nextAttemptNumber})`)

      // Log escalation
      await AuditService.logEscalationTriggered(
        job.jobId,
        job.propertyId,
        previousAttemptNumber,
        nextAttemptNumber,
        'automatic'
      )

      return {
        success: true,
        offerId: result.offerId
      }

    } catch (error) {
      console.error('❌ Error in unassigned job auto-dispatch:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown re-dispatch error'
      }
    }
  }

  /**
   * Manual trigger for admin to re-offer a job
   */
  static async manualTriggerOffer(
    jobId: string,
    adminId: string,
    attemptNumber?: number
  ): Promise<{
    success: boolean
    offerId?: string
    error?: string
  }> {
    try {
      console.log(`👨‍💼 Manual offer trigger by admin ${adminId} for job ${jobId}`)

      // This would need to fetch the job details first
      // Implementation depends on having job data available
      // For now, this is a placeholder for the manual trigger interface

      await AuditService.logManualOverride(
        jobId,
        '', // propertyId would come from job lookup
        adminId,
        'manual_assignment',
        { triggerType: 'manual_offer_creation', attemptNumber }
      )

      return {
        success: true,
        error: 'Manual trigger interface - implementation pending job lookup'
      }

    } catch (error) {
      console.error('❌ Error in manual offer trigger:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown manual trigger error'
      }
    }
  }

  /**
   * Check if a job should trigger auto-dispatch
   * Used as a filter before creating offers
   */
  static shouldTriggerAutoDispatch(job: Job): {
    shouldTrigger: boolean
    reason?: string
  } {
    // Job must be pending
    if (job.status !== 'pending') {
      return {
        shouldTrigger: false,
        reason: `Job status is ${job.status}, not pending`
      }
    }

    // Job must not already be assigned
    if (job.assignedStaffId) {
      return {
        shouldTrigger: false,
        reason: 'Job already has assigned staff'
      }
    }

    // Job must be scheduled in the future
    if (job.scheduledStart <= new Date()) {
      return {
        shouldTrigger: false,
        reason: 'Job is scheduled in the past'
      }
    }

    // Job must be within dispatch window (14 days)
    const daysDiff = Math.ceil((job.scheduledStart.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (daysDiff > 14) {
      return {
        shouldTrigger: false,
        reason: `Job scheduled too far in future (${daysDiff} days)`
      }
    }

    // Job must have minimum notice (2 hours)
    const hoursDiff = (job.scheduledStart.getTime() - Date.now()) / (1000 * 60 * 60)
    if (hoursDiff < 2) {
      return {
        shouldTrigger: false,
        reason: `Job scheduled too soon (${hoursDiff.toFixed(1)} hours notice)`
      }
    }

    return {
      shouldTrigger: true
    }
  }
}
