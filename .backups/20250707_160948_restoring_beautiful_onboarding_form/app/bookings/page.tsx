'use client'

import { useState, useEffect } from 'react'
// TODO: Replace with new database service when implemented
// import DatabaseService from '@/lib/newDatabaseService'
import { useAuth } from '@/contexts/AuthContext'
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
  const { user } = useAuth()

  useEffect(() => {
    fetchBookings()
  }, [filter]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchBookings = async () => {
    try {
      console.log('🔍 Loading bookings (development mode with mock data)')
      setLoading(true)

      // TODO: Replace with real data loading when new database service is implemented
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 800))

      // Mock bookings data
      const mockBookings: Booking[] = [
        {
          id: 'booking-1',
          property_id: 'prop-1',
          guest_name: 'Sarah Johnson',
          guest_email: 'sarah.johnson@email.com',
          check_in: '2024-07-15',
          check_out: '2024-07-22',
          status: 'confirmed',
          created_at: '2024-07-01',
          updated_at: '2024-07-01',
          property: {
            name: 'Sunset Villa Bali',
            location: 'Seminyak, Bali'
          }
        },
        {
          id: 'booking-2',
          property_id: 'prop-2',
          guest_name: 'Mike Chen',
          guest_email: 'mike.chen@email.com',
          check_in: '2024-07-20',
          check_out: '2024-07-25',
          status: 'pending',
          created_at: '2024-07-02',
          updated_at: '2024-07-02',
          property: {
            name: 'Ocean View Retreat',
            location: 'Canggu, Bali'
          }
        },
        {
          id: 'booking-3',
          property_id: 'prop-1',
          guest_name: 'Emma Wilson',
          guest_email: 'emma.wilson@email.com',
          check_in: '2024-08-01',
          check_out: '2024-08-07',
          status: 'confirmed',
          created_at: '2024-07-10',
          updated_at: '2024-07-10',
          property: {
            name: 'Sunset Villa Bali',
            location: 'Seminyak, Bali'
          }
        },
        {
          id: 'booking-4',
          property_id: 'prop-2',
          guest_name: 'David Brown',
          guest_email: 'david.brown@email.com',
          check_in: '2024-06-15',
          check_out: '2024-06-20',
          status: 'cancelled',
          created_at: '2024-06-01',
          updated_at: '2024-06-10',
          property: {
            name: 'Ocean View Retreat',
            location: 'Canggu, Bali'
          }
        }
      ]

      // Apply filter
      const filteredBookings = filter === 'all'
        ? mockBookings
        : mockBookings.filter(booking => booking.status === filter)

      console.log(`✅ Loaded ${filteredBookings.length} bookings (filter: ${filter})`)
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-neutral-400 text-sm">Loading bookings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-6 py-8 lg:px-8">
        {/* Header - Linear style */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">Bookings</h1>
          <p className="mt-2 text-neutral-400">Manage your property bookings</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          {['all', 'pending', 'confirmed', 'cancelled'].map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              onClick={() => setFilter(status as typeof filter)}
              size="sm"
            >
              {status.replace('_', ' ').toUpperCase()}
              {status !== 'all' && (
                <span className="ml-2 bg-neutral-800 px-2 py-1 rounded-full text-xs">
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
              <Card key={booking.id} className="group hover:shadow-xl transition-all duration-300 card-hover bg-neutral-950 border-neutral-800">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-lg text-white">{booking.guest_name}</CardTitle>
                      <CardDescription className="flex items-center mt-1 text-neutral-400">
                        <Building className="h-4 w-4 mr-1" />
                        {booking.property?.name || 'Property'}
                      </CardDescription>
                    </div>
                    <div className="mt-2 sm:mt-0 flex items-center gap-2">
                      {getStatusBadge(booking.status)}
                      <span className="text-sm text-neutral-400">
                        {formatDate(booking.created_at)}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex items-center text-sm text-neutral-400">
                      <Calendar className="h-4 w-4 mr-2" />
                      <div>
                        <div className="font-medium text-neutral-300">Check-in</div>
                        <div>{formatDate(booking.check_in)}</div>
                      </div>
                    </div>

                    <div className="flex items-center text-sm text-neutral-400">
                      <Calendar className="h-4 w-4 mr-2" />
                      <div>
                        <div className="font-medium text-neutral-300">Check-out</div>
                        <div>{formatDate(booking.check_out)}</div>
                      </div>
                    </div>

                    <div className="flex items-center text-sm text-neutral-400">
                      <User className="h-4 w-4 mr-2" />
                      <div>
                        <div className="font-medium text-neutral-300">Duration</div>
                        <div>{calculateNights(booking.check_in, booking.check_out)} nights</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-neutral-800 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center space-x-4 text-sm text-neutral-400">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-1" />
                        {booking.guest_email}
                      </div>
                    </div>

                    <div className="mt-2 sm:mt-0 flex gap-2">
                      {booking.status === 'pending' && (
                        <>
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                            Confirm
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-400 border-red-800 hover:bg-red-900">
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
            <Calendar className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No bookings found</h3>
            <p className="text-neutral-400">
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
