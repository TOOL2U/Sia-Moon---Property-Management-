#!/usr/bin/env node

/**
 * 📘 All AI Logs Review Script
 * 
 * This script retrieves and analyzes all AI agent logs for comprehensive review:
 * - AI COO booking decisions
 * - AI CFO expense analysis
 * - Confidence scores and reasoning
 * - Escalation patterns
 * - Performance metrics
 */

async function reviewAllAILogs() {
  console.log('📘 Starting Comprehensive AI Logs Review...')
  console.log('=' .repeat(60))

  try {
    // Fetch all AI logs
    console.log('🔍 Retrieving all AI agent logs...')
    
    const response = await fetch('http://localhost:3000/api/ai-log?limit=100')
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('📊 API Response Status:', data.success ? 'SUCCESS' : 'FAILED')

    if (data.success && data.logs && data.logs.length > 0) {
      const allLogs = data.logs
      console.log(`✅ Retrieved ${allLogs.length} AI log entries`)
      console.log('')

      // Analyze logs by agent
      const cooLogs = allLogs.filter(log => log.agent === 'COO')
      const cfoLogs = allLogs.filter(log => log.agent === 'CFO')

      console.log('🤖 AI Agent Summary:')
      console.log(`   AI COO Logs: ${cooLogs.length}`)
      console.log(`   AI CFO Logs: ${cfoLogs.length}`)
      console.log(`   Total Logs: ${allLogs.length}`)
      console.log('')

      // Analyze decisions
      const decisions = analyzeDecisions(allLogs)
      console.log('💼 Decision Analysis:')
      console.log(`   Approved: ${decisions.approved} (${(decisions.approved/allLogs.length*100).toFixed(1)}%)`)
      console.log(`   Rejected: ${decisions.rejected} (${(decisions.rejected/allLogs.length*100).toFixed(1)}%)`)
      console.log(`   Flagged: ${decisions.flagged} (${(decisions.flagged/allLogs.length*100).toFixed(1)}%)`)
      console.log(`   Escalated: ${decisions.escalated} (${(decisions.escalated/allLogs.length*100).toFixed(1)}%)`)
      console.log('')

      // Analyze confidence scores
      const confidence = analyzeConfidence(allLogs)
      console.log('🎯 Confidence Analysis:')
      console.log(`   Average Confidence: ${(confidence.average * 100).toFixed(1)}%`)
      console.log(`   High Confidence (>90%): ${confidence.high} logs`)
      console.log(`   Medium Confidence (70-90%): ${confidence.medium} logs`)
      console.log(`   Low Confidence (<70%): ${confidence.low} logs`)
      console.log('')

      // Display recent logs
      console.log('📋 Recent AI Decisions (Last 10):')
      const recentLogs = allLogs.slice(0, 10)
      recentLogs.forEach((log, index) => {
        const timestamp = new Date(log.timestamp).toLocaleString()
        const confidence = `${(log.confidence * 100).toFixed(1)}%`
        const decision = log.decision ? log.decision.toUpperCase() : 'N/A'
        const escalation = log.escalate ? '🚨 ESCALATED' : '✅ Auto-resolved'
        
        console.log(`   ${index + 1}. [${timestamp}] AI ${log.agent}`)
        console.log(`      Action: ${log.action}`)
        console.log(`      Decision: ${decision} | Confidence: ${confidence}`)
        console.log(`      Status: ${escalation}`)
        if (log.source) console.log(`      Source: ${log.source}`)
        console.log('')
      })

      // Analyze test scenarios
      const testScenarios = analyzeTestScenarios(allLogs)
      if (testScenarios.length > 0) {
        console.log('🧪 Test Scenario Results:')
        testScenarios.forEach((scenario, index) => {
          console.log(`   ${index + 1}. ${scenario.name}`)
          console.log(`      Agent: AI ${scenario.agent}`)
          console.log(`      Result: ${scenario.result}`)
          console.log(`      Confidence: ${scenario.confidence}`)
          if (scenario.notes) console.log(`      Notes: ${scenario.notes}`)
          console.log('')
        })
      }

      // Performance metrics
      const performance = analyzePerformance(allLogs)
      console.log('📊 AI Performance Metrics:')
      console.log(`   Decision Speed: ${performance.avgResponseTime}ms average`)
      console.log(`   Success Rate: ${performance.successRate}%`)
      console.log(`   Escalation Rate: ${performance.escalationRate}%`)
      console.log(`   Confidence Consistency: ${performance.confidenceConsistency}`)
      console.log('')

      // Export summary
      const summary = generateLogSummary(allLogs)
      console.log('📄 Log Summary Generated')
      console.log('   Use this data for AI system optimization and review')
      
      // Save summary to file
      const fs = require('fs')
      const summaryPath = `ai-logs-summary-${new Date().toISOString().split('T')[0]}.json`
      fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2))
      console.log(`   Summary saved to: ${summaryPath}`)

    } else {
      console.log('📭 No AI logs found in the system')
      console.log('')
      console.log('💡 Suggestions:')
      console.log('   1. Run AI simulations to generate logs:')
      console.log('      • Booking simulation: http://localhost:3000/test/ai-simulation')
      console.log('      • CFO simulation: http://localhost:3000/test/cfo-simulation')
      console.log('      • Escalation test: http://localhost:3000/test/escalation-simulation')
      console.log('      • Validation test: http://localhost:3000/test/validation-simulation')
      console.log('   2. Check if AI APIs are working:')
      console.log('      • AI COO: http://localhost:3000/api/ai-coo')
      console.log('      • AI CFO: http://localhost:3000/api/ai-cfo')
    }

  } catch (error) {
    console.error('❌ Error reviewing AI logs:', error.message)
    console.log('')
    console.log('🔧 Troubleshooting:')
    console.log('   1. Make sure the development server is running')
    console.log('   2. Check if the AI log API is accessible')
    console.log('   3. Verify AI simulations have been executed')
  }

  console.log('')
  console.log('🏁 AI Logs Review Complete')
}

/**
 * Analyze decision patterns
 */
function analyzeDecisions(logs) {
  return {
    approved: logs.filter(l => l.decision === 'approved').length,
    rejected: logs.filter(l => l.decision === 'rejected').length,
    flagged: logs.filter(l => l.decision === 'flagged').length,
    escalated: logs.filter(l => l.escalate).length
  }
}

/**
 * Analyze confidence score patterns
 */
function analyzeConfidence(logs) {
  const confidenceScores = logs.map(l => l.confidence || 0)
  const average = confidenceScores.reduce((sum, c) => sum + c, 0) / confidenceScores.length
  
  return {
    average,
    high: logs.filter(l => (l.confidence || 0) > 0.9).length,
    medium: logs.filter(l => (l.confidence || 0) >= 0.7 && (l.confidence || 0) <= 0.9).length,
    low: logs.filter(l => (l.confidence || 0) < 0.7).length
  }
}

/**
 * Analyze test scenarios
 */
function analyzeTestScenarios(logs) {
  const testLogs = logs.filter(l => 
    l.source?.includes('test') || 
    l.testCase || 
    l.action?.includes('test') ||
    l.action?.includes('simulation')
  )
  
  return testLogs.map(log => ({
    name: log.testCase || log.source || log.action,
    agent: log.agent,
    result: log.decision || 'processed',
    confidence: `${(log.confidence * 100).toFixed(1)}%`,
    notes: log.escalate ? 'Escalated for review' : 'Auto-processed'
  }))
}

/**
 * Analyze performance metrics
 */
function analyzePerformance(logs) {
  const responseTimes = logs.map(l => l.duration || 0).filter(d => d > 0)
  const avgResponseTime = responseTimes.length > 0 
    ? Math.round(responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length)
    : 0
  
  const successfulLogs = logs.filter(l => l.status !== 'error')
  const successRate = logs.length > 0 ? (successfulLogs.length / logs.length * 100).toFixed(1) : 0
  
  const escalationRate = logs.length > 0 
    ? (logs.filter(l => l.escalate).length / logs.length * 100).toFixed(1)
    : 0
  
  const confidenceScores = logs.map(l => l.confidence || 0)
  const confidenceVariance = calculateVariance(confidenceScores)
  const confidenceConsistency = confidenceVariance < 0.1 ? 'High' : confidenceVariance < 0.2 ? 'Medium' : 'Low'
  
  return {
    avgResponseTime,
    successRate,
    escalationRate,
    confidenceConsistency
  }
}

/**
 * Calculate variance for confidence consistency
 */
function calculateVariance(numbers) {
  const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length
  const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2))
  return squaredDiffs.reduce((sum, sq) => sum + sq, 0) / numbers.length
}

/**
 * Generate comprehensive log summary
 */
function generateLogSummary(logs) {
  return {
    generatedAt: new Date().toISOString(),
    totalLogs: logs.length,
    agents: {
      COO: logs.filter(l => l.agent === 'COO').length,
      CFO: logs.filter(l => l.agent === 'CFO').length
    },
    decisions: analyzeDecisions(logs),
    confidence: analyzeConfidence(logs),
    performance: analyzePerformance(logs),
    testScenarios: analyzeTestScenarios(logs),
    recentActivity: logs.slice(0, 5).map(log => ({
      timestamp: log.timestamp,
      agent: log.agent,
      action: log.action,
      decision: log.decision,
      confidence: log.confidence,
      escalated: log.escalate
    }))
  }
}

// Alternative function that mimics the user's requested format
async function getAILogs(filters = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const params = new URLSearchParams()
  
  if (filters.agent) params.append('agent', filters.agent)
  if (filters.source) params.append('source', filters.source)
  if (filters.limit) params.append('limit', filters.limit.toString())
  
  const response = await fetch(`${baseUrl}/api/ai-log?${params.toString()}`)
  const data = await response.json()
  
  return data.success ? data.logs : []
}

// Run the specific check requested by user
async function runUserRequest() {
  console.log('🧠 Running user-requested log review...')
  console.log('📘 All AI Agent Logs:')
  console.log('')

  try {
    const allLogs = await getAILogs({})
    
    if (allLogs.length > 0) {
      console.log(`✅ Found ${allLogs.length} AI log entries`)
      
      // Display in user's requested format
      console.log('🧠 All AI Agent Logs:', JSON.stringify(allLogs, null, 2))
      
    } else {
      console.log('📭 No AI logs found')
      console.log('💡 Run some AI simulations first!')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// Run both the comprehensive review and user's specific request
if (require.main === module) {
  Promise.all([
    reviewAllAILogs(),
    runUserRequest()
  ]).then(() => {
    process.exit(0)
  }).catch((error) => {
    console.error('Fatal Error:', error)
    process.exit(1)
  })
}

module.exports = { reviewAllAILogs, getAILogs }
