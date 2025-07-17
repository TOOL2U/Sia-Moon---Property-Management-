'use client'

/**
 * Delete Job Confirmation Modal
 * Confirmation dialog for deleting jobs with safety checks
 */

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { JobData } from '@/services/JobAssignmentService'
import { clientToast as toast } from '@/utils/clientToast'
import {
  X,
  AlertTriangle,
  Trash2,
  Loader2,
  Building2,
  User,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'

// Components
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

interface DeleteJobConfirmModalProps {
  isOpen: boolean
  job: JobData
  onClose: () => void
  onJobDeleted: (jobId: string) => void
}

export function DeleteJobConfirmModal({
  isOpen,
  job,
  onClose,
  onJobDeleted
}: DeleteJobConfirmModalProps) {
  const [loading, setLoading] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [step, setStep] = useState<'warning' | 'confirm'>('warning')

  const handleDelete = async () => {
    try {
      setLoading(true)

      // Delete job via API
      const response = await fetch(`/api/admin/jobs/${job.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deletedBy: {
            id: 'admin', // TODO: Get from current user context
            name: 'Admin User'
          }
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Job deleted successfully!')
        onJobDeleted(job.id!)
        onClose()
      } else {
        toast.error(data.error || 'Failed to delete job')
      }
    } catch (error) {
      console.error('Error deleting job:', error)
      toast.error('Failed to delete job')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
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

  const canDelete = () => {
    // Allow deletion of jobs that haven't been started
    return ['pending', 'assigned', 'cancelled'].includes(job.status)
  }

  const getWarningMessage = () => {
    if (job.status === 'in_progress') {
      return 'This job is currently in progress. Deleting it may disrupt ongoing work.'
    }
    if (job.status === 'completed') {
      return 'This job has been completed. Deleting it will remove completion records.'
    }
    if (job.status === 'verified') {
      return 'This job has been verified. Deleting it will remove all completion and verification records.'
    }
    return 'This action cannot be undone. All job data will be permanently removed.'
  }

  const isConfirmTextValid = confirmText.toLowerCase() === 'delete'

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gradient-to-br from-gray-900 to-black border border-red-500/30 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-red-900/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Delete Job</h2>
              <p className="text-red-400 mt-1">This action cannot be undone</p>
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
        <div className="p-6">
          {step === 'warning' ? (
            <div className="space-y-6">
              {/* Warning Message */}
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-red-400 mb-2">Warning</h3>
                    <p className="text-red-300 text-sm">{getWarningMessage()}</p>
                  </div>
                </div>
              </div>

              {/* Job Information */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-white text-lg">{job.title}</h3>
                      <p className="text-gray-400 text-sm capitalize">{job.jobType}</p>
                    </div>
                    <Badge className={`${getStatusColor(job.status)}`}>
                      {job.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">{job.propertyRef?.name || 'Unknown Property'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">{job.assignedStaffRef?.name || 'Unassigned'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">{formatDate(job.scheduledDate)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">{formatTime(job.scheduledStartTime)}</span>
                    </div>
                  </div>

                  {job.description && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <p className="text-gray-300 text-sm">{job.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Impact Warning */}
              {!canDelete() && (
                <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-orange-400 mb-2">Additional Considerations</h3>
                      <ul className="text-orange-300 text-sm space-y-1">
                        <li>• Staff member may have already started work on this job</li>
                        <li>• Mobile app notifications may have been sent</li>
                        <li>• This may affect staff scheduling and property management</li>
                        <li>• Consider cancelling instead of deleting if work hasn't started</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Confirmation Step */}
              <div className="text-center">
                <h3 className="text-xl font-semibold text-white mb-2">Final Confirmation</h3>
                <p className="text-gray-400">
                  Type <span className="font-mono bg-gray-800 px-2 py-1 rounded text-red-400">DELETE</span> to confirm
                </p>
              </div>

              <div>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  className="bg-gray-800 border-gray-600 text-white text-center"
                  autoFocus
                />
              </div>

              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <div className="text-red-300 text-sm">
                    <strong>"{job.title}"</strong> will be permanently deleted along with all associated data.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700 bg-gray-800/30">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Cancel
          </Button>
          
          {step === 'warning' ? (
            <Button
              onClick={() => setStep('confirm')}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Continue to Delete
            </Button>
          ) : (
            <Button
              onClick={handleDelete}
              disabled={loading || !isConfirmTextValid}
              className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Job
                </>
              )}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
