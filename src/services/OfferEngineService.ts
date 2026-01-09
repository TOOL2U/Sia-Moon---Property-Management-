/**
 * Offer Engine Service - Phase 5 Auto-Dispatch
 * Production-safe auto-dispatch with first-accept-wins atomic transactions
 * Handles offer creation, staff eligibility, and escalation ladder
 */

import { getDb } from '@/lib/firebase'
import { JobOffer, OfferCreationRequest, OfferEligibilityRules, DispatchSettings, DEFAULT_DISPATCH_SETTINGS, ESCALATION_LADDER, calculateOfferExpiry } from '@/types/job-offers'
import { Job } from '@/types/job'
import { EnhancedStaffService } from '@/lib/services/enhancedStaffService'
import AuditService from '@/services/AuditService'
import OfferNotificationService from '@/services/OfferNotificationService'
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, getDoc, runTransaction, orderBy, limit } from 'firebase/firestore'

export default class OfferEngineService {
  private static readonly JOB_OFFERS_COLLECTION = 'job_offers'
  private static readonly JOBS_COLLECTION = 'operational_jobs'
  private static readonly SETTINGS_COLLECTION = 'dispatch_settings'

  /**
   * Calculate eligible staff for a job offer
   * Critical: This creates a SNAPSHOT - never dynamically recalculate during acceptance
   */
  static async calculateEligibleStaff(
    requiredRole: 'cleaner' | 'inspector' | 'maintenance',
    scheduledStart: Date,
    attemptNumber: number = 1
  ): Promise<{
    success: boolean
    eligibleStaffIds: string[]
    eligibilityCount: number
    error?: string
  }> {
    try {
      console.log(`👥 Calculating eligible staff for role: ${requiredRole}, attempt: ${attemptNumber}`)

      // Get all staff with the required role
      const staffResult = await EnhancedStaffService.getStaffByRole(requiredRole)
      
      if (!staffResult.success || !staffResult.staff) {
        return {
          success: false,
          eligibleStaffIds: [],
          eligibilityCount: 0,
          error: 'Failed to retrieve staff for role'
        }
      }

      const eligibleStaff = staffResult.staff.filter(staff => {
        // Must pass basic eligibility rules
        const rules: OfferEligibilityRules = {
          role: staff.role,
          isActive: staff.isActive,
          isSuspended: staff.isSuspended || false,
          hasValidPushToken: !!staff.pushToken,
          availabilityStatus: staff.availabilityStatus
        }

        return this.validateStaffEligibility(rules, attemptNumber)
      })

      const eligibleStaffIds = eligibleStaff.map(staff => staff.staffId)

      console.log(`✅ Found ${eligibleStaffIds.length} eligible staff for attempt ${attemptNumber}`)

      return {
        success: true,
        eligibleStaffIds,
        eligibilityCount: eligibleStaffIds.length
      }

    } catch (error) {
      console.error('❌ Error calculating eligible staff:', error)
      return {
        success: false,
        eligibleStaffIds: [],
        eligibilityCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Validate staff eligibility based on attempt number (escalation ladder)
   */
  private static validateStaffEligibility(rules: OfferEligibilityRules, attemptNumber: number): boolean {
    // Basic requirements for all attempts
    if (!rules.isActive || rules.isSuspended) {
      return false
    }

    // Attempt-specific rules (escalation ladder)
    switch (attemptNumber) {
      case 1: // Primary eligible staff
        return rules.availabilityStatus === 'available' && rules.hasValidPushToken
        
      case 2: // All staff with role (regardless of availability)
        return rules.hasValidPushToken
        
      case 3: // All staff + manager escalation
        return true // Include all active staff, even without push tokens
        
      default:
        return false
    }
  }

  /**
   * Create a new job offer
   * Auto-triggered when jobs are created or become unassigned
   */
  static async createOffer(request: OfferCreationRequest): Promise<{
    success: boolean
    offerId?: string
    offer?: JobOffer
    error?: string
  }> {
    try {
      const db = getDb()
      if (!db) {
        throw new Error('Firebase not initialized')
      }

      console.log(`🎯 Creating offer for job: ${request.jobId}`)

      // Get dispatch settings
      const settings = await this.getDispatchSettings()

      // Check if job is within dispatch window
      const daysDiff = Math.ceil((request.scheduledStart.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      if (daysDiff > settings.DISPATCH_WINDOW_DAYS) {
        return {
          success: false,
          error: `Job scheduled outside dispatch window (${daysDiff} > ${settings.DISPATCH_WINDOW_DAYS} days)`
        }
      }

      const attemptNumber = request.attemptNumber || 1

      // Calculate eligible staff (snapshot at creation time)
      const eligibilityResult = await this.calculateEligibleStaff(
        request.requiredRole, 
        request.scheduledStart, 
        attemptNumber
      )

      if (!eligibilityResult.success || eligibilityResult.eligibleStaffIds.length === 0) {
        return {
          success: false,
          error: `No eligible staff found for role ${request.requiredRole} (attempt ${attemptNumber})`
        }
      }

      // Calculate offer expiry based on attempt
      const expiryMinutes = this.getExpiryMinutesForAttempt(attemptNumber, settings)
      const expiresAt = calculateOfferExpiry(request.scheduledStart, expiryMinutes)

      // Create offer document
      const offerData: Omit<JobOffer, 'offerId'> = {
        jobId: request.jobId,
        propertyId: request.propertyId,
        requiredRole: request.requiredRole,
        eligibleStaffIds: eligibilityResult.eligibleStaffIds,
        status: 'open',
        offeredAt: new Date(),
        expiresAt,
        attemptNumber,
        createdBy: request.createdBy || 'system',
        meta: {
          estimatedDuration: request.estimatedDuration,
          priority: request.priority,
          payout: request.meta?.payout,
          notes: request.meta?.notes
        }
      }

      const docRef = await addDoc(collection(db, this.JOB_OFFERS_COLLECTION), {
        ...offerData,
        offeredAt: serverTimestamp(),
        expiresAt: expiresAt
      })

      const offer: JobOffer = {
        offerId: docRef.id,
        ...offerData
      }

      // Update job status to 'offered'
      await this.updateJobStatusToOffered(request.jobId, docRef.id)

      // Log audit event
      await AuditService.logOfferCreated(
        docRef.id,
        request.jobId,
        request.propertyId,
        eligibilityResult.eligibleStaffIds,
        attemptNumber,
        request.createdBy || 'system'
      )

      console.log(`✅ Offer created: ${docRef.id} for ${eligibilityResult.eligibleStaffIds.length} staff`)

      // Send notifications to eligible staff
      try {
        const notificationResult = await OfferNotificationService.notifyStaffOfOffer(offer)
        if (notificationResult.success) {
          console.log(`📢 Notifications sent to ${notificationResult.notifiedStaff.length} staff members`)
        } else {
          console.warn(`⚠️ Notification failures: ${notificationResult.failedNotifications.length} staff`)
        }
      } catch (notificationError) {
        console.error('❌ Error sending offer notifications:', notificationError)
        // Don't fail offer creation if notifications fail
      }

      return {
        success: true,
        offerId: docRef.id,
        offer
      }

    } catch (error) {
      console.error('❌ Error creating offer:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get expiry minutes based on attempt number
   */
  private static getExpiryMinutesForAttempt(attemptNumber: number, settings: DispatchSettings): number {
    switch (attemptNumber) {
      case 1:
        return ESCALATION_LADDER.ATTEMPT_1.expiryMinutes
      case 2:
        return ESCALATION_LADDER.ATTEMPT_2.expiryMinutes
      case 3:
        return ESCALATION_LADDER.ATTEMPT_3.expiryMinutes
      default:
        return settings.OFFER_EXPIRY_MINUTES
    }
  }

  /**
   * Update job status to 'offered' with active offer ID
   */
  private static async updateJobStatusToOffered(jobId: string, offerId: string): Promise<void> {
    const db = getDb()
    if (!db) {
      throw new Error('Firebase not initialized')
    }

    await runTransaction(db, async (transaction) => {
      const jobRef = doc(db, this.JOBS_COLLECTION, jobId)
      
      transaction.update(jobRef, {
        status: 'offered',
        offerIdActive: offerId,
        updatedAt: serverTimestamp()
      })
    })
  }

  /**
   * Accept an offer - ATOMIC TRANSACTION for first-accept-wins
   * This is the critical race condition prevention method
   */
  static async acceptOffer(offerId: string, staffId: string): Promise<{
    success: boolean
    assignedJobId?: string
    error?: string
  }> {
    try {
      const db = getDb()
      if (!db) {
        throw new Error('Firebase not initialized')
      }

      console.log(`🎯 Staff ${staffId} attempting to accept offer ${offerId}`)

      // ATOMIC TRANSACTION - Critical for race condition prevention
      const result = await runTransaction(db, async (transaction) => {
        // 1. Read current state
        const offerRef = doc(db, this.JOB_OFFERS_COLLECTION, offerId)
        const offerDoc = await transaction.get(offerRef)

        if (!offerDoc.exists()) {
          throw new Error('Offer not found')
        }

        const offer = { offerId: offerDoc.id, ...offerDoc.data() } as JobOffer

        // 2. Validate offer status
        if (offer.status !== 'open') {
          throw new Error(`Offer no longer available (status: ${offer.status})`)
        }

        // 3. Check if offer has expired
        if (new Date() > offer.expiresAt) {
          throw new Error('Offer has expired')
        }

        // 4. Validate staff eligibility
        if (!offer.eligibleStaffIds.includes(staffId)) {
          throw new Error('Staff not eligible for this offer')
        }

        // 5. Read job state
        const jobRef = doc(db, this.JOBS_COLLECTION, offer.jobId)
        const jobDoc = await transaction.get(jobRef)

        if (!jobDoc.exists()) {
          throw new Error('Job not found')
        }

        const job = { jobId: jobDoc.id, ...jobDoc.data() } as Job

        // 6. Validate job is still available
        if (job.assignedStaffId) {
          throw new Error('Job already assigned')
        }

        if (job.status === 'assigned' || job.status === 'in_progress' || job.status === 'completed') {
          throw new Error(`Job no longer available (status: ${job.status})`)
        }

        // 7. ATOMIC WRITES - All or nothing
        const now = serverTimestamp()

        // Update offer to accepted
        transaction.update(offerRef, {
          status: 'accepted',
          acceptedByStaffId: staffId,
          acceptanceAt: now
        })

        // Update job to assigned
        transaction.update(jobRef, {
          status: 'assigned',
          assignedStaffId: staffId,
          offerIdActive: offerId,
          assignedAt: now,
          updatedAt: now
        })

        return {
          success: true,
          jobId: offer.jobId,
          propertyId: offer.propertyId,
          attemptNumber: offer.attemptNumber
        }
      })

      // Log successful acceptance (outside transaction for performance)
      await AuditService.logOfferAccepted(
        offerId,
        result.jobId,
        result.propertyId,
        staffId,
        result.attemptNumber
      )

      await AuditService.logJobAssigned(
        result.jobId,
        result.propertyId,
        staffId,
        staffId,
        'offer_acceptance'
      )

      console.log(`✅ Offer ${offerId} accepted by staff ${staffId}`)

      return {
        success: true,
        assignedJobId: result.jobId
      }

    } catch (error) {
      console.error('❌ Error accepting offer:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Offer acceptance failed'
      }
    }
  }

  /**
   * Cancel an offer (admin override)
   */
  static async cancelOffer(
    offerId: string, 
    cancelReason: string, 
    cancelledBy: string
  ): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const db = getDb()
      if (!db) {
        throw new Error('Firebase not initialized')
      }

      console.log(`🛑 Cancelling offer ${offerId}: ${cancelReason}`)

      await runTransaction(db, async (transaction) => {
        const offerRef = doc(db, this.JOB_OFFERS_COLLECTION, offerId)
        const offerDoc = await transaction.get(offerRef)

        if (!offerDoc.exists()) {
          throw new Error('Offer not found')
        }

        const offer = { offerId: offerDoc.id, ...offerDoc.data() } as JobOffer

        if (offer.status !== 'open') {
          throw new Error(`Cannot cancel offer with status: ${offer.status}`)
        }

        // Update offer to cancelled
        transaction.update(offerRef, {
          status: 'cancelled',
          cancelReason,
          cancelledAt: serverTimestamp()
        })

        // Update job status back to pending (remove active offer)
        const jobRef = doc(db, this.JOBS_COLLECTION, offer.jobId)
        transaction.update(jobRef, {
          status: 'pending',
          offerIdActive: null,
          updatedAt: serverTimestamp()
        })
      })

      // Log cancellation
      const offer = await this.getOffer(offerId)
      if (offer.success && offer.offer) {
        await AuditService.logOfferCancelled(
          offerId,
          offer.offer.jobId,
          offer.offer.propertyId,
          cancelReason,
          cancelledBy
        )
      }

      console.log(`✅ Offer ${offerId} cancelled`)

      return { success: true }

    } catch (error) {
      console.error('❌ Error cancelling offer:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get an offer by ID
   */
  static async getOffer(offerId: string): Promise<{
    success: boolean
    offer?: JobOffer
    error?: string
  }> {
    try {
      const db = getDb()
      if (!db) {
        throw new Error('Firebase not initialized')
      }

      const offerDoc = await getDoc(doc(db, this.JOB_OFFERS_COLLECTION, offerId))

      if (!offerDoc.exists()) {
        return {
          success: false,
          error: 'Offer not found'
        }
      }

      const offer: JobOffer = {
        offerId: offerDoc.id,
        ...offerDoc.data(),
        offeredAt: offerDoc.data().offeredAt?.toDate() || new Date(),
        expiresAt: offerDoc.data().expiresAt?.toDate() || new Date(),
        acceptanceAt: offerDoc.data().acceptanceAt?.toDate()
      } as JobOffer

      return {
        success: true,
        offer
      }

    } catch (error) {
      console.error('❌ Error getting offer:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get open offers for a staff member
   */
  static async getOffersForStaff(staffId: string): Promise<{
    success: boolean
    offers: JobOffer[]
    error?: string
  }> {
    try {
      const db = getDb()
      if (!db) {
        throw new Error('Firebase not initialized')
      }

      const q = query(
        collection(db, this.JOB_OFFERS_COLLECTION),
        where('status', '==', 'open'),
        where('eligibleStaffIds', 'array-contains', staffId),
        orderBy('offeredAt', 'desc')
      )

      const querySnapshot = await getDocs(q)
      const offers: JobOffer[] = []

      querySnapshot.forEach((doc) => {
        offers.push({
          offerId: doc.id,
          ...doc.data(),
          offeredAt: doc.data().offeredAt?.toDate() || new Date(),
          expiresAt: doc.data().expiresAt?.toDate() || new Date(),
          acceptanceAt: doc.data().acceptanceAt?.toDate()
        } as JobOffer)
      })

      // Filter out expired offers (client-side for now)
      const validOffers = offers.filter(offer => new Date() <= offer.expiresAt)

      return {
        success: true,
        offers: validOffers
      }

    } catch (error) {
      console.error('❌ Error getting staff offers:', error)
      return {
        success: false,
        offers: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get expired offers for processing
   */
  static async getExpiredOffers(): Promise<{
    success: boolean
    offers: JobOffer[]
    error?: string
  }> {
    try {
      const db = getDb()
      if (!db) {
        throw new Error('Firebase not initialized')
      }

      const now = new Date()
      
      const q = query(
        collection(db, this.JOB_OFFERS_COLLECTION),
        where('status', '==', 'open'),
        where('expiresAt', '<=', now),
        limit(100) // Process in batches
      )

      const querySnapshot = await getDocs(q)
      const offers: JobOffer[] = []

      querySnapshot.forEach((doc) => {
        offers.push({
          offerId: doc.id,
          ...doc.data(),
          offeredAt: doc.data().offeredAt?.toDate() || new Date(),
          expiresAt: doc.data().expiresAt?.toDate() || new Date(),
          acceptanceAt: doc.data().acceptanceAt?.toDate()
        } as JobOffer)
      })

      return {
        success: true,
        offers
      }

    } catch (error) {
      console.error('❌ Error getting expired offers:', error)
      return {
        success: false,
        offers: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get dispatch settings
   */
  private static async getDispatchSettings(): Promise<DispatchSettings> {
    try {
      const db = getDb()
      if (!db) {
        return DEFAULT_DISPATCH_SETTINGS
      }

      const settingsDoc = await getDoc(doc(db, this.SETTINGS_COLLECTION, 'config'))
      
      if (settingsDoc.exists()) {
        return { ...DEFAULT_DISPATCH_SETTINGS, ...settingsDoc.data() } as DispatchSettings
      }

      return DEFAULT_DISPATCH_SETTINGS

    } catch (error) {
      console.error('❌ Error getting dispatch settings, using defaults:', error)
      return DEFAULT_DISPATCH_SETTINGS
    }
  }
}
