'use client'

import React, { useState } from 'react'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'

/**
 * Test page for debugging forgot password functionality
 * This page provides detailed logging and testing capabilities
 */
export default function TestForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `[${timestamp}] ${message}`
    console.log(logMessage)
    setLogs(prev => [...prev, logMessage])
  }

  const testFirebaseConfig = () => {
    addLog('🔧 Testing Firebase Configuration...')
    addLog(`Auth Domain: ${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}`)
    addLog(`Project ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`)
    addLog(`Auth initialized: ${auth ? 'Yes' : 'No'}`)
    
    if (auth) {
      addLog(`Current user: ${auth.currentUser?.email || 'None'}`)
      addLog(`Auth app name: ${auth.app.name}`)
    }
  }

  const testPasswordReset = async () => {
    if (!email) {
      addLog('❌ Please enter an email address')
      return
    }

    setIsLoading(true)
    addLog(`🔄 Testing password reset for: ${email}`)

    try {
      // Test 1: Basic password reset
      addLog('📧 Sending basic password reset email...')
      await sendPasswordResetEmail(auth!, email)
      addLog('✅ Basic password reset email sent successfully')

      // Test 2: Password reset with action code settings
      addLog('📧 Sending password reset with custom settings...')
      const actionCodeSettings = {
        url: `${window.location.origin}/auth/reset-password`,
        handleCodeInApp: true,
      }
      
      await sendPasswordResetEmail(auth!, email, actionCodeSettings)
      addLog('✅ Password reset with custom settings sent successfully')
      addLog(`📍 Reset URL: ${actionCodeSettings.url}`)

    } catch (error: any) {
      addLog(`❌ Error: ${error.code || 'Unknown error'}`)
      addLog(`❌ Message: ${error.message || 'No message'}`)
      
      if (error.code === 'auth/user-not-found') {
        addLog('💡 Suggestion: Make sure the email address has an account')
      } else if (error.code === 'auth/invalid-email') {
        addLog('💡 Suggestion: Check email format')
      } else if (error.code === 'auth/configuration-not-found') {
        addLog('💡 Suggestion: Check Firebase Console email settings')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">Forgot Password Debug Tool</CardTitle>
            <CardDescription className="text-neutral-400">
              Test and debug the forgot password functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={testFirebaseConfig} variant="outline">
                Test Firebase Config
              </Button>
              <Button onClick={clearLogs} variant="ghost">
                Clear Logs
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">
                Test Email Address
              </label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email to test"
                  className="flex-1"
                />
                <Button 
                  onClick={testPasswordReset}
                  disabled={isLoading || !email}
                >
                  {isLoading ? 'Testing...' : 'Test Reset'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">Debug Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black p-4 rounded-lg max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-neutral-500">No logs yet. Click "Test Firebase Config" to start.</p>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, index) => (
                    <div key={index} className="text-sm font-mono text-green-400">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">Firebase Console Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-neutral-300 space-y-2">
              <p><strong>To fix password reset emails, check these Firebase Console settings:</strong></p>
              
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Go to Firebase Console → Authentication → Templates</li>
                <li>Click on "Password reset" template</li>
                <li>Make sure the template is enabled</li>
                <li>Check the "Action URL" is set correctly</li>
                <li>Verify the sender email is configured</li>
                <li>Test with a real email address that has an account</li>
              </ol>

              <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700 rounded">
                <p className="text-yellow-400 text-sm">
                  <strong>Common Issues:</strong><br/>
                  • Email template not enabled in Firebase Console<br/>
                  • Sender email not verified<br/>
                  • Domain not authorized<br/>
                  • User account doesn't exist
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
