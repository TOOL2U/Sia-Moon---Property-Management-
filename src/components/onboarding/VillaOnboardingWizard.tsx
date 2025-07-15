'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { OnboardingService } from '@/lib/services/onboardingService'
import { PropertyService } from '@/lib/services/propertyService'
import { useOnboardingSubmit, OnboardingSubmissionData } from '@/hooks/useOnboardingSubmit'
import { useUserSync } from '@/hooks/useUserSync'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Checkbox } from '@/components/ui/Checkbox'
import { Textarea } from '@/components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { VillaPhotoUploadCloudinary } from '@/components/VillaPhotoUploadCloudinary'
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  User, 
  Building, 
  Home,
  Settings,
  DollarSign,
  Shield,
  Camera,
  Phone,
  FileText
} from 'lucide-react'
import toast from 'react-hot-toast'
import { sanitizeFormData } from '@/utils/sanitizeData'

// Import the VillaOnboardingData interface
interface VillaOnboardingData {
  // Owner Details
  ownerFullName: string
  ownerNationality: string
  ownerContactNumber: string
  ownerEmail: string
  preferredContactMethod: string
  bankDetails: string

  // Property Details
  propertyName: string
  propertyAddress: string
  googleMapsUrl: string
  bedrooms: string
  bathrooms: string
  landSizeSqm: string
  villaSizeSqm: string
  yearBuilt: string

  // Amenities
  hasPool: boolean
  hasGarden: boolean
  hasAirConditioning: boolean
  internetProvider: string
  hasParking: boolean
  hasLaundry: boolean
  hasBackupPower: boolean

  // Access & Staff
  accessDetails: string
  hasSmartLock: boolean
  gateRemoteDetails: string
  onsiteStaff: string

  // Utilities
  electricityProvider: string
  waterSource: string
  internetPackage: string

  // Smart Electric System
  hasSmartElectricSystem: boolean
  smartSystemBrand: string
  smartDevicesControlled: string[]
  smartDevicesOther: string
  canControlManuallyWifiDown: boolean
  smartSystemAppPlatform: string
  hasHubGateway: boolean
  hubGatewayLocation: string
  linkedToPropertyWifi: boolean
  controlAccountOwner: string
  controlAccountOwnerOther: string
  loginCredentialsProvided: boolean
  loginCredentialsDetails: string
  hasActiveSchedulesAutomations: boolean
  schedulesAutomationsDetails: string
  smartSystemSpecialInstructions: string

  // Rental & Marketing
  rentalRates: string
  platformsListed: string[]
  averageOccupancyRate: string
  minimumStayRequirements: string
  targetGuests: string
  ownerBlackoutDates: string

  // Preferences & Rules
  petsAllowed: boolean
  partiesAllowed: boolean
  smokingAllowed: boolean
  maintenanceAutoApprovalLimit: string

  // Current Condition
  repairsNeeded: string

  // Photos & Media
  professionalPhotosStatus: string
  floorPlanImagesAvailable: boolean
  videoWalkthroughAvailable: boolean

  // Emergency Contact
  emergencyContactName: string
  emergencyContactPhone: string

  // Confirmation
  informationConfirmed: boolean
}

interface WizardStep {
  id: number
  title: string
  description: string
  icon: React.ComponentType<any>
  fields: (keyof VillaOnboardingData)[]
}

const wizardSteps: WizardStep[] = [
  {
    id: 1,
    title: 'Owner Information',
    description: 'Basic contact and owner details',
    icon: User,
    fields: ['ownerFullName', 'ownerEmail', 'ownerContactNumber', 'ownerNationality', 'preferredContactMethod']
  },
  {
    id: 2,
    title: 'Property Basics',
    description: 'Essential property information',
    icon: Building,
    fields: ['propertyName', 'propertyAddress', 'googleMapsUrl', 'bedrooms', 'bathrooms', 'villaSizeSqm']
  },
  {
    id: 3,
    title: 'Property Features',
    description: 'Amenities and features',
    icon: Home,
    fields: ['hasPool', 'hasGarden', 'hasAirConditioning', 'hasParking', 'hasLaundry', 'hasBackupPower', 'internetProvider', 'landSizeSqm']
  },
  {
    id: 4,
    title: 'Access & Security',
    description: 'Property access and staff details',
    icon: Shield,
    fields: ['accessDetails', 'hasSmartLock', 'gateRemoteDetails', 'onsiteStaff']
  },
  {
    id: 5,
    title: 'Smart Home & Tech',
    description: 'Technology and smart home systems',
    icon: Settings,
    fields: ['hasSmartElectricSystem', 'smartSystemBrand', 'smartDevicesControlled', 'internetPackage', 'electricityProvider', 'waterSource']
  },
  {
    id: 6,
    title: 'Rental & Marketing',
    description: 'Pricing and marketing information',
    icon: DollarSign,
    fields: ['rentalRates', 'platformsListed', 'averageOccupancyRate', 'minimumStayRequirements', 'targetGuests', 'ownerBlackoutDates']
  },
  {
    id: 7,
    title: 'Property Rules',
    description: 'Policies and preferences',
    icon: FileText,
    fields: ['petsAllowed', 'partiesAllowed', 'smokingAllowed', 'maintenanceAutoApprovalLimit']
  },
  {
    id: 8,
    title: 'Photos & Media',
    description: 'Visual content and documentation',
    icon: Camera,
    fields: ['professionalPhotosStatus', 'floorPlanImagesAvailable', 'videoWalkthroughAvailable', 'repairsNeeded']
  },
  {
    id: 9,
    title: 'Emergency & Final',
    description: 'Emergency contact and confirmation',
    icon: Phone,
    fields: ['emergencyContactName', 'emergencyContactPhone', 'bankDetails', 'informationConfirmed']
  }
]

const initialFormData: VillaOnboardingData = {
  // Owner Details
  ownerFullName: '',
  ownerNationality: '',
  ownerContactNumber: '',
  ownerEmail: '',
  preferredContactMethod: '',
  bankDetails: '',

  // Property Details
  propertyName: '',
  propertyAddress: '',
  googleMapsUrl: '',
  bedrooms: '',
  bathrooms: '',
  landSizeSqm: '',
  villaSizeSqm: '',
  yearBuilt: '',

  // Amenities
  hasPool: false,
  hasGarden: false,
  hasAirConditioning: false,
  internetProvider: '',
  hasParking: false,
  hasLaundry: false,
  hasBackupPower: false,

  // Access & Staff
  accessDetails: '',
  hasSmartLock: false,
  gateRemoteDetails: '',
  onsiteStaff: '',

  // Utilities
  electricityProvider: '',
  waterSource: '',
  internetPackage: '',

  // Smart Electric System
  hasSmartElectricSystem: false,
  smartSystemBrand: '',
  smartDevicesControlled: [],
  smartDevicesOther: '',
  canControlManuallyWifiDown: false,
  smartSystemAppPlatform: '',
  hasHubGateway: false,
  hubGatewayLocation: '',
  linkedToPropertyWifi: false,
  controlAccountOwner: '',
  controlAccountOwnerOther: '',
  loginCredentialsProvided: false,
  loginCredentialsDetails: '',
  hasActiveSchedulesAutomations: false,
  schedulesAutomationsDetails: '',
  smartSystemSpecialInstructions: '',

  // Rental & Marketing
  rentalRates: '',
  platformsListed: [],
  averageOccupancyRate: '',
  minimumStayRequirements: '',
  targetGuests: '',
  ownerBlackoutDates: '',

  // Preferences & Rules
  petsAllowed: false,
  partiesAllowed: false,
  smokingAllowed: false,
  maintenanceAutoApprovalLimit: '',

  // Current Condition
  repairsNeeded: '',

  // Photos & Media
  professionalPhotosStatus: '',
  floorPlanImagesAvailable: false,
  videoWalkthroughAvailable: false,

  // Emergency Contact
  emergencyContactName: '',
  emergencyContactPhone: '',

  // Confirmation
  informationConfirmed: false
}

export default function VillaOnboardingWizardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { syncAfterPropertyCreation } = useUserSync()
  const { submitOnboarding: submitToMake } = useOnboardingSubmit()

  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<VillaOnboardingData>(initialFormData)
  const [loading, setLoading] = useState(false)
  const [uploadedPhotoUrls, setUploadedPhotoUrls] = useState<string[]>([])

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    // Pre-populate owner details from user profile
    if (user.email && !formData.ownerEmail) {
      setFormData(prev => ({
        ...prev,
        ownerEmail: user.email || '',
        ownerFullName: user.full_name || ''
      }))
    }
  }, [user, router, formData.ownerEmail])

  // Debug: Log user information
  useEffect(() => {
    console.log('🔍 Wizard Auth Debug:', {
      user: user ? {
        id: user.id,
        email: user.email,
        role: user.role
      } : null,
      hasUser: !!user
    })
  }, [user])

  const handleInputChange = (field: keyof VillaOnboardingData, value: string | boolean | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateCurrentStep = (): boolean => {
    const currentStepData = wizardSteps.find(step => step.id === currentStep)
    if (!currentStepData) return false

    // Step-specific validation
    switch (currentStep) {
      case 1: // Owner Information
        if (!formData.ownerFullName.trim()) {
          toast.error('Full name is required')
          return false
        }
        if (!formData.ownerEmail.trim()) {
          toast.error('Email is required')
          return false
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.ownerEmail)) {
          toast.error('Please enter a valid email address')
          return false
        }
        if (!formData.ownerContactNumber.trim()) {
          toast.error('Contact number is required')
          return false
        }
        break

      case 2: // Property Basics
        if (!formData.propertyName.trim()) {
          toast.error('Property name is required')
          return false
        }
        if (!formData.propertyAddress.trim()) {
          toast.error('Property address is required')
          return false
        }
        if (!formData.bedrooms || !formData.bathrooms) {
          toast.error('Bedrooms and bathrooms are required')
          return false
        }
        break

      case 9: // Final step
        if (!formData.informationConfirmed) {
          toast.error('Please confirm that the information is accurate')
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
    if (stepId <= currentStep || stepId === currentStep + 1) {
      setCurrentStep(stepId)
    }
  }

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return

    // Check authentication before proceeding
    if (!user || !user.id) {
      toast.error('Authentication required. Please sign in and try again.')
      router.push('/auth/login?redirect=/onboard-wizard')
      return
    }

    // Additional Firebase Auth check
    try {
      const { auth } = await import('@/lib/firebase')
      if (!auth?.currentUser) {
        toast.error('Firebase authentication not ready. Please refresh and try again.')
        return
      }
      console.log('🔍 Firebase Auth confirmed for user:', auth.currentUser.uid)
    } catch (authError) {
      console.error('❌ Firebase Auth check failed:', authError)
      toast.error('Authentication error. Please sign in again.')
      router.push('/auth/login?redirect=/onboard-wizard')
      return
    }

    setLoading(true)
    try {
      console.log('🔄 Submitting villa onboarding data to Firestore and webhook')

      // Sanitize numeric fields to prevent undefined errors
      const sanitizeNumericField = (value: string | undefined): number | undefined => {
        if (!value || value.trim() === '') return undefined
        const parsed = Number(value)
        return isNaN(parsed) ? undefined : parsed
      }

      const rawSubmissionData = {
        userId: user?.id,
        // Owner Details
        owner_full_name: formData.ownerFullName,
        owner_nationality: formData.ownerNationality,
        owner_contact_number: formData.ownerContactNumber,
        owner_email: formData.ownerEmail,
        preferred_contact_method: formData.preferredContactMethod,
        bank_details: formData.bankDetails,

        // Property Details
        property_name: formData.propertyName,
        property_address: formData.propertyAddress,
        google_maps_url: formData.googleMapsUrl,
        bedrooms: sanitizeNumericField(formData.bedrooms),
        bathrooms: sanitizeNumericField(formData.bathrooms),
        land_size_sqm: sanitizeNumericField(formData.landSizeSqm),
        villa_size_sqm: sanitizeNumericField(formData.villaSizeSqm),
        year_built: sanitizeNumericField(formData.yearBuilt),

        // Amenities
        has_pool: formData.hasPool,
        has_garden: formData.hasGarden,
        has_air_conditioning: formData.hasAirConditioning,
        internet_provider: formData.internetProvider,
        has_parking: formData.hasParking,
        has_laundry: formData.hasLaundry,
        has_backup_power: formData.hasBackupPower,

        // Access & Staff
        access_details: formData.accessDetails,
        has_smart_lock: formData.hasSmartLock,
        gate_remote_details: formData.gateRemoteDetails,
        onsite_staff: formData.onsiteStaff,

        // Utilities
        electricity_provider: formData.electricityProvider,
        water_source: formData.waterSource,
        internet_package: formData.internetPackage,

        // Smart Electric System
        has_smart_electric_system: formData.hasSmartElectricSystem,
        smart_system_brand: formData.smartSystemBrand,
        smart_devices_controlled: formData.smartDevicesControlled,

        // Rental & Marketing
        rental_rates: formData.rentalRates,
        platforms_listed: formData.platformsListed,
        average_occupancy_rate: formData.averageOccupancyRate,
        minimum_stay_requirements: formData.minimumStayRequirements,
        target_guests: formData.targetGuests,
        owner_blackout_dates: formData.ownerBlackoutDates,

        // Preferences & Rules
        pets_allowed: formData.petsAllowed,
        parties_allowed: formData.partiesAllowed,
        smoking_allowed: formData.smokingAllowed,
        maintenance_auto_approval_limit: formData.maintenanceAutoApprovalLimit,

        // Current Condition
        repairs_needed: formData.repairsNeeded,

        // Photos & Media
        professional_photos_status: formData.professionalPhotosStatus,
        floor_plan_images_available: formData.floorPlanImagesAvailable,
        video_walkthrough_available: formData.videoWalkthroughAvailable,

        // Emergency Contact
        emergency_contact_name: formData.emergencyContactName,
        emergency_contact_phone: formData.emergencyContactPhone,

        // Additional Notes
        notes: formData.repairsNeeded || '',

        // Submission metadata
        submissionType: 'comprehensive_villa_onboarding_wizard',
        uploadedPhotos: uploadedPhotoUrls
      }

      // Sanitize the data to remove undefined values
      const submissionData = sanitizeFormData(rawSubmissionData) as Record<string, unknown>

      // Save to Firestore via API route (uses Admin SDK)
      let submissionId: string | null = null
      try {
        console.log('🔄 Submitting to API route with Admin SDK...')
        
        const apiResponse = await fetch('/api/onboarding', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submissionData)
        })

        if (!apiResponse.ok) {
          const errorData = await apiResponse.json()
          throw new Error(errorData.error || `API request failed with status ${apiResponse.status}`)
        }

        const result = await apiResponse.json()
        submissionId = result.submissionId
        console.log('✅ Onboarding submission saved via API:', submissionId)
        
      } catch (apiError: any) {
        console.error('❌ API submission error:', apiError)
        
        // Fallback to direct client SDK if API fails
        console.log('🔄 Falling back to direct client SDK...')
        try {
          submissionId = await OnboardingService.createSubmission(submissionData as any)
          console.log('✅ Fallback: Onboarding submission saved via client SDK:', submissionId)
        } catch (clientError: any) {
          console.error('❌ Client SDK fallback failed:', clientError)
          
          if (clientError?.code === 'permission-denied') {
            toast.error('Permission denied. Please ensure you are signed in and try again.')
            return
          } else if (clientError?.code === 'unauthenticated') {
            toast.error('Authentication required. Please sign in and try again.')
            router.push('/auth/login?redirect=/onboard-wizard')
            return
          } else {
            toast.error('Failed to save submission. Please try again.')
            return
          }
        }
      }

      // Create property in user's profile
      let propertyId: string | null = null
      try {
        if (!user?.id) {
          throw new Error('User ID is required to save property')
        }

        propertyId = await PropertyService.createPropertyInUserProfile(
          submissionData,
          user.id
        )
        console.log('✅ Property created in user profile with ID:', propertyId)

        // Sync user profile
        const syncResult = await syncAfterPropertyCreation(user.id, user.email || '')
        if (syncResult.success) {
          console.log(`✅ Profile synchronized with ${syncResult.propertiesLinked} properties`)
        }
      } catch (propertyError) {
        console.error('❌ Failed to create property in user profile:', propertyError)
      }

      // Send confirmation email via Make.com webhook
      try {
        const makeData: OnboardingSubmissionData = {
          user_id: user?.id,
          name: formData.ownerFullName,
          email: formData.ownerEmail,
          phone: formData.ownerContactNumber,
          nationality: formData.ownerNationality,
          preferred_contact_method: formData.preferredContactMethod,
          bank_details: formData.bankDetails,
          property_name: formData.propertyName,
          property_address: formData.propertyAddress,
          google_maps_url: formData.googleMapsUrl,
          bedrooms: parseInt(formData.bedrooms) || 0,
          bathrooms: parseFloat(formData.bathrooms) || 0,
          land_size_sqm: parseInt(formData.landSizeSqm) || 0,
          villa_size_sqm: parseInt(formData.villaSizeSqm) || 0,
          year_built: parseInt(formData.yearBuilt) || 0,
          emergency_contact_name: formData.emergencyContactName,
          emergency_contact_phone: formData.emergencyContactPhone,
          notes: `Additional Information: ${formData.repairsNeeded || 'None specified'}`,
          submission_type: 'comprehensive_villa_onboarding_wizard',
          timestamp: new Date().toISOString()
        }

        await submitToMake(makeData)
        console.log('✅ Confirmation email sent via Make.com')
        
        if (propertyId) {
          toast.success('Villa onboarding submitted successfully! Your property has been created and our team will review your submission.')
        } else {
          toast.success('Villa onboarding submitted successfully! Our team will review your submission.')
        }
      } catch (makeError) {
        console.warn('⚠️ Failed to send confirmation email via Make.com:', makeError)
        if (propertyId) {
          toast.success('Villa onboarding submitted successfully! Your property has been created.')
        } else {
          toast.success('Villa onboarding submitted successfully!')
        }
      }

      // Reset form and redirect
      setFormData(initialFormData)
      setCurrentStep(1)
      router.push('/dashboard/client/onboarding')

    } catch (error) {
      console.error('❌ Error submitting villa onboarding:', error)
      toast.error('Failed to submit villa onboarding. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Test Firebase connectivity
  const testFirebaseConnection = async () => {
    try {
      console.log('🔍 Testing Firebase connection...')
      console.log('🔍 User context:', { 
        user: user ? { id: user.id, email: user.email, role: user.role } : null 
      })
      
      // Test Firebase Auth state
      const { auth } = await import('@/lib/firebase')
      if (auth) {
        console.log('🔍 Firebase Auth current user:', {
          uid: auth.currentUser?.uid,
          email: auth.currentUser?.email,
          emailVerified: auth.currentUser?.emailVerified,
          isAnonymous: auth.currentUser?.isAnonymous
        })
      }
      
      // Test with a simple operation first
      const testData = {
        test: true,
        timestamp: new Date().toISOString(),
        userId: user?.id || 'anonymous',
        firebaseAuthUid: auth?.currentUser?.uid
      }
      
      console.log('🔍 Attempting test Firestore write...', testData)
      
      // Test if we can access Firestore
      const { db } = await import('@/lib/firebase')
      if (!db) {
        throw new Error('Firestore db instance is null')
      }
      
      const { collection, addDoc } = await import('firebase/firestore')
      
      // Try to write to a test collection
      const testDocRef = await addDoc(collection(db, 'test_connection'), testData)
      console.log('✅ Test Firestore write successful:', testDocRef.id)
      
    } catch (error: any) {
      console.error('❌ Firebase connection test failed:', error)
      if (error?.code) {
        console.error('❌ Firebase error code:', error.code)
        console.error('❌ Firebase error message:', error.message)
      }
    }
  }

  // Run test when component mounts and user is available
  useEffect(() => {
    if (user) {
      testFirebaseConnection()
    }
  }, [user])

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
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    )
  }

  const renderStepIndicators = () => (
    <div className="flex items-center justify-between mb-6 overflow-x-auto">
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

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Villa Onboarding Wizard</h1>
          <p className="text-neutral-400">
            Let's get your villa set up step by step. This wizard will guide you through all the necessary information.
          </p>
          
          {/* User Authentication Status */}
          {user && (
            <div className="mt-4 bg-green-500/10 border border-green-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-green-400">
                <CheckCircle className="h-4 w-4" />
                <span>Authenticated as: {user.email} ({user.role})</span>
              </div>
            </div>
          )}
          
          {/* Help for Firebase Permission Issues */}
          <div className="mt-4 bg-neutral-800/50 border border-neutral-700 rounded-lg p-3">
            <details className="text-sm">
              <summary className="text-neutral-300 cursor-pointer hover:text-white">
                Having trouble submitting? Click for help
              </summary>
              <div className="mt-2 text-neutral-400 space-y-1">
                <p>• Ensure you're signed in to your account</p>
                <p>• Try refreshing the page if you see permission errors</p>
                <p>• Contact support if issues persist: support@siamoon.com</p>
              </div>
            </details>
          </div>
        </div>

        {renderProgressBar()}
        {renderStepIndicators()}

        {/* Step Content */}
        <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-6 mb-6">
          {currentStep === 1 && <OwnerInformationStep formData={formData} onInputChange={handleInputChange} />}
          {currentStep === 2 && <PropertyBasicsStep formData={formData} onInputChange={handleInputChange} />}
          {currentStep === 3 && <PropertyFeaturesStep formData={formData} onInputChange={handleInputChange} />}
          {currentStep === 4 && <AccessSecurityStep formData={formData} onInputChange={handleInputChange} />}
          {currentStep === 5 && <SmartHomeTechStep formData={formData} onInputChange={handleInputChange} />}
          {currentStep === 6 && <RentalMarketingStep formData={formData} onInputChange={handleInputChange} />}
          {currentStep === 7 && <PropertyRulesStep formData={formData} onInputChange={handleInputChange} />}
          {currentStep === 8 && <PhotosMediaStep formData={formData} onInputChange={handleInputChange} uploadedPhotoUrls={uploadedPhotoUrls} setUploadedPhotoUrls={setUploadedPhotoUrls} user={user} />}
          {currentStep === 9 && <EmergencyFinalStep formData={formData} onInputChange={handleInputChange} />}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={currentStep === 1 ? () => router.push('/dashboard') : previousStep}
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
              {loading ? 'Submitting...' : 'Complete Onboarding'}
              <CheckCircle className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// Step Components
interface StepProps {
  formData: VillaOnboardingData
  onInputChange: (field: keyof VillaOnboardingData, value: string | boolean | string[]) => void
}

function OwnerInformationStep({ formData, onInputChange }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
          <User className="h-5 w-5 mr-2 text-blue-400" />
          Owner Information
        </h2>
        <p className="text-neutral-400 mb-6">
          Please provide your contact details and basic information.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ownerFullName" className="text-neutral-300">Full Name *</Label>
          <Input
            id="ownerFullName"
            value={formData.ownerFullName}
            onChange={(e) => onInputChange('ownerFullName', e.target.value)}
            placeholder="Your full name"
            className="bg-neutral-800 border-neutral-700 text-white"
          />
        </div>

        <div>
          <Label htmlFor="ownerEmail" className="text-neutral-300">Email Address *</Label>
          <Input
            id="ownerEmail"
            type="email"
            value={formData.ownerEmail}
            onChange={(e) => onInputChange('ownerEmail', e.target.value)}
            placeholder="your.email@example.com"
            className="bg-neutral-800 border-neutral-700 text-white"
          />
        </div>

        <div>
          <Label htmlFor="ownerContactNumber" className="text-neutral-300">Contact Number *</Label>
          <Input
            id="ownerContactNumber"
            value={formData.ownerContactNumber}
            onChange={(e) => onInputChange('ownerContactNumber', e.target.value)}
            placeholder="+1 (555) 123-4567"
            className="bg-neutral-800 border-neutral-700 text-white"
          />
        </div>

        <div>
          <Label htmlFor="ownerNationality" className="text-neutral-300">Nationality</Label>
          <Input
            id="ownerNationality"
            value={formData.ownerNationality}
            onChange={(e) => onInputChange('ownerNationality', e.target.value)}
            placeholder="Your nationality"
            className="bg-neutral-800 border-neutral-700 text-white"
          />
        </div>

        <div>
          <Label htmlFor="preferredContactMethod" className="text-neutral-300">Preferred Contact Method</Label>
          <Select value={formData.preferredContactMethod} onValueChange={(value) => onInputChange('preferredContactMethod', value)}>
            <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
              <SelectValue placeholder="Select contact method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="phone">Phone</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="both">Both Email & Phone</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

function PropertyBasicsStep({ formData, onInputChange }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
          <Building className="h-5 w-5 mr-2 text-blue-400" />
          Property Basics
        </h2>
        <p className="text-neutral-400 mb-6">
          Tell us about your property's essential details.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="propertyName" className="text-neutral-300">Property Name *</Label>
          <Input
            id="propertyName"
            value={formData.propertyName}
            onChange={(e) => onInputChange('propertyName', e.target.value)}
            placeholder="Villa Paradise"
            className="bg-neutral-800 border-neutral-700 text-white"
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="propertyAddress" className="text-neutral-300">Property Address *</Label>
          <Textarea
            id="propertyAddress"
            value={formData.propertyAddress}
            onChange={(e) => onInputChange('propertyAddress', e.target.value)}
            placeholder="Full address including city, state, and postal code"
            rows={3}
            className="bg-neutral-800 border-neutral-700 text-white"
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="googleMapsUrl" className="text-neutral-300">Google Maps URL</Label>
          <Input
            id="googleMapsUrl"
            value={formData.googleMapsUrl}
            onChange={(e) => onInputChange('googleMapsUrl', e.target.value)}
            placeholder="https://maps.google.com/..."
            className="bg-neutral-800 border-neutral-700 text-white"
          />
        </div>

        <div>
          <Label htmlFor="bedrooms" className="text-neutral-300">Bedrooms *</Label>
          <Select value={formData.bedrooms} onValueChange={(value) => onInputChange('bedrooms', value)}>
            <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
              <SelectValue placeholder="Number of bedrooms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Bedroom</SelectItem>
              <SelectItem value="2">2 Bedrooms</SelectItem>
              <SelectItem value="3">3 Bedrooms</SelectItem>
              <SelectItem value="4">4 Bedrooms</SelectItem>
              <SelectItem value="5">5 Bedrooms</SelectItem>
              <SelectItem value="6+">6+ Bedrooms</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="bathrooms" className="text-neutral-300">Bathrooms *</Label>
          <Select value={formData.bathrooms} onValueChange={(value) => onInputChange('bathrooms', value)}>
            <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
              <SelectValue placeholder="Number of bathrooms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Bathroom</SelectItem>
              <SelectItem value="1.5">1.5 Bathrooms</SelectItem>
              <SelectItem value="2">2 Bathrooms</SelectItem>
              <SelectItem value="2.5">2.5 Bathrooms</SelectItem>
              <SelectItem value="3">3 Bathrooms</SelectItem>
              <SelectItem value="3.5">3.5 Bathrooms</SelectItem>
              <SelectItem value="4">4 Bathrooms</SelectItem>
              <SelectItem value="4+">4+ Bathrooms</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="villaSizeSqm" className="text-neutral-300">Villa Size (sq m)</Label>
          <Input
            id="villaSizeSqm"
            type="number"
            value={formData.villaSizeSqm}
            onChange={(e) => onInputChange('villaSizeSqm', e.target.value)}
            placeholder="200"
            className="bg-neutral-800 border-neutral-700 text-white"
          />
        </div>

        <div>
          <Label htmlFor="landSizeSqm" className="text-neutral-300">Land Size (sq m)</Label>
          <Input
            id="landSizeSqm"
            type="number"
            value={formData.landSizeSqm}
            onChange={(e) => onInputChange('landSizeSqm', e.target.value)}
            placeholder="500"
            className="bg-neutral-800 border-neutral-700 text-white"
          />
        </div>
      </div>
    </div>
  )
}

function PropertyFeaturesStep({ formData, onInputChange }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
          <Home className="h-5 w-5 mr-2 text-blue-400" />
          Property Features
        </h2>
        <p className="text-neutral-400 mb-6">
          What amenities and features does your property have?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">Amenities</h3>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasPool"
              checked={formData.hasPool}
              onChange={(e) => onInputChange('hasPool', e.target.checked)}
            />
            <Label htmlFor="hasPool" className="text-neutral-300">Swimming Pool</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasGarden"
              checked={formData.hasGarden}
              onChange={(e) => onInputChange('hasGarden', e.target.checked)}
            />
            <Label htmlFor="hasGarden" className="text-neutral-300">Garden/Landscaping</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasAirConditioning"
              checked={formData.hasAirConditioning}
              onChange={(e) => onInputChange('hasAirConditioning', e.target.checked)}
            />
            <Label htmlFor="hasAirConditioning" className="text-neutral-300">Air Conditioning</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasParking"
              checked={formData.hasParking}
              onChange={(e) => onInputChange('hasParking', e.target.checked)}
            />
            <Label htmlFor="hasParking" className="text-neutral-300">Parking</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasLaundry"
              checked={formData.hasLaundry}
              onChange={(e) => onInputChange('hasLaundry', e.target.checked)}
            />
            <Label htmlFor="hasLaundry" className="text-neutral-300">Laundry Facilities</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasBackupPower"
              checked={formData.hasBackupPower}
              onChange={(e) => onInputChange('hasBackupPower', e.target.checked)}
            />
            <Label htmlFor="hasBackupPower" className="text-neutral-300">Backup Power/Generator</Label>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">Utilities</h3>
          
          <div>
            <Label htmlFor="internetProvider" className="text-neutral-300">Internet Provider</Label>
            <Input
              id="internetProvider"
              value={formData.internetProvider}
              onChange={(e) => onInputChange('internetProvider', e.target.value)}
              placeholder="e.g., Comcast, AT&T, Local ISP"
              className="bg-neutral-800 border-neutral-700 text-white"
            />
          </div>

          <div>
            <Label htmlFor="electricityProvider" className="text-neutral-300">Electricity Provider</Label>
            <Input
              id="electricityProvider"
              value={formData.electricityProvider}
              onChange={(e) => onInputChange('electricityProvider', e.target.value)}
              placeholder="Utility company name"
              className="bg-neutral-800 border-neutral-700 text-white"
            />
          </div>

          <div>
            <Label htmlFor="waterSource" className="text-neutral-300">Water Source</Label>
            <Select value={formData.waterSource} onValueChange={(value) => onInputChange('waterSource', value)}>
              <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                <SelectValue placeholder="Select water source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="municipal">Municipal Water</SelectItem>
                <SelectItem value="well">Private Well</SelectItem>
                <SelectItem value="tank">Water Tank</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}

function AccessSecurityStep({ formData, onInputChange }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
          <Shield className="h-5 w-5 mr-2 text-blue-400" />
          Access & Security
        </h2>
        <p className="text-neutral-400 mb-6">
          How do guests access your property and what security features are available?
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="accessDetails" className="text-neutral-300">Property Access Details</Label>
          <Textarea
            id="accessDetails"
            value={formData.accessDetails}
            onChange={(e) => onInputChange('accessDetails', e.target.value)}
            placeholder="Describe how guests can access the property (key location, gate codes, etc.)"
            rows={4}
            className="bg-neutral-800 border-neutral-700 text-white"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="hasSmartLock"
            checked={formData.hasSmartLock}
            onChange={(e) => onInputChange('hasSmartLock', e.target.checked)}
          />
          <Label htmlFor="hasSmartLock" className="text-neutral-300">Has Smart Lock System</Label>
        </div>

        <div>
          <Label htmlFor="gateRemoteDetails" className="text-neutral-300">Gate/Remote Access Details</Label>
          <Textarea
            id="gateRemoteDetails"
            value={formData.gateRemoteDetails}
            onChange={(e) => onInputChange('gateRemoteDetails', e.target.value)}
            placeholder="Gate codes, remote controls, special instructions"
            rows={3}
            className="bg-neutral-800 border-neutral-700 text-white"
          />
        </div>

        <div>
          <Label htmlFor="onsiteStaff" className="text-neutral-300">On-site Staff Information</Label>
          <Textarea
            id="onsiteStaff"
            value={formData.onsiteStaff}
            onChange={(e) => onInputChange('onsiteStaff', e.target.value)}
            placeholder="Caretaker, security guard, cleaning staff details and contact information"
            rows={3}
            className="bg-neutral-800 border-neutral-700 text-white"
          />
        </div>
      </div>
    </div>
  )
}

function SmartHomeTechStep({ formData, onInputChange }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
          <Settings className="h-5 w-5 mr-2 text-blue-400" />
          Smart Home & Technology
        </h2>
        <p className="text-neutral-400 mb-6">
          Tell us about any smart home systems and technology in your property.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="hasSmartElectricSystem"
            checked={formData.hasSmartElectricSystem}
            onChange={(e) => onInputChange('hasSmartElectricSystem', e.target.checked)}
          />
          <Label htmlFor="hasSmartElectricSystem" className="text-neutral-300">Has Smart Electric/Home System</Label>
        </div>

        {formData.hasSmartElectricSystem && (
          <div className="space-y-4 pl-6 border-l-2 border-blue-500/30">
            <div>
              <Label htmlFor="smartSystemBrand" className="text-neutral-300">Smart System Brand</Label>
              <Input
                id="smartSystemBrand"
                value={formData.smartSystemBrand}
                onChange={(e) => onInputChange('smartSystemBrand', e.target.value)}
                placeholder="e.g., Nest, SmartThings, Alexa, Google Home"
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="internetPackage" className="text-neutral-300">Internet Package Details</Label>
          <Input
            id="internetPackage"
            value={formData.internetPackage}
            onChange={(e) => onInputChange('internetPackage', e.target.value)}
            placeholder="Speed, data limits, Wi-Fi password policy"
            className="bg-neutral-800 border-neutral-700 text-white"
          />
        </div>
      </div>
    </div>
  )
}

function RentalMarketingStep({ formData, onInputChange }: StepProps) {
  const platforms = ['Airbnb', 'VRBO', 'Booking.com', 'HomeAway', 'Direct Bookings', 'Other']

  const handlePlatformChange = (platform: string, checked: boolean) => {
    const currentPlatforms = formData.platformsListed || []
    if (checked) {
      onInputChange('platformsListed', [...currentPlatforms, platform])
    } else {
      onInputChange('platformsListed', currentPlatforms.filter(p => p !== platform))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
          <DollarSign className="h-5 w-5 mr-2 text-blue-400" />
          Rental & Marketing
        </h2>
        <p className="text-neutral-400 mb-6">
          How is your property currently marketed and priced?
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="rentalRates" className="text-neutral-300">Current Rental Rates</Label>
          <Textarea
            id="rentalRates"
            value={formData.rentalRates}
            onChange={(e) => onInputChange('rentalRates', e.target.value)}
            placeholder="Daily, weekly, monthly rates and seasonal variations"
            rows={3}
            className="bg-neutral-800 border-neutral-700 text-white"
          />
        </div>

        <div>
          <Label className="text-neutral-300 mb-3 block">Platforms Currently Listed On</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {platforms.map((platform) => (
              <div key={platform} className="flex items-center space-x-2">
                <Checkbox
                  id={`platform-${platform}`}
                  checked={formData.platformsListed?.includes(platform) || false}
                  onChange={(e) => handlePlatformChange(platform, e.target.checked)}
                />
                <Label htmlFor={`platform-${platform}`} className="text-neutral-300 text-sm">{platform}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="averageOccupancyRate" className="text-neutral-300">Average Occupancy Rate</Label>
            <Input
              id="averageOccupancyRate"
              value={formData.averageOccupancyRate}
              onChange={(e) => onInputChange('averageOccupancyRate', e.target.value)}
              placeholder="e.g., 70% annually"
              className="bg-neutral-800 border-neutral-700 text-white"
            />
          </div>

          <div>
            <Label htmlFor="minimumStayRequirements" className="text-neutral-300">Minimum Stay Requirements</Label>
            <Input
              id="minimumStayRequirements"
              value={formData.minimumStayRequirements}
              onChange={(e) => onInputChange('minimumStayRequirements', e.target.value)}
              placeholder="e.g., 3 nights minimum"
              className="bg-neutral-800 border-neutral-700 text-white"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="targetGuests" className="text-neutral-300">Target Guest Profile</Label>
          <Textarea
            id="targetGuests"
            value={formData.targetGuests}
            onChange={(e) => onInputChange('targetGuests', e.target.value)}
            placeholder="Families, couples, business travelers, etc."
            rows={2}
            className="bg-neutral-800 border-neutral-700 text-white"
          />
        </div>

        <div>
          <Label htmlFor="ownerBlackoutDates" className="text-neutral-300">Owner Blackout Dates</Label>
          <Textarea
            id="ownerBlackoutDates"
            value={formData.ownerBlackoutDates}
            onChange={(e) => onInputChange('ownerBlackoutDates', e.target.value)}
            placeholder="Dates when property is not available for rental"
            rows={2}
            className="bg-neutral-800 border-neutral-700 text-white"
          />
        </div>
      </div>
    </div>
  )
}

function PropertyRulesStep({ formData, onInputChange }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2 text-blue-400" />
          Property Rules & Policies
        </h2>
        <p className="text-neutral-400 mb-6">
          What are your property rules and maintenance preferences?
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="petsAllowed"
              checked={formData.petsAllowed}
              onChange={(e) => onInputChange('petsAllowed', e.target.checked)}
            />
            <Label htmlFor="petsAllowed" className="text-neutral-300">Pets Allowed</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="partiesAllowed"
              checked={formData.partiesAllowed}
              onChange={(e) => onInputChange('partiesAllowed', e.target.checked)}
            />
            <Label htmlFor="partiesAllowed" className="text-neutral-300">Parties/Events Allowed</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="smokingAllowed"
              checked={formData.smokingAllowed}
              onChange={(e) => onInputChange('smokingAllowed', e.target.checked)}
            />
            <Label htmlFor="smokingAllowed" className="text-neutral-300">Smoking Allowed</Label>
          </div>
        </div>

        <div>
          <Label htmlFor="maintenanceAutoApprovalLimit" className="text-neutral-300">Maintenance Auto-Approval Limit</Label>
          <Input
            id="maintenanceAutoApprovalLimit"
            value={formData.maintenanceAutoApprovalLimit}
            onChange={(e) => onInputChange('maintenanceAutoApprovalLimit', e.target.value)}
            placeholder="e.g., $200 - amount for automatic approval of maintenance expenses"
            className="bg-neutral-800 border-neutral-700 text-white"
          />
          <p className="text-sm text-neutral-500 mt-1">
            Maximum amount that can be spent on maintenance without your approval
          </p>
        </div>
      </div>
    </div>
  )
}

interface PhotosMediaStepProps extends StepProps {
  uploadedPhotoUrls: string[]
  setUploadedPhotoUrls: (urls: string[]) => void
  user: any
}

function PhotosMediaStep({ formData, onInputChange, uploadedPhotoUrls, setUploadedPhotoUrls, user }: PhotosMediaStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
          <Camera className="h-5 w-5 mr-2 text-blue-400" />
          Photos & Media
        </h2>
        <p className="text-neutral-400 mb-6">
          Upload photos and tell us about your property's visual content.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-neutral-300 mb-3 block">Property Photos</Label>
          <VillaPhotoUploadCloudinary
            userId={user?.id || 'anonymous'}
            onPhotosChange={setUploadedPhotoUrls}
          />
          <p className="text-sm text-neutral-500 mt-2">
            Upload high-quality photos of your property. Recommended: exterior, interior, amenities, and unique features.
          </p>
        </div>

        <div>
          <Label htmlFor="professionalPhotosStatus" className="text-neutral-300">Professional Photos Status</Label>
          <Select value={formData.professionalPhotosStatus} onValueChange={(value) => onInputChange('professionalPhotosStatus', value)}>
            <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Professional photos available</SelectItem>
              <SelectItem value="needed">Need professional photos</SelectItem>
              <SelectItem value="scheduled">Professional shoot scheduled</SelectItem>
              <SelectItem value="owner_photos">Using owner photos for now</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="floorPlanImagesAvailable"
              checked={formData.floorPlanImagesAvailable}
              onChange={(e) => onInputChange('floorPlanImagesAvailable', e.target.checked)}
            />
            <Label htmlFor="floorPlanImagesAvailable" className="text-neutral-300">Floor Plan Images Available</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="videoWalkthroughAvailable"
              checked={formData.videoWalkthroughAvailable}
              onChange={(e) => onInputChange('videoWalkthroughAvailable', e.target.checked)}
            />
            <Label htmlFor="videoWalkthroughAvailable" className="text-neutral-300">Video Walkthrough Available</Label>
          </div>
        </div>

        <div>
          <Label htmlFor="repairsNeeded" className="text-neutral-300">Current Condition & Repairs Needed</Label>
          <Textarea
            id="repairsNeeded"
            value={formData.repairsNeeded}
            onChange={(e) => onInputChange('repairsNeeded', e.target.value)}
            placeholder="Describe any current issues, needed repairs, or maintenance concerns"
            rows={4}
            className="bg-neutral-800 border-neutral-700 text-white"
          />
        </div>
      </div>
    </div>
  )
}

function EmergencyFinalStep({ formData, onInputChange }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
          <Phone className="h-5 w-5 mr-2 text-blue-400" />
          Emergency Contact & Final Details
        </h2>
        <p className="text-neutral-400 mb-6">
          Last step! Provide emergency contact information and confirm your submission.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="emergencyContactName" className="text-neutral-300">Emergency Contact Name</Label>
            <Input
              id="emergencyContactName"
              value={formData.emergencyContactName}
              onChange={(e) => onInputChange('emergencyContactName', e.target.value)}
              placeholder="Full name of emergency contact"
              className="bg-neutral-800 border-neutral-700 text-white"
            />
          </div>

          <div>
            <Label htmlFor="emergencyContactPhone" className="text-neutral-300">Emergency Contact Phone</Label>
            <Input
              id="emergencyContactPhone"
              value={formData.emergencyContactPhone}
              onChange={(e) => onInputChange('emergencyContactPhone', e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="bg-neutral-800 border-neutral-700 text-white"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="bankDetails" className="text-neutral-300">Banking/Payment Details</Label>
          <Textarea
            id="bankDetails"
            value={formData.bankDetails}
            onChange={(e) => onInputChange('bankDetails', e.target.value)}
            placeholder="Bank account information for rental income deposits (optional but recommended)"
            rows={3}
            className="bg-neutral-800 border-neutral-700 text-white"
          />
          <p className="text-sm text-neutral-500 mt-1">
            This information is encrypted and used only for rental income payments
          </p>
        </div>

        <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="informationConfirmed"
              checked={formData.informationConfirmed}
              onChange={(e) => onInputChange('informationConfirmed', e.target.checked)}
              className="mt-1"
            />
            <div>
              <Label htmlFor="informationConfirmed" className="text-neutral-300 font-medium">
                I confirm that all information provided is accurate *
              </Label>
              <p className="text-sm text-neutral-400 mt-1">
                I understand that this information will be used to set up property management services 
                and that our team may contact me to verify details before proceeding.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-400 mb-2">What happens next?</h3>
          <ul className="text-sm text-neutral-300 space-y-1">
            <li>• Our team will review your submission within 24-48 hours</li>
            <li>• You'll receive a confirmation email with next steps</li>
            <li>• A property manager will contact you to schedule an initial consultation</li>
            <li>• We'll begin setting up your customized management plan</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
