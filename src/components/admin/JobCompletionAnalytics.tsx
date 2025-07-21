'use client'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { db } from '@/lib/firebase'
import { type JobCompletionRecord } from '@/services/FinancialReportingService'
import { collection, getDocs, orderBy, query, Timestamp, where } from 'firebase/firestore'
import {
    Award,
    BarChart3,
    CheckCircle,
    Clock,
    DollarSign,
    RefreshCw,
    Star,
    Target
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface JobAnalytics {
  totalCompletions: number
  averageDuration: number
  averageEfficiency: number
  totalRevenue: number
  averageRating: number
  topPerformers: Array<{
    staffId: string
    staffName: string
    completions: number
    revenue: number
    efficiency: number
  }>
  jobTypeBreakdown: Array<{
    jobType: string
    count: number
    revenue: number
    averageDuration: number
    profitMargin: number
  }>
}

export default function JobCompletionAnalytics() {
  const [analytics, setAnalytics] = useState<JobAnalytics>({
    totalCompletions: 0,
    averageDuration: 0,
    averageEfficiency: 0,
    totalRevenue: 0,
    averageRating: 0,
    topPerformers: [],
    jobTypeBreakdown: []
  })

  const [isLoading, setIsLoading] = useState(false)
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('week')

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const loadAnalytics = async () => {
    setIsLoading(true)
    try {
      if (!db) throw new Error("Firebase not initialized")

      const { startDate, endDate } = getDateRange()

      // Query job completions for the selected time range
      const completionsQuery = query(
        collection(db, 'jobCompletions'),
        where('completedAt', '>=', Timestamp.fromDate(startDate)),
        where('completedAt', '<=', Timestamp.fromDate(endDate)),
        orderBy('completedAt', 'desc')
      )

      const completionsSnapshot = await getDocs(completionsQuery)
      const completions: JobCompletionRecord[] = []

      completionsSnapshot.forEach((doc) => {
        const data = doc.data()
        completions.push({
          id: doc.id,
          ...data,
          completedAt: data.completedAt,
          scheduledDate: data.scheduledDate,
          createdAt: data.createdAt
        } as JobCompletionRecord)
      })

      // Calculate analytics
      const calculatedAnalytics = calculateAnalytics(completions)
      setAnalytics(calculatedAnalytics)
    } catch (error) {
      console.error('Error loading job completion analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getDateRange = () => {
    const end = new Date()
    const start = new Date()

    switch (timeRange) {
      case 'today':
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      case 'week':
        start.setDate(start.getDate() - 7)
        break
      case 'month':
        start.setDate(start.getDate() - 30)
        break
    }

    return { startDate: start, endDate: end }
  }

  const calculateAnalytics = (completions: JobCompletionRecord[]): JobAnalytics => {
    if (completions.length === 0) {
      return {
        totalCompletions: 0,
        averageDuration: 0,
        averageEfficiency: 0,
        totalRevenue: 0,
        averageRating: 0,
        topPerformers: [],
        jobTypeBreakdown: []
      }
    }

    // Basic metrics
    const totalCompletions = completions.length
    const totalRevenue = completions.reduce((sum, job) => sum + job.jobRevenue, 0)
    const averageDuration = completions.reduce((sum, job) => sum + job.actualDuration, 0) / totalCompletions

    // Calculate efficiency (actual vs estimated duration)
    const efficiencies = completions.map(job =>
      job.estimatedDuration > 0 ? (job.estimatedDuration / job.actualDuration) * 100 : 100
    )
    const averageEfficiency = efficiencies.reduce((sum, eff) => sum + eff, 0) / efficiencies.length

    // Calculate average rating
    const ratingsJobs = completions.filter(job => job.qualityRating && job.qualityRating > 0)
    const averageRating = ratingsJobs.length > 0
      ? ratingsJobs.reduce((sum, job) => sum + (job.qualityRating || 0), 0) / ratingsJobs.length
      : 0

    // Staff performance analysis
    const staffPerformance = new Map<string, {
      staffId: string
      staffName: string
      completions: number
      revenue: number
      totalDuration: number
      estimatedDuration: number
    }>()

    completions.forEach(job => {
      const existing = staffPerformance.get(job.staffId) || {
        staffId: job.staffId,
        staffName: job.staffName || 'Unknown',
        completions: 0,
        revenue: 0,
        totalDuration: 0,
        estimatedDuration: 0
      }

      existing.completions++
      existing.revenue += job.jobRevenue
      existing.totalDuration += job.actualDuration
      existing.estimatedDuration += job.estimatedDuration

      staffPerformance.set(job.staffId, existing)
    })

    const topPerformers = Array.from(staffPerformance.values())
      .map(staff => ({
        ...staff,
        efficiency: staff.estimatedDuration > 0
          ? (staff.estimatedDuration / staff.totalDuration) * 100
          : 100
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Job type breakdown
    const jobTypeStats = new Map<string, {
      count: number
      revenue: number
      totalDuration: number
      totalCosts: number
    }>()

    completions.forEach(job => {
      const existing = jobTypeStats.get(job.jobType) || {
        count: 0,
        revenue: 0,
        totalDuration: 0,
        totalCosts: 0
      }

      existing.count++
      existing.revenue += job.jobRevenue
      existing.totalDuration += job.actualDuration
      existing.totalCosts += job.totalCosts

      jobTypeStats.set(job.jobType, existing)
    })

    const jobTypeBreakdown = Array.from(jobTypeStats.entries()).map(([jobType, stats]) => ({
      jobType,
      count: stats.count,
      revenue: stats.revenue,
      averageDuration: stats.totalDuration / stats.count,
      profitMargin: stats.revenue > 0 ? ((stats.revenue - stats.totalCosts) / stats.revenue) * 100 : 0
    }))

    return {
      totalCompletions,
      averageDuration,
      averageEfficiency,
      totalRevenue,
      averageRating,
      topPerformers,
      jobTypeBreakdown
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 100) return 'text-green-400'
    if (efficiency >= 80) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getEfficiencyBadge = (efficiency: number) => {
    if (efficiency >= 100) return 'default'
    if (efficiency >= 80) return 'secondary'
    return 'destructive'
  }

  return (
    <Card className="bg-neutral-900 border-neutral-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-400" />
            Job Completion Analytics
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {(['today', 'week', 'month'] as const).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                  className={timeRange === range ? 'bg-blue-600 hover:bg-blue-700' : 'border-neutral-700 hover:bg-neutral-800'}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadAnalytics}
              disabled={isLoading}
              className="border-neutral-700 hover:bg-neutral-800"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <p className="text-neutral-400 text-sm">
          Comprehensive analytics for job completion performance and efficiency
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-neutral-400 text-sm">Completed</span>
            </div>
            <div className="text-2xl font-bold text-green-400">
              {analytics.totalCompletions}
            </div>
            <div className="text-xs text-neutral-500">jobs</div>
          </div>

          <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-400" />
              <span className="text-neutral-400 text-sm">Avg Duration</span>
            </div>
            <div className="text-2xl font-bold text-blue-400">
              {formatDuration(analytics.averageDuration)}
            </div>
            <div className="text-xs text-neutral-500">per job</div>
          </div>

          <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-purple-400" />
              <span className="text-neutral-400 text-sm">Efficiency</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${getEfficiencyColor(analytics.averageEfficiency)}`}>
                {analytics.averageEfficiency.toFixed(0)}%
              </span>
              <Badge variant={getEfficiencyBadge(analytics.averageEfficiency)} className="text-xs">
                {analytics.averageEfficiency >= 100 ? 'Excellent' : analytics.averageEfficiency >= 80 ? 'Good' : 'Poor'}
              </Badge>
            </div>
          </div>

          <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-400" />
              <span className="text-neutral-400 text-sm">Revenue</span>
            </div>
            <div className="text-2xl font-bold text-green-400">
              {formatCurrency(analytics.totalRevenue)}
            </div>
            <div className="text-xs text-neutral-500">total</div>
          </div>

          <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 text-yellow-400" />
              <span className="text-neutral-400 text-sm">Avg Rating</span>
            </div>
            <div className="text-2xl font-bold text-yellow-400">
              {analytics.averageRating.toFixed(1)}
            </div>
            <div className="text-xs text-neutral-500">out of 5</div>
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
          <h3 className="text-white font-medium mb-3 flex items-center gap-2">
            <Award className="h-4 w-4 text-yellow-400" />
            Top Performing Staff
          </h3>

          {analytics.topPerformers.length === 0 ? (
            <div className="text-center py-4 text-neutral-400">
              No performance data available for the selected period
            </div>
          ) : (
            <div className="space-y-3">
              {analytics.topPerformers.map((performer, index) => (
                <div key={performer.staffId} className="flex items-center justify-between p-3 bg-neutral-900 rounded border border-neutral-700">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-white font-medium">{performer.staffName}</div>
                      <div className="text-xs text-neutral-400">{performer.completions} jobs completed</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-bold">{formatCurrency(performer.revenue)}</div>
                    <div className={`text-xs ${getEfficiencyColor(performer.efficiency)}`}>
                      {performer.efficiency.toFixed(0)}% efficiency
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Job Type Breakdown */}
        <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
          <h3 className="text-white font-medium mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-purple-400" />
            Job Type Performance
          </h3>

          {analytics.jobTypeBreakdown.length === 0 ? (
            <div className="text-center py-4 text-neutral-400">
              No job type data available for the selected period
            </div>
          ) : (
            <div className="space-y-3">
              {analytics.jobTypeBreakdown.map((jobType) => (
                <div key={jobType.jobType} className="p-3 bg-neutral-900 rounded border border-neutral-700">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-medium capitalize">
                      {jobType.jobType.replace(/_/g, ' ')}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {jobType.count} jobs
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-neutral-400">Revenue:</span>
                      <div className="text-green-400 font-medium">{formatCurrency(jobType.revenue)}</div>
                    </div>
                    <div>
                      <span className="text-neutral-400">Avg Duration:</span>
                      <div className="text-blue-400 font-medium">{formatDuration(jobType.averageDuration)}</div>
                    </div>
                    <div>
                      <span className="text-neutral-400">Profit Margin:</span>
                      <div className={`font-medium ${getProfitMarginColor(jobType.profitMargin)}`}>
                        {jobType.profitMargin.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function getProfitMarginColor(margin: number): string {
  if (margin >= 30) return 'text-green-400'
  if (margin >= 15) return 'text-yellow-400'
  return 'text-red-400'
}
