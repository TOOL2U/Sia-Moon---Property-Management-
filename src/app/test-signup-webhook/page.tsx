'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import WebhookService, { SignupData } from '@/lib/webhookService'
import { CheckCircle, XCircle, Loader2, Send, User } from 'lucide-react'

export default function TestSignupWebhookPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

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
    source: 'sia_moon_webapp',
    campaign_id: 'summer_2024',
    utm_source: 'google',
    utm_medium: 'cpc',
    utm_campaign: 'property_management_bali'
  }

  const handleTestSignup = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      console.log('🧪 Starting signup webhook test...')
      console.log('📤 Sending comprehensive signup data to Make.com webhook...')

      const response = await WebhookService.sendSignupConfirmation(testSignupData)

      if (response.success) {
        setResult({
          success: true,
          message: `✅ Signup webhook test successful! Webhook ID: ${response.webhookId}`
        })
        console.log('✅ Signup webhook test successful!')
      } else {
        setResult({
          success: false,
          message: `❌ Signup webhook test failed: ${response.error}`
        })
        console.error('❌ Signup webhook test failed:', response.error)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setResult({
        success: false,
        message: `❌ Signup webhook test failed: ${errorMessage}`
      })
      console.error('❌ Signup webhook test failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestInvalidData = async () => {
    setIsLoading(true)
    setResult(null)

    const invalidData: Partial<SignupData> = {
      name: '',
      email: 'invalid-email',
      userId: ''
    }

    try {
      console.log('🧪 Testing signup webhook with invalid data...')

      const response = await WebhookService.sendSignupConfirmation(invalidData as SignupData)

      if (response.success) {
        setResult({
          success: true,
          message: '✅ Invalid data test completed (webhook accepted invalid data)'
        })
      } else {
        setResult({
          success: false,
          message: `❌ Invalid data test failed: ${response.error}`
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setResult({
        success: false,
        message: `❌ Invalid data test failed: ${errorMessage}`
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <User className="mx-auto h-12 w-12 text-gray-600 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Signup Webhook Test
          </h1>
          <p className="text-lg text-gray-600">
            Test the comprehensive signup data webhook integration with Make.com
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Test Valid Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Test Valid Signup Data
              </CardTitle>
              <CardDescription>
                Send comprehensive signup data to Make.com webhook
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Test Data Includes:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• User info (name, email, phone, role)</li>
                  <li>• Account details (type, plan, referral)</li>
                  <li>• Business info (company, property count)</li>
                  <li>• Technical details (device, browser, IP)</li>
                  <li>• Preferences (communication, timezone)</li>
                  <li>• Marketing data (UTM parameters)</li>
                </ul>
              </div>
              <Button
                onClick={handleTestSignup}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Test Signup Data
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Test Invalid Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                Test Invalid Data
              </CardTitle>
              <CardDescription>
                Test webhook behavior with invalid/missing data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-semibold text-sm text-red-700 mb-2">Invalid Test Data:</h4>
                <ul className="text-sm text-red-600 space-y-1">
                  <li>• Empty name field</li>
                  <li>• Invalid email format</li>
                  <li>• Missing user ID</li>
                  <li>• Missing required fields</li>
                </ul>
              </div>
              <Button
                onClick={handleTestInvalidData}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Test Invalid Data
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        {result && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                Test Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`p-4 rounded-lg ${
                result.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                <p className={`font-medium ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.message}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Webhook Information */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Webhook Configuration</CardTitle>
            <CardDescription>
              Current signup webhook settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid gap-2 text-sm">
                <div>
                  <span className="font-semibold">Webhook URL:</span>
                  <span className="ml-2 font-mono text-blue-600">
                    {process.env.NEXT_PUBLIC_SIGNUP_WEBHOOK_URL || 'https://hook.eu2.make.com/w2yvka9ab0x4jl58bfdjotra1ehozrqf'}
                  </span>
                </div>
                <div>
                  <span className="font-semibold">Method:</span>
                  <span className="ml-2">POST</span>
                </div>
                <div>
                  <span className="font-semibold">Content-Type:</span>
                  <span className="ml-2">application/json</span>
                </div>
                <div>
                  <span className="font-semibold">Data Format:</span>
                  <span className="ml-2">Comprehensive signup object with user, business, and technical details</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
