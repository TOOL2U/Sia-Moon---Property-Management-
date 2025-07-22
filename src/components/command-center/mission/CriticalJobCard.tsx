'use client'

import { useState } from 'react'
import { 
  Clock, 
  MapPin, 
  User, 
  AlertTriangle, 
  DollarSign, 
  CheckCircle,
  Navigation,
  Phone
} from 'lucide-react'
import JobProgressBar from './JobProgressBar'

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

interface CriticalJob {
  id: string
  title: string
  jobType: string
  status: 'pending' | 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  scheduledDate: any
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
}

interface CriticalJobCardProps {
  job: CriticalJob
  progress?: JobProgress
}

export default function CriticalJobCard({ job, progress }: CriticalJobCardProps) {
  const [expanded, setExpanded] = useState(false)

  // Calculate urgency level
  const getUrgencyLevel = () => {
    if (!job.deadline) return 'medium'
    
    const now = new Date()
    const deadline = new Date(job.deadline)
    const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    if (hoursUntilDeadline <= 2) return 'critical'
    if (hoursUntilDeadline <= 4) return 'high'
    return 'medium'
  }

  const urgencyLevel = getUrgencyLevel()

  // Get urgency styling
  const getUrgencyStyles = () => {
    switch (urgencyLevel) {
      case 'critical':
        return {
          border: 'border-red-500',
          bg: 'bg-red-900/20',
          text: 'text-red-400',
          pulse: 'animate-pulse'
        }
      case 'high':
        return {
          border: 'border-orange-500',
          bg: 'bg-orange-900/20',
          text: 'text-orange-400',
          pulse: ''
        }
      default:
        return {
          border: 'border-yellow-500',
          bg: 'bg-yellow-900/20',
          text: 'text-yellow-400',
          pulse: ''
        }
    }
  }

  const styles = getUrgencyStyles()

  // Calculate ETA
  const calculateETA = () => {
    if (progress?.estimatedCompletion) {
      return new Date(progress.estimatedCompletion).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    if (job.scheduledDate) {
      const scheduled = new Date(job.scheduledDate.toDate ? job.scheduledDate.toDate() : job.scheduledDate)
      const eta = new Date(scheduled.getTime() + (job.estimatedDuration * 60 * 1000))
      return eta.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    return 'TBD'
  }

  // Get status color
  const getStatusColor = () => {
    switch (job.status) {
      case 'completed': return 'text-green-400'
      case 'in_progress': return 'text-blue-400'
      case 'accepted': return 'text-cyan-400'
      case 'assigned': return 'text-yellow-400'
      default: return 'text-gray-400'
    }
  }

  // Format deadline countdown
  const getDeadlineCountdown = () => {
    if (!job.deadline) return null
    
    const now = new Date()
    const deadline = new Date(job.deadline)
    const diff = deadline.getTime() - now.getTime()
    
    if (diff <= 0) return 'OVERDUE'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours === 0) return `${minutes}m`
    return `${hours}h ${minutes}m`
  }

  const deadlineCountdown = getDeadlineCountdown()

  return (
    <div 
      className={`
        border-2 rounded-lg p-3 transition-all duration-200 cursor-pointer
        ${styles.border} ${styles.bg} ${styles.pulse}
        hover:shadow-lg
      `}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Job Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-white truncate">
            {job.title}
          </h3>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xs text-gray-400 capitalize">{job.jobType}</span>
            <span className={`text-xs font-medium ${getStatusColor()} capitalize`}>
              {job.status.replace('_', ' ')}
            </span>
          </div>
        </div>
        
        {/* Urgency Indicator */}
        <div className="flex flex-col items-end space-y-1">
          <div className={`flex items-center space-x-1 ${styles.text}`}>
            <AlertTriangle className="h-3 w-3" />
            <span className="text-xs font-medium uppercase">{urgencyLevel}</span>
          </div>
          {deadlineCountdown && (
            <div className="text-xs text-gray-300">
              {deadlineCountdown}
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {progress && (
        <JobProgressBar 
          progress={progress} 
          urgencyLevel={urgencyLevel}
          className="mb-2"
        />
      )}

      {/* Quick Info */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center space-x-1">
          <MapPin className="h-3 w-3 text-gray-400" />
          <span className="text-gray-300 truncate">{job.propertyRef.name}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Clock className="h-3 w-3 text-gray-400" />
          <span className="text-gray-300">ETA: {calculateETA()}</span>
        </div>
        
        {job.assignedStaff && (
          <div className="flex items-center space-x-1">
            <User className="h-3 w-3 text-gray-400" />
            <span className="text-gray-300 truncate">{job.assignedStaff.name}</span>
          </div>
        )}
        
        {job.bookingRef?.totalAmount && (
          <div className="flex items-center space-x-1">
            <DollarSign className="h-3 w-3 text-gray-400" />
            <span className="text-gray-300">฿{job.bookingRef.totalAmount.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-600 space-y-2">
          {/* Guest Information */}
          {job.bookingRef && (
            <div className="bg-gray-900/50 rounded p-2">
              <div className="text-xs text-gray-400 mb-1">Guest Details</div>
              <div className="text-xs text-white">
                <div>{job.bookingRef.guestName}</div>
                <div className="text-gray-300">
                  Check-out: {new Date(job.bookingRef.checkOutDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}

          {/* Location & Instructions */}
          <div className="bg-gray-900/50 rounded p-2">
            <div className="text-xs text-gray-400 mb-1">Location</div>
            <div className="text-xs text-white">{job.propertyRef.address}</div>
            {job.specialInstructions && (
              <div className="text-xs text-gray-300 mt-1">{job.specialInstructions}</div>
            )}
          </div>

          {/* Staff Actions */}
          {job.assignedStaff && (
            <div className="flex space-x-2">
              <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 px-2 rounded flex items-center justify-center space-x-1">
                <Navigation className="h-3 w-3" />
                <span>Track</span>
              </button>
              {job.assignedStaff.phone && (
                <button className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1 px-2 rounded flex items-center justify-center space-x-1">
                  <Phone className="h-3 w-3" />
                  <span>Call</span>
                </button>
              )}
            </div>
          )}

          {/* Delay Risk Warning */}
          {progress && progress.delayRisk > 50 && (
            <div className="bg-red-900/30 border border-red-700 rounded p-2">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-3 w-3 text-red-400" />
                <span className="text-xs text-red-300">
                  {progress.delayRisk}% delay risk detected
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
