/**
 * Offer Notification Service - Phase 5 Auto-Dispatch
 * Specialized service for job offer notifications (push + in-app)
 * Integrates with existing NotificationService for broader functionality
 */

import { getDb } from '@/lib/firebase'
import { JobOffer, OfferNotification } from '@/types/job-offers'
import AuditService from '@/services/AuditService'
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore'

export default class OfferNotificationService {
  private static readonly OFFER_NOTIFICATIONS_COLLECTION = 'offer_notifications'
  
  /**
   * Send offer notifications to eligible staff
   * Creates in-app notifications and sends push notifications
   */
  static async notifyStaffOfOffer(offer: JobOffer): Promise<{
    success: boolean
    notifiedStaff: string[]
    failedNotifications: string[]
    error?: string
  }> {
    try {
      console.log(`📢 Sending offer notifications for offer ${offer.offerId}`)

      const notifiedStaff: string[] = []
      const failedNotifications: string[] = []

      // Create notifications for each eligible staff member
      for (const staffId of offer.eligibleStaffIds) {
        try {
          // Create in-app notification
          const inAppResult = await this.createOfferNotification(offer, staffId)
          
          if (inAppResult.success) {
            notifiedStaff.push(staffId)
            
            // Attempt push notification (best effort)
            try {
              await this.sendOfferPushNotification(offer, staffId)
            } catch (pushError) {
              console.warn(`⚠️ Push notification failed for staff ${staffId}:`, pushError)
              // Don't fail the whole process for push failures
            }
            
          } else {
            failedNotifications.push(staffId)
            console.error(`❌ In-app notification failed for staff ${staffId}: ${inAppResult.error}`)
          }

        } catch (error) {
          failedNotifications.push(staffId)
          console.error(`❌ Notification error for staff ${staffId}:`, error)
        }
      }

      // Log notification audit event
      await AuditService.logOfferNotified(
        offer.offerId,
        offer.jobId,
        offer.propertyId,
        notifiedStaff,
        'both' // push + in-app
      )

      console.log(`✅ Offer notifications sent: ${notifiedStaff.length} success, ${failedNotifications.length} failed`)

      return {
        success: true,
        notifiedStaff,
        failedNotifications
      }

    } catch (error) {
      console.error('❌ Error sending offer notifications:', error)
      return {
        success: false,
        notifiedStaff: [],
        failedNotifications: offer.eligibleStaffIds,
        error: error instanceof Error ? error.message : 'Unknown notification error'
      }
    }
  }

  /**
   * Create in-app notification for staff member
   */
  private static async createOfferNotification(offer: JobOffer, staffId: string): Promise<{
    success: boolean
    notificationId?: string
    error?: string
  }> {
    try {
      const db = getDb()
      if (!db) {
        throw new Error('Firebase not initialized')
      }

      const notification: Omit<OfferNotification, 'notificationId'> = {
        staffId,
        offerId: offer.offerId,
        jobId: offer.jobId,
        propertyId: offer.propertyId,
        title: this.generateOfferTitle(offer),
        body: this.generateOfferBody(offer),
        deepLink: `app://offers/${offer.offerId}`,
        sentAt: new Date(),
        deliveryStatus: 'sent'
      }

      const docRef = await addDoc(collection(db, this.OFFER_NOTIFICATIONS_COLLECTION), {
        ...notification,
        sentAt: serverTimestamp()
      })

      return {
        success: true,
        notificationId: docRef.id
      }

    } catch (error) {
      console.error('❌ Error creating offer notification:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Send push notification for job offer
   * Placeholder for FCM integration
   */
  private static async sendOfferPushNotification(offer: JobOffer, staffId: string): Promise<void> {
    try {
      console.log(`📱 Push notification prepared for staff ${staffId} - offer ${offer.offerId}`)

      // FCM payload for job offers
      const pushPayload = {
        notification: {
          title: this.generateOfferTitle(offer),
          body: this.generateOfferBody(offer),
          icon: '/icons/job-offer-icon.png',
          badge: '/icons/badge-icon.png',
          sound: 'job_offer_sound.wav'
        },
        data: {
          type: 'job_offer',
          offerId: offer.offerId,
          jobId: offer.jobId,
          propertyId: offer.propertyId,
          deepLink: `app://offers/${offer.offerId}`,
          priority: offer.meta?.priority || 'medium',
          expiresAt: offer.expiresAt.toISOString(),
          attemptNumber: offer.attemptNumber.toString()
        }
      }

      console.log(`✅ Push payload ready:`, {
        staffId,
        title: pushPayload.notification.title,
        offerId: offer.offerId
      })

      // TODO: Integrate with Firebase Cloud Functions for FCM
      // This would be called from a Cloud Function with admin privileges
      
    } catch (error) {
      console.error(`❌ Push notification error for staff ${staffId}:`, error)
      throw error
    }
  }

  /**
   * Generate offer notification title
   */
  private static generateOfferTitle(offer: JobOffer): string {
    const jobTypeNames = {
      cleaner: 'Cleaning Job',
      inspector: 'Inspection Job', 
      maintenance: 'Maintenance Job'
    }

    const urgencyText = offer.attemptNumber > 1 ? '🚨 URGENT: ' : ''
    
    return `${urgencyText}${jobTypeNames[offer.requiredRole] || 'New Job'} Available`
  }

  /**
   * Generate offer notification body with job details
   */
  private static generateOfferBody(offer: JobOffer): string {
    const duration = offer.meta?.estimatedDuration || 0
    const durationText = duration > 60 ? 
      `${Math.floor(duration / 60)}h ${duration % 60}m` : 
      `${duration}m`
    
    const expiryMinutes = Math.max(0, Math.floor((offer.expiresAt.getTime() - Date.now()) / (1000 * 60)))
    const expiryText = expiryMinutes > 60 ? 
      `${Math.floor(expiryMinutes / 60)}h ${expiryMinutes % 60}m` : 
      `${expiryMinutes}m`

    const payoutText = offer.meta?.payout ? ` • $${offer.meta.payout}` : ''
    
    return `${durationText} job${payoutText} • Expires in ${expiryText} • Tap to accept`
  }

  /**
   * Get offer notifications for staff member
   */
  static async getOfferNotificationsForStaff(staffId: string): Promise<{
    success: boolean
    notifications: OfferNotification[]
    error?: string
  }> {
    try {
      const db = getDb()
      if (!db) {
        throw new Error('Firebase not initialized')
      }

      const q = query(
        collection(db, this.OFFER_NOTIFICATIONS_COLLECTION),
        where('staffId', '==', staffId),
        where('deliveryStatus', '==', 'sent')
      )

      const querySnapshot = await getDocs(q)
      const notifications: OfferNotification[] = []

      querySnapshot.forEach((doc) => {
        notifications.push({
          notificationId: doc.id,
          ...doc.data(),
          sentAt: doc.data().sentAt?.toDate() || new Date(),
          readAt: doc.data().readAt?.toDate()
        } as OfferNotification)
      })

      return {
        success: true,
        notifications
      }

    } catch (error) {
      console.error('❌ Error getting offer notifications:', error)
      return {
        success: false,
        notifications: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Send escalation notification when offers expire
   */
  static async sendEscalationNotification(
    jobId: string,
    propertyId: string,
    attemptNumber: number,
    maxAttempts: number
  ): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      console.log(`🚨 Sending escalation notification for job ${jobId} (attempt ${attemptNumber}/${maxAttempts})`)

      if (attemptNumber >= maxAttempts) {
        // Final escalation - requires admin intervention
        const escalationData = {
          type: 'job_requires_manual_assignment',
          jobId,
          propertyId,
          attemptNumber,
          maxAttempts,
          message: `Job ${jobId} requires immediate manual assignment after ${attemptNumber} failed auto-dispatch attempts.`,
          priority: 'critical',
          createdAt: new Date(),
          assignedTo: 'admin' // Could be specific admin/manager IDs
        }

        console.log(`🚨 CRITICAL: Job ${jobId} escalated to admin for manual assignment`)
        
        // TODO: Create admin notification/alert
        // This would integrate with admin dashboard notifications
        
      } else {
        // Intermediate escalation - notify supervisors
        console.log(`⚠️ Job ${jobId} escalated to attempt ${attemptNumber + 1}`)
      }

      return {
        success: true
      }

    } catch (error) {
      console.error('❌ Error sending escalation notification:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
