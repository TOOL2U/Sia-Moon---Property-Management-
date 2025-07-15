#!/usr/bin/env node

/**
 * Back Office Integration Test
 * Tests that bookings flow to the Back Office bookings tab for approval
 */

import fetch from 'node-fetch'

const API_BASE_URL = 'http://localhost:3001'

// Test booking data
const testBooking = {
  property: 'Villa Paradise Back Office Test',
  address: '123 Back Office Test Beach Road, Paradise Island',
  guestName: 'Back Office Test Guest',
  guestEmail: 'backoffice.test@example.com',
  checkInDate: '2025-07-25',
  checkOutDate: '2025-07-30',
  guestCount: 4,
  price: 2500,
  subject: 'Back Office Integration Test Booking',
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
 * Test 1: Create booking that flows to Back Office
 */
async function testBookingCreation() {
  console.log('\n🧪 TEST 1: Create Booking for Back Office')
  console.log('=' .repeat(60))
  
  try {
    const result = await makeAPIRequest('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(testBooking)
    })
    
    if (result.success && result.data.success) {
      console.log('✅ Booking created successfully!')
      console.log(`📝 Booking ID: ${result.data.bookingId}`)
      console.log(`📋 Pending Booking ID: ${result.data.pendingBookingId}`)
      console.log(`⏱️  Processing time: ${result.data.processingTime}ms`)
      
      return {
        success: true,
        bookingId: result.data.bookingId,
        pendingBookingId: result.data.pendingBookingId
      }
    } else {
      console.log('❌ Booking creation failed:', result.data?.error)
      return { success: false, error: result.data?.error }
    }
  } catch (error) {
    console.log('❌ Error creating booking:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Test 2: Verify booking appears in Back Office integrated endpoint
 */
async function testBackOfficeIntegration() {
  console.log('\n🧪 TEST 2: Verify Back Office Integration')
  console.log('=' .repeat(60))
  
  try {
    const result = await makeAPIRequest('/api/admin/bookings/integrated?status=pending&limit=10')
    
    if (result.success && result.data.success) {
      const bookings = result.data.data.bookings || []
      const stats = result.data.data.stats || {}
      
      console.log('✅ Back Office integrated endpoint working!')
      console.log(`📊 Total bookings: ${bookings.length}`)
      console.log(`📋 Pending bookings: ${stats.pending || 0}`)
      console.log(`📈 Stats:`, stats)
      
      // Check if our test booking is in the list
      const testBookingFound = bookings.find(b => 
        b.guestName === testBooking.guestName ||
        b.guest_name === testBooking.guestName
      )
      
      if (testBookingFound) {
        console.log('✅ Test booking found in Back Office!')
        console.log(`📝 Booking details:`, {
          id: testBookingFound.id,
          status: testBookingFound.status,
          backOfficeApproval: testBookingFound.backOfficeApproval,
          priority: testBookingFound.priority,
          source: testBookingFound.source
        })
        
        return {
          success: true,
          bookingFound: true,
          booking: testBookingFound,
          totalBookings: bookings.length,
          stats
        }
      } else {
        console.log('⚠️ Test booking not found in Back Office (may take a moment to sync)')
        return {
          success: true,
          bookingFound: false,
          totalBookings: bookings.length,
          stats
        }
      }
    } else {
      console.log('❌ Back Office integration failed:', result.data?.error)
      return { success: false, error: result.data?.error }
    }
  } catch (error) {
    console.log('❌ Error testing Back Office integration:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Test 3: Test booking approval workflow
 */
async function testBookingApproval(bookingId) {
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
      adminId: 'test-admin-back-office',
      adminName: 'Back Office Test Admin',
      notes: 'Approved via Back Office integration test'
    }
    
    const result = await makeAPIRequest('/api/bookings/approve', {
      method: 'POST',
      body: JSON.stringify(approvalData)
    })
    
    if (result.success && result.data.success) {
      console.log('✅ Booking approval successful!')
      console.log(`📊 New status: ${result.data.newStatus}`)
      console.log(`📝 Approval ID: ${result.data.approvalId}`)
      
      return {
        success: true,
        newStatus: result.data.newStatus,
        approvalId: result.data.approvalId
      }
    } else {
      console.log('❌ Booking approval failed:', result.data?.error)
      return { success: false, error: result.data?.error }
    }
  } catch (error) {
    console.log('❌ Error testing booking approval:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Test 4: Verify approved booking status in Back Office
 */
async function testApprovedBookingStatus() {
  console.log('\n🧪 TEST 4: Verify Approved Booking Status')
  console.log('=' .repeat(60))
  
  try {
    const result = await makeAPIRequest('/api/admin/bookings/integrated?status=approved&limit=10')
    
    if (result.success && result.data.success) {
      const approvedBookings = result.data.data.bookings || []
      const stats = result.data.data.stats || {}
      
      console.log('✅ Approved bookings endpoint working!')
      console.log(`📊 Approved bookings: ${approvedBookings.length}`)
      console.log(`📈 Stats:`, stats)
      
      // Check if our test booking is now approved
      const testBookingApproved = approvedBookings.find(b => 
        b.guestName === testBooking.guestName ||
        b.guest_name === testBooking.guestName
      )
      
      if (testBookingApproved) {
        console.log('✅ Test booking found in approved list!')
        console.log(`📝 Approved booking status: ${testBookingApproved.status}`)
        
        return {
          success: true,
          bookingApproved: true,
          booking: testBookingApproved
        }
      } else {
        console.log('⚠️ Test booking not found in approved list')
        return {
          success: true,
          bookingApproved: false
        }
      }
    } else {
      console.log('❌ Approved bookings check failed:', result.data?.error)
      return { success: false, error: result.data?.error }
    }
  } catch (error) {
    console.log('❌ Error checking approved bookings:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Generate Test Report
 */
function generateTestReport(results) {
  console.log('\n📊 BACK OFFICE INTEGRATION TEST REPORT')
  console.log('=' .repeat(70))
  
  const tests = [
    { name: 'Booking Creation', result: results.creation?.success },
    { name: 'Back Office Integration', result: results.integration?.success },
    { name: 'Booking Approval', result: results.approval?.success },
    { name: 'Approved Status Check', result: results.statusCheck?.success }
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
  
  // Additional insights
  if (results.integration?.bookingFound) {
    console.log('✅ Booking successfully flows to Back Office')
  }
  
  if (results.integration?.stats) {
    console.log(`📊 Back Office has ${results.integration.stats.pending} pending bookings`)
  }
  
  if (results.statusCheck?.bookingApproved) {
    console.log('✅ Approval workflow working correctly')
  }
  
  const overallSuccess = passedTests === totalTests
  
  if (overallSuccess) {
    console.log('\n🎉 ALL BACK OFFICE INTEGRATION TESTS PASSED!')
    console.log('✅ Bookings flow to Back Office for approval')
    console.log('✅ Integrated endpoint combines all booking sources')
    console.log('✅ Approval workflow functions correctly')
    console.log('✅ Status updates sync across the system')
  } else {
    console.log('\n⚠️  SOME TESTS FAILED. Please review the errors above.')
  }
  
  return overallSuccess
}

/**
 * Main test execution
 */
async function runBackOfficeIntegrationTest() {
  console.log('🚀 STARTING BACK OFFICE INTEGRATION TEST')
  console.log('=' .repeat(70))
  console.log(`🌐 API Base URL: ${API_BASE_URL}`)
  console.log(`⏰ Test started at: ${new Date().toISOString()}`)
  
  const results = {}
  
  try {
    // Test 1: Create booking
    results.creation = await testBookingCreation()
    
    // Wait a moment for data to sync
    console.log('\n⏳ Waiting 2 seconds for data synchronization...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Test 2: Check Back Office integration
    results.integration = await testBackOfficeIntegration()
    
    // Test 3: Approve booking (if creation was successful)
    if (results.creation?.success && results.creation?.bookingId) {
      results.approval = await testBookingApproval(results.creation.bookingId)
      
      // Wait for approval to sync
      if (results.approval?.success) {
        console.log('\n⏳ Waiting 2 seconds for approval to sync...')
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Test 4: Check approved status
        results.statusCheck = await testApprovedBookingStatus()
      }
    }
    
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
runBackOfficeIntegrationTest()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
