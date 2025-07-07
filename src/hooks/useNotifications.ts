import { useState, useEffect, useCallback } from 'react'
// TODO: Update types when new auth system is implemented
// import { Notification, NotificationPreference } from '@/types/supabase'
import { NEXT_PUBLIC_ONESIGNAL_APP_ID } from '@/lib/env'
import toast from 'react-hot-toast'

// Temporary types until new auth system is implemented
interface Notification {
  id: string
  title: string
  message: string
  read: boolean
  created_at: string
}

interface NotificationPreference {
  id: string
  email_notifications: boolean
  push_notifications: boolean
}

export interface UseNotificationsOptions {
  autoLoad?: boolean
  pollInterval?: number // in milliseconds
}

export interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  preferences: NotificationPreference | null
  loadNotifications: () => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  updatePreferences: (updates: Partial<NotificationPreference>) => Promise<void>
  registerForPush: () => Promise<void>
  unregisterFromPush: () => Promise<void>
}

/**
 * Hook for managing user notifications and preferences
 * TODO: Implement with new auth system
 */
export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  // Temporary implementation - returns empty data until new auth system is ready
  const [notifications] = useState<Notification[]>([])
  const [preferences] = useState<NotificationPreference | null>(null)
  const [loading] = useState(false)
  const [error] = useState<string | null>(null)

  // Stub implementations until new auth system is ready
  const loadNotifications = useCallback(async () => {
    // TODO: Implement with new auth system
    console.log('loadNotifications called - stub implementation')
  }, [])

  const markAsRead = useCallback(async (notificationId: string) => {
    // TODO: Implement with new auth system
    console.log('markAsRead called - stub implementation', notificationId)
  }, [])

  const markAllAsRead = useCallback(async () => {
    // TODO: Implement with new auth system
    console.log('markAllAsRead called - stub implementation')
  }, [])

  const updatePreferences = useCallback(async (updates: Partial<NotificationPreference>) => {
    // TODO: Implement with new auth system
    console.log('updatePreferences called - stub implementation', updates)
  }, [])

  const registerForPush = useCallback(async () => {
    // TODO: Implement with new auth system
    console.log('registerForPush called - stub implementation')
  }, [])

  const unregisterFromPush = useCallback(async () => {
    // TODO: Implement with new auth system
    console.log('unregisterFromPush called - stub implementation')
  }, [])

  return {
    notifications,
    unreadCount: 0, // No unread notifications in stub
    loading,
    error,
    preferences,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    updatePreferences,
    registerForPush,
    unregisterFromPush,
  }
}
    try {
      const result = await SupabaseService.markNotificationAsRead(notificationId)
      
      if (result.error) {
        throw new Error(result.error.message)
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, status: 'read', read_at: new Date().toISOString() }
            : notification
        )
      )
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark notification as read'
      toast.error(errorMessage)
      console.error('Error marking notification as read:', err)
    }
  }
  
  /**
   * Mark all notifications as read
   */
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => n.status !== 'read')
      
      for (const notification of unreadNotifications) {
        await SupabaseService.markNotificationAsRead(notification.id)
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({
          ...notification,
          status: 'read' as const,
          read_at: notification.read_at || new Date().toISOString()
        }))
      )
      
      toast.success('All notifications marked as read')
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark all notifications as read'
      toast.error(errorMessage)
      console.error('Error marking all notifications as read:', err)
    }
  }
  
  /**
   * Update notification preferences
   */
  const updatePreferences = async (updates: Partial<NotificationPreference>) => {
    if (!user || !preferences) return
    
    try {
      const result = await SupabaseService.updateNotificationPreference(preferences.id, updates)
      
      if (result.error) {
        throw new Error(result.error.message)
      }
      
      setPreferences(result.data)
      toast.success('Notification preferences updated')
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update preferences'
      toast.error(errorMessage)
      console.error('Error updating notification preferences:', err)
    }
  }
  
  /**
   * Register for push notifications using OneSignal
   */
  const registerForPush = async () => {
    if (!user) return
    
    try {
      // Check if OneSignal is available
      if (typeof window === 'undefined' || !window.OneSignal) {
        throw new Error('OneSignal not available')
      }
      
      // Initialize OneSignal if not already done
      await window.OneSignal.init({
        appId: NEXT_PUBLIC_ONESIGNAL_APP_ID!,
        allowLocalhostAsSecureOrigin: true
      })
      
      // Request permission and get player ID
      await window.OneSignal.showSlidedownPrompt()
      const playerId = await window.OneSignal.getPlayerId()
      
      if (!playerId) {
        throw new Error('Failed to get OneSignal player ID')
      }
      
      // Register device with our backend
      const { PushNotificationService } = await import('@/lib/notifications/pushNotificationService')
      const success = await PushNotificationService.registerDevice(user.id, playerId)
      
      if (success) {
        toast.success('Push notifications enabled')
        await loadPreferences() // Reload preferences
      } else {
        throw new Error('Failed to register device')
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to enable push notifications'
      toast.error(errorMessage)
      console.error('Error registering for push notifications:', err)
    }
  }
  
  /**
   * Unregister from push notifications
   */
  const unregisterFromPush = async () => {
    if (!user) return
    
    try {
      const { PushNotificationService } = await import('@/lib/notifications/pushNotificationService')
      const success = await PushNotificationService.unregisterDevice(user.id)
      
      if (success) {
        toast.success('Push notifications disabled')
        await loadPreferences() // Reload preferences
      } else {
        throw new Error('Failed to unregister device')
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disable push notifications'
      toast.error(errorMessage)
      console.error('Error unregistering from push notifications:', err)
    }
  }
  
  // Calculate unread count
  const unreadCount = notifications.filter(n => n.status !== 'read').length
  
  // Auto-load notifications and preferences on mount and user change
  useEffect(() => {
    if (autoLoad && user) {
      loadNotifications()
      loadPreferences()
    }
  }, [autoLoad, user, loadNotifications, loadPreferences])
  
  // Set up polling for new notifications
  useEffect(() => {
    if (!user || !pollInterval) return
    
    const interval = setInterval(() => {
      loadNotifications()
    }, pollInterval)
    
    return () => clearInterval(interval)
  }, [user, pollInterval, loadNotifications])
  
  // Listen for OneSignal notifications when app is in foreground
  useEffect(() => {
    if (typeof window === 'undefined' || !window.OneSignal) return
    
    const handleNotificationReceived = (notification: any) => {
      console.log('OneSignal notification received:', notification)
      
      // Show toast notification
      toast.success(notification.title || 'New notification')
      
      // Reload notifications to get the latest
      loadNotifications()
    }
    
    window.OneSignal?.on('notificationDisplay', handleNotificationReceived)
    
    return () => {
      window.OneSignal?.off('notificationDisplay', handleNotificationReceived)
    }
  }, [loadNotifications])
  
  return {
    notifications,
    unreadCount,
    loading,
    error,
    preferences,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    updatePreferences,
    registerForPush,
    unregisterFromPush
  }
}

// Extend Window interface for OneSignal
declare global {
  interface Window {
    OneSignal?: {
      init: (config: any) => Promise<void>
      showSlidedownPrompt: () => Promise<void>
      getPlayerId: () => Promise<string | null>
      on: (event: string, callback: (data: any) => void) => void
      off: (event: string, callback: (data: any) => void) => void
    }
  }
}
