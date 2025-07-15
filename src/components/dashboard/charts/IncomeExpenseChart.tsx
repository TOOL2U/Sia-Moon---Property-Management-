'use client'

import { useState, useEffect } from 'react'
import { DynamicChartWrapper } from './DynamicChartWrapper'

interface ChartData {
  month: string
  income: number
  expenses: number
  net: number
}

interface IncomeExpenseChartProps {
  data: ChartData[]
  currency?: string
}

// Recharts tooltip types
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

export function IncomeExpenseChart({ data, currency = 'USD' }: IncomeExpenseChartProps) {
  const [ChartComponents, setChartComponents] = useState<any>(null)

  useEffect(() => {
    // Dynamically import recharts to avoid SSR issues
    import('recharts').then((recharts) => {
      setChartComponents(recharts)
    })
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium mb-2">{label}</p>
          {payload.map((entry: TooltipPayload, index: number) => {
            const displayName = entry.dataKey === 'income' ? 'Income' :
                               entry.dataKey === 'expenses' ? 'Expenses' :
                               entry.dataKey === 'net' ? 'Net Income' : entry.name
            return (
              <p key={index} className="text-sm" style={{ color: entry.color }}>
                {displayName}: {formatCurrency(entry.value)}
              </p>
            )
          })}
        </div>
      )
    }
    return null
  }

  if (!ChartComponents) {
    return <DynamicChartWrapper>{null}</DynamicChartWrapper>
  }

  const { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = ChartComponents

  return (
    <DynamicChartWrapper>
      <div className="w-[80%] mx-auto h-full"> {/* Updated width to 80% and centered using mx-auto */}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          <defs>
            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity={0.8}/>
              <stop offset="100%" stopColor="#10B981" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" stopOpacity={0.8}/>
              <stop offset="100%" stopColor="#EF4444" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis
            dataKey="month"
            stroke="#9CA3AF"
            fontSize={12}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            stroke="#9CA3AF"
            fontSize={12}
            tickFormatter={formatCurrency}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="income"
            stroke="#10B981"
            strokeWidth={2}
            fill="url(#incomeGradient)"
            dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2, fill: '#10B981' }}
          />
          <Area
            type="monotone"
            dataKey="expenses"
            stroke="#EF4444"
            strokeWidth={2}
            fill="url(#expenseGradient)"
            dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#EF4444', strokeWidth: 2, fill: '#EF4444' }}
          />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </DynamicChartWrapper>
  )
}
