'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

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
}

export default function AILogsTestPage() {
  const [logs, setLogs] = useState<AILogEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('test-booking-001')

  const fetchAILogs = async (source?: string) => {
    setIsLoading(true)
    setError(null)

    try {
      console.log(`📘 Fetching AI logs for source: ${source || 'all'}`)

      // Build query parameters
      const params = new URLSearchParams()
      if (source) params.append('source', source)
      params.append('limit', '50')

      const response = await fetch(`/api/ai-log?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('📊 AI Logs Response:', data)

      if (data.success && data.logs) {
        setLogs(data.logs)
        console.log(`✅ Retrieved ${data.logs.length} AI log entries`)
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
    fetchAILogs(filter)
  }, [])

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            📘 AI Decision Logs Inspector
          </h1>
          <p className="text-blue-200">
            View AI COO and CFO decision logs, confidence scores, and reasoning
          </p>
        </div>

        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              🔍 Log Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Source Filter
                </label>
                <input
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="e.g., test-booking-001"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400"
                />
              </div>
              <Button
                onClick={() => fetchAILogs(filter)}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Loading...
                  </>
                ) : (
                  '🔍 Fetch Logs'
                )}
              </Button>
              <Button
                onClick={() => fetchAILogs()}
                disabled={isLoading}
                variant="outline"
                className="border-slate-600 text-slate-300"
              >
                📋 All Logs
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

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span>📊 AI Decision Logs</span>
              <Badge variant="secondary">
                {logs.length} entries
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full" />
                    <span>Loading AI logs...</span>
                  </div>
                ) : (
                  <div>
                    <p className="mb-2">No AI logs found</p>
                    <p className="text-sm">Try running a booking simulation first</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log, index) => (
                  <div key={log.id || index} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge className={`${log.agent === 'COO' ? 'bg-blue-600' : 'bg-purple-600'} text-white`}>
                          AI {log.agent}
                        </Badge>
                        {log.decision && (
                          <Badge className={`${getDecisionColor(log.decision)} text-white`}>
                            {log.decision.toUpperCase()}
                          </Badge>
                        )}
                        <Badge className={`${getConfidenceColor(log.confidence)} text-white`}>
                          {(log.confidence * 100).toFixed(1)}% confidence
                        </Badge>
                        {log.escalate && (
                          <Badge className="bg-yellow-600 text-white">
                            ⚠️ ESCALATED
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
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
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
