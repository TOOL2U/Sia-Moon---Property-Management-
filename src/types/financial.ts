// Financial Management Type Definitions
// Comprehensive TypeScript interfaces for financial management system

export interface FinancialDashboard {
  revenue: RevenueAnalytics
  expenses: ExpenseAnalytics
  kpis: FinancialKPIs
  cashFlow: CashFlowData
  profitLoss: ProfitLossStatement
  forecasting: FinancialForecast
  lastUpdated: string
}

export interface RevenueAnalytics {
  totalRevenue: number
  monthlyRevenue: number
  quarterlyRevenue: number
  yearlyRevenue: number
  revenueGrowth: {
    monthly: number // percentage
    quarterly: number
    yearly: number
  }
  revenueByProperty: PropertyRevenue[]
  revenueBySource: BookingSourceRevenue[]
  revenueByMonth: MonthlyRevenue[]
  seasonalTrends: SeasonalTrend[]
  averageDailyRate: number
  totalBookings: number
  confirmedBookings: number
  pendingRevenue: number
}

export interface PropertyRevenue {
  propertyId: string
  propertyName: string
  totalRevenue: number
  bookingCount: number
  averageBookingValue: number
  occupancyRate: number
  revPAR: number // Revenue per Available Room
  adr: number // Average Daily Rate
  monthlyTrend: number // percentage change
}

export interface BookingSourceRevenue {
  source: BookingSource
  revenue: number
  bookingCount: number
  averageValue: number
  commission: number
  netRevenue: number
  conversionRate: number
  percentage: number
}

export type BookingSource = 
  | 'direct'
  | 'airbnb'
  | 'booking.com'
  | 'vrbo'
  | 'expedia'
  | 'referral'
  | 'repeat_guest'
  | 'other'

export interface MonthlyRevenue {
  month: string
  year: number
  revenue: number
  bookings: number
  averageValue: number
  growth: number // percentage vs previous month
}

export interface SeasonalTrend {
  season: 'spring' | 'summer' | 'fall' | 'winter'
  averageRevenue: number
  bookingCount: number
  occupancyRate: number
  priceMultiplier: number
}

export interface ExpenseAnalytics {
  totalExpenses: number
  monthlyExpenses: number
  expensesByCategory: ExpenseCategory[]
  expensesByProperty: PropertyExpense[]
  expenseGrowth: {
    monthly: number
    quarterly: number
    yearly: number
  }
  operationalExpenses: number
  staffCosts: number
  maintenanceExpenses: number
  marketingExpenses: number
  utilitiesExpenses: number
  insuranceExpenses: number
  taxExpenses: number
}

export interface ExpenseCategory {
  category: ExpenseType
  amount: number
  percentage: number
  monthlyTrend: number
  budgetVariance: number
  transactions: ExpenseTransaction[]
}

export type ExpenseType = 
  | 'staff_salaries'
  | 'staff_benefits'
  | 'maintenance'
  | 'utilities'
  | 'insurance'
  | 'marketing'
  | 'supplies'
  | 'cleaning'
  | 'taxes'
  | 'legal_professional'
  | 'technology'
  | 'other'

export interface PropertyExpense {
  propertyId: string
  propertyName: string
  totalExpenses: number
  expensesByCategory: Record<ExpenseType, number>
  profitMargin: number
  netIncome: number
}

export interface ExpenseTransaction {
  id: string
  date: string
  amount: number
  category: ExpenseType
  description: string
  propertyId?: string
  vendor?: string
  receipt?: string
  approvedBy?: string
  status: 'pending' | 'approved' | 'paid' | 'rejected'
}

export interface FinancialKPIs {
  adr: number // Average Daily Rate
  revPAR: number // Revenue per Available Room
  occupancyRate: number
  bookingConversionRate: number
  averageBookingValue: number
  customerAcquisitionCost: number
  customerLifetimeValue: number
  grossMargin: number
  netMargin: number
  returnOnInvestment: number
  cashFlowRatio: number
  debtToEquityRatio: number
  currentRatio: number
  quickRatio: number
}

export interface CashFlowData {
  totalCashFlow: number
  operatingCashFlow: number
  investingCashFlow: number
  financingCashFlow: number
  cashInflows: CashInflow[]
  cashOutflows: CashOutflow[]
  accountsReceivable: number
  accountsPayable: number
  cashOnHand: number
  projectedCashFlow: ProjectedCashFlow[]
  paymentMethods: PaymentMethodBreakdown[]
}

export interface CashInflow {
  source: 'booking_payment' | 'security_deposit' | 'additional_services' | 'other'
  amount: number
  date: string
  description: string
  propertyId?: string
  bookingId?: string
}

export interface CashOutflow {
  category: ExpenseType
  amount: number
  date: string
  description: string
  propertyId?: string
  vendor?: string
  status: 'scheduled' | 'paid' | 'overdue'
}

export interface ProjectedCashFlow {
  month: string
  year: number
  projectedInflow: number
  projectedOutflow: number
  netCashFlow: number
  confidence: number // percentage
}

export interface PaymentMethodBreakdown {
  method: 'credit_card' | 'bank_transfer' | 'paypal' | 'stripe' | 'cash' | 'check' | 'other'
  amount: number
  percentage: number
  transactionCount: number
  averageTransaction: number
  fees: number
  netAmount: number
}

export interface ProfitLossStatement {
  period: {
    startDate: string
    endDate: string
    type: 'monthly' | 'quarterly' | 'yearly'
  }
  revenue: {
    totalRevenue: number
    bookingRevenue: number
    additionalServices: number
    otherRevenue: number
  }
  expenses: {
    totalExpenses: number
    operatingExpenses: number
    staffCosts: number
    maintenanceExpenses: number
    marketingExpenses: number
    administrativeExpenses: number
    depreciation: number
    interestExpense: number
    taxes: number
  }
  grossProfit: number
  operatingIncome: number
  netIncome: number
  margins: {
    grossMargin: number
    operatingMargin: number
    netMargin: number
  }
  ebitda: number // Earnings Before Interest, Taxes, Depreciation, and Amortization
}

export interface FinancialForecast {
  forecastPeriod: {
    startDate: string
    endDate: string
    months: number
  }
  revenueProjection: MonthlyProjection[]
  expenseProjection: MonthlyProjection[]
  profitProjection: MonthlyProjection[]
  occupancyProjection: MonthlyProjection[]
  assumptions: ForecastAssumption[]
  confidence: number
  scenarios: ForecastScenario[]
}

export interface MonthlyProjection {
  month: string
  year: number
  projected: number
  actual?: number
  variance?: number
  confidence: number
}

export interface ForecastAssumption {
  category: string
  description: string
  value: number
  impact: 'high' | 'medium' | 'low'
}

export interface ForecastScenario {
  name: 'optimistic' | 'realistic' | 'pessimistic'
  revenueMultiplier: number
  expenseMultiplier: number
  description: string
  probability: number
}

export interface FinancialFilters {
  dateRange: {
    startDate: string
    endDate: string
  }
  propertyIds?: string[]
  bookingSources?: BookingSource[]
  expenseCategories?: ExpenseType[]
  paymentMethods?: string[]
  comparisonPeriod?: {
    startDate: string
    endDate: string
  }
}

export interface FinancialReport {
  id: string
  type: 'revenue' | 'expenses' | 'profit_loss' | 'cash_flow' | 'kpi_summary' | 'tax_report'
  title: string
  period: {
    startDate: string
    endDate: string
  }
  data: any
  generatedAt: string
  generatedBy: string
  format: 'pdf' | 'excel' | 'csv'
  status: 'generating' | 'ready' | 'error'
}

export interface TaxData {
  taxableRevenue: number
  taxDeductions: number
  netTaxableIncome: number
  taxRate: number
  taxOwed: number
  taxPaid: number
  taxBalance: number
  quarterlyTaxes: QuarterlyTax[]
  taxDocuments: TaxDocument[]
}

export interface QuarterlyTax {
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4'
  year: number
  revenue: number
  deductions: number
  taxOwed: number
  taxPaid: number
  dueDate: string
  status: 'pending' | 'paid' | 'overdue'
}

export interface TaxDocument {
  id: string
  type: '1099' | 'W2' | 'receipt' | 'invoice' | 'other'
  description: string
  amount: number
  date: string
  fileUrl?: string
  category: ExpenseType
}

// Utility types for financial calculations
export interface FinancialCalculation {
  calculate: (data: any) => number
  format: (value: number) => string
  validate: (value: number) => boolean
}

export interface FinancialMetric {
  name: string
  value: number
  previousValue?: number
  change?: number
  changePercentage?: number
  trend: 'up' | 'down' | 'stable'
  target?: number
  status: 'good' | 'warning' | 'critical'
}

// Constants for financial calculations
export const FINANCIAL_CONSTANTS = {
  TAX_RATES: {
    FEDERAL: 0.21,
    STATE: 0.06,
    LOCAL: 0.02
  },
  COMMISSION_RATES: {
    AIRBNB: 0.03,
    BOOKING_COM: 0.15,
    VRBO: 0.05,
    EXPEDIA: 0.18,
    DIRECT: 0.0
  },
  PAYMENT_PROCESSING_FEES: {
    CREDIT_CARD: 0.029,
    PAYPAL: 0.034,
    STRIPE: 0.029,
    BANK_TRANSFER: 0.005
  }
} as const
