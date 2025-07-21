'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  ChevronUp, 
  ChevronDown, 
  Search,
  AlertTriangle, 
  CheckCircle,
  Activity,
  Eye,
  ExternalLink
} from 'lucide-react'
import { AILogEntry } from '@/types/ai'

interface AIDecisionsTableProps {
  logs: AILogEntry[]
  loading?: boolean
  onRefresh?: () => void
}

type SortField = 'timestamp' | 'agent' | 'confidence' | 'escalation'
type SortDirection = 'asc' | 'desc'

interface SortConfig {
  field: SortField
  direction: SortDirection
}

export default function AIDecisionsTable({ logs, loading = false, onRefresh }: AIDecisionsTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'timestamp', direction: 'desc' })
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLog, setSelectedLog] = useState<AILogEntry | null>(null)

  // Sort and filter logs
  const processedLogs = useMemo(() => {
    let filtered = logs

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(log => 
        log.decision.toLowerCase().includes(term) ||
        log.agent.toLowerCase().includes(term) ||
        (log.notes && log.notes.toLowerCase().includes(term))
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortConfig.field]
      let bValue: any = b[sortConfig.field]

      // Handle different data types
      if (sortConfig.field === 'timestamp') {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      } else if (sortConfig.field === 'escalation') {
        aValue = a.escalation ? 1 : 0
        bValue = b.escalation ? 1 : 0
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })

    return filtered
  }, [logs, sortConfig, searchTerm])

  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) {
      return <ChevronUp className="h-4 w-4 text-neutral-500" />
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUp className="h-4 w-4 text-blue-400" /> : 
      <ChevronDown className="h-4 w-4 text-blue-400" />
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-400'
    if (confidence >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getConfidenceDot = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-400'
    if (confidence >= 60) return 'bg-yellow-400'
    return 'bg-red-400'
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString()
  }

  return (
    <Card className="bg-neutral-900 border-neutral-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live AI Decisions ({processedLogs.length})
          </CardTitle>
          
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Search decisions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-neutral-800 border-neutral-700 w-64"
              />
            </div>

            {/* Refresh Button */}
            {onRefresh && (
              <Button 
                onClick={onRefresh}
                disabled={loading}
                variant="outline"
                size="sm"
                className="border-neutral-700"
              >
                <Activity className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-neutral-700">
                <TableHead 
                  className="text-neutral-300 cursor-pointer hover:text-white"
                  onClick={() => handleSort('timestamp')}
                >
                  <div className="flex items-center gap-2">
                    Timestamp
                    {getSortIcon('timestamp')}
                  </div>
                </TableHead>
                
                <TableHead 
                  className="text-neutral-300 cursor-pointer hover:text-white"
                  onClick={() => handleSort('agent')}
                >
                  <div className="flex items-center gap-2">
                    Agent
                    {getSortIcon('agent')}
                  </div>
                </TableHead>
                
                <TableHead className="text-neutral-300">Decision</TableHead>
                
                <TableHead 
                  className="text-neutral-300 cursor-pointer hover:text-white"
                  onClick={() => handleSort('confidence')}
                >
                  <div className="flex items-center gap-2">
                    Confidence
                    {getSortIcon('confidence')}
                  </div>
                </TableHead>
                
                <TableHead 
                  className="text-neutral-300 cursor-pointer hover:text-white"
                  onClick={() => handleSort('escalation')}
                >
                  <div className="flex items-center gap-2">
                    Status
                    {getSortIcon('escalation')}
                  </div>
                </TableHead>
                
                <TableHead className="text-neutral-300">Notes</TableHead>
                <TableHead className="text-neutral-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {processedLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-neutral-400 py-8">
                    {searchTerm ? 'No decisions match your search' : 'No AI decisions yet'}
                  </TableCell>
                </TableRow>
              ) : (
                processedLogs.map((log, index) => (
                  <TableRow 
                    key={`${log.timestamp}-${index}`} 
                    className="border-neutral-700 hover:bg-neutral-800/50"
                  >
                    <TableCell className="text-neutral-300">
                      <div className="flex flex-col">
                        <span className="text-sm">{formatTimestamp(log.timestamp)}</span>
                        <span className="text-xs text-neutral-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={
                          log.agent === 'COO' 
                            ? 'border-purple-400 text-purple-400 bg-purple-400/10' 
                            : 'border-yellow-400 text-yellow-400 bg-yellow-400/10'
                        }
                      >
                        AI {log.agent}
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="text-neutral-300 max-w-xs">
                      <div className="truncate" title={log.decision}>
                        {log.decision}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getConfidenceDot(log.confidence)}`} />
                        <span className={`font-medium ${getConfidenceColor(log.confidence)}`}>
                          {log.confidence}%
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {log.escalation ? (
                        <Badge variant="destructive" className="bg-orange-600 hover:bg-orange-700">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Escalated
                        </Badge>
                      ) : (
                        <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Auto-Resolved
                        </Badge>
                      )}
                    </TableCell>
                    
                    <TableCell className="text-neutral-400 max-w-xs">
                      <div className="truncate" title={log.notes || 'No notes'}>
                        {log.notes || 'No notes'}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                        className="text-neutral-400 hover:text-white"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination info */}
        {processedLogs.length > 0 && (
          <div className="mt-4 text-sm text-neutral-400 text-center">
            Showing {processedLogs.length} of {logs.length} decisions
            {searchTerm && ` (filtered by "${searchTerm}")`}
          </div>
        )}
      </CardContent>

      {/* Log Detail Modal (placeholder) */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-neutral-900 border-neutral-700 max-w-2xl w-full mx-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Decision Details</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedLog(null)}
                  className="text-neutral-400 hover:text-white"
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-neutral-400">Agent</label>
                  <p className="text-white">AI {selectedLog.agent}</p>
                </div>
                <div>
                  <label className="text-sm text-neutral-400">Timestamp</label>
                  <p className="text-white">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm text-neutral-400">Confidence</label>
                  <p className={`font-medium ${getConfidenceColor(selectedLog.confidence)}`}>
                    {selectedLog.confidence}%
                  </p>
                </div>
                <div>
                  <label className="text-sm text-neutral-400">Status</label>
                  <p className={selectedLog.escalation ? 'text-orange-400' : 'text-green-400'}>
                    {selectedLog.escalation ? 'Escalated' : 'Auto-Resolved'}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-neutral-400">Decision</label>
                <p className="text-white bg-neutral-800 p-3 rounded-lg mt-1">
                  {selectedLog.decision}
                </p>
              </div>
              
              {selectedLog.notes && (
                <div>
                  <label className="text-sm text-neutral-400">Notes</label>
                  <p className="text-white bg-neutral-800 p-3 rounded-lg mt-1">
                    {selectedLog.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  )
}
