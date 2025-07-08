'use client'

import { useState, useEffect } from 'react'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'


/**
 * Firebase Email Test Page
 * 
 * This page helps test Firebase email configuration
 * and troubleshoot email delivery issues.
 */
export default function TestFirebaseEmailPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>('')
  const [currentUrl, setCurrentUrl] = useState<string>('')

  // Set current URL on client side only to avoid hydration mismatch
  useEffect(() => {
    setCurrentUrl(window.location.origin)
  }, [])

  const testPasswordResetEmail = async () => {
    if (!email) {
      setResult('❌ Please enter an email address')
      return
    }

    setLoading(true)
    setResult('')

    try {
      console.log('🔄 Testing Firebase password reset email...')
      console.log('📧 Email:', email)
      console.log('🔥 Firebase Auth Domain:', auth.app.options.authDomain)
      console.log('🔥 Firebase Project ID:', auth.app.options.projectId)

      // Send password reset email with action code settings
      const actionCodeSettings = {
        url: `${currentUrl}/auth/reset-password`,
        handleCodeInApp: false, // This should be false for email links
      }

      console.log('🔧 Action Code Settings:', actionCodeSettings)
      await sendPasswordResetEmail(auth, email, actionCodeSettings)

      const successMessage = `✅ Password reset email sent successfully to ${email}!\n\nCheck your inbox and spam folder. The email may take 1-2 minutes to arrive.`
      console.log(successMessage)
      setResult(successMessage)

    } catch (error: any) {
      console.error('❌ Firebase email error:', error)
      
      let errorMessage = 'Unknown error occurred'
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = '❌ No user found with this email address'
          break
        case 'auth/invalid-email':
          errorMessage = '❌ Invalid email address format'
          break
        case 'auth/too-many-requests':
          errorMessage = '❌ Too many requests. Please try again later.'
          break
        case 'auth/network-request-failed':
          errorMessage = '❌ Network error. Check your internet connection.'
          break
        default:
          errorMessage = `❌ Firebase Error: ${error.code} - ${error.message}`
      }
      
      setResult(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔥 Firebase Email Test</h1>
        
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Password Reset Email</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email to test"
                className="bg-neutral-800 border-neutral-700"
              />
            </div>
            
            <Button
              onClick={testPasswordResetEmail}
              disabled={loading || !email}
              className="w-full"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending Test Email...
                </>
              ) : (
                'Send Test Password Reset Email'
              )}
            </Button>
          </div>
        </div>

        {result && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-2">Test Result</h3>
            <pre className="text-sm text-gray-300 whitespace-pre-wrap">{result}</pre>
          </div>
        )}

        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">🔧 Firebase Configuration Debug</h3>
          <div className="space-y-2 text-sm text-gray-300">
            <p><strong>Auth Domain:</strong> {auth.app.options.authDomain}</p>
            <p><strong>Project ID:</strong> {auth.app.options.projectId}</p>
            <p><strong>API Key:</strong> {auth.app.options.apiKey?.substring(0, 10)}...</p>
            <p><strong>Current URL:</strong> {currentUrl || 'Loading...'}</p>
          </div>
        </div>

        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4 text-yellow-400">⚠️ Common Issues & Solutions</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>• <strong>No email received:</strong> Check Firebase Console → Authentication → Templates</li>
            <li>• <strong>User not found:</strong> Make sure the email exists in Firebase Auth</li>
            <li>• <strong>Action URL not set:</strong> Configure custom action URL in Firebase Console</li>
            <li>• <strong>Domain not authorized:</strong> Add domain to authorized domains list</li>
            <li>• <strong>Check spam folder:</strong> Firebase emails might go to spam</li>
          </ul>
        </div>

        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4 text-blue-400">📋 Firebase Console Setup Steps</h3>
          <ol className="space-y-2 text-sm text-gray-300 list-decimal list-inside">
            <li>Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">Firebase Console</a></li>
            <li>Select project: <code className="bg-neutral-800 px-2 py-1 rounded">operty-b54dc</code></li>
            <li>Navigate to <strong>Authentication</strong> → <strong>Templates</strong></li>
            <li>Click <strong>Password reset</strong> → <strong>Edit template</strong> (pencil icon)</li>
            <li><strong>IMPORTANT:</strong> Look for "Customize action URL" field</li>
            <li>Set Action URL to: <code className="bg-neutral-800 px-2 py-1 rounded">http://localhost:3000/auth/reset-password</code></li>
            <li>The %LINK% in the email template will be replaced with this URL + parameters</li>
            <li>Click <strong>Save</strong> button</li>
            <li>Test with this page</li>
          </ol>
        </div>

        <div className="bg-green-900/20 border border-green-700 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4 text-green-400">✅ What %LINK% Means</h3>
          <div className="space-y-2 text-sm text-gray-300">
            <p><strong>%LINK%</strong> is a Firebase template variable that gets replaced with:</p>
            <code className="block bg-neutral-800 p-2 rounded mt-2 text-xs">
              http://localhost:3000/auth/reset-password?mode=resetPassword&oobCode=ABC123&continueUrl=...
            </code>
            <p className="mt-2">When users click this link in their email, they'll be taken to your password reset page with the necessary parameters to complete the reset.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
