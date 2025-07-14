'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import StaffService from '@/lib/staffService'
import { StaffProfile } from '@/types/staff'

interface DeleteStaffModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  staff: StaffProfile | null
}

export default function DeleteStaffModal({ isOpen, onClose, onSuccess, staff }: DeleteStaffModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!staff) return

    setLoading(true)
    setError(null)

    try {
      const response = await StaffService.deleteStaff(staff.id)

      if (response.success) {
        onSuccess()
        onClose()
      } else {
        setError(response.error || 'Failed to delete staff member')
      }
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setError(null)
      onClose()
    }
  }

  if (!staff) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl w-full max-w-md">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Delete Staff Member</h2>
                    <p className="text-sm text-gray-400">This action cannot be undone</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  disabled={loading}
                  className="text-gray-400 hover:text-white hover:bg-neutral-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                )}

                {/* Staff Info */}
                <div className="mb-6 p-4 bg-neutral-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-neutral-700 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">
                        {staff.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-white">{staff.name}</p>
                      <p className="text-sm text-gray-400">{staff.email}</p>
                      <p className="text-xs text-gray-500 capitalize">
                        {staff.role} • {staff.status}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Warning */}
                <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-yellow-300 mb-1">
                        Are you sure you want to delete this staff member?
                      </p>
                      <p className="text-xs text-yellow-400/80">
                        This will permanently remove <strong>{staff.name}</strong> from your team. 
                        All associated data will be lost and cannot be recovered.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={loading}
                    className="flex-1 border-neutral-700 text-white hover:bg-neutral-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDelete}
                    disabled={loading}
                    className="flex-1 bg-red-600 text-white hover:bg-red-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Staff
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
