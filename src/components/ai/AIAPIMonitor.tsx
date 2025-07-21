'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import {
    Activity,
    AlertCircle,
    CheckCircle,
    Clock,
    Download,
    Eye,
    RefreshCw,
    X
} from 'lucide-react'
import { useEffect, useState } from 'react'

// Interface for API log entry
interface APILogEntry {
  id: string
  timestamp: string
  endpoint: string
  method: string
  payload: any
  status: number
  error: boolean
  errorMessage?: string
  responseTime?: number
  userAgent?: string
  ipAddress?: string
  requestSize?: number
  responseSize?: number
}

// Interface for API usage statistics
interface APIUsageStats {
  totalRequests: number
  successRate: number
  errorRate: number
  averageResponseTime: number
  topEndpoints: Array<{
    endpoint: string
    count: number
    errorRate: number
    avgResponseTime: number
  }>
  recentActivity: Array<{
    hour: string
    requests: number
    errors: number
  }>
}

interface AIAPIMonitorProps {
  className?: string
  maxHeight?: string
  showStats?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

export default function AIAPIMonitor({
  className,
  maxHeight = '600px',
  showStats = true,
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}: AIAPIMonitorProps) {
  const [logs, setLogs] = useState<APILogEntry[]>([])
  const [stats, setStats] = useState<APIUsageStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedLog, setSelectedLog] = useState<APILogEntry | null>(null)

  // Filters
  const [filters, setFilters] = useState({
    endpoint: 'all',
    status: '',
    error: 'all',
    limit: 50
  })

  // Load API logs
  const loadAPILogs = async () => {
    try {
      setLoading(true)
      setError(null)

      const queryParams = new URLSearchParams()
      if (filters.endpoint) queryParams.append('endpoint', filters.endpoint)
      if (filters.status) queryParams.append('status', filters.status)
      if (filters.error) queryParams.append('error', filters.error)
      queryParams.append('limit', filters.limit.toString())

      const response = await fetch(`/api/ai-monitor?${queryParams}`)

      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
        if (data.stats) {
          setStats(data.stats)
        }
      } else {
        // Mock data for development
        const mockLogs: APILogEntry[] = [
          {
            id: 'log-001',
            timestamp: new Date(Date.now() - 300000).toISOString(),
            endpoint: '/api/ai-coo',
            method: 'POST',
            payload: { jobType: 'Cleaning', address: 'Test Villa', value: 5000 },
            status: 200,
            error: false,
            responseTime: 1250,
            requestSize: 156,
            responseSize: 342
          },
          {
            id: 'log-002',
            timestamp: new Date(Date.now() - 600000).toISOString(),
            endpoint: '/api/ai-cfo',
            method: 'POST',
            payload: { expenses: [{ amount: 3200, category: 'Maintenance' }] },
            status: 200,
            error: false,
            responseTime: 890,
            requestSize: 234,
            responseSize: 567
          },
          {
            id: 'log-003',
            timestamp: new Date(Date.now() - 900000).toISOString(),
            endpoint: '/api/ai-coo',
            method: 'POST',
            payload: { jobType: 'Cleaning' }, // Missing address
            status: 400,
            error: true,
            errorMessage: 'Missing required field: address',
            responseTime: 45,
            requestSize: 89,
            responseSize: 156
          },
          {
            id: 'log-004',
            timestamp: new Date(Date.now() - 1200000).toISOString(),
            endpoint: '/api/ai-policy',
            method: 'GET',
            payload: {},
            status: 200,
            error: false,
            responseTime: 234,
            requestSize: 0,
            responseSize: 1234
          },
          {
            id: 'log-005',
            timestamp: new Date(Date.now() - 1500000).toISOString(),
            endpoint: '/api/ai-feedback',
            method: 'POST',
            payload: { logId: 'test-001', outcome: 'success' },
            status: 200,
            error: false,
            responseTime: 567,
            requestSize: 123,
            responseSize: 289
          }
        ]

        const mockStats: APIUsageStats = {
          totalRequests: 45,
          successRate: 91.1,
          errorRate: 8.9,
          averageResponseTime: 678,
          topEndpoints: [
            { endpoint: '/api/ai-coo', count: 18, errorRate: 11.1, avgResponseTime: 892 },
            { endpoint: '/api/ai-cfo', count: 12, errorRate: 8.3, avgResponseTime: 567 },
            { endpoint: '/api/ai-policy', count: 8, errorRate: 0, avgResponseTime: 234 },
            { endpoint: '/api/ai-feedback', count: 7, errorRate: 14.3, avgResponseTime: 445 }
          ],
          recentActivity: Array.from({ length: 24 }, (_, i) => ({
            hour: String(23 - i).padStart(2, '0') + ':00',
            requests: Math.floor(Math.random() * 10) + 1,
            errors: Math.floor(Math.random() * 3)
          }))
        }

        setLogs(mockLogs)
        setStats(mockStats)
      }
    } catch (err) {
      console.error('Error loading API logs:', err)
      setError(err instanceof Error ? err.message : 'Failed to load API logs')
    } finally {
      setLoading(false)
    }
  }

  // Auto-refresh effect
  useEffect(() => {
    loadAPILogs()

    if (autoRefresh) {
      const interval = setInterval(loadAPILogs, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, filters])

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  // Format payload for display
  const formatPayload = (payload: any) => {
    if (!payload || Object.keys(payload).length === 0) return '{}'
    const str = JSON.stringify(payload)
    return str.length > 100 ? str.substring(0, 100) + '...' : str
  }

  // Get status badge color
  const getStatusColor = (status: number, error: boolean) => {
    if (error || status >= 400) return 'destructive'
    if (status >= 200 && status < 300) return 'default'
    return 'secondary'
  }

  // Export logs as JSON
  const exportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ai-api-logs-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Statistics Cards */}
      {showStats && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Total Requests</p>
                  <p className="text-2xl font-bold text-white">{stats?.totalRequests || 0}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Success Rate</p>
                  <p className="text-2xl font-bold text-green-400">{stats?.successRate?.toFixed(1) || '0.0'}%</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Error Rate</p>
                  <p className="text-2xl font-bold text-red-400">{stats?.errorRate?.toFixed(1) || '0.0'}%</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Avg Response</p>
                  <p className="text-2xl font-bold text-white">{Math.round(stats?.averageResponseTime || 0)}ms</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Monitor Card */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                ⚙️ AI API Monitor
              </CardTitle>
              <p className="text-sm text-neutral-400 mt-1">
                Tracks recent calls to AI endpoints with status codes, timing, and error flags.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {logs.length} Logs
              </Badge>
              <Button variant="outline" size="sm" onClick={exportLogs}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={loadAPILogs} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-2 p-3 bg-neutral-800 border border-neutral-700 rounded-lg">
            <Select value={filters.endpoint} onValueChange={(value) => setFilters(prev => ({ ...prev, endpoint: value === 'all' ? '' : value }))}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by endpoint" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Endpoints</SelectItem>
                <SelectItem value="/api/ai-coo">AI COO</SelectItem>
                <SelectItem value="/api/ai-cfo">AI CFO</SelectItem>
                <SelectItem value="/api/ai-policy">AI Policy</SelectItem>
                <SelectItem value="/api/ai-feedback">AI Feedback</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.error} onValueChange={(value) => setFilters(prev => ({ ...prev, error: value === 'all' ? '' : value }))}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Errors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Errors Only</SelectItem>
                <SelectItem value="false">Success Only</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Status code..."
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-32"
            />
          </div>

          {/* Logs Table */}
          <div className="overflow-x-auto" style={{ maxHeight }}>
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-neutral-900 border-b border-neutral-700">
                <tr>
                  <th className="text-left p-2 text-white">⏱️ Time</th>
                  <th className="text-left p-2 text-white">📡 Endpoint</th>
                  <th className="text-left p-2 text-white">📦 Payload</th>
                  <th className="text-left p-2 text-white">✅ Status</th>
                  <th className="text-left p-2 text-white">⚠️ Error?</th>
                  <th className="text-left p-2 text-white">⚡ Time</th>
                  <th className="text-left p-2 text-white">👁️ View</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-white">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-neutral-400" />
                      Loading API logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-neutral-400">
                      No API logs found
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-t border-neutral-700 hover:bg-neutral-800/50">
                      <td className="p-2 text-xs text-neutral-300">{formatTimestamp(log.timestamp)}</td>
                      <td className="p-2">
                        <Badge variant="outline" className="text-xs">
                          {log.method}
                        </Badge>
                        <span className="ml-2 font-mono text-xs text-neutral-300">{log.endpoint}</span>
                      </td>
                      <td className="p-2 font-mono text-xs max-w-xs truncate text-neutral-300">
                        {formatPayload(log.payload)}
                      </td>
                      <td className="p-2">
                        <Badge variant={getStatusColor(log.status, log.error)}>
                          {log.status}
                        </Badge>
                      </td>
                      <td className={`p-2 ${log.error ? "text-red-500" : "text-green-500"}`}>
                        {log.error ? "Yes" : "No"}
                      </td>
                      <td className="p-2 text-xs">
                        {log.responseTime ? `${log.responseTime}ms` : '-'}
                      </td>
                      <td className="p-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Log Details</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedLog(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
