'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import SignInForm from '@/components/SignInForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Redirect authenticated users to client dashboard
  useEffect(() => {
    if (!loading && user) {
      console.log('🔄 User already authenticated, redirecting to client dashboard...')
      router.push('/dashboard/client')
    }
  }, [loading, user, router])

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
            <SignInForm />

            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-400">
                Don&apos;t have an account?{' '}
                <Link
                  href="/auth/signup"
                  className="text-primary-400 hover:text-primary-300 transition-colors duration-200"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}