'use client'

import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import {
    AlertTriangle,
    Brain,
    CheckCircle,
    DollarSign,
    RefreshCw,
    TrendingUp,
    User
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface AISummaryData {
  cooDecisionsToday: number
  cfoUpdatesThisWeek: number
  escalations: number
  overrides: number
  totalDecisions: number
  averageConfidence: number
  lastActivity: string
  calculatedAt?: string
  // Legacy fields for backward compatibility
  cooOperations?: number
  cfoReports?: number
  successRate?: number
  lastUpdate?: string
  trends?: {
    cooChange: number
    cfoChange: number
    escalationChange: number
  }
}

interface AISummaryPanelProps {
  className?: string
}

export default function AISummaryPanel({ className }: AISummaryPanelProps) {
  const [data, setData] = useState<AISummaryData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSummaryData()

    // Refresh every 60 seconds
    const interval = setInterval(loadSummaryData, 60000)
    return () => clearInterval(interval)
  }, [])

  const loadSummaryData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/ai-log/summary')

      if (response.ok) {
        const rawData = await response.json()

        // Transform new API format to component format
        const transformedData: AISummaryData = {
          // New format fields
          cooDecisionsToday: rawData.cooDecisionsToday || 0,
          cfoUpdatesThisWeek: rawData.cfoUpdatesThisWeek || 0,
          escalations: rawData.escalations || 0,
          overrides: rawData.overrides || 0,
          totalDecisions: rawData.totalDecisions || 0,
          averageConfidence: rawData.averageConfidence || 0,
          lastActivity: rawData.lastActivity || new Date().toISOString(),
          calculatedAt: rawData.calculatedAt,

          // Legacy format compatibility
          cooOperations: rawData.cooDecisionsToday || rawData.cooOperations || 0,
          cfoReports: rawData.cfoUpdatesThisWeek || rawData.cfoReports || 0,
          successRate: rawData.averageConfidence || rawData.successRate || 0,
          lastUpdate: rawData.lastActivity || rawData.lastUpdate || new Date().toISOString(),

          // Use provided trends or default to zero
          trends: rawData.trends || {
            cooChange: 0,
            cfoChange: 0,
            escalationChange: 0
          }
        }

        setData(transformedData)
      } else {
        console.warn('⚠️ AI Summary: Failed to load data')
        setData({
          cooDecisionsToday: 0,
          cfoUpdatesThisWeek: 0,
          escalations: 0,
          overrides: 0,
          totalDecisions: 0,
          averageConfidence: 0,
          lastActivity: new Date().toISOString(),
          cooOperations: 0,
          cfoReports: 0,
          successRate: 0,
          lastUpdate: new Date().toISOString(),
          trends: {
            cooChange: 0,
            cfoChange: 0,
            escalationChange: 0
          }
        })
      }
    } catch (error) {
      console.error('Failed to load AI summary:', error)
      setData({
        cooDecisionsToday: 0,
        cfoUpdatesThisWeek: 0,
        escalations: 0,
        overrides: 0,
        totalDecisions: 0,
        averageConfidence: 0,
        lastActivity: new Date().toISOString(),
        cooOperations: 0,
        cfoReports: 0,
        successRate: 0,
        lastUpdate: new Date().toISOString(),
        trends: {
          cooChange: 0,
          cfoChange: 0,
          escalationChange: 0
        }
      })
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-3 h-3 text-green-500" />
    if (change < 0) return <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />
    return <div className="w-3 h-3" />
  }

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-500'
    if (change < 0) return 'text-red-500'
    return 'text-neutral-400'
  }

  const formatLastUpdate = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <Card className={`bg-neutral-900 border-neutral-800 ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary-500" />
            AI Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-5 w-5 animate-spin text-neutral-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className={`bg-neutral-900 border-neutral-800 ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary-500" />
            AI Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-neutral-400 py-4">
            <p className="text-sm">Unable to load AI summary</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`bg-neutral-900 border-neutral-800 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary-500" />
          AI Summary
          <Badge variant="secondary" className="ml-auto text-xs bg-neutral-800 text-neutral-300">
            Today
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Operations Summary */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-neutral-400">COO Operations</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-white">
                {data.cooDecisionsToday || data.cooOperations || 0}
              </span>
              {data.trends && data.trends.cooChange !== 0 && (
                <>
                  {getTrendIcon(data.trends.cooChange)}
                  <span className={`text-xs ${getTrendColor(data.trends.cooChange)}`}>
                    {data.trends.cooChange > 0 ? '+' : ''}{data.trends.cooChange}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-sm text-neutral-400">CFO Reports</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-white">
                {data.cfoUpdatesThisWeek || data.cfoReports || 0}
              </span>
              {data.trends && data.trends.cfoChange !== 0 && (
                <>
                  {getTrendIcon(data.trends.cfoChange)}
                  <span className={`text-xs ${getTrendColor(data.trends.cfoChange)}`}>
                    {data.trends.cfoChange > 0 ? '+' : ''}{data.trends.cfoChange}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-neutral-400">Escalations</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-white">
                {data.escalations}
              </span>
              {data.trends && data.trends.escalationChange !== 0 && (
                <>
                  {getTrendIcon(-data.trends.escalationChange)} {/* Negative because fewer escalations is good */}
                  <span className={`text-xs ${getTrendColor(-data.trends.escalationChange)}`}>
                    {data.trends.escalationChange > 0 ? '+' : ''}{data.trends.escalationChange}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-neutral-400">Manual Overrides</span>
            </div>
            <span className="text-sm font-medium text-white">
              {data.overrides}
            </span>
          </div>
        </div>

        {/* Average Confidence */}
        <div className="pt-3 border-t border-neutral-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-300">
              Avg Confidence
            </span>
            <span className={`text-sm font-bold ${
              (data.averageConfidence || data.successRate || 0) >= 90 ? 'text-green-500' :
              (data.averageConfidence || data.successRate || 0) >= 80 ? 'text-yellow-500' :
              'text-red-500'
            }`}>
              {Math.round(data.averageConfidence || data.successRate || 0)}%
            </span>
          </div>

          {/* Confidence Bar */}
          <div className="w-full bg-neutral-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                (data.averageConfidence || data.successRate || 0) >= 90 ? 'bg-green-500' :
                (data.averageConfidence || data.successRate || 0) >= 80 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${Math.round(data.averageConfidence || data.successRate || 0)}%` }}
            />
          </div>
        </div>

        {/* Last Update */}
        <div className="pt-2 border-t border-neutral-700">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500">Last updated</span>
            <span className="text-xs text-neutral-500">
              {formatLastUpdate(data.lastActivity || data.lastUpdate || new Date().toISOString())}
            </span>
          </div>
        </div>

        {/* Quick Status */}
        <div className="pt-2">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              data.escalations === 0 ? 'bg-green-500' :
              data.escalations <= 2 ? 'bg-yellow-500' :
              'bg-red-500'
            }`} />
            <span className="text-xs text-neutral-400">
              {data.escalations === 0 ? 'All systems operating normally' :
               data.escalations <= 2 ? 'Minor escalations pending' :
               'Multiple escalations require attention'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
