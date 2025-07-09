import { useState, useCallback } from 'react'
import { Notification as DbNotification, NotificationPreference as DbNotificationPreference } from '@/lib/db'

// Re-export the types for consistency
export type Notification = DbNotification
export type NotificationPreference = DbNotificationPreference

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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
