'use client'

/**
 * Create Job Assignment Modal - Wizard Style
 * Multi-step wizard for creating new job assignments from approved bookings
 */

import React, { useState, useEffect, useCallback } from 'react'
import { clientToast as toast } from '@/utils/clientToast'
import {
  X, Calendar, Clock, Users, MapPin, AlertCircle, Plus, Minus,
  ChevronLeft, ChevronRight, Check, Edit3, Wrench, Shield,
  Eye, Settings, UserCheck, Sparkles, ArrowRight, ArrowLeft,
  Home, Clipboard, Star, Zap, Timer, CheckCircle, User, Loader2
} from 'lucide-react'

// Components
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'

// Types
import { JobType, JobPriority } from '@/types/jobAssignment'

interface CreateJobModalProps {
  isOpen: boolean
  onClose: () => void
  onJobCreated: (jobId: string) => void
  prePopulatedBooking?: {
    id: string
    propertyId?: string
    propertyName: string
    propertyAddress?: string
    guestName: string
    guestEmail?: string
    guestPhone?: string
    checkInDate: string
    checkOutDate: string
    numberOfGuests: number
    specialRequests?: string
  }
}

// Wizard Steps
const WIZARD_STEPS = [
  { id: 'job-type', title: 'Job Type', description: 'What type of work needs to be done?' },
  { id: 'property-info', title: 'Property & Guest', description: 'Confirm booking details' },
  { id: 'priority', title: 'Priority & Urgency', description: 'How urgent is this job?' },
  { id: 'scheduling', title: 'Scheduling', description: 'When should this be completed?' },
  { id: 'requirements', title: 'Staff Requirements', description: 'Skills and duration needed' },
  { id: 'staff-assignment', title: 'Assign Staff', description: 'Select staff member to assign this job' },
  { id: 'instructions', title: 'Special Instructions', description: 'Additional details and requirements' },
  { id: 'review', title: 'Review & Create', description: 'Confirm all details before creating' }
]

const JOB_TYPES: {
  value: JobType;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
}[] = [
  {
    value: 'cleaning',
    label: 'Cleaning',
    description: 'General cleaning and housekeeping',
    icon: Sparkles,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20 border-blue-500/30 hover:bg-blue-500/30'
  },
  {
    value: 'maintenance',
    label: 'Maintenance',
    description: 'Repairs and maintenance tasks',
    icon: Wrench,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20 border-orange-500/30 hover:bg-orange-500/30'
  },
  {
    value: 'checkin_prep',
    label: 'Check-in Prep',
    description: 'Prepare property for guest arrival',
    icon: Home,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20 border-green-500/30 hover:bg-green-500/30'
  },
  {
    value: 'checkout_process',
    label: 'Check-out Process',
    description: 'Process guest departure and inspection',
    icon: CheckCircle,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20 border-purple-500/30 hover:bg-purple-500/30'
  },
  {
    value: 'inspection',
    label: 'Inspection',
    description: 'Property inspection and quality check',
    icon: Eye,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20 border-cyan-500/30 hover:bg-cyan-500/30'
  },
  {
    value: 'setup',
    label: 'Setup',
    description: 'Special setup or arrangements',
    icon: Settings,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/20 border-indigo-500/30 hover:bg-indigo-500/30'
  },
  {
    value: 'concierge',
    label: 'Concierge',
    description: 'Guest services and assistance',
    icon: UserCheck,
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/20 border-pink-500/30 hover:bg-pink-500/30'
  },
  {
    value: 'security',
    label: 'Security',
    description: 'Security checks and monitoring',
    icon: Shield,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20 border-red-500/30 hover:bg-red-500/30'
  },
  {
    value: 'custom',
    label: 'Custom',
    description: 'Custom job requirements',
    icon: Clipboard,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20 border-gray-500/30 hover:bg-gray-500/30'
  }
]

const PRIORITY_OPTIONS: {
  value: JobPriority;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  icon: React.ComponentType<any>;
}[] = [
  {
    value: 'low',
    label: 'Low Priority',
    description: 'Can be completed when convenient',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20 border-green-500/30 hover:bg-green-500/30',
    icon: Timer
  },
  {
    value: 'medium',
    label: 'Medium Priority',
    description: 'Should be completed within normal timeframe',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20 border-yellow-500/30 hover:bg-yellow-500/30',
    icon: Clock
  },
  {
    value: 'high',
    label: 'High Priority',
    description: 'Needs attention soon',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20 border-orange-500/30 hover:bg-orange-500/30',
    icon: AlertCircle
  },
  {
    value: 'urgent',
    label: 'Urgent',
    description: 'Requires immediate attention',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20 border-red-500/30 hover:bg-red-500/30',
    icon: Zap
  }
]

// Duration presets (in minutes)
const DURATION_PRESETS = [
  { value: 30, label: '30 min', description: 'Quick task' },
  { value: 60, label: '1 hour', description: 'Standard task' },
  { value: 90, label: '1.5 hours', description: 'Extended task' },
  { value: 120, label: '2 hours', description: 'Long task' },
  { value: 180, label: '3 hours', description: 'Half day' },
  { value: 240, label: '4 hours', description: 'Extended work' },
  { value: 480, label: '8 hours', description: 'Full day' }
]

// Common skills with categories
const SKILL_CATEGORIES = {
  'Cleaning': [
    { value: 'cleaning', label: 'General Cleaning' },
    { value: 'deep_cleaning', label: 'Deep Cleaning' },
    { value: 'housekeeping', label: 'Housekeeping' },
    { value: 'laundry', label: 'Laundry' },
    { value: 'sanitization', label: 'Sanitization' }
  ],
  'Maintenance': [
    { value: 'maintenance', label: 'General Maintenance' },
    { value: 'plumbing', label: 'Plumbing' },
    { value: 'electrical', label: 'Electrical' },
    { value: 'hvac', label: 'HVAC' },
    { value: 'carpentry', label: 'Carpentry' },
    { value: 'painting', label: 'Painting' }
  ],
  'Outdoor': [
    { value: 'gardening', label: 'Gardening' },
    { value: 'pool_maintenance', label: 'Pool Maintenance' },
    { value: 'landscaping', label: 'Landscaping' }
  ],
  'Guest Services': [
    { value: 'guest_service', label: 'Guest Service' },
    { value: 'concierge', label: 'Concierge' },
    { value: 'cooking', label: 'Cooking' }
  ],
  'Security': [
    { value: 'security', label: 'Security' },
    { value: 'monitoring', label: 'Monitoring' }
  ]
}

// Common instruction presets
const INSTRUCTION_PRESETS = [
  'Pay special attention to cleanliness',
  'Guest has allergies - use hypoallergenic products',
  'VIP guest - ensure premium service',
  'Property has pets - be cautious',
  'Check all amenities are working',
  'Restock all supplies',
  'Take before/after photos',
  'Report any damages immediately',
  'Coordinate with property manager',
  'Use eco-friendly products only'
]

export default function CreateJobModal({
  isOpen,
  onClose,
  onJobCreated,
  prePopulatedBooking
}: CreateJobModalProps) {
  // Wizard state
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right')

  // Form data state
  const [formData, setFormData] = useState({
    jobType: 'cleaning' as JobType,
    title: '',
    description: '',
    priority: 'medium' as JobPriority,
    estimatedDuration: 120, // minutes
    requiredSkills: [] as string[],
    specialInstructions: '',
    requiredSupplies: [] as string[],
    scheduledDate: '',
    scheduledStartTime: '',
    deadline: ''
  })

  // UI state
  const [selectedSkillCategory, setSelectedSkillCategory] = useState<string>('Cleaning')
  const [customInstruction, setCustomInstruction] = useState('')

  // Staff assignment state
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [availableStaff, setAvailableStaff] = useState<any[]>([])
  const [loadingStaff, setLoadingStaff] = useState(false)
  const [staffAssignmentRequired, setStaffAssignmentRequired] = useState(true)

  // Load available staff from staff_accounts collection
  const loadAvailableStaff = useCallback(async () => {
    try {
      setLoadingStaff(true)
      console.log('📋 Loading available staff from staff_accounts collection...')

      const response = await fetch('/api/admin/staff-accounts?limit=50&status=active')
      const result = await response.json()

      if (result.success && result.data) {
        const activeStaff = result.data.filter((staff: any) => staff.isActive)
        setAvailableStaff(activeStaff)
        console.log(`✅ Loaded ${activeStaff.length} active staff members`)
      } else {
        console.error('❌ Failed to load staff:', result.error)
        toast.error('Failed to load available staff')
      }
    } catch (error) {
      console.error('❌ Error loading staff:', error)
      toast.error('Error loading staff members')
    } finally {
      setLoadingStaff(false)
    }
  }, [])

  // Wizard navigation functions
  const nextStep = useCallback(() => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setSlideDirection('right')
      setCurrentStep(prev => prev + 1)

      // Load staff when reaching staff assignment step
      if (WIZARD_STEPS[currentStep + 1].id === 'staff-assignment') {
        loadAvailableStaff()
      }
    }
  }, [currentStep, loadAvailableStaff])

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setSlideDirection('left')
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < WIZARD_STEPS.length) {
      setSlideDirection(stepIndex > currentStep ? 'right' : 'left')
      setCurrentStep(stepIndex)
    }
  }, [currentStep])

  // Validation for each step
  const isStepValid = useCallback((stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0: // Job Type
        return !!formData.jobType
      case 1: // Property Info
        return !!prePopulatedBooking || (!!formData.title && !!formData.description)
      case 2: // Priority
        return !!formData.priority
      case 3: // Scheduling
        return !!formData.scheduledDate && !!formData.deadline
      case 4: // Requirements
        return formData.estimatedDuration > 0
      case 5: // Staff Assignment - MANDATORY
        return !!selectedStaffId && availableStaff.some(staff => staff.id === selectedStaffId && staff.isActive)
      case 6: // Instructions
        return true // Optional step
      case 7: // Review
        return !!formData.title && !!formData.description && !!formData.scheduledDate && !!formData.deadline && !!selectedStaffId
      default:
        return false
    }
  }, [formData, prePopulatedBooking, selectedStaffId, availableStaff])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'Enter' && isStepValid(currentStep)) {
        e.preventDefault()
        if (currentStep === WIZARD_STEPS.length - 1) {
          handleSubmit(e as any)
        } else {
          nextStep()
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowLeft' && currentStep > 0) {
        e.preventDefault()
        prevStep()
      } else if (e.key === 'ArrowRight' && currentStep < WIZARD_STEPS.length - 1 && isStepValid(currentStep)) {
        e.preventDefault()
        nextStep()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentStep, isStepValid, nextStep, prevStep, onClose])

  // Pre-populate form when booking data is provided
  useEffect(() => {
    if (prePopulatedBooking) {
      const checkInDate = new Date(prePopulatedBooking.checkInDate)
      const dayBefore = new Date(checkInDate)
      dayBefore.setDate(dayBefore.getDate() - 1)

      // Auto-select job type based on booking context
      const suggestedJobType: JobType = 'checkin_prep'

      setFormData(prev => ({
        ...prev,
        jobType: suggestedJobType,
        title: `Check-in Preparation - ${prePopulatedBooking.propertyName}`,
        description: `Prepare ${prePopulatedBooking.propertyName} for ${prePopulatedBooking.guestName} (${prePopulatedBooking.numberOfGuests} guests). Check-in: ${new Date(prePopulatedBooking.checkInDate).toLocaleDateString()}`,
        scheduledDate: dayBefore.toISOString().split('T')[0],
        deadline: prePopulatedBooking.checkInDate.split('T')[0],
        specialInstructions: prePopulatedBooking.specialRequests || '',
        requiredSkills: ['cleaning', 'housekeeping', 'guest_service'],
        estimatedDuration: prePopulatedBooking.numberOfGuests <= 2 ? 120 : 180
      }))
    }
  }, [prePopulatedBooking])

  // Update title when job type changes
  useEffect(() => {
    if (prePopulatedBooking) {
      const jobTypeLabel = JOB_TYPES.find(type => type.value === formData.jobType)?.label || 'Job'
      setFormData(prev => ({
        ...prev,
        title: `${jobTypeLabel} - ${prePopulatedBooking.propertyName}`
      }))
    }
  }, [formData.jobType, prePopulatedBooking])

  // Helper functions
  const addSkill = (skill: string) => {
    if (!formData.requiredSkills.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, skill]
      }))
    }
  }

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter(s => s !== skill)
    }))
  }

  const addInstruction = (instruction: string) => {
    const current = formData.specialInstructions
    const newInstruction = current ? `${current}\n• ${instruction}` : `• ${instruction}`
    setFormData(prev => ({
      ...prev,
      specialInstructions: newInstruction
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    if (!formData.title.trim()) {
      toast.error('Job title is required')
      return
    }

    if (!formData.description.trim()) {
      toast.error('Job description is required')
      return
    }

    if (!formData.scheduledDate) {
      toast.error('Scheduled date is required')
      return
    }

    if (!formData.deadline) {
      toast.error('Deadline is required')
      return
    }

    // MANDATORY VALIDATION: Staff assignment is required
    if (!selectedStaffId) {
      toast.error('MANDATORY: You must assign this job to a staff member. Staff assignment is required for all jobs.')
      return
    }

    // Validate selected staff exists and is active
    const selectedStaff = availableStaff.find(staff => staff.id === selectedStaffId)
    if (!selectedStaff) {
      toast.error('Selected staff member not found. Please select a valid staff member.')
      return
    }

    if (!selectedStaff.isActive) {
      toast.error('Cannot assign job to inactive staff member. Please select an active staff member.')
      return
    }

    setLoading(true)
    try {
      // Prepare booking data - use provided booking or create manual entry
      const bookingData = prePopulatedBooking ? {
        id: prePopulatedBooking.id,
        propertyId: prePopulatedBooking.propertyId || 'unknown',
        propertyName: prePopulatedBooking.propertyName,
        propertyAddress: prePopulatedBooking.propertyAddress,
        guestName: prePopulatedBooking.guestName,
        guestEmail: prePopulatedBooking.guestEmail,
        guestPhone: prePopulatedBooking.guestPhone,
        checkInDate: prePopulatedBooking.checkInDate,
        checkOutDate: prePopulatedBooking.checkOutDate,
        numberOfGuests: prePopulatedBooking.numberOfGuests
      } : {
        id: `manual-${Date.now()}`, // Generate unique ID for manual jobs
        propertyId: 'manual',
        propertyName: 'Manual Assignment',
        propertyAddress: 'See job description for location details',
        guestName: 'Manual Job Assignment',
        guestEmail: '',
        guestPhone: '',
        checkInDate: formData.scheduledDate,
        checkOutDate: formData.deadline,
        numberOfGuests: 1
      }

      console.log('📋 Creating job with staff assignment...')
      console.log('👤 Assigned staff:', selectedStaff.name, '(', selectedStaff.id, ')')

      const response = await fetch('/api/admin/job-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingData,
          jobDetails: {
            jobType: formData.jobType,
            title: formData.title.trim(),
            description: formData.description.trim(),
            priority: formData.priority,
            estimatedDuration: formData.estimatedDuration,
            requiredSkills: formData.requiredSkills,
            specialInstructions: formData.specialInstructions.trim() || undefined,
            requiredSupplies: formData.requiredSupplies.length > 0 ? formData.requiredSupplies : undefined,
            scheduledDate: formData.scheduledDate,
            scheduledStartTime: formData.scheduledStartTime || undefined,
            deadline: formData.deadline
          },
          // STAFF ASSIGNMENT: Include selected staff member
          assignedStaffId: selectedStaffId,
          assignedStaffName: selectedStaff.name,
          assignedBy: {
            id: 'admin', // TODO: Get from current user context
            name: 'Admin User'
          },
          // Enhanced notification options
          notificationOptions: {
            sendNotification: true,
            customMessage: `New ${formData.jobType} job assigned: ${formData.title}`,
            priority: formData.priority
          }
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Job assignment created successfully!')
        onJobCreated(data.jobId)
        onClose()
      } else {
        toast.error(data.error || 'Failed to create job assignment')
      }
    } catch (error) {
      console.error('❌ Error creating job assignment:', error)
      toast.error('Failed to create job assignment')
    } finally {
      setLoading(false)
    }
  }

  // Reset wizard when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0)
      setSlideDirection('right')
    }
  }, [isOpen])

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderJobTypeStep()
      case 1:
        return renderPropertyInfoStep()
      case 2:
        return renderPriorityStep()
      case 3:
        return renderSchedulingStep()
      case 4:
        return renderRequirementsStep()
      case 5:
        return renderStaffAssignmentStep()
      case 6:
        return renderInstructionsStep()
      case 7:
        return renderReviewStep()
      default:
        return null
    }
  }

  if (!isOpen) return null

  const currentStepData = WIZARD_STEPS[currentStep]
  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-white">{currentStepData.title}</h2>
                <p className="text-sm text-gray-400 mt-1">{currentStepData.description}</p>
              </div>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Step Indicators */}
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Step {currentStep + 1} of {WIZARD_STEPS.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          <div
            className="h-full transition-transform duration-300 ease-in-out"
            style={{
              transform: `translateX(${slideDirection === 'right' ? '0%' : '0%'})`
            }}
          >
            <div className="h-full overflow-y-auto p-6">
              {renderStepContent()}
            </div>
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="border-t border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {currentStep > 0 && (
                <Button
                  onClick={prevStep}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {currentStep < WIZARD_STEPS.length - 1 ? (
                <>
                  {currentStep > 1 && (
                    <Button
                      onClick={() => goToStep(WIZARD_STEPS.length - 1)}
                      variant="ghost"
                      className="text-gray-400 hover:text-white"
                    >
                      Skip to Review
                    </Button>
                  )}
                  <Button
                    onClick={nextStep}
                    disabled={!isStepValid(currentStep)}
                    className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !isStepValid(currentStep)}
                  className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Create Job Assignment
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Keyboard Shortcuts Hint */}
          <div className="mt-4 text-xs text-gray-500 text-center">
            Use <kbd className="px-1 py-0.5 bg-gray-700 rounded">←</kbd> <kbd className="px-1 py-0.5 bg-gray-700 rounded">→</kbd> to navigate,
            <kbd className="px-1 py-0.5 bg-gray-700 rounded">Enter</kbd> to proceed,
            <kbd className="px-1 py-0.5 bg-gray-700 rounded">Esc</kbd> to cancel
          </div>
        </div>
      </div>
    </div>
  )

  // Step 1: Job Type Selection
  function renderJobTypeStep() {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h3 className="text-lg font-medium text-white mb-2">What type of work needs to be done?</h3>
          <p className="text-gray-400">Select the primary job type for this assignment</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {JOB_TYPES.map((jobType) => {
            const Icon = jobType.icon
            const isSelected = formData.jobType === jobType.value

            return (
              <button
                key={jobType.value}
                onClick={() => setFormData(prev => ({ ...prev, jobType: jobType.value }))}
                className={`p-6 rounded-lg border-2 transition-all duration-200 text-left hover:scale-105 ${
                  isSelected
                    ? `${jobType.bgColor} border-current`
                    : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center mb-3">
                  <Icon className={`w-6 h-6 mr-3 ${isSelected ? jobType.color : 'text-gray-400'}`} />
                  <h4 className={`font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                    {jobType.label}
                  </h4>
                </div>
                <p className={`text-sm ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                  {jobType.description}
                </p>
                {isSelected && (
                  <div className="mt-3 flex items-center">
                    <Check className="w-4 h-4 text-green-400 mr-2" />
                    <span className="text-sm text-green-400">Selected</span>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Step 2: Property & Guest Info
  function renderPropertyInfoStep() {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h3 className="text-lg font-medium text-white mb-2">
            {prePopulatedBooking ? 'Property & Guest Information' : 'Job Information'}
          </h3>
          <p className="text-gray-400">
            {prePopulatedBooking
              ? 'Confirm the booking details and job information'
              : 'Provide the job title and description details'
            }
          </p>
        </div>

        {prePopulatedBooking ? (
          <div className="space-y-6">
            {/* Booking Summary */}
            <div className="bg-gray-750 rounded-lg p-6 border border-gray-600">
              <h4 className="text-white font-medium mb-4 flex items-center">
                <Home className="w-5 h-5 mr-2 text-blue-400" />
                Booking Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">Property</p>
                    <p className="text-white font-medium">{prePopulatedBooking.propertyName}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Users className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">Guest</p>
                    <p className="text-white font-medium">{prePopulatedBooking.guestName}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">Check-in</p>
                    <p className="text-white font-medium">
                      {new Date(prePopulatedBooking.checkInDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Users className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">Guests</p>
                    <p className="text-white font-medium">{prePopulatedBooking.numberOfGuests}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Job Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Job Title
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter job title..."
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
            </div>

            {/* Job Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Job Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what needs to be done..."
                rows={4}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Manual Job Creation */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
              <div className="flex items-start">
                <Clipboard className="w-6 h-6 text-blue-400 mr-3 mt-0.5" />
                <div>
                  <h4 className="text-blue-400 font-medium mb-2">Manual Job Creation</h4>
                  <p className="text-sm text-gray-300">
                    Creating a job assignment without booking data. Please provide the job details below.
                  </p>
                </div>
              </div>
            </div>

            {/* Job Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Job Title *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter job title (e.g., 'Deep Clean Villa A', 'Maintenance Check')"
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Provide a clear, descriptive title for this job assignment
              </p>
            </div>

            {/* Job Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Job Description *
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what needs to be done, location details, specific requirements..."
                rows={5}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Include property location, specific tasks, and any important details
              </p>
            </div>

            {/* Quick Templates */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Quick Templates (Optional)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { title: 'Villa Deep Clean', desc: 'Complete deep cleaning of villa including all rooms, bathrooms, kitchen, and common areas' },
                  { title: 'Pool Maintenance', desc: 'Pool cleaning, chemical balancing, equipment check, and area maintenance' },
                  { title: 'Garden Maintenance', desc: 'Landscaping, plant care, lawn maintenance, and outdoor area cleaning' },
                  { title: 'Property Inspection', desc: 'Comprehensive property inspection including safety checks and maintenance assessment' },
                  { title: 'HVAC Service', desc: 'Air conditioning system maintenance, filter replacement, and performance check' },
                  { title: 'Emergency Repair', desc: 'Urgent repair work requiring immediate attention' }
                ].map((template, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        title: template.title,
                        description: template.desc
                      }))
                    }}
                    className="p-3 rounded-lg border border-gray-600 bg-gray-700/50 text-left hover:bg-gray-600 hover:border-gray-500 transition-all duration-200"
                  >
                    <div className="font-medium text-white text-sm mb-1">{template.title}</div>
                    <div className="text-xs text-gray-400">{template.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Step 3: Priority & Urgency
  function renderPriorityStep() {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h3 className="text-lg font-medium text-white mb-2">How urgent is this job?</h3>
          <p className="text-gray-400">Select the priority level to help staff understand the urgency</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRIORITY_OPTIONS.map((priority) => {
            const Icon = priority.icon
            const isSelected = formData.priority === priority.value

            return (
              <button
                key={priority.value}
                onClick={() => setFormData(prev => ({ ...prev, priority: priority.value }))}
                className={`p-6 rounded-lg border-2 transition-all duration-200 text-left hover:scale-105 ${
                  isSelected
                    ? `${priority.bgColor} border-current`
                    : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center mb-3">
                  <Icon className={`w-6 h-6 mr-3 ${isSelected ? priority.color : 'text-gray-400'}`} />
                  <h4 className={`font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                    {priority.label}
                  </h4>
                </div>
                <p className={`text-sm ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                  {priority.description}
                </p>
                {isSelected && (
                  <div className="mt-3 flex items-center">
                    <Check className="w-4 h-4 text-green-400 mr-2" />
                    <span className="text-sm text-green-400">Selected</span>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Priority Context */}
        {prePopulatedBooking && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-400 mr-3 mt-0.5" />
              <div>
                <h4 className="text-blue-400 font-medium mb-1">Booking Context</h4>
                <p className="text-sm text-gray-300">
                  Guest check-in is on {new Date(prePopulatedBooking.checkInDate).toLocaleDateString()}.
                  Consider setting higher priority if the check-in is soon.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Step 4: Scheduling
  function renderSchedulingStep() {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h3 className="text-lg font-medium text-white mb-2">When should this be completed?</h3>
          <p className="text-gray-400">Set the schedule and deadline for this job</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Scheduled Date */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Scheduled Date *
            </label>
            <Input
              type="date"
              value={formData.scheduledDate}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
              className="bg-gray-700 border-gray-600 text-white"
              required
            />
            <p className="text-xs text-gray-400 mt-1">When should the work begin?</p>
          </div>

          {/* Scheduled Start Time */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Clock className="w-4 h-4 inline mr-2" />
              Start Time (Optional)
            </label>
            <Input
              type="time"
              value={formData.scheduledStartTime}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduledStartTime: e.target.value }))}
              className="bg-gray-700 border-gray-600 text-white"
            />
            <p className="text-xs text-gray-400 mt-1">Preferred start time</p>
          </div>

          {/* Deadline */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              Deadline *
            </label>
            <Input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
              className="bg-gray-700 border-gray-600 text-white"
              required
            />
            <p className="text-xs text-gray-400 mt-1">Must be completed by this date</p>
          </div>
        </div>

        {/* Smart Scheduling Suggestions */}
        {prePopulatedBooking && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-start">
              <Star className="w-5 h-5 text-green-400 mr-3 mt-0.5" />
              <div>
                <h4 className="text-green-400 font-medium mb-2">Smart Scheduling Suggestion</h4>
                <p className="text-sm text-gray-300 mb-3">
                  Based on the check-in date ({new Date(prePopulatedBooking.checkInDate).toLocaleDateString()}),
                  we recommend completing this job by the day before.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => {
                      const checkIn = new Date(prePopulatedBooking.checkInDate)
                      const dayBefore = new Date(checkIn)
                      dayBefore.setDate(dayBefore.getDate() - 1)
                      setFormData(prev => ({
                        ...prev,
                        scheduledDate: dayBefore.toISOString().split('T')[0],
                        deadline: prePopulatedBooking.checkInDate.split('T')[0]
                      }))
                    }}
                    size="sm"
                    variant="outline"
                    className="border-green-500/30 text-green-400 hover:bg-green-500/20"
                  >
                    Use Suggested Schedule
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Step 5: Staff Requirements
  function renderRequirementsStep() {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h3 className="text-lg font-medium text-white mb-2">What skills and time are needed?</h3>
          <p className="text-gray-400">Define the requirements for staff assignment</p>
        </div>

        {/* Duration Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-4">
            <Timer className="w-4 h-4 inline mr-2" />
            Estimated Duration
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {DURATION_PRESETS.map((duration) => {
              const isSelected = formData.estimatedDuration === duration.value
              return (
                <button
                  key={duration.value}
                  onClick={() => setFormData(prev => ({ ...prev, estimatedDuration: duration.value }))}
                  className={`p-3 rounded-lg border transition-all duration-200 text-center hover:scale-105 ${
                    isSelected
                      ? 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                      : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <div className="font-medium">{duration.label}</div>
                  <div className="text-xs opacity-75 mt-1">{duration.description}</div>
                </button>
              )
            })}
          </div>
          <div className="mt-3 text-center">
            <span className="text-sm text-gray-400">
              Selected: {Math.floor(formData.estimatedDuration / 60)}h {formData.estimatedDuration % 60}m
            </span>
          </div>
        </div>

        {/* Skills Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-4">
            <Star className="w-4 h-4 inline mr-2" />
            Required Skills
          </label>

          {/* Skill Categories */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {Object.keys(SKILL_CATEGORIES).map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedSkillCategory(category)}
                  className={`px-3 py-1 rounded-full text-sm transition-all duration-200 ${
                    selectedSkillCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Skills in Selected Category */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
            {SKILL_CATEGORIES[selectedSkillCategory as keyof typeof SKILL_CATEGORIES]?.map((skill) => {
              const isSelected = formData.requiredSkills.includes(skill.value)
              return (
                <button
                  key={skill.value}
                  onClick={() => {
                    if (isSelected) {
                      removeSkill(skill.value)
                    } else {
                      addSkill(skill.value)
                    }
                  }}
                  className={`p-3 rounded-lg border transition-all duration-200 text-left hover:scale-105 ${
                    isSelected
                      ? 'bg-green-500/20 border-green-500/30 text-green-400'
                      : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{skill.label}</span>
                    {isSelected && <Check className="w-4 h-4" />}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Selected Skills Summary */}
          {formData.requiredSkills.length > 0 && (
            <div className="bg-gray-750 rounded-lg p-4 border border-gray-600">
              <h4 className="text-white font-medium mb-2">Selected Skills:</h4>
              <div className="flex flex-wrap gap-2">
                {formData.requiredSkills.map((skill) => (
                  <Badge
                    key={skill}
                    className="bg-green-500/20 text-green-400 border-green-500/30 flex items-center gap-1"
                  >
                    {skill}
                    <button
                      onClick={() => removeSkill(skill)}
                      className="hover:text-red-400 ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Step 6: Staff Assignment
  function renderStaffAssignmentStep() {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h3 className="text-lg font-medium text-white mb-2">Assign to Staff Member</h3>
          <p className="text-gray-400">Select a staff member to assign this job to</p>
        </div>

        {/* Staff Assignment Required Notice */}
        <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-500" />
            <p className="text-blue-400 font-medium">Staff Assignment Required</p>
          </div>
          <p className="text-blue-300 text-sm mt-2">
            You must assign this job to a staff member. This ensures proper task allocation and notification delivery.
          </p>
        </div>

        {/* Staff Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-4">
            <UserCheck className="w-4 h-4 inline mr-2" />
            Select Staff Member
          </label>

          {loadingStaff ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-400">Loading available staff...</span>
            </div>
          ) : availableStaff.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-400 mb-2">No Staff Available</h3>
              <p className="text-gray-500">No active staff members found for assignment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableStaff.map((staff) => (
                <div
                  key={staff.id}
                  onClick={() => setSelectedStaffId(staff.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                    selectedStaffId === staff.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-600 bg-gray-700/50 hover:border-gray-500 hover:bg-gray-600/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      selectedStaffId === staff.id ? 'bg-blue-500' : 'bg-gray-600'
                    }`}>
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{staff.name}</h4>
                      <p className="text-sm text-gray-400">{staff.role}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                          Available
                        </Badge>
                        {staff.skills && staff.skills.length > 0 && (
                          <span className="text-xs text-gray-500">
                            {staff.skills.slice(0, 2).join(', ')}
                            {staff.skills.length > 2 && ` +${staff.skills.length - 2}`}
                          </span>
                        )}
                      </div>
                    </div>
                    {selectedStaffId === staff.id && (
                      <CheckCircle className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Staff Summary */}
        {selectedStaffId && (
          <div className="bg-green-900/20 border border-green-500 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <p className="text-green-400 font-medium">Staff Member Selected</p>
            </div>
            {(() => {
              const selectedStaff = availableStaff.find(s => s.id === selectedStaffId)
              return selectedStaff ? (
                <div className="mt-2">
                  <p className="text-green-300 text-sm">
                    <strong>{selectedStaff.name}</strong> ({selectedStaff.role}) will be assigned this job.
                  </p>
                  <p className="text-green-300 text-xs mt-1">
                    Notifications will be sent to their dashboard and mobile device.
                  </p>
                </div>
              ) : null
            })()}
          </div>
        )}
      </div>
    )
  }

  // Step 7: Special Instructions
  function renderInstructionsStep() {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h3 className="text-lg font-medium text-white mb-2">Any special instructions?</h3>
          <p className="text-gray-400">Add specific requirements or notes for the staff</p>
        </div>

        {/* Preset Instructions */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-4">
            <Clipboard className="w-4 h-4 inline mr-2" />
            Common Instructions
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {INSTRUCTION_PRESETS.map((instruction, index) => (
              <button
                key={index}
                onClick={() => addInstruction(instruction)}
                className="p-3 rounded-lg border border-gray-600 bg-gray-700/50 text-gray-300 hover:bg-gray-600 hover:border-gray-500 transition-all duration-200 text-left text-sm"
              >
                <Plus className="w-4 h-4 inline mr-2 text-green-400" />
                {instruction}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Instructions */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Edit3 className="w-4 h-4 inline mr-2" />
            Special Instructions
          </label>
          <Textarea
            value={formData.specialInstructions}
            onChange={(e) => setFormData(prev => ({ ...prev, specialInstructions: e.target.value }))}
            placeholder="Add any specific instructions, requirements, or notes for the staff..."
            rows={6}
            className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
          />
          <p className="text-xs text-gray-400 mt-1">
            Be specific about any special requirements, guest preferences, or important details
          </p>
        </div>

        {/* Guest Special Requests */}
        {prePopulatedBooking?.specialRequests && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start">
              <Users className="w-5 h-5 text-blue-400 mr-3 mt-0.5" />
              <div>
                <h4 className="text-blue-400 font-medium mb-1">Guest Special Requests</h4>
                <p className="text-sm text-gray-300">{prePopulatedBooking.specialRequests}</p>
                <Button
                  onClick={() => {
                    const current = formData.specialInstructions
                    const guestRequest = `Guest Request: ${prePopulatedBooking.specialRequests}`
                    const newInstructions = current ? `${current}\n\n• ${guestRequest}` : `• ${guestRequest}`
                    setFormData(prev => ({ ...prev, specialInstructions: newInstructions }))
                  }}
                  size="sm"
                  variant="outline"
                  className="border-blue-500/30 text-blue-400 hover:bg-blue-500/20 mt-2"
                >
                  Add to Instructions
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Instructions Preview */}
        {formData.specialInstructions && (
          <div className="bg-gray-750 rounded-lg p-4 border border-gray-600">
            <h4 className="text-white font-medium mb-2">Instructions Preview:</h4>
            <div className="text-sm text-gray-300 whitespace-pre-wrap">
              {formData.specialInstructions}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Step 7: Review & Create
  function renderReviewStep() {
    const selectedJobType = JOB_TYPES.find(type => type.value === formData.jobType)
    const selectedPriority = PRIORITY_OPTIONS.find(priority => priority.value === formData.priority)

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h3 className="text-lg font-medium text-white mb-2">Review & Create Job Assignment</h3>
          <p className="text-gray-400">Confirm all details before creating the job assignment</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Job Details */}
          <div className="space-y-4">
            <div className="bg-gray-750 rounded-lg p-4 border border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-medium">Job Details</h4>
                <Button
                  onClick={() => goToStep(0)}
                  size="sm"
                  variant="ghost"
                  className="text-blue-400 hover:text-blue-300"
                >
                  <Edit3 className="w-3 h-3 mr-1" />
                  Edit
                </Button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center">
                  {selectedJobType && <selectedJobType.icon className={`w-5 h-5 mr-3 ${selectedJobType.color}`} />}
                  <div>
                    <p className="text-sm text-gray-400">Job Type</p>
                    <p className="text-white font-medium">{selectedJobType?.label}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  {selectedPriority && <selectedPriority.icon className={`w-5 h-5 mr-3 ${selectedPriority.color}`} />}
                  <div>
                    <p className="text-sm text-gray-400">Priority</p>
                    <p className="text-white font-medium">{selectedPriority?.label}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Title</p>
                  <p className="text-white font-medium">{formData.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Description</p>
                  <p className="text-gray-300 text-sm">{formData.description}</p>
                </div>
              </div>
            </div>

            {/* Scheduling */}
            <div className="bg-gray-750 rounded-lg p-4 border border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-medium">Scheduling</h4>
                <Button
                  onClick={() => goToStep(3)}
                  size="sm"
                  variant="ghost"
                  className="text-blue-400 hover:text-blue-300"
                >
                  <Edit3 className="w-3 h-3 mr-1" />
                  Edit
                </Button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 mr-3 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">Scheduled Date</p>
                    <p className="text-white font-medium">
                      {new Date(formData.scheduledDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {formData.scheduledStartTime && (
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 mr-3 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-400">Start Time</p>
                      <p className="text-white font-medium">{formData.scheduledStartTime}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 mr-3 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">Deadline</p>
                    <p className="text-white font-medium">
                      {new Date(formData.deadline).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Requirements & Instructions */}
          <div className="space-y-4">
            <div className="bg-gray-750 rounded-lg p-4 border border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-medium">Requirements</h4>
                <Button
                  onClick={() => goToStep(4)}
                  size="sm"
                  variant="ghost"
                  className="text-blue-400 hover:text-blue-300"
                >
                  <Edit3 className="w-3 h-3 mr-1" />
                  Edit
                </Button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Timer className="w-5 h-5 mr-3 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">Duration</p>
                    <p className="text-white font-medium">
                      {Math.floor(formData.estimatedDuration / 60)}h {formData.estimatedDuration % 60}m
                    </p>
                  </div>
                </div>
                {formData.requiredSkills.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Required Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {formData.requiredSkills.map((skill) => (
                        <Badge
                          key={skill}
                          className="bg-green-500/20 text-green-400 border-green-500/30 text-xs"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {formData.specialInstructions && (
              <div className="bg-gray-750 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-white font-medium">Special Instructions</h4>
                  <Button
                    onClick={() => goToStep(5)}
                    size="sm"
                    variant="ghost"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <Edit3 className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                </div>
                <div className="text-sm text-gray-300 whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {formData.specialInstructions}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Property Info */}
        {prePopulatedBooking && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-blue-400 font-medium">Booking Information</h4>
              <Button
                onClick={() => goToStep(1)}
                size="sm"
                variant="ghost"
                className="text-blue-400 hover:text-blue-300"
              >
                <Edit3 className="w-3 h-3 mr-1" />
                Edit
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-blue-300">Property</p>
                <p className="text-white font-medium">{prePopulatedBooking.propertyName}</p>
              </div>
              <div>
                <p className="text-blue-300">Guest</p>
                <p className="text-white font-medium">{prePopulatedBooking.guestName}</p>
              </div>
              <div>
                <p className="text-blue-300">Check-in</p>
                <p className="text-white font-medium">
                  {new Date(prePopulatedBooking.checkInDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-blue-300">Guests</p>
                <p className="text-white font-medium">{prePopulatedBooking.numberOfGuests}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
}
