'use client'

import { useState, useEffect } from 'react'
// TODO: Replace with new auth system when implemented
// import { useAuth } from '@/contexts/NewAuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { UserPlus, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

export default function SignUpPage() {
  console.log('📄 SignUp page component loaded')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'client' as 'client' | 'staff'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  // TODO: Replace with new auth system when implemented
  const auth = {
    loading: false,
    user: null,
    profile: null,
    signUp: async (email: string, password: string, name: string, role: string) => {
      console.log('🔄 Development mode signup:', { email, password: '***', name, role })
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      return { success: true, needsVerification: false }
    }
  }
  const { signUp } = auth

  // Redirect authenticated users to dashboard
  useEffect(() => {
    console.log('🔍 Signup page auth check:', {
      loading: auth.loading,
      user: !!auth.user,
      profile: !!auth.profile
    })

    if (!auth.loading && auth.user && auth.profile) {
      console.log('🔄 User already authenticated, redirecting to dashboard...')
      console.log('🚀 Executing redirect via window.location.href')
      window.location.href = '/dashboard/client'
    } else if (!auth.loading) {
      console.log('👤 No authenticated user found, staying on signup page')
    } else {
      console.log('⏳ Still loading auth state...')
    }
  }, [auth.loading, auth.user, auth.profile])

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear errors for the field being edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      console.log('🔄 Starting sign up process...')
      const result = await signUp(formData.email, formData.password, formData.name, formData.role)
      const success = result.success

      if (success) {
        console.log('✅ Signup successful')
        toast.success('Account created successfully! Welcome to Sia Moon!')

        // Redirect to client dashboard immediately
        console.log('🔄 Redirecting to dashboard immediately...')

        // Use window.location for immediate redirect
        console.log('🚀 Using window.location.href for immediate redirect')
        window.location.href = '/dashboard/client'
      } else {
        console.log('❌ Signup failed')
        toast.error('Failed to create account. Please try again.')
      }
    } catch (error: unknown) {
      console.error('❌ Sign up error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create account'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">
            Create Account
          </h1>
          <p className="mt-3 text-base text-neutral-400">
            Join Sia Moon Property Management today
          </p>
        </div>

        {/* Sign Up Form */}
        <Card className="shadow-xl border-neutral-800 bg-neutral-950">
          <CardHeader>
            <CardTitle className="text-white">Create your account</CardTitle>
            <CardDescription className="text-neutral-400">
              Fill in your details to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Input
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="John Smith"
                  autoComplete="name"
                  className={errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                />
                {errors.name && (
                  <div className="flex items-center mt-1 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.name}
                  </div>
                )}
              </div>

              <div>
                <Input
                  label="Email Address"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="john@example.com"
                  autoComplete="email"
                  className={errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                />
                {errors.email && (
                  <div className="flex items-center mt-1 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.email}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Account Type
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-neutral-700 bg-neutral-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  required
                >
                  <option value="client">Property Owner (Client)</option>
                  <option value="staff">Staff Member</option>
                </select>
                <p className="text-xs text-neutral-400 mt-1">
                  Choose &quot;Property Owner&quot; if you want to list and manage properties
                </p>
              </div>

              <div>
                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    placeholder="Create a password"
                    autoComplete="new-password"
                    className={errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
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
                {errors.password && (
                  <div className="flex items-center mt-1 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.password}
                  </div>
                )}
              </div>

              <div>
                <div className="relative">
                  <Input
                    label="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    className={errors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
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
                {errors.confirmPassword && (
                  <div className="flex items-center mt-1 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.confirmPassword}
                  </div>
                )}
                {formData.confirmPassword && formData.password === formData.confirmPassword && !errors.confirmPassword && (
                  <div className="flex items-center mt-1 text-green-400 text-sm">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Passwords match
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading || Object.keys(errors).some(key => errors[key])}
                fullWidth
                className="flex items-center justify-center h-11 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ) : (
                  <UserPlus className="h-5 w-5 mr-2" />
                )}
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            {/* Sign In Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-400">
                Already have an account?{' '}
                <Link href="/auth/login" className="font-medium text-primary-400 hover:text-primary-300 transition-colors duration-200">
                  Sign in here
                </Link>
              </p>
            </div>

            {/* Debug: Manual redirect button */}
            {auth.user && (
              <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-600 rounded-lg">
                <p className="text-yellow-400 text-sm mb-2">
                  🔍 Debug: You are already authenticated
                </p>
                <Button
                  onClick={() => {
                    console.log('🚀 Manual redirect button clicked')
                    window.location.href = '/dashboard/client'
                  }}
                  className="w-full bg-yellow-600 hover:bg-yellow-700"
                >
                  Go to Dashboard Manually
                </Button>
              </div>
            )}

            {/* Back to Home */}
            <div className="mt-4 text-center">
              <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-400 transition-colors duration-200">
                ← Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}