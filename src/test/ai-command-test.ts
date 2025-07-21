/**
 * Test script for AI Command Parsing and Execution
 * Run this to verify the command system works correctly
 */

import { parseCommands, validateCommand } from '@/lib/ai/commandParser'

// Test AI responses with actionable commands
const testResponses = [
  // Staff assignment test
  "Based on current workload analysis, I recommend: Assign staff John Doe to job job_123 for better efficiency",
  
  // Booking approval test
  "I found 3 pending bookings that need attention. I recommend: Approve booking abc123 - all requirements met",
  
  // Job rescheduling test
  "Due to weather conditions, I suggest: Reschedule cleaning job on 25 July to 26 July",
  
  // Multiple commands test
  "Here are my recommendations: Assign staff Maria to job job_456, and approve booking def789, then update calendar to reflect booking changes",
  
  // Job creation test
  "I recommend: Create job for Villa Sunset cleaning on 28 July",
  
  // Staff reassignment test
  "For better workload balance: Reassign John from job job_123 to job job_456",
  
  // Dangerous operation test
  "If you're sure about this: Delete job job_789 with override",
  
  // No commands test
  "I can help you analyze your current operational data and provide insights about booking trends."
]

/**
 * Test command parsing functionality
 */
function testCommandParsing() {
  console.log('🧪 Testing AI Command Parsing System\n')
  
  testResponses.forEach((response, index) => {
    console.log(`\n--- Test ${index + 1} ---`)
    console.log(`Input: "${response}"`)
    
    const result = parseCommands(response)
    
    console.log(`Commands detected: ${result.hasCommands ? result.commands.length : 0}`)
    
    if (result.hasCommands) {
      result.commands.forEach((command, cmdIndex) => {
        console.log(`\nCommand ${cmdIndex + 1}:`)
        console.log(`  Type: ${command.type}`)
        console.log(`  Description: ${command.description}`)
        console.log(`  Collection: ${command.collection}`)
        console.log(`  Operation: ${command.operation}`)
        console.log(`  Safety Level: ${command.safetyLevel}`)
        console.log(`  Confidence: ${Math.round(command.confidence * 100)}%`)
        console.log(`  Data:`, command.data)
        
        // Test validation
        const validation = validateCommand(command)
        console.log(`  Validation: ${validation.valid ? '✅ Valid' : '❌ Invalid'}`)
        if (!validation.valid) {
          console.log(`  Errors:`, validation.errors)
        }
      })
    } else {
      console.log('  No actionable commands detected')
    }
    
    console.log('\n' + '='.repeat(50))
  })
}

/**
 * Test specific command patterns
 */
function testSpecificPatterns() {
  console.log('\n\n🎯 Testing Specific Command Patterns\n')
  
  const patterns = [
    {
      name: 'Staff Assignment',
      text: 'Assign staff John Doe to job job_123',
      expectedType: 'assign_staff'
    },
    {
      name: 'Booking Approval',
      text: 'Approve booking abc123',
      expectedType: 'approve_booking'
    },
    {
      name: 'Job Rescheduling',
      text: 'Reschedule cleaning job on 25 July to 26 July',
      expectedType: 'reschedule_job'
    },
    {
      name: 'Calendar Update',
      text: 'Update calendar to reflect booking changes',
      expectedType: 'update_calendar'
    },
    {
      name: 'Job Creation',
      text: 'Create job for Villa Sunset on 28 July',
      expectedType: 'create_job'
    },
    {
      name: 'Job Deletion',
      text: 'Delete job job_789 with override',
      expectedType: 'delete_job'
    }
  ]
  
  patterns.forEach(pattern => {
    console.log(`\nTesting: ${pattern.name}`)
    console.log(`Input: "${pattern.text}"`)
    
    const result = parseCommands(pattern.text)
    
    if (result.hasCommands && result.commands.length > 0) {
      const command = result.commands[0]
      const success = command.type === pattern.expectedType
      
      console.log(`Expected: ${pattern.expectedType}`)
      console.log(`Got: ${command.type}`)
      console.log(`Result: ${success ? '✅ PASS' : '❌ FAIL'}`)
      
      if (success) {
        console.log(`Confidence: ${Math.round(command.confidence * 100)}%`)
        console.log(`Safety: ${command.safetyLevel}`)
      }
    } else {
      console.log(`Result: ❌ FAIL - No commands detected`)
    }
  })
}

/**
 * Test safety validation
 */
function testSafetyValidation() {
  console.log('\n\n🛡️ Testing Safety Validation\n')
  
  const safetyTests = [
    {
      name: 'Safe Operation',
      command: {
        id: 'test1',
        type: 'assign_staff' as const,
        collection: 'jobs',
        operation: 'update' as const,
        data: { staffName: 'John Doe', jobId: 'job_123' },
        description: 'Assign John Doe to job job_123',
        confidence: 0.9,
        originalText: 'Assign staff John Doe to job job_123',
        requiresConfirmation: true,
        safetyLevel: 'safe' as const
      }
    },
    {
      name: 'Caution Operation',
      command: {
        id: 'test2',
        type: 'approve_booking' as const,
        collection: 'bookings',
        operation: 'update' as const,
        data: { bookingId: 'abc123' },
        description: 'Approve booking abc123',
        confidence: 0.8,
        originalText: 'Approve booking abc123',
        requiresConfirmation: true,
        safetyLevel: 'caution' as const
      }
    },
    {
      name: 'Dangerous Operation - No Override',
      command: {
        id: 'test3',
        type: 'delete_job' as const,
        collection: 'jobs',
        operation: 'delete' as const,
        data: { jobId: 'job_789', hasOverride: false },
        description: 'Delete job job_789',
        confidence: 0.7,
        originalText: 'Delete job job_789',
        requiresConfirmation: true,
        safetyLevel: 'dangerous' as const
      }
    },
    {
      name: 'Dangerous Operation - With Override',
      command: {
        id: 'test4',
        type: 'delete_job' as const,
        collection: 'jobs',
        operation: 'delete' as const,
        data: { jobId: 'job_789', hasOverride: true },
        description: 'Delete job job_789 (with override)',
        confidence: 0.7,
        originalText: 'Delete job job_789 with override',
        requiresConfirmation: true,
        safetyLevel: 'dangerous' as const
      }
    }
  ]
  
  safetyTests.forEach(test => {
    console.log(`\nTesting: ${test.name}`)
    
    const validation = validateCommand(test.command)
    console.log(`Safety Level: ${test.command.safetyLevel}`)
    console.log(`Validation: ${validation.valid ? '✅ Valid' : '❌ Invalid'}`)
    
    if (!validation.valid) {
      console.log(`Errors:`)
      validation.errors.forEach(error => console.log(`  - ${error}`))
    }
  })
}

// Run tests if this file is executed directly
if (require.main === module) {
  console.log('🚀 Starting AI Command System Tests\n')
  
  try {
    testCommandParsing()
    testSpecificPatterns()
    testSafetyValidation()
    
    console.log('\n\n✅ All tests completed!')
    console.log('\nTo test the full system:')
    console.log('1. Open the AI Dashboard at http://localhost:3000/dashboard/ai')
    console.log('2. Click on the "AI Chat" tab')
    console.log('3. Try asking: "Assign staff John Doe to job job_123"')
    console.log('4. Look for the command confirmation modal')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

export { testCommandParsing, testSpecificPatterns, testSafetyValidation }
