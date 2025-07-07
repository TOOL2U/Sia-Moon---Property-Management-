'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { useOnboardingSubmit, OnboardingSubmissionData } from '@/hooks/useOnboardingSubmit'
import { Building, CheckCircle, ArrowLeft, Send, Loader2 } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface FormData {
  name: string
  email: string
  phone: string
  property_address: string
  notes: string
}

export default function SimpleOnboardingPage() {
  const router = useRouter()
  const { isLoading, isSuccess, error, submitOnboarding, reset } = useOnboardingSubmit()
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    property_address: '',
    notes: ''
  })

  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {}
    
    // Required field validation
    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required'
    }
    
    if (!formData.property_address.trim()) {
      errors.property_address = 'Property address is required'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Reset previous states
    reset()
    
    // Validate form
    if (!validateForm()) {
      toast.error('Please fill in all required fields correctly')
      return
    }

    try {
      // Submit to Make.com webhook
      await submitOnboarding(formData as OnboardingSubmissionData)
      
      // Show success message
      toast.success('Thank you! Your villa onboarding request has been submitted successfully. You will receive a confirmation email shortly.')
      
      // Clear form on success
      setFormData({
        name: '',
        email: '',
        phone: '',
        property_address: '',
        notes: ''
      })
      
      // Optional: Redirect after a delay
      setTimeout(() => {
        router.push('/')
      }, 3000)
      
    } catch (err) {
      // Error is already handled by the hook and displayed via error state
      toast.error('Failed to submit your request. Please try again.')
    }
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center py-16">
              <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-4">
                Submission Successful!
              </h1>
              <p className="text-lg text-neutral-300 mb-8">
                Thank you for your interest in our villa management services. 
                We've received your information and will send you a confirmation email shortly.
              </p>
              <div className="space-y-4">
                <p className="text-neutral-400">
                  Our team will review your request and contact you within 24 hours.
                </p>
                <Link href="/">
                  <Button className="mt-6">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Back to home link */}
      <div className="absolute top-6 left-6 z-10">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-6">
              <Building className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">
              Villa Management Onboarding
            </h1>
            <p className="text-lg text-neutral-400 max-w-xl mx-auto">
              Get started with professional villa management services. 
              Fill out the form below and we'll send you a confirmation email with next steps.
            </p>
          </div>

          {/* Form */}
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Contact Information</CardTitle>
              <CardDescription className="text-neutral-400">
                Please provide your details and property information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                  <Input
                    label="Full Name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    required
                    error={validationErrors.name}
                    disabled={isLoading}
                  />
                </div>

                {/* Email */}
                <div>
                  <Input
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email address"
                    required
                    error={validationErrors.email}
                    disabled={isLoading}
                  />
                </div>

                {/* Phone */}
                <div>
                  <Input
                    label="Phone Number"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                    required
                    error={validationErrors.phone}
                    disabled={isLoading}
                  />
                </div>

                {/* Property Address */}
                <div>
                  <Input
                    label="Property Address"
                    name="property_address"
                    type="text"
                    value={formData.property_address}
                    onChange={handleInputChange}
                    placeholder="Enter your villa/property address"
                    required
                    error={validationErrors.property_address}
                    disabled={isLoading}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Any additional information about your property or specific requirements..."
                    rows={4}
                    disabled={isLoading}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 text-lg font-medium"
                  size="lg"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-3">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Submitting Request...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <Send className="h-5 w-5" />
                      <span>Submit Onboarding Request</span>
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
