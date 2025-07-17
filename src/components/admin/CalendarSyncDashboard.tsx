'use client'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import CalendarEventService from '@/services/CalendarEventService'
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  RefreshCw,
  RefreshCw as Sync,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface SyncMetrics {
  eventsCreated: number
  eventsUpdated: number
  eventsDeleted: number
  syncErrors: number
  averageSyncTime: number
}

export default function CalendarSyncDashboard() {
  const [metrics, setMetrics] = useState<SyncMetrics>({
    eventsCreated: 0,
    eventsUpdated: 0,
    eventsDeleted: 0,
    syncErrors: 0,
    averageSyncTime: 0,
  })

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  useEffect(() => {
    // Initial load
    refreshMetrics()

    // Set up periodic refresh every 10 seconds
    const interval = setInterval(refreshMetrics, 10000)

    return () => clearInterval(interval)
  }, [])

  const refreshMetrics = async () => {
    try {
      const currentMetrics = CalendarEventService.getSyncMetrics()
      setMetrics(currentMetrics)
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Error refreshing calendar sync metrics:', error)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshMetrics()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const handleResetMetrics = () => {
    CalendarEventService.resetSyncMetrics()
    refreshMetrics()
  }

  const getTotalEvents = () => {
    return metrics.eventsCreated + metrics.eventsUpdated + metrics.eventsDeleted
  }

  const getSuccessRate = () => {
    const total = getTotalEvents()
    if (total === 0) return 100
    return ((total - metrics.syncErrors) / total) * 100
  }

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 99) return 'text-green-400'
    if (rate >= 95) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getSuccessRateBadge = (rate: number) => {
    if (rate >= 99) return 'default'
    if (rate >= 95) return 'secondary'
    return 'destructive'
  }

  const successRate = getSuccessRate()

  return (
    <Card className="bg-neutral-900 border-neutral-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Sync className="h-5 w-5 text-purple-400" />
            Calendar Synchronization Dashboard
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="border-neutral-700 hover:bg-neutral-800"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
              />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetMetrics}
              className="border-red-600 text-red-400 hover:bg-red-900/20"
            >
              Reset
            </Button>
          </div>
        </div>
        <p className="text-neutral-400 text-sm">
          Real-time monitoring of calendar synchronization with bookings and
          jobs
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-purple-400" />
              <span className="text-neutral-400 text-sm">Sync Rate</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-2xl font-bold ${getSuccessRateColor(successRate)}`}
              >
                {successRate.toFixed(1)}%
              </span>
              <Badge
                variant={getSuccessRateBadge(successRate)}
                className="text-xs"
              >
                {successRate >= 99
                  ? 'Excellent'
                  : successRate >= 95
                    ? 'Good'
                    : 'Poor'}
              </Badge>
            </div>
          </div>

          <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-neutral-400 text-sm">Events Created</span>
            </div>
            <div className="text-2xl font-bold text-green-400">
              {metrics.eventsCreated}
            </div>
            <div className="text-xs text-neutral-500">new calendar events</div>
          </div>

          <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-400" />
              <span className="text-neutral-400 text-sm">Events Updated</span>
            </div>
            <div className="text-2xl font-bold text-blue-400">
              {metrics.eventsUpdated}
            </div>
            <div className="text-xs text-neutral-500">synchronized updates</div>
          </div>

          <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-yellow-400" />
              <span className="text-neutral-400 text-sm">Avg Sync Time</span>
            </div>
            <div className="text-2xl font-bold text-yellow-400">
              {metrics.averageSyncTime.toFixed(0)}ms
            </div>
            <div className="text-xs text-neutral-500">per operation</div>
          </div>
        </div>

        {/* Detailed Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sync Operations */}
          <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-400" />
              Synchronization Operations
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400 text-sm">
                  Total Operations
                </span>
                <span className="text-white font-medium">
                  {getTotalEvents()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-neutral-400 text-sm">Events Created</span>
                <span className="text-green-400 font-medium">
                  {metrics.eventsCreated}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-neutral-400 text-sm">Events Updated</span>
                <span className="text-blue-400 font-medium">
                  {metrics.eventsUpdated}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-neutral-400 text-sm">Events Deleted</span>
                <span className="text-orange-400 font-medium">
                  {metrics.eventsDeleted}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-neutral-400 text-sm">Sync Errors</span>
                <span className="text-red-400 font-medium">
                  {metrics.syncErrors}
                </span>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              Performance Metrics
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400 text-sm">Success Rate</span>
                <span
                  className={`font-medium ${getSuccessRateColor(successRate)}`}
                >
                  {successRate.toFixed(2)}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-neutral-400 text-sm">
                  Average Sync Time
                </span>
                <span className="text-yellow-400 font-medium">
                  {metrics.averageSyncTime.toFixed(1)}ms
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-neutral-400 text-sm">
                  Target Sync Time
                </span>
                <span className="text-neutral-500 font-medium">≤ 5000ms</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-neutral-400 text-sm">Last Refresh</span>
                <span className="text-neutral-400 font-medium">
                  {lastRefresh.toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Targets */}
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <h3 className="text-blue-400 font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Performance Targets & Thresholds
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-blue-300">Synchronization Accuracy:</span>
                <span className="text-blue-200 font-medium">≥ 99%</span>
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-blue-300">Event Creation Time:</span>
                <span className="text-blue-200 font-medium">≤ 5 seconds</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-blue-300">Conflict Detection:</span>
                <span className="text-blue-200 font-medium">Real-time</span>
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-blue-300">Auto-retry on Failure:</span>
                <span className="text-blue-200 font-medium">3 attempts</span>
              </div>
            </div>
          </div>
        </div>

        {/* System Health Indicator */}
        <div className="text-center">
          {successRate >= 99 ? (
            <div className="flex items-center justify-center gap-2 text-green-400">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">
                Calendar Synchronization Operating Optimally
              </span>
            </div>
          ) : successRate >= 95 ? (
            <div className="flex items-center justify-center gap-2 text-yellow-400">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">
                Calendar Synchronization Performance Acceptable
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-red-400">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">
                Calendar Synchronization Issues Detected - Investigation
                Required
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
