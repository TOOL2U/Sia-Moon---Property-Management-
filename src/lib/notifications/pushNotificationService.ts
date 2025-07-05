import DatabaseService from '@/lib/dbService'

export interface PushNotificationRequest {
  userId: string
  title: string
  body: string
  url?: string
  data?: Record<string, any>
  icon?: string
}

export interface PushNotificationResult {
  success: boolean
  error?: string
  messageId?: string
}

/**
 * Push notification service using OneSignal
 */
export class PushNotificationService {
  
  /**
   * Send a push notification to a specific user
   */
  static async sendPushNotification(request: PushNotificationRequest): Promise<PushNotificationResult> {
    try {
      console.log(`📱 Sending push notification to user ${request.userId}: ${request.title}`)
      
      // Get user's OneSignal player ID from preferences
      const preferencesResult = await DatabaseService.getNotificationPreferences(request.userId)
      if (preferencesResult.error || !preferencesResult.data?.onesignal_player_id) {
        return {
          success: false,
          error: 'User has not enabled push notifications or OneSignal player ID not found'
        }
      }
      
      const playerId = preferencesResult.data.onesignal_player_id
      
      // Check if we're in a quiet hours period
      if (await this.isInQuietHours(request.userId)) {
        console.log('⏰ Skipping push notification due to quiet hours')
        return {
          success: false,
          error: 'Notification skipped due to quiet hours'
        }
      }
      
      // Send via OneSignal REST API
      const result = await this.sendViaOneSignal({
        playerIds: [playerId],
        title: request.title,
        body: request.body,
        url: request.url,
        data: request.data,
        icon: request.icon
      })
      
      if (result.success) {
        console.log('✅ Push notification sent successfully')
      }
      
      return result
      
    } catch (error) {
      console.error('❌ Error sending push notification:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  /**
   * Send push notifications to multiple users
   */
  static async sendBulkPushNotification(
    userIds: string[],
    notification: Omit<PushNotificationRequest, 'userId'>
  ): Promise<PushNotificationResult[]> {
    const results: PushNotificationResult[] = []
    
    // Get all player IDs
    const playerIds: string[] = []
    const userPlayerMap: Record<string, string> = {}
    
    for (const userId of userIds) {
      const preferencesResult = await DatabaseService.getNotificationPreferences(userId)
      if (preferencesResult.data?.onesignal_player_id) {
        const playerId = preferencesResult.data.onesignal_player_id
        playerIds.push(playerId)
        userPlayerMap[playerId] = userId
      }
    }
    
    if (playerIds.length === 0) {
      return userIds.map(() => ({
        success: false,
        error: 'No users have push notifications enabled'
      }))
    }
    
    // Send bulk notification
    const bulkResult = await this.sendViaOneSignal({
      playerIds,
      title: notification.title,
      body: notification.body,
      url: notification.url,
      data: notification.data,
      icon: notification.icon
    })
    
    // Return individual results (simplified - in production you'd want more detailed tracking)
    return userIds.map(userId => {
      const hasPlayerId = Object.values(userPlayerMap).includes(userId)
      return hasPlayerId ? bulkResult : {
        success: false,
        error: 'User has not enabled push notifications'
      }
    })
  }
  
  /**
   * Send notification via OneSignal REST API
   */
  private static async sendViaOneSignal(params: {
    playerIds: string[]
    title: string
    body: string
    url?: string
    data?: Record<string, any>
    icon?: string
  }): Promise<PushNotificationResult> {
    try {
      const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
      const restApiKey = process.env.ONESIGNAL_REST_API_KEY
      
      if (!appId || !restApiKey) {
        return {
          success: false,
          error: 'OneSignal configuration missing'
        }
      }
      
      const payload = {
        app_id: appId,
        include_player_ids: params.playerIds,
        headings: { en: params.title },
        contents: { en: params.body },
        url: params.url,
        data: params.data,
        small_icon: params.icon || 'ic_notification',
        large_icon: params.icon,
        // Additional OneSignal options
        android_accent_color: '3B82F6', // Blue color
        android_visibility: 1, // Public visibility
        priority: 10, // High priority
        ttl: 86400 // 24 hours TTL
      }
      
      const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${restApiKey}`
        },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`OneSignal API error: ${errorData.errors?.[0] || response.statusText}`)
      }
      
      const result = await response.json()
      
      return {
        success: true,
        messageId: result.id
      }
      
    } catch (error) {
      console.error('❌ OneSignal API error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OneSignal API error'
      }
    }
  }
  
  /**
   * Check if current time is within user's quiet hours
   */
  private static async isInQuietHours(userId: string): Promise<boolean> {
    try {
      const preferencesResult = await DatabaseService.getNotificationPreferences(userId)
      if (preferencesResult.error || !preferencesResult.data) {
        return false
      }
      
      const preferences = preferencesResult.data
      if (!preferences.push_quiet_hours_start || !preferences.push_quiet_hours_end) {
        return false
      }
      
      const now = new Date()
      const currentTime = now.getHours() * 60 + now.getMinutes() // Minutes since midnight
      
      const [startHour, startMin] = preferences.push_quiet_hours_start.split(':').map(Number)
      const [endHour, endMin] = preferences.push_quiet_hours_end.split(':').map(Number)
      
      const startTime = startHour * 60 + startMin
      const endTime = endHour * 60 + endMin
      
      // Handle quiet hours that span midnight
      if (startTime > endTime) {
        return currentTime >= startTime || currentTime <= endTime
      } else {
        return currentTime >= startTime && currentTime <= endTime
      }
      
    } catch (error) {
      console.error('Error checking quiet hours:', error)
      return false
    }
  }
  
  /**
   * Register a user's device for push notifications
   */
  static async registerDevice(userId: string, playerId: string): Promise<boolean> {
    try {
      console.log(`📱 Registering device for user ${userId}: ${playerId}`)
      
      // Update user's notification preferences with OneSignal player ID
      const preferencesResult = await DatabaseService.getNotificationPreferences(userId)
      
      if (preferencesResult.data) {
        // Update existing preferences
        await DatabaseService.updateNotificationPreference(preferencesResult.data.id, {
          onesignal_player_id: playerId,
          push_enabled: true
        })
      } else {
        // Create new preferences
        await DatabaseService.createNotificationPreference({
          user_id: userId,
          email_enabled: true,
          email_reports: true,
          email_tasks: true,
          email_invoices: true,
          email_bookings: true,
          email_maintenance: true,
          email_marketing: false,
          push_enabled: true,
          push_tasks: true,
          push_urgent_only: false,
          in_app_enabled: true,
          in_app_sound: true,
          onesignal_player_id: playerId
        })
      }
      
      console.log('✅ Device registered successfully')
      return true
      
    } catch (error) {
      console.error('❌ Error registering device:', error)
      return false
    }
  }
  
  /**
   * Unregister a user's device from push notifications
   */
  static async unregisterDevice(userId: string): Promise<boolean> {
    try {
      console.log(`📱 Unregistering device for user ${userId}`)
      
      const preferencesResult = await DatabaseService.getNotificationPreferences(userId)
      if (preferencesResult.data) {
        await DatabaseService.updateNotificationPreference(preferencesResult.data.id, {
          onesignal_player_id: undefined,
          push_enabled: false
        })
      }
      
      console.log('✅ Device unregistered successfully')
      return true
      
    } catch (error) {
      console.error('❌ Error unregistering device:', error)
      return false
    }
  }
}
