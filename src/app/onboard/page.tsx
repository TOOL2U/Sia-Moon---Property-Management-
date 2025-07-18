'use client'

import { Button } from '@/components/ui/Button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Checkbox'
import { CollapsibleSection } from '@/components/ui/CollapsibleSection'
import { FileUpload } from '@/components/ui/FileUpload'
import { Input } from '@/components/ui/Input'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useState } from 'react'
// TODO: Replace with new database service when implemented
// import { createClient } from '@/lib/newDatabase/client'
import {
  validateField,
  validateVillaOnboarding,
} from '@/lib/validations/villa-onboarding'
// import DatabaseService from '@/lib/newDatabaseService'
import { VillaPhotoUploadCloudinary } from '@/components/VillaPhotoUploadCloudinary'
import { Label } from '@/components/ui/Label'
import { useAuth } from '@/contexts/AuthContext'
import {
  OnboardingSubmissionData,
  useOnboardingSubmit,
} from '@/hooks/useOnboardingSubmit'
import { useUserSync } from '@/hooks/useUserSync'
import { OnboardingService } from '@/lib/services/onboardingService'
import { PropertyService } from '@/lib/services/propertyService'
import { ArrowLeft, Building, CheckCircle, Upload } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

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

function OnboardYourVillaContent() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')
  const { syncAfterPropertyCreation } = useUserSync()

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isEditing, _setIsEditing] = useState(!!editId)
  // Note: _setIsEditing is unused in development mode since editing redirects away
  // It will be used when database editing functionality is implemented

  // Webhook submission hook for Make.com integration
  const { submitOnboarding: submitToMake } = useOnboardingSubmit()

  const [formData, setFormData] = useState<VillaOnboardingData>({
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
    informationConfirmed: false,
  })

  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: File[] }>(
    {
      furnitureAppliances: [],
      floorPlans: [],
      titleDeed: [],
      houseRegistration: [],
      insurancePolicy: [],
      licenses: [],
    }
  )
  const [uploadedPhotoUrls, setUploadedPhotoUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string
  }>({})
  const [loadingExisting, setLoadingExisting] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const loadExistingData = useCallback(
    async (_id: string) => {
      // _id unused in dev mode
      if (!user) return

      try {
        setLoadingExisting(true)
        // TODO: Replace with new database service when implemented
        console.log(
          '🔄 Loading existing villa data (development mode - not implemented)'
        )

        // For now, just show a message that editing is not available in development mode
        toast.error(
          'Editing existing villa data is not available in development mode'
        )
        router.push('/dashboard/client/onboarding')
      } catch (error) {
        console.error('Error loading existing data:', error)
        toast.error('Failed to load villa data for editing')
        router.push('/dashboard/client/onboarding')
      } finally {
        setLoadingExisting(false)
      }
    },
    [user, router]
  )

  // Load existing data when editing
  useEffect(() => {
    if (editId && user) {
      loadExistingData(editId)
    }
  }, [editId, user, loadExistingData])

  // Using Firebase for storage and database operations

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    const newValue = type === 'checkbox' ? checked : value

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }))

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const handleInputBlur = (
    e: React.FocusEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target
    const newValue =
      e.target.type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : value

    // Required fields validation
    const requiredFields = [
      'ownerFullName',
      'ownerContactNumber',
      'ownerEmail',
      'propertyName',
      'propertyAddress',
      'bedrooms',
      'bathrooms',
      'emergencyContactName',
      'emergencyContactPhone',
    ]

    if (
      requiredFields.includes(name) &&
      (!newValue || (typeof newValue === 'string' && newValue.trim() === ''))
    ) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: `${name.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())} is required`,
      }))
      return
    }

    // Real-time validation with Zod
    const validation = validateField(name, newValue)
    if (!validation.isValid && validation.error) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: validation.error!,
      }))
    } else {
      // Clear validation error when field becomes valid
      setValidationErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }))
  }

  const handleMultiSelectChange = (
    name: string,
    value: string,
    checked: boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked
        ? [...(prev[name as keyof VillaOnboardingData] as string[]), value]
        : (prev[name as keyof VillaOnboardingData] as string[]).filter(
            (item) => item !== value
          ),
    }))
  }

  const handleFileUpload = (category: string, files: FileList | null) => {
    if (files) {
      setUploadedFiles((prev) => ({
        ...prev,
        [category]: Array.from(files),
      }))
    }
  }

  const validateForm = () => {
    const validation = validateVillaOnboarding(formData)
    const newErrors: { [key: string]: string } = {}

    // Only check required fields for new submissions, not when editing
    if (!isEditing) {
      // Check for required fields that are empty (only for new submissions)
      const requiredFields = {
        ownerFullName: 'Owner full name is required',
        ownerContactNumber: 'Owner contact number is required',
        ownerEmail: 'Owner email is required',
        propertyName: 'Property name is required',
        propertyAddress: 'Property address is required',
        bedrooms: 'Number of bedrooms is required',
        bathrooms: 'Number of bathrooms is required',
        emergencyContactName: 'Emergency contact name is required',
        emergencyContactPhone: 'Emergency contact phone is required',
        informationConfirmed: 'You must confirm the information is accurate',
      }

      // Debug: Log form data to see what's missing
      console.log('🔍 Form validation - Current form data:', formData)

      // Check each required field
      Object.entries(requiredFields).forEach(([field, message]) => {
        const value = formData[field as keyof typeof formData]
        console.log(`🔍 Checking field ${field}:`, value, typeof value)

        if (field === 'informationConfirmed') {
          // Special handling for boolean checkbox
          if (!value) {
            newErrors[field] = message
            console.log(`❌ ${field} is not checked`)
          }
        } else if (field === 'bedrooms' || field === 'bathrooms') {
          // Special handling for number fields
          if (!value || value === '0' || value === '') {
            newErrors[field] = message
            console.log(`❌ ${field} is empty or zero`)
          }
        } else {
          // Handle string fields
          if (!value || (typeof value === 'string' && value.trim() === '')) {
            newErrors[field] = message
            console.log(`❌ ${field} is empty or invalid`)
          }
        }
      })
    } else {
      // When editing, only validate the confirmation checkbox if it's unchecked
      if (!formData.informationConfirmed) {
        newErrors.informationConfirmed =
          'You must confirm the information is accurate'
        console.log('❌ Information confirmation required for updates')
      }
      console.log(
        '🔍 Form validation - Editing mode: skipping required field validation'
      )
    }

    // Add validation errors from Zod schema
    if (!validation.success && validation.errors) {
      console.log('🔍 Zod validation errors:', validation.errors)
      Object.assign(newErrors, validation.errors)
    }

    console.log('🔍 Final validation errors:', newErrors)

    if (Object.keys(newErrors).length > 0) {
      setValidationErrors(newErrors)

      // Create detailed error message
      const errorCount = Object.keys(newErrors).length
      const firstError = Object.entries(newErrors)[0]

      toast.error(
        `Please fix ${errorCount} error${errorCount > 1 ? 's' : ''}. First error: ${firstError[1]}`
      )

      // Scroll to first error field and highlight it
      const firstErrorField = Object.keys(newErrors)[0]
      if (typeof window !== 'undefined') {
        const errorElement = document.querySelector(
          `[name="${firstErrorField}"]`
        ) as HTMLElement
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          // Add temporary highlight
          errorElement.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.5)'
          setTimeout(() => {
            errorElement.style.boxShadow = ''
          }, 3000)
        }
      }

      return false
    }

    setValidationErrors({})
    return true
  }

  // Upload files function (prepared for Firebase Storage)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const uploadFiles = async () => {
    const uploadedUrls: { [key: string]: string } = {}
    const filesToUpload = Object.entries(uploadedFiles).filter(
      ([, files]) => files.length > 0
    )

    if (filesToUpload.length === 0) {
      return uploadedUrls
    }

    // TODO: Implement Firebase Storage upload
    // For now, simulate file uploads in development mode
    for (let i = 0; i < filesToUpload.length; i++) {
      const [category, files] = filesToUpload[i]!
      const file = files[0]
      // Simulate upload with a placeholder URL
      uploadedUrls[category] =
        `https://firebase-storage.example.com/uploads/${Date.now()}-${category}-${file.name}`
      toast.success(
        `Simulated upload: ${category} (${i + 1}/${filesToUpload.length})`
      )
    }

    return uploadedUrls
  }

  // Utility function to sanitize form data and remove undefined values
  const sanitizeFormData = (
    obj: Record<string, unknown>
  ): Record<string, unknown> => {
    const sanitized: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        // Keep all non-undefined values
        sanitized[key] = value
      } else {
        // Log missing fields for debugging
        console.log(`⚠️ Removing undefined field: ${key}`)
      }
    }

    return sanitized
  }

  // Alternative: Convert undefined to null for numeric fields that might be optional
  const sanitizeNumericField = (
    value: string | undefined
  ): number | undefined => {
    if (!value || value.trim() === '') return undefined
    const parsed = Number(value)
    return isNaN(parsed) ? undefined : parsed
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      setError(
        isEditing
          ? 'Please confirm the information is accurate to save changes'
          : 'Please fill in all required fields correctly'
      )
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log(
        '🔄 Submitting villa onboarding data to Firestore and webhook'
      )

      if (isEditing && editId) {
        // Editing not supported yet
        toast.error('Editing existing villa data is not available yet')
        return
      }

      // Save to Firestore first - sanitize numeric fields to prevent undefined errors
      const rawSubmissionData = {
        userId: user?.id,
        user_id: user?.id, // Include for webhook compatibility

        // Owner Details
        ownerFullName: formData.ownerFullName,
        ownerNationality: formData.ownerNationality,
        ownerContactNumber: formData.ownerContactNumber,
        ownerEmail: formData.ownerEmail,
        preferredContactMethod: formData.preferredContactMethod,
        bankDetails: formData.bankDetails,

        // Property Details - use sanitizeNumericField to prevent undefined values
        propertyName: formData.propertyName,
        propertyAddress: formData.propertyAddress,
        googleMapsUrl: formData.googleMapsUrl,
        bedrooms: sanitizeNumericField(formData.bedrooms),
        bathrooms: sanitizeNumericField(formData.bathrooms),
        landSizeSqm: sanitizeNumericField(formData.landSizeSqm),
        villaSizeSqm: sanitizeNumericField(formData.villaSizeSqm),
        yearBuilt: sanitizeNumericField(formData.yearBuilt),

        // Amenities
        hasPool: formData.hasPool,
        hasGarden: formData.hasGarden,
        hasAirConditioning: formData.hasAirConditioning,
        internetProvider: formData.internetProvider,
        hasParking: formData.hasParking,
        hasLaundry: formData.hasLaundry,

        // Access & Staff
        accessDetails: formData.accessDetails,
        hasSmartLock: formData.hasSmartLock,
        gateRemoteDetails: formData.gateRemoteDetails,
        onsiteStaff: formData.onsiteStaff,

        // Utilities
        electricityProvider: formData.electricityProvider,
        waterSource: formData.waterSource,
        internetPackage: formData.internetPackage,

        // Rental & Marketing
        rentalRates: formData.rentalRates,
        platformsListed: formData.platformsListed,
        averageOccupancyRate: formData.averageOccupancyRate,
        minimumStayRequirements: formData.minimumStayRequirements,
        targetGuests: formData.targetGuests,
        ownerBlackoutDates: formData.ownerBlackoutDates,

        // Preferences & Rules
        petsAllowed: formData.petsAllowed,
        partiesAllowed: formData.partiesAllowed,
        smokingAllowed: formData.smokingAllowed,
        maintenanceAutoApprovalLimit: formData.maintenanceAutoApprovalLimit,

        // Current Condition
        repairsNeeded: formData.repairsNeeded,

        // Photos & Media
        professionalPhotosStatus: formData.professionalPhotosStatus,
        floorPlanImagesAvailable: formData.floorPlanImagesAvailable,
        videoWalkthroughAvailable: formData.videoWalkthroughAvailable,
        uploadedPhotos: uploadedPhotoUrls, // Include uploaded photo URLs

        // Emergency Contact
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,

        // Additional Notes
        notes: formData.repairsNeeded || '',

        // Submission metadata
        submissionType: 'comprehensive_villa_onboarding',
      }

      // Sanitize the data to remove undefined values
      const submissionData = sanitizeFormData(rawSubmissionData) as Record<
        string,
        unknown
      >

      // Save to Firestore
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const submissionId = await OnboardingService.createSubmission(
        submissionData as any
      )
      console.log('✅ Onboarding submission saved to Firestore:', submissionId)

      // Create property directly in user's profile subcollection
      let propertyId: string | null = null
      try {
        console.log('🏠 Creating property in user profile subcollection...')
        console.log('👤 User ID:', user?.id)
        console.log('📋 Submission data:', submissionData)

        if (!user?.id) {
          throw new Error('User ID is required to save property')
        }

        propertyId = await PropertyService.createPropertyInUserProfile(
          submissionData,
          user.id
        )
        console.log('✅ Property created in user profile with ID:', propertyId)
        console.log(
          '📍 Saved to: /users/' + user.id + '/properties/' + propertyId
        )

        // Sync user profile with the new property
        console.log('🔄 Syncing user profile after property creation...')
        const syncResult = await syncAfterPropertyCreation(
          user.id,
          user.email || ''
        )

        if (syncResult.success) {
          console.log(
            `✅ Profile synchronized with ${syncResult.propertiesLinked} properties`
          )
        } else {
          console.warn('⚠️ Profile synchronization failed:', syncResult.error)
        }
      } catch (propertyError) {
        console.error(
          '❌ Failed to create property in user profile:',
          propertyError
        )
        console.warn(
          '⚠️ Property creation failed, but onboarding submission saved'
        )
        // Don't fail the entire submission if property creation fails
      }

      // Send confirmation email via Make.com webhook
      try {
        const makeData: OnboardingSubmissionData = {
          // User Information
          user_id: user?.id,

          // Owner Details
          name: formData.ownerFullName,
          email: formData.ownerEmail,
          phone: formData.ownerContactNumber,
          nationality: formData.ownerNationality,
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
          smart_devices_other: formData.smartDevicesOther,
          can_control_manually_wifi_down: formData.canControlManuallyWifiDown,
          smart_system_app_platform: formData.smartSystemAppPlatform,
          has_hub_gateway: formData.hasHubGateway,
          hub_gateway_location: formData.hubGatewayLocation,
          linked_to_property_wifi: formData.linkedToPropertyWifi,
          control_account_owner: formData.controlAccountOwner,
          control_account_owner_other: formData.controlAccountOwnerOther,
          login_credentials_provided: formData.loginCredentialsProvided,
          login_credentials_details: formData.loginCredentialsDetails,
          has_active_schedules_automations:
            formData.hasActiveSchedulesAutomations,
          schedules_automations_details: formData.schedulesAutomationsDetails,
          smart_system_special_instructions:
            formData.smartSystemSpecialInstructions,

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
          maintenance_auto_approval_limit:
            formData.maintenanceAutoApprovalLimit,

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
          notes: `Additional Information: ${formData.repairsNeeded || 'None specified'}`,

          // Submission metadata
          submission_type: 'comprehensive_villa_onboarding',
          timestamp: new Date().toISOString(),
        }

        await submitToMake(makeData)
        console.log('✅ Confirmation email sent via Make.com')
        if (propertyId) {
          toast.success(
            'Villa onboarding submitted successfully! Your property has been created and our team will review your submission.'
          )
        } else {
          toast.success(
            'Villa onboarding submitted successfully! Our team will review your submission.'
          )
        }
      } catch (makeError) {
        // Don't fail the entire submission if Make.com webhook fails
        console.warn(
          '⚠️ Failed to send confirmation email via Make.com:',
          makeError
        )
        if (propertyId) {
          toast.success(
            'Villa submitted successfully and property created! Confirmation email may be delayed.'
          )
        } else {
          toast.success(
            'Villa submitted successfully, but confirmation email may be delayed.'
          )
        }
      }

      setSubmitted(true)

      // Redirect to properties page after successful submission
      setTimeout(() => {
        router.push('/properties')
      }, 2000)
    } catch (err: unknown) {
      console.error('Submission error:', err)
      const errorMessage =
        err instanceof Error
          ? err.message
          : isEditing
            ? 'Error updating villa information. Please try again.'
            : 'Error submitting villa information. Please try again.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Option lists for select fields
  const contactMethodOptions = [
    { value: 'phone', label: 'Phone' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'line', label: 'LINE' },
    { value: 'email', label: 'Email' },
  ]

  const photosStatusOptions = [
    { value: 'available', label: 'Available' },
    { value: 'not_available', label: 'Not Available' },
    { value: 'need_photos', label: 'Need Photos Taken' },
  ]

  const platformOptions = [
    'Airbnb',
    'Booking.com',
    'Agoda',
    'Expedia',
    'VRBO',
    'Direct Booking',
    'Other',
  ]

  if (submitted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6">
        <Card className="w-full max-w-lg text-center group hover:shadow-xl transition-all duration-200 animate-scale-in-subtle will-change-transform">
          <CardHeader className="pb-6">
            <div className="mx-auto w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mb-6 animate-scale-in animate-delay-150 hover-glow">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-semibold text-white animate-fade-in-up animate-delay-300">
              Villa Submitted Successfully!
            </CardTitle>
            <CardDescription className="text-neutral-400 mt-3 animate-fade-in-up animate-delay-450">
              Thank you for choosing Sia Moon Property Management. We&apos;ll
              review your comprehensive villa information and contact you within
              24-48 hours to discuss next steps.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="p-6 bg-emerald-950/20 border border-emerald-800/30 rounded-lg text-left">
                <h4 className="font-semibold text-emerald-100 mb-3">
                  What happens next?
                </h4>
                <ul className="text-sm text-emerald-200 space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"></div>
                    Our team will review your submission
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"></div>
                    We&apos;ll schedule a property visit
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"></div>
                    You&apos;ll receive a management proposal
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"></div>
                    We&apos;ll begin onboarding your villa
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <Button
                  onClick={() => router.push('/')}
                  className="h-11 w-full"
                >
                  Return to Home
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSubmitted(false)}
                  className="h-11 w-full"
                >
                  Submit Another Villa
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show loading state when loading existing data
  if (loadingExisting) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto mb-4"></div>
          <p className="text-neutral-400">
            Loading property data for editing...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Back to home link - Enhanced with animation */}
      <div className="absolute top-6 left-6 z-10 animate-fade-in-left">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-neutral-400 hover:text-white transition-all duration-200 hover-scale-sm will-change-transform"
        >
          <ArrowLeft className="mr-2 h-4 w-4 icon-hover" />
          Back to Home
        </Link>
      </div>

      <div className="px-6 py-16 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header - Enhanced with Linear animations */}
          <div className="text-center mb-12">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center mb-6 animate-scale-in hover-glow will-change-transform">
              <Building className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl animate-fade-in-up animate-delay-150 will-change-transform">
              {isEditing
                ? 'Edit Villa Information'
                : 'Property Owner Onboarding Form'}
            </h1>
            <p className="mt-4 text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed animate-fade-in-up animate-delay-300 will-change-transform">
              {isEditing
                ? 'Update your villa information below. Changes will be reviewed by our team.'
                : 'Please provide comprehensive information about your villa and preferences. This detailed survey helps us deliver the best property management service tailored to your needs.'}
            </p>

            {/* Required Fields Notice */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-6 max-w-2xl mx-auto animate-fade-in-up animate-delay-450 will-change-transform">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="text-blue-400 font-medium mb-1">
                    Required Information
                  </h3>
                  <p className="text-sm text-neutral-300">
                    Fields marked with{' '}
                    <span className="text-red-400 font-medium">*</span> are
                    required. Please fill in all required fields to submit your
                    villa for onboarding.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Error Summary */}
          {Object.keys(validationErrors).length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 animate-fade-in-up">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <h3 className="text-red-400 font-medium mb-2">
                    Please fix the following errors:
                  </h3>
                  <ul className="space-y-1">
                    {Object.entries(validationErrors).map(([field, error]) => {
                      return (
                        <li
                          key={field}
                          className="text-sm text-red-300 flex items-center gap-2"
                        >
                          <span className="w-1 h-1 bg-red-400 rounded-full flex-shrink-0"></span>
                          <button
                            type="button"
                            onClick={() => {
                              if (typeof window !== 'undefined') {
                                const element = document.querySelector(
                                  `[name="${field}"]`
                                ) as HTMLElement
                                if (element) {
                                  element.scrollIntoView({
                                    behavior: 'smooth',
                                    block: 'center',
                                  })
                                  element.focus()
                                }
                              }
                            }}
                            className="text-left hover:text-red-200 underline"
                          >
                            {error}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Form - Linear design */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Owner Details Section */}
            <CollapsibleSection
              title="Owner Details"
              description="Your personal information and contact preferences"
              defaultOpen={true}
              required={true}
            >
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="ownerFullName">Full Name</Label>
                    <Input
                      id="ownerFullName"
                      name="ownerFullName"
                      value={formData.ownerFullName}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      required
                      placeholder="John Smith"
                    />
                    {validationErrors.ownerFullName && (
                      <p className="text-sm text-red-500">
                        {validationErrors.ownerFullName}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ownerNationality">Nationality</Label>
                    <Input
                      id="ownerNationality"
                      name="ownerNationality"
                      value={formData.ownerNationality}
                      onChange={handleInputChange}
                      placeholder="Thai, American, British, etc."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="ownerContactNumber">Contact Number</Label>
                    <Input
                      id="ownerContactNumber"
                      name="ownerContactNumber"
                      type="tel"
                      value={formData.ownerContactNumber}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      required
                      placeholder="+66 81 234 5678"
                    />
                    {validationErrors.ownerContactNumber && (
                      <p className="text-sm text-red-500">
                        {validationErrors.ownerContactNumber}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ownerEmail">Email Address</Label>
                    <Input
                      id="ownerEmail"
                      name="ownerEmail"
                      type="email"
                      value={formData.ownerEmail}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      required
                      placeholder="john@example.com"
                    />
                    {validationErrors.ownerEmail && (
                      <p className="text-sm text-red-500">
                        {validationErrors.ownerEmail}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Preferred Contact Method
                    </label>
                    <select
                      name="preferredContactMethod"
                      value={formData.preferredContactMethod}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {contactMethodOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      ...
                    </label>
                    <textarea
                      name="bankDetails"
                      value={formData.bankDetails}
                      onChange={handleInputChange}
                      rows={3}
                      className="flex w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white placeholder:text-neutral-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="...."
                    />
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            {/* Property Details Section */}
            <CollapsibleSection
              title="Property Details"
              description="Comprehensive information about your villa"
              defaultOpen={true}
              required={true}
            >
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="propertyName">Property Name</Label>

                    <Input
                      id="propertyName"
                      name="propertyName"
                      value={formData.propertyName}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      required
                      placeholder="Villa Paradise"
                    />

                    {validationErrors.propertyName && (
                      <p className="text-sm text-red-500">
                        {validationErrors.propertyName}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="googleMapsUrl">Google Maps Pin URL</Label>

                    <Input
                      id="googleMapsUrl"
                      name="googleMapsUrl"
                      value={formData.googleMapsUrl}
                      onChange={handleInputChange}
                      placeholder="https://maps.google.com/..."
                    />

                    {validationErrors.googleMapsUrl && (
                      <p className="text-sm text-red-500">
                        {validationErrors.googleMapsUrl}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Full Address <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    name="propertyAddress"
                    value={formData.propertyAddress}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    required
                    rows={3}
                    className={`flex w-full rounded-lg border bg-neutral-900 px-4 py-3 text-sm text-white placeholder:text-neutral-400 transition-all duration-200 focus:outline-none focus:ring-2 ${
                      validationErrors.propertyAddress
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : 'border-neutral-700 focus:ring-primary-500 focus:border-primary-500'
                    }`}
                    placeholder="123/45 Moo 6, Choeng Thale, Thalang District, Phuket 83110"
                  />
                  {validationErrors.propertyAddress && (
                    <p className="text-sm text-red-400 font-medium mt-2">
                      {validationErrors.propertyAddress}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bedrooms">Bedrooms</Label>

                    <Input
                      id="bedrooms"
                      name="bedrooms"
                      type="number"
                      min="1"
                      value={formData.bedrooms}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      required
                      placeholder="4"
                    />

                    {validationErrors.bedrooms && (
                      <p className="text-sm text-red-500">
                        {validationErrors.bedrooms}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bathrooms">Bathrooms</Label>

                    <Input
                      id="bathrooms"
                      name="bathrooms"
                      type="number"
                      min="1"
                      step="0.5"
                      value={formData.bathrooms}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      required
                      placeholder="3"
                    />

                    {validationErrors.bathrooms && (
                      <p className="text-sm text-red-500">
                        {validationErrors.bathrooms}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="landSizeSqm">Land Size (sqm)</Label>

                    <Input
                      id="landSizeSqm"
                      name="landSizeSqm"
                      type="number"
                      value={formData.landSizeSqm}
                      onChange={handleInputChange}
                      placeholder="800"
                    />

                    {validationErrors.landSizeSqm && (
                      <p className="text-sm text-red-500">
                        {validationErrors.landSizeSqm}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="villaSizeSqm">Villa Size (sqm)</Label>

                    <Input
                      id="villaSizeSqm"
                      name="villaSizeSqm"
                      type="number"
                      value={formData.villaSizeSqm}
                      onChange={handleInputChange}
                      placeholder="400"
                    />

                    {validationErrors.villaSizeSqm && (
                      <p className="text-sm text-red-500">
                        {validationErrors.villaSizeSqm}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="yearBuilt">Year Built</Label>

                    <Input
                      id="yearBuilt"
                      name="yearBuilt"
                      type="number"
                      min="1900"
                      max={new Date().getFullYear()}
                      value={formData.yearBuilt}
                      onChange={handleInputChange}
                      placeholder="2020"
                    />

                    {validationErrors.yearBuilt && (
                      <p className="text-sm text-red-500">
                        {validationErrors.yearBuilt}
                      </p>
                    )}
                  </div>
                  <div></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FileUpload
                    label="Furniture & Appliances List"
                    onFileSelect={(files) =>
                      handleFileUpload('furnitureAppliances', files)
                    }
                    acceptedTypes={['image/*', '.pdf', '.doc', '.docx']}
                    maxFiles={3}
                  />
                  <FileUpload
                    label="Floor Plans"
                    onFileSelect={(files) =>
                      handleFileUpload('floorPlans', files)
                    }
                    acceptedTypes={['image/*', '.pdf']}
                    maxFiles={5}
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* Amenities Section */}
            <CollapsibleSection
              title="Amenities"
              description="Available facilities and features"
            >
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Checkbox
                    label="Swimming Pool"
                    checked={formData.hasPool}
                    onChange={(e) =>
                      handleCheckboxChange('hasPool', e.target.checked)
                    }
                  />
                  <Checkbox
                    label="Garden"
                    checked={formData.hasGarden}
                    onChange={(e) =>
                      handleCheckboxChange('hasGarden', e.target.checked)
                    }
                  />
                  <Checkbox
                    label="Air Conditioning"
                    checked={formData.hasAirConditioning}
                    onChange={(e) =>
                      handleCheckboxChange(
                        'hasAirConditioning',
                        e.target.checked
                      )
                    }
                  />
                  <Checkbox
                    label="Parking Available"
                    checked={formData.hasParking}
                    onChange={(e) =>
                      handleCheckboxChange('hasParking', e.target.checked)
                    }
                  />
                  <Checkbox
                    label="Laundry Facilities"
                    checked={formData.hasLaundry}
                    onChange={(e) =>
                      handleCheckboxChange('hasLaundry', e.target.checked)
                    }
                  />
                  <Checkbox
                    label="Backup Power (Generator/Solar)"
                    checked={formData.hasBackupPower}
                    onChange={(e) =>
                      handleCheckboxChange('hasBackupPower', e.target.checked)
                    }
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="internetProvider">Internet Provider</Label>

                    <Input
                      id="internetProvider"
                      name="internetProvider"
                      value={formData.internetProvider}
                      onChange={handleInputChange}
                      placeholder="AIS, True, 3BB, etc."
                    />

                    {validationErrors.internetProvider && (
                      <p className="text-sm text-red-500">
                        {validationErrors.internetProvider}
                      </p>
                    )}
                  </div>
                  <div></div>
                </div>
              </div>
            </CollapsibleSection>

            {/* Utilities Section */}
            <CollapsibleSection
              title="Utilities"
              description="Electricity, water, and internet details"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="electricityProvider">
                    Electricity Provider
                  </Label>

                  <Input
                    id="electricityProvider"
                    name="electricityProvider"
                    value={formData.electricityProvider}
                    onChange={handleInputChange}
                    placeholder="PEA, MEA, etc."
                  />

                  {validationErrors.electricityProvider && (
                    <p className="text-sm text-red-500">
                      {validationErrors.electricityProvider}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="waterSource">Water Source</Label>

                  <Input
                    id="waterSource"
                    name="waterSource"
                    value={formData.waterSource}
                    onChange={handleInputChange}
                    placeholder="Municipal, well, etc."
                  />

                  {validationErrors.waterSource && (
                    <p className="text-sm text-red-500">
                      {validationErrors.waterSource}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="internetPackage">
                    Internet Package/Speed
                  </Label>

                  <Input
                    id="internetPackage"
                    name="internetPackage"
                    value={formData.internetPackage}
                    onChange={handleInputChange}
                    placeholder="100 Mbps, Fiber, etc."
                  />

                  {validationErrors.internetPackage && (
                    <p className="text-sm text-red-500">
                      {validationErrors.internetPackage}
                    </p>
                  )}
                </div>
              </div>
            </CollapsibleSection>

            {/* Smart Electric System Section */}
            <CollapsibleSection
              title="Smart Electric System"
              description="Smart home and electrical automation details"
            >
              <div className="space-y-6">
                {/* Does property have smart electric system */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">
                      Does the property have a smart electric system?
                    </label>
                    <div className="flex items-center space-x-6">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="hasSmartElectricSystem"
                          value="true"
                          checked={formData.hasSmartElectricSystem === true}
                          onChange={() =>
                            handleCheckboxChange('hasSmartElectricSystem', true)
                          }
                          className="mr-2 h-4 w-4 text-primary-500 focus:ring-primary-500 border-neutral-600 bg-neutral-800"
                        />
                        <span className="text-sm text-white">Yes</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="hasSmartElectricSystem"
                          value="false"
                          checked={formData.hasSmartElectricSystem === false}
                          onChange={() =>
                            handleCheckboxChange(
                              'hasSmartElectricSystem',
                              false
                            )
                          }
                          className="mr-2 h-4 w-4 text-primary-500 focus:ring-primary-500 border-neutral-600 bg-neutral-800"
                        />
                        <span className="text-sm text-white">No</span>
                      </label>
                    </div>
                  </div>
                  <div></div>
                </div>

                {/* Show additional fields only if smart system exists */}
                {formData.hasSmartElectricSystem && (
                  <>
                    {/* Brand/System */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="smartSystemBrand">
                          What brand/system is installed?
                        </Label>

                        <Input
                          id="smartSystemBrand"
                          name="smartSystemBrand"
                          value={formData.smartSystemBrand}
                          onChange={handleInputChange}
                          placeholder="Philips Hue, Xiaomi, Google Home, etc."
                        />

                        {validationErrors.smartSystemBrand && (
                          <p className="text-sm text-red-500">
                            {validationErrors.smartSystemBrand}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smartSystemAppPlatform">
                          App/platform used for control
                        </Label>

                        <Input
                          id="smartSystemAppPlatform"
                          name="smartSystemAppPlatform"
                          value={formData.smartSystemAppPlatform}
                          onChange={handleInputChange}
                          placeholder="Mi Home, Google Home, Alexa, etc."
                        />

                        {validationErrors.smartSystemAppPlatform && (
                          <p className="text-sm text-red-500">
                            {validationErrors.smartSystemAppPlatform}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Devices controlled */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-3">
                        Which devices are controlled? (Select all that apply)
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[
                          'Lights',
                          'Ceiling Fans',
                          'Curtains/Blinds',
                          'Air Conditioning',
                        ].map((device) => (
                          <Checkbox
                            key={device}
                            label={device}
                            checked={formData.smartDevicesControlled.includes(
                              device
                            )}
                            onChange={(e) =>
                              handleMultiSelectChange(
                                'smartDevicesControlled',
                                device,
                                e.target.checked
                              )
                            }
                          />
                        ))}
                        <Checkbox
                          label="Other"
                          checked={formData.smartDevicesControlled.includes(
                            'Other'
                          )}
                          onChange={(e) =>
                            handleMultiSelectChange(
                              'smartDevicesControlled',
                              'Other',
                              e.target.checked
                            )
                          }
                        />
                      </div>
                      {formData.smartDevicesControlled.includes('Other') && (
                        <div className="mt-3">
                          <div className="space-y-2">
                            <Label htmlFor="smartDevicesOther">
                              Other devices (specify)
                            </Label>

                            <Input
                              id="smartDevicesOther"
                              name="smartDevicesOther"
                              value={formData.smartDevicesOther}
                              onChange={handleInputChange}
                              placeholder="Security cameras, door locks, etc."
                            />

                            {validationErrors.smartDevicesOther && (
                              <p className="text-sm text-red-500">
                                {validationErrors.smartDevicesOther}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Manual control and Wi-Fi settings */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-white mb-3">
                          Can devices be controlled manually if Wi-Fi is down?
                        </label>
                        <div className="flex items-center space-x-6">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="canControlManuallyWifiDown"
                              value="true"
                              checked={
                                formData.canControlManuallyWifiDown === true
                              }
                              onChange={() =>
                                handleCheckboxChange(
                                  'canControlManuallyWifiDown',
                                  true
                                )
                              }
                              className="mr-2 h-4 w-4 text-primary-500 focus:ring-primary-500 border-neutral-600 bg-neutral-800"
                            />
                            <span className="text-sm text-white">Yes</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="canControlManuallyWifiDown"
                              value="false"
                              checked={
                                formData.canControlManuallyWifiDown === false
                              }
                              onChange={() =>
                                handleCheckboxChange(
                                  'canControlManuallyWifiDown',
                                  false
                                )
                              }
                              className="mr-2 h-4 w-4 text-primary-500 focus:ring-primary-500 border-neutral-600 bg-neutral-800"
                            />
                            <span className="text-sm text-white">No</span>
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white mb-3">
                          Is the system linked to property Wi-Fi?
                        </label>
                        <div className="flex items-center space-x-6">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="linkedToPropertyWifi"
                              value="true"
                              checked={formData.linkedToPropertyWifi === true}
                              onChange={() =>
                                handleCheckboxChange(
                                  'linkedToPropertyWifi',
                                  true
                                )
                              }
                              className="mr-2 h-4 w-4 text-primary-500 focus:ring-primary-500 border-neutral-600 bg-neutral-800"
                            />
                            <span className="text-sm text-white">Yes</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="linkedToPropertyWifi"
                              value="false"
                              checked={formData.linkedToPropertyWifi === false}
                              onChange={() =>
                                handleCheckboxChange(
                                  'linkedToPropertyWifi',
                                  false
                                )
                              }
                              className="mr-2 h-4 w-4 text-primary-500 focus:ring-primary-500 border-neutral-600 bg-neutral-800"
                            />
                            <span className="text-sm text-white">No</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Hub/Gateway */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-3">
                        Is there a hub/gateway device?
                      </label>
                      <div className="flex items-center space-x-6 mb-3">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="hasHubGateway"
                            value="true"
                            checked={formData.hasHubGateway === true}
                            onChange={() =>
                              handleCheckboxChange('hasHubGateway', true)
                            }
                            className="mr-2 h-4 w-4 text-primary-500 focus:ring-primary-500 border-neutral-600 bg-neutral-800"
                          />
                          <span className="text-sm text-white">Yes</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="hasHubGateway"
                            value="false"
                            checked={formData.hasHubGateway === false}
                            onChange={() =>
                              handleCheckboxChange('hasHubGateway', false)
                            }
                            className="mr-2 h-4 w-4 text-primary-500 focus:ring-primary-500 border-neutral-600 bg-neutral-800"
                          />
                          <span className="text-sm text-white">No</span>
                        </label>
                      </div>
                      {formData.hasHubGateway && (
                        <div className="space-y-2">
                          <Label htmlFor="hubGatewayLocation">
                            Hub/Gateway location
                          </Label>

                          <Input
                            id="hubGatewayLocation"
                            name="hubGatewayLocation"
                            value={formData.hubGatewayLocation}
                            onChange={handleInputChange}
                            placeholder="Living room, master bedroom, etc."
                          />

                          {validationErrors.hubGatewayLocation && (
                            <p className="text-sm text-red-500">
                              {validationErrors.hubGatewayLocation}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Control account owner */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-3">
                        Who owns the control account?
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
                        {['Owner', 'Property Management', 'Other'].map(
                          (owner) => (
                            <label key={owner} className="flex items-center">
                              <input
                                type="radio"
                                name="controlAccountOwner"
                                value={owner}
                                checked={formData.controlAccountOwner === owner}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    controlAccountOwner: e.target.value,
                                  }))
                                }
                                className="mr-2 h-4 w-4 text-primary-500 focus:ring-primary-500 border-neutral-600 bg-neutral-800"
                              />
                              <span className="text-sm text-white">
                                {owner}
                              </span>
                            </label>
                          )
                        )}
                      </div>
                      {formData.controlAccountOwner === 'Other' && (
                        <div className="space-y-2">
                          <Label htmlFor="controlAccountOwnerOther">
                            Other account owner (specify)
                          </Label>

                          <Input
                            id="controlAccountOwnerOther"
                            name="controlAccountOwnerOther"
                            value={formData.controlAccountOwnerOther}
                            onChange={handleInputChange}
                            placeholder="Maintenance company, previous owner, etc."
                          />

                          {validationErrors.controlAccountOwnerOther && (
                            <p className="text-sm text-red-500">
                              {validationErrors.controlAccountOwnerOther}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Login credentials */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-3">
                        Are login credentials provided for management access?
                      </label>
                      <div className="flex items-center space-x-6 mb-3">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="loginCredentialsProvided"
                            value="true"
                            checked={formData.loginCredentialsProvided === true}
                            onChange={() =>
                              handleCheckboxChange(
                                'loginCredentialsProvided',
                                true
                              )
                            }
                            className="mr-2 h-4 w-4 text-primary-500 focus:ring-primary-500 border-neutral-600 bg-neutral-800"
                          />
                          <span className="text-sm text-white">Yes</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="loginCredentialsProvided"
                            value="false"
                            checked={
                              formData.loginCredentialsProvided === false
                            }
                            onChange={() =>
                              handleCheckboxChange(
                                'loginCredentialsProvided',
                                false
                              )
                            }
                            className="mr-2 h-4 w-4 text-primary-500 focus:ring-primary-500 border-neutral-600 bg-neutral-800"
                          />
                          <span className="text-sm text-white">No</span>
                        </label>
                      </div>
                      {formData.loginCredentialsProvided && (
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">
                            Login credentials details
                          </label>
                          <textarea
                            name="loginCredentialsDetails"
                            value={formData.loginCredentialsDetails}
                            onChange={handleInputChange}
                            rows={3}
                            className="flex w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white placeholder:text-neutral-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Username, password, account details, etc."
                          />
                        </div>
                      )}
                    </div>

                    {/* Schedules and automations */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-3">
                        Are there active schedules or automations?
                      </label>
                      <div className="flex items-center space-x-6 mb-3">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="hasActiveSchedulesAutomations"
                            value="true"
                            checked={
                              formData.hasActiveSchedulesAutomations === true
                            }
                            onChange={() =>
                              handleCheckboxChange(
                                'hasActiveSchedulesAutomations',
                                true
                              )
                            }
                            className="mr-2 h-4 w-4 text-primary-500 focus:ring-primary-500 border-neutral-600 bg-neutral-800"
                          />
                          <span className="text-sm text-white">Yes</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="hasActiveSchedulesAutomations"
                            value="false"
                            checked={
                              formData.hasActiveSchedulesAutomations === false
                            }
                            onChange={() =>
                              handleCheckboxChange(
                                'hasActiveSchedulesAutomations',
                                false
                              )
                            }
                            className="mr-2 h-4 w-4 text-primary-500 focus:ring-primary-500 border-neutral-600 bg-neutral-800"
                          />
                          <span className="text-sm text-white">No</span>
                        </label>
                      </div>
                      {formData.hasActiveSchedulesAutomations && (
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">
                            Schedule/automation details
                          </label>
                          <textarea
                            name="schedulesAutomationsDetails"
                            value={formData.schedulesAutomationsDetails}
                            onChange={handleInputChange}
                            rows={3}
                            className="flex w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white placeholder:text-neutral-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Pool lights at 6 PM, AC on at 2 PM, etc."
                          />
                        </div>
                      )}
                    </div>

                    {/* Special instructions */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Special instructions, troubleshooting tips, or issues to
                        note
                      </label>
                      <textarea
                        name="smartSystemSpecialInstructions"
                        value={formData.smartSystemSpecialInstructions}
                        onChange={handleInputChange}
                        rows={4}
                        className="flex w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white placeholder:text-neutral-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Reset instructions, common issues, device locations, etc."
                      />
                    </div>
                  </>
                )}
              </div>
            </CollapsibleSection>

            {/* Rental & Marketing Section */}
            <CollapsibleSection
              title="Rental & Marketing"
              description="Current rental information and marketing details"
            >
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Current Rental Rates
                  </label>
                  <textarea
                    name="rentalRates"
                    value={formData.rentalRates}
                    onChange={handleInputChange}
                    rows={3}
                    className="flex w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white placeholder:text-neutral-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Night: ฿8,000, Week: ฿50,000, Month: ฿180,000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    Platforms Currently Listed
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {platformOptions.map((platform) => (
                      <Checkbox
                        key={platform}
                        label={platform}
                        checked={formData.platformsListed.includes(platform)}
                        onChange={(e) =>
                          handleMultiSelectChange(
                            'platformsListed',
                            platform,
                            e.target.checked
                          )
                        }
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="averageOccupancyRate">
                      Average Occupancy Rate (%)
                    </Label>

                    <Input
                      id="averageOccupancyRate"
                      name="averageOccupancyRate"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.averageOccupancyRate}
                      onChange={handleInputChange}
                      placeholder="75"
                    />

                    {validationErrors.averageOccupancyRate && (
                      <p className="text-sm text-red-500">
                        {validationErrors.averageOccupancyRate}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minimumStayRequirements">
                      Minimum Stay Requirements
                    </Label>

                    <Input
                      id="minimumStayRequirements"
                      name="minimumStayRequirements"
                      value={formData.minimumStayRequirements}
                      onChange={handleInputChange}
                      placeholder="3 nights minimum"
                    />

                    {validationErrors.minimumStayRequirements && (
                      <p className="text-sm text-red-500">
                        {validationErrors.minimumStayRequirements}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="targetGuests">Target Guests</Label>

                    <Input
                      id="targetGuests"
                      name="targetGuests"
                      value={formData.targetGuests}
                      onChange={handleInputChange}
                      placeholder="Families, couples, business travelers"
                    />

                    {validationErrors.targetGuests && (
                      <p className="text-sm text-red-500">
                        {validationErrors.targetGuests}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Owner Use Blackout Dates
                    </label>
                    <textarea
                      name="ownerBlackoutDates"
                      value={formData.ownerBlackoutDates}
                      onChange={handleInputChange}
                      rows={2}
                      className="flex w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white placeholder:text-neutral-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Dec 20-Jan 5, Easter week, etc."
                    />
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            {/* Preferences & Rules Section */}
            <CollapsibleSection
              title="Preferences & Rules"
              description="House rules and management preferences"
            >
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <Checkbox
                    label="Pets Allowed"
                    checked={formData.petsAllowed}
                    onChange={(e) =>
                      handleCheckboxChange('petsAllowed', e.target.checked)
                    }
                  />
                  <Checkbox
                    label="Parties Allowed"
                    checked={formData.partiesAllowed}
                    onChange={(e) =>
                      handleCheckboxChange('partiesAllowed', e.target.checked)
                    }
                  />
                  <Checkbox
                    label="Smoking Allowed"
                    checked={formData.smokingAllowed}
                    onChange={(e) =>
                      handleCheckboxChange('smokingAllowed', e.target.checked)
                    }
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="maintenanceAutoApprovalLimit">
                      Maintenance Auto-Approval Limit (THB)
                    </Label>

                    <Input
                      id="maintenanceAutoApprovalLimit"
                      name="maintenanceAutoApprovalLimit"
                      type="number"
                      value={formData.maintenanceAutoApprovalLimit}
                      onChange={handleInputChange}
                      placeholder="5000"
                    />
                    <p className="text-sm text-neutral-400 mt-1">
                      Amount we can spend on maintenance without prior approval
                    </p>

                    {validationErrors.maintenanceAutoApprovalLimit && (
                      <p className="text-sm text-red-500">
                        {validationErrors.maintenanceAutoApprovalLimit}
                      </p>
                    )}
                  </div>
                  <div></div>
                </div>
              </div>
            </CollapsibleSection>

            {/* Current Condition Section */}
            <CollapsibleSection
              title="Current Condition"
              description="Maintenance and service information"
            >
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Repairs/Issues Needing Attention
                  </label>
                  <textarea
                    name="repairsNeeded"
                    value={formData.repairsNeeded}
                    onChange={handleInputChange}
                    rows={3}
                    className="flex w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white placeholder:text-neutral-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Any current issues, planned repairs, or maintenance needed..."
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* Photos & Media Section */}
            <CollapsibleSection
              title="Photos & Media"
              description="Current marketing materials and villa photo uploads"
            >
              <div className="space-y-6">
                {/* Villa Photo Upload */}
                <div>
                  <h4 className="text-lg font-medium text-white mb-4">
                    Villa Photo Upload
                  </h4>
                  <VillaPhotoUploadCloudinary
                    userId={user?.id || 'anonymous'}
                    villaId={
                      formData.propertyName
                        ? formData.propertyName.replace(/[^a-zA-Z0-9-_]/g, '_')
                        : undefined
                    }
                    disabled={loading}
                    onPhotosChange={setUploadedPhotoUrls}
                  />
                </div>

                {/* Existing Photo Status Questions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Professional Photos Available?
                    </label>
                    <select
                      name="professionalPhotosStatus"
                      value={formData.professionalPhotosStatus}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {photosStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Checkbox
                    label="Floor Plan Images Available"
                    checked={formData.floorPlanImagesAvailable}
                    onChange={(e) =>
                      handleCheckboxChange(
                        'floorPlanImagesAvailable',
                        e.target.checked
                      )
                    }
                  />
                  <Checkbox
                    label="Video Walk-through Available"
                    checked={formData.videoWalkthroughAvailable}
                    onChange={(e) =>
                      handleCheckboxChange(
                        'videoWalkthroughAvailable',
                        e.target.checked
                      )
                    }
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* Emergency Contact Section */}
            <CollapsibleSection
              title="Emergency Contact"
              description="Local emergency contact information"
              required={true}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactName">
                    Emergency Contact Name
                  </Label>

                  <Input
                    id="emergencyContactName"
                    name="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    required
                    placeholder="Local contact person"
                  />

                  {validationErrors.emergencyContactName && (
                    <p className="text-sm text-red-500">
                      {validationErrors.emergencyContactName}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactPhone">
                    Emergency Contact Phone
                  </Label>

                  <Input
                    id="emergencyContactPhone"
                    name="emergencyContactPhone"
                    type="tel"
                    value={formData.emergencyContactPhone}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    required
                    placeholder="+66 81 234 5678"
                  />

                  {validationErrors.emergencyContactPhone && (
                    <p className="text-sm text-red-500">
                      {validationErrors.emergencyContactPhone}
                    </p>
                  )}
                </div>
              </div>
            </CollapsibleSection>

            {/* Confirmation Section */}
            <CollapsibleSection
              title="Confirmation"
              description="Final confirmation and submission"
              defaultOpen={true}
              required={true}
            >
              <div className="space-y-8">
                <Checkbox
                  name="informationConfirmed"
                  label={
                    isEditing
                      ? 'I confirm that the updated information is accurate and authorize the changes to be processed.'
                      : 'I confirm that the above information is accurate and authorize Sia Moon Property Management to start onboarding.'
                  }
                  description={
                    isEditing
                      ? 'By checking this box, you confirm that all updated information is accurate and complete, and you authorize the changes to be processed.'
                      : 'By checking this box, you confirm that all provided information is accurate and complete, and you authorize Sia Moon Property Management to begin the villa onboarding process.'
                  }
                  checked={formData.informationConfirmed}
                  onChange={(e) =>
                    handleCheckboxChange(
                      'informationConfirmed',
                      e.target.checked
                    )
                  }
                  required
                  error={validationErrors.informationConfirmed}
                />

                {error && (
                  <div className="flex items-center space-x-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-lg">
                    <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                    <p className="text-sm text-red-400 font-medium">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-12 text-base font-medium w-full"
                  size="lg"
                >
                  {loading ? (
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>
                        {isEditing
                          ? 'Updating Villa Information...'
                          : 'Submitting Villa Information...'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <Upload className="h-5 w-5" />
                      <span>
                        {isEditing
                          ? 'Update Villa Information'
                          : 'Submit Villa Onboarding Survey'}
                      </span>
                    </div>
                  )}
                </Button>
              </div>
            </CollapsibleSection>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function OnboardYourVilla() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OnboardYourVillaContent />
    </Suspense>
  )
}
