'use client'

import { useState } from 'react'
// TODO: Switch back to Supabase auth for production
// import { useAuth } from '@/contexts/RealAuthContext'
import { useAuth } from '@/contexts/SupabaseAuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { LogIn, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'


export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('🔄 Attempting login with:', email)
      const success = await signIn(email, password)

      if (success) {
        console.log('✅ Login successful, redirecting to dashboard...')

        // Small delay to ensure auth state is updated
        setTimeout(() => {
          console.log('🔄 Executing redirect to dashboard...')
          router.push('/dashboard')
        }, 100)
      } else {
        console.log('❌ Login failed')
        setError('Login failed. Please check your credentials.')
      }
    } catch (error: any) {
      console.error('❌ Login error:', error)
      setError(error.message || 'Failed to sign in')
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
            <LogIn className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">
            Sign In
          </h1>
          <p className="mt-3 text-base text-neutral-400">
            Welcome back to Sia Moon Property Management
          </p>
        </div>

        {/* Login Form */}
        <Card className="shadow-xl border-neutral-800 bg-neutral-950">
          <CardHeader>
            <CardTitle className="text-white">Sign in to your account</CardTitle>
            <CardDescription className="text-neutral-400">
              Enter your email and password to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="john@example.com"
                autoComplete="email"
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  autoComplete="current-password"
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
                  <LogIn className="h-5 w-5 mr-2" />
                )}
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {/* Demo Accounts */}
            <div className="mt-6 p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
              <h4 className="text-sm font-medium text-white mb-3">Demo Accounts</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Client:</span>
                  <span className="font-mono text-neutral-300">john.smith@example.com</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Staff:</span>
                  <span className="font-mono text-neutral-300">sarah.johnson@siamoon.com</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Password:</span>
                  <span className="font-mono text-neutral-300">password123</span>
                </div>
              </div>
            </div>

            {/* Sign Up Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-400">
                Don't have an account?{' '}
                <Link href="/auth/signup" className="font-medium text-primary-400 hover:text-primary-300 transition-colors duration-200">
                  Sign up here
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