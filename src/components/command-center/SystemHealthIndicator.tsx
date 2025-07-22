'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'

interface SystemHealth {
  firebase: 'online' | 'offline' | 'checking'
  api: 'online' | 'offline' | 'checking'
  realtime: 'online' | 'offline' | 'checking'
}

export default function SystemHealthIndicator() {
  const [health, setHealth] = useState<SystemHealth>({
    firebase: 'checking',
    api: 'checking',
    realtime: 'checking'
  })

  useEffect(() => {
    const checkSystemHealth = async () => {
      // Check Firebase connection
      const firebaseStatus = db ? 'online' : 'offline'
      
      // Check API endpoints
      let apiStatus: 'online' | 'offline' = 'offline'
      try {
        const response = await fetch('/api/health', { method: 'HEAD' })
        apiStatus = response.ok ? 'online' : 'offline'
      } catch {
        apiStatus = 'offline'
      }

      // Check real-time capabilities (placeholder)
      const realtimeStatus = 'online' // Will be implemented with actual real-time checks

      setHealth({
        firebase: firebaseStatus,
        api: apiStatus,
        realtime: realtimeStatus
      })
    }

    checkSystemHealth()
    
    // Check health every 30 seconds
    const interval = setInterval(checkSystemHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-400'
      case 'offline': return 'text-red-400'
      case 'checking': return 'text-yellow-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return '●'
      case 'offline': return '●'
      case 'checking': return '◐'
      default: return '○'
    }
  }

  const overallStatus = Object.values(health).every(s => s === 'online') ? 'online' : 
                      Object.values(health).some(s => s === 'offline') ? 'degraded' : 'checking'

  return (
    <div className="flex items-center space-x-3">
      <div className="text-sm text-gray-300">
        System Status:
      </div>
      
      <div className={`flex items-center space-x-1 ${getStatusColor(overallStatus)}`}>
        <span className="text-lg">{getStatusIcon(overallStatus)}</span>
        <span className="text-sm font-medium capitalize">
          {overallStatus === 'degraded' ? 'Degraded' : overallStatus}
        </span>
      </div>

      {/* Detailed status tooltip */}
      <div className="hidden lg:flex items-center space-x-2 text-xs">
        <span className={`${getStatusColor(health.firebase)} flex items-center`}>
          <span className="mr-1">{getStatusIcon(health.firebase)}</span>
          DB
        </span>
        <span className={`${getStatusColor(health.api)} flex items-center`}>
          <span className="mr-1">{getStatusIcon(health.api)}</span>
          API
        </span>
        <span className={`${getStatusColor(health.realtime)} flex items-center`}>
          <span className="mr-1">{getStatusIcon(health.realtime)}</span>
          RT
        </span>
      </div>
    </div>
  )
}
