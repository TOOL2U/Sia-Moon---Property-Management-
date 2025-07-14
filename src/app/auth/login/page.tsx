'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

export default function LoginPage() {
  const { user, loading, signIn } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect authenticated users to client dashboard
  useEffect(() => {
    if (!loading && user) {
      console.log('🔄 User already authenticated, redirecting to client dashboard...')
      router.push('/dashboard/client')
    }
  }, [loading, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields')
      return
    }

    setIsSubmitting(true)

    try {
      console.log('🔐 Attempting to sign in user:', formData.email)
      
      const result = await signIn(formData.email, formData.password)
      
      if (result.success) {
        console.log('✅ Sign in successful')
        toast.success('Welcome back!')
        
        // Get redirect URL from query params or default to dashboard
        const urlParams = new URLSearchParams(window.location.search)
        const redirectTo = urlParams.get('redirect') || '/dashboard/client'
        
        router.push(redirectTo)
      } else {
        console.error('❌ Sign in failed:', result.error)
        toast.error(result.error || 'Failed to sign in')
      }
    } catch (error) {
      console.error('❌ Sign in error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          <span className="text-white">Checking authentication...</span>
        </div>
      </div>
    )
  }

  // Don't render login form if user is already authenticated
  if (user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          <span className="text-white">Redirecting...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Home Link */}
        <Link
          href="/"
          className="inline-flex items-center text-sm text-neutral-400 hover:text-white mb-6 transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">Welcome Back</CardTitle>
            <CardDescription className="text-neutral-400">
              Sign in to your Sia Moon account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-neutral-300">
                  Email Address
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
                  disabled={isSubmitting}
                  required
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-neutral-300">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 pr-10"
                    disabled={isSubmitting}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Additional Links */}
            <div className="mt-6 space-y-4">
              <div className="text-center">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200"
                >
                  Forgot your password?
                </Link>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-neutral-400">
                  Don&apos;t have an account?{' '}
                  <Link
                    href="/auth/signup"
                    className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
