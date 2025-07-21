/**
 * Multi-Model AI Routing Test Suite
 * Test the intelligent routing between ChatGPT and Claude
 */

import { analyzeMessageForRouting, routeAIMessage, getModelInfo, getAvailableModels } from '@/lib/ai/aiRouter'

// Test messages for different task types
const testMessages = [
  // Analysis tasks (should route to Claude)
  {
    message: "Analyze the financial performance of our bookings this quarter and identify trends",
    expectedModel: 'claude',
    expectedTaskType: 'analysis'
  },
  {
    message: "Review the current staff workload distribution and assess efficiency",
    expectedModel: 'claude',
    expectedTaskType: 'analysis'
  },
  {
    message: "Examine the booking patterns and compare them to last year's data",
    expectedModel: 'claude',
    expectedTaskType: 'analysis'
  },

  // Planning tasks (should route to Claude)
  {
    message: "Plan the optimal staff schedule for next week based on bookings",
    expectedModel: 'claude',
    expectedTaskType: 'planning'
  },
  {
    message: "Develop a strategy to improve our booking conversion rates",
    expectedModel: 'claude',
    expectedTaskType: 'planning'
  },
  {
    message: "Organize the maintenance schedule to minimize guest disruption",
    expectedModel: 'claude',
    expectedTaskType: 'planning'
  },

  // Action tasks (should route to ChatGPT)
  {
    message: "Create a new booking for Villa Sunset on July 25th",
    expectedModel: 'chatgpt',
    expectedTaskType: 'action'
  },
  {
    message: "Assign staff member John to the cleaning job at Villa Paradise",
    expectedModel: 'chatgpt',
    expectedTaskType: 'action'
  },
  {
    message: "Update the booking status to confirmed and send notification",
    expectedModel: 'chatgpt',
    expectedTaskType: 'action'
  },

  // Creative tasks (should route to ChatGPT)
  {
    message: "Write a welcome message for new guests at our luxury villas",
    expectedModel: 'chatgpt',
    expectedTaskType: 'creative'
  },
  {
    message: "Compose a professional email to apologize for the maintenance delay",
    expectedModel: 'chatgpt',
    expectedTaskType: 'creative'
  },
  {
    message: "Design a description for our new premium villa package",
    expectedModel: 'chatgpt',
    expectedTaskType: 'creative'
  },

  // Technical tasks (should route to Claude)
  {
    message: "Debug the calendar integration issue with booking synchronization",
    expectedModel: 'claude',
    expectedTaskType: 'technical'
  },
  {
    message: "Configure the API settings for the new payment gateway",
    expectedModel: 'claude',
    expectedTaskType: 'technical'
  },
  {
    message: "Troubleshoot the database connection timeout errors",
    expectedModel: 'claude',
    expectedTaskType: 'technical'
  },

  // General tasks (should route to ChatGPT as default)
  {
    message: "Hello, how can you help me today?",
    expectedModel: 'chatgpt',
    expectedTaskType: 'general'
  },
  {
    message: "What's the weather like?",
    expectedModel: 'chatgpt',
    expectedTaskType: 'general'
  }
]

/**
 * Test message analysis and routing
 */
function testMessageRouting() {
  console.log('🧪 Testing Multi-Model AI Routing System\n')
  console.log('=' * 60)

  let totalTests = 0
  let passedTests = 0

  testMessages.forEach((test, index) => {
    console.log(`\n--- Test ${index + 1}: ${test.expectedTaskType.toUpperCase()} ---`)
    console.log(`Message: "${test.message}"`)
    
    // Test message analysis
    const analysis = analyzeMessageForRouting(test.message)
    
    console.log(`\nAnalysis Results:`)
    console.log(`  Task Type: ${analysis.taskType} (expected: ${test.expectedTaskType})`)
    console.log(`  Suggested Model: ${analysis.suggestedModel} (expected: ${test.expectedModel})`)
    console.log(`  Confidence: ${Math.round(analysis.confidence * 100)}%`)
    console.log(`  Reasoning: ${analysis.reasoning}`)
    
    // Test routing
    const routing = routeAIMessage(test.message, { preferredModel: 'auto' })
    
    console.log(`\nRouting Results:`)
    console.log(`  Selected Model: ${routing.model}`)
    console.log(`  Routing Confidence: ${Math.round(routing.confidence * 100)}%`)
    console.log(`  Routing Reasoning: ${routing.reasoning}`)
    
    // Check results
    const taskTypeMatch = analysis.taskType === test.expectedTaskType
    const modelMatch = analysis.suggestedModel === test.expectedModel
    
    totalTests += 2 // Task type + model selection
    if (taskTypeMatch) passedTests++
    if (modelMatch) passedTests++
    
    console.log(`\nResults:`)
    console.log(`  Task Type: ${taskTypeMatch ? '✅ PASS' : '❌ FAIL'}`)
    console.log(`  Model Selection: ${modelMatch ? '✅ PASS' : '❌ FAIL'}`)
    
    console.log('\n' + '-'.repeat(50))
  })

  console.log(`\n🎯 FINAL RESULTS:`)
  console.log(`Total Tests: ${totalTests}`)
  console.log(`Passed: ${passedTests}`)
  console.log(`Failed: ${totalTests - passedTests}`)
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`)
}

/**
 * Test model information and availability
 */
function testModelInfo() {
  console.log('\n\n🔍 Testing Model Information System\n')
  console.log('=' * 60)

  const models = ['auto', 'chatgpt', 'claude']
  
  models.forEach(model => {
    console.log(`\n--- ${model.toUpperCase()} ---`)
    const info = getModelInfo(model as any)
    
    console.log(`Name: ${info.name}`)
    console.log(`Full Name: ${info.fullName}`)
    console.log(`Icon: ${info.icon}`)
    console.log(`Color: ${info.color}`)
    console.log(`Strengths: ${info.strengths.join(', ')}`)
    console.log(`Description: ${info.description}`)
  })

  // Test available models
  console.log(`\n--- AVAILABLE MODELS ---`)
  const availableModels = getAvailableModels()
  
  availableModels.forEach(model => {
    console.log(`${model.label}: ${model.available ? '✅ Available' : '❌ Not Available'}`)
    console.log(`  Description: ${model.description}`)
  })
}

/**
 * Test routing with different configurations
 */
function testRoutingConfigurations() {
  console.log('\n\n⚙️ Testing Routing Configurations\n')
  console.log('=' * 60)

  const testMessage = "Analyze the booking trends and create a new marketing strategy"
  
  const configurations = [
    { name: 'Auto Routing', config: { preferredModel: 'auto' as any } },
    { name: 'Force ChatGPT', config: { forceModel: 'chatgpt' as any } },
    { name: 'Force Claude', config: { forceModel: 'claude' as any } },
    { name: 'Prefer ChatGPT', config: { preferredModel: 'chatgpt' as any } },
    { name: 'Prefer Claude', config: { preferredModel: 'claude' as any } }
  ]

  configurations.forEach(({ name, config }) => {
    console.log(`\n--- ${name} ---`)
    console.log(`Message: "${testMessage}"`)
    
    const routing = routeAIMessage(testMessage, config)
    
    console.log(`Selected Model: ${routing.model}`)
    console.log(`Confidence: ${Math.round(routing.confidence * 100)}%`)
    console.log(`Reasoning: ${routing.reasoning}`)
    console.log(`Task Type: ${routing.taskType}`)
  })
}

/**
 * Performance benchmark test
 */
function testPerformance() {
  console.log('\n\n⚡ Performance Benchmark\n')
  console.log('=' * 60)

  const iterations = 1000
  const testMessage = "Create a booking and analyze the financial impact"
  
  console.log(`Running ${iterations} routing operations...`)
  
  const startTime = Date.now()
  
  for (let i = 0; i < iterations; i++) {
    routeAIMessage(testMessage, { preferredModel: 'auto' })
  }
  
  const endTime = Date.now()
  const totalTime = endTime - startTime
  const averageTime = totalTime / iterations
  
  console.log(`\nPerformance Results:`)
  console.log(`Total Time: ${totalTime}ms`)
  console.log(`Average Time per Route: ${averageTime.toFixed(3)}ms`)
  console.log(`Operations per Second: ${Math.round(1000 / averageTime)}`)
}

// Run tests if this file is executed directly
if (require.main === module) {
  console.log('🚀 Starting Multi-Model AI Routing Tests\n')
  
  try {
    testMessageRouting()
    testModelInfo()
    testRoutingConfigurations()
    testPerformance()
    
    console.log('\n\n✅ All tests completed!')
    console.log('\nTo test the live system:')
    console.log('1. Open the AI Dashboard at http://localhost:3000/dashboard/ai')
    console.log('2. Click on the "AI Chat" tab')
    console.log('3. Try different message types:')
    console.log('   - Analysis: "Analyze our booking performance"')
    console.log('   - Action: "Create a new booking for Villa Paradise"')
    console.log('   - Planning: "Plan the optimal staff schedule"')
    console.log('4. Check the model selection dropdown')
    console.log('5. Observe which model responds to each message type')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

export { 
  testMessageRouting, 
  testModelInfo, 
  testRoutingConfigurations, 
  testPerformance 
}
