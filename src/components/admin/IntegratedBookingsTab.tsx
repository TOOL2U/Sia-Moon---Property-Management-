'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { toast } from 'sonner'
import {
  Calendar,
  Clock,
  User,
  Home,
  DollarSign,
  Users,
  MapPin,
  Bot,
  Brain,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Filter,
  Search,
  Eye,
  UserCheck,
  Loader2,
  ExternalLink
} from 'lucide-react'

interface IntegratedBookingsTabProps {
  onBookingApproved?: (bookingId: string) => void
  onStaffAssigned?: (bookingId: string, staffIds: string[]) => void
}

export function IntegratedBookingsTab({
  onBookingApproved,
  onStaffAssigned
}: IntegratedBookingsTabProps) {
  // State management
  const [allBookings, setAllBookings] = useState<any[]>([])
  const [pendingBookings, setPendingBookings] = useState<any[]>([])
  const [confirmedBookings, setConfirmedBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processingBookingId, setProcessingBookingId] = useState<string | null>(null)
  const [automationEnabled, setAutomationEnabled] = useState(true)
  const [aiSummary, setAiSummary] = useState<string>('')

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [propertyFilter, setPropertyFilter] = useState('all')
  const [dateRangeFilter, setDateRangeFilter] = useState({ start: '', end: '' })

  // Modal states (temporarily disabled)
  // const [bookingApprovalModal, setBookingApprovalModal] = useState<{ booking: any } | null>(null)
  // const [staffAssignmentModal, setStaffAssignmentModal] = useState<{ booking: any } | null>(null)

  // Load all bookings from multiple sources
  const loadAllBookings = useCallback(async () => {
    try {
      setLoading(true)
      console.log('📋 Loading integrated bookings from all sources...')

      // Load from integrated endpoint that combines all sources
      const integratedResponse = await fetch('/api/admin/bookings/integrated?limit=100')

      if (integratedResponse.ok) {
        const integratedData = await integratedResponse.json()

        if (integratedData.success) {
          const bookings = integratedData.data.bookings || []
          const stats = integratedData.data.stats || {}

          // Separate bookings by status for compatibility
          const pending = bookings.filter(b => b.status === 'pending' || b.status === 'pending_approval')
          const confirmed = bookings.filter(b => b.status === 'approved' || b.status === 'confirmed')

          setPendingBookings(pending)
          setConfirmedBookings(confirmed)
          setAllBookings(bookings)

          console.log(`✅ Loaded ${bookings.length} integrated bookings`)
          console.log(`📊 Stats:`, stats)

          generateAISummary(bookings)
          return
        }
      }

      // Fallback to individual endpoints if integrated endpoint fails
      const [pendingResponse, confirmedResponse, liveResponse] = await Promise.all([
        fetch('/api/admin/bookings/pending'),
        fetch('/api/admin/bookings/confirmed'),
        fetch('/api/bookings?mobile=true', {
          headers: {
            'X-API-Key': 'sia-moon-mobile-app-2025-secure-key',
            'X-Mobile-Secret': 'mobile-app-sync-2025-secure'
          }
        })
      ])

      const pendingData = pendingResponse.ok ? await pendingResponse.json() : { bookings: [] }
      const confirmedData = confirmedResponse.ok ? await confirmedResponse.json() : { bookings: [] }
      const liveData = liveResponse.ok ? await liveResponse.json() : { data: { bookings: [] } }

      const pending = pendingData.bookings || []
      const confirmed = confirmedData.bookings || []
      const live = liveData.data?.bookings || []

      setPendingBookings(pending)
      setConfirmedBookings(confirmed)

      // Combine all bookings and remove duplicates
      const combined = [...pending, ...confirmed, ...live]
      const uniqueBookings = combined.filter((booking, index, self) => 
        index === self.findIndex(b => b.id === booking.id)
      )

      setAllBookings(uniqueBookings)

      console.log(`✅ Loaded ${uniqueBookings.length} total bookings`)
      console.log(`📊 Breakdown: ${pending.length} pending, ${confirmed.length} confirmed, ${live.length} live`)

      // Generate AI summary
      generateAISummary(uniqueBookings)

    } catch (error) {
      console.error('❌ Error loading bookings:', error)
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }, [])

  // Generate AI summary
  const generateAISummary = (bookings: any[]) => {
    const pendingCount = bookings.filter(b => b.status === 'pending' || b.status === 'pending_approval').length
    const approvedCount = bookings.filter(b => b.status === 'approved' || b.status === 'confirmed').length
    const todayCheckIns = bookings.filter(b => {
      const checkIn = new Date(b.checkInDate || b.checkIn || b.check_in)
      const today = new Date()
      return checkIn.toDateString() === today.toDateString()
    }).length

    const summary = `📊 Current Status: ${pendingCount} bookings awaiting approval, ${approvedCount} confirmed reservations. ${todayCheckIns} guests checking in today. ${automationEnabled ? '🤖 AI automation is active for intelligent processing.' : '⚠️ Manual review mode enabled.'}`
    
    setAiSummary(summary)
  }

  // Filter bookings
  const filteredBookings = allBookings.filter(booking => {
    const matchesSearch = !searchTerm || 
      booking.guestName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.guest_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.propertyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.property?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter

    const matchesProperty = propertyFilter === 'all' || 
      booking.propertyName === propertyFilter ||
      booking.property === propertyFilter

    return matchesSearch && matchesStatus && matchesProperty
  })

  // Handle booking approval
  const handleBookingApproval = async (bookingId: string, action: 'approve' | 'reject', notes?: string) => {
    try {
      setProcessingBookingId(bookingId)

      const response = await fetch('/api/bookings/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          action,
          adminId: 'current-admin-id',
          adminName: 'Admin User',
          notes: notes || `Booking ${action}d via Back Office`
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`Booking ${action}d successfully!`)
        
        // Update local state
        setAllBookings(prev => prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: action === 'approve' ? 'approved' : 'rejected' }
            : booking
        ))

        // Trigger callback
        if (action === 'approve' && onBookingApproved) {
          onBookingApproved(bookingId)
        }

        // Auto-open staff assignment for approved bookings (temporarily disabled)
        if (action === 'approve') {
          console.log('✅ Booking approved - staff assignment would open here')
          // const booking = allBookings.find(b => b.id === bookingId)
          // if (booking) {
          //   setTimeout(() => {
          //     setStaffAssignmentModal({ booking })
          //   }, 1000)
          // }
        }

      } else {
        toast.error(result.error || `Failed to ${action} booking`)
      }
    } catch (error) {
      console.error(`Error ${action}ing booking:`, error)
      toast.error(`Failed to ${action} booking`)
    } finally {
      setProcessingBookingId(null)
    }
  }

  // Open booking approval modal (temporarily disabled)
  const openBookingApprovalModal = (booking: any) => {
    console.log('📋 Would open booking approval modal for:', booking.id)
    // Temporarily disabled modal functionality
    toast.info('Booking approval modal would open here')
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
      case 'pending_approval':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'approved':
      case 'confirmed':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'cancelled':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    }
  }

  // Calculate stats
  const stats = {
    total: allBookings.length,
    pending: allBookings.filter(b => b.status === 'pending' || b.status === 'pending_approval').length,
    approved: allBookings.filter(b => b.status === 'approved' || b.status === 'confirmed').length,
    rejected: allBookings.filter(b => b.status === 'rejected').length,
    todayCheckIns: allBookings.filter(b => {
      const checkIn = new Date(b.checkInDate || b.checkIn || b.check_in)
      const today = new Date()
      return checkIn.toDateString() === today.toDateString()
    }).length
  }

  // Load data on mount
  useEffect(() => {
    loadAllBookings()
  }, [loadAllBookings])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="relative">
              <Calendar className="w-8 h-8 text-blue-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            Integrated Booking Management
          </h2>
          <p className="text-gray-400 mt-1">
            Ultimate booking approval and staff assignment system
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setAutomationEnabled(!automationEnabled)}
            variant={automationEnabled ? "default" : "outline"}
            className={automationEnabled ? 'bg-green-600 hover:bg-green-700' : 'border-green-500/50 text-green-400'}
          >
            <Bot className="w-4 h-4 mr-2" />
            {automationEnabled ? 'AI ON' : 'AI OFF'}
          </Button>
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

      {/* AI Summary */}
      {aiSummary && (
        <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              AI Executive Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 leading-relaxed">{aiSummary}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-r from-blue-600/20 to-blue-800/20 border-blue-500/30">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">{stats.total}</div>
            <p className="text-sm text-blue-300">Total Bookings</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-yellow-600/20 to-yellow-800/20 border-yellow-500/30">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
            <p className="text-sm text-yellow-300">Pending Review</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-600/20 to-green-800/20 border-green-500/30">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">{stats.approved}</div>
            <p className="text-sm text-green-300">Approved</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-red-600/20 to-red-800/20 border-red-500/30">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-400">{stats.rejected}</div>
            <p className="text-sm text-red-300">Rejected</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-600/20 to-orange-800/20 border-orange-500/30">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-400">{stats.todayCheckIns}</div>
            <p className="text-sm text-orange-300">Today's Check-ins</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white w-64"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="pending_approval">Pending Approval</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {(searchTerm || statusFilter !== 'all') && (
              <Button
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setPropertyFilter('all')
                }}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>Bookings ({filteredBookings.length})</span>
            <Badge className="bg-blue-600 text-white">
              Live Data
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-400">Loading bookings...</span>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-400 mb-2">No bookings found</h3>
              <p className="text-gray-500">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-semibold text-white text-lg">
                          {booking.guestName || booking.guest_name || 'Unknown Guest'}
                        </h3>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                        {booking.assignedStaff && (
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                            <UserCheck className="h-3 w-3 mr-1" />
                            Staff Assigned
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-400 mb-4">
                        <div className="flex items-center gap-2">
                          <Home className="w-4 h-4" />
                          {booking.propertyName || booking.property || 'Unknown Property'}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {booking.checkInDate || booking.checkIn || booking.check_in || 'No date'}
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {booking.guestCount || booking.numberOfGuests || booking.guests || 1} guests
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          ${booking.price || booking.amount || booking.total || 0}
                        </div>
                      </div>

                      {booking.specialRequests && (
                        <p className="text-sm text-gray-300 mb-3">
                          <strong>Special Requests:</strong> {booking.specialRequests}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      {(booking.status === 'pending' || booking.status === 'pending_approval') && (
                        <>
                          <Button
                            onClick={() => openBookingApprovalModal(booking)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            size="sm"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Review
                          </Button>
                          <Button
                            onClick={() => handleBookingApproval(booking.id, 'approve')}
                            disabled={processingBookingId === booking.id}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                          >
                            {processingBookingId === booking.id ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <CheckCircle className="w-4 h-4 mr-2" />
                            )}
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleBookingApproval(booking.id, 'reject')}
                            disabled={processingBookingId === booking.id}
                            variant="outline"
                            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                            size="sm"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </>
                      )}
                      
                      {(booking.status === 'approved' || booking.status === 'confirmed') && !booking.assignedStaff && (
                        <Button
                          onClick={() => toast.info('Staff assignment modal would open here')}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                          size="sm"
                        >
                          <UserCheck className="w-4 h-4 mr-2" />
                          Assign Staff
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals temporarily disabled for debugging */}
      {/* Modal functionality will be re-enabled once component is stable */}
    </div>
  )
}
