'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Checkbox } from '@/components/ui/Checkbox'
import { FileUpload } from '@/components/ui/FileUpload'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { CollapsibleSection } from '@/components/ui/CollapsibleSection'
import { createClient } from '@/lib/supabase/client'
import { validateVillaOnboarding, validateField } from '@/lib/validations/villa-onboarding'
import { Building, CheckCircle, ArrowLeft, Upload } from 'lucide-react'
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
  lastSepticService: string
  pestControlSchedule: string

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

export default function OnboardYourVilla() {
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
    lastSepticService: '',
    pestControlSchedule: '',

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

  const [uploadedFiles, setUploadedFiles] = useState<{[key: string]: File[]}>({
    furnitureAppliances: [],
    floorPlans: [],
    titleDeed: [],
    houseRegistration: [],
    insurancePolicy: [],
    licenses: []
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({})
  const router = useRouter()

  // Only initialize Supabase if not in bypass mode and env vars are available
  const supabase = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true' ? null : (() => {
    try {
      return createClient()
    } catch (error) {
      console.warn('Supabase not configured, running in development mode')
      return null
    }
  })()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    const newValue = type === 'checkbox' ? checked : value

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }))

    // Real-time validation with Zod
    const validation = validateField(name, newValue)
    if (!validation.isValid && validation.error) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: validation.error!
      }))
    } else {
      // Clear validation error when field becomes valid
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }))
  }

  const handleMultiSelectChange = (name: string, value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
        ? [...(prev[name as keyof VillaOnboardingData] as string[]), value]
        : (prev[name as keyof VillaOnboardingData] as string[]).filter(item => item !== value)
    }))
  }

  const handleFileUpload = (category: string, files: FileList | null) => {
    if (files) {
      setUploadedFiles(prev => ({
        ...prev,
        [category]: Array.from(files)
      }))
    }
  }

  const validateForm = () => {
    const validation = validateVillaOnboarding(formData)

    if (!validation.success && validation.errors) {
      setValidationErrors(validation.errors)

      // Show toast for validation errors
      const errorCount = Object.keys(validation.errors).length
      toast.error(`Please fix ${errorCount} validation error${errorCount > 1 ? 's' : ''} before submitting`)

      return false
    }

    setValidationErrors({})
    return true
  }

  const uploadFilesToSupabase = async () => {
    const uploadedUrls: {[key: string]: string} = {}
    const filesToUpload = Object.entries(uploadedFiles).filter(([, files]) => files.length > 0)

    if (filesToUpload.length === 0) {
      return uploadedUrls
    }

    // If Supabase is not available (development mode), simulate file uploads
    if (!supabase) {
      for (let i = 0; i < filesToUpload.length; i++) {
        const [category, files] = filesToUpload[i]!
        const file = files[0]
        // Simulate upload with a fake URL
        uploadedUrls[category] = `https://example.com/uploads/${Date.now()}-${category}-${file.name}`
        toast.success(`Simulated upload: ${category} (${i + 1}/${filesToUpload.length})`)
      }
      return uploadedUrls
    }

    for (let i = 0; i < filesToUpload.length; i++) {
      const [category, files] = filesToUpload[i]!
      const file = files[0] // For now, take the first file
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${category}.${fileExt}`
      const filePath = `villa-documents/${fileName}`

      try {
        const { error } = await supabase.storage
          .from('villa-documents')
          .upload(filePath, file)

        if (error) throw error

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('villa-documents')
          .getPublicUrl(filePath)

        uploadedUrls[category] = publicUrl

        // Show progress
        toast.success(`Uploaded ${category} successfully (${i + 1}/${filesToUpload.length})`)
      } catch (error) {
        console.error(`Error uploading ${category}:`, error)
        toast.error(`Failed to upload ${category}: ${error}`)
      }
    }

    return uploadedUrls
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      setError('Please fill in all required fields correctly')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Upload files first
      const uploadedUrls = await uploadFilesToSupabase()

      // Prepare data for insertion
      const villaData = {
        // Owner Details
        owner_full_name: formData.ownerFullName,
        owner_nationality: formData.ownerNationality,
        owner_contact_number: formData.ownerContactNumber,
        owner_email: formData.ownerEmail,
        preferred_contact_method: formData.preferredContactMethod || null,
        bank_details: formData.bankDetails || null,

        // Property Details
        property_name: formData.propertyName,
        property_address: formData.propertyAddress,
        google_maps_url: formData.googleMapsUrl || null,
        bedrooms: formData.bedrooms ? Number(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? Number(formData.bathrooms) : null,
        land_size_sqm: formData.landSizeSqm ? Number(formData.landSizeSqm) : null,
        villa_size_sqm: formData.villaSizeSqm ? Number(formData.villaSizeSqm) : null,
        year_built: formData.yearBuilt ? Number(formData.yearBuilt) : null,

        // Amenities
        has_pool: formData.hasPool,
        has_garden: formData.hasGarden,
        has_air_conditioning: formData.hasAirConditioning,
        internet_provider: formData.internetProvider || null,
        has_parking: formData.hasParking,
        has_laundry: formData.hasLaundry,
        has_backup_power: formData.hasBackupPower,

        // Access & Staff
        access_details: formData.accessDetails || null,
        has_smart_lock: formData.hasSmartLock,
        gate_remote_details: formData.gateRemoteDetails || null,
        onsite_staff: formData.onsiteStaff || null,

        // Utilities
        electricity_provider: formData.electricityProvider || null,
        water_source: formData.waterSource || null,
        internet_package: formData.internetPackage || null,

        // Rental & Marketing
        rental_rates: formData.rentalRates || null,
        platforms_listed: formData.platformsListed,
        average_occupancy_rate: formData.averageOccupancyRate ? Number(formData.averageOccupancyRate) : null,
        minimum_stay_requirements: formData.minimumStayRequirements || null,
        target_guests: formData.targetGuests || null,
        owner_blackout_dates: formData.ownerBlackoutDates || null,

        // Preferences & Rules
        pets_allowed: formData.petsAllowed,
        parties_allowed: formData.partiesAllowed,
        smoking_allowed: formData.smokingAllowed,
        maintenance_auto_approval_limit: formData.maintenanceAutoApprovalLimit ? Number(formData.maintenanceAutoApprovalLimit) : null,

        // Current Condition
        repairs_needed: formData.repairsNeeded || null,
        last_septic_service: formData.lastSepticService || null,
        pest_control_schedule: formData.pestControlSchedule || null,

        // Photos & Media
        professional_photos_status: formData.professionalPhotosStatus || null,
        floor_plan_images_available: formData.floorPlanImagesAvailable,
        video_walkthrough_available: formData.videoWalkthroughAvailable,

        // Emergency Contact
        emergency_contact_name: formData.emergencyContactName,
        emergency_contact_phone: formData.emergencyContactPhone,

        // File URLs
        furniture_appliances_list_url: uploadedUrls.furnitureAppliances || null,
        floor_plans_url: uploadedUrls.floorPlans || null,
        title_deed_url: uploadedUrls.titleDeed || null,
        house_registration_url: uploadedUrls.houseRegistration || null,
        insurance_policy_url: uploadedUrls.insurancePolicy || null,
        licenses_url: uploadedUrls.licenses || null,

        // Confirmation
        information_confirmed: formData.informationConfirmed,
        status: 'pending'
      }

      // Insert villa onboarding data
      if (supabase) {
        const { error } = await supabase
          .from('villa_onboarding')
          .insert([villaData])
          .select()

        if (error) {
          throw error
        }
      } else {
        // Development mode - simulate database insertion
        console.log('Development mode: Villa data would be inserted:', villaData)
        toast.success('Development mode: Villa submission simulated successfully!')
      }

      setSubmitted(true)
    } catch (err: unknown) {
      console.error('Submission error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error submitting villa information. Please try again.'
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
    { value: 'email', label: 'Email' }
  ]

  const photosStatusOptions = [
    { value: 'available', label: 'Available' },
    { value: 'not_available', label: 'Not Available' },
    { value: 'need_photos', label: 'Need Photos Taken' }
  ]

  const platformOptions = [
    'Airbnb', 'Booking.com', 'Agoda', 'Expedia', 'VRBO', 'Direct Booking', 'Other'
  ]

  if (submitted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6">
        <Card className="w-full max-w-lg text-center group hover:shadow-xl transition-all duration-200">
          <CardHeader className="pb-6">
            <div className="mx-auto w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-semibold text-white">Villa Submitted Successfully!</CardTitle>
            <CardDescription className="text-neutral-400 mt-3">
              Thank you for choosing Sia Moon Property Management. We'll review your comprehensive villa information and contact you within 24-48 hours to discuss next steps.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="p-6 bg-emerald-950/20 border border-emerald-800/30 rounded-lg text-left">
                <h4 className="font-semibold text-emerald-100 mb-3">What happens next?</h4>
                <ul className="text-sm text-emerald-200 space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"></div>
                    Our team will review your submission
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"></div>
                    We'll schedule a property visit
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"></div>
                    You'll receive a management proposal
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"></div>
                    We'll begin onboarding your villa
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <Button onClick={() => router.push('/')} fullWidth className="h-11">
                  Return to Home
                </Button>
                <Button variant="outline" onClick={() => setSubmitted(false)} fullWidth className="h-11">
                  Submit Another Villa
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Back to home link - Augment dark style */}
      <div className="absolute top-6 left-6 z-10">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-neutral-400 hover:text-white transition-colors duration-150"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </div>

      <div className="px-6 py-16 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header - Augment dark design */}
          <div className="text-center mb-12">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center mb-6">
              <Building className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">
              Villa Owner Onboarding
            </h1>
            <p className="mt-4 text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
              Please provide comprehensive information about your villa and preferences. This detailed survey helps us deliver the best property management service tailored to your needs.
            </p>
          </div>

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
                  <Input
                    label="Full Name"
                    name="ownerFullName"
                    value={formData.ownerFullName}
                    onChange={handleInputChange}
                    required
                    placeholder="John Smith"
                    error={validationErrors.ownerFullName}
                  />
                  <Input
                    label="Nationality"
                    name="ownerNationality"
                    value={formData.ownerNationality}
                    onChange={handleInputChange}
                    placeholder="Thai, American, British, etc."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Input
                    label="Contact Number"
                    name="ownerContactNumber"
                    type="tel"
                    value={formData.ownerContactNumber}
                    onChange={handleInputChange}
                    required
                    placeholder="+66 81 234 5678"
                    error={validationErrors.ownerContactNumber}
                  />
                  <Input
                    label="Email Address"
                    name="ownerEmail"
                    type="email"
                    value={formData.ownerEmail}
                    onChange={handleInputChange}
                    required
                    placeholder="john@example.com"
                    error={validationErrors.ownerEmail}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Select
                    label="Preferred Contact Method"
                    name="preferredContactMethod"
                    value={formData.preferredContactMethod}
                    onChange={handleInputChange}
                    options={contactMethodOptions}
                  />
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Bank Details for Payouts
                    </label>
                    <textarea
                      name="bankDetails"
                      value={formData.bankDetails}
                      onChange={handleInputChange}
                      rows={3}
                      className="flex w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white placeholder:text-neutral-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Bank name, account number, SWIFT code, etc."
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
                  <Input
                    label="Property Name"
                    name="propertyName"
                    value={formData.propertyName}
                    onChange={handleInputChange}
                    required
                    placeholder="Villa Paradise"
                    error={validationErrors.propertyName}
                  />
                  <Input
                    label="Google Maps Pin URL"
                    name="googleMapsUrl"
                    value={formData.googleMapsUrl}
                    onChange={handleInputChange}
                    placeholder="https://maps.google.com/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Full Address <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    name="propertyAddress"
                    value={formData.propertyAddress}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="flex w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white placeholder:text-neutral-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="123/45 Moo 6, Choeng Thale, Thalang District, Phuket 83110"
                  />
                  {validationErrors.propertyAddress && (
                    <p className="text-sm text-red-400 font-medium mt-2">{validationErrors.propertyAddress}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Input
                    label="Bedrooms"
                    name="bedrooms"
                    type="number"
                    min="1"
                    value={formData.bedrooms}
                    onChange={handleInputChange}
                    required
                    placeholder="4"
                    error={validationErrors.bedrooms}
                  />
                  <Input
                    label="Bathrooms"
                    name="bathrooms"
                    type="number"
                    min="1"
                    step="0.5"
                    value={formData.bathrooms}
                    onChange={handleInputChange}
                    required
                    placeholder="3"
                    error={validationErrors.bathrooms}
                  />
                  <Input
                    label="Land Size (sqm)"
                    name="landSizeSqm"
                    type="number"
                    value={formData.landSizeSqm}
                    onChange={handleInputChange}
                    placeholder="800"
                  />
                  <Input
                    label="Villa Size (sqm)"
                    name="villaSizeSqm"
                    type="number"
                    value={formData.villaSizeSqm}
                    onChange={handleInputChange}
                    placeholder="400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Input
                    label="Year Built"
                    name="yearBuilt"
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={formData.yearBuilt}
                    onChange={handleInputChange}
                    placeholder="2020"
                  />
                  <div></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FileUpload
                    label="Furniture & Appliances List"
                    onFileSelect={(files) => handleFileUpload('furnitureAppliances', files)}
                    acceptedTypes={['image/*', '.pdf', '.doc', '.docx']}
                    maxFiles={3}
                  />
                  <FileUpload
                    label="Floor Plans"
                    onFileSelect={(files) => handleFileUpload('floorPlans', files)}
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
                    onChange={(e) => handleCheckboxChange('hasPool', e.target.checked)}
                  />
                  <Checkbox
                    label="Garden"
                    checked={formData.hasGarden}
                    onChange={(e) => handleCheckboxChange('hasGarden', e.target.checked)}
                  />
                  <Checkbox
                    label="Air Conditioning"
                    checked={formData.hasAirConditioning}
                    onChange={(e) => handleCheckboxChange('hasAirConditioning', e.target.checked)}
                  />
                  <Checkbox
                    label="Parking Available"
                    checked={formData.hasParking}
                    onChange={(e) => handleCheckboxChange('hasParking', e.target.checked)}
                  />
                  <Checkbox
                    label="Laundry Facilities"
                    checked={formData.hasLaundry}
                    onChange={(e) => handleCheckboxChange('hasLaundry', e.target.checked)}
                  />
                  <Checkbox
                    label="Backup Power (Generator/Solar)"
                    checked={formData.hasBackupPower}
                    onChange={(e) => handleCheckboxChange('hasBackupPower', e.target.checked)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Input
                    label="Internet Provider"
                    name="internetProvider"
                    value={formData.internetProvider}
                    onChange={handleInputChange}
                    placeholder="AIS, True, 3BB, etc."
                  />
                  <div></div>
                </div>
              </div>
            </CollapsibleSection>

            {/* Access & Staff Section */}
            <CollapsibleSection
              title="Access & Staff"
              description="Security and on-site personnel information"
            >
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Key or Access Codes
                  </label>
                  <textarea
                    name="accessDetails"
                    value={formData.accessDetails}
                    onChange={handleInputChange}
                    rows={3}
                    className="flex w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white placeholder:text-neutral-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Key location, access codes, entry instructions..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex items-center">
                    <Checkbox
                      label="Smart Lock Installed"
                      checked={formData.hasSmartLock}
                      onChange={(e) => handleCheckboxChange('hasSmartLock', e.target.checked)}
                    />
                  </div>
                  <Input
                    label="Gate Remote Details"
                    name="gateRemoteDetails"
                    value={formData.gateRemoteDetails}
                    onChange={handleInputChange}
                    placeholder="Remote location, frequency, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    On-site Staff
                  </label>
                  <textarea
                    name="onsiteStaff"
                    value={formData.onsiteStaff}
                    onChange={handleInputChange}
                    rows={3}
                    className="flex w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white placeholder:text-neutral-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Gardener, maid, pool cleaner, security, etc. Include names and contact details..."
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* Utilities Section */}
            <CollapsibleSection
              title="Utilities"
              description="Electricity, water, and internet details"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <Input
                  label="Electricity Provider"
                  name="electricityProvider"
                  value={formData.electricityProvider}
                  onChange={handleInputChange}
                  placeholder="PEA, MEA, etc."
                />
                <Input
                  label="Water Source"
                  name="waterSource"
                  value={formData.waterSource}
                  onChange={handleInputChange}
                  placeholder="Municipal, well, etc."
                />
                <Input
                  label="Internet Package/Speed"
                  name="internetPackage"
                  value={formData.internetPackage}
                  onChange={handleInputChange}
                  placeholder="100 Mbps, Fiber, etc."
                />
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
                        onChange={(e) => handleMultiSelectChange('platformsListed', platform, e.target.checked)}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Input
                    label="Average Occupancy Rate (%)"
                    name="averageOccupancyRate"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.averageOccupancyRate}
                    onChange={handleInputChange}
                    placeholder="75"
                  />
                  <Input
                    label="Minimum Stay Requirements"
                    name="minimumStayRequirements"
                    value={formData.minimumStayRequirements}
                    onChange={handleInputChange}
                    placeholder="3 nights minimum"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Input
                    label="Target Guests"
                    name="targetGuests"
                    value={formData.targetGuests}
                    onChange={handleInputChange}
                    placeholder="Families, couples, business travelers"
                  />
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
                    onChange={(e) => handleCheckboxChange('petsAllowed', e.target.checked)}
                  />
                  <Checkbox
                    label="Parties Allowed"
                    checked={formData.partiesAllowed}
                    onChange={(e) => handleCheckboxChange('partiesAllowed', e.target.checked)}
                  />
                  <Checkbox
                    label="Smoking Allowed"
                    checked={formData.smokingAllowed}
                    onChange={(e) => handleCheckboxChange('smokingAllowed', e.target.checked)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Input
                    label="Maintenance Auto-Approval Limit (THB)"
                    name="maintenanceAutoApprovalLimit"
                    type="number"
                    value={formData.maintenanceAutoApprovalLimit}
                    onChange={handleInputChange}
                    placeholder="5000"
                    helperText="Amount we can spend on maintenance without prior approval"
                  />
                  <div></div>
                </div>
              </div>
            </CollapsibleSection>

            {/* Legal Documents Section */}
            <CollapsibleSection
              title="Legal Documents"
              description="Required legal documentation"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <FileUpload
                  label="Title Deed/Chanote"
                  onFileSelect={(files) => handleFileUpload('titleDeed', files)}
                  acceptedTypes={['image/*', '.pdf']}
                  maxFiles={3}
                  required
                />
                <FileUpload
                  label="House Registration"
                  onFileSelect={(files) => handleFileUpload('houseRegistration', files)}
                  acceptedTypes={['image/*', '.pdf']}
                  maxFiles={3}
                />
                <FileUpload
                  label="Insurance Policy"
                  onFileSelect={(files) => handleFileUpload('insurancePolicy', files)}
                  acceptedTypes={['image/*', '.pdf']}
                  maxFiles={3}
                />
                <FileUpload
                  label="Licenses (Hotel, Pool, etc.)"
                  onFileSelect={(files) => handleFileUpload('licenses', files)}
                  acceptedTypes={['image/*', '.pdf']}
                  maxFiles={5}
                />
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Input
                    label="Last Septic Service Date"
                    name="lastSepticService"
                    type="date"
                    value={formData.lastSepticService}
                    onChange={handleInputChange}
                  />
                  <Input
                    label="Pest Control Schedule"
                    name="pestControlSchedule"
                    value={formData.pestControlSchedule}
                    onChange={handleInputChange}
                    placeholder="Monthly, quarterly, etc."
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* Photos & Media Section */}
            <CollapsibleSection
              title="Photos & Media"
              description="Current marketing materials availability"
            >
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Select
                    label="Professional Photos Available?"
                    name="professionalPhotosStatus"
                    value={formData.professionalPhotosStatus}
                    onChange={handleInputChange}
                    options={photosStatusOptions}
                  />
                  <div></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Checkbox
                    label="Floor Plan Images Available"
                    checked={formData.floorPlanImagesAvailable}
                    onChange={(e) => handleCheckboxChange('floorPlanImagesAvailable', e.target.checked)}
                  />
                  <Checkbox
                    label="Video Walk-through Available"
                    checked={formData.videoWalkthroughAvailable}
                    onChange={(e) => handleCheckboxChange('videoWalkthroughAvailable', e.target.checked)}
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
                <Input
                  label="Emergency Contact Name"
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleInputChange}
                  required
                  placeholder="Local contact person"
                  error={validationErrors.emergencyContactName}
                />
                <Input
                  label="Emergency Contact Phone"
                  name="emergencyContactPhone"
                  type="tel"
                  value={formData.emergencyContactPhone}
                  onChange={handleInputChange}
                  required
                  placeholder="+66 81 234 5678"
                  error={validationErrors.emergencyContactPhone}
                />
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
                  label="I confirm that the above information is accurate and authorize Sia Moon Property Management to start onboarding."
                  description="By checking this box, you confirm that all provided information is accurate and complete, and you authorize Sia Moon Property Management to begin the villa onboarding process."
                  checked={formData.informationConfirmed}
                  onChange={(e) => handleCheckboxChange('informationConfirmed', e.target.checked)}
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
                  fullWidth
                  disabled={loading || !formData.informationConfirmed}
                  className="h-12 text-base font-medium"
                  size="lg"
                >
                  {loading ? (
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Submitting Villa Information...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <Upload className="h-5 w-5" />
                      <span>Submit Villa Onboarding Survey</span>
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
