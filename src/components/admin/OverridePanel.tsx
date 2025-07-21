'use client'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { AILogEntry } from '@/types/ai'
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit3,
  MessageSquare,
  Shield,
  User,
  XCircle
} from 'lucide-react'
import { useState } from 'react'

interface OverridePanelProps {
  logEntry: AILogEntry
  logId?: string
  onOverrideSubmitted?: (overrideData: any) => void
  className?: string
}

interface OverrideData {
  action: 'approve' | 'reject' | 'modify' | 'escalate'
  reason: string
  newDecision?: string
  adminNotes: string
  priority: 'low' | 'medium' | 'high' | 'critical'
}

export default function OverridePanel({
  logEntry,
  logId,
  onOverrideSubmitted,
  className = ''
}: OverridePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [overrideData, setOverrideData] = useState<OverrideData>({
    action: 'approve',
    reason: '',
    newDecision: '',
    adminNotes: '',
    priority: 'medium'
  })

  const handleOverrideSubmit = async () => {
    if (!overrideData.reason.trim() || !overrideData.adminNotes.trim()) {
      alert('Please provide both a reason and admin notes for the override.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/ai-log/override', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logId: logId || `${logEntry.agent}_${Date.now()}`,
          originalLogEntry: logEntry,
          override: overrideData,
          timestamp: new Date().toISOString(),
          adminUser: 'current-admin' // TODO: Get from auth context
        })
      })

      const result = await response.json()

      if (response.ok) {
        alert('Override submitted successfully!')

        // Submit feedback to AI learning system
        try {
          const outcome = overrideData.action === 'approve' ? 'success' :
                         overrideData.action === 'reject' ? 'failure' : 'neutral'

          await submitFeedback({
            logId: logId || `${logEntry.agent}_${Date.now()}`,
            originalDecision: logEntry.decision,
            overrideReason: overrideData.reason,
            outcome,
            agent: logEntry.agent,
            confidence: logEntry.confidence,
            category: categorizeDecision(logEntry.decision),
            adminId: 'current-admin', // In production, get from auth context
            metadata: {
              action: overrideData.action,
              priority: overrideData.priority,
              adminNotes: overrideData.adminNotes,
              newDecision: overrideData.newDecision
            }
          })

          console.log('✅ Feedback submitted to AI learning system')
        } catch (feedbackError) {
          console.error('❌ Failed to submit feedback:', feedbackError)
          // Don't fail the override if feedback submission fails
        }

        // Reset form
        setOverrideData({
          action: 'approve',
          reason: '',
          newDecision: '',
          adminNotes: '',
          priority: 'medium'
        })

        setIsExpanded(false)

        // Notify parent component
        if (onOverrideSubmitted) {
          onOverrideSubmitted(result)
        }
      } else {
        throw new Error(result.error || 'Failed to submit override')
      }

    } catch (error) {
      console.error('Override submission error:', error)
      alert(`Failed to submit override: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const categorizeDecision = (decision: string): string => {
    const lowerDecision = decision.toLowerCase()

    if (lowerDecision.includes('assign') || lowerDecision.includes('staff')) {
      return 'staff_assignment'
    }
    if (lowerDecision.includes('approve') || lowerDecision.includes('expense')) {
      return 'expense_approval'
    }
    if (lowerDecision.includes('booking') || lowerDecision.includes('reservation')) {
      return 'booking_management'
    }
    if (lowerDecision.includes('schedule') || lowerDecision.includes('maintenance')) {
      return 'maintenance_scheduling'
    }
    if (lowerDecision.includes('budget') || lowerDecision.includes('financial')) {
      return 'financial_analysis'
    }

    return 'general'
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'approve': return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'reject': return <XCircle className="h-4 w-4 text-red-400" />
      case 'modify': return <Edit3 className="h-4 w-4 text-blue-400" />
      case 'escalate': return <AlertTriangle className="h-4 w-4 text-orange-400" />
      default: return <MessageSquare className="h-4 w-4 text-neutral-400" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-red-500 text-red-400'
      case 'high': return 'border-orange-500 text-orange-400'
      case 'medium': return 'border-yellow-500 text-yellow-400'
      case 'low': return 'border-blue-500 text-blue-400'
      default: return 'border-neutral-500 text-neutral-400'
    }
  }

  return (
    <Card className={`bg-neutral-900 border-orange-600/50 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-orange-400">
            <Shield className="h-5 w-5" />
            Admin Override Panel
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-neutral-400 hover:text-white"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </CardTitle>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Original Decision Summary */}
          <div className="bg-neutral-800 p-4 rounded-lg border border-neutral-700">
            <h4 className="text-sm font-medium text-white mb-2">Original AI Decision</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={
                  logEntry.agent === 'COO'
                    ? 'border-purple-400 text-purple-400'
                    : 'border-yellow-400 text-yellow-400'
                }>
                  AI {logEntry.agent}
                </Badge>
                <span className="text-neutral-300">
                  Confidence: {logEntry.confidence}%
                </span>
                <Badge variant={logEntry.escalation ? 'destructive' : 'default'}>
                  {logEntry.escalation ? 'Escalated' : 'Auto-Resolved'}
                </Badge>
              </div>
              <p className="text-neutral-300">{logEntry.decision}</p>
              {logEntry.notes && (
                <p className="text-neutral-400 text-xs">{logEntry.notes}</p>
              )}
            </div>
          </div>

          {/* Override Action Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">Override Action</label>
            <Select
              value={overrideData.action}
              onValueChange={(value: any) => setOverrideData({...overrideData, action: value})}
            >
              <SelectTrigger className="bg-neutral-800 border-neutral-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approve">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    Approve Decision
                  </div>
                </SelectItem>
                <SelectItem value="reject">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-400" />
                    Reject Decision
                  </div>
                </SelectItem>
                <SelectItem value="modify">
                  <div className="flex items-center gap-2">
                    <Edit3 className="h-4 w-4 text-blue-400" />
                    Modify Decision
                  </div>
                </SelectItem>
                <SelectItem value="escalate">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-400" />
                    Further Escalation
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority Level */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">Priority Level</label>
            <Select
              value={overrideData.priority}
              onValueChange={(value: any) => setOverrideData({...overrideData, priority: value})}
            >
              <SelectTrigger className="bg-neutral-800 border-neutral-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="critical">Critical Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Modified Decision (if action is 'modify') */}
          {overrideData.action === 'modify' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">New Decision</label>
              <Textarea
                value={overrideData.newDecision}
                onChange={(e) => setOverrideData({...overrideData, newDecision: e.target.value})}
                placeholder="Enter the corrected decision..."
                className="bg-neutral-800 border-neutral-700 min-h-[80px]"
              />
            </div>
          )}

          {/* Override Reason */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">
              Reason for Override <span className="text-red-400">*</span>
            </label>
            <Textarea
              value={overrideData.reason}
              onChange={(e) => setOverrideData({...overrideData, reason: e.target.value})}
              placeholder="Explain why this override is necessary..."
              className="bg-neutral-800 border-neutral-700 min-h-[80px]"
            />
          </div>

          {/* Admin Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">
              Admin Notes <span className="text-red-400">*</span>
            </label>
            <Textarea
              value={overrideData.adminNotes}
              onChange={(e) => setOverrideData({...overrideData, adminNotes: e.target.value})}
              placeholder="Additional notes for audit trail..."
              className="bg-neutral-800 border-neutral-700 min-h-[80px]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-700">
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <User className="h-4 w-4" />
              <span>Admin Override</span>
              <Clock className="h-4 w-4 ml-2" />
              <span>{new Date().toLocaleString()}</span>
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                disabled={isSubmitting}
                className="text-neutral-400 hover:text-white"
              >
                Cancel
              </Button>

              <Button
                onClick={handleOverrideSubmit}
                disabled={isSubmitting || !overrideData.reason.trim() || !overrideData.adminNotes.trim()}
                className={`${
                  overrideData.action === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                  overrideData.action === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                  overrideData.action === 'modify' ? 'bg-blue-600 hover:bg-blue-700' :
                  'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {getActionIcon(overrideData.action)}
                    Submit Override
                  </div>
                )}
              </Button>
            </div>
          </div>

          {/* Override Preview */}
          <div className="bg-neutral-800/50 p-3 rounded-lg border border-neutral-700">
            <h5 className="text-xs font-medium text-neutral-400 mb-2">Override Preview</h5>
            <div className="text-xs text-neutral-300 space-y-1">
              <div className="flex items-center gap-2">
                {getActionIcon(overrideData.action)}
                <span className="capitalize">{overrideData.action} Decision</span>
                <Badge variant="outline" className={getPriorityColor(overrideData.priority)}>
                  {overrideData.priority.toUpperCase()}
                </Badge>
              </div>
              {overrideData.reason && (
                <p className="text-neutral-400">Reason: {overrideData.reason.substring(0, 100)}{overrideData.reason.length > 100 ? '...' : ''}</p>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
