'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  Info,
  Zap,
  Brain,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Settings,
  Download
} from 'lucide-react'
import { FinancialForecast, MonthlyProjection, ForecastScenario } from '@/types/financial'

interface FinancialForecastingProps {
  forecast: FinancialForecast
  loading?: boolean
  onUpdateAssumptions?: (assumptions: any[]) => void
  onGenerateScenario?: (scenario: string) => void
}

export default function FinancialForecasting({ 
  forecast, 
  loading,
  onUpdateAssumptions,
  onGenerateScenario 
}: FinancialForecastingProps) {
  const [selectedScenario, setSelectedScenario] = useState<'optimistic' | 'realistic' | 'pessimistic'>('realistic')
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'expense' | 'profit' | 'occupancy'>('revenue')
  const [forecastPeriod, setForecastPeriod] = useState<6 | 12 | 24>(12)

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-400'
    if (confidence >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-500/20 text-green-400 border-green-500/30'
    if (confidence >= 60) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    return 'bg-red-500/20 text-red-400 border-red-500/30'
  }

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <ArrowUpRight className="h-4 w-4 text-green-400" />
    if (current < previous) return <ArrowDownRight className="h-4 w-4 text-red-400" />
    return <Minus className="h-4 w-4 text-yellow-400" />
  }

  const getScenarioColor = (scenario: ForecastScenario) => {
    switch (scenario.name) {
      case 'optimistic':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'realistic':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'pessimistic':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30'
    }
  }

  const getCurrentProjections = () => {
    switch (selectedMetric) {
      case 'revenue':
        return forecast.revenueProjection
      case 'expense':
        return forecast.expenseProjection
      case 'profit':
        return forecast.profitProjection
      case 'occupancy':
        return forecast.occupancyProjection
      default:
        return forecast.revenueProjection
    }
  }

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'revenue':
        return <TrendingUp className="h-4 w-4" />
      case 'expense':
        return <TrendingDown className="h-4 w-4" />
      case 'profit':
        return <Target className="h-4 w-4" />
      case 'occupancy':
        return <Activity className="h-4 w-4" />
      default:
        return <BarChart3 className="h-4 w-4" />
    }
  }

  const calculateScenarioImpact = (baseValue: number, scenario: ForecastScenario, isRevenue: boolean = true) => {
    const multiplier = isRevenue ? scenario.revenueMultiplier : scenario.expenseMultiplier
    return baseValue * multiplier
  }

  return (
    <div className="space-y-6">
      {/* Forecast Overview */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Financial Forecasting & Predictive Analytics
              </CardTitle>
              <CardDescription>
                {forecast.forecastPeriod.months}-month forecast • {formatPercentage(forecast.confidence)} overall confidence
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                onClick={() => onUpdateAssumptions?.(forecast.assumptions)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Adjust Assumptions
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Forecast
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-neutral-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <span className="text-sm text-neutral-400">Revenue Forecast</span>
              </div>
              <p className="text-2xl font-bold text-green-400">
                {formatCurrency(forecast.revenueProjection.reduce((sum, p) => sum + p.projected, 0))}
              </p>
              <p className="text-xs text-neutral-500">Next 12 months</p>
            </div>
            
            <div className="bg-neutral-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-red-400" />
                <span className="text-sm text-neutral-400">Expense Forecast</span>
              </div>
              <p className="text-2xl font-bold text-red-400">
                {formatCurrency(forecast.expenseProjection.reduce((sum, p) => sum + p.projected, 0))}
              </p>
              <p className="text-xs text-neutral-500">Next 12 months</p>
            </div>
            
            <div className="bg-neutral-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-neutral-400">Profit Forecast</span>
              </div>
              <p className={`text-2xl font-bold ${
                forecast.profitProjection.reduce((sum, p) => sum + p.projected, 0) >= 0 ? 'text-blue-400' : 'text-red-400'
              }`}>
                {formatCurrency(forecast.profitProjection.reduce((sum, p) => sum + p.projected, 0))}
              </p>
              <p className="text-xs text-neutral-500">Next 12 months</p>
            </div>
            
            <div className="bg-neutral-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-purple-400" />
                <span className="text-sm text-neutral-400">Avg Occupancy</span>
              </div>
              <p className="text-2xl font-bold text-purple-400">
                {(forecast.occupancyProjection.reduce((sum, p) => sum + p.projected, 0) / forecast.occupancyProjection.length).toFixed(1)}%
              </p>
              <p className="text-xs text-neutral-500">Projected average</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scenario Analysis */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Scenario Analysis
          </CardTitle>
          <CardDescription>Compare different business scenarios and their financial impact</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Scenario Selector */}
            <div className="flex flex-wrap gap-2">
              {forecast.scenarios.map((scenario) => (
                <Button
                  key={scenario.name}
                  onClick={() => setSelectedScenario(scenario.name)}
                  variant={selectedScenario === scenario.name ? 'default' : 'outline'}
                  className={`${
                    selectedScenario === scenario.name
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                  } flex items-center gap-2`}
                >
                  {scenario.name.charAt(0).toUpperCase() + scenario.name.slice(1)}
                  <Badge className={getScenarioColor(scenario)}>
                    {formatPercentage(scenario.probability)}
                  </Badge>
                </Button>
              ))}
            </div>

            {/* Scenario Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {forecast.scenarios.map((scenario) => (
                <Card key={scenario.name} className={`bg-neutral-800 border-neutral-700 ${
                  selectedScenario === scenario.name ? 'ring-2 ring-blue-500' : ''
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-lg capitalize">{scenario.name}</CardTitle>
                      <Badge className={getScenarioColor(scenario)}>
                        {formatPercentage(scenario.probability)}
                      </Badge>
                    </div>
                    <CardDescription>{scenario.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Revenue Impact</span>
                      <span className={`font-medium ${
                        scenario.revenueMultiplier >= 1 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {scenario.revenueMultiplier >= 1 ? '+' : ''}{((scenario.revenueMultiplier - 1) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Expense Impact</span>
                      <span className={`font-medium ${
                        scenario.expenseMultiplier <= 1 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {scenario.expenseMultiplier >= 1 ? '+' : ''}{((scenario.expenseMultiplier - 1) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="border-t border-neutral-700 pt-2">
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Projected Revenue</span>
                        <span className="text-white font-medium">
                          {formatCurrency(calculateScenarioImpact(
                            forecast.revenueProjection.reduce((sum, p) => sum + p.projected, 0),
                            scenario,
                            true
                          ))}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Projections */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Monthly Projections
              </CardTitle>
              <CardDescription>Detailed month-by-month financial forecasts</CardDescription>
            </div>
            <div className="flex gap-2">
              {['revenue', 'expense', 'profit', 'occupancy'].map((metric) => (
                <Button
                  key={metric}
                  onClick={() => setSelectedMetric(metric as any)}
                  variant={selectedMetric === metric ? 'default' : 'outline'}
                  size="sm"
                  className={`${
                    selectedMetric === metric
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                  } flex items-center gap-1`}
                >
                  {getMetricIcon(metric)}
                  {metric.charAt(0).toUpperCase() + metric.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {getCurrentProjections().slice(0, 12).map((projection, index) => (
              <Card key={`${projection.month}-${projection.year}`} className="bg-neutral-800 border-neutral-700">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-sm">{projection.month} {projection.year}</CardTitle>
                    <Badge className={getConfidenceBadge(projection.confidence)}>
                      {projection.confidence.toFixed(0)}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-neutral-400">Projected</p>
                    <p className="text-xl font-bold text-white">
                      {selectedMetric === 'occupancy' 
                        ? `${projection.projected.toFixed(1)}%`
                        : formatCurrency(projection.projected)
                      }
                    </p>
                  </div>
                  
                  {projection.actual !== undefined && (
                    <div>
                      <p className="text-sm text-neutral-400">Actual</p>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-medium text-green-400">
                          {selectedMetric === 'occupancy' 
                            ? `${projection.actual.toFixed(1)}%`
                            : formatCurrency(projection.actual)
                          }
                        </p>
                        {projection.variance !== undefined && (
                          <div className="flex items-center gap-1">
                            {getTrendIcon(projection.actual, projection.projected)}
                            <span className={`text-xs ${
                              projection.variance >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {projection.variance >= 0 ? '+' : ''}{projection.variance.toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {index > 0 && (
                    <div>
                      <p className="text-sm text-neutral-400">vs Previous Month</p>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(projection.projected, getCurrentProjections()[index - 1].projected)}
                        <span className={`text-xs ${
                          projection.projected > getCurrentProjections()[index - 1].projected ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {((projection.projected - getCurrentProjections()[index - 1].projected) / getCurrentProjections()[index - 1].projected * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Forecast Assumptions */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Info className="h-5 w-5" />
            Forecast Assumptions
          </CardTitle>
          <CardDescription>Key assumptions driving the financial projections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {forecast.assumptions.map((assumption, index) => (
              <div key={index} className="bg-neutral-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-medium">{assumption.category}</h4>
                  <Badge className={`${
                    assumption.impact === 'high' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                    assumption.impact === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                    'bg-green-500/20 text-green-400 border-green-500/30'
                  }`}>
                    {assumption.impact} impact
                  </Badge>
                </div>
                <p className="text-sm text-neutral-400 mb-2">{assumption.description}</p>
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold">
                    {assumption.value}%
                  </span>
                  {assumption.impact === 'high' && (
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                  )}
                  {assumption.impact === 'medium' && (
                    <Info className="h-4 w-4 text-yellow-400" />
                  )}
                  {assumption.impact === 'low' && (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Forecast Accuracy & Confidence */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="h-5 w-5" />
            Forecast Accuracy & Confidence
          </CardTitle>
          <CardDescription>Model performance and prediction reliability metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-neutral-800 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">Overall Confidence</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Model Confidence</span>
                  <Badge className={getConfidenceBadge(forecast.confidence)}>
                    {formatPercentage(forecast.confidence)}
                  </Badge>
                </div>
                <div className="w-full bg-neutral-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      forecast.confidence >= 80 ? 'bg-green-500' :
                      forecast.confidence >= 60 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${forecast.confidence}%` }}
                  />
                </div>
                <p className="text-xs text-neutral-500">
                  Based on {forecast.forecastPeriod.months} months of historical data
                </p>
              </div>
            </div>

            <div className="bg-neutral-800 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">Prediction Accuracy</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Revenue Accuracy</span>
                  <span className="text-green-400">92.3%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Expense Accuracy</span>
                  <span className="text-blue-400">88.7%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Occupancy Accuracy</span>
                  <span className="text-purple-400">85.1%</span>
                </div>
              </div>
            </div>

            <div className="bg-neutral-800 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">Risk Factors</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm text-neutral-300">Seasonal Volatility</span>
                </div>
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-neutral-300">Market Conditions</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-neutral-300">Historical Trends</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
