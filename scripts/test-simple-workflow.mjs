#!/usr/bin/env node

/**
 * Simple Booking Workflow Test
 * Tests basic functionality without authentication
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
 * Test 1: Basic API Health Check
 */
async function testAPIHealth() {
  console.log('\n🧪 TEST 1: API Health Check')
  console.log('=' .repeat(50))
  
  try {
    // Test if server is responding
    const result = await makeAPIRequest('/api/health', {
      method: 'GET'
    })
    
    console.log('✅ API health check completed')
    return result.success
  } catch (error) {
    console.log('❌ API health check failed:', error.message)
    return false
  }
}

/**
 * Test 2: Mobile API Authentication
 */
async function testMobileAuth() {
  console.log('\n🧪 TEST 2: Mobile API Authentication')
  console.log('=' .repeat(50))
  
  try {
    const result = await makeAPIRequest('/api/bookings?mobile=true&status=approved', {
      headers: {
        'X-API-Key': MOBILE_API_KEY,
        'X-Mobile-Secret': MOBILE_SECRET
      }
    })
    
    if (result.success) {
      console.log('✅ Mobile API authentication successful')
      return true
    } else {
      console.log('❌ Mobile API authentication failed')
      return false
    }
  } catch (error) {
    console.log('❌ Mobile API authentication error:', error.message)
    return false
  }
}

/**
 * Test 3: Booking Creation (without auth)
 */
async function testBookingCreation() {
  console.log('\n🧪 TEST 3: Booking Creation')
  console.log('=' .repeat(50))
  
  try {
    const result = await makeAPIRequest('/api/bookings', {
      method: 'POST',
      headers: {
        'Origin': 'http://localhost:3001',
        'X-API-Key': 'test-api-key'
      },
      body: JSON.stringify(testBooking)
    })
    
    if (result.success && result.data.success) {
      console.log('✅ Booking creation successful!')
      console.log(`📝 Booking ID: ${result.data.bookingId}`)
      return result.data.bookingId
    } else {
      console.log('❌ Booking creation failed:', result.data?.error)
      return null
    }
  } catch (error) {
    console.log('❌ Booking creation error:', error.message)
    return null
  }
}

/**
 * Test 4: Staff Accounts API
 */
async function testStaffAPI() {
  console.log('\n🧪 TEST 4: Staff Accounts API')
  console.log('=' .repeat(50))
  
  try {
    const result = await makeAPIRequest('/api/admin/staff-accounts')
    
    if (result.success) {
      console.log('✅ Staff API accessible')
      console.log(`👥 Staff count: ${result.data?.data?.length || 0}`)
      return true
    } else {
      console.log('❌ Staff API failed:', result.data?.error)
      return false
    }
  } catch (error) {
    console.log('❌ Staff API error:', error.message)
    return false
  }
}

/**
 * Test 5: Firebase Connection Test
 */
async function testFirebaseConnection() {
  console.log('\n🧪 TEST 5: Firebase Connection')
  console.log('=' .repeat(50))
  
  try {
    // Test a simple Firebase operation through API
    const result = await makeAPIRequest('/api/bookings?mobile=true&limit=1', {
      headers: {
        'X-API-Key': MOBILE_API_KEY,
        'X-Mobile-Secret': MOBILE_SECRET
      }
    })
    
    if (result.success) {
      console.log('✅ Firebase connection working')
      return true
    } else {
      console.log('❌ Firebase connection issue:', result.data?.error)
      return false
    }
  } catch (error) {
    console.log('❌ Firebase connection error:', error.message)
    return false
  }
}

/**
 * Generate Test Report
 */
function generateTestReport(results) {
  console.log('\n📊 SIMPLE WORKFLOW TEST REPORT')
  console.log('=' .repeat(60))
  
  const tests = [
    { name: 'API Health Check', result: results.health },
    { name: 'Mobile Authentication', result: results.mobileAuth },
    { name: 'Booking Creation', result: results.bookingCreation },
    { name: 'Staff API Access', result: results.staffAPI },
    { name: 'Firebase Connection', result: results.firebaseConnection }
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
  console.log('-' .repeat(30))
  console.log(`Tests Passed: ${passedTests}/${totalTests}`)
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`)
  
  const overallSuccess = passedTests === totalTests
  
  if (overallSuccess) {
    console.log('\n🎉 ALL TESTS PASSED! Basic workflow is functioning correctly.')
  } else {
    console.log('\n⚠️  SOME TESTS FAILED. Please review the errors above.')
  }
  
  return overallSuccess
}

/**
 * Main test execution
 */
async function runSimpleWorkflowTest() {
  console.log('🚀 STARTING SIMPLE BOOKING WORKFLOW TEST')
  console.log('=' .repeat(60))
  console.log(`🌐 API Base URL: ${API_BASE_URL}`)
  console.log(`⏰ Test started at: ${new Date().toISOString()}`)
  
  const results = {}
  
  try {
    // Test 1: API Health
    results.health = await testAPIHealth()
    
    // Test 2: Mobile Auth
    results.mobileAuth = await testMobileAuth()
    
    // Test 3: Booking Creation
    const bookingId = await testBookingCreation()
    results.bookingCreation = !!bookingId
    
    // Test 4: Staff API
    results.staffAPI = await testStaffAPI()
    
    // Test 5: Firebase Connection
    results.firebaseConnection = await testFirebaseConnection()
    
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
runSimpleWorkflowTest()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
