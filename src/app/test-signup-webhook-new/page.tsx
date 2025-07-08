'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import WebhookService, { SignupData, WebhookResponse } from '@/lib/webhookService'

export default function SignupWebhookTestPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [webhookResponse, setWebhookResponse] = useState<WebhookResponse | Record<string, unknown> | null>(null)
  const [formData, setFormData] = useState({
    name: 'Test User',
    email: 'test@example.com',
    phone: '+1234567890',
    company: 'Test Company'
  })

  const currentWebhookUrl = process.env.NEXT_PUBLIC_SIGNUP_WEBHOOK_URL

  const testSignupWebhook = async () => {
    setIsLoading(true)
    setTestResult(null)
    setWebhookResponse(null)

    try {
      console.log('🚀 Testing signup webhook with form data...')

      // Prepare comprehensive signup data
      const signupData: SignupData = {
        // User Information
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: 'client',
        userId: `test-user-${Date.now()}`,

        // Account Details
        account_type: 'standard',
        subscription_plan: 'free',
        referral_source: 'test_page',
        marketing_consent: true,

        // Business Information
        company_name: formData.company,
        business_type: 'property_management',
        property_count: '1-5',
        experience_level: 'beginner',
        primary_goals: ['automate_bookings', 'manage_properties'],

        // Technical Details
        signup_method: 'test_page',
        device_type: 'desktop',
        browser: 'Chrome',
        ip_address: '127.0.0.1',
        user_agent: navigator.userAgent,

        // Timestamps
        signup_date: new Date().toISOString(),
        email_verified: false,
        profile_completed: false,

        // Preferences
        communication_preferences: ['email', 'sms'],
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: 'en',

        // Metadata
        source: 'test_page',
        campaign_id: 'test_campaign',
        utm_source: 'test',
        utm_medium: 'webhook_test',
        utm_campaign: 'signup_test'
      }

      console.log('📦 Sending signup data:', signupData)

      const result = await WebhookService.sendSignupConfirmation(signupData)

      console.log('✅ Webhook result:', result)

      setWebhookResponse(result)

      if (result.success) {
        setTestResult(`✅ SUCCESS: Webhook sent successfully! 
Response ID: ${result.webhookId}
Timestamp: ${result.timestamp}`)
      } else {
        setTestResult(`❌ FAILED: ${result.error}`)
      }

    } catch (error) {
      console.error('❌ Test error:', error)
      setTestResult(`❌ ERROR: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testDirectWebhook = async () => {
    setIsLoading(true)
    setTestResult(null)
    setWebhookResponse(null)

    try {
      console.log('🔄 Testing webhook URL directly...')

      const directPayload = {
        test: true,
        name: formData.name,
        email: formData.email,
        timestamp: new Date().toISOString(),
        source: 'direct_test',
        message: 'Direct webhook test from test page'
      }

      const response = await fetch(currentWebhookUrl!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SiaMoon-PropertyManagement/1.0'
        },
        body: JSON.stringify(directPayload)
      })

      console.log('📡 Direct response status:', response.status)

      if (response.ok) {
        const responseText = await response.text()
        setTestResult(`✅ DIRECT SUCCESS: Status ${response.status}
Response: ${responseText}`)
        setWebhookResponse({ direct: true, status: response.status, response: responseText })
      } else {
        const errorText = await response.text()
        setTestResult(`❌ DIRECT FAILED: Status ${response.status}
Error: ${errorText}`)
      }

    } catch (error) {
      console.error('❌ Direct test error:', error)
      setTestResult(`❌ DIRECT ERROR: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  const generateRandomData = () => {
    const randomId = Math.floor(Math.random() * 1000)
    setFormData({
      name: `Test User ${randomId}`,
      email: `test${randomId}@example.com`,
      phone: `+123456${randomId}`,
      company: `Test Company ${randomId}`
    })
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Signup Webhook Test Page</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* Configuration Panel */}
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Webhook Configuration</CardTitle>
              <CardDescription className="text-neutral-400">
                Current webhook settings and environment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Signup Webhook URL
                </label>
                <div className="bg-gray-700 p-3 rounded-md text-sm font-mono break-all text-gray-300">
                  {currentWebhookUrl || 'Not configured'}
                </div>
                <Badge variant={currentWebhookUrl ? 'default' : 'destructive'} className="mt-2">
                  {currentWebhookUrl ? 'Configured' : 'Missing'}
                </Badge>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Environment
                </label>
                <div className="bg-gray-700 p-3 rounded-md text-sm text-gray-300">
                  {process.env.NODE_ENV || 'development'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  App URL
                </label>
                <div className="bg-gray-700 p-3 rounded-md text-sm text-gray-300">
                  {process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Data Form */}
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Test Data</CardTitle>
              <CardDescription className="text-neutral-400">
                Customize the test data for webhook payload
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Full Name
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Phone
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Company
                </label>
                <Input
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <Button
                onClick={generateRandomData}
                variant="outline"
                className="w-full"
              >
                Generate Random Data
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Test Actions */}
        <Card className="bg-neutral-900 border-neutral-800 mt-6">
          <CardHeader>
            <CardTitle className="text-white">Test Actions</CardTitle>
            <CardDescription className="text-neutral-400">
              Run different types of webhook tests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Button
                onClick={testSignupWebhook}
                disabled={isLoading || !currentWebhookUrl}
                className="h-20 flex flex-col items-center justify-center"
              >
                <span className="font-semibold">Full Signup Webhook Test</span>
                <span className="text-xs opacity-70">Complete payload via WebhookService</span>
              </Button>

              <Button
                onClick={testDirectWebhook}
                disabled={isLoading || !currentWebhookUrl}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
              >
                <span className="font-semibold">Direct Webhook Test</span>
                <span className="text-xs opacity-70">Simple payload directly to URL</span>
              </Button>
            </div>

            {!currentWebhookUrl && (
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                <p className="text-red-400 text-sm">
                  ⚠️ NEXT_PUBLIC_SIGNUP_WEBHOOK_URL is not configured in your environment file
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {(testResult || webhookResponse) && (
          <Card className="bg-neutral-900 border-neutral-800 mt-6">
            <CardHeader>
              <CardTitle className="text-white">Test Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {testResult && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Result
                  </label>
                  <div className="bg-gray-700 p-4 rounded-md text-sm font-mono whitespace-pre-wrap text-gray-300">
                    {testResult}
                  </div>
                </div>
              )}

              {webhookResponse && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Webhook Response
                  </label>
                  <div className="bg-gray-700 p-4 rounded-md text-sm font-mono text-gray-300">
                    <pre>{JSON.stringify(webhookResponse, null, 2)}</pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-neutral-900 border-neutral-800 mt-6">
          <CardHeader>
            <CardTitle className="text-white">Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-300">
            <div>
              <h4 className="font-semibold mb-2">Full Signup Webhook Test:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-400">
                <li>Uses the same WebhookService.sendSignupConfirmation() method as the real signup</li>
                <li>Sends comprehensive signup data including user info, preferences, and metadata</li>
                <li>Tests the complete email template generation</li>
                <li>Best for testing the actual signup email workflow</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Direct Webhook Test:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-400">
                <li>Sends a simple payload directly to the webhook URL</li>
                <li>Tests basic webhook connectivity and response</li>
                <li>Faster and simpler for connectivity testing</li>
                <li>Good for debugging Make.com scenario configuration</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">After Testing:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-400">
                <li>Check your Make.com scenario execution logs</li>
                <li>Verify email delivery if configured</li>
                <li>Review browser console for detailed logs</li>
                <li>Test the actual signup flow at /auth/signup</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
