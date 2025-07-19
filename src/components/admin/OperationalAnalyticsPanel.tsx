'use client'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { motion } from 'framer-motion'
import {
  BarChart3,
  Calendar,
  Clock,
  DollarSign,
  Star,
  TrendingDown,
  TrendingUp,
  Users,
  Wrench,
  Zap,
} from 'lucide-react'
import { useState } from 'react'

interface AnalyticsData {
  revenue: {
    today: number
    week: number
    month: number
    trend: 'up' | 'down' | 'stable'
    percentage: number
  }
  occupancy: {
    current: number
    target: number
    trend: 'up' | 'down' | 'stable'
    percentage: number
  }
  staff: {
    productivity: number
    efficiency: number
    satisfaction: number
    activeCount: number
  }
  maintenance: {
    scheduled: number
    completed: number
    overdue: number
    upcomingWeek: number
  }
  guests: {
    satisfaction: number
    checkInsToday: number
    checkOutsToday: number
    totalActive: number
  }
  predictions: {
    nextWeekOccupancy: number
    maintenanceNeeds: string[]
    staffingRequirements: number
    revenueProjection: number
  }
}

interface OperationalAnalyticsPanelProps {
  isFullScreen?: boolean
}

export default function OperationalAnalyticsPanel({ isFullScreen = false }: OperationalAnalyticsPanelProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'today' | 'week' | 'month'>('today')
  
  // Mock analytics data - replace with real data from Firebase/API
  const analyticsData: AnalyticsData = {
    revenue: {
      today: 2850,
      week: 18750,
      month: 78500,
      trend: 'up',
      percentage: 12.5,
    },
    occupancy: {
      current: 78,
      target: 85,
      trend: 'up',
      percentage: 8.2,
    },
    staff: {
      productivity: 92,
      efficiency: 88,
      satisfaction: 4.6,
      activeCount: 12,
    },
    maintenance: {
      scheduled: 8,
      completed: 6,
      overdue: 1,
      upcomingWeek: 12,
    },
    guests: {
      satisfaction: 4.8,
      checkInsToday: 3,
      checkOutsToday: 2,
      totalActive: 18,
    },
    predictions: {
      nextWeekOccupancy: 82,
      maintenanceNeeds: ['Pool cleaning', 'HVAC service', 'Garden maintenance'],
      staffingRequirements: 14,
      revenueProjection: 95000,
    },
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-400" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-400" />
      default:
        return <div className="w-4 h-4" />
    }
  }

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-400'
      case 'down':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <div className={`space-y-6 ${isFullScreen ? 'h-full' : ''}`}>
      {/* Analytics Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-400" />
            Operational Analytics
          </h3>
          <p className="text-gray-400 text-sm">Real-time performance insights and predictions</p>
        </div>
        <div className="flex gap-2">
          {(['today', 'week', 'month'] as const).map((timeframe) => (
            <Button
              key={timeframe}
              variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeframe(timeframe)}
              className={`${
                selectedTimeframe === timeframe
                  ? 'bg-purple-600 text-white'
                  : 'border-gray-700 text-gray-300 hover:bg-gray-800'
              }`}
            >
              {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800">
          <TabsTrigger value="overview" className="text-gray-300 data-[state=active]:text-white">
            Overview
          </TabsTrigger>
          <TabsTrigger value="revenue" className="text-gray-300 data-[state=active]:text-white">
            Revenue
          </TabsTrigger>
          <TabsTrigger value="operations" className="text-gray-300 data-[state=active]:text-white">
            Operations
          </TabsTrigger>
          <TabsTrigger value="predictions" className="text-gray-300 data-[state=active]:text-white">
            Predictions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Revenue Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Revenue ({selectedTimeframe})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-white">
                        ${analyticsData.revenue[selectedTimeframe].toLocaleString()}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {getTrendIcon(analyticsData.revenue.trend)}
                        <span className={`text-sm ${getTrendColor(analyticsData.revenue.trend)}`}>
                          {analyticsData.revenue.percentage}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Occupancy Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Occupancy Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold text-white">{analyticsData.occupancy.current}%</p>
                      <Badge variant="outline" className="text-gray-300 border-gray-600">
                        Target: {analyticsData.occupancy.target}%
                      </Badge>
                    </div>
                    <Progress 
                      value={analyticsData.occupancy.current} 
                      className="h-2"
                    />
                    <div className="flex items-center gap-1">
                      {getTrendIcon(analyticsData.occupancy.trend)}
                      <span className={`text-sm ${getTrendColor(analyticsData.occupancy.trend)}`}>
                        {analyticsData.occupancy.percentage}% vs last period
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Guest Satisfaction Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Guest Satisfaction
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-white">{analyticsData.guests.satisfaction}</p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= analyticsData.guests.satisfaction
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-400">
                      {analyticsData.guests.totalActive} active guests
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          {/* Revenue analytics content will be added here */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Revenue Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">Detailed revenue analytics coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          {/* Operations analytics content will be added here */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Operations Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">Detailed operations analytics coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          {/* Predictions content will be added here */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Predictive Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">Predictive analytics coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
