'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { Separator } from '@/components/ui/Separator'
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
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileText,
  Briefcase,
  Users
} from 'lucide-react'
import { EnhancedStaffService, EnhancedCreateStaffData } from '@/lib/services/enhancedStaffService'
import { FirebaseAuthService } from '@/lib/services/firebaseAuthService'

interface StaffAccountWizardProps {
  isOpen: boolean
  onClose: () => void
  onStaffCreated?: (staff: any, credentials: any) => void
  availableProperties?: Array<{ id: string; name: string }>
}

interface WizardFormData {
  // Step 1: Basic Information
  name: string
  email: string
  phone: string
  role: string
  
  // Step 2: Employment Details
  address: string
  employmentType: string
  startDate: string
  salary: string
  assignedProperties: string[]
  skills: string[]
  
  // Step 3: Contact Information
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelationship: string
  
  // Step 4: Personal Details (Optional)
  dateOfBirth: string
  nationalId: string
  
  // Step 5: Security & Review
  temporaryPassword: string
  mustChangePassword: boolean
}

const initialFormData: WizardFormData = {
  name: '',
  email: '',
  phone: '',
  role: '',
  address: '',
  employmentType: 'full-time',
  startDate: '',
  salary: '',
  assignedProperties: [],
  skills: [],
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelationship: '',
  dateOfBirth: '',
  nationalId: '',
  temporaryPassword: '',
  mustChangePassword: true
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

const wizardSteps = [
  {
    id: 1,
    title: 'Basic Information',
    description: 'Essential staff details',
    icon: User,
    fields: ['name', 'email', 'phone', 'role']
  },
  {
    id: 2,
    title: 'Employment Details',
    description: 'Work-related information',
    icon: Briefcase,
    fields: ['address', 'employmentType', 'startDate', 'assignedProperties', 'skills']
  },
  {
    id: 3,
    title: 'Contact Information',
    description: 'Emergency contact details',
    icon: Phone,
    fields: ['emergencyContactName', 'emergencyContactPhone', 'emergencyContactRelationship']
  },
  {
    id: 4,
    title: 'Personal Details',
    description: 'Additional information (optional)',
    icon: FileText,
    fields: ['dateOfBirth', 'nationalId']
  },
  {
    id: 5,
    title: 'Security & Review',
    description: 'Password setup and final review',
    icon: Shield,
    fields: ['temporaryPassword', 'mustChangePassword']
  }
]

export default function StaffAccountWizard({
  isOpen,
  onClose,
  onStaffCreated,
  availableProperties = []
}: StaffAccountWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<WizardFormData>(initialFormData)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordGenerated, setPasswordGenerated] = useState(false)
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string
    password: string
  } | null>(null)

  const handleInputChange = (field: keyof WizardFormData, value: string | boolean | string[]) => {
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
    const currentStepData = wizardSteps.find(step => step.id === currentStep)
    if (!currentStepData) return false

    const requiredFields = currentStepData.fields
    
    // Step-specific validation
    switch (currentStep) {
      case 1: // Basic Information
        if (!formData.name.trim()) {
          toast.error('Full name is required')
          return false
        }
        if (!formData.email.trim()) {
          toast.error('Email is required')
          return false
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email)) {
          toast.error('Please enter a valid email address')
          return false
        }
        if (!formData.phone.trim()) {
          toast.error('Phone number is required')
          return false
        }
        if (!formData.role) {
          toast.error('Role is required')
          return false
        }
        break

      case 2: // Employment Details
        if (!formData.startDate) {
          toast.error('Start date is required')
          return false
        }
        break

      case 3: // Contact Information (Optional)
        // Emergency contact is optional, but if one field is filled, require all
        const hasAnyEmergencyField = formData.emergencyContactName || formData.emergencyContactPhone || formData.emergencyContactRelationship
        if (hasAnyEmergencyField) {
          if (!formData.emergencyContactName.trim()) {
            toast.error('Emergency contact name is required')
            return false
          }
          if (!formData.emergencyContactPhone.trim()) {
            toast.error('Emergency contact phone is required')
            return false
          }
          if (!formData.emergencyContactRelationship.trim()) {
            toast.error('Emergency contact relationship is required')
            return false
          }
        }
        break

      case 4: // Personal Details (All optional)
        // No validation needed - all fields are optional
        break

      case 5: // Security & Review
        if (!formData.temporaryPassword) {
          toast.error('Password is required')
          return false
        }
        if (formData.temporaryPassword.length < 8) {
          toast.error('Password must be at least 8 characters long')
          return false
        }
        break
    }

    return true
  }

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, wizardSteps.length))
    }
  }

  const previousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const jumpToStep = (stepId: number) => {
    // Allow jumping to previous steps or current step
    if (stepId <= currentStep) {
      setCurrentStep(stepId)
    } else {
      // For future steps, validate all previous steps first
      let canJump = true
      for (let i = 1; i < stepId; i++) {
        const tempCurrentStep = currentStep
        setCurrentStep(i)
        if (!validateCurrentStep()) {
          canJump = false
          setCurrentStep(tempCurrentStep)
          break
        }
      }
      if (canJump) {
        setCurrentStep(stepId)
      }
    }
  }

  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      return
    }

    setLoading(true)
    try {
      const staffData: EnhancedCreateStaffData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        role: formData.role as any,
        status: 'active',
        assignedProperties: formData.assignedProperties,
        skills: formData.skills,
        temporaryPassword: formData.temporaryPassword,
        mustChangePassword: formData.mustChangePassword,
        userRole: 'staff',
        
        emergencyContact: formData.emergencyContactName ? {
          name: formData.emergencyContactName,
          phone: formData.emergencyContactPhone,
          relationship: formData.emergencyContactRelationship
        } : undefined,
        
        employment: {
          employmentType: formData.employmentType as any,
          startDate: formData.startDate,
          salary: formData.salary ? parseFloat(formData.salary) : undefined
        },
        
        personalDetails: {
          dateOfBirth: formData.dateOfBirth || undefined,
          nationalId: formData.nationalId || undefined
        }
      }

      const result = await EnhancedStaffService.createStaffWithAuth(staffData)

      if (result.success && result.staffProfile && result.userCredentials) {
        toast.success('Staff member created successfully!')
        
        setCreatedCredentials({
          email: result.userCredentials.email,
          password: result.userCredentials.temporaryPassword
        })

        onStaffCreated?.(result.staffProfile, result.userCredentials)
        
        // Reset form
        setFormData(initialFormData)
        setCurrentStep(1)
        setPasswordGenerated(false)
      } else {
        toast.error(result.error || result.message || 'Failed to create staff member')
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
    setCurrentStep(1)
    setPasswordGenerated(false)
    setCreatedCredentials(null)
    onClose()
  }

  const renderStepIndicators = () => (
    <div className="flex items-center justify-between mb-6">
      {wizardSteps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div
            className={`flex items-center cursor-pointer ${
              step.id <= currentStep ? 'text-blue-400' : 'text-neutral-500'
            }`}
            onClick={() => jumpToStep(step.id)}
          >
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                step.id < currentStep
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : step.id === currentStep
                  ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                  : 'border-neutral-600 text-neutral-500'
              }`}
            >
              {step.id < currentStep ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <span className="text-sm font-medium">{step.id}</span>
              )}
            </div>
            <div className="ml-2 hidden sm:block">
              <div className="text-sm font-medium">{step.title}</div>
              <div className="text-xs text-neutral-400">{step.description}</div>
            </div>
          </div>
          {index < wizardSteps.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-4 ${
                step.id < currentStep ? 'bg-blue-600' : 'bg-neutral-700'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  )

  const renderProgressBar = () => {
    const progress = (currentStep / wizardSteps.length) * 100
    return (
      <div className="mb-6">
        <div className="flex justify-between text-sm text-neutral-400 mb-2">
          <span>Step {currentStep} of {wizardSteps.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full bg-neutral-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    )
  }

  // Show credentials display if staff was created successfully
  if (createdCredentials) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md bg-neutral-900 border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              Staff Member Created Successfully
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <h3 className="text-green-400 font-medium mb-2">Login Credentials Created</h3>
              
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
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(createdCredentials.email, 'Email')}
                      className="border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-neutral-300 text-sm">Temporary Password</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={createdCredentials.password}
                      readOnly
                      className="bg-neutral-800 border-neutral-600 text-white"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(createdCredentials.password, 'Password')}
                      className="border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded">
                <p className="text-amber-400 text-sm">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  The staff member will be required to change this password on first login.
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
            Add New Staff Member
          </DialogTitle>
        </DialogHeader>

        {renderProgressBar()}
        {renderStepIndicators()}

        <div className="mt-6">
          {currentStep === 1 && <BasicInformationStep formData={formData} onInputChange={handleInputChange} />}
          {currentStep === 2 && <EmploymentDetailsStep formData={formData} onInputChange={handleInputChange} availableProperties={availableProperties} />}
          {currentStep === 3 && <ContactInformationStep formData={formData} onInputChange={handleInputChange} />}
          {currentStep === 4 && <PersonalDetailsStep formData={formData} onInputChange={handleInputChange} />}
          {currentStep === 5 && <SecurityReviewStep formData={formData} onInputChange={handleInputChange} generatePassword={generatePassword} showPassword={showPassword} setShowPassword={setShowPassword} passwordGenerated={passwordGenerated} />}
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={currentStep === 1 ? handleClose : previousStep}
            className="border-neutral-600 text-neutral-300 hover:bg-neutral-700"
          >
            {currentStep === 1 ? (
              'Cancel'
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </>
            )}
          </Button>

          {currentStep < wizardSteps.length ? (
            <Button
              type="button"
              onClick={nextStep}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Staff Member
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Step Components
interface StepProps {
  formData: WizardFormData
  onInputChange: (field: keyof WizardFormData, value: string | boolean | string[]) => void
}

function BasicInformationStep({ formData, onInputChange }: StepProps) {
  return (
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
              onChange={(e) => onInputChange('name', e.target.value)}
              placeholder="Enter full name"
              className="bg-neutral-700 border-neutral-600 text-white"
            />
          </div>

          <div>
            <Label className="text-white">Email Address *</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => onInputChange('email', e.target.value)}
              placeholder="Enter email address"
              className="bg-neutral-700 border-neutral-600 text-white"
            />
          </div>

          <div>
            <Label className="text-white">Phone Number *</Label>
            <Input
              value={formData.phone}
              onChange={(e) => onInputChange('phone', e.target.value)}
              placeholder="Enter phone number"
              className="bg-neutral-700 border-neutral-600 text-white"
            />
          </div>

          <div>
            <Label className="text-white">Role *</Label>
            <Select value={formData.role} onValueChange={(value) => onInputChange('role', value)}>
              <SelectTrigger className="bg-neutral-700 border-neutral-600 text-white">
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
        </div>
      </CardContent>
    </Card>
  )
}

function EmploymentDetailsStep({ formData, onInputChange, availableProperties }: StepProps & { availableProperties: Array<{ id: string; name: string }> }) {
  const toggleSkill = (skill: string) => {
    const currentSkills = formData.skills || []
    const newSkills = currentSkills.includes(skill)
      ? currentSkills.filter(s => s !== skill)
      : [...currentSkills, skill]
    onInputChange('skills', newSkills)
  }

  const toggleProperty = (propertyId: string) => {
    const currentProperties = formData.assignedProperties || []
    const newProperties = currentProperties.includes(propertyId)
      ? currentProperties.filter(p => p !== propertyId)
      : [...currentProperties, propertyId]
    onInputChange('assignedProperties', newProperties)
  }

  return (
    <Card className="bg-neutral-800 border-neutral-700">
      <CardHeader>
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Employment Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-white">Address</Label>
            <Textarea
              value={formData.address}
              onChange={(e) => onInputChange('address', e.target.value)}
              placeholder="Enter address"
              className="bg-neutral-700 border-neutral-600 text-white"
              rows={2}
            />
          </div>

          <div>
            <Label className="text-white">Employment Type</Label>
            <Select value={formData.employmentType} onValueChange={(value) => onInputChange('employmentType', value)}>
              <SelectTrigger className="bg-neutral-700 border-neutral-600 text-white">
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
              onChange={(e) => onInputChange('startDate', e.target.value)}
              className="bg-neutral-700 border-neutral-600 text-white"
            />
          </div>

          <div>
            <Label className="text-white">Salary (Optional)</Label>
            <Input
              type="number"
              value={formData.salary}
              onChange={(e) => onInputChange('salary', e.target.value)}
              placeholder="Enter salary"
              className="bg-neutral-700 border-neutral-600 text-white"
            />
          </div>
        </div>

        <Separator className="bg-neutral-700" />

        <div>
          <Label className="text-white mb-3 block">Skills</Label>
          <div className="flex flex-wrap gap-2">
            {commonSkills.map((skill) => (
              <Badge
                key={skill}
                variant={formData.skills?.includes(skill) ? "default" : "outline"}
                className={`cursor-pointer ${
                  formData.skills?.includes(skill)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-neutral-600 text-neutral-300 hover:bg-neutral-700'
                }`}
                onClick={() => toggleSkill(skill)}
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        {availableProperties.length > 0 && (
          <div>
            <Label className="text-white mb-3 block">Assigned Properties</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {availableProperties.map((property) => (
                <div
                  key={property.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    formData.assignedProperties?.includes(property.id)
                      ? 'bg-blue-500/20 border-blue-500/50'
                      : 'bg-neutral-700 border-neutral-600 hover:border-neutral-500'
                  }`}
                  onClick={() => toggleProperty(property.id)}
                >
                  <span className="text-white">{property.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ContactInformationStep({ formData, onInputChange }: StepProps) {
  return (
    <Card className="bg-neutral-800 border-neutral-700">
      <CardHeader>
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Emergency Contact Information
        </CardTitle>
        <p className="text-neutral-400 text-sm">
          Optional but recommended for safety and emergency situations
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-white">Contact Name</Label>
            <Input
              value={formData.emergencyContactName}
              onChange={(e) => onInputChange('emergencyContactName', e.target.value)}
              placeholder="Enter contact name"
              className="bg-neutral-700 border-neutral-600 text-white"
            />
          </div>

          <div>
            <Label className="text-white">Contact Phone</Label>
            <Input
              value={formData.emergencyContactPhone}
              onChange={(e) => onInputChange('emergencyContactPhone', e.target.value)}
              placeholder="Enter contact phone"
              className="bg-neutral-700 border-neutral-600 text-white"
            />
          </div>

          <div>
            <Label className="text-white">Relationship</Label>
            <Select value={formData.emergencyContactRelationship} onValueChange={(value) => onInputChange('emergencyContactRelationship', value)}>
              <SelectTrigger className="bg-neutral-700 border-neutral-600 text-white">
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-600">
                <SelectItem value="spouse">Spouse</SelectItem>
                <SelectItem value="parent">Parent</SelectItem>
                <SelectItem value="sibling">Sibling</SelectItem>
                <SelectItem value="child">Child</SelectItem>
                <SelectItem value="friend">Friend</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PersonalDetailsStep({ formData, onInputChange }: StepProps) {
  return (
    <Card className="bg-neutral-800 border-neutral-700">
      <CardHeader>
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Personal Details
        </CardTitle>
        <p className="text-neutral-400 text-sm">
          Optional information for HR records
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-white">Date of Birth</Label>
            <Input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => onInputChange('dateOfBirth', e.target.value)}
              className="bg-neutral-700 border-neutral-600 text-white"
            />
          </div>

          <div>
            <Label className="text-white">National ID</Label>
            <Input
              value={formData.nationalId}
              onChange={(e) => onInputChange('nationalId', e.target.value)}
              placeholder="Enter national ID"
              className="bg-neutral-700 border-neutral-600 text-white"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface SecurityReviewStepProps extends StepProps {
  generatePassword: () => void
  showPassword: boolean
  setShowPassword: (show: boolean) => void
  passwordGenerated: boolean
}

function SecurityReviewStep({ 
  formData, 
  onInputChange, 
  generatePassword, 
  showPassword, 
  setShowPassword, 
  passwordGenerated 
}: SecurityReviewStepProps) {
  return (
    <div className="space-y-6">
      <Card className="bg-neutral-800 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-white">Temporary Password *</Label>
            <div className="flex gap-2 mt-1">
              <div className="relative flex-1">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.temporaryPassword}
                  onChange={(e) => onInputChange('temporaryPassword', e.target.value)}
                  placeholder="Enter temporary password"
                  className="bg-neutral-700 border-neutral-600 text-white pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-8 w-8 text-neutral-400 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={generatePassword}
                className="border-neutral-600 text-neutral-300 hover:bg-neutral-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="mustChangePassword"
              checked={formData.mustChangePassword}
              onChange={(e) => onInputChange('mustChangePassword', e.target.checked)}
              className="rounded border-neutral-600 bg-neutral-700"
            />
            <Label htmlFor="mustChangePassword" className="text-white">
              Require password change on first login
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-neutral-800 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Review Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-neutral-400">Name:</span>
              <span className="text-white ml-2">{formData.name || 'Not provided'}</span>
            </div>
            <div>
              <span className="text-neutral-400">Email:</span>
              <span className="text-white ml-2">{formData.email || 'Not provided'}</span>
            </div>
            <div>
              <span className="text-neutral-400">Phone:</span>
              <span className="text-white ml-2">{formData.phone || 'Not provided'}</span>
            </div>
            <div>
              <span className="text-neutral-400">Role:</span>
              <span className="text-white ml-2">{formData.role || 'Not provided'}</span>
            </div>
            <div>
              <span className="text-neutral-400">Employment Type:</span>
              <span className="text-white ml-2">{formData.employmentType}</span>
            </div>
            <div>
              <span className="text-neutral-400">Start Date:</span>
              <span className="text-white ml-2">{formData.startDate || 'Not provided'}</span>
            </div>
          </div>

          {formData.skills && formData.skills.length > 0 && (
            <div>
              <span className="text-neutral-400">Skills:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {formData.skills.map((skill) => (
                  <Badge key={skill} className="bg-blue-600 text-white">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {formData.emergencyContactName && (
            <div>
              <span className="text-neutral-400">Emergency Contact:</span>
              <span className="text-white ml-2">
                {formData.emergencyContactName} ({formData.emergencyContactRelationship}) - {formData.emergencyContactPhone}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
