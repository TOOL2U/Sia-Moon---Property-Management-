/**
 * React Native Notification Handler
 * Handles FCM push notifications and real-time job updates for Sia Moon staff app
 */

import React, { useEffect, useRef, useState } from 'react'
import { Alert, AppState, Platform } from 'react-native'
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
import notifee, { AndroidImportance, AndroidVisibility, EventType } from '@notifee/react-native'
import { useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuth } from '../contexts/AuthContext'
import { JobService } from '../services/JobService'
import { NotificationService } from '../services/NotificationService'

interface NotificationHandlerProps {
  children: React.ReactNode
}

interface JobNotificationData {
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

export const NotificationHandler: React.FC<NotificationHandlerProps> = ({ children }) => {
  const navigation = useNavigation()
  const { user, isAuthenticated } = useAuth()
  const appState = useRef(AppState.currentState)
  const [initializing, setInitializing] = useState(true)

  // Initialize notification system
  useEffect(() => {
    if (isAuthenticated && user) {
      initializeNotifications()
    }
  }, [isAuthenticated, user])

  // Initialize FCM and notification channels
  const initializeNotifications = async () => {
    try {
      console.log('📱 Initializing notification system...')

      // Request notification permissions
      const authStatus = await messaging().requestPermission()
      const enabled = 
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL

      if (!enabled) {
        console.log('❌ Notification permission denied')
        return
      }

      // Create notification channels (Android)
      if (Platform.OS === 'android') {
        await createNotificationChannels()
      }

      // Get FCM token and register with backend
      const token = await messaging().getToken()
      if (token && user) {
        await registerDeviceToken(token)
      }

      // Set up message handlers
      setupMessageHandlers()

      // Set up foreground notification handler
      setupForegroundNotificationHandler()

      // Handle notification interactions
      setupNotificationInteractionHandlers()

      console.log('✅ Notification system initialized')
      setInitializing(false)

    } catch (error) {
      console.error('❌ Error initializing notifications:', error)
      setInitializing(false)
    }
  }

  // Create Android notification channels
  const createNotificationChannels = async () => {
    try {
      // Job assignments channel
      await notifee.createChannel({
        id: 'job_assignments',
        name: 'Job Assignments',
        description: 'Notifications for new job assignments',
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        sound: 'default',
        vibration: true,
        lights: true,
        lightColor: '#6366f1' // Indigo color
      })

      // Job reminders channel
      await notifee.createChannel({
        id: 'job_reminders',
        name: 'Job Reminders',
        description: 'Reminders for upcoming jobs',
        importance: AndroidImportance.DEFAULT,
        sound: 'default'
      })

      // System alerts channel
      await notifee.createChannel({
        id: 'system_alerts',
        name: 'System Alerts',
        description: 'Important system notifications',
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        sound: 'urgent_alert',
        vibration: true
      })

      console.log('✅ Notification channels created')

    } catch (error) {
      console.error('❌ Error creating notification channels:', error)
    }
  }

  // Register device token with backend
  const registerDeviceToken = async (token: string) => {
    try {
      if (!user?.id) return

      const response = await fetch('/api/mobile/device-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'sia-moon-mobile-app-2025-secure-key',
          'X-Mobile-Secret': 'mobile-app-sync-2025-secure'
        },
        body: JSON.stringify({
          staffId: user.id,
          deviceToken: token,
          platform: Platform.OS,
          appVersion: '1.0.0'
        })
      })

      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Device token registered successfully')
        await AsyncStorage.setItem('fcm_token', token)
      } else {
        console.error('❌ Failed to register device token:', result.error)
      }

    } catch (error) {
      console.error('❌ Error registering device token:', error)
    }
  }

  // Set up FCM message handlers
  const setupMessageHandlers = () => {
    // Handle background/quit state messages
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('📱 Background message received:', remoteMessage)
      await handleBackgroundMessage(remoteMessage)
    })

    // Handle foreground messages
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.log('📱 Foreground message received:', remoteMessage)
      await handleForegroundMessage(remoteMessage)
    })

    // Handle token refresh
    messaging().onTokenRefresh(async (token) => {
      console.log('🔄 FCM token refreshed:', token)
      if (user?.id) {
        await registerDeviceToken(token)
      }
    })

    return unsubscribe
  }

  // Handle background messages
  const handleBackgroundMessage = async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
    try {
      const { data, notification } = remoteMessage

      if (data?.type === 'job_assigned') {
        // Store job notification for when app opens
        await AsyncStorage.setItem('pending_job_notification', JSON.stringify(data))
        
        // Show local notification
        await showJobNotification({
          title: notification?.title || '🎯 New Job Assignment',
          body: notification?.body || 'You have a new job assignment',
          data: data as any
        })
      }

    } catch (error) {
      console.error('❌ Error handling background message:', error)
    }
  }

  // Handle foreground messages
  const handleForegroundMessage = async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
    try {
      const { data, notification } = remoteMessage

      if (data?.type === 'job_assigned') {
        // Show in-app notification
        Alert.alert(
          notification?.title || '🎯 New Job Assignment',
          notification?.body || 'You have a new job assignment',
          [
            {
              text: 'View Job',
              onPress: () => navigateToJob(data.jobId as string)
            },
            {
              text: 'Later',
              style: 'cancel'
            }
          ]
        )

        // Update job list in background
        await JobService.syncJobs()
      }

    } catch (error) {
      console.error('❌ Error handling foreground message:', error)
    }
  }

  // Set up foreground notification handler with Notifee
  const setupForegroundNotificationHandler = () => {
    return notifee.onForegroundEvent(({ type, detail }) => {
      switch (type) {
        case EventType.DISMISSED:
          console.log('🔔 Notification dismissed:', detail.notification?.id)
          break
          
        case EventType.PRESS:
          console.log('🖱️ Notification pressed:', detail.notification?.data)
          handleNotificationPress(detail.notification?.data)
          break
          
        case EventType.ACTION_PRESS:
          console.log('⚡ Notification action pressed:', detail.pressAction?.id)
          handleNotificationAction(detail.pressAction?.id, detail.notification?.data)
          break
      }
    })
  }

  // Set up notification interaction handlers
  const setupNotificationInteractionHandlers = () => {
    // Handle notification opened app
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('📱 Notification opened app:', remoteMessage)
      
      if (remoteMessage.data?.jobId) {
        navigateToJob(remoteMessage.data.jobId as string)
      }
    })

    // Check if app was opened from a notification (quit state)
    messaging().getInitialNotification().then((remoteMessage) => {
      if (remoteMessage) {
        console.log('📱 App opened from notification (quit state):', remoteMessage)
        
        if (remoteMessage.data?.jobId) {
          // Navigate after app is ready
          setTimeout(() => {
            navigateToJob(remoteMessage.data!.jobId as string)
          }, 1000)
        }
      }
    })
  }

  // Show job notification using Notifee
  const showJobNotification = async (notificationData: {
    title: string
    body: string
    data: JobNotificationData
  }) => {
    try {
      const { title, body, data } = notificationData

      // Determine channel and importance based on priority
      const channelId = data.type === 'job_assigned' ? 'job_assignments' : 'job_reminders'
      const importance = data.priority === 'urgent' 
        ? AndroidImportance.HIGH 
        : AndroidImportance.DEFAULT

      await notifee.displayNotification({
        title,
        body,
        data: data as any,
        android: {
          channelId,
          importance,
          smallIcon: 'ic_notification',
          largeIcon: 'ic_launcher',
          color: '#6366f1',
          pressAction: {
            id: 'default',
            launchActivity: 'default'
          },
          actions: [
            {
              title: '👀 View Job',
              pressAction: {
                id: 'view_job'
              }
            },
            {
              title: '✅ Accept',
              pressAction: {
                id: 'accept_job'
              }
            },
            {
              title: '❌ Dismiss',
              pressAction: {
                id: 'dismiss'
              }
            }
          ],
          style: {
            type: 1, // BigTextStyle
            text: `${data.propertyName}\n${data.scheduledDate} ${data.scheduledStartTime || ''}\nDuration: ${data.estimatedDuration} min`
          }
        },
        ios: {
          categoryId: 'job_assignment',
          attachments: [
            {
              url: 'https://siamoon.com/assets/job-icon.png',
              thumbnailHidden: false
            }
          ]
        }
      })

    } catch (error) {
      console.error('❌ Error showing notification:', error)
    }
  }

  // Handle notification press
  const handleNotificationPress = (data: any) => {
    if (data?.jobId) {
      navigateToJob(data.jobId)
    }
  }

  // Handle notification action press
  const handleNotificationAction = async (actionId: string | undefined, data: any) => {
    switch (actionId) {
      case 'view_job':
        if (data?.jobId) {
          navigateToJob(data.jobId)
        }
        break
        
      case 'accept_job':
        if (data?.jobId) {
          await acceptJobFromNotification(data.jobId)
        }
        break
        
      case 'dismiss':
        // Just dismiss the notification
        break
    }
  }

  // Navigate to job details
  const navigateToJob = (jobId: string) => {
    try {
      navigation.navigate('JobDetails' as never, { jobId } as never)
    } catch (error) {
      console.error('❌ Error navigating to job:', error)
    }
  }

  // Accept job directly from notification
  const acceptJobFromNotification = async (jobId: string) => {
    try {
      const result = await JobService.updateJobStatus(jobId, 'accepted', 'Accepted from notification')
      
      if (result.success) {
        Alert.alert('✅ Success', 'Job accepted successfully!')
        navigateToJob(jobId)
      } else {
        Alert.alert('❌ Error', 'Failed to accept job. Please try again.')
      }

    } catch (error) {
      console.error('❌ Error accepting job from notification:', error)
      Alert.alert('❌ Error', 'Failed to accept job. Please try again.')
    }
  }

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - check for pending notifications
        checkPendingNotifications()
      }
      appState.current = nextAppState
    })

    return () => subscription?.remove()
  }, [])

  // Check for pending notifications when app becomes active
  const checkPendingNotifications = async () => {
    try {
      const pendingNotification = await AsyncStorage.getItem('pending_job_notification')
      
      if (pendingNotification) {
        const data = JSON.parse(pendingNotification)
        
        Alert.alert(
          '🎯 New Job Assignment',
          `You have a new ${data.jobType} job at ${data.propertyName}`,
          [
            {
              text: 'View Job',
              onPress: () => navigateToJob(data.jobId)
            },
            {
              text: 'Later',
              style: 'cancel'
            }
          ]
        )

        // Clear pending notification
        await AsyncStorage.removeItem('pending_job_notification')
      }

    } catch (error) {
      console.error('❌ Error checking pending notifications:', error)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up listeners
      messaging().onMessage(() => {})
      messaging().onNotificationOpenedApp(() => {})
    }
  }, [])

  if (initializing) {
    return null // Or loading component
  }

  return <>{children}</>
}

export default NotificationHandler

/**
 * Mobile Job Service for notification handling
 */
export class MobileJobService {
  private static readonly API_BASE = 'https://your-app-domain.com/api'
  private static readonly API_KEY = 'sia-moon-mobile-app-2025-secure-key'
  private static readonly MOBILE_SECRET = 'mobile-app-sync-2025-secure'

  /**
   * Sync jobs from server
   */
  static async syncJobs(staffId: string): Promise<{ success: boolean; jobs?: any[]; error?: string }> {
    try {
      const response = await fetch(`${this.API_BASE}/mobile/jobs?staffId=${staffId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.API_KEY,
          'X-Mobile-Secret': this.MOBILE_SECRET
        }
      })

      const result = await response.json()

      if (result.success) {
        // Store jobs locally
        await AsyncStorage.setItem('cached_jobs', JSON.stringify(result.data.jobs))
        return { success: true, jobs: result.data.jobs }
      } else {
        return { success: false, error: result.error }
      }

    } catch (error) {
      console.error('❌ Error syncing jobs:', error)
      return { success: false, error: 'Failed to sync jobs' }
    }
  }

  /**
   * Update job status
   */
  static async updateJobStatus(
    jobId: string,
    status: string,
    notes?: string,
    location?: { latitude: number; longitude: number }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.API_BASE}/mobile/jobs`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.API_KEY,
          'X-Mobile-Secret': this.MOBILE_SECRET
        },
        body: JSON.stringify({
          jobId,
          status,
          notes,
          location
        })
      })

      const result = await response.json()
      return result

    } catch (error) {
      console.error('❌ Error updating job status:', error)
      return { success: false, error: 'Failed to update job status' }
    }
  }

  /**
   * Acknowledge notification
   */
  static async acknowledgeNotification(
    jobId: string,
    staffId: string,
    notificationId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.API_BASE}/mobile/notifications/acknowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.API_KEY,
          'X-Mobile-Secret': this.MOBILE_SECRET
        },
        body: JSON.stringify({
          jobId,
          staffId,
          notificationId
        })
      })

      const result = await response.json()
      return result

    } catch (error) {
      console.error('❌ Error acknowledging notification:', error)
      return { success: false, error: 'Failed to acknowledge notification' }
    }
  }
}
