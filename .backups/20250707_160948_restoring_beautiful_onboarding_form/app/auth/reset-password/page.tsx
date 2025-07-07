'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/SupabaseAuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const { resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const success = await resetPassword(email)
      
      if (success) {
        setSent(true)
        toast.success('Password reset email sent! Check your inbox.')
      } else {
        setError('Failed to send reset email. Please try again.')
      }
    } catch (error: unknown) {
      console.error('Password reset error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card className="border-neutral-800 bg-neutral-950">
            <CardHeader className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-950 mb-4">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <CardTitle className="text-white">Check Your Email</CardTitle>
              <CardDescription className="text-neutral-400">
                We've sent a password reset link to {email}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-neutral-400 mb-4">
                  Click the link in the email to reset your password. The link will expire in 1 hour.
                </p>
                <p className="text-xs text-neutral-500">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={() => setSent(false)}
                  variant="outline"
                  fullWidth
                >
                  Send Another Email
                </Button>
                
                <Link href="/auth/login">
                  <Button variant="ghost" fullWidth className="flex items-center justify-center">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card className="border-neutral-800 bg-neutral-950">
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-neutral-900 mb-4">
              <Mail className="h-6 w-6 text-primary-400" />
            </div>
            <CardTitle className="text-white">Reset Your Password</CardTitle>
            <CardDescription className="text-neutral-400">
              Enter your email address and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email address"
                  autoComplete="email"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-950/50 border border-red-800 rounded-lg">
                  <p className="text-sm text-red-400 font-medium">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !email}
                fullWidth
                className="flex items-center justify-center h-11"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ) : (
                  <Mail className="h-5 w-5 mr-2" />
                )}
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/auth/login">
                <Button variant="ghost" className="flex items-center justify-center">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
