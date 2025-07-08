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
import WebhookService from '@/lib/webhookService'

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

  const onSubmit = async (data: SignUpFormData) => {
    try {
      setIsLoading(true)
      console.log('🔄 Starting sign up process...')

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

      // Send welcome email via webhook
      try {
        await WebhookService.sendSignupConfirmation({
          to: data.email,
          userData: {
            name: data.fullName,
            email: data.email,
            userId: user.uid
          }
        })
        console.log('✅ Welcome email sent successfully')
      } catch (webhookError) {
        console.warn('⚠️ Welcome email failed, but signup succeeded:', webhookError)
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
    <form onSubmit={handleSubmit(onSubmit)} className={`space-y-6 ${className}`}>
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
      >
        {isLoading ? 'Creating Account...' : 'Create Account'}
      </Button>
    </form>
  )
}
