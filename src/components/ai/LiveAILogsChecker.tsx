'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { RefreshCw, Activity, Brain, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'
import { getAILogs, AILogEntry } from '@/lib/ai/aiLogger'

interface LiveAILogsCheckerProps {
  className?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

export default function LiveAILogsChecker({ 
  className = '',
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}: LiveAILogsCheckerProps) {
  const [logs, setLogs] = useState<AILogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load live AI logs
  const loadLiveLogs = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('🔍 Checking live AI action logs...')
      
      // Get logs with LIVE filter
      const liveLogs = await getAILogs({ 
        filter: "LIVE", 
        limit: 10 
      })
      
      console.log(`📊 Found ${liveLogs.length} live AI action logs`)
      
      // Log each decision as requested
      liveLogs.forEach((log) => {
        console.log("📌 AI Decision:", log.agent, log.decision, "🧠 Confidence:", log.confidence)
      })
      
      setLogs(liveLogs)
      setLastUpdate(new Date())
      
    } catch (err) {
      console.error('❌ Error loading live logs:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // Auto-refresh effect
  useEffect(() => {
    loadLiveLogs()
    
    if (autoRefresh) {
      const interval = setInterval(loadLiveLogs, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

  const getAgentColor = (agent: string) => {
    switch (agent) {
      case 'COO': return 'bg-blue-600'
      case 'CFO': return 'bg-purple-600'
      default: return 'bg-gray-600'
    }
  }

  const getDecisionColor = (decision: string) => {
    if (decision.toLowerCase().includes('approved')) return 'text-green-400'
    if (decision.toLowerCase().includes('rejected')) return 'text-red-400'
    if (decision.toLowerCase().includes('escalated')) return 'text-yellow-400'
    return 'text-slate-300'
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-400'
    if (confidence >= 0.7) return 'text-yellow-400'
    return 'text-red-400'
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-400" />
              🟢 Live AI Actions Monitor
            </CardTitle>
            <div className="flex items-center gap-3">
              {lastUpdate && (
                <span className="text-sm text-slate-400">
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
              <Button
                onClick={loadLiveLogs}
                disabled={loading}
                variant="outline"
                size="sm"
                className="border-slate-600"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{logs.length}</div>
              <div className="text-sm text-slate-400">Live Actions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {logs.filter(log => log.agent === 'COO').length}
              </div>
              <div className="text-sm text-slate-400">COO Decisions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {logs.filter(log => log.agent === 'CFO').length}
              </div>
              <div className="text-sm text-slate-400">CFO Decisions</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="bg-red-900/50 border-red-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-300">
              <AlertTriangle className="w-4 h-4" />
              <span>Error loading live logs: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Logs Display */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-400" />
            Recent Live AI Decisions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && logs.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-slate-400">Loading live AI logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No live AI actions found</p>
              <p className="text-sm text-slate-500 mt-2">
                Live actions will appear here when the system processes real bookings
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log, index) => (
                <div key={`${log.timestamp}-${index}`} className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge className={`${getAgentColor(log.agent)} text-white`}>
                        {log.agent}
                      </Badge>
                      <div className={`font-medium ${getDecisionColor(log.decision)}`}>
                        {log.decision}
                      </div>
                      <div className="flex items-center gap-1">
                        <Brain className="w-4 h-4 text-slate-400" />
                        <span className={`font-medium ${getConfidenceColor(log.confidence)}`}>
                          {(log.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-slate-400">
                      {formatTimestamp(log.timestamp)}
                    </div>
                  </div>

                  {log.rationale && (
                    <div className="mb-3">
                      <div className="text-sm text-slate-300">{log.rationale}</div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Source: {log.source}
                    </div>
                    {log.escalate && (
                      <div className="flex items-center gap-1 text-yellow-400">
                        <AlertTriangle className="w-3 h-3" />
                        Escalated
                      </div>
                    )}
                    {log.metadata?.liveMode && (
                      <div className="flex items-center gap-1 text-green-400">
                        <Activity className="w-3 h-3" />
                        Live Mode
                      </div>
                    )}
                  </div>

                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <details className="mt-3">
                      <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-300">
                        View Metadata
                      </summary>
                      <pre className="text-xs text-slate-400 mt-2 p-2 bg-slate-800 rounded overflow-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Console Output Display */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Console Output
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black p-4 rounded font-mono text-sm">
            <div className="text-green-400 mb-2">// Check logs from live AI actions</div>
            <div className="text-blue-400 mb-2">const logs = await getAILogs(&#123; filter: "LIVE", limit: 10 &#125;);</div>
            <div className="text-gray-400 mb-4">
              logs.forEach((log) =&gt; &#123;<br />
              &nbsp;&nbsp;console.log("📌 AI Decision:", log.agent, log.decision, "🧠 Confidence:", log.confidence);<br />
              &#125;);
            </div>
            
            {logs.length > 0 ? (
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="text-white">
                    📌 AI Decision: {log.agent} {log.decision} 🧠 Confidence: {log.confidence}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-yellow-400">No live AI actions found. Run a live booking test to see results.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
