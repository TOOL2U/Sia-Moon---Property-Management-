'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  RefreshCw,
  Calendar,
  Users,
  Target,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import FinancialReportingService, { type RealTimeFinancialMetrics } from '@/services/FinancialReportingService'

export default function FinancialDashboard() {
  const [metrics, setMetrics] = useState<RealTimeFinancialMetrics>({
    todayRevenue: 0,
    todayCosts: 0,
    todayProfit: 0,
    todayJobs: 0,
    monthToDateRevenue: 0,
    monthToDateProfit: 0,
    profitMargin: 0,
    topPerformingStaff: 'N/A',
    mostProfitableJobType: 'N/A',
    lastUpdated: new Date()
  })
  
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [serviceMetrics, setServiceMetrics] = useState({
    reportsGenerated: 0,
    calculationErrors: 0,
    averageProcessingTime: 0,
    lastReportGenerated: null as Date | null
  })

  useEffect(() => {
    // Initial load
    refreshMetrics()
    
    // Set up periodic refresh every 30 seconds
    const interval = setInterval(refreshMetrics, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const refreshMetrics = async () => {
    try {
      const realTimeMetrics = await FinancialReportingService.getRealTimeMetrics()
      const currentServiceMetrics = FinancialReportingService.getMetrics()
      
      setMetrics(realTimeMetrics)
      setServiceMetrics(currentServiceMetrics)
    } catch (error) {
      console.error('Error refreshing financial metrics:', error)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshMetrics()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getProfitMarginColor = (margin: number) => {
    if (margin >= 30) return 'text-green-400'
    if (margin >= 15) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getProfitMarginBadge = (margin: number) => {
    if (margin >= 30) return 'success'
    if (margin >= 15) return 'warning'
    return 'destructive'
  }

  const getPerformanceStatus = () => {
    if (metrics.profitMargin >= 30 && serviceMetrics.calculationErrors === 0) {
      return { status: 'excellent', color: 'text-green-400', icon: CheckCircle }
    } else if (metrics.profitMargin >= 15 && serviceMetrics.calculationErrors <= 2) {
      return { status: 'good', color: 'text-yellow-400', icon: TrendingUp }
    } else {
      return { status: 'needs attention', color: 'text-red-400', icon: AlertTriangle }
    }
  }

  const performanceStatus = getPerformanceStatus()
  const StatusIcon = performanceStatus.icon

  return (
    <Card className="bg-neutral-900 border-neutral-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-400" />
            Financial Dashboard
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="border-neutral-700 hover:bg-neutral-800"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <p className="text-neutral-400 text-sm">
          Real-time financial analytics and performance metrics
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Today's Performance */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-400" />
              <span className="text-neutral-400 text-sm">Today's Revenue</span>
            </div>
            <div className="text-2xl font-bold text-green-400">
              {formatCurrency(metrics.todayRevenue)}
            </div>
            <div className="text-xs text-neutral-500">
              {metrics.todayJobs} jobs completed
            </div>
          </div>

          <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-red-400" />
              <span className="text-neutral-400 text-sm">Today's Costs</span>
            </div>
            <div className="text-2xl font-bold text-red-400">
              {formatCurrency(metrics.todayCosts)}
            </div>
            <div className="text-xs text-neutral-500">
              operational expenses
            </div>
          </div>

          <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-400" />
              <span className="text-neutral-400 text-sm">Today's Profit</span>
            </div>
            <div className="text-2xl font-bold text-blue-400">
              {formatCurrency(metrics.todayProfit)}
            </div>
            <div className="text-xs text-neutral-500">
              net profit
            </div>
          </div>

          <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-purple-400" />
              <span className="text-neutral-400 text-sm">Profit Margin</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${getProfitMarginColor(metrics.profitMargin)}`}>
                {metrics.profitMargin.toFixed(1)}%
              </span>
              <Badge variant={getProfitMarginBadge(metrics.profitMargin)} className="text-xs">
                {metrics.profitMargin >= 30 ? 'Excellent' : metrics.profitMargin >= 15 ? 'Good' : 'Low'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Month-to-Date Performance */}
        <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
          <h3 className="text-white font-medium mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-400" />
            Month-to-Date Performance
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-neutral-400 text-sm">MTD Revenue</span>
                <span className="text-green-400 font-bold text-lg">
                  {formatCurrency(metrics.monthToDateRevenue)}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-neutral-400 text-sm">MTD Profit</span>
                <span className="text-blue-400 font-bold text-lg">
                  {formatCurrency(metrics.monthToDateProfit)}
                </span>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-neutral-400 text-sm">Top Performer</span>
                <span className="text-white font-medium">
                  {metrics.topPerformingStaff}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-neutral-400 text-sm">Most Profitable Job</span>
                <span className="text-white font-medium">
                  {metrics.mostProfitableJobType}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Service Performance */}
        <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
          <h3 className="text-white font-medium mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-purple-400" />
            Financial Reporting Performance
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {serviceMetrics.reportsGenerated}
              </div>
              <div className="text-sm text-neutral-400">Reports Generated</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {serviceMetrics.averageProcessingTime.toFixed(0)}ms
              </div>
              <div className="text-sm text-neutral-400">Avg Processing Time</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">
                {serviceMetrics.calculationErrors}
              </div>
              <div className="text-sm text-neutral-400">Calculation Errors</div>
            </div>
          </div>
        </div>

        {/* Performance Targets */}
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <h3 className="text-blue-400 font-medium mb-3 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Financial Performance Targets
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-blue-300">Target Profit Margin:</span>
                <span className="text-blue-200 font-medium">≥ 30%</span>
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-blue-300">Report Generation:</span>
                <span className="text-blue-200 font-medium">≤ 30 seconds</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-blue-300">Calculation Accuracy:</span>
                <span className="text-blue-200 font-medium">99%+</span>
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-blue-300">Data Processing:</span>
                <span className="text-blue-200 font-medium">Real-time</span>
              </div>
            </div>
          </div>
        </div>

        {/* System Health Indicator */}
        <div className="text-center">
          <div className={`flex items-center justify-center gap-2 ${performanceStatus.color}`}>
            <StatusIcon className="h-5 w-5" />
            <span className="font-medium">
              Financial System Performance: {performanceStatus.status.charAt(0).toUpperCase() + performanceStatus.status.slice(1)}
            </span>
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            Last updated: {metrics.lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
