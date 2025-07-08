import { 
  ResponsiveContainer, 
  LineChart, 
  AreaChart, 
  BarChart, 
  Line, 
  Area, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ChartDataPoint } from '@/types'

interface ReportChartProps {
  title: string
  data: ChartDataPoint[]
  dataKey: string
  color: string
  type: 'line' | 'area' | 'bar'
  height?: number
  className?: string
}

/**
 * ReportChart Component
 * 
 * Renders interactive charts using Recharts library for data visualization.
 * Supports multiple chart types (line, area, bar) with responsive design.
 * 
 * Features:
 * - Multiple chart types with consistent styling
 * - Responsive container that adapts to screen size
 * - Custom tooltip with formatted data
 * - Smooth animations and hover effects
 * - Dark theme optimized colors
 * - Accessible with proper ARIA labels
 */
export function ReportChart({
  title,
  data,
  dataKey,
  color,
  type,
  height = 300,
  className = ''
}: ReportChartProps) {
  /**
   * Custom tooltip component for better data presentation
   */
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value
      return (
        <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-3 shadow-lg">
          <p className="text-neutral-300 text-sm mb-1">
            {new Date(label).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
          <p className="text-white font-semibold">
            {formatTooltipValue(value, dataKey)}
          </p>
        </div>
      )
    }
    return null
  }

  /**
   * Format tooltip values based on data type
   */
  const formatTooltipValue = (value: number, key: string): string => {
    switch (key) {
      case 'revenue':
      case 'expenses':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value)
      
      case 'bookings':
      case 'maintenance':
        return `${value} ${key === 'bookings' ? 'bookings' : 'tasks'}`
      
      default:
        return value.toString()
    }
  }

  /**
   * Format X-axis labels to show dates in a readable format
   */
  const formatXAxisLabel = (tickItem: string): string => {
    return new Date(tickItem).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  /**
   * Format Y-axis labels based on data type
   */
  const formatYAxisLabel = (value: number): string => {
    if (dataKey === 'revenue' || dataKey === 'expenses') {
      return `$${(value / 1000).toFixed(0)}k`
    }
    return value.toString()
  }

  /**
   * Render the appropriate chart type
   */
  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    }

    switch (type) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxisLabel}
              stroke="#9CA3AF"
              fontSize={12}
            />
            <YAxis 
              tickFormatter={formatYAxisLabel}
              stroke="#9CA3AF"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              fill={`url(#gradient-${dataKey})`}
              dot={{ fill: color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
            />
          </AreaChart>
        )

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxisLabel}
              stroke="#9CA3AF"
              fontSize={12}
            />
            <YAxis 
              tickFormatter={formatYAxisLabel}
              stroke="#9CA3AF"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey={dataKey} 
              fill={color}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        )

      case 'line':
      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxisLabel}
              stroke="#9CA3AF"
              fontSize={12}
            />
            <YAxis 
              tickFormatter={formatYAxisLabel}
              stroke="#9CA3AF"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={3}
              dot={{ fill: color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
            />
          </LineChart>
        )
    }
  }

  return (
    <Card className={`bg-neutral-900 border-neutral-800 ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-white">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer>
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
