#!/usr/bin/env node

/**
 * Simple Trigger Test
 * Tests if the profile creation trigger works using admin user creation
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

async function testTriggerSimple() {
  console.log('🔧 Testing Profile Creation Trigger (Simple)...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase configuration!')
    return false
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    console.log('📋 Configuration:')
    console.log(`URL: ${supabaseUrl}`)
    console.log(`Service Role Key: ${serviceRoleKey.substring(0, 20)}...`)
    console.log('')

    // Create a user with admin client (bypasses email confirmation)
    console.log('👤 Creating user with admin client...')
    
    const testEmail = `trigger-test-${Math.floor(Math.random() * 10000)}@gmail.com`
    const testPassword = 'testpassword123'
    const testName = 'Trigger Test User'

    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        full_name: testName,
        role: 'client'
      }
    })

    if (userError) {
      console.log('❌ User creation failed:', userError.message)
      return false
    }

    console.log('✅ User created successfully!')
    console.log('📋 User ID:', userData.user.id)

    // Wait for trigger to execute
    console.log('\n⏳ Waiting for trigger to execute...')
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Check if profile was created
    console.log('📊 Checking if profile was created by trigger...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single()

    if (profileError) {
      console.log('❌ Profile not found:', profileError.message)
      console.log('🔧 Trigger is not working properly')
      
      // Check if there are any profiles with this ID (maybe multiple)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.user.id)

      if (profilesError) {
        console.log('❌ Could not check profiles:', profilesError.message)
      } else {
        console.log(`📊 Found ${profiles.length} profile(s) for this user`)
        if (profiles.length > 0) {
          console.log('📋 Profile data:', profiles[0])
        }
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

    // Clean up
    console.log('\n🧹 Cleaning up test user...')
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userData.user.id)
    
    if (deleteError) {
      console.log('⚠️  Could not delete test user:', deleteError.message)
    } else {
      console.log('✅ Test user cleaned up')
    }

    return !profileError

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    return false
  }
}

// Run the test
testTriggerSimple()
  .then(success => {
    if (success) {
      console.log('\n🎉 Profile creation trigger is working!')
      console.log('✅ Users will automatically get profiles when they sign up')
      console.log('')
      console.log('🎯 Next steps:')
      console.log('   • Disable email confirmation in Supabase Auth settings')
      console.log('   • Test the signup form at: http://localhost:3002/auth/signup')
      console.log('   • Run the integration tests again')
    } else {
      console.log('\n❌ Profile creation trigger is not working.')
      console.log('')
      console.log('🔧 Possible solutions:')
      console.log('   • Check if the trigger exists in the database')
      console.log('   • Verify the trigger function has correct permissions')
      console.log('   • Check Supabase logs for trigger errors')
      console.log('')
      console.log('📋 Manual steps:')
      console.log('   1. Go to Supabase SQL Editor')
      console.log('   2. Run: SELECT * FROM pg_trigger WHERE tgname = \'on_auth_user_created\';')
      console.log('   3. Check if the trigger exists and is enabled')
    }
  })
  .catch(error => {
    console.error('\n💥 Test script failed:', error.message)
    process.exit(1)
  })
