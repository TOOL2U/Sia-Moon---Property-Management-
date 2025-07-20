import { NextRequest, NextResponse } from 'next/server'

interface FinancialReport {
  month: string
  year: number
  revenue: number
  expenses: number
  profit: number
  insight: string
  breakdown?: {
    bookingRevenue: number
    serviceRevenue: number
    maintenanceExpenses: number
    staffExpenses: number
    utilityExpenses: number
    marketingExpenses: number
  }
  trends?: {
    revenueChange: number
    expenseChange: number
    profitChange: number
  }
  aiConfidence: number
  generatedAt: string
}

// Mock data for development - replace with real database queries
function generateFinancialReports(): FinancialReport[] {
  const currentDate = new Date()
  const reports: FinancialReport[] = []
  
  // Generate reports for the last 6 months
  for (let i = 0; i < 6; i++) {
    const reportDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
    const monthName = reportDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    
    // Base financial data with realistic variations
    const seasonalMultiplier = getSeasonalMultiplier(reportDate.getMonth())
    const baseRevenue = 120000 * seasonalMultiplier
    const baseExpenses = 75000 + (baseRevenue * 0.1) // Expenses scale with revenue
    
    // Add some randomness for realism
    const revenueVariation = (Math.random() - 0.5) * 0.3 // ±15%
    const expenseVariation = (Math.random() - 0.5) * 0.2 // ±10%
    
    const revenue = Math.round(baseRevenue * (1 + revenueVariation))
    const expenses = Math.round(baseExpenses * (1 + expenseVariation))
    const profit = revenue - expenses
    
    // Calculate trends (comparison with previous month)
    const prevRevenue = i < 5 ? baseRevenue * getSeasonalMultiplier(reportDate.getMonth() + 1) : baseRevenue
    const prevExpenses = i < 5 ? (75000 + (prevRevenue * 0.1)) : baseExpenses
    
    const revenueChange = ((revenue - prevRevenue) / prevRevenue) * 100
    const expenseChange = ((expenses - prevExpenses) / prevExpenses) * 100
    const profitChange = profit > 0 && (prevRevenue - prevExpenses) > 0 
      ? ((profit - (prevRevenue - prevExpenses)) / (prevRevenue - prevExpenses)) * 100 
      : 0

    // Generate AI insights based on the data
    const insight = generateAIInsight(revenue, expenses, profit, revenueChange, expenseChange, reportDate.getMonth())
    
    reports.push({
      month: monthName,
      year: reportDate.getFullYear(),
      revenue,
      expenses,
      profit,
      insight,
      breakdown: {
        bookingRevenue: Math.round(revenue * 0.75),
        serviceRevenue: Math.round(revenue * 0.25),
        maintenanceExpenses: Math.round(expenses * 0.35),
        staffExpenses: Math.round(expenses * 0.40),
        utilityExpenses: Math.round(expenses * 0.15),
        marketingExpenses: Math.round(expenses * 0.10)
      },
      trends: {
        revenueChange: Math.round(revenueChange * 10) / 10,
        expenseChange: Math.round(expenseChange * 10) / 10,
        profitChange: Math.round(profitChange * 10) / 10
      },
      aiConfidence: Math.floor(Math.random() * 15) + 85, // 85-100%
      generatedAt: new Date(reportDate.getTime() + 28 * 24 * 60 * 60 * 1000).toISOString() // End of month
    })
  }
  
  return reports
}

// Seasonal multipliers for tourism business (Phuket)
function getSeasonalMultiplier(month: number): number {
  // High season: Nov-Mar (1.2-1.4x)
  // Shoulder: Apr-May, Oct (1.0-1.1x)  
  // Low season: Jun-Sep (0.7-0.9x)
  
  switch (month) {
    case 11: case 0: case 1: case 2: // Nov-Feb (peak)
      return 1.3 + Math.random() * 0.1
    case 3: // March (high)
      return 1.2 + Math.random() * 0.1
    case 4: case 9: // Apr, Oct (shoulder)
      return 1.0 + Math.random() * 0.1
    case 5: case 8: // May, Sep (low-shoulder)
      return 0.9 + Math.random() * 0.1
    case 6: case 7: // Jun-Jul (low)
      return 0.8 + Math.random() * 0.1
    default:
      return 1.0
  }
}

// Generate contextual AI insights based on financial data
function generateAIInsight(revenue: number, expenses: number, profit: number, revenueChange: number, expenseChange: number, month: number): string {
  const insights = []
  
  // Revenue insights
  if (revenueChange > 15) {
    insights.push("Strong revenue growth driven by increased booking rates and premium villa demand")
  } else if (revenueChange < -10) {
    insights.push("Revenue decline attributed to seasonal patterns and reduced occupancy rates")
  } else if (revenueChange > 5) {
    insights.push("Steady revenue growth with consistent booking performance across property portfolio")
  }
  
  // Expense insights
  if (expenseChange > 15) {
    insights.push("Expense increase due to enhanced maintenance programs and staff overtime during peak season")
  } else if (expenseChange < -5) {
    insights.push("Cost optimization achieved through efficient resource allocation and vendor negotiations")
  }
  
  // Seasonal insights
  const seasonalInsights = [
    "Pool maintenance costs rose due to increased usage and chemical requirements",
    "Air conditioning expenses peaked during hot weather period with high occupancy",
    "Staff scheduling optimized to handle increased guest services demand",
    "Marketing spend increased to capture shoulder season bookings",
    "Utility costs managed through energy-efficient practices and bulk purchasing",
    "Maintenance expenses reduced through preventive care and supplier partnerships"
  ]
  
  // Profit margin insights
  const profitMargin = (profit / revenue) * 100
  if (profitMargin > 35) {
    insights.push("Excellent profit margins maintained through operational efficiency")
  } else if (profitMargin < 15) {
    insights.push("Profit margins compressed by increased operational costs and competitive pricing")
  }
  
  // Combine insights or use seasonal fallback
  if (insights.length > 0) {
    return insights.join('. ') + '.'
  } else {
    return seasonalInsights[Math.floor(Math.random() * seasonalInsights.length)] + 
           ` Profit margin of ${profitMargin.toFixed(1)}% reflects current market conditions.`
  }
}

// GET /api/ai-cfo/reports - Get monthly financial reports
export async function GET(request: NextRequest) {
  try {
    console.log('💰 AI CFO: Generating monthly financial reports...')

    // In production, this would:
    // 1. Query financial database for actual revenue/expense data
    // 2. Run AI analysis on spending patterns and trends
    // 3. Generate insights using machine learning models
    // 4. Store reports in database with confidence scores
    
    const reports = generateFinancialReports()
    
    // Calculate summary statistics
    const totalRevenue = reports.reduce((sum, r) => sum + r.revenue, 0)
    const totalExpenses = reports.reduce((sum, r) => sum + r.expenses, 0)
    const totalProfit = totalRevenue - totalExpenses
    const avgConfidence = reports.reduce((sum, r) => sum + r.aiConfidence, 0) / reports.length
    
    const summary = {
      totalReports: reports.length,
      totalRevenue,
      totalExpenses,
      totalProfit,
      avgProfitMargin: (totalProfit / totalRevenue) * 100,
      avgConfidence: Math.round(avgConfidence * 10) / 10,
      reportPeriod: `${reports[reports.length - 1]?.month} - ${reports[0]?.month}`
    }

    console.log(`✅ AI CFO: Generated ${reports.length} financial reports with ${avgConfidence.toFixed(1)}% avg confidence`)

    return NextResponse.json({
      success: true,
      reports,
      summary,
      timestamp: new Date().toISOString(),
      message: `Generated ${reports.length} monthly financial reports`
    })

  } catch (error) {
    console.error('❌ AI CFO: Error generating financial reports:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate financial reports',
      reports: [],
      summary: null
    }, { status: 500 })
  }
}

// POST /api/ai-cfo/reports - Generate new report for specific month
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { month, year, forceRegenerate } = body
    
    console.log(`🤖 AI CFO: Generating financial report for ${month} ${year}`)

    // Validate input
    if (!month || !year) {
      return NextResponse.json({
        success: false,
        error: 'Month and year are required'
      }, { status: 400 })
    }

    // In production, this would:
    // 1. Check if report already exists (unless forceRegenerate)
    // 2. Gather all financial data for the specified month
    // 3. Run AI analysis and generate insights
    // 4. Store the new report in database
    
    // For now, generate a single mock report
    const reportDate = new Date(year, new Date(`${month} 1, ${year}`).getMonth(), 1)
    const seasonalMultiplier = getSeasonalMultiplier(reportDate.getMonth())
    const baseRevenue = 120000 * seasonalMultiplier
    const baseExpenses = 75000 + (baseRevenue * 0.1)
    
    const revenue = Math.round(baseRevenue * (1 + (Math.random() - 0.5) * 0.3))
    const expenses = Math.round(baseExpenses * (1 + (Math.random() - 0.5) * 0.2))
    const profit = revenue - expenses
    
    const newReport: FinancialReport = {
      month: `${month} ${year}`,
      year,
      revenue,
      expenses,
      profit,
      insight: generateAIInsight(revenue, expenses, profit, 0, 0, reportDate.getMonth()),
      breakdown: {
        bookingRevenue: Math.round(revenue * 0.75),
        serviceRevenue: Math.round(revenue * 0.25),
        maintenanceExpenses: Math.round(expenses * 0.35),
        staffExpenses: Math.round(expenses * 0.40),
        utilityExpenses: Math.round(expenses * 0.15),
        marketingExpenses: Math.round(expenses * 0.10)
      },
      aiConfidence: Math.floor(Math.random() * 15) + 85,
      generatedAt: new Date().toISOString()
    }

    console.log(`✅ AI CFO: Generated financial report for ${month} ${year}`)

    return NextResponse.json({
      success: true,
      report: newReport,
      message: `Financial report generated for ${month} ${year}`
    })

  } catch (error) {
    console.error('❌ AI CFO: Error generating specific financial report:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate financial report'
    }, { status: 500 })
  }
}
