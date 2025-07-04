'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
// TODO: Switch back to Supabase for production
// import { createClient } from '@/lib/supabase/client'
// import { useAuth } from '@/contexts/RealAuthContext'
import DatabaseService from '@/lib/dbService'
import { useLocalAuth } from '@/hooks/useLocalAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { ArrowLeft, Building, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface PropertyFormData {
  name: string
  address: string
}

export default function AddPropertyPage() {
  const [formData, setFormData] = useState<PropertyFormData>({
    name: '',
    address: ''
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  // TODO: Switch back to Supabase for production
  const { user } = useLocalAuth()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (error) setError('')
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Property name is required')
      return false
    }
    if (!formData.address.trim()) {
      setError('Property location is required')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    setError('')

    try {
      console.log('🔄 Creating property with local database...')
      console.log('Form data:', formData)

      if (!user) {
        throw new Error('You must be logged in to create a property')
      }

      // Create property using local database
      const { data, error: insertError } = await DatabaseService.createProperty({
        name: formData.name,
        description: formData.description || '',
        location: formData.address,
        owner_id: user.id,
        status: 'active'
      })

      console.log('✅ Property created:', data)

      if (insertError) {
        throw new Error(`Database error: ${insertError.message}`)
      }

      if (!data) {
        throw new Error('Failed to create property')
      }

      toast.success('Property added successfully!')
      setSubmitted(true)

      // Redirect to properties page after a short delay
      setTimeout(() => {
        router.push('/properties')
      }, 2000)

    } catch (err: unknown) {
      console.error('Error adding property:', err)

      let errorMessage = 'Failed to add property. Please try again.'

      if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === 'object' && err !== null) {
        // Handle database error objects
        const dbError = err as any
        if (dbError.message) {
          errorMessage = dbError.message
        } else {
          errorMessage = `Database error: ${JSON.stringify(err)}`
        }
      }

      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-green-800">Property Added Successfully!</CardTitle>
            <CardDescription>
              Your property has been added to your portfolio. You can now manage bookings and tasks for this property.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={() => router.push('/properties')} fullWidth>
                View All Properties
              </Button>
              <Button variant="outline" onClick={() => setSubmitted(false)} fullWidth>
                Add Another Property
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Back to properties link */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
        <Link 
          href="/properties" 
          className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Properties
        </Link>
      </div>

      <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-6">
              <Building className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Add New Property
            </h1>
            <p className="mt-3 text-base text-gray-600">
              Add a villa property to your portfolio for management by Sia Moon.
            </p>
          </div>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Property Information</CardTitle>
              <CardDescription>
                Provide basic details about your villa property.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  label="Property Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Villa Paradise, Sunset Beach House"
                  helperText="Choose a memorable name for your property"
                />

                <div>
                  <label className="block text-base font-medium text-gray-900 mb-2">
                    Property Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="flex w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="123 Beach Road, Tambon Choeng Thale, Thalang District, Phuket 83110, Thailand"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Include full address with district, province, and postal code
                  </p>
                </div>

                {error && (
                  <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Your property will be added to your portfolio</li>
                    <li>• You can manage bookings and view reports</li>
                    <li>• Staff can be assigned tasks for this property</li>
                    <li>• For comprehensive onboarding, use the villa survey form</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? 'Adding Property...' : 'Add Property'}
                  </Button>
                  
                  <Link href="/onboard" className="flex-1">
                    <Button variant="outline" fullWidth>
                      Use Full Onboarding Form
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
