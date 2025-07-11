'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
// TODO: Replace with new database service when implemented
// import DatabaseService, { DatabaseResponse } from '@/lib/newDatabaseService'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { IncomeExpenseChart } from '@/components/dashboard/charts/IncomeExpenseChart'
import { FullScreenChartModal, useFullScreenChart } from '@/components/dashboard/FullScreenChartModal'
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
import { Property, Booking, Task, Report } from '@/types'

export default function ClientDashboard() {
  const { user, loading: authLoading } = useAuth()
  // Use real user data or fallback for development
  const profile = user || { id: 'dev-user', full_name: 'John Smith', role: 'client' }

  const [properties, setProperties] = useState<Property[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMetric, setSelectedMetric] = useState('revenue')

  const [showSettings, setShowSettings] = useState(false)

  // Full-screen chart functionality
  const { isModalOpen, isMobile, openChart, closeChart } = useFullScreenChart()

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      console.log('🔄 Loading dashboard data (development mode with mock data)')

      // TODO: Replace with real data loading when new database service is implemented
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Mock data for development
      const mockProperties: Property[] = [
        {
          id: 'prop-1',
          name: 'Sunset Villa Bali',
          description: 'Beautiful villa with ocean view',
          address: 'Jl. Sunset Road 123',
          city: 'Seminyak',
          country: 'Indonesia',
          bedrooms: 3,
          bathrooms: 2,
          max_guests: 6,
          price_per_night: 150,
          currency: 'USD',
          amenities: ['Pool', 'WiFi', 'Kitchen'],
          images: [],
          owner_id: user?.id || 'dev-user',
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        },
        {
          id: 'prop-2',
          name: 'Ocean View Retreat',
          description: 'Peaceful retreat near the beach',
          address: 'Jl. Beach Road 456',
          city: 'Canggu',
          country: 'Indonesia',
          bedrooms: 2,
          bathrooms: 1,
          max_guests: 4,
          price_per_night: 120,
          currency: 'USD',
          amenities: ['Beach Access', 'WiFi'],
          images: [],
          owner_id: user?.id || 'dev-user',
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        }
      ]

      const mockBookings: Booking[] = [
        {
          id: 'booking-1',
          property_id: 'prop-1',
          guest_name: 'Sarah Johnson',
          guest_email: 'sarah@example.com',
          check_in: '2024-07-15',
          check_out: '2024-07-22',
          guests: 4,
          status: 'confirmed',
          total_amount: 1050,
          currency: 'USD',
          created_at: '2024-07-01',
          updated_at: '2024-07-01'
        },
        {
          id: 'booking-2',
          property_id: 'prop-2',
          guest_name: 'Mike Chen',
          guest_email: 'mike@example.com',
          check_in: '2024-07-20',
          check_out: '2024-07-25',
          guests: 2,
          status: 'pending',
          total_amount: 600,
          currency: 'USD',
          created_at: '2024-07-02',
          updated_at: '2024-07-02'
        }
      ]

      const mockReports: Report[] = [
        {
          id: 'report-1',
          property_id: 'prop-1',
          month: 6,
          year: 2024,
          total_income: 5000,
          total_expenses: 1500,
          net_income: 3500,
          occupancy_rate: 85,
          total_bookings: 12,
          currency: 'USD',
          created_at: '2024-07-01',
          updated_at: '2024-07-01'
        }
      ]

      const mockTasks: Task[] = [
        {
          id: 'task-1',
          property_id: 'prop-1',
          title: 'Pool Cleaning',
          description: 'Weekly pool maintenance and chemical balancing',
          task_type: 'maintenance',
          status: 'pending',
          priority: 'normal',
          assigned_to: 'staff-1',
          due_date: '2024-07-10',
          cost: 50,
          currency: 'USD',
          created_at: '2024-07-05',
          updated_at: '2024-07-05'
        },
        {
          id: 'task-2',
          property_id: 'prop-2',
          title: 'Garden Maintenance',
          description: 'Trim hedges and water plants',
          task_type: 'maintenance',
          status: 'completed',
          priority: 'low',
          assigned_to: 'staff-2',
          due_date: '2024-07-08',
          cost: 30,
          currency: 'USD',
          created_at: '2024-07-03',
          updated_at: '2024-07-08'
        }
      ]

      setProperties(mockProperties)
      setBookings(mockBookings)
      setReports(mockReports)
      setTasks(mockTasks)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [user])

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
          onClick={() => setShowSettings(!showSettings)}
          className="text-neutral-400 hover:text-white"
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      }
    >
      <div className="max-w-7xl mx-auto">


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

        {/* Main Chart Area - Lightspeed Style - Full Screen Width */}
        <div className="mb-8 -mx-6 md:-mx-12 lg:-mx-[calc(30vw-30%+2rem)] relative w-auto">
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
              <div
                className={`relative h-96 md:h-[32rem] lg:h-[38rem] w-full ${isMobile ? 'cursor-pointer hover:bg-neutral-900/50 transition-colors rounded-lg' : ''}`}
                onClick={isMobile ? openChart : undefined}
              >
                <IncomeExpenseChart data={chartData} />
                {/* Mobile tap indicator */}
                {isMobile && (
                  <div className="absolute top-4 right-4 bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border border-blue-500/30">
                    📱 Tap to expand
                  </div>
                )}
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

        {/* Upcoming Bookings Section */}
        <div className="mb-8">
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

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-8">
            <Card className="bg-neutral-950 border-neutral-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  Dashboard Settings
                </CardTitle>
                <CardDescription className="text-neutral-400">
                  Configure your dashboard targets and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Monthly Revenue Target
                  </label>
                  <input
                    type="number"
                    placeholder="50000"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Monthly Booking Target
                  </label>
                  <input
                    type="number"
                    placeholder="100"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Occupancy Target (%)
                  </label>
                  <input
                    type="number"
                    placeholder="85"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <Button>
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Full-Screen Chart Modal for Mobile */}
      <FullScreenChartModal
        isOpen={isModalOpen}
        onClose={closeChart}
        title="Income & Expense Chart"
        subtitle="Detailed view of your property performance"
      >
        <IncomeExpenseChart data={chartData} />
      </FullScreenChartModal>
    </DashboardLayout>
  )
}