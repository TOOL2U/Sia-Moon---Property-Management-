'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import {
  Brain,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  RefreshCw,
  Settings,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Shield
} from 'lucide-react'
import { AILogEntry } from '@/types/ai'
import AIDecisionsTable from '@/components/admin/AIDecisionsTable'
import AIAnalyticsSidebar from '@/components/admin/AIAnalyticsSidebar'
import AIEscalationQueue from '@/components/admin/AIEscalationQueue'
import OverridePanel from '@/components/admin/OverridePanel'

interface DashboardFilters {
  agent: 'all' | 'COO' | 'CFO'
  escalated: 'all' | 'true' | 'false'
  confidenceMin: number
}

interface DashboardStats {
  totalDecisions: number
  escalatedCount: number
  avgConfidence: number
  cooDecisions: number
  cfoDecisions: number
}

export default function AIDashboardPage() {
  const [logs, setLogs] = useState<AILogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<AILogEntry[]>([])
  const [filters, setFilters] = useState<DashboardFilters>({
    agent: 'all',
    escalated: 'all',
    confidenceMin: 0
  })
  const [stats, setStats] = useState<DashboardStats>({
    totalDecisions: 0,
    escalatedCount: 0,
    avgConfidence: 0,
    cooDecisions: 0,
    cfoDecisions: 0
  })
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Manual controls state
  const [selectedAgent, setSelectedAgent] = useState<'COO' | 'CFO'>('COO')
  const [newRule, setNewRule] = useState('')

  // Override management state
  const [overrideHistory, setOverrideHistory] = useState<any[]>([])
  const [showOverridePanel, setShowOverridePanel] = useState<string | null>(null)
  const [overrideStats, setOverrideStats] = useState({
    total: 0,
    recent: 0,
    byAction: {} as Record<string, number>
  })

  // Load AI logs and update dashboard
  const loadAILogs = async () => {
    try {
      setLoading(true)

      // Try to fetch from API, fallback to mock data
      let logsData: AILogEntry[] = []

      try {
        const response = await fetch('/api/ai-log')
        if (response.ok) {
          const result = await response.json()
          logsData = result.logs || []
        } else {
          throw new Error('API not available')
        }
      } catch (apiError) {
        console.log('API not available, using mock data:', apiError)
        logsData = generateMockLogs()
      }

      setLogs(logsData)

      // Calculate stats
      const newStats = calculateStats(logsData)
      setStats(newStats)

      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to load AI logs:', error)
      // Fallback to empty state
      setLogs([])
      setStats({
        totalDecisions: 0,
        escalatedCount: 0,
        avgConfidence: 0,
        cooDecisions: 0,
        cfoDecisions: 0
      })
    } finally {
      setLoading(false)
    }
  }

  // Apply filters to logs
  useEffect(() => {
    let filtered = logs

    if (filters.agent !== 'all') {
      filtered = filtered.filter(log => log.agent === filters.agent)
    }

    if (filters.escalated !== 'all') {
      const isEscalated = filters.escalated === 'true'
      filtered = filtered.filter(log => log.escalation === isEscalated)
    }

    if (filters.confidenceMin > 0) {
      filtered = filtered.filter(log => log.confidence >= filters.confidenceMin)
    }

    setFilteredLogs(filtered)
  }, [logs, filters])

  // Load data on mount and set up refresh interval
  useEffect(() => {
    loadAILogs()
    loadOverrideHistory()

    // Refresh every 15 seconds for real-time updates
    const interval = setInterval(() => {
      loadAILogs()
      loadOverrideHistory()
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  // Auto-refresh when new data is available (simulated)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Refresh when user returns to tab
        loadAILogs()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const handleManualRefresh = () => {
    loadAILogs()
  }

  const handleSubmitRule = async () => {
    if (!newRule.trim()) return

    try {
      // Future: POST to /api/ai-policy
      console.log(`Submitting new rule for ${selectedAgent}:`, newRule)

      // Mock success for now
      alert(`New rule submitted for AI ${selectedAgent}:\n"${newRule}"`)
      setNewRule('')
    } catch (error) {
      console.error('Failed to submit rule:', error)
    }
  }

  const handleApproveEscalation = async (log: AILogEntry, notes?: string) => {
    try {
      console.log('Approving escalated decision:', log.decision, 'Notes:', notes)

      // Future: POST to /api/ai-escalation/approve
      // For now, just show success message
      alert(`Decision approved: ${log.decision}${notes ? `\nNotes: ${notes}` : ''}`)

      // Refresh logs to update the queue
      await loadAILogs()
    } catch (error) {
      console.error('Failed to approve escalation:', error)
    }
  }

  const handleRejectEscalation = async (log: AILogEntry, notes?: string) => {
    try {
      console.log('Rejecting escalated decision:', log.decision, 'Notes:', notes)

      // Future: POST to /api/ai-escalation/reject
      // For now, just show success message
      alert(`Decision rejected: ${log.decision}${notes ? `\nNotes: ${notes}` : ''}`)

      // Refresh logs to update the queue
      await loadAILogs()
    } catch (error) {
      console.error('Failed to reject escalation:', error)
    }
  }

  // Load override history
  const loadOverrideHistory = async () => {
    try {
      const response = await fetch('/api/ai-log/override')
      if (response.ok) {
        const result = await response.json()
        setOverrideHistory(result.overrides || [])

        // Calculate override stats
        const stats = {
          total: result.overrides?.length || 0,
          recent: result.overrides?.filter((o: any) => {
            const overrideTime = new Date(o.timestamp)
            const now = new Date()
            return (now.getTime() - overrideTime.getTime()) < 24 * 60 * 60 * 1000
          }).length || 0,
          byAction: result.overrides?.reduce((acc: any, o: any) => {
            acc[o.overrideAction] = (acc[o.overrideAction] || 0) + 1
            return acc
          }, {}) || {}
        }
        setOverrideStats(stats)
      }
    } catch (error) {
      console.error('Failed to load override history:', error)
    }
  }

  // Handle override submission
  const handleOverrideSubmitted = async (overrideData: any) => {
    console.log('Override submitted:', overrideData)

    // Refresh data
    await loadAILogs()
    await loadOverrideHistory()

    // Close override panel
    setShowOverridePanel(null)
  }

  // Calculate derived data
  const escalatedLogs = filteredLogs.filter(log => log.escalation)

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-8 w-8 text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold">AI Operations Dashboard</h1>
              <p className="text-neutral-400">Real-time monitoring of AI COO & CFO agents</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-neutral-400">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
            <Button
              onClick={handleManualRefresh}
              disabled={loading}
              variant="outline"
              size="sm"
              className="border-neutral-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-400">Total Decisions</p>
                <p className="text-2xl font-bold">{stats.totalDecisions}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-400">Escalated</p>
                <p className="text-2xl font-bold text-orange-400">{stats.escalatedCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-400">Avg Confidence</p>
                <p className="text-2xl font-bold text-green-400">{stats.avgConfidence}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-400">COO Decisions</p>
                <p className="text-2xl font-bold text-purple-400">{stats.cooDecisions}</p>
              </div>
              <Users className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-400">CFO Decisions</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.cfoDecisions}</p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content - 3 columns */}
        <div className="lg:col-span-3 space-y-6">

          {/* Live AI Decisions Table */}
          <AIDecisionsTable
            logs={filteredLogs}
            loading={loading}
            onRefresh={handleManualRefresh}
          />

          {/* Escalation Queue */}
          <AIEscalationQueue
            logs={filteredLogs}
            onApprove={handleApproveEscalation}
            onReject={handleRejectEscalation}
          />

          {/* Manual Override Panels for Escalated Decisions */}
          {filteredLogs.filter(log => log.escalation).map((log, index) => (
            <OverridePanel
              key={`${log.timestamp}-${index}`}
              logEntry={log}
              logId={`${log.agent}_${new Date(log.timestamp).getTime()}_${index}`}
              onOverrideSubmitted={handleOverrideSubmitted}
              className="mt-4"
            />
          ))}


        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">

          {/* Analytics Sidebar */}
          <AIAnalyticsSidebar logs={filteredLogs} />

          {/* Manual Controls Panel */}
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Manual Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-neutral-400 mb-2 block">Select Agent</label>
                <Select value={selectedAgent} onValueChange={(value: any) => setSelectedAgent(value)}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COO">AI COO</SelectItem>
                    <SelectItem value="CFO">AI CFO</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-neutral-400 mb-2 block">Inject New Rule</label>
                <Textarea
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  placeholder="Enter a new rule or override prompt..."
                  className="bg-neutral-800 border-neutral-700 min-h-[100px]"
                />
              </div>

              <Button
                onClick={handleSubmitRule}
                disabled={!newRule.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Submit Rule
              </Button>
            </CardContent>
          </Card>

          {/* Active Rules */}
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-sm">Active Company Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="text-neutral-400">• Jobs {'>'}฿5000 require approval</div>
                <div className="text-neutral-400">• Staff assignments within 5km</div>
                <div className="text-neutral-400">• Confidence {'<'}80% escalates</div>
                <div className="text-neutral-400">• Emergency repairs flagged</div>
                <div className="text-neutral-400">• Duplicate expenses detected</div>
              </div>
            </CardContent>
          </Card>

          {/* Override Statistics */}
          <Card className="bg-neutral-900 border-orange-600/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm text-orange-400">
                <Shield className="h-4 w-4" />
                Manual Overrides
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Total Overrides</span>
                  <span className="text-white font-medium">{overrideStats.total}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Last 24h</span>
                  <span className={`font-medium ${
                    overrideStats.recent > 5 ? 'text-red-400' :
                    overrideStats.recent > 2 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {overrideStats.recent}
                  </span>
                </div>

                {Object.keys(overrideStats.byAction).length > 0 && (
                  <div className="pt-2 border-t border-neutral-700">
                    <div className="text-neutral-400 text-xs mb-2">By Action</div>
                    {Object.entries(overrideStats.byAction).map(([action, count]) => (
                      <div key={action} className="flex items-center justify-between">
                        <span className="text-neutral-400 capitalize text-xs">{action}</span>
                        <span className="text-neutral-300 text-xs">{count}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t border-neutral-700">
                  <div className="text-xs text-neutral-500">
                    Override rate: {logs.length > 0 ? ((overrideStats.total / logs.length) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Mock data generator for testing
function generateMockLogs(): AILogEntry[] {
  const decisions = [
    'Booking approved for Villa Lotus',
    'Staff assigned to cleaning task',
    'High-value expense flagged for review',
    'Financial analysis completed',
    'Emergency repair request escalated',
    'Monthly budget analysis finished',
    'Booking rejected - insufficient data',
    'Duplicate expense detected'
  ]

  const agents: ('COO' | 'CFO')[] = ['COO', 'CFO']
  const sources = ['auto']

  return Array.from({ length: 20 }, (_, i) => ({
    timestamp: new Date(Date.now() - i * 1000 * 60 * 30).toISOString(),
    agent: agents[Math.floor(Math.random() * agents.length)],
    decision: decisions[Math.floor(Math.random() * decisions.length)],
    confidence: Math.floor(Math.random() * 40) + 60, // 60-100
    source: sources[0],
    escalation: Math.random() < 0.3, // 30% escalation rate
    notes: Math.random() < 0.7 ? 'Additional context provided' : undefined
  }))
}

// Calculate dashboard statistics
function calculateStats(logs: AILogEntry[]): DashboardStats {
  const totalDecisions = logs.length
  const escalatedCount = logs.filter(log => log.escalation).length
  const avgConfidence = Math.round(logs.reduce((sum, log) => sum + log.confidence, 0) / totalDecisions) || 0
  const cooDecisions = logs.filter(log => log.agent === 'COO').length
  const cfoDecisions = logs.filter(log => log.agent === 'CFO').length

  return {
    totalDecisions,
    escalatedCount,
    avgConfidence,
    cooDecisions,
    cfoDecisions
  }
}
