'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAuth } from '@/contexts/AuthContext'

export default function TestOnboardingWebhookPage() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [forceResult, setForceResult] = useState<any>(null)
  const [isForceLoading, setIsForceLoading] = useState(false)

  const testWebhook = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const testData = {
        // User Information
        user_id: user?.id || 'test-user-id',
        
        // Owner Details
        name: 'Test User',
        email: user?.email || 'vika@gmail.com',
        phone: '+1234567890',
        nationality: 'Test Nationality',
        preferred_contact_method: 'email',
        bank_details: 'Test Bank Details',
        
        // Property Details
        property_name: 'Test Villa',
        property_address: '123 Test Street, Test City',
        google_maps_url: 'https://maps.google.com/test',
        bedrooms: 3,
        bathrooms: 2,
        land_size_sqm: 500,
        villa_size_sqm: 200,
        year_built: 2020,
        
        // Amenities
        has_pool: true,
        has_garden: true,
        has_air_conditioning: true,
        internet_provider: 'Test ISP',
        has_parking: true,
        has_laundry: true,
        has_backup_power: false,
        
        // Additional fields
        notes: 'Test onboarding submission'
      }

      console.log('🧪 Testing webhook with data:', testData)

      const response = await fetch('/api/onboarding-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      })

      const responseData = await response.json()
      
      console.log('📥 Webhook response:', responseData)
      
      setResult({
        status: response.status,
        success: response.ok,
        data: responseData
      })

    } catch (error) {
      console.error('❌ Test error:', error)
      setResult({
        status: 'error',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const forceCreateProperty = async () => {
    setIsForceLoading(true)
    setForceResult(null)

    try {
      console.log('🔧 FORCING property creation...')

      const response = await fetch('/api/debug/create-property-from-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const responseData = await response.json()

      console.log('📥 Force creation response:', responseData)

      setForceResult({
        status: response.status,
        success: response.ok,
        data: responseData
      })

    } catch (error) {
      console.error('❌ Force creation error:', error)
      setForceResult({
        status: 'error',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsForceLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">🧪 Test Onboarding Webhook</CardTitle>
            <CardDescription className="text-gray-300">
              Test the onboarding webhook directly to debug property creation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* User Info */}
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Current User</h3>
              <p><strong>ID:</strong> {user?.id || 'Not logged in'}</p>
              <p><strong>Email:</strong> {user?.email || 'Not logged in'}</p>
            </div>

            {/* Test Buttons */}
            <div className="space-y-4">
              <Button
                onClick={testWebhook}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Testing Webhook...' : 'Test Onboarding Webhook'}
              </Button>

              <Button
                onClick={forceCreateProperty}
                disabled={isForceLoading}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {isForceLoading ? 'FORCING Property Creation...' : '🔧 FORCE CREATE PROPERTY'}
              </Button>
            </div>

            {/* Results */}
            {result && (
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">
                  {result.success ? '✅ Webhook Success' : '❌ Webhook Error'}
                </h3>
                <div className="bg-gray-800 p-3 rounded text-sm overflow-auto">
                  <pre>{JSON.stringify(result, null, 2)}</pre>
                </div>
              </div>
            )}

            {/* Force Creation Results */}
            {forceResult && (
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">
                  {forceResult.success ? '✅ Force Creation Success' : '❌ Force Creation Error'}
                </h3>
                <div className="bg-gray-800 p-3 rounded text-sm overflow-auto">
                  <pre>{JSON.stringify(forceResult, null, 2)}</pre>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-900/20 border border-blue-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">🔍 What This Tests</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Sends test data to onboarding webhook</li>
                <li>Uses current user ID and email</li>
                <li>Tests property creation in user profile</li>
                <li>Shows detailed response and errors</li>
              </ul>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}
