'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import WebhookService, { SignupData } from '@/lib/webhookService'

export default function BrowserWebhookTest() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testWebhookInBrowser = async () => {
    setLoading(true)
    setResult('')
    
    console.log('🔍 Testing webhook directly in browser context...')
    console.log('🔍 Environment variables accessible in browser:')
    console.log('- NEXT_PUBLIC_SIGNUP_WEBHOOK_URL:', process.env.NEXT_PUBLIC_SIGNUP_WEBHOOK_URL)
    console.log('- NEXT_PUBLIC_MAKE_WEBHOOK_URL:', process.env.NEXT_PUBLIC_MAKE_WEBHOOK_URL)
    
    const testData: SignupData = {
      name: 'Browser Test User',
      email: 'browser.test@example.com',
      role: 'client',
      userId: 'browser-test-123',
      account_type: 'standard',
      subscription_plan: 'free',
      marketing_consent: true,
      signup_method: 'web_form',
      device_type: 'desktop',
      browser: 'Chrome',
      user_agent: navigator.userAgent,
      signup_date: new Date().toISOString(),
      email_verified: false,
      profile_completed: false,
      communication_preferences: ['email'],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language.split('-')[0],
      source: 'browser_test',
      utm_source: 'direct',
      utm_medium: 'test',
      utm_campaign: 'browser_test'
    }
    
    try {
      console.log('📞 Calling WebhookService.sendSignupConfirmation from browser...')
      const response = await WebhookService.sendSignupConfirmation(testData)
      console.log('📞 Browser webhook response:', response)
      
      if (response.success) {
        setResult(`✅ Browser webhook test successful! Webhook ID: ${response.webhookId}`)
      } else {
        setResult(`❌ Browser webhook test failed: ${response.error}`)
      }
    } catch (error) {
      console.error('❌ Browser webhook test error:', error)
      setResult(`❌ Browser webhook test error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Browser Webhook Test</h1>
        <p className="text-gray-300 mb-6">
          This test runs the webhook directly in the browser context to see if there are environment or context issues.
        </p>
        
        <Button
          onClick={testWebhookInBrowser}
          disabled={loading}
          className="mb-4"
        >
          {loading ? 'Testing...' : 'Test Webhook in Browser'}
        </Button>
        
        {result && (
          <div className={`p-4 rounded-lg ${
            result.includes('✅') ? 'bg-green-900/20 border border-green-700' : 'bg-red-900/20 border border-red-700'
          }`}>
            <p className={`text-sm ${result.includes('✅') ? 'text-green-400' : 'text-red-400'}`}>
              {result}
            </p>
          </div>
        )}
        
        <div className="mt-6 p-4 bg-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-2">Debug Info</h3>
          <div className="text-sm text-gray-300 space-y-1">
            <p><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
            <p><strong>User Agent:</strong> {typeof window !== 'undefined' ? navigator.userAgent : 'N/A'}</p>
            <p><strong>Timezone:</strong> {typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'N/A'}</p>
            <p><strong>Language:</strong> {typeof window !== 'undefined' ? navigator.language : 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
