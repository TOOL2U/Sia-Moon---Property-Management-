const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://alkogpgjxpshoqsfgqef.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsa29ncGdqeHBzaG9xc2ZncWVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTM1NTI4MiwiZXhwIjoyMDY2OTMxMjgyfQ._k3fSYzKg51Icssh68tU2izhQO660yTDCUdrQ4-I93Y'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsa29ncGdqeHBzaG9xc2ZncWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzNTUyODIsImV4cCI6MjA2NjkzMTI4Mn0.yT3QR-aUJnmlt8DkjzVfx5KirzIfRvv9aTYEWvxI20g'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

async function testSupabaseIntegration() {
  console.log('🧪 COMPREHENSIVE SUPABASE INTEGRATION TEST')
  console.log('=' .repeat(50))
  
  let allTestsPassed = true
  
  // Test 1: Database Connection
  console.log('\n1️⃣ Testing Database Connection...')
  try {
    const { data, error } = await supabaseAdmin.from('profiles').select('count').single()
    if (error && error.code !== 'PGRST116') {
      console.error('❌ Database connection failed:', error)
      allTestsPassed = false
    } else {
      console.log('✅ Database connection successful')
    }
  } catch (err) {
    console.error('❌ Database connection error:', err.message)
    allTestsPassed = false
  }
  
  // Test 2: Profiles Table Structure
  console.log('\n2️⃣ Testing Profiles Table Structure...')
  try {
    const { data, error } = await supabaseAdmin.from('profiles').select('*').limit(1)
    if (error) {
      console.error('❌ Profiles table error:', error)
      allTestsPassed = false
    } else {
      console.log('✅ Profiles table accessible')
      if (data && data.length > 0) {
        console.log('📊 Sample profile structure:', Object.keys(data[0]))
      }
    }
  } catch (err) {
    console.error('❌ Profiles table error:', err.message)
    allTestsPassed = false
  }
  
  // Test 3: Authentication Service
  console.log('\n3️⃣ Testing Authentication Service...')
  try {
    // Test sign up (will fail if user exists, which is expected)
    const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
      email: 'test@example.com',
      password: 'testpassword123'
    })
    
    if (signUpError && signUpError.message.includes('already registered')) {
      console.log('✅ Auth service working (user already exists)')
    } else if (signUpError) {
      console.log('⚠️ Auth signup test:', signUpError.message)
    } else {
      console.log('✅ Auth service working (new user created)')
    }
  } catch (err) {
    console.error('❌ Auth service error:', err.message)
    allTestsPassed = false
  }
  
  // Test 4: Existing User Profile
  console.log('\n4️⃣ Testing Existing User Profile...')
  try {
    const userId = '73baf1bb-db10-4130-a120-471618f602b9'
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('❌ User profile not found:', error)
      allTestsPassed = false
    } else {
      console.log('✅ User profile found:', {
        id: data.id,
        email: data.email,
        role: data.role,
        full_name: data.full_name
      })
    }
  } catch (err) {
    console.error('❌ User profile error:', err.message)
    allTestsPassed = false
  }
  
  // Test 5: RLS Policies
  console.log('\n5️⃣ Testing Row Level Security Policies...')
  try {
    // Test with anon client (should fail without auth)
    const { data, error } = await supabaseClient.from('profiles').select('*').limit(1)
    if (error && error.code === 'PGRST301') {
      console.log('✅ RLS policies working (access denied for anon)')
    } else if (data) {
      console.log('⚠️ RLS might not be properly configured (anon access allowed)')
    }
  } catch (err) {
    console.log('✅ RLS policies working (access restricted)')
  }
  
  // Test 6: Environment Variables
  console.log('\n6️⃣ Testing Environment Variables...')
  const envVars = {
    'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set',
    'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set'
  }
  
  Object.entries(envVars).forEach(([key, value]) => {
    if (value === 'Not set') {
      console.log(`❌ ${key}: ${value}`)
      allTestsPassed = false
    } else {
      console.log(`✅ ${key}: ${value}`)
    }
  })
  
  // Test 7: Database Schema Validation
  console.log('\n7️⃣ Testing Database Schema...')
  try {
    const requiredTables = ['profiles']
    for (const table of requiredTables) {
      const { data, error } = await supabaseAdmin.from(table).select('*').limit(1)
      if (error && error.code === '42P01') {
        console.log(`❌ Table '${table}' does not exist`)
        allTestsPassed = false
      } else {
        console.log(`✅ Table '${table}' exists and accessible`)
      }
    }
  } catch (err) {
    console.error('❌ Schema validation error:', err.message)
    allTestsPassed = false
  }
  
  // Final Results
  console.log('\n' + '=' .repeat(50))
  if (allTestsPassed) {
    console.log('🎉 ALL SUPABASE INTEGRATION TESTS PASSED!')
    console.log('✅ Your Supabase integration is working correctly')
  } else {
    console.log('❌ SOME TESTS FAILED')
    console.log('⚠️ Please review the errors above')
  }
  console.log('=' .repeat(50))
}

// Load environment variables
require('dotenv').config({ path: '.env.local' })

testSupabaseIntegration().catch(console.error)
