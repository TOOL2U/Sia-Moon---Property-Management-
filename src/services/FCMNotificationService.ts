/**
 * FCM Notification Service
 * Handles Firebase Cloud Messaging push notifications
 */

import { collection, doc, setDoc, deleteDoc, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { getDb } from '@/lib/firebase'

export interface FCMTokenData {
  staffId: string
  deviceToken: string
  platform: 'ios' | 'android' | 'web'
  appVersion: string
  lastActive: Timestamp
  notificationsEnabled: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface NotificationPayload {
  title: string
  body: string
  data?: Record<string, any>
  imageUrl?: string
  icon?: string
  badge?: number
  sound?: string
  clickAction?: string
}

class FCMNotificationService {
  private static instance: FCMNotificationService
  private get tokenCollection() { return collection(getDb(), 'staff_device_tokens') }
  private get notificationCollection() { return collection(getDb(), 'push_notifications') }

  static getInstance(): FCMNotificationService {
    if (!FCMNotificationService.instance) {
      FCMNotificationService.instance = new FCMNotificationService()
    }
    return FCMNotificationService.instance
  }

  /**
   * Register a device token for push notifications
   */
  async registerDeviceToken(
    staffId: string,
    deviceToken: string,
    platform: 'ios' | 'android' | 'web' = 'web',
    appVersion: string = '1.0.0'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📱 Registering FCM device token for staff ${staffId}`)

      const tokenData: FCMTokenData = {
        staffId,
        deviceToken,
        platform,
        appVersion,
        lastActive: Timestamp.now(),
        notificationsEnabled: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }

      // Use token as document ID to prevent duplicates
      const tokenRef = doc(this.tokenCollection, deviceToken)
      await setDoc(tokenRef, tokenData, { merge: true })

      console.log(`✅ FCM device token registered for staff ${staffId}`)
      return { success: true }

    } catch (error) {
      console.error('❌ Error registering FCM device token:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to register device token'
      }
    }
  }

  /**
   * Remove a device token
   */
  async removeDeviceToken(deviceToken: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🗑️ Removing FCM device token: ${deviceToken.substring(0, 20)}...`)

      const tokenRef = doc(this.tokenCollection, deviceToken)
      await deleteDoc(tokenRef)

      console.log(`✅ FCM device token removed`)
      return { success: true }

    } catch (error) {
      console.error('❌ Error removing FCM device token:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove device token'
      }
    }
  }

  /**
   * Get device tokens for a specific staff member
   */
  async getStaffDeviceTokens(staffId: string): Promise<{ success: boolean; tokens?: string[]; error?: string }> {
    try {
      const tokensQuery = query(
        this.tokenCollection,
        where('staffId', '==', staffId),
        where('notificationsEnabled', '==', true)
      )

      const tokensSnapshot = await getDocs(tokensQuery)
      const tokens: string[] = []

      tokensSnapshot.forEach((doc) => {
        const tokenData = doc.data() as FCMTokenData
        tokens.push(tokenData.deviceToken)
      })

      return { success: true, tokens }

    } catch (error) {
      console.error('❌ Error getting staff device tokens:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get device tokens'
      }
    }
  }

  /**
   * Send push notification to specific device tokens
   */
  async sendNotification(
    tokens: string[],
    notification: NotificationPayload,
    staffId?: string
  ): Promise<{ success: boolean; results?: any; error?: string }> {
    try {
      console.log(`📨 Sending FCM notification to ${tokens.length} device(s)`)

      // Check if we have the Firebase Admin SDK initialized
      if (!process.env.FIREBASE_PRIVATE_KEY) {
        console.warn('⚠️ Firebase Admin SDK not configured, notifications will be queued')
        
        // Store notification for later processing
        await this.queueNotification(tokens, notification, staffId)
        return { success: true, results: { queued: true } }
      }

      // In a real implementation, you would use Firebase Admin SDK here
      // For now, we'll just log and queue the notification
      console.log('📨 Notification payload:', {
        tokens: tokens.map(t => t.substring(0, 20) + '...'),
        notification: {
          title: notification.title,
          body: notification.body,
          data: notification.data
        }
      })

      await this.queueNotification(tokens, notification, staffId)

      return { 
        success: true, 
        results: { 
          queued: true,
          tokenCount: tokens.length,
          message: 'Notification queued for processing'
        } 
      }

    } catch (error) {
      console.error('❌ Error sending FCM notification:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send notification'
      }
    }
  }

  /**
   * Send notification to all devices for a staff member
   */
  async sendNotificationToStaff(
    staffId: string,
    notification: NotificationPayload
  ): Promise<{ success: boolean; results?: any; error?: string }> {
    try {
      const tokenResult = await this.getStaffDeviceTokens(staffId)
      
      if (!tokenResult.success || !tokenResult.tokens || tokenResult.tokens.length === 0) {
        console.warn(`⚠️ No device tokens found for staff ${staffId}`)
        return { success: true, results: { message: 'No device tokens found' } }
      }

      return await this.sendNotification(tokenResult.tokens, notification, staffId)

    } catch (error) {
      console.error('❌ Error sending notification to staff:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send notification to staff'
      }
    }
  }

  /**
   * Queue notification for later processing
   */
  private async queueNotification(
    tokens: string[],
    notification: NotificationPayload,
    staffId?: string
  ): Promise<void> {
    try {
      const notificationDoc = {
        tokens,
        notification,
        staffId,
        status: 'queued',
        createdAt: Timestamp.now(),
        scheduledFor: Timestamp.now(),
        attempts: 0,
        maxAttempts: 3,
        lastAttempt: null,
        completedAt: null,
        error: null
      }

      await setDoc(doc(this.notificationCollection), notificationDoc)
      console.log(`📋 Notification queued for ${tokens.length} device(s)`)

    } catch (error) {
      console.error('❌ Error queuing notification:', error)
    }
  }

  /**
   * Update last active timestamp for a device token
   */
  async updateLastActive(deviceToken: string): Promise<{ success: boolean; error?: string }> {
    try {
      const tokenRef = doc(this.tokenCollection, deviceToken)
      await setDoc(tokenRef, { 
        lastActive: Timestamp.now(),
        updatedAt: Timestamp.now()
      }, { merge: true })

      return { success: true }

    } catch (error) {
      console.error('❌ Error updating last active:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update last active'
      }
    }
  }

  /**
   * Enable/disable notifications for a device token
   */
  async toggleNotifications(
    deviceToken: string,
    enabled: boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const tokenRef = doc(this.tokenCollection, deviceToken)
      await setDoc(tokenRef, { 
        notificationsEnabled: enabled,
        updatedAt: Timestamp.now()
      }, { merge: true })

      console.log(`📱 Notifications ${enabled ? 'enabled' : 'disabled'} for device`)
      return { success: true }

    } catch (error) {
      console.error('❌ Error toggling notifications:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to toggle notifications'
      }
    }
  }

  /**
   * Get all active device tokens (for broadcast notifications)
   */
  async getAllActiveTokens(): Promise<{ success: boolean; tokens?: string[]; error?: string }> {
    try {
      const tokensQuery = query(
        this.tokenCollection,
        where('notificationsEnabled', '==', true)
      )

      const tokensSnapshot = await getDocs(tokensQuery)
      const tokens: string[] = []

      tokensSnapshot.forEach((doc) => {
        const tokenData = doc.data() as FCMTokenData
        tokens.push(tokenData.deviceToken)
      })

      return { success: true, tokens }

    } catch (error) {
      console.error('❌ Error getting all active tokens:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get active tokens'
      }
    }
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens(): Promise<{ success: boolean; removedCount?: number; error?: string }> {
    try {
      console.log('🧹 Cleaning up expired device tokens...')

      // Remove tokens that haven't been active for 30 days
      const expiredDate = new Date()
      expiredDate.setDate(expiredDate.getDate() - 30)

      const tokensQuery = query(this.tokenCollection)
      const tokensSnapshot = await getDocs(tokensQuery)
      
      let removedCount = 0
      const deletePromises: Promise<void>[] = []

      tokensSnapshot.forEach((doc) => {
        const tokenData = doc.data() as FCMTokenData
        const lastActive = tokenData.lastActive.toDate()
        
        if (lastActive < expiredDate) {
          deletePromises.push(deleteDoc(doc.ref))
          removedCount++
        }
      })

      await Promise.all(deletePromises)

      console.log(`✅ Cleaned up ${removedCount} expired device tokens`)
      return { success: true, removedCount }

    } catch (error) {
      console.error('❌ Error cleaning up expired tokens:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cleanup expired tokens'
      }
    }
  }
}

export default FCMNotificationService.getInstance()
