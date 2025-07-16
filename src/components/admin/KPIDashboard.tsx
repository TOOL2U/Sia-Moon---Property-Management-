'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  Building,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Zap,
  Award,
  AlertTriangle
} from 'lucide-react'
import KPIDashboardService, {
  TimeFilter,
  KPIAnalytics,
  StaffMetric,
  PropertyMetric
} from '@/services/KPIDashboardService'
import SimpleChart, { SimplePieChart } from '@/components/ui/SimpleChart'

export default function KPIDashboard() {
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<KPIAnalytics | null>(null)
  const [timeFilter, setTimeFilter] = useState<TimeFilter>({ type: 'week' })
  const [filters, setFilters] = useState<{
    staffId?: string
    propertyId?: string
    jobType?: string
  }>({})
  const [refreshing, setRefreshing] = useState(false)

  // Load analytics data
  useEffect(() => {
    loadAnalytics()
  }, [timeFilter, filters])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      console.log('📊 Loading KPI analytics...')

      const data = await KPIDashboardService.getKPIAnalytics(timeFilter, filters)
      setAnalytics(data)

      console.log('✅ KPI analytics loaded successfully')

    } catch (error) {
      console.error('❌ Error loading KPI analytics:', error)
      toast.error('Failed to load KPI analytics')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadAnalytics()
    setRefreshing(false)
    toast.success('KPI data refreshed')
  }

  const handleTimeFilterChange = (type: TimeFilter['type']) => {
    setTimeFilter({ type })
  }

  const getMetricIcon = (metric: string) => {
    const icons = {
      totalBookings: Building,
      jobsCompleted: CheckCircle,
      pendingJobs: Clock,
      cancelledJobs: XCircle,
      avgCompletionTime: Activity,
      revenueGenerated: DollarSign,
      staffEfficiencyScore: Users
    }
    return icons[metric as keyof typeof icons] || Target
  }

  const getMetricColor = (metric: string) => {
    const colors = {
      totalBookings: 'text-blue-400',
      jobsCompleted: 'text-green-400',
      pendingJobs: 'text-yellow-400',
      cancelledJobs: 'text-red-400',
      avgCompletionTime: 'text-purple-400',
      revenueGenerated: 'text-emerald-400',
      staffEfficiencyScore: 'text-indigo-400'
    }
    return colors[metric as keyof typeof colors] || 'text-gray-400'
  }

  const formatMetricValue = (key: string, value: number) => {
    switch (key) {
      case 'revenueGenerated':
        return KPIDashboardService.formatCurrency(value)
      case 'avgCompletionTime':
        return KPIDashboardService.formatDuration(value)
      case 'staffEfficiencyScore':
        return `${value} jobs/day`
      case 'completionRate':
      case 'bookingTrend':
        return `${value}%`
      default:
        return value.toLocaleString()
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      excellent: 'bg-green-500/20 text-green-400 border-green-500/30',
      good: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      critical: 'bg-red-500/20 text-red-400 border-red-500/30',
      high: 'bg-green-500/20 text-green-400 border-green-500/30',
      medium: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      low: 'bg-red-500/20 text-red-400 border-red-500/30'
    }
    return variants[status as keyof typeof variants] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <span className="ml-3 text-gray-400">Loading KPI dashboard...</span>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
        <p className="text-gray-400">Failed to load KPI data</p>
        <Button onClick={loadAnalytics} className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            KPI Dashboard
          </h2>
          <p className="text-gray-400 mt-1">
            Performance insights and operational metrics
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Filters */}
          <div className="flex items-center gap-2">
            {(['today', 'week', 'month'] as const).map((type) => (
              <Button
                key={type}
                onClick={() => handleTimeFilterChange(type)}
                variant={timeFilter.type === type ? 'default' : 'outline'}
                size="sm"
                className={timeFilter.type === type 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600' 
                  : 'border-gray-600 text-gray-300 hover:bg-gray-800'
                }
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>

          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(analytics.metrics).map(([key, value]) => {
          if (key === 'bookingTrend' || key === 'completionRate') return null // Skip these for main cards
          
          const Icon = getMetricIcon(key)
          const color = getMetricColor(key)
          
          return (
            <Card key={key} className="bg-gray-900/50 border-gray-700 hover:border-gray-600 transition-colors">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {key === 'jobsCompleted' && analytics.metrics.bookingTrend > 0 && (
                    <div className="flex items-center text-green-400 text-sm">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      {analytics.metrics.bookingTrend}%
                    </div>
                  )}
                </div>
                
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-white">
                    {formatMetricValue(key, value as number)}
                  </p>
                  <p className="text-sm text-gray-400 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* KPI Flags */}
      {(analytics.flags.slowPerformers.length > 0 || 
        analytics.flags.overdueJobs.length > 0 || 
        analytics.flags.highPerformers.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* High Performers */}
          {analytics.flags.highPerformers.length > 0 && (
            <Card className="bg-green-900/20 border-green-500/30">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-5 h-5 text-green-400" />
                  <h3 className="font-semibold text-green-300">High Performers</h3>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    {analytics.flags.highPerformers.length}
                  </Badge>
                </div>
                <div className="space-y-1">
                  {analytics.flags.highPerformers.slice(0, 3).map((name, index) => (
                    <p key={index} className="text-sm text-green-200">✅ {name}</p>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Slow Performers */}
          {analytics.flags.slowPerformers.length > 0 && (
            <Card className="bg-red-900/20 border-red-500/30">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <h3 className="font-semibold text-red-300">Needs Attention</h3>
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                    {analytics.flags.slowPerformers.length}
                  </Badge>
                </div>
                <div className="space-y-1">
                  {analytics.flags.slowPerformers.slice(0, 3).map((name, index) => (
                    <p key={index} className="text-sm text-red-200">🔴 {name}</p>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Overdue Jobs */}
          {analytics.flags.overdueJobs.length > 0 && (
            <Card className="bg-yellow-900/20 border-yellow-500/30">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  <h3 className="font-semibold text-yellow-300">Overdue Jobs</h3>
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                    {analytics.flags.overdueJobs.length}
                  </Badge>
                </div>
                <div className="space-y-1">
                  {analytics.flags.overdueJobs.slice(0, 3).map((job, index) => (
                    <p key={index} className="text-sm text-yellow-200">🟡 {job}</p>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Staff Metrics */}
      <Card className="bg-gray-900/50 border-gray-700">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Staff Performance
            </h3>
            <Badge variant="outline" className="border-gray-600 text-gray-400">
              {analytics.staffMetrics.length} staff members
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Staff</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Assigned</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Completed</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Avg Time</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Acceptance</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Efficiency</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {analytics.staffMetrics.slice(0, 10).map((staff) => (
                  <tr key={staff.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {staff.name.charAt(0)}
                        </div>
                        <span className="text-white font-medium">{staff.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-300">{staff.jobsAssigned}</td>
                    <td className="py-3 px-4 text-gray-300">{staff.jobsCompleted}</td>
                    <td className="py-3 px-4 text-gray-300">
                      {KPIDashboardService.formatDuration(staff.avgCompletionTime)}
                    </td>
                    <td className="py-3 px-4 text-gray-300">{staff.acceptanceRate}%</td>
                    <td className="py-3 px-4 text-gray-300">{staff.efficiency} jobs/day</td>
                    <td className="py-3 px-4">
                      <Badge className={getStatusBadge(staff.status)}>
                        {staff.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Property Metrics */}
      <Card className="bg-gray-900/50 border-gray-700">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-green-400" />
              Property Performance
            </h3>
            <Badge variant="outline" className="border-gray-600 text-gray-400">
              {analytics.propertyMetrics.length} properties
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.propertyMetrics.slice(0, 6).map((property) => (
              <Card key={property.id} className="bg-gray-800/50 border-gray-700">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-white truncate">{property.name}</h4>
                    <Badge className={getStatusBadge(property.status)}>
                      {property.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Bookings:</span>
                      <span className="text-white">{property.totalBookings}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Revenue:</span>
                      <span className="text-white">
                        {KPIDashboardService.formatCurrency(property.revenue)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Avg Job Time:</span>
                      <span className="text-white">
                        {KPIDashboardService.formatDuration(property.avgJobTime)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Completion:</span>
                      <span className="text-white">{property.completionRate}%</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Jobs Per Day Chart */}
        <Card className="bg-gray-900/50 border-gray-700">
          <div className="p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" />
              Jobs Per Day
            </h3>
            <SimpleChart
              data={analytics.charts.jobsPerDay}
              type="line"
              height={200}
              color="#8b5cf6"
              className="mt-4"
            />
          </div>
        </Card>

        {/* Revenue Per Property Chart */}
        <Card className="bg-gray-900/50 border-gray-700">
          <div className="p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              Revenue by Property
            </h3>
            <SimpleChart
              data={analytics.charts.revenuePerProperty}
              type="bar"
              height={200}
              color="#10b981"
              className="mt-4"
            />
          </div>
        </Card>

        {/* Completion Time Distribution */}
        <Card className="bg-gray-900/50 border-gray-700">
          <div className="p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              Completion Time Distribution
            </h3>
            <SimplePieChart
              data={analytics.charts.completionTimeDistribution.map((item, index) => ({
                label: item.label || item.date,
                value: item.value,
                color: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][index % 5]
              }))}
              size={200}
              className="mt-4 mx-auto"
            />
          </div>
        </Card>
      </div>
    </div>
  )
}
