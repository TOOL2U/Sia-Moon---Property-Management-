'use client'

import { useState } from 'react'
import { SystemHealthSummary } from '@/services/SystemHealthService'

interface SystemHealthDotsProps {
  systemHealth: SystemHealthSummary | null
  showLabels?: boolean
}

export default function SystemHealthDots({ systemHealth, showLabels = false }: SystemHealthDotsProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  if (!systemHealth) {
    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <div 
            key={i}
            className="w-2 h-2 rounded-full bg-gray-600 animate-pulse"
          />
        ))}
      </div>
    )
  }

  // Get dot color based on service status
  const getDotColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-400'
      case 'warning':
        return 'bg-yellow-400'
      case 'error':
        return 'bg-red-400 animate-pulse'
      case 'checking':
        return 'bg-blue-400 animate-pulse'
      default:
        return 'bg-gray-400'
    }
  }

  // Get service abbreviation for labels
  const getServiceAbbr = (serviceName: string) => {
    switch (serviceName.toLowerCase()) {
      case 'firebase': return 'DB'
      case 'ai service': return 'AI'
      case 'mobile sync': return 'MOB'
      case 'notifications': return 'NOT'
      case 'calendar': return 'CAL'
      default: return serviceName.substring(0, 3).toUpperCase()
    }
  }

  return (
    <div 
      className="relative flex items-center space-x-1"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Service Status Dots */}
      {systemHealth.services.map((service, index) => (
        <div key={index} className="flex flex-col items-center space-y-1">
          <div 
            className={`w-2 h-2 rounded-full transition-all duration-300 ${getDotColor(service.status)}`}
            title={`${service.name}: ${service.status}`}
          />
          {showLabels && (
            <span className="text-xs text-gray-400 font-mono">
              {getServiceAbbr(service.name)}
            </span>
          )}
        </div>
      ))}

      {/* Detailed Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full right-0 mb-2 z-50">
          <div className="bg-gray-900 border border-gray-600 rounded-lg p-3 text-xs text-white shadow-lg min-w-48">
            <div className="font-semibold mb-2 flex items-center justify-between">
              <span>System Health</span>
              <span className={`px-2 py-1 rounded text-xs font-mono ${
                systemHealth.overall === 'healthy' ? 'bg-green-900/30 text-green-300' :
                systemHealth.overall === 'warning' ? 'bg-yellow-900/30 text-yellow-300' :
                'bg-red-900/30 text-red-300'
              }`}>
                {systemHealth.uptime}% UP
              </span>
            </div>
            
            <div className="space-y-2">
              {systemHealth.services.map((service, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${getDotColor(service.status)}`} />
                    <span className="text-gray-300">{service.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">
                      {service.responseTime}ms
                    </span>
                    <span className={`px-1 py-0.5 rounded text-xs font-mono ${
                      service.status === 'healthy' ? 'text-green-400' :
                      service.status === 'warning' ? 'text-yellow-400' :
                      service.status === 'error' ? 'text-red-400' :
                      'text-blue-400'
                    }`}>
                      {service.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Error Messages */}
            {systemHealth.services.some(s => s.errorMessage) && (
              <div className="mt-3 pt-2 border-t border-gray-700">
                <div className="text-red-400 font-semibold mb-1">Issues:</div>
                {systemHealth.services
                  .filter(s => s.errorMessage)
                  .map((service, index) => (
                    <div key={index} className="text-red-300 text-xs">
                      {service.name}: {service.errorMessage}
                    </div>
                  ))
                }
              </div>
            )}

            <div className="mt-2 pt-2 border-t border-gray-700 text-gray-400">
              Last checked: {systemHealth.lastUpdated.toLocaleTimeString()}
            </div>

            {/* Tooltip Arrow */}
            <div className="absolute top-full right-4 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-600"></div>
          </div>
        </div>
      )}
    </div>
  )
}
