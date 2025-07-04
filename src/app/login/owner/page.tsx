import { LoginForm } from '@/components/auth/LoginForm'
import Link from 'next/link'
import { ArrowLeft, Building } from 'lucide-react'

export default function OwnerLoginPage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Back to home link */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </div>

      <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mb-6">
              <Building className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Welcome Back, Owner
            </h2>
            <p className="mt-3 text-base text-neutral-400">
              Sign in to manage your villa properties and track your business performance
            </p>
          </div>

          {/* Login Form */}
          <LoginForm userType="owner" />

          {/* Additional Links */}
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/contact" className="font-medium text-blue-600 hover:text-blue-500">
                Contact us to get started
              </Link>
            </p>
            <p className="text-sm text-gray-600">
              Are you a staff member?{' '}
              <Link href="/login/staff" className="font-medium text-blue-600 hover:text-blue-500">
                Staff Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
