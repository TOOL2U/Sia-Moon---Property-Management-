'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Building2,
  Users,
  Wrench,
  Zap,
  Shield,
  Megaphone,
  Package,
  Sparkles,
  FileText,
  Filter,
  Download,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react'
import { ExpenseAnalytics, ExpenseCategory, ExpenseTransaction, ExpenseType } from '@/types/financial'

interface ExpenseTrackingSystemProps {
  expenses: ExpenseAnalytics
  loading?: boolean
  onCreateExpense?: (expense: Omit<ExpenseTransaction, 'id'>) => void
  onUpdateExpense?: (id: string, updates: Partial<ExpenseTransaction>) => void
  onDeleteExpense?: (id: string) => void
}

export default function ExpenseTrackingSystem({ 
  expenses, 
  loading, 
  onCreateExpense,
  onUpdateExpense,
  onDeleteExpense 
}: ExpenseTrackingSystemProps) {
  const [selectedCategory, setSelectedCategory] = useState<ExpenseType | 'all'>('all')
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [editingExpense, setEditingExpense] = useState<ExpenseTransaction | null>(null)

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
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

  const getCategoryIcon = (category: ExpenseType) => {
    const iconMap = {
      staff_salaries: Users,
      staff_benefits: Users,
      maintenance: Wrench,
      utilities: Zap,
      insurance: Shield,
      marketing: Megaphone,
      supplies: Package,
      cleaning: Sparkles,
      taxes: FileText,
      legal_professional: FileText,
      technology: FileText,
      other: DollarSign
    }
    
    const IconComponent = iconMap[category] || DollarSign
    return <IconComponent className="h-4 w-4" />
  }

  const getCategoryColor = (category: ExpenseType) => {
    const colorMap = {
      staff_salaries: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      staff_benefits: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      maintenance: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      utilities: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      insurance: 'bg-green-500/20 text-green-400 border-green-500/30',
      marketing: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      supplies: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      cleaning: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
      taxes: 'bg-red-500/20 text-red-400 border-red-500/30',
      legal_professional: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      technology: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
      other: 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30'
    }
    
    return colorMap[category] || 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'approved':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'rejected':
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

  const filteredCategories = selectedCategory === 'all' 
    ? expenses.expensesByCategory 
    : expenses.expensesByCategory.filter(cat => cat.category === selectedCategory)

  const allTransactions = expenses.expensesByCategory.flatMap(cat => cat.transactions)
  const filteredTransactions = selectedCategory === 'all'
    ? allTransactions
    : expenses.expensesByCategory.find(cat => cat.category === selectedCategory)?.transactions || []

  return (
    <div className="space-y-6">
      {/* Expense Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-red-600/20 to-orange-600/20 border-red-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5" />
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-red-400">
                {formatCurrency(expenses.totalExpenses)}
              </p>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-red-400" />
                <span className="text-xs text-red-400">
                  +{expenses.expenseGrowth.monthly.toFixed(1)}% vs last month
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Staff Costs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-blue-400">
                {formatCurrency(expenses.staffCosts)}
              </p>
              <p className="text-sm text-neutral-400">
                {((expenses.staffCosts / expenses.totalExpenses) * 100).toFixed(1)}% of total
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-600/20 to-yellow-600/20 border-orange-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <Wrench className="h-5 w-5" />
              Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-orange-400">
                {formatCurrency(expenses.maintenanceExpenses)}
              </p>
              <p className="text-sm text-neutral-400">
                {((expenses.maintenanceExpenses / expenses.totalExpenses) * 100).toFixed(1)}% of total
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              Monthly
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-green-400">
                {formatCurrency(expenses.monthlyExpenses)}
              </p>
              <p className="text-sm text-neutral-400">
                Current month
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter and Actions */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Expense Management</CardTitle>
              <CardDescription>Track and manage all operational expenses</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowAddExpense(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
              <Button variant="outline" className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              onClick={() => setSelectedCategory('all')}
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              className={selectedCategory === 'all' ? 'bg-blue-600' : 'border-neutral-700 text-neutral-300'}
            >
              All Categories
            </Button>
            {expenses.expensesByCategory.map((category) => (
              <Button
                key={category.category}
                onClick={() => setSelectedCategory(category.category)}
                variant={selectedCategory === category.category ? 'default' : 'outline'}
                size="sm"
                className={`${
                  selectedCategory === category.category 
                    ? 'bg-blue-600' 
                    : 'border-neutral-700 text-neutral-300'
                } flex items-center gap-1`}
              >
                {getCategoryIcon(category.category)}
                {category.category.replace('_', ' ')}
                <Badge className="ml-1 bg-neutral-700 text-neutral-300 text-xs">
                  {category.transactions.length}
                </Badge>
              </Button>
            ))}
          </div>

          {/* Expense Categories Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
            {filteredCategories.map((category) => (
              <Card key={category.category} className="bg-neutral-800 border-neutral-700">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(category.category)}
                      <CardTitle className="text-white text-sm capitalize">
                        {category.category.replace('_', ' ')}
                      </CardTitle>
                    </div>
                    <Badge className={getCategoryColor(category.category)}>
                      {category.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Total Amount</span>
                    <span className="text-white font-semibold">{formatCurrency(category.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Transactions</span>
                    <span className="text-white">{category.transactions.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Monthly Trend</span>
                    <div className="flex items-center gap-1">
                      {category.monthlyTrend >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-red-400" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-green-400" />
                      )}
                      <span className={`text-xs ${
                        category.monthlyTrend >= 0 ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {category.monthlyTrend >= 0 ? '+' : ''}{category.monthlyTrend.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Budget Variance</span>
                    <span className={`text-xs ${
                      category.budgetVariance <= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {category.budgetVariance >= 0 ? '+' : ''}{category.budgetVariance.toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Transactions */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Recent Transactions</h3>
            <div className="space-y-3">
              {filteredTransactions.slice(0, 10).map((transaction) => (
                <div key={transaction.id} className="bg-neutral-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-neutral-700 rounded-full flex items-center justify-center">
                        {getCategoryIcon(transaction.category)}
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{transaction.description}</h4>
                        <div className="flex items-center gap-4 text-sm text-neutral-400">
                          <span className="capitalize">{transaction.category.replace('_', ' ')}</span>
                          <span>{formatDate(transaction.date)}</span>
                          {transaction.vendor && <span>{transaction.vendor}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-white font-semibold">{formatCurrency(transaction.amount)}</p>
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="p-1 hover:bg-neutral-700"
                          onClick={() => setEditingExpense(transaction)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="p-1 text-red-400 hover:bg-red-500/10"
                          onClick={() => onDeleteExpense?.(transaction.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expense Summary by Property */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Expenses by Property
          </CardTitle>
          <CardDescription>Property-specific expense breakdown and profitability</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {expenses.expensesByProperty.map((property) => (
              <Card key={property.propertyId} className="bg-neutral-800 border-neutral-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-lg">{property.propertyName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Total Expenses</span>
                    <span className="text-red-400 font-semibold">{formatCurrency(property.totalExpenses)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Net Income</span>
                    <span className="text-green-400 font-semibold">{formatCurrency(property.netIncome)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Profit Margin</span>
                    <span className={`font-semibold ${
                      property.profitMargin >= 20 ? 'text-green-400' : 
                      property.profitMargin >= 10 ? 'text-yellow-400' : 
                      'text-red-400'
                    }`}>
                      {property.profitMargin.toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="border-t border-neutral-700 pt-3">
                    <h4 className="text-white font-medium mb-2">Top Expense Categories</h4>
                    <div className="space-y-1">
                      {Object.entries(property.expensesByCategory)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 3)
                        .map(([category, amount]) => (
                          <div key={category} className="flex justify-between text-sm">
                            <span className="text-neutral-400 capitalize">{category.replace('_', ' ')}</span>
                            <span className="text-white">{formatCurrency(amount)}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
