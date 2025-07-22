'use client'

import { useState } from 'react'
import MetricTrend from './MetricTrend'
import { VitalMetric } from '@/hooks/useVitalSigns'

interface VitalSignMetricProps {
  metric: VitalMetric
  compact?: boolean
}

export default function VitalSignMetric({ metric, compact = true }: VitalSignMetricProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  // Get status styling
  const getStatusStyles = () => {
    switch (metric.status) {
      case 'critical':
        return {
          text: 'text-red-400',
          bg: 'bg-red-900/10',
          border: 'border-red-500/30',
          pulse: 'animate-pulse'
        }
      case 'warning':
        return {
          text: 'text-yellow-400',
          bg: 'bg-yellow-900/10',
          border: 'border-yellow-500/30',
          pulse: ''
        }
      default:
        return {
          text: 'text-green-400',
          bg: 'bg-green-900/10',
          border: 'border-green-500/30',
          pulse: ''
        }
    }
  }

  const styles = getStatusStyles()

  if (compact) {
    return (
      <div 
        className={`
          relative flex items-center justify-between p-1 rounded border transition-all duration-200
          ${styles.bg} ${styles.border} ${styles.pulse}
          hover:bg-gray-700/50 cursor-pointer
        `}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* Metric Info */}
        <div className="flex items-center space-x-1 min-w-0">
          <span className="text-xs">{metric.icon}</span>
          <span className="text-xs text-gray-300 font-mono truncate">
            {metric.label}
          </span>
        </div>

        {/* Value and Trend */}
        <div className="flex items-center space-x-1">
          <span className={`text-xs font-mono font-bold ${styles.text}`}>
            {metric.value}
          </span>
          {metric.target && (
            <span className="text-xs text-gray-500 font-mono">
              /{metric.target}
            </span>
          )}
          <MetricTrend trend={metric.trend} size="sm" />
        </div>

        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute bottom-full left-0 mb-1 z-50">
            <div className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white whitespace-nowrap shadow-lg">
              {metric.tooltip}
              <div className="absolute top-full left-2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-600"></div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Expanded view
  return (
    <div 
      className={`
        p-2 rounded-lg border transition-all duration-200
        ${styles.bg} ${styles.border} ${styles.pulse}
        hover:bg-gray-700/30
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-sm">{metric.icon}</span>
          <span className="text-sm text-white font-semibold">
            {metric.label}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <MetricTrend trend={metric.trend} size="md" />
          <span className={`text-xs px-2 py-1 rounded-full uppercase font-mono ${
            metric.status === 'critical' ? 'bg-red-900/30 text-red-300' :
            metric.status === 'warning' ? 'bg-yellow-900/30 text-yellow-300' :
            'bg-green-900/30 text-green-300'
          }`}>
            {metric.status}
          </span>
        </div>
      </div>

      {/* Value Display */}
      <div className="flex items-baseline space-x-2 mb-2">
        <span className={`text-xl font-bold font-mono ${styles.text}`}>
          {metric.value}
        </span>
        {metric.target && (
          <span className="text-sm text-gray-400 font-mono">
            / {metric.target}
          </span>
        )}
      </div>

      {/* Progress Bar (if target exists) */}
      {metric.target && (
        <div className="mb-2">
          <div className="w-full bg-gray-700 rounded-full h-1">
            <div 
              className={`h-1 rounded-full transition-all duration-500 ${
                metric.status === 'critical' ? 'bg-red-400' :
                metric.status === 'warning' ? 'bg-yellow-400' :
                'bg-green-400'
              }`}
              style={{ 
                width: `${Math.min(100, (parseFloat(metric.value.replace(/[^\d.]/g, '')) / parseFloat(metric.target.replace(/[^\d.]/g, ''))) * 100)}%` 
              }}
            />
          </div>
        </div>
      )}

      {/* Description */}
      <div className="text-xs text-gray-400">
        {metric.tooltip}
      </div>

      {/* Status Indicator */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700">
        <div className="flex items-center space-x-1">
          <div className={`w-2 h-2 rounded-full ${
            metric.status === 'critical' ? 'bg-red-400 animate-pulse' :
            metric.status === 'warning' ? 'bg-yellow-400' :
            'bg-green-400'
          }`} />
          <span className="text-xs text-gray-400">
            Last updated: just now
          </span>
        </div>
        
        {metric.status === 'critical' && (
          <span className="text-xs text-red-400 font-semibold animate-pulse">
            ATTENTION REQUIRED
          </span>
        )}
      </div>
    </div>
  )
}
