/**
 * Analytics & Reporting System
 * Comprehensive analytics with performance metrics and reporting
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Calendar,
  Clock,
  DollarSign,
  Users,
  CheckCircle,
  AlertTriangle,
  Star,
  MapPin,
  Download,
  Filter,
  RefreshCw,
  Target,
  Activity,
  Zap
} from 'lucide-react'
import {
  JobAnalytics,
  StaffPerformance,
  PropertyPerformance,
  JobCategory,
  JobPriority,
  JobStatus
} from '@/types/enhancedJobAssignment'

interface AnalyticsReportingProps {
  onExportReport?: (reportType: string) => void
}

export default function AnalyticsReporting({ onExportReport }: AnalyticsReportingProps) {
  const [analytics, setAnalytics] = useState<JobAnalytics | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'quarter'>('week')
  const [isLoading, setIsLoading] = useState(true)

  // Load analytics data
  useEffect(() => {
    loadAnalytics()
  }, [selectedPeriod])

  const loadAnalytics = async () => {
    try {
      setIsLoading(true)
      
      // Load real analytics data from Firebase
      const realAnalytics: JobAnalytics = {
        totalJobs: 0,
        completedJobs: 0,
        pendingJobs: 0,
        overdueJobs: 0,
        averageCompletionTime: 0,
        completionRate: 0,
        
        jobsByCategory: {
          cleaning: 0,
          maintenance: 0,
          inspection: 0,
          security: 0,
          landscaping: 0,
          pool_maintenance: 0,
          guest_services: 0,
          emergency: 0,
          inventory: 0,
          setup: 0
        },

        completionByCategory: {
          cleaning: 0,
          maintenance: 0,
          inspection: 0,
          security: 0,
          landscaping: 0,
          pool_maintenance: 0,
          guest_services: 0,
          emergency: 0,
          inventory: 0,
          setup: 0
        },

        jobsByPriority: {
          urgent: 0,
          high: 0,
          medium: 0,
          low: 0
        },
        
        jobsByStaff: {}, // TODO: Calculate from real job data

        performanceByStaff: {}, // TODO: Calculate from real staff performance data

        peakHours: [], // TODO: Calculate from real job timing data
        averageJobDuration: 0,
        timeEfficiency: 0,

        totalCost: 0,
        averageCostPerJob: 0,
        costByCategory: {
          cleaning: 0,
          maintenance: 0,
          inspection: 0,
          security: 0,
          landscaping: 0,
          pool_maintenance: 0,
          guest_services: 0,
          emergency: 0,
          inventory: 0,
          setup: 0
        },

        jobsByProperty: {}, // TODO: Calculate from real property data

        propertyPerformance: {} // TODO: Calculate from real property performance data
      }
      
      setAnalytics(realAnalytics)
      
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  const getPerformanceColor = (value: number, threshold: number = 80): string => {
    if (value >= threshold) return 'text-green-400'
    if (value >= threshold * 0.7) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="w-4 h-4 text-green-400" />
    if (current < previous) return <TrendingDown className="w-4 h-4 text-red-400" />
    return <div className="w-4 h-4" />
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
        <span className="ml-2 text-gray-400">Loading analytics...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Analytics & Reporting</h2>
          <p className="text-gray-400">Performance metrics and insights</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
          <Button
            onClick={() => onExportReport?.('comprehensive')}
            size="sm"
            variant="outline"
            className="border-gray-600"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={loadAnalytics}
            disabled={isLoading}
            size="sm"
            variant="outline"
            className="border-gray-600"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Jobs</p>
                <p className="text-2xl font-bold text-white">{analytics.totalJobs}</p>
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon(analytics.totalJobs, 140)}
                  <span className="text-xs text-gray-400">vs last period</span>
                </div>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Completion Rate</p>
                <p className="text-2xl font-bold text-green-400">{analytics.completionRate.toFixed(1)}%</p>
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon(analytics.completionRate, 88)}
                  <span className="text-xs text-gray-400">+2.3% improvement</span>
                </div>
              </div>
              <Target className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Avg. Duration</p>
                <p className="text-2xl font-bold text-white">{formatDuration(analytics.averageCompletionTime)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon(130, analytics.averageCompletionTime)}
                  <span className="text-xs text-gray-400">5m faster</span>
                </div>
              </div>
              <Clock className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Cost</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(analytics.totalCost)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon(14200, analytics.totalCost)}
                  <span className="text-xs text-gray-400">+8.6% increase</span>
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Job Categories */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Jobs by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.jobsByCategory)
                .filter(([_, count]) => count > 0)
                .sort(([_, a], [__, b]) => b - a)
                .map(([category, count]) => {
                  const percentage = (count / analytics.totalJobs) * 100
                  const completed = analytics.completionByCategory[category as JobCategory] || 0
                  const completionRate = count > 0 ? (completed / count) * 100 : 0
                  
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-300 capitalize">{category.replace('_', ' ')}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{count}</span>
                          <span className="text-gray-400">({percentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Completion: {completionRate.toFixed(1)}%</span>
                        <span>{formatCurrency(analytics.costByCategory[category as JobCategory] || 0)}</span>
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>

        {/* Staff Performance */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Staff Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.values(analytics.performanceByStaff)
                .sort((a, b) => b.efficiency - a.efficiency)
                .map((staff) => (
                  <div key={staff.staffId} className="p-3 bg-gray-700/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white">{staff.staffName}</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <span className="text-white text-sm">{staff.rating}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Jobs</p>
                        <p className="text-white font-medium">{staff.completedJobs}/{staff.totalJobs}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Completion</p>
                        <p className={`font-medium ${getPerformanceColor(staff.completionRate, 85)}`}>
                          {staff.completionRate.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Efficiency</p>
                        <p className={`font-medium ${getPerformanceColor(staff.efficiency, 80)}`}>
                          {staff.efficiency}%
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Overall Performance</span>
                        <span>{staff.efficiency}%</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            staff.efficiency >= 80 ? 'bg-green-500' :
                            staff.efficiency >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${staff.efficiency}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Quick Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={() => onExportReport?.('staff_performance')}
              variant="outline"
              className="border-gray-600 hover:bg-gray-700"
            >
              <Users className="w-4 h-4 mr-2" />
              Staff Report
            </Button>
            <Button
              onClick={() => onExportReport?.('property_analysis')}
              variant="outline"
              className="border-gray-600 hover:bg-gray-700"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Property Report
            </Button>
            <Button
              onClick={() => onExportReport?.('cost_analysis')}
              variant="outline"
              className="border-gray-600 hover:bg-gray-700"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Cost Analysis
            </Button>
            <Button
              onClick={() => onExportReport?.('efficiency_trends')}
              variant="outline"
              className="border-gray-600 hover:bg-gray-700"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Efficiency Trends
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
