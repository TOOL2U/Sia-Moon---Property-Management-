'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { TrendingUp, DollarSign, BarChart3, PieChart, Calendar, Download, AlertTriangle } from 'lucide-react'

export default function MonthlySummaryPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [summary, setSummary] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState('2025-07')

  const generateMonthlySummary = async () => {
    setIsGenerating(true)
    setError(null)
    setSummary(null)

    try {
      console.log(`📈 Generating Monthly Financial Summary for ${selectedMonth}`)

      // Import the function dynamically
      const { generateMonthlySummary } = await import('@/lib/ai/simulateAIActions')
      
      const result = await generateMonthlySummary(selectedMonth)
      console.log('💰 Monthly Summary Result:', result)

      setSummary(result)

    } catch (err) {
      console.error('❌ Monthly summary generation failed:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsGenerating(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `฿${amount.toLocaleString()}`
  }

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-green-400'
    if (variance < 0) return 'text-red-400'
    return 'text-slate-400'
  }

  const getVarianceBadge = (variance: number, isRevenue: boolean = true) => {
    const isPositive = isRevenue ? variance > 0 : variance < 0
    return (
      <Badge className={`${isPositive ? 'bg-green-600' : 'bg-red-600'} text-white`}>
        {variance > 0 ? '+' : ''}{variance.toFixed(1)}%
      </Badge>
    )
  }

  const exportSummary = () => {
    if (!summary) return
    
    const dataStr = JSON.stringify(summary, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `monthly-summary-${selectedMonth}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <BarChart3 className="w-10 h-10 text-green-400" />
            📈 Monthly Financial Summary
          </h1>
          <p className="text-green-200">
            AI CFO comprehensive financial analysis and reporting
          </p>
        </div>

        <Card className="bg-slate-800/50 border-green-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-400" />
              Generate Financial Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Select Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                >
                  <option value="2025-07">July 2025</option>
                  <option value="2025-06">June 2025</option>
                  <option value="2025-05">May 2025</option>
                  <option value="2025-04">April 2025</option>
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={generateMonthlySummary}
                  disabled={isGenerating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Generate Summary
                    </>
                  )}
                </Button>
                {summary && (
                  <Button
                    onClick={exportSummary}
                    variant="outline"
                    className="border-slate-600 text-slate-300"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="bg-red-900/50 border-red-700 mb-6">
            <CardHeader>
              <CardTitle className="text-red-200">❌ Generation Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-300">{error}</p>
            </CardContent>
          </Card>
        )}

        {summary && summary.success && (
          <div className="space-y-6">
            {/* Summary Header */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    💰 AI CFO Financial Summary
                  </span>
                  <Badge className="bg-green-600 text-white">
                    {summary.financialData?.reportMetadata?.monthName} {summary.financialData?.reportMetadata?.year}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {formatCurrency(summary.financialData?.revenue?.total || 0)}
                    </div>
                    <div className="text-sm text-slate-400">Total Revenue</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">
                      {formatCurrency(summary.financialData?.expenses?.total || 0)}
                    </div>
                    <div className="text-sm text-slate-400">Total Expenses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {formatCurrency(summary.financialData?.metrics?.grossProfit || 0)}
                    </div>
                    <div className="text-sm text-slate-400">Gross Profit</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {(summary.financialData?.metrics?.grossMargin || 0).toFixed(1)}%
                    </div>
                    <div className="text-sm text-slate-400">Profit Margin</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    Revenue Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-slate-300">
                  <div className="space-y-3">
                    {summary.financialData?.revenue && Object.entries(summary.financialData.revenue).map(([key, value]) => {
                      if (key === 'total') return null
                      return (
                        <div key={key} className="flex justify-between items-center">
                          <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="font-medium">{formatCurrency(value as number)}</span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-red-400" />
                    Expense Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-slate-300">
                  <div className="space-y-3">
                    {summary.financialData?.expenses && Object.entries(summary.financialData.expenses).map(([key, value]) => {
                      if (key === 'total') return null
                      return (
                        <div key={key} className="flex justify-between items-center">
                          <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="font-medium">{formatCurrency(value as number)}</span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Budget Analysis */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-yellow-400" />
                  Budget vs Actual Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-white font-semibold mb-3">Revenue Performance</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Target:</span>
                        <span>{formatCurrency(summary.financialData?.budget?.revenue?.target || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Actual:</span>
                        <span>{formatCurrency(summary.financialData?.budget?.revenue?.actual || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Variance:</span>
                        <div className="flex items-center gap-2">
                          <span className={getVarianceColor(summary.financialData?.budget?.revenue?.variance || 0)}>
                            {formatCurrency(summary.financialData?.budget?.revenue?.variance || 0)}
                          </span>
                          {getVarianceBadge(summary.financialData?.budget?.revenue?.variancePercent || 0, true)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-3">Expense Performance</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Target:</span>
                        <span>{formatCurrency(summary.financialData?.budget?.expenses?.target || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Actual:</span>
                        <span>{formatCurrency(summary.financialData?.budget?.expenses?.actual || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Variance:</span>
                        <div className="flex items-center gap-2">
                          <span className={getVarianceColor(-(summary.financialData?.budget?.expenses?.variance || 0))}>
                            {formatCurrency(summary.financialData?.budget?.expenses?.variance || 0)}
                          </span>
                          {getVarianceBadge(summary.financialData?.budget?.expenses?.variancePercent || 0, false)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Test Scenarios */}
            {summary.financialData?.testExpenses && summary.financialData.testExpenses.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-400" />
                    Test Scenario Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-slate-300">
                  <div className="space-y-3">
                    {summary.financialData.testExpenses.map((expense: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-slate-700/50 rounded">
                        <div>
                          <div className="font-medium">{expense.description}</div>
                          <div className="text-sm text-slate-400">Source: {expense.source}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(expense.amount)}</div>
                          {expense.status && (
                            <Badge className={`text-xs ${
                              expense.status === 'under_review' ? 'bg-yellow-600' : 'bg-green-600'
                            } text-white`}>
                              {expense.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI CFO Analysis */}
            {summary.summary && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">🤖 AI CFO Analysis & Recommendations</CardTitle>
                </CardHeader>
                <CardContent className="text-slate-300">
                  <div className="space-y-4">
                    {summary.summary.reason && (
                      <div>
                        <h3 className="text-white font-semibold mb-2">Financial Analysis</h3>
                        <p className="bg-slate-700 p-3 rounded">{summary.summary.reason}</p>
                      </div>
                    )}
                    
                    {summary.summary.recommendations && summary.summary.recommendations.length > 0 && (
                      <div>
                        <h3 className="text-white font-semibold mb-2">AI Recommendations</h3>
                        <ul className="space-y-2">
                          {summary.summary.recommendations.map((rec: string, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <TrendingUp className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="mt-4 p-4 bg-slate-700 rounded">
                      <h3 className="text-white font-semibold mb-2">Raw AI Response</h3>
                      <pre className="text-xs text-slate-300 overflow-auto max-h-32">
                        {JSON.stringify(summary.summary, null, 2)}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm">
            💡 This generates a comprehensive monthly financial summary with AI CFO analysis and insights
          </p>
        </div>
      </div>
    </div>
  )
}
