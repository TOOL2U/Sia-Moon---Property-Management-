#!/usr/bin/env node

/**
 * Comprehensive Booking Workflow Test
 * Tests the complete booking process from submission to completion
 */

import fetch from 'node-fetch'

const API_BASE_URL = 'http://localhost:3001'
const MOBILE_API_KEY = 'sia-moon-mobile-app-2025-secure-key'
const MOBILE_SECRET = 'mobile-app-sync-2025-secure'

// Test data
const testBooking = {
  property: 'Villa Paradise Test',
  address: '123 Test Beach Road, Paradise Island',
  guestName: 'John Test Doe',
  guestEmail: 'test.guest@example.com',
  checkInDate: '2025-07-25',
  checkOutDate: '2025-07-30',
  guestCount: 4,
  price: 2500,
  subject: 'Test Booking Confirmation',
  date: new Date().toISOString()
}

const testStaffAssignmentData = {
  staffIds: [], // Will be populated with actual staff IDs
  assignedBy: 'test-admin-id',
  assignedByName: 'Test Admin',
  tasks: [
    {
      taskType: 'cleaning',
      description: 'Deep clean villa before guest arrival',
      priority: 'high',
      estimatedDuration: 180
    },
    {
      taskType: 'maintenance',
      description: 'Check pool equipment and garden',
      priority: 'medium',
      estimatedDuration: 60
    }
  ],
  generalInstructions: 'Please ensure villa is guest-ready',
  deadline: '2025-07-24T16:00:00Z'
}

let testResults = {
  bookingCreation: null,
  bookingApproval: null,
  staffAssignment: null,
  mobileSync: null,
  jobCompletion: null,
  overallSuccess: false
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
 * Test 1: Booking Creation
 */
async function testBookingCreation() {
  console.log('\n🧪 TEST 1: Booking Creation')
  console.log('=' .repeat(50))
  
  try {
    const result = await makeAPIRequest('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(testBooking)
    })
    
    if (result.success && result.data.success) {
      testResults.bookingCreation = {
        success: true,
        bookingId: result.data.bookingId,
        pendingBookingId: result.data.pendingBookingId,
        liveBookingId: result.data.liveBookingId,
        processingTime: result.data.processingTime
      }
      
      console.log('✅ Booking creation successful!')
      console.log(`📝 Booking ID: ${result.data.bookingId}`)
      console.log(`⏱️  Processing time: ${result.data.processingTime}ms`)
      
      return result.data.bookingId
    } else {
      testResults.bookingCreation = {
        success: false,
        error: result.data?.error || 'Unknown error'
      }
      console.log('❌ Booking creation failed:', result.data?.error)
      return null
    }
  } catch (error) {
    testResults.bookingCreation = {
      success: false,
      error: error.message
    }
    console.log('❌ Booking creation error:', error.message)
    return null
  }
}

/**
 * Test 2: Booking Approval
 */
async function testBookingApproval(bookingId) {
  console.log('\n🧪 TEST 2: Booking Approval')
  console.log('=' .repeat(50))
  
  if (!bookingId) {
    console.log('❌ Skipping approval test - no booking ID')
    return false
  }
  
  try {
    const approvalData = {
      bookingId,
      action: 'approve',
      adminId: 'test-admin-id',
      adminName: 'Test Admin',
      notes: 'Test approval - automated workflow test'
    }
    
    const result = await makeAPIRequest('/api/bookings/approve', {
      method: 'POST',
      body: JSON.stringify(approvalData)
    })
    
    if (result.success && result.data.success) {
      testResults.bookingApproval = {
        success: true,
        newStatus: result.data.newStatus,
        approvalId: result.data.approvalId
      }
      
      console.log('✅ Booking approval successful!')
      console.log(`📊 New status: ${result.data.newStatus}`)
      
      return true
    } else {
      testResults.bookingApproval = {
        success: false,
        error: result.data?.error || 'Unknown error'
      }
      console.log('❌ Booking approval failed:', result.data?.error)
      return false
    }
  } catch (error) {
    testResults.bookingApproval = {
      success: false,
      error: error.message
    }
    console.log('❌ Booking approval error:', error.message)
    return false
  }
}

/**
 * Test 3: Get Available Staff
 */
async function getAvailableStaff() {
  console.log('\n🔍 Getting available staff...')
  
  try {
    const result = await makeAPIRequest('/api/admin/staff-accounts')
    
    if (result.success && result.data.success) {
      const staff = result.data.data || []
      console.log(`👥 Found ${staff.length} staff members`)
      
      // Filter active staff
      const activeStaff = staff.filter(s => s.status === 'active')
      console.log(`✅ ${activeStaff.length} active staff members available`)
      
      return activeStaff.slice(0, 2) // Return first 2 for testing
    } else {
      console.log('❌ Failed to get staff:', result.data?.error)
      return []
    }
  } catch (error) {
    console.log('❌ Error getting staff:', error.message)
    return []
  }
}

/**
 * Test 4: Staff Assignment
 */
async function testStaffAssignment(bookingId) {
  console.log('\n🧪 TEST 3: Staff Assignment')
  console.log('=' .repeat(50))
  
  if (!bookingId) {
    console.log('❌ Skipping staff assignment test - no booking ID')
    return false
  }
  
  try {
    // Get available staff
    const availableStaff = await getAvailableStaff()
    
    if (availableStaff.length === 0) {
      console.log('❌ No staff available for assignment')
      testResults.staffAssignment = {
        success: false,
        error: 'No staff available'
      }
      return false
    }
    
    // Prepare assignment data
    const assignmentData = {
      ...testStaffAssignmentData,
      bookingId,
      staffIds: availableStaff.map(s => s.id)
    }
    
    console.log(`👥 Assigning ${assignmentData.staffIds.length} staff members`)
    
    const result = await makeAPIRequest('/api/bookings/assign-staff', {
      method: 'POST',
      body: JSON.stringify(assignmentData)
    })
    
    if (result.success && result.data.success) {
      testResults.staffAssignment = {
        success: true,
        assignedStaff: result.data.assignedStaff,
        createdTasks: result.data.createdTasks,
        taskCount: result.data.createdTasks?.length || 0
      }
      
      console.log('✅ Staff assignment successful!')
      console.log(`👥 Assigned staff: ${result.data.assignedStaff?.length || 0}`)
      console.log(`📋 Created tasks: ${result.data.createdTasks?.length || 0}`)
      
      return true
    } else {
      testResults.staffAssignment = {
        success: false,
        error: result.data?.error || 'Unknown error'
      }
      console.log('❌ Staff assignment failed:', result.data?.error)
      return false
    }
  } catch (error) {
    testResults.staffAssignment = {
      success: false,
      error: error.message
    }
    console.log('❌ Staff assignment error:', error.message)
    return false
  }
}

/**
 * Test 5: Mobile API Sync
 */
async function testMobileSync() {
  console.log('\n🧪 TEST 4: Mobile API Sync')
  console.log('=' .repeat(50))
  
  try {
    // Test mobile bookings endpoint
    const bookingsResult = await makeAPIRequest('/api/bookings?mobile=true&status=approved', {
      headers: {
        'X-API-Key': MOBILE_API_KEY,
        'X-Mobile-Secret': MOBILE_SECRET
      }
    })
    
    if (!bookingsResult.success) {
      console.log('❌ Mobile bookings API failed')
      testResults.mobileSync = {
        success: false,
        error: 'Mobile bookings API failed'
      }
      return false
    }
    
    // Test mobile assignments endpoint
    const assignmentsResult = await makeAPIRequest('/api/mobile/assignments?staffId=test-staff', {
      headers: {
        'X-API-Key': MOBILE_API_KEY,
        'X-Mobile-Secret': MOBILE_SECRET
      }
    })
    
    if (!assignmentsResult.success) {
      console.log('❌ Mobile assignments API failed')
      testResults.mobileSync = {
        success: false,
        error: 'Mobile assignments API failed'
      }
      return false
    }
    
    // Test sync endpoint
    const syncData = {
      lastSyncTimestamp: Date.now() - 3600000, // 1 hour ago
      staffId: 'test-staff',
      deviceId: 'test-device',
      platform: 'mobile',
      pendingChanges: {
        bookings: [],
        assignments: []
      }
    }
    
    const syncResult = await makeAPIRequest('/api/mobile/sync', {
      method: 'POST',
      headers: {
        'X-API-Key': MOBILE_API_KEY,
        'X-Mobile-Secret': MOBILE_SECRET
      },
      body: JSON.stringify(syncData)
    })
    
    if (syncResult.success) {
      testResults.mobileSync = {
        success: true,
        bookingsCount: bookingsResult.data?.data?.bookings?.length || 0,
        assignmentsCount: assignmentsResult.data?.data?.assignments?.length || 0,
        syncTimestamp: syncResult.data?.data?.syncTimestamp
      }
      
      console.log('✅ Mobile sync successful!')
      console.log(`📱 Bookings synced: ${testResults.mobileSync.bookingsCount}`)
      console.log(`📋 Assignments synced: ${testResults.mobileSync.assignmentsCount}`)
      
      return true
    } else {
      testResults.mobileSync = {
        success: false,
        error: syncResult.data?.error || 'Sync failed'
      }
      console.log('❌ Mobile sync failed:', syncResult.data?.error)
      return false
    }
  } catch (error) {
    testResults.mobileSync = {
      success: false,
      error: error.message
    }
    console.log('❌ Mobile sync error:', error.message)
    return false
  }
}

/**
 * Test 6: Job Completion Simulation
 */
async function testJobCompletion(bookingId) {
  console.log('\n🧪 TEST 5: Job Completion Simulation')
  console.log('=' .repeat(50))
  
  if (!bookingId) {
    console.log('❌ Skipping job completion test - no booking ID')
    return false
  }
  
  try {
    // Simulate job completion
    const completionData = {
      status: 'completed',
      updatedBy: 'test-staff-id',
      notes: 'Test job completion - all tasks completed successfully',
      photos: [
        'https://example.com/completion-photo-1.jpg',
        'https://example.com/completion-photo-2.jpg'
      ],
      checklistCompleted: ['cleaning', 'maintenance', 'inspection'],
      timeSpent: 240, // 4 hours
      timestamp: new Date().toISOString()
    }
    
    const result = await makeAPIRequest(`/api/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: {
        'X-API-Key': MOBILE_API_KEY,
        'X-Mobile-Secret': MOBILE_SECRET
      },
      body: JSON.stringify(completionData)
    })
    
    if (result.success && result.data.success) {
      testResults.jobCompletion = {
        success: true,
        newStatus: result.data.newStatus,
        completionTime: result.data.timestamp
      }
      
      console.log('✅ Job completion successful!')
      console.log(`📊 Final status: ${result.data.newStatus}`)
      
      return true
    } else {
      testResults.jobCompletion = {
        success: false,
        error: result.data?.error || 'Unknown error'
      }
      console.log('❌ Job completion failed:', result.data?.error)
      return false
    }
  } catch (error) {
    testResults.jobCompletion = {
      success: false,
      error: error.message
    }
    console.log('❌ Job completion error:', error.message)
    return false
  }
}

/**
 * Generate Test Report
 */
function generateTestReport() {
  console.log('\n📊 COMPREHENSIVE TEST REPORT')
  console.log('=' .repeat(60))
  
  const tests = [
    { name: 'Booking Creation', result: testResults.bookingCreation },
    { name: 'Booking Approval', result: testResults.bookingApproval },
    { name: 'Staff Assignment', result: testResults.staffAssignment },
    { name: 'Mobile API Sync', result: testResults.mobileSync },
    { name: 'Job Completion', result: testResults.jobCompletion }
  ]
  
  let passedTests = 0
  let totalTests = tests.length
  
  tests.forEach(test => {
    const status = test.result?.success ? '✅ PASS' : '❌ FAIL'
    console.log(`${status} ${test.name}`)
    
    if (test.result?.success) {
      passedTests++
    } else if (test.result?.error) {
      console.log(`   Error: ${test.result.error}`)
    }
  })
  
  console.log('\n📈 SUMMARY')
  console.log('-' .repeat(30))
  console.log(`Tests Passed: ${passedTests}/${totalTests}`)
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`)
  
  testResults.overallSuccess = passedTests === totalTests
  
  if (testResults.overallSuccess) {
    console.log('\n🎉 ALL TESTS PASSED! Booking workflow is functioning correctly.')
  } else {
    console.log('\n⚠️  SOME TESTS FAILED. Please review the errors above.')
  }
  
  return testResults
}

/**
 * Main test execution
 */
async function runWorkflowTest() {
  console.log('🚀 STARTING COMPREHENSIVE BOOKING WORKFLOW TEST')
  console.log('=' .repeat(60))
  console.log(`🌐 API Base URL: ${API_BASE_URL}`)
  console.log(`📱 Mobile API Key: ${MOBILE_API_KEY}`)
  console.log(`⏰ Test started at: ${new Date().toISOString()}`)
  
  try {
    // Test 1: Create booking
    const bookingId = await testBookingCreation()
    
    // Test 2: Approve booking
    await testBookingApproval(bookingId)
    
    // Test 3: Assign staff
    await testStaffAssignment(bookingId)
    
    // Test 4: Test mobile sync
    await testMobileSync()
    
    // Test 5: Complete job
    await testJobCompletion(bookingId)
    
    // Generate final report
    const finalResults = generateTestReport()
    
    console.log('\n⏰ Test completed at:', new Date().toISOString())
    
    return finalResults
  } catch (error) {
    console.error('❌ Test execution failed:', error.message)
    return { overallSuccess: false, error: error.message }
  }
}

// Run the test
runWorkflowTest()
  .then(results => {
    process.exit(results.overallSuccess ? 0 : 1)
  })
  .catch(error => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
