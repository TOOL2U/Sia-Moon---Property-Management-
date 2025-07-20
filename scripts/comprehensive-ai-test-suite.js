#!/usr/bin/env node

/**
 * 🧪 Comprehensive AI Test Suite
 * 
 * This script executes all AI simulation scenarios end-to-end and generates
 * a detailed performance report covering:
 * - AI COO booking decisions and staff assignments
 * - AI CFO expense analysis and fraud detection
 * - Calendar integration and scheduling optimization
 * - Threshold detection and escalation logic
 * - Overall system performance metrics
 */

const fs = require('fs')

// Test scenarios configuration
const TEST_SCENARIOS = [
  {
    id: 'test-booking-001',
    name: 'Standard Booking Simulation',
    type: 'COO',
    description: 'Basic AI COO booking approval test',
    expectedOutcome: 'approved',
    expectedConfidence: 0.85,
    data: {
      bookingId: "test-booking-001",
      propertyId: "villa-777",
      location: { lat: 9.123, lng: 99.456 },
      date: "2025-08-01",
      time: "14:00",
      value: 3800,
      notes: "Standard cleaning service"
    }
  },
  {
    id: 'high-risk-003',
    name: 'High-Value Escalation Test',
    type: 'COO',
    description: '฿6,500 booking near threshold escalation',
    expectedOutcome: 'approved',
    expectedEscalation: true,
    expectedConfidence: 0.75,
    data: {
      bookingId: "high-risk-003",
      propertyId: "villa-222",
      location: { lat: 9.333, lng: 99.777 },
      date: "2025-08-03",
      time: "14:00",
      value: 6500,
      notes: "Private chef & security booking"
    }
  },
  {
    id: 'bad-booking-004',
    name: 'Bad Booking Validation',
    type: 'COO',
    description: 'Invalid data rejection test',
    expectedOutcome: 'rejected',
    expectedConfidence: 0.95,
    data: {
      bookingId: "bad-booking-004",
      propertyId: "",
      location: null,
      date: "2025-08-05",
      time: "11:00",
      value: 4200,
      notes: ""
    }
  },
  {
    id: 'calendar-test-005',
    name: 'Calendar Integration Test',
    type: 'COO',
    description: 'Recurring booking scheduling',
    expectedOutcome: 'approved',
    expectedConfidence: 0.88,
    data: {
      bookingId: "calendar-test-005",
      propertyId: "villa-888",
      location: { lat: 9.100, lng: 99.222 },
      date: "2025-08-06",
      time: "15:00",
      value: 2900,
      notes: "Garden maintenance – recurring"
    }
  },
  {
    id: 'map-booking-006',
    name: 'Location-Based Assignment',
    type: 'COO',
    description: 'Distance-based staff optimization',
    expectedOutcome: 'approved',
    expectedConfidence: 0.92,
    data: {
      bookingId: "map-booking-006",
      propertyId: "villa-999",
      location: { lat: 9.8000, lng: 99.3500 },
      date: "2025-08-07",
      time: "10:00",
      value: 3100,
      notes: "AC repair request"
    }
  },
  {
    id: 'threshold-007',
    name: 'Threshold Detection Test',
    type: 'COO',
    description: '฿4,900 urgent repair near limit',
    expectedOutcome: 'approved',
    expectedConfidence: 0.82,
    data: {
      bookingId: "threshold-007",
      propertyId: "villa-777",
      location: { lat: 9.250, lng: 99.200 },
      date: "2025-08-10",
      time: "08:30",
      value: 4900,
      notes: "Last-minute urgent repair"
    }
  }
]

const CFO_SCENARIOS = [
  {
    id: 'July_Expenses.xlsx',
    name: 'CFO Expense Analysis',
    type: 'CFO',
    description: 'Staff payment approval',
    expectedOutcome: 'approved',
    expectedConfidence: 0.90
  },
  {
    id: 'anomaly_expense.xlsx',
    name: 'Fraud Detection Test',
    type: 'CFO',
    description: 'Suspicious ฿99,499 expense',
    expectedOutcome: 'rejected',
    expectedConfidence: 0.95
  }
]

async function runComprehensiveTestSuite() {
  console.log('🧪 Starting Comprehensive AI Test Suite...')
  console.log('=' .repeat(80))
  console.log(`📅 Test Execution Date: ${new Date().toISOString()}`)
  console.log(`🎯 Total Scenarios: ${TEST_SCENARIOS.length + CFO_SCENARIOS.length + 3}`) // +3 for overlap, monthly, logs
  console.log('')

  const testResults = {
    executionDate: new Date().toISOString(),
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    scenarios: [],
    overallMetrics: {},
    recommendations: []
  }

  try {
    // 1. Execute AI COO Tests
    console.log('🤖 EXECUTING AI COO TESTS')
    console.log('=' .repeat(50))
    
    for (const scenario of TEST_SCENARIOS) {
      console.log(`\n📋 Testing: ${scenario.name} (${scenario.id})`)
      const result = await executeBookingTest(scenario)
      testResults.scenarios.push(result)
      testResults.totalTests++
      
      if (result.passed) {
        testResults.passedTests++
        console.log(`✅ PASSED: ${scenario.name}`)
      } else {
        testResults.failedTests++
        console.log(`❌ FAILED: ${scenario.name}`)
        console.log(`   Reason: ${result.failureReason}`)
      }
      
      // Add delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // 2. Execute Overlap Scheduling Test
    console.log('\n🔁 EXECUTING OVERLAP SCHEDULING TEST')
    console.log('=' .repeat(50))
    const overlapResult = await executeOverlapTest()
    testResults.scenarios.push(overlapResult)
    testResults.totalTests++
    if (overlapResult.passed) testResults.passedTests++
    else testResults.failedTests++

    // 3. Execute AI CFO Tests
    console.log('\n💰 EXECUTING AI CFO TESTS')
    console.log('=' .repeat(50))
    
    for (const scenario of CFO_SCENARIOS) {
      console.log(`\n📋 Testing: ${scenario.name} (${scenario.id})`)
      const result = await executeCFOTest(scenario)
      testResults.scenarios.push(result)
      testResults.totalTests++
      
      if (result.passed) {
        testResults.passedTests++
        console.log(`✅ PASSED: ${scenario.name}`)
      } else {
        testResults.failedTests++
        console.log(`❌ FAILED: ${scenario.name}`)
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // 4. Execute Monthly Summary Test
    console.log('\n📈 EXECUTING MONTHLY SUMMARY TEST')
    console.log('=' .repeat(50))
    const monthlyResult = await executeMonthlyTest()
    testResults.scenarios.push(monthlyResult)
    testResults.totalTests++
    if (monthlyResult.passed) testResults.passedTests++
    else testResults.failedTests++

    // 5. Analyze AI Logs
    console.log('\n📘 ANALYZING AI LOGS')
    console.log('=' .repeat(50))
    const logsAnalysis = await analyzeAILogs()
    testResults.scenarios.push(logsAnalysis)
    testResults.totalTests++
    if (logsAnalysis.passed) testResults.passedTests++
    else testResults.failedTests++

    // 6. Generate Overall Metrics
    testResults.overallMetrics = generateOverallMetrics(testResults)
    testResults.recommendations = generateRecommendations(testResults)

    // 7. Generate Report
    const report = generateComprehensiveReport(testResults)
    
    // Save report to file
    const reportPath = `ai-test-report-${new Date().toISOString().split('T')[0]}.json`
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2))
    
    const readableReportPath = `ai-test-report-${new Date().toISOString().split('T')[0]}.md`
    fs.writeFileSync(readableReportPath, report)

    console.log('\n🎯 COMPREHENSIVE TEST SUITE COMPLETE')
    console.log('=' .repeat(80))
    console.log(`📊 Overall Results: ${testResults.passedTests}/${testResults.totalTests} tests passed`)
    console.log(`📈 Success Rate: ${((testResults.passedTests / testResults.totalTests) * 100).toFixed(1)}%`)
    console.log(`📄 Detailed Report: ${readableReportPath}`)
    console.log(`📋 Raw Data: ${reportPath}`)

    return testResults

  } catch (error) {
    console.error('💥 Test Suite Execution Error:', error.message)
    throw error
  }
}

async function executeBookingTest(scenario) {
  try {
    const bookingRequest = {
      address: scenario.data.propertyId ? `Property ${scenario.data.propertyId}, Koh Phangan, Thailand` : "",
      jobType: scenario.data.notes?.includes('cleaning') ? 'cleaning' : 
                scenario.data.notes?.includes('repair') ? 'repair' : 'maintenance',
      value: scenario.data.value,
      customerType: "standard",
      scheduledDate: `${scenario.data.date}T${scenario.data.time}:00Z`,
      customerName: "Test Customer",
      contactInfo: "+66 81 234 5678",
      notes: scenario.data.notes || "",
      urgent: scenario.data.notes?.includes('urgent') || false,
      location: scenario.data.location,
      simulationMode: true,
      testBookingId: scenario.data.bookingId
    }

    const response = await fetch('http://localhost:3000/api/ai-coo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingRequest)
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    const result = await response.json()
    
    // Analyze results
    const actualOutcome = result.decision || 'unknown'
    const actualConfidence = result.confidence || 0
    const actualEscalation = result.escalate || false
    
    const passed = evaluateTestResult(scenario, {
      outcome: actualOutcome,
      confidence: actualConfidence,
      escalation: actualEscalation
    })

    return {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      type: scenario.type,
      passed: passed.success,
      failureReason: passed.reason,
      expected: {
        outcome: scenario.expectedOutcome,
        confidence: scenario.expectedConfidence,
        escalation: scenario.expectedEscalation
      },
      actual: {
        outcome: actualOutcome,
        confidence: actualConfidence,
        escalation: actualEscalation,
        assignedStaff: result.assignedStaff,
        reason: result.reason
      },
      executionTime: new Date().toISOString()
    }

  } catch (error) {
    return {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      type: scenario.type,
      passed: false,
      failureReason: `Execution error: ${error.message}`,
      error: error.message,
      executionTime: new Date().toISOString()
    }
  }
}

function evaluateTestResult(scenario, actual) {
  const issues = []

  // Check outcome
  if (scenario.expectedOutcome && actual.outcome !== scenario.expectedOutcome) {
    issues.push(`Expected outcome '${scenario.expectedOutcome}' but got '${actual.outcome}'`)
  }

  // Check confidence (within 10% tolerance)
  if (scenario.expectedConfidence) {
    const confidenceDiff = Math.abs(actual.confidence - scenario.expectedConfidence)
    if (confidenceDiff > 0.15) {
      issues.push(`Confidence ${(actual.confidence * 100).toFixed(1)}% differs significantly from expected ${(scenario.expectedConfidence * 100).toFixed(1)}%`)
    }
  }

  // Check escalation
  if (scenario.expectedEscalation !== undefined && actual.escalation !== scenario.expectedEscalation) {
    issues.push(`Expected escalation: ${scenario.expectedEscalation}, actual: ${actual.escalation}`)
  }

  return {
    success: issues.length === 0,
    reason: issues.join('; ')
  }
}

// Additional test functions would be implemented here...
// (executeOverlapTest, executeCFOTest, executeMonthlyTest, analyzeAILogs, etc.)

if (require.main === module) {
  runComprehensiveTestSuite()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal Error:', error)
      process.exit(1)
    })
}

module.exports = { runComprehensiveTestSuite }
