import { useState } from 'react'

/**
 * Type definition for the comprehensive villa onboarding data that will be sent to Make.com
 */
export interface OnboardingSubmissionData {
  // User Information
  user_id?: string

  // Owner Details
  name: string
  email: string
  phone: string
  nationality?: string
  preferred_contact_method?: string
  bank_details?: string

  // Property Details
  property_name: string
  property_address: string
  google_maps_url?: string
  bedrooms?: number
  bathrooms?: number
  land_size_sqm?: number
  villa_size_sqm?: number
  year_built?: number

  // Amenities
  has_pool?: boolean
  has_garden?: boolean
  has_air_conditioning?: boolean
  internet_provider?: string
  has_parking?: boolean
  has_laundry?: boolean
  has_backup_power?: boolean

  // Access & Staff
  access_details?: string
  has_smart_lock?: boolean
  gate_remote_details?: string
  onsite_staff?: string

  // Utilities
  electricity_provider?: string
  water_source?: string
  internet_package?: string

  // Smart Electric System
  has_smart_electric_system?: boolean
  smart_system_brand?: string
  smart_devices_controlled?: string[]
  smart_devices_other?: string
  can_control_manually_wifi_down?: boolean
  smart_system_app_platform?: string
  has_hub_gateway?: boolean
  hub_gateway_location?: string
  linked_to_property_wifi?: boolean
  control_account_owner?: string
  control_account_owner_other?: string
  login_credentials_provided?: boolean
  login_credentials_details?: string
  has_active_schedules_automations?: boolean
  schedules_automations_details?: string
  smart_system_special_instructions?: string

  // Rental & Marketing
  rental_rates?: string
  platforms_listed?: string[]
  average_occupancy_rate?: string
  minimum_stay_requirements?: string
  target_guests?: string
  owner_blackout_dates?: string

  // Preferences & Rules
  pets_allowed?: boolean
  parties_allowed?: boolean
  smoking_allowed?: boolean
  maintenance_auto_approval_limit?: string

  // Current Condition
  repairs_needed?: string

  // Photos & Media
  professional_photos_status?: string
  floor_plan_images_available?: boolean
  video_walkthrough_available?: boolean

  // Emergency Contact
  emergency_contact_name?: string
  emergency_contact_phone?: string

  // Additional Notes
  notes?: string

  // Submission metadata
  submission_type?: string
  timestamp?: string
}

/**
 * Type definition for the hook's return value
 */
export interface UseOnboardingSubmitReturn {
  /** Whether the submission is currently in progress */
  isLoading: boolean
  /** Whether the submission was successful */
  isSuccess: boolean
  /** Error message if submission failed */
  error: string | null
  /** Function to submit the onboarding data */
  submitOnboarding: (data: OnboardingSubmissionData) => Promise<void>
  /** Function to reset the hook state */
  reset: () => void
}

/**
 * Custom React hook for submitting villa onboarding data to Make.com webhook
 * 
 * This hook handles the complete submission flow including:
 * - Loading states during submission
 * - Success state management
 * - Error handling with user-friendly messages
 * - Automatic logging for debugging
 * 
 * @example
 * ```tsx
 * const { isLoading, isSuccess, error, submitOnboarding, reset } = useOnboardingSubmit()
 * 
 * const handleSubmit = async () => {
 *   await submitOnboarding({
 *     name: 'John Doe',
 *     email: 'john@example.com',
 *     phone: '+1234567890',
 *     property_address: '123 Villa Street',
 *     notes: 'Looking for property management services'
 *   })
 * }
 * ```
 */
export const useOnboardingSubmit = (): UseOnboardingSubmitReturn => {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Submit onboarding data to Make.com webhook
   */
  const submitOnboarding = async (data: OnboardingSubmissionData): Promise<void> => {
    // Validate required environment variable
    const webhookUrl = process.env.NEXT_PUBLIC_MAKE_WEBHOOK_URL
    if (!webhookUrl) {
      const errorMsg = 'Webhook URL not configured. Please contact support.'
      console.warn('⚠️ NEXT_PUBLIC_MAKE_WEBHOOK_URL is not set in environment variables')
      setError(errorMsg)
      throw new Error(errorMsg)
    }

    // Validate required data fields
    const requiredFields: (keyof OnboardingSubmissionData)[] = ['name', 'email', 'phone', 'property_name', 'property_address']
    const missingFields = requiredFields.filter(field => {
      const value = data[field]
      return !value || (typeof value === 'string' && !value.trim())
    })

    if (missingFields.length > 0) {
      const errorMsg = `Please fill in all required fields: ${missingFields.join(', ')}`
      console.warn('⚠️ Missing required fields:', missingFields)
      setError(errorMsg)
      throw new Error(errorMsg)
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      const errorMsg = 'Please enter a valid email address'
      console.warn('⚠️ Invalid email format:', data.email)
      setError(errorMsg)
      throw new Error(errorMsg)
    }

    // Reset previous states
    setIsLoading(true)
    setError(null)
    setIsSuccess(false)

    try {
      console.log('🚀 Submitting onboarding data to Make.com:', {
        ...data,
        email: data.email.replace(/(.{2}).*(@.*)/, '$1***$2') // Mask email for logging
      })
      console.log('📡 Webhook URL:', webhookUrl)

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // User Information
          user_id: data.user_id,

          // Owner Details
          name: data.name?.trim(),
          email: data.email?.trim(),
          phone: data.phone?.trim(),
          nationality: data.nationality?.trim(),
          preferred_contact_method: data.preferred_contact_method?.trim(),
          bank_details: data.bank_details?.trim(),

          // Property Details
          property_name: data.property_name?.trim(),
          property_address: data.property_address?.trim(),
          google_maps_url: data.google_maps_url?.trim(),
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          land_size_sqm: data.land_size_sqm,
          villa_size_sqm: data.villa_size_sqm,
          year_built: data.year_built,

          // Amenities
          has_pool: data.has_pool,
          has_garden: data.has_garden,
          has_air_conditioning: data.has_air_conditioning,
          internet_provider: data.internet_provider?.trim(),
          has_parking: data.has_parking,
          has_laundry: data.has_laundry,
          has_backup_power: data.has_backup_power,

          // Access & Staff
          access_details: data.access_details?.trim(),
          has_smart_lock: data.has_smart_lock,
          gate_remote_details: data.gate_remote_details?.trim(),
          onsite_staff: data.onsite_staff?.trim(),

          // Utilities
          electricity_provider: data.electricity_provider?.trim(),
          water_source: data.water_source?.trim(),
          internet_package: data.internet_package?.trim(),

          // Smart Electric System
          has_smart_electric_system: data.has_smart_electric_system,
          smart_system_brand: data.smart_system_brand?.trim(),
          smart_devices_controlled: data.smart_devices_controlled,
          smart_devices_other: data.smart_devices_other?.trim(),
          can_control_manually_wifi_down: data.can_control_manually_wifi_down,
          smart_system_app_platform: data.smart_system_app_platform?.trim(),
          has_hub_gateway: data.has_hub_gateway,
          hub_gateway_location: data.hub_gateway_location?.trim(),
          linked_to_property_wifi: data.linked_to_property_wifi,
          control_account_owner: data.control_account_owner?.trim(),
          control_account_owner_other: data.control_account_owner_other?.trim(),
          login_credentials_provided: data.login_credentials_provided,
          login_credentials_details: data.login_credentials_details?.trim(),
          has_active_schedules_automations: data.has_active_schedules_automations,
          schedules_automations_details: data.schedules_automations_details?.trim(),
          smart_system_special_instructions: data.smart_system_special_instructions?.trim(),

          // Rental & Marketing
          rental_rates: data.rental_rates?.trim(),
          platforms_listed: data.platforms_listed,
          average_occupancy_rate: data.average_occupancy_rate?.trim(),
          minimum_stay_requirements: data.minimum_stay_requirements?.trim(),
          target_guests: data.target_guests?.trim(),
          owner_blackout_dates: data.owner_blackout_dates?.trim(),

          // Preferences & Rules
          pets_allowed: data.pets_allowed,
          parties_allowed: data.parties_allowed,
          smoking_allowed: data.smoking_allowed,
          maintenance_auto_approval_limit: data.maintenance_auto_approval_limit?.trim(),

          // Current Condition
          repairs_needed: data.repairs_needed?.trim(),

          // Photos & Media
          professional_photos_status: data.professional_photos_status?.trim(),
          floor_plan_images_available: data.floor_plan_images_available,
          video_walkthrough_available: data.video_walkthrough_available,

          // Emergency Contact
          emergency_contact_name: data.emergency_contact_name?.trim(),
          emergency_contact_phone: data.emergency_contact_phone?.trim(),

          // Additional Notes
          notes: data.notes?.trim() || '',

          // Submission metadata
          submission_type: data.submission_type || 'villa_onboarding',
          timestamp: data.timestamp || new Date().toISOString(),
          source: 'sia_moon_webapp'
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // Log successful submission
      console.log('✅ Onboarding data submitted successfully to Make.com')
      setIsSuccess(true)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('❌ Failed to submit onboarding data:', errorMessage)
      
      // Provide user-friendly error messages
      let userFriendlyError: string
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        userFriendlyError = 'Network error. Please check your internet connection and try again.'
      } else if (errorMessage.includes('HTTP 4')) {
        userFriendlyError = 'Invalid request. Please check your information and try again.'
      } else if (errorMessage.includes('HTTP 5')) {
        userFriendlyError = 'Server error. Please try again in a few moments.'
      } else {
        userFriendlyError = 'Submission failed. Please try again or contact support if the problem persists.'
      }
      
      setError(userFriendlyError)
      throw new Error(userFriendlyError)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Reset all hook states to initial values
   */
  const reset = (): void => {
    setIsLoading(false)
    setIsSuccess(false)
    setError(null)
  }

  return {
    isLoading,
    isSuccess,
    error,
    submitOnboarding,
    reset
  }
}

export default useOnboardingSubmit
