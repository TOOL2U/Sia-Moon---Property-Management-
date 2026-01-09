/**
 * Audit Service - Phase 5 Auto-Dispatch
 * Complete audit trail for all offer and job operations
 * Non-negotiable requirement for production safety
 */

import { getDb } from '@/lib/firebase'
import { AuditEvent } from '@/types/job-offers'
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore'

export default class AuditService {
  private static readonly COLLECTION = 'audit_events'

  /**
   * Log an audit event
   * Used throughout the system for complete traceability
   */
  static async logEvent(event: Omit<AuditEvent, 'eventId' | 'timestamp'>): Promise<{
    success: boolean
    eventId?: string
    error?: string
  }> {
    try {
      const db = getDb()
      if (!db) {
        throw new Error('Firebase not initialized')
      }

      console.log(`📋 Logging audit event: ${event.type}`)

      const auditData = {
        ...event,
        timestamp: serverTimestamp(),
        // Ensure all required fields are present
        actor: event.actor || 'system',
        details: event.details || {}
      }

      const docRef = await addDoc(collection(db, this.COLLECTION), auditData)

      console.log(`✅ Audit event logged: ${docRef.id}`)
      
      return {
        success: true,
        eventId: docRef.id
      }

    } catch (error) {
      console.error('❌ Error logging audit event:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown audit error'
      }
    }
  }

  /**
   * Log offer creation
   */
  static async logOfferCreated(
    offerId: string,
    jobId: string,
    propertyId: string,
    eligibleStaffIds: string[],
    attemptNumber: number,
    createdBy: string = 'system'
  ): Promise<void> {
    await this.logEvent({
      type: 'offer_created',
      actor: createdBy,
      jobId,
      offerId,
      propertyId,
      details: {
        eligibleStaffCount: eligibleStaffIds.length,
        eligibleStaffIds,
        attemptNumber,
        createdAt: new Date().toISOString()
      }
    })
  }

  /**
   * Log offer notification sent
   */
  static async logOfferNotified(
    offerId: string,
    jobId: string,
    propertyId: string,
    notifiedStaffIds: string[],
    notificationMethod: 'push' | 'in_app' | 'both'
  ): Promise<void> {
    await this.logEvent({
      type: 'offer_notified',
      actor: 'system',
      jobId,
      offerId,
      propertyId,
      details: {
        notifiedStaffCount: notifiedStaffIds.length,
        notifiedStaffIds,
        notificationMethod,
        sentAt: new Date().toISOString()
      }
    })
  }

  /**
   * Log offer acceptance
   */
  static async logOfferAccepted(
    offerId: string,
    jobId: string,
    propertyId: string,
    staffId: string,
    attemptNumber: number
  ): Promise<void> {
    await this.logEvent({
      type: 'offer_accepted',
      actor: staffId,
      jobId,
      offerId,
      propertyId,
      details: {
        acceptedByStaffId: staffId,
        attemptNumber,
        acceptedAt: new Date().toISOString()
      }
    })
  }

  /**
   * Log offer expiry
   */
  static async logOfferExpired(
    offerId: string,
    jobId: string,
    propertyId: string,
    attemptNumber: number,
    willEscalate: boolean
  ): Promise<void> {
    await this.logEvent({
      type: 'offer_expired',
      actor: 'system',
      jobId,
      offerId,
      propertyId,
      details: {
        attemptNumber,
        willEscalate,
        expiredAt: new Date().toISOString()
      }
    })
  }

  /**
   * Log offer cancellation
   */
  static async logOfferCancelled(
    offerId: string,
    jobId: string,
    propertyId: string,
    cancelReason: string,
    cancelledBy: string
  ): Promise<void> {
    await this.logEvent({
      type: 'offer_cancelled',
      actor: cancelledBy,
      jobId,
      offerId,
      propertyId,
      details: {
        cancelReason,
        cancelledBy,
        cancelledAt: new Date().toISOString()
      }
    })
  }

  /**
   * Log job assignment (manual or automatic)
   */
  static async logJobAssigned(
    jobId: string,
    propertyId: string,
    staffId: string,
    assignedBy: string,
    method: 'offer_acceptance' | 'manual_override' | 'admin_assignment'
  ): Promise<void> {
    await this.logEvent({
      type: 'job_assigned',
      actor: assignedBy,
      jobId,
      propertyId,
      details: {
        assignedToStaffId: staffId,
        assignmentMethod: method,
        assignedAt: new Date().toISOString()
      }
    })
  }

  /**
   * Log manual override by admin
   */
  static async logManualOverride(
    jobId: string,
    propertyId: string,
    adminId: string,
    action: 'manual_assignment' | 'offer_cancellation' | 'job_reassignment',
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.logEvent({
      type: 'manual_override',
      actor: adminId,
      jobId,
      propertyId,
      details: {
        overrideAction: action,
        overrideBy: adminId,
        overrideAt: new Date().toISOString(),
        ...details
      }
    })
  }

  /**
   * Log escalation trigger
   */
  static async logEscalationTriggered(
    jobId: string,
    propertyId: string,
    fromAttempt: number,
    toAttempt: number,
    escalationType: 'automatic' | 'manual'
  ): Promise<void> {
    await this.logEvent({
      type: 'escalation_triggered',
      actor: 'system',
      jobId,
      propertyId,
      details: {
        fromAttempt,
        toAttempt,
        escalationType,
        escalatedAt: new Date().toISOString()
      }
    })
  }

  /**
   * Get audit trail for a specific job
   */
  static async getJobAuditTrail(jobId: string, limitCount: number = 50): Promise<{
    success: boolean
    events: AuditEvent[]
    error?: string
  }> {
    try {
      const db = getDb()
      if (!db) {
        throw new Error('Firebase not initialized')
      }

      const q = query(
        collection(db, this.COLLECTION),
        where('jobId', '==', jobId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      )

      const querySnapshot = await getDocs(q)
      const events: AuditEvent[] = []

      querySnapshot.forEach((doc) => {
        events.push({
          eventId: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        } as AuditEvent)
      })

      return {
        success: true,
        events
      }

    } catch (error) {
      console.error('❌ Error getting audit trail:', error)
      return {
        success: false,
        events: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get audit trail for a specific offer
   */
  static async getOfferAuditTrail(offerId: string): Promise<{
    success: boolean
    events: AuditEvent[]
    error?: string
  }> {
    try {
      const db = getDb()
      if (!db) {
        throw new Error('Firebase not initialized')
      }

      const q = query(
        collection(db, this.COLLECTION),
        where('offerId', '==', offerId),
        orderBy('timestamp', 'desc')
      )

      const querySnapshot = await getDocs(q)
      const events: AuditEvent[] = []

      querySnapshot.forEach((doc) => {
        events.push({
          eventId: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        } as AuditEvent)
      })

      return {
        success: true,
        events
      }

    } catch (error) {
      console.error('❌ Error getting offer audit trail:', error)
      return {
        success: false,
        events: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get recent system events for admin dashboard
   */
  static async getRecentSystemEvents(limitCount: number = 100): Promise<{
    success: boolean
    events: AuditEvent[]
    error?: string
  }> {
    try {
      const db = getDb()
      if (!db) {
        throw new Error('Firebase not initialized')
      }

      const q = query(
        collection(db, this.COLLECTION),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      )

      const querySnapshot = await getDocs(q)
      const events: AuditEvent[] = []

      querySnapshot.forEach((doc) => {
        events.push({
          eventId: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        } as AuditEvent)
      })

      return {
        success: true,
        events
      }

    } catch (error) {
      console.error('❌ Error getting recent events:', error)
      return {
        success: false,
        events: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
