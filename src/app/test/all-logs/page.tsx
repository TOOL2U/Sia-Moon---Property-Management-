'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Brain, Download, Filter, RefreshCw, Search, Calendar, TrendingUp } from 'lucide-react'

interface AILogEntry {
  id: string
  timestamp: string
  agent: 'COO' | 'CFO'
  action: string
  decision?: string
  confidence: number
  rationale?: string
  escalate: boolean
  source?: string
  input?: any
  output?: any
  status: 'success' | 'error' | 'pending'
  testCase?: string
}

export default function AllLogsPage() {
  const [logs, setLogs] = useState<AILogEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<{
    agent?: 'COO' | 'CFO'
    decision?: string
    timeRange?: string
  }>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'timestamp' | 'confidence' | 'agent'>('timestamp')

  const fetchAllAILogs = async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('📘 Fetching all AI agent logs...')

      // Build query parameters
      const params = new URLSearchParams()
      if (filter.agent) params.append('agent', filter.agent)
      if (filter.decision) params.append('decision', filter.decision)
      params.append('limit', '100') // Get more logs for comprehensive review

      const response = await fetch(`/api/ai-log?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('🧠 All AI Logs Response:', data)

      if (data.success && data.logs) {
        let processedLogs = data.logs
        
        // Apply search filter
        if (searchTerm) {
          processedLogs = processedLogs.filter((log: AILogEntry) =>
            log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.source?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.testCase?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.rationale?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        }
        
        // Apply sorting
        processedLogs.sort((a: AILogEntry, b: AILogEntry) => {
          switch (sortBy) {
            case 'confidence':
              return (b.confidence || 0) - (a.confidence || 0)
            case 'agent':
              return a.agent.localeCompare(b.agent)
            case 'timestamp':
            default:
              return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          }
        })
        
        setLogs(processedLogs)
        console.log(`✅ Retrieved ${processedLogs.length} AI log entries`)
      } else {
        setLogs([])
        console.log('⚠️ No logs found or invalid response format')
      }

    } catch (err) {
      console.error('❌ Error fetching AI logs:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-fetch logs on component mount
  useEffect(() => {
    fetchAllAILogs()
  }, [filter, searchTerm, sortBy])

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-600'
    if (confidence >= 0.7) return 'bg-yellow-600'
    return 'bg-red-600'
  }

  const getDecisionColor = (decision?: string) => {
    switch (decision?.toLowerCase()) {
      case 'approved': return 'bg-green-600'
      case 'rejected': return 'bg-red-600'
      case 'flagged': return 'bg-yellow-600'
      default: return 'bg-gray-600'
    }
  }

  const getAgentColor = (agent: string) => {
    return agent === 'COO' ? 'bg-blue-600' : 'bg-purple-600'
  }

  const exportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ai-logs-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const getLogStats = () => {
    const stats = {
      total: logs.length,
      cooLogs: logs.filter(l => l.agent === 'COO').length,
      cfoLogs: logs.filter(l => l.agent === 'CFO').length,
      approved: logs.filter(l => l.decision === 'approved').length,
      rejected: logs.filter(l => l.decision === 'rejected').length,
      escalated: logs.filter(l => l.escalate).length,
      avgConfidence: logs.length > 0 ? (logs.reduce((sum, l) => sum + (l.confidence || 0), 0) / logs.length) : 0
    }
    return stats
  }

  const stats = getLogStats()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Brain className="w-10 h-10 text-indigo-400" />
            📘 All AI Agent Logs Review
          </h1>
          <p className="text-indigo-200">
            Comprehensive review of all AI COO and CFO decisions, confidence scores, and reasoning
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-sm text-slate-400">Total Logs</div>
            </CardContent>
          </Card>
          <Card className="bg-blue-900/30 border-blue-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-300">{stats.cooLogs}</div>
              <div className="text-sm text-blue-400">AI COO</div>
            </CardContent>
          </Card>
          <Card className="bg-purple-900/30 border-purple-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-300">{stats.cfoLogs}</div>
              <div className="text-sm text-purple-400">AI CFO</div>
            </CardContent>
          </Card>
          <Card className="bg-green-900/30 border-green-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-300">{stats.approved}</div>
              <div className="text-sm text-green-400">Approved</div>
            </CardContent>
          </Card>
          <Card className="bg-red-900/30 border-red-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-300">{stats.rejected}</div>
              <div className="text-sm text-red-400">Rejected</div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-900/30 border-yellow-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-300">{stats.escalated}</div>
              <div className="text-sm text-yellow-400">Escalated</div>
            </CardContent>
          </Card>
          <Card className="bg-indigo-900/30 border-indigo-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-indigo-300">{(stats.avgConfidence * 100).toFixed(0)}%</div>
              <div className="text-sm text-indigo-400">Avg Confidence</div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Filter className="w-5 h-5 text-indigo-400" />
              Log Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search logs..."
                    className="w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Agent</label>
                <select
                  value={filter.agent || ''}
                  onChange={(e) => setFilter({...filter, agent: e.target.value as 'COO' | 'CFO' | undefined})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                >
                  <option value="">All Agents</option>
                  <option value="COO">AI COO</option>
                  <option value="CFO">AI CFO</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Decision</label>
                <select
                  value={filter.decision || ''}
                  onChange={(e) => setFilter({...filter, decision: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                >
                  <option value="">All Decisions</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="flagged">Flagged</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'timestamp' | 'confidence' | 'agent')}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                >
                  <option value="timestamp">Timestamp</option>
                  <option value="confidence">Confidence</option>
                  <option value="agent">Agent</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4">
              <Button
                onClick={fetchAllAILogs}
                disabled={isLoading}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Logs
              </Button>
              <Button
                onClick={exportLogs}
                disabled={logs.length === 0}
                variant="outline"
                className="border-slate-600 text-slate-300"
              >
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="bg-red-900/50 border-red-700 mb-6">
            <CardHeader>
              <CardTitle className="text-red-200">❌ Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-300">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Logs Display */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-400" />
                AI Agent Decision Logs
              </span>
              <Badge variant="secondary">
                {logs.length} entries
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-slate-400">
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full" />
                  <span>Loading AI logs...</span>
                </div>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p className="mb-2">No AI logs found</p>
                <p className="text-sm">Try running some AI simulations first</p>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log, index) => (
                  <div key={log.id || index} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge className={`${getAgentColor(log.agent)} text-white`}>
                          AI {log.agent}
                        </Badge>
                        {log.decision && (
                          <Badge className={`${getDecisionColor(log.decision)} text-white`}>
                            {log.decision.toUpperCase()}
                          </Badge>
                        )}
                        <Badge className={`${getConfidenceColor(log.confidence)} text-white`}>
                          {(log.confidence * 100).toFixed(1)}%
                        </Badge>
                        {log.escalate && (
                          <Badge className="bg-yellow-600 text-white">
                            ⚠️ ESCALATED
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatTimestamp(log.timestamp)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <h4 className="text-white font-medium mb-1">Action</h4>
                        <p className="text-slate-300 text-sm">{log.action}</p>
                      </div>
                      {log.source && (
                        <div>
                          <h4 className="text-white font-medium mb-1">Source</h4>
                          <p className="text-slate-300 text-sm">{log.source}</p>
                        </div>
                      )}
                    </div>

                    {log.rationale && (
                      <div className="mb-3">
                        <h4 className="text-white font-medium mb-1">AI Reasoning</h4>
                        <p className="text-slate-300 text-sm bg-slate-800 p-3 rounded">
                          {log.rationale}
                        </p>
                      </div>
                    )}

                    {(log.input || log.output) && (
                      <details className="mt-3">
                        <summary className="text-white font-medium cursor-pointer hover:text-indigo-300">
                          View Input/Output Data
                        </summary>
                        <div className="mt-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {log.input && (
                            <div>
                              <h4 className="text-white font-medium mb-2">Input Data</h4>
                              <pre className="text-xs text-slate-300 bg-slate-800 p-3 rounded overflow-auto max-h-32">
                                {JSON.stringify(log.input, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.output && (
                            <div>
                              <h4 className="text-white font-medium mb-2">Output Data</h4>
                              <pre className="text-xs text-slate-300 bg-slate-800 p-3 rounded overflow-auto max-h-32">
                                {JSON.stringify(log.output, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
