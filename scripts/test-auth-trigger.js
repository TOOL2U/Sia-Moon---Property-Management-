#!/usr/bin/env node

/**
 * Test Authentication Trigger
 * Tests if the profile creation trigger is working when users sign up
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

async function testAuthTrigger() {
  console.log('🔐 Testing Authentication Trigger...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase configuration!')
    return false
  }

  try {
    // Use service role for admin operations
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    console.log('📋 Configuration:')
    console.log(`URL: ${supabaseUrl}`)
    console.log(`Service Role Key: ${serviceRoleKey.substring(0, 20)}...`)
    console.log('')

    // Test 1: Check if trigger function exists
    console.log('🔍 Checking trigger function...')
    const { data: functions, error: funcError } = await supabase
      .rpc('exec_sql', { 
        sql: "SELECT proname FROM pg_proc WHERE proname = 'handle_new_user'" 
      })

    if (funcError) {
      console.log('❌ Could not check trigger function:', funcError.message)
    } else {
      console.log('✅ Trigger function exists')
    }

    // Test 2: Check if trigger exists
    console.log('\n🔍 Checking trigger...')
    const { data: triggers, error: trigError } = await supabase
      .rpc('exec_sql', { 
        sql: "SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created'" 
      })

    if (trigError) {
      console.log('❌ Could not check trigger:', trigError.message)
    } else {
      console.log('✅ Trigger exists')
    }

    // Test 3: Try to create a test user (this will test the trigger)
    console.log('\n👤 Testing user creation...')
    
    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = 'testpassword123'

    // Create user with admin client
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      user_metadata: {
        full_name: 'Test User',
        role: 'client'
      }
    })

    if (authError) {
      console.log('❌ User creation failed:', authError.message)
      return false
    }

    console.log('✅ User created successfully')

    // Wait a moment for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Check if profile was created
    console.log('\n📊 Checking if profile was created...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError) {
      console.log('❌ Profile not found:', profileError.message)
      console.log('🔧 This means the trigger is not working properly')
    } else {
      console.log('✅ Profile created successfully!')
      console.log('📋 Profile data:', {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role
      })
    }

    // Clean up test user
    console.log('\n🧹 Cleaning up test user...')
    const { error: deleteError } = await supabase.auth.admin.deleteUser(authData.user.id)
    
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

// Alternative: Test trigger creation
async function createTriggerIfMissing() {
  console.log('\n🔧 Creating trigger if missing...')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  try {
    // Create the trigger function
    const triggerFunction = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.profiles (id, email, full_name, role)
        VALUES (
          NEW.id, 
          NEW.email, 
          COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 
          COALESCE(NEW.raw_user_meta_data->>'role', 'client')
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `

    const { error: funcError } = await supabase.rpc('exec_sql', { sql: triggerFunction })
    
    if (funcError) {
      console.log('❌ Could not create trigger function:', funcError.message)
    } else {
      console.log('✅ Trigger function created/updated')
    }

    // Create the trigger
    const triggerSQL = `
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `

    const { error: trigError } = await supabase.rpc('exec_sql', { sql: triggerSQL })
    
    if (trigError) {
      console.log('❌ Could not create trigger:', trigError.message)
    } else {
      console.log('✅ Trigger created/updated')
    }

    return !funcError && !trigError

  } catch (error) {
    console.error('❌ Trigger creation failed:', error.message)
    return false
  }
}

// Run the tests
testAuthTrigger()
  .then(success => {
    if (!success) {
      console.log('\n🔧 Trigger test failed. Attempting to recreate trigger...')
      return createTriggerIfMissing()
    }
    return success
  })
  .then(success => {
    if (success) {
      console.log('\n✅ Authentication trigger is working!')
      console.log('🎯 You can now test user signup in the application')
    } else {
      console.log('\n❌ Authentication trigger setup failed.')
      console.log('📋 Please check the trigger manually in the Supabase dashboard.')
    }
  })
  .catch(error => {
    console.error('\n💥 Test script failed:', error.message)
    process.exit(1)
  })
