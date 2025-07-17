'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, User, Mail, Phone, UserCog, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import StaffService from '@/lib/staffService'
import { CreateStaffData, STAFF_ROLES, STAFF_STATUSES, EMPLOYMENT_TYPES, COMMON_SKILLS, StaffFormErrors } from '@/types/staff'
import { clientToast as toast } from '@/utils/clientToast'

interface AddStaffModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddStaffModal({ isOpen, onClose, onSuccess }: AddStaffModalProps) {
  const [formData, setFormData] = useState<CreateStaffData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    role: 'housekeeper',
    status: 'active',
    assignedProperties: [],
    skills: [],
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    employment: {
      employmentType: 'full-time',
      startDate: new Date().toISOString().split('T')[0]
    },
    personalDetails: {
      dateOfBirth: '',
      nationalId: ''
    }
  })
  const [errors, setErrors] = useState<StaffFormErrors>({})
  const [loading, setLoading] = useState(false)

  const handleInputChange = (field: keyof CreateStaffData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: StaffFormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (formData.phone && formData.phone.trim()) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
      if (!phoneRegex.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
        newErrors.phone = 'Please enter a valid phone number'
      }
    }

    if (!formData.role) {
      newErrors.role = 'Please select a role'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const response = await StaffService.createStaff({
        ...formData,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone?.trim() || undefined
      })

      if (response.success) {
        toast.success('Staff member added successfully!')
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          address: '',
          role: 'housekeeper',
          status: 'active',
          assignedProperties: [],
          skills: [],
          emergencyContact: {
            name: '',
            phone: '',
            relationship: ''
          },
          employment: {
            employmentType: 'full-time',
            startDate: new Date().toISOString().split('T')[0]
          },
          personalDetails: {
            dateOfBirth: '',
            nationalId: ''
          }
        })
        setErrors({})
        onSuccess()
        onClose()
      } else {
        toast.error(response.error || 'Failed to create staff member')
        setErrors({ general: response.error || 'Failed to create staff member' })
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
      setErrors({ general: 'An unexpected error occurred' })
    } finally {
      setLoading(false)
    }
  }

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills?.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...(prev.skills || []), skill]
    }))
  }

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        role: 'housekeeper',
        status: 'active',
        assignedProperties: [],
        skills: [],
        emergencyContact: {
          name: '',
          phone: '',
          relationship: ''
        },
        employment: {
          employmentType: 'full-time',
          startDate: new Date().toISOString().split('T')[0]
        },
        personalDetails: {
          dateOfBirth: '',
          nationalId: ''
        }
      })
      setErrors({})
      onClose()
    }
  }

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
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Add Staff Member</h2>
                    <p className="text-sm text-gray-400">Create a new team member profile</p>
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

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* General Error */}
                {errors.general && (
                  <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                    <p className="text-sm text-red-300">{errors.general}</p>
                  </div>
                )}

                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter full name"
                    className="bg-neutral-800 border-neutral-700 text-white"
                    disabled={loading}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-400">{errors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter email address"
                    className="bg-neutral-800 border-neutral-700 text-white"
                    disabled={loading}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-400">{errors.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter phone number (optional)"
                    className="bg-neutral-800 border-neutral-700 text-white"
                    disabled={loading}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-400">{errors.phone}</p>
                  )}
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-white">
                    Address
                  </Label>
                  <Input
                    id="address"
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter address (optional)"
                    className="bg-neutral-800 border-neutral-700 text-white"
                    disabled={loading}
                  />
                </div>

                {/* Skills */}
                <div className="space-y-2">
                  <Label className="text-white">Skills & Expertise</Label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {COMMON_SKILLS.slice(0, 10).map(skill => (
                      <Badge
                        key={skill}
                        onClick={() => handleSkillToggle(skill)}
                        className={`cursor-pointer transition-colors text-xs ${
                          formData.skills?.includes(skill)
                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                            : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:bg-neutral-700'
                        }`}
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <Label className="text-white flex items-center gap-2">
                    <UserCog className="h-4 w-4" />
                    Role *
                  </Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleInputChange('role', value)}
                    disabled={loading}
                  >
                    <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-800 border-neutral-700">
                      {STAFF_ROLES.map(role => (
                        <SelectItem key={role.value} value={role.value}>
                          <div>
                            <p className="font-medium">{role.label}</p>
                            <p className="text-xs text-gray-400">{role.description}</p>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.role && (
                    <p className="text-sm text-red-400">{errors.role}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
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
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-white text-black hover:bg-gray-100"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Staff
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
