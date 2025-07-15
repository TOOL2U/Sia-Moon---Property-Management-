'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Plus, User, Mail, Phone, UserCog, Loader2, ChevronLeft, ChevronRight,
  Key, Shield, MapPin, Settings, Check, Eye, EyeOff, RefreshCw, Copy, CheckCircle, AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { toast } from 'sonner'
import { StaffAccountService, StaffAccountData } from '@/lib/services/staffAccountService'
import { FirebaseAuthService } from '@/lib/services/firebaseAuthService'

interface WizardStaffModalProps {
  isOpen: boolean
  onClose: () => void
  onStaffCreated?: (staff: any, credentials: any) => void
  availableProperties?: Array<{ id: string; name: string }>
}

interface WizardStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'basic-info',
    title: 'Basic Information',
    description: 'Personal details and contact info',
    icon: <User className="w-5 h-5" />
  },
  {
    id: 'authentication',
    title: 'Authentication',
    description: 'Login credentials setup',
    icon: <Key className="w-5 h-5" />
  },
  {
    id: 'role-assignment',
    title: 'Role & Assignment',
    description: 'Position and property assignments',
    icon: <UserCog className="w-5 h-5" />
  },
  {
    id: 'emergency-contact',
    title: 'Emergency Contact',
    description: 'Emergency contact information',
    icon: <Phone className="w-5 h-5" />
  },
  {
    id: 'review-create',
    title: 'Review & Create',
    description: 'Final review and creation',
    icon: <Check className="w-5 h-5" />
  }
]

interface StaffFormData {
  // Basic Information
  name: string
  email: string
  phone: string
  address: string
  
  // Authentication
  temporaryPassword: string
  mustChangePassword: boolean
  
  // Role & Assignment
  role: string
  assignedProperties: string[]
  skills: string[]
  employmentType: string
  startDate: string
  salary: string
  
  // Emergency Contact
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelationship: string
  
  // Personal Details
  dateOfBirth: string
  nationalId: string
}

const initialFormData: StaffFormData = {
  name: '',
  email: '',
  phone: '',
  address: '',
  temporaryPassword: '',
  mustChangePassword: true,
  role: '',
  assignedProperties: [],
  skills: [],
  employmentType: 'full-time',
  startDate: '',
  salary: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelationship: '',
  dateOfBirth: '',
  nationalId: ''
}

const staffRoles = [
  { value: 'housekeeper', label: 'Housekeeper' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'concierge', label: 'Concierge' },
  { value: 'manager', label: 'Manager' },
  { value: 'security', label: 'Security' },
  { value: 'chef', label: 'Chef' },
  { value: 'driver', label: 'Driver' }
]

const commonSkills = [
  'Cleaning', 'Maintenance', 'Customer Service', 'Cooking', 'Driving',
  'Security', 'Landscaping', 'Pool Maintenance', 'Electrical', 'Plumbing',
  'HVAC', 'First Aid', 'Languages', 'Technology', 'Management'
]

export default function WizardStaffModal({
  isOpen,
  onClose,
  onStaffCreated,
  availableProperties = []
}: WizardStaffModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<StaffFormData>(initialFormData)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordGenerated, setPasswordGenerated] = useState(false)
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string
    password: string
  } | null>(null)

  const handleInputChange = (field: keyof StaffFormData, value: string | boolean | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const generatePassword = () => {
    const password = FirebaseAuthService.generateTemporaryPassword(12)
    setFormData(prev => ({ ...prev, temporaryPassword: password }))
    setPasswordGenerated(true)
    toast.success('Secure password generated')
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 0: // Basic Information
        if (!formData.name.trim()) {
          toast.error('Full name is required')
          return false
        }
        if (!formData.email.trim()) {
          toast.error('Email is required')
          return false
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          toast.error('Please enter a valid email address')
          return false
        }
        if (!formData.phone.trim()) {
          toast.error('Phone number is required')
          return false
        }
        return true
      
      case 1: // Authentication
        if (!formData.temporaryPassword) {
          toast.error('Password is required')
          return false
        }
        if (formData.temporaryPassword.length < 8) {
          toast.error('Password must be at least 8 characters long')
          return false
        }
        return true
      
      case 2: // Role & Assignment
        if (!formData.role) {
          toast.error('Role is required')
          return false
        }
        if (!formData.startDate) {
          toast.error('Start date is required')
          return false
        }
        return true
      
      case 3: // Emergency Contact (optional)
        return true
      
      case 4: // Review & Create
        return true
      
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateCurrentStep() && currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return

    setLoading(true)
    try {
      // Create staff account data for staff_accounts collection
      const staffData: StaffAccountData = {
        name: formData.name,
        email: formData.email,
        password: formData.temporaryPassword, // This will be hashed by the service
        phone: formData.phone,
        address: formData.address,
        role: formData.role as 'admin' | 'manager' | 'cleaner' | 'maintenance' | 'staff',
        department: '', // Default department
        status: 'active',
        assignedProperties: formData.assignedProperties,
        skills: formData.skills,
        temporaryPassword: formData.temporaryPassword,
        mustChangePassword: formData.mustChangePassword,

        // Only include emergencyContact if we have the required data
        ...(formData.emergencyContactName && formData.emergencyContactPhone ? {
          emergencyContact: {
            name: formData.emergencyContactName,
            phone: formData.emergencyContactPhone,
            relationship: formData.emergencyContactRelationship || 'Not specified'
          }
        } : {}),

        employment: {
          employmentType: formData.employmentType || 'full-time',
          startDate: formData.startDate || new Date().toISOString().split('T')[0],
          salary: formData.salary ? parseFloat(formData.salary) : 0,
          benefits: []
        },

        // Only include personalDetails if we have actual data
        ...(formData.dateOfBirth || formData.nationalId ? {
          personalDetails: {
            ...(formData.dateOfBirth ? { dateOfBirth: formData.dateOfBirth } : {}),
            ...(formData.nationalId ? { nationalId: formData.nationalId } : {})
          }
        } : {})
      }

      // Only add emergencyContact if we have at least a name
      if (formData.emergencyContactName && formData.emergencyContactName.trim()) {
        (staffData as any).emergencyContact = {
          name: formData.emergencyContactName,
          phone: formData.emergencyContactPhone || '',
          relationship: formData.emergencyContactRelationship || ''
        }
      }

      console.log('📞 WizardStaffModal: Creating staff account in staff_accounts collection...')
      console.log('📋 WizardStaffModal: Staff data being sent:', {
        name: staffData.name,
        email: staffData.email,
        role: staffData.role,
        assignedProperties: staffData.assignedProperties,
        skills: staffData.skills
      })

      const result = await StaffAccountService.createStaffAccount(staffData)
      console.log('📋 WizardStaffModal: Staff account creation result:', result)

      if (result.success && result.staffAccount && result.userCredentials) {
        toast.success('Staff member created successfully in staff_accounts collection!')

        // Store credentials for display
        setCreatedCredentials({
          email: result.userCredentials.email,
          password: result.userCredentials.temporaryPassword
        })

        // Notify parent component
        onStaffCreated?.(result.staffAccount, result.userCredentials)

        // Reset form
        setFormData(initialFormData)
        setPasswordGenerated(false)
        setCurrentStep(0)

        console.log('✅ Staff account created successfully:', result.staffAccount.name)
      } else {
        console.log('❌ Staff account creation failed:', result)
        const errorMessage = result.error || result.message || 'Failed to create staff member'
        toast.error(errorMessage)
      }

    } catch (error: any) {
      console.error('❌ Error creating staff member:', error)
      toast.error(`Failed to create staff member: ${error?.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData(initialFormData)
    setPasswordGenerated(false)
    setCreatedCredentials(null)
    setCurrentStep(0)
    onClose()
  }

  // Show credentials display if staff was created successfully
  if (createdCredentials) {
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

            {/* Success Modal */}
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
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">Staff Created Successfully</h2>
                      <p className="text-sm text-gray-400">Login credentials generated</p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <h3 className="text-green-400 font-medium mb-3">Login Credentials</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <Label className="text-neutral-300 text-sm">Email</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            value={createdCredentials.email}
                            readOnly
                            className="bg-neutral-800 border-neutral-600 text-white"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(createdCredentials.email, 'Email')}
                            className="border-neutral-600"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-neutral-300 text-sm">Temporary Password</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            value={createdCredentials.password}
                            readOnly
                            className="bg-neutral-800 border-neutral-600 text-white"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowPassword(!showPassword)}
                            className="border-neutral-600"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(createdCredentials.password, 'Password')}
                            className="border-neutral-600"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded">
                      <p className="text-blue-400 text-sm">
                        <AlertCircle className="h-4 w-4 inline mr-1" />
                        The staff member will be required to change their password on first login to the mobile app.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end p-6 border-t border-neutral-800">
                  <Button
                    onClick={handleClose}
                    className="bg-white text-black hover:bg-gray-100"
                  >
                    Done
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    )
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Information
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-white flex items-center gap-2">
                <User className="h-4 w-4" />
                Full Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter full name"
                className="bg-neutral-800 border-neutral-700 text-white mt-1"
                required
              />
            </div>
            
            <div>
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
                className="bg-neutral-800 border-neutral-700 text-white mt-1"
                required
              />
              <p className="text-neutral-400 text-sm mt-1">
                This email will be used for mobile app login
              </p>
            </div>
            
            <div>
              <Label htmlFor="phone" className="text-white flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number *
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter phone number"
                className="bg-neutral-800 border-neutral-700 text-white mt-1"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="address" className="text-white flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address
              </Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter address (optional)"
                className="bg-neutral-800 border-neutral-700 text-white mt-1"
                rows={2}
              />
            </div>
          </div>
        )

      case 1: // Authentication
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-white flex items-center gap-2">
                <Key className="h-4 w-4" />
                Temporary Password *
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.temporaryPassword}
                  onChange={(e) => handleInputChange('temporaryPassword', e.target.value)}
                  placeholder="Enter temporary password"
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                  className="border-neutral-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generatePassword}
                  className="border-neutral-600"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              {passwordGenerated && (
                <p className="text-green-400 text-sm mt-1">
                  ✓ Secure password generated
                </p>
              )}
              <p className="text-neutral-400 text-sm mt-1">
                Staff member will be required to change password on first login
              </p>
            </div>
          </div>
        )

      case 2: // Role & Assignment
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-white flex items-center gap-2">
                <UserCog className="h-4 w-4" />
                Role *
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleInputChange('role', value)}
              >
                <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white mt-1">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800 border-neutral-600">
                  {staffRoles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Employment Type</Label>
                <Select
                  value={formData.employmentType}
                  onValueChange={(value) => handleInputChange('employmentType', value)}
                >
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-600">
                    <SelectItem value="full-time">Full Time</SelectItem>
                    <SelectItem value="part-time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="temporary">Temporary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-white">Start Date *</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className="bg-neutral-800 border-neutral-700 text-white mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-white">Skills & Expertise</Label>
              <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto">
                {commonSkills.map(skill => (
                  <Badge
                    key={skill}
                    onClick={() => {
                      const newSkills = formData.skills.includes(skill)
                        ? formData.skills.filter(s => s !== skill)
                        : [...formData.skills, skill]
                      handleInputChange('skills', newSkills)
                    }}
                    className={`cursor-pointer transition-colors text-xs ${
                      formData.skills.includes(skill)
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:bg-neutral-700'
                    }`}
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            {availableProperties.length > 0 && (
              <div>
                <Label className="text-white">Assigned Properties</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto">
                  {availableProperties.map((property) => (
                    <label
                      key={property.id}
                      className="flex items-center space-x-2 p-2 rounded border border-neutral-600 hover:border-neutral-500 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.assignedProperties.includes(property.id)}
                        onChange={(e) => {
                          const newProperties = e.target.checked
                            ? [...formData.assignedProperties, property.id]
                            : formData.assignedProperties.filter(id => id !== property.id)
                          handleInputChange('assignedProperties', newProperties)
                        }}
                        className="rounded"
                      />
                      <span className="text-white text-sm">{property.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      case 3: // Emergency Contact
        return (
          <div className="space-y-4">
            <p className="text-neutral-400 text-sm">
              Emergency contact information is optional but recommended for staff safety.
            </p>
            
            <div>
              <Label className="text-white">Contact Name</Label>
              <Input
                value={formData.emergencyContactName}
                onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                placeholder="Enter emergency contact name"
                className="bg-neutral-800 border-neutral-700 text-white mt-1"
              />
            </div>
            
            <div>
              <Label className="text-white">Contact Phone</Label>
              <Input
                value={formData.emergencyContactPhone}
                onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                placeholder="Enter emergency contact phone"
                className="bg-neutral-800 border-neutral-700 text-white mt-1"
              />
            </div>
            
            <div>
              <Label className="text-white">Relationship</Label>
              <Input
                value={formData.emergencyContactRelationship}
                onChange={(e) => handleInputChange('emergencyContactRelationship', e.target.value)}
                placeholder="e.g., Spouse, Parent, Sibling"
                className="bg-neutral-800 border-neutral-700 text-white mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Date of Birth</Label>
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className="bg-neutral-800 border-neutral-700 text-white mt-1"
                />
              </div>
              
              <div>
                <Label className="text-white">National ID</Label>
                <Input
                  value={formData.nationalId}
                  onChange={(e) => handleInputChange('nationalId', e.target.value)}
                  placeholder="Enter national ID (optional)"
                  className="bg-neutral-800 border-neutral-700 text-white mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-white">Salary (optional)</Label>
              <Input
                type="number"
                value={formData.salary}
                onChange={(e) => handleInputChange('salary', e.target.value)}
                placeholder="Enter monthly salary"
                className="bg-neutral-800 border-neutral-700 text-white mt-1"
              />
            </div>
          </div>
        )

      case 4: // Review & Create
        return (
          <div className="space-y-6">
            <p className="text-neutral-400 text-sm">
              Please review the information below before creating the staff member.
            </p>

            {/* Basic Information */}
            <div className="p-4 bg-neutral-800/50 rounded-lg">
              <h3 className="text-white font-medium mb-3">Basic Information</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-neutral-400">Name:</span>
                  <span className="text-white ml-2">{formData.name}</span>
                </div>
                <div>
                  <span className="text-neutral-400">Email:</span>
                  <span className="text-white ml-2">{formData.email}</span>
                </div>
                <div>
                  <span className="text-neutral-400">Phone:</span>
                  <span className="text-white ml-2">{formData.phone}</span>
                </div>
                <div>
                  <span className="text-neutral-400">Role:</span>
                  <span className="text-white ml-2">
                    {staffRoles.find(r => r.value === formData.role)?.label || formData.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Skills */}
            {formData.skills.length > 0 && (
              <div className="p-4 bg-neutral-800/50 rounded-lg">
                <h3 className="text-white font-medium mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map(skill => (
                    <Badge key={skill} className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Emergency Contact */}
            {formData.emergencyContactName && (
              <div className="p-4 bg-neutral-800/50 rounded-lg">
                <h3 className="text-white font-medium mb-3">Emergency Contact</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-neutral-400">Name:</span>
                    <span className="text-white ml-2">{formData.emergencyContactName}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400">Phone:</span>
                    <span className="text-white ml-2">{formData.emergencyContactPhone}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-neutral-400">Relationship:</span>
                    <span className="text-white ml-2">{formData.emergencyContactRelationship}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      default:
        return null
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
                    <p className="text-sm text-gray-400">Step {currentStep + 1} of {WIZARD_STEPS.length}: {WIZARD_STEPS[currentStep].title}</p>
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

              {/* Progress Bar */}
              <div className="px-6 py-4 border-b border-neutral-800">
                <div className="flex items-center justify-between mb-2">
                  {WIZARD_STEPS.map((step, index) => (
                    <div
                      key={step.id}
                      className={`flex items-center gap-2 text-sm ${
                        index === currentStep 
                          ? 'text-blue-400' 
                          : index < currentStep 
                            ? 'text-green-400' 
                            : 'text-neutral-500'
                      }`}
                    >
                      <div className={`p-1 rounded-full ${
                        index === currentStep 
                          ? 'bg-blue-500/20' 
                          : index < currentStep 
                            ? 'bg-green-500/20' 
                            : 'bg-neutral-700'
                      }`}>
                        {index < currentStep ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          step.icon
                        )}
                      </div>
                      <span className="hidden md:inline">{step.title}</span>
                    </div>
                  ))}
                </div>
                <div className="w-full bg-neutral-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / WIZARD_STEPS.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-white text-lg font-medium">{WIZARD_STEPS[currentStep].title}</h3>
                  <p className="text-neutral-400 text-sm">{WIZARD_STEPS[currentStep].description}</p>
                </div>

                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderStepContent()}
                </motion.div>
              </div>

              {/* Footer */}
              <div className="flex justify-between p-6 border-t border-neutral-800">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0 || loading}
                  className="border-neutral-700 text-white hover:bg-neutral-800"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    disabled={loading}
                    className="border-neutral-700 text-neutral-300 hover:bg-neutral-700"
                  >
                    Cancel
                  </Button>
                  
                  {currentStep === WIZARD_STEPS.length - 1 ? (
                    <Button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="bg-white text-black hover:bg-gray-100"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Staff
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={nextStep}
                      disabled={loading}
                      className="bg-white text-black hover:bg-gray-100"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
