'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { toast } from 'sonner'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Key,
  Eye,
  EyeOff,
  UserPlus,
  Loader2,
  CheckCircle,
  AlertCircle,
  Copy,
  RefreshCw
} from 'lucide-react'
import { StaffAccountService, StaffAccountData } from '@/lib/services/staffAccountService'
import { FirebaseAuthService } from '@/lib/services/firebaseAuthService'

interface StaffAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onStaffCreated?: (staff: any, credentials: any) => void
  availableProperties?: Array<{ id: string; name: string }>
}

interface StaffFormData {
  // Basic Information
  name: string
  email: string
  phone: string
  address: string
  role: string
  department: string

  // Authentication
  temporaryPassword: string
  mustChangePassword: boolean

  // Assignment
  assignedProperties: string[]
  skills: string[]

  // Emergency Contact
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelationship: string

  // Employment Details
  employmentType: string
  startDate: string
  salary: string

  // Personal Details
  dateOfBirth: string
  nationalId: string
}

const initialFormData: StaffFormData = {
  name: '',
  email: '',
  phone: '',
  address: '',
  role: '',
  department: '',
  temporaryPassword: '',
  mustChangePassword: true,
  assignedProperties: [],
  skills: [],
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelationship: '',
  employmentType: 'full-time',
  startDate: '',
  salary: '',
  dateOfBirth: '',
  nationalId: ''
}

const staffRoles = [
  { value: 'admin', label: 'Administrator' },
  { value: 'manager', label: 'Manager' },
  { value: 'cleaner', label: 'Cleaner/Housekeeper' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'staff', label: 'General Staff' }
]

const commonSkills = [
  'Cleaning', 'Maintenance', 'Customer Service', 'Cooking', 'Driving',
  'Security', 'Landscaping', 'Pool Maintenance', 'Electrical', 'Plumbing',
  'HVAC', 'First Aid', 'Languages', 'Technology', 'Management'
]

export default function StaffAccountModal({
  isOpen,
  onClose,
  onStaffCreated,
  availableProperties = []
}: StaffAccountModalProps) {
  const [formData, setFormData] = useState<StaffFormData>(initialFormData)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordGenerated, setPasswordGenerated] = useState(false)
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string
    password: string
  } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState<string>('')

  const handleInputChange = (field: keyof StaffFormData, value: string | boolean | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }

    // Clear general error when user starts making changes
    if (generalError) {
      setGeneralError('')
    }
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

  const validateForm = (): boolean => {
    console.log('🔍 Validating form data:', formData)

    const newErrors: Record<string, string> = {}
    setGeneralError('')

    const requiredFields = [
      { field: 'name', label: 'Full Name', value: formData.name?.trim() },
      { field: 'email', label: 'Email', value: formData.email?.trim() },
      { field: 'phone', label: 'Phone', value: formData.phone?.trim() },
      { field: 'role', label: 'Role', value: formData.role },
      { field: 'temporaryPassword', label: 'Password', value: formData.temporaryPassword },
      { field: 'startDate', label: 'Start Date', value: formData.startDate }
    ]

    // Check required fields
    for (const { field, label, value } of requiredFields) {
      if (!value) {
        newErrors[field] = `${label} is required`
        console.log(`❌ Validation failed: ${label} is required`)
      }
    }

    // Email validation
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address'
        console.log(`❌ Validation failed: Invalid email format`)
      }
    }

    // Password validation
    if (formData.temporaryPassword && formData.temporaryPassword.length < 8) {
      newErrors.temporaryPassword = 'Password must be at least 8 characters long'
      console.log(`❌ Validation failed: Password too short`)
    }

    // Phone validation
    if (formData.phone && formData.phone.trim()) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
      if (!phoneRegex.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
        newErrors.phone = 'Please enter a valid phone number'
        console.log(`❌ Validation failed: Invalid phone format`)
      }
    }

    setErrors(newErrors)
    const isValid = Object.keys(newErrors).length === 0

    if (!isValid) {
      console.log('❌ Form validation failed with errors:', newErrors)
    } else {
      console.log('✅ Form validation passed')
    }

    return isValid
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }

    console.log('🔄 handleSubmit called')
    console.log('📋 Current form data:', formData)

    const isValid = validateForm()
    if (!isValid) {
      console.log('❌ Form validation failed')
      return
    }

    console.log('✅ Form validation passed')
    setLoading(true)
    setGeneralError('')
    try {
      console.log('🏗️ Creating staff account...')
      console.log('📋 Form data:', formData)

      const staffData: StaffAccountData = {
        name: formData.name,
        email: formData.email,
        password: formData.temporaryPassword, // Use temporaryPassword as the main password
        phone: formData.phone,
        address: formData.address,
        role: formData.role as 'admin' | 'manager' | 'cleaner' | 'maintenance' | 'staff',
        department: formData.department || '',
        status: 'active',
        assignedProperties: formData.assignedProperties,
        skills: formData.skills,
        temporaryPassword: formData.temporaryPassword, // Keep for backward compatibility
        mustChangePassword: formData.mustChangePassword,

        emergencyContact: formData.emergencyContactName ? {
          name: formData.emergencyContactName,
          phone: formData.emergencyContactPhone,
          relationship: formData.emergencyContactRelationship
        } : undefined,

        employment: {
          employmentType: formData.employmentType,
          startDate: formData.startDate,
          salary: formData.salary ? parseFloat(formData.salary) : undefined,
          benefits: []
        },

        personalDetails: {
          dateOfBirth: formData.dateOfBirth || undefined,
          nationalId: formData.nationalId || undefined
        }
      }

      console.log('📞 Calling StaffAccountService.createStaffAccount with:', staffData)
      const result = await StaffAccountService.createStaffAccount(staffData)
      console.log('📋 Service result:', result)

      if (result.success && result.staffAccount && result.userCredentials) {
        toast.success('Staff account created successfully with login credentials!')
        
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
        
        console.log('✅ Staff account created:', result.staffAccount.name)
      } else {
        console.log('❌ Staff account creation failed:', result)
        const errorMessage = result.error || result.message || 'Failed to create staff account'
        setGeneralError(errorMessage)
        toast.error(errorMessage)
      }

    } catch (error: any) {
      console.error('❌ Error creating staff account:', error)
      console.error('❌ Error details:', {
        message: error?.message,
        stack: error?.stack,
        code: error?.code
      })
      const errorMessage = `Failed to create staff account: ${error?.message || 'Unknown error'}`
      setGeneralError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData(initialFormData)
    setPasswordGenerated(false)
    setCreatedCredentials(null)
    onClose()
  }

  // Show credentials display if staff was created successfully
  if (createdCredentials) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md bg-neutral-900 border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              Staff Account Created Successfully
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
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

          <DialogFooter>
            <Button
              onClick={handleClose}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-neutral-900 border-neutral-800">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create New Staff Account
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Error Display */}
          {generalError && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500 flex-shrink-0"></div>
                <p className="text-red-400 text-sm">{generalError}</p>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <Card className="bg-neutral-800 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Full Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter full name"
                    className={`bg-neutral-700 border-neutral-600 text-white ${errors.name ? 'border-red-500' : ''}`}
                    required
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>
                
                <div>
                  <Label className="text-white">Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleInputChange('role', value)}
                  >
                    <SelectTrigger className={`bg-neutral-700 border-neutral-600 text-white ${errors.role ? 'border-red-500' : ''}`}>
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
                  {errors.role && (
                    <p className="text-red-500 text-sm mt-1">{errors.role}</p>
                  )}
                </div>

                <div>
                  <Label className="text-white">Department</Label>
                  <Input
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    placeholder="Enter department (e.g., Management, Housekeeping)"
                    className="bg-neutral-700 border-neutral-600 text-white"
                  />
                </div>
                
                <div>
                  <Label className="text-white">Phone *</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter phone number"
                    className={`bg-neutral-700 border-neutral-600 text-white ${errors.phone ? 'border-red-500' : ''}`}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>
                
                <div>
                  <Label className="text-white">Start Date *</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className={`bg-neutral-700 border-neutral-600 text-white ${errors.startDate ? 'border-red-500' : ''}`}
                  />
                  {errors.startDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>
                  )}
                </div>
              </div>
              
              <div>
                <Label className="text-white">Address</Label>
                <Textarea
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter address"
                  className="bg-neutral-700 border-neutral-600 text-white"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Authentication Credentials */}
          <Card className="bg-neutral-800 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Key className="h-5 w-5" />
                Authentication Credentials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white">Email Address *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address for login"
                  className={`bg-neutral-700 border-neutral-600 text-white ${errors.email ? 'border-red-500' : ''}`}
                />
                {errors.email ? (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                ) : (
                  <p className="text-neutral-400 text-sm mt-1">
                    This email will be used to log into the mobile application
                  </p>
                )}
              </div>
              
              <div>
                <Label className="text-white">Temporary Password *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.temporaryPassword}
                    onChange={(e) => handleInputChange('temporaryPassword', e.target.value)}
                    placeholder="Enter temporary password"
                    className={`bg-neutral-700 border-neutral-600 text-white ${errors.temporaryPassword ? 'border-red-500' : ''}`}
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
                {errors.temporaryPassword ? (
                  <p className="text-red-500 text-sm mt-1">{errors.temporaryPassword}</p>
                ) : (
                  <>
                    {passwordGenerated && (
                      <p className="text-green-400 text-sm mt-1">
                        ✓ Secure password generated
                      </p>
                    )}
                    <p className="text-neutral-400 text-sm mt-1">
                      Staff member will be required to change password on first login
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </form>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-neutral-600 text-neutral-300 hover:bg-neutral-700"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={() => {
              console.log('🔘 Create Staff Account button clicked!')
              handleSubmit()
            }}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Staff Account...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Create Staff Account
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
