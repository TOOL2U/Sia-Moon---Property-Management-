#!/usr/bin/env node

/**
 * Test Signup Flow
 * Tests the complete user signup process including profile creation
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

async function testSignupFlow() {
  console.log('🔐 Testing Complete Signup Flow...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error('❌ Missing Supabase configuration!')
    return false
  }

  try {
    // Create clients
    const anonClient = createClient(supabaseUrl, anonKey)
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    console.log('📋 Configuration:')
    console.log(`URL: ${supabaseUrl}`)
    console.log(`Anon Key: ${anonKey.substring(0, 20)}...`)
    console.log(`Service Role Key: ${serviceRoleKey.substring(0, 20)}...`)
    console.log('')

    // Test 1: Create a user using the anon client (simulates real signup)
    console.log('👤 Testing user signup with anon client...')
    
    const testEmail = `test${Math.floor(Math.random() * 10000)}@gmail.com`
    const testPassword = 'testpassword123'
    const testName = 'Test Signup User'

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

    console.log('✅ User signup successful!')
    console.log('📋 User ID:', signupData.user?.id)

    // Wait for trigger to execute
    console.log('\n⏳ Waiting for profile creation trigger...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Test 2: Check if profile was created using admin client
    console.log('📊 Checking if profile was created...')
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', signupData.user?.id)
      .single()

    if (profileError) {
      console.log('❌ Profile not found:', profileError.message)
      console.log('🔧 The trigger might not be working properly')
      
      // Try to create profile manually to test the table
      console.log('\n🔧 Attempting to create profile manually...')
      const { data: manualProfile, error: manualError } = await adminClient
        .from('profiles')
        .insert({
          id: signupData.user?.id,
          email: testEmail,
          full_name: testName,
          role: 'client'
        })
        .select()
        .single()

      if (manualError) {
        console.log('❌ Manual profile creation failed:', manualError.message)
      } else {
        console.log('✅ Manual profile creation successful!')
        console.log('📋 This means the table works, but the trigger might be the issue')
      }
    } else {
      console.log('✅ Profile created successfully by trigger!')
      console.log('📋 Profile data:', {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        created_at: profile.created_at
      })
    }

    // Test 3: Test authentication with the new user
    console.log('\n🔑 Testing authentication with new user...')
    const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })

    if (authError) {
      console.log('❌ Authentication failed:', authError.message)
    } else {
      console.log('✅ Authentication successful!')
      console.log('📋 Session created for user:', authData.user?.email)
      
      // Sign out
      await anonClient.auth.signOut()
      console.log('✅ Signed out successfully')
    }

    // Clean up: Delete the test user
    console.log('\n🧹 Cleaning up test user...')
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(signupData.user?.id || '')
    
    if (deleteError) {
      console.log('⚠️  Could not delete test user:', deleteError.message)
      console.log('📋 You may need to delete manually from Supabase dashboard')
    } else {
      console.log('✅ Test user cleaned up successfully')
    }

    return !profileError

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    return false
  }
}

// Run the test
testSignupFlow()
  .then(success => {
    if (success) {
      console.log('\n🎉 Signup flow test completed successfully!')
      console.log('✅ User registration and profile creation are working!')
      console.log('')
      console.log('🎯 You can now test the signup form at:')
      console.log('   http://localhost:3002/auth/signup')
      console.log('')
      console.log('🔧 If you still get "Database error saving new user":')
      console.log('   • Check browser console for detailed errors')
      console.log('   • Verify the signup form is using the correct auth context')
      console.log('   • Make sure the application is using Supabase auth (not local auth)')
    } else {
      console.log('\n❌ Signup flow test failed.')
      console.log('🔧 Possible issues:')
      console.log('   • Profile creation trigger not working')
      console.log('   • Database permissions issue')
      console.log('   • Network connectivity problem')
      console.log('')
      console.log('📋 Check the Supabase dashboard for more details:')
      console.log('   https://supabase.com/dashboard/project/alkogpgjxpshoqsfgqef')
    }
  })
  .catch(error => {
    console.error('\n💥 Test script failed:', error.message)
    process.exit(1)
  })
