'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import SignUpForm from '@/components/SignUpForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
// Temporarily commenting out to isolate the issue
// import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SignUpPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Redirect authenticated users to dashboard (but not during signup process)
  useEffect(() => {
    const signupInProgress = sessionStorage.getItem('signup_in_progress')
    
    if (!loading && user && !signupInProgress) {
      console.log('🔄 User already authenticated, redirecting to client dashboard...')
      router.push('/dashboard/client')
    } else if (signupInProgress) {
      console.log('⏳ Signup in progress, delaying redirect...')
    }
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-neutral-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Login Link */}
        <Link
          href="/auth/login"
          className="inline-flex items-center text-sm text-neutral-400 hover:text-white mb-6 transition-colors duration-200"
        >
          {/* <ArrowLeft className="h-4 w-4 mr-2" /> */}
          ← Back to Sign In
        </Link>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">Create Account</CardTitle>
            <CardDescription className="text-neutral-400">
              Join Sia Moon Property Management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignUpForm />

            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-400">
                Already have an account?{' '}
                <Link
                  href="/auth/login"
                  className="text-primary-400 hover:text-primary-300 transition-colors duration-200"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
