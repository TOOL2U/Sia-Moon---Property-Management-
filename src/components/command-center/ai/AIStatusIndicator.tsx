'use client'

import { useState, useEffect } from 'react'
import { Wifi, WifiOff, Activity, AlertCircle } from 'lucide-react'

interface AIStatusIndicatorProps {
  isConnected: boolean
  showLabel?: boolean
}

export default function AIStatusIndicator({ isConnected, showLabel = true }: AIStatusIndicatorProps) {
  const [activityLevel, setActivityLevel] = useState(0)
  const [lastActivity, setLastActivity] = useState(Date.now())

  // Simulate activity level changes
  useEffect(() => {
    if (!isConnected) {
      setActivityLevel(0)
      return
    }

    const interval = setInterval(() => {
      // Simulate varying AI activity levels
      const newLevel = Math.floor(Math.random() * 100)
      setActivityLevel(newLevel)
      setLastActivity(Date.now())
    }, 3000)

    return () => clearInterval(interval)
  }, [isConnected])

  // Get status styling
  const getStatusStyles = () => {
    if (!isConnected) {
      return {
        color: 'text-red-400',
        bg: 'bg-red-400',
        ring: 'ring-red-400/30',
        label: 'Offline',
        icon: WifiOff
      }
    }

    if (activityLevel >= 70) {
      return {
        color: 'text-green-400',
        bg: 'bg-green-400',
        ring: 'ring-green-400/30',
        label: 'High Activity',
        icon: Activity
      }
    } else if (activityLevel >= 40) {
      return {
        color: 'text-blue-400',
        bg: 'bg-blue-400',
        ring: 'ring-blue-400/30',
        label: 'Active',
        icon: Wifi
      }
    } else if (activityLevel >= 10) {
      return {
        color: 'text-yellow-400',
        bg: 'bg-yellow-400',
        ring: 'ring-yellow-400/30',
        label: 'Low Activity',
        icon: Wifi
      }
    } else {
      return {
        color: 'text-gray-400',
        bg: 'bg-gray-400',
        ring: 'ring-gray-400/30',
        label: 'Idle',
        icon: Wifi
      }
    }
  }

  const styles = getStatusStyles()
  const StatusIcon = styles.icon

  // Calculate time since last activity
  const getTimeSinceActivity = () => {
    const seconds = Math.floor((Date.now() - lastActivity) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Status Indicator */}
      <div className="relative">
        <div 
          className={`
            w-3 h-3 rounded-full transition-all duration-300
            ${styles.bg}
            ${isConnected && activityLevel > 50 ? 'animate-pulse' : ''}
          `}
        />
        {isConnected && (
          <div 
            className={`
              absolute inset-0 w-3 h-3 rounded-full animate-ping
              ${styles.bg} opacity-20
            `}
          />
        )}
      </div>

      {/* Status Label */}
      {showLabel && (
        <div className="flex items-center space-x-1">
          <StatusIcon className={`h-3 w-3 ${styles.color}`} />
          <span className={`text-xs ${styles.color}`}>
            {styles.label}
          </span>
        </div>
      )}

      {/* Activity Level Bar (when connected) */}
      {isConnected && activityLevel > 0 && (
        <div className="flex items-center space-x-1">
          <div className="w-8 bg-gray-700 rounded-full h-1">
            <div 
              className={`h-1 rounded-full transition-all duration-500 ${styles.bg}`}
              style={{ width: `${activityLevel}%` }}
            />
          </div>
          <span className="text-xs text-gray-400">
            {activityLevel}%
          </span>
        </div>
      )}
    </div>
  )
}
