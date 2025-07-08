'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

export default function TestSignupDirectPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string>('')

  const testWebhookDirect = async () => {
    setIsLoading(true)
    setResult('')

    try {
      console.log('🚀 Testing webhook directly...')
      
      const webhookUrl = 'https://hook.eu2.make.com/fm7r9zvvcoj2hy3rj11as0uto5vj626i'
      
      const testData = {
        // Core user information (required by email template)
        name: 'Test Property Manager',
        email: 'test.manager@example.com',
        userId: 'test-' + Date.now(),
        signup_date: new Date().toISOString(),

        // Account details (used in email template)
        account_type: 'Standard Property Manager',
        subscription_plan: 'Free Trial',
        role: 'property_manager',

        // Business information
        business_type: 'Property Management',
        experience_level: 'New User',
        property_count: '0',
        primary_goals: ['Property Management', 'Booking Automation', 'Client Communication'],

        // Contact and preferences
        phone: '+66-123-456-789',
        marketing_consent: true,
        communication_preferences: ['email', 'dashboard'],

        // Technical details
        signup_method: 'Direct Test',
        device_type: 'Desktop',
        browser: 'Chrome',
        user_agent: navigator.userAgent,
        ip_address: 'Test Environment',

        // Location and preferences
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: 'en',

        // Status flags
        email_verified: false,
        profile_completed: false,
        onboarding_completed: false,

        // Source tracking
        source: 'Direct Test',
        referral_source: 'Manual Testing',
        utm_source: 'test',
        utm_medium: 'direct',
        utm_campaign: 'webhook_test',
        campaign_id: 'test_campaign_2025',

        // Automation flags for Make.com
        welcome_email_needed: true,
        onboarding_sequence: 'new_property_manager',
        follow_up_days: [1, 3, 7, 14],
        trial_period_days: 30,
        next_action: 'send_welcome_email',
        user_segment: 'Test User',

        // Setup flags
        needs_tutorial: true,
        demo_property_setup: true,
        initial_setup_complete: false,

        // System metadata
        submission_type: 'direct_test',
        timestamp: new Date().toISOString(),
        environment: 'development'
      }

      console.log('📦 Sending data:', testData)
      console.log('🌐 To URL:', webhookUrl)

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SiaMoon-PropertyManagement/1.0'
        },
        body: JSON.stringify(testData)
      })

      console.log('📡 Response status:', response.status)
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Response error:', errorText)
        setResult(`❌ Webhook failed: ${response.status} - ${errorText}`)
        return
      }

      const responseText = await response.text()
      console.log('✅ Response text:', responseText)
      setResult(`✅ Webhook success! Status: ${response.status}, Response: ${responseText}`)

    } catch (error) {
      console.error('❌ Error:', error)
      setResult(`❌ Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Direct Webhook Test</h1>
        
        <div className="space-y-6">
          <div className="bg-neutral-900 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Test Signup Webhook Directly</h2>
            <p className="text-neutral-400 mb-4">
              This will send a POST request directly to the Make.com webhook URL:
            </p>
            <code className="text-sm bg-neutral-800 p-2 rounded block mb-4">
              https://hook.eu2.make.com/fm7r9zvvcoj2hy3rj11as0uto5vj626i
            </code>
            
            <Button
              onClick={testWebhookDirect}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Testing...' : 'Test Webhook Now'}
            </Button>
          </div>

          {result && (
            <div className="bg-neutral-900 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Result:</h3>
              <pre className="text-sm whitespace-pre-wrap">{result}</pre>
            </div>
          )}

          <div className="bg-neutral-900 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside space-y-2 text-neutral-300">
              <li>Click the test button above</li>
              <li>Open browser console (F12) to see detailed logs</li>
              <li>Check your Make.com scenario execution history</li>
              <li>Check your email for any test messages</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
