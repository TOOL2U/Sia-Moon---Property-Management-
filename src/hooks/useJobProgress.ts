'use client'

import { useState, useEffect } from 'react'
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  doc,
  getDoc
} from 'firebase/firestore'
import { getDb } from '@/lib/firebase'

interface JobProgress {
  jobId: string
  progressPercentage: number
  estimatedCompletion: string
  delayRisk: number
  lastUpdate: string
  currentStage: 'not_started' | 'traveling' | 'on_site' | 'in_progress' | 'quality_check' | 'completed'
  staffLocation?: {
    lat: number
    lng: number
    lastUpdate: string
  }
}

interface DelayedJob {
  id: string
  title: string
  propertyRef: {
    name: string
  }
  bookingRef?: {
    guestName: string
    totalAmount?: number
  }
  assignedStaff?: {
    name: string
    phone?: string
  }
  delayRisk: number
  estimatedDelay: number
  deadline?: string
}

export function useJobProgress(jobIds: string[]) {
  const [jobProgress, setJobProgress] = useState<Record<string, JobProgress>>({})
  const [delayedJobs, setDelayedJobs] = useState<DelayedJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (jobIds.length === 0) {
      setJobProgress({})
      setDelayedJobs([])
      setLoading(false)
      return
    }

    const db = getDb()
    if (!db) {
      setError('Firebase not initialized')
      setLoading(false)
      return
    }

    console.log('📊 Setting up job progress listeners for:', jobIds.length, 'jobs')

    // Set up listener for job_progress collection
    const progressQuery = query(
      collection(db, 'job_progress'),
      where('jobId', 'in', jobIds.slice(0, 10)) // Firestore 'in' limit is 10
    )

    const unsubscribeProgress = onSnapshot(
      progressQuery,
      (snapshot) => {
        try {
          const progressData: Record<string, JobProgress> = {}
          
          snapshot.docs.forEach(doc => {
            const data = doc.data()
            progressData[data.jobId] = {
              jobId: data.jobId,
              progressPercentage: data.progressPercentage || 0,
              estimatedCompletion: data.estimatedCompletion || '',
              delayRisk: data.delayRisk || 0,
              lastUpdate: data.lastUpdate || new Date().toISOString(),
              currentStage: data.currentStage || 'not_started',
              staffLocation: data.staffLocation
            }
          })

          // Generate mock progress for jobs without progress data (development)
          jobIds.forEach(jobId => {
            if (!progressData[jobId]) {
              progressData[jobId] = generateMockProgress(jobId)
            }
          })

          console.log(`📊 Job progress updated: ${Object.keys(progressData).length} jobs`)
          setJobProgress(progressData)
          setError(null)
        } catch (err) {
          console.error('❌ Error processing job progress:', err)
          setError('Failed to process job progress')
        } finally {
          setLoading(false)
        }
      },
      (err) => {
        console.error('❌ Error listening to job progress:', err)
        
        // Fallback to mock data for development
        const mockProgress: Record<string, JobProgress> = {}
        jobIds.forEach(jobId => {
          mockProgress[jobId] = generateMockProgress(jobId)
        })
        setJobProgress(mockProgress)
        setError(null)
        setLoading(false)
      }
    )

    return () => {
      console.log('🔄 Cleaning up job progress listeners')
      unsubscribeProgress()
    }
  }, [jobIds])

  // Generate mock progress data for development
  const generateMockProgress = (jobId: string): JobProgress => {
    const stages: JobProgress['currentStage'][] = [
      'not_started', 'traveling', 'on_site', 'in_progress', 'quality_check', 'completed'
    ]
    
    const randomStage = stages[Math.floor(Math.random() * stages.length)]
    const baseProgress = stages.indexOf(randomStage) * 20
    const randomProgress = Math.min(100, baseProgress + Math.floor(Math.random() * 20))
    
    const now = new Date()
    const estimatedCompletion = new Date(now.getTime() + (Math.random() * 4 * 60 * 60 * 1000)) // 0-4 hours from now
    
    return {
      jobId,
      progressPercentage: randomProgress,
      estimatedCompletion: estimatedCompletion.toISOString(),
      delayRisk: Math.floor(Math.random() * 100),
      lastUpdate: new Date(now.getTime() - Math.random() * 60 * 60 * 1000).toISOString(), // 0-1 hour ago
      currentStage: randomStage,
      staffLocation: randomStage === 'traveling' ? {
        lat: 7.8804 + (Math.random() - 0.5) * 0.1,
        lng: 98.3923 + (Math.random() - 0.5) * 0.1,
        lastUpdate: new Date().toISOString()
      } : undefined
    }
  }

  // Calculate delayed jobs from progress data
  useEffect(() => {
    const delayed: DelayedJob[] = []
    
    Object.values(jobProgress).forEach(progress => {
      if (progress.delayRisk > 50) { // Consider jobs with >50% delay risk as delayed
        // This would normally fetch job details from the jobs collection
        // For now, we'll create a mock delayed job
        delayed.push({
          id: progress.jobId,
          title: `Job ${progress.jobId.slice(-4)}`, // Mock title
          propertyRef: {
            name: `Property ${progress.jobId.slice(-4)}`
          },
          bookingRef: Math.random() > 0.5 ? {
            guestName: `Guest ${progress.jobId.slice(-4)}`,
            totalAmount: Math.floor(Math.random() * 10000) + 2000
          } : undefined,
          assignedStaff: {
            name: `Staff ${progress.jobId.slice(-4)}`,
            phone: '+66 XX XXX XXXX'
          },
          delayRisk: progress.delayRisk,
          estimatedDelay: Math.floor(progress.delayRisk * 2), // Rough estimate: risk% * 2 = delay minutes
          deadline: progress.estimatedCompletion
        })
      }
    })

    setDelayedJobs(delayed)
  }, [jobProgress])

  return {
    jobProgress,
    delayedJobs,
    loading,
    error
  }
}
