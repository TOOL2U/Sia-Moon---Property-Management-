'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  FileText,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  PieChart,
  Target,
  AlertCircle,
  CheckCircle,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  Filter
} from 'lucide-react'
import { ProfitLossStatement as ProfitLossData } from '@/types/financial'

interface ProfitLossStatementProps {
  profitLoss: ProfitLossData
  loading?: boolean
  onExport?: (format: 'pdf' | 'excel') => void
  onGenerateReport?: () => void
}

export default function ProfitLossStatement({ 
  profitLoss, 
  loading, 
  onExport,
  onGenerateReport 
}: ProfitLossStatementProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly')
  const [showComparison, setShowComparison] = useState(false)

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="bg-neutral-900 border-neutral-800 animate-pulse">
            <CardHeader>
              <div className="h-4 bg-neutral-700 rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-neutral-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const getMarginStatus = (margin: number) => {
    if (margin >= 20) return { color: 'text-green-400', status: 'excellent' }
    if (margin >= 15) return { color: 'text-blue-400', status: 'good' }
    if (margin >= 10) return { color: 'text-yellow-400', status: 'fair' }
    return { color: 'text-red-400', status: 'poor' }
  }

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <ArrowUpRight className="h-4 w-4 text-green-400" />
    if (current < previous) return <ArrowDownRight className="h-4 w-4 text-red-400" />
    return <Minus className="h-4 w-4 text-yellow-400" />
  }

  const formatPeriod = (period: typeof profitLoss.period) => {
    const startDate = new Date(period.startDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
    const endDate = new Date(period.endDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
    return `${startDate} - ${endDate}`
  }

  return (
    <div className="space-y-6">
      {/* P&L Header */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Profit & Loss Statement
              </CardTitle>
              <CardDescription>
                {formatPeriod(profitLoss.period)} • {profitLoss.period.type.charAt(0).toUpperCase() + profitLoss.period.type.slice(1)} Report
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowComparison(!showComparison)}
                variant="outline"
                size="sm"
                className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                {showComparison ? 'Hide' : 'Show'} Comparison
              </Button>
              <Button
                onClick={() => onExport?.('pdf')}
                variant="outline"
                size="sm"
                className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
              >
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button
                onClick={() => onExport?.('excel')}
                variant="outline"
                size="sm"
                className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-green-400">
                {formatCurrency(profitLoss.revenue.totalRevenue)}
              </p>
              <p className="text-sm text-neutral-400">
                100% of revenue
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <Target className="h-5 w-5" />
              Gross Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-blue-400">
                {formatCurrency(profitLoss.grossProfit)}
              </p>
              <div className="flex items-center gap-1">
                <span className={`text-sm ${getMarginStatus(profitLoss.margins.grossMargin).color}`}>
                  {formatPercentage(profitLoss.margins.grossMargin)} margin
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5" />
              Operating Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-purple-400">
                {formatCurrency(profitLoss.operatingIncome)}
              </p>
              <div className="flex items-center gap-1">
                <span className={`text-sm ${getMarginStatus(profitLoss.margins.operatingMargin).color}`}>
                  {formatPercentage(profitLoss.margins.operatingMargin)} margin
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-600/20 to-red-600/20 border-orange-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <PieChart className="h-5 w-5" />
              Net Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className={`text-3xl font-bold ${
                profitLoss.netIncome >= 0 ? 'text-orange-400' : 'text-red-400'
              }`}>
                {formatCurrency(profitLoss.netIncome)}
              </p>
              <div className="flex items-center gap-1">
                <span className={`text-sm ${getMarginStatus(profitLoss.margins.netMargin).color}`}>
                  {formatPercentage(profitLoss.margins.netMargin)} margin
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed P&L Statement */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white">Detailed Profit & Loss Statement</CardTitle>
          <CardDescription>Complete financial performance breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Revenue Section */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
                Revenue
              </h3>
              <div className="bg-neutral-800 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-300">Booking Revenue</span>
                  <span className="text-white font-medium">{formatCurrency(profitLoss.revenue.bookingRevenue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-300">Additional Services</span>
                  <span className="text-white font-medium">{formatCurrency(profitLoss.revenue.additionalServices)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-300">Other Revenue</span>
                  <span className="text-white font-medium">{formatCurrency(profitLoss.revenue.otherRevenue)}</span>
                </div>
                <div className="border-t border-neutral-700 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-semibold">Total Revenue</span>
                    <span className="text-green-400 font-bold text-lg">{formatCurrency(profitLoss.revenue.totalRevenue)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Expenses Section */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-400" />
                Expenses
              </h3>
              <div className="bg-neutral-800 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-300">Operating Expenses</span>
                  <span className="text-white font-medium">{formatCurrency(profitLoss.expenses.operatingExpenses)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-300">Staff Costs</span>
                  <span className="text-white font-medium">{formatCurrency(profitLoss.expenses.staffCosts)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-300">Maintenance Expenses</span>
                  <span className="text-white font-medium">{formatCurrency(profitLoss.expenses.maintenanceExpenses)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-300">Marketing Expenses</span>
                  <span className="text-white font-medium">{formatCurrency(profitLoss.expenses.marketingExpenses)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-300">Administrative Expenses</span>
                  <span className="text-white font-medium">{formatCurrency(profitLoss.expenses.administrativeExpenses)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-300">Depreciation</span>
                  <span className="text-white font-medium">{formatCurrency(profitLoss.expenses.depreciation)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-300">Interest Expense</span>
                  <span className="text-white font-medium">{formatCurrency(profitLoss.expenses.interestExpense)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-300">Taxes</span>
                  <span className="text-white font-medium">{formatCurrency(profitLoss.expenses.taxes)}</span>
                </div>
                <div className="border-t border-neutral-700 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-semibold">Total Expenses</span>
                    <span className="text-red-400 font-bold text-lg">{formatCurrency(profitLoss.expenses.totalExpenses)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profit Calculations */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-400" />
                Profit Analysis
              </h3>
              <div className="bg-neutral-800 rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-300">Gross Profit</span>
                  <div className="text-right">
                    <span className="text-white font-medium">{formatCurrency(profitLoss.grossProfit)}</span>
                    <span className={`ml-2 text-sm ${getMarginStatus(profitLoss.margins.grossMargin).color}`}>
                      ({formatPercentage(profitLoss.margins.grossMargin)})
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-300">Operating Income</span>
                  <div className="text-right">
                    <span className="text-white font-medium">{formatCurrency(profitLoss.operatingIncome)}</span>
                    <span className={`ml-2 text-sm ${getMarginStatus(profitLoss.margins.operatingMargin).color}`}>
                      ({formatPercentage(profitLoss.margins.operatingMargin)})
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-300">EBITDA</span>
                  <span className="text-white font-medium">{formatCurrency(profitLoss.ebitda)}</span>
                </div>
                <div className="border-t border-neutral-700 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-semibold">Net Income</span>
                    <div className="text-right">
                      <span className={`font-bold text-lg ${
                        profitLoss.netIncome >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {formatCurrency(profitLoss.netIncome)}
                      </span>
                      <span className={`ml-2 text-sm ${getMarginStatus(profitLoss.margins.netMargin).color}`}>
                        ({formatPercentage(profitLoss.margins.netMargin)})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Health Indicators */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Financial Health Indicators
          </CardTitle>
          <CardDescription>Key performance indicators and financial health metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-neutral-800 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">Profitability</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Gross Margin</span>
                  <Badge className={getMarginStatus(profitLoss.margins.grossMargin).color.replace('text-', 'bg-').replace('-400', '-500/20 text-') + '-400 border-' + getMarginStatus(profitLoss.margins.grossMargin).color.replace('text-', '').replace('-400', '-500/30')}>
                    {formatPercentage(profitLoss.margins.grossMargin)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Operating Margin</span>
                  <Badge className={getMarginStatus(profitLoss.margins.operatingMargin).color.replace('text-', 'bg-').replace('-400', '-500/20 text-') + '-400 border-' + getMarginStatus(profitLoss.margins.operatingMargin).color.replace('text-', '').replace('-400', '-500/30')}>
                    {formatPercentage(profitLoss.margins.operatingMargin)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Net Margin</span>
                  <Badge className={getMarginStatus(profitLoss.margins.netMargin).color.replace('text-', 'bg-').replace('-400', '-500/20 text-') + '-400 border-' + getMarginStatus(profitLoss.margins.netMargin).color.replace('text-', '').replace('-400', '-500/30')}>
                    {formatPercentage(profitLoss.margins.netMargin)}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="bg-neutral-800 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">Expense Ratios</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Staff Cost Ratio</span>
                  <span className="text-white">
                    {((profitLoss.expenses.staffCosts / profitLoss.revenue.totalRevenue) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Operating Ratio</span>
                  <span className="text-white">
                    {((profitLoss.expenses.operatingExpenses / profitLoss.revenue.totalRevenue) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Total Expense Ratio</span>
                  <span className="text-white">
                    {((profitLoss.expenses.totalExpenses / profitLoss.revenue.totalRevenue) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-neutral-800 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">Performance Status</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {profitLoss.netIncome > 0 ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-400" />
                  )}
                  <span className="text-sm text-neutral-300">
                    {profitLoss.netIncome > 0 ? 'Profitable' : 'Loss Making'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {profitLoss.margins.grossMargin >= 50 ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : profitLoss.margins.grossMargin >= 30 ? (
                    <AlertCircle className="h-4 w-4 text-yellow-400" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-400" />
                  )}
                  <span className="text-sm text-neutral-300">
                    {profitLoss.margins.grossMargin >= 50 ? 'Healthy' : profitLoss.margins.grossMargin >= 30 ? 'Moderate' : 'Poor'} Gross Margin
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {profitLoss.ebitda > profitLoss.operatingIncome ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-400" />
                  )}
                  <span className="text-sm text-neutral-300">
                    Strong EBITDA Performance
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
