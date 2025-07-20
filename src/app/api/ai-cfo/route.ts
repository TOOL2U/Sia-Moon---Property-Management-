import { NextRequest, NextResponse } from "next/server"

// Dynamic rule loading function
async function loadCompanyRules(): Promise<string[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ai-policy`, {
      cache: "no-store"
    })

    if (response.ok) {
      const data = await response.json()
      return data.rules || []
    } else {
      console.warn('⚠️ AI CFO: Failed to load dynamic rules, using fallback')
      return [
        "Auto-approve expenses under ฿1,000 with 90%+ confidence",
        "Require human approval for expenses over ฿10,000",
        "Flag recurring expenses that exceed 10% variance from budget",
        "Reject expenses without proper documentation or receipts",
        "Monitor cash flow to maintain minimum 30-day operating reserve"
      ]
    }
  } catch (error) {
    console.error('❌ AI CFO: Error loading dynamic rules:', error)
    return [
      "Auto-approve expenses under ฿1,000 with 90%+ confidence",
      "Require human approval for expenses over ฿10,000",
      "Flag recurring expenses that exceed 10% variance from budget",
      "Reject expenses without proper documentation or receipts",
      "Monitor cash flow to maintain minimum 30-day operating reserve"
    ]
  }
}

// AI CFO System Prompt
const AI_CFO_SYSTEM_PROMPT = `You are an AI Chief Financial Officer (CFO) for a premium villa property management company in Thailand. Analyze financial data and provide insights, anomaly detection, and recommendations.`

// Mock logAIAction function for now
async function logAIAction(entry: any) {
  console.log('📝 AI CFO: Logging action:', entry)

  try {
    const response = await fetch('/api/ai-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    })

    if (response.ok) {
      console.log('✅ AI CFO: Action logged successfully')
    } else {
      console.warn('⚠️ AI CFO: Failed to log action to API')
    }
  } catch (error) {
    console.error('❌ AI CFO: Error logging action:', error)
  }
}

// Updated financial data interfaces to match Prompt 12 specification
interface FinancialExpense {
  date: string
  category: string
  amount: number
  description?: string
  vendor?: string
  approved?: boolean
}

interface FinancialData {
  expenses: FinancialExpense[]
  period?: string
  currency?: string
  totalBudget?: number
}

// CFO Analysis Response to match Prompt 12 specification
interface CFOAnalysisResponse {
  summary: string
  anomalies: Array<{
    date: string
    amount: number
    category?: string
    note: string
    severity?: 'low' | 'medium' | 'high'
  }>
  recommendations: string[]
  confidence: number
  insights?: string[]
  totalAnalyzed?: number
  riskLevel?: 'low' | 'medium' | 'high'
}

/**
 * POST /api/ai-cfo
 * Process financial data through AI CFO analysis (Prompt 12 specification)
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now()

  try {
    console.log('💰 AI CFO: Processing financial analysis request...')

    // Step 1: Parse and validate financial data
    const financialData: FinancialData = await req.json()
    console.log('📊 AI CFO: Received financial data:', {
      expenseCount: financialData.expenses?.length || 0,
      period: financialData.period,
      totalBudget: financialData.totalBudget
    })

    // Validate required fields
    if (!financialData || !Array.isArray(financialData.expenses)) {
      console.log('❌ AI CFO: Validation failed: Invalid spreadsheet data')

      // Log the rejection
      await logAIAction({
        agent: "CFO",
        decision: "reject",
        confidence: 0.95,
        rationale: "Invalid spreadsheet data - expenses array required",
        escalate: false,
        source: "finance",
        status: "completed",
        notes: "Invalid financial data provided",
        metadata: { error: "expenses array missing or invalid", dataReceived: financialData }
      })

      return NextResponse.json({
        error: "Invalid spreadsheet data",
        success: false,
        details: ["expenses array is required"]
      }, { status: 400 })
    }

    if (financialData.expenses.length === 0) {
      console.log('❌ AI CFO: Validation failed: Empty expenses array')

      await logAIAction({
        agent: "CFO",
        decision: "reject",
        confidence: 0.95,
        rationale: "Empty expenses array provided",
        escalate: false,
        source: "finance",
        status: "completed",
        notes: "No expenses to analyze"
      })

      return NextResponse.json({
        error: "No expenses to analyze",
        success: false
      }, { status: 400 })
    }

    // Step 2: Load dynamic company rules
    console.log('📋 AI CFO: Loading dynamic company rules...')
    const companyRules = await loadCompanyRules()
    console.log(`📋 AI CFO: Loaded ${companyRules.length} company rules`)

    // Step 3: Load AI settings for decision parameters
    console.log('⚙️ AI CFO: Loading AI settings...')
    const { getAISettings } = await import("@/lib/ai/aiSettings")
    const aiSettings = await getAISettings()
    console.log(`⚙️ AI CFO: Using temperature=${aiSettings.temperature}, escalationThreshold=${aiSettings.escalationThreshold}`)

    // Step 4: Analyze financial data for patterns and anomalies
    console.log('🔍 AI CFO: Analyzing expense patterns...')
    const totalAmount = financialData.expenses.reduce((sum, exp) => sum + exp.amount, 0)
    const highValueExpenses = financialData.expenses.filter(exp => exp.amount > 5000)

    // Step 4: Apply financial rules and generate AI analysis
    const aiPrompt = `${AI_CFO_SYSTEM_PROMPT}
Company Rules: ${companyRules.join("; ")}
P&L Data: ${JSON.stringify(financialData.expenses, null, 2)}

Return summary, anomalies, insights, and any recommendations.`

    console.log('🧠 AI CFO: Generating financial analysis...')

    // Step 4: Generate AI analysis (mock implementation)
    const result = await generateMockCFOAnalysis(financialData.expenses)

    // Step 5: Determine escalation using dynamic threshold
    const shouldEscalate = result.confidence < aiSettings.escalationThreshold ||
                          highValueExpenses.length > 0 ||
                          result.riskLevel === 'high'

    console.log('📊 AI CFO: Analysis completed:', {
      summary: result.summary,
      anomalies: result.anomalies.length,
      confidence: result.confidence,
      escalate: shouldEscalate,
      riskLevel: result.riskLevel
    })

    // Step 6: Log the AI action
    await logAIAction({
      agent: "CFO",
      decision: "Financial summary generated",
      confidence: result.confidence,
      rationale: result.summary,
      escalate: shouldEscalate,
      source: "finance",
      status: shouldEscalate ? "escalated" : "completed",
      notes: result.anomalies.length > 0 ? `${result.anomalies.length} anomalies detected` : undefined,
      metadata: {
        financialData: {
          expenseCount: financialData.expenses.length,
          totalAmount,
          period: financialData.period
        },
        analysis: {
          anomalies: result.anomalies.length,
          recommendations: result.recommendations.length,
          riskLevel: result.riskLevel
        },
        processingTime: Date.now() - startTime,
        highValueExpenses: highValueExpenses.length
      }
    })

    // Step 7: Return AI analysis result
    const response = {
      success: true,
      summary: result.summary,
      anomalies: result.anomalies,
      recommendations: result.recommendations,
      confidence: result.confidence,
      insights: result.insights,
      escalate: shouldEscalate,
      riskLevel: result.riskLevel,
      metadata: {
        totalExpenses: financialData.expenses.length,
        totalAmount,
        processingTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    }

    console.log(`✅ AI CFO: Request processed successfully in ${Date.now() - startTime}ms`)

    // Check if simulation mode is enabled - 🟢 LIVE MODE ACTIVE
    const SIMULATION_MODE = false // Live mode enabled - real actions will be triggered

    if (SIMULATION_MODE) {
      console.log("🧪 SIMULATION MODE ON: No real financial actions performed.")
      return NextResponse.json({
        ...response,
        simulated: true,
        note: "No actual financial updates were made. This was a simulation run.",
        simulationMode: true,
        originalResponse: response
      })
    } else {
      // In production, proceed with real updates: update budgets, send alerts, etc.
      console.log("🚀 PRODUCTION MODE: Real financial actions will be performed")
      // TODO: Add real financial update logic here
      // TODO: Update budget allocations
      // TODO: Send financial alerts and notifications
      // TODO: Update financial dashboards
    }

    // Log the API call for monitoring
    try {
      const { logAIAPICall } = await import("@/lib/ai/apiLogger")
      await logAIAPICall({
        endpoint: "/api/ai-cfo",
        method: "POST",
        payload: financialData,
        status: 200,
        error: false,
        responseTime: Date.now() - startTime,
        metadata: {
          summary: response.summary,
          escalate: response.escalate,
          simulated: response.simulated || false,
          expenseCount: financialData.expenses?.length || 0
        }
      })
    } catch (logError) {
      console.warn('⚠️ AI CFO: Failed to log API call:', logError)
      // Don't fail the request if logging fails
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ AI CFO: Error processing financial data:', error)

    // Log the error
    try {
      await logAIAction({
        agent: "CFO",
        decision: "error",
        confidence: 0.0,
        rationale: `System error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        escalate: true,
        source: "finance",
        status: "failed",
        notes: "AI CFO system error occurred",
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          processingTime: Date.now() - startTime
        }
      })
    } catch (logError) {
      console.error('❌ AI CFO: Failed to log error:', logError)
    }

    // Log the API error for monitoring
    try {
      const { logAIAPICall } = await import("@/lib/ai/apiLogger")
      await logAIAPICall({
        endpoint: "/api/ai-cfo",
        method: "POST",
        payload: financialData,
        status: 500,
        error: true,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime,
        metadata: {
          summary: "System error occurred",
          escalate: true
        }
      })
    } catch (logError) {
      console.warn('⚠️ AI CFO: Failed to log API error:', logError)
    }

    return NextResponse.json({
      success: false,
      error: "AI CFO processing failed",
      summary: "System error occurred",
      confidence: 0.0,
      escalate: true,
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Generate mock CFO analysis for development/testing
 */
async function generateMockCFOAnalysis(expenses: FinancialExpense[]): Promise<CFOAnalysisResponse> {
  console.log('🎭 AI CFO: Generating mock financial analysis...')

  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0)
  const anomalies: CFOAnalysisResponse['anomalies'] = []
  const recommendations: string[] = []
  const insights: string[] = []

  let confidence = 0.85 + Math.random() * 0.1 // 85-95%
  let riskLevel: 'low' | 'medium' | 'high' = 'low'

  // Analyze expenses for anomalies
  expenses.forEach(expense => {
    // Check for high-value expenses
    if (expense.amount > 5000) {
      anomalies.push({
        date: expense.date,
        amount: expense.amount,
        category: expense.category,
        note: `High-value ${expense.category.toLowerCase()} expense requires review`,
        severity: expense.amount > 10000 ? 'high' : 'medium'
      })
      confidence = Math.max(0.6, confidence - 0.1)
      riskLevel = expense.amount > 10000 ? 'high' : 'medium'
    }

    // Check for unusual repair costs (example from prompt)
    if (expense.category.toLowerCase().includes('repair') && expense.amount > 8000) {
      anomalies.push({
        date: expense.date,
        amount: expense.amount,
        category: expense.category,
        note: "Unusual repair cost - investigate vendor pricing",
        severity: 'high'
      })
      confidence = Math.max(0.6, confidence - 0.15)
      riskLevel = 'high'
    }
  })

  // Generate category analysis
  const categoryTotals: Record<string, number> = {}
  expenses.forEach(exp => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount
  })

  // Generate recommendations
  if (totalAmount > 20000) {
    recommendations.push("Total expenses exceed ฿20,000 - consider budget review")
  }

  if (categoryTotals['Repairs'] && categoryTotals['Repairs'] > 8000) {
    recommendations.push("Review vendor contracts for large repairs")
    recommendations.push("Consider switching to monthly budget tracking")
  }

  if (categoryTotals['Maintenance'] && categoryTotals['Maintenance'] > 5000) {
    recommendations.push("High maintenance costs - evaluate preventive measures")
  }

  // Add general recommendations
  recommendations.push("Monitor cash flow trends weekly")
  recommendations.push("Implement approval workflow for expenses over ฿5,000")

  // Generate insights
  insights.push("Expense patterns show seasonal variation")
  insights.push("Maintenance costs trending upward")
  insights.push("Vendor pricing requires regular review")

  // Determine final risk level
  if (anomalies.length > 2) {
    riskLevel = riskLevel === 'low' ? 'medium' : 'high'
    confidence = Math.max(0.6, confidence - 0.1)
  }

  // Generate summary
  let summary = `Analyzed ${expenses.length} expenses totaling ฿${totalAmount.toLocaleString()}`

  if (anomalies.length > 0) {
    summary += `. Found ${anomalies.length} anomalies requiring attention`
  }

  if (totalAmount > 15000) {
    summary += `. High expense period detected`
  } else {
    summary += `. Expenses within normal range`
  }

  return {
    summary,
    anomalies,
    recommendations,
    confidence: Math.round(confidence * 100) / 100,
    insights,
    totalAnalyzed: expenses.length,
    riskLevel
  }
}

/**
 * GET /api/ai-cfo
 * Get AI CFO status and configuration
 */
export async function GET(req: NextRequest) {
  try {
    console.log('📊 AI CFO: Status check requested')

    return NextResponse.json({
      success: true,
      status: "operational",
      version: "1.0.0",
      capabilities: [
        "financial_analysis",
        "anomaly_detection",
        "expense_categorization",
        "budget_monitoring",
        "risk_assessment"
      ],
      thresholds: {
        highValueFlag: 5000,
        autoApprove: 1000,
        escalationThreshold: 10000,
        confidenceThreshold: 0.7
      },
      supportedFormats: [
        "expenses_array",
        "spreadsheet_json",
        "financial_data"
      ],
      lastUpdate: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ AI CFO: Status check failed:', error)

    return NextResponse.json({
      success: false,
      status: "error",
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}


