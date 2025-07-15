'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  BarChart3,
  PieChart,
  TrendingUp,
  Calendar,
  Filter,
  Download,
  Maximize2,
  RefreshCw
} from 'lucide-react'
import { RevenueAnalytics, ExpenseAnalytics, MonthlyRevenue } from '@/types/financial'

interface FinancialChartsProps {
  revenue: RevenueAnalytics
  expenses: ExpenseAnalytics
  loading?: boolean
}

export default function FinancialCharts({ revenue, expenses, loading }: FinancialChartsProps) {
  const [selectedChart, setSelectedChart] = useState<'revenue' | 'expenses' | 'comparison' | 'trends'>('revenue')
  const [chartPeriod, setChartPeriod] = useState<'6m' | '12m' | '24m'>('12m')

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-neutral-900 border-neutral-800 animate-pulse">
            <CardHeader>
              <div className="h-4 bg-neutral-700 rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-neutral-700 rounded"></div>
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

  // Revenue Trend Chart Data
  const revenueChartData = revenue.revenueByMonth.slice(-12).map(month => ({
    month: month.month.substring(0, 3),
    revenue: month.revenue,
    bookings: month.bookings,
    growth: month.growth
  }))

  // Property Performance Chart Data
  const propertyChartData = revenue.revenueByProperty.map(property => ({
    name: property.propertyName.split(' ')[0], // Shortened name
    revenue: property.totalRevenue,
    occupancy: property.occupancyRate,
    adr: property.adr
  }))

  // Booking Source Chart Data
  const sourceChartData = revenue.revenueBySource.map(source => ({
    name: source.source.replace('_', ' '),
    value: source.revenue,
    percentage: source.percentage,
    color: getSourceColor(source.source)
  }))

  // Expense Category Chart Data
  const expenseChartData = expenses.expensesByCategory.map(category => ({
    name: category.category.replace('_', ' '),
    value: category.amount,
    percentage: category.percentage,
    trend: category.monthlyTrend,
    color: getCategoryColor(category.category)
  }))

  function getSourceColor(source: string) {
    const colors = {
      direct: '#10b981',
      airbnb: '#f59e0b',
      'booking.com': '#3b82f6',
      vrbo: '#8b5cf6',
      expedia: '#ef4444',
      referral: '#06b6d4',
      repeat_guest: '#84cc16',
      other: '#6b7280'
    }
    return colors[source as keyof typeof colors] || '#6b7280'
  }

  function getCategoryColor(category: string) {
    const colors = {
      staff_salaries: '#3b82f6',
      staff_benefits: '#06b6d4',
      maintenance: '#f59e0b',
      utilities: '#eab308',
      insurance: '#10b981',
      marketing: '#8b5cf6',
      supplies: '#ec4899',
      cleaning: '#14b8a6',
      taxes: '#ef4444',
      legal_professional: '#6366f1',
      technology: '#8b5cf6',
      other: '#6b7280'
    }
    return colors[category as keyof typeof colors] || '#6b7280'
  }

  // Simple SVG Chart Components (since we're avoiding external chart libraries)
  const BarChart = ({ data, height = 200 }: { data: any[], height?: number }) => {
    const maxValue = Math.max(...data.map(d => d.revenue || d.value))
    const barWidth = 100 / data.length - 2

    return (
      <div className="relative" style={{ height }}>
        <svg width="100%" height="100%" className="overflow-visible">
          {data.map((item, index) => {
            const barHeight = ((item.revenue || item.value) / maxValue) * (height - 40)
            const x = (index * (100 / data.length)) + 1
            const y = height - barHeight - 20

            return (
              <g key={index}>
                <rect
                  x={`${x}%`}
                  y={y}
                  width={`${barWidth}%`}
                  height={barHeight}
                  fill={item.color || '#3b82f6'}
                  className="hover:opacity-80 transition-opacity"
                  rx="2"
                />
                <text
                  x={`${x + barWidth/2}%`}
                  y={height - 5}
                  textAnchor="middle"
                  className="text-xs fill-neutral-400"
                >
                  {item.month || item.name}
                </text>
                <text
                  x={`${x + barWidth/2}%`}
                  y={y - 5}
                  textAnchor="middle"
                  className="text-xs fill-white"
                >
                  {formatCurrency(item.revenue || item.value)}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    )
  }

  const PieChartComponent = ({ data, size = 200 }: { data: any[], size?: number }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0)
    let currentAngle = 0
    const radius = size / 2 - 20
    const centerX = size / 2
    const centerY = size / 2

    return (
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size}>
          {data.map((item, index) => {
            const angle = (item.value / total) * 360
            const startAngle = currentAngle
            const endAngle = currentAngle + angle
            currentAngle += angle

            const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180)
            const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180)
            const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180)
            const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180)

            const largeArcFlag = angle > 180 ? 1 : 0

            const pathData = [
              `M ${centerX} ${centerY}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ')

            return (
              <path
                key={index}
                d={pathData}
                fill={item.color}
                className="hover:opacity-80 transition-opacity"
                stroke="#1f2937"
                strokeWidth="2"
              />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{formatCurrency(total)}</p>
            <p className="text-sm text-neutral-400">Total</p>
          </div>
        </div>
      </div>
    )
  }

  const LineChart = ({ data, height = 200 }: { data: any[], height?: number }) => {
    const maxValue = Math.max(...data.map(d => d.revenue))
    const minValue = Math.min(...data.map(d => d.revenue))
    const range = maxValue - minValue

    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * 100
      const y = ((maxValue - item.revenue) / range) * (height - 40) + 20
      return `${x},${y}`
    }).join(' ')

    return (
      <div className="relative" style={{ height }}>
        <svg width="100%" height="100%" className="overflow-visible">
          <polyline
            points={points}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            className="drop-shadow-sm"
          />
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 100
            const y = ((maxValue - item.revenue) / range) * (height - 40) + 20

            return (
              <g key={index}>
                <circle
                  cx={`${x}%`}
                  cy={y}
                  r="4"
                  fill="#3b82f6"
                  className="hover:r-6 transition-all"
                />
                <text
                  x={`${x}%`}
                  y={height - 5}
                  textAnchor="middle"
                  className="text-xs fill-neutral-400"
                >
                  {item.month}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Chart Controls */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Financial Data Visualization</CardTitle>
              <CardDescription>Interactive charts and analytics for financial performance</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">
                <Download className="h-4 w-4 mr-2" />
                Export Charts
              </Button>
              <Button variant="outline" size="sm" className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">
                <Maximize2 className="h-4 w-4 mr-2" />
                Full Screen
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'revenue', label: 'Revenue Trends', icon: TrendingUp },
              { key: 'expenses', label: 'Expense Analysis', icon: BarChart3 },
              { key: 'comparison', label: 'Revenue vs Expenses', icon: PieChart },
              { key: 'trends', label: 'Performance Trends', icon: Calendar }
            ].map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                onClick={() => setSelectedChart(key as any)}
                variant={selectedChart === key ? 'default' : 'outline'}
                size="sm"
                className={`${
                  selectedChart === key
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                } flex items-center gap-1`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Charts */}
      {selectedChart === 'revenue' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Monthly Revenue Trend
              </CardTitle>
              <CardDescription>Revenue performance over the last 12 months</CardDescription>
            </CardHeader>
            <CardContent>
              <LineChart data={revenueChartData} height={250} />
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-neutral-400">Avg Monthly</p>
                  <p className="text-lg font-semibold text-white">
                    {formatCurrency(revenueChartData.reduce((sum, d) => sum + d.revenue, 0) / revenueChartData.length)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Best Month</p>
                  <p className="text-lg font-semibold text-green-400">
                    {formatCurrency(Math.max(...revenueChartData.map(d => d.revenue)))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Growth Rate</p>
                  <p className="text-lg font-semibold text-blue-400">
                    +{((revenueChartData[revenueChartData.length - 1]?.revenue / revenueChartData[0]?.revenue - 1) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Revenue by Booking Source
              </CardTitle>
              <CardDescription>Distribution of revenue across different channels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center mb-4">
                <PieChartComponent data={sourceChartData} size={200} />
              </div>
              <div className="space-y-2">
                {sourceChartData.map((source, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: source.color }}
                      />
                      <span className="text-sm text-neutral-300 capitalize">{source.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-white">{formatCurrency(source.value)}</span>
                      <span className="text-xs text-neutral-400 ml-2">({source.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Property Performance
              </CardTitle>
              <CardDescription>Revenue and occupancy by property</CardDescription>
            </CardHeader>
            <CardContent>
              <BarChart data={propertyChartData} height={250} />
              <div className="mt-4 space-y-2">
                {propertyChartData.map((property, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-neutral-800 rounded">
                    <span className="text-sm text-neutral-300">{property.name}</span>
                    <div className="flex gap-4 text-xs">
                      <span className="text-green-400">{formatCurrency(property.revenue)}</span>
                      <span className="text-blue-400">{property.occupancy.toFixed(1)}%</span>
                      <span className="text-purple-400">${property.adr.toFixed(0)} ADR</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Seasonal Performance
              </CardTitle>
              <CardDescription>Revenue patterns by season</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {revenue.seasonalTrends.map((season) => (
                  <div key={season.season} className="bg-neutral-800 rounded-lg p-4">
                    <h4 className="text-white font-medium capitalize mb-2">{season.season}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Avg Revenue</span>
                        <span className="text-white">{formatCurrency(season.averageRevenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Bookings</span>
                        <span className="text-white">{season.bookingCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Occupancy</span>
                        <span className="text-white">{season.occupancyRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Price Factor</span>
                        <span className={`${
                          season.priceMultiplier >= 1 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {season.priceMultiplier.toFixed(1)}x
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Expense Charts */}
      {selectedChart === 'expenses' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Expense Distribution
              </CardTitle>
              <CardDescription>Breakdown of expenses by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center mb-4">
                <PieChartComponent data={expenseChartData} size={200} />
              </div>
              <div className="space-y-2">
                {expenseChartData.map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm text-neutral-300 capitalize">{category.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-white">{formatCurrency(category.value)}</span>
                      <span className="text-xs text-neutral-400 ml-2">({category.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Expense Categories
              </CardTitle>
              <CardDescription>Monthly expense breakdown by category</CardDescription>
            </CardHeader>
            <CardContent>
              <BarChart data={expenseChartData} height={250} />
              <div className="mt-4 space-y-2">
                {expenseChartData.slice(0, 5).map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-neutral-800 rounded">
                    <span className="text-sm text-neutral-300 capitalize">{category.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white">{formatCurrency(category.value)}</span>
                      <Badge className={`text-xs ${
                        category.trend >= 0 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                      }`}>
                        {category.trend >= 0 ? '+' : ''}{category.trend.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
