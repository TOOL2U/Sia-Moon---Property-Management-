'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/RealAuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

interface LoginFormProps {
  userType: 'owner' | 'staff'
}

export function LoginForm({ userType }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🔄 Login form submitted', { email, userType })
    setLoading(true)
    setError('')

    try {
      console.log('🔄 Calling signIn...')
      await signIn(email, password)
      console.log('✅ SignIn completed successfully')
      // Don't redirect here - let RealAuthContext handle the redirect
    } catch (error: any) {
      console.error('❌ Login error:', error)
      setError(error.message || 'Invalid email or password. Please try again.')
    } finally {
      console.log('🏁 Login form finished')
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          {userType === 'owner' ? 'Owner Portal' : 'Staff Portal'}
        </CardTitle>
        <CardDescription className="text-base">
          Sign in to your {userType} account to access the dashboard
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
            placeholder="Enter your email"
            autoComplete="email"
            autoCapitalize="none"
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
              className="absolute right-3 top-11 text-gray-500 hover:text-gray-700 transition-colors"
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
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            fullWidth
            disabled={loading || !email || !password}
            className="mt-6"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>

          {/* Demo credentials hint */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-medium mb-2">Demo Credentials:</p>
            <p className="text-xs text-blue-700">
              Email: demo@{userType}.com<br />
              Password: demo123
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
