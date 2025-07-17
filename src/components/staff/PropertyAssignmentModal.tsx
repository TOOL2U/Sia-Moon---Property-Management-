'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Building, MapPin, Users, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { StaffProfile } from '@/types/staff'
import StaffService from '@/lib/staffService'
import { clientToast as toast } from '@/utils/clientToast'

interface PropertyAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  staff: StaffProfile | null
}

// TODO: Replace with real property data from Firebase properties collection

export default function PropertyAssignmentModal({ isOpen, onClose, onSuccess, staff }: PropertyAssignmentModalProps) {
  const [loading, setLoading] = useState(false)
  const [selectedProperties, setSelectedProperties] = useState<string[]>([])
  const [availableProperties, setAvailableProperties] = useState<any[]>([])
  const [isLoadingProperties, setIsLoadingProperties] = useState(true)

  // Initialize selected properties when staff changes
  useEffect(() => {
    if (staff) {
      setSelectedProperties(staff.assignedProperties || [])
    }
  }, [staff])

  // Load properties when modal opens
  useEffect(() => {
    if (isOpen) {
      loadProperties()
    }
  }, [isOpen])

  const loadProperties = async () => {
    try {
      setIsLoadingProperties(true)
      // TODO: Implement real property loading from Firebase
      // For now, use empty array until properties collection is implemented
      setAvailableProperties([])
    } catch (error) {
      console.error('Error loading properties:', error)
      setAvailableProperties([])
    } finally {
      setIsLoadingProperties(false)
    }
  }

  const handlePropertyToggle = (propertyId: string) => {
    setSelectedProperties(prev => 
      prev.includes(propertyId)
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    )
  }

  const handleSave = async () => {
    if (!staff) return

    setLoading(true)
    try {
      const response = await StaffService.updateStaff(staff.id, {
        assignedProperties: selectedProperties
      })

      if (response.success) {
        toast.success('Property assignments updated successfully!')
        onSuccess()
        onClose()
      } else {
        toast.error(response.error || 'Failed to update property assignments')
      }
    } catch (error) {
      console.error('Error updating property assignments:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setSelectedProperties(staff?.assignedProperties || [])
      onClose()
    }
  }

  if (!isOpen || !staff) return null

  const assignedCount = selectedProperties.length
  const availableCount = availableProperties.length - assignedCount

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-neutral-900 border border-neutral-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                <Building className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Property Assignments</h2>
                <p className="text-sm text-neutral-400">Manage property assignments for {staff.name}</p>
              </div>
            </div>
            <Button
              onClick={handleClose}
              variant="ghost"
              size="sm"
              className="text-neutral-400 hover:text-white"
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Stats */}
          <div className="p-6 border-b border-neutral-800">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-neutral-800 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <div>
                    <p className="text-sm text-neutral-400">Assigned</p>
                    <p className="text-xl font-bold text-white">{assignedCount}</p>
                  </div>
                </div>
              </div>
              <div className="bg-neutral-800 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="text-sm text-neutral-400">Available</p>
                    <p className="text-xl font-bold text-white">{availableCount}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Property List */}
          <div className="p-6">
            <h3 className="text-lg font-medium text-white mb-4">Available Properties</h3>
            <div className="space-y-3">
              {isLoadingProperties ? (
                <div className="text-center py-8">
                  <div className="text-neutral-400">Loading properties...</div>
                </div>
              ) : availableProperties.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-neutral-400">No properties available</div>
                  <div className="text-sm text-neutral-500 mt-1">
                    Properties will be loaded from Firebase when implemented
                  </div>
                </div>
              ) : (
                availableProperties.map((property) => {
                const isAssigned = selectedProperties.includes(property.id)
                
                return (
                  <div
                    key={property.id}
                    onClick={() => handlePropertyToggle(property.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      isAssigned
                        ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20'
                        : 'bg-neutral-800 border-neutral-700 hover:border-neutral-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isAssigned ? 'bg-green-500/20' : 'bg-neutral-700'
                        }`}>
                          <Building className={`w-5 h-5 ${
                            isAssigned ? 'text-green-400' : 'text-neutral-400'
                          }`} />
                        </div>
                        <div>
                          <h4 className="text-white font-medium">{property.name}</h4>
                          <div className="flex items-center gap-4 text-sm text-neutral-400">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {property.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {property.capacity} guests
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${
                          isAssigned
                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : 'bg-neutral-600/20 text-neutral-400 border-neutral-600/30'
                        }`}>
                          {property.type}
                        </Badge>
                        {isAssigned && (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 p-6 border-t border-neutral-800">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 flex-1"
            >
              {loading ? 'Saving...' : 'Save Assignments'}
            </Button>
            <Button
              onClick={handleClose}
              variant="outline"
              disabled={loading}
              className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
