'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Home,
  Users,
  ChevronRight,
  Info
} from 'lucide-react'
import { cn } from '@/utils/cn'

interface SummaryMetrics {
  totalIncomeThisMonth: number
  totalExpensesThisMonth: number
  netProfitThisMonth: number
  occupancyRateThisMonth: number
  upcomingBookingsCount: number
  
  // Trend data (compared to last month)
  incomeChange: number
  expensesChange: number
  profitChange: number
  occupancyChange: number
  bookingsChange: number
  
  currency?: string
}

interface SummaryCardsGridProps {
  metrics: SummaryMetrics
  onCardTap?: (cardType: string) => void
  className?: string
}

export function SummaryCardsGrid({ 
  metrics, 
  onCardTap,
  className 
}: SummaryCardsGridProps) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  const formatCurrency = (value: number, compact = false) => {
    const currency = metrics.currency || 'USD'
    
    if (compact && value >= 1000) {
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`
      } else if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`
      }
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const getTrendIcon = (change: number) => {
    if (change > 0) {
      return <TrendingUp className="w-3 h-3 text-green-400" />
    } else if (change < 0) {
      return <TrendingDown className="w-3 h-3 text-red-400" />
    }
    return null
  }

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-400'
    if (change < 0) return 'text-red-400'
    return 'text-neutral-400'
  }

  const handleCardTap = (cardType: string) => {
    setExpandedCard(expandedCard === cardType ? null : cardType)
    onCardTap?.(cardType)
  }

  const cards = [
    {
      id: 'income',
      title: 'Total Income',
      subtitle: 'This Month',
      value: metrics.totalIncomeThisMonth,
      change: metrics.incomeChange,
      icon: DollarSign,
      gradient: 'from-green-500/10 to-green-600/5',
      border: 'border-green-500/20',
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-400'
    },
    {
      id: 'expenses',
      title: 'Total Expenses',
      subtitle: 'This Month',
      value: metrics.totalExpensesThisMonth,
      change: metrics.expensesChange,
      icon: TrendingDown,
      gradient: 'from-red-500/10 to-red-600/5',
      border: 'border-red-500/20',
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-400'
    },
    {
      id: 'profit',
      title: 'Net Profit',
      subtitle: 'This Month',
      value: metrics.netProfitThisMonth,
      change: metrics.profitChange,
      icon: TrendingUp,
      gradient: 'from-blue-500/10 to-purple-500/10',
      border: 'border-blue-500/20',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400'
    },
    {
      id: 'occupancy',
      title: 'Occupancy Rate',
      subtitle: 'This Month',
      value: metrics.occupancyRateThisMonth,
      change: metrics.occupancyChange,
      icon: Home,
      gradient: 'from-purple-500/10 to-pink-500/10',
      border: 'border-purple-500/20',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-400',
      isPercentage: true
    },
    {
      id: 'bookings',
      title: 'Upcoming Bookings',
      subtitle: 'Next 30 Days',
      value: metrics.upcomingBookingsCount,
      change: metrics.bookingsChange,
      icon: Calendar,
      gradient: 'from-orange-500/10 to-yellow-500/10',
      border: 'border-orange-500/20',
      iconBg: 'bg-orange-500/20',
      iconColor: 'text-orange-400',
      isCount: true
    }
  ]

  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4', className)}>
      {cards.map((card) => {
        const Icon = card.icon
        const isExpanded = expandedCard === card.id
        
        return (
          <Card
            key={card.id}
            className={cn(
              'cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]',
              'bg-gradient-to-br backdrop-blur-sm',
              card.gradient,
              card.border,
              isExpanded && 'ring-2 ring-blue-500/50 scale-[1.02]'
            )}
            onClick={() => handleCardTap(card.id)}
          >
            <CardContent className="p-3 md:p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', card.iconBg)}>
                  <Icon className={cn('w-4 h-4', card.iconColor)} />
                </div>
                <div className="flex items-center gap-1">
                  {getTrendIcon(card.change)}
                  <ChevronRight className="w-3 h-3 text-neutral-500" />
                </div>
              </div>

              {/* Value */}
              <div className="mb-2">
                <div className="text-white font-bold text-lg md:text-xl">
                  {card.isPercentage 
                    ? `${card.value.toFixed(1)}%`
                    : card.isCount 
                      ? card.value.toString()
                      : formatCurrency(card.value, true)
                  }
                </div>
                <div className="text-neutral-400 text-xs font-medium">
                  {card.title}
                </div>
              </div>

              {/* Trend */}
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 text-xs">
                  {card.subtitle}
                </span>
                <span className={cn('text-xs font-medium', getTrendColor(card.change))}>
                  {formatPercentage(card.change)}
                </span>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-neutral-700/50">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-400">Last Month:</span>
                      <span className="text-neutral-300">
                        {card.isPercentage 
                          ? `${(card.value - card.change).toFixed(1)}%`
                          : card.isCount 
                            ? Math.round(card.value - (card.value * card.change / 100)).toString()
                            : formatCurrency(card.value - (card.value * card.change / 100), true)
                        }
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-400">Change:</span>
                      <span className={getTrendColor(card.change)}>
                        {formatPercentage(card.change)}
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full mt-2 text-xs h-7"
                    onClick={(e) => {
                      e.stopPropagation()
                      onCardTap?.(card.id)
                    }}
                  >
                    View Details
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// Fallback component for when no data is available
export function SummaryCardsGridSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4', className)}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Card key={index} className="bg-neutral-900/50 border-neutral-800">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 bg-neutral-800 rounded-full animate-pulse" />
              <div className="w-4 h-4 bg-neutral-800 rounded animate-pulse" />
            </div>
            <div className="mb-2">
              <div className="h-6 bg-neutral-800 rounded animate-pulse mb-1" />
              <div className="h-3 bg-neutral-800 rounded animate-pulse w-2/3" />
            </div>
            <div className="flex items-center justify-between">
              <div className="h-3 bg-neutral-800 rounded animate-pulse w-1/2" />
              <div className="h-3 bg-neutral-800 rounded animate-pulse w-1/4" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
