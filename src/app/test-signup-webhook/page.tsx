'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import WebhookService from '@/lib/webhookService'
import toast from 'react-hot-toast'

export default function TestSignupWebhookPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [testEmail, setTestEmail] = useState('test@example.com')
  const [testName, setTestName] = useState('Test User')
  const [lastResponse, setLastResponse] = useState<any>(null)

  const testSignupWebhook = async () => {
    try {
      setIsLoading(true)
      console.log('🧪 Testing signup webhook...')

      const response = await WebhookService.sendSignupConfirmation({
        name: testName,
        email: testEmail,
        userId: 'test-user-' + Date.now()
      })

      setLastResponse(response)

      if (response.success) {
        toast.success('✅ Signup webhook test successful!')
        console.log('✅ Signup webhook test successful:', response)
      } else {
        toast.error('❌ Signup webhook test failed: ' + response.error)
        console.error('❌ Signup webhook test failed:', response)
      }
    } catch (error) {
      console.error('❌ Signup webhook test error:', error)
      toast.error('❌ Signup webhook test error: ' + (error as Error).message)
      setLastResponse({ error: (error as Error).message })
    } finally {
      setIsLoading(false)
    }
  }

  const testGeneralWebhook = async () => {
    try {
      setIsLoading(true)
      console.log('🧪 Testing general webhook...')

      const response = await WebhookService.testWebhook()
      setLastResponse(response)

      if (response.success) {
        toast.success('✅ General webhook test successful!')
        console.log('✅ General webhook test successful:', response)
      } else {
        toast.error('❌ General webhook test failed: ' + response.error)
        console.error('❌ General webhook test failed:', response)
      }
    } catch (error) {
      console.error('❌ General webhook test error:', error)
      toast.error('❌ General webhook test error: ' + (error as Error).message)
      setLastResponse({ error: (error as Error).message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Signup Webhook Testing</h1>
          <p className="text-gray-400">Test the Make.com webhook integration for signup confirmations</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Controls */}
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Test Signup Webhook</CardTitle>
              <CardDescription className="text-gray-400">
                Send a test signup confirmation email via Make.com webhook
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Test Email
                </label>
                <Input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Enter test email"
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Test Name
                </label>
                <Input
                  type="text"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="Enter test name"
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={testSignupWebhook}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? 'Testing...' : 'Test Signup Webhook'}
                </Button>

                <Button
                  onClick={testGeneralWebhook}
                  disabled={isLoading}
                  variant="outline"
                  className="flex-1"
                >
                  {isLoading ? 'Testing...' : 'Test General Webhook'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Response Display */}
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Last Response</CardTitle>
              <CardDescription className="text-gray-400">
                Response from the webhook service
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lastResponse ? (
                <pre className="bg-neutral-800 p-4 rounded-lg text-sm text-gray-300 overflow-auto">
                  {JSON.stringify(lastResponse, null, 2)}
                </pre>
              ) : (
                <p className="text-gray-500 italic">No response yet. Run a test to see results.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Webhook Configuration Info */}
        <Card className="bg-neutral-900 border-neutral-800 mt-8">
          <CardHeader>
            <CardTitle className="text-white">Webhook Configuration</CardTitle>
            <CardDescription className="text-gray-400">
              Current webhook settings and URLs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Signup Webhook URL</h4>
                <code className="bg-neutral-800 px-3 py-2 rounded text-sm text-gray-300 block">
                  https://hook.eu2.make.com/7ed8ib93t7f5l3mvko2i35rkdn30i9cx
                </code>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Environment Variable</h4>
                <code className="bg-neutral-800 px-3 py-2 rounded text-sm text-gray-300 block">
                  NEXT_PUBLIC_MAKE_WEBHOOK_URL
                </code>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Integration Status</h4>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-300">Webhook service integrated into SignUpForm</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Integration Flow</h4>
                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">1.</span>
                    <span>User fills out signup form</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">2.</span>
                    <span>Firebase creates user account</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">3.</span>
                    <span>User profile saved to Firestore</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">4.</span>
                    <span>Webhook sends signup confirmation email</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">5.</span>
                    <span>User redirected to dashboard</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
