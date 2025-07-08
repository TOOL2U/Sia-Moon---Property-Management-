'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { useOnboardingSubmit, OnboardingSubmissionData } from '@/hooks/useOnboardingSubmit'
import { CheckCircle, XCircle, Loader2, Send } from 'lucide-react'

export default function TestWebhookPage() {
  const { isLoading, isSuccess, error, submitOnboarding, reset } = useOnboardingSubmit()
  const [testResults, setTestResults] = useState<string[]>([])

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testWebhook = async () => {
    reset()
    setTestResults([])
    addTestResult('Starting webhook test...')

    const testData: OnboardingSubmissionData = {
      // Owner Details
      name: 'Test User',
      email: 'test@example.com',
      phone: '+1234567890',
      nationality: 'American',
      preferred_contact_method: 'email',
      bank_details: 'Test Bank - Account ending in 1234',

      // Property Details
      property_name: 'Villa Paradise Test',
      property_address: '123 Test Villa Street, Ubud, Bali, Indonesia',
      google_maps_url: 'https://maps.google.com/test-villa',
      bedrooms: 4,
      bathrooms: 3,
      land_size_sqm: 500,
      villa_size_sqm: 300,
      year_built: 2020,

      // Amenities
      has_pool: true,
      has_garden: true,
      has_air_conditioning: true,
      internet_provider: 'Telkom Indonesia',
      has_parking: true,
      has_laundry: true,
      has_backup_power: true,

      // Access & Staff
      access_details: 'Private gate with remote control',
      has_smart_lock: true,
      gate_remote_details: 'Remote provided to guests',
      onsite_staff: 'Daily housekeeping and gardener',

      // Utilities
      electricity_provider: 'PLN',
      water_source: 'Municipal water supply',
      internet_package: 'Fiber 100Mbps',

      // Rental & Marketing
      rental_rates: '$150-200 per night',
      platforms_listed: ['Airbnb', 'Booking.com', 'Vrbo'],
      average_occupancy_rate: '75%',
      minimum_stay_requirements: '3 nights',
      target_guests: 'Couples and families',
      owner_blackout_dates: 'December 20-31, 2024',

      // Preferences & Rules
      pets_allowed: false,
      parties_allowed: false,
      smoking_allowed: false,
      maintenance_auto_approval_limit: '$500',

      // Current Condition
      repairs_needed: 'Minor touch-up painting needed',
      last_septic_service: '2024-01-15',
      pest_control_schedule: 'Monthly',

      // Photos & Media
      professional_photos_status: 'completed',
      floor_plan_images_available: true,
      video_walkthrough_available: true,

      // Emergency Contact
      emergency_contact_name: 'Jane Doe',
      emergency_contact_phone: '+1234567891',

      // Additional Notes
      notes: 'This is a comprehensive test submission from the webhook test page with all villa details',

      // Submission metadata
      submission_type: 'test_comprehensive_villa_onboarding',
      timestamp: new Date().toISOString()
    }

    try {
      addTestResult('Sending test data to Make.com webhook...')
      await submitOnboarding(testData)
      addTestResult('✅ Webhook test successful!')
    } catch (err) {
      addTestResult(`❌ Webhook test failed: ${err}`)
    }
  }

  const testWithMissingData = async () => {
    reset()
    setTestResults([])
    addTestResult('Testing validation with missing data...')

    const invalidData: Partial<OnboardingSubmissionData> = {
      name: '',
      email: 'invalid-email',
      phone: '',
      property_name: '',
      property_address: '',
      notes: ''
    }

    try {
      addTestResult('Attempting to submit invalid data...')
      await submitOnboarding(invalidData as OnboardingSubmissionData)
      addTestResult('❌ Validation test failed - should have thrown error')
    } catch (err) {
      // This is expected behavior - validation should catch missing fields
      const errorMessage = err instanceof Error ? err.message : String(err)
      addTestResult(`✅ Validation working correctly: ${errorMessage}`)
      addTestResult('✅ Test passed - invalid data was properly rejected')
    }
  }

  const testEmailValidation = async () => {
    reset()
    setTestResults([])
    addTestResult('Testing email validation...')

    const invalidEmailData: OnboardingSubmissionData = {
      name: 'Test User',
      email: 'invalid-email-format',
      phone: '+1234567890',
      property_name: 'Test Villa',
      property_address: '123 Test Street',
      notes: 'Testing email validation'
    }

    try {
      addTestResult('Attempting to submit data with invalid email...')
      await submitOnboarding(invalidEmailData)
      addTestResult('❌ Email validation test failed - should have thrown error')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      addTestResult(`✅ Email validation working correctly: ${errorMessage}`)
      addTestResult('✅ Test passed - invalid email was properly rejected')
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">
            Webhook Integration Test
          </h1>
          <p className="text-neutral-400">
            Test the Make.com webhook integration for villa onboarding submissions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Controls */}
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Test Controls</CardTitle>
              <CardDescription className="text-neutral-400">
                Run tests to verify webhook functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={testWebhook}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Testing Webhook...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Send className="h-4 w-4" />
                    <span>Test Valid Submission</span>
                  </div>
                )}
              </Button>

              <Button
                onClick={testWithMissingData}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                Test Validation (Missing Fields)
              </Button>

              <Button
                onClick={testEmailValidation}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                Test Email Validation
              </Button>

              <Button
                onClick={reset}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                Reset Test State
              </Button>
            </CardContent>
          </Card>

          {/* Test Status */}
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <span>Test Status</span>
                {isSuccess && <CheckCircle className="h-5 w-5 text-green-500" />}
                {error && <XCircle className="h-5 w-5 text-red-500" />}
                {isLoading && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
              </CardTitle>
              <CardDescription className="text-neutral-400">
                Current webhook test status and results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-4">
                  <p className="text-blue-400 text-sm">Testing webhook submission...</p>
                </div>
              )}

              {isSuccess && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg mb-4">
                  <p className="text-green-400 text-sm">✅ Webhook test successful!</p>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
                  <p className="text-red-400 text-sm">❌ {error}</p>
                </div>
              )}

              {testResults.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-neutral-300">Test Log:</h4>
                  <div className="bg-neutral-800 rounded-lg p-3 max-h-64 overflow-y-auto">
                    {testResults.map((result, index) => (
                      <div key={index} className="text-xs text-neutral-400 font-mono">
                        {result}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Environment Info */}
        <Card className="bg-neutral-900 border-neutral-800 mt-8">
          <CardHeader>
            <CardTitle className="text-white">Environment Information</CardTitle>
            <CardDescription className="text-neutral-400">
              Current webhook configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-400">Webhook URL:</span>
                <span className="text-white font-mono text-xs">
                  {process.env.NEXT_PUBLIC_MAKE_WEBHOOK_URL ? 
                    `${process.env.NEXT_PUBLIC_MAKE_WEBHOOK_URL.substring(0, 50)}...` : 
                    'Not configured'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Status:</span>
                <span className={`text-xs ${process.env.NEXT_PUBLIC_MAKE_WEBHOOK_URL ? 'text-green-400' : 'text-red-400'}`}>
                  {process.env.NEXT_PUBLIC_MAKE_WEBHOOK_URL ? '✅ Configured' : '❌ Missing'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-neutral-900 border-neutral-800 mt-8">
          <CardHeader>
            <CardTitle className="text-white">Test Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-neutral-300">
              <p>
                <strong>1. Test Valid Submission:</strong> Sends a complete test payload to the Make.com webhook.
                Check your Make.com scenario to verify the data is received correctly.
              </p>
              <p>
                <strong>2. Test Validation:</strong> Attempts to submit invalid data to verify client-side validation
                is working correctly.
              </p>
              <p>
                <strong>3. Check Console:</strong> Open browser developer tools to see detailed logging
                of the webhook requests and responses.
              </p>
              <p className="text-yellow-400">
                <strong>Note:</strong> Make sure your Make.com webhook URL is configured in the environment variables.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
