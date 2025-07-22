'use client'

import { useState, useEffect } from 'react'
import { 
  MapPin, 
  Car, 
  Wrench, 
  CheckCircle, 
  Clock,
  AlertTriangle
} from 'lucide-react'

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

interface JobProgressBarProps {
  progress: JobProgress
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical'
  className?: string
}

export default function JobProgressBar({ progress, urgencyLevel, className = '' }: JobProgressBarProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('')

  // Update time remaining every minute
  useEffect(() => {
    const updateTimeRemaining = () => {
      if (!progress.estimatedCompletion) return

      const now = new Date()
      const completion = new Date(progress.estimatedCompletion)
      const diff = completion.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeRemaining('Overdue')
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      if (hours === 0) {
        setTimeRemaining(`${minutes}m`)
      } else {
        setTimeRemaining(`${hours}h ${minutes}m`)
      }
    }

    updateTimeRemaining()
    const timer = setInterval(updateTimeRemaining, 60000)
    return () => clearInterval(timer)
  }, [progress.estimatedCompletion])

  // Get progress bar color based on urgency and delay risk
  const getProgressColor = () => {
    if (progress.delayRisk > 70) return 'bg-red-500'
    if (progress.delayRisk > 40) return 'bg-yellow-500'
    if (progress.currentStage === 'completed') return 'bg-green-500'
    
    switch (urgencyLevel) {
      case 'critical': return 'bg-red-400'
      case 'high': return 'bg-orange-400'
      case 'medium': return 'bg-blue-400'
      default: return 'bg-gray-400'
    }
  }

  // Get stage icon and label
  const getStageInfo = () => {
    switch (progress.currentStage) {
      case 'not_started':
        return { icon: Clock, label: 'Not Started', color: 'text-gray-400' }
      case 'traveling':
        return { icon: Car, label: 'Traveling', color: 'text-blue-400' }
      case 'on_site':
        return { icon: MapPin, label: 'On Site', color: 'text-cyan-400' }
      case 'in_progress':
        return { icon: Wrench, label: 'In Progress', color: 'text-yellow-400' }
      case 'quality_check':
        return { icon: CheckCircle, label: 'Quality Check', color: 'text-purple-400' }
      case 'completed':
        return { icon: CheckCircle, label: 'Completed', color: 'text-green-400' }
      default:
        return { icon: Clock, label: 'Unknown', color: 'text-gray-400' }
    }
  }

  const stageInfo = getStageInfo()
  const StageIcon = stageInfo.icon

  // Calculate stage progress (each stage is roughly 20% of total)
  const getStageProgress = () => {
    const stageMap = {
      'not_started': 0,
      'traveling': 20,
      'on_site': 40,
      'in_progress': 60,
      'quality_check': 80,
      'completed': 100
    }
    return Math.max(stageMap[progress.currentStage], progress.progressPercentage)
  }

  const displayProgress = getStageProgress()

  // Format last update time
  const getLastUpdateTime = () => {
    const lastUpdate = new Date(progress.lastUpdate)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60))
    
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    
    const diffHours = Math.floor(diffMinutes / 60)
    return `${diffHours}h ago`
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Progress Header */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-1">
          <StageIcon className={`h-3 w-3 ${stageInfo.color}`} />
          <span className={stageInfo.color}>{stageInfo.label}</span>
        </div>
        <div className="flex items-center space-x-2">
          {timeRemaining && (
            <span className="text-gray-300">{timeRemaining}</span>
          )}
          <span className="text-white font-medium">{displayProgress}%</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${getProgressColor()}`}
            style={{ width: `${displayProgress}%` }}
          />
        </div>
        
        {/* Stage Markers */}
        <div className="absolute top-0 w-full h-2 flex justify-between">
          {[20, 40, 60, 80].map((marker) => (
            <div
              key={marker}
              className={`w-0.5 h-2 ${
                displayProgress >= marker ? 'bg-white' : 'bg-gray-600'
              }`}
              style={{ marginLeft: `${marker}%` }}
            />
          ))}
        </div>
      </div>

      {/* Progress Details */}
      <div className="flex items-center justify-between text-xs">
        <div className="text-gray-400">
          Updated {getLastUpdateTime()}
        </div>
        
        {/* Delay Risk Indicator */}
        {progress.delayRisk > 30 && (
          <div className="flex items-center space-x-1">
            <AlertTriangle className={`h-3 w-3 ${
              progress.delayRisk > 70 ? 'text-red-400' : 
              progress.delayRisk > 50 ? 'text-yellow-400' : 'text-orange-400'
            }`} />
            <span className={`${
              progress.delayRisk > 70 ? 'text-red-400' : 
              progress.delayRisk > 50 ? 'text-yellow-400' : 'text-orange-400'
            }`}>
              {progress.delayRisk}% risk
            </span>
          </div>
        )}
      </div>

      {/* Staff Location Indicator */}
      {progress.staffLocation && progress.currentStage === 'traveling' && (
        <div className="bg-blue-900/20 border border-blue-700 rounded p-1">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            <span className="text-xs text-blue-300">
              Staff en route • GPS updated {getLastUpdateTime()}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
