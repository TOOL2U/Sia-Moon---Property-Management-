'use client'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { db } from '@/lib/firebase'
import NotificationService from '@/services/NotificationService'
import { collection, getDocs, orderBy, query, Timestamp, where } from 'firebase/firestore'
import {
    AlertTriangle,
    Calendar,
    CheckCircle,
    Clock,
    FileText,
    MapPin,
    Navigation,
    Phone,
    RefreshCw,
    User
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface PendingJob {
  id: string
  title: string
  type: string
  propertyId: string
  propertyName: string
  propertyAddress?: string
  scheduledDate: Timestamp
  estimatedDuration: number
  assignedStaff: string
  assignedStaffName: string
  jobAccepted?: boolean
  priority: 'low' | 'medium' | 'high'
  specialInstructions?: string
  requiredSkills: string[]
  status: string
  createdAt: Timestamp
}

export default function JobAcceptancePanel() {
  const [pendingJobs, setPendingJobs] = useState<PendingJob[]>([])
  const [acceptedJobs, setAcceptedJobs] = useState<PendingJob[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [acceptingJobId, setAcceptingJobId] = useState<string | null>(null)

  useEffect(() => {
    loadJobs()

    // Refresh every 30 seconds
    const interval = setInterval(loadJobs, 30000)

    return () => clearInterval(interval)
  }, [])

  const loadJobs = async () => {
    setIsLoading(true)
    try {
      if (!db) throw new Error("Firebase not initialized")

      // Get jobs assigned but not yet accepted
      const pendingQuery = query(
        collection(db, 'jobs'),
        where('status', '==', 'assigned'),
        where('jobAccepted', '!=', true),
        orderBy('scheduledDate', 'asc')
      )

      const pendingSnapshot = await getDocs(pendingQuery)
      const pending: PendingJob[] = []

      pendingSnapshot.forEach((doc) => {
        const data = doc.data()
        pending.push({
          id: doc.id,
          ...data,
          scheduledDate: data.scheduledDate,
          createdAt: data.createdAt
        } as PendingJob)
      })

      // Get recently accepted jobs
      const acceptedQuery = query(
        collection(db, 'jobs'),
        where('status', '==', 'accepted'),
        where('jobAccepted', '==', true),
        orderBy('acceptedAt', 'desc')
      )

      const acceptedSnapshot = await getDocs(acceptedQuery)
      const accepted: PendingJob[] = []

      acceptedSnapshot.forEach((doc) => {
        const data = doc.data()
        accepted.push({
          id: doc.id,
          ...data,
          scheduledDate: data.scheduledDate,
          createdAt: data.createdAt
        } as PendingJob)
      })

      setPendingJobs(pending)
      setAcceptedJobs(accepted.slice(0, 5)) // Show last 5 accepted jobs
    } catch (error) {
      console.error('Error loading jobs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptJob = async (jobId: string, staffId: string) => {
    setAcceptingJobId(jobId)
    try {
      await NotificationService.handleJobAcceptance(jobId, staffId, 'web_dashboard')

      // Refresh jobs list
      await loadJobs()
    } catch (error) {
      console.error('Error accepting job:', error)
    } finally {
      setAcceptingJobId(null)
    }
  }

  const formatDateTime = (timestamp: Timestamp) => {
    const date = timestamp.toDate()
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-400'
      case 'medium':
        return 'text-yellow-400'
      case 'low':
        return 'text-green-400'
      default:
        return 'text-neutral-400'
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'secondary'
      case 'low':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const isJobOverdue = (scheduledDate: Timestamp) => {
    return scheduledDate.toDate() < new Date()
  }

  const getTimeUntilJob = (scheduledDate: Timestamp) => {
    const now = new Date()
    const jobTime = scheduledDate.toDate()
    const diffMs = jobTime.getTime() - now.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (diffMs < 0) return 'Overdue'
    if (diffHours > 24) return `${Math.floor(diffHours / 24)}d ${diffHours % 24}h`
    if (diffHours > 0) return `${diffHours}h ${diffMins}m`
    return `${diffMins}m`
  }

  const renderJobCard = (job: PendingJob, isPending: boolean = true) => {
    const isOverdue = isJobOverdue(job.scheduledDate)

    return (
      <div
        key={job.id}
        className={`p-4 rounded-lg border ${
          isOverdue && isPending
            ? 'border-red-600 bg-red-900/20'
            : 'border-neutral-700 bg-neutral-800'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-white">{job.title}</h4>
            <Badge variant={getPriorityBadge(job.priority)} className="text-xs">
              {job.priority}
            </Badge>
            {isOverdue && isPending && (
              <Badge variant="destructive" className="text-xs">
                Overdue
              </Badge>
            )}
          </div>
          {isPending && (
            <div className="text-sm text-neutral-400">
              {getTimeUntilJob(job.scheduledDate)}
            </div>
          )}
        </div>

        <div className="space-y-2 text-sm text-neutral-400 mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{job.propertyName}</span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{formatDateTime(job.scheduledDate)}</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{formatDuration(job.estimatedDuration)} estimated</span>
          </div>

          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>{job.assignedStaffName}</span>
          </div>
        </div>

        {job.specialInstructions && (
          <div className="mb-4 p-3 bg-neutral-900 rounded border border-neutral-600">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-blue-400" />
              <span className="text-blue-400 text-sm font-medium">Special Instructions</span>
            </div>
            <p className="text-neutral-300 text-sm">{job.specialInstructions}</p>
          </div>
        )}

        {job.requiredSkills && job.requiredSkills.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-neutral-500 mb-1">Required Skills:</div>
            <div className="flex flex-wrap gap-1">
              {job.requiredSkills.map((skill) => (
                <Badge key={skill} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {isPending && (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleAcceptJob(job.id, job.assignedStaff)}
              disabled={acceptingJobId === job.id}
              className="bg-green-600 hover:bg-green-700 text-white flex-1"
            >
              {acceptingJobId === job.id ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Accept Job
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="border-neutral-600 hover:bg-neutral-800"
            >
              <Navigation className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="border-neutral-600 hover:bg-neutral-800"
            >
              <Phone className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className="bg-neutral-900 border-neutral-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            Job Acceptance Panel
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadJobs}
              disabled={isLoading}
              className="border-neutral-700 hover:bg-neutral-800"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <p className="text-neutral-400 text-sm">
          Manage job assignments and staff acceptance workflow
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Pending Jobs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              Pending Acceptance ({pendingJobs.length})
            </h3>
          </div>

          {pendingJobs.length === 0 ? (
            <div className="text-center py-8 text-neutral-400">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-400" />
              <p>All jobs have been accepted!</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {pendingJobs.map((job) => renderJobCard(job, true))}
            </div>
          )}
        </div>

        {/* Recently Accepted Jobs */}
        {acceptedJobs.length > 0 && (
          <div>
            <h3 className="text-white font-medium mb-4 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              Recently Accepted
            </h3>

            <div className="space-y-3">
              {acceptedJobs.map((job) => renderJobCard(job, false))}
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <h3 className="text-blue-400 font-medium mb-3">Job Acceptance Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-blue-300">Pending Jobs:</span>
                <span className="text-blue-200 font-medium">{pendingJobs.length}</span>
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-blue-300">Overdue Jobs:</span>
                <span className="text-red-400 font-medium">
                  {pendingJobs.filter(job => isJobOverdue(job.scheduledDate)).length}
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-blue-300">Accepted Today:</span>
                <span className="text-green-400 font-medium">{acceptedJobs.length}</span>
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-blue-300">Target Response:</span>
                <span className="text-blue-200 font-medium">≤ 30 minutes</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
