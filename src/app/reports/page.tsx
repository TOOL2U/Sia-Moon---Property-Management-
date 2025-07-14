'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Building2, 
  Calendar, 
  Wrench, 
  DollarSign, 
  TrendingUp,
  Search,
  Filter,
  Download,
  FileText,
  ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { MetricCard } from '@/components/reports/MetricCard'
import { ReportChart } from '@/components/reports/ReportChart'
import { ReportsTable } from '@/components/reports/ReportsTable'
import { DateRangePicker } from '@/components/reports/DateRangePicker'
import { ExportButtons } from '@/components/reports/ExportButtons'

import { ReportEntry, ReportMetrics, ChartDataPoint, ReportFilters, DateRange } from '@/types'
import toast from 'react-hot-toast'

export default function ReportsPage() {
  // Authentication and loading states
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)

  // Data states
  const [reportEntries, setReportEntries] = useState<ReportEntry[]>([])
  const [metrics, setMetrics] = useState<ReportMetrics | null>(null)
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])

  // Filter states
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: {
      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Start of current month
      to: new Date() // Today
    },
    propertyId: undefined,
    reportType: 'all',
    status: 'all',
    searchQuery: ''
  })

  // UI states
  const [showFilters, setShowFilters] = useState(false)

  /**
   * Load report data based on current filters
   * In production, this would fetch from Firebase/Supabase
   */
  const loadReportData = async () => {
    try {
      setLoading(true)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Use empty data for clean new accounts
      setReportEntries([])
      setMetrics({
        totalProperties: 0,
        activeBookings: 0,
        completedMaintenance: 0,
        monthlyRevenue: 0,
        occupancyRate: 0
      })
      setChartData([])

      console.log('✅ Report data loaded (empty for clean accounts)')
      
    } catch (error) {
      console.error('❌ Error loading report data:', error)
      toast.error('Failed to load report data')
    } finally {
      setLoading(false)
    }
  }

  // Load data on mount and filter changes
  useEffect(() => {
    if (!authLoading && user) {
      loadReportData()
    }
  }, [authLoading, user, filters])

  /**
   * Filter report entries based on search query and filters
   */
  const filteredEntries = useMemo(() => {
    return reportEntries.filter(entry => {
      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        const matchesSearch = 
          entry.property_name.toLowerCase().includes(query) ||
          entry.description.toLowerCase().includes(query) ||
          entry.guest_name?.toLowerCase().includes(query) ||
          entry.staff_name?.toLowerCase().includes(query)
        
        if (!matchesSearch) return false
      }

      // Report type filter
      if (filters.reportType !== 'all' && entry.type !== filters.reportType) {
        return false
      }

      // Status filter
      if (filters.status !== 'all' && entry.status !== filters.status) {
        return false
      }

      return true
    })
  }, [reportEntries, filters.searchQuery, filters.reportType, filters.status])

  /**
   * Handle filter updates
   */
  const updateFilters = (updates: Partial<ReportFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }))
  }

  /**
   * Handle date range changes
   */
  const handleDateRangeChange = (dateRange: DateRange) => {
    updateFilters({ dateRange })
  }

  /**
   * Reset all filters to default
   */
  const resetFilters = () => {
    setFilters({
      dateRange: {
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date()
      },
      propertyId: undefined,
      reportType: 'all',
      status: 'all',
      searchQuery: ''
    })
    setShowFilters(false)
  }

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-neutral-400">Loading reports...</p>
        </div>
      </div>
    )
  }

  // Show auth required state
  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-400">Please sign in to view reports</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-sm border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Reports</h1>
              <p className="text-sm text-neutral-400 mt-1">
                Analyze property performance and operational insights
              </p>
            </div>
            
            {/* Export Buttons */}
            <ExportButtons 
              data={filteredEntries}
              metrics={metrics}
              dateRange={filters.dateRange}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Search properties, guests, staff..."
                value={filters.searchQuery}
                onChange={(e) => updateFilters({ searchQuery: e.target.value })}
                className="pl-10"
              />
            </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <Card className="bg-neutral-900 border-neutral-800">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Date Range Picker */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Date Range
                    </label>
                    <DateRangePicker
                      dateRange={filters.dateRange}
                      onDateRangeChange={handleDateRangeChange}
                    />
                  </div>

                  {/* Report Type Filter */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Report Type
                    </label>
                    <Select
                      value={filters.reportType || 'all'}
                      onValueChange={(value) => updateFilters({ reportType: value as any })}
                    >
                      <option value="all">All Types</option>
                      <option value="booking">Bookings</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="payment">Payments</option>
                      <option value="expense">Expenses</option>
                    </Select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Status
                    </label>
                    <Select
                      value={filters.status || 'all'}
                      onValueChange={(value) => updateFilters({ status: value as any })}
                    >
                      <option value="all">All Status</option>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                      <option value="cancelled">Cancelled</option>
                    </Select>
                  </div>

                  {/* Reset Button */}
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={resetFilters}
                      className="w-full"
                    >
                      Reset Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Metric Cards */}
        {metrics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <MetricCard
              title="Total Properties"
              value={metrics.totalProperties}
              icon={Building2}
              trend={{ value: 12, isPositive: true }}
            />
            <MetricCard
              title="Active Bookings"
              value={metrics.activeBookings}
              icon={Calendar}
              trend={{ value: 8, isPositive: true }}
            />
            <MetricCard
              title="Completed Maintenance"
              value={metrics.completedMaintenance}
              icon={Wrench}
              trend={{ value: 15, isPositive: true }}
            />
            <MetricCard
              title="Monthly Revenue"
              value={metrics.monthlyRevenue}
              icon={DollarSign}
              format="currency"
              trend={{ value: 23, isPositive: true }}
            />
            <MetricCard
              title="Occupancy Rate"
              value={metrics.occupancyRate}
              icon={TrendingUp}
              format="percentage"
              trend={{ value: 5, isPositive: true }}
            />
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ReportChart
            title="Bookings Over Time"
            data={chartData}
            dataKey="bookings"
            color="#3b82f6"
            type="line"
          />
          <ReportChart
            title="Revenue Trends"
            data={chartData}
            dataKey="revenue"
            color="#10b981"
            type="area"
          />
          <ReportChart
            title="Maintenance Tasks"
            data={chartData}
            dataKey="maintenance"
            color="#f59e0b"
            type="bar"
          />
          <ReportChart
            title="Expenses Overview"
            data={chartData}
            dataKey="expenses"
            color="#ef4444"
            type="line"
          />
        </div>

        {/* Reports Table */}
        <ReportsTable
          data={filteredEntries}
          loading={loading}
          onRefresh={loadReportData}
        />
      </div>
    </div>
  )
}
