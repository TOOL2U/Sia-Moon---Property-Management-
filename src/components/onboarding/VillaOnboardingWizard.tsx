'use client'

/**
 * Villa Onboarding Wizard
 * Multi-step wizard for villa property onboarding
 */

import React, { useState, useEffect } from 'react'
import { clientToast as toast } from '@/utils/clientToast'
import {
  ChevronLeft, ChevronRight, Check, Home, User, Settings,
  MapPin, Wifi, Shield, Star, Camera, FileText, Send
} from 'lucide-react'

// Components
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Checkbox } from '@/components/ui/Checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

// Types and Services
import { useAuth } from '@/contexts/AuthContext'
import { OnboardingService } from '@/lib/services/onboardingService'

interface WizardStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'owner-details',
    title: 'Owner Information',
    description: 'Tell us about yourself',
    icon: <User className="w-5 h-5" />
  },
  {
    id: 'property-details',
    title: 'Property Information',
    description: 'Details about your villa',
    icon: <Home className="w-5 h-5" />
  },
  {
    id: 'location-amenities',
    title: 'Location & Amenities',
    description: 'Location and features',
    icon: <MapPin className="w-5 h-5" />
  },
  {
    id: 'smart-systems',
    title: 'Smart Systems',
    description: 'Technology and automation',
    icon: <Wifi className="w-5 h-5" />
  },
  {
    id: 'access-security',
    title: 'Access & Security',
    description: 'Entry and safety details',
    icon: <Shield className="w-5 h-5" />
  },
  {
    id: 'rental-preferences',
    title: 'Rental Preferences',
    description: 'Pricing and guest policies',
    icon: <Star className="w-5 h-5" />
  },
  {
    id: 'photos-media',
    title: 'Photos & Media',
    description: 'Visual content for your property',
    icon: <Camera className="w-5 h-5" />
  },
  {
    id: 'review-submit',
    title: 'Review & Submit',
    description: 'Final review of your information',
    icon: <Send className="w-5 h-5" />
  }
]

interface VillaOnboardingWizardProps {
  onComplete?: (data: any) => void
  onCancel?: () => void
}

export default function VillaOnboardingWizard({ onComplete, onCancel }: VillaOnboardingWizardProps) {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    // Owner Details
    ownerFullName: '',
    ownerNationality: '',
    ownerContactNumber: '',
    ownerEmail: user?.email || '',
    preferredContactMethod: 'email',
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

    // Smart Systems
    hasSmartElectricSystem: false,
    smartSystemBrand: '',
    smartDevicesControlled: [] as string[],
    smartDevicesOther: '',
    canControlManuallyWifiDown: false,
    smartSystemAppPlatform: '',
    hasHubGateway: false,
    hubGatewayLocation: '',
    linkedToPropertyWifi: false,
    controlAccountOwner: '',
    loginCredentialsProvided: false,
    loginCredentialsDetails: '',
    hasActiveSchedulesAutomations: false,
    schedulesAutomationsDetails: '',
    smartSystemSpecialInstructions: '',

    // Access & Security
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
    platformsListed: [] as string[],
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
    professionalPhotosStatus: 'needed',
    floorPlanImagesAvailable: false,
    videoWalkthroughAvailable: false,
    uploadedPhotos: [] as string[],

    // Emergency Contact
    emergencyContactName: '',
    emergencyContactPhone: '',

    // Additional Notes
    notes: ''
  })

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const nextStep = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error('Please log in to submit your property details')
      return
    }

    setIsSubmitting(true)
    try {
      // Prepare submission data with proper type conversion
      const submissionData = {
        ...formData,
        userId: user.id,
        submissionType: 'villa_onboarding_wizard',
        // Convert string numbers to actual numbers
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
        landSizeSqm: formData.landSizeSqm ? parseFloat(formData.landSizeSqm) : undefined,
        villaSizeSqm: formData.villaSizeSqm ? parseFloat(formData.villaSizeSqm) : undefined,
        yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt) : undefined,
      }

      // Submit to onboarding service
      const submissionId = await OnboardingService.createSubmission(submissionData as any)
      
      toast.success('Villa onboarding submitted successfully!')
      
      if (onComplete) {
        onComplete({ submissionId, ...submissionData })
      }
    } catch (error) {
      console.error('Error submitting onboarding:', error)
      toast.error('Failed to submit onboarding. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    const step = WIZARD_STEPS[currentStep]

    switch (step.id) {
      case 'owner-details':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name *
                </label>
                <Input
                  value={formData.ownerFullName}
                  onChange={(e) => updateFormData('ownerFullName', e.target.value)}
                  placeholder="Enter your full name"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nationality
                </label>
                <Input
                  value={formData.ownerNationality}
                  onChange={(e) => updateFormData('ownerNationality', e.target.value)}
                  placeholder="Your nationality"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contact Number *
                </label>
                <Input
                  value={formData.ownerContactNumber}
                  onChange={(e) => updateFormData('ownerContactNumber', e.target.value)}
                  placeholder="Your phone number"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address *
                </label>
                <Input
                  value={formData.ownerEmail}
                  onChange={(e) => updateFormData('ownerEmail', e.target.value)}
                  placeholder="Your email address"
                  className="bg-gray-700 border-gray-600 text-white"
                  type="email"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Banking Details (Optional)
              </label>
              <Textarea
                value={formData.bankDetails}
                onChange={(e) => updateFormData('bankDetails', e.target.value)}
                placeholder="Bank account details for payments"
                className="bg-gray-700 border-gray-600 text-white"
                rows={3}
              />
            </div>
          </div>
        )

      case 'property-details':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Property Name *
                </label>
                <Input
                  value={formData.propertyName}
                  onChange={(e) => updateFormData('propertyName', e.target.value)}
                  placeholder="Name of your villa"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Year Built
                </label>
                <Input
                  value={formData.yearBuilt}
                  onChange={(e) => updateFormData('yearBuilt', e.target.value)}
                  placeholder="Construction year"
                  className="bg-gray-700 border-gray-600 text-white"
                  type="number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bedrooms
                </label>
                <Input
                  value={formData.bedrooms}
                  onChange={(e) => updateFormData('bedrooms', e.target.value)}
                  placeholder="Number of bedrooms"
                  className="bg-gray-700 border-gray-600 text-white"
                  type="number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bathrooms
                </label>
                <Input
                  value={formData.bathrooms}
                  onChange={(e) => updateFormData('bathrooms', e.target.value)}
                  placeholder="Number of bathrooms"
                  className="bg-gray-700 border-gray-600 text-white"
                  type="number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Land Size (sqm)
                </label>
                <Input
                  value={formData.landSizeSqm}
                  onChange={(e) => updateFormData('landSizeSqm', e.target.value)}
                  placeholder="Land area in square meters"
                  className="bg-gray-700 border-gray-600 text-white"
                  type="number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Villa Size (sqm)
                </label>
                <Input
                  value={formData.villaSizeSqm}
                  onChange={(e) => updateFormData('villaSizeSqm', e.target.value)}
                  placeholder="Built area in square meters"
                  className="bg-gray-700 border-gray-600 text-white"
                  type="number"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Property Address *
              </label>
              <Textarea
                value={formData.propertyAddress}
                onChange={(e) => updateFormData('propertyAddress', e.target.value)}
                placeholder="Full address of your property"
                className="bg-gray-700 border-gray-600 text-white"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Google Maps URL (Optional)
              </label>
              <Input
                value={formData.googleMapsUrl}
                onChange={(e) => updateFormData('googleMapsUrl', e.target.value)}
                placeholder="Link to your property on Google Maps"
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>
        )

      case 'location-amenities':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.hasPool}
                  onChange={(checked) => updateFormData('hasPool', checked)}
                />
                <label className="text-sm text-gray-300">Swimming Pool</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.hasGarden}
                  onChange={(checked) => updateFormData('hasGarden', checked)}
                />
                <label className="text-sm text-gray-300">Garden</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.hasAirConditioning}
                  onChange={(checked) => updateFormData('hasAirConditioning', checked)}
                />
                <label className="text-sm text-gray-300">Air Conditioning</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.hasParking}
                  onChange={(checked) => updateFormData('hasParking', checked)}
                />
                <label className="text-sm text-gray-300">Parking</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.hasLaundry}
                  onChange={(checked) => updateFormData('hasLaundry', checked)}
                />
                <label className="text-sm text-gray-300">Laundry</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.hasBackupPower}
                  onChange={(checked) => updateFormData('hasBackupPower', checked)}
                />
                <label className="text-sm text-gray-300">Backup Power</label>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Internet Provider
                </label>
                <Input
                  value={formData.internetProvider}
                  onChange={(e) => updateFormData('internetProvider', e.target.value)}
                  placeholder="WiFi/Internet provider"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Internet Package
                </label>
                <Input
                  value={formData.internetPackage}
                  onChange={(e) => updateFormData('internetPackage', e.target.value)}
                  placeholder="Speed/package details"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Electricity Provider
                </label>
                <Input
                  value={formData.electricityProvider}
                  onChange={(e) => updateFormData('electricityProvider', e.target.value)}
                  placeholder="Electricity company"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Water Source
                </label>
                <Input
                  value={formData.waterSource}
                  onChange={(e) => updateFormData('waterSource', e.target.value)}
                  placeholder="Water supply details"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
          </div>
        )

      case 'smart-systems':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                checked={formData.hasSmartElectricSystem}
                onChange={(checked) => updateFormData('hasSmartElectricSystem', checked)}
              />
              <label className="text-sm font-medium text-gray-300">
                Property has Smart Electric System
              </label>
            </div>
            
            {formData.hasSmartElectricSystem && (
              <div className="space-y-4 border border-gray-600 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Smart System Brand
                    </label>
                    <Input
                      value={formData.smartSystemBrand}
                      onChange={(e) => updateFormData('smartSystemBrand', e.target.value)}
                      placeholder="e.g., Sonoff, Tuya, etc."
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      App Platform
                    </label>
                    <Input
                      value={formData.smartSystemAppPlatform}
                      onChange={(e) => updateFormData('smartSystemAppPlatform', e.target.value)}
                      placeholder="e.g., eWeLink, Smart Life, etc."
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.hasHubGateway}
                    onChange={(checked) => updateFormData('hasHubGateway', checked)}
                  />
                  <label className="text-sm text-gray-300">Has Hub/Gateway</label>
                </div>
                
                {formData.hasHubGateway && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Hub/Gateway Location
                    </label>
                    <Input
                      value={formData.hubGatewayLocation}
                      onChange={(e) => updateFormData('hubGatewayLocation', e.target.value)}
                      placeholder="Where is the hub located?"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Special Instructions
                  </label>
                  <Textarea
                    value={formData.smartSystemSpecialInstructions}
                    onChange={(e) => updateFormData('smartSystemSpecialInstructions', e.target.value)}
                    placeholder="Any special instructions for the smart system"
                    className="bg-gray-700 border-gray-600 text-white"
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>
        )

      case 'access-security':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                checked={formData.hasSmartLock}
                onChange={(checked) => updateFormData('hasSmartLock', checked)}
              />
              <label className="text-sm font-medium text-gray-300">
                Property has Smart Lock
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Access Details
              </label>
              <Textarea
                value={formData.accessDetails}
                onChange={(e) => updateFormData('accessDetails', e.target.value)}
                placeholder="How to access the property (keys, codes, etc.)"
                className="bg-gray-700 border-gray-600 text-white"
                rows={4}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Gate Remote Details
              </label>
              <Input
                value={formData.gateRemoteDetails}
                onChange={(e) => updateFormData('gateRemoteDetails', e.target.value)}
                placeholder="Gate remote or access code information"
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                On-site Staff Details
              </label>
              <Textarea
                value={formData.onsiteStaff}
                onChange={(e) => updateFormData('onsiteStaff', e.target.value)}
                placeholder="Information about guards, cleaners, or other staff"
                className="bg-gray-700 border-gray-600 text-white"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Emergency Contact Name
                </label>
                <Input
                  value={formData.emergencyContactName}
                  onChange={(e) => updateFormData('emergencyContactName', e.target.value)}
                  placeholder="Emergency contact person"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Emergency Contact Phone
                </label>
                <Input
                  value={formData.emergencyContactPhone}
                  onChange={(e) => updateFormData('emergencyContactPhone', e.target.value)}
                  placeholder="Emergency contact number"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
          </div>
        )

      case 'rental-preferences':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rental Rates
                </label>
                <Textarea
                  value={formData.rentalRates}
                  onChange={(e) => updateFormData('rentalRates', e.target.value)}
                  placeholder="Daily/weekly/monthly rates"
                  className="bg-gray-700 border-gray-600 text-white"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Target Guests
                </label>
                <Input
                  value={formData.targetGuests}
                  onChange={(e) => updateFormData('targetGuests', e.target.value)}
                  placeholder="e.g., Families, Business travelers, etc."
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Minimum Stay Requirements
                </label>
                <Input
                  value={formData.minimumStayRequirements}
                  onChange={(e) => updateFormData('minimumStayRequirements', e.target.value)}
                  placeholder="Minimum nights per booking"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Maintenance Auto-Approval Limit
                </label>
                <Input
                  value={formData.maintenanceAutoApprovalLimit}
                  onChange={(e) => updateFormData('maintenanceAutoApprovalLimit', e.target.value)}
                  placeholder="Auto-approve repairs up to amount"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.petsAllowed}
                  onChange={(checked) => updateFormData('petsAllowed', checked)}
                />
                <label className="text-sm text-gray-300">Pets Allowed</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.partiesAllowed}
                  onChange={(checked) => updateFormData('partiesAllowed', checked)}
                />
                <label className="text-sm text-gray-300">Parties Allowed</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.smokingAllowed}
                  onChange={(checked) => updateFormData('smokingAllowed', checked)}
                />
                <label className="text-sm text-gray-300">Smoking Allowed</label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Owner Blackout Dates
              </label>
              <Textarea
                value={formData.ownerBlackoutDates}
                onChange={(e) => updateFormData('ownerBlackoutDates', e.target.value)}
                placeholder="Dates when the property is not available for rental"
                className="bg-gray-700 border-gray-600 text-white"
                rows={3}
              />
            </div>
          </div>
        )

      case 'photos-media':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Professional Photos Status
              </label>
              <select
                value={formData.professionalPhotosStatus}
                onChange={(e) => updateFormData('professionalPhotosStatus', e.target.value)}
                className="w-full bg-gray-700 border-gray-600 text-white rounded-md px-3 py-2"
              >
                <option value="needed">Professional photos needed</option>
                <option value="scheduled">Photo session scheduled</option>
                <option value="completed">Professional photos completed</option>
                <option value="not-needed">Will provide own photos</option>
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.floorPlanImagesAvailable}
                  onChange={(checked) => updateFormData('floorPlanImagesAvailable', checked)}
                />
                <label className="text-sm text-gray-300">Floor plan images available</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.videoWalkthroughAvailable}
                  onChange={(checked) => updateFormData('videoWalkthroughAvailable', checked)}
                />
                <label className="text-sm text-gray-300">Video walkthrough available</label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Current Condition & Repairs Needed
              </label>
              <Textarea
                value={formData.repairsNeeded}
                onChange={(e) => updateFormData('repairsNeeded', e.target.value)}
                placeholder="Any repairs or maintenance needed before listing"
                className="bg-gray-700 border-gray-600 text-white"
                rows={4}
              />
            </div>
          </div>
        )

      case 'review-submit':
        return (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Review Your Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h4 className="font-medium text-gray-300 mb-2">Property Details</h4>
                  <p className="text-gray-400">Name: {formData.propertyName}</p>
                  <p className="text-gray-400">Bedrooms: {formData.bedrooms}</p>
                  <p className="text-gray-400">Bathrooms: {formData.bathrooms}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-300 mb-2">Owner Information</h4>
                  <p className="text-gray-400">Name: {formData.ownerFullName}</p>
                  <p className="text-gray-400">Email: {formData.ownerEmail}</p>
                  <p className="text-gray-400">Phone: {formData.ownerContactNumber}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-300 mb-2">Amenities</h4>
                  <p className="text-gray-400">Pool: {formData.hasPool ? 'Yes' : 'No'}</p>
                  <p className="text-gray-400">Garden: {formData.hasGarden ? 'Yes' : 'No'}</p>
                  <p className="text-gray-400">AC: {formData.hasAirConditioning ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-300 mb-2">Smart Systems</h4>
                  <p className="text-gray-400">Smart Electric: {formData.hasSmartElectricSystem ? 'Yes' : 'No'}</p>
                  <p className="text-gray-400">Smart Lock: {formData.hasSmartLock ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Additional Notes (Optional)
              </label>
              <Textarea
                value={formData.notes}
                onChange={(e) => updateFormData('notes', e.target.value)}
                placeholder="Any additional information or special notes"
                className="bg-gray-700 border-gray-600 text-white"
                rows={4}
              />
            </div>
          </div>
        )

      default:
        return <div>Unknown step</div>
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Villa Onboarding Wizard</h1>
          <p className="text-gray-400">Let's get your property set up for professional management</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {WIZARD_STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${index < WIZARD_STEPS.length - 1 ? 'flex-1' : ''}`}
              >
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    index <= currentStep
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-gray-600 text-gray-400'
                  }`}
                >
                  {index < currentStep ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.icon
                  )}
                </div>
                {index < WIZARD_STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 ml-4 ${
                      index < currentStep ? 'bg-blue-600' : 'bg-gray-600'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              Step {currentStep + 1} of {WIZARD_STEPS.length}
            </Badge>
          </div>
        </div>

        {/* Step Content */}
        <Card className="bg-gray-800 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              {WIZARD_STEPS[currentStep].icon}
              <span>{WIZARD_STEPS[currentStep].title}</span>
            </CardTitle>
            <p className="text-gray-400">{WIZARD_STEPS[currentStep].description}</p>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <div>
            {currentStep > 0 && (
              <Button
                onClick={prevStep}
                variant="outline"
                className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
            )}
            {onCancel && currentStep === 0 && (
              <Button
                onClick={onCancel}
                variant="outline"
                className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
              >
                Cancel
              </Button>
            )}
          </div>

          <div>
            {currentStep < WIZARD_STEPS.length - 1 ? (
              <Button
                onClick={nextStep}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Onboarding'}
                <Send className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
