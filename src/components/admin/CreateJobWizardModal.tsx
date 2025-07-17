'use client'

/**
 * Create Job Wizard Modal
 * Multi-step wizard for creating new jobs manually (not tied to bookings)
 */

import { clientToast as toast } from '@/utils/clientToast'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle,
  Eye,
  Loader2,
  Mail,
  Minus,
  Plus,
  Settings,
  Sparkles,
  User,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import React, { useEffect, useState } from 'react'

// Components
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

// Types
import { JobPriority, JobType } from '@/services/JobAssignmentService'

interface CreateJobWizardModalProps {
  isOpen: boolean
  onClose: () => void
  onJobCreated: (jobId: string) => void
}

interface FormData {
  jobType: JobType
  title: string
  description: string
  priority: JobPriority
  estimatedDuration: number // minutes
  requiredSkills: string[]
  specialInstructions: string
  requiredSupplies: string[]
  scheduledDate: string
  scheduledStartTime: string
  deadline: string
  propertyId: string
  propertyName: string
  propertyAddress: string
  assignedStaffId: string
  assignedStaffName: string
}

const steps = [
  { id: 0, title: 'Job Type', description: 'Select the type of job' },
  { id: 1, title: 'Basic Info', description: 'Job title and description' },
  { id: 2, title: 'Property', description: 'Select property location' },
  {
    id: 3,
    title: 'Priority & Duration',
    description: 'Set priority and time estimate',
  },
  { id: 4, title: 'Scheduling', description: 'Set date and time' },
  { id: 5, title: 'Staff Assignment', description: 'Assign staff member' },
  { id: 6, title: 'Requirements', description: 'Skills and supplies needed' },
  { id: 7, title: 'Review', description: 'Review and create job' },
]

const jobTypes: {
  value: JobType
  label: string
  icon: React.ReactNode
  description: string
}[] = [
  {
    value: 'cleaning',
    label: 'Cleaning',
    icon: <Sparkles className="w-6 h-6" />,
    description: 'Regular or deep cleaning tasks',
  },
  {
    value: 'maintenance',
    label: 'Maintenance',
    icon: <Wrench className="w-6 h-6" />,
    description: 'Repairs and maintenance work',
  },
  {
    value: 'inspection',
    label: 'Inspection',
    icon: <Eye className="w-6 h-6" />,
    description: 'Property inspection and assessment',
  },
  {
    value: 'setup',
    label: 'Setup',
    icon: <Settings className="w-6 h-6" />,
    description: 'Property setup and preparation',
  },
  {
    value: 'checkout',
    label: 'Checkout',
    icon: <CheckCircle className="w-6 h-6" />,
    description: 'Guest checkout and property check',
  },
  {
    value: 'emergency',
    label: 'Emergency',
    icon: <AlertCircle className="w-6 h-6" />,
    description: 'Urgent emergency response',
  },
]

const priorities: {
  value: JobPriority
  label: string
  color: string
  description: string
}[] = [
  {
    value: 'low',
    label: 'Low',
    color: 'text-green-400',
    description: 'Can be completed when convenient',
  },
  {
    value: 'medium',
    label: 'Medium',
    color: 'text-yellow-400',
    description: 'Should be completed within normal timeframe',
  },
  {
    value: 'high',
    label: 'High',
    color: 'text-orange-400',
    description: 'Needs prompt attention',
  },
  {
    value: 'urgent',
    label: 'Urgent',
    color: 'text-red-400',
    description: 'Requires immediate action',
  },
]

export function CreateJobWizardModal({
  isOpen,
  onClose,
  onJobCreated,
}: CreateJobWizardModalProps) {
  // Wizard state
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>(
    'right'
  )

  // Form data state
  const [formData, setFormData] = useState<FormData>({
    jobType: 'cleaning',
    title: '',
    description: '',
    priority: 'medium',
    estimatedDuration: 120,
    requiredSkills: [],
    specialInstructions: '',
    requiredSupplies: [],
    scheduledDate: '',
    scheduledStartTime: '',
    deadline: '',
    propertyId: '',
    propertyName: '',
    propertyAddress: '',
    assignedStaffId: '',
    assignedStaffName: '',
  })

  // Available data (would be loaded from Firebase)
  const [properties, setProperties] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])

  // Load properties and staff on mount
  useEffect(() => {
    if (isOpen) {
      loadProperties()
      loadStaff()
    }
  }, [isOpen])

  const loadProperties = async () => {
    try {
      console.log('🏠 Loading real properties from Firebase...')

      // Load properties from the properties collection
      const response = await fetch('/api/admin/properties')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.properties) {
          console.log(`✅ Loaded ${data.properties.length} properties`)
          setProperties(
            data.properties.map((prop: any) => ({
              id: prop.id,
              name: prop.name || prop.title || 'Unnamed Property',
              address: prop.address || prop.location || 'Address not available',
            }))
          )
        } else {
          console.error('❌ Failed to load properties:', data.error)
          setProperties([])
        }
      } else {
        console.error('❌ Properties API request failed')
        setProperties([])
      }
    } catch (error) {
      console.error('❌ Error loading properties:', error)
      setProperties([])
    }
  }

  const loadStaff = async () => {
    try {
      console.log('👥 Loading real staff from Firebase...')

      // Load staff from the staff_accounts collection
      const response = await fetch('/api/admin/staff-accounts')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          console.log(`✅ Loaded ${data.data.length} staff members`)
          setStaff(
            data.data.map((member: any) => ({
              id: member.id,
              name: member.name || 'Unnamed Staff',
              role: member.role || 'Staff',
              skills: member.skills || [],
              email: member.email,
              phone: member.phone,
            }))
          )
        } else {
          console.error('❌ Failed to load staff:', data.error)
          setStaff([])
        }
      } else {
        console.error('❌ Staff API request failed')
        setStaff([])
      }
    } catch (error) {
      console.error('❌ Error loading staff:', error)
      setStaff([])
    }
  }

  // Navigation functions
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setSlideDirection('right')
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setSlideDirection('left')
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.jobType
      case 1:
        return formData.title && formData.description
      case 2:
        return formData.propertyId
      case 3:
        return formData.priority && formData.estimatedDuration > 0
      case 4:
        return formData.scheduledDate && formData.scheduledStartTime
      case 5:
        return formData.assignedStaffId
      case 6:
        return true // Requirements are optional
      case 7:
        return true // Review step
      default:
        return false
    }
  }

  // Form submission
  const handleSubmit = async () => {
    try {
      setLoading(true)

      // Create job via API
      const response = await fetch('/api/admin/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobData: formData,
          createdBy: {
            id: 'admin', // TODO: Get from current user context
            name: 'Admin User',
          },
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Job created successfully!')
        onJobCreated(data.jobId)
        onClose()
      } else {
        toast.error(data.error || 'Failed to create job')
      }
    } catch (error) {
      console.error('Error creating job:', error)
      toast.error('Failed to create job')
    } finally {
      setLoading(false)
    }
  }

  // Reset wizard when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0)
      setSlideDirection('right')
      setFormData({
        jobType: 'cleaning',
        title: '',
        description: '',
        priority: 'medium',
        estimatedDuration: 120,
        requiredSkills: [],
        specialInstructions: '',
        requiredSupplies: [],
        scheduledDate: '',
        scheduledStartTime: '',
        deadline: '',
        propertyId: '',
        propertyName: '',
        propertyAddress: '',
        assignedStaffId: '',
        assignedStaffName: '',
      })
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Create New Job</h2>
            <p className="text-gray-400 mt-1">
              Step {currentStep + 1} of {steps.length}:{' '}
              {steps[currentStep].description}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-gray-800/50">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    index <= currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {index < currentStep ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 transition-colors ${
                      index < currentStep ? 'bg-blue-600' : 'bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-400 text-center">
            {steps[currentStep].title}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: slideDirection === 'right' ? 50 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: slideDirection === 'right' ? -50 : 50 }}
              transition={{ duration: 0.3 }}
              className="p-6"
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700 bg-gray-800/30">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="text-sm text-gray-400">
            {currentStep + 1} of {steps.length}
          </div>

          {currentStep === steps.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={loading || !canProceed()}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Create Job
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={nextStep}
              disabled={!canProceed()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  )

  // Render step content
  function renderStepContent() {
    switch (currentStep) {
      case 0:
        return renderJobTypeStep()
      case 1:
        return renderBasicInfoStep()
      case 2:
        return renderPropertyStep()
      case 3:
        return renderPriorityStep()
      case 4:
        return renderSchedulingStep()
      case 5:
        return renderStaffAssignmentStep()
      case 6:
        return renderRequirementsStep()
      case 7:
        return renderReviewStep()
      default:
        return null
    }
  }

  function renderJobTypeStep() {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-2">
            Select Job Type
          </h3>
          <p className="text-gray-400">
            Choose the type of job you want to create
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobTypes.map((type) => (
            <motion.div
              key={type.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                formData.jobType === type.value
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}
              onClick={() => setFormData({ ...formData, jobType: type.value })}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div
                  className={`p-3 rounded-lg ${
                    formData.jobType === type.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {type.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-white">{type.label}</h4>
                  <p className="text-sm text-gray-400 mt-1">
                    {type.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  function renderBasicInfoStep() {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-2">
            Job Information
          </h3>
          <p className="text-gray-400">Provide basic details about the job</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Job Title *
            </label>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Enter job title..."
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description *
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe what needs to be done..."
              rows={4}
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>
        </div>
      </div>
    )
  }

  function renderPropertyStep() {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-2">
            Select Property
          </h3>
          <p className="text-gray-400">
            Choose the property where the job will be performed
          </p>
        </div>

        <div className="space-y-4">
          {properties.map((property) => (
            <motion.div
              key={property.id}
              whileHover={{ scale: 1.01 }}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                formData.propertyId === property.id
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}
              onClick={() =>
                setFormData({
                  ...formData,
                  propertyId: property.id,
                  propertyName: property.name,
                  propertyAddress: property.address,
                })
              }
            >
              <div className="flex items-center space-x-4">
                <div
                  className={`p-2 rounded-lg ${
                    formData.propertyId === property.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white">{property.name}</h4>
                  <p className="text-sm text-gray-400">{property.address}</p>
                </div>
                {formData.propertyId === property.id && (
                  <Check className="w-5 h-5 text-blue-500" />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  function renderPriorityStep() {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-2">
            Priority & Duration
          </h3>
          <p className="text-gray-400">
            Set the job priority and estimated duration
          </p>
        </div>

        <div className="space-y-6">
          {/* Priority Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Priority Level
            </label>
            <div className="grid grid-cols-2 gap-3">
              {priorities.map((priority) => (
                <motion.div
                  key={priority.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.priority === priority.value
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                  }`}
                  onClick={() =>
                    setFormData({ ...formData, priority: priority.value })
                  }
                >
                  <div className="text-center">
                    <div className={`text-lg font-semibold ${priority.color}`}>
                      {priority.label}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {priority.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Estimated Duration (minutes)
            </label>
            <div className="flex items-center space-x-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setFormData({
                    ...formData,
                    estimatedDuration: Math.max(
                      15,
                      formData.estimatedDuration - 15
                    ),
                  })
                }
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                type="number"
                value={formData.estimatedDuration}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estimatedDuration: Math.max(
                      15,
                      parseInt(e.target.value) || 15
                    ),
                  })
                }
                className="bg-gray-800 border-gray-600 text-white text-center w-24"
                min="15"
                step="15"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setFormData({
                    ...formData,
                    estimatedDuration: formData.estimatedDuration + 15,
                  })
                }
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <Plus className="w-4 h-4" />
              </Button>
              <span className="text-gray-400 text-sm">
                ({Math.floor(formData.estimatedDuration / 60)}h{' '}
                {formData.estimatedDuration % 60}m)
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  function renderSchedulingStep() {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-2">
            Schedule Job
          </h3>
          <p className="text-gray-400">Set the date and time for the job</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Scheduled Date *
            </label>
            <Input
              type="date"
              value={formData.scheduledDate}
              onChange={(e) =>
                setFormData({ ...formData, scheduledDate: e.target.value })
              }
              className="bg-gray-800 border-gray-600 text-white"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Start Time *
            </label>
            <Input
              type="time"
              value={formData.scheduledStartTime}
              onChange={(e) =>
                setFormData({ ...formData, scheduledStartTime: e.target.value })
              }
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Deadline (Optional)
            </label>
            <Input
              type="datetime-local"
              value={formData.deadline}
              onChange={(e) =>
                setFormData({ ...formData, deadline: e.target.value })
              }
              className="bg-gray-800 border-gray-600 text-white"
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>
        </div>
      </div>
    )
  }

  function renderStaffAssignmentStep() {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-2">
            Assign Staff
          </h3>
          <p className="text-gray-400">
            Select a staff member to assign this job to
          </p>
        </div>

        <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 pr-2">
          <div className="space-y-4">
            {staff.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No staff members available</p>
                <p className="text-sm text-gray-500">
                  Please add staff members first
                </p>
              </div>
            ) : (
              staff.map((member) => (
                <motion.div
                  key={member.id}
                  whileHover={{ scale: 1.01 }}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.assignedStaffId === member.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                  }`}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      assignedStaffId: member.id,
                      assignedStaffName: member.name,
                    })
                  }
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`p-2 rounded-lg ${
                        formData.assignedStaffId === member.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      <User className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">
                        {member.name}
                      </h4>
                      <p className="text-sm text-gray-400">{member.role}</p>
                      {member.email && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Mail className="w-3 h-3" />
                          {member.email}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {member.skills && member.skills.length > 0 ? (
                          member.skills.map((skill: string) => (
                            <Badge
                              key={skill}
                              className="bg-gray-700 text-gray-300 text-xs"
                            >
                              {skill}
                            </Badge>
                          ))
                        ) : (
                          <Badge className="bg-gray-700 text-gray-500 text-xs">
                            No skills listed
                          </Badge>
                        )}
                      </div>
                    </div>
                    {formData.assignedStaffId === member.id && (
                      <Check className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  function renderRequirementsStep() {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-2">
            Requirements
          </h3>
          <p className="text-gray-400">
            Specify any special requirements or instructions
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Special Instructions
            </label>
            <Textarea
              value={formData.specialInstructions}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  specialInstructions: e.target.value,
                })
              }
              placeholder="Any special instructions or notes..."
              rows={3}
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Required Skills (Optional)
            </label>
            <Input
              value={formData.requiredSkills.join(', ')}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  requiredSkills: e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter((s) => s),
                })
              }
              placeholder="Enter skills separated by commas..."
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Required Supplies (Optional)
            </label>
            <Input
              value={formData.requiredSupplies.join(', ')}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  requiredSupplies: e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter((s) => s),
                })
              }
              placeholder="Enter supplies separated by commas..."
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>
        </div>
      </div>
    )
  }

  function renderReviewStep() {
    const selectedProperty = properties.find(
      (p) => p.id === formData.propertyId
    )
    const selectedStaff = staff.find((s) => s.id === formData.assignedStaffId)
    const selectedJobType = jobTypes.find((t) => t.value === formData.jobType)
    const selectedPriority = priorities.find(
      (p) => p.value === formData.priority
    )

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-2">
            Review Job Details
          </h3>
          <p className="text-gray-400">
            Please review all details before creating the job
          </p>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-white mb-3">Job Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Type:</span>
                  <span className="text-white">{selectedJobType?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Title:</span>
                  <span className="text-white">{formData.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Priority:</span>
                  <span className={selectedPriority?.color}>
                    {selectedPriority?.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Duration:</span>
                  <span className="text-white">
                    {formData.estimatedDuration} minutes
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-3">Assignment</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Property:</span>
                  <span className="text-white">{selectedProperty?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Staff:</span>
                  <span className="text-white">{selectedStaff?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Date:</span>
                  <span className="text-white">{formData.scheduledDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Time:</span>
                  <span className="text-white">
                    {formData.scheduledStartTime}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {formData.description && (
            <div>
              <h4 className="font-semibold text-white mb-2">Description</h4>
              <p className="text-gray-300 text-sm">{formData.description}</p>
            </div>
          )}

          {formData.specialInstructions && (
            <div>
              <h4 className="font-semibold text-white mb-2">
                Special Instructions
              </h4>
              <p className="text-gray-300 text-sm">
                {formData.specialInstructions}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }
}
