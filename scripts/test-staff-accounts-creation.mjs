#!/usr/bin/env node

/**
 * Staff Accounts Creation Test
 * Tests that staff creation in Back Office properly saves to staff_accounts collection
 */

import fetch from 'node-fetch'

const API_BASE_URL = 'http://localhost:3001'

// Test staff data
const testStaffData = {
  name: 'Test Staff Member',
  email: 'test.staff@siamoon.com',
  password: 'TempPass123!',
  phone: '+1-555-TEST-001',
  address: '123 Test Staff Street, Test City',
  role: 'cleaner',
  department: 'Housekeeping',
  status: 'active',
  assignedProperties: ['Villa Sunset', 'Villa Paradise'],
  skills: ['cleaning', 'villa_preparation', 'maintenance'],
  temporaryPassword: 'TempPass123!',
  mustChangePassword: true,
  
  employment: {
    employmentType: 'full-time',
    startDate: '2025-07-15',
    salary: 45000,
    benefits: []
  },
  
  personalDetails: {
    dateOfBirth: '1990-01-15',
    nationalId: 'TEST123456789'
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
 * Test 1: Create staff account via API
 */
async function testStaffAccountCreation() {
  console.log('\n🧪 TEST 1: Create Staff Account via API')
  console.log('=' .repeat(60))
  
  try {
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
      
      return {
        success: true,
        staffAccount: result.data.staffAccount,
        userCredentials: result.data.userCredentials
      }
    } else {
      console.log('❌ Staff account creation failed:', result.data?.error)
      return { success: false, error: result.data?.error }
    }
  } catch (error) {
    console.log('❌ Error creating staff account:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Test 2: Verify staff account appears in staff_accounts collection
 */
async function testStaffAccountRetrieval() {
  console.log('\n🧪 TEST 2: Verify Staff Account in Collection')
  console.log('=' .repeat(60))
  
  try {
    const result = await makeAPIRequest('/api/admin/staff-accounts?limit=50')
    
    if (result.success && result.data.success) {
      const staffAccounts = result.data.data || []
      const testStaff = staffAccounts.find(staff => 
        staff.email === testStaffData.email || 
        staff.name === testStaffData.name
      )
      
      if (testStaff) {
        console.log('✅ Test staff account found in staff_accounts collection!')
        console.log(`📝 Staff details:`, {
          id: testStaff.id,
          name: testStaff.name,
          email: testStaff.email,
          role: testStaff.role,
          isActive: testStaff.isActive,
          hasPasswordHash: !!testStaff.passwordHash,
          assignedProperties: testStaff.assignedProperties,
          skills: testStaff.skills
        })
        
        return {
          success: true,
          staffAccount: testStaff,
          totalStaffCount: staffAccounts.length
        }
      } else {
        console.log('❌ Test staff account not found in collection')
        console.log(`📊 Total staff accounts: ${staffAccounts.length}`)
        return { success: false, error: 'Staff account not found in collection' }
      }
    } else {
      console.log('❌ Failed to retrieve staff accounts:', result.data?.error)
      return { success: false, error: result.data?.error }
    }
  } catch (error) {
    console.log('❌ Error retrieving staff accounts:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Test 3: Verify password hashing and security
 */
async function testPasswordSecurity(staffAccount) {
  console.log('\n🧪 TEST 3: Verify Password Security')
  console.log('=' .repeat(60))
  
  if (!staffAccount) {
    console.log('❌ Skipping password security test - no staff account')
    return { success: false, error: 'No staff account provided' }
  }
  
  try {
    // Check if password is properly hashed (bcrypt format)
    const hasPasswordHash = !!staffAccount.passwordHash
    const isBcryptHash = staffAccount.passwordHash && staffAccount.passwordHash.startsWith('$2b$')
    const hasProperLength = staffAccount.passwordHash && staffAccount.passwordHash.length >= 60
    
    console.log(`🔐 Password hash present: ${hasPasswordHash}`)
    console.log(`🔐 Bcrypt format: ${isBcryptHash}`)
    console.log(`🔐 Proper length: ${hasProperLength}`)
    console.log(`🔐 Hash preview: ${staffAccount.passwordHash?.substring(0, 20)}...`)
    
    if (hasPasswordHash && isBcryptHash && hasProperLength) {
      console.log('✅ Password security validation passed!')
      return {
        success: true,
        securityChecks: {
          hasPasswordHash,
          isBcryptHash,
          hasProperLength
        }
      }
    } else {
      console.log('❌ Password security validation failed!')
      return {
        success: false,
        error: 'Password not properly secured',
        securityChecks: {
          hasPasswordHash,
          isBcryptHash,
          hasProperLength
        }
      }
    }
  } catch (error) {
    console.log('❌ Error testing password security:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Test 4: Test staff account data integrity
 */
async function testDataIntegrity(staffAccount) {
  console.log('\n🧪 TEST 4: Test Data Integrity')
  console.log('=' .repeat(60))
  
  if (!staffAccount) {
    console.log('❌ Skipping data integrity test - no staff account')
    return { success: false, error: 'No staff account provided' }
  }
  
  try {
    const requiredFields = ['id', 'name', 'email', 'role', 'isActive', 'createdAt']
    const missingFields = requiredFields.filter(field => !staffAccount[field])
    
    const hasAllRequiredFields = missingFields.length === 0
    const hasCorrectRole = ['admin', 'manager', 'cleaner', 'maintenance', 'staff'].includes(staffAccount.role)
    const hasValidEmail = staffAccount.email && staffAccount.email.includes('@')
    const hasAssignedProperties = Array.isArray(staffAccount.assignedProperties)
    const hasSkills = Array.isArray(staffAccount.skills)
    
    console.log(`📋 All required fields: ${hasAllRequiredFields}`)
    console.log(`👤 Valid role: ${hasCorrectRole} (${staffAccount.role})`)
    console.log(`📧 Valid email: ${hasValidEmail} (${staffAccount.email})`)
    console.log(`🏠 Has properties: ${hasAssignedProperties} (${staffAccount.assignedProperties?.length || 0})`)
    console.log(`🛠️ Has skills: ${hasSkills} (${staffAccount.skills?.length || 0})`)
    
    if (missingFields.length > 0) {
      console.log(`❌ Missing fields: ${missingFields.join(', ')}`)
    }
    
    const allChecksPass = hasAllRequiredFields && hasCorrectRole && hasValidEmail && hasAssignedProperties && hasSkills
    
    if (allChecksPass) {
      console.log('✅ Data integrity validation passed!')
      return {
        success: true,
        integrityChecks: {
          hasAllRequiredFields,
          hasCorrectRole,
          hasValidEmail,
          hasAssignedProperties,
          hasSkills
        }
      }
    } else {
      console.log('❌ Data integrity validation failed!')
      return {
        success: false,
        error: 'Data integrity issues found',
        integrityChecks: {
          hasAllRequiredFields,
          hasCorrectRole,
          hasValidEmail,
          hasAssignedProperties,
          hasSkills
        }
      }
    }
  } catch (error) {
    console.log('❌ Error testing data integrity:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Generate Test Report
 */
function generateTestReport(results) {
  console.log('\n📊 STAFF ACCOUNTS CREATION TEST REPORT')
  console.log('=' .repeat(70))
  
  const tests = [
    { name: 'Staff Account Creation', result: results.creation?.success },
    { name: 'Collection Retrieval', result: results.retrieval?.success },
    { name: 'Password Security', result: results.security?.success },
    { name: 'Data Integrity', result: results.integrity?.success }
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
  if (results.creation?.staffAccount) {
    console.log(`👤 Created staff: ${results.creation.staffAccount.name}`)
  }
  
  if (results.retrieval?.totalStaffCount) {
    console.log(`📊 Total staff in collection: ${results.retrieval.totalStaffCount}`)
  }
  
  if (results.security?.securityChecks) {
    const checks = results.security.securityChecks
    console.log(`🔐 Security: Hash=${checks.hasPasswordHash}, Bcrypt=${checks.isBcryptHash}, Length=${checks.hasProperLength}`)
  }
  
  const overallSuccess = passedTests === totalTests
  
  if (overallSuccess) {
    console.log('\n🎉 ALL STAFF ACCOUNTS TESTS PASSED!')
    console.log('✅ Staff creation saves to staff_accounts collection')
    console.log('✅ Password hashing with bcrypt is working')
    console.log('✅ Data integrity is maintained')
    console.log('✅ Back Office staff creation is properly connected')
  } else {
    console.log('\n⚠️  SOME TESTS FAILED. Please review the errors above.')
  }
  
  return overallSuccess
}

/**
 * Main test execution
 */
async function runStaffAccountsCreationTest() {
  console.log('🚀 STARTING STAFF ACCOUNTS CREATION TEST')
  console.log('=' .repeat(70))
  console.log(`🌐 API Base URL: ${API_BASE_URL}`)
  console.log(`⏰ Test started at: ${new Date().toISOString()}`)
  
  const results = {}
  
  try {
    // Test 1: Create staff account
    results.creation = await testStaffAccountCreation()
    
    // Wait for data to sync
    console.log('\n⏳ Waiting 2 seconds for data synchronization...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Test 2: Verify in collection
    results.retrieval = await testStaffAccountRetrieval()
    
    // Test 3: Password security (if staff was created)
    if (results.retrieval?.staffAccount) {
      results.security = await testPasswordSecurity(results.retrieval.staffAccount)
    }
    
    // Test 4: Data integrity (if staff was created)
    if (results.retrieval?.staffAccount) {
      results.integrity = await testDataIntegrity(results.retrieval.staffAccount)
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
runStaffAccountsCreationTest()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
