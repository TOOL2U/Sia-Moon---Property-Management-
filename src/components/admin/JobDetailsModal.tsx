'use client'

/**
 * Job Details Modal
 * Displays comprehensive job information in a detailed view
 */

import React from 'react'
import { motion } from 'framer-motion'
import { JobData, JobStatus } from '@/services/JobAssignmentService'
import {
  X,
  Calendar,
  Clock,
  User,
  MapPin,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  Edit,
  Trash2,
  Building2,
  Phone,
  Mail,
  FileText,
  Tag,
  Timer,
  Star,
  Zap,
  Settings,
  Eye,
  Briefcase
} from 'lucide-react'

// Components
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface JobDetailsModalProps {
  isOpen: boolean
  job: JobData
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onStatusUpdate: (status: JobStatus) => void
}

export function JobDetailsModal({
  isOpen,
  job,
  onClose,
  onEdit,
  onDelete,
  onStatusUpdate
}: JobDetailsModalProps) {
  if (!isOpen) return null

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'assigned': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'accepted': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'in_progress': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'verified': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-green-400'
      case 'medium': return 'text-yellow-400'
      case 'high': return 'text-orange-400'
      case 'urgent': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getJobTypeIcon = (jobType: string) => {
    switch (jobType) {
      case 'cleaning': return <Briefcase className="w-5 h-5" />
      case 'maintenance': return <Settings className="w-5 h-5" />
      case 'inspection': return <Eye className="w-5 h-5" />
      case 'setup': return <Building2 className="w-5 h-5" />
      case 'checkout': return <CheckCircle className="w-5 h-5" />
      case 'emergency': return <AlertCircle className="w-5 h-5" />
      default: return <Briefcase className="w-5 h-5" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'Not set'
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDateTime = (timestamp: any) => {
    if (!timestamp) return 'Not set'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getNextStatusAction = () => {
    switch (job.status) {
      case 'pending':
        return { status: 'assigned' as JobStatus, label: 'Assign', color: 'bg-purple-600 hover:bg-purple-700' }
      case 'assigned':
        return { status: 'in_progress' as JobStatus, label: 'Start', color: 'bg-orange-600 hover:bg-orange-700' }
      case 'in_progress':
        return { status: 'completed' as JobStatus, label: 'Complete', color: 'bg-green-600 hover:bg-green-700' }
      case 'completed':
        return { status: 'verified' as JobStatus, label: 'Verify', color: 'bg-emerald-600 hover:bg-emerald-700' }
      default:
        return null
    }
  }

  const nextAction = getNextStatusAction()

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
              <h2 className="text-2xl font-bold text-white">{job.title}</h2>
              <div className="flex items-center gap-3 mt-1">
                <Badge className={`${getStatusColor(job.status)}`}>
                  {job.status.replace('_', ' ')}
                </Badge>
                <span className={`text-sm font-medium capitalize ${getPriorityColor(job.priority)}`}>
                  {job.priority} Priority
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="border-red-600 text-red-400 hover:bg-red-900/20"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Job Information */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Job Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400">Description</label>
                    <p className="text-white mt-1">{job.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400">Job Type</label>
                      <p className="text-white mt-1 capitalize">{job.jobType}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Duration</label>
                      <p className="text-white mt-1">{job.estimatedDuration} minutes</p>
                    </div>
                  </div>

                  {job.specialInstructions && (
                    <div>
                      <label className="text-sm text-gray-400">Special Instructions</label>
                      <p className="text-white mt-1">{job.specialInstructions}</p>
                    </div>
                  )}

                  {job.requiredSkills && job.requiredSkills.length > 0 && (
                    <div>
                      <label className="text-sm text-gray-400">Required Skills</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {job.requiredSkills.map((skill, index) => (
                          <Badge key={index} className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Property Information */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Property Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-400">Property Name</label>
                    <p className="text-white mt-1">{job.propertyRef?.name || 'Unknown Property'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Address</label>
                    <p className="text-white mt-1">{job.propertyRef?.address || 'Address not available'}</p>
                  </div>
                  {job.location?.accessInstructions && (
                    <div>
                      <label className="text-sm text-gray-400">Access Instructions</label>
                      <p className="text-white mt-1">{job.location.accessInstructions}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Staff Assignment */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Staff Assignment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-400">Assigned Staff</label>
                    <p className="text-white mt-1">{job.assignedStaffRef?.name || 'Unassigned'}</p>
                  </div>
                  {job.assignedStaffRef?.role && (
                    <div>
                      <label className="text-sm text-gray-400">Role</label>
                      <p className="text-white mt-1">{job.assignedStaffRef.role}</p>
                    </div>
                  )}
                  {job.assignedStaffRef?.phone && (
                    <div>
                      <label className="text-sm text-gray-400">Phone</label>
                      <p className="text-white mt-1">{job.assignedStaffRef.phone}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm text-gray-400">Assigned At</label>
                    <p className="text-white mt-1">{formatDateTime(job.assignedAt)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Schedule Information */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-400">Scheduled Date</label>
                    <p className="text-white mt-1">{formatDate(job.scheduledDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Start Time</label>
                    <p className="text-white mt-1">{formatTime(job.scheduledStartTime)}</p>
                  </div>
                  {job.deadline && (
                    <div>
                      <label className="text-sm text-gray-400">Deadline</label>
                      <p className="text-white mt-1">{formatDateTime(job.deadline)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Status History */}
              {job.statusHistory && job.statusHistory.length > 0 && (
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Timer className="w-5 h-5" />
                      Status History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {job.statusHistory.slice(-5).reverse().map((entry, index) => (
                        <div key={index} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0">
                          <div>
                            <Badge className={`${getStatusColor(entry.status)} text-xs`}>
                              {entry.status.replace('_', ' ')}
                            </Badge>
                            {entry.notes && (
                              <p className="text-xs text-gray-400 mt-1">{entry.notes}</p>
                            )}
                          </div>
                          <div className="text-xs text-gray-400">
                            {formatDateTime(entry.timestamp)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700 bg-gray-800/30">
          <div className="text-sm text-gray-400">
            Created: {formatDateTime(job.createdAt)}
          </div>
          
          <div className="flex items-center gap-3">
            {nextAction && (
              <Button
                onClick={() => onStatusUpdate(nextAction.status)}
                className={nextAction.color}
              >
                {nextAction.label}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Close
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
