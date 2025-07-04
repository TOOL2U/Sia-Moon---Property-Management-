'use client'

import { useState, useEffect } from 'react'
// TODO: Switch back to Supabase for production
// import { createClient } from '@/lib/supabase/client'
import DatabaseService from '@/lib/dbService'
import { useLocalAuth } from '@/hooks/useLocalAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Calendar, User, Building, Phone, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

interface Booking {
  id: string
  property_id: string
  guest_name: string
  guest_email: string
  check_in: string
  check_out: string
  status: 'pending' | 'confirmed' | 'cancelled'
  created_at: string
  updated_at: string
  property?: {
    name: string
    location: string
  }
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all')
  // TODO: Switch back to Supabase for production
  const { user } = useLocalAuth()

  useEffect(() => {
    fetchBookings()
  }, [filter]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchBookings = async () => {
    try {
      console.log('🔍 Fetching bookings from local database...')

      const { data: bookingsData, error } = await DatabaseService.getAllBookings()

      if (error) {
        console.error('❌ Error fetching bookings:', error)
        toast.error('Failed to load bookings')
        return
      }

      // Fetch property details for each booking
      const bookingsWithProperties = await Promise.all(
        (bookingsData || []).map(async (booking) => {
          const { data: property } = await DatabaseService.getProperty(booking.property_id)
          return {
            ...booking,
            property: property ? { name: property.name, location: property.location } : undefined
          }
        })
      )

      // Apply filter
      let filteredBookings = bookingsWithProperties
      if (filter !== 'all') {
        filteredBookings = bookingsWithProperties.filter(booking => booking.status === filter)
      }

      console.log('✅ Bookings loaded:', filteredBookings.length)
      setBookings(filteredBookings)
    } catch (error) {
      console.error('❌ Error fetching bookings:', error)
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-yellow-900 text-yellow-300 border border-yellow-600',
      confirmed: 'bg-green-900 text-green-300 border border-green-600',
      cancelled: 'bg-red-900 text-red-300 border border-red-600'
    }

    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {status.toUpperCase()}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading bookings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-100">Bookings</h1>
          <p className="mt-2 text-gray-400">Manage your property bookings</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          {['all', 'pending', 'confirmed', 'cancelled'].map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'primary' : 'outline'}
              onClick={() => setFilter(status as typeof filter)}
              size="sm"
            >
              {status.replace('_', ' ').toUpperCase()}
              {status !== 'all' && (
                <span className="ml-2 bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs">
                  {bookings.filter(b => b.status === status).length}
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* Bookings List */}
        {bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-lg">{booking.guest_name}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <Building className="h-4 w-4 mr-1" />
                        {booking.property?.name || 'Property'}
                      </CardDescription>
                    </div>
                    <div className="mt-2 sm:mt-0 flex items-center gap-2">
                      {getStatusBadge(booking.status)}
                      <span className="text-sm text-gray-500">
                        {formatDate(booking.created_at)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <div>
                        <div className="font-medium">Check-in</div>
                        <div>{formatDate(booking.check_in)}</div>
                      </div>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <div>
                        <div className="font-medium">Check-out</div>
                        <div>{formatDate(booking.check_out)}</div>
                      </div>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <User className="h-4 w-4 mr-2" />
                      <div>
                        <div className="font-medium">Duration</div>
                        <div>{calculateNights(booking.check_in, booking.check_out)} nights</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-1" />
                        {booking.guest_email}
                      </div>
                    </div>
                    
                    <div className="mt-2 sm:mt-0 flex gap-2">
                      {booking.status === 'pending' && (
                        <>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            Confirm
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                            Cancel
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? 'No bookings have been made yet.' 
                : `No ${filter} bookings found.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
