import { getDb } from '@/lib/firebase'
import {
  collection,
  deleteField,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'

/**
 * Expo Push Notification Types
 */
export interface ExpoPushToken {
  token: string
  staffId: string
  platform: 'ios' | 'android'
  appVersion: string
  lastActive: Date
  isValid: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ExpoPushMessage {
  to: string | string[]
  title: string
  body: string
  data?: Record<string, any>
  sound?: 'default' | null
  badge?: number
  priority?: 'default' | 'normal' | 'high'
  ttl?: number
  expiration?: number
  channelId?: string
}

export interface ExpoPushTicket {
  status: 'ok' | 'error'
  id?: string
  message?: string
  details?: {
    error?:
      | 'DeviceNotRegistered'
      | 'InvalidCredentials'
      | 'MessageTooBig'
      | 'MessageRateExceeded'
  }
}

export interface ExpoPushReceipt {
  status: 'ok' | 'error'
  message?: string
  details?: {
    error?: 'DeviceNotRegistered' | 'MessageTooBig' | 'InvalidCredentials'
  }
}

export interface ExpoPushResponse {
  data: ExpoPushTicket[]
}

export interface ExpoPushReceiptResponse {
  data: Record<string, ExpoPushReceipt>
}

/**
 * Expo Push Notification Service
 * Handles Expo Push API interactions, token management, and error handling
 */
export class ExpoPushService {
  private static readonly EXPO_PUSH_API_URL =
    'https://exp.host/--/api/v2/push/send'
  private static readonly EXPO_RECEIPT_API_URL =
    'https://exp.host/--/api/v2/push/getReceipts'
  private static readonly MAX_BATCH_SIZE = 100
  private static readonly MAX_RETRY_ATTEMPTS = 3
  private static readonly RETRY_DELAY_BASE = 1000 // 1 second

  /**
   * Validate Expo push token format
   */
  static isValidExpoPushToken(token: string): boolean {
    // Expo push tokens start with ExponentPushToken[ or ExpoPushToken[
    return /^Expo(nent)?PushToken\[.+\]$/.test(token)
  }

  /**
   * Store Expo push token for a staff member
   */
  static async storeExpoPushToken(
    staffId: string,
    token: string,
    platform: 'ios' | 'android',
    appVersion: string = '1.0.0'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📱 Storing Expo push token for staff ${staffId}`)

      if (!this.isValidExpoPushToken(token)) {
        return { success: false, error: 'Invalid Expo push token format' }
      }

      const db = getDb()
      const staffRef = doc(db, 'staff_accounts', staffId)

      await updateDoc(staffRef, {
        expoPushToken: token,
        expoPushTokenPlatform: platform,
        expoPushTokenAppVersion: appVersion,
        expoPushTokenUpdatedAt: serverTimestamp(),
        expoPushTokenIsValid: true,
      })

      console.log(`✅ Expo push token stored for staff ${staffId}`)
      return { success: true }
    } catch (error) {
      console.error('❌ Error storing Expo push token:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to store token',
      }
    }
  }

  /**
   * Remove Expo push token for a staff member
   */
  static async removeExpoPushToken(
    staffId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📱 Removing Expo push token for staff ${staffId}`)

      const db = getDb()
      const staffRef = doc(db, 'staff_accounts', staffId)

      await updateDoc(staffRef, {
        expoPushToken: deleteField(),
        expoPushTokenPlatform: deleteField(),
        expoPushTokenAppVersion: deleteField(),
        expoPushTokenUpdatedAt: deleteField(),
        expoPushTokenIsValid: deleteField(),
      })

      console.log(`✅ Expo push token removed for staff ${staffId}`)
      return { success: true }
    } catch (error) {
      console.error('❌ Error removing Expo push token:', error)
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to remove token',
      }
    }
  }

  /**
   * Get Expo push tokens for staff members
   */
  static async getStaffExpoPushTokens(
    staffIds: string[]
  ): Promise<{ success: boolean; tokens: string[]; error?: string }> {
    try {
      console.log(
        `📱 Getting Expo push tokens for ${staffIds.length} staff members`
      )

      const db = getDb()
      const tokens: string[] = []

      // Query staff accounts for tokens
      const staffQuery = query(
        collection(db, 'staff_accounts'),
        where('__name__', 'in', staffIds)
      )

      const staffSnapshot = await getDocs(staffQuery)

      staffSnapshot.forEach((doc) => {
        const data = doc.data()
        if (
          data.expoPushToken &&
          data.expoPushTokenIsValid !== false &&
          this.isValidExpoPushToken(data.expoPushToken)
        ) {
          tokens.push(data.expoPushToken)
        }
      })

      console.log(`✅ Found ${tokens.length} valid Expo push tokens`)
      return { success: true, tokens }
    } catch (error) {
      console.error('❌ Error getting Expo push tokens:', error)
      return {
        success: false,
        tokens: [],
        error: error instanceof Error ? error.message : 'Failed to get tokens',
      }
    }
  }

  /**
   * Mark Expo push token as invalid
   */
  static async markTokenAsInvalid(staffId: string): Promise<void> {
    try {
      console.log(`📱 Marking Expo push token as invalid for staff ${staffId}`)

      const db = getDb()
      const staffRef = doc(db, 'staff_accounts', staffId)

      await updateDoc(staffRef, {
        expoPushTokenIsValid: false,
        expoPushTokenUpdatedAt: serverTimestamp(),
      })

      console.log(`✅ Expo push token marked as invalid for staff ${staffId}`)
    } catch (error) {
      console.error('❌ Error marking token as invalid:', error)
    }
  }

  /**
   * Send push notification via Expo Push API
   */
  static async sendPushNotification(
    message: ExpoPushMessage,
    retryCount: number = 0
  ): Promise<{ success: boolean; tickets?: ExpoPushTicket[]; error?: string }> {
    try {
      console.log(
        `📱 Sending Expo push notification (attempt ${retryCount + 1})`
      )

      const response = await fetch(this.EXPO_PUSH_API_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      })

      if (!response.ok) {
        throw new Error(
          `Expo API error: ${response.status} ${response.statusText}`
        )
      }

      const result: ExpoPushResponse = await response.json()

      console.log(`✅ Expo push notification sent successfully`)
      return { success: true, tickets: result.data }
    } catch (error) {
      console.error('❌ Error sending Expo push notification:', error)

      // Retry logic
      if (retryCount < this.MAX_RETRY_ATTEMPTS) {
        const delay = this.RETRY_DELAY_BASE * Math.pow(2, retryCount)
        console.log(`🔄 Retrying in ${delay}ms...`)

        await new Promise((resolve) => setTimeout(resolve, delay))
        return this.sendPushNotification(message, retryCount + 1)
      }

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to send push notification',
      }
    }
  }

  /**
   * Send push notifications to multiple staff members
   */
  static async sendToStaff(
    staffIds: string[],
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<{ success: boolean; results: any[]; error?: string }> {
    try {
      console.log(
        `📱 Sending Expo push notifications to ${staffIds.length} staff members`
      )

      // Get tokens for staff members
      const tokenResult = await this.getStaffExpoPushTokens(staffIds)
      if (!tokenResult.success || tokenResult.tokens.length === 0) {
        return {
          success: true,
          results: [],
          error: 'No valid Expo push tokens found for staff members',
        }
      }

      // Prepare message
      const message: ExpoPushMessage = {
        to: tokenResult.tokens,
        title,
        body,
        data,
        sound: 'default',
        priority: 'high',
        ttl: 3600, // 1 hour
      }

      // Send notification
      const result = await this.sendPushNotification(message)

      if (!result.success) {
        return { success: false, results: [], error: result.error }
      }

      // Process tickets and handle errors
      const results = await this.processTickets(result.tickets || [], staffIds)

      return { success: true, results }
    } catch (error) {
      console.error('❌ Error sending Expo push notifications to staff:', error)
      return {
        success: false,
        results: [],
        error:
          error instanceof Error
            ? error.message
            : 'Failed to send notifications',
      }
    }
  }

  /**
   * Process push notification tickets and handle errors
   */
  private static async processTickets(
    tickets: ExpoPushTicket[],
    staffIds: string[]
  ): Promise<any[]> {
    const results: any[] = []

    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i]
      const staffId = staffIds[i]

      if (ticket.status === 'error') {
        console.error(
          `❌ Push notification failed for staff ${staffId}:`,
          ticket.message
        )

        // Handle specific errors
        if (ticket.details?.error === 'DeviceNotRegistered') {
          console.log(`📱 Marking token as invalid for staff ${staffId}`)
          await this.markTokenAsInvalid(staffId)
        }

        results.push({
          staffId,
          success: false,
          error: ticket.message,
          errorType: ticket.details?.error,
        })
      } else {
        console.log(
          `✅ Push notification sent successfully to staff ${staffId}`
        )
        results.push({
          staffId,
          success: true,
          ticketId: ticket.id,
        })
      }
    }

    return results
  }

  /**
   * Create notification message from notification data
   */
  static createMessageFromNotification(
    tokens: string[],
    notification: {
      title: string
      message: string
      jobId?: string
      propertyName?: string
      priority: 'low' | 'medium' | 'high'
      actionButtons?: Array<{ label: string; action: string }>
    }
  ): ExpoPushMessage {
    return {
      to: tokens,
      title: notification.title,
      body: notification.message,
      data: {
        jobId: notification.jobId,
        propertyName: notification.propertyName,
        priority: notification.priority,
        actionButtons: notification.actionButtons,
        screen: notification.jobId ? 'JobDetails' : 'Notifications',
        timestamp: new Date().toISOString(),
      },
      sound: notification.priority === 'high' ? 'default' : null,
      priority: notification.priority === 'high' ? 'high' : 'normal',
      ttl: notification.priority === 'high' ? 3600 : 86400, // 1 hour for high, 24 hours for others
      badge: 1,
    }
  }

  /**
   * Truncate message if too long for Expo
   */
  static truncateMessage(message: string, maxLength: number = 200): string {
    if (message.length <= maxLength) {
      return message
    }
    return message.substring(0, maxLength - 3) + '...'
  }
}

export default ExpoPushService
