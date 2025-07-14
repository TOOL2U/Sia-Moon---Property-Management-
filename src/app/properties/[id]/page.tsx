'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { PropertyService, Property } from '@/lib/services/propertyService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Edit, Trash2, MapPin, Calendar, User, Building, Image as ImageIcon, Home, Users } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { PropertyImagePlaceholder } from '@/components/PropertyImagePlaceholder'

export default function PropertyDetailsPage() {
  const { user, loading: authLoading } = useAuth()
  const params = useParams()
  const router = useRouter()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  const propertyId = params.id as string

  useEffect(() => {
    if (!authLoading && user && propertyId) {
      fetchPropertyDetails()
    }
  }, [authLoading, user, propertyId])

  const fetchPropertyDetails = async () => {
    try {
      console.log('🔍 Fetching property details:', propertyId)
      console.log('👤 User ID:', user?.id)
      setLoading(true)

      // First try to get property from user's subcollection
      const propertyData = await PropertyService.getPropertyFromUserProfile(user!.id, propertyId)

      if (!propertyData) {
        console.log('❌ Property not found in user subcollection')
        toast.error('Property not found')
        router.push('/properties')
        return
      }

      // Property found in user's subcollection, so user automatically owns it
      setProperty(propertyData)
      console.log('✅ Property details loaded from user subcollection')
      console.log('📍 Loaded from: /users/' + user!.id + '/properties/' + propertyId)

    } catch (error) {
      console.error('❌ Error fetching property details:', error)
      toast.error('Failed to load property details')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    try {
      console.log('🗑️ Deleting property (development mode - mock delete)')

      // TODO: Replace with real database delete when new database service is implemented
      // Simulate delete delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      console.log('✅ Property deleted successfully (mock)')
      toast.success('Property deleted successfully')
      router.push('/properties')
    } catch (error) {
      console.error('❌ Error deleting property:', error)
      toast.error('Failed to delete property')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-neutral-400 text-sm">Loading property details...</p>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Building className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-white mb-2">Property Not Found</h2>
          <p className="text-neutral-400 mb-6">The property you're looking for doesn't exist.</p>
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
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-6 py-8 lg:px-8">
        {/* Header - Linear style */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/properties">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-semibold text-white sm:text-3xl">{property.name}</h1>
                <p className="text-neutral-400 flex items-center mt-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  {property.address}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link href={`/properties/${propertyId}/edit`}>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>

        {/* Hero Cover Photo */}
        <div className="mb-8">
          <Card className="bg-neutral-950 border-neutral-800 overflow-hidden">
            <div className="relative h-64 md:h-80 lg:h-96">
              {(property.coverPhoto || (property.images && property.images.length > 0)) ? (
                <>
                  <Image
                    src={property.coverPhoto || property.images![0]}
                    alt={`${property.name} - Cover Photo`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </>
              ) : (
                <PropertyImagePlaceholder
                  propertyName={property.name}
                  className="h-full"
                  showText={false}
                />
              )}
              <div className="absolute bottom-6 left-6 right-6">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{property.name}</h1>
                {property.address && (
                  <p className="text-neutral-200 flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    {property.address}
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Property Images Gallery */}
        {property.images && property.images.length > 1 && (
          <div className="mb-8">
            <Card className="bg-neutral-950 border-neutral-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Additional Photos ({property.images.length - 1})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {property.images.slice(1).map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square bg-neutral-800 rounded-lg overflow-hidden">
                        <Image
                          src={imageUrl}
                          alt={`${property.name} - Photo ${index + 2}`}
                          width={300}
                          height={300}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(imageUrl, '_blank')}
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                        >
                          <ImageIcon className="h-4 w-4 mr-2" />
                          View Full Size
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Property Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card className="group hover:shadow-xl transition-all duration-300 card-hover bg-neutral-950 border-neutral-800">
              <CardHeader>
                <CardTitle className="text-white">Property Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-neutral-400">Property Name</label>
                    <p className="text-white">{property.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-400">Status</label>
                    <p className={`font-medium ${
                      property.status === 'active' ? 'text-green-400' :
                      property.status === 'pending_approval' ? 'text-yellow-400' :
                      'text-neutral-400'
                    }`}>
                      {property.status === 'active' ? 'Active' :
                       property.status === 'pending_approval' ? 'Pending Approval' : 'Inactive'}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-neutral-400">Address</label>
                    <p className="text-white">{property.address}</p>
                  </div>
                  {property.description && (
                    <div className="sm:col-span-2">
                      <label className="text-sm font-medium text-neutral-400">Description</label>
                      <p className="text-white">{property.description}</p>
                    </div>
                  )}

                  {/* Property Details */}
                  {(property.bedrooms || property.bathrooms || property.maxGuests) && (
                    <>
                      {property.bedrooms && (
                        <div>
                          <label className="text-sm font-medium text-neutral-400">Bedrooms</label>
                          <p className="text-white flex items-center">
                            <Home className="h-4 w-4 mr-1" />
                            {property.bedrooms}
                          </p>
                        </div>
                      )}
                      {property.bathrooms && (
                        <div>
                          <label className="text-sm font-medium text-neutral-400">Bathrooms</label>
                          <p className="text-white flex items-center">
                            <Home className="h-4 w-4 mr-1" />
                            {property.bathrooms}
                          </p>
                        </div>
                      )}
                      {property.maxGuests && (
                        <div>
                          <label className="text-sm font-medium text-neutral-400">Max Guests</label>
                          <p className="text-white flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {property.maxGuests}
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  <div>
                    <label className="text-sm font-medium text-neutral-400">Created</label>
                    <p className="text-white">
                      {(() => {
                        if (property.createdAt && typeof property.createdAt.toDate === 'function') {
                          return property.createdAt.toDate().toLocaleDateString()
                        } else if (property.createdAt) {
                          return new Date(property.createdAt as any).toLocaleDateString()
                        } else {
                          return new Date().toLocaleDateString()
                        }
                      })()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-400">Last Updated</label>
                    <p className="text-white">
                      {(() => {
                        if (property.updatedAt && typeof property.updatedAt.toDate === 'function') {
                          return property.updatedAt.toDate().toLocaleDateString()
                        } else if (property.updatedAt) {
                          return new Date(property.updatedAt as any).toLocaleDateString()
                        } else {
                          return new Date().toLocaleDateString()
                        }
                      })()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Property Status */}
            <Card className="group hover:shadow-xl transition-all duration-300 card-hover bg-neutral-950 border-neutral-800">
              <CardHeader>
                <CardTitle className="text-white">Property Status</CardTitle>
                <CardDescription className="text-neutral-400">Current status and next steps</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
                    <div>
                      <p className="font-medium text-white">Current Status</p>
                      <p className="text-sm text-neutral-400">
                        {property.status === 'pending_approval' ? 'Awaiting admin approval' :
                         property.status === 'active' ? 'Property is live and accepting bookings' :
                         'Property is currently inactive'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border ${
                        property.status === 'active' ? 'bg-emerald-900 text-emerald-300 border-emerald-800' :
                        property.status === 'pending_approval' ? 'bg-yellow-900 text-yellow-300 border-yellow-800' :
                        'bg-neutral-900 text-neutral-300 border-neutral-800'
                      }`}>
                        {property.status === 'active' ? 'Active' :
                         property.status === 'pending_approval' ? 'Pending Approval' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {property.status === 'pending_approval' && (
                    <div className="p-4 bg-yellow-900/20 border border-yellow-800/30 rounded-lg">
                      <p className="text-yellow-300 text-sm">
                        Your property is under review by our team. You'll be notified once it's approved and ready to accept bookings.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="group hover:shadow-xl transition-all duration-300 card-hover bg-neutral-950 border-neutral-800">
              <CardHeader>
                <CardTitle className="text-white">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Property Status</span>
                  <span className={`font-medium ${
                    property.status === 'active' ? 'text-green-400' :
                    property.status === 'pending_approval' ? 'text-yellow-400' :
                    'text-neutral-400'
                  }`}>
                    {property.status === 'active' ? 'Active' :
                     property.status === 'pending_approval' ? 'Pending Approval' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Photos Uploaded</span>
                  <span className="font-medium text-white">{property.images?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Created Date</span>
                  <span className="font-medium text-white">
                    {(() => {
                      if (property.createdAt && typeof property.createdAt.toDate === 'function') {
                        return property.createdAt.toDate().toLocaleDateString()
                      } else if (property.createdAt) {
                        return new Date(property.createdAt as any).toLocaleDateString()
                      } else {
                        return new Date().toLocaleDateString()
                      }
                    })()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Property Amenities */}
            <Card className="group hover:shadow-xl transition-all duration-300 card-hover bg-neutral-950 border-neutral-800">
              <CardHeader>
                <CardTitle className="text-white">Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                {property.amenities && property.amenities.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {property.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center p-2 bg-neutral-900 border border-neutral-800 rounded-lg">
                        <span className="text-sm text-white">{amenity}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {property.hasPool && (
                      <div className="flex items-center p-2 bg-neutral-900 border border-neutral-800 rounded-lg">
                        <span className="text-sm text-white">Swimming Pool</span>
                      </div>
                    )}
                    {property.hasGarden && (
                      <div className="flex items-center p-2 bg-neutral-900 border border-neutral-800 rounded-lg">
                        <span className="text-sm text-white">Garden</span>
                      </div>
                    )}
                    {property.hasAirConditioning && (
                      <div className="flex items-center p-2 bg-neutral-900 border border-neutral-800 rounded-lg">
                        <span className="text-sm text-white">Air Conditioning</span>
                      </div>
                    )}
                    {property.hasParking && (
                      <div className="flex items-center p-2 bg-neutral-900 border border-neutral-800 rounded-lg">
                        <span className="text-sm text-white">Parking</span>
                      </div>
                    )}
                    {property.hasLaundry && (
                      <div className="flex items-center p-2 bg-neutral-900 border border-neutral-800 rounded-lg">
                        <span className="text-sm text-white">Laundry</span>
                      </div>
                    )}
                    {!property.amenities && !property.hasPool && !property.hasGarden && !property.hasAirConditioning && !property.hasParking && !property.hasLaundry && (
                      <p className="text-neutral-400 text-center py-4">No amenities listed</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
