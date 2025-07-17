'use client'

/**
 * Edit Job Modal
 * Modal for editing existing job information
 */

import { JobData, JobPriority, JobType } from '@/services/JobAssignmentService'
import { clientToast as toast } from '@/utils/clientToast'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  Briefcase,
  Calendar,
  CheckCircle,
  Eye,
  FileText,
  Loader2,
  Save,
  Settings,
  Sparkles,
  Tag,
  User,
  Wrench,
  X,
} from 'lucide-react'
import React, { useEffect, useState } from 'react'

// Components
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'

interface EditJobModalProps {
  isOpen: boolean
  job: JobData
  onClose: () => void
  onJobUpdated: (jobId: string) => void
}

interface EditFormData {
  title: string
  description: string
  priority: JobPriority
  estimatedDuration: number
  scheduledDate: string
  scheduledStartTime: string
  deadline: string
  specialInstructions: string
  requiredSkills: string[]
  requiredSupplies: string[]
  assignedTo: string // Staff profileId
  assignedStaffName: string
}

interface StaffMember {
  id: string
  name: string
  email: string
  role: string
  skills: string[]
  status: string
}

const priorities: { value: JobPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'text-green-400' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-400' },
  { value: 'high', label: 'High', color: 'text-orange-400' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-400' },
]

export function EditJobModal({
  isOpen,
  job,
  onClose,
  onJobUpdated,
}: EditJobModalProps) {
  const [loading, setLoading] = useState(false)
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [loadingStaff, setLoadingStaff] = useState(false)
  const [formData, setFormData] = useState<EditFormData>({
    title: '',
    description: '',
    priority: 'medium',
    estimatedDuration: 120,
    scheduledDate: '',
    scheduledStartTime: '',
    deadline: '',
    specialInstructions: '',
    requiredSkills: [],
    requiredSupplies: [],
    assignedTo: '',
    assignedStaffName: '',
  })

  // Initialize form data when job changes
  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title || '',
        description: job.description || '',
        priority: job.priority || 'medium',
        estimatedDuration: job.estimatedDuration || 120,
        scheduledDate: job.scheduledDate || '',
        scheduledStartTime: job.scheduledStartTime || '',
        deadline: job.deadline || '',
        specialInstructions: job.specialInstructions || '',
        requiredSkills: job.requiredSkills || [],
        requiredSupplies: job.requiredSupplies || [],
        assignedTo: job.assignedStaffId || job.assignedTo || '',
        assignedStaffName: job.assignedStaffName || '',
      })
    }
  }, [job])

  // Load staff members
  const loadStaffMembers = async () => {
    try {
      setLoadingStaff(true)
      const response = await fetch('/api/admin/staff-accounts')
      const data = await response.json()

      if (data.success) {
        setStaffMembers(data.data || [])
      } else {
        console.error('Failed to load staff members:', data.error)
      }
    } catch (error) {
      console.error('Error loading staff members:', error)
    } finally {
      setLoadingStaff(false)
    }
  }

  // Load staff members when modal opens
  useEffect(() => {
    if (isOpen) {
      loadStaffMembers()
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)

      // Update job via API
      const response = await fetch(`/api/admin/jobs/${job.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          updates: {
            ...formData,
            assignedStaffId: formData.assignedTo, // Map assignedTo to assignedStaffId for backward compatibility
            assignedStaffName: formData.assignedStaffName,
          },
          updatedBy: {
            id: 'admin', // TODO: Get from current user context
            name: 'Admin User',
          },
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Job updated successfully!')
        onJobUpdated(job.id!)
        onClose()
      } else {
        toast.error(data.error || 'Failed to update job')
      }
    } catch (error) {
      console.error('Error updating job:', error)
      toast.error('Failed to update job')
    } finally {
      setLoading(false)
    }
  }

  const getJobTypeIcon = (jobType: JobType) => {
    switch (jobType) {
      case 'cleaning':
        return <Sparkles className="w-5 h-5" />
      case 'maintenance':
        return <Wrench className="w-5 h-5" />
      case 'inspection':
        return <Eye className="w-5 h-5" />
      case 'setup':
        return <Settings className="w-5 h-5" />
      case 'checkout':
        return <CheckCircle className="w-5 h-5" />
      case 'emergency':
        return <AlertCircle className="w-5 h-5" />
      default:
        return <Briefcase className="w-5 h-5" />
    }
  }

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
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              {getJobTypeIcon(job.jobType)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Edit Job</h2>
              <p className="text-gray-400 mt-1">
                Update job information and settings
              </p>
            </div>
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Basic Information */}
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description *
                      </label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        placeholder="Describe what needs to be done..."
                        rows={4}
                        className="bg-gray-800 border-gray-600 text-white"
                        required
                      />
                    </div>

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
                  </CardContent>
                </Card>

                {/* Requirements */}
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Tag className="w-5 h-5" />
                      Requirements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Required Skills
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
                        Required Supplies
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
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Priority & Duration */}
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Priority & Duration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Priority Level
                      </label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            priority: value as JobPriority,
                          })
                        }
                      >
                        {priorities.map((priority) => (
                          <option key={priority.value} value={priority.value}>
                            {priority.label}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Estimated Duration (minutes)
                      </label>
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
                        className="bg-gray-800 border-gray-600 text-white"
                        min="15"
                        step="15"
                        required
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {Math.floor(formData.estimatedDuration / 60)}h{' '}
                        {formData.estimatedDuration % 60}m
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Schedule */}
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Scheduled Date *
                      </label>
                      <Input
                        type="date"
                        value={formData.scheduledDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            scheduledDate: e.target.value,
                          })
                        }
                        className="bg-gray-800 border-gray-600 text-white"
                        min={new Date().toISOString().split('T')[0]}
                        required
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
                          setFormData({
                            ...formData,
                            scheduledStartTime: e.target.value,
                          })
                        }
                        className="bg-gray-800 border-gray-600 text-white"
                        required
                      />
                    </div>

                    <div>
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
                  </CardContent>
                </Card>

                {/* Staff Assignment */}
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Staff Assignment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Assigned Staff *
                      </label>
                      {loadingStaff ? (
                        <div className="flex items-center gap-2 p-3 bg-gray-800 border border-gray-600 rounded-md">
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          <span className="text-gray-400">
                            Loading staff...
                          </span>
                        </div>
                      ) : (
                        <Select
                          value={formData.assignedTo}
                          onValueChange={(value) => {
                            const selectedStaff = staffMembers.find(
                              (s) => s.id === value
                            )
                            setFormData({
                              ...formData,
                              assignedTo: value,
                              assignedStaffName: selectedStaff?.name || '',
                            })
                          }}
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                            <SelectValue placeholder="Select staff member..." />
                          </SelectTrigger>
                          <SelectContent>
                            {staffMembers.map((staff) => (
                              <SelectItem key={staff.id} value={staff.id}>
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4" />
                                  <div>
                                    <div className="font-medium">
                                      {staff.name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {staff.role}
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    <div>
                      <label className="text-sm text-gray-400">Property</label>
                      <p className="text-white mt-1">
                        {job.propertyRef?.name || 'Unknown Property'}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm text-gray-400">Job Type</label>
                      <p className="text-white mt-1 capitalize">
                        {job.jobType}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700 bg-gray-800/30">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update Job
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
