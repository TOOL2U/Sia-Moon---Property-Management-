'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
// TODO: Replace with new database service when implemented
// import DatabaseService from '@/lib/newDatabaseService'
import { Button } from '@/components/ui/Button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/Card'
import GooglePlacesAutocomplete from '@/components/ui/GooglePlacesAutocomplete'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'
import { clientToast as toast } from '@/utils/clientToast'
import { ArrowLeft, Building, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface PropertyFormData {
  name: string
  address: string
}

export default function AddPropertyPage() {
  const [formData, setFormData] = useState<PropertyFormData>({
    name: '',
    address: '',
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { user } = useAuth()

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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

      console.log('🔄 Creating property (development mode - mock creation)')

      // TODO: Replace with real database creation when new database service is implemented
      // Simulate creation delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock property creation
      const mockProperty = {
        id: `prop-${Date.now()}`,
        name: formData.name,
        address: formData.address,
        owner_id: user.id || 'dev-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      console.log('✅ Property created (mock):', mockProperty)
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
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center bg-neutral-950 border-neutral-800">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-white">
              Property Added Successfully!
            </CardTitle>
            <CardDescription className="text-neutral-400">
              Your property has been added to your portfolio. You can now manage
              bookings and tasks for this property.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={() => router.push('/properties')} fullWidth>
                View All Properties
              </Button>
              <Button
                variant="outline"
                onClick={() => setSubmitted(false)}
                fullWidth
              >
                Add Another Property
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Back to properties link */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
        <Link
          href="/properties"
          className="inline-flex items-center text-sm font-medium text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Properties
        </Link>
      </div>

      <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl">
          {/* Header - Linear style */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center mb-6">
              <Building className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-white sm:text-3xl">
              Add New Property
            </h1>
            <p className="mt-3 text-base text-neutral-400">
              Add a villa property to your portfolio for management by Sia Moon
              Property Managament Team.
            </p>
          </div>

          {/* Form */}
          <Card className="group hover:shadow-xl transition-all duration-300 card-hover bg-neutral-950 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Property Information</CardTitle>
              <CardDescription className="text-neutral-400">
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

                <GooglePlacesAutocomplete
                  label="Property Address"
                  value={formData.address}
                  onChange={(value, placeResult) => {
                    setFormData(prev => ({ ...prev, address: value }))
                    if (error) setError('')
                  }}
                  onPlaceSelect={(placeResult) => {
                    console.log('Selected place:', placeResult)
                    // You can store additional place data here if needed
                  }}
                  placeholder="123 Beach Road, Tambon Choeng Thale, Thalang District, Phuket 83110, Thailand"
                  required
                  helperText="Start typing to see address suggestions. Include full address with district, province, and postal code"
                  countryRestriction={['th']}
                  types={['address']}
                />

                {error && (
                  <div className="flex items-center space-x-2 p-3 bg-red-950/20 border border-red-800/30 rounded-lg">
                    <p className="text-sm text-red-400 font-medium">{error}</p>
                  </div>
                )}

                <div className="bg-blue-950/20 border border-blue-800/30 rounded-lg p-4">
                  <h4 className="font-medium text-blue-100 mb-2">
                    What happens next?
                  </h4>
                  <ul className="text-sm text-blue-200 space-y-1">
                    <li>• Your property will be added to your portfolio</li>
                    <li>• You can manage bookings and view reports</li>
                    <li>• Staff can be assigned tasks for this property</li>
                    <li>
                      • For comprehensive onboarding, use the villa survey form
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button type="submit" disabled={loading} className="flex-1">
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
