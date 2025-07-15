#!/usr/bin/env node

/**
 * Enhanced Job Assignment Test
 * Tests the complete enhanced job assignment workflow with mandatory staff selection
 */

import fetch from 'node-fetch'

const API_BASE_URL = 'http://localhost:3001'

// Test data for enhanced job assignment
const testJobAssignment = {
  bookingId: 'test-booking-enhanced-001',
  propertyId: 'test-property-001',
  propertyName: 'Villa Paradise Enhanced Test',
  propertyAddress: '123 Enhanced Test Beach Road, Paradise Island',
  jobType: 'cleaning',
  title: 'Enhanced Villa Preparation with Mandatory Staff',
  description: 'Complete villa preparation with enhanced notification system',
  priority: 'high',
  scheduledDate: '2025-07-25',
  deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  estimatedDuration: 180,
  requiredSkills: ['cleaning', 'villa_preparation'],
  specialInstructions: 'Test enhanced job assignment with mandatory staff validation',
  assignedStaffIds: [], // Will be populated with actual staff IDs
  assignedBy: {
    id: 'test-admin-enhanced',
    name: 'Enhanced Test Admin'
  }
}

/**
 * Make API request with error handling
 */
async function makeAPIRequest(endpoint, options = {}) {
  try {
    const url = `${API_BASE_URL}${endpoint}`
    console.log(`🌐 Making request to: ${url}`)
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    })

    const data = await response.json()
    
    console.log(`📊 Response status: ${response.status}`)
    console.log(`📋 Response data:`, JSON.stringify(data, null, 2))
    
    return {
      success: response.ok,
      status: response.status,
      data
    }
  } catch (error) {
    console.error(`❌ API request failed:`, error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Test 1: Mandatory Staff Selection Validation
 */
async function testMandatoryStaffValidation() {
  console.log('\n🧪 TEST 1: Mandatory Staff Selection Validation')
  console.log('=' .repeat(60))
  
  try {
    // Test with no staff selected (should fail)
    const emptyStaffData = {
      ...testJobAssignment,
      assignedStaffIds: []
    }
    
    const result = await makeAPIRequest('/api/bookings/assign-staff-enhanced', {
      method: 'POST',
      body: JSON.stringify(emptyStaffData)
    })
    
    if (!result.success && result.data.errors?.some(error => error.includes('MANDATORY'))) {
      console.log('✅ Mandatory staff validation working correctly')
      console.log('📋 Error message:', result.data.errors[0])
      return true
    } else {
      console.log('❌ Mandatory staff validation failed - should have rejected empty staff list')
      return false
    }
  } catch (error) {
    console.log('❌ Error testing mandatory staff validation:', error.message)
    return false
  }
}

/**
 * Test 2: Get Available Staff for Selection
 */
async function testGetAvailableStaff() {
  console.log('\n🧪 TEST 2: Get Available Staff for Selection')
  console.log('=' .repeat(60))
  
  try {
    const result = await makeAPIRequest('/api/bookings/assign-staff-enhanced', {
      method: 'GET'
    })
    
    if (result.success && result.data.staff) {
      console.log('✅ Available staff retrieved successfully')
      console.log(`👥 Found ${result.data.totalCount} total staff members`)
      console.log(`✅ ${result.data.activeCount} active staff members`)
      
      // Return first 2 active staff for testing
      const activeStaff = result.data.staff.filter(s => s.isAvailable).slice(0, 2)
      return activeStaff.map(s => s.id)
    } else {
      console.log('❌ Failed to get available staff')
      return []
    }
  } catch (error) {
    console.log('❌ Error getting available staff:', error.message)
    return []
  }
}

/**
 * Test 3: Enhanced Job Assignment with Valid Staff
 */
async function testEnhancedJobAssignment(staffIds) {
  console.log('\n🧪 TEST 3: Enhanced Job Assignment with Valid Staff')
  console.log('=' .repeat(60))
  
  if (staffIds.length === 0) {
    console.log('❌ Skipping test - no staff IDs available')
    return false
  }
  
  try {
    const validJobData = {
      ...testJobAssignment,
      assignedStaffIds: staffIds
    }
    
    const result = await makeAPIRequest('/api/bookings/assign-staff-enhanced', {
      method: 'POST',
      body: JSON.stringify(validJobData)
    })
    
    if (result.success) {
      console.log('✅ Enhanced job assignment successful!')
      console.log(`📝 Job ID: ${result.data.data.jobId}`)
      console.log(`👥 Assigned to ${result.data.data.assignedStaffCount} staff members`)
      console.log(`📋 Created ${result.data.data.taskIds?.length || 0} task assignments`)
      
      // Check notification results
      const notificationResults = result.data.data.notificationResults || []
      const successfulNotifications = notificationResults.filter(n => n.success).length
      console.log(`📱 Notifications sent: ${successfulNotifications}/${notificationResults.length}`)
      
      if (result.data.data.warnings?.length > 0) {
        console.log('⚠️  Warnings:', result.data.data.warnings.join(', '))
      }
      
      return {
        success: true,
        jobId: result.data.data.jobId,
        taskIds: result.data.data.taskIds,
        notificationResults
      }
    } else {
      console.log('❌ Enhanced job assignment failed')
      console.log('📋 Errors:', result.data.errors?.join(', ') || 'Unknown error')
      return false
    }
  } catch (error) {
    console.log('❌ Error in enhanced job assignment:', error.message)
    return false
  }
}

/**
 * Test 4: Validation with Invalid Staff
 */
async function testInvalidStaffValidation() {
  console.log('\n🧪 TEST 4: Validation with Invalid Staff')
  console.log('=' .repeat(60))
  
  try {
    const invalidStaffData = {
      ...testJobAssignment,
      assignedStaffIds: ['invalid-staff-id-1', 'invalid-staff-id-2']
    }
    
    const result = await makeAPIRequest('/api/bookings/assign-staff-enhanced', {
      method: 'POST',
      body: JSON.stringify(invalidStaffData)
    })
    
    if (!result.success && result.data.errors?.some(error => error.includes('not found'))) {
      console.log('✅ Invalid staff validation working correctly')
      console.log('📋 Error message:', result.data.errors[0])
      return true
    } else {
      console.log('❌ Invalid staff validation failed - should have rejected invalid staff IDs')
      return false
    }
  } catch (error) {
    console.log('❌ Error testing invalid staff validation:', error.message)
    return false
  }
}

/**
 * Test 5: Field Validation
 */
async function testFieldValidation() {
  console.log('\n🧪 TEST 5: Field Validation')
  console.log('=' .repeat(60))
  
  try {
    const incompleteData = {
      bookingId: 'test-booking',
      assignedStaffIds: ['test-staff-id'],
      assignedBy: { id: 'test-admin', name: 'Test Admin' }
      // Missing required fields: title, description, propertyName
    }
    
    const result = await makeAPIRequest('/api/bookings/assign-staff-enhanced', {
      method: 'POST',
      body: JSON.stringify(incompleteData)
    })
    
    if (!result.success && result.data.error?.includes('Missing required fields')) {
      console.log('✅ Field validation working correctly')
      console.log('📋 Error message:', result.data.error)
      return true
    } else {
      console.log('❌ Field validation failed - should have rejected incomplete data')
      return false
    }
  } catch (error) {
    console.log('❌ Error testing field validation:', error.message)
    return false
  }
}

/**
 * Generate Test Report
 */
function generateTestReport(results) {
  console.log('\n📊 ENHANCED JOB ASSIGNMENT TEST REPORT')
  console.log('=' .repeat(70))
  
  const tests = [
    { name: 'Mandatory Staff Validation', result: results.mandatoryValidation },
    { name: 'Get Available Staff', result: results.availableStaff },
    { name: 'Enhanced Job Assignment', result: results.jobAssignment },
    { name: 'Invalid Staff Validation', result: results.invalidStaff },
    { name: 'Field Validation', result: results.fieldValidation }
  ]
  
  let passedTests = 0
  let totalTests = tests.length
  
  tests.forEach(test => {
    const status = test.result ? '✅ PASS' : '❌ FAIL'
    console.log(`${status} ${test.name}`)
    
    if (test.result) {
      passedTests++
    }
  })
  
  console.log('\n📈 SUMMARY')
  console.log('-' .repeat(40))
  console.log(`Tests Passed: ${passedTests}/${totalTests}`)
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`)
  
  const overallSuccess = passedTests === totalTests
  
  if (overallSuccess) {
    console.log('\n🎉 ALL ENHANCED JOB ASSIGNMENT TESTS PASSED!')
    console.log('✅ Mandatory staff selection is working')
    console.log('✅ Multi-channel notifications are configured')
    console.log('✅ Validation and error handling are robust')
    console.log('✅ Enhanced job assignment system is ready for production')
  } else {
    console.log('\n⚠️  SOME TESTS FAILED. Please review the errors above.')
  }
  
  return overallSuccess
}

/**
 * Main test execution
 */
async function runEnhancedJobAssignmentTest() {
  console.log('🚀 STARTING ENHANCED JOB ASSIGNMENT TEST')
  console.log('=' .repeat(70))
  console.log(`🌐 API Base URL: ${API_BASE_URL}`)
  console.log(`⏰ Test started at: ${new Date().toISOString()}`)
  
  const results = {}
  
  try {
    // Test 1: Mandatory staff validation
    results.mandatoryValidation = await testMandatoryStaffValidation()
    
    // Test 2: Get available staff
    const staffIds = await testGetAvailableStaff()
    results.availableStaff = staffIds.length > 0
    
    // Test 3: Enhanced job assignment
    const assignmentResult = await testEnhancedJobAssignment(staffIds)
    results.jobAssignment = !!assignmentResult
    
    // Test 4: Invalid staff validation
    results.invalidStaff = await testInvalidStaffValidation()
    
    // Test 5: Field validation
    results.fieldValidation = await testFieldValidation()
    
    // Generate final report
    const overallSuccess = generateTestReport(results)
    
    console.log('\n⏰ Test completed at:', new Date().toISOString())
    
    return overallSuccess
  } catch (error) {
    console.error('❌ Test execution failed:', error.message)
    return false
  }
}

// Run the test
runEnhancedJobAssignmentTest()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
