'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { BookingService, LiveBooking } from '@/lib/services/bookingService'
import { 
  Calendar,
  User,
  Home,
  DollarSign,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Filter,
  Search,
  RefreshCw,
  Eye,
  Loader2
} from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function AdminBookingsPage() {
  const [allBookings, setAllBookings] = useState<LiveBooking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<LiveBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [processingBookings, setProcessingBookings] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    loadAllBookings()
  }, [])

  useEffect(() => {
    filterBookings()
  }, [allBookings, searchTerm, statusFilter])

  const loadAllBookings = async () => {
    try {
      setLoading(true)
      console.log('📋 Loading all bookings for admin management...')
      
      const bookings = await BookingService.getAllBookings()
      setAllBookings(bookings)
      
      console.log(`✅ Loaded ${bookings.length} total bookings`)
    } catch (error) {
      console.error('❌ Error loading bookings:', error)
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const filterBookings = () => {
    let filtered = allBookings

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter)
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(booking =>
        booking.guestName?.toLowerCase().includes(term) ||
        booking.villaName?.toLowerCase().includes(term) ||
        booking.bookingReference?.toLowerCase().includes(term)
      )
    }

    setFilteredBookings(filtered)
  }

  const handleBookingAction = async (
    bookingId: string,
    action: 'approved' | 'rejected',
    adminNotes?: string
  ) => {
    try {
      setProcessingBookings(prev => new Set(prev).add(bookingId))
      
      console.log(`📝 ${action === 'approved' ? 'Approving' : 'Rejecting'} booking ${bookingId}`)
      
      const success = await BookingService.updateBookingStatus(bookingId, action, adminNotes)
      
      if (success) {
        toast.success(`Booking ${action === 'approved' ? 'approved' : 'rejected'} successfully`)
        
        // Update local state
        setAllBookings(prev => prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: action, adminNotes }
            : booking
        ))
        
        // TODO: Trigger task creation for approved bookings
        if (action === 'approved') {
          console.log('🔄 TODO: Create staff tasks for approved booking')
        }
      } else {
        toast.error(`Failed to ${action} booking`)
      }
    } catch (error) {
      console.error(`❌ Error ${action} booking:`, error)
      toast.error(`Failed to ${action} booking`)
    } finally {
      setProcessingBookings(prev => {
        const newSet = new Set(prev)
        newSet.delete(bookingId)
        return newSet
      })
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Approved</Badge>
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Rejected</Badge>
      case 'completed':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Completed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getUrgencyBadge = (checkInDate: string) => {
    const checkIn = new Date(checkInDate)
    const now = new Date()
    const daysUntilCheckIn = Math.ceil((checkIn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilCheckIn <= 1) {
      return <Badge variant="destructive" className="bg-red-500/20 text-red-400">Urgent - Today/Tomorrow</Badge>
    } else if (daysUntilCheckIn <= 3) {
      return <Badge variant="secondary" className="bg-orange-500/20 text-orange-400">High Priority - {daysUntilCheckIn} days</Badge>
    } else if (daysUntilCheckIn <= 7) {
      return <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">Medium Priority - {daysUntilCheckIn} days</Badge>
    } else {
      return <Badge variant="secondary" className="bg-green-500/20 text-green-400">Low Priority - {daysUntilCheckIn} days</Badge>
    }
  }

  const stats = {
    total: allBookings.length,
    pending: allBookings.filter(b => b.status === 'pending_approval').length,
    approved: allBookings.filter(b => b.status === 'approved').length,
    rejected: allBookings.filter(b => b.status === 'rejected').length,
    totalRevenue: allBookings
      .filter(b => b.status === 'approved')
      .reduce((sum, b) => sum + (b.revenue || 0), 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            <span className="ml-3 text-neutral-400">Loading bookings...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Calendar className="w-8 h-8 text-blue-400" />
                Booking Management
              </h1>
              <p className="text-neutral-400">
                Manage guest bookings from Make.com automation pipeline
              </p>
            </div>
            <Button
              onClick={loadAllBookings}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-neutral-950 border-neutral-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <p className="text-sm text-neutral-400">Total Bookings</p>
            </CardContent>
          </Card>
          
          <Card className="bg-neutral-950 border-neutral-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
              <p className="text-sm text-neutral-400">Pending Approval</p>
            </CardContent>
          </Card>
          
          <Card className="bg-neutral-950 border-neutral-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-400">{stats.approved}</div>
              <p className="text-sm text-neutral-400">Approved</p>
            </CardContent>
          </Card>
          
          <Card className="bg-neutral-950 border-neutral-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-400">{stats.rejected}</div>
              <p className="text-sm text-neutral-400">Rejected</p>
            </CardContent>
          </Card>
          
          <Card className="bg-neutral-950 border-neutral-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-400">${stats.totalRevenue.toLocaleString()}</div>
              <p className="text-sm text-neutral-400">Approved Revenue</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-neutral-950 border-neutral-800 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                  <Input
                    placeholder="Search by guest name, villa, or booking reference..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-neutral-900 border-neutral-700 text-white"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-md text-white"
                >
                  <option value="all">All Status</option>
                  <option value="pending_approval">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bookings List */}
        <Card className="bg-neutral-950 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Guest Bookings
              <Badge variant="secondary" className="bg-neutral-700 text-neutral-300">
                {filteredBookings.length} bookings
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredBookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                <p className="text-neutral-400 font-medium">No bookings found</p>
                <p className="text-neutral-500 text-sm">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'Bookings will appear here when received from Make.com'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBookings.map((booking) => {
                  const isProcessing = processingBookings.has(booking.id)
                  
                  return (
                    <div
                      key={booking.id}
                      className="p-4 bg-neutral-900 rounded-lg border border-neutral-700 hover:border-neutral-600 transition-colors"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <User className="w-5 h-5 text-neutral-500" />
                          <span className="text-white font-medium text-lg">{booking.guestName}</span>
                          {getUrgencyBadge(booking.checkInDate)}
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(booking.status)}
                          <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
                            Guest Booking
                          </Badge>
                        </div>
                      </div>

                      {/* Booking Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Home className="w-4 h-4 text-neutral-500" />
                          <span className="text-neutral-300">{booking.villaName}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-neutral-500" />
                          <span className="text-neutral-300">
                            {formatDate(booking.checkInDate)} → {formatDate(booking.checkOutDate)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-neutral-500" />
                          <span className="text-green-400 font-medium">
                            ${booking.price?.toLocaleString()} {booking.currency}
                          </span>
                        </div>
                      </div>

                      {/* Special Requests */}
                      {booking.specialRequests && (
                        <div className="mb-4 p-3 bg-neutral-800 rounded border border-neutral-700">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-neutral-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-neutral-300 mb-1">Special Requests:</p>
                              <p className="text-neutral-400 text-sm">{booking.specialRequests}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Client Matching Info */}
                      {booking.clientId ? (
                        <div className="mb-4 p-2 bg-green-500/10 border border-green-500/20 rounded text-sm">
                          <span className="text-green-400">✅ Matched to client: {booking.clientId}</span>
                          {booking.matchConfidence && (
                            <span className="text-green-300 ml-2">
                              ({(booking.matchConfidence * 100).toFixed(0)}% confidence)
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="mb-4 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-sm">
                          <span className="text-yellow-400">⚠️ No client match found - requires manual assignment</span>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {booking.status === 'pending_approval' && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleBookingAction(booking.id, 'approved')}
                            disabled={isProcessing}
                            className="bg-green-600 hover:bg-green-700 text-white flex-1"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <CheckCircle className="w-4 h-4 mr-2" />
                            )}
                            Approve
                          </Button>
                          
                          <Button
                            onClick={() => handleBookingAction(booking.id, 'rejected', 'Rejected by admin')}
                            disabled={isProcessing}
                            variant="outline"
                            className="border-red-500/50 text-red-400 hover:bg-red-500/10 flex-1"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <XCircle className="w-4 h-4 mr-2" />
                            )}
                            Reject
                          </Button>
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="mt-3 pt-3 border-t border-neutral-700 text-xs text-neutral-500">
                        <div className="flex justify-between">
                          <span>Received: {new Date(booking.receivedAt?.toDate?.() || booking.receivedAt).toLocaleString()}</span>
                          {booking.bookingReference && <span>Ref: {booking.bookingReference}</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
