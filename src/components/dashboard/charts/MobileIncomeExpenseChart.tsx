'use client'

import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react'

interface ChartData {
  month: string
  income: number
  expenses: number
  net: number
}

interface MobileIncomeExpenseChartProps {
  data: ChartData[]
  currency?: string
}

// Custom tooltip for mobile
interface TooltipPayload {
  value: number
  name: string
  color: string
  dataKey: string
  payload: ChartData
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}

export function MobileIncomeExpenseChart({ data, currency = 'USD' }: MobileIncomeExpenseChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('6m')

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatFullCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Calculate summary metrics
  const totalIncome = data.reduce((sum, item) => sum + item.income, 0)
  const totalExpenses = data.reduce((sum, item) => sum + item.expenses, 0)
  const netProfit = totalIncome - totalExpenses
  const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100) : 0

  // Get latest month data for trends
  const latestMonth = data[data.length - 1]
  const previousMonth = data[data.length - 2]
  const incomeChange = previousMonth ? ((latestMonth.income - previousMonth.income) / previousMonth.income) * 100 : 0
  const expenseChange = previousMonth ? ((latestMonth.expenses - previousMonth.expenses) / previousMonth.expenses) * 100 : 0

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-neutral-900/95 backdrop-blur-sm border border-neutral-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium mb-2 text-sm">{label}</p>
          {payload.map((entry: TooltipPayload, index: number) => {
            const displayName = entry.dataKey === 'income' ? 'Income' :
                               entry.dataKey === 'expenses' ? 'Expenses' :
                               entry.dataKey === 'net' ? 'Net Profit' : entry.name
            return (
              <p key={index} className="text-xs" style={{ color: entry.color }}>
                {displayName}: {formatFullCurrency(entry.value)}
              </p>
            )
          })}
        </div>
      )
    }
    return null
  }

  // Fallback state when no data
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center p-6">
        <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-4">
          <DollarSign className="w-8 h-8 text-neutral-500" />
        </div>
        <h3 className="text-white font-medium mb-2">No Financial Data</h3>
        <p className="text-neutral-400 text-sm mb-4">
          Start adding properties and bookings to see your financial overview
        </p>
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <Calendar className="w-4 h-4" />
          <span>Data will appear here once available</span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Mobile Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-4 px-1">
        {/* Total Income */}
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
              <TrendingUp className="w-3 h-3 text-green-400" />
            </div>
            {incomeChange !== 0 && (
              <span className={`text-xs font-medium ${incomeChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {incomeChange > 0 ? '+' : ''}{incomeChange.toFixed(1)}%
              </span>
            )}
          </div>
          <div className="text-white font-semibold text-sm">{formatCurrency(totalIncome)}</div>
          <div className="text-green-400 text-xs font-medium">Total Income</div>
        </div>

        {/* Total Expenses */}
        <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center">
              <TrendingDown className="w-3 h-3 text-red-400" />
            </div>
            {expenseChange !== 0 && (
              <span className={`text-xs font-medium ${expenseChange > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {expenseChange > 0 ? '+' : ''}{expenseChange.toFixed(1)}%
              </span>
            )}
          </div>
          <div className="text-white font-semibold text-sm">{formatCurrency(totalExpenses)}</div>
          <div className="text-red-400 text-xs font-medium">Total Expenses</div>
        </div>
      </div>

      {/* Net Profit Summary */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-semibold text-lg">{formatCurrency(netProfit)}</div>
            <div className="text-blue-400 text-xs font-medium">Net Profit (6 months)</div>
          </div>
          <div className="text-right">
            <div className={`text-sm font-medium ${profitMargin > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {profitMargin.toFixed(1)}%
            </div>
            <div className="text-neutral-400 text-xs">Profit Margin</div>
          </div>
        </div>
      </div>

      {/* Compact Chart */}
      <div className="flex-1 min-h-[200px] bg-neutral-900/30 rounded-lg border border-neutral-800/50 p-3">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-white font-medium text-sm">6-Month Trend</h4>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-neutral-400">Income</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <span className="text-neutral-400">Expenses</span>
            </div>
          </div>
        </div>
        
        <div className="h-[160px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 5,
                left: 5,
                bottom: 5,
              }}
            >
              <XAxis
                dataKey="month"
                stroke="#6B7280"
                fontSize={10}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
              />
              <YAxis
                stroke="#6B7280"
                fontSize={10}
                tickFormatter={formatCurrency}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
                width={35}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: '#10B981', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 4, stroke: '#10B981', strokeWidth: 2, fill: '#10B981' }}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#EF4444"
                strokeWidth={2}
                dot={{ fill: '#EF4444', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 4, stroke: '#EF4444', strokeWidth: 2, fill: '#EF4444' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Touch-friendly interaction hint */}
      <div className="mt-3 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          <span className="text-blue-400 text-xs font-medium">Touch chart points for details</span>
        </div>
      </div>
    </div>
  )
}
