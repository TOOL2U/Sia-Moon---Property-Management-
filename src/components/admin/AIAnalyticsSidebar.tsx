'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target
} from 'lucide-react'
import { AILogEntry } from '@/types/ai'

interface AIAnalyticsSidebarProps {
  logs: AILogEntry[]
}

interface AnalyticsData {
  agentDistribution: { agent: string; count: number; percentage: number }[]
  confidenceDistribution: { range: string; count: number; percentage: number }[]
  escalationRate: number
  avgConfidence: number
  recentTrend: 'up' | 'down' | 'stable'
  hourlyActivity: { hour: number; count: number }[]
  topDecisionTypes: { type: string; count: number }[]
}

export default function AIAnalyticsSidebar({ logs }: AIAnalyticsSidebarProps) {
  const analytics = useMemo(() => calculateAnalytics(logs), [logs])

  return (
    <div className="space-y-6">
      
      {/* Agent Distribution */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <PieChart className="h-4 w-4" />
            Agent Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {analytics.agentDistribution.map((item) => (
            <div key={item.agent} className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge 
                  variant="outline" 
                  className={
                    item.agent === 'COO' 
                      ? 'border-purple-400 text-purple-400 bg-purple-400/10' 
                      : 'border-yellow-400 text-yellow-400 bg-yellow-400/10'
                  }
                >
                  AI {item.agent}
                </Badge>
                <span className="text-sm text-neutral-300">{item.count}</span>
              </div>
              <div className="space-y-1">
                <Progress 
                  value={item.percentage} 
                  className="h-2"
                />
                <div className="text-xs text-neutral-400 text-right">
                  {item.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Confidence Distribution */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4" />
            Confidence Scores
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {analytics.confidenceDistribution.map((item) => (
            <div key={item.range} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-300">{item.range}</span>
                <span className="text-sm text-neutral-300">{item.count}</span>
              </div>
              <div className="space-y-1">
                <Progress 
                  value={item.percentage} 
                  className="h-2"
                />
                <div className="text-xs text-neutral-400 text-right">
                  {item.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
          
          <div className="pt-2 border-t border-neutral-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-400">Average</span>
              <span className={`text-sm font-medium ${
                analytics.avgConfidence >= 80 ? 'text-green-400' : 
                analytics.avgConfidence >= 60 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {analytics.avgConfidence.toFixed(1)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Performance Indicators */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Target className="h-4 w-4" />
            Performance KPIs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Escalation Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-400">Escalation Rate</span>
              <div className="flex items-center gap-1">
                {analytics.escalationRate > 30 ? (
                  <AlertTriangle className="h-3 w-3 text-red-400" />
                ) : analytics.escalationRate > 15 ? (
                  <AlertTriangle className="h-3 w-3 text-yellow-400" />
                ) : (
                  <CheckCircle className="h-3 w-3 text-green-400" />
                )}
                <span className={`text-sm font-medium ${
                  analytics.escalationRate > 30 ? 'text-red-400' : 
                  analytics.escalationRate > 15 ? 'text-yellow-400' : 'text-green-400'
                }`}>
                  {analytics.escalationRate.toFixed(1)}%
                </span>
              </div>
            </div>
            <Progress 
              value={analytics.escalationRate} 
              className="h-2"
            />
          </div>

          {/* Auto-Resolution Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-400">Auto-Resolution</span>
              <span className="text-sm font-medium text-green-400">
                {(100 - analytics.escalationRate).toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={100 - analytics.escalationRate} 
              className="h-2"
            />
          </div>

          {/* Recent Trend */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-700">
            <span className="text-sm text-neutral-400">Recent Trend</span>
            <div className="flex items-center gap-1">
              {analytics.recentTrend === 'up' ? (
                <TrendingUp className="h-3 w-3 text-green-400" />
              ) : analytics.recentTrend === 'down' ? (
                <TrendingDown className="h-3 w-3 text-red-400" />
              ) : (
                <Activity className="h-3 w-3 text-neutral-400" />
              )}
              <span className={`text-sm capitalize ${
                analytics.recentTrend === 'up' ? 'text-green-400' : 
                analytics.recentTrend === 'down' ? 'text-red-400' : 'text-neutral-400'
              }`}>
                {analytics.recentTrend}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            24h Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analytics.hourlyActivity.slice(0, 6).map((item) => (
              <div key={item.hour} className="flex items-center gap-3">
                <span className="text-xs text-neutral-400 w-8">
                  {item.hour.toString().padStart(2, '0')}:00
                </span>
                <div className="flex-1">
                  <Progress 
                    value={(item.count / Math.max(...analytics.hourlyActivity.map(h => h.count))) * 100} 
                    className="h-1"
                  />
                </div>
                <span className="text-xs text-neutral-300 w-6 text-right">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Decision Types */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4" />
            Decision Types
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.topDecisionTypes.slice(0, 5).map((item, index) => (
              <div key={item.type} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  index === 0 ? 'bg-blue-400' :
                  index === 1 ? 'bg-green-400' :
                  index === 2 ? 'bg-yellow-400' :
                  index === 3 ? 'bg-purple-400' : 'bg-neutral-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-neutral-300 truncate">
                    {item.type}
                  </div>
                </div>
                <span className="text-xs text-neutral-400">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-400">AI Availability</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-sm text-green-400">Online</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-400">Response Time</span>
            <span className="text-sm text-neutral-300">~1.2s</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-400">Success Rate</span>
            <span className="text-sm text-green-400">99.8%</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-400">Last Update</span>
            <span className="text-sm text-neutral-300">
              {new Date().toLocaleTimeString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function calculateAnalytics(logs: AILogEntry[]): AnalyticsData {
  if (logs.length === 0) {
    return {
      agentDistribution: [],
      confidenceDistribution: [],
      escalationRate: 0,
      avgConfidence: 0,
      recentTrend: 'stable',
      hourlyActivity: [],
      topDecisionTypes: []
    }
  }

  // Agent distribution
  const agentCounts = logs.reduce((acc, log) => {
    acc[log.agent] = (acc[log.agent] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const agentDistribution = Object.entries(agentCounts).map(([agent, count]) => ({
    agent,
    count,
    percentage: (count / logs.length) * 100
  }))

  // Confidence distribution
  const confidenceRanges = [
    { range: '90-100%', min: 90, max: 100 },
    { range: '80-89%', min: 80, max: 89 },
    { range: '70-79%', min: 70, max: 79 },
    { range: '60-69%', min: 60, max: 69 },
    { range: '<60%', min: 0, max: 59 }
  ]

  const confidenceDistribution = confidenceRanges.map(range => {
    const count = logs.filter(log => 
      log.confidence >= range.min && log.confidence <= range.max
    ).length
    return {
      range: range.range,
      count,
      percentage: (count / logs.length) * 100
    }
  }).filter(item => item.count > 0)

  // Escalation rate
  const escalatedCount = logs.filter(log => log.escalation).length
  const escalationRate = (escalatedCount / logs.length) * 100

  // Average confidence
  const avgConfidence = logs.reduce((sum, log) => sum + log.confidence, 0) / logs.length

  // Recent trend (simplified)
  const recentLogs = logs.slice(0, Math.min(10, logs.length))
  const olderLogs = logs.slice(10, Math.min(20, logs.length))
  
  let recentTrend: 'up' | 'down' | 'stable' = 'stable'
  if (recentLogs.length > 0 && olderLogs.length > 0) {
    const recentAvg = recentLogs.reduce((sum, log) => sum + log.confidence, 0) / recentLogs.length
    const olderAvg = olderLogs.reduce((sum, log) => sum + log.confidence, 0) / olderLogs.length
    
    if (recentAvg > olderAvg + 5) recentTrend = 'up'
    else if (recentAvg < olderAvg - 5) recentTrend = 'down'
  }

  // Hourly activity
  const hourlyActivity = Array.from({ length: 24 }, (_, hour) => {
    const count = logs.filter(log => {
      const logHour = new Date(log.timestamp).getHours()
      return logHour === hour
    }).length
    return { hour, count }
  }).filter(item => item.count > 0).slice(0, 12)

  // Top decision types
  const decisionTypes = logs.reduce((acc, log) => {
    const type = log.decision.split(' ').slice(0, 3).join(' ') // First 3 words
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topDecisionTypes = Object.entries(decisionTypes)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return {
    agentDistribution,
    confidenceDistribution,
    escalationRate,
    avgConfidence,
    recentTrend,
    hourlyActivity,
    topDecisionTypes
  }
}
