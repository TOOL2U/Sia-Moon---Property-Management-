'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  Calendar,
  PieChart,
  AlertCircle,
  CheckCircle,
  Brain,
  FileText
} from 'lucide-react'

interface FinancialReport {
  month: string
  year: number
  revenue: number
  expenses: number
  profit: number
  insight: string
  breakdown?: {
    bookingRevenue: number
    serviceRevenue: number
    maintenanceExpenses: number
    staffExpenses: number
    utilityExpenses: number
    marketingExpenses: number
  }
  trends?: {
    revenueChange: number
    expenseChange: number
    profitChange: number
  }
  aiConfidence: number
  generatedAt: string
}

interface MonthlyFinancialReportProps {
  className?: string
  maxReports?: number
}

export default function MonthlyFinancialReport({ 
  className, 
  maxReports = 6 
}: MonthlyFinancialReportProps) {
  const [reports, setReports] = useState<FinancialReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/ai-cfo/reports')
      
      if (!response.ok) {
        throw new Error('Failed to load financial reports')
      }
      
      const data = await response.json()
      setReports(data.reports || [])
      setError(null)
    } catch (err) {
      console.error('Failed to load financial reports:', err)
      setError(err instanceof Error ? err.message : 'Failed to load reports')
      
      // Use mock data for development
      setReports(generateMockReports())
    } finally {
      setLoading(false)
    }
  }

  const generateMockReports = (): FinancialReport[] => {
    const months = [
      'July 2025', 'June 2025', 'May 2025', 
      'April 2025', 'March 2025', 'February 2025'
    ]
    
    const insights = [
      "Pool maintenance costs rose 22% vs previous month due to overtime claims and equipment repairs.",
      "Booking revenue increased 15% with strong weekend occupancy rates and premium villa bookings.",
      "Staff expenses decreased 8% through optimized scheduling and reduced overtime requirements.",
      "Utility costs spiked 18% due to increased air conditioning usage during hot weather period.",
      "Marketing ROI improved 25% with targeted social media campaigns driving direct bookings.",
      "Maintenance expenses reduced 12% through preventive care programs and bulk supplier discounts."
    ]

    return months.map((month, i) => {
      const baseRevenue = 120000 + (Math.random() - 0.5) * 40000
      const baseExpenses = 75000 + (Math.random() - 0.5) * 25000
      const profit = baseRevenue - baseExpenses
      
      return {
        month,
        year: 2025,
        revenue: Math.round(baseRevenue),
        expenses: Math.round(baseExpenses),
        profit: Math.round(profit),
        insight: insights[i],
        breakdown: {
          bookingRevenue: Math.round(baseRevenue * 0.75),
          serviceRevenue: Math.round(baseRevenue * 0.25),
          maintenanceExpenses: Math.round(baseExpenses * 0.35),
          staffExpenses: Math.round(baseExpenses * 0.40),
          utilityExpenses: Math.round(baseExpenses * 0.15),
          marketingExpenses: Math.round(baseExpenses * 0.10)
        },
        trends: {
          revenueChange: (Math.random() - 0.5) * 30,
          expenseChange: (Math.random() - 0.5) * 20,
          profitChange: (Math.random() - 0.5) * 50
        },
        aiConfidence: Math.floor(Math.random() * 15) + 85, // 85-100%
        generatedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000 * 30).toISOString()
      }
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />
    return <div className="w-4 h-4" />
  }

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-500'
    if (change < 0) return 'text-red-500'
    return 'text-neutral-400'
  }

  const getProfitColor = (profit: number) => {
    if (profit > 50000) return 'text-green-400'
    if (profit > 20000) return 'text-yellow-400'
    if (profit > 0) return 'text-orange-400'
    return 'text-red-400'
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 95) return 'text-green-400'
    if (confidence >= 90) return 'text-yellow-400'
    return 'text-orange-400'
  }

  if (loading) {
    return (
      <Card className={`bg-neutral-900 border-neutral-700 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <FileText className="h-5 w-5" />
            Monthly Financial Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-neutral-400 mr-2" />
            <span className="text-neutral-400">Loading financial reports...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`bg-neutral-900 border-neutral-700 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <FileText className="h-5 w-5" />
            AI CFO Financial Reports
            <Badge variant="secondary" className="ml-2">
              {reports.length} Reports
            </Badge>
          </CardTitle>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={loadReports}
            disabled={loading}
            className="text-neutral-400 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        {error && (
          <div className="text-red-400 text-sm flex items-center gap-1 mt-2">
            <AlertCircle className="w-4 h-4" />
            {error} - Showing mock data
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {reports.slice(0, maxReports).map((report, i) => (
            <div key={i} className="bg-neutral-800 border border-neutral-700 rounded-lg p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-blue-400" />
                  <h3 className="text-lg font-bold text-white">📅 {report.month}</h3>
                </div>
                
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-400" />
                  <span className={`text-sm ${getConfidenceColor(report.aiConfidence)}`}>
                    {report.aiConfidence}% confidence
                  </span>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-neutral-900 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-neutral-400">Revenue</div>
                      <div className="text-xl font-bold text-green-400">
                        💰 {formatCurrency(report.revenue)}
                      </div>
                    </div>
                    {report.trends && (
                      <div className="flex items-center gap-1">
                        {getTrendIcon(report.trends.revenueChange)}
                        <span className={`text-sm ${getTrendColor(report.trends.revenueChange)}`}>
                          {report.trends.revenueChange > 0 ? '+' : ''}{report.trends.revenueChange.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-neutral-900 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-neutral-400">Expenses</div>
                      <div className="text-xl font-bold text-red-400">
                        💸 {formatCurrency(report.expenses)}
                      </div>
                    </div>
                    {report.trends && (
                      <div className="flex items-center gap-1">
                        {getTrendIcon(-report.trends.expenseChange)} {/* Negative because lower expenses are good */}
                        <span className={`text-sm ${getTrendColor(-report.trends.expenseChange)}`}>
                          {report.trends.expenseChange > 0 ? '+' : ''}{report.trends.expenseChange.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-neutral-900 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-neutral-400">Net Profit</div>
                      <div className={`text-xl font-bold ${getProfitColor(report.profit)}`}>
                        📊 {formatCurrency(report.profit)}
                      </div>
                    </div>
                    {report.trends && (
                      <div className="flex items-center gap-1">
                        {getTrendIcon(report.trends.profitChange)}
                        <span className={`text-sm ${getTrendColor(report.trends.profitChange)}`}>
                          {report.trends.profitChange > 0 ? '+' : ''}{report.trends.profitChange.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Insight */}
              <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Brain className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-blue-400 mb-1">AI CFO Insight</div>
                    <div className="text-neutral-300 italic">
                      {report.insight}
                    </div>
                  </div>
                </div>
              </div>

              {/* Breakdown (if available) */}
              {report.breakdown && (
                <div className="mt-4 pt-4 border-t border-neutral-700">
                  <div className="text-sm text-neutral-400 mb-3 flex items-center gap-2">
                    <PieChart className="w-4 h-4" />
                    Detailed Breakdown
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div className="text-neutral-300">
                      Booking Revenue: <span className="text-green-400">{formatCurrency(report.breakdown.bookingRevenue)}</span>
                    </div>
                    <div className="text-neutral-300">
                      Service Revenue: <span className="text-green-400">{formatCurrency(report.breakdown.serviceRevenue)}</span>
                    </div>
                    <div className="text-neutral-300">
                      Staff Expenses: <span className="text-red-400">{formatCurrency(report.breakdown.staffExpenses)}</span>
                    </div>
                    <div className="text-neutral-300">
                      Maintenance: <span className="text-red-400">{formatCurrency(report.breakdown.maintenanceExpenses)}</span>
                    </div>
                    <div className="text-neutral-300">
                      Utilities: <span className="text-red-400">{formatCurrency(report.breakdown.utilityExpenses)}</span>
                    </div>
                    <div className="text-neutral-300">
                      Marketing: <span className="text-red-400">{formatCurrency(report.breakdown.marketingExpenses)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {reports.length === 0 && (
            <div className="text-center text-neutral-400 py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <div>No financial reports available</div>
              <div className="text-sm mt-1">Reports will appear here once generated by AI CFO</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
