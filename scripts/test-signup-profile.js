#!/usr/bin/env node

/**
 * Test Signup and Profile Creation
 * Tests the complete signup flow including profile creation and loading
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

async function testSignupProfile() {
  console.log('🔐 Testing Signup and Profile Creation...\n')

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

    // Test 1: Create user with anon client
    console.log('👤 Testing user signup...')
    
    const testEmail = `test-profile-${Math.floor(Math.random() * 10000)}@gmail.com`
    const testPassword = 'testpassword123'
    const testName = 'Test Profile User'

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

    // Test 2: Manually create profile (simulating our signup function)
    console.log('\n📊 Creating profile manually...')
    
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
      
      // Check if profile already exists
      const { data: existingProfile } = await adminClient
        .from('profiles')
        .select('*')
        .eq('id', signupData.user?.id)
        .single()

      if (existingProfile) {
        console.log('✅ Profile already exists (trigger worked):', existingProfile)
      }
    } else {
      console.log('✅ Profile created successfully!')
    }

    // Test 3: Load profile with retry logic
    console.log('\n🔄 Testing profile loading with retry...')
    
    let profile = null
    let retries = 3

    while (retries > 0 && !profile) {
      const { data, error } = await anonClient
        .from('profiles')
        .select('*')
        .eq('id', signupData.user?.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116' && retries > 1) {
          console.log(`Profile not found, retrying... (${retries - 1} attempts left)`)
          await new Promise(resolve => setTimeout(resolve, 1000))
          retries--
        } else {
          console.log('❌ Profile loading failed:', error.message)
          break
        }
      } else {
        profile = data
        console.log('✅ Profile loaded successfully!')
        console.log('📋 Profile data:', {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          role: profile.role
        })
        break
      }
    }

    // Test 4: Test authentication with new user
    console.log('\n🔑 Testing authentication...')
    
    const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })

    if (authError) {
      console.log('❌ Authentication failed:', authError.message)
    } else {
      console.log('✅ Authentication successful!')
      
      // Test profile loading after auth
      const { data: authProfile } = await anonClient
        .from('profiles')
        .select('*')
        .eq('id', authData.user?.id)
        .single()

      if (authProfile) {
        console.log('✅ Profile accessible after authentication!')
      } else {
        console.log('❌ Profile not accessible after authentication')
      }

      await anonClient.auth.signOut()
    }

    // Clean up
    console.log('\n🧹 Cleaning up test user...')
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(signupData.user?.id || '')
    
    if (deleteError) {
      console.log('⚠️  Could not delete test user:', deleteError.message)
    } else {
      console.log('✅ Test user cleaned up')
    }

    return !!profile

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    return false
  }
}

// Run the test
testSignupProfile()
  .then(success => {
    if (success) {
      console.log('\n🎉 Signup and profile creation test passed!')
      console.log('✅ The signup flow should work correctly now')
      console.log('')
      console.log('🎯 Try signing up at: http://localhost:3002/auth/signup')
    } else {
      console.log('\n❌ Signup and profile creation test failed.')
      console.log('🔧 Check the error messages above for details')
    }
  })
  .catch(error => {
    console.error('\n💥 Test script failed:', error.message)
    process.exit(1)
  })
