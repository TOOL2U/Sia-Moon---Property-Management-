import { useState, useEffect, useCallback } from 'react'
import { Notification, NotificationPreference } from '@/types/supabase'
import { useAuth } from '@/contexts/SupabaseAuthContext'
import SupabaseService from '@/lib/supabaseService'
import toast from 'react-hot-toast'

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
 */
export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const { autoLoad = true, pollInterval = 30000 } = options // Poll every 30 seconds by default
  const { profile: user } = useAuth()
  
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  /**
   * Load notifications for the current user
   */
  const loadNotifications = useCallback(async () => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)
      
      const result = await SupabaseService.getNotificationsByUser(user.id)
      
      if (result.error) {
        throw new Error(result.error.message)
      }
      
      setNotifications(result.data || [])
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load notifications'
      setError(errorMessage)
      console.error('Error loading notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [user])
  
  /**
   * Load user notification preferences
   */
  const loadPreferences = useCallback(async () => {
    if (!user) return
    
    try {
      const result = await SupabaseService.getNotificationPreferences(user.id)
      
      if (result.error) {
        console.error('Error loading preferences:', result.error)
        return
      }
      
      setPreferences(result.data)
      
    } catch (err) {
      console.error('Error loading notification preferences:', err)
    }
  }, [user])
  
  /**
   * Mark a notification as read
   */
  const markAsRead = async (notificationId: string) => {
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
        appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
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
