'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Brain,
  Clock,
  User,
  DollarSign,
  MapPin,
  Tag
} from 'lucide-react'
import { submitFeedback } from '@/lib/feedbackLoop'

interface EscalatedDecision {
  id: string
  agent: 'COO' | 'CFO'
  decision: string
  rule: string
  confidence: number
  timestamp: string
  context?: any
}

interface EscalationReviewDialogProps {
  escalation: EscalatedDecision | null
  open: boolean
  onClose: () => void
  onResolved: () => void
}

export default function EscalationReviewDialog({
  escalation,
  open,
  onClose,
  onResolved
}: EscalationReviewDialogProps) {
  const [step, setStep] = useState(1)
  const [decision, setDecision] = useState<'accept' | 'override' | null>(null)
  const [reason, setReason] = useState('')
  const [tag, setTag] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetDialog = () => {
    setStep(1)
    setDecision(null)
    setReason('')
    setTag('')
    setIsSubmitting(false)
  }

  const handleClose = () => {
    resetDialog()
    onClose()
  }

  const handleDecisionSelect = (selectedDecision: 'accept' | 'override') => {
    setDecision(selectedDecision)
    if (selectedDecision === 'accept') {
      setStep(3) // Skip reason step for acceptance
    } else {
      setStep(2) // Go to reason step for override
    }
  }

  const handleSubmit = async () => {
    if (!escalation || !decision) return

    setIsSubmitting(true)

    try {
      // Submit feedback to the learning system
      const outcome = decision === 'accept' ? 'success' : 'failure'
      const overrideReason = decision === 'accept' 
        ? 'Admin accepted AI decision after review'
        : reason || 'Admin overrode AI decision'

      await submitFeedback({
        logId: escalation.id,
        originalDecision: escalation.decision,
        overrideReason,
        outcome,
        agent: escalation.agent,
        confidence: escalation.confidence,
        category: categorizeDecision(escalation.decision),
        adminId: 'current-admin', // In production, get from auth context
        metadata: {
          rule: escalation.rule,
          tag: tag || undefined,
          context: escalation.context,
          reviewTimestamp: new Date().toISOString()
        }
      })

      // In production, also update the escalation status in the database
      console.log(`✅ Escalation ${escalation.id} resolved: ${decision}`)

      // Show success and close
      setStep(4)
      setTimeout(() => {
        handleClose()
        onResolved()
      }, 2000)

    } catch (error) {
      console.error('Failed to submit escalation review:', error)
      alert('Failed to submit review. Please try again.')
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

  const getAgentIcon = (agent: string) => {
    switch (agent) {
      case 'COO': return <User className="w-5 h-5 text-blue-500" />
      case 'CFO': return <DollarSign className="w-5 h-5 text-green-500" />
      default: return <Brain className="w-5 h-5 text-purple-500" />
    }
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

  if (!escalation) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Escalation Review - Step {step} of 3
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Decision Summary */}
          {step === 1 && (
            <div className="space-y-4">
              <Card className="bg-neutral-50 dark:bg-neutral-900">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {getAgentIcon(escalation.agent)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">AI {escalation.agent}</Badge>
                        <Badge variant="secondary">{escalation.confidence}% confidence</Badge>
                        <span className="text-sm text-neutral-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(escalation.timestamp)}
                        </span>
                      </div>
                      
                      <h3 className="font-medium text-neutral-900 dark:text-white mb-2">
                        AI Decision
                      </h3>
                      <p className="text-neutral-700 dark:text-neutral-300 mb-3">
                        {escalation.decision}
                      </p>
                      
                      <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                          <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                            Escalation Reason
                          </span>
                        </div>
                        <p className="text-sm text-orange-600 dark:text-orange-400">
                          {escalation.rule}
                        </p>
                      </div>

                      {/* Context Information */}
                      {escalation.context && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                          <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                            Additional Context
                          </div>
                          <div className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                            {Object.entries(escalation.context).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
                                <span className="font-medium">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="text-center">
                <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                  Do you want to accept or override this AI decision?
                </p>
                
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => handleDecisionSelect('accept')}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    ✅ Accept Decision
                  </Button>
                  
                  <Button
                    onClick={() => handleDecisionSelect('override')}
                    variant="destructive"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    ❌ Override Decision
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Override Reason */}
          {step === 2 && decision === 'override' && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
                  Why are you overriding this decision?
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Please provide a reason to help the AI learn from this feedback.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Override Reason *
                  </label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Explain why this decision should be overridden..."
                    className="min-h-[100px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Category Tag (Optional)
                  </label>
                  <Select value={tag} onValueChange={setTag}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="policy-issue">Policy Issue</SelectItem>
                      <SelectItem value="bad-eta">Incorrect ETA/Timing</SelectItem>
                      <SelectItem value="cost-concern">Cost Concern</SelectItem>
                      <SelectItem value="guest-impact">Guest Impact</SelectItem>
                      <SelectItem value="safety-risk">Safety Risk</SelectItem>
                      <SelectItem value="resource-conflict">Resource Conflict</SelectItem>
                      <SelectItem value="data-error">Data Error</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                
                <Button
                  onClick={() => setStep(3)}
                  disabled={!reason.trim()}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Continue Override
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
                  Confirm Your Decision
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Please review your decision before submitting.
                </p>
              </div>

              <Card className="bg-neutral-50 dark:bg-neutral-900">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Your Decision:
                      </span>
                      <Badge variant={decision === 'accept' ? 'default' : 'destructive'}>
                        {decision === 'accept' ? '✅ Accept' : '❌ Override'}
                      </Badge>
                    </div>

                    {decision === 'override' && reason && (
                      <div>
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          Reason:
                        </span>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 p-2 bg-white dark:bg-neutral-800 rounded">
                          {reason}
                        </p>
                      </div>
                    )}

                    {tag && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          Category:
                        </span>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {tag.replace('-', ' ')}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setStep(decision === 'accept' ? 1 : 2)}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={decision === 'accept' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </div>
                  ) : (
                    `Submit ${decision === 'accept' ? 'Acceptance' : 'Override'}`
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
                Review Submitted Successfully!
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Your feedback has been logged and will help improve AI decision-making.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
