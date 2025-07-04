'use client'

import { useState } from 'react'
// TODO: Switch back to Supabase auth for production
// import { useAuth } from '@/contexts/RealAuthContext'
import { useLocalAuth } from '@/hooks/useLocalAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { UserPlus, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

export default function SignUpPage() {
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
  const [error, setError] = useState('')
  // TODO: Switch back to Supabase auth for production
  const { signUp } = useLocalAuth()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required')
      return false
    }
    if (!formData.email.trim()) {
      setError('Email is required')
      return false
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setError('')
    setLoading(true)

    try {
      await signUp(formData.email, formData.password, formData.role, formData.name)
      // Success message is handled in the signUp function
    } catch (error: any) {
      setError(error.message || 'Failed to create account')
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
            Join Villa Management today
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
              <Input
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="John Smith"
                autoComplete="name"
              />

              <Input
                label="Email Address"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="john@example.com"
                autoComplete="email"
              />

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
                  Choose "Property Owner" if you want to list and manage properties
                </p>
              </div>

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
                  helperText="Must be at least 6 characters"
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

              {error && (
                <div className="p-3 bg-red-950/50 border border-red-800 rounded-lg">
                  <p className="text-sm text-red-400 font-medium">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                fullWidth
                className="flex items-center justify-center h-11"
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