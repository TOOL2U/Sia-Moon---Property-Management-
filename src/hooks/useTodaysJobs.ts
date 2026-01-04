'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp
} from 'firebase/firestore'
import { getDb } from '@/lib/firebase'

interface JobData {
  id: string
  title: string
  jobType: string
  status: 'pending' | 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  scheduledDate: Timestamp
  deadline?: string
  assignedStaffId?: string
  assignedStaff?: {
    id: string
    name: string
    phone?: string
  }
  propertyRef: {
    id: string
    name: string
    address: string
    coordinates?: {
      latitude: number
      longitude: number
    }
  }
  bookingRef?: {
    id: string
    guestName: string
    checkInDate: string
    checkOutDate: string
    totalAmount?: number
  }
  estimatedDuration: number
  specialInstructions?: string
  requiredSkills?: string[]
  createdAt: Timestamp
  updatedAt: Timestamp
}

export function useTodaysJobs() {
  const [todaysJobs, setTodaysJobs] = useState<JobData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const db = getDb()
    if (!db) {
      setError('Firebase not initialized')
      setLoading(false)
      return
    }

    // Get today's date range
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    console.log('📅 Setting up today\'s jobs listener for:', startOfDay.toISOString(), 'to', endOfDay.toISOString())

    // Create query for today's jobs
    const jobsQuery = query(
      collection(db, 'jobs'),
      where('scheduledDate', '>=', Timestamp.fromDate(startOfDay)),
      where('scheduledDate', '<', Timestamp.fromDate(endOfDay)),
      orderBy('scheduledDate', 'asc')
    )

    const unsubscribe = onSnapshot(
      jobsQuery,
      (snapshot) => {
        try {
          const jobs = snapshot.docs.map(doc => {
            const data = doc.data()
            return {
              id: doc.id,
              ...data,
              // Ensure scheduledDate is a Timestamp
              scheduledDate: data.scheduledDate instanceof Timestamp 
                ? data.scheduledDate 
                : Timestamp.fromDate(new Date(data.scheduledDate))
            } as JobData
          })

          console.log(`📋 Today's jobs updated: ${jobs.length} jobs found`)
          setTodaysJobs(jobs)
          setError(null)
        } catch (err) {
          console.error('❌ Error processing jobs data:', err)
          setError('Failed to process jobs data')
        } finally {
          setLoading(false)
        }
      },
      (err) => {
        console.error('❌ Error listening to today\'s jobs:', err)
        setError('Failed to load today\'s jobs')
        setLoading(false)
      }
    )

    return () => {
      console.log('🔄 Cleaning up today\'s jobs listener')
      unsubscribe()
    }
  }, [])

  // Calculate critical and upcoming jobs with memoization
  const criticalJobs = useMemo(() => {
    const jobs = todaysJobs.filter(job => {
      // Job is critical if:
      // 1. High or urgent priority
      if (job.priority === 'urgent' || job.priority === 'high') return true
      
      // 2. Has a deadline within 2 hours
      if (job.deadline) {
        const deadline = new Date(job.deadline)
        const now = new Date()
        const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60)
        if (hoursUntilDeadline <= 2) return true
      }
      
      // 3. High-value booking (>฿5000)
      if (job.bookingRef?.totalAmount && job.bookingRef.totalAmount > 5000) return true
      
      // 4. Checkout deadline today
      if (job.bookingRef?.checkOutDate) {
        const checkoutDate = new Date(job.bookingRef.checkOutDate)
        const today = new Date()
        if (checkoutDate.toDateString() === today.toDateString()) return true
      }
      
      // 5. Status indicates urgency
      if (job.status === 'in_progress' && job.priority === 'medium') return true
      
      return false
    })
    
    // Sort by urgency
    return jobs.sort((a, b) => {
      // Sort by priority first
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      
      // Then by deadline proximity
      if (a.deadline && b.deadline) {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      }
      if (a.deadline) return -1
      if (b.deadline) return 1
      
      // Finally by scheduled time
      return a.scheduledDate.toMillis() - b.scheduledDate.toMillis()
    })
  }, [todaysJobs])

  // Calculate upcoming jobs (next 4 hours)
  const upcomingJobs = useMemo(() => {
    const jobs = todaysJobs.filter(job => {
      const now = new Date()
      const fourHoursLater = new Date(now.getTime() + (4 * 60 * 60 * 1000))
      const scheduledTime = job.scheduledDate.toDate()
      
      return scheduledTime >= now && scheduledTime <= fourHoursLater
    })
    
    // Sort by scheduled time
    return jobs.sort((a, b) => 
      a.scheduledDate.toMillis() - b.scheduledDate.toMillis()
    )
  }, [todaysJobs])

  return {
    todaysJobs,
    criticalJobs,
    upcomingJobs,
    loading,
    error
  }
}
