'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { clientToast as toast } from '@/utils/clientToast'
// TODO: Replace with Firebase Auth
// import { auth } from '@/lib/firebase'

function UpdatePasswordContent() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check if we have the necessary tokens from the URL
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    
    if (!accessToken || !refreshToken) {
      toast.error('Invalid password reset link')
      router.push('/auth/login')
    }
  }, [searchParams, router])

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)

    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChars,
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChars
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate password strength
    const validation = validatePassword(password)
    if (!validation.isValid) {
      setError('Password does not meet security requirements')
      return
    }

    setLoading(true)

    try {
      // TODO: Replace with Firebase Auth
      // await updatePassword(auth.currentUser, password)

      console.log('⚠️ Password update not implemented - Firebase integration needed')
      toast.error('Password update functionality requires Firebase integration')
      
      // For now, show success state for UI testing
      setSuccess(true)
      
      // Redirect to login after a delay
      setTimeout(() => {
        router.push('/auth/login?message=password-updated')
      }, 2000)

    } catch (error) {
      console.error('Password update error:', error)
      setError(error instanceof Error ? error.message : 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card className="border-neutral-800 bg-neutral-950">
            <CardHeader className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-950 mb-4">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <CardTitle className="text-white">Password Updated</CardTitle>
              <CardDescription className="text-neutral-400">
                Your password has been successfully updated
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-neutral-400 mb-4">
                You can now sign in with your new password.
              </p>
              <p className="text-xs text-neutral-500">
                Redirecting to sign in page...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const passwordValidation = validatePassword(password)

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card className="border-neutral-800 bg-neutral-950">
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-neutral-900 mb-4">
              <Lock className="h-6 w-6 text-primary-400" />
            </div>
            <CardTitle className="text-white">Update Your Password</CardTitle>
            <CardDescription className="text-neutral-400">
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <div className="relative">
                  <Input
                    label="New Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your new password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-9 text-neutral-400 hover:text-white transition-colors duration-200"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {/* Password Requirements */}
                {password && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-neutral-400">Password requirements:</p>
                    <div className="grid grid-cols-1 gap-1 text-xs">
                      <div className={`flex items-center ${passwordValidation.minLength ? 'text-green-400' : 'text-neutral-500'}`}>
                        <span className="mr-2">{passwordValidation.minLength ? '✓' : '○'}</span>
                        At least 8 characters
                      </div>
                      <div className={`flex items-center ${passwordValidation.hasUpperCase ? 'text-green-400' : 'text-neutral-500'}`}>
                        <span className="mr-2">{passwordValidation.hasUpperCase ? '✓' : '○'}</span>
                        One uppercase letter
                      </div>
                      <div className={`flex items-center ${passwordValidation.hasLowerCase ? 'text-green-400' : 'text-neutral-500'}`}>
                        <span className="mr-2">{passwordValidation.hasLowerCase ? '✓' : '○'}</span>
                        One lowercase letter
                      </div>
                      <div className={`flex items-center ${passwordValidation.hasNumbers ? 'text-green-400' : 'text-neutral-500'}`}>
                        <span className="mr-2">{passwordValidation.hasNumbers ? '✓' : '○'}</span>
                        One number
                      </div>
                      <div className={`flex items-center ${passwordValidation.hasSpecialChars ? 'text-green-400' : 'text-neutral-500'}`}>
                        <span className="mr-2">{passwordValidation.hasSpecialChars ? '✓' : '○'}</span>
                        One special character
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="relative">
                  <Input
                    label="Confirm New Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Confirm your new password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-9 text-neutral-400 hover:text-white transition-colors duration-200"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-950/50 border border-red-800 rounded-lg">
                  <p className="text-sm text-red-400 font-medium">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !passwordValidation.isValid || password !== confirmPassword}
                fullWidth
                className="flex items-center justify-center h-11"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ) : (
                  <Lock className="h-5 w-5 mr-2" />
                )}
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UpdatePasswordContent />
    </Suspense>
  )
}
