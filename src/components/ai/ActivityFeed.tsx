'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  TrendingUp,
  DollarSign,
  User,
  Building,
  Zap
} from 'lucide-react'
import { AILogEntry } from '@/types/ai'

interface ActivityFeedProps {
  logs?: AILogEntry[]
  className?: string
  maxHeight?: string
  autoRefresh?: boolean
  showFilters?: boolean
}

export default function ActivityFeed({ 
  logs: propLogs, 
  className,
  maxHeight = '400px',
  autoRefresh = true,
  showFilters = true
}: ActivityFeedProps) {
  const [logs, setLogs] = useState<AILogEntry[]>(propLogs || [])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'COO' | 'CFO' | 'escalated'>('all')
  const [autoScroll, setAutoScroll] = useState(true)
  const feedRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Load logs if not provided as props
  useEffect(() => {
    if (!propLogs) {
      loadLogs()
    }
  }, [propLogs])

  // Auto-refresh logs
  useEffect(() => {
    if (autoRefresh && !propLogs) {
      const interval = setInterval(loadLogs, 10000) // Refresh every 10 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh, propLogs])

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll])

  const loadLogs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/ai-log')
      
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      } else {
        // Use mock data if API fails
        setLogs(generateMockLogs())
      }
    } catch (error) {
      console.error('Failed to load activity logs:', error)
      setLogs(generateMockLogs())
    } finally {
      setLoading(false)
    }
  }

  const generateMockLogs = (): AILogEntry[] => {
    const decisions = [
      'Booking approved for Villa Lotus - guest requirements met',
      'Staff assigned to cleaning task at Ocean View Villa',
      'High-value expense flagged for review: ฿8,500 maintenance',
      'Financial analysis completed for Q3 revenue',
      'Emergency repair request escalated to admin',
      'Monthly budget analysis finished - under target',
      'Booking rejected - insufficient availability',
      'Duplicate expense detected and flagged',
      'Staff schedule optimized for weekend coverage',
      'Property maintenance scheduled for next week'
    ]

    const agents: ('COO' | 'CFO')[] = ['COO', 'CFO']
    
    return Array.from({ length: 15 }, (_, i) => ({
      timestamp: new Date(Date.now() - i * 1000 * 60 * Math.random() * 30).toISOString(),
      agent: agents[Math.floor(Math.random() * agents.length)],
      decision: decisions[Math.floor(Math.random() * decisions.length)],
      confidence: Math.floor(Math.random() * 40) + 60, // 60-100
      source: 'auto' as const,
      escalation: Math.random() < 0.2, // 20% escalation rate
      notes: Math.random() < 0.3 ? 'Additional context provided by AI' : undefined
    }))
  }

  const getAgentIcon = (agent: string) => {
    switch (agent) {
      case 'COO': return <User className="w-4 h-4 text-blue-400" />
      case 'CFO': return <DollarSign className="w-4 h-4 text-green-400" />
      default: return <Brain className="w-4 h-4 text-purple-400" />
    }
  }

  const getAgentColor = (agent: string) => {
    switch (agent) {
      case 'COO': return 'text-blue-400 border-blue-400'
      case 'CFO': return 'text-green-400 border-green-400'
      default: return 'text-purple-400 border-purple-400'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-400'
    if (confidence >= 75) return 'text-yellow-400'
    return 'text-red-400'
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return date.toLocaleDateString()
  }

  // Filter logs based on selected filter
  const filteredLogs = logs.filter(log => {
    switch (filter) {
      case 'COO': return log.agent === 'COO'
      case 'CFO': return log.agent === 'CFO'
      case 'escalated': return log.escalation
      default: return true
    }
  })

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const isAtBottom = scrollHeight - scrollTop === clientHeight
    setAutoScroll(isAtBottom)
  }

  return (
    <Card className={`bg-neutral-900 border-neutral-700 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <Zap className="h-5 w-5 text-yellow-400" />
            AI Activity Feed
            <Badge variant="secondary" className="ml-2">
              {filteredLogs.length}
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadLogs}
              disabled={loading}
              className="text-neutral-400 hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex gap-2 mt-3">
            {(['all', 'COO', 'CFO', 'escalated'] as const).map((filterOption) => (
              <Button
                key={filterOption}
                variant={filter === filterOption ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter(filterOption)}
                className={`text-xs ${
                  filter === filterOption 
                    ? 'bg-blue-600 text-white' 
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {filterOption === 'all' ? 'All' : 
                 filterOption === 'escalated' ? 'Escalated' : 
                 `AI ${filterOption}`}
              </Button>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <div 
          ref={feedRef}
          className="overflow-y-auto space-y-3 px-4 pb-4"
          style={{ maxHeight }}
          onScroll={handleScroll}
        >
          {loading && logs.length === 0 ? (
            <div className="text-center text-neutral-400 py-8">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
              Loading activity feed...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center text-neutral-400 py-8">
              No activities found for the selected filter
            </div>
          ) : (
            filteredLogs.map((log, i) => (
              <div key={`${log.timestamp}-${i}`} className="border-b border-neutral-800 pb-3 last:border-b-0">
                <div className="flex items-start gap-3">
                  {/* Agent Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getAgentIcon(log.agent)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={`text-xs ${getAgentColor(log.agent)}`}>
                        AI {log.agent}
                      </Badge>
                      <span className="text-xs text-neutral-500">
                        {formatTimestamp(log.timestamp)}
                      </span>
                      {log.escalation && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Escalated
                        </Badge>
                      )}
                    </div>

                    {/* Decision */}
                    <div className="text-sm text-white mb-2">
                      {log.decision}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-neutral-400">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span className={getConfidenceColor(log.confidence)}>
                          {log.confidence}% confidence
                        </span>
                      </div>
                      
                      {log.source && (
                        <div className="flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          <span>{log.source}</span>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {log.notes && (
                      <div className="mt-2 text-xs text-neutral-500 italic">
                        {log.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          
          <div ref={bottomRef} />
        </div>

        {/* Auto-scroll indicator */}
        {!autoScroll && (
          <div className="px-4 pb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAutoScroll(true)
                bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="w-full text-xs text-neutral-400 hover:text-white"
            >
              <Clock className="w-3 h-3 mr-1" />
              Scroll to latest activity
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
