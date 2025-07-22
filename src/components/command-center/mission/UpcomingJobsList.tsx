'use client'

import { useState } from 'react'
import { 
  Clock, 
  MapPin, 
  User, 
  AlertTriangle, 
  Navigation,
  Calendar,
  CheckCircle
} from 'lucide-react'

interface JobProgress {
  jobId: string
  progressPercentage: number
  estimatedCompletion: string
  delayRisk: number
  lastUpdate: string
  currentStage: 'not_started' | 'traveling' | 'on_site' | 'in_progress' | 'quality_check' | 'completed'
}

interface UpcomingJob {
  id: string
  title: string
  jobType: string
  status: 'pending' | 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  scheduledDate: any
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
  }
  estimatedDuration: number
  specialInstructions?: string
  requiredSkills?: string[]
  travelTime?: number // in minutes
}

interface UpcomingJobsListProps {
  jobs: UpcomingJob[]
  jobProgress: Record<string, JobProgress>
}

export default function UpcomingJobsList({ jobs, jobProgress }: UpcomingJobsListProps) {
  const [expandedJob, setExpandedJob] = useState<string | null>(null)

  // Filter jobs for next 4 hours
  const getNext4HoursJobs = () => {
    const now = new Date()
    const fourHoursLater = new Date(now.getTime() + (4 * 60 * 60 * 1000))
    
    return jobs.filter(job => {
      const scheduledTime = new Date(job.scheduledDate.toDate ? job.scheduledDate.toDate() : job.scheduledDate)
      return scheduledTime >= now && scheduledTime <= fourHoursLater
    }).sort((a, b) => {
      const timeA = new Date(a.scheduledDate.toDate ? a.scheduledDate.toDate() : a.scheduledDate)
      const timeB = new Date(b.scheduledDate.toDate ? b.scheduledDate.toDate() : b.scheduledDate)
      return timeA.getTime() - timeB.getTime()
    })
  }

  const upcomingJobs = getNext4HoursJobs()

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      default: return 'bg-green-500'
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400'
      case 'in_progress': return 'text-blue-400'
      case 'accepted': return 'text-cyan-400'
      case 'assigned': return 'text-yellow-400'
      default: return 'text-gray-400'
    }
  }

  // Format scheduled time
  const formatScheduledTime = (scheduledDate: any) => {
    const date = new Date(scheduledDate.toDate ? scheduledDate.toDate() : scheduledDate)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Calculate time until job starts
  const getTimeUntilStart = (scheduledDate: any) => {
    const now = new Date()
    const scheduled = new Date(scheduledDate.toDate ? scheduledDate.toDate() : scheduledDate)
    const diff = scheduled.getTime() - now.getTime()
    
    if (diff <= 0) return 'Starting now'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours === 0) return `in ${minutes}m`
    return `in ${hours}h ${minutes}m`
  }

  // Check for conflicts
  const hasConflict = (job: UpcomingJob) => {
    if (!job.assignedStaffId) return false
    
    const jobStart = new Date(job.scheduledDate.toDate ? job.scheduledDate.toDate() : job.scheduledDate)
    const jobEnd = new Date(jobStart.getTime() + (job.estimatedDuration * 60 * 1000))
    
    return upcomingJobs.some(otherJob => {
      if (otherJob.id === job.id || otherJob.assignedStaffId !== job.assignedStaffId) return false
      
      const otherStart = new Date(otherJob.scheduledDate.toDate ? otherJob.scheduledDate.toDate() : otherJob.scheduledDate)
      const otherEnd = new Date(otherStart.getTime() + (otherJob.estimatedDuration * 60 * 1000))
      
      return (jobStart < otherEnd && jobEnd > otherStart)
    })
  }

  if (upcomingJobs.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No jobs in next 4 hours</p>
          <p className="text-xs text-gray-500">Schedule is clear</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-3 space-y-2">
        {/* Time Header */}
        <div className="sticky top-0 bg-gray-800 pb-2 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-white">Next 4 Hours</h3>
            <span className="text-xs text-gray-400">{upcomingJobs.length} jobs</span>
          </div>
        </div>

        {/* Jobs List */}
        {upcomingJobs.map((job) => {
          const progress = jobProgress[job.id]
          const conflict = hasConflict(job)
          const isExpanded = expandedJob === job.id

          return (
            <div
              key={job.id}
              className={`
                border rounded-lg p-3 transition-all duration-200 cursor-pointer
                ${conflict ? 'border-red-500 bg-red-900/10' : 'border-gray-600 bg-gray-900/50'}
                hover:bg-gray-900/70
              `}
              onClick={() => setExpandedJob(isExpanded ? null : job.id)}
            >
              {/* Job Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(job.priority)}`} />
                    <h4 className="text-sm font-medium text-white truncate">
                      {job.title}
                    </h4>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">{job.jobType}</span>
                    <span className={`text-xs ${getStatusColor(job.status)} capitalize`}>
                      {job.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-medium text-white">
                    {formatScheduledTime(job.scheduledDate)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {getTimeUntilStart(job.scheduledDate)}
                  </div>
                </div>
              </div>

              {/* Conflict Warning */}
              {conflict && (
                <div className="mb-2 p-2 bg-red-900/20 border border-red-700 rounded">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-3 w-3 text-red-400" />
                    <span className="text-xs text-red-300">Schedule conflict detected</span>
                  </div>
                </div>
              )}

              {/* Quick Info */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center space-x-1">
                  <MapPin className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-300 truncate">{job.propertyRef.name}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-300">{job.estimatedDuration}min</span>
                </div>
                
                {job.assignedStaff && (
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3 text-gray-400" />
                    <span className="text-gray-300 truncate">{job.assignedStaff.name}</span>
                  </div>
                )}
                
                {job.travelTime && (
                  <div className="flex items-center space-x-1">
                    <Navigation className="h-3 w-3 text-gray-400" />
                    <span className="text-gray-300">{job.travelTime}min travel</span>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {progress && progress.progressPercentage > 0 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-white">{progress.progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div 
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${progress.progressPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Expanded Details */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-gray-600 space-y-2">
                  {/* Guest Information */}
                  {job.bookingRef && (
                    <div className="bg-gray-900/50 rounded p-2">
                      <div className="text-xs text-gray-400 mb-1">Guest</div>
                      <div className="text-xs text-white">{job.bookingRef.guestName}</div>
                    </div>
                  )}

                  {/* Required Skills */}
                  {job.requiredSkills && job.requiredSkills.length > 0 && (
                    <div className="bg-gray-900/50 rounded p-2">
                      <div className="text-xs text-gray-400 mb-1">Required Skills</div>
                      <div className="flex flex-wrap gap-1">
                        {job.requiredSkills.map((skill, index) => (
                          <span 
                            key={index}
                            className="text-xs bg-blue-900/30 text-blue-300 px-1 py-0.5 rounded"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Special Instructions */}
                  {job.specialInstructions && (
                    <div className="bg-gray-900/50 rounded p-2">
                      <div className="text-xs text-gray-400 mb-1">Instructions</div>
                      <div className="text-xs text-white">{job.specialInstructions}</div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 px-2 rounded">
                      View Details
                    </button>
                    {job.assignedStaff && (
                      <button className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1 px-2 rounded">
                        Contact Staff
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
