'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
    Briefcase,
    Calendar,
    CheckCircle,
    Send,
    Settings,
    UserPlus,
    X
} from 'lucide-react'
import { useState } from 'react'

interface StructuredPromptAssistantProps {
  onSubmitPrompt: (prompt: string, metadata: any) => void
  className?: string
}

interface PromptForm {
  type: string
  data: Record<string, any>
  isOpen: boolean
}

export function StructuredPromptAssistant({
  onSubmitPrompt,
  className = ''
}: StructuredPromptAssistantProps) {
  const [activeForm, setActiveForm] = useState<PromptForm>({
    type: '',
    data: {},
    isOpen: false
  })

  const promptTemplates = [
    {
      id: 'assign_job',
      title: 'Assign Job',
      icon: <UserPlus className="h-4 w-4" />,
      description: 'Assign a staff member to a specific job',
      color: 'bg-blue-600 hover:bg-blue-700',
      fields: [
        { name: 'jobId', label: 'Job ID', type: 'text', required: true },
        { name: 'staffName', label: 'Staff Member', type: 'text', required: true },
        { name: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high', 'urgent'] },
        { name: 'notes', label: 'Additional Notes', type: 'textarea' }
      ]
    },
    {
      id: 'approve_booking',
      title: 'Approve Booking',
      icon: <CheckCircle className="h-4 w-4" />,
      description: 'Approve a pending booking request',
      color: 'bg-green-600 hover:bg-green-700',
      fields: [
        { name: 'bookingId', label: 'Booking ID', type: 'text', required: true },
        { name: 'sendConfirmation', label: 'Send Confirmation', type: 'select', options: ['yes', 'no'] },
        { name: 'specialInstructions', label: 'Special Instructions', type: 'textarea' }
      ]
    },
    {
      id: 'update_calendar',
      title: 'Update Calendar',
      icon: <Calendar className="h-4 w-4" />,
      description: 'Add or modify calendar events',
      color: 'bg-purple-600 hover:bg-purple-700',
      fields: [
        { name: 'property', label: 'Property', type: 'text', required: true },
        { name: 'date', label: 'Date', type: 'date', required: true },
        { name: 'eventType', label: 'Event Type', type: 'select', options: ['booking', 'cleaning', 'maintenance', 'inspection'] },
        { name: 'duration', label: 'Duration (hours)', type: 'number' },
        { name: 'description', label: 'Description', type: 'textarea' }
      ]
    },
    {
      id: 'create_job',
      title: 'Create Job',
      icon: <Briefcase className="h-4 w-4" />,
      description: 'Create a new job or task',
      color: 'bg-orange-600 hover:bg-orange-700',
      fields: [
        { name: 'title', label: 'Job Title', type: 'text', required: true },
        { name: 'property', label: 'Property', type: 'text', required: true },
        { name: 'jobType', label: 'Job Type', type: 'select', options: ['cleaning', 'maintenance', 'inspection', 'setup', 'other'] },
        { name: 'scheduledDate', label: 'Scheduled Date', type: 'date' },
        { name: 'estimatedDuration', label: 'Estimated Duration (minutes)', type: 'number' },
        { name: 'description', label: 'Job Description', type: 'textarea', required: true }
      ]
    },
    {
      id: 'custom_action',
      title: 'Custom Action',
      icon: <Settings className="h-4 w-4" />,
      description: 'Create a custom structured prompt',
      color: 'bg-gray-600 hover:bg-gray-700',
      fields: [
        { name: 'action', label: 'Action Type', type: 'text', required: true },
        { name: 'target', label: 'Target (ID/Name)', type: 'text' },
        { name: 'parameters', label: 'Parameters (JSON)', type: 'textarea' },
        { name: 'instructions', label: 'Special Instructions', type: 'textarea', required: true }
      ]
    }
  ]

  const openForm = (templateId: string) => {
    const template = promptTemplates.find(t => t.id === templateId)
    if (template) {
      setActiveForm({
        type: templateId,
        data: {},
        isOpen: true
      })
    }
  }

  const closeForm = () => {
    setActiveForm({
      type: '',
      data: {},
      isOpen: false
    })
  }

  const updateFormData = (field: string, value: any) => {
    setActiveForm(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [field]: value
      }
    }))
  }

  const submitForm = () => {
    const template = promptTemplates.find(t => t.id === activeForm.type)
    if (!template) return

    // Validate required fields
    const requiredFields = template.fields.filter(f => f.required)
    const missingFields = requiredFields.filter(f => !activeForm.data[f.name])

    if (missingFields.length > 0) {
      alert(`Please fill in required fields: ${missingFields.map(f => f.label).join(', ')}`)
      return
    }

    // Generate structured prompt
    const prompt = generatePrompt(template, activeForm.data)

    // Submit with metadata
    onSubmitPrompt(prompt, {
      type: 'structured',
      template: activeForm.type,
      data: activeForm.data
    })

    closeForm()
  }

  const generatePrompt = (template: any, data: Record<string, any>): string => {
    switch (template.id) {
      case 'assign_job':
        return `Please assign staff member "${data.staffName}" to job "${data.jobId}"${data.priority ? ` with ${data.priority} priority` : ''}${data.notes ? `. Additional notes: ${data.notes}` : ''}.`

      case 'approve_booking':
        return `Please approve booking "${data.bookingId}"${data.sendConfirmation === 'yes' ? ' and send confirmation email' : ''}${data.specialInstructions ? `. Special instructions: ${data.specialInstructions}` : ''}.`

      case 'update_calendar':
        return `Please add a ${data.eventType || 'calendar'} event for property "${data.property}" on ${data.date}${data.duration ? ` for ${data.duration} hours` : ''}${data.description ? `. Description: ${data.description}` : ''}.`

      case 'create_job':
        return `Please create a new ${data.jobType || 'job'} job titled "${data.title}" for property "${data.property}"${data.scheduledDate ? ` scheduled for ${data.scheduledDate}` : ''}${data.estimatedDuration ? ` (estimated ${data.estimatedDuration} minutes)` : ''}. Description: ${data.description}.`

      case 'custom_action':
        return `Please perform the following action: ${data.action}${data.target ? ` on ${data.target}` : ''}${data.parameters ? ` with parameters: ${data.parameters}` : ''}. Instructions: ${data.instructions}.`

      default:
        return 'Please process this structured request.'
    }
  }

  const renderField = (field: any) => {
    const value = activeForm.data[field.name] || ''

    switch (field.type) {
      case 'select':
        return (
          <Select value={value} onValueChange={(val) => updateFormData(field.name, val)}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              {field.options.map((option: string) => (
                <SelectItem key={option} value={option} className="text-white hover:bg-slate-600">
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => updateFormData(field.name, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
            rows={3}
          />
        )

      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => updateFormData(field.name, e.target.value)}
            className="bg-slate-700 border-slate-600 text-white"
          />
        )

      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => updateFormData(field.name, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
          />
        )

      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => updateFormData(field.name, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
          />
        )
    }
  }

  const activeTemplate = promptTemplates.find(t => t.id === activeForm.type)

  return (
    <>
      <Card className={`bg-slate-800 border-slate-700 ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-sm">💡 Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {promptTemplates.map((template) => (
              <Button
                key={template.id}
                variant="outline"
                size="sm"
                onClick={() => openForm(template.id)}
                className={`${template.color} border-none text-white text-xs h-auto p-2 flex flex-col items-center gap-1`}
              >
                {template.icon}
                <span className="text-center leading-tight">{template.title}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={activeForm.isOpen} onOpenChange={closeForm}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {activeTemplate?.icon}
              {activeTemplate?.title}
            </DialogTitle>
          </DialogHeader>

          {activeTemplate && (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">{activeTemplate.description}</p>

              <div className="space-y-3">
                {activeTemplate.fields.map((field) => (
                  <div key={field.name} className="space-y-1">
                    <Label className="text-sm text-slate-300">
                      {field.label}
                      {field.required && <span className="text-red-400 ml-1">*</span>}
                    </Label>
                    {renderField(field)}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={closeForm}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={submitForm}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Send className="h-4 w-4 mr-1" />
                  Send Prompt
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
