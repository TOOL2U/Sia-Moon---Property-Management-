'use client'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    AlertTriangle,
    Brain,
    ChevronDown,
    ChevronUp,
    Clock,
    Code,
    Eye,
    RefreshCw
} from 'lucide-react'
import { useEffect, useState } from 'react'

// Import AI system prompts for visibility
const AI_COO_SYSTEM_PROMPT = `You are an AI Chief Operating Officer (COO) for a premium villa property management company in Thailand. Your role is to analyze booking requests, assign staff, ensure compliance, and optimize operations.`

const AI_CFO_SYSTEM_PROMPT = `You are an AI Chief Financial Officer (CFO) for a premium villa property management company in Thailand. Your role is to analyze financial transactions, approve/reject expenses, monitor cash flow, and ensure financial compliance.`

// Interface for AI decision log entry
interface AIDecisionEntry {
  id: string
  timestamp: string
  agent: 'COO' | 'CFO'
  decision: string
  confidence: number
  rationale: string
  escalate: boolean
  status: 'completed' | 'escalated' | 'pending'
  metadata?: any
  rawResponse?: any
  simulated?: boolean
  processingTime?: number
}

interface AIDecisionLogProps {
  className?: string
  maxHeight?: string
  showTestRunner?: boolean
}

export default function AIDecisionLog({
  className,
  maxHeight = '600px',
  showTestRunner = true
}: AIDecisionLogProps) {
  const [logs, setLogs] = useState<AIDecisionEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const [showRawJSON, setShowRawJSON] = useState<string | null>(null)
  const [showPrompts, setShowPrompts] = useState(false)

  // Load AI decision logs
  const loadLogs = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/ai-log')

      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      } else {
        console.warn('⚠️ AI Decision Log: Failed to load logs')
        setLogs([])
      }
    } catch (err) {
      console.error('Error loading AI logs:', err)
      setError(err instanceof Error ? err.message : 'Failed to load AI logs')
    } finally {
      setLoading(false)
    }
  }



  // Load logs on component mount
  useEffect(() => {
    loadLogs()
  }, [])

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Get status badge variant
  const getStatusVariant = (status: string, escalate: boolean) => {
    if (escalate) return 'destructive'
    if (status === 'completed') return 'default'
    return 'secondary'
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with Test Runners */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">AI Decision Logs</h3>
          <p className="text-sm text-muted-foreground">
            Track AI agent decisions, confidence levels, and reasoning
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* AI System Prompts (Collapsible) */}
      <Card>
        <CardHeader className="pb-3">
          <Button
            variant="ghost"
            onClick={() => setShowPrompts(!showPrompts)}
            className="flex items-center justify-between w-full p-0 h-auto"
          >
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-500" />
              <span className="font-medium">AI System Prompts</span>
            </div>
            {showPrompts ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CardHeader>

        {showPrompts && (
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2">🏢 AI COO System Prompt</h4>
              <div className="bg-gray-50 p-3 rounded text-xs">
                {AI_COO_SYSTEM_PROMPT}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">💰 AI CFO System Prompt</h4>
              <div className="bg-gray-50 p-3 rounded text-xs">
                {AI_CFO_SYSTEM_PROMPT}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Logs List */}
      <div className="space-y-3" style={{ maxHeight, overflowY: 'auto' }}>
        {loading && logs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading AI decision logs...</p>
            </CardContent>
          </Card>
        ) : logs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No AI decisions logged yet</p>
              <p className="text-sm mt-2">AI agent decisions will appear here</p>

            </CardContent>
          </Card>
        ) : (
          logs.map((log) => (
            <Card key={log.id} className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      AI {log.agent}
                    </Badge>
                    <Badge variant={getStatusVariant(log.status, log.escalate)}>
                      {log.escalate ? 'Escalated' : log.status}
                    </Badge>
                    {log.simulated && (
                      <Badge variant="secondary" className="text-xs">
                        🧪 Simulated
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatTimestamp(log.timestamp)}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Decision: {log.decision}</span>
                    <span className={`font-medium ${getConfidenceColor(log.confidence)}`}>
                      {Math.round(log.confidence * 100)}% confidence
                    </span>
                  </div>

                  <p className="text-sm text-gray-600">{log.rationale}</p>

                  {log.processingTime && (
                    <p className="text-xs text-muted-foreground">
                      Processing time: {log.processingTime}ms
                    </p>
                  )}
                </div>

                {/* Expandable Details */}
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {expandedLog === log.id ? 'Hide' : 'Show'} Details
                  </Button>

                  {process.env.NODE_ENV === 'development' && log.rawResponse && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowRawJSON(showRawJSON === log.id ? null : log.id)}
                    >
                      <Code className="h-4 w-4 mr-1" />
                      Raw JSON
                    </Button>
                  )}
                </div>

                {/* Expanded Details */}
                {expandedLog === log.id && (
                  <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                    <h4 className="font-medium mb-2">Metadata:</h4>
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Raw JSON Debug (Development Only) */}
                {process.env.NODE_ENV === 'development' && showRawJSON === log.id && log.rawResponse && (
                  <details className="mt-3 text-xs text-muted-foreground bg-muted p-2 rounded-md">
                    <summary className="cursor-pointer font-medium">View Raw AI JSON Response</summary>
                    <pre className="mt-2 overflow-auto">
                      {JSON.stringify(log.rawResponse, null, 2)}
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
