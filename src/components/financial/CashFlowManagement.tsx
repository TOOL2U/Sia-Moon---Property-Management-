'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  ArrowUpDown,
  ArrowUp, 
  ArrowDown, 
  DollarSign, 
  CreditCard,
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle,
  Filter,
  Download
} from 'lucide-react'
import { CashFlowData, PaymentMethodBreakdown, CashInflow, CashOutflow } from '@/types/financial'

interface CashFlowManagementProps {
  cashFlow: CashFlowData
  loading?: boolean
}

export default function CashFlowManagement({ cashFlow, loading }: CashFlowManagementProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('month')
  const [showProjections, setShowProjections] = useState(true)

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="bg-neutral-900 border-neutral-800 animate-pulse">
            <CardHeader>
              <div className="h-4 bg-neutral-700 rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-neutral-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'credit_card':
        return <CreditCard className="h-4 w-4" />
      case 'bank_transfer':
        return <ArrowUpDown className="h-4 w-4" />
      default:
        return <DollarSign className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'overdue':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Cash Flow Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <ArrowUp className="h-5 w-5" />
              Cash Inflows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-green-400">
                {formatCurrency(cashFlow.cashInflows.reduce((sum, inflow) => sum + inflow.amount, 0))}
              </p>
              <p className="text-sm text-neutral-400">
                {cashFlow.cashInflows.length} transactions
              </p>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-400" />
                <span className="text-xs text-green-400">+12.5% vs last period</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-600/20 to-orange-600/20 border-red-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <ArrowDown className="h-5 w-5" />
              Cash Outflows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-red-400">
                {formatCurrency(cashFlow.cashOutflows.reduce((sum, outflow) => sum + outflow.amount, 0))}
              </p>
              <p className="text-sm text-neutral-400">
                {cashFlow.cashOutflows.length} transactions
              </p>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-red-400" />
                <span className="text-xs text-red-400">+8.2% vs last period</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5" />
              Net Cash Flow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className={`text-3xl font-bold ${
                cashFlow.totalCashFlow >= 0 ? 'text-blue-400' : 'text-red-400'
              }`}>
                {formatCurrency(cashFlow.totalCashFlow)}
              </p>
              <p className="text-sm text-neutral-400">
                Current period
              </p>
              <div className="flex items-center gap-1">
                {cashFlow.totalCashFlow >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-400" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-400" />
                )}
                <span className={`text-xs ${
                  cashFlow.totalCashFlow >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {cashFlow.totalCashFlow >= 0 ? 'Positive' : 'Negative'} flow
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <CheckCircle className="h-5 w-5" />
              Cash on Hand
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-purple-400">
                {formatCurrency(cashFlow.cashOnHand)}
              </p>
              <p className="text-sm text-neutral-400">
                Available balance
              </p>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-400" />
                <span className="text-xs text-green-400">Healthy position</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods Breakdown */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Methods Analysis
              </CardTitle>
              <CardDescription>Revenue distribution by payment method</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {cashFlow.paymentMethods.map((method) => (
                <div key={method.method} className="bg-neutral-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getPaymentMethodIcon(method.method)}
                      <h4 className="text-white font-medium capitalize">
                        {method.method.replace('_', ' ')}
                      </h4>
                    </div>
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                      {method.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Total Amount</span>
                      <span className="text-white">{formatCurrency(method.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Transactions</span>
                      <span className="text-white">{method.transactionCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Avg Transaction</span>
                      <span className="text-white">{formatCurrency(method.averageTransaction)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Processing Fees</span>
                      <span className="text-red-400">-{formatCurrency(method.fees)}</span>
                    </div>
                    <div className="flex justify-between border-t border-neutral-700 pt-2">
                      <span className="text-neutral-400">Net Amount</span>
                      <span className="text-green-400 font-medium">{formatCurrency(method.netAmount)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-neutral-800 rounded-lg p-4">
              <h4 className="text-white font-medium mb-4">Payment Summary</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Total Revenue</span>
                  <span className="text-white">
                    {formatCurrency(cashFlow.paymentMethods.reduce((sum, m) => sum + m.amount, 0))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Total Fees</span>
                  <span className="text-red-400">
                    -{formatCurrency(cashFlow.paymentMethods.reduce((sum, m) => sum + m.fees, 0))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Total Transactions</span>
                  <span className="text-white">
                    {cashFlow.paymentMethods.reduce((sum, m) => sum + m.transactionCount, 0)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-neutral-700 pt-2">
                  <span className="text-neutral-400">Net Revenue</span>
                  <span className="text-green-400 font-medium">
                    {formatCurrency(cashFlow.paymentMethods.reduce((sum, m) => sum + m.netAmount, 0))}
                  </span>
                </div>
                <div className="mt-4 p-3 bg-neutral-900 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm text-yellow-400">Fee Optimization</span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    Consider promoting lower-fee payment methods to reduce processing costs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Receivable & Payable */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Accounts Receivable
            </CardTitle>
            <CardDescription>Outstanding payments from guests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-neutral-800 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-neutral-400">Total Outstanding</span>
                  <span className="text-2xl font-bold text-yellow-400">
                    {formatCurrency(cashFlow.accountsReceivable)}
                  </span>
                </div>
                <div className="text-sm text-neutral-400">
                  Pending guest payments
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-white font-medium">Aging Analysis</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">0-30 days</span>
                    <span className="text-green-400">{formatCurrency(cashFlow.accountsReceivable * 0.7)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">31-60 days</span>
                    <span className="text-yellow-400">{formatCurrency(cashFlow.accountsReceivable * 0.2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">60+ days</span>
                    <span className="text-red-400">{formatCurrency(cashFlow.accountsReceivable * 0.1)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Accounts Payable
            </CardTitle>
            <CardDescription>Outstanding payments to vendors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-neutral-800 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-neutral-400">Total Outstanding</span>
                  <span className="text-2xl font-bold text-red-400">
                    {formatCurrency(cashFlow.accountsPayable)}
                  </span>
                </div>
                <div className="text-sm text-neutral-400">
                  Pending vendor payments
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-white font-medium">Payment Schedule</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">Due this week</span>
                    <span className="text-red-400">{formatCurrency(cashFlow.accountsPayable * 0.3)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">Due this month</span>
                    <span className="text-yellow-400">{formatCurrency(cashFlow.accountsPayable * 0.5)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">Due later</span>
                    <span className="text-green-400">{formatCurrency(cashFlow.accountsPayable * 0.2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Projections */}
      {showProjections && (
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Cash Flow Projections
                </CardTitle>
                <CardDescription>12-month cash flow forecast</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={selectedTimeframe === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTimeframe('month')}
                  className={selectedTimeframe === 'month' ? 'bg-blue-600' : 'border-neutral-700 text-neutral-300'}
                >
                  Monthly
                </Button>
                <Button
                  variant={selectedTimeframe === 'quarter' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTimeframe('quarter')}
                  className={selectedTimeframe === 'quarter' ? 'bg-blue-600' : 'border-neutral-700 text-neutral-300'}
                >
                  Quarterly
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cashFlow.projectedCashFlow.slice(0, 6).map((projection) => (
                <div key={`${projection.month}-${projection.year}`} className="bg-neutral-800 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-white font-medium">{projection.month} {projection.year}</h4>
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                      {projection.confidence.toFixed(0)}% confidence
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Projected Inflow</span>
                      <span className="text-green-400">{formatCurrency(projection.projectedInflow)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Projected Outflow</span>
                      <span className="text-red-400">{formatCurrency(projection.projectedOutflow)}</span>
                    </div>
                    <div className="flex justify-between border-t border-neutral-700 pt-2">
                      <span className="text-neutral-400">Net Cash Flow</span>
                      <span className={`font-medium ${
                        projection.netCashFlow >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {formatCurrency(projection.netCashFlow)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
