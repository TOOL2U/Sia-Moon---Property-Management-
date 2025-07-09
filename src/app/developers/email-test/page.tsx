'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ExternalLink, Mail, Send, Eye, TestTube } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EmailTestPage() {
  const [testEmail, setTestEmail] = useState('test@example.com')
  const [testName, setTestName] = useState('Test User')
  const [loading, setLoading] = useState(false)
  const [lastResult, setLastResult] = useState<{ success: boolean; error?: string; webhookId?: string; timestamp?: string } | null>(null)

  const sendTestEmail = async () => {
    if (!testEmail || !testName) {
      toast.error('Please enter both email and name')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/test-email?action=send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          name: testName
        })
      })

      const result = await response.json()
      setLastResult(result)

      if (result.success) {
        toast.success('Test email sent successfully!')
      } else {
        toast.error(`Email failed: ${result.error}`)
      }
    } catch (error) {
      toast.error('Failed to send test email')
      console.error('Test email error:', error)
    } finally {
      setLoading(false)
    }
  }

  const testWebhook = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-email?action=webhook-test')
      const result = await response.json()
      setLastResult(result)

      if (result.success) {
        toast.success('Webhook connection test successful!')
      } else {
        toast.error(`Webhook test failed: ${result.error}`)
      }
    } catch (error) {
      toast.error('Webhook test failed')
      console.error('Webhook test error:', error)
    } finally {
      setLoading(false)
    }
  }

  const testOnboardingEmail = async () => {
    if (!testEmail || !testName) {
      toast.error('Please enter both email and name')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/test-email?action=onboarding&name=${encodeURIComponent(testName)}&email=${encodeURIComponent(testEmail)}`)
      const result = await response.json()
      setLastResult(result)

      if (result.success) {
        toast.success('Onboarding survey email sent successfully!')
      } else {
        toast.error(`Onboarding email failed: ${result.error}`)
      }
    } catch (error) {
      toast.error('Failed to send onboarding email')
      console.error('Onboarding email error:', error)
    } finally {
      setLoading(false)
    }
  }

  const previewEmail = () => {
    const previewUrl = `/api/test-email?action=preview&name=${encodeURIComponent(testName)}&email=${encodeURIComponent(testEmail)}`
    window.open(previewUrl, '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Email System Test</h1>
          <p className="text-gray-400">Test signup confirmation emails and webhook integration</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Test Controls */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Mail className="h-5 w-5" />
                Email Test Controls
              </CardTitle>
              <CardDescription className="text-gray-400">
                Test the signup confirmation email system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Test Email Address
                </label>
                <Input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Test User Name
                </label>
                <Input
                  type="text"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="Test User"
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>

              <hr className="border-gray-600" />

              <div className="space-y-2">
                <Button
                  onClick={previewEmail}
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                  disabled={loading}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Email Template
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>

                <Button
                  onClick={sendTestEmail}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={loading || !testEmail || !testName}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {loading ? 'Sending...' : 'Send Test Email'}
                </Button>

                <Button
                  onClick={testOnboardingEmail}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  disabled={loading || !testEmail || !testName}
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  {loading ? 'Sending...' : 'Send Onboarding Survey Email'}
                </Button>

                <Button
                  onClick={testWebhook}
                  variant="secondary"
                  className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300"
                  disabled={loading}
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  {loading ? 'Testing...' : 'Test Webhook Connection'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Webhook Info */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Webhook Configuration</CardTitle>
              <CardDescription className="text-gray-400">
                Make.com webhook integration details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Signup Confirmation Webhook
                </label>
                <div className="bg-gray-700 p-3 rounded-md text-sm font-mono break-all text-gray-300">
                  https://hook.eu2.make.com/7ed8ib93t7f5l3mvko2i35rkdn30i9cx
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Onboarding Survey Webhook
                </label>
                <div className="bg-gray-700 p-3 rounded-md text-sm font-mono break-all text-gray-300">
                  https://hook.eu2.make.com/b59iga7bj65atyrgo5ej9dwvlujdsupa
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email Template Features
                </label>
                <div className="space-y-2">
                  <div className="mb-3">
                    <span className="text-xs text-gray-400 uppercase tracking-wide">Signup Email:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="secondary" className="bg-blue-700 text-blue-100">Welcome Message</Badge>
                      <Badge variant="secondary" className="bg-blue-700 text-blue-100">Feature Overview</Badge>
                      <Badge variant="secondary" className="bg-blue-700 text-blue-100">Quick Start Guide</Badge>
                    </div>
                  </div>
                  <div className="mb-3">
                    <span className="text-xs text-gray-400 uppercase tracking-wide">Onboarding Email:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="secondary" className="bg-green-700 text-green-100">Survey Summary</Badge>
                      <Badge variant="secondary" className="bg-green-700 text-green-100">Personalized Steps</Badge>
                      <Badge variant="secondary" className="bg-green-700 text-green-100">Premium Trial</Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 uppercase tracking-wide">Both Templates:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="secondary" className="bg-gray-700 text-gray-300">Professional Design</Badge>
                      <Badge variant="secondary" className="bg-gray-700 text-gray-300">Mobile Responsive</Badge>
                      <Badge variant="secondary" className="bg-gray-700 text-gray-300">Dark Theme</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Payload Structure
                </label>
                <div className="bg-gray-700 p-3 rounded-md text-xs font-mono">
                  <pre className="text-gray-300">{`{
  "to": "user@example.com",
  "subject": "Welcome to Sia Moon...",
  "html": "<html>...</html>",
  "text": "Plain text version",
  "type": "signup_confirmation",
  "userData": {
    "name": "User Name",
    "email": "user@example.com",
    "role": "client",
    "userId": "user-id"
  }
}`}</pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Results */}
        {lastResult && (
          <Card className="mt-6 bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <TestTube className="h-5 w-5" />
                Last Test Result
                <Badge variant={lastResult.success ? "default" : "destructive"}
                       className={lastResult.success ? "bg-green-600 text-white" : "bg-red-600 text-white"}>
                  {lastResult.success ? "Success" : "Failed"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-700 p-4 rounded-md">
                <pre className="text-sm overflow-auto text-gray-300">
                  {JSON.stringify(lastResult, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="mt-6 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Integration Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-white mb-2">How it works:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-300">
                <li>User completes signup form or onboarding survey</li>
                <li>Account is created (development or production mode)</li>
                <li>Webhook is triggered to appropriate Make.com endpoint</li>
                <li>Make.com processes the webhook and sends the email</li>
                <li>User receives personalized email based on action</li>
              </ol>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-2">Signup Email includes:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                <li>Personalized welcome message</li>
                <li>Direct link to client dashboard</li>
                <li>Feature overview and benefits</li>
                <li>Quick start guide with next steps</li>
                <li>Professional Sia Moon branding</li>
                <li>Support contact information</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-2">Onboarding Email includes:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                <li>Survey response summary</li>
                <li>Personalized recommendations</li>
                <li>30-day premium trial bonus</li>
                <li>Customized next steps</li>
                <li>Multiple support options</li>
                <li>Professional completion confirmation</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
