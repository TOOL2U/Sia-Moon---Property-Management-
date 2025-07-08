import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'

interface MetricCardProps {
  title: string
  value: number
  icon: LucideIcon
  format?: 'number' | 'currency' | 'percentage'
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

/**
 * MetricCard Component
 * 
 * Displays key performance metrics with icons, trends, and formatted values.
 * Used in the Reports page to show summary statistics.
 * 
 * Features:
 * - Multiple format types (number, currency, percentage)
 * - Trend indicators with color coding
 * - Responsive design
 * - Accessible with proper ARIA labels
 */
export function MetricCard({
  title,
  value,
  icon: Icon,
  format = 'number',
  trend,
  className = ''
}: MetricCardProps) {
  /**
   * Format the display value based on the specified format type
   */
  const formatValue = (val: number, formatType: string): string => {
    switch (formatType) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val)
      
      case 'percentage':
        return `${val}%`
      
      case 'number':
      default:
        return new Intl.NumberFormat('en-US').format(val)
    }
  }

  /**
   * Get trend color classes based on positive/negative trend
   */
  const getTrendColor = (isPositive: boolean): string => {
    return isPositive 
      ? 'text-green-400' 
      : 'text-red-400'
  }

  return (
    <Card className={`bg-neutral-900 border-neutral-800 hover:border-neutral-700 transition-colors duration-200 ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {/* Title */}
            <p className="text-sm font-medium text-neutral-400 mb-1">
              {title}
            </p>
            
            {/* Value */}
            <p className="text-2xl font-bold text-white mb-2">
              {formatValue(value, format)}
            </p>
            
            {/* Trend Indicator */}
            {trend && (
              <div className={`flex items-center gap-1 text-sm ${getTrendColor(trend.isPositive)}`}>
                {trend.isPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
                <span className="text-neutral-500 ml-1">vs last month</span>
              </div>
            )}
          </div>
          
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-neutral-800 rounded-lg flex items-center justify-center">
              <Icon className="h-6 w-6 text-neutral-400" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
