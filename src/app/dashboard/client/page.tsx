'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
// TODO: Replace with new database service when implemented
// import DatabaseService, { DatabaseResponse } from '@/lib/newDatabaseService'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { IncomeExpenseChart } from '@/components/dashboard/charts/IncomeExpenseChart'
import { MobileIncomeExpenseChart } from '@/components/dashboard/charts/MobileIncomeExpenseChart'
import { SummaryCardsGrid, SummaryCardsGridSkeleton } from '@/components/dashboard/SummaryCardsGrid'
import { BookingPreview, BookingPreviewSkeleton } from '@/components/dashboard/BookingPreview'
import { PropertyService, Property as PropertyServiceProperty } from '@/lib/services/propertyService'
import { BookingService, LiveBooking } from '@/lib/services/bookingService'
import { ReportService, MonthlyMetrics } from '@/lib/services/reportService'
import { Report, Booking, Task } from '@/types'
import {
  Wrench,
  Calendar,
  Home,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  Settings,
  TrendingUp
} from 'lucide-react'
import { format, subMonths, isAfter, isBefore, addDays } from 'date-fns'
import toast from 'react-hot-toast'

// No mock data - all data comes from live sources only

export default function ClientDashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [properties, setProperties] = useState<PropertyServiceProperty[]>([])
  const [liveBookings, setLiveBookings] = useState<LiveBooking[]>([])
  const [monthlyMetrics, setMonthlyMetrics] = useState<MonthlyMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMetric, setSelectedMetric] = useState('revenue')



  // Route protection
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        console.log('❌ No user found, redirecting to login')
        router.push('/auth/login')
        return
      }
      console.log('✅ User found, user can access client dashboard')
    }
  }, [user, authLoading, router])



  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      console.log('🔄 Loading dashboard data from Firebase...')

      if (!user?.id) {
        console.log('⚠️ No user profile available, using empty data')
        setProperties([])
        setLiveBookings([])
        setMonthlyMetrics(null)
        return
      }

      // Load user's actual data from Firebase/Firestore
      try {
        // Fetch properties
        const userProperties = await PropertyService.getPropertiesByUserId(user.id)
        setProperties(userProperties)
        console.log(`✅ Loaded ${userProperties.length} properties`)

        if (userProperties.length > 0) {
          console.log('🔄 Loading live booking data...')

          // Fetch live bookings for this client
          const clientBookings = await BookingService.getBookingsByClientId(user.id)
          console.log('📋 Live bookings loaded:', clientBookings.length)
          setLiveBookings(clientBookings)

          // Fetch monthly financial metrics
          const metrics = await ReportService.getMonthlyMetrics(user.id)
          console.log('📊 Monthly metrics loaded:', metrics)
          setMonthlyMetrics(metrics)

          // No mock data - only use real live data
          console.log('✅ Dashboard data loaded (live data only):', {
            properties: userProperties.length,
            liveBookings: clientBookings.length,
            hasMetrics: !!metrics
          })

          // No additional setup needed - live data only
        } else {
          console.log('📝 No properties found - user needs to complete onboarding')
          setLiveBookings([])
          setMonthlyMetrics(null)
        }
      } catch (serviceError) {
        console.error('❌ Error loading data from services:', serviceError)
        // Fallback to empty data for graceful degradation
        setProperties([])
        setLiveBookings([])
        setMonthlyMetrics(null)
      }

    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    // In development mode with session bypass, always fetch data
    const isDevelopmentBypass = process.env.NODE_ENV === 'development' &&
                               process.env.NEXT_PUBLIC_DEV_SESSION_BYPASS === 'true'

    if (user?.id || isDevelopmentBypass) {
      fetchDashboardData()
    }
  }, [user?.id, fetchDashboardData])

  // Calculate dashboard metrics - use live data only, no mock data
  const calculateMetrics = () => {
    // Use live bookings if available, otherwise return zeros
    if (liveBookings && liveBookings.length > 0) {
      const now = new Date()

      // Calculate from live bookings
      const approvedBookings = liveBookings.filter(b => b.status === 'approved')
      const totalIncome = approvedBookings.reduce((sum, b) => sum + (b.revenue || 0), 0)

      // Upcoming bookings (next 30 days)
      const upcomingBookings = approvedBookings.filter(booking => {
        const checkIn = new Date(booking.checkInDate)
        return isAfter(checkIn, now) && isBefore(checkIn, addDays(now, 30))
      })

      // Active bookings (currently staying)
      const activeBookings = approvedBookings.filter(booking => {
        const checkIn = new Date(booking.checkInDate)
        const checkOut = new Date(booking.checkOutDate)
        return isBefore(checkIn, now) && isAfter(checkOut, now)
      })

      return {
        totalIncome,
        totalExpenses: 0, // Will be calculated from live data later
        netIncome: totalIncome,
        avgOccupancy: 0, // Will be calculated from live data later
        upcomingBookings,
        activeBookings,
        pendingTasks: [], // No tasks yet
        totalProperties: properties.length,
        totalBookings: liveBookings.length
      }
    }

    // No live data - return clean empty state
    return {
      totalIncome: 0,
      totalExpenses: 0,
      netIncome: 0,
      avgOccupancy: 0,
      upcomingBookings: [],
      activeBookings: [],
      pendingTasks: [],
      totalProperties: properties.length,
      totalBookings: 0
    }
  }

  // Calculate summary metrics for cards
  const calculateSummaryMetrics = () => {
    // Use live data if available, otherwise fall back to mock data
    if (monthlyMetrics) {
      console.log('📊 Using live monthly metrics for summary cards')
      return {
        totalIncomeThisMonth: monthlyMetrics.totalIncomeThisMonth,
        totalExpensesThisMonth: monthlyMetrics.totalExpensesThisMonth,
        netProfitThisMonth: monthlyMetrics.netProfitThisMonth,
        occupancyRateThisMonth: monthlyMetrics.occupancyRateThisMonth,
        upcomingBookingsCount: monthlyMetrics.upcomingBookingsCount,
        incomeChange: monthlyMetrics.incomeChange,
        expensesChange: monthlyMetrics.expensesChange,
        profitChange: monthlyMetrics.profitChange,
        occupancyChange: monthlyMetrics.occupancyChange,
        bookingsChange: monthlyMetrics.bookingsChange,
        currency: monthlyMetrics.currency
      }
    }

    // No live metrics available - return zeros for clean new account
    console.log('📊 No live metrics available - showing clean dashboard for new account')

    return {
      totalIncomeThisMonth: 0,
      totalExpensesThisMonth: 0,
      netProfitThisMonth: 0,
      occupancyRateThisMonth: 0,
      upcomingBookingsCount: 0,
      incomeChange: 0,
      expensesChange: 0,
      profitChange: 0,
      occupancyChange: 0,
      bookingsChange: 0,
      currency: 'USD'
    }
  }

  // Prepare chart data - use live data only, no mock data
  const prepareChartData = () => {
    const last6Months = []
    const now = new Date()

    // Generate empty chart data for clean new accounts
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(now, i)
      last6Months.push({
        month: format(date, 'MMM yyyy'),
        income: 0,
        expenses: 0,
        net: 0
      })
    }

    return last6Months
  }

  // Prepare upcoming bookings data - use live data only, no mock data
  const prepareUpcomingBookings = () => {
    // Return empty array for clean new accounts
    return []
  }

  // Prepare active maintenance tasks - use live data only, no mock data
  const prepareMaintenanceTasks = () => {
    // Return empty array for clean new accounts
    return []
  }

  const metrics = calculateMetrics()
  const chartData = prepareChartData()
  const upcomingBookings = prepareUpcomingBookings()
  const maintenanceTasks = prepareMaintenanceTasks()

  // In development mode with session bypass, don't require user
  const isDevelopmentBypass = process.env.NODE_ENV === 'development' &&
                             process.env.NEXT_PUBLIC_DEV_SESSION_BYPASS === 'true'

  // Debug authentication state
  console.log('🔍 Dashboard auth check:', {
    authLoading,
    loading,
    user: !!user,
    userName: user?.full_name,
    userRole: user?.role,
    isDevelopmentBypass
  })

  if (authLoading || loading || (!user && !isDevelopmentBypass)) {
    console.log('⏳ Dashboard showing loading screen:', {
      authLoading,
      loading,
      hasUser: !!user,
      isDevelopmentBypass
    })
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-neutral-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Overview of your property portfolio"
      actions={
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/settings')}
          className="text-neutral-400 hover:text-white"
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      }
    >
      <div className="max-w-7xl mx-auto">


        {/* Mobile Summary Cards Grid - Mobile Only */}
        <div className="block md:hidden mb-8">
          {loading ? (
            <SummaryCardsGridSkeleton />
          ) : (
            <SummaryCardsGrid
              metrics={calculateSummaryMetrics()}
              onCardTap={(cardType) => {
                console.log('Card tapped:', cardType)
                // Handle card tap - could navigate to detailed view
              }}
            />
          )}
        </div>

        {/* Metric Selector - Lightspeed Style */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-400">Monthly</span>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="bg-transparent border-none text-primary-400 text-sm font-medium focus:outline-none cursor-pointer"
            >
              <option value="revenue" className="bg-neutral-900 text-white">Revenue</option>
              <option value="bookings" className="bg-neutral-900 text-white">Bookings</option>
              <option value="occupancy" className="bg-neutral-900 text-white">Occupancy</option>
            </select>
            <TrendingUp className="w-4 h-4 text-primary-400" />
          </div>
        </div>

        {/* Mobile Chart - Compact Design */}
        <div className="block md:hidden mb-8">
          <Card className="bg-neutral-950 border-neutral-800 overflow-hidden">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-white font-medium text-lg">Financial Overview</h3>
                  <p className="text-neutral-400 text-sm mt-1">Past 6 months performance</p>
                </div>
              </div>
              <div className="h-[400px] w-full">
                <MobileIncomeExpenseChart data={chartData} />
              </div>
            </div>
          </Card>
        </div>

        {/* Desktop Chart - Original Lightspeed Style - Full Screen Width */}
        <div className="hidden md:block mb-8 -mx-6 md:-mx-12 lg:-mx-[calc(30vw-30%+2rem)] relative w-auto">
          <Card className="bg-neutral-950 border-neutral-800 p-0 overflow-hidden rounded-none border-x-0 w-auto">
            <div className="px-6 md:px-12 lg:px-16 py-6 border-b border-neutral-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium text-lg">Revenue Overview</h3>
                  <p className="text-neutral-400 text-sm mt-1">Monthly performance tracking</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                    <span className="text-neutral-400 text-sm">Income</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-neutral-400 text-sm">Expenses</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 md:px-12 lg:px-16 py-8">
              <div className="relative h-96 md:h-[32rem] lg:h-[38rem] w-full">
                <IncomeExpenseChart data={chartData} />
              </div>
            </div>
          </Card>
        </div>

        {/* Bottom Metrics - Lightspeed Style Circular Progress */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Revenue Target */}
          <Card className="bg-neutral-950 border-neutral-800 p-6 text-center">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  className="text-neutral-800"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - Math.min(metrics.totalIncome / 50000, 1))}`}
                  className="text-green-400 transition-all duration-1000"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-green-400">
                  {Math.round((metrics.totalIncome / 50000) * 100)}%
                </span>
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              ${metrics.totalIncome.toLocaleString()}
            </div>
            <div className="text-xs text-neutral-400 mb-1 uppercase tracking-wide">
              Revenue Target
            </div>
            <div className="text-xs text-neutral-500">
              vs $50,000
            </div>
          </Card>

          {/* Bookings Target */}
          <Card className="bg-neutral-950 border-neutral-800 p-6 text-center">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  className="text-neutral-800"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - Math.min(metrics.totalBookings / 100, 1))}`}
                  className="text-orange-400 transition-all duration-1000"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-orange-400">
                  {Math.round((metrics.totalBookings / 100) * 100)}%
                </span>
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {metrics.totalBookings}
            </div>
            <div className="text-xs text-neutral-400 mb-1 uppercase tracking-wide">
              Booking Target
            </div>
            <div className="text-xs text-neutral-500">
              vs 100
            </div>
          </Card>

          {/* Occupancy Target */}
          <Card className="bg-neutral-950 border-neutral-800 p-6 text-center">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  className="text-neutral-800"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - metrics.avgOccupancy / 100)}`}
                  className="text-red-400 transition-all duration-1000"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-red-400">
                  {Math.round(metrics.avgOccupancy)}%
                </span>
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {metrics.avgOccupancy.toFixed(1)}%
            </div>
            <div className="text-xs text-neutral-400 mb-1 uppercase tracking-wide">
              Occupancy Target
            </div>
            <div className="text-xs text-neutral-500">
              vs 85%
            </div>
          </Card>
        </div>

        {/* Mobile Booking Preview - Compact Design */}
        <div className="block md:hidden mb-8">
          {loading ? (
            <BookingPreviewSkeleton />
          ) : (
            <BookingPreview
              bookings={upcomingBookings}
              onViewAll={() => {
                console.log('Navigate to full bookings page')
                // Could navigate to /bookings or open modal
              }}
            />
          )}
        </div>

        {/* Desktop Booking Section - Original Layout */}
        <div className="hidden md:block mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-6 mt-3">
              <Calendar className="w-5 h-5 text-primary-400" />
              Upcoming Bookings
            </h2>
            <span className="text-sm text-neutral-400">
              Next {upcomingBookings.length} bookings
            </span>
          </div>

          {upcomingBookings.length === 0 ? (
            <Card className="bg-neutral-900 border-neutral-800">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-primary-500/10 to-primary-600/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-8 h-8 text-primary-400" />
                </div>
                <p className="text-neutral-400">No upcoming bookings</p>
                <p className="text-sm text-neutral-500 mt-1">
                  New bookings will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Card className="bg-neutral-900 border-neutral-800">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-neutral-800">
                            <th className="text-left p-4 text-sm font-medium text-neutral-400">Guest</th>
                            <th className="text-left p-4 text-sm font-medium text-neutral-400">Property</th>
                            <th className="text-left p-4 text-sm font-medium text-neutral-400">Check-in</th>
                            <th className="text-left p-4 text-sm font-medium text-neutral-400">Check-out</th>
                            <th className="text-left p-4 text-sm font-medium text-neutral-400">Source</th>
                            <th className="text-left p-4 text-sm font-medium text-neutral-400">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td colSpan={6} className="p-8 text-center">
                              <div className="flex flex-col items-center gap-3">
                                <Calendar className="w-12 h-12 text-neutral-600" />
                                <div>
                                  <p className="text-neutral-400 font-medium">No bookings yet</p>
                                  <p className="text-neutral-500 text-sm">Bookings will appear here once your Make.com automation processes them</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                <Card className="bg-neutral-900 border-neutral-800">
                  <CardContent className="p-8 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Calendar className="w-12 h-12 text-neutral-600" />
                      <div>
                        <p className="text-neutral-400 font-medium">No bookings yet</p>
                        <p className="text-neutral-500 text-sm">Bookings will appear here once your Make.com automation processes them</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>

        {/* Active Maintenance Issues Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-primary-400" />
              Active Maintenance
            </h2>
            <span className="text-sm text-neutral-400">
              {maintenanceTasks.length} active {maintenanceTasks.length === 1 ? 'issue' : 'issues'}
            </span>
          </div>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500/10 to-green-600/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-neutral-400">No active maintenance issues</p>
              <p className="text-sm text-neutral-500 mt-1">
                All maintenance tasks are up to date
              </p>
            </CardContent>
          </Card>
        </div>


      </div>


    </DashboardLayout>
  )
}