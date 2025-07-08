'use client'

import { useState } from 'react'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Mail, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function TestForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast.error('Please enter an email address')
      return
    }

    try {
      setIsLoading(true)
      console.log('🔄 Testing password reset for:', email)

      await sendPasswordResetEmail(auth, email)
      
      console.log('✅ Password reset email sent successfully')
      toast.success('Password reset email sent! Check your inbox.')
      setEmail('')
      
    } catch (error: any) {
      console.error('❌ Password reset error:', error)
      
      // Handle specific Firebase errors
      if (error.code === 'auth/user-not-found') {
        toast.error('No account found with this email address.')
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Please enter a valid email address.')
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Too many requests. Please try again later.')
      } else {
        toast.error('Failed to send password reset email. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
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
            <CardTitle className="text-2xl font-bold text-white">Test Forgot Password</CardTitle>
            <CardDescription className="text-neutral-400">
              Test Firebase password reset functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email to test reset"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                fullWidth
                className="flex items-center justify-center h-11 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending Reset Email...
                  </>
                ) : (
                  'Send Password Reset Email'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-400">
                Go to{' '}
                <Link
                  href="/auth/login"
                  className="text-primary-400 hover:text-primary-300 transition-colors duration-200"
                >
                  Sign In
                </Link>
                {' '}to test the integrated forgot password feature
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
