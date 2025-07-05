'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
// TODO: Switch back to Supabase for production
// import { createClient } from '@/lib/supabase/client'
import DatabaseService from '@/lib/dbService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Edit, Trash2, MapPin, Calendar, User, Building } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Property {
  id: string
  name: string
  address: string
  created_at: string
  updated_at: string
  users?: {
    name: string
    email: string
    role: string
  }
}

interface Booking {
  id: string
  guest_name: string
  check_in_date: string
  check_out_date: string
  total_amount: number
  status: string
}

interface Task {
  id: string
  task_type: string
  status: string
  due_date: string
  notes: string
  users?: {
    name: string
  }
}

export default function PropertyDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [property, setProperty] = useState<Property | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  const propertyId = params.id as string

  useEffect(() => {
    if (propertyId) {
      fetchPropertyDetails()
    }
  }, [propertyId])

  const fetchPropertyDetails = async () => {
    try {
      console.log('🔍 Fetching property details from local database...')

      // Fetch property details
      const { data: propertyData, error: propertyError } = await DatabaseService.getProperty(propertyId)

      if (propertyError) {
        throw new Error(`Failed to fetch property: ${propertyError.message}`)
      }

      if (!propertyData) {
        throw new Error('Property not found')
      }

      // Fetch owner details
      const { data: ownerData } = await DatabaseService.getUser(propertyData.owner_id)

      setProperty({
        ...propertyData,
        users: ownerData ? { name: ownerData.name, email: ownerData.email, role: ownerData.role } : undefined
      })

      // For now, set empty arrays for bookings and tasks since we don't have those services yet
      // TODO: Implement booking and task services
      setBookings([])
      setTasks([])

      console.log('✅ Property details loaded successfully')

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
      console.log('🗑️ Deleting property from local database...')

      const { error } = await DatabaseService.deleteProperty(propertyId)

      if (error) {
        throw new Error(`Failed to delete property: ${error.message}`)
      }

      console.log('✅ Property deleted successfully')
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
                  {property.location || property.address}
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
                    <label className="text-sm font-medium text-neutral-400">Owner</label>
                    <p className="text-white">{property.users?.name || 'Unknown'}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-neutral-400">Address</label>
                    <p className="text-white">{property.location || property.address}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-400">Created</label>
                    <p className="text-white">{new Date(property.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-400">Last Updated</label>
                    <p className="text-white">{new Date(property.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Bookings */}
            <Card className="group hover:shadow-xl transition-all duration-300 card-hover bg-neutral-950 border-neutral-800">
              <CardHeader>
                <CardTitle className="text-white">Recent Bookings</CardTitle>
                <CardDescription className="text-neutral-400">Latest guest reservations for this property</CardDescription>
              </CardHeader>
              <CardContent>
                {bookings.length > 0 ? (
                  <div className="space-y-4">
                    {bookings.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
                        <div>
                          <p className="font-medium text-white">{booking.guest_name}</p>
                          <p className="text-sm text-neutral-400">
                            {new Date(booking.check_in_date).toLocaleDateString()} - {new Date(booking.check_out_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-white">฿{booking.total_amount.toLocaleString()}</p>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${
                            booking.status === 'confirmed' ? 'bg-emerald-900 text-emerald-300 border-emerald-800' :
                            booking.status === 'pending' ? 'bg-yellow-900 text-yellow-300 border-yellow-800' :
                            booking.status === 'cancelled' ? 'bg-red-900 text-red-300 border-red-800' :
                            'bg-blue-900 text-blue-300 border-blue-800'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-neutral-400 text-center py-8">No bookings yet</p>
                )}
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
                  <span className="text-neutral-400">Total Bookings</span>
                  <span className="font-medium text-white">{bookings.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Active Tasks</span>
                  <span className="font-medium text-white">{tasks.filter(t => t.status !== 'completed').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Total Revenue</span>
                  <span className="font-medium text-white">
                    ฿{bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + b.total_amount, 0).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Tasks */}
            <Card className="group hover:shadow-xl transition-all duration-300 card-hover bg-neutral-950 border-neutral-800">
              <CardHeader>
                <CardTitle className="text-white">Recent Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                {tasks.length > 0 ? (
                  <div className="space-y-3">
                    {tasks.slice(0, 3).map((task) => (
                      <div key={task.id} className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg">
                        <p className="font-medium text-white text-sm">{task.task_type}</p>
                        <p className="text-xs text-neutral-400">Assigned to: {task.users?.name || 'Unassigned'}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${
                            task.status === 'completed' ? 'bg-emerald-900 text-emerald-300 border-emerald-800' :
                            task.status === 'in_progress' ? 'bg-blue-900 text-blue-300 border-blue-800' :
                            'bg-yellow-900 text-yellow-300 border-yellow-800'
                          }`}>
                            {task.status.replace('_', ' ')}
                          </span>
                          {task.due_date && (
                            <span className="text-xs text-neutral-400">
                              Due: {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-neutral-400 text-center py-4">No tasks yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
