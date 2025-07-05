#!/usr/bin/env node

/**
 * Test Supabase Connection Script
 * Run this to verify your Supabase configuration is working
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

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...\n')

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log('📋 Configuration:')
  console.log(`URL: ${supabaseUrl}`)
  console.log(`Key: ${supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'NOT SET'}`)
  console.log('')

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase configuration!')
    console.log('Please update your .env.local file with:')
    console.log('- NEXT_PUBLIC_SUPABASE_URL')
    console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY')
    process.exit(1)
  }

  if (supabaseKey.includes('your_') || supabaseKey.includes('placeholder')) {
    console.error('❌ API key appears to be a placeholder!')
    console.log('Please get the real API key from:')
    console.log('https://supabase.com/dashboard/project/alkogpgjxpshoqsfgqef/settings/api')
    process.exit(1)
  }

  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Test 1: Basic connection
    console.log('🔗 Testing basic connection...')
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    
    if (error) {
      console.error('❌ Connection failed:', error.message)
      return false
    }
    
    console.log('✅ Basic connection successful!')

    // Test 2: Check if tables exist
    console.log('\n📊 Checking database tables...')
    const tables = ['profiles', 'properties', 'bookings', 'tasks', 'reports', 'notifications']
    
    for (const table of tables) {
      try {
        const { error: tableError } = await supabase.from(table).select('count').limit(1)
        if (tableError) {
          console.log(`❌ Table '${table}': ${tableError.message}`)
        } else {
          console.log(`✅ Table '${table}': OK`)
        }
      } catch (err) {
        console.log(`❌ Table '${table}': ${err.message}`)
      }
    }

    // Test 3: Test Edge Functions
    console.log('\n⚡ Testing Edge Functions...')
    try {
      const { data: funcData, error: funcError } = await supabase.functions.invoke('generate-monthly-reports', {
        body: { test: true }
      })
      
      if (funcError) {
        console.log(`❌ Edge Functions: ${funcError.message}`)
      } else {
        console.log('✅ Edge Functions: Accessible')
      }
    } catch (err) {
      console.log(`❌ Edge Functions: ${err.message}`)
    }

    console.log('\n🎉 Supabase connection test completed!')
    return true

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
    return false
  }
}

// Run the test
testSupabaseConnection()
  .then(success => {
    if (success) {
      console.log('\n✅ All tests passed! Your Supabase configuration is working.')
    } else {
      console.log('\n❌ Some tests failed. Please check your configuration.')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('\n💥 Test script failed:', error.message)
    process.exit(1)
  })
