'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Target,
  Zap
} from 'lucide-react'
import SmartJobAssignmentService from '@/services/SmartJobAssignmentService'

interface AssignmentMetrics {
  totalAssignments: number
  successfulAssignments: number
  failedAssignments: number
  averageAssignmentTime: number
  successRate: number
}

interface QueueStatus {
  queueLength: number
  isProcessing: boolean
  processingBookings: string[]
}

export default function SmartJobAnalyticsDashboard() {
  const [metrics, setMetrics] = useState<AssignmentMetrics>({
    totalAssignments: 0,
    successfulAssignments: 0,
    failedAssignments: 0,
    averageAssignmentTime: 0,
    successRate: 0
  })
  
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({
    queueLength: 0,
    isProcessing: false,
    processingBookings: []
  })
  
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    // Initial load
    refreshMetrics()
    
    // Set up periodic refresh
    const interval = setInterval(refreshMetrics, 5000) // Refresh every 5 seconds
    
    return () => clearInterval(interval)
  }, [])

  const refreshMetrics = async () => {
    try {
      const currentMetrics = SmartJobAssignmentService.getMetrics()
      const currentQueueStatus = SmartJobAssignmentService.getQueueStatus()
      
      setMetrics(currentMetrics)
      setQueueStatus(currentQueueStatus)
    } catch (error) {
      console.error('Error refreshing metrics:', error)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshMetrics()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const handleResetMetrics = () => {
    SmartJobAssignmentService.resetMetrics()
    refreshMetrics()
  }

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-400'
    if (rate >= 85) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getSuccessRateBadge = (rate: number) => {
    if (rate >= 95) return 'success'
    if (rate >= 85) return 'warning'
    return 'destructive'
  }

  return (
    <Card className="bg-neutral-900 border-neutral-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-400" />
            Smart Job Assignment Analytics
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="border-neutral-700 hover:bg-neutral-800"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
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
          Real-time performance analytics for AI job assignment system
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-blue-400" />
              <span className="text-neutral-400 text-sm">Success Rate</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${getSuccessRateColor(metrics.successRate)}`}>
                {metrics.successRate.toFixed(1)}%
              </span>
              <Badge variant={getSuccessRateBadge(metrics.successRate)} className="text-xs">
                {metrics.successRate >= 95 ? 'Excellent' : metrics.successRate >= 85 ? 'Good' : 'Needs Improvement'}
              </Badge>
            </div>
          </div>

          <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-neutral-400 text-sm">Successful</span>
            </div>
            <div className="text-2xl font-bold text-green-400">
              {metrics.successfulAssignments}
            </div>
            <div className="text-xs text-neutral-500">
              of {metrics.totalAssignments} total
            </div>
          </div>

          <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-yellow-400" />
              <span className="text-neutral-400 text-sm">Avg Time</span>
            </div>
            <div className="text-2xl font-bold text-yellow-400">
              {metrics.averageAssignmentTime.toFixed(0)}ms
            </div>
            <div className="text-xs text-neutral-500">
              per assignment
            </div>
          </div>

          <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-red-400" />
              <span className="text-neutral-400 text-sm">Failed</span>
            </div>
            <div className="text-2xl font-bold text-red-400">
              {metrics.failedAssignments}
            </div>
            <div className="text-xs text-neutral-500">
              assignments
            </div>
          </div>
        </div>

        {/* Queue Status */}
        <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
          <h3 className="text-white font-medium mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-purple-400" />
            Processing Queue Status
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {queueStatus.queueLength}
              </div>
              <div className="text-sm text-neutral-400">Items in Queue</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                {queueStatus.isProcessing ? (
                  <>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-400 font-medium">Processing</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-neutral-500 rounded-full"></div>
                    <span className="text-neutral-400 font-medium">Idle</span>
                  </>
                )}
              </div>
              <div className="text-sm text-neutral-400">System Status</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {queueStatus.processingBookings.length}
              </div>
              <div className="text-sm text-neutral-400">Active Bookings</div>
            </div>
          </div>

          {queueStatus.processingBookings.length > 0 && (
            <div className="mt-4 p-3 bg-neutral-900 rounded border border-neutral-600">
              <div className="text-sm text-neutral-400 mb-2">Currently Processing:</div>
              <div className="flex flex-wrap gap-2">
                {queueStatus.processingBookings.map((bookingId) => (
                  <Badge key={bookingId} variant="secondary" className="text-xs">
                    {bookingId.slice(-8)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
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
                <span className="text-blue-300">Success Rate Target:</span>
                <span className="text-blue-200 font-medium">≥ 95%</span>
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-blue-300">Assignment Timeout:</span>
                <span className="text-blue-200 font-medium">30 seconds</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-blue-300">Max Concurrent:</span>
                <span className="text-blue-200 font-medium">3 assignments</span>
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-blue-300">Retry Attempts:</span>
                <span className="text-blue-200 font-medium">3 times</span>
              </div>
            </div>
          </div>
        </div>

        {/* System Health Indicator */}
        <div className="text-center">
          {metrics.successRate >= 95 ? (
            <div className="flex items-center justify-center gap-2 text-green-400">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">System Operating at Optimal Performance</span>
            </div>
          ) : metrics.successRate >= 85 ? (
            <div className="flex items-center justify-center gap-2 text-yellow-400">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">System Performance Within Acceptable Range</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-red-400">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">System Performance Below Target - Investigation Required</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
