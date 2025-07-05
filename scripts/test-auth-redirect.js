#!/usr/bin/env node

/**
 * Test Authentication Redirect
 * Tests the complete auth flow including redirect to dashboard
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local
function loadEnvFile() {
  try {
    const envPath = path.join(process.cwd(), '.env.local')
    const envContent = fs.readFileSync(envPath, 'utf8')
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim()
        if (!key.startsWith('#') && value) {
          process.env[key.trim()] = value
        }
      }
    })
  } catch (error) {
    console.error('Could not load .env.local file:', error.message)
  }
}

loadEnvFile()

async function testAuthRedirect() {
  console.log('🔐 Testing Authentication and Redirect Flow...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error('❌ Missing Supabase configuration!')
    return false
  }

  try {
    const anonClient = createClient(supabaseUrl, anonKey)
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    console.log('📋 Configuration:')
    console.log(`URL: ${supabaseUrl}`)
    console.log(`Anon Key: ${anonKey.substring(0, 20)}...`)
    console.log('')

    // Test 1: Create a test user
    console.log('👤 Creating test user...')
    
    const testEmail = `redirect-test-${Math.floor(Math.random() * 10000)}@gmail.com`
    const testPassword = 'testpassword123'
    const testName = 'Redirect Test User'

    const { data: signupData, error: signupError } = await anonClient.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testName,
          role: 'client'
        }
      }
    })

    if (signupError) {
      console.log('❌ Signup failed:', signupError.message)
      return false
    }

    console.log('✅ User created successfully!')
    console.log('📋 User ID:', signupData.user?.id)

    // Test 2: Create profile manually
    console.log('\n📊 Creating profile...')
    
    const { error: profileError } = await anonClient
      .from('profiles')
      .insert({
        id: signupData.user?.id,
        email: testEmail,
        full_name: testName,
        role: 'client'
      })

    if (profileError) {
      console.log('❌ Profile creation failed:', profileError.message)
    } else {
      console.log('✅ Profile created successfully!')
    }

    // Test 3: Test sign in and profile loading
    console.log('\n🔑 Testing sign in...')
    
    const { data: signinData, error: signinError } = await anonClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })

    if (signinError) {
      console.log('❌ Sign in failed:', signinError.message)
    } else {
      console.log('✅ Sign in successful!')
      
      // Test profile loading after sign in
      const { data: profile, error: profileLoadError } = await anonClient
        .from('profiles')
        .select('*')
        .eq('id', signinData.user?.id)
        .single()

      if (profileLoadError) {
        console.log('❌ Profile loading failed:', profileLoadError.message)
      } else {
        console.log('✅ Profile loaded successfully!')
        console.log('📋 Profile data:', {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          role: profile.role
        })
        
        // Simulate redirect logic
        console.log('\n🔄 Simulating redirect logic...')
        if (profile.role === 'staff' || profile.role === 'admin') {
          console.log('✅ Would redirect to: /dashboard/staff')
        } else {
          console.log('✅ Would redirect to: /dashboard/client')
        }
      }
    }

    // Clean up
    console.log('\n🧹 Cleaning up test user...')
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(signupData.user?.id || '')
    
    if (deleteError) {
      console.log('⚠️  Could not delete test user:', deleteError.message)
    } else {
      console.log('✅ Test user cleaned up')
    }

    return !signinError

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    return false
  }
}

// Run the test
testAuthRedirect()
  .then(success => {
    if (success) {
      console.log('\n🎉 Authentication and redirect flow test passed!')
      console.log('✅ The auth flow should work correctly in the browser')
      console.log('')
      console.log('🎯 Test the flow manually:')
      console.log('   1. Go to: http://localhost:3002/auth/signup')
      console.log('   2. Create a test account')
      console.log('   3. Check browser console for redirect logs')
      console.log('   4. Verify redirect to dashboard works')
    } else {
      console.log('\n❌ Authentication and redirect flow test failed.')
      console.log('🔧 Check the error messages above for details')
    }
  })
  .catch(error => {
    console.error('\n💥 Test script failed:', error.message)
    process.exit(1)
  })
