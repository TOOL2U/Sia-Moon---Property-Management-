/**
 * AI System Test Simulations
 * 
 * Test scripts for AI COO and CFO endpoints
 * Run with: node tests/ai-system-tests.js
 */

const BASE_URL = 'http://localhost:3000'

// Test data for simulations
const testData = {
  // Valid COO booking test
  validBooking: {
    bookingId: "TEST001",
    property: "Villa Mango",
    location: { lat: 9.7350, lng: 100.0010 },
    requestedDate: "2025-08-02",
    guestNote: "Allergy-friendly bedding requested",
    estimatedCost: 4800
  },

  // High-value booking (should escalate)
  highValueBooking: {
    bookingId: "TEST002",
    property: "Villa Lotus",
    location: { lat: 9.7311, lng: 100.0023 },
    requestedDate: "2025-08-05",
    guestNote: "VIP guest - premium service required",
    estimatedCost: 8500
  },

  // Malformed booking (missing location)
  malformedBooking: {
    bookingId: "TEST003",
    property: "Villa Rose",
    requestedDate: "2025-08-10",
    guestNote: "Missing location data",
    estimatedCost: 3200
  },

  // Valid CFO expenses
  validExpenses: {
    month: "2025-07",
    expenses: [
      { label: "Electrician Repair", amount: 6200 },
      { label: "Fuel", amount: 1600 },
      { label: "Villa Cleaner", amount: 1400 }
    ]
  },

  // Malformed expenses (missing month)
  malformedExpenses: {
    expenses: [
      { label: "Broken Test", amount: 1000 }
    ]
  }
}

/**
 * Make HTTP request
 */
async function makeRequest(endpoint, method = 'GET', data = null) {
  const url = `${BASE_URL}${endpoint}`
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  }

  if (data) {
    options.body = JSON.stringify(data)
  }

  try {
    const response = await fetch(url, options)
    const result = await response.json()
    
    return {
      status: response.status,
      success: response.ok,
      data: result
    }
  } catch (error) {
    return {
      status: 0,
      success: false,
      error: error.message
    }
  }
}

/**
 * Test AI COO Booking Decisions
 */
async function testCOOBookings() {
  console.log('\n🤖 Testing AI COO Booking Decisions...\n')

  // Test 1: Valid booking (should approve)
  console.log('📋 Test 1: Valid Booking (Expected: Approved)')
  const test1 = await makeRequest('/api/ai-coo', 'POST', testData.validBooking)
  console.log(`Status: ${test1.status}`)
  console.log(`Decision: ${test1.data.decision}`)
  console.log(`Confidence: ${test1.data.confidence}%`)
  console.log(`Escalated: ${test1.data.escalate}`)
  console.log(`Logs: ${test1.data.logs?.length || 0} entries`)
  
  // Validate expectations
  if (test1.success && test1.data.decision === 'approved' && test1.data.confidence > 85) {
    console.log('✅ Test 1 PASSED\n')
  } else {
    console.log('❌ Test 1 FAILED\n')
  }

  // Test 2: High-value booking (should escalate)
  console.log('📋 Test 2: High-Value Booking (Expected: Escalated)')
  const test2 = await makeRequest('/api/ai-coo', 'POST', testData.highValueBooking)
  console.log(`Status: ${test2.status}`)
  console.log(`Decision: ${test2.data.decision}`)
  console.log(`Confidence: ${test2.data.confidence}%`)
  console.log(`Escalated: ${test2.data.escalate}`)
  
  if (test2.success && test2.data.escalate === true) {
    console.log('✅ Test 2 PASSED\n')
  } else {
    console.log('❌ Test 2 FAILED\n')
  }

  // Test 3: Malformed booking (should return 400)
  console.log('📋 Test 3: Malformed Booking (Expected: 400 Error)')
  const test3 = await makeRequest('/api/ai-coo', 'POST', testData.malformedBooking)
  console.log(`Status: ${test3.status}`)
  console.log(`Error: ${test3.data.error}`)
  console.log(`Escalated: ${test3.data.escalate}`)
  
  if (test3.status === 400 && test3.data.escalate === true) {
    console.log('✅ Test 3 PASSED\n')
  } else {
    console.log('❌ Test 3 FAILED\n')
  }
}

/**
 * Test AI CFO Financial Analysis
 */
async function testCFOExpenses() {
  console.log('\n💰 Testing AI CFO Financial Analysis...\n')

  // Test 1: Valid expenses (should flag high amounts)
  console.log('📊 Test 1: Valid Expenses (Expected: Flag >฿5000)')
  const test1 = await makeRequest('/api/ai-cfo', 'POST', testData.validExpenses)
  console.log(`Status: ${test1.status}`)
  console.log(`Confidence: ${test1.data.confidence}%`)
  console.log(`Escalated: ${test1.data.escalate}`)
  console.log(`Anomalies: ${test1.data.anomalies?.length || 0}`)
  console.log(`Total Amount: ฿${test1.data.totalAmount}`)
  
  if (test1.data.anomalies) {
    test1.data.anomalies.forEach(anomaly => {
      console.log(`  - ${anomaly}`)
    })
  }
  
  // Validate expectations
  if (test1.success && test1.data.confidence > 90 && test1.data.escalate === true) {
    console.log('✅ Test 1 PASSED\n')
  } else {
    console.log('❌ Test 1 FAILED\n')
  }

  // Test 2: Malformed expenses (should return 400)
  console.log('📊 Test 2: Malformed Expenses (Expected: 400 Error)')
  const test2 = await makeRequest('/api/ai-cfo', 'POST', testData.malformedExpenses)
  console.log(`Status: ${test2.status}`)
  console.log(`Error: ${test2.data.error}`)
  console.log(`Escalated: ${test2.data.escalate}`)
  
  if (test2.status === 400 && test2.data.escalate === true) {
    console.log('✅ Test 2 PASSED\n')
  } else {
    console.log('❌ Test 2 FAILED\n')
  }
}

/**
 * Test AI Logging System
 */
async function testAILogging() {
  console.log('\n📝 Testing AI Logging System...\n')

  // Test manual log entry
  const testLog = {
    timestamp: new Date().toISOString(),
    agent: "COO",
    decision: "Test log entry from simulation",
    confidence: 95,
    source: "auto",
    escalation: false,
    notes: "This is a test log entry"
  }

  console.log('📋 Test: Manual Log Entry')
  const test1 = await makeRequest('/api/ai-log', 'POST', testLog)
  console.log(`Status: ${test1.status}`)
  console.log(`Success: ${test1.data.success}`)
  console.log(`Log ID: ${test1.data.logId}`)
  
  if (test1.success && test1.data.logId) {
    console.log('✅ Logging Test PASSED\n')
  } else {
    console.log('❌ Logging Test FAILED\n')
  }

  // Test log retrieval
  console.log('📋 Test: Log Retrieval')
  const test2 = await makeRequest('/api/ai-log', 'GET')
  console.log(`Status: ${test2.status}`)
  console.log(`Logs Retrieved: ${test2.data.logs?.length || 0}`)
  
  if (test2.success) {
    console.log('✅ Log Retrieval Test PASSED\n')
  } else {
    console.log('❌ Log Retrieval Test FAILED\n')
  }
}

/**
 * Test Agent Status Endpoints
 */
async function testAgentStatus() {
  console.log('\n🔍 Testing Agent Status Endpoints...\n')

  // Test COO status
  console.log('📋 Test: AI COO Status')
  const cooStatus = await makeRequest('/api/ai-coo', 'GET')
  console.log(`Status: ${cooStatus.status}`)
  console.log(`Agent: ${cooStatus.data.agent}`)
  console.log(`Simulation Mode: ${cooStatus.data.simulationMode}`)
  console.log(`Capabilities: ${cooStatus.data.capabilities?.length || 0}`)
  
  // Test CFO status
  console.log('\n📋 Test: AI CFO Status')
  const cfoStatus = await makeRequest('/api/ai-cfo', 'GET')
  console.log(`Status: ${cfoStatus.status}`)
  console.log(`Agent: ${cfoStatus.data.agent}`)
  console.log(`Simulation Mode: ${cfoStatus.data.simulationMode}`)
  console.log(`Thresholds: ${Object.keys(cfoStatus.data.thresholds || {}).length}`)
  
  if (cooStatus.success && cfoStatus.success) {
    console.log('\n✅ Agent Status Tests PASSED\n')
  } else {
    console.log('\n❌ Agent Status Tests FAILED\n')
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting AI System Test Suite...')
  console.log('=' .repeat(50))

  try {
    await testAgentStatus()
    await testCOOBookings()
    await testCFOExpenses()
    await testAILogging()
    
    console.log('🎉 Test Suite Complete!')
    console.log('=' .repeat(50))
    
  } catch (error) {
    console.error('❌ Test Suite Failed:', error)
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests()
}

module.exports = {
  testCOOBookings,
  testCFOExpenses,
  testAILogging,
  testAgentStatus,
  runAllTests,
  testData
}
