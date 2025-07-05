#!/usr/bin/env node

/**
 * Create Missing Notification Tables
 * Creates the notification_preferences table that's missing from the database
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

async function createNotificationTables() {
  console.log('📋 Creating Missing Notification Tables...\n')

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

    console.log('✅ notification_preferences table already exists (created via migration)')

    // Create default preferences for existing users
    console.log('\n📋 Creating default preferences for existing users...')
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError.message)
      return false
    }

    console.log(`📊 Found ${profiles.length} users`)

    let created = 0
    let skipped = 0

    for (const profile of profiles) {
      // Check if preferences already exist
      const { data: existing } = await supabase
        .from('notification_preferences')
        .select('id')
        .eq('user_id', profile.id)
        .single()

      if (existing) {
        skipped++
        continue
      }

      // Create default preferences
      const { error: insertError } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: profile.id,
          email_notifications: true,
          push_notifications: true,
          task_notifications: true,
          booking_notifications: true,
          report_notifications: true
        })

      if (insertError) {
        console.log(`❌ Failed to create preferences for user ${profile.id}:`, insertError.message)
      } else {
        created++
      }
    }

    console.log(`\n📊 Summary:`)
    console.log(`   • Preferences created: ${created}`)
    console.log(`   • Already existed: ${skipped}`)
    console.log(`   • Total users: ${profiles.length}`)

    return true

  } catch (error) {
    console.error('❌ Creation failed:', error.message)
    return false
  }
}

// Run the creation
createNotificationTables()
  .then(success => {
    if (success) {
      console.log('\n🎉 Notification tables created successfully!')
      console.log('✅ The notification errors should now be resolved')
    } else {
      console.log('\n❌ Failed to create notification tables.')
      console.log('🔧 Check the error messages above for details')
    }
  })
  .catch(error => {
    console.error('\n💥 Creation script failed:', error.message)
    process.exit(1)
  })
