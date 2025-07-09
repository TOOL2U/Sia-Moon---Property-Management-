import { useState } from 'react'
import { NEXT_PUBLIC_MAKE_WEBHOOK_URL } from '@/lib/env'

/**
 * Type definition for the onboarding form data that will be sent to Make.com
 */
export interface OnboardingSubmissionData {
  name: string
  email: string
  phone: string
  property_address: string
  notes: string
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
    if (!NEXT_PUBLIC_MAKE_WEBHOOK_URL) {
      const errorMsg = 'Webhook URL not configured. Please contact support.'
      console.warn('⚠️ NEXT_PUBLIC_MAKE_WEBHOOK_URL is not set in environment variables')
      setError(errorMsg)
      throw new Error(errorMsg)
    }

    // Validate required data fields
    const requiredFields: (keyof OnboardingSubmissionData)[] = ['name', 'email', 'phone', 'property_address']
    const missingFields = requiredFields.filter(field => !data[field]?.trim())

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
      console.log('📡 Webhook URL:', NEXT_PUBLIC_MAKE_WEBHOOK_URL)

      const response = await fetch(NEXT_PUBLIC_MAKE_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name.trim(),
          email: data.email.trim(),
          phone: data.phone.trim(),
          property_address: data.property_address.trim(),
          notes: data.notes.trim() || '' // Notes can be empty
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
