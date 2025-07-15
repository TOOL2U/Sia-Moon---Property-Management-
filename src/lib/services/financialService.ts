import { 
  FinancialDashboard, 
  RevenueAnalytics, 
  ExpenseAnalytics, 
  FinancialKPIs,
  CashFlowData,
  ProfitLossStatement,
  FinancialForecast,
  PropertyRevenue,
  BookingSourceRevenue,
  MonthlyRevenue,
  ExpenseTransaction,
  FinancialFilters,
  FinancialReport,
  TaxData,
  FinancialMetric,
  FINANCIAL_CONSTANTS,
  BookingSource,
  ExpenseType
} from '@/types/financial'

class FinancialService {
  private static instance: FinancialService
  private mockData: any = {}

  private constructor() {
    this.initializeMockData()
  }

  public static getInstance(): FinancialService {
    if (!FinancialService.instance) {
      FinancialService.instance = new FinancialService()
    }
    return FinancialService.instance
  }

  private initializeMockData() {
    // Initialize with comprehensive mock financial data
    this.mockData = {
      bookings: this.generateMockBookings(),
      expenses: this.generateMockExpenses(),
      properties: this.generateMockProperties()
    }
  }

  private generateMockBookings() {
    const bookings = []
    const sources: BookingSource[] = ['direct', 'airbnb', 'booking.com', 'vrbo', 'expedia']
    const properties = ['villa-001', 'villa-002', 'villa-003', 'villa-004', 'villa-005']
    
    for (let i = 0; i < 150; i++) {
      const checkIn = new Date()
      checkIn.setDate(checkIn.getDate() - Math.random() * 365)
      const checkOut = new Date(checkIn)
      checkOut.setDate(checkOut.getDate() + Math.floor(Math.random() * 14) + 1)
      
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
      const baseRate = 200 + Math.random() * 800
      const totalAmount = nights * baseRate
      const source = sources[Math.floor(Math.random() * sources.length)]
      
      bookings.push({
        id: `booking-${i + 1}`,
        propertyId: properties[Math.floor(Math.random() * properties.length)],
        checkIn: checkIn.toISOString().split('T')[0],
        checkOut: checkOut.toISOString().split('T')[0],
        nights,
        baseRate,
        totalAmount,
        source,
        status: Math.random() > 0.1 ? 'confirmed' : 'pending',
        paymentStatus: Math.random() > 0.05 ? 'paid' : 'pending',
        commission: totalAmount * (FINANCIAL_CONSTANTS.COMMISSION_RATES[source.toUpperCase() as keyof typeof FINANCIAL_CONSTANTS.COMMISSION_RATES] || 0),
        createdAt: checkIn.toISOString(),
        guestCount: Math.floor(Math.random() * 8) + 1
      })
    }
    
    return bookings
  }

  private generateMockExpenses() {
    const expenses = []
    const categories: ExpenseType[] = [
      'staff_salaries', 'maintenance', 'utilities', 'cleaning', 
      'supplies', 'marketing', 'insurance', 'taxes'
    ]
    const properties = ['villa-001', 'villa-002', 'villa-003', 'villa-004', 'villa-005']
    
    for (let i = 0; i < 200; i++) {
      const date = new Date()
      date.setDate(date.getDate() - Math.random() * 365)
      
      expenses.push({
        id: `expense-${i + 1}`,
        date: date.toISOString().split('T')[0],
        amount: Math.random() * 2000 + 50,
        category: categories[Math.floor(Math.random() * categories.length)],
        description: `Mock expense ${i + 1}`,
        propertyId: Math.random() > 0.3 ? properties[Math.floor(Math.random() * properties.length)] : undefined,
        vendor: `Vendor ${Math.floor(Math.random() * 20) + 1}`,
        status: Math.random() > 0.1 ? 'paid' : 'pending'
      })
    }
    
    return expenses
  }

  private generateMockProperties() {
    return [
      { id: 'villa-001', name: 'Ocean View Villa', rooms: 4, maxOccupancy: 8 },
      { id: 'villa-002', name: 'Sunset Paradise', rooms: 3, maxOccupancy: 6 },
      { id: 'villa-003', name: 'Garden Estate', rooms: 6, maxOccupancy: 12 },
      { id: 'villa-004', name: 'Modern Penthouse', rooms: 2, maxOccupancy: 4 },
      { id: 'villa-005', name: 'Tropical Retreat', rooms: 5, maxOccupancy: 10 }
    ]
  }

  // Main dashboard data retrieval
  async getFinancialDashboard(filters?: FinancialFilters): Promise<FinancialDashboard> {
    try {
      const [revenue, expenses, kpis, cashFlow, profitLoss, forecasting] = await Promise.all([
        this.getRevenueAnalytics(filters),
        this.getExpenseAnalytics(filters),
        this.getFinancialKPIs(filters),
        this.getCashFlowData(filters),
        this.getProfitLossStatement(filters),
        this.getFinancialForecast(filters)
      ])

      return {
        revenue,
        expenses,
        kpis,
        cashFlow,
        profitLoss,
        forecasting,
        lastUpdated: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error fetching financial dashboard:', error)
      throw new Error('Failed to load financial dashboard')
    }
  }

  // Revenue Analytics
  async getRevenueAnalytics(filters?: FinancialFilters): Promise<RevenueAnalytics> {
    const bookings = this.filterBookings(this.mockData.bookings, filters)
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed')
    const paidBookings = confirmedBookings.filter(b => b.paymentStatus === 'paid')
    
    const totalRevenue = paidBookings.reduce((sum, b) => sum + b.totalAmount, 0)
    const pendingRevenue = confirmedBookings.filter(b => b.paymentStatus === 'pending')
      .reduce((sum, b) => sum + b.totalAmount, 0)

    // Calculate monthly, quarterly, yearly revenue
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    const monthlyRevenue = paidBookings
      .filter(b => {
        const bookingDate = new Date(b.createdAt)
        return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear
      })
      .reduce((sum, b) => sum + b.totalAmount, 0)

    const quarterlyRevenue = paidBookings
      .filter(b => {
        const bookingDate = new Date(b.createdAt)
        const quarter = Math.floor(currentMonth / 3)
        const bookingQuarter = Math.floor(bookingDate.getMonth() / 3)
        return bookingQuarter === quarter && bookingDate.getFullYear() === currentYear
      })
      .reduce((sum, b) => sum + b.totalAmount, 0)

    const yearlyRevenue = paidBookings
      .filter(b => new Date(b.createdAt).getFullYear() === currentYear)
      .reduce((sum, b) => sum + b.totalAmount, 0)

    // Revenue by property
    const revenueByProperty = this.calculateRevenueByProperty(paidBookings)
    
    // Revenue by source
    const revenueBySource = this.calculateRevenueBySource(paidBookings)
    
    // Monthly revenue trend
    const revenueByMonth = this.calculateMonthlyRevenue(paidBookings)
    
    // Seasonal trends
    const seasonalTrends = this.calculateSeasonalTrends(paidBookings)

    // Calculate ADR (Average Daily Rate)
    const totalNights = paidBookings.reduce((sum, b) => sum + b.nights, 0)
    const averageDailyRate = totalNights > 0 ? totalRevenue / totalNights : 0

    return {
      totalRevenue,
      monthlyRevenue,
      quarterlyRevenue,
      yearlyRevenue,
      revenueGrowth: {
        monthly: this.calculateGrowthRate('monthly', paidBookings),
        quarterly: this.calculateGrowthRate('quarterly', paidBookings),
        yearly: this.calculateGrowthRate('yearly', paidBookings)
      },
      revenueByProperty,
      revenueBySource,
      revenueByMonth,
      seasonalTrends,
      averageDailyRate,
      totalBookings: bookings.length,
      confirmedBookings: confirmedBookings.length,
      pendingRevenue
    }
  }

  // Expense Analytics
  async getExpenseAnalytics(filters?: FinancialFilters): Promise<ExpenseAnalytics> {
    const expenses = this.filterExpenses(this.mockData.expenses, filters)
    const paidExpenses = expenses.filter(e => e.status === 'paid')
    
    const totalExpenses = paidExpenses.reduce((sum, e) => sum + e.amount, 0)
    
    // Calculate monthly expenses
    const now = new Date()
    const monthlyExpenses = paidExpenses
      .filter(e => {
        const expenseDate = new Date(e.date)
        return expenseDate.getMonth() === now.getMonth() && 
               expenseDate.getFullYear() === now.getFullYear()
      })
      .reduce((sum, e) => sum + e.amount, 0)

    // Expenses by category
    const expensesByCategory = this.calculateExpensesByCategory(paidExpenses)
    
    // Expenses by property
    const expensesByProperty = this.calculateExpensesByProperty(paidExpenses)

    return {
      totalExpenses,
      monthlyExpenses,
      expensesByCategory,
      expensesByProperty,
      expenseGrowth: {
        monthly: this.calculateExpenseGrowthRate('monthly', paidExpenses),
        quarterly: this.calculateExpenseGrowthRate('quarterly', paidExpenses),
        yearly: this.calculateExpenseGrowthRate('yearly', paidExpenses)
      },
      operationalExpenses: this.calculateCategoryTotal(paidExpenses, ['maintenance', 'utilities', 'supplies']),
      staffCosts: this.calculateCategoryTotal(paidExpenses, ['staff_salaries', 'staff_benefits']),
      maintenanceExpenses: this.calculateCategoryTotal(paidExpenses, ['maintenance']),
      marketingExpenses: this.calculateCategoryTotal(paidExpenses, ['marketing']),
      utilitiesExpenses: this.calculateCategoryTotal(paidExpenses, ['utilities']),
      insuranceExpenses: this.calculateCategoryTotal(paidExpenses, ['insurance']),
      taxExpenses: this.calculateCategoryTotal(paidExpenses, ['taxes'])
    }
  }

  // Financial KPIs
  async getFinancialKPIs(filters?: FinancialFilters): Promise<FinancialKPIs> {
    const revenue = await this.getRevenueAnalytics(filters)
    const expenses = await this.getExpenseAnalytics(filters)
    
    const totalRooms = this.mockData.properties.reduce((sum: number, p: any) => sum + p.rooms, 0)
    const daysInPeriod = 365 // Adjust based on filters
    const availableRoomNights = totalRooms * daysInPeriod
    
    const occupiedRoomNights = this.mockData.bookings
      .filter((b: any) => b.status === 'confirmed')
      .reduce((sum: number, b: any) => sum + (b.nights * this.getPropertyRooms(b.propertyId)), 0)

    const occupancyRate = availableRoomNights > 0 ? (occupiedRoomNights / availableRoomNights) * 100 : 0
    const revPAR = availableRoomNights > 0 ? revenue.totalRevenue / availableRoomNights : 0
    
    const grossMargin = revenue.totalRevenue > 0 ? 
      ((revenue.totalRevenue - expenses.totalExpenses) / revenue.totalRevenue) * 100 : 0
    
    const netMargin = grossMargin // Simplified for demo

    return {
      adr: revenue.averageDailyRate,
      revPAR,
      occupancyRate,
      bookingConversionRate: 85.5, // Mock data
      averageBookingValue: revenue.totalBookings > 0 ? revenue.totalRevenue / revenue.totalBookings : 0,
      customerAcquisitionCost: 45.50, // Mock data
      customerLifetimeValue: 1250.00, // Mock data
      grossMargin,
      netMargin,
      returnOnInvestment: 12.5, // Mock data
      cashFlowRatio: 1.25, // Mock data
      debtToEquityRatio: 0.35, // Mock data
      currentRatio: 2.1, // Mock data
      quickRatio: 1.8 // Mock data
    }
  }

  // Helper methods for calculations
  private filterBookings(bookings: any[], filters?: FinancialFilters) {
    if (!filters) return bookings
    
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.createdAt)
      const startDate = new Date(filters.dateRange.startDate)
      const endDate = new Date(filters.dateRange.endDate)
      
      if (bookingDate < startDate || bookingDate > endDate) return false
      if (filters.propertyIds && !filters.propertyIds.includes(booking.propertyId)) return false
      if (filters.bookingSources && !filters.bookingSources.includes(booking.source)) return false
      
      return true
    })
  }

  private filterExpenses(expenses: any[], filters?: FinancialFilters) {
    if (!filters) return expenses
    
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date)
      const startDate = new Date(filters.dateRange.startDate)
      const endDate = new Date(filters.dateRange.endDate)
      
      if (expenseDate < startDate || expenseDate > endDate) return false
      if (filters.propertyIds && expense.propertyId && !filters.propertyIds.includes(expense.propertyId)) return false
      if (filters.expenseCategories && !filters.expenseCategories.includes(expense.category)) return false
      
      return true
    })
  }

  private calculateRevenueByProperty(bookings: any[]): PropertyRevenue[] {
    const propertyMap = new Map()
    
    bookings.forEach(booking => {
      const propertyId = booking.propertyId
      if (!propertyMap.has(propertyId)) {
        const property = this.mockData.properties.find((p: any) => p.id === propertyId)
        propertyMap.set(propertyId, {
          propertyId,
          propertyName: property?.name || 'Unknown Property',
          totalRevenue: 0,
          bookingCount: 0,
          totalNights: 0,
          rooms: property?.rooms || 1
        })
      }
      
      const data = propertyMap.get(propertyId)
      data.totalRevenue += booking.totalAmount
      data.bookingCount += 1
      data.totalNights += booking.nights
    })
    
    return Array.from(propertyMap.values()).map(data => ({
      ...data,
      averageBookingValue: data.bookingCount > 0 ? data.totalRevenue / data.bookingCount : 0,
      occupancyRate: (data.totalNights / (365 * data.rooms)) * 100,
      revPAR: data.totalRevenue / (365 * data.rooms),
      adr: data.totalNights > 0 ? data.totalRevenue / data.totalNights : 0,
      monthlyTrend: Math.random() * 20 - 10 // Mock trend
    }))
  }

  private calculateRevenueBySource(bookings: any[]): BookingSourceRevenue[] {
    const sourceMap = new Map()
    
    bookings.forEach(booking => {
      const source = booking.source
      if (!sourceMap.has(source)) {
        sourceMap.set(source, {
          source,
          revenue: 0,
          bookingCount: 0,
          commission: 0
        })
      }
      
      const data = sourceMap.get(source)
      data.revenue += booking.totalAmount
      data.bookingCount += 1
      data.commission += booking.commission || 0
    })
    
    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0)
    
    return Array.from(sourceMap.values()).map(data => ({
      ...data,
      averageValue: data.bookingCount > 0 ? data.revenue / data.bookingCount : 0,
      netRevenue: data.revenue - data.commission,
      conversionRate: Math.random() * 30 + 70, // Mock conversion rate
      percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0
    }))
  }

  private calculateMonthlyRevenue(bookings: any[]): MonthlyRevenue[] {
    const monthlyMap = new Map()
    
    bookings.forEach(booking => {
      const date = new Date(booking.createdAt)
      const key = `${date.getFullYear()}-${date.getMonth()}`
      
      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, {
          month: date.toLocaleString('default', { month: 'long' }),
          year: date.getFullYear(),
          revenue: 0,
          bookings: 0
        })
      }
      
      const data = monthlyMap.get(key)
      data.revenue += booking.totalAmount
      data.bookings += 1
    })
    
    return Array.from(monthlyMap.values())
      .sort((a, b) => a.year - b.year || a.month.localeCompare(b.month))
      .map((data, index, array) => ({
        ...data,
        averageValue: data.bookings > 0 ? data.revenue / data.bookings : 0,
        growth: index > 0 ? ((data.revenue - array[index - 1].revenue) / array[index - 1].revenue) * 100 : 0
      }))
  }

  private calculateSeasonalTrends(bookings: any[]) {
    // Simplified seasonal calculation
    return [
      { season: 'spring' as const, averageRevenue: 15000, bookingCount: 25, occupancyRate: 75, priceMultiplier: 1.0 },
      { season: 'summer' as const, averageRevenue: 25000, bookingCount: 40, occupancyRate: 95, priceMultiplier: 1.4 },
      { season: 'fall' as const, averageRevenue: 18000, bookingCount: 30, occupancyRate: 80, priceMultiplier: 1.1 },
      { season: 'winter' as const, averageRevenue: 12000, bookingCount: 20, occupancyRate: 60, priceMultiplier: 0.8 }
    ]
  }

  private calculateGrowthRate(period: 'monthly' | 'quarterly' | 'yearly', bookings: any[]): number {
    // Simplified growth calculation - in real implementation, compare with previous period
    return Math.random() * 30 - 5 // Mock growth between -5% and 25%
  }

  private calculateExpensesByCategory(expenses: any[]) {
    const categoryMap = new Map()
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
    
    expenses.forEach(expense => {
      const category = expense.category
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          category,
          amount: 0,
          transactions: []
        })
      }
      
      const data = categoryMap.get(category)
      data.amount += expense.amount
      data.transactions.push(expense)
    })
    
    return Array.from(categoryMap.values()).map(data => ({
      ...data,
      percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
      monthlyTrend: Math.random() * 20 - 10, // Mock trend
      budgetVariance: Math.random() * 30 - 15 // Mock variance
    }))
  }

  private calculateExpensesByProperty(expenses: any[]) {
    const propertyMap = new Map()
    
    expenses.forEach(expense => {
      if (!expense.propertyId) return
      
      const propertyId = expense.propertyId
      if (!propertyMap.has(propertyId)) {
        const property = this.mockData.properties.find((p: any) => p.id === propertyId)
        propertyMap.set(propertyId, {
          propertyId,
          propertyName: property?.name || 'Unknown Property',
          totalExpenses: 0,
          expensesByCategory: {}
        })
      }
      
      const data = propertyMap.get(propertyId)
      data.totalExpenses += expense.amount
      
      if (!data.expensesByCategory[expense.category]) {
        data.expensesByCategory[expense.category] = 0
      }
      data.expensesByCategory[expense.category] += expense.amount
    })
    
    return Array.from(propertyMap.values()).map(data => ({
      ...data,
      profitMargin: Math.random() * 40 + 10, // Mock profit margin
      netIncome: Math.random() * 50000 + 10000 // Mock net income
    }))
  }

  private calculateExpenseGrowthRate(period: 'monthly' | 'quarterly' | 'yearly', expenses: any[]): number {
    // Simplified growth calculation
    return Math.random() * 20 - 5 // Mock growth between -5% and 15%
  }

  private calculateCategoryTotal(expenses: any[], categories: string[]): number {
    return expenses
      .filter(e => categories.includes(e.category))
      .reduce((sum, e) => sum + e.amount, 0)
  }

  private getPropertyRooms(propertyId: string): number {
    const property = this.mockData.properties.find((p: any) => p.id === propertyId)
    return property?.rooms || 1
  }

  // Cash Flow Data
  async getCashFlowData(filters?: FinancialFilters): Promise<CashFlowData> {
    const bookings = this.filterBookings(this.mockData.bookings, filters)
    const expenses = this.filterExpenses(this.mockData.expenses, filters)

    const paidBookings = bookings.filter(b => b.paymentStatus === 'paid')
    const paidExpenses = expenses.filter(e => e.status === 'paid')

    const totalInflow = paidBookings.reduce((sum, b) => sum + b.totalAmount, 0)
    const totalOutflow = paidExpenses.reduce((sum, e) => sum + e.amount, 0)

    const cashInflows = paidBookings.map(booking => ({
      source: 'booking_payment' as const,
      amount: booking.totalAmount,
      date: booking.createdAt,
      description: `Booking payment for ${booking.propertyId}`,
      propertyId: booking.propertyId,
      bookingId: booking.id
    }))

    const cashOutflows = paidExpenses.map(expense => ({
      category: expense.category,
      amount: expense.amount,
      date: expense.date,
      description: expense.description,
      propertyId: expense.propertyId,
      vendor: expense.vendor,
      status: expense.status as 'scheduled' | 'paid' | 'overdue'
    }))

    const paymentMethods = this.calculatePaymentMethodBreakdown(paidBookings)

    return {
      totalCashFlow: totalInflow - totalOutflow,
      operatingCashFlow: totalInflow - totalOutflow,
      investingCashFlow: 0, // Mock data
      financingCashFlow: 0, // Mock data
      cashInflows,
      cashOutflows,
      accountsReceivable: bookings.filter(b => b.paymentStatus === 'pending')
        .reduce((sum, b) => sum + b.totalAmount, 0),
      accountsPayable: expenses.filter(e => e.status === 'pending')
        .reduce((sum, e) => sum + e.amount, 0),
      cashOnHand: 125000, // Mock data
      projectedCashFlow: this.generateProjectedCashFlow(),
      paymentMethods
    }
  }

  // Profit & Loss Statement
  async getProfitLossStatement(filters?: FinancialFilters): Promise<ProfitLossStatement> {
    const revenue = await this.getRevenueAnalytics(filters)
    const expenses = await this.getExpenseAnalytics(filters)

    const period = {
      startDate: filters?.dateRange.startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: filters?.dateRange.endDate || new Date().toISOString().split('T')[0],
      type: 'yearly' as const
    }

    const totalRevenue = revenue.totalRevenue
    const totalExpenses = expenses.totalExpenses
    const grossProfit = totalRevenue - totalExpenses
    const operatingIncome = grossProfit // Simplified
    const netIncome = operatingIncome * 0.85 // After taxes (simplified)

    return {
      period,
      revenue: {
        totalRevenue,
        bookingRevenue: totalRevenue * 0.95,
        additionalServices: totalRevenue * 0.03,
        otherRevenue: totalRevenue * 0.02
      },
      expenses: {
        totalExpenses,
        operatingExpenses: expenses.operationalExpenses,
        staffCosts: expenses.staffCosts,
        maintenanceExpenses: expenses.maintenanceExpenses,
        marketingExpenses: expenses.marketingExpenses,
        administrativeExpenses: totalExpenses * 0.1,
        depreciation: totalExpenses * 0.05,
        interestExpense: totalExpenses * 0.02,
        taxes: totalExpenses * 0.08
      },
      grossProfit,
      operatingIncome,
      netIncome,
      margins: {
        grossMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
        operatingMargin: totalRevenue > 0 ? (operatingIncome / totalRevenue) * 100 : 0,
        netMargin: totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0
      },
      ebitda: operatingIncome + (totalExpenses * 0.07) // Adding back depreciation and interest
    }
  }

  // Financial Forecast
  async getFinancialForecast(filters?: FinancialFilters): Promise<FinancialForecast> {
    const currentRevenue = await this.getRevenueAnalytics(filters)
    const currentExpenses = await this.getExpenseAnalytics(filters)

    const forecastPeriod = {
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      months: 12
    }

    const revenueProjection = this.generateMonthlyProjections(currentRevenue.monthlyRevenue, 'revenue')
    const expenseProjection = this.generateMonthlyProjections(currentExpenses.monthlyExpenses, 'expense')
    const profitProjection = revenueProjection.map((rev, index) => ({
      ...rev,
      projected: rev.projected - expenseProjection[index].projected
    }))

    const occupancyProjection = this.generateMonthlyProjections(75, 'occupancy') // Base 75% occupancy

    return {
      forecastPeriod,
      revenueProjection,
      expenseProjection,
      profitProjection,
      occupancyProjection,
      assumptions: [
        { category: 'Revenue Growth', description: 'Expected 15% annual growth', value: 15, impact: 'high' },
        { category: 'Occupancy Rate', description: 'Target 80% average occupancy', value: 80, impact: 'high' },
        { category: 'Expense Inflation', description: 'Expected 5% cost increase', value: 5, impact: 'medium' }
      ],
      confidence: 78,
      scenarios: [
        { name: 'optimistic', revenueMultiplier: 1.25, expenseMultiplier: 1.05, description: 'Best case scenario', probability: 25 },
        { name: 'realistic', revenueMultiplier: 1.15, expenseMultiplier: 1.08, description: 'Most likely scenario', probability: 50 },
        { name: 'pessimistic', revenueMultiplier: 0.95, expenseMultiplier: 1.12, description: 'Conservative scenario', probability: 25 }
      ]
    }
  }

  // Helper methods for cash flow and forecasting
  private calculatePaymentMethodBreakdown(bookings: any[]) {
    const methods = ['credit_card', 'bank_transfer', 'paypal', 'stripe']
    const totalAmount = bookings.reduce((sum, b) => sum + b.totalAmount, 0)

    return methods.map(method => {
      const amount = totalAmount * (Math.random() * 0.4 + 0.1) // Random distribution
      const transactionCount = Math.floor(bookings.length * (Math.random() * 0.4 + 0.1))
      const feeRate = FINANCIAL_CONSTANTS.PAYMENT_PROCESSING_FEES[method.toUpperCase() as keyof typeof FINANCIAL_CONSTANTS.PAYMENT_PROCESSING_FEES] || 0.03
      const fees = amount * feeRate

      return {
        method: method as any,
        amount,
        percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
        transactionCount,
        averageTransaction: transactionCount > 0 ? amount / transactionCount : 0,
        fees,
        netAmount: amount - fees
      }
    })
  }

  private generateProjectedCashFlow() {
    const projections = []
    const baseInflow = 45000
    const baseOutflow = 32000

    for (let i = 0; i < 12; i++) {
      const month = new Date()
      month.setMonth(month.getMonth() + i)

      const seasonalMultiplier = this.getSeasonalMultiplier(month.getMonth())
      const projectedInflow = baseInflow * seasonalMultiplier * (1 + Math.random() * 0.2 - 0.1)
      const projectedOutflow = baseOutflow * (1 + Math.random() * 0.15 - 0.075)

      projections.push({
        month: month.toLocaleString('default', { month: 'long' }),
        year: month.getFullYear(),
        projectedInflow,
        projectedOutflow,
        netCashFlow: projectedInflow - projectedOutflow,
        confidence: Math.random() * 20 + 70 // 70-90% confidence
      })
    }

    return projections
  }

  private generateMonthlyProjections(baseValue: number, type: 'revenue' | 'expense' | 'occupancy') {
    const projections = []

    for (let i = 0; i < 12; i++) {
      const month = new Date()
      month.setMonth(month.getMonth() + i)

      let growthRate = 0.02 // 2% monthly growth base
      if (type === 'expense') growthRate = 0.005 // Lower growth for expenses
      if (type === 'occupancy') growthRate = 0.01 // Moderate growth for occupancy

      const seasonalMultiplier = this.getSeasonalMultiplier(month.getMonth())
      const projected = baseValue * Math.pow(1 + growthRate, i) * seasonalMultiplier

      projections.push({
        month: month.toLocaleString('default', { month: 'long' }),
        year: month.getFullYear(),
        projected,
        confidence: Math.random() * 15 + 75 // 75-90% confidence
      })
    }

    return projections
  }

  private getSeasonalMultiplier(month: number): number {
    // Seasonal adjustments for hospitality business
    const seasonalFactors = [
      0.8,  // January
      0.85, // February
      1.0,  // March
      1.1,  // April
      1.2,  // May
      1.4,  // June
      1.5,  // July
      1.4,  // August
      1.2,  // September
      1.1,  // October
      0.9,  // November
      0.85  // December
    ]

    return seasonalFactors[month] || 1.0
  }

  // Expense management methods
  async createExpense(expense: Omit<ExpenseTransaction, 'id'>): Promise<{ success: boolean; expense?: ExpenseTransaction; error?: string }> {
    try {
      const newExpense: ExpenseTransaction = {
        ...expense,
        id: `expense-${Date.now()}`
      }

      this.mockData.expenses.push(newExpense)

      return { success: true, expense: newExpense }
    } catch (error) {
      return { success: false, error: 'Failed to create expense' }
    }
  }

  async updateExpense(id: string, updates: Partial<ExpenseTransaction>): Promise<{ success: boolean; expense?: ExpenseTransaction; error?: string }> {
    try {
      const expenseIndex = this.mockData.expenses.findIndex((e: any) => e.id === id)
      if (expenseIndex === -1) {
        return { success: false, error: 'Expense not found' }
      }

      this.mockData.expenses[expenseIndex] = { ...this.mockData.expenses[expenseIndex], ...updates }

      return { success: true, expense: this.mockData.expenses[expenseIndex] }
    } catch (error) {
      return { success: false, error: 'Failed to update expense' }
    }
  }

  async deleteExpense(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const expenseIndex = this.mockData.expenses.findIndex((e: any) => e.id === id)
      if (expenseIndex === -1) {
        return { success: false, error: 'Expense not found' }
      }

      this.mockData.expenses.splice(expenseIndex, 1)

      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to delete expense' }
    }
  }

  // Report generation
  async generateFinancialReport(type: FinancialReport['type'], filters?: FinancialFilters): Promise<FinancialReport> {
    const reportId = `report-${Date.now()}`

    try {
      let data: any

      switch (type) {
        case 'revenue':
          data = await this.getRevenueAnalytics(filters)
          break
        case 'expenses':
          data = await this.getExpenseAnalytics(filters)
          break
        case 'profit_loss':
          data = await this.getProfitLossStatement(filters)
          break
        case 'cash_flow':
          data = await this.getCashFlowData(filters)
          break
        case 'kpi_summary':
          data = await this.getFinancialKPIs(filters)
          break
        default:
          throw new Error('Invalid report type')
      }

      return {
        id: reportId,
        type,
        title: this.getReportTitle(type),
        period: {
          startDate: filters?.dateRange.startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: filters?.dateRange.endDate || new Date().toISOString().split('T')[0]
        },
        data,
        generatedAt: new Date().toISOString(),
        generatedBy: 'system', // In real app, use actual user
        format: 'pdf',
        status: 'ready'
      }
    } catch (error) {
      return {
        id: reportId,
        type,
        title: this.getReportTitle(type),
        period: {
          startDate: filters?.dateRange.startDate || '',
          endDate: filters?.dateRange.endDate || ''
        },
        data: null,
        generatedAt: new Date().toISOString(),
        generatedBy: 'system',
        format: 'pdf',
        status: 'error'
      }
    }
  }

  private getReportTitle(type: FinancialReport['type']): string {
    const titles = {
      revenue: 'Revenue Analytics Report',
      expenses: 'Expense Analysis Report',
      profit_loss: 'Profit & Loss Statement',
      cash_flow: 'Cash Flow Report',
      kpi_summary: 'Financial KPI Summary',
      tax_report: 'Tax Report'
    }

    return titles[type] || 'Financial Report'
  }
}

export default FinancialService.getInstance()
