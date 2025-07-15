'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Calendar,
  Target,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Info
} from 'lucide-react'
import { FinancialKPIs, FinancialMetric } from '@/types/financial'

interface FinancialKPIsDashboardProps {
  kpis: FinancialKPIs
  loading?: boolean
}

export default function FinancialKPIsDashboard({ kpis, loading }: FinancialKPIsDashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<'revenue' | 'operational' | 'financial'>('revenue')

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="bg-neutral-900 border-neutral-800 animate-pulse">
            <CardHeader>
              <div className="h-4 bg-neutral-700 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-neutral-700 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-neutral-700 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Organize KPIs into categories
  const revenueKPIs: FinancialMetric[] = [
    {
      name: 'Average Daily Rate (ADR)',
      value: kpis.adr,
      previousValue: kpis.adr * 0.95,
      change: kpis.adr * 0.05,
      changePercentage: 5.2,
      trend: 'up',
      target: kpis.adr * 1.1,
      status: 'good'
    },
    {
      name: 'Revenue per Available Room (RevPAR)',
      value: kpis.revPAR,
      previousValue: kpis.revPAR * 0.92,
      change: kpis.revPAR * 0.08,
      changePercentage: 8.7,
      trend: 'up',
      target: kpis.revPAR * 1.15,
      status: 'good'
    },
    {
      name: 'Average Booking Value',
      value: kpis.averageBookingValue,
      previousValue: kpis.averageBookingValue * 0.97,
      change: kpis.averageBookingValue * 0.03,
      changePercentage: 3.1,
      trend: 'up',
      target: kpis.averageBookingValue * 1.2,
      status: 'good'
    }
  ]

  const operationalKPIs: FinancialMetric[] = [
    {
      name: 'Occupancy Rate',
      value: kpis.occupancyRate,
      previousValue: kpis.occupancyRate - 5.2,
      change: 5.2,
      changePercentage: 7.3,
      trend: 'up',
      target: 85,
      status: kpis.occupancyRate >= 80 ? 'good' : kpis.occupancyRate >= 70 ? 'warning' : 'critical'
    },
    {
      name: 'Booking Conversion Rate',
      value: kpis.bookingConversionRate,
      previousValue: kpis.bookingConversionRate - 2.1,
      change: 2.1,
      changePercentage: 2.5,
      trend: 'up',
      target: 90,
      status: kpis.bookingConversionRate >= 85 ? 'good' : kpis.bookingConversionRate >= 75 ? 'warning' : 'critical'
    },
    {
      name: 'Customer Acquisition Cost',
      value: kpis.customerAcquisitionCost,
      previousValue: kpis.customerAcquisitionCost + 5.25,
      change: -5.25,
      changePercentage: -10.3,
      trend: 'down',
      target: 40,
      status: kpis.customerAcquisitionCost <= 50 ? 'good' : kpis.customerAcquisitionCost <= 70 ? 'warning' : 'critical'
    }
  ]

  const financialKPIs: FinancialMetric[] = [
    {
      name: 'Gross Margin',
      value: kpis.grossMargin,
      previousValue: kpis.grossMargin - 1.8,
      change: 1.8,
      changePercentage: 2.9,
      trend: 'up',
      target: 70,
      status: kpis.grossMargin >= 60 ? 'good' : kpis.grossMargin >= 45 ? 'warning' : 'critical'
    },
    {
      name: 'Net Margin',
      value: kpis.netMargin,
      previousValue: kpis.netMargin - 0.9,
      change: 0.9,
      changePercentage: 2.1,
      trend: 'up',
      target: 25,
      status: kpis.netMargin >= 20 ? 'good' : kpis.netMargin >= 10 ? 'warning' : 'critical'
    },
    {
      name: 'Return on Investment',
      value: kpis.returnOnInvestment,
      previousValue: kpis.returnOnInvestment - 0.7,
      change: 0.7,
      changePercentage: 5.9,
      trend: 'up',
      target: 15,
      status: kpis.returnOnInvestment >= 12 ? 'good' : kpis.returnOnInvestment >= 8 ? 'warning' : 'critical'
    },
    {
      name: 'Current Ratio',
      value: kpis.currentRatio,
      previousValue: kpis.currentRatio + 0.1,
      change: -0.1,
      changePercentage: -4.5,
      trend: 'down',
      target: 2.5,
      status: kpis.currentRatio >= 2 ? 'good' : kpis.currentRatio >= 1.5 ? 'warning' : 'critical'
    },
    {
      name: 'Cash Flow Ratio',
      value: kpis.cashFlowRatio,
      previousValue: kpis.cashFlowRatio - 0.05,
      change: 0.05,
      changePercentage: 4.2,
      trend: 'up',
      target: 1.5,
      status: kpis.cashFlowRatio >= 1.2 ? 'good' : kpis.cashFlowRatio >= 1 ? 'warning' : 'critical'
    },
    {
      name: 'Customer Lifetime Value',
      value: kpis.customerLifetimeValue,
      previousValue: kpis.customerLifetimeValue - 125,
      change: 125,
      changePercentage: 11.1,
      trend: 'up',
      target: 1500,
      status: kpis.customerLifetimeValue >= 1200 ? 'good' : kpis.customerLifetimeValue >= 800 ? 'warning' : 'critical'
    }
  ]

  const getCurrentKPIs = () => {
    switch (selectedCategory) {
      case 'revenue':
        return revenueKPIs
      case 'operational':
        return operationalKPIs
      case 'financial':
        return financialKPIs
      default:
        return revenueKPIs
    }
  }

  const formatValue = (metric: FinancialMetric) => {
    if (metric.name.includes('Rate') || metric.name.includes('Margin') || metric.name.includes('ROI')) {
      return `${metric.value.toFixed(1)}%`
    } else if (metric.name.includes('Cost') || metric.name.includes('Value') || metric.name.includes('ADR') || metric.name.includes('RevPAR')) {
      return `$${metric.value.toLocaleString()}`
    } else {
      return metric.value.toFixed(2)
    }
  }

  const formatTarget = (metric: FinancialMetric) => {
    if (!metric.target) return null
    
    if (metric.name.includes('Rate') || metric.name.includes('Margin') || metric.name.includes('ROI')) {
      return `${metric.target.toFixed(1)}%`
    } else if (metric.name.includes('Cost') || metric.name.includes('Value') || metric.name.includes('ADR') || metric.name.includes('RevPAR')) {
      return `$${metric.target.toLocaleString()}`
    } else {
      return metric.target.toFixed(2)
    }
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="h-4 w-4 text-green-400" />
      case 'down':
        return <ArrowDownRight className="h-4 w-4 text-red-400" />
      case 'stable':
        return <Minus className="h-4 w-4 text-yellow-400" />
    }
  }

  const getStatusColor = (status: 'good' | 'warning' | 'critical') => {
    switch (status) {
      case 'good':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'critical':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'revenue':
        return <DollarSign className="h-4 w-4" />
      case 'operational':
        return <BarChart3 className="h-4 w-4" />
      case 'financial':
        return <PieChart className="h-4 w-4" />
      default:
        return <Target className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Category Selector */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'revenue', label: 'Revenue KPIs', icon: DollarSign },
          { key: 'operational', label: 'Operational KPIs', icon: BarChart3 },
          { key: 'financial', label: 'Financial KPIs', icon: PieChart }
        ].map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            onClick={() => setSelectedCategory(key as any)}
            variant={selectedCategory === key ? 'default' : 'outline'}
            className={`${
              selectedCategory === key
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'border-neutral-700 text-neutral-300 hover:bg-neutral-800'
            }`}
          >
            <Icon className="h-4 w-4 mr-2" />
            {label}
          </Button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getCurrentKPIs().map((metric) => (
          <Card key={metric.name} className="bg-neutral-900 border-neutral-800 hover:border-neutral-700 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
                  {getCategoryIcon(selectedCategory)}
                  {metric.name}
                </CardTitle>
                <Badge className={getStatusColor(metric.status)}>
                  {metric.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Value */}
              <div>
                <p className="text-3xl font-bold text-white mb-1">
                  {formatValue(metric)}
                </p>
                {metric.changePercentage && (
                  <div className="flex items-center gap-1">
                    {getTrendIcon(metric.trend)}
                    <span className={`text-sm ${
                      metric.trend === 'up' ? 'text-green-400' : 
                      metric.trend === 'down' ? 'text-red-400' : 
                      'text-yellow-400'
                    }`}>
                      {metric.changePercentage > 0 ? '+' : ''}{metric.changePercentage.toFixed(1)}% vs last period
                    </span>
                  </div>
                )}
              </div>

              {/* Target Progress */}
              {metric.target && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">Target: {formatTarget(metric)}</span>
                    <span className="text-neutral-400">
                      {((metric.value / metric.target) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-neutral-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        metric.value >= metric.target ? 'bg-green-500' :
                        metric.value >= metric.target * 0.8 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ 
                        width: `${Math.min((metric.value / metric.target) * 100, 100)}%` 
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Additional Info */}
              <div className="text-xs text-neutral-500 flex items-center gap-1">
                <Info className="h-3 w-3" />
                <span>
                  {metric.name.includes('Rate') || metric.name.includes('Margin') ? 
                    'Higher is better' : 
                    metric.name.includes('Cost') ? 
                    'Lower is better' : 
                    'Performance indicator'
                  }
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Stats */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="h-5 w-5" />
            KPI Summary - {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Metrics
          </CardTitle>
          <CardDescription>
            Performance overview for {getCurrentKPIs().length} key indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-neutral-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-neutral-400">Good Performance</span>
              </div>
              <p className="text-2xl font-bold text-green-400">
                {getCurrentKPIs().filter(k => k.status === 'good').length}
              </p>
            </div>
            
            <div className="bg-neutral-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-neutral-400">Needs Attention</span>
              </div>
              <p className="text-2xl font-bold text-yellow-400">
                {getCurrentKPIs().filter(k => k.status === 'warning').length}
              </p>
            </div>
            
            <div className="bg-neutral-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-neutral-400">Critical Issues</span>
              </div>
              <p className="text-2xl font-bold text-red-400">
                {getCurrentKPIs().filter(k => k.status === 'critical').length}
              </p>
            </div>
            
            <div className="bg-neutral-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-3 h-3 text-blue-400" />
                <span className="text-sm text-neutral-400">Improving Trends</span>
              </div>
              <p className="text-2xl font-bold text-blue-400">
                {getCurrentKPIs().filter(k => k.trend === 'up').length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
