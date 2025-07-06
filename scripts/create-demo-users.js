#!/usr/bin/env node

/**
 * Script to create demo users in Supabase
 * Run with: node scripts/create-demo-users.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createDemoUsers() {
  console.log('🔄 Creating demo users...')

  const demoUsers = [
    {
      email: 'john.smith@example.com',
      password: 'password123',
      userData: {
        full_name: 'John Smith',
        role: 'client'
      }
    },
    {
      email: 'sarah.johnson@siamoon.com',
      password: 'password123',
      userData: {
        full_name: 'Sarah Johnson',
        role: 'staff'
      }
    }
  ]

  for (const user of demoUsers) {
    try {
      console.log(`📧 Creating user: ${user.email}`)
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: user.userData
      })

      if (authError) {
        console.error(`❌ Auth error for ${user.email}:`, authError.message)
        continue
      }

      console.log(`✅ Auth user created: ${user.email}`)

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: user.email,
          full_name: user.userData.full_name,
          role: user.userData.role
        })

      if (profileError) {
        console.error(`❌ Profile error for ${user.email}:`, profileError.message)
      } else {
        console.log(`✅ Profile created: ${user.email}`)
      }

    } catch (error) {
      console.error(`❌ Error creating ${user.email}:`, error.message)
    }
  }

  console.log('🎉 Demo user creation completed!')
  console.log('')
  console.log('You can now sign in with:')
  console.log('📧 john.smith@example.com (client)')
  console.log('📧 sarah.johnson@siamoon.com (staff)')
  console.log('🔑 password123')
}

createDemoUsers().catch(console.error)
