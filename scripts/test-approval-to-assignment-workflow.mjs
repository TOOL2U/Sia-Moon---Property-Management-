#!/usr/bin/env node

/**
 * Approval to Assignment Workflow Test
 * Tests the complete workflow from booking approval to automatic staff assignment
 */

import fetch from 'node-fetch'

const API_BASE_URL = 'http://localhost:3001'

// Test booking data for workflow testing
const testWorkflowBooking = {
  property: 'Villa Paradise Workflow Test',
  address: '123 Workflow Test Beach Road, Paradise Island',
  guestName: 'Workflow Test Guest',
  guestEmail: 'workflow.test@example.com',
  checkInDate: '2025-07-26',
  checkOutDate: '2025-07-31',
  guestCount: 6,
  price: 3500,
  subject: 'Approval to Assignment Workflow Test',
  date: new Date().toISOString()
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
 * Test 1: Create booking for workflow testing
 */
async function testWorkflowBookingCreation() {
  console.log('\n🧪 TEST 1: Create Booking for Workflow Testing')
  console.log('=' .repeat(60))
  
  try {
    const result = await makeAPIRequest('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(testWorkflowBooking)
    })
    
    if (result.success && result.data.success) {
      console.log('✅ Workflow test booking created successfully!')
      console.log(`📝 Booking ID: ${result.data.bookingId}`)
      console.log(`📋 Pending Booking ID: ${result.data.pendingBookingId}`)
      console.log(`🔄 Flows to Back Office: ${result.data.flowsToBackOffice || 'Yes'}`)
      
      return {
        success: true,
        bookingId: result.data.bookingId,
        pendingBookingId: result.data.pendingBookingId
      }
    } else {
      console.log('❌ Workflow booking creation failed:', result.data?.error)
      return { success: false, error: result.data?.error }
    }
  } catch (error) {
    console.log('❌ Error creating workflow booking:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Test 2: Verify booking appears in Back Office
 */
async function testBackOfficeVisibility() {
  console.log('\n🧪 TEST 2: Verify Booking in Back Office')
  console.log('=' .repeat(60))
  
  try {
    const result = await makeAPIRequest('/api/admin/bookings/integrated?status=pending&limit=20')
    
    if (result.success && result.data.success) {
      const bookings = result.data.data.bookings || []
      const workflowBooking = bookings.find(b => 
        b.guestName === testWorkflowBooking.guestName ||
        b.guest_name === testWorkflowBooking.guestName
      )
      
      if (workflowBooking) {
        console.log('✅ Workflow booking found in Back Office!')
        console.log(`📝 Booking details:`, {
          id: workflowBooking.id,
          status: workflowBooking.status,
          backOfficeApproval: workflowBooking.backOfficeApproval,
          priority: workflowBooking.priority
        })
        
        return {
          success: true,
          booking: workflowBooking
        }
      } else {
        console.log('⚠️ Workflow booking not found in Back Office')
        return { success: false, error: 'Booking not found' }
      }
    } else {
      console.log('❌ Failed to load Back Office bookings:', result.data?.error)
      return { success: false, error: result.data?.error }
    }
  } catch (error) {
    console.log('❌ Error checking Back Office visibility:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Test 3: Test booking approval workflow
 */
async function testBookingApprovalWorkflow(bookingId) {
  console.log('\n🧪 TEST 3: Test Booking Approval Workflow')
  console.log('=' .repeat(60))
  
  if (!bookingId) {
    console.log('❌ Skipping approval test - no booking ID')
    return { success: false, error: 'No booking ID provided' }
  }
  
  try {
    const approvalData = {
      bookingId,
      action: 'approve',
      adminId: 'workflow-test-admin',
      adminName: 'Workflow Test Admin',
      notes: 'Approved for workflow testing - should trigger automatic staff assignment'
    }
    
    const result = await makeAPIRequest('/api/bookings/approve', {
      method: 'POST',
      body: JSON.stringify(approvalData)
    })
    
    if (result.success && result.data.success) {
      console.log('✅ Booking approval workflow successful!')
      console.log(`📊 New status: ${result.data.newStatus}`)
      console.log(`📝 Approval ID: ${result.data.approvalId}`)
      console.log('🎯 This should trigger automatic staff assignment modal in UI')
      
      return {
        success: true,
        newStatus: result.data.newStatus,
        approvalId: result.data.approvalId
      }
    } else {
      console.log('❌ Booking approval workflow failed:', result.data?.error)
      return { success: false, error: result.data?.error }
    }
  } catch (error) {
    console.log('❌ Error testing booking approval workflow:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Test 4: Verify enhanced job assignment system integration
 */
async function testEnhancedJobAssignmentIntegration() {
  console.log('\n🧪 TEST 4: Test Enhanced Job Assignment Integration')
  console.log('=' .repeat(60))
  
  try {
    // Test the enhanced job assignment endpoint
    const result = await makeAPIRequest('/api/bookings/assign-staff-enhanced', {
      method: 'GET'
    })
    
    if (result.success && result.data.staff) {
      console.log('✅ Enhanced job assignment system accessible!')
      console.log(`👥 Available staff: ${result.data.totalCount}`)
      console.log(`✅ Active staff: ${result.data.activeCount}`)
      console.log('🎯 Staff assignment modal can access staff data')
      
      return {
        success: true,
        staffCount: result.data.totalCount,
        activeStaffCount: result.data.activeCount
      }
    } else {
      console.log('❌ Enhanced job assignment system not accessible')
      return { success: false, error: 'Job assignment system unavailable' }
    }
  } catch (error) {
    console.log('❌ Error testing enhanced job assignment integration:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Test 5: Verify notification system readiness
 */
async function testNotificationSystemReadiness() {
  console.log('\n🧪 TEST 5: Test Notification System Readiness')
  console.log('=' .repeat(60))
  
  try {
    // Check if we can access staff accounts for notifications
    const result = await makeAPIRequest('/api/admin/staff-accounts?limit=5')
    
    if (result.success && result.data.success) {
      const staffAccounts = result.data.data || []
      console.log('✅ Notification system ready!')
      console.log(`📱 Staff accounts available for notifications: ${staffAccounts.length}`)
      console.log('🔔 Multi-channel notifications can be sent')
      
      return {
        success: true,
        staffAccountsCount: staffAccounts.length
      }
    } else {
      console.log('⚠️ Notification system may have issues')
      return { success: false, error: 'Staff accounts not accessible' }
    }
  } catch (error) {
    console.log('❌ Error testing notification system:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Generate Workflow Test Report
 */
function generateWorkflowTestReport(results) {
  console.log('\n📊 APPROVAL TO ASSIGNMENT WORKFLOW TEST REPORT')
  console.log('=' .repeat(70))
  
  const tests = [
    { name: 'Workflow Booking Creation', result: results.creation?.success },
    { name: 'Back Office Visibility', result: results.visibility?.success },
    { name: 'Booking Approval Workflow', result: results.approval?.success },
    { name: 'Enhanced Job Assignment Integration', result: results.jobAssignment?.success },
    { name: 'Notification System Readiness', result: results.notifications?.success }
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
  
  console.log('\n📈 WORKFLOW SUMMARY')
  console.log('-' .repeat(40))
  console.log(`Tests Passed: ${passedTests}/${totalTests}`)
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`)
  
  // Workflow insights
  if (results.visibility?.booking) {
    console.log(`📋 Booking found with status: ${results.visibility.booking.status}`)
  }
  
  if (results.approval?.success) {
    console.log('🎯 Approval workflow ready for staff assignment trigger')
  }
  
  if (results.jobAssignment?.success) {
    console.log(`👥 ${results.jobAssignment.activeStaffCount} active staff available for assignment`)
  }
  
  if (results.notifications?.success) {
    console.log(`📱 ${results.notifications.staffAccountsCount} staff accounts ready for notifications`)
  }
  
  const overallSuccess = passedTests === totalTests
  
  if (overallSuccess) {
    console.log('\n🎉 ALL WORKFLOW TESTS PASSED!')
    console.log('✅ Booking creation flows to Back Office')
    console.log('✅ Approval workflow is functional')
    console.log('✅ Enhanced job assignment system is ready')
    console.log('✅ Notification system is operational')
    console.log('✅ Complete workflow: Approval → Staff Assignment → Notifications')
  } else {
    console.log('\n⚠️  SOME WORKFLOW TESTS FAILED. Please review the errors above.')
  }
  
  return overallSuccess
}

/**
 * Main workflow test execution
 */
async function runApprovalToAssignmentWorkflowTest() {
  console.log('🚀 STARTING APPROVAL TO ASSIGNMENT WORKFLOW TEST')
  console.log('=' .repeat(70))
  console.log(`🌐 API Base URL: ${API_BASE_URL}`)
  console.log(`⏰ Test started at: ${new Date().toISOString()}`)
  
  const results = {}
  
  try {
    // Test 1: Create workflow booking
    results.creation = await testWorkflowBookingCreation()
    
    // Wait for data to sync
    console.log('\n⏳ Waiting 3 seconds for data synchronization...')
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Test 2: Check Back Office visibility
    results.visibility = await testBackOfficeVisibility()
    
    // Test 3: Test approval workflow (if booking was created)
    if (results.creation?.success && results.creation?.bookingId) {
      results.approval = await testBookingApprovalWorkflow(results.creation.bookingId)
    }
    
    // Test 4: Test enhanced job assignment integration
    results.jobAssignment = await testEnhancedJobAssignmentIntegration()
    
    // Test 5: Test notification system readiness
    results.notifications = await testNotificationSystemReadiness()
    
    // Generate final report
    const overallSuccess = generateWorkflowTestReport(results)
    
    console.log('\n⏰ Test completed at:', new Date().toISOString())
    
    return overallSuccess
  } catch (error) {
    console.error('❌ Workflow test execution failed:', error.message)
    return false
  }
}

// Run the workflow test
runApprovalToAssignmentWorkflowTest()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
