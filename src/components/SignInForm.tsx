'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

// Validation schemas
const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type SignInFormData = z.infer<typeof signInSchema>
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

interface SignInFormProps {
  onSuccess?: () => void
  className?: string
}

export default function SignInForm({ onSuccess, className = '' }: SignInFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema)
  })

  const {
    register: registerForgot,
    handleSubmit: handleSubmitForgot,
    formState: { errors: forgotErrors },
    reset: resetForgotForm
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema)
  })

  const onSubmit = async (data: SignInFormData) => {
    try {
      setIsLoading(true)
      console.log('🔄 Starting sign in process...')

      if (!auth) {
        throw new Error('Firebase auth not initialized')
      }
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password)
      const user = userCredential.user

      console.log('✅ Firebase Auth sign in successful:', user.uid)
      toast.success('Welcome back!')

      // Handle success
      if (onSuccess) {
        onSuccess()
      } else {
        console.log('🔄 Redirecting to client dashboard after successful login...')
        router.push('/dashboard/client')
      }

    } catch (error) {
      console.error('❌ Unexpected sign in error:', error)
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const onForgotPasswordSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsResettingPassword(true)
      console.log('🔄 Sending password reset email to:', data.email)

      if (!auth) {
        throw new Error('Firebase auth not initialized')
      }
      await sendPasswordResetEmail(auth, data.email)

      console.log('✅ Password reset email sent successfully')
      toast.success('Password reset email sent! Check your inbox.')

      // Reset form and close modal
      resetForgotForm()
      setShowForgotPassword(false)

    } catch (error: unknown) {
      console.error('❌ Password reset error:', error)

      // Handle specific Firebase errors
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string }
        if (firebaseError.code === 'auth/user-not-found') {
          toast.error('No account found with this email address.')
        } else if (firebaseError.code === 'auth/invalid-email') {
          toast.error('Please enter a valid email address.')
        } else if (firebaseError.code === 'auth/too-many-requests') {
          toast.error('Too many requests. Please try again later.')
        } else {
          toast.error('Failed to send password reset email. Please try again.')
        }
      } else {
        toast.error('Failed to send password reset email. Please try again.')
      }
    } finally {
      setIsResettingPassword(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className={`space-y-6 ${className}`}>
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
            placeholder="Enter your email"
            autoComplete="email"
            className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
            {...register('email')}
          />
        </div>
        {errors.email && (
          <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            autoComplete="current-password"
            className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
        )}

        {/* Forgot Password Links */}
        <div className="text-right space-y-1">
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="block text-sm text-primary-400 hover:text-primary-300 transition-colors duration-200"
          >
            Forgot your password?
          </button>
          <Link
            href="/auth/forgot-password"
            className="block text-xs text-neutral-500 hover:text-neutral-400 transition-colors duration-200"
          >
            Or use dedicated reset page
          </Link>
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
            Signing In...
          </>
        ) : (
          'Sign In'
        )}
      </Button>
      </form>

      {/* Forgot Password Modal - Moved outside of main form */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-2">Reset Password</h3>
            <p className="text-sm text-neutral-400 mb-4">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmitForgot(onForgotPasswordSubmit)} className="space-y-4">
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="Enter your email"
                    autoComplete="email"
                    className={`pl-10 ${forgotErrors.email ? 'border-red-500' : ''}`}
                    {...registerForgot('email')}
                  />
                </div>
                {forgotErrors.email && (
                  <p className="mt-1 text-sm text-red-500">{forgotErrors.email.message}</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForgotPassword(false)
                    resetForgotForm()
                  }}
                  className="flex-1"
                  disabled={isResettingPassword}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isResettingPassword}
                  className="flex-1"
                >
                  {isResettingPassword ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    'Send Reset Email'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
