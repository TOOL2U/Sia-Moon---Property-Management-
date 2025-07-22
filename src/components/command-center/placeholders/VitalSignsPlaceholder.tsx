'use client'

import { useState, useEffect } from 'react'

interface VitalSign {
  label: string
  value: number
  unit: string
  status: 'good' | 'warning' | 'critical'
  trend: 'up' | 'down' | 'stable'
}

export default function VitalSignsPlaceholder() {
  const [vitals, setVitals] = useState<VitalSign[]>([
    { label: 'Active Staff', value: 8, unit: '', status: 'good', trend: 'stable' },
    { label: 'Occupancy', value: 85, unit: '%', status: 'good', trend: 'up' },
    { label: 'Response Time', value: 2.3, unit: 'min', status: 'good', trend: 'down' },
    { label: 'Guest Satisfaction', value: 4.8, unit: '/5', status: 'good', trend: 'up' }
  ])

  // Simulate real-time vital signs updates
  useEffect(() => {
    const interval = setInterval(() => {
      setVitals(prev => prev.map(vital => ({
        ...vital,
        value: vital.label === 'Active Staff' 
          ? Math.max(5, Math.min(12, vital.value + (Math.random() - 0.5) * 2))
          : vital.label === 'Occupancy'
          ? Math.max(60, Math.min(100, vital.value + (Math.random() - 0.5) * 10))
          : vital.label === 'Response Time'
          ? Math.max(1, Math.min(5, vital.value + (Math.random() - 0.5) * 0.5))
          : Math.max(4, Math.min(5, vital.value + (Math.random() - 0.5) * 0.2)),
        trend: Math.random() > 0.7 ? (Math.random() > 0.5 ? 'up' : 'down') : vital.trend
      })))
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-400'
      case 'warning': return 'text-yellow-400'
      case 'critical': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗'
      case 'down': return '↘'
      case 'stable': return '→'
      default: return '→'
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-400'
      case 'down': return 'text-red-400'
      case 'stable': return 'text-gray-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="h-full w-full flex flex-col">
      {/* Panel Header */}
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Vital Signs</h2>
          <div className="text-xs text-gray-300">
            Live
          </div>
        </div>
      </div>

      {/* Vital Signs Grid */}
      <div className="flex-1 p-3">
        <div className="grid grid-cols-1 gap-3 h-full">
          {vitals.map((vital, index) => (
            <div key={index} className="bg-gray-900 border border-gray-700 rounded p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">{vital.label}</span>
                <span className={`text-xs ${getTrendColor(vital.trend)}`}>
                  {getTrendIcon(vital.trend)}
                </span>
              </div>
              
              <div className="flex items-baseline space-x-1">
                <span className={`text-lg font-bold ${getStatusColor(vital.status)}`}>
                  {vital.label === 'Response Time' || vital.label === 'Guest Satisfaction' 
                    ? vital.value.toFixed(1) 
                    : Math.round(vital.value)
                  }
                </span>
                <span className="text-xs text-gray-400">{vital.unit}</span>
              </div>
              
              {/* Mini progress bar for percentage values */}
              {vital.unit === '%' && (
                <div className="mt-1">
                  <div className="w-full bg-gray-700 rounded-full h-1">
                    <div 
                      className={`h-1 rounded-full transition-all duration-300 ${
                        vital.status === 'good' ? 'bg-green-400' :
                        vital.status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
                      }`}
                      style={{ width: `${vital.value}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Panel Footer */}
      <div className="p-2 border-t border-gray-700 bg-gray-800/50">
        <div className="text-center">
          <span className="text-xs text-gray-400">
            Updated {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  )
}
