'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

/**
 * ResetPasswordPage Component
 *
 * Handles the password reset process when users click the link from their email.
 * This page processes the Firebase action codes and allows users to set a new password.
 *
 * URL Parameters:
 * - mode: Should be 'resetPassword'
 * - oobCode: The one-time operation code from Firebase
 * - continueUrl: Optional redirect URL after successful reset
 * - lang: Optional locale parameter
 *
 * Flow:
 * 1. Verify the action code (oobCode) with Firebase
 * 2. If valid, show password reset form
 * 3. Confirm password reset with new password
 * 4. Redirect to sign-in page on success
 */
function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // URL parameters from Firebase email link
  const mode = searchParams.get('mode')           // Should be 'resetPassword'
  const oobCode = searchParams.get('oobCode')     // The one-time operation code
  const continueUrl = searchParams.get('continueUrl') // Optional: redirect URL after reset
  // const lang = searchParams.get('lang')           // Optional: locale (unused)

  // Component state
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isValidCode, setIsValidCode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resetComplete, setResetComplete] = useState(false)

  /**
   * Verify the password reset code on component mount
   */
  useEffect(() => {
    if (mode === 'resetPassword' && oobCode) {
      console.log('🔄 Verifying password reset code...')

      // Step 1: Verify the action code (oobCode)
      if (!auth) {
        throw new Error('Firebase auth not initialized')
      }
      verifyPasswordResetCode(auth, oobCode)
        .then((emailFromCode) => {
          console.log('✅ Password reset code verified for:', emailFromCode)
          setEmail(emailFromCode)
          setIsValidCode(true)
          setLoading(false)
          setMessage(`Please set a new password for ${emailFromCode}.`)
        })
        .catch((err) => {
          console.error('❌ Error verifying password reset code:', err)

          // Handle specific verification errors
          if (err.code === 'auth/expired-action-code') {
            setError('This password reset link has expired. Please request a new one.')
          } else if (err.code === 'auth/invalid-action-code') {
            setError('This password reset link is invalid. Please request a new one.')
          } else if (err.code === 'auth/user-disabled') {
            setError('This account has been disabled. Please contact support.')
          } else {
            setError('Invalid or expired password reset link. Please request a new one.')
          }
          setLoading(false)
        })
    } else {
      // If mode or oobCode are missing, it's an invalid access
      console.error('❌ Invalid access to password reset page')
      setError('Invalid access to password reset page. Please use the link from your email.')
      setLoading(false)
    }
  }, [mode, oobCode])

  /**
   * Handle password reset form submission
   */
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setIsSubmitting(true)

    // Validation
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.')
      setIsSubmitting(false)
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.')
      setIsSubmitting(false)
      return
    }

    // Additional password strength validation
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one number.')
      setIsSubmitting(false)
      return
    }

    try {
      console.log('🔄 Confirming password reset...')

      // Step 2: Confirm the password reset with the new password
      if (!auth) {
        throw new Error('Firebase auth not initialized')
      }
      await confirmPasswordReset(auth, oobCode!, newPassword)

      console.log('✅ Password reset successful')
      setMessage('Your password has been successfully reset! You can now sign in with your new password.')
      setResetComplete(true)

      // Clear form fields after success
      setNewPassword('')
      setConfirmNewPassword('')
      setIsValidCode(false)

      // Show success toast
      toast.success('Password reset successful!')

      // Redirect after a delay
      setTimeout(() => {
        if (continueUrl && typeof window !== 'undefined') {
          window.location.href = continueUrl
        } else {
          router.push('/auth/login')
        }
      }, 3000)

    } catch (err: unknown) {
      console.error('❌ Error confirming password reset:', err)

      // Handle specific confirmation errors
      if (err && typeof err === 'object' && 'code' in err) {
        const firebaseError = err as { code: string; message?: string }
        
        if (firebaseError.code === 'auth/expired-action-code') {
          setError('The password reset link has expired. Please request a new one.')
        } else if (firebaseError.code === 'auth/invalid-action-code') {
          setError('The password reset link is invalid. Please request a new one.')
        } else if (firebaseError.code === 'auth/user-disabled') {
          setError('Your account has been disabled. Please contact support.')
        } else if (firebaseError.code === 'auth/weak-password') {
          setError('The password is too weak. Please choose a stronger password.')
        } else {
          setError(firebaseError.message || 'Failed to reset password. Please try again.')
        }
      } else {
        setError('Failed to reset password. Please try again.')
      }

      toast.error('Failed to reset password')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="bg-neutral-900 border-neutral-800 w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-neutral-400">Verifying password reset link...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state - invalid or expired link
  if (error && !isValidCode) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="bg-neutral-900 border-neutral-800 w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white flex items-center justify-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-500" />
              Password Reset Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>

            <div className="space-y-3">
              <Link href="/auth/forgot-password">
                <Button className="w-full">
                  Request New Reset Link
                </Button>
              </Link>

              <Link href="/auth/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="bg-neutral-900 border-neutral-800 w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            <Lock className="h-6 w-6" />
            {resetComplete ? 'Password Reset Complete' : 'Reset Your Password'}
          </CardTitle>
          <CardDescription className="text-neutral-400">
            {resetComplete
              ? 'Your password has been successfully updated'
              : `Setting new password for ${email}`
            }
          </CardDescription>
        </CardHeader>

        <CardContent>
          {resetComplete ? (
            // Success state
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">Success!</h3>
                <p className="text-sm text-neutral-400">
                  Your password has been successfully reset. You can now sign in with your new password.
                </p>
                <p className="text-xs text-neutral-500">
                  Redirecting to sign in page in a few seconds...
                </p>
              </div>

              <Link href="/auth/login">
                <Button className="w-full">
                  Continue to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            // Password reset form
            <form onSubmit={handleReset} className="space-y-6">
              {/* Success Message */}
              {message && (
                <div className="p-3 bg-green-900/20 border border-green-700 rounded-lg">
                  <p className="text-sm text-green-400">{message}</p>
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

              {/* New Password Field */}
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    id="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="pl-10 pr-10"
                    required
                    disabled={isSubmitting}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  Must be at least 6 characters with uppercase, lowercase, and number
                </p>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirm-new-password" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirm-new-password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="pl-10 pr-10"
                    required
                    disabled={isSubmitting}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting || !newPassword || !confirmNewPassword}
                fullWidth
                className="flex items-center justify-center h-11 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Resetting Password...
                  </>
                ) : (
                  'Reset Password'
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}
