'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
// TODO: Replace with new database service when implemented
// import { createClient } from '@/lib/newDatabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { ArrowLeft, Save, Building } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface PropertyFormData {
  name: string
  address: string
}

interface Property {
  id: string
  name: string
  address: string
  client_id: string
  created_at: string
  updated_at: string
  users?: {
    name: string
    email: string
  }
}

export default function EditPropertyPage() {
  const params = useParams()
  const router = useRouter()
  const [formData, setFormData] = useState<PropertyFormData>({
    name: '',
    address: ''
  })
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  // TODO: Replace with new database service when implemented
  // const supabase = createClient()

  const propertyId = params.id as string

  useEffect(() => {
    if (propertyId) {
      fetchProperty()
    }
  }, [propertyId])

  const fetchProperty = async () => {
    try {
      console.log('🔍 Loading property for editing (development mode with mock data)')

      // Load property from Firestore for editing

      // Load property from Firestore for editing
      // For new users, no properties will exist
      toast.error('Property not found - new user has no properties')
      router.push('/properties')
      return
    } catch (error) {
      console.error('❌ Error loading property:', error)
      toast.error('Failed to load property')
      router.push('/properties')
    } finally {
      setLoading(false)
    }
  }

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
      setError('Property address is required')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setSaving(true)
    setError('')

    try {
      console.log('🔄 Updating property (development mode - mock update)')

      // TODO: Replace with real database update when new database service is implemented
      // Simulate update delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Update local state to reflect changes
      if (property) {
        const updatedProperty = {
          ...property,
          name: formData.name,
          address: formData.address,
          updated_at: new Date().toISOString()
        }
        setProperty(updatedProperty)
      }

      console.log('✅ Property updated successfully (mock):', formData.name)
      toast.success('Property updated successfully!')
      router.push(`/properties/${propertyId}`)

    } catch (err: unknown) {
      console.error('❌ Error updating property:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update property. Please try again.'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property...</p>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Not Found</h2>
          <p className="text-gray-600 mb-6">The property you&apos;re trying to edit doesn&apos;t exist.</p>
          <Link href="/properties">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Properties
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Back to property link */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
        <Link 
          href={`/properties/${propertyId}`}
          className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Property
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
              Edit Property
            </h1>
            <p className="mt-3 text-base text-gray-600">
              Update the details for <strong>{property.name}</strong>
            </p>
          </div>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Property Information</CardTitle>
              <CardDescription>
                Update the basic details for your property.
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

                {/* Property Info */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Property Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Owner:</span> {property.users?.name || 'Unknown'}
                    </div>
                    <div>
                      <span className="font-medium">Created:</span> {new Date(property.created_at).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Last Updated:</span> {new Date(property.updated_at).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Property ID:</span> {property.id.slice(0, 8)}...
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving Changes...' : 'Save Changes'}
                  </Button>
                  
                  <Link href={`/properties/${propertyId}`} className="flex-1">
                    <Button variant="outline" fullWidth>
                      Cancel
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
