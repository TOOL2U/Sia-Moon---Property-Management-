'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'

interface TestResult {
  success: boolean
  status?: number
  data?: unknown
  error?: string
  timestamp: string
  note?: string
}

export default function TestOnboardingDataPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)

  const testOnboardingData = {
    // Owner Details
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    nationality: 'American',
    preferred_contact_method: 'email',
    bank_details: 'Bank ABC, Account: 123456789',

    // Property Details
    property_name: 'Villa Sunset Paradise',
    property_address: '123 Sunset Beach, Bali, Indonesia',
    google_maps_url: 'https://maps.google.com/example',
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
    access_details: 'Electronic gate with remote control',
    has_smart_lock: true,
    gate_remote_details: 'Remote control in key safe',
    onsite_staff: 'Daily cleaning service available',

    // Utilities
    electricity_provider: 'PLN',
    water_source: 'Municipal water supply',
    internet_package: 'Fiber 100Mbps',

    // Smart Electric System - NEW FIELDS
    has_smart_electric_system: true,
    smart_system_brand: 'Sonoff',
    smart_devices_controlled: ['Lights', 'Air Conditioning', 'Pool Equipment'],
    smart_devices_other: 'Smart water heater',
    can_control_manually_wifi_down: true,
    smart_system_app_platform: 'eWeLink',
    has_hub_gateway: true,
    hub_gateway_location: 'Living room',
    linked_to_property_wifi: true,
    control_account_owner: 'Property Manager',
    control_account_owner_other: '',
    login_credentials_provided: true,
    login_credentials_details: 'Username: admin, Password: ****',
    has_active_schedules_automations: true,
    schedules_automations_details: 'Lights turn off at 11 PM, Pool filter runs 6 hours daily',
    smart_system_special_instructions: 'Reset hub monthly for optimal performance',

    // Rental & Marketing
    rental_rates: '$200-300 per night',
    platforms_listed: ['Airbnb', 'Booking.com'],
    average_occupancy_rate: '75%',
    minimum_stay_requirements: '3 nights',
    target_guests: 'Families and couples',
    owner_blackout_dates: 'December 20-31',

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
    uploaded_photos: ['photo1.jpg', 'photo2.jpg'],

    // Emergency Contact
    emergency_contact_name: 'Jane Doe',
    emergency_contact_phone: '+1234567891',

    // Additional Notes
    notes: 'Beautiful oceanview villa perfect for vacation rentals',

    // Metadata
    submission_type: 'villa_onboarding',
    timestamp: new Date().toISOString(),
    source: 'test_interface'
  }

  const testDirectWebhook = async () => {
    setIsSubmitting(true)
    setResult(null)

    try {
      console.log('🧪 Testing onboarding webhook directly...')
      
      const response = await fetch('/api/onboarding-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testOnboardingData)
      })

      const result = await response.json()
      console.log('📥 Webhook response:', result)
      
      setResult({
        success: response.ok,
        status: response.status,
        data: result,
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      console.error('❌ Test failed:', error)
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const testMakeWebhook = async () => {
    setIsSubmitting(true)
    setResult(null)

    try {
      console.log('🧪 Testing Make.com webhook submission...')
      
      const webhookUrl = process.env.NEXT_PUBLIC_MAKE_WEBHOOK_URL
      if (!webhookUrl) {
        throw new Error('NEXT_PUBLIC_MAKE_WEBHOOK_URL not configured')
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testOnboardingData)
      })

      const result = await response.text() // Make.com might not return JSON
      console.log('📥 Make.com response:', result)
      
      setResult({
        success: response.ok,
        status: response.status,
        data: result,
        timestamp: new Date().toISOString(),
        note: 'Data sent to Make.com. Check Google Sheets and admin panel for storage confirmation.'
      })

    } catch (error) {
      console.error('❌ Test failed:', error)
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">🧪 Onboarding Data Flow Test</h1>
          <p className="text-neutral-400">
            Test the complete onboarding data flow including Smart Electric System fields
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Test Direct Webhook */}
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-blue-400">🎯 Direct Webhook Test</CardTitle>
              <CardDescription>
                Test the onboarding webhook endpoint directly to verify Firebase storage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={testDirectWebhook}
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? 'Testing...' : 'Test Direct Webhook'}
              </Button>
              <p className="text-xs text-neutral-500 mt-2">
                Endpoint: /api/onboarding-webhook
              </p>
            </CardContent>
          </Card>

          {/* Test Make.com Webhook */}
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-green-400">📡 Make.com Webhook Test</CardTitle>
              <CardDescription>
                Test the full flow: Send to Make.com → Google Sheets → Return webhook
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={testMakeWebhook}
                disabled={isSubmitting}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? 'Testing...' : 'Test Make.com Flow'}
              </Button>
              <p className="text-xs text-neutral-500 mt-2">
                {process.env.NEXT_PUBLIC_MAKE_WEBHOOK_URL ? 
                  `URL: ${process.env.NEXT_PUBLIC_MAKE_WEBHOOK_URL.substring(0, 50)}...` : 
                  'URL: Not configured'
                }
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Test Data Preview */}
        <Card className="bg-neutral-900 border-neutral-700 mt-6">
          <CardHeader>
            <CardTitle>📋 Test Data Preview</CardTitle>
            <CardDescription>
              Sample onboarding data that will be sent (including Smart Electric System fields)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-neutral-800 p-4 rounded-lg overflow-auto max-h-96">
              <pre className="text-sm text-neutral-300">
                {JSON.stringify(testOnboardingData, null, 2)}
              </pre>
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-semibold text-blue-400">Owner Fields</div>
                <div className="text-neutral-400">6 fields</div>
              </div>
              <div>
                <div className="font-semibold text-green-400">Property Fields</div>
                <div className="text-neutral-400">9 fields</div>
              </div>
              <div>
                <div className="font-semibold text-purple-400">Smart Electric</div>
                <div className="text-neutral-400">13 fields</div>
              </div>
              <div>
                <div className="font-semibold text-orange-400">Total Fields</div>
                <div className="text-neutral-400">{Object.keys(testOnboardingData).length} fields</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card className={`mt-6 ${result.success ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
            <CardHeader>
              <CardTitle className={result.success ? 'text-green-400' : 'text-red-400'}>
                {result.success ? '✅ Test Successful' : '❌ Test Failed'}
              </CardTitle>
              <CardDescription>
                {result.timestamp}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-neutral-800 p-4 rounded-lg overflow-auto max-h-96">
                <pre className="text-sm text-neutral-300">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
              {result.note && (
                <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-300 text-sm">{result.note}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-neutral-900 border-neutral-700 mt-6">
          <CardHeader>
            <CardTitle>📖 Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-blue-400 mb-2">🎯 Direct Webhook Test</h4>
              <p className="text-sm text-neutral-300">
                Tests if the webhook endpoint properly receives and stores onboarding data in Firebase. 
                Check the admin panel after testing to see if the submission appears.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-green-400 mb-2">📡 Make.com Flow Test</h4>
              <p className="text-sm text-neutral-300">
                Tests the complete flow: Data → Make.com → Google Sheets. 
                You need to configure Make.com to call the onboarding webhook endpoint 
                (/api/onboarding-webhook) after processing the data.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-orange-400 mb-2">🔍 What to Verify</h4>
              <ul className="text-sm text-neutral-300 space-y-1">
                <li>• All Smart Electric System fields are included</li>
                <li>• Data is properly stored in Firebase</li>
                <li>• Admin panel shows the submission</li>
                <li>• Google Sheets receives the data (via Make.com)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
