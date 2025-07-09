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
import { PropertyService } from '@/lib/services/propertyService'
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

// Mock data generators for demonstration
const generateMockReports = (properties: any[]) => {
  const reports = []
  const currentDate = new Date()

  // Generate 6 months of mock reports for each property
  for (let i = 0; i < 6; i++) {
    const date = subMonths(currentDate, i)
    const month = date.getMonth() + 1
    const year = date.getFullYear()

    properties.forEach((property, index) => {
      const baseIncome = 15000 + (index * 5000) + (Math.random() * 10000)
      const baseExpenses = baseIncome * (0.3 + Math.random() * 0.2) // 30-50% of income

      reports.push({
        id: `report-${property.id}-${year}-${month}`,
        property_id: property.id,
        month,
        year,
        total_income: Math.round(baseIncome),
        total_expenses: Math.round(baseExpenses),
        occupancy_rate: Math.round(60 + Math.random() * 35), // 60-95%
        total_bookings: Math.round(8 + Math.random() * 12), // 8-20 bookings
        created_at: date.toISOString()
      })
    })
  }

  return reports
}

const generateMockBookings = (properties: any[]) => {
  const bookings = []
  const currentDate = new Date()

  // Generate upcoming bookings for the next 60 days
  for (let i = 1; i <= 30; i += Math.random() * 7 + 2) {
    const checkIn = addDays(currentDate, Math.floor(i))
    const stayLength = Math.floor(Math.random() * 7) + 2 // 2-8 nights
    const checkOut = addDays(checkIn, stayLength)

    const property = properties[Math.floor(Math.random() * properties.length)]
    const guestNames = ['John Smith', 'Sarah Johnson', 'Mike Wilson', 'Emma Davis', 'David Brown', 'Lisa Chen', 'Tom Anderson', 'Maria Garcia']
    const guestName = guestNames[Math.floor(Math.random() * guestNames.length)]

    bookings.push({
      id: `booking-${Date.now()}-${Math.random()}`,
      property_id: property.id,
      guest_name: guestName,
      guest_email: `${guestName.toLowerCase().replace(' ', '.')}@example.com`,
      check_in: checkIn.toISOString().split('T')[0],
      check_out: checkOut.toISOString().split('T')[0],
      guests: Math.floor(Math.random() * 4) + 1,
      total_amount: Math.round((property.pricePerNight || 200) * stayLength),
      currency: 'USD',
      status: Math.random() > 0.2 ? 'confirmed' : 'pending',
      property: {
        id: property.id,
        name: property.name
      }
    })
  }

  return bookings.sort((a, b) => new Date(a.check_in).getTime() - new Date(b.check_in).getTime())
}
import { Property, Booking, Task, Report } from '@/types'

export default function ClientDashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [properties, setProperties] = useState<Property[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
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

      if (!profile?.id) {
        console.log('⚠️ No user profile available, using empty data')
        setProperties([])
        setBookings([])
        setReports([])
        setTasks([])
        return
      }

      // Load user's actual data from Firebase/Firestore
      try {
        // Fetch properties
        const userProperties = await PropertyService.getPropertiesByUserId(profile.id)
        setProperties(userProperties)
        console.log(`✅ Loaded ${userProperties.length} properties`)

        // For now, use mock data for bookings and reports until those services are implemented
        // TODO: Replace with actual BookingService and ReportService calls

        // Generate mock data for demonstration if user has properties
        if (userProperties.length > 0) {
          const mockReports = generateMockReports(userProperties)
          const mockBookings = generateMockBookings(userProperties)
          setReports(mockReports)
          setBookings(mockBookings)
        } else {
          setReports([])
          setBookings([])
        }
        setTasks([])

        console.log('✅ Dashboard data loaded successfully')
      } catch (serviceError) {
        console.error('❌ Error loading data from services:', serviceError)
        // Fallback to empty data for graceful degradation
        setProperties([])
        setBookings([])
        setReports([])
        setTasks([])
      }

    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [profile?.id])

  useEffect(() => {
    // In development mode with session bypass, always fetch data
    const isDevelopmentBypass = process.env.NODE_ENV === 'development' &&
                               process.env.NEXT_PUBLIC_DEV_SESSION_BYPASS === 'true'

    if (user?.id || isDevelopmentBypass) {
      fetchDashboardData()
    }
  }, [user?.id, fetchDashboardData])

  // Calculate dashboard metrics
  const calculateMetrics = () => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    // Current month metrics
    const currentMonthReports = reports.filter(r =>
      r.month === currentMonth + 1 && r.year === currentYear
    )

    const totalIncome = currentMonthReports.reduce((sum, r) => sum + r.total_income, 0)
    const totalExpenses = currentMonthReports.reduce((sum, r) => sum + r.total_expenses, 0)
    const netIncome = totalIncome - totalExpenses
    const avgOccupancy = currentMonthReports.length > 0
      ? currentMonthReports.reduce((sum, r) => sum + r.occupancy_rate, 0) / currentMonthReports.length
      : 0

    // Upcoming bookings (next 30 days)
    const upcomingBookings = bookings.filter(booking => {
      const checkIn = new Date(booking.check_in)
      return isAfter(checkIn, now) && isBefore(checkIn, addDays(now, 30))
    })

    // Active bookings (currently staying)
    const activeBookings = bookings.filter(booking => {
      const checkIn = new Date(booking.check_in)
      const checkOut = new Date(booking.check_out)
      return isBefore(checkIn, now) && isAfter(checkOut, now)
    })

    // Pending maintenance tasks
    const pendingTasks = tasks.filter(task =>
      task.status === 'pending' && task.task_type === 'maintenance'
    )

    return {
      totalIncome,
      totalExpenses,
      netIncome,
      avgOccupancy,
      upcomingBookings,
      activeBookings,
      pendingTasks,
      totalProperties: properties.length,
      totalBookings: bookings.length
    }
  }

  // Calculate summary metrics for cards
  const calculateSummaryMetrics = () => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

    // Current month data
    const currentMonthReports = reports.filter(r =>
      r.month === currentMonth + 1 && r.year === currentYear
    )
    const currentIncome = currentMonthReports.reduce((sum, r) => sum + r.total_income, 0)
    const currentExpenses = currentMonthReports.reduce((sum, r) => sum + r.total_expenses, 0)
    const currentProfit = currentIncome - currentExpenses
    const currentOccupancy = currentMonthReports.length > 0
      ? currentMonthReports.reduce((sum, r) => sum + r.occupancy_rate, 0) / currentMonthReports.length
      : 0

    // Last month data for comparison
    const lastMonthReports = reports.filter(r =>
      r.month === lastMonth + 1 && r.year === lastMonthYear
    )
    const lastIncome = lastMonthReports.reduce((sum, r) => sum + r.total_income, 0)
    const lastExpenses = lastMonthReports.reduce((sum, r) => sum + r.total_expenses, 0)
    const lastProfit = lastIncome - lastExpenses
    const lastOccupancy = lastMonthReports.length > 0
      ? lastMonthReports.reduce((sum, r) => sum + r.occupancy_rate, 0) / lastMonthReports.length
      : 0

    // Calculate percentage changes
    const incomeChange = lastIncome > 0 ? ((currentIncome - lastIncome) / lastIncome) * 100 : 0
    const expensesChange = lastExpenses > 0 ? ((currentExpenses - lastExpenses) / lastExpenses) * 100 : 0
    const profitChange = lastProfit !== 0 ? ((currentProfit - lastProfit) / Math.abs(lastProfit)) * 100 : 0
    const occupancyChange = lastOccupancy > 0 ? ((currentOccupancy - lastOccupancy) / lastOccupancy) * 100 : 0

    // Upcoming bookings count
    const upcomingBookingsCount = bookings.filter(booking => {
      const checkIn = new Date(booking.check_in)
      return isAfter(checkIn, now) && isBefore(checkIn, addDays(now, 30))
    }).length

    // Last month's upcoming bookings for comparison
    const lastMonthDate = subMonths(now, 1)
    const lastMonthUpcomingCount = bookings.filter(booking => {
      const checkIn = new Date(booking.check_in)
      return isAfter(checkIn, lastMonthDate) && isBefore(checkIn, addDays(lastMonthDate, 30))
    }).length

    const bookingsChange = lastMonthUpcomingCount > 0
      ? ((upcomingBookingsCount - lastMonthUpcomingCount) / lastMonthUpcomingCount) * 100
      : 0

    return {
      totalIncomeThisMonth: currentIncome,
      totalExpensesThisMonth: currentExpenses,
      netProfitThisMonth: currentProfit,
      occupancyRateThisMonth: currentOccupancy,
      upcomingBookingsCount,
      incomeChange,
      expensesChange,
      profitChange,
      occupancyChange,
      bookingsChange,
      currency: 'USD'
    }
  }

  // Prepare chart data
  const prepareChartData = () => {
    const last6Months = []
    const now = new Date()

    for (let i = 5; i >= 0; i--) {
      const date = subMonths(now, i)
      const month = date.getMonth() + 1
      const year = date.getFullYear()

      const monthReports = reports.filter(r => r.month === month && r.year === year)
      const income = monthReports.reduce((sum, r) => sum + r.total_income, 0)
      const expenses = monthReports.reduce((sum, r) => sum + r.total_expenses, 0)

      last6Months.push({
        month: format(date, 'MMM yyyy'),
        income,
        expenses,
        net: income - expenses
      })
    }

    return last6Months
  }

  // Prepare upcoming bookings data
  const prepareUpcomingBookings = () => {
    const now = new Date()
    const upcomingBookings = bookings
      .filter(booking => {
        const checkIn = new Date(booking.check_in)
        return isAfter(checkIn, now) && booking.status !== 'cancelled'
      })
      .sort((a, b) => new Date(a.check_in).getTime() - new Date(b.check_in).getTime())
      .slice(0, 10)
      .map(booking => {
        const property = properties.find(p => p.id === booking.property_id)
        return {
          ...booking,
          property_name: property?.name || 'Unknown Property'
        }
      })

    return upcomingBookings
  }

  // Prepare active maintenance tasks
  const prepareMaintenanceTasks = () => {
    const activeTasks = tasks
      .filter(task =>
        task.status === 'pending' || task.status === 'in_progress'
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 8)
      .map(task => {
        const property = properties.find(p => p.id === task.property_id)
        return {
          ...task,
          property_name: property?.name || 'Unknown Property'
        }
      })

    return activeTasks
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
                          {upcomingBookings.map((booking, index) => (
                            <tr key={booking.id} className={`border-b border-neutral-800 ${index === upcomingBookings.length - 1 ? 'border-b-0' : ''}`}>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-primary-400" />
                                  <span className="text-white font-medium">{booking.guest_name}</span>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <Home className="w-4 h-4 text-neutral-400" />
                                  <span className="text-neutral-300">{booking.property_name}</span>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className="text-neutral-300">
                                  {format(new Date(booking.check_in), 'MMM dd, yyyy')}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className="text-neutral-300">
                                  {format(new Date(booking.check_out), 'MMM dd, yyyy')}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className="text-neutral-400 text-sm">
                                  {booking.source || 'Direct'}
                                </span>
                              </td>
                              <td className="p-4">
                                <Badge
                                  variant={booking.status === 'confirmed' ? 'default' : 'secondary'}
                                  className={`${
                                    booking.status === 'confirmed'
                                      ? 'bg-green-900 text-green-300 border-green-800'
                                      : 'bg-yellow-900 text-yellow-300 border-yellow-800'
                                  }`}
                                >
                                  {booking.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {upcomingBookings.map((booking) => (
                  <Card key={booking.id} className="bg-neutral-900 border-neutral-800">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <User className="w-4 h-4 text-primary-400" />
                            <span className="text-white font-medium">{booking.guest_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Home className="w-4 h-4 text-neutral-400" />
                            <span className="text-neutral-300 text-sm">{booking.property_name}</span>
                          </div>
                        </div>
                        <Badge
                          variant={booking.status === 'confirmed' ? 'default' : 'secondary'}
                          className={`${
                            booking.status === 'confirmed'
                              ? 'bg-green-900 text-green-300 border-green-800'
                              : 'bg-yellow-900 text-yellow-300 border-yellow-800'
                          }`}
                        >
                          {booking.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-neutral-500">Check-in:</span>
                          <div className="text-neutral-300">
                            {format(new Date(booking.check_in), 'MMM dd, yyyy')}
                          </div>
                        </div>
                        <div>
                          <span className="text-neutral-500">Check-out:</span>
                          <div className="text-neutral-300">
                            {format(new Date(booking.check_out), 'MMM dd, yyyy')}
                          </div>
                        </div>
                      </div>
                      {booking.source && (
                        <div className="mt-2 text-xs text-neutral-400">
                          Source: {booking.source}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
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

          {maintenanceTasks.length === 0 ? (
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {maintenanceTasks.map((task) => (
                <Card key={task.id} className="bg-neutral-900 border-neutral-800 hover:border-neutral-700 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-white font-medium mb-1 line-clamp-2">
                          {task.title || task.description}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-neutral-400 mb-2">
                          <Home className="w-4 h-4 text-neutral-400" />
                          <span>{task.property_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-neutral-500">
                          <Clock className="w-4 h-4 text-neutral-500" />
                          <span>Reported {format(new Date(task.created_at), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                      <div className="ml-3">
                        {task.status === 'pending' ? (
                          <div className="flex items-center gap-1">
                            <div className="w-6 h-6 bg-gradient-to-r from-red-500/10 to-red-600/10 rounded flex items-center justify-center">
                              <AlertCircle className="w-3 h-3 text-red-400" />
                            </div>
                            <Badge variant="secondary" className="bg-red-900 text-red-300 border-red-800">
                              Pending
                            </Badge>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <div className="w-6 h-6 bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 rounded flex items-center justify-center">
                              <Clock className="w-3 h-3 text-yellow-400" />
                            </div>
                            <Badge variant="secondary" className="bg-yellow-900 text-yellow-300 border-yellow-800">
                              In Progress
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    {task.priority && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-500">
                          Priority: {task.priority}
                        </span>
                        {task.assigned_to && (
                          <span className="text-xs text-neutral-500">
                            Assigned to staff
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>


      </div>


    </DashboardLayout>
  )
}