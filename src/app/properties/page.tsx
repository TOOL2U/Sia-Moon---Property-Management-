'use client'

import { useState, useEffect } from 'react'
// TODO: Switch back to Supabase for production
// import { createClient } from '@/lib/supabase/client'
import DatabaseService from '@/lib/dbService'
import { useLocalAuth } from '@/hooks/useLocalAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Building, MapPin, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Property {
  id: string
  name: string
  description: string
  location: string
  owner_id: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
  owner?: {
    name: string
    email: string
  }
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  // TODO: Switch back to Supabase for production
  const { user } = useLocalAuth()

  useEffect(() => {
    fetchProperties()
  }, [])

  const handleDelete = async (propertyId: string, propertyName: string) => {
    if (!confirm(`Are you sure you want to delete "${propertyName}"? This action cannot be undone.`)) {
      return
    }

    setDeleting(propertyId)
    try {
      // TODO: Implement delete functionality in local database
      console.log('🔄 Delete property:', propertyId)
      toast.success('Property deleted successfully (mock)')

      // Remove from local state for now
      setProperties(prev => prev.filter(p => p.id !== propertyId))
    } catch (error) {
      console.error('❌ Error deleting property:', error)
      toast.error('Failed to delete property')
    } finally {
      setDeleting(null)
    }
  }

  const fetchProperties = async () => {
    try {
      console.log('🔍 Fetching properties from local database...')

      const { data: propertiesData, error } = await DatabaseService.getAllProperties()

      if (error) {
        console.error('❌ Error fetching properties:', error)
        toast.error('Failed to load properties')
        return
      }

      // Fetch owner details for each property
      const propertiesWithOwners = await Promise.all(
        (propertiesData || []).map(async (property) => {
          const { data: owner } = await DatabaseService.getUser(property.owner_id)
          return {
            ...property,
            owner: owner ? { name: owner.name, email: owner.email } : undefined
          }
        })
      )

      console.log('✅ Properties loaded:', propertiesWithOwners.length)
      setProperties(propertiesWithOwners)
    } catch (error) {
      console.error('❌ Error fetching properties:', error)
      toast.error('Failed to load properties')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
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
            <h1 className="text-2xl font-semibold text-white sm:text-3xl">Properties</h1>
            <p className="mt-2 text-neutral-400">Manage your villa properties</p>
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
              <Card key={property.id} className="group hover:shadow-xl transition-all duration-300 card-hover bg-neutral-950 border-neutral-800">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg text-white">{property.name}</CardTitle>
                      <CardDescription className="flex items-center mt-1 text-neutral-400">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="truncate">{property.location}</span>
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className={property.status === 'active' ? 'bg-emerald-900 text-emerald-300 border border-emerald-800' : 'bg-neutral-900 text-neutral-300 border border-neutral-800'}>
                      {property.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm text-neutral-400">
                      <div className="flex items-center mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="truncate">{property.location}</span>
                      </div>
                      <div className="text-sm text-neutral-400 mb-2">
                        {property.description}
                      </div>
                    </div>

                    <div className="text-sm text-neutral-500">
                      Added {new Date(property.created_at).toLocaleDateString()}
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="text-sm text-neutral-400">
                        Owner: {property.owner?.name || 'Unknown'}
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/properties/${property.id}`}>
                          <Button size="sm" variant="outline" className="flex-1">
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
                          variant="destructive"
                          onClick={() => handleDelete(property.id, property.name)}
                          disabled={deleting === property.id}
                          className="px-3"
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
            <h3 className="text-lg font-medium text-white mb-2">No properties found</h3>
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
                <Button variant="outline">
                  Use Full Onboarding Survey
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
