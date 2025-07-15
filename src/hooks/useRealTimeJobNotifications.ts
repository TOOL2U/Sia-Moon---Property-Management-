/**
 * Real-Time Job Notifications Hook
 * Provides real-time updates for job assignments and notifications
 */

import { useState, useEffect, useCallback } from 'react'
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore'
import { getDb } from '@/lib/firebase'
import { EnhancedNotificationService, NotificationData } from '@/lib/services/enhancedNotificationService'

export interface JobAssignment {
  id: string
  jobId: string
  title: string
  propertyName: string
  taskType: string
  status: 'assigned' | 'accepted' | 'in-progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  scheduledDate: string
  scheduledStartTime?: string
  deadline: string
  estimatedDuration: number
  specialInstructions?: string
  assignedBy: {
    id: string
    name: string
  }
  createdAt: any
  updatedAt: any
}

export interface UseRealTimeJobNotificationsReturn {
  // Job assignments
  jobAssignments: JobAssignment[]
  pendingJobs: JobAssignment[]
  activeJobs: JobAssignment[]
  completedJobs: JobAssignment[]
  
  // Notifications
  notifications: NotificationData[]
  unreadCount: number
  
  // Loading states
  isLoading: boolean
  error: string | null
  
  // Actions
  acceptJob: (jobId: string) => Promise<void>
  declineJob: (jobId: string) => Promise<void>
  markNotificationAsRead: (notificationId: string) => Promise<void>
  markAllNotificationsAsRead: () => Promise<void>
  refreshData: () => void
}

export function useRealTimeJobNotifications(
  staffId: string | null
): UseRealTimeJobNotificationsReturn {
  const [jobAssignments, setJobAssignments] = useState<JobAssignment[]>([])
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const db = getDb()

  // Set up real-time listener for job assignments
  useEffect(() => {
    if (!staffId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    const jobAssignmentsQuery = query(
      collection(db, 'task_assignments'),
      where('assignedStaffId', '==', staffId),
      orderBy('createdAt', 'desc'),
      limit(100)
    )

    const unsubscribeJobs = onSnapshot(
      jobAssignmentsQuery,
      (snapshot) => {
        const jobs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as JobAssignment))
        
        setJobAssignments(jobs)
        setIsLoading(false)
        
        console.log(`📋 Real-time job assignments updated: ${jobs.length} jobs`)
      },
      (error) => {
        console.error('❌ Error listening to job assignments:', error)
        setError('Failed to load job assignments')
        setIsLoading(false)
      }
    )

    return () => {
      unsubscribeJobs()
    }
  }, [staffId, db])

  // Set up real-time listener for notifications
  useEffect(() => {
    if (!staffId) return

    const unsubscribeNotifications = EnhancedNotificationService.setupNotificationListener(
      staffId,
      (newNotifications) => {
        setNotifications(newNotifications)
        console.log(`🔔 Real-time notifications updated: ${newNotifications.length} notifications`)
      }
    )

    return () => {
      unsubscribeNotifications()
    }
  }, [staffId])

  // Computed values
  const pendingJobs = jobAssignments.filter(job => job.status === 'assigned')
  const activeJobs = jobAssignments.filter(job => 
    job.status === 'accepted' || job.status === 'in-progress'
  )
  const completedJobs = jobAssignments.filter(job => job.status === 'completed')
  const unreadCount = notifications.filter(n => n.status !== 'read').length

  // Accept job assignment
  const acceptJob = useCallback(async (jobId: string) => {
    if (!staffId) return

    try {
      const jobRef = doc(db, 'task_assignments', jobId)
      await updateDoc(jobRef, {
        status: 'accepted',
        acceptedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        syncVersion: Date.now()
      })

      console.log(`✅ Job ${jobId} accepted by staff ${staffId}`)
    } catch (error) {
      console.error('❌ Error accepting job:', error)
      throw error
    }
  }, [staffId, db])

  // Decline job assignment
  const declineJob = useCallback(async (jobId: string) => {
    if (!staffId) return

    try {
      const jobRef = doc(db, 'task_assignments', jobId)
      await updateDoc(jobRef, {
        status: 'declined',
        declinedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        syncVersion: Date.now()
      })

      console.log(`❌ Job ${jobId} declined by staff ${staffId}`)
    } catch (error) {
      console.error('❌ Error declining job:', error)
      throw error
    }
  }, [staffId, db])

  // Mark notification as read
  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    if (!staffId) return

    try {
      await EnhancedNotificationService.markNotificationAsRead(notificationId, staffId)
      console.log(`📖 Notification ${notificationId} marked as read`)
    } catch (error) {
      console.error('❌ Error marking notification as read:', error)
      throw error
    }
  }, [staffId])

  // Mark all notifications as read
  const markAllNotificationsAsRead = useCallback(async () => {
    if (!staffId) return

    try {
      const unreadNotifications = notifications.filter(n => n.status !== 'read')
      
      await Promise.all(
        unreadNotifications.map(notification => 
          notification.id ? EnhancedNotificationService.markNotificationAsRead(notification.id, staffId) : Promise.resolve()
        )
      )

      console.log(`📖 All ${unreadNotifications.length} notifications marked as read`)
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error)
      throw error
    }
  }, [staffId, notifications])

  // Refresh data
  const refreshData = useCallback(() => {
    // The real-time listeners will automatically refresh the data
    console.log('🔄 Refreshing real-time data...')
  }, [])

  return {
    // Job assignments
    jobAssignments,
    pendingJobs,
    activeJobs,
    completedJobs,
    
    // Notifications
    notifications,
    unreadCount,
    
    // Loading states
    isLoading,
    error,
    
    // Actions
    acceptJob,
    declineJob,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    refreshData
  }
}
