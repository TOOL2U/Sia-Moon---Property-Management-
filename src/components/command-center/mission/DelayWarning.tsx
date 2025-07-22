'use client'

import { useState } from 'react'
import { 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  Phone, 
  Navigation,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

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
  estimatedDelay: number // in minutes
  deadline?: string
}

interface DelayWarningProps {
  delayedJobs: DelayedJob[]
}

export default function DelayWarning({ delayedJobs }: DelayWarningProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || delayedJobs.length === 0) {
    return null
  }

  // Calculate total revenue at risk
  const totalRevenueAtRisk = delayedJobs.reduce((sum, job) => 
    sum + (job.bookingRef?.totalAmount || 0), 0
  )

  // Get highest risk job
  const highestRiskJob = delayedJobs.reduce((highest, job) => 
    job.delayRisk > highest.delayRisk ? job : highest
  )

  // Get severity level
  const getSeverityLevel = () => {
    const maxRisk = Math.max(...delayedJobs.map(job => job.delayRisk))
    if (maxRisk >= 80) return 'critical'
    if (maxRisk >= 60) return 'high'
    return 'medium'
  }

  const severity = getSeverityLevel()

  // Get severity styling
  const getSeverityStyles = () => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-red-900/30',
          border: 'border-red-500',
          text: 'text-red-400',
          pulse: 'animate-pulse'
        }
      case 'high':
        return {
          bg: 'bg-orange-900/30',
          border: 'border-orange-500',
          text: 'text-orange-400',
          pulse: ''
        }
      default:
        return {
          bg: 'bg-yellow-900/30',
          border: 'border-yellow-500',
          text: 'text-yellow-400',
          pulse: ''
        }
    }
  }

  const styles = getSeverityStyles()

  // Format delay time
  const formatDelay = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  // Check if deadline is passed
  const isOverdue = (deadline?: string) => {
    if (!deadline) return false
    return new Date(deadline) < new Date()
  }

  return (
    <div className={`
      border-2 rounded-lg m-3 ${styles.border} ${styles.bg} ${styles.pulse}
    `}>
      {/* Warning Header */}
      <div className="p-3 border-b border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className={`h-4 w-4 ${styles.text}`} />
            <span className={`text-sm font-medium ${styles.text} uppercase`}>
              {severity} Delays Detected
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-white"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className={`font-medium ${styles.text}`}>{delayedJobs.length}</div>
            <div className="text-gray-400">Jobs at Risk</div>
          </div>
          <div className="text-center">
            <div className={`font-medium ${styles.text}`}>{highestRiskJob.delayRisk}%</div>
            <div className="text-gray-400">Max Risk</div>
          </div>
          <div className="text-center">
            <div className={`font-medium ${styles.text}`}>
              ฿{totalRevenueAtRisk.toLocaleString()}
            </div>
            <div className="text-gray-400">At Risk</div>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="p-3 space-y-2">
          {delayedJobs.map((job) => (
            <div 
              key={job.id}
              className="bg-gray-900/50 border border-gray-600 rounded p-2"
            >
              {/* Job Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-white truncate">
                    {job.title}
                  </h4>
                  <div className="text-xs text-gray-400">
                    {job.propertyRef.name}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-sm font-medium ${
                    job.delayRisk >= 80 ? 'text-red-400' :
                    job.delayRisk >= 60 ? 'text-orange-400' : 'text-yellow-400'
                  }`}>
                    {job.delayRisk}% risk
                  </div>
                  {job.deadline && (
                    <div className={`text-xs ${
                      isOverdue(job.deadline) ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {isOverdue(job.deadline) ? 'OVERDUE' : 
                        new Date(job.deadline).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      }
                    </div>
                  )}
                </div>
              </div>

              {/* Job Details */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-300">
                    +{formatDelay(job.estimatedDelay)} delay
                  </span>
                </div>
                
                {job.bookingRef?.totalAmount && (
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-3 w-3 text-gray-400" />
                    <span className="text-gray-300">
                      ฿{job.bookingRef.totalAmount.toLocaleString()}
                    </span>
                  </div>
                )}
                
                {job.bookingRef?.guestName && (
                  <div className="col-span-2 text-gray-300">
                    Guest: {job.bookingRef.guestName}
                  </div>
                )}
              </div>

              {/* Staff Information */}
              {job.assignedStaff && (
                <div className="bg-gray-800/50 rounded p-2 mb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Assigned Staff</span>
                    <span className="text-xs text-white">{job.assignedStaff.name}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 px-2 rounded flex items-center justify-center space-x-1">
                  <Navigation className="h-3 w-3" />
                  <span>Track</span>
                </button>
                
                {job.assignedStaff?.phone && (
                  <button className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1 px-2 rounded flex items-center justify-center space-x-1">
                    <Phone className="h-3 w-3" />
                    <span>Call</span>
                  </button>
                )}
                
                <button className="flex-1 bg-orange-600 hover:bg-orange-700 text-white text-xs py-1 px-2 rounded">
                  Reassign
                </button>
              </div>
            </div>
          ))}

          {/* Action Summary */}
          <div className="mt-3 pt-3 border-t border-gray-600">
            <div className="flex space-x-2">
              <button className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs py-2 px-3 rounded font-medium">
                Escalate All ({delayedJobs.length})
              </button>
              <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded font-medium">
                Auto-Optimize Routes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
