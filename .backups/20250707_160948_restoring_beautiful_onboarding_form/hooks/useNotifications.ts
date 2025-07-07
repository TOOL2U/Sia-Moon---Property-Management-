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
