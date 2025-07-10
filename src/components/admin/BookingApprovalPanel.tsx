'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { BookingService, LiveBooking } from '@/lib/services/bookingService'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Calendar,
  Home,
  DollarSign,
  MessageSquare,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function BookingApprovalPanel() {
  const [pendingBookings, setPendingBookings] = useState<LiveBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [processingBookings, setProcessingBookings] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadPendingBookings()
  }, [])

  const loadPendingBookings = async () => {
    try {
      setLoading(true)
      console.log('📋 Loading pending bookings for admin review...')
      
      const bookings = await BookingService.getPendingBookings()
      setPendingBookings(bookings)
      
      console.log(`✅ Loaded ${bookings.length} pending bookings`)
    } catch (error) {
      console.error('❌ Error loading pending bookings:', error)
      toast.error('Failed to load pending bookings')
    } finally {
      setLoading(false)
    }
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
        
        // Remove from pending list
        setPendingBookings(prev => prev.filter(booking => booking.id !== bookingId))
        
        // TODO: Trigger task creation for approved bookings
        if (action === 'approved') {
          console.log('🔄 TODO: Create staff tasks for approved booking')
          // This will be implemented in the next step
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

  const getUrgencyBadge = (checkInDate: string) => {
    const checkIn = new Date(checkInDate)
    const now = new Date()
    const daysUntilCheckIn = Math.ceil((checkIn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilCheckIn <= 1) {
      return <Badge variant="destructive" className="bg-red-500/20 text-red-400">Urgent - Today/Tomorrow</Badge>
    } else if (daysUntilCheckIn <= 3) {
      return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">High Priority - {daysUntilCheckIn} days</Badge>
    } else if (daysUntilCheckIn <= 7) {
      return <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">Medium Priority - {daysUntilCheckIn} days</Badge>
    } else {
      return <Badge variant="secondary" className="bg-green-500/20 text-green-400">Low Priority - {daysUntilCheckIn} days</Badge>
    }
  }

  if (loading) {
    return (
      <Card className="bg-neutral-950 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pending Booking Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            <span className="ml-2 text-neutral-400">Loading pending bookings...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (pendingBookings.length === 0) {
    return (
      <Card className="bg-neutral-950 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Pending Booking Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <p className="text-neutral-300 font-medium">All caught up!</p>
            <p className="text-neutral-500 text-sm">No pending bookings require approval</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-neutral-950 border-neutral-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-400" />
          Pending Booking Approvals
          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
            {pendingBookings.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingBookings.map((booking) => {
            const isProcessing = processingBookings.has(booking.id)
            
            return (
              <div
                key={booking.id}
                className="p-4 bg-neutral-900 rounded-lg border border-neutral-700"
              >
                {/* Header with urgency */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-neutral-500" />
                    <span className="text-white font-medium">{booking.guestName}</span>
                  </div>
                  {getUrgencyBadge(booking.checkInDate)}
                </div>

                {/* Booking details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Home className="w-4 h-4 text-neutral-500" />
                    <span className="text-neutral-300">{booking.villaName}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-neutral-500" />
                    <span className="text-neutral-300">
                      {formatDate(booking.checkInDate)} → {formatDate(booking.checkOutDate)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-neutral-500" />
                    <span className="text-green-400 font-medium">
                      ${booking.price.toLocaleString()} {booking.currency}
                    </span>
                  </div>
                  
                  {booking.specialRequests && (
                    <div className="flex items-start gap-2 text-sm md:col-span-2">
                      <MessageSquare className="w-4 h-4 text-neutral-500 mt-0.5" />
                      <span className="text-neutral-400">{booking.specialRequests}</span>
                    </div>
                  )}
                </div>

                {/* Client matching info */}
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

                {/* Action buttons */}
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
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
