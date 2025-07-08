'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Eye, EyeOff, User, Mail, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import WebhookService, { SignupData } from '@/lib/webhookService'

// Validation schema
const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SignUpFormData = z.infer<typeof signUpSchema>

interface SignUpFormProps {
  onSuccess?: () => void
  className?: string
}

export default function SignUpForm({ onSuccess, className = '' }: SignUpFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema)
  })

  // Debug form errors
  console.log('🔍 Form errors:', errors)

  const onError = (errors: FieldErrors<SignUpFormData>) => {
    console.log('🚨 FORM VALIDATION FAILED!')
    console.log('🚨 Validation errors:', errors)
  }

  const testButtonClick = () => {
    console.log('🚨 BUTTON CLICKED DIRECTLY!')
    console.log('🚨 Current form values:', {
      fullName: (document.querySelector('input[placeholder="Full Name"]') as HTMLInputElement)?.value,
      email: (document.querySelector('input[placeholder="Email Address"]') as HTMLInputElement)?.value,
      password: (document.querySelector('input[placeholder="Password"]') as HTMLInputElement)?.value,
      confirmPassword: (document.querySelector('input[placeholder="Confirm Password"]') as HTMLInputElement)?.value
    })
  }

  const onSubmit = async (data: SignUpFormData) => {
    console.log('🚨 FORM SUBMITTED! onSubmit function called!')
    console.log('🚨 Form data:', data)

    // Debug environment variables
    console.log('🔍 Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      SIGNUP_WEBHOOK_URL: process.env.NEXT_PUBLIC_SIGNUP_WEBHOOK_URL
    })

    try {
      setIsLoading(true)
      
      // Set flag to prevent premature redirects
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('signup_in_progress', 'true')
        console.log('🔒 Set signup_in_progress flag to prevent redirects')
      }
      
      console.log('🔄 Starting sign up process...')
      console.log('📝 Form data received:', { email: data.email, fullName: data.fullName })

      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password)
      const user = userCredential.user

      console.log('✅ User created successfully:', user.uid)

      // Create user profile in Firestore
      console.log('📊 Attempting to create Firestore profile...')
      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: data.email,
          fullName: data.fullName,
          role: 'client',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          // Initialize empty data for new users
          properties: [],
          bookings: [],
          preferences: {
            notifications: true,
            emailUpdates: true
          }
        })
        console.log('✅ User profile created in Firestore successfully')
      } catch (firestoreError) {
        console.error('❌ Firestore profile creation failed:', firestoreError)
        console.warn('⚠️ Continuing with signup despite Firestore error - webhook will still run')
      }

      console.log('✅ User profile created in Firestore')
      console.log('🎯 CHECKPOINT: About to start webhook process - this should always show!')

      // Send welcome email via webhook
      console.log('🔄 Starting webhook process...')
      console.log('🔄 About to prepare signup data for webhook...')
      console.log('🔍 Current environment check in browser:')
      console.log('- NODE_ENV:', process.env.NODE_ENV)
      console.log('- SIGNUP_WEBHOOK_URL:', process.env.NEXT_PUBLIC_SIGNUP_WEBHOOK_URL)
      console.log('- MAKE_WEBHOOK_URL:', process.env.NEXT_PUBLIC_MAKE_WEBHOOK_URL)
      
      try {
        console.log('🎯 WEBHOOK TRY BLOCK ENTERED - Starting webhook data preparation...')
        // Prepare comprehensive signup data for webhook
        const getBrowserInfo = () => {
          if (typeof window === 'undefined') return 'unknown'
          const userAgent = navigator.userAgent
          if (userAgent.includes('Chrome')) return 'Chrome'
          if (userAgent.includes('Firefox')) return 'Firefox'
          if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari'
          if (userAgent.includes('Edge')) return 'Edge'
          return 'Other'
        }

        const signupData: SignupData = {
          // User Information
          name: data.fullName,
          email: data.email,
          role: 'client',
          userId: user.uid,

          // Account Details
          account_type: 'standard',
          subscription_plan: 'free',
          marketing_consent: true,

          // Technical Details
          signup_method: 'web_form',
          device_type: typeof window !== 'undefined' ?
            (/Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop') : 'unknown',
          browser: getBrowserInfo(),
          user_agent: typeof window !== 'undefined' ? navigator.userAgent : 'unknown',

          // Timestamps
          signup_date: new Date().toISOString(),
          email_verified: false,
          profile_completed: false,

          // Preferences
          communication_preferences: ['email'],
          timezone: typeof window !== 'undefined' ?
            Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC',
          language: typeof window !== 'undefined' ?
            navigator.language.split('-')[0] : 'en',

          // Metadata
          source: 'sia_moon_webapp',
          utm_source: 'direct',
          utm_medium: 'website',
          utm_campaign: 'signup_form'
        }

        console.log('🚀 About to call signup webhook with data:', {
          email: signupData.email,
          name: signupData.name,
          userId: signupData.userId
        })

        // Debug environment variables in browser
        console.log('🔍 Environment debug:', {
          SIGNUP_WEBHOOK_URL: process.env.NEXT_PUBLIC_SIGNUP_WEBHOOK_URL,
          MAKE_WEBHOOK_URL: process.env.NEXT_PUBLIC_MAKE_WEBHOOK_URL
        })

        console.log('📞 Calling WebhookService.sendSignupConfirmation...')
        const webhookResult = await WebhookService.sendSignupConfirmation(signupData)
        console.log('📞 WebhookService.sendSignupConfirmation returned:', webhookResult)
        console.log('✅ Webhook result:', webhookResult)

        if (webhookResult.success) {
          console.log('✅ Welcome email sent successfully')
        } else {
          console.error('❌ Webhook failed:', webhookResult.error)
        }
      } catch (webhookError) {
        console.error('❌ WEBHOOK ERROR IN SIGNUP:', webhookError)
        console.error('❌ Webhook error details:', {
          message: webhookError instanceof Error ? webhookError.message : String(webhookError),
          stack: webhookError instanceof Error ? webhookError.stack : 'No stack trace',
          type: typeof webhookError,
          name: webhookError instanceof Error ? webhookError.name : 'Unknown'
        })
        console.error('❌ This error occurred during signup webhook call, but signup should still succeed')
        console.warn('⚠️ Welcome email failed, but signup succeeded')
      }

      // Clear the signup flag and allow redirect
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('signup_in_progress')
        console.log('🔓 Cleared signup_in_progress flag - redirect now allowed')
      }

      toast.success('Account created successfully! Welcome to Villa Management.')

      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/dashboard')
      }

    } catch (error: unknown) {
      // Clear signup flag on error as well
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('signup_in_progress')
        console.log('🔓 Cleared signup_in_progress flag due to error')
      }
      
      console.error('❌ Sign up error:', error)

      const firebaseError = error as { code?: string }
      if (firebaseError.code === 'auth/email-already-in-use') {
        setError('email', { message: 'An account with this email already exists' })
      } else if (firebaseError.code === 'auth/weak-password') {
        setError('password', { message: 'Password is too weak' })
      } else {
        toast.error('Failed to create account. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} className={`space-y-6 ${className}`}>
      {/* Full Name Field */}
      <div className="space-y-2">
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
          <Input
            {...register('fullName')}
            type="text"
            placeholder="Full Name"
            autoComplete="name"
            className="pl-10"
            error={!!errors.fullName}
            disabled={isLoading}
          />
        </div>
        {errors.fullName && (
          <p className="text-sm text-red-400">{errors.fullName.message}</p>
        )}
      </div>

      {/* Email Field */}
      <div className="space-y-2">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
          <Input
            {...register('email')}
            type="email"
            placeholder="Email Address"
            autoComplete="email"
            className="pl-10"
            error={!!errors.email}
            disabled={isLoading}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-red-400">{errors.email.message}</p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
          <Input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            autoComplete="new-password"
            className="pl-10 pr-10"
            error={!!errors.password}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
            disabled={isLoading}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-red-400">{errors.password.message}</p>
        )}
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-2">
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
          <Input
            {...register('confirmPassword')}
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm Password"
            autoComplete="new-password"
            className="pl-10 pr-10"
            error={!!errors.confirmPassword}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
            disabled={isLoading}
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-red-400">{errors.confirmPassword.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
        size="lg"
        onClick={() => {
          console.log('🚨 SUBMIT BUTTON CLICKED!')
          testButtonClick()
        }}
      >
        {isLoading ? 'Creating Account...' : 'Create Account'}
      </Button>
    </form>
  )
}
