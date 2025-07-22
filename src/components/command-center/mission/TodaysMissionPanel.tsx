'use client'

import { useState, useEffect } from 'react'
import { Clock, AlertTriangle, TrendingUp, Users, Calendar } from 'lucide-react'
import CriticalJobCard from './CriticalJobCard'
import UpcomingJobsList from './UpcomingJobsList'
import AIPredictions from './AIPredictions'
import DelayWarning from './DelayWarning'
import { useTodaysJobs } from '@/hooks/useTodaysJobs'
import { useJobProgress } from '@/hooks/useJobProgress'

interface TodaysMissionPanelProps {
  className?: string
}

export default function TodaysMissionPanel({ className = '' }: TodaysMissionPanelProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeTab, setActiveTab] = useState<'critical' | 'upcoming' | 'ai-insights'>('critical')
  
  // Real-time data hooks
  const { 
    todaysJobs, 
    criticalJobs, 
    upcomingJobs, 
    loading: jobsLoading,
    error: jobsError 
  } = useTodaysJobs()
  
  const { 
    jobProgress, 
    delayedJobs, 
    loading: progressLoading 
  } = useJobProgress(todaysJobs.map(job => job.id))

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // Calculate mission statistics
  const missionStats = {
    totalJobs: todaysJobs.length,
    criticalCount: criticalJobs.length,
    completedCount: todaysJobs.filter(job => job.status === 'completed').length,
    delayedCount: delayedJobs.length,
    revenueAtRisk: delayedJobs.reduce((sum, job) => sum + (job.bookingRef?.totalAmount || 0), 0)
  }

  const completionRate = missionStats.totalJobs > 0 
    ? Math.round((missionStats.completedCount / missionStats.totalJobs) * 100) 
    : 0

  if (jobsLoading) {
    return (
      <div className={`h-full w-full flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-400">Loading mission data...</p>
        </div>
      </div>
    )
  }

  if (jobsError) {
    return (
      <div className={`h-full w-full flex items-center justify-center ${className}`}>
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-red-400">Failed to load mission data</p>
          <p className="text-xs text-gray-500 mt-1">{jobsError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-full w-full flex flex-col bg-gray-800 ${className}`}>
      {/* Panel Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Today's Mission</h2>
          </div>
          <div className="text-sm text-gray-300">
            {currentTime.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              weekday: 'short'
            })}
          </div>
        </div>

        {/* Mission Statistics */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-900 rounded p-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total Jobs</span>
              <span className="text-white font-medium">{missionStats.totalJobs}</span>
            </div>
          </div>
          <div className="bg-gray-900 rounded p-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Critical</span>
              <span className="text-red-400 font-medium">{missionStats.criticalCount}</span>
            </div>
          </div>
          <div className="bg-gray-900 rounded p-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Completed</span>
              <span className="text-green-400 font-medium">{completionRate}%</span>
            </div>
          </div>
          <div className="bg-gray-900 rounded p-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Delayed</span>
              <span className="text-yellow-400 font-medium">{missionStats.delayedCount}</span>
            </div>
          </div>
        </div>

        {/* Revenue at Risk Alert */}
        {missionStats.revenueAtRisk > 0 && (
          <div className="mt-2 p-2 bg-red-900/20 border border-red-700 rounded">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-xs text-red-300">
                ฿{missionStats.revenueAtRisk.toLocaleString()} at risk
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveTab('critical')}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'critical'
              ? 'text-red-400 border-b-2 border-red-400 bg-red-900/10'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Critical ({missionStats.criticalCount})
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'upcoming'
              ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-900/10'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Next 4h
        </button>
        <button
          onClick={() => setActiveTab('ai-insights')}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'ai-insights'
              ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-900/10'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          AI Insights
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'critical' && (
          <div className="h-full overflow-y-auto">
            {criticalJobs.length > 0 ? (
              <div className="p-3 space-y-3">
                {criticalJobs.map((job) => (
                  <CriticalJobCard 
                    key={job.id} 
                    job={job} 
                    progress={jobProgress[job.id]} 
                  />
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 text-green-400 mx-auto mb-2" />
                  <p className="text-sm text-green-400">No critical jobs</p>
                  <p className="text-xs text-gray-500">All on track!</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'upcoming' && (
          <UpcomingJobsList jobs={upcomingJobs} jobProgress={jobProgress} />
        )}

        {activeTab === 'ai-insights' && (
          <AIPredictions jobs={todaysJobs} />
        )}
      </div>

      {/* Delay Warnings */}
      {delayedJobs.length > 0 && (
        <DelayWarning delayedJobs={delayedJobs} />
      )}
    </div>
  )
}
