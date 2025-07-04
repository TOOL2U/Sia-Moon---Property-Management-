'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
  const supabase = createClient()

  const propertyId = params.id as string

  useEffect(() => {
    if (propertyId) {
      fetchPropertyDetails()
    }
  }, [propertyId])

  const fetchPropertyDetails = async () => {
    try {
      // Fetch property with owner info
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select(`
          *,
          users!properties_client_id_fkey(name, email, role)
        `)
        .eq('id', propertyId)
        .single()

      if (propertyError) throw propertyError
      setProperty(propertyData)

      // Fetch bookings for this property
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('property_id', propertyId)
        .order('check_in_date', { ascending: false })

      if (bookingsError) throw bookingsError
      setBookings(bookingsData || [])

      // Fetch tasks for this property
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          users!tasks_staff_id_fkey(name)
        `)
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })

      if (tasksError) throw tasksError
      setTasks(tasksData || [])

    } catch (error) {
      console.error('Error fetching property details:', error)
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
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId)

      if (error) throw error

      toast.success('Property deleted successfully')
      router.push('/properties')
    } catch (error) {
      console.error('Error deleting property:', error)
      toast.error('Failed to delete property')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property details...</p>
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
          <p className="text-gray-600 mb-6">The property you're looking for doesn't exist.</p>
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
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
                <h1 className="text-3xl font-bold text-gray-900">{property.name}</h1>
                <p className="text-gray-600 flex items-center mt-1">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Property Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Property Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Property Name</label>
                    <p className="text-gray-900">{property.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Owner</label>
                    <p className="text-gray-900">{property.users?.name || 'Unknown'}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-gray-500">Address</label>
                    <p className="text-gray-900">{property.address}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created</label>
                    <p className="text-gray-900">{new Date(property.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Last Updated</label>
                    <p className="text-gray-900">{new Date(property.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Bookings */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
                <CardDescription>Latest guest reservations for this property</CardDescription>
              </CardHeader>
              <CardContent>
                {bookings.length > 0 ? (
                  <div className="space-y-4">
                    {bookings.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{booking.guest_name}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(booking.check_in_date).toLocaleDateString()} - {new Date(booking.check_out_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">฿{booking.total_amount.toLocaleString()}</p>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No bookings yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Bookings</span>
                  <span className="font-medium">{bookings.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Active Tasks</span>
                  <span className="font-medium">{tasks.filter(t => t.status !== 'completed').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Revenue</span>
                  <span className="font-medium">
                    ฿{bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + b.total_amount, 0).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Tasks */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                {tasks.length > 0 ? (
                  <div className="space-y-3">
                    {tasks.slice(0, 3).map((task) => (
                      <div key={task.id} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium text-gray-900 text-sm">{task.task_type}</p>
                        <p className="text-xs text-gray-600">Assigned to: {task.users?.name || 'Unassigned'}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            task.status === 'completed' ? 'bg-green-100 text-green-800' :
                            task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {task.status.replace('_', ' ')}
                          </span>
                          {task.due_date && (
                            <span className="text-xs text-gray-500">
                              Due: {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No tasks yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
