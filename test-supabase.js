// Test Supabase connection
// Run this with: node test-supabase.js

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://alkogpgjxpshoqsfgqef.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsa29ncGdqeHBzaG9xc2ZncWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzNTUyODIsImV4cCI6MjA2NjkzMTI4Mn0.yT3QR-aUJnmlt8DkjzVfx5KirzIfRvv9aTYEWvxI20g'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('Testing Supabase connection...')
    
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Connection failed:', error.message)
      if (error.message.includes('relation "public.profiles" does not exist')) {
        console.log('\n🔧 Solution: You need to create the database tables!')
        console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard')
        console.log('2. Open SQL Editor')
        console.log('3. Run the SQL from supabase-schema.sql file')
      }
    } else {
      console.log('✅ Supabase connection successful!')
      console.log('Data:', data)
    }
    
    // Test auth
    console.log('\nTesting auth...')
    const { data: authData, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.error('❌ Auth test failed:', authError.message)
    } else {
      console.log('✅ Auth system working!')
      console.log('Current session:', authData.session ? 'Logged in' : 'Not logged in')
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message)
  }
}

testConnection()
