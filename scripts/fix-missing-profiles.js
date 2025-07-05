#!/usr/bin/env node

/**
 * Fix Missing Profiles
 * Creates profiles for users that don't have them
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

async function fixMissingProfiles() {
  console.log('🔧 Fixing Missing Profiles...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase configuration!')
    return false
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Get all users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message)
      return false
    }

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError.message)
      return false
    }

    const profileIds = profiles.map(p => p.id)
    const usersWithoutProfiles = users.users.filter(user => !profileIds.includes(user.id))

    console.log(`📊 Found ${usersWithoutProfiles.length} users without profiles`)

    if (usersWithoutProfiles.length === 0) {
      console.log('✅ All users already have profiles!')
      return true
    }

    let created = 0
    let failed = 0

    for (const user of usersWithoutProfiles) {
      console.log(`\n👤 Creating profile for user: ${user.email}`)
      
      const { error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email.split('@')[0],
          role: user.user_metadata?.role || 'client'
        })

      if (createError) {
        console.log(`❌ Failed to create profile: ${createError.message}`)
        failed++
      } else {
        console.log(`✅ Profile created successfully!`)
        created++
      }
    }

    console.log(`\n📊 Summary:`)
    console.log(`   • Profiles created: ${created}`)
    console.log(`   • Failed: ${failed}`)
    console.log(`   • Total users: ${users.users.length}`)

    return failed === 0

  } catch (error) {
    console.error('❌ Fix failed:', error.message)
    return false
  }
}

// Run the fix
fixMissingProfiles()
  .then(success => {
    if (success) {
      console.log('\n🎉 All missing profiles have been created!')
      console.log('✅ Users should now be able to log in successfully')
    } else {
      console.log('\n❌ Some profiles could not be created.')
      console.log('🔧 Check the error messages above for details')
    }
  })
  .catch(error => {
    console.error('\n💥 Fix script failed:', error.message)
    process.exit(1)
  })
