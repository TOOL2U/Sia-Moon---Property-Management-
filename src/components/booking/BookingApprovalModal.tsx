'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Clock,
  Loader2,
  AlertTriangle,
  Info
} from 'lucide-react'
import { BookingSyncService } from '@/lib/services/bookingSyncService'

interface BookingApprovalModalProps {
  isOpen: boolean
  onClose: () => void
  booking: {
    id: string
    propertyName: string
    guestName: string
    guestEmail: string
    guestPhone?: string
    checkInDate: string
    checkOutDate: string
    guestCount: number
    price: number
    currency?: string
    specialRequests?: string
    source: string
    createdAt: string
    nights: number
  }
  currentUser: {
    id: string
    name: string
  }
  onApprovalComplete?: (bookingId: string, action: 'approve' | 'reject') => void
}

export default function BookingApprovalModal({
  isOpen,
  onClose,
  booking,
  currentUser,
  onApprovalComplete
}: BookingApprovalModalProps) {
  const [action, setAction] = useState<'approve' | 'reject' | null>(null)
  const [notes, setNotes] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const handleApprove = () => {
    setAction('approve')
    setReason('')
  }

  const handleReject = () => {
    setAction('reject')
    setNotes('')
  }

  const handleConfirm = async () => {
    if (!action) return

    if (action === 'reject' && !reason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }

    try {
      setLoading(true)

      let result
      if (action === 'approve') {
        result = await BookingSyncService.approveBooking(
          booking.id,
          currentUser.id,
          currentUser.name,
          notes
        )
      } else {
        result = await BookingSyncService.rejectBooking(
          booking.id,
          currentUser.id,
          currentUser.name,
          reason,
          notes
        )
      }

      if (result.success) {
        toast.success(result.message)
        onApprovalComplete?.(booking.id, action)
        onClose()
        
        // Reset form
        setAction(null)
        setNotes('')
        setReason('')
      } else {
        toast.error(result.error || `Failed to ${action} booking`)
      }
    } catch (error) {
      console.error(`Error ${action}ing booking:`, error)
      toast.error(`Failed to ${action} booking`)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setAction(null)
    setNotes('')
    setReason('')
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getSourceBadgeColor = (source: string) => {
    switch (source.toLowerCase()) {
      case 'make_com_automation':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'direct':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'platform':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-neutral-900 border-neutral-800">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Booking Approval Required
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Booking Details */}
          <Card className="bg-neutral-800 border-neutral-700">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-neutral-400 text-sm">Property</Label>
                    <p className="text-white font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-neutral-400" />
                      {booking.propertyName}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-neutral-400 text-sm">Guest</Label>
                    <p className="text-white font-medium">{booking.guestName}</p>
                    <p className="text-neutral-400 text-sm">{booking.guestEmail}</p>
                    {booking.guestPhone && (
                      <p className="text-neutral-400 text-sm">{booking.guestPhone}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-neutral-400 text-sm">Guests</Label>
                    <p className="text-white flex items-center gap-2">
                      <Users className="h-4 w-4 text-neutral-400" />
                      {booking.guestCount} {booking.guestCount === 1 ? 'guest' : 'guests'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-neutral-400 text-sm">Check-in</Label>
                    <p className="text-white">{formatDate(booking.checkInDate)}</p>
                  </div>
                  
                  <div>
                    <Label className="text-neutral-400 text-sm">Check-out</Label>
                    <p className="text-white">{formatDate(booking.checkOutDate)}</p>
                  </div>

                  <div>
                    <Label className="text-neutral-400 text-sm">Duration</Label>
                    <p className="text-white flex items-center gap-2">
                      <Clock className="h-4 w-4 text-neutral-400" />
                      {booking.nights} {booking.nights === 1 ? 'night' : 'nights'}
                    </p>
                  </div>

                  <div>
                    <Label className="text-neutral-400 text-sm">Total Amount</Label>
                    <p className="text-white font-bold text-lg flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-neutral-400" />
                      {formatCurrency(booking.price, booking.currency)}
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="bg-neutral-700 my-4" />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-neutral-400 text-sm">Booking Source</Label>
                  <div className="mt-1">
                    <Badge className={getSourceBadgeColor(booking.source)}>
                      {booking.source.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <Label className="text-neutral-400 text-sm">Received</Label>
                  <p className="text-neutral-300 text-sm">
                    {new Date(booking.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {booking.specialRequests && (
                <>
                  <Separator className="bg-neutral-700 my-4" />
                  <div>
                    <Label className="text-neutral-400 text-sm">Special Requests</Label>
                    <p className="text-white mt-1 p-3 bg-neutral-700 rounded-lg">
                      {booking.specialRequests}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Action Selection */}
          {!action && (
            <div className="flex gap-4">
              <Button
                onClick={handleApprove}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve Booking
              </Button>
              <Button
                onClick={handleReject}
                variant="destructive"
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject Booking
              </Button>
            </div>
          )}

          {/* Approval Form */}
          {action === 'approve' && (
            <Card className="bg-green-500/10 border-green-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <h3 className="text-green-400 font-medium">Approve Booking</h3>
                </div>
                
                <div>
                  <Label className="text-white">Approval Notes (Optional)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes for the approval..."
                    className="bg-neutral-800 border-neutral-600 text-white mt-2"
                    rows={3}
                  />
                </div>

                <div className="flex items-start gap-2 mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <Info className="h-4 w-4 text-blue-400 mt-0.5" />
                  <div className="text-blue-400 text-sm">
                    <p className="font-medium">This action will:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Confirm the booking in the system</li>
                      <li>Notify the mobile app in real-time</li>
                      <li>Send confirmation to the guest</li>
                      <li>Make the booking available for staff assignment</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rejection Form */}
          {action === 'reject' && (
            <Card className="bg-red-500/10 border-red-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <XCircle className="h-5 w-5 text-red-400" />
                  <h3 className="text-red-400 font-medium">Reject Booking</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-white">Rejection Reason *</Label>
                    <Textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Please provide a reason for rejecting this booking..."
                      className="bg-neutral-800 border-neutral-600 text-white mt-2"
                      rows={3}
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-white">Additional Notes (Optional)</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any additional notes..."
                      className="bg-neutral-800 border-neutral-600 text-white mt-2"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2 mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5" />
                  <div className="text-yellow-400 text-sm">
                    <p className="font-medium">This action will:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Mark the booking as rejected</li>
                      <li>Notify the mobile app in real-time</li>
                      <li>Send rejection notice to the guest</li>
                      <li>Archive the booking request</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          {action ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                className="border-neutral-600 text-neutral-300 hover:bg-neutral-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={loading || (action === 'reject' && !reason.trim())}
                className={action === 'approve' 
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
                }
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {action === 'approve' ? (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Confirm {action === 'approve' ? 'Approval' : 'Rejection'}
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              onClick={onClose}
              className="border-neutral-600 text-neutral-300 hover:bg-neutral-700"
            >
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
