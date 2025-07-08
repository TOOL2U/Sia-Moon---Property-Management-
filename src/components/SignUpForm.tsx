'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
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

  const onError = (errors: any) => {
    console.log('🚨 FORM VALIDATION FAILED!')
    console.log('🚨 Validation errors:', errors)
  }

  const testButtonClick = () => {
    console.log('🚨 BUTTON CLICKED DIRECTLY!')
    console.log('🚨 Current form values:', {
      fullName: document.querySelector('input[placeholder="Full Name"]')?.value,
      email: document.querySelector('input[placeholder="Email Address"]')?.value,
      password: document.querySelector('input[placeholder="Password"]')?.value,
      confirmPassword: document.querySelector('input[placeholder="Confirm Password"]')?.value
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
      console.log('🔄 Starting sign up process...')
      console.log('📝 Form data received:', { email: data.email, fullName: data.fullName })

      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password)
      const user = userCredential.user

      console.log('✅ User created successfully:', user.uid)

      // Create user profile in Firestore
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

      console.log('✅ User profile created in Firestore')
      console.log('🎯 CHECKPOINT: About to start webhook process - this should always show!')

      // Send welcome email via webhook
      console.log('🔄 Starting webhook process...')
      console.log('🔄 About to prepare signup data for webhook...')
      try {
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

        // Create comprehensive signup data for Make.com webhook
        const signupData = {
          // Core user information (required by email template)
          name: data.fullName,
          email: data.email,
          userId: user.uid,
          signup_date: new Date().toISOString(),

          // Account details (used in email template)
          account_type: 'Standard Property Manager',
          subscription_plan: 'Free Trial',
          role: 'property_manager',

          // Business information
          business_type: 'Property Management',
          experience_level: 'New User',
          property_count: '0',
          primary_goals: ['Property Management', 'Booking Automation', 'Client Communication'],

          // Contact and preferences
          phone: '', // Can be filled later
          marketing_consent: true,
          communication_preferences: ['email', 'dashboard'],

          // Technical details
          signup_method: 'Web Form',
          device_type: typeof window !== 'undefined' ?
            (/Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop') : 'Unknown',
          browser: getBrowserInfo(),
          user_agent: typeof window !== 'undefined' ? navigator.userAgent : 'Unknown',
          ip_address: 'Client Side', // Will be populated by Make.com

          // Location and preferences
          timezone: typeof window !== 'undefined' ?
            Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC',
          language: typeof window !== 'undefined' ?
            navigator.language.split('-')[0] : 'en',

          // Status flags
          email_verified: user.emailVerified || false,
          profile_completed: false,
          onboarding_completed: false,

          // Source tracking
          source: 'Sia Moon WebApp',
          referral_source: 'Direct Signup',
          utm_source: 'direct',
          utm_medium: 'website',
          utm_campaign: 'signup_form',
          campaign_id: 'webapp_signup_2025',

          // Automation flags for Make.com
          welcome_email_needed: true,
          onboarding_sequence: 'new_property_manager',
          follow_up_days: [1, 3, 7, 14],
          trial_period_days: 30,
          next_action: 'send_welcome_email',
          user_segment: 'New Property Manager',

          // Setup flags
          needs_tutorial: true,
          demo_property_setup: true,
          initial_setup_complete: false,

          // System metadata
          submission_type: 'user_signup',
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'development'
        }

        console.log('🚀 About to call signup webhook with data:', {
          email: signupData.email,
          name: signupData.name,
          userId: signupData.userId,
          account_type: signupData.account_type
        })

        // Send directly to webhook URL (bypassing the complex WebhookService)
        console.log('📞 Sending directly to Make.com webhook...')
        const webhookUrl = process.env.NEXT_PUBLIC_SIGNUP_WEBHOOK_URL || 'https://hook.eu2.make.com/fm7r9zvvcoj2hy3rj11as0uto5vj626i'

        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'SiaMoon-PropertyManagement/1.0'
          },
          body: JSON.stringify(signupData)
        })

        console.log('📡 Webhook response status:', response.status)

        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ Webhook error:', errorText)
          throw new Error(`Webhook failed: ${response.status}`)
        }

        const responseText = await response.text()
        console.log('✅ Webhook response:', responseText)
        console.log('✅ Comprehensive signup data sent to Make.com successfully')

        // Webhook sent successfully
      } catch (webhookError) {
        console.error('❌ WEBHOOK ERROR:', webhookError)
        console.error('❌ Error details:', {
          message: webhookError instanceof Error ? webhookError.message : String(webhookError),
          stack: webhookError instanceof Error ? webhookError.stack : 'No stack trace',
          type: typeof webhookError
        })
        console.warn('⚠️ Welcome email failed, but signup succeeded')
      }

      toast.success('Account created successfully! Welcome to Villa Management.')

      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/dashboard')
      }

    } catch (error: any) {
      console.error('❌ Sign up error:', error)

      if (error.code === 'auth/email-already-in-use') {
        setError('email', { message: 'An account with this email already exists' })
      } else if (error.code === 'auth/weak-password') {
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
