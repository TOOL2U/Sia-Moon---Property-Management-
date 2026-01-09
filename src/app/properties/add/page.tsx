'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/Card'
import GooglePlacesAutocomplete from '@/components/ui/GooglePlacesAutocomplete'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'
import { clientToast as toast } from '@/utils/clientToast'
import { 
  ArrowLeft, 
  ArrowRight,
  Building, 
  CheckCircle, 
  Home,
  MapPin,
  Users,
  DollarSign,
  Sparkles,
  Camera,
  Settings
} from 'lucide-react'
import Link from 'next/link'

// Wizard Steps
type WizardStep = 'basic' | 'details' | 'amenities' | 'pricing' | 'photos' | 'review'

interface PropertyFormData {
  // Basic Information
  name: string
  description: string
  address: string
  city: string
  country: string
  location?: any // Google Places location data
  
  // Property Details
  bedrooms: number
  bathrooms: number
  maxGuests: number
  
  // Amenities
  amenities: string[]
  hasPool: boolean
  hasGarden: boolean
  hasAirConditioning: boolean
  hasParking: boolean
  hasLaundry: boolean
  hasBackupPower: boolean
  
  // Pricing
  pricePerNight: number
  currency: string
  
  // Photos (placeholder for future implementation)
  photos: string[]
}

const initialFormData: PropertyFormData = {
  name: '',
  description: '',
  address: '',
  city: '',
  country: 'Thailand',
  bedrooms: 1,
  bathrooms: 1,
  maxGuests: 2,
  amenities: [],
  hasPool: false,
  hasGarden: false,
  hasAirConditioning: true,
  hasParking: false,
  hasLaundry: false,
  hasBackupPower: false,
  pricePerNight: 0,
  currency: 'THB',
  photos: []
}

const wizardSteps: { id: WizardStep; title: string; icon: React.ReactNode }[] = [
  { id: 'basic', title: 'Basic Info', icon: <Building className="h-5 w-5" /> },
  { id: 'details', title: 'Details', icon: <Home className="h-5 w-5" /> },
  { id: 'amenities', title: 'Amenities', icon: <Sparkles className="h-5 w-5" /> },
  { id: 'pricing', title: 'Pricing', icon: <DollarSign className="h-5 w-5" /> },
  { id: 'photos', title: 'Photos', icon: <Camera className="h-5 w-5" /> },
  { id: 'review', title: 'Review', icon: <CheckCircle className="h-5 w-5" /> },
]

const amenityOptions = [
  { id: 'wifi', label: 'WiFi', icon: '📶' },
  { id: 'kitchen', label: 'Kitchen', icon: '🍳' },
  { id: 'tv', label: 'Television', icon: '📺' },
  { id: 'washer', label: 'Washing Machine', icon: '🧺' },
  { id: 'dryer', label: 'Dryer', icon: '👕' },
  { id: 'iron', label: 'Iron', icon: '👔' },
  { id: 'hair_dryer', label: 'Hair Dryer', icon: '💇' },
  { id: 'hot_water', label: 'Hot Water', icon: '🚿' },
  { id: 'heating', label: 'Heating', icon: '🔥' },
  { id: 'balcony', label: 'Balcony', icon: '🌅' },
  { id: 'workspace', label: 'Workspace', icon: '💻' },
  { id: 'gym', label: 'Gym', icon: '🏋️' },
  { id: 'security', label: 'Security System', icon: '🔒' },
  { id: 'bbq', label: 'BBQ Grill', icon: '🔥' },
  { id: 'beach_access', label: 'Beach Access', icon: '🏖️' },
  { id: 'mountain_view', label: 'Mountain View', icon: '⛰️' },
]

export default function AddPropertyWizardPage() {
  const [currentStep, setCurrentStep] = useState<WizardStep>('basic')
  const [formData, setFormData] = useState<PropertyFormData>(initialFormData)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()
  const { user } = useAuth()
  const searchParams = useSearchParams()
  
  // Check if user came from admin back office
  const fromAdmin = searchParams.get('from') === 'admin'
  const redirectPath = fromAdmin ? '/admin/backoffice?section=properties' : '/properties'

  const currentStepIndex = wizardSteps.findIndex(step => step.id === currentStep)
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === wizardSteps.length - 1

  const updateFormData = (updates: Partial<PropertyFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
    // Clear related errors
    setErrors(prev => {
      const newErrors = { ...prev }
      Object.keys(updates).forEach(key => {
        delete newErrors[key]
      })
      return newErrors
    })
  }

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {}

    switch (currentStep) {
      case 'basic':
        if (!formData.name.trim()) newErrors.name = 'Property name is required'
        if (!formData.address.trim()) newErrors.address = 'Address is required'
        if (!formData.description.trim()) newErrors.description = 'Description is required'
        break
      case 'details':
        if (formData.bedrooms < 1) newErrors.bedrooms = 'At least 1 bedroom required'
        if (formData.bathrooms < 1) newErrors.bathrooms = 'At least 1 bathroom required'
        if (formData.maxGuests < 1) newErrors.maxGuests = 'At least 1 guest required'
        break
      case 'pricing':
        if (formData.pricePerNight <= 0) newErrors.pricePerNight = 'Price must be greater than 0'
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const goToNextStep = () => {
    if (!validateCurrentStep()) return

    if (isLastStep) {
      handleSubmit()
    } else {
      const nextStepIndex = currentStepIndex + 1
      setCurrentStep(wizardSteps[nextStepIndex].id)
    }
  }

  const goToPreviousStep = () => {
    if (!isFirstStep) {
      const prevStepIndex = currentStepIndex - 1
      setCurrentStep(wizardSteps[prevStepIndex].id)
    }
  }

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return

    setLoading(true)

    try {
      console.log('🔄 Creating property...')
      console.log('Form data:', formData)

      if (!user) {
        throw new Error('You must be logged in to create a property')
      }

      const response = await fetch('/api/admin/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userId: user.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create property')
      }

      const result = await response.json()

      if (result.success) {
        console.log('✅ Property created:', result.property)
        toast.success('Property created successfully!')
        setSubmitted(true)

        // Redirect to properties page after a short delay
        setTimeout(() => {
          router.push(redirectPath)
        }, 2000)
      } else {
        throw new Error(result.error || 'Failed to create property')
      }
    } catch (err: unknown) {
      console.error('Error creating property:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to create property'
      setErrors({ submit: errorMessage })
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center bg-neutral-950 border-neutral-800">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-white">
              Property Added Successfully!
            </CardTitle>
            <CardDescription className="text-neutral-400">
              Your property has been added to the system. You can now manage bookings and assign staff for this property.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={() => router.push(redirectPath)} className="w-full">
                {fromAdmin ? 'Back to Admin Dashboard' : 'View All Properties'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSubmitted(false)
                  setFormData(initialFormData)
                  setCurrentStep('basic')
                }}
                className="w-full"
              >
                Add Another Property
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Back to properties link */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
        <Link
          href="/properties"
          className="inline-flex items-center text-sm font-medium text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Properties
        </Link>
      </div>

      <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center mb-6">
              <Building className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-white sm:text-3xl">
              Add New Property
            </h1>
            <p className="mt-3 text-base text-neutral-400">
              Follow the steps below to add a property to your portfolio
            </p>
          </div>

          {/* Step Indicator */}
          <div className="mb-8">
            <div className="flex justify-center">
              <nav className="flex space-x-4 overflow-x-auto pb-2">
                {wizardSteps.map((step, index) => {
                  const isActive = step.id === currentStep
                  const isCompleted = index < currentStepIndex
                  const isDisabled = index > currentStepIndex + 1

                  return (
                    <button
                      key={step.id}
                      onClick={() => !isDisabled && setCurrentStep(step.id)}
                      disabled={isDisabled}
                      className={`
                        flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap
                        ${isActive 
                          ? 'bg-blue-600 text-white shadow-lg' 
                          : isCompleted 
                            ? 'bg-green-600 text-white' 
                            : isDisabled
                              ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                              : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                        }
                      `}
                    >
                      {step.icon}
                      <span>{step.title}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Form Card */}
          <Card className="group hover:shadow-xl transition-all duration-300 card-hover bg-neutral-950 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                {wizardSteps[currentStepIndex].icon}
                <span>{wizardSteps[currentStepIndex].title}</span>
              </CardTitle>
              <CardDescription className="text-neutral-400">
                Step {currentStepIndex + 1} of {wizardSteps.length}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Step Content */}
              {currentStep === 'basic' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Property Name *
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => updateFormData({ name: e.target.value })}
                      placeholder="e.g., Villa Paradise, Sunset Beach House"
                      error={!!errors.name}
                    />
                    {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-300">Description *</label>
                    <textarea
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={4}
                      value={formData.description}
                      onChange={(e) => updateFormData({ description: e.target.value })}
                      placeholder="Describe your property's unique features, location highlights, and what makes it special for guests..."
                    />
                    {errors.description && <p className="text-red-400 text-sm">{errors.description}</p>}
                  </div>

                  <GooglePlacesAutocomplete
                    label="Property Address *"
                    value={formData.address}
                    onChange={(value) => updateFormData({ address: value })}
                    onPlaceSelect={(placeResult) => {
                      console.log('Selected place:', placeResult)
                      const addressComponents = placeResult.addressComponents || []
                      const city = addressComponents.find((comp: any) => 
                        comp.types.includes('locality') || comp.types.includes('administrative_area_level_2')
                      )?.long_name || ''
                      
                      updateFormData({ 
                        address: placeResult.formattedAddress || formData.address,
                        city,
                        location: placeResult 
                      })
                    }}
                    placeholder="Start typing the property address..."
                    error={errors.address}
                    countryRestriction={['th']}
                    types={['address']}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">City</label>
                      <Input
                        value={formData.city}
                        onChange={(e) => updateFormData({ city: e.target.value })}
                        placeholder="Bangkok, Phuket, Koh Samui..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">Country</label>
                      <Input
                        value={formData.country}
                        onChange={(e) => updateFormData({ country: e.target.value })}
                        placeholder="Thailand"
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 'details' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-neutral-300 mb-2 block">
                        Bedrooms *
                      </label>
                      <div className="flex items-center space-x-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateFormData({ bedrooms: Math.max(1, formData.bedrooms - 1) })}
                          className="w-8 h-8 p-0"
                        >
                          -
                        </Button>
                        <span className="text-white font-medium w-8 text-center">{formData.bedrooms}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateFormData({ bedrooms: formData.bedrooms + 1 })}
                          className="w-8 h-8 p-0"
                        >
                          +
                        </Button>
                      </div>
                      {errors.bedrooms && <p className="text-red-400 text-sm mt-1">{errors.bedrooms}</p>}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-neutral-300 mb-2 block">
                        Bathrooms *
                      </label>
                      <div className="flex items-center space-x-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateFormData({ bathrooms: Math.max(1, formData.bathrooms - 1) })}
                          className="w-8 h-8 p-0"
                        >
                          -
                        </Button>
                        <span className="text-white font-medium w-8 text-center">{formData.bathrooms}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateFormData({ bathrooms: formData.bathrooms + 1 })}
                          className="w-8 h-8 p-0"
                        >
                          +
                        </Button>
                      </div>
                      {errors.bathrooms && <p className="text-red-400 text-sm mt-1">{errors.bathrooms}</p>}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-neutral-300 mb-2 block">
                        Max Guests *
                      </label>
                      <div className="flex items-center space-x-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateFormData({ maxGuests: Math.max(1, formData.maxGuests - 1) })}
                          className="w-8 h-8 p-0"
                        >
                          -
                        </Button>
                        <span className="text-white font-medium w-8 text-center">{formData.maxGuests}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateFormData({ maxGuests: formData.maxGuests + 1 })}
                          className="w-8 h-8 p-0"
                        >
                          +
                        </Button>
                      </div>
                      {errors.maxGuests && <p className="text-red-400 text-sm mt-1">{errors.maxGuests}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-white flex items-center space-x-2">
                        <Home className="h-5 w-5" />
                        <span>Essential Features</span>
                      </h3>
                      <div className="space-y-3">
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={formData.hasPool}
                            onChange={(e) => updateFormData({ hasPool: e.target.checked })}
                            className="w-4 h-4 text-blue-600 bg-neutral-700 border-neutral-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-neutral-300">Swimming Pool 🏊‍♂️</span>
                        </label>
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={formData.hasGarden}
                            onChange={(e) => updateFormData({ hasGarden: e.target.checked })}
                            className="w-4 h-4 text-blue-600 bg-neutral-700 border-neutral-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-neutral-300">Garden 🌿</span>
                        </label>
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={formData.hasAirConditioning}
                            onChange={(e) => updateFormData({ hasAirConditioning: e.target.checked })}
                            className="w-4 h-4 text-blue-600 bg-neutral-700 border-neutral-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-neutral-300">Air Conditioning ❄️</span>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-white flex items-center space-x-2">
                        <Settings className="h-5 w-5" />
                        <span>Additional Features</span>
                      </h3>
                      <div className="space-y-3">
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={formData.hasParking}
                            onChange={(e) => updateFormData({ hasParking: e.target.checked })}
                            className="w-4 h-4 text-blue-600 bg-neutral-700 border-neutral-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-neutral-300">Parking 🚗</span>
                        </label>
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={formData.hasLaundry}
                            onChange={(e) => updateFormData({ hasLaundry: e.target.checked })}
                            className="w-4 h-4 text-blue-600 bg-neutral-700 border-neutral-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-neutral-300">Laundry 🧺</span>
                        </label>
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={formData.hasBackupPower}
                            onChange={(e) => updateFormData({ hasBackupPower: e.target.checked })}
                            className="w-4 h-4 text-blue-600 bg-neutral-700 border-neutral-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-neutral-300">Backup Power ⚡</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 'amenities' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-4">Select Amenities</h3>
                    <p className="text-neutral-400 mb-6">Choose all amenities that your property offers to guests</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {amenityOptions.map((amenity) => {
                        const isSelected = formData.amenities.includes(amenity.id)
                        return (
                          <button
                            key={amenity.id}
                            type="button"
                            onClick={() => {
                              const newAmenities = isSelected
                                ? formData.amenities.filter(a => a !== amenity.id)
                                : [...formData.amenities, amenity.id]
                              updateFormData({ amenities: newAmenities })
                            }}
                            className={`
                              p-4 rounded-lg border text-left transition-all duration-200
                              ${isSelected
                                ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                                : 'border-neutral-700 bg-neutral-800 text-neutral-300 hover:border-neutral-600'
                              }
                            `}
                          >
                            <div className="text-2xl mb-2">{amenity.icon}</div>
                            <div className="text-sm font-medium">{amenity.label}</div>
                          </button>
                        )
                      })}
                    </div>

                    <div className="mt-6 p-4 bg-blue-950/20 border border-blue-800/30 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Sparkles className="h-5 w-5 text-blue-400 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-100">Amenity Tips</h4>
                          <p className="text-sm text-blue-200 mt-1">
                            Select all amenities that guests can use during their stay. More amenities typically lead to higher booking rates and guest satisfaction.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 'pricing' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">Price per Night *</label>
                      <Input
                        type="number"
                        value={formData.pricePerNight || ''}
                        onChange={(e) => updateFormData({ pricePerNight: parseFloat(e.target.value) || 0 })}
                        placeholder="0"
                        error={!!errors.pricePerNight}
                        min="0"
                        step="100"
                      />
                      {errors.pricePerNight && <p className="text-red-400 text-sm mt-1">{errors.pricePerNight}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-300 mb-2 block">Currency</label>
                      <select
                        value={formData.currency}
                        onChange={(e) => updateFormData({ currency: e.target.value })}
                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="THB">THB (Thai Baht)</option>
                        <option value="USD">USD (US Dollar)</option>
                        <option value="EUR">EUR (Euro)</option>
                        <option value="GBP">GBP (British Pound)</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-4 bg-green-950/20 border border-green-800/30 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <DollarSign className="h-5 w-5 text-green-400 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-green-100">Pricing Strategy</h4>
                        <p className="text-sm text-green-200 mt-1">
                          Consider seasonal demand, local competition, and your property's unique features when setting the price. You can always adjust pricing later based on market response.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 'photos' && (
                <div className="space-y-6">
                  <div className="text-center p-8 border-2 border-dashed border-neutral-700 rounded-lg">
                    <Camera className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">Photo Upload (Coming Soon)</h3>
                    <p className="text-neutral-400 mb-4">
                      Photo upload functionality will be available in the next update. For now, you can add photos after creating the property.
                    </p>
                    <div className="text-sm text-neutral-500">
                      <p>• High-quality photos increase booking rates by 40%</p>
                      <p>• Include exterior, interior, and amenity photos</p>
                      <p>• Recommended: 5-10 professional photos</p>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 'review' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-4">Review Your Property</h3>
                    <p className="text-neutral-400 mb-6">Please review all the information before creating your property</p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-neutral-800 rounded-lg">
                      <h4 className="font-medium text-white mb-2">Basic Information</h4>
                      <div className="text-sm text-neutral-300 space-y-1">
                        <p><span className="text-neutral-400">Name:</span> {formData.name}</p>
                        <p><span className="text-neutral-400">Address:</span> {formData.address}</p>
                        <p><span className="text-neutral-400">City:</span> {formData.city}</p>
                        <p><span className="text-neutral-400">Description:</span> {formData.description}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-neutral-800 rounded-lg">
                      <h4 className="font-medium text-white mb-2">Property Details</h4>
                      <div className="text-sm text-neutral-300 space-y-1">
                        <p><span className="text-neutral-400">Bedrooms:</span> {formData.bedrooms}</p>
                        <p><span className="text-neutral-400">Bathrooms:</span> {formData.bathrooms}</p>
                        <p><span className="text-neutral-400">Max Guests:</span> {formData.maxGuests}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-neutral-800 rounded-lg">
                      <h4 className="font-medium text-white mb-2">Amenities & Features</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm text-neutral-300">
                        {formData.hasPool && <p>• Swimming Pool</p>}
                        {formData.hasGarden && <p>• Garden</p>}
                        {formData.hasAirConditioning && <p>• Air Conditioning</p>}
                        {formData.hasParking && <p>• Parking</p>}
                        {formData.hasLaundry && <p>• Laundry</p>}
                        {formData.hasBackupPower && <p>• Backup Power</p>}
                        {formData.amenities.map(amenity => {
                          const option = amenityOptions.find(opt => opt.id === amenity)
                          return option ? <p key={amenity}>• {option.label}</p> : null
                        })}
                      </div>
                    </div>

                    <div className="p-4 bg-neutral-800 rounded-lg">
                      <h4 className="font-medium text-white mb-2">Pricing</h4>
                      <div className="text-sm text-neutral-300">
                        <p><span className="text-neutral-400">Price per Night:</span> {formData.pricePerNight} {formData.currency}</p>
                      </div>
                    </div>
                  </div>

                  {errors.submit && (
                    <div className="p-4 bg-red-950/20 border border-red-800/30 rounded-lg">
                      <p className="text-red-400 font-medium">{errors.submit}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6 border-t border-neutral-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goToPreviousStep}
                  disabled={isFirstStep}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Previous</span>
                </Button>

                <Button
                  type="button"
                  onClick={goToNextStep}
                  disabled={loading}
                  className="flex items-center space-x-2"
                >
                  {isLastStep ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>{loading ? 'Creating...' : 'Create Property'}</span>
                    </>
                  ) : (
                    <>
                      <span>Next</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
