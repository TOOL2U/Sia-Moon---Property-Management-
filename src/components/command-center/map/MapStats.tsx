'use client'

import { useEffect, useState } from 'react'

interface MapStatsProps {
  staffCount: number
  activeJobs: number
  propertiesInTransition: number
}

export default function MapStats({ staffCount, activeJobs, propertiesInTransition }: MapStatsProps) {
  const [lastUpdate, setLastUpdate] = useState(new Date())

  // Update timestamp every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date())
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  // Update timestamp when data changes
  useEffect(() => {
    setLastUpdate(new Date())
  }, [staffCount, activeJobs, propertiesInTransition])

  return (
    <div className="absolute bottom-4 right-4 bg-gray-800/95 backdrop-blur-sm border border-gray-600 rounded-lg shadow-xl">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold text-sm">Live Operations</h3>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-xs">LIVE</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-3">
          {/* Active Staff */}
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-green-500/20 rounded-full mb-1 mx-auto">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-xl font-bold text-white">{staffCount}</div>
            <div className="text-xs text-gray-400">Active Staff</div>
          </div>

          {/* Active Jobs */}
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-500/20 rounded-full mb-1 mx-auto">
              <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-xl font-bold text-white">{activeJobs}</div>
            <div className="text-xs text-gray-400">Jobs Active</div>
          </div>

          {/* Properties in Transition */}
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-orange-500/20 rounded-full mb-1 mx-auto">
              <svg className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </div>
            <div className="text-xl font-bold text-white">{propertiesInTransition}</div>
            <div className="text-xs text-gray-400">In Transition</div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-gray-300">Working</span>
            </div>
            <span className="text-white font-medium">{Math.floor(staffCount * 0.7)}</span>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-gray-300">Traveling</span>
            </div>
            <span className="text-white font-medium">{Math.floor(staffCount * 0.2)}</span>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
              <span className="text-gray-300">On Break</span>
            </div>
            <span className="text-white font-medium">{Math.floor(staffCount * 0.1)}</span>
          </div>
        </div>

        {/* Last Update */}
        <div className="pt-2 border-t border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Last Update</span>
            <span>{lastUpdate.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
