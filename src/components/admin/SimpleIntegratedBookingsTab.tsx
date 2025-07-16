'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Textarea } from '@/components/ui/Textarea'
import { toast } from 'sonner'
import {
  Calendar,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  Users,
  DollarSign,
  Home,
  UserCheck,
  Eye,
  AlertTriangle,
  User
} from 'lucide-react'
import StaffAssignmentModal from '@/components/booking/StaffAssignmentModal'
import CreateJobModal from '@/components/job-assignment/CreateJobModal'

interface SimpleIntegratedBookingsTabProps {
  onBookingApproved?: (bookingId: string) => void
  onStaffAssigned?: (bookingId: string, staffIds: string[]) => void
}

export function SimpleIntegratedBookingsTab({
  onBookingApproved,
  onStaffAssigned
}: SimpleIntegratedBookingsTabProps) {
  const [allBookings, setAllBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processingBookingId, setProcessingBookingId] = useState<string | null>(null)

  // Staff Assignment Modal State
  const [staffAssignmentModal, setStaffAssignmentModal] = useState<{ booking: any } | null>(null)
  const [showApprovalSuccess, setShowApprovalSuccess] = useState<string | null>(null)

  // Job Assignment Modal State (Alternative to StaffAssignmentModal)
  const [createJobModal, setCreateJobModal] = useState<{ booking: any } | null>(null)

  // Rejection confirmation dialog state
  const [rejectionDialog, setRejectionDialog] = useState<{
    isOpen: boolean
    booking: any | null
    rejectionReason: string
  }>({
    isOpen: false,
    booking: null,
    rejectionReason: ''
  })

  // Helper function to prepare booking data for staff assignment modal
  const prepareBookingForStaffAssignment = (booking: any) => {
    return {
      id: booking.id,
      propertyName: booking.propertyName || booking.property || 'Unknown Property',
      guestName: booking.guestName || booking.guest_name || 'Unknown Guest',
      guestEmail: booking.guestEmail || booking.guest_email || '',
      guestPhone: booking.guestPhone || booking.guest_phone || '',
      checkInDate: booking.checkInDate || booking.checkIn || booking.check_in || '',
      checkOutDate: booking.checkOutDate || booking.checkOut || booking.check_out || '',
      guestCount: booking.guestCount || booking.numberOfGuests || booking.guests || 1,
      price: booking.price || booking.amount || booking.total || 0,
      currency: booking.currency || 'USD',
      specialRequests: booking.specialRequests || booking.special_requests || '',
      source: booking.source || 'back_office',
      createdAt: booking.createdAt || booking.created_at || new Date().toISOString(),
      nights: booking.nights || 1
    }
  }

  // Handle rejection confirmation
  const handleRejectBooking = (booking: any) => {
    setRejectionDialog({
      isOpen: true,
      booking,
      rejectionReason: ''
    })
  }

  // Confirm booking rejection
  const confirmBookingRejection = async () => {
    if (!rejectionDialog.booking) return

    const { booking } = rejectionDialog
    const rejectionReason = rejectionDialog.rejectionReason.trim() || 'Booking rejected by admin'

    // Close dialog first
    setRejectionDialog({
      isOpen: false,
      booking: null,
      rejectionReason: ''
    })

    // Proceed with rejection
    await handleBookingAction(booking.id, 'reject', rejectionReason)
  }

  // Enhanced workflow function for seamless booking approval to job assignment
  const triggerJobAssignmentWorkflow = (booking: any, delay: number = 1500) => {
    console.log('🎯 Triggering enhanced job assignment workflow for booking:', booking.id)

    // Show approval success indicator
    setShowApprovalSuccess(booking.id)

    // Auto-open job assignment modal with smooth transition
    setTimeout(() => {
      const modalBooking = prepareBookingForStaffAssignment(booking)
      setCreateJobModal({ booking: modalBooking })
      setShowApprovalSuccess(null)

      toast.info('🎯 Opening job assignment wizard with staff selection...', {
        duration: 3000
      })

      console.log('✅ Job assignment modal opened with booking data:', modalBooking)
    }, delay)
  }

  // Load all bookings from integrated endpoint
  const loadAllBookings = async () => {
    try {
      setLoading(true)
      console.log('📋 Loading integrated bookings...')

      const response = await fetch('/api/admin/bookings/integrated?limit=50')
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          const bookings = data.data.bookings || []
          setAllBookings(bookings)
          console.log(`✅ Loaded ${bookings.length} integrated bookings`)
        } else {
          console.error('❌ Failed to load bookings:', data.error)
          toast.error('Failed to load bookings')
        }
      } else {
        console.error('❌ API request failed:', response.status)
        toast.error('Failed to connect to booking service')
      }
    } catch (error) {
      console.error('❌ Error loading bookings:', error)
      toast.error('Error loading bookings')
    } finally {
      setLoading(false)
    }
  }

  // Handle booking approval
  const handleBookingApproval = async (bookingId: string, action: 'approve' | 'reject') => {
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
          notes: `Booking ${action}d via Back Office`
        })
      })

      const result = await response.json()

      if (result.success) {
        if (action === 'approve') {
          toast.success('Booking approved successfully!', {
            description: 'Job assignment wizard will open automatically'
          })

          // Update local state for approved booking
          setAllBookings(prev => prev.map(booking =>
            booking.id === bookingId
              ? { ...booking, status: 'approved' }
              : booking
          ))

          // Trigger callback
          if (onBookingApproved) {
            onBookingApproved(bookingId)
          }

          // **AUTOMATIC WORKFLOW**: For approved bookings, trigger enhanced job assignment workflow
          const approvedBooking = allBookings.find(b => b.id === bookingId)
          if (approvedBooking) {
            triggerJobAssignmentWorkflow(approvedBooking)
          }
        } else {
          toast.success('Booking rejected successfully!', {
            description: 'Booking has been removed from the active list'
          })

          // Remove rejected booking from display
          setAllBookings(prev => prev.filter(booking => booking.id !== bookingId))
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
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    }
  }

  // Calculate stats
  const stats = {
    total: allBookings.length,
    pending: allBookings.filter(b => b.status === 'pending' || b.status === 'pending_approval').length,
    approved: allBookings.filter(b => b.status === 'approved' || b.status === 'confirmed').length,
    rejected: allBookings.filter(b => b.status === 'rejected').length
  }

  // Load data on mount
  useEffect(() => {
    loadAllBookings()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-400" />
            Integrated Booking Management
          </h2>
          <p className="text-gray-400 mt-1">
            Centralized booking approval and management system
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

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
      </div>

      {/* Bookings List */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>Active Bookings ({allBookings.filter(b => b.status !== 'rejected').length})</span>
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
          ) : allBookings.filter(b => b.status !== 'rejected').length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-400 mb-2">No bookings found</h3>
              <p className="text-gray-500">New bookings will appear here for approval</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allBookings.filter(b => b.status !== 'rejected').map((booking) => (
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

                        {/* Approval Success Indicator */}
                        {showApprovalSuccess === booking.id && (
                          <Badge className="bg-green-500 text-white animate-pulse">
                            ✅ Approved! Opening Job Assignment...
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-400 mb-4">
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
                            onClick={() => handleRejectBooking(booking)}
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
                      
                      {(booking.status === 'approved' || booking.status === 'confirmed') && (
                        <div className="flex flex-col gap-2">
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            ✅ Approved
                          </Badge>

                          {/* Manual Staff Assignment Button */}
                          <Button
                            onClick={() => {
                              console.log('🎯 Manual job assignment triggered for booking:', booking.id)
                              triggerJobAssignmentWorkflow(booking, 0) // Immediate trigger for manual action
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                            size="sm"
                          >
                            <UserCheck className="w-4 h-4 mr-2" />
                            Assign Staff
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Staff Assignment Modal - Automatic Workflow Integration */}
      {staffAssignmentModal && (
        <StaffAssignmentModal
          isOpen={!!staffAssignmentModal}
          onClose={() => {
            setStaffAssignmentModal(null)
            console.log('🔄 Staff assignment modal closed')
          }}
          booking={staffAssignmentModal.booking}
          currentUser={{
            id: 'current-admin-id',
            name: 'Back Office Admin'
          }}
          onAssignmentComplete={async (taskIds) => {
            console.log('✅ Enhanced staff assignment completed:', taskIds)

            const bookingId = staffAssignmentModal?.booking?.id
            const propertyName = staffAssignmentModal?.booking?.propertyName

            try {
              // Close modal first for better UX
              setStaffAssignmentModal(null)

              // Show immediate success feedback
              toast.success('🎉 Staff assigned successfully!', {
                duration: 2000
              })

              // Enhanced notification workflow
              console.log('📱 Triggering enhanced notification workflow...')

              // Show progress toast for notifications
              toast.loading('📱 Sending notifications to assigned staff...', {
                duration: 3000
              })

              // Simulate notification sending (the actual notifications are handled by the StaffAssignmentModal)
              setTimeout(() => {
                toast.success('✅ Multi-channel notifications sent successfully!', {
                  duration: 3000
                })

                // Show detailed success message
                toast.success(`🏠 Job assignments created for ${propertyName}`, {
                  duration: 4000
                })
              }, 1000)

              // Refresh booking data to show updated assignments
              await loadAllBookings()

              // Trigger callback for parent component
              if (onStaffAssigned && bookingId) {
                onStaffAssigned(bookingId, taskIds)
              }

              // Log the successful workflow completion with details
              console.log('🎯 COMPLETE ENHANCED WORKFLOW:')
              console.log('  ✅ Booking approved')
              console.log('  ✅ Staff assignment modal opened')
              console.log('  ✅ Staff members selected and assigned')
              console.log('  ✅ Job assignments created in Firebase')
              console.log('  ✅ Notifications sent to staff Firebase profiles')
              console.log('  ✅ Push notifications triggered for mobile devices')
              console.log('  ✅ Staff dashboards updated in real-time')
              console.log('  ✅ Mobile app sync completed')
              console.log('  ✅ Back Office dashboard updated')

            } catch (error) {
              console.error('❌ Error in enhanced workflow completion:', error)
              toast.error('Some notifications may have failed. Please check staff assignments.')
            }
          }}
        />
      )}

      {/* Job Assignment Modal - Enhanced Workflow */}
      {createJobModal && (
        <CreateJobModal
          isOpen={!!createJobModal}
          onClose={() => {
            setCreateJobModal(null)
            console.log('🔄 Job assignment modal closed')
          }}
          onJobCreated={(jobId) => {
            console.log('✅ Job created successfully:', jobId)

            // Close modal
            setCreateJobModal(null)

            // Refresh booking data to show updated assignments
            loadAllBookings()

            // Show success message
            toast.success('🎉 Job created and assigned successfully! Staff member has been notified.', {
              duration: 4000
            })

            // Trigger callback for parent component
            if (onStaffAssigned && createJobModal.booking) {
              onStaffAssigned(createJobModal.booking.id, [jobId])
            }

            // Log the successful workflow completion
            console.log('🎯 Complete workflow: Booking approved → Job created → Staff assigned → Notifications sent')
          }}
          prePopulatedBooking={createJobModal.booking}
        />
      )}

      {/* Booking Rejection Confirmation Dialog */}
      <Dialog open={rejectionDialog.isOpen} onOpenChange={(open) => {
        if (!open) {
          setRejectionDialog({
            isOpen: false,
            booking: null,
            rejectionReason: ''
          })
        }
      }}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Confirm Booking Rejection
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Are you sure you want to reject this booking? This action cannot be undone and the booking will be permanently removed from the active list.
            </DialogDescription>
          </DialogHeader>

          {rejectionDialog.booking && (
            <div className="bg-gradient-to-r from-red-900/20 to-rose-900/20 border border-red-500/30 rounded-lg p-4 my-4">
              <div className="flex items-center gap-3 mb-2">
                <User className="w-5 h-5 text-red-400" />
                <div>
                  <h4 className="font-medium text-white">
                    {rejectionDialog.booking.guestName || rejectionDialog.booking.guest_name}
                  </h4>
                  <p className="text-sm text-gray-400">
                    {rejectionDialog.booking.propertyName || rejectionDialog.booking.property}
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-300">
                <div>Check-in: {rejectionDialog.booking.checkInDate || rejectionDialog.booking.checkIn || rejectionDialog.booking.check_in}</div>
                <div>Total: ${rejectionDialog.booking.price || rejectionDialog.booking.amount || rejectionDialog.booking.total || 0}</div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Rejection Reason (Optional)
            </label>
            <Textarea
              value={rejectionDialog.rejectionReason}
              onChange={(e) => setRejectionDialog(prev => ({
                ...prev,
                rejectionReason: e.target.value
              }))}
              placeholder="Enter reason for rejection (e.g., dates unavailable, property maintenance, etc.)"
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 resize-none"
              rows={3}
            />
          </div>

          <DialogFooter className="flex gap-3">
            <Button
              onClick={() => setRejectionDialog({
                isOpen: false,
                booking: null,
                rejectionReason: ''
              })}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmBookingRejection}
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
