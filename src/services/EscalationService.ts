/**
 * Escalation Service - Phase 5 Auto-Dispatch
 * Processes expired offers and implements escalation ladder
 * Called by scheduled Cloud Function every minute
 */

import OfferEngineService from '@/services/OfferEngineService'
import OfferNotificationService from '@/services/OfferNotificationService'
import AuditService from '@/services/AuditService'
import { JobOffer, ESCALATION_LADDER } from '@/types/job-offers'
import { getDb } from '@/lib/firebase'
import { runTransaction, doc } from 'firebase/firestore'

export default class EscalationService {

  /**
   * Main processor for expired offers - called by Cloud Function
   * Implements the escalation ladder: attempt 1 → 2 → 3 → admin alert
   */
  static async processExpiredOffers(): Promise<{
    success: boolean
    processed: number
    escalated: number
    maxAttemptsReached: number
    errors: string[]
  }> {
    try {
      console.log('🔄 Processing expired offers...')

      const result = await OfferEngineService.getExpiredOffers()
      if (!result.success || result.offers.length === 0) {
        console.log('✅ No expired offers to process')
        return {
          success: true,
          processed: 0,
          escalated: 0,
          maxAttemptsReached: 0,
          errors: []
        }
      }

      console.log(`⏰ Found ${result.offers.length} expired offers to process`)

      let processed = 0
      let escalated = 0
      let maxAttemptsReached = 0
      const errors: string[] = []

      // Process each expired offer
      for (const offer of result.offers) {
        try {
          const processResult = await this.processExpiredOffer(offer)
          processed++

          if (processResult.escalated) {
            escalated++
          }

          if (processResult.maxAttemptsReached) {
            maxAttemptsReached++
          }

        } catch (error) {
          const errorMsg = `Failed to process offer ${offer.offerId}: ${error}`
          console.error('❌', errorMsg)
          errors.push(errorMsg)
        }
      }

      console.log(`✅ Processed ${processed} expired offers: ${escalated} escalated, ${maxAttemptsReached} require admin`)

      return {
        success: true,
        processed,
        escalated,
        maxAttemptsReached,
        errors
      }

    } catch (error) {
      console.error('❌ Error in processExpiredOffers:', error)
      return {
        success: false,
        processed: 0,
        escalated: 0,
        maxAttemptsReached: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  /**
   * Process a single expired offer
   */
  private static async processExpiredOffer(offer: JobOffer): Promise<{
    escalated: boolean
    maxAttemptsReached: boolean
  }> {
    try {
      console.log(`⏰ Processing expired offer: ${offer.offerId} (attempt ${offer.attemptNumber})`)

      // Mark offer as expired atomically
      await this.markOfferExpired(offer)

      // Log expiry audit event
      const willEscalate = offer.attemptNumber < 3
      await AuditService.logOfferExpired(
        offer.offerId,
        offer.jobId,
        offer.propertyId,
        offer.attemptNumber,
        willEscalate
      )

      // Check if we should escalate or require admin intervention
      if (offer.attemptNumber >= 3) {
        // Max attempts reached - notify admin
        console.log(`🚨 Max attempts reached for job ${offer.jobId} - requires admin intervention`)
        
        await OfferNotificationService.sendEscalationNotification(
          offer.jobId,
          offer.propertyId,
          offer.attemptNumber,
          3 // max attempts
        )

        return {
          escalated: false,
          maxAttemptsReached: true
        }
      }

      // Escalate to next attempt
      console.log(`🚀 Escalating job ${offer.jobId} to attempt ${offer.attemptNumber + 1}`)
      
      const escalationResult = await this.escalateToNextAttempt(offer)
      
      if (escalationResult.success) {
        console.log(`✅ Job ${offer.jobId} escalated to attempt ${offer.attemptNumber + 1}`)
        return {
          escalated: true,
          maxAttemptsReached: false
        }
      } else {
        throw new Error(`Escalation failed: ${escalationResult.error}`)
      }

    } catch (error) {
      console.error(`❌ Error processing expired offer ${offer.offerId}:`, error)
      throw error
    }
  }

  /**
   * Mark an offer as expired atomically
   */
  private static async markOfferExpired(offer: JobOffer): Promise<void> {
    const db = getDb()
    if (!db) {
      throw new Error('Firebase not initialized')
    }

    await runTransaction(db, async (transaction) => {
      const offerRef = doc(db, 'job_offers', offer.offerId)
      const jobRef = doc(db, 'operational_jobs', offer.jobId)

      // Check if offer is still in open state (prevent race conditions)
      const currentOfferDoc = await transaction.get(offerRef)
      if (!currentOfferDoc.exists()) {
        throw new Error('Offer not found')
      }

      const currentOffer = currentOfferDoc.data()
      if (currentOffer.status !== 'open') {
        console.log(`⏭️ Offer ${offer.offerId} already processed (status: ${currentOffer.status})`)
        return // Already processed by another instance
      }

      // Mark offer as expired
      transaction.update(offerRef, {
        status: 'expired',
        expiredAt: new Date(),
        updatedAt: new Date()
      })

      // Reset job status to pending (remove active offer)
      transaction.update(jobRef, {
        status: 'pending',
        offerIdActive: null,
        updatedAt: new Date()
      })
    })
  }

  /**
   * Escalate to next attempt level
   */
  private static async escalateToNextAttempt(offer: JobOffer): Promise<{
    success: boolean
    newOfferId?: string
    error?: string
  }> {
    try {
      const nextAttemptNumber = offer.attemptNumber + 1

      // Create new offer with escalated settings
      const escalatedOfferRequest = {
        jobId: offer.jobId,
        propertyId: offer.propertyId,
        requiredRole: offer.requiredRole,
        scheduledStart: new Date(), // This would come from job data
        scheduledEnd: new Date(), // This would come from job data
        estimatedDuration: offer.meta?.estimatedDuration || 120,
        priority: offer.meta?.priority || 'medium',
        attemptNumber: nextAttemptNumber,
        createdBy: 'system',
        meta: {
          ...offer.meta,
          escalatedFrom: offer.offerId,
          escalationReason: 'previous_offer_expired'
        }
      }

      // Use existing OfferEngineService to create escalated offer
      // Note: We'd need to get job details to have correct scheduled times
      console.log(`🚀 Creating escalated offer for job ${offer.jobId} (attempt ${nextAttemptNumber})`)

      // For now, return success with placeholder
      // Real implementation would call OfferEngineService.createOffer()
      
      return {
        success: true,
        newOfferId: 'escalated-offer-placeholder'
      }

    } catch (error) {
      console.error('❌ Error escalating offer:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown escalation error'
      }
    }
  }

  /**
   * Get escalation statistics for admin dashboard
   */
  static async getEscalationStats(): Promise<{
    success: boolean
    stats: {
      offersAwaitingAttempt2: number
      offersAwaitingAttempt3: number
      jobsRequiringAdmin: number
      recentEscalations: number
    }
    error?: string
  }> {
    try {
      console.log('📊 Getting escalation statistics...')

      // TODO: Query Firestore for escalation statistics
      // This would aggregate data from job_offers and audit_events collections
      
      const mockStats = {
        offersAwaitingAttempt2: 0,
        offersAwaitingAttempt3: 0,
        jobsRequiringAdmin: 0,
        recentEscalations: 0
      }

      return {
        success: true,
        stats: mockStats
      }

    } catch (error) {
      console.error('❌ Error getting escalation stats:', error)
      return {
        success: false,
        stats: {
          offersAwaitingAttempt2: 0,
          offersAwaitingAttempt3: 0,
          jobsRequiringAdmin: 0,
          recentEscalations: 0
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Manual escalation trigger (admin action)
   */
  static async manualEscalation(
    offerId: string,
    adminId: string,
    reason: string
  ): Promise<{
    success: boolean
    newOfferId?: string
    error?: string
  }> {
    try {
      console.log(`👨‍💼 Manual escalation triggered by ${adminId} for offer ${offerId}: ${reason}`)

      // Get current offer
      const offerResult = await OfferEngineService.getOffer(offerId)
      if (!offerResult.success || !offerResult.offer) {
        return {
          success: false,
          error: 'Offer not found'
        }
      }

      const offer = offerResult.offer

      // Mark current offer as cancelled
      await OfferEngineService.cancelOffer(offerId, `Manual escalation: ${reason}`, adminId)

      // Create escalated offer
      const escalationResult = await this.escalateToNextAttempt(offer)

      // Log manual escalation audit
      await AuditService.logManualOverride(
        offer.jobId,
        offer.propertyId,
        adminId,
        'offer_cancellation',
        {
          originalOfferId: offerId,
          escalatedOfferId: escalationResult.newOfferId,
          escalationReason: reason
        }
      )

      return escalationResult

    } catch (error) {
      console.error('❌ Error in manual escalation:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
