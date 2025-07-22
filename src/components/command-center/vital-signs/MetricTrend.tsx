'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface MetricTrendProps {
  trend: 'up' | 'down' | 'stable'
  size?: 'sm' | 'md' | 'lg'
}

export default function MetricTrend({ trend, size = 'sm' }: MetricTrendProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  const getTrendConfig = () => {
    switch (trend) {
      case 'up':
        return {
          icon: TrendingUp,
          color: 'text-green-400',
          bg: 'bg-green-900/20'
        }
      case 'down':
        return {
          icon: TrendingDown,
          color: 'text-red-400',
          bg: 'bg-red-900/20'
        }
      default:
        return {
          icon: Minus,
          color: 'text-gray-400',
          bg: 'bg-gray-900/20'
        }
    }
  }

  const { icon: Icon, color, bg } = getTrendConfig()

  return (
    <div className={`rounded-full p-0.5 ${bg}`}>
      <Icon className={`${sizeClasses[size]} ${color}`} />
    </div>
  )
}
