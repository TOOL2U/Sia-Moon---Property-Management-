'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { useOnboardingSubmit, OnboardingSubmissionData } from '@/hooks/useOnboardingSubmit'
import WebhookService, { SignupData } from '@/lib/webhookService'
import { CheckCircle, XCircle, Loader2, Send, User, Mail } from 'lucide-react'

export default function TestWebhookPage() {
  const { isLoading, isSuccess, error, submitOnboarding, reset } = useOnboardingSubmit()
  const [testResults, setTestResults] = useState<string[]>([])
  const [signupLoading, setSignupLoading] = useState(false)
  const [signupResult, setSignupResult] = useState<{ success: boolean; message: string } | null>(null)

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

  const testSignupWebhook = async () => {
    setSignupLoading(true)
    setSignupResult(null)
    setTestResults([])
    addTestResult('Testing signup webhook...')

    const testSignupData: SignupData = {
      // User Information
      name: 'John Smith',
      email: 'john.smith@example.com',
      phone: '+1234567890',
      role: 'property_owner',
      userId: 'user_test_12345',

      // Account Details
      account_type: 'premium',
      subscription_plan: 'professional',
      referral_source: 'google_search',
      marketing_consent: true,

      // Business Information
      company_name: 'Smith Property Holdings',
      business_type: 'vacation_rental',
      property_count: '3-5',
      experience_level: 'intermediate',
      primary_goals: ['increase_revenue', 'automate_management', 'improve_guest_experience'],

      // Technical Details
      signup_method: 'web_form',
      device_type: 'desktop',
      browser: 'Chrome',
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',

      // Timestamps
      signup_date: new Date().toISOString(),
      email_verified: false,
      profile_completed: false,

      // Preferences
      communication_preferences: ['email', 'sms', 'push_notifications'],
      timezone: 'Asia/Bali',
      language: 'en',

      // Metadata
      source: 'webhook_test_page',
      campaign_id: 'test_campaign_001',
      utm_source: 'test',
      utm_medium: 'webhook_test',
      utm_campaign: 'signup_test'
    }

    try {
      addTestResult('Sending signup data to Make.com webhook...')
      const result = await WebhookService.sendSignupConfirmation(testSignupData)

      if (result.success) {
        addTestResult('✅ Signup webhook test successful!')
        addTestResult(`Webhook ID: ${result.webhookId}`)
        setSignupResult({ success: true, message: 'Signup webhook test completed successfully!' })
      } else {
        addTestResult(`❌ Signup webhook failed: ${result.error}`)
        setSignupResult({ success: false, message: result.error || 'Unknown error' })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      addTestResult(`❌ Signup webhook test failed: ${errorMessage}`)
      setSignupResult({ success: false, message: errorMessage })
    } finally {
      setSignupLoading(false)
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
              <CardTitle className="text-white">Onboarding Webhook Tests</CardTitle>
              <CardDescription className="text-neutral-400">
                Test villa onboarding webhook functionality
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

          {/* Signup Webhook Tests */}
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Signup Webhook Tests</CardTitle>
              <CardDescription className="text-neutral-400">
                Test user signup email webhook functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={testSignupWebhook}
                disabled={signupLoading}
                className="w-full"
              >
                {signupLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Testing Signup Webhook...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Test Signup Email Webhook</span>
                  </div>
                )}
              </Button>

              {signupResult && (
                <div className={`p-4 rounded-lg border ${
                  signupResult.success
                    ? 'bg-green-500/10 border-green-500/20'
                    : 'bg-red-500/10 border-red-500/20'
                }`}>
                  <div className="flex items-center space-x-2">
                    {signupResult.success ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                    <p className={`text-sm ${
                      signupResult.success ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {signupResult.message}
                    </p>
                  </div>
                </div>
              )}

              <div className="text-xs text-neutral-500 space-y-1">
                <p>• Tests signup confirmation email webhook</p>
                <p>• Sends comprehensive user data to Make.com</p>
                <p>• Check your email for test confirmation</p>
              </div>
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
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="text-neutral-300 font-medium mb-2">Onboarding Webhook</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">URL:</span>
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
              </div>

              <div>
                <h4 className="text-neutral-300 font-medium mb-2">Signup Webhook</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">URL:</span>
                    <span className="text-white font-mono text-xs">
                      {process.env.NEXT_PUBLIC_SIGNUP_WEBHOOK_URL ?
                        `${process.env.NEXT_PUBLIC_SIGNUP_WEBHOOK_URL.substring(0, 50)}...` :
                        'Not configured'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Status:</span>
                    <span className={`text-xs ${process.env.NEXT_PUBLIC_SIGNUP_WEBHOOK_URL ? 'text-green-400' : 'text-red-400'}`}>
                      {process.env.NEXT_PUBLIC_SIGNUP_WEBHOOK_URL ? '✅ Configured' : '❌ Missing'}
                    </span>
                  </div>
                </div>
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
            <div className="space-y-4 text-sm text-neutral-300">
              <div>
                <h4 className="text-white font-medium mb-2">Onboarding Webhook Tests:</h4>
                <div className="space-y-2 ml-4">
                  <p>
                    <strong>• Test Valid Submission:</strong> Sends a complete villa onboarding payload to the Make.com webhook.
                    Check your Make.com scenario to verify the data is received correctly.
                  </p>
                  <p>
                    <strong>• Test Validation:</strong> Attempts to submit invalid data to verify client-side validation
                    is working correctly.
                  </p>
                  <p>
                    <strong>• Test Email Validation:</strong> Tests email format validation specifically.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-white font-medium mb-2">Signup Webhook Tests:</h4>
                <div className="space-y-2 ml-4">
                  <p>
                    <strong>• Test Signup Email Webhook:</strong> Sends comprehensive user signup data to the Make.com webhook.
                    This should trigger a welcome email to be sent to the test email address.
                  </p>
                  <p>
                    <strong>• Check Email:</strong> After running the test, check the email inbox (including spam folder)
                    for the welcome email from the signup webhook.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-white font-medium mb-2">Debugging:</h4>
                <div className="space-y-2 ml-4">
                  <p>
                    <strong>• Check Console:</strong> Open browser developer tools to see detailed logging
                    of the webhook requests and responses.
                  </p>
                  <p>
                    <strong>• Make.com Logs:</strong> Check your Make.com scenario execution history to see
                    if webhooks are being received and processed.
                  </p>
                </div>
              </div>

              <p className="text-yellow-400 border-l-2 border-yellow-400 pl-3">
                <strong>Important:</strong> Make sure both webhook URLs are configured in your environment variables
                and that your Make.com scenarios are active and properly configured for email sending.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
