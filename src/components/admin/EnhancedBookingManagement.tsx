'use client'

import { JobStatusTracker } from '@/components/admin/JobStatusTracker'
import { StaffAssignmentSelector } from '@/components/admin/StaffAssignmentSelector'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { JobPriority, JobType } from '@/services/JobAssignmentService'
import { AnimatePresence, motion } from 'framer-motion'
import {
    AlertCircle,
    AlertTriangle,
    BarChart3,
    Bot,
    Brain,
    Briefcase,
    Calendar,
    CheckCircle,
    ChevronDown,
    ChevronRight,
    Clock,
    DollarSign,
    Download,
    Home,
    Loader2,
    Mail,
    MapPin,
    MessageSquare,
    Phone,
    RefreshCw,
    Search,
    Sparkles,
    TrendingUp,
    User,
    UserCheck,
    Users,
    XCircle,
    Zap
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

// Utility function to safely convert Firebase Timestamp to Date
const toDate = (timestamp: any): Date => {
  if (!timestamp) return new Date()

  // If it's already a Date object
  if (timestamp instanceof Date) return timestamp

  // If it's a Firebase Timestamp with seconds and nanoseconds
  if (timestamp && typeof timestamp === 'object') {
    if ('seconds' in timestamp && 'nanoseconds' in timestamp) {
      return new Date(timestamp.seconds * 1000)
    }

    // If it's a Firebase Timestamp with toDate method
    if (typeof timestamp.toDate === 'function') {
      return timestamp.toDate()
    }

    // If it's a timestamp object with type field (Firestore format)
    if (timestamp.type && timestamp.seconds) {
      return new Date(timestamp.seconds * 1000)
    }
  }

  // If it's a string or number
  try {
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) {
      return new Date()
    }
    return date
  } catch (error) {
    console.error('Error converting timestamp:', error, timestamp)
    return new Date()
  }
}

interface EnhancedBookingManagementProps {
  onBookingApproved?: (bookingId: string) => void
  onStaffAssigned?: (bookingId: string, staffIds: string[]) => void
}

// Animation variants for smooth transitions
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 }
  }
}

const cardHoverVariants = {
  hover: {
    y: -4,
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: "easeOut"
    }
  }
}

export function EnhancedBookingManagement({
  onBookingApproved,
  onStaffAssigned
}: EnhancedBookingManagementProps) {
  // State management
  const [allBookings, setAllBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processingBookingId, setProcessingBookingId] = useState<string | null>(null)
  const [automationEnabled, setAutomationEnabled] = useState(true)
  const [aiSummary, setAiSummary] = useState<string>('')
  const [selectedView, setSelectedView] = useState<'grid' | 'list' | 'jobs'>('grid')
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null)

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [propertyFilter, setPropertyFilter] = useState('all')
  const [dateRangeFilter, setDateRangeFilter] = useState({ start: '', end: '' })
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Modal states
  const [createJobModal, setCreateJobModal] = useState<{ booking: any } | null>(null)
  const [showApprovalSuccess, setShowApprovalSuccess] = useState<string | null>(null)

  // Staff Assignment Modal State
  const [staffAssignmentModal, setStaffAssignmentModal] = useState<{
    isOpen: boolean
    booking: any | null
    jobType: JobType
    priority: JobPriority
  }>({
    isOpen: false,
    booking: null,
    jobType: 'cleaning',
    priority: 'medium'
  })

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

  // Load all bookings with enhanced data
  const loadAllBookings = useCallback(async () => {
    try {
      setLoading(true)
      console.log('📋 Loading enhanced booking data...')

      const response = await fetch('/api/admin/bookings/integrated?limit=100&enhanced=true')

      if (response.ok) {
        const data = await response.json()

        if (data.success) {
          const bookings = data.data.bookings || []
          setAllBookings(bookings)
          console.log(`✅ Loaded ${bookings.length} enhanced bookings`)
          generateAISummary(bookings)
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
  }, [])

  // Generate AI summary with enhanced insights
  const generateAISummary = (bookings: any[]) => {
    const pendingCount = bookings.filter(b => b.status === 'pending' || b.status === 'pending_approval').length
    const approvedCount = bookings.filter(b => b.status === 'approved' || b.status === 'confirmed').length
    const todayCheckIns = bookings.filter(b => {
      const checkIn = new Date(b.checkInDate || b.checkIn || b.check_in)
      const today = new Date()
      return checkIn.toDateString() === today.toDateString()
    }).length

    const totalRevenue = bookings.reduce((sum, b) => sum + (b.price || b.amount || b.total || 0), 0)
    const avgBookingValue = bookings.length > 0 ? totalRevenue / bookings.length : 0

    const summary = `📊 Portfolio Overview: ${pendingCount} bookings require immediate attention, ${approvedCount} confirmed reservations generating $${totalRevenue.toLocaleString()} in total revenue. ${todayCheckIns} guests arriving today. Average booking value: $${avgBookingValue.toFixed(0)}. ${automationEnabled ? '🤖 AI automation optimizing workflow efficiency.' : '⚠️ Manual review mode - consider enabling automation.'}`

    setAiSummary(summary)
  }

  // Handle rejection confirmation
  const handleRejectBooking = (booking: any) => {
    setRejectionDialog({
      isOpen: true,
      booking,
      rejectionReason: ''
    })
  }

  // Confirm booking rejection with enhanced logging
  const confirmBookingRejection = async () => {
    if (!rejectionDialog.booking) return

    const { booking } = rejectionDialog
    const rejectionReason = rejectionDialog.rejectionReason.trim() || 'Manual'

    // Close dialog first
    setRejectionDialog({
      isOpen: false,
      booking: null,
      rejectionReason: ''
    })

    try {
      // Enhanced rejection with proper Firebase fields and debugging
      console.log('🔄 Rejecting booking:', {
        id: booking.id,
        status: booking.status,
        source: booking.source,
        guestName: booking.guestName || booking.guest_name
      })

      const response = await fetch('/api/bookings/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          action: 'reject',
          adminId: 'current-admin-id',
          adminName: 'Admin User',
          notes: rejectionReason,
          reason: rejectionReason,
          rejectionMetadata: {
            rejectedAt: new Date().toISOString(),
            rejectedBy: 'current-admin-id',
            rejectionReason: rejectionReason,
            bookingValue: booking.price || booking.amount || 0,
            propertyName: booking.propertyName || booking.property,
            guestName: booking.guestName || booking.guest_name,
            originalSource: booking.source
          }
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Response Error:', response.status, errorText)
        toast.error(`Failed to reject booking: ${response.status}`)
        return
      }

      const result = await response.json()
      console.log('📋 Rejection API Response:', result)

      if (result.success) {
        toast.success('Booking rejected successfully!', {
          description: 'Booking has been moved to rejected list'
        })

        // Update local state to mark as rejected instead of removing
        setAllBookings(prev => prev.map(b =>
          b.id === booking.id
            ? {
                ...b,
                status: 'rejected',
                rejectionReason: rejectionReason,
                rejectedAt: new Date().toISOString(),
                rejectedBy: 'current-admin-id'
              }
            : b
        ))

        // Log for AI feedback loop (if AI automation is enabled)
        if (automationEnabled) {
          try {
            await logRejectionForAI(booking.id, rejectionReason)
          } catch (aiError) {
            console.warn('⚠️ AI logging failed:', aiError)
          }
        }

        // Log to audit trail
        try {
          await logRejectionAudit(booking.id, rejectionReason, booking)
        } catch (auditError) {
          console.warn('⚠️ Audit logging failed:', auditError)
        }

      } else {
        toast.error(`Failed to reject booking: ${result.error}`)
        console.error('❌ Rejection failed:', result.error)
      }
    } catch (error) {
      console.error('❌ Error rejecting booking:', error)
      toast.error('Error rejecting booking')
    }
  }

  // Log rejection for AI feedback loop
  const logRejectionForAI = async (bookingId: string, reason: string) => {
    try {
      // Check if AI automation is enabled in settings
      const aiSettings = await fetch('/api/settings/aiAutomation').catch(() => ({ ok: false }))

      if (aiSettings.ok) {
        await fetch('/api/ai/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'booking_rejection',
            bookingId,
            rejectedBy: 'current-admin-id',
            reason,
            timestamp: new Date().toISOString(),
            metadata: {
              source: 'enhanced_booking_management',
              automationEnabled: automationEnabled
            }
          })
        })
        console.log('✅ AI feedback logged for booking rejection')
      }
    } catch (error) {
      console.warn('⚠️ Failed to log AI feedback:', error)
    }
  }

  // Log rejection to audit trail
  const logRejectionAudit = async (bookingId: string, reason: string, booking: any) => {
    try {
      await fetch('/api/logs/rejections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          rejectionReason: reason,
          rejectedBy: 'current-admin-id',
          rejectedAt: new Date().toISOString(),
          bookingMetadata: {
            guestName: booking.guestName || booking.guest_name,
            propertyName: booking.propertyName || booking.property,
            checkInDate: booking.checkInDate || booking.checkIn,
            bookingValue: booking.price || booking.amount || 0
          }
        })
      })
      console.log('✅ Rejection audit logged')
    } catch (error) {
      console.warn('⚠️ Failed to log rejection audit:', error)
    }
  }

  // Enhanced booking approval with workflow trigger
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
          notes: notes || `Booking ${action}d via Enhanced Booking Management`
        })
      })

      const result = await response.json()

      if (result.success) {
        if (action === 'approve') {
          toast.success('Booking approved successfully!', {
            description: 'Calendar event created • Job assignment wizard will open automatically'
          })

          // Update local state for approved booking
          setAllBookings(prev => prev.map(booking =>
            booking.id === bookingId
              ? { ...booking, status: 'approved' }
              : booking
          ))
        } else {
          toast.success('Booking rejected successfully!', {
            description: 'Booking has been removed from the active list'
          })

          // Remove rejected booking from display
          setAllBookings(prev => prev.filter(booking => booking.id !== bookingId))
        }

        // Trigger callback
        if (action === 'approve' && onBookingApproved) {
          onBookingApproved(bookingId)
        }

        // **AUTOMATIC WORKFLOW**: For approved bookings, trigger staff assignment
        if (action === 'approve') {
          const approvedBooking = allBookings.find(b => b.id === bookingId)
          if (approvedBooking) {
            setShowApprovalSuccess(bookingId)

            setTimeout(() => {
              const modalBooking = {
                id: approvedBooking.id,
                propertyId: approvedBooking.propertyId || `property_${approvedBooking.id}`,
                propertyName: approvedBooking.propertyName || approvedBooking.property || 'Unknown Property',
                propertyAddress: approvedBooking.propertyAddress || approvedBooking.address || 'Address not provided',
                guestName: approvedBooking.guestName || approvedBooking.guest_name || 'Unknown Guest',
                guestEmail: approvedBooking.guestEmail || approvedBooking.guest_email || '',
                guestPhone: approvedBooking.guestPhone || approvedBooking.guest_phone || '',
                checkInDate: approvedBooking.checkInDate || approvedBooking.checkIn || approvedBooking.check_in || '',
                checkOutDate: approvedBooking.checkOutDate || approvedBooking.checkOut || approvedBooking.check_out || '',
                guestCount: approvedBooking.guestCount || approvedBooking.numberOfGuests || approvedBooking.guests || 1,
                price: approvedBooking.price || approvedBooking.amount || approvedBooking.total || 0,
                currency: approvedBooking.currency || 'USD',
                specialRequests: approvedBooking.specialRequests || approvedBooking.special_requests || '',
                source: approvedBooking.source || 'enhanced_booking_management',
                createdAt: approvedBooking.createdAt || approvedBooking.created_at || new Date().toISOString(),
                nights: approvedBooking.nights || 1
              }

              // Determine job type and priority based on booking
              const jobType: JobType = determineJobType(modalBooking)
              const priority: JobPriority = determinePriority(modalBooking)

              setStaffAssignmentModal({
                isOpen: true,
                booking: modalBooking,
                jobType,
                priority
              })
              setShowApprovalSuccess(null)

              toast.info('🎯 Opening staff assignment selector...', {
                duration: 3000
              })
            }, 1500)
          }
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

  // Helper function to determine job type based on booking
  const determineJobType = (booking: any): JobType => {
    const checkInDate = new Date(booking.checkInDate)
    const now = new Date()
    const daysUntilCheckIn = Math.ceil((checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    // Determine job type based on timing and booking details
    if (daysUntilCheckIn <= 1) {
      return 'cleaning' // Urgent pre-arrival cleaning
    } else if (daysUntilCheckIn <= 3) {
      return 'setup' // Property setup and preparation
    } else {
      return 'inspection' // Property inspection and maintenance check
    }
  }

  // Helper function to determine priority based on booking
  const determinePriority = (booking: any): JobPriority => {
    const checkInDate = new Date(booking.checkInDate)
    const now = new Date()
    const daysUntilCheckIn = Math.ceil((checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const bookingValue = booking.price || 0

    // Determine priority based on timing and value
    if (daysUntilCheckIn <= 1) {
      return 'urgent' // Same day or next day
    } else if (daysUntilCheckIn <= 2 || bookingValue > 5000) {
      return 'high' // Within 2 days or high-value booking
    } else if (daysUntilCheckIn <= 7) {
      return 'medium' // Within a week
    } else {
      return 'low' // More than a week away
    }
  }

  // Helper function to get required skills based on job type
  const getRequiredSkills = (jobType: JobType): string[] => {
    const skillMap: Record<JobType, string[]> = {
      cleaning: ['cleaning', 'villa_preparation', 'housekeeping'],
      maintenance: ['maintenance', 'repairs', 'technical_skills'],
      inspection: ['inspection', 'quality_control', 'documentation'],
      setup: ['setup', 'villa_preparation', 'guest_services'],
      checkout: ['checkout', 'cleaning', 'inventory_management'],
      emergency: ['emergency_response', 'problem_solving', 'communication']
    }

    return skillMap[jobType] || ['general']
  }

  // Filter and sort bookings (exclude rejected, test, and error bookings)
  const filteredAndSortedBookings = allBookings
    .filter(booking => {
      // Always exclude rejected bookings from all views
      if (booking.status === 'rejected') {
        return false
      }

      // Exclude test bookings (identified by various patterns)
      const isTestBooking =
        booking.isTestBooking === true ||
        booking.id?.includes('test') ||
        booking.id?.includes('ai_test') ||
        (booking.guestName || booking.guest_name || '').toLowerCase().includes('[test]') ||
        (booking.guestName || booking.guest_name || '').toLowerCase().includes('test') ||
        booking.status === 'error'

      if (isTestBooking) {
        return false
      }

      // Only show pending_approval, approved, pending, and confirmed bookings
      const validStatuses = ['pending_approval', 'approved', 'pending', 'confirmed']
      if (!validStatuses.includes(booking.status)) {
        return false
      }

      // Handle status filtering for valid bookings only
      if (statusFilter !== 'all') {
        if (booking.status !== statusFilter) {
          return false
        }
      }

      const matchesSearch = !searchTerm ||
        booking.guestName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.guest_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.propertyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.property?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.guestEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.guest_email?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter
      const matchesProperty = propertyFilter === 'all' ||
        booking.propertyName === propertyFilter ||
        booking.property === propertyFilter

      return matchesSearch && matchesStatus && matchesProperty
    })
    .sort((a, b) => {
      const aValue = a[sortBy] || ''
      const bValue = b[sortBy] || ''

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  // Get status color with enhanced styling
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
      case 'pending_approval':
        return 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border-yellow-500/30 shadow-yellow-500/10'
      case 'approved':
      case 'confirmed':
        return 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/30 shadow-green-500/10'
      case 'rejected':
        return 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-400 border-red-500/30 shadow-red-500/10'
      case 'cancelled':
        return 'bg-gradient-to-r from-gray-500/20 to-slate-500/20 text-gray-400 border-gray-500/30 shadow-gray-500/10'
      default:
        return 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30 shadow-blue-500/10'
    }
  }

  // Calculate enhanced statistics (exclude rejected bookings from main metrics)
  const activeBookings = allBookings.filter(b => b.status !== 'rejected')
  const stats = {
    total: activeBookings.length,
    pending: activeBookings.filter(b => b.status === 'pending' || b.status === 'pending_approval').length,
    approved: activeBookings.filter(b => b.status === 'approved' || b.status === 'confirmed').length,
    rejected: allBookings.filter(b => b.status === 'rejected').length, // Keep for reference but don't display prominently
    todayCheckIns: activeBookings.filter(b => {
      const checkIn = new Date(b.checkInDate || b.checkIn || b.check_in)
      const today = new Date()
      return checkIn.toDateString() === today.toDateString()
    }).length,
    totalRevenue: activeBookings.reduce((sum, b) => sum + (b.price || b.amount || b.total || 0), 0),
    avgBookingValue: activeBookings.length > 0 ? activeBookings.reduce((sum, b) => sum + (b.price || b.amount || b.total || 0), 0) / activeBookings.length : 0
  }

  // Load data on mount
  useEffect(() => {
    loadAllBookings()
  }, [loadAllBookings])

  // Safeguard: Reset statusFilter if it's set to 'rejected'
  useEffect(() => {
    if (statusFilter === 'rejected') {
      setStatusFilter('all')
    }
  }, [statusFilter])

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Enhanced Header with Gradient Background */}
      <motion.div
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-900/20 via-blue-900/20 to-indigo-900/20 border border-purple-500/20 p-8"
        variants={itemVariants}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-blue-600/5 backdrop-blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                  Enhanced Booking Management
                </h1>
                <p className="text-gray-400 mt-1 text-lg">
                  Professional booking management with AI-powered insights
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={() => setAutomationEnabled(!automationEnabled)}
                  variant={automationEnabled ? "default" : "outline"}
                  className={`${automationEnabled
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-green-500/25'
                    : 'border-green-500/50 text-green-400 hover:bg-green-500/10'
                  } transition-all duration-300`}
                >
                  <Bot className="w-4 h-4 mr-2" />
                  {automationEnabled ? 'AI Enabled' : 'AI Disabled'}
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={loadAllBookings}
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25 transition-all duration-300"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh Data
                </Button>
              </motion.div>
            </div>
          </div>

          {/* AI Summary with Enhanced Styling */}
          {aiSummary && (
            <motion.div
              className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-xl p-6 backdrop-blur-sm"
              variants={itemVariants}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                    AI Executive Summary
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  </h3>
                  <p className="text-gray-300 leading-relaxed">{aiSummary}</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Enhanced Statistics Dashboard */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6"
        variants={itemVariants}
      >
        <motion.div
          whileHover={cardHoverVariants.hover}
          className="group"
        >
          <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-blue-400 opacity-60" />
              </div>
              <div className="text-3xl font-bold text-blue-400 mb-1">{stats.total}</div>
              <p className="text-sm text-blue-300 font-medium">Total Bookings</p>
              <p className="text-xs text-blue-400/60 mt-1">All time</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={cardHoverVariants.hover}
          className="group"
        >
          <Card className="bg-gradient-to-br from-yellow-900/20 to-orange-800/20 border-yellow-500/30 hover:border-yellow-400/50 transition-all duration-300 shadow-lg shadow-yellow-500/10 hover:shadow-yellow-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <AlertTriangle className="w-5 h-5 text-yellow-400 opacity-60" />
              </div>
              <div className="text-3xl font-bold text-yellow-400 mb-1">{stats.pending}</div>
              <p className="text-sm text-yellow-300 font-medium">Pending Review</p>
              <p className="text-xs text-yellow-400/60 mt-1">Requires attention</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={cardHoverVariants.hover}
          className="group"
        >
          <Card className="bg-gradient-to-br from-green-900/20 to-emerald-800/20 border-green-500/30 hover:border-green-400/50 transition-all duration-300 shadow-lg shadow-green-500/10 hover:shadow-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <Zap className="w-5 h-5 text-green-400 opacity-60" />
              </div>
              <div className="text-3xl font-bold text-green-400 mb-1">{stats.approved}</div>
              <p className="text-sm text-green-300 font-medium">Approved</p>
              <p className="text-xs text-green-400/60 mt-1">Ready for service</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={cardHoverVariants.hover}
          className="group"
        >
          <Card className="bg-gradient-to-br from-red-900/20 to-rose-800/20 border-red-500/30 hover:border-red-400/50 transition-all duration-300 shadow-lg shadow-red-500/10 hover:shadow-red-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-rose-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <XCircle className="w-6 h-6 text-white" />
                </div>
                <AlertCircle className="w-5 h-5 text-red-400 opacity-60" />
              </div>
              <div className="text-3xl font-bold text-red-400 mb-1">{stats.rejected}</div>
              <p className="text-sm text-red-300 font-medium">Rejected</p>
              <p className="text-xs text-red-400/60 mt-1">Declined bookings</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={cardHoverVariants.hover}
          className="group"
        >
          <Card className="bg-gradient-to-br from-purple-900/20 to-indigo-800/20 border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <Calendar className="w-5 h-5 text-purple-400 opacity-60" />
              </div>
              <div className="text-3xl font-bold text-purple-400 mb-1">{stats.todayCheckIns}</div>
              <p className="text-sm text-purple-300 font-medium">Today's Arrivals</p>
              <p className="text-xs text-purple-400/60 mt-1">Check-ins today</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={cardHoverVariants.hover}
          className="group"
        >
          <Card className="bg-gradient-to-br from-emerald-900/20 to-teal-800/20 border-emerald-500/30 hover:border-emerald-400/50 transition-all duration-300 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-emerald-400 opacity-60" />
              </div>
              <div className="text-2xl font-bold text-emerald-400 mb-1">${stats.totalRevenue.toLocaleString()}</div>
              <p className="text-sm text-emerald-300 font-medium">Total Revenue</p>
              <p className="text-xs text-emerald-400/60 mt-1">Avg: ${stats.avgBookingValue.toFixed(0)}</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Advanced Filters and Search */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-r from-gray-900/50 to-slate-900/50 border-gray-700/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 flex-1 min-w-64">
                <Search className="w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search bookings, guests, properties..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 focus:border-purple-500/50 transition-colors"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 bg-gray-800/50 border-gray-600/50 text-white">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48 bg-gray-800/50 border-gray-600/50 text-white">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="createdAt">Date Created</SelectItem>
                  <SelectItem value="checkInDate">Check-in Date</SelectItem>
                  <SelectItem value="guestName">Guest Name</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                variant="outline"
                className="border-gray-600/50 text-gray-300 hover:bg-gray-700/50"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>

              {(searchTerm || statusFilter !== 'all') && (
                <Button
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('all')
                    setPropertyFilter('all')
                  }}
                  variant="outline"
                  size="sm"
                  className="border-gray-600/50 text-gray-300 hover:bg-gray-700/50"
                >
                  Clear Filters
                </Button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <Button
                  onClick={() => setSelectedView('grid')}
                  variant={selectedView === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  className={selectedView === 'grid' ? 'bg-purple-600 hover:bg-purple-700' : 'border-gray-600/50 text-gray-300'}
                >
                  Grid
                </Button>
                <Button
                  onClick={() => setSelectedView('list')}
                  variant={selectedView === 'list' ? 'default' : 'outline'}
                  size="sm"
                  className={selectedView === 'list' ? 'bg-purple-600 hover:bg-purple-700' : 'border-gray-600/50 text-gray-300'}
                >
                  List
                </Button>
                <Button
                  onClick={() => setSelectedView('jobs')}
                  variant={selectedView === 'jobs' ? 'default' : 'outline'}
                  size="sm"
                  className={selectedView === 'jobs' ? 'bg-purple-600 hover:bg-purple-700' : 'border-gray-600/50 text-gray-300'}
                >
                  <Briefcase className="w-4 h-4 mr-1" />
                  Jobs
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Enhanced Bookings Display */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-r from-gray-900/30 to-slate-900/30 border-gray-700/30 backdrop-blur-sm">
          <CardHeader className="border-b border-gray-700/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                Enhanced Bookings ({filteredAndSortedBookings.length})
                <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/30">
                  Live Data
                </Badge>
              </CardTitle>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-600/50 text-gray-300 hover:bg-gray-700/50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">Loading Enhanced Bookings</h3>
                  <p className="text-gray-400">Fetching comprehensive booking data...</p>
                </div>
              </div>
            ) : filteredAndSortedBookings.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-r from-gray-600/20 to-slate-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Calendar className="h-10 w-10 text-gray-500" />
                </div>
                <h3 className="text-xl font-medium text-gray-400 mb-3">No bookings found</h3>
                <p className="text-gray-500 mb-6">Try adjusting your filters or search terms</p>
                <Button
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('all')
                    setPropertyFilter('all')
                  }}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  Clear All Filters
                </Button>
              </div>
            ) : selectedView === 'jobs' ? (
              <JobStatusTracker
                showAllJobs={true}
                className="mt-6"
              />
            ) : (
              <div className={selectedView === 'grid'
                ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
                : "space-y-4"
              }>
                <AnimatePresence>
                  {filteredAndSortedBookings.map((booking, index) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      whileHover={cardHoverVariants.hover}
                      className="group"
                    >
                      <Card className={`${
                        booking.status === 'rejected'
                          ? 'bg-gradient-to-br from-gray-900/30 to-slate-900/30 border-gray-800/50 opacity-75'
                          : 'bg-gradient-to-br from-gray-900/50 to-slate-900/50 border-gray-700/50 hover:border-gray-600/70'
                      } transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm`}>
                        <CardContent className="p-6">
                          {/* Booking Header */}
                          <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:scale-110 transition-transform duration-300">
                                <User className="w-7 h-7 text-white" />
                              </div>
                              <div>
                                <h3 className="text-xl font-semibold text-white mb-1">
                                  {booking.guestName || booking.guest_name || 'Unknown Guest'}
                                </h3>
                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                  <Mail className="w-4 h-4" />
                                  {booking.guestEmail || booking.guest_email || 'No email'}
                                </div>
                                {(booking.guestPhone || booking.guest_phone) && (
                                  <div className="flex items-center gap-2 text-gray-400 text-sm mt-1">
                                    <Phone className="w-4 h-4" />
                                    {booking.guestPhone || booking.guest_phone}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <Badge className={getStatusColor(booking.status)}>
                                {booking.status.replace('_', ' ').toUpperCase()}
                              </Badge>

                              {/* Approval Success Indicator */}
                              {showApprovalSuccess === booking.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-medium animate-pulse"
                                >
                                  ✅ Approved! Opening Job Assignment...
                                </motion.div>
                              )}
                            </div>
                          </div>

                          {/* Property Information */}
                          <div className="bg-gradient-to-r from-gray-800/30 to-slate-800/30 rounded-xl p-4 mb-6 border border-gray-700/30">
                            <div className="flex items-center gap-3 mb-3">
                              <Home className="w-5 h-5 text-blue-400" />
                              <h4 className="font-medium text-white">
                                {booking.propertyName || booking.property || 'Unknown Property'}
                              </h4>
                            </div>

                            {booking.propertyAddress && (
                              <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                                <MapPin className="w-4 h-4" />
                                {booking.propertyAddress}
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center gap-2 text-gray-300">
                                <Calendar className="w-4 h-4 text-green-400" />
                                <span>Check-in: {booking.checkInDate || booking.checkIn || booking.check_in ?
                                  toDate(booking.checkInDate || booking.checkIn || booking.check_in).toLocaleDateString() : 'Not set'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-300">
                                <Calendar className="w-4 h-4 text-red-400" />
                                <span>Check-out: {booking.checkOutDate || booking.checkOut || booking.check_out ?
                                  toDate(booking.checkOutDate || booking.checkOut || booking.check_out).toLocaleDateString() : 'Not set'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Booking Details */}
                          <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 rounded-lg p-3 border border-blue-500/20">
                              <div className="flex items-center gap-2 mb-2">
                                <Users className="w-4 h-4 text-blue-400" />
                                <span className="text-sm font-medium text-blue-300">Guests</span>
                              </div>
                              <div className="text-xl font-bold text-blue-400">
                                {booking.guestCount || booking.numberOfGuests || booking.guests || 1}
                              </div>
                            </div>

                            <div className="bg-gradient-to-r from-emerald-900/20 to-teal-900/20 rounded-lg p-3 border border-emerald-500/20">
                              <div className="flex items-center gap-2 mb-2">
                                <DollarSign className="w-4 h-4 text-emerald-400" />
                                <span className="text-sm font-medium text-emerald-300">Total</span>
                              </div>
                              <div className="text-xl font-bold text-emerald-400">
                                ${booking.price || booking.amount || booking.total || 0}
                              </div>
                            </div>
                          </div>

                          {/* Special Requests */}
                          {(booking.specialRequests || booking.special_requests) && (
                            <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-lg p-4 mb-6 border border-purple-500/20">
                              <div className="flex items-center gap-2 mb-2">
                                <MessageSquare className="w-4 h-4 text-purple-400" />
                                <span className="text-sm font-medium text-purple-300">Special Requests</span>
                              </div>
                              <p className="text-gray-300 text-sm leading-relaxed">
                                {booking.specialRequests || booking.special_requests}
                              </p>
                            </div>
                          )}

                          {/* Booking Source & Metadata */}
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-6 pb-4 border-b border-gray-700/30">
                            <div className="flex items-center gap-4">
                              <span>Source: {booking.source || 'Unknown'}</span>
                              <span>•</span>
                              <span>Created: {toDate(booking.createdAt || booking.created_at || Date.now()).toLocaleDateString()}</span>
                            </div>
                            {booking.priority && (
                              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                                {booking.priority} priority
                              </Badge>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-3">
                            {booking.status === 'rejected' && (
                              <div className="w-full bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/30 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                  <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-red-300 font-medium">Booking Rejected</span>
                                      {booking.rejectedAt && (
                                        <span className="text-red-400/70 text-xs">
                                          {toDate(booking.rejectedAt).toLocaleDateString()}
                                        </span>
                                      )}
                                    </div>
                                    {booking.rejectionReason && (
                                      <p className="text-red-200/80 text-sm">
                                        <strong>Reason:</strong> {booking.rejectionReason}
                                      </p>
                                    )}
                                    {booking.rejectedBy && (
                                      <p className="text-red-200/60 text-xs mt-1">
                                        Rejected by: {booking.rejectedBy}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {(booking.status === 'pending' || booking.status === 'pending_approval') && (
                              <>
                                <motion.div
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="flex-1"
                                >
                                  <Button
                                    onClick={() => handleBookingApproval(booking.id, 'approve')}
                                    disabled={processingBookingId === booking.id}
                                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-green-500/25 transition-all duration-300"
                                  >
                                    {processingBookingId === booking.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                    )}
                                    Approve & Assign
                                  </Button>
                                </motion.div>

                                <motion.div
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Button
                                    onClick={() => handleRejectBooking(booking)}
                                    disabled={processingBookingId === booking.id}
                                    variant="outline"
                                    className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-400/70 transition-all duration-300"
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject
                                  </Button>
                                </motion.div>
                              </>
                            )}

                            {(booking.status === 'approved' || booking.status === 'confirmed') && (
                              <div className="flex items-center gap-3 w-full">
                                <div className="flex-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg p-3">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                    <span className="text-green-300 font-medium">Approved & Ready</span>
                                  </div>
                                </div>

                                <motion.div
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Button
                                    onClick={() => {
                                      const modalBooking = {
                                        id: booking.id,
                                        propertyId: booking.propertyId || `property_${booking.id}`,
                                        propertyName: booking.propertyName || booking.property || 'Unknown Property',
                                        propertyAddress: booking.propertyAddress || booking.address || 'Address not provided',
                                        guestName: booking.guestName || booking.guest_name || 'Unknown Guest',
                                        guestEmail: booking.guestEmail || booking.guest_email || '',
                                        guestPhone: booking.guestPhone || booking.guest_phone || '',
                                        checkInDate: booking.checkInDate || booking.checkIn || booking.check_in || '',
                                        checkOutDate: booking.checkOutDate || booking.checkOut || booking.check_out || '',
                                        guestCount: booking.guestCount || booking.numberOfGuests || booking.guests || 1,
                                        price: booking.price || booking.amount || booking.total || 0,
                                        currency: booking.currency || 'USD',
                                        specialRequests: booking.specialRequests || booking.special_requests || '',
                                        source: booking.source || 'enhanced_booking_management',
                                        createdAt: booking.createdAt || booking.created_at || new Date().toISOString(),
                                        nights: booking.nights || 1
                                      }

                                      const jobType: JobType = determineJobType(modalBooking)
                                      const priority: JobPriority = determinePriority(modalBooking)

                                      setStaffAssignmentModal({
                                        isOpen: true,
                                        booking: modalBooking,
                                        jobType,
                                        priority
                                      })
                                    }}
                                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-purple-500/25 transition-all duration-300"
                                  >
                                    <UserCheck className="w-4 h-4 mr-2" />
                                    Assign Staff
                                  </Button>
                                </motion.div>
                              </div>
                            )}

                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button
                                onClick={() => setExpandedBooking(expandedBooking === booking.id ? null : booking.id)}
                                variant="outline"
                                size="sm"
                                className="border-gray-600/50 text-gray-300 hover:bg-gray-700/50"
                              >
                                {expandedBooking === booking.id ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </Button>
                            </motion.div>
                          </div>

                          {/* Expanded Details */}
                          <AnimatePresence>
                            {expandedBooking === booking.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="mt-6 pt-6 border-t border-gray-700/30"
                              >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <h5 className="font-medium text-white mb-2">Booking Timeline</h5>
                                    <div className="space-y-2 text-gray-400">
                                      <div>Created: {toDate(booking.createdAt || booking.created_at || Date.now()).toLocaleString()}</div>
                                      {booking.approvedAt && (
                                        <div>Approved: {toDate(booking.approvedAt).toLocaleString()}</div>
                                      )}
                                      <div>Check-in: {booking.checkInDate || booking.checkIn || booking.check_in ?
                                        toDate(booking.checkInDate || booking.checkIn || booking.check_in).toLocaleDateString() : 'Not set'}</div>
                                      <div>Check-out: {booking.checkOutDate || booking.checkOut || booking.check_out ?
                                        toDate(booking.checkOutDate || booking.checkOut || booking.check_out).toLocaleDateString() : 'Not set'}</div>
                                    </div>
                                  </div>

                                  <div>
                                    <h5 className="font-medium text-white mb-2">Additional Details</h5>
                                    <div className="space-y-2 text-gray-400">
                                      <div>Booking ID: {booking.id}</div>
                                      <div>Source: {booking.source || 'Unknown'}</div>
                                      <div>Currency: {booking.currency || 'USD'}</div>
                                      {booking.nights && <div>Nights: {booking.nights}</div>}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Enhanced Staff Assignment Modal */}
      <StaffAssignmentSelector
        isOpen={staffAssignmentModal.isOpen}
        onClose={() => {
          setStaffAssignmentModal({
            isOpen: false,
            booking: null,
            jobType: 'cleaning',
            priority: 'medium'
          })
          console.log('🔄 Staff assignment modal closed')
        }}
        onAssign={(staffId, jobData) => {
          console.log('✅ Staff assigned successfully via enhanced interface:', staffId, jobData)

          // Close modal
          setStaffAssignmentModal({
            isOpen: false,
            booking: null,
            jobType: 'cleaning',
            priority: 'medium'
          })

          // Refresh booking data to show updated assignments
          loadAllBookings()

          // Enhanced success feedback
          toast.success('🎉 Job assigned to staff successfully!', {
            description: 'Staff member has been notified via dashboard and mobile app',
            duration: 5000
          })

          // Trigger callback for parent component
          if (onStaffAssigned && staffAssignmentModal.booking) {
            onStaffAssigned(staffAssignmentModal.booking.id, [jobData.jobId])
          }

          // Log the successful enhanced workflow completion
          console.log('🎯 Enhanced workflow complete: Booking → Staff Assignment → Job Creation → Notifications')
        }}
        bookingData={staffAssignmentModal.booking}
        jobType={staffAssignmentModal.jobType}
        priority={staffAssignmentModal.priority}
        requiredSkills={getRequiredSkills(staffAssignmentModal.jobType)}
        scheduledDate={staffAssignmentModal.booking?.checkInDate}
        autoAssignEnabled={automationEnabled}
      />

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
                <div>Check-in: {rejectionDialog.booking.checkInDate || rejectionDialog.booking.checkIn || rejectionDialog.booking.check_in ?
                  toDate(rejectionDialog.booking.checkInDate || rejectionDialog.booking.checkIn || rejectionDialog.booking.check_in).toLocaleDateString() : 'Not set'}</div>
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
    </motion.div>
  )
}
