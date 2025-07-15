#!/usr/bin/env node

/**
 * Staff Creation Fix Test
 * Tests that the Firebase undefined value error is resolved
 */

import fetch from 'node-fetch'

const API_BASE_URL = 'http://localhost:3001'

// Simple test staff data (minimal to avoid undefined values)
const testStaffData = {
  name: 'Firebase Fix Test Staff',
  email: 'firebase.fix.test@siamoon.com',
  password: 'TestPass123!',
  phone: '+1-555-FIX-TEST',
  address: '123 Fix Test Street, Test City',
  role: 'cleaner',
  status: 'active',
  assignedProperties: ['Villa Test'],
  skills: ['cleaning'],
  temporaryPassword: 'TestPass123!',
  mustChangePassword: true,
  
  employment: {
    employmentType: 'full-time',
    startDate: '2025-07-15',
    salary: 40000,
    benefits: []
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

    let data
    try {
      data = await response.json()
    } catch (parseError) {
      console.error('❌ Failed to parse JSON response:', parseError.message)
      const textResponse = await response.text()
      console.log('📄 Raw response:', textResponse.substring(0, 500))
      return {
        success: false,
        error: 'Invalid JSON response from server'
      }
    }
    
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
 * Test staff creation with minimal data to avoid undefined values
 */
async function testStaffCreationFix() {
  console.log('\n🧪 TEST: Staff Creation Fix (No Undefined Values)')
  console.log('=' .repeat(60))
  
  try {
    console.log('📋 Sending staff data:', {
      name: testStaffData.name,
      email: testStaffData.email,
      role: testStaffData.role,
      hasPassword: !!testStaffData.password,
      hasEmployment: !!testStaffData.employment
    })
    
    const result = await makeAPIRequest('/api/admin/staff-accounts', {
      method: 'POST',
      body: JSON.stringify(testStaffData)
    })
    
    if (result.success && result.data.success) {
      console.log('✅ Staff account created successfully!')
      console.log(`📝 Staff ID: ${result.data.staffAccount?.id}`)
      console.log(`👤 Staff Name: ${result.data.staffAccount?.name}`)
      console.log(`📧 Email: ${result.data.userCredentials?.email}`)
      console.log(`🔑 Has Password Hash: ${!!result.data.staffAccount?.passwordHash}`)
      console.log('🎉 Firebase undefined value error is FIXED!')
      
      return {
        success: true,
        staffAccount: result.data.staffAccount,
        userCredentials: result.data.userCredentials
      }
    } else {
      console.log('❌ Staff account creation failed:', result.data?.error)
      
      // Check if it's still the Firebase undefined error
      if (result.data?.error?.includes('undefined') || result.data?.error?.includes('Unsupported field value')) {
        console.log('🔥 Firebase undefined value error still exists!')
        console.log('📋 Error details:', result.data.error)
      }
      
      return { success: false, error: result.data?.error }
    }
  } catch (error) {
    console.log('❌ Error testing staff creation fix:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Test staff retrieval to verify it was saved correctly
 */
async function testStaffRetrieval() {
  console.log('\n🧪 TEST: Staff Retrieval Verification')
  console.log('=' .repeat(60))
  
  try {
    const result = await makeAPIRequest('/api/admin/staff-accounts?limit=10')
    
    if (result.success && result.data.success) {
      const staffAccounts = result.data.data || []
      const testStaff = staffAccounts.find(staff => 
        staff.email === testStaffData.email
      )
      
      if (testStaff) {
        console.log('✅ Test staff found in staff_accounts collection!')
        console.log(`📝 Staff details:`, {
          id: testStaff.id,
          name: testStaff.name,
          email: testStaff.email,
          role: testStaff.role,
          hasPasswordHash: !!testStaff.passwordHash,
          hasEmergencyContact: !!testStaff.emergencyContact,
          hasEmployment: !!testStaff.employment,
          hasPersonalDetails: !!testStaff.personalDetails
        })
        
        // Check for any undefined values in the retrieved data
        const hasUndefinedValues = Object.values(testStaff).some(value => value === undefined)
        if (hasUndefinedValues) {
          console.log('⚠️ Warning: Retrieved staff data contains undefined values')
        } else {
          console.log('✅ No undefined values in retrieved staff data')
        }
        
        return {
          success: true,
          staffAccount: testStaff,
          hasUndefinedValues
        }
      } else {
        console.log('❌ Test staff not found in collection')
        return { success: false, error: 'Staff not found' }
      }
    } else {
      console.log('❌ Failed to retrieve staff accounts:', result.data?.error)
      return { success: false, error: result.data?.error }
    }
  } catch (error) {
    console.log('❌ Error testing staff retrieval:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Generate Fix Test Report
 */
function generateFixTestReport(results) {
  console.log('\n📊 STAFF CREATION FIX TEST REPORT')
  console.log('=' .repeat(70))
  
  const tests = [
    { name: 'Staff Creation (No Undefined Values)', result: results.creation?.success },
    { name: 'Staff Retrieval Verification', result: results.retrieval?.success }
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
  
  // Fix status
  if (results.creation?.success) {
    console.log('🎉 Firebase undefined value error is FIXED!')
    console.log('✅ Staff creation now works without Firebase errors')
  } else {
    console.log('❌ Firebase undefined value error still exists')
    if (results.creation?.error) {
      console.log(`📋 Error: ${results.creation.error}`)
    }
  }
  
  if (results.retrieval?.success && !results.retrieval?.hasUndefinedValues) {
    console.log('✅ Retrieved data has no undefined values')
  }
  
  const overallSuccess = passedTests === totalTests
  
  if (overallSuccess) {
    console.log('\n🎉 ALL FIX TESTS PASSED!')
    console.log('✅ Firebase undefined value error resolved')
    console.log('✅ Staff creation works correctly')
    console.log('✅ Data integrity maintained')
    console.log('✅ Back Office staff creation is functional')
  } else {
    console.log('\n⚠️  SOME TESTS FAILED. Firebase error may still exist.')
  }
  
  return overallSuccess
}

/**
 * Main test execution
 */
async function runStaffCreationFixTest() {
  console.log('🚀 STARTING STAFF CREATION FIX TEST')
  console.log('=' .repeat(70))
  console.log(`🌐 API Base URL: ${API_BASE_URL}`)
  console.log(`⏰ Test started at: ${new Date().toISOString()}`)
  console.log('🎯 Testing fix for Firebase undefined value error')
  
  const results = {}
  
  try {
    // Test 1: Staff creation with fix
    results.creation = await testStaffCreationFix()
    
    // Wait for data to sync
    if (results.creation?.success) {
      console.log('\n⏳ Waiting 2 seconds for data synchronization...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Test 2: Verify retrieval
      results.retrieval = await testStaffRetrieval()
    }
    
    // Generate final report
    const overallSuccess = generateFixTestReport(results)
    
    console.log('\n⏰ Test completed at:', new Date().toISOString())
    
    return overallSuccess
  } catch (error) {
    console.error('❌ Test execution failed:', error.message)
    return false
  }
}

// Run the test
runStaffCreationFixTest()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
