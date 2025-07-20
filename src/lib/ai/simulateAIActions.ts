/**
 * AI Action Module
 *
 * This module provides functions to execute AI actions.
 * 🟢 LIVE MODE: SIMULATION_MODE = false - Real actions will be triggered
 */

import { SIMULATION_MODE } from '@/lib/config'

// Interface for test results
interface AITestResult {
  success: boolean
  testCase: string
  agent: 'COO' | 'CFO'
  response?: any
  error?: string
  timestamp: string
  duration: number
  simulated: boolean
  liveMode?: boolean
  realActionsTriggered?: boolean
}

// Interface for booking simulation
interface BookingSimulation {
  bookingId: string
  propertyId: string
  location: { lat: number; lng: number }
  date: string
  time: string
  value: number
  notes: string
}

// Interface for CFO P&L upload simulation
interface CFOUploadSimulation {
  fileName: string
  uploadedBy: string
  totalAmount: number
  category: string
  notes: string
}

/**
 * Run AI Booking Test
 * Simulates a booking scenario and tests AI COO decision making
 */
export async function runAIBookingTest(testCaseId: string): Promise<AITestResult> {
  const startTime = Date.now()
  console.log(`🧪 Starting AI Booking Test: ${testCaseId}`)

  const testCases = {
    "booking1": {
      bookingId: "B001",
      location: "Haad Rin",
      task: "Villa Cleaning",
      price: 3500,
      preferredDate: "2025-07-26",
      staffNearby: [
        { name: "Som", distanceKm: 2.1, available: true },
        { name: "Noi", distanceKm: 4.3, available: false }
      ],
      simulate: true,
      testMode: true
    },
    "booking2": {
      bookingId: "B002",
      location: "Thong Sala",
      task: "Deep Cleaning + Laundry",
      price: 7400,
      preferredDate: "2025-07-27",
      staffNearby: [
        { name: "Dao", distanceKm: 3.0, available: true }
      ],
      simulate: true,
      testMode: true
    },
    "booking3": {
      bookingId: "B003",
      location: "Thong Nai Pan",
      task: "Pool Maintenance",
      price: 2000,
      preferredDate: "2025-07-28",
      staffNearby: [
        { name: "Lek", distanceKm: 6.2, available: true }
      ],
      simulate: true,
      testMode: true
    }
  };

  const testCase = testCases[testCaseId as keyof typeof testCases];
  if (!testCase) {
    throw new Error(`Test case ${testCaseId} not found`)
  }

  try {
    console.log('📤 Sending booking test to AI COO:', testCase)

    const response = await fetch("/api/ai-coo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testCase)
    });

    if (!response.ok) {
      throw new Error(`AI COO API error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    const duration = Date.now() - startTime

    console.log('✅ AI COO Response:', result)

    return {
      success: true,
      testCase: testCaseId,
      agent: 'COO',
      response: result,
      timestamp: new Date().toISOString(),
      duration,
      simulated: true
    }

  } catch (error) {
    const duration = Date.now() - startTime
    console.error('❌ AI Booking Test Failed:', error)

    return {
      success: false,
      testCase: testCaseId,
      agent: 'COO',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      duration,
      simulated: true
    }
  }
}

/**
 * Run AI CFO Test
 * Simulates spreadsheet upload and tests AI CFO analysis
 */
export async function runAICFOTest(): Promise<AITestResult> {
  const startTime = Date.now()
  console.log('🧪 Starting AI CFO Test')

  const payload = {
    spreadsheetId: "P&L_June.xlsx",
    expenses: [
      {
        date: "2024-06-01",
        category: "Cleaning Supplies",
        amount: 2500,
        description: "Monthly cleaning supplies purchase"
      },
      {
        date: "2024-06-02",
        category: "Staff Wages",
        amount: 15000,
        description: "Weekly staff payments"
      }
    ],
    simulate: true,
    testMode: true
  };

  try {
    console.log('📤 Sending CFO test to AI CFO:', payload)

    const response = await fetch("/api/ai-cfo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`AI CFO API error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    const duration = Date.now() - startTime

    console.log('✅ AI CFO Response:', result)

    return {
      success: true,
      testCase: 'cfo_analysis',
      agent: 'CFO',
      response: result,
      timestamp: new Date().toISOString(),
      duration,
      simulated: true
    }

  } catch (error) {
    const duration = Date.now() - startTime
    console.error('❌ AI CFO Test Failed:', error)

    return {
      success: false,
      testCase: 'cfo_analysis',
      agent: 'CFO',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      duration,
      simulated: true
    }
  }
}

/**
 * Execute COO Booking Decision
 * 🟢 LIVE MODE: Real actions will be triggered when SIMULATION_MODE = false
 */
export async function simulateCOOBooking(booking: BookingSimulation): Promise<AITestResult> {
  const startTime = Date.now()
  const modePrefix = SIMULATION_MODE ? '🧪 SIMULATION' : '🟢 LIVE MODE'
  console.log(`${modePrefix}: Processing COO Booking: ${booking.bookingId}`)

  try {
    // Prepare booking request for AI COO
    const bookingRequest = {
      address: `Property ${booking.propertyId}, Lat: ${booking.location.lat}, Lng: ${booking.location.lng}`,
      jobType: booking.notes?.includes('cleaning') ? 'cleaning' :
                booking.notes?.includes('repair') ? 'repair' : 'maintenance',
      value: booking.value,
      customerType: "standard",
      scheduledDate: `${booking.date}T${booking.time}:00Z`,
      customerName: (booking as any).customerName || "Test Customer",
      customerEmail: (booking as any).customerEmail || "test@example.com",
      contactInfo: (booking as any).customerPhone || "+66 81 234 5678",
      notes: booking.notes,
      urgent: booking.notes?.includes('urgent') || false,
      location: booking.location,
      // Live mode configuration
      simulationMode: SIMULATION_MODE,
      liveMode: !SIMULATION_MODE,
      testBookingId: booking.bookingId
    }

    console.log('📋 Booking Request:', bookingRequest)

    // Call AI COO API
    const response = await fetch('/api/ai-coo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingRequest)
    })

    if (!response.ok) {
      throw new Error(`AI COO API error: ${response.status}`)
    }

    const cooDecision = await response.json()
    const duration = Date.now() - startTime

    console.log('🤖 AI COO Decision:', cooDecision)

    // Log the booking result
    const logEntry = {
      agent: 'COO',
      action: SIMULATION_MODE ? 'booking_simulation' : 'booking_live',
      input: bookingRequest,
      output: cooDecision,
      confidence: cooDecision.confidence || 0,
      timestamp: new Date().toISOString(),
      simulationMode: SIMULATION_MODE,
      liveMode: !SIMULATION_MODE,
      testCase: booking.bookingId,
      source: SIMULATION_MODE ? 'simulation' : 'live_booking'
    }

    // Send to AI log
    try {
      await fetch('/api/ai-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry)
      })
    } catch (logError) {
      console.warn(`⚠️ Failed to log ${SIMULATION_MODE ? 'simulation' : 'live booking'}:`, logError)
    }

    return {
      success: true,
      testCase: booking.bookingId,
      agent: 'COO',
      response: cooDecision,
      timestamp: new Date().toISOString(),
      duration,
      simulated: SIMULATION_MODE,
      liveMode: !SIMULATION_MODE,
      realActionsTriggered: !SIMULATION_MODE
    }

  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`❌ COO Booking ${SIMULATION_MODE ? 'Simulation' : 'Live Processing'} Failed:`, error)

    return {
      success: false,
      testCase: booking.bookingId,
      agent: 'COO',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      duration,
      simulated: SIMULATION_MODE,
      liveMode: !SIMULATION_MODE
    }
  }
}

/**
 * Simulate CFO P&L Upload Analysis
 * Tests AI CFO with realistic expense upload scenario
 */
export async function simulateCFOUpload(upload: CFOUploadSimulation): Promise<AITestResult> {
  const startTime = Date.now()
  console.log(`🧪 Simulating CFO P&L Upload: ${upload.fileName}`)

  try {
    // Generate realistic expense data based on the upload parameters
    const expenseData = generateExpenseData(upload)

    console.log('📊 P&L Upload Data:', expenseData)

    // Call AI CFO API
    const response = await fetch('/api/ai-cfo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expenseData)
    })

    if (!response.ok) {
      throw new Error(`AI CFO API error: ${response.status}`)
    }

    const cfoAnalysis = await response.json()
    const duration = Date.now() - startTime

    console.log('💰 AI CFO Analysis:', cfoAnalysis)

    // Log the simulation result
    const logEntry = {
      agent: 'CFO',
      action: 'expense_upload_analysis',
      input: expenseData,
      output: cfoAnalysis,
      confidence: cfoAnalysis.confidence || 0,
      timestamp: new Date().toISOString(),
      simulationMode: true,
      testCase: upload.fileName,
      source: `upload_${upload.fileName.replace(/[^a-zA-Z0-9]/g, '_')}`
    }

    // Send to AI log
    try {
      await fetch('/api/ai-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry)
      })
    } catch (logError) {
      console.warn('⚠️ Failed to log CFO simulation:', logError)
    }

    return {
      success: true,
      testCase: upload.fileName,
      agent: 'CFO',
      response: cfoAnalysis,
      timestamp: new Date().toISOString(),
      duration,
      simulated: true
    }

  } catch (error) {
    const duration = Date.now() - startTime
    console.error('❌ CFO Upload Simulation Failed:', error)

    return {
      success: false,
      testCase: upload.fileName,
      agent: 'CFO',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      duration,
      simulated: true
    }
  }
}

/**
 * Generate realistic expense data for CFO analysis
 */
function generateExpenseData(upload: CFOUploadSimulation) {
  const baseExpenses = []

  // Generate individual expense entries based on category and total amount
  if (upload.category === "Staff Payments") {
    // Break down staff payments into individual entries
    const staffMembers = [
      { name: "Somchai Jaidee", role: "Senior Cleaner", rate: 4500 },
      { name: "Niran Thanakit", role: "Maintenance Tech", rate: 5200 },
      { name: "Ploy Siriporn", role: "Housekeeper", rate: 4200 },
      { name: "Kamon Rattana", role: "Security Guard", rate: 4800 },
      { name: "Malee Suksawat", role: "Cleaner", rate: 3800 },
      { name: "Prasert Wongsiri", role: "Gardener", rate: 3500 }
    ]

    let remainingAmount = upload.totalAmount
    staffMembers.forEach((staff, index) => {
      if (remainingAmount > 0 && index < 5) { // Limit to 5 staff for this simulation
        const amount = Math.min(staff.rate, remainingAmount)
        baseExpenses.push({
          amount: amount,
          category: "staff_salaries",
          vendor: `Staff Payment - ${staff.name}`,
          description: `Monthly salary - ${staff.role}`,
          date: new Date().toISOString().split('T')[0],
          receipt: `payroll_${staff.name.replace(/\s+/g, '_').toLowerCase()}.pdf`,
          approved: false
        })
        remainingAmount -= amount
      }
    })

    // Add any remaining amount as overtime or bonus
    if (remainingAmount > 0) {
      baseExpenses.push({
        amount: remainingAmount,
        category: "staff_overtime",
        vendor: "Staff Overtime & Bonuses",
        description: "Additional payments and performance bonuses",
        date: new Date().toISOString().split('T')[0],
        receipt: "overtime_summary.pdf",
        approved: false
      })
    }
  } else {
    // Generate generic expense based on category
    baseExpenses.push({
      amount: upload.totalAmount,
      category: upload.category.toLowerCase().replace(/\s+/g, '_'),
      vendor: `${upload.category} Vendor`,
      description: upload.notes,
      date: new Date().toISOString().split('T')[0],
      receipt: upload.fileName,
      approved: false
    })
  }

  return {
    uploadMetadata: {
      fileName: upload.fileName,
      uploadedBy: upload.uploadedBy,
      uploadDate: new Date().toISOString(),
      totalAmount: upload.totalAmount,
      category: upload.category,
      notes: upload.notes,
      simulationMode: true
    },
    expenses: baseExpenses,
    analysisRequest: {
      checkBudgetCompliance: true,
      detectAnomalies: true,
      categorizationReview: true,
      approvalRecommendation: true
    }
  }
}

/**
 * Generate Monthly Financial Summary
 * Simulates AI CFO's comprehensive financial analysis and reporting
 */
export async function generateMonthlySummary(month: string): Promise<any> {
  const startTime = Date.now()
  console.log(`📈 Generating Monthly Financial Summary for ${month}`)

  try {
    // Generate comprehensive financial data for the month
    const financialData = generateMonthlyFinancialData(month)

    console.log('📊 Monthly Financial Data:', financialData)

    // Call AI CFO API for analysis
    const response = await fetch('/api/ai-cfo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...financialData,
        analysisRequest: {
          monthlyReport: true,
          performanceAnalysis: true,
          budgetVarianceAnalysis: true,
          profitabilityAnalysis: true,
          cashFlowAnalysis: true,
          forecastingAnalysis: true,
          recommendationsRequired: true
        }
      })
    })

    if (!response.ok) {
      throw new Error(`AI CFO API error: ${response.status}`)
    }

    const cfoAnalysis = await response.json()
    const duration = Date.now() - startTime

    console.log('💰 AI CFO Monthly Analysis:', cfoAnalysis)

    // Log the monthly summary
    const logEntry = {
      agent: 'CFO',
      action: 'monthly_financial_summary',
      input: financialData,
      output: cfoAnalysis,
      confidence: cfoAnalysis.confidence || 0,
      timestamp: new Date().toISOString(),
      simulationMode: true,
      testCase: `monthly_summary_${month}`,
      source: `monthly_${month.replace('-', '_')}`
    }

    // Send to AI log
    try {
      await fetch('/api/ai-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry)
      })
    } catch (logError) {
      console.warn('⚠️ Failed to log monthly summary:', logError)
    }

    return {
      success: true,
      month: month,
      agent: 'CFO',
      summary: cfoAnalysis,
      financialData: financialData,
      timestamp: new Date().toISOString(),
      duration,
      simulated: true
    }

  } catch (error) {
    const duration = Date.now() - startTime
    console.error('❌ Monthly Summary Generation Failed:', error)

    return {
      success: false,
      month: month,
      agent: 'CFO',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      duration,
      simulated: true
    }
  }
}

/**
 * Generate realistic monthly financial data
 */
function generateMonthlyFinancialData(month: string) {
  const [year, monthNum] = month.split('-')
  const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleString('default', { month: 'long' })

  // Revenue streams
  const revenue = {
    propertyManagement: 145000,
    cleaningServices: 89000,
    maintenanceServices: 67000,
    securityServices: 34000,
    additionalServices: 23000,
    total: 358000
  }

  // Operating expenses
  const expenses = {
    staffSalaries: 124000,
    utilities: 23000,
    supplies: 18000,
    marketing: 15000,
    insurance: 12000,
    equipment: 8000,
    transportation: 6000,
    miscellaneous: 4000,
    total: 210000
  }

  // Include test scenario expenses
  const testExpenses = [
    {
      amount: 24500,
      category: "staff_payments",
      description: "Monthly staff payments (July_Expenses.xlsx)",
      source: "cfo_simulation"
    },
    {
      amount: 99499,
      category: "marketing_flagged",
      description: "Bangkok marketing event (FLAGGED - anomaly_expense.xlsx)",
      source: "fraud_detection",
      status: "under_review"
    }
  ]

  // Financial metrics
  const metrics = {
    grossProfit: revenue.total - expenses.total,
    grossMargin: ((revenue.total - expenses.total) / revenue.total) * 100,
    operatingCashFlow: 148000,
    currentRatio: 2.3,
    quickRatio: 1.8,
    debtToEquity: 0.4
  }

  // Budget comparison
  const budget = {
    revenue: {
      target: 350000,
      actual: revenue.total,
      variance: revenue.total - 350000,
      variancePercent: ((revenue.total - 350000) / 350000) * 100
    },
    expenses: {
      target: 200000,
      actual: expenses.total,
      variance: expenses.total - 200000,
      variancePercent: ((expenses.total - 200000) / 200000) * 100
    }
  }

  return {
    reportMetadata: {
      month: month,
      monthName: monthName,
      year: parseInt(year),
      generatedDate: new Date().toISOString(),
      reportType: "monthly_financial_summary",
      simulationMode: true
    },
    revenue: revenue,
    expenses: expenses,
    testExpenses: testExpenses,
    metrics: metrics,
    budget: budget,
    cashFlow: {
      beginningBalance: 245000,
      totalInflows: revenue.total,
      totalOutflows: expenses.total,
      netCashFlow: revenue.total - expenses.total,
      endingBalance: 245000 + (revenue.total - expenses.total)
    },
    kpis: {
      revenueGrowth: 8.5, // % vs previous month
      expenseGrowth: 5.2, // % vs previous month
      profitMargin: ((revenue.total - expenses.total) / revenue.total) * 100,
      customerSatisfaction: 4.7, // out of 5
      staffUtilization: 87.3, // %
      averageJobValue: 2850 // THB
    }
  }
}
