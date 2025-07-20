'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { AITrainingLogEntry } from '@/lib/logs'
import {
  AlertCircle,
  Brain,
  Calendar,
  CheckCircle,
  DollarSign,
  Download,
  Eye,
  RefreshCw,
  TrendingUp,
  User,
  XCircle
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface TrainingLogViewerProps {
  entries?: AITrainingLogEntry[]
  className?: string
  maxHeight?: string
  showFilters?: boolean
  showStats?: boolean
}

export default function TrainingLogViewer({
  entries: propEntries,
  className,
  maxHeight = '500px',
  showFilters = true,
  showStats = true
}: TrainingLogViewerProps) {
  const [entries, setEntries] = useState<AITrainingLogEntry[]>(propEntries || [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<{
    agent?: 'COO' | 'CFO'
    outcome?: 'success' | 'failure' | 'neutral'
    category?: string
  }>({})
  const [stats, setStats] = useState({
    total: 0,
    byAgent: {} as Record<string, number>,
    byOutcome: {} as Record<string, number>,
    byCategory: {} as Record<string, number>,
    recentActivity: 0
  })

  useEffect(() => {
    if (!propEntries) {
      loadTrainingLogs()
    } else {
      calculateStats(propEntries)
    }
  }, [propEntries])

  const loadTrainingLogs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/ai-training/logs')

      if (response.ok) {
        const data = await response.json()
        setEntries(data.entries || [])
        setStats(data.stats || stats)
      } else {
        // Use mock data if API fails
        const mockEntries = generateMockEntries()
        setEntries(mockEntries)
        calculateStats(mockEntries)
      }
    } catch (error) {
      console.error('Failed to load training logs:', error)
      const mockEntries = generateMockEntries()
      setEntries(mockEntries)
      calculateStats(mockEntries)
    } finally {
      setLoading(false)
    }
  }

  const generateMockEntries = (): AITrainingLogEntry[] => {
    return [
      {
        id: 'training-001',
        logId: 'log-001',
        originalDecision: 'Assign Somchai to Villa Breeze cleaning',
        overrideReason: 'Staff member too far away, would take 45 minutes to reach property',
        outcome: 'success',
        agent: 'COO',
        confidence: 85,
        category: 'geographic_constraints',
        adminId: 'admin-001',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        metadata: { distance: 15.2, estimatedTravelTime: 45 },
        insights: {
          pattern: 'Staff assignments frequently overridden due to distance constraints',
          recommendation: 'Add maximum travel distance parameter (15km) to staff assignment algorithm',
          confidence: 85
        }
      },
      {
        id: 'training-002',
        logId: 'log-002',
        originalDecision: 'Approve ฿8,500 maintenance expense for pool equipment',
        overrideReason: 'Amount exceeds monthly maintenance budget, requires additional approval',
        outcome: 'neutral',
        agent: 'CFO',
        confidence: 78,
        category: 'financial_thresholds',
        adminId: 'admin-001',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        metadata: { amount: 8500, budgetRemaining: 3200 }
      },
      {
        id: 'training-003',
        logId: 'log-003',
        originalDecision: 'Schedule maintenance for Ocean View Villa next Tuesday',
        overrideReason: 'Villa has guests checking in Tuesday, rescheduled to Wednesday',
        outcome: 'success',
        agent: 'COO',
        confidence: 92,
        category: 'temporal_constraints',
        adminId: 'admin-002',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        metadata: { originalDate: '2025-07-22', newDate: '2025-07-23' }
      },
      {
        id: 'training-004',
        logId: 'log-004',
        originalDecision: 'Reject booking for Villa Paradise due to maintenance',
        overrideReason: 'Maintenance completed early, booking should be approved',
        outcome: 'failure',
        agent: 'COO',
        confidence: 88,
        category: 'maintenance_scheduling',
        adminId: 'admin-001',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        metadata: { bookingValue: 12000, maintenanceStatus: 'completed' }
      }
    ]
  }

  const calculateStats = (logEntries: AITrainingLogEntry[]) => {
    const newStats = {
      total: logEntries.length,
      byAgent: {} as Record<string, number>,
      byOutcome: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      recentActivity: 0
    }

    logEntries.forEach(entry => {
      newStats.byAgent[entry.agent] = (newStats.byAgent[entry.agent] || 0) + 1
      newStats.byOutcome[entry.outcome] = (newStats.byOutcome[entry.outcome] || 0) + 1
      if (entry.category) {
        newStats.byCategory[entry.category] = (newStats.byCategory[entry.category] || 0) + 1
      }

      // Count recent activity (last 24 hours)
      const entryTime = new Date(entry.timestamp)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      if (entryTime > oneDayAgo) {
        newStats.recentActivity++
      }
    })

    setStats(newStats)
  }

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failure': return <XCircle className="w-4 h-4 text-red-500" />
      case 'neutral': return <AlertCircle className="w-4 h-4 text-yellow-500" />
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'success': return 'text-green-400 border-green-400'
      case 'failure': return 'text-red-400 border-red-400'
      case 'neutral': return 'text-yellow-400 border-yellow-400'
      default: return 'text-gray-400 border-gray-400'
    }
  }

  const getAgentIcon = (agent: string) => {
    switch (agent) {
      case 'COO': return <User className="w-4 h-4 text-blue-400" />
      case 'CFO': return <DollarSign className="w-4 h-4 text-green-400" />
      default: return <Brain className="w-4 h-4 text-purple-400" />
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000))

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  const formatCategory = (category: string) => {
    return category.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  // Filter entries
  const filteredEntries = entries.filter(entry => {
    if (filter.agent && entry.agent !== filter.agent) return false
    if (filter.outcome && entry.outcome !== filter.outcome) return false
    if (filter.category && entry.category !== filter.category) return false
    return true
  })

  const exportData = () => {
    const dataStr = JSON.stringify(filteredEntries, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ai_training_logs_${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card className={`bg-neutral-900 border-neutral-800 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2 text-white">
              🧠 AI Feedback Loop
              <Badge variant="secondary" className="ml-2 bg-neutral-800 text-neutral-300">
                {filteredEntries.length} Entries
              </Badge>
            </h2>
            <p className="text-sm text-muted-foreground">
              Tracks which AI decisions were overridden or confirmed.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={exportData}
              className="text-neutral-400 hover:text-white"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadTrainingLogs}
              disabled={loading}
              className="text-neutral-400 hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Stats */}
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-3">
              <div className="text-sm text-neutral-400">Total Entries</div>
              <div className="text-lg font-bold text-white">{stats.total}</div>
            </div>
            <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-3">
              <div className="text-sm text-neutral-400">Success Rate</div>
              <div className="text-lg font-bold text-green-400">
                {stats.total > 0 ? Math.round((stats.byOutcome.success || 0) / stats.total * 100) : 0}%
              </div>
            </div>
            <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-3">
              <div className="text-sm text-neutral-400">Recent Activity</div>
              <div className="text-lg font-bold text-primary-400">{stats.recentActivity}</div>
            </div>
            <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-3">
              <div className="text-sm text-neutral-400">Top Category</div>
              <div className="text-sm font-medium text-white">
                {Object.entries(stats.byCategory).sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant={!filter.agent ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter({ ...filter, agent: undefined })}
              className="text-xs bg-primary-600 hover:bg-primary-700 data-[variant=ghost]:text-neutral-400 data-[variant=ghost]:hover:text-white data-[variant=ghost]:hover:bg-neutral-800"
            >
              All Agents
            </Button>
            <Button
              variant={filter.agent === 'COO' ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter({ ...filter, agent: 'COO' })}
              className="text-xs bg-primary-600 hover:bg-primary-700 data-[variant=ghost]:text-neutral-400 data-[variant=ghost]:hover:text-white data-[variant=ghost]:hover:bg-neutral-800"
            >
              AI COO
            </Button>
            <Button
              variant={filter.agent === 'CFO' ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter({ ...filter, agent: 'CFO' })}
              className="text-xs bg-primary-600 hover:bg-primary-700 data-[variant=ghost]:text-neutral-400 data-[variant=ghost]:hover:text-white data-[variant=ghost]:hover:bg-neutral-800"
            >
              AI CFO
            </Button>

            <div className="w-px h-6 bg-neutral-700 mx-2" />

            <Button
              variant={filter.outcome === 'success' ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter({
                ...filter,
                outcome: filter.outcome === 'success' ? undefined : 'success'
              })}
              className="text-xs bg-primary-600 hover:bg-primary-700 data-[variant=ghost]:text-neutral-400 data-[variant=ghost]:hover:text-white data-[variant=ghost]:hover:bg-neutral-800"
            >
              Success
            </Button>
            <Button
              variant={filter.outcome === 'failure' ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter({
                ...filter,
                outcome: filter.outcome === 'failure' ? undefined : 'failure'
              })}
              className="text-xs bg-primary-600 hover:bg-primary-700 data-[variant=ghost]:text-neutral-400 data-[variant=ghost]:hover:text-white data-[variant=ghost]:hover:bg-neutral-800"
            >
              Failure
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div
          className="space-y-3 overflow-y-auto"
          style={{ maxHeight }}
        >
          {loading ? (
            <div className="text-center text-neutral-400 py-8">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
              Loading training logs...
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center text-neutral-400 py-8">
              <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <div>No training logs found</div>
              <div className="text-sm mt-1">Logs will appear here as AI decisions are overridden</div>
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <div key={entry.id} className="bg-neutral-800 border border-neutral-700 rounded-lg p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getAgentIcon(entry.agent)}
                    <Badge variant="outline" className="text-xs border-neutral-600 text-neutral-300">
                      AI {entry.agent}
                    </Badge>
                    {entry.category && (
                      <Badge variant="secondary" className="text-xs bg-neutral-700 text-neutral-300">
                        {formatCategory(entry.category)}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-neutral-400">
                    <Calendar className="w-3 h-3" />
                    {formatTimestamp(entry.timestamp)}
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Brain className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-neutral-400">Decision:</span>
                      <span className="text-white ml-2">{entry.originalDecision}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    {getOutcomeIcon(entry.outcome)}
                    <div>
                      <span className="text-neutral-400">Outcome:</span>
                      <Badge variant="outline" className={`ml-2 text-xs ${getOutcomeColor(entry.outcome)}`}>
                        {entry.outcome}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-neutral-400">Admin Note:</span>
                      <span className="text-neutral-300 ml-2 italic">{entry.overrideReason}</span>
                    </div>
                  </div>

                  {/* Insights */}
                  {entry.insights && (
                    <div className="mt-3 p-3 bg-primary-500/20 border border-primary-500/30 rounded">
                      <div className="flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs font-medium text-primary-400 mb-1">AI Learning Insight</div>
                          <div className="text-xs text-neutral-300">{entry.insights.recommendation}</div>
                          <div className="text-xs text-neutral-500 mt-1">
                            Confidence: {entry.insights.confidence}%
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                    <div className="mt-2 pt-2 border-t border-neutral-700">
                      <div className="text-xs text-neutral-500">
                        Metadata: {JSON.stringify(entry.metadata, null, 0)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
