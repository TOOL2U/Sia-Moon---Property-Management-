#!/usr/bin/env node

/**
 * 📘 AI Decision Logs Checker
 * 
 * This script retrieves and displays AI COO decision logs for the booking simulation
 */

async function checkAILogs() {
  console.log('📘 Checking AI Decision Logs...')
  console.log('=' .repeat(60))

  try {
    // Fetch logs from the API endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    
    // Check for specific test booking logs
    console.log('🔍 Searching for test-booking-001 logs...')
    
    const response = await fetch(`${baseUrl}/api/ai-log?source=test-booking-001&limit=10`)
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('📊 API Response:', data)

    if (data.success && data.logs && data.logs.length > 0) {
      console.log(`✅ Found ${data.logs.length} AI decision log(s)`)
      console.log('')

      data.logs.forEach((log, index) => {
        console.log(`📋 Log Entry ${index + 1}:`)
        console.log(`   Agent: AI ${log.agent}`)
        console.log(`   Timestamp: ${new Date(log.timestamp).toLocaleString()}`)
        console.log(`   Action: ${log.action}`)
        
        if (log.decision) {
          console.log(`   Decision: ${log.decision.toUpperCase()}`)
        }
        
        console.log(`   Confidence: ${(log.confidence * 100).toFixed(1)}%`)
        
        if (log.rationale) {
          console.log(`   Reasoning: ${log.rationale}`)
        }
        
        if (log.escalate) {
          console.log(`   ⚠️  ESCALATION REQUIRED`)
        }
        
        if (log.source) {
          console.log(`   Source: ${log.source}`)
        }

        // Display input/output data if available
        if (log.input) {
          console.log(`   Input Data:`)
          console.log(`     Address: ${log.input.address}`)
          console.log(`     Job Type: ${log.input.jobType}`)
          console.log(`     Value: ฿${log.input.value?.toLocaleString()}`)
          console.log(`     Customer: ${log.input.customerName}`)
        }

        if (log.output) {
          console.log(`   AI Decision Output:`)
          if (log.output.assignedStaff) {
            console.log(`     Assigned Staff: ${log.output.assignedStaff.name}`)
            console.log(`     ETA: ${log.output.assignedStaff.eta}`)
            console.log(`     Distance: ${log.output.assignedStaff.distance}km`)
          }
          if (log.output.estimatedCost) {
            console.log(`     Estimated Cost: ฿${log.output.estimatedCost.toLocaleString()}`)
          }
        }

        console.log('')
      })

    } else {
      console.log('⚠️  No logs found for test-booking-001')
      console.log('')
      
      // Try fetching all recent logs
      console.log('🔍 Checking for any recent AI logs...')
      
      const allLogsResponse = await fetch(`${baseUrl}/api/ai-log?limit=5`)
      const allLogsData = await allLogsResponse.json()
      
      if (allLogsData.success && allLogsData.logs && allLogsData.logs.length > 0) {
        console.log(`📋 Found ${allLogsData.logs.length} recent AI log(s):`)
        
        allLogsData.logs.forEach((log, index) => {
          console.log(`   ${index + 1}. ${log.agent} - ${log.action} (${new Date(log.timestamp).toLocaleString()})`)
          if (log.source) console.log(`      Source: ${log.source}`)
        })
      } else {
        console.log('📭 No AI logs found in the system')
        console.log('')
        console.log('💡 Suggestions:')
        console.log('   1. Run the booking simulation first at: http://localhost:3000/test/ai-simulation')
        console.log('   2. Check if the AI COO API is working: http://localhost:3000/api/ai-coo')
        console.log('   3. Verify the AI logging system: http://localhost:3000/api/ai-log')
      }
    }

  } catch (error) {
    console.error('❌ Error checking AI logs:', error.message)
    console.log('')
    console.log('🔧 Troubleshooting:')
    console.log('   1. Make sure the development server is running')
    console.log('   2. Check if the AI log API is accessible')
    console.log('   3. Verify the booking simulation was executed')
  }

  console.log('')
  console.log('🏁 Log check complete')
}

// Alternative function that mimics your requested format
async function getAILogs(filters = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const params = new URLSearchParams()
  
  if (filters.source) params.append('source', filters.source)
  if (filters.agent) params.append('agent', filters.agent)
  if (filters.limit) params.append('limit', filters.limit.toString())
  
  const response = await fetch(`${baseUrl}/api/ai-log?${params.toString()}`)
  const data = await response.json()
  
  return data.success ? data.logs : []
}

// Run the specific check you requested
async function runSpecificCheck() {
  console.log('🎯 Running your specific log check...')
  console.log('📘 AI COO Decision Log for test-booking-001:')
  console.log('')

  try {
    const logs = await getAILogs({ source: "test-booking-001" })
    
    if (logs.length > 0) {
      console.log(`✅ Found ${logs.length} log entry(ies)`)
      logs.forEach((log, index) => {
        console.log(`\n📋 Entry ${index + 1}:`)
        console.log(JSON.stringify(log, null, 2))
      })
    } else {
      console.log('📭 No logs found for test-booking-001')
      console.log('💡 Run the booking simulation first!')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// Run both checks
if (require.main === module) {
  Promise.all([
    checkAILogs(),
    runSpecificCheck()
  ]).then(() => {
    process.exit(0)
  }).catch((error) => {
    console.error('Fatal Error:', error)
    process.exit(1)
  })
}

module.exports = { checkAILogs, getAILogs }
