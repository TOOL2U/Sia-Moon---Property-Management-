#!/usr/bin/env node

/**
 * Script to reset demo user password in Supabase
 * Run with: node scripts/reset-demo-password.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function resetDemoPassword() {
  console.log('🔄 Checking demo users...')

  try {
    // First, list all users to see what we have
    console.log('🔍 Listing all users...')
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
      console.error('❌ Error listing users:', listError.message)
      return
    }

    console.log(`📊 Found ${users.users.length} users total`)

    // Show all users
    users.users.forEach(user => {
      console.log(`👤 User: ${user.email} (ID: ${user.id}) - Created: ${user.created_at}`)
    })

    // Find and update john.smith@example.com
    const johnUser = users.users.find(u => u.email === 'john.smith@example.com')
    if (johnUser) {
      console.log('✅ Found john.smith@example.com, resetting password...')

      const { error: updateError } = await supabase.auth.admin.updateUserById(
        johnUser.id,
        {
          password: 'password123'
        }
      )

      if (updateError) {
        console.error('❌ Error updating password:', updateError.message)
      } else {
        console.log('✅ Password reset successfully for john.smith@example.com')
      }
    } else {
      console.log('❌ User john.smith@example.com not found')
    }

    // Find and update sarah.johnson@siamoon.com
    const sarahUser = users.users.find(u => u.email === 'sarah.johnson@siamoon.com')
    if (sarahUser) {
      console.log('✅ Found sarah.johnson@siamoon.com, resetting password...')

      const { error: updateError } = await supabase.auth.admin.updateUserById(
        sarahUser.id,
        {
          password: 'password123'
        }
      )

      if (updateError) {
        console.error('❌ Error updating password:', updateError.message)
      } else {
        console.log('✅ Password reset successfully for sarah.johnson@siamoon.com')
      }
    } else {
      console.log('❌ User sarah.johnson@siamoon.com not found')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

resetDemoPassword().catch(console.error)
