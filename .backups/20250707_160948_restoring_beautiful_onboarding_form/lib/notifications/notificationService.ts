import DatabaseService from '@/lib/dbService'
import { Notification, NotificationPreference, User } from '@/lib/db'
import { EmailService } from './emailService'
import { PushNotificationService } from './pushNotificationService'

export interface NotificationRequest {
  userId: string
  category: 'report_generated' | 'task_assigned' | 'task_completed' | 'invoice_created' | 'booking_confirmed' | 'maintenance_required' | 'system_alert'
  title: string
  message: string
  data?: Record<string, any>
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  channels?: ('email' | 'push' | 'in_app')[]
  
  // Email specific
  emailSubject?: string
  emailTemplate?: string
  
  // Push specific
  pushTitle?: string
  pushBody?: string
  pushUrl?: string
}

export interface NotificationResult {
  success: boolean
  notificationId?: string
  deliveryResults: {
    email?: { success: boolean; error?: string }
    push?: { success: boolean; error?: string }
    inApp?: { success: boolean; error?: string }
  }
  error?: string
}

/**
 * Central notification service for managing all types of notifications
 */
export class NotificationService {
  
  /**
   * Send a notification to a user across multiple channels
   */
  static async sendNotification(request: NotificationRequest): Promise<NotificationResult> {
    try {
      console.log(`📢 Sending notification to user ${request.userId}: ${request.title}`)
      
      // Get user and their notification preferences
      const userResult = await DatabaseService.getUser(request.userId)
      if (userResult.error || !userResult.data) {
        return {
          success: false,
          error: 'User not found',
          deliveryResults: {}
        }
      }
      
      const user = userResult.data
      const preferences = await this.getUserNotificationPreferences(request.userId)
      
      // Determine which channels to use
      const channels = request.channels || this.getDefaultChannels(request.category, preferences)
      
      // Create the notification record
      const notification: Omit<Notification, 'id' | 'created_at' | 'updated_at'> = {
        user_id: request.userId,
        type: 'in_app', // Default type, will be updated based on delivery
        category: request.category,
        title: request.title,
        message: request.message,
        data: request.data,
        status: 'pending',
        priority: request.priority || 'normal',
        channels,
        email_subject: request.emailSubject,
        email_template: request.emailTemplate,
        push_title: request.pushTitle || request.title,
        push_body: request.pushBody || request.message,
        push_url: request.pushUrl
      }
      
      const notificationResult = await DatabaseService.createNotification(notification)
      if (notificationResult.error) {
        return {
          success: false,
          error: notificationResult.error.message,
          deliveryResults: {}
        }
      }
      
      const savedNotification = notificationResult.data!
      const deliveryResults: NotificationResult['deliveryResults'] = {}
      
      // Send via each channel
      for (const channel of channels) {
        try {
          switch (channel) {
            case 'email':
              if (preferences.email_enabled && this.shouldSendEmailForCategory(request.category, preferences)) {
                const emailResult = await EmailService.sendNotificationEmail({
                  to: user.email,
                  subject: request.emailSubject || request.title,
                  template: request.emailTemplate || 'default',
                  data: {
                    user_name: user.name,
                    title: request.title,
                    message: request.message,
                    ...request.data
                  }
                })
                
                deliveryResults.email = emailResult
                
                if (emailResult.success) {
                  await DatabaseService.updateNotification(savedNotification.id, {
                    status: 'sent',
                    sent_at: new Date().toISOString()
                  })
                }
              } else {
                deliveryResults.email = { success: false, error: 'Email notifications disabled' }
              }
              break
              
            case 'push':
              if (preferences.push_enabled && this.shouldSendPushForCategory(request.category, preferences)) {
                const pushResult = await PushNotificationService.sendPushNotification({
                  userId: request.userId,
                  title: request.pushTitle || request.title,
                  body: request.pushBody || request.message,
                  url: request.pushUrl,
                  data: request.data
                })
                
                deliveryResults.push = pushResult
                
                if (pushResult.success) {
                  await DatabaseService.updateNotification(savedNotification.id, {
                    status: 'sent',
                    sent_at: new Date().toISOString()
                  })
                }
              } else {
                deliveryResults.push = { success: false, error: 'Push notifications disabled' }
              }
              break
              
            case 'in_app':
              // In-app notifications are always created (stored in database)
              deliveryResults.inApp = { success: true }
              await DatabaseService.updateNotification(savedNotification.id, {
                status: 'delivered',
                delivered_at: new Date().toISOString()
              })
              break
          }
        } catch (error) {
          console.error(`❌ Error sending ${channel} notification:`, error)
          deliveryResults[channel as keyof typeof deliveryResults] = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      }
      
      // Update final status
      const hasSuccessfulDelivery = Object.values(deliveryResults).some(result => result?.success)
      if (hasSuccessfulDelivery) {
        await DatabaseService.updateNotification(savedNotification.id, {
          status: 'delivered',
          delivered_at: new Date().toISOString()
        })
      } else {
        await DatabaseService.updateNotification(savedNotification.id, {
          status: 'failed'
        })
      }
      
      console.log(`✅ Notification sent successfully: ${savedNotification.id}`)
      
      return {
        success: hasSuccessfulDelivery,
        notificationId: savedNotification.id,
        deliveryResults
      }
      
    } catch (error) {
      console.error('❌ Error sending notification:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        deliveryResults: {}
      }
    }
  }
  
  /**
   * Send notifications to multiple users
   */
  static async sendBulkNotification(
    userIds: string[], 
    request: Omit<NotificationRequest, 'userId'>
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = []
    
    for (const userId of userIds) {
      const result = await this.sendNotification({
        ...request,
        userId
      })
      results.push(result)
    }
    
    return results
  }
  
  /**
   * Get user's notification preferences
   */
  private static async getUserNotificationPreferences(userId: string): Promise<NotificationPreference> {
    // Try to get existing preferences
    const preferencesResult = await DatabaseService.getNotificationPreferences(userId)
    
    if (preferencesResult.data) {
      return preferencesResult.data
    }
    
    // Create default preferences if none exist
    const defaultPreferences: Omit<NotificationPreference, 'id' | 'created_at' | 'updated_at'> = {
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
      in_app_sound: true
    }
    
    const createResult = await DatabaseService.createNotificationPreference(defaultPreferences)
    return createResult.data || defaultPreferences as NotificationPreference
  }
  
  /**
   * Determine default channels based on category and preferences
   */
  private static getDefaultChannels(
    category: string, 
    preferences: NotificationPreference
  ): ('email' | 'push' | 'in_app')[] {
    const channels: ('email' | 'push' | 'in_app')[] = []
    
    // Always include in-app notifications
    if (preferences.in_app_enabled) {
      channels.push('in_app')
    }
    
    // Add email based on category and preferences
    if (preferences.email_enabled) {
      switch (category) {
        case 'report_generated':
          if (preferences.email_reports) channels.push('email')
          break
        case 'task_assigned':
        case 'task_completed':
          if (preferences.email_tasks) channels.push('email')
          break
        case 'invoice_created':
          if (preferences.email_invoices) channels.push('email')
          break
        case 'booking_confirmed':
          if (preferences.email_bookings) channels.push('email')
          break
        case 'maintenance_required':
          if (preferences.email_maintenance) channels.push('email')
          break
        case 'system_alert':
          channels.push('email') // Always send system alerts via email
          break
      }
    }
    
    // Add push notifications based on preferences
    if (preferences.push_enabled) {
      if (category === 'task_assigned' && preferences.push_tasks) {
        channels.push('push')
      } else if (['maintenance_required', 'system_alert'].includes(category)) {
        channels.push('push') // Always send urgent notifications via push
      } else if (!preferences.push_urgent_only) {
        channels.push('push')
      }
    }
    
    return channels
  }
  
  /**
   * Check if email should be sent for a specific category
   */
  private static shouldSendEmailForCategory(
    category: string, 
    preferences: NotificationPreference
  ): boolean {
    switch (category) {
      case 'report_generated': return preferences.email_reports
      case 'task_assigned':
      case 'task_completed': return preferences.email_tasks
      case 'invoice_created': return preferences.email_invoices
      case 'booking_confirmed': return preferences.email_bookings
      case 'maintenance_required': return preferences.email_maintenance
      case 'system_alert': return true // Always send system alerts
      default: return true
    }
  }
  
  /**
   * Check if push notification should be sent for a specific category
   */
  private static shouldSendPushForCategory(
    category: string, 
    preferences: NotificationPreference
  ): boolean {
    if (preferences.push_urgent_only) {
      return ['maintenance_required', 'system_alert'].includes(category)
    }
    
    switch (category) {
      case 'task_assigned': return preferences.push_tasks
      case 'maintenance_required':
      case 'system_alert': return true // Always send urgent notifications
      default: return true
    }
  }
}
