'use client'

import { useEffect, useState } from 'react'
import ExitButton from './ExitButton'
import SystemHealthIndicator from './SystemHealthIndicator'
import AIBrainActivity from './ai/AIBrainActivity'
import LiveOperationsMap from './map/LiveOperationsMap'
import TodaysMissionPanel from './mission/TodaysMissionPanel'
import VitalSignsTicker from './vital-signs/VitalSignsTicker'

export default function CommandCenterLayout() {
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="h-screen w-screen bg-gray-900 text-white overflow-hidden">
      {/* Header Bar */}
      <header className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold">COMMAND CENTER</h1>
          </div>

          <div className="text-sm text-gray-300">
            {currentTime.toLocaleString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <SystemHealthIndicator />
          <ExitButton />
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="h-[calc(100vh-4rem)] p-4">
        <div className="h-full grid grid-cols-4 grid-rows-4 gap-4">
          {/* Live Map - Takes up 3x4 grid (75% width, full height) */}
          <div className="col-span-3 row-span-4 bg-gray-800 rounded-lg border border-gray-700">
            <LiveOperationsMap />
          </div>

          {/* Mission Panel - Takes up 1x2 grid (25% width, 50% height) */}
          <div className="col-span-1 row-span-2 bg-gray-800 rounded-lg border border-gray-700">
            <TodaysMissionPanel />
          </div>

          {/* AI Activity - Takes up 1x1 grid (25% width, 25% height) */}
          <div className="col-span-1 row-span-1 bg-gray-800 rounded-lg border border-gray-700">
            <AIBrainActivity />
          </div>

          {/* Vital Signs - Takes up 1x1 grid (25% width, 25% height) */}
          <div className="col-span-1 row-span-1 bg-gray-800 rounded-lg border border-gray-700">
            <VitalSignsTicker />
          </div>
        </div>
      </main>
    </div>
  )
}
