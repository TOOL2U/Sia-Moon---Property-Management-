#!/usr/bin/env node

/**
 * Debug Profile Issue
 * Checks the current state of users and profiles in the database
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

async function debugProfileIssue() {
  console.log('🔍 Debugging Profile Issue...\n')

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

    // Check all users in auth.users
    console.log('👥 Checking all users in auth.users...')
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message)
      return false
    }

    console.log(`📊 Found ${users.users.length} users in auth.users:`)
    users.users.forEach((user, index) => {
      console.log(`   ${index + 1}. ID: ${user.id}`)
      console.log(`      Email: ${user.email}`)
      console.log(`      Created: ${user.created_at}`)
      console.log(`      Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`)
      console.log('')
    })

    // Check all profiles
    console.log('📊 Checking all profiles in profiles table...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError.message)
      return false
    }

    console.log(`📊 Found ${profiles.length} profiles in profiles table:`)
    profiles.forEach((profile, index) => {
      console.log(`   ${index + 1}. ID: ${profile.id}`)
      console.log(`      Email: ${profile.email}`)
      console.log(`      Name: ${profile.full_name}`)
      console.log(`      Role: ${profile.role}`)
      console.log(`      Created: ${profile.created_at}`)
      console.log('')
    })

    // Check for mismatches
    console.log('🔍 Checking for user/profile mismatches...')
    const userIds = users.users.map(u => u.id)
    const profileIds = profiles.map(p => p.id)

    const usersWithoutProfiles = userIds.filter(id => !profileIds.includes(id))
    const profilesWithoutUsers = profileIds.filter(id => !userIds.includes(id))

    if (usersWithoutProfiles.length > 0) {
      console.log(`⚠️  Found ${usersWithoutProfiles.length} users without profiles:`)
      usersWithoutProfiles.forEach(userId => {
        const user = users.users.find(u => u.id === userId)
        console.log(`   - ${userId} (${user?.email})`)
      })
      console.log('')
    }

    if (profilesWithoutUsers.length > 0) {
      console.log(`⚠️  Found ${profilesWithoutUsers.length} profiles without users:`)
      profilesWithoutUsers.forEach(profileId => {
        const profile = profiles.find(p => p.id === profileId)
        console.log(`   - ${profileId} (${profile?.email})`)
      })
      console.log('')
    }

    if (usersWithoutProfiles.length === 0 && profilesWithoutUsers.length === 0) {
      console.log('✅ All users have matching profiles!')
    }

    // Test specific user ID from the error
    const problemUserId = '73baf1bb-db10-4130-a120-471618f602b9'
    console.log(`🔍 Checking specific user: ${problemUserId}`)
    
    const problemUser = users.users.find(u => u.id === problemUserId)
    const problemProfile = profiles.find(p => p.id === problemUserId)

    if (problemUser) {
      console.log('✅ User exists in auth.users:')
      console.log(`   Email: ${problemUser.email}`)
      console.log(`   Created: ${problemUser.created_at}`)
      console.log(`   Confirmed: ${problemUser.email_confirmed_at ? 'Yes' : 'No'}`)
    } else {
      console.log('❌ User not found in auth.users')
    }

    if (problemProfile) {
      console.log('✅ Profile exists in profiles table:')
      console.log(`   Email: ${problemProfile.email}`)
      console.log(`   Name: ${problemProfile.full_name}`)
      console.log(`   Role: ${problemProfile.role}`)
    } else {
      console.log('❌ Profile not found in profiles table')
      
      if (problemUser) {
        console.log('\n🔧 Creating missing profile...')
        const { error: createError } = await supabase
          .from('profiles')
          .insert({
            id: problemUser.id,
            email: problemUser.email,
            full_name: problemUser.user_metadata?.full_name || '',
            role: problemUser.user_metadata?.role || 'client'
          })

        if (createError) {
          console.log('❌ Failed to create profile:', createError.message)
        } else {
          console.log('✅ Profile created successfully!')
        }
      }
    }

    return true

  } catch (error) {
    console.error('❌ Debug failed:', error.message)
    return false
  }
}

// Run the debug
debugProfileIssue()
  .then(success => {
    if (success) {
      console.log('\n🎉 Debug completed!')
      console.log('✅ Check the output above for any issues')
    } else {
      console.log('\n❌ Debug failed.')
      console.log('🔧 Check the error messages above for details')
    }
  })
  .catch(error => {
    console.error('\n💥 Debug script failed:', error.message)
    process.exit(1)
  })
