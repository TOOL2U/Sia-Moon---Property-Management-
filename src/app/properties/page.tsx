'use client'

import { PropertyImagePlaceholder } from '@/components/PropertyImagePlaceholder'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card'
import { useAuth } from '@/contexts/AuthContext'
import { Property, PropertyService } from '@/lib/services/propertyService'
import { clientToast as toast } from '@/utils/clientToast'
import { formatLocalDate } from '@/utils/dateUtils'
import {
  Building,
  Home,
  Image as ImageIcon,
  MapPin,
  Plus,
  Trash2,
  Users,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    const fetchProperties = async () => {
      if (!user?.id) return

      try {
        console.log('🔍 Loading properties for user:', user.id)
        setLoading(true)

        // Load user's properties from their profile subcollection
        const userProperties =
          await PropertyService.getPropertiesFromUserProfile(user.id)
        setProperties(userProperties)
        console.log(
          '✅ Properties loaded from user profile:',
          userProperties.length
        )
        console.log('📍 Loaded from: /users/' + user.id + '/properties')
      } catch (error) {
        console.error('❌ Error loading properties:', error)
        toast.error('Failed to load properties')
        setProperties([]) // Set empty array on error
      } finally {
        setLoading(false)
      }
    }

    // Only fetch properties when user is loaded and authenticated
    if (!authLoading && user?.id) {
      fetchProperties()
    } else if (!authLoading && !user) {
      // User is not authenticated
      setLoading(false)
      toast.error('Please sign in to view properties')
    }
  }, [user, authLoading])

  const handleDelete = async (propertyId: string, propertyName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${propertyName}"? This action cannot be undone.`
      )
    ) {
      return
    }

    setDeleting(propertyId)
    try {
      // TODO: Implement delete functionality in local database
      console.log('🔄 Delete property:', propertyId)
      toast.success('Property deleted successfully (mock)')

      // Remove from local state for now
      setProperties((prev) => prev.filter((p) => p.id !== propertyId))
    } catch (error) {
      console.error('❌ Error deleting property:', error)
      toast.error('Failed to delete property')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading properties...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-6 py-8 lg:px-8">
        {/* Header - Linear style */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white sm:text-3xl">
              Properties
            </h1>
            <p className="mt-2 text-neutral-400">
              Manage your villa properties
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link href="/properties/add">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Property
              </Button>
            </Link>
          </div>
        </div>

        {/* Properties Grid */}
        {properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <Card
                key={property.id}
                className="group hover:shadow-xl transition-all duration-300 card-hover bg-neutral-950 border-neutral-800 overflow-hidden"
              >
                {/* Cover Photo */}
                <div className="relative h-48 bg-neutral-800">
                  {property.coverPhoto ||
                  (property.images && property.images.length > 0) ? (
                    <Image
                      src={property.coverPhoto || property.images![0]}
                      alt={`${property.name} - Cover Photo`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <PropertyImagePlaceholder
                      propertyName={property.name}
                      className="h-full rounded-t-lg"
                    />
                  )}
                  {/* Status Badge Overlay */}
                  <div className="absolute top-3 right-3">
                    <Badge
                      variant="secondary"
                      className={
                        property.status === 'active'
                          ? 'bg-emerald-900/90 text-emerald-300 border border-emerald-800/50 backdrop-blur-sm'
                          : property.status === 'pending_approval'
                            ? 'bg-yellow-900/90 text-yellow-300 border border-yellow-800/50 backdrop-blur-sm'
                            : 'bg-neutral-900/90 text-neutral-300 border border-neutral-800/50 backdrop-blur-sm'
                      }
                    >
                      {property.status === 'active'
                        ? 'Active'
                        : property.status === 'pending_approval'
                          ? 'Pending Approval'
                          : 'Inactive'}
                    </Badge>
                  </div>

                  {/* Photo Count Indicator */}
                  {property.images && property.images.length > 1 && (
                    <div className="absolute bottom-3 left-3">
                      <Badge
                        variant="secondary"
                        className="bg-black/70 text-white border-neutral-700/50 backdrop-blur-sm"
                      >
                        <ImageIcon className="h-3 w-3 mr-1" />
                        {property.images.length}
                      </Badge>
                    </div>
                  )}
                </div>

                <CardHeader>
                  <div>
                    <CardTitle className="text-lg text-white">
                      {property.name}
                    </CardTitle>
                    <CardDescription className="flex items-center mt-1 text-neutral-400">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="truncate">{property.address}</span>
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    {/* Property Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {property.bedrooms && (
                        <div className="flex items-center text-neutral-400">
                          <Home className="h-4 w-4 mr-1" />
                          {property.bedrooms} bed
                        </div>
                      )}
                      {property.bathrooms && (
                        <div className="flex items-center text-neutral-400">
                          <Home className="h-4 w-4 mr-1" />
                          {property.bathrooms} bath
                        </div>
                      )}
                      {property.maxGuests && (
                        <div className="flex items-center text-neutral-400">
                          <Users className="h-4 w-4 mr-1" />
                          {property.maxGuests} guests
                        </div>
                      )}
                    </div>

                    {property.description && (
                      <div className="text-sm text-neutral-400">
                        {property.description}
                      </div>
                    )}

                    <div className="text-sm text-neutral-500">
                      Added {formatLocalDate(property.createdAt)}
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="flex gap-2">
                        <Link href={`/properties/${property.id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                          >
                            View Details
                          </Button>
                        </Link>
                        <Link href={`/properties/${property.id}/edit`}>
                          <Button size="sm" className="flex-1">
                            Edit
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            handleDelete(property.id, property.name)
                          }
                          disabled={deleting === property.id}
                          className="px-3 bg-red-600 hover:bg-red-700 text-white"
                        >
                          {deleting === property.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Building className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              No properties found
            </h3>
            <p className="text-neutral-400 mb-6">
              Get started by adding your first villa property.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/properties/add">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Property
                </Button>
              </Link>
              <Link href="/onboard">
                <Button variant="outline">Use Full Onboarding Survey</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
