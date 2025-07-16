/**
 * Firebase Cloud Messaging (FCM) Notification Service
 * Handles push notifications for mobile app integration
 */

import { getMessaging, getToken, onMessage, MessagePayload } from 'firebase/messaging'
import { doc, setDoc, updateDoc, getDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// FCM configuration
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || 'your-vapid-key'

// Device token interface
export interface DeviceToken {
  staffId: string
  deviceToken: string
  platform: 'web' | 'ios' | 'android'
  appVersion: string
  userAgent?: string
  lastActive: any
  notificationsEnabled: boolean
  createdAt: any
  updatedAt: any
}

// Notification payload interface
export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: Record<string, any>
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

// Job notification data
export interface JobNotificationData {
  type: 'job_assigned' | 'job_updated' | 'job_reminder'
  jobId: string
  jobTitle: string
  jobType: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  propertyName: string
  scheduledDate: string
  scheduledStartTime?: string
  estimatedDuration: number
  specialInstructions?: string
}

class FCMNotificationService {
  private messaging: any = null
  private isInitialized = false
  private currentToken: string | null = null

  /**
   * Initialize FCM messaging
   */
  async initialize(): Promise<boolean> {
    try {
      if (typeof window === 'undefined') {
        console.log('⚠️ FCM not available in server environment')
        return false
      }

      // Check if service worker is supported
      if (!('serviceWorker' in navigator)) {
        console.error('❌ Service Worker not supported')
        return false
      }

      // Check if notifications are supported
      if (!('Notification' in window)) {
        console.error('❌ Notifications not supported')
        return false
      }

      this.messaging = getMessaging()
      this.isInitialized = true

      console.log('✅ FCM Notification Service initialized')
      return true

    } catch (error) {
      console.error('❌ Error initializing FCM:', error)
      return false
    }
  }

  /**
   * Request notification permission and get FCM token
   */
  async requestPermissionAndGetToken(staffId: string): Promise<string | null> {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize()
        if (!initialized) return null
      }

      // Request notification permission
      const permission = await Notification.requestPermission()
      
      if (permission !== 'granted') {
        console.log('⚠️ Notification permission denied')
        return null
      }

      // Get FCM token
      const token = await getToken(this.messaging, {
        vapidKey: VAPID_KEY
      })

      if (token) {
        console.log('✅ FCM token obtained:', token.substring(0, 20) + '...')
        
        // Store token in Firestore
        await this.storeDeviceToken(staffId, token)
        this.currentToken = token
        
        return token
      } else {
        console.error('❌ No FCM token available')
        return null
      }

    } catch (error) {
      console.error('❌ Error getting FCM token:', error)
      return null
    }
  }

  /**
   * Store device token in Firestore
   */
  private async storeDeviceToken(staffId: string, token: string): Promise<void> {
    try {
      const deviceTokenData: DeviceToken = {
        staffId,
        deviceToken: token,
        platform: this.detectPlatform(),
        appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
        userAgent: navigator.userAgent,
        lastActive: serverTimestamp(),
        notificationsEnabled: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      // Use token as document ID to prevent duplicates
      const tokenRef = doc(db, 'staff_device_tokens', token)
      await setDoc(tokenRef, deviceTokenData, { merge: true })

      console.log('✅ Device token stored for staff:', staffId)

    } catch (error) {
      console.error('❌ Error storing device token:', error)
      throw error
    }
  }

  /**
   * Detect platform type
   */
  private detectPlatform(): 'web' | 'ios' | 'android' {
    const userAgent = navigator.userAgent.toLowerCase()
    
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      return 'ios'
    } else if (userAgent.includes('android')) {
      return 'android'
    } else {
      return 'web'
    }
  }

  /**
   * Set up foreground message listener
   */
  setupForegroundMessageListener(
    onMessageReceived: (payload: MessagePayload) => void
  ): () => void {
    if (!this.isInitialized || !this.messaging) {
      console.error('❌ FCM not initialized')
      return () => {}
    }

    const unsubscribe = onMessage(this.messaging, (payload) => {
      console.log('📱 Foreground message received:', payload)
      
      // Handle the message
      onMessageReceived(payload)
      
      // Show notification if app is in foreground
      this.showForegroundNotification(payload)
    })

    console.log('✅ Foreground message listener set up')
    return unsubscribe
  }

  /**
   * Show notification when app is in foreground
   */
  private showForegroundNotification(payload: MessagePayload): void {
    try {
      const { notification, data } = payload
      
      if (!notification?.title) return

      const notificationOptions: NotificationOptions = {
        body: notification.body || '',
        icon: notification.icon || '/icons/notification-icon.png',
        badge: '/icons/badge-icon.png',
        tag: data?.jobId || 'job-notification',
        requireInteraction: data?.priority === 'urgent',
        actions: [
          {
            action: 'view',
            title: 'View Job'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ],
        data: data || {}
      }

      const notification_instance = new Notification(notification.title, notificationOptions)

      // Handle notification click
      notification_instance.onclick = () => {
        window.focus()
        
        // Navigate to job if jobId is provided
        if (data?.jobId) {
          window.location.href = `/jobs/${data.jobId}`
        }
        
        notification_instance.close()
      }

      // Auto-close after 10 seconds
      setTimeout(() => {
        notification_instance.close()
      }, 10000)

    } catch (error) {
      console.error('❌ Error showing foreground notification:', error)
    }
  }

  /**
   * Update device token activity
   */
  async updateTokenActivity(staffId: string): Promise<void> {
    try {
      if (!this.currentToken) return

      const tokenRef = doc(db, 'staff_device_tokens', this.currentToken)
      await updateDoc(tokenRef, {
        lastActive: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

    } catch (error) {
      console.error('❌ Error updating token activity:', error)
    }
  }

  /**
   * Enable/disable notifications for staff member
   */
  async toggleNotifications(staffId: string, enabled: boolean): Promise<void> {
    try {
      // Update all tokens for this staff member
      const tokensQuery = query(
        collection(db, 'staff_device_tokens'),
        where('staffId', '==', staffId)
      )

      const tokensSnapshot = await getDocs(tokensQuery)
      
      const updatePromises = tokensSnapshot.docs.map(doc => 
        updateDoc(doc.ref, {
          notificationsEnabled: enabled,
          updatedAt: serverTimestamp()
        })
      )

      await Promise.all(updatePromises)

      console.log(`✅ Notifications ${enabled ? 'enabled' : 'disabled'} for staff ${staffId}`)

    } catch (error) {
      console.error('❌ Error toggling notifications:', error)
      throw error
    }
  }

  /**
   * Get notification settings for staff member
   */
  async getNotificationSettings(staffId: string): Promise<{
    enabled: boolean
    tokenCount: number
    lastActive?: Date
  }> {
    try {
      const tokensQuery = query(
        collection(db, 'staff_device_tokens'),
        where('staffId', '==', staffId)
      )

      const tokensSnapshot = await getDocs(tokensQuery)
      
      if (tokensSnapshot.empty) {
        return { enabled: false, tokenCount: 0 }
      }

      let enabled = false
      let lastActive: Date | undefined
      
      tokensSnapshot.forEach(doc => {
        const data = doc.data()
        if (data.notificationsEnabled) enabled = true
        
        const tokenLastActive = data.lastActive?.toDate()
        if (!lastActive || (tokenLastActive && tokenLastActive > lastActive)) {
          lastActive = tokenLastActive
        }
      })

      return {
        enabled,
        tokenCount: tokensSnapshot.size,
        lastActive
      }

    } catch (error) {
      console.error('❌ Error getting notification settings:', error)
      return { enabled: false, tokenCount: 0 }
    }
  }

  /**
   * Remove device token (on logout or app uninstall)
   */
  async removeDeviceToken(token?: string): Promise<void> {
    try {
      const tokenToRemove = token || this.currentToken
      
      if (!tokenToRemove) {
        console.log('⚠️ No token to remove')
        return
      }

      const tokenRef = doc(db, 'staff_device_tokens', tokenToRemove)
      const tokenDoc = await getDoc(tokenRef)
      
      if (tokenDoc.exists()) {
        await tokenDoc.ref.delete()
        console.log('✅ Device token removed')
      }

      if (tokenToRemove === this.currentToken) {
        this.currentToken = null
      }

    } catch (error) {
      console.error('❌ Error removing device token:', error)
      throw error
    }
  }

  /**
   * Test notification functionality
   */
  async testNotification(staffId: string): Promise<boolean> {
    try {
      // Create a test notification document
      const testNotificationRef = doc(collection(db, 'staff_notifications'))
      
      await setDoc(testNotificationRef, {
        staffId,
        type: 'test',
        title: '🧪 Test Notification',
        message: 'This is a test notification from Sia Moon',
        data: {
          type: 'test',
          timestamp: new Date().toISOString()
        },
        status: 'sent',
        createdAt: serverTimestamp(),
        readAt: null,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      })

      console.log('✅ Test notification sent')
      return true

    } catch (error) {
      console.error('❌ Error sending test notification:', error)
      return false
    }
  }

  /**
   * Get current FCM token
   */
  getCurrentToken(): string | null {
    return this.currentToken
  }

  /**
   * Check if FCM is initialized
   */
  isReady(): boolean {
    return this.isInitialized
  }
}

// Export singleton instance
export default new FCMNotificationService()
