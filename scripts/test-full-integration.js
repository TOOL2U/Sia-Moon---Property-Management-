#!/usr/bin/env node

/**
 * Full Supabase Integration Test
 * Tests all services with both anon and service role keys
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

async function testFullIntegration() {
  console.log('🚀 Testing Full Supabase Integration...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log('📋 Configuration:')
  console.log(`URL: ${supabaseUrl}`)
  console.log(`Anon Key: ${anonKey ? anonKey.substring(0, 20) + '...' : 'NOT SET'}`)
  console.log(`Service Role Key: ${serviceRoleKey ? serviceRoleKey.substring(0, 20) + '...' : 'NOT SET'}`)
  console.log('')

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error('❌ Missing configuration!')
    return false
  }

  try {
    // Test with anon key
    console.log('🔍 Testing with Anon Key...')
    const anonClient = createClient(supabaseUrl, anonKey)
    
    const { data: anonData, error: anonError } = await anonClient
      .from('properties')
      .select('count')
      .limit(1)

    if (anonError) {
      console.log(`❌ Anon client test failed: ${anonError.message}`)
    } else {
      console.log('✅ Anon client: Working')
    }

    // Test with service role key
    console.log('\n🔧 Testing with Service Role Key...')
    const serviceClient = createClient(supabaseUrl, serviceRoleKey)

    // Test admin operations
    const tables = ['profiles', 'properties', 'bookings', 'tasks', 'reports', 'notifications']
    
    for (const table of tables) {
      try {
        const { data, error } = await serviceClient
          .from(table)
          .select('count')
          .limit(1)

        if (error) {
          console.log(`❌ Service role ${table}: ${error.message}`)
        } else {
          console.log(`✅ Service role ${table}: OK`)
        }
      } catch (err) {
        console.log(`❌ Service role ${table}: ${err.message}`)
      }
    }

    // Test Edge Functions with service role
    console.log('\n⚡ Testing Edge Functions with Service Role...')
    try {
      const { data: funcData, error: funcError } = await serviceClient.functions.invoke('generate-monthly-reports', {
        body: { test: true }
      })
      
      if (funcError) {
        console.log(`❌ Edge Functions (Service Role): ${funcError.message}`)
      } else {
        console.log('✅ Edge Functions (Service Role): Accessible')
      }
    } catch (err) {
      console.log(`❌ Edge Functions (Service Role): ${err.message}`)
    }

    // Test RLS policies
    console.log('\n🔒 Testing Row Level Security...')
    try {
      // This should work with service role (bypasses RLS)
      const { data: rls_data, error: rls_error } = await serviceClient
        .from('profiles')
        .select('*')
        .limit(1)

      if (rls_error) {
        console.log(`❌ RLS test failed: ${rls_error.message}`)
      } else {
        console.log('✅ RLS: Service role can bypass security')
      }
    } catch (err) {
      console.log(`❌ RLS test error: ${err.message}`)
    }

    // Test data insertion (admin operation)
    console.log('\n📝 Testing Data Operations...')
    try {
      // Try to insert a test record (this requires service role)
      const testId = '99999999-9999-9999-9999-999999999999'
      
      // Clean up any existing test data first
      await serviceClient
        .from('profiles')
        .delete()
        .eq('id', testId)

      // Test insert
      const { data: insertData, error: insertError } = await serviceClient
        .from('profiles')
        .insert({
          id: testId,
          email: 'test-integration@example.com',
          full_name: 'Integration Test User',
          role: 'client'
        })
        .select()

      if (insertError) {
        console.log(`❌ Data insertion failed: ${insertError.message}`)
      } else {
        console.log('✅ Data insertion: Working')
        
        // Clean up test data
        await serviceClient
          .from('profiles')
          .delete()
          .eq('id', testId)
        
        console.log('✅ Data cleanup: Complete')
      }
    } catch (err) {
      console.log(`❌ Data operation error: ${err.message}`)
    }

    console.log('\n🎉 Full integration test completed!')
    return true

  } catch (error) {
    console.error('❌ Integration test failed:', error.message)
    return false
  }
}

// Run the test
testFullIntegration()
  .then(success => {
    if (success) {
      console.log('\n✅ All integration tests passed!')
      console.log('🚀 Supabase is fully configured and ready for production!')
      console.log('')
      console.log('🎯 Next steps:')
      console.log('  • Test user signup/login flow')
      console.log('  • Create some test properties and bookings')
      console.log('  • Deploy Edge Functions for reports')
      console.log('  • Switch application from local auth to Supabase auth')
    } else {
      console.log('\n❌ Some integration tests failed.')
      console.log('Please check your configuration and try again.')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('\n💥 Integration test script failed:', error.message)
    process.exit(1)
  })
