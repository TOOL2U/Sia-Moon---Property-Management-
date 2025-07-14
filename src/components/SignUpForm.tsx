'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, Timestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Eye, EyeOff, User, Mail, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { useUserSync } from '@/hooks/useUserSync'


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

interface SignupData {
  name: string
  email: string
  userId: string
}

interface SignUpFormProps {
  onSuccess?: () => void
  className?: string
}

export default function SignUpForm({ onSuccess, className = '' }: SignUpFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { syncUserProfile } = useUserSync()

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

      // Check if Firebase is initialized
      if (!auth) {
        throw new Error('Firebase Auth is not initialized')
      }
      if (!db) {
        throw new Error('Firebase Firestore is not initialized')
      }

      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password)
      const user = userCredential.user

      console.log('✅ User created successfully:', user.uid)

      // Create user profile in Firestore profiles collection
      console.log('📊 Attempting to create Firestore profile...')
      try {
        // Import ProfileService dynamically to avoid build issues
        const { ProfileService } = await import('@/lib/services/profileService')

        const profileCreated = await ProfileService.createUserProfile(
          user.uid,
          data.email,
          data.fullName,
          'client'
        )

        if (profileCreated) {
          console.log('✅ User profile created in profiles collection successfully')
        } else {
          console.error('❌ Failed to create user profile')
        }

        // Create in users collection with proper structure for property subcollections
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: data.email,
          fullName: data.fullName,
          role: 'client',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          properties: [], // Legacy array for backward compatibility
          bookings: [],
          preferences: {
            notifications: true,
            emailUpdates: true
          },
          // Additional fields for property management
          contactNumber: '',
          nationality: '',
          bankDetails: '',
          emergencyContact: {
            name: '',
            phone: ''
          }
        })
        console.log('✅ User document created in users collection with property subcollection support')

        // Ensure profile synchronization
        console.log('🔄 Running profile synchronization...')
        const syncResult = await syncUserProfile(user.uid, {
          email: data.email,
          fullName: data.fullName,
          role: 'client'
        })

        if (syncResult.success) {
          console.log('✅ Profile synchronization completed successfully')
        } else {
          console.warn('⚠️ Profile synchronization failed:', syncResult.error)
        }

      } catch (firestoreError) {
        console.error('❌ Firestore profile creation failed:', firestoreError)
        console.warn('⚠️ Continuing with signup despite Firestore error - webhook will still run')
      }

      console.log('✅ User profile created in Firestore')
      console.log('🎯 CHECKPOINT: About to start webhook process - this should always show!')

      // Send welcome email via webhook
      // Signup completed successfully
      console.log('✅ User signup completed successfully')

      // Clear the signup flag and allow redirect
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('signup_in_progress')
        console.log('🔓 Cleared signup_in_progress flag - redirect now allowed')
      }

      toast.success('Account created successfully! Welcome to Villa Management.')

      if (onSuccess) {
        onSuccess()
      } else {
        console.log('🔄 Redirecting to client dashboard after successful signup...')
        router.push('/dashboard/client')
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
