'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  User,
  MessageSquare,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { AILogEntry } from '@/types/ai'

interface AIEscalationQueueProps {
  logs: AILogEntry[]
  onApprove?: (log: AILogEntry, notes?: string) => void
  onReject?: (log: AILogEntry, notes?: string) => void
}

interface EscalationAction {
  logIndex: number
  action: 'approve' | 'reject' | null
  notes: string
  expanded: boolean
}

export default function AIEscalationQueue({ logs, onApprove, onReject }: AIEscalationQueueProps) {
  const escalatedLogs = logs.filter(log => log.escalation)
  const [actions, setActions] = useState<Record<number, EscalationAction>>({})

  const updateAction = (index: number, updates: Partial<EscalationAction>) => {
    setActions(prev => ({
      ...prev,
      [index]: {
        logIndex: index,
        action: null,
        notes: '',
        expanded: false,
        ...prev[index],
        ...updates
      }
    }))
  }

  const handleSubmitAction = async (log: AILogEntry, index: number) => {
    const action = actions[index]
    if (!action?.action) return

    try {
      if (action.action === 'approve' && onApprove) {
        await onApprove(log, action.notes)
      } else if (action.action === 'reject' && onReject) {
        await onReject(log, action.notes)
      }

      // Clear the action after submission
      setActions(prev => {
        const newActions = { ...prev }
        delete newActions[index]
        return newActions
      })
    } catch (error) {
      console.error('Failed to submit action:', error)
    }
  }

  const getPriorityLevel = (log: AILogEntry) => {
    if (log.confidence < 50) return 'high'
    if (log.confidence < 70) return 'medium'
    return 'low'
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 border-red-400'
      case 'medium': return 'text-yellow-400 border-yellow-400'
      case 'low': return 'text-blue-400 border-blue-400'
      default: return 'text-neutral-400 border-neutral-400'
    }
  }

  const getTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return time.toLocaleDateString()
  }

  if (escalatedLogs.length === 0) {
    return (
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            Escalation Queue (0)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">All Clear!</h3>
            <p className="text-neutral-400">
              No escalated decisions require manual review at this time.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-neutral-900 border-orange-600">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-400">
          <AlertTriangle className="h-5 w-5" />
          Escalation Queue ({escalatedLogs.length})
        </CardTitle>
        <p className="text-sm text-neutral-400 mt-1">
          AI decisions requiring manual review and approval
        </p>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {escalatedLogs.map((log, index) => {
            const priority = getPriorityLevel(log)
            const action = actions[index]
            
            return (
              <div 
                key={`${log.timestamp}-${index}`} 
                className="bg-neutral-800 rounded-lg border border-orange-600/30 overflow-hidden"
              >
                {/* Header */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
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
                      
                      <Badge 
                        variant="outline" 
                        className={`${getPriorityColor(priority)} bg-transparent`}
                      >
                        {priority.toUpperCase()} PRIORITY
                      </Badge>
                      
                      <div className="flex items-center gap-1 text-sm text-neutral-400">
                        <Clock className="h-3 w-3" />
                        {getTimeAgo(log.timestamp)}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateAction(index, { expanded: !action?.expanded })}
                      className="text-neutral-400 hover:text-white"
                    >
                      {action?.expanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Decision Summary */}
                  <div className="mb-3">
                    <h4 className="text-white font-medium mb-1">Decision</h4>
                    <p className="text-neutral-300 bg-neutral-700 p-3 rounded-lg">
                      {log.decision}
                    </p>
                  </div>

                  {/* Confidence & Notes */}
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <span className="text-sm text-neutral-400">Confidence Score</span>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`w-2 h-2 rounded-full ${
                          log.confidence >= 80 ? 'bg-green-400' : 
                          log.confidence >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                        }`} />
                        <span className={`font-medium ${
                          log.confidence >= 80 ? 'text-green-400' : 
                          log.confidence >= 60 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {log.confidence}%
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-sm text-neutral-400">Source</span>
                      <p className="text-neutral-300 mt-1 capitalize">{log.source}</p>
                    </div>
                  </div>

                  {log.notes && (
                    <div className="mb-3">
                      <span className="text-sm text-neutral-400">Additional Notes</span>
                      <p className="text-neutral-300 bg-neutral-700 p-3 rounded-lg mt-1">
                        {log.notes}
                      </p>
                    </div>
                  )}

                  {/* Quick Actions */}
                  {!action?.expanded && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateAction(index, { action: 'approve', expanded: true })}
                        className="border-green-600 text-green-400 hover:bg-green-600/10"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateAction(index, { action: 'reject', expanded: true })}
                        className="border-red-600 text-red-400 hover:bg-red-600/10"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateAction(index, { expanded: true })}
                        className="text-neutral-400 hover:text-white"
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                    </div>
                  )}
                </div>

                {/* Expanded Action Panel */}
                {action?.expanded && (
                  <div className="border-t border-neutral-700 p-4 bg-neutral-800/50">
                    <div className="space-y-4">
                      {/* Action Selection */}
                      <div>
                        <label className="text-sm text-neutral-400 mb-2 block">Action</label>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={action.action === 'approve' ? 'default' : 'outline'}
                            onClick={() => updateAction(index, { action: 'approve' })}
                            className={action.action === 'approve' 
                              ? 'bg-green-600 hover:bg-green-700' 
                              : 'border-green-600 text-green-400 hover:bg-green-600/10'
                            }
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          
                          <Button
                            size="sm"
                            variant={action.action === 'reject' ? 'default' : 'outline'}
                            onClick={() => updateAction(index, { action: 'reject' })}
                            className={action.action === 'reject' 
                              ? 'bg-red-600 hover:bg-red-700' 
                              : 'border-red-600 text-red-400 hover:bg-red-600/10'
                            }
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="text-sm text-neutral-400 mb-2 block">
                          Review Notes {action.action && '(Required)'}
                        </label>
                        <Textarea
                          value={action.notes}
                          onChange={(e) => updateAction(index, { notes: e.target.value })}
                          placeholder={
                            action.action === 'approve' 
                              ? 'Explain why you approved this decision...'
                              : action.action === 'reject'
                              ? 'Explain why you rejected this decision...'
                              : 'Add your review notes...'
                          }
                          className="bg-neutral-700 border-neutral-600 min-h-[80px]"
                        />
                      </div>

                      {/* Submit Actions */}
                      <div className="flex items-center justify-between">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateAction(index, { expanded: false, action: null, notes: '' })}
                          className="text-neutral-400 hover:text-white"
                        >
                          Cancel
                        </Button>
                        
                        <Button
                          onClick={() => handleSubmitAction(log, index)}
                          disabled={!action.action || (action.action && !action.notes.trim())}
                          className={
                            action.action === 'approve' 
                              ? 'bg-green-600 hover:bg-green-700' 
                              : 'bg-red-600 hover:bg-red-700'
                          }
                        >
                          {action.action === 'approve' ? 'Approve Decision' : 'Reject Decision'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Queue Summary */}
        <div className="mt-6 pt-4 border-t border-neutral-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-400">
              {escalatedLogs.length} decision{escalatedLogs.length !== 1 ? 's' : ''} requiring review
            </span>
            <div className="flex items-center gap-4">
              <span className="text-red-400">
                High: {escalatedLogs.filter(log => getPriorityLevel(log) === 'high').length}
              </span>
              <span className="text-yellow-400">
                Medium: {escalatedLogs.filter(log => getPriorityLevel(log) === 'medium').length}
              </span>
              <span className="text-blue-400">
                Low: {escalatedLogs.filter(log => getPriorityLevel(log) === 'low').length}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
