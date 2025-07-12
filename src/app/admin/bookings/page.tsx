'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { BookingService, LiveBooking } from '@/lib/services/bookingService'
import {
  EnhancedBookingService,
  BookingAnalytics,
  BookingConflict,
  AutomationRule,
  BookingInsight
} from '@/lib/services/enhancedBookingService'
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
  Loader2,
  Bot,
  Zap,
  TrendingUp,
  Brain,
  Settings,
  Shield,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Sparkles
} from 'lucide-react'
import { toast } from 'react-hot-toast'

// Using enhanced interfaces from EnhancedBookingService

export default function AdminBookingsPage() {
  const [allBookings, setAllBookings] = useState<LiveBooking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<LiveBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [processingBookings, setProcessingBookings] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'analytics'>('cards')
  const [automationEnabled, setAutomationEnabled] = useState(true)
  const [conflicts, setConflicts] = useState<BookingConflict[]>([])
  const [analytics, setAnalytics] = useState<BookingAnalytics | null>(null)

  // Load all data on component mount
  useEffect(() => {
    loadAllBookings()
    loadAnalytics()
    loadConflicts()
  }, [])

  // Filter bookings when dependencies change
  useEffect(() => {
    filterBookings()
  }, [allBookings, searchTerm, statusFilter])

  const loadAllBookings = async () => {
    try {
      setLoading(true)
      console.log('📋 Loading all bookings for ultimate admin management...')

      const bookings = await BookingService.getAllBookings()

      // Debug: Check booking structure
      console.log('🔍 DEBUG: First booking structure:', bookings[0])
      bookings.forEach((booking, index) => {
        console.log(`🔍 DEBUG: Booking ${index} ID:`, booking.id, 'Type:', typeof booking.id)
        if (!booking.id) {
          console.error(`❌ DEBUG: Booking ${index} missing ID:`, booking)
        }
      })

      setAllBookings(bookings)

      console.log(`✅ Loaded ${bookings.length} total bookings`)
    } catch (error) {
      console.error('❌ Error loading bookings:', error)
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const loadAnalytics = async () => {
    try {
      console.log('📊 Loading real-time booking analytics...')
      const realAnalytics = await EnhancedBookingService.getBookingAnalytics()
      setAnalytics(realAnalytics)
      console.log('✅ Analytics loaded successfully')
    } catch (error) {
      console.error('❌ Error loading analytics:', error)
      // Set null analytics on error - no fallback mock data
      setAnalytics(null)
      toast.error('Failed to load booking analytics')
    }
  }

  const loadConflicts = async () => {
    try {
      console.log('🔍 Loading booking conflicts...')
      const realConflicts = await EnhancedBookingService.detectBookingConflicts()
      setConflicts(realConflicts)
      console.log(`✅ Found ${realConflicts.length} conflicts`)
    } catch (error) {
      console.error('❌ Error loading conflicts:', error)
      setConflicts([])
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
      // Debug: Check what bookingId we received
      console.log('🔍 DEBUG: handleBookingAction called with:', {
        bookingId,
        bookingIdType: typeof bookingId,
        bookingIdLength: bookingId?.length,
        action,
        adminNotes
      })

      if (!bookingId) {
        console.error('❌ DEBUG: No booking ID provided to handleBookingAction')
        toast.error('Invalid booking ID')
        return
      }

      setProcessingBookings(prev => new Set(prev).add(bookingId))

      console.log(`📝 ${action === 'approved' ? 'Approving' : 'Rejecting'} booking ${bookingId}`)
      
      // Enhanced processing with automation
      if (automationEnabled && action === 'approved') {
        console.log('🤖 Running automation rules...')
        const automationSuccess = await EnhancedBookingService.processAutomationRules(bookingId)
        if (automationSuccess) {
          toast.success('Automation rules executed successfully')
        } else {
          toast.error('Some automation rules failed to execute')
        }
      }
      
      const success = await BookingService.updateBookingStatus(bookingId, action, adminNotes)
      
      if (success) {
        toast.success(`Booking ${action === 'approved' ? 'approved' : 'rejected'} successfully`)
        
        // Update local state
        setAllBookings(prev => prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: action, adminNotes }
            : booking
        ))
        
        // Create automated tasks for approved bookings
        if (action === 'approved') {
          console.log('🔄 Creating automated tasks for approved booking')
          toast.success('Automated tasks created for property preparation')
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

  const handleBulkAction = async (action: 'approve' | 'reject', bookingIds: string[]) => {
    try {
      console.log(`🔄 Processing bulk ${action} for ${bookingIds.length} bookings`)
      
      for (const bookingId of bookingIds) {
        await handleBookingAction(bookingId, action === 'approve' ? 'approved' : 'rejected')
      }
      
      toast.success(`Bulk ${action} completed for ${bookingIds.length} bookings`)
    } catch (error) {
      console.error(`❌ Bulk ${action} failed:`, error)
      toast.error(`Bulk ${action} failed`)
    }
  }

  const handleAutomationToggle = () => {
    setAutomationEnabled(!automationEnabled)
    toast.success(`Automation ${!automationEnabled ? 'enabled' : 'disabled'}`)
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
      return <Badge variant="destructive" className="bg-red-500/20 text-red-400 animate-pulse">
        <AlertCircle className="w-3 h-3 mr-1" />
        Urgent - Today/Tomorrow
      </Badge>
    } else if (daysUntilCheckIn <= 3) {
      return <Badge variant="secondary" className="bg-orange-500/20 text-orange-400">
        <Clock className="w-3 h-3 mr-1" />
        High Priority - {daysUntilCheckIn} days
      </Badge>
    } else if (daysUntilCheckIn <= 7) {
      return <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
        <Calendar className="w-3 h-3 mr-1" />
        Medium Priority - {daysUntilCheckIn} days
      </Badge>
    } else {
      return <Badge variant="secondary" className="bg-green-500/20 text-green-400">
        <CheckCircle className="w-3 h-3 mr-1" />
        Low Priority - {daysUntilCheckIn} days
      </Badge>
    }
  }

  const getSmartMatchBadge = (booking: LiveBooking) => {
    if (booking.clientId) {
      const confidence = booking.matchConfidence || 0
      if (confidence > 0.9) {
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          <Brain className="w-3 h-3 mr-1" />
          AI Match (97% confidence)
        </Badge>
      } else if (confidence > 0.7) {
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
          <Target className="w-3 h-3 mr-1" />
          Good Match ({(confidence * 100).toFixed(0)}%)
        </Badge>
      } else {
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
          <Shield className="w-3 h-3 mr-1" />
          Needs Review
        </Badge>
      }
    }
    return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
      <AlertCircle className="w-3 h-3 mr-1" />
      No Match
    </Badge>
  }

  const stats = {
    total: allBookings.length,
    pending: allBookings.filter(b => b.status === 'pending_approval').length,
    approved: allBookings.filter(b => b.status === 'approved').length,
    rejected: allBookings.filter(b => b.status === 'rejected').length,
    totalRevenue: allBookings
      .filter(b => b.status === 'approved')
      .reduce((sum, b) => sum + (b.revenue || 0), 0),
    automationRate: analytics?.automationEfficiency || 0,
    conflictCount: conflicts.length,
    avgProcessingTime: analytics?.averageProcessingTime || 0
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="relative">
              <Loader2 className="w-12 h-12 animate-spin text-blue-400" />
              <div className="absolute inset-0 w-12 h-12 border-4 border-blue-400/20 rounded-full animate-ping"></div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-white">Loading Ultimate Booking System</h3>
              <p className="text-neutral-400">Initializing AI automation and analytics...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Ultimate Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <div className="relative">
                  <Calendar className="w-10 h-10 text-blue-400" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                Ultimate Booking Management
              </h1>
              <p className="text-neutral-400 text-lg">
                AI-Powered Automation • Real-Time Analytics • Intelligent Conflict Resolution
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleAutomationToggle}
                variant={automationEnabled ? "default" : "outline"}
                className={`${automationEnabled ? 'bg-green-600 hover:bg-green-700' : 'border-green-500/50 text-green-400'}`}
              >
                <Bot className="w-4 h-4 mr-2" />
                {automationEnabled ? 'Automation ON' : 'Automation OFF'}
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
        </div>

        {/* Ultimate Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          {/* Primary Stats */}
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

          {/* Advanced Stats */}
          <Card className="bg-gradient-to-r from-purple-600/20 to-purple-800/20 border-purple-500/30">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-400">${stats.totalRevenue.toLocaleString()}</div>
              <p className="text-sm text-purple-300">Revenue</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-cyan-600/20 to-cyan-800/20 border-cyan-500/30">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-cyan-400">{stats.automationRate.toFixed(1)}%</div>
              <p className="text-sm text-cyan-300">Automation</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-orange-600/20 to-orange-800/20 border-orange-500/30">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-400">{stats.conflictCount}</div>
              <p className="text-sm text-orange-300">Conflicts</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-emerald-600/20 to-emerald-800/20 border-emerald-500/30">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-emerald-400">{stats.avgProcessingTime.toFixed(1)}m</div>
              <p className="text-sm text-emerald-300">Avg Process</p>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Search & Filter */}
          <Card className="bg-neutral-950 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Search className="w-5 h-5" />
                Smart Search & Filter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                  <Input
                    placeholder="Search by guest, property, or reference..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-neutral-900 border-neutral-700 text-white"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-md text-white"
                >
                  <option value="all">All Status</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Automation Control */}
          <Card className="bg-neutral-950 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Automation Control
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-300">Auto-Approval</span>
                  <div className={`w-12 h-6 rounded-full ${automationEnabled ? 'bg-green-500' : 'bg-neutral-600'} relative cursor-pointer`}
                       onClick={handleAutomationToggle}>
                    <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${automationEnabled ? 'left-6' : 'left-0.5'}`}></div>
                  </div>
                </div>
                <div className="text-xs text-neutral-400">
                  {automationEnabled ? 'AI is actively processing bookings' : 'Manual approval required'}
                </div>
                <Button size="sm" variant="outline" className="w-full">
                  <Settings className="w-4 h-4 mr-2" />
                  Configure Rules
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-neutral-950 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button 
                  size="sm" 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    const pendingIds = filteredBookings
                      .filter(b => b.status === 'pending_approval')
                      .map(b => b.id)
                    if (pendingIds.length > 0) {
                      handleBulkAction('approve', pendingIds)
                    }
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve All Pending
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full border-blue-500/50 text-blue-400"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full border-purple-500/50 text-purple-400"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ultimate Bookings Display */}
        <Card className="bg-neutral-950 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Guest Bookings
              <Badge variant="secondary" className="bg-neutral-700 text-neutral-300">
                {filteredBookings.length} bookings
              </Badge>
              {stats.pending > 0 && (
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 animate-pulse">
                  {stats.pending} pending review
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredBookings.length === 0 ? (
              <div className="text-center py-16">
                <div className="relative mb-6">
                  <Calendar className="w-24 h-24 text-neutral-600 mx-auto" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-neutral-300 mb-2">No bookings found</h3>
                <p className="text-neutral-400 mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your filters or search terms' 
                    : 'Bookings will appear here automatically when received from Make.com'
                  }
                </p>
                <div className="text-sm text-neutral-500">
                  AI automation is {automationEnabled ? 'actively monitoring' : 'paused'} for new bookings
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredBookings.map((booking) => {
                  const isProcessing = processingBookings.has(booking.id)
                  
                  return (
                    <div
                      key={booking.id}
                      className="group relative p-6 bg-neutral-900 rounded-xl border border-neutral-700 hover:border-neutral-600 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10"
                    >
                      {/* Booking Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                              <User className="w-6 h-6 text-white" />
                            </div>
                            {booking.clientId && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-2 h-2 text-white" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-white">{booking.guestName}</h3>
                            <p className="text-neutral-400">{booking.guestEmail}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getUrgencyBadge(booking.checkInDate)}
                          {getStatusBadge(booking.status)}
                          <Badge variant="secondary" className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30">
                            <Sparkles className="w-3 h-3 mr-1" />
                            AI Managed
                          </Badge>
                        </div>
                      </div>

                      {/* Booking Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-lg">
                          <Home className="w-5 h-5 text-blue-400" />
                          <div>
                            <p className="text-sm text-neutral-400">Property</p>
                            <p className="text-white font-medium">{booking.villaName}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-lg">
                          <Calendar className="w-5 h-5 text-green-400" />
                          <div>
                            <p className="text-sm text-neutral-400">Check-in</p>
                            <p className="text-white font-medium">{formatDate(booking.checkInDate)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-lg">
                          <Calendar className="w-5 h-5 text-orange-400" />
                          <div>
                            <p className="text-sm text-neutral-400">Check-out</p>
                            <p className="text-white font-medium">{formatDate(booking.checkOutDate)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-lg">
                          <DollarSign className="w-5 h-5 text-emerald-400" />
                          <div>
                            <p className="text-sm text-neutral-400">Revenue</p>
                            <p className="text-emerald-400 font-bold text-lg">
                              ${booking.price?.toLocaleString()} {booking.currency}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Special Requests */}
                      {booking.specialRequests && (
                        <div className="mb-4 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
                          <div className="flex items-start gap-3">
                            <MessageSquare className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-blue-300 mb-1">Special Requests:</p>
                              <p className="text-neutral-300 text-sm leading-relaxed">{booking.specialRequests}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* AI Client Matching Status */}
                      <div className="mb-4">
                        {booking.clientId ? (
                          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
                            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                              <Brain className="w-4 h-4 text-green-400" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-green-400 font-medium">✅ AI Client Match Found</span>
                                {booking.matchConfidence && (
                                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                                    {(booking.matchConfidence * 100).toFixed(0)}% confidence
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-green-300 mt-1">Client ID: {booking.clientId}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/20">
                            <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                              <AlertCircle className="w-4 h-4 text-yellow-400" />
                            </div>
                            <div className="flex-1">
                              <span className="text-yellow-400 font-medium">⚠️ No Client Match Found</span>
                              <p className="text-sm text-yellow-300 mt-1">Requires manual client assignment</p>
                            </div>
                            <Button size="sm" variant="outline" className="border-yellow-500/50 text-yellow-400">
                              <Target className="w-4 h-4 mr-1" />
                              Match Client
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      {booking.status === 'pending_approval' && (
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button
                            onClick={() => {
                              console.log('🔍 DEBUG: Button clicked for booking:', {
                                bookingId: booking.id,
                                bookingObject: booking,
                                hasId: !!booking.id
                              })
                              handleBookingAction(booking.id, 'approved')
                            }}
                            disabled={isProcessing}
                            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <CheckCircle className="w-4 h-4 mr-2" />
                            )}
                            Approve & Automate
                          </Button>
                          
                          <Button
                            onClick={() => handleBookingAction(booking.id, 'rejected', 'Rejected by admin')}
                            disabled={isProcessing}
                            variant="outline"
                            className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <XCircle className="w-4 h-4 mr-2" />
                            )}
                            Reject
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-neutral-600 text-neutral-400"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Details
                          </Button>
                        </div>
                      )}

                      {/* Booking completed status */}
                      {booking.status === 'approved' && (
                        <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                          <span className="text-green-400 font-medium">Booking Approved & Automated</span>
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                            Tasks Created
                          </Badge>
                        </div>
                      )}

                      {/* Metadata Footer */}
                      <div className="mt-4 pt-4 border-t border-neutral-700">
                        <div className="flex items-center justify-between text-xs text-neutral-500">
                          <div className="flex items-center gap-4">
                            <span>Received: {new Date(booking.receivedAt?.toDate?.() || booking.receivedAt).toLocaleString()}</span>
                            {booking.bookingReference && (
                              <span className="flex items-center gap-1">
                                <span>Ref:</span>
                                <code className="px-2 py-1 bg-neutral-800 rounded text-neutral-300">
                                  {booking.bookingReference}
                                </code>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-neutral-800 text-neutral-400">
                              {booking.bookingSource}
                            </Badge>
                            {automationEnabled && (
                              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                                <Bot className="w-3 h-3 mr-1" />
                                AI Processed
                              </Badge>
                            )}
                          </div>
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
