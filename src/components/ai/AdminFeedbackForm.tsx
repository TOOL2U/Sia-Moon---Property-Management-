'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog'
import { 
  MessageSquare, 
  Send, 
  AlertCircle, 
  CheckCircle, 
  X, 
  ThumbsUp, 
  ThumbsDown, 
  Minus,
  Brain,
  Clock
} from 'lucide-react'
import { submitFeedback, type FeedbackSubmission } from '@/lib/ai/feedbackLoop'

// Interface for AI log entry that can receive feedback
interface AILogEntry {
  id: string
  timestamp: string
  agent: 'COO' | 'CFO'
  decision: string
  confidence: number
  source: 'auto' | 'manual'
  escalation?: boolean
  notes?: string
  metadata?: Record<string, any>
}

// Interface for feedback form state
interface FeedbackFormState {
  logId: string
  originalDecision: string
  overrideReason: string
  outcome: "success" | "failure" | "neutral" | ""
  category: string
  severity: "low" | "medium" | "high"
  tags: string[]
  adminId: string
  submitting: boolean
  error: string | null
  success: boolean
}

interface AdminFeedbackFormProps {
  logEntry?: AILogEntry
  onFeedbackSubmitted?: (feedback: any) => void
  className?: string
}

export default function AdminFeedbackForm({ 
  logEntry, 
  onFeedbackSubmitted,
  className 
}: AdminFeedbackFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [formState, setFormState] = useState<FeedbackFormState>({
    logId: logEntry?.id || '',
    originalDecision: logEntry?.decision || '',
    overrideReason: '',
    outcome: '',
    category: '',
    severity: 'medium',
    tags: [],
    adminId: 'admin-001', // In production, get from auth context
    submitting: false,
    error: null,
    success: false
  })

  // Handle form field changes
  const updateField = (field: keyof FeedbackFormState, value: any) => {
    setFormState(prev => ({
      ...prev,
      [field]: value,
      error: null // Clear error when user makes changes
    }))
  }

  // Handle tag input
  const handleTagInput = (tagInput: string) => {
    if (tagInput.includes(',')) {
      const newTags = tagInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      const uniqueTags = [...new Set([...formState.tags, ...newTags])]
      updateField('tags', uniqueTags)
      return ''
    }
    return tagInput
  }

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    updateField('tags', formState.tags.filter(tag => tag !== tagToRemove))
  }

  // Validate form
  const validateForm = (): string | null => {
    if (!formState.logId.trim()) return "Log ID is required"
    if (!formState.originalDecision.trim()) return "Original decision is required"
    if (!formState.overrideReason.trim()) return "Override reason is required"
    if (!formState.outcome) return "Outcome is required"
    if (formState.overrideReason.length < 10) return "Override reason must be at least 10 characters"
    return null
  }

  // Submit feedback
  const handleSubmit = async () => {
    const validationError = validateForm()
    if (validationError) {
      updateField('error', validationError)
      return
    }

    try {
      updateField('submitting', true)
      updateField('error', null)

      const feedbackData: FeedbackSubmission = {
        logId: formState.logId,
        originalDecision: formState.originalDecision,
        overrideReason: formState.overrideReason,
        outcome: formState.outcome as "success" | "failure" | "neutral",
        adminId: formState.adminId,
        category: formState.category || undefined,
        severity: formState.severity,
        tags: formState.tags
      }

      const result = await submitFeedback(feedbackData)

      if (result.success) {
        updateField('success', true)
        
        // Call callback if provided
        if (onFeedbackSubmitted) {
          onFeedbackSubmitted(result.trainingEntry)
        }

        // Close dialog after short delay
        setTimeout(() => {
          setIsOpen(false)
          // Reset form
          setFormState(prev => ({
            ...prev,
            overrideReason: '',
            outcome: '',
            category: '',
            tags: [],
            submitting: false,
            error: null,
            success: false
          }))
        }, 2000)
      }

    } catch (error) {
      console.error('Error submitting feedback:', error)
      updateField('error', error instanceof Error ? error.message : 'Failed to submit feedback')
    } finally {
      updateField('submitting', false)
    }
  }

  // Get outcome icon and color
  const getOutcomeDisplay = (outcome: string) => {
    switch (outcome) {
      case 'success':
        return { icon: <ThumbsUp className="h-4 w-4" />, color: 'text-green-500', label: 'Success' }
      case 'failure':
        return { icon: <ThumbsDown className="h-4 w-4" />, color: 'text-red-500', label: 'Failure' }
      case 'neutral':
        return { icon: <Minus className="h-4 w-4" />, color: 'text-yellow-500', label: 'Neutral' }
      default:
        return { icon: null, color: 'text-gray-500', label: 'Select outcome' }
    }
  }

  const outcomeDisplay = getOutcomeDisplay(formState.outcome)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`flex items-center gap-2 ${className}`}
        >
          <MessageSquare className="h-4 w-4" />
          Submit Feedback
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-500" />
            AI Decision Feedback
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Success Alert */}
          {formState.success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Feedback submitted successfully! This will help improve AI decision-making.
              </AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {formState.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                {formState.error}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => updateField('error', null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Original Decision Display */}
          <Card className="bg-gray-50">
            <CardHeader className="pb-3">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Original AI Decision
              </h3>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm">
                <div><strong>Decision:</strong> {formState.originalDecision}</div>
                {logEntry && (
                  <>
                    <div><strong>Agent:</strong> AI {logEntry.agent}</div>
                    <div><strong>Confidence:</strong> {Math.round(logEntry.confidence * 100)}%</div>
                    <div><strong>Timestamp:</strong> {new Date(logEntry.timestamp).toLocaleString()}</div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Feedback Form */}
          <div className="space-y-4">
            {/* Override Reason */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Override Reason *
              </label>
              <Textarea
                value={formState.overrideReason}
                onChange={(e) => updateField('overrideReason', e.target.value)}
                placeholder="Explain why the AI decision was incorrect or needed adjustment..."
                className="min-h-[80px]"
                disabled={formState.submitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum 10 characters. Be specific to help improve AI learning.
              </p>
            </div>

            {/* Outcome Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Outcome *
              </label>
              <Select 
                value={formState.outcome} 
                onValueChange={(value) => updateField('outcome', value)}
                disabled={formState.submitting}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      {outcomeDisplay.icon}
                      <span className={outcomeDisplay.color}>{outcomeDisplay.label}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="success">
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4 text-green-500" />
                      <span>Success - AI decision was correct</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="failure">
                    <div className="flex items-center gap-2">
                      <ThumbsDown className="h-4 w-4 text-red-500" />
                      <span>Failure - AI decision was wrong</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="neutral">
                    <div className="flex items-center gap-2">
                      <Minus className="h-4 w-4 text-yellow-500" />
                      <span>Neutral - Decision was acceptable but not optimal</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category and Severity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Category
                </label>
                <Select 
                  value={formState.category} 
                  onValueChange={(value) => updateField('category', value)}
                  disabled={formState.submitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff_assignment">Staff Assignment</SelectItem>
                    <SelectItem value="expense_approval">Expense Approval</SelectItem>
                    <SelectItem value="booking_management">Booking Management</SelectItem>
                    <SelectItem value="escalation_decision">Escalation Decision</SelectItem>
                    <SelectItem value="financial_analysis">Financial Analysis</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Severity
                </label>
                <Select 
                  value={formState.severity} 
                  onValueChange={(value) => updateField('severity', value as "low" | "medium" | "high")}
                  disabled={formState.submitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Minor issue</SelectItem>
                    <SelectItem value="medium">Medium - Moderate impact</SelectItem>
                    <SelectItem value="high">High - Significant impact</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Tags
              </label>
              <Input
                placeholder="Add tags separated by commas (e.g., distance, availability, budget)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const input = e.currentTarget
                    const newValue = handleTagInput(input.value)
                    input.value = newValue
                  }
                }}
                onBlur={(e) => {
                  const newValue = handleTagInput(e.target.value)
                  e.target.value = newValue
                }}
                disabled={formState.submitting}
              />
              {formState.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {formState.tags.map((tag, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="text-xs cursor-pointer hover:bg-red-100"
                      onClick={() => removeTag(tag)}
                    >
                      {tag} <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={formState.submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={formState.submitting || !formState.outcome || !formState.overrideReason.trim()}
              className="flex items-center gap-2"
            >
              {formState.submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Feedback
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
