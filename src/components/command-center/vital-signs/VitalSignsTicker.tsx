'use client'

import { useState } from 'react'
import { Activity, AlertTriangle, TrendingUp } from 'lucide-react'
import VitalSignMetric from './VitalSignMetric'
import SystemHealthDots from './SystemHealthDots'
import EmergencyMetrics from './EmergencyMetrics'
import { useVitalSigns } from '@/hooks/useVitalSigns'

interface VitalSignsTickerProps {
  className?: string
}

export default function VitalSignsTicker({ className = '' }: VitalSignsTickerProps) {
  const [expanded, setExpanded] = useState(false)
  const { metrics, systemHealth, lastUpdated, loading, error } = useVitalSigns()

  // Calculate overall system status
  const getOverallStatus = () => {
    if (loading) return 'checking'
    if (error) return 'error'
    
    const criticalCount = metrics.filter(m => m.status === 'critical').length
    const warningCount = metrics.filter(m => m.status === 'warning').length
    
    if (criticalCount > 0) return 'critical'
    if (warningCount > 1) return 'warning'
    return 'healthy'
  }

  const overallStatus = getOverallStatus()

  // Get status styling
  const getStatusStyles = () => {
    switch (overallStatus) {
      case 'critical':
        return {
          bg: 'bg-red-900/20',
          border: 'border-red-500',
          text: 'text-red-400',
          pulse: 'animate-pulse'
        }
      case 'warning':
        return {
          bg: 'bg-yellow-900/20',
          border: 'border-yellow-500',
          text: 'text-yellow-400',
          pulse: ''
        }
      case 'checking':
        return {
          bg: 'bg-blue-900/20',
          border: 'border-blue-500',
          text: 'text-blue-400',
          pulse: 'animate-pulse'
        }
      default:
        return {
          bg: 'bg-green-900/20',
          border: 'border-green-500',
          text: 'text-green-400',
          pulse: ''
        }
    }
  }

  const styles = getStatusStyles()

  // Format last updated time
  const formatLastUpdated = () => {
    const now = new Date()
    const diffSeconds = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000)
    
    if (diffSeconds < 60) return `${diffSeconds}s ago`
    const diffMinutes = Math.floor(diffSeconds / 60)
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    const diffHours = Math.floor(diffMinutes / 60)
    return `${diffHours}h ago`
  }

  if (loading) {
    return (
      <div className={`h-full w-full flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mx-auto mb-1"></div>
          <p className="text-xs text-gray-400">Loading vitals...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`h-full w-full flex items-center justify-center ${className}`}>
        <div className="text-center">
          <AlertTriangle className="h-4 w-4 text-red-400 mx-auto mb-1" />
          <p className="text-xs text-red-400">Vitals Error</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-full w-full flex flex-col bg-gray-800 ${className}`}>
      {/* Header */}
      <div 
        className={`
          p-2 border-b border-gray-700 cursor-pointer transition-all duration-200
          ${styles.bg} ${styles.border} ${styles.pulse}
        `}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className={`h-3 w-3 ${styles.text}`} />
            <span className="text-xs font-semibold text-white">VITAL SIGNS</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <SystemHealthDots systemHealth={systemHealth} />
            <span className={`text-xs ${styles.text} uppercase font-mono`}>
              {overallStatus}
            </span>
          </div>
        </div>

        {/* Quick Status Bar */}
        <div className="mt-1 flex items-center justify-between text-xs">
          <div className="text-gray-400">
            {metrics.length} metrics • Updated {formatLastUpdated()}
          </div>
          <div className="flex items-center space-x-1">
            {metrics.filter(m => m.status === 'critical').length > 0 && (
              <span className="text-red-400">
                {metrics.filter(m => m.status === 'critical').length} CRITICAL
              </span>
            )}
            {metrics.filter(m => m.status === 'warning').length > 0 && (
              <span className="text-yellow-400">
                {metrics.filter(m => m.status === 'warning').length} WARN
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Display */}
      <div className="flex-1 overflow-hidden">
        {expanded ? (
          // Expanded view with all metrics
          <div className="h-full overflow-y-auto p-2 space-y-1">
            {metrics.map((metric) => (
              <VitalSignMetric 
                key={metric.id} 
                metric={metric}
                compact={false}
              />
            ))}
            
            {/* Emergency Metrics */}
            <EmergencyMetrics metrics={metrics} />
          </div>
        ) : (
          // Compact ticker view
          <div className="h-full flex flex-col justify-center p-1">
            <div className="space-y-1">
              {metrics.slice(0, 6).map((metric) => (
                <VitalSignMetric 
                  key={metric.id} 
                  metric={metric}
                  compact={true}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-1 border-t border-gray-700 bg-gray-800/50">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1">
            <div className={`w-1.5 h-1.5 rounded-full ${
              overallStatus === 'healthy' ? 'bg-green-400' :
              overallStatus === 'warning' ? 'bg-yellow-400' :
              overallStatus === 'critical' ? 'bg-red-400 animate-pulse' :
              'bg-blue-400 animate-pulse'
            }`} />
            <span className="text-gray-400">
              {overallStatus === 'healthy' ? 'All Systems Operational' :
               overallStatus === 'warning' ? 'Minor Issues Detected' :
               overallStatus === 'critical' ? 'Critical Issues' :
               'System Check In Progress'}
            </span>
          </div>
          
          {!expanded && (
            <button 
              onClick={(e) => {
                e.stopPropagation()
                setExpanded(true)
              }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <TrendingUp className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
