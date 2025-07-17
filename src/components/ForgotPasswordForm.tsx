'use client'

import React, { useState } from 'react'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { clientToast as toast } from '@/utils/clientToast'

interface ForgotPasswordFormProps {
  onEmailSent?: () => void // Optional callback for parent component
  className?: string
}

/**
 * ForgotPasswordForm Component
 * 
 * Provides a standalone form for users to request password reset emails.
 * Integrates with Firebase Authentication's sendPasswordResetEmail function.
 * 
 * Features:
 * - Email validation
 * - Loading states
 * - Error handling with user-friendly messages
 * - Success confirmation
 * - Responsive design matching app theme
 */
export default function ForgotPasswordForm({ onEmailSent, className = '' }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  /**
   * Handle password reset email submission
   */
  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setError(null)
    setIsLoading(true)

    // Basic validation
    if (!email) {
      setError('Please enter your email address.')
      setIsLoading(false)
      return
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.')
      setIsLoading(false)
      return
    }

    try {
      console.log('🔄 Sending password reset email to:', email)
      console.log('🔧 Firebase Auth Domain:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN)

      // Send password reset email with custom action code settings
      if (!auth) {
        throw new Error('Firebase auth not initialized')
      }

      // Configure action code settings for better email handling
      const actionCodeSettings = {
        // URL you want to redirect back to. The domain (www.example.com) for this
        // URL must be in the authorized domains list in the Firebase Console.
        url: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/reset-password`,
        // This must be true
        handleCodeInApp: true,
      }

      await sendPasswordResetEmail(auth, email, actionCodeSettings)

      console.log('✅ Password reset email sent successfully')
      console.log('📧 Reset URL will redirect to:', actionCodeSettings.url)

      setMessage('Password reset email sent! Check your inbox (and spam folder).')
      setEmailSent(true)
      setEmail('') // Clear the input field

      // Show success toast
      toast.success('Password reset email sent! Check your inbox.')

      // Call optional callback
      onEmailSent?.()
      
    } catch (err: unknown) {
      console.error('❌ Error sending password reset email:', err)

      // Provide user-friendly error messages based on Firebase error codes
      if (err && typeof err === 'object' && 'code' in err) {
        const firebaseError = err as { code: string; message?: string }
        console.error('🔥 Firebase Error Code:', firebaseError.code)
        console.error('🔥 Firebase Error Message:', firebaseError.message)

        if (firebaseError.code === 'auth/user-not-found') {
          setError('No account found with this email address. Please check your spelling or create a new account.')
        } else if (firebaseError.code === 'auth/invalid-email') {
          setError('The email address is invalid. Please enter a valid email.')
        } else if (firebaseError.code === 'auth/too-many-requests') {
          setError('Too many password reset requests. Please wait a few minutes before trying again.')
        } else if (firebaseError.code === 'auth/network-request-failed') {
          setError('Network error. Please check your internet connection and try again.')
        } else if (firebaseError.code === 'auth/configuration-not-found') {
          setError('Email configuration not found. Please contact support.')
        } else if (firebaseError.code === 'auth/unauthorized-domain') {
          setError('This domain is not authorized for password reset. Please contact support.')
        } else {
          setError(`Error: ${firebaseError.message || 'Unknown error'}. If this persists, please contact support.`)
        }
      } else {
        setError('Failed to send password reset email. Please try again or contact support.')
      }

      // Show error toast with more details
      toast.error('Failed to send password reset email. Check console for details.')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Reset form to initial state
   */
  const resetForm = () => {
    setEmail('')
    setMessage(null)
    setError(null)
    setEmailSent(false)
  }

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            <Mail className="h-6 w-6" />
            Forgot Password
          </CardTitle>
          <CardDescription className="text-neutral-400">
            {emailSent 
              ? "We've sent you a password reset link"
              : "Enter your email to receive a password reset link"
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {emailSent ? (
            // Success state
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">Email Sent!</h3>
                <p className="text-sm text-neutral-400">
                  We&apos;ve sent a password reset link to your email address. 
                  Click the link in the email to reset your password.
                </p>
                <p className="text-xs text-neutral-500">
                  Don&apos;t see the email? Check your spam folder or wait a few minutes.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={resetForm}
                  variant="outline"
                  className="w-full"
                >
                  Send Another Email
                </Button>
                
                <Link href="/auth/login">
                  <Button variant="ghost" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            // Form state
            <form onSubmit={handleSendResetEmail} className="space-y-6">
              {/* Success Message */}
              {message && (
                <div className="p-3 bg-green-900/20 border border-green-700 rounded-lg">
                  <p className="text-sm text-green-400 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    {message}
                  </p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg">
                  <p className="text-sm text-red-400 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </p>
                </div>
              )}

              {/* Email Input */}
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="email"
                    id="reset-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="pl-10"
                    required
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || !email}
                className="flex items-center justify-center h-11 disabled:opacity-50 disabled:cursor-not-allowed w-full"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending Reset Link...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>

              {/* Back to Sign In Link */}
              <div className="text-center">
                <Link
                  href="/auth/login"
                  className="text-sm text-primary-400 hover:text-primary-300 transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
