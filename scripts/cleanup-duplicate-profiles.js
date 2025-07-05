#!/usr/bin/env node

/**
 * Cleanup Duplicate Profiles
 * Finds and removes duplicate profiles in the database
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

async function cleanupDuplicateProfiles() {
  console.log('🧹 Cleaning up duplicate profiles...\n')

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

    // Get all profiles
    console.log('🔍 Fetching all profiles...')
    const { data: profiles, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true })

    if (fetchError) {
      console.error('❌ Error fetching profiles:', fetchError.message)
      return false
    }

    console.log(`📊 Found ${profiles.length} total profiles`)

    // Group profiles by user ID
    const profileGroups = {}
    profiles.forEach(profile => {
      if (!profileGroups[profile.id]) {
        profileGroups[profile.id] = []
      }
      profileGroups[profile.id].push(profile)
    })

    // Find duplicates
    const duplicateGroups = Object.entries(profileGroups).filter(([userId, userProfiles]) => userProfiles.length > 1)

    if (duplicateGroups.length === 0) {
      console.log('✅ No duplicate profiles found!')
      return true
    }

    console.log(`⚠️ Found ${duplicateGroups.length} users with duplicate profiles:`)

    let totalDuplicatesRemoved = 0

    for (const [userId, userProfiles] of duplicateGroups) {
      console.log(`\n👤 User ${userId}: ${userProfiles.length} profiles`)
      
      // Keep the oldest profile (first in the sorted list)
      const keepProfile = userProfiles[0]
      const duplicateProfiles = userProfiles.slice(1)

      console.log(`   ✅ Keeping profile created at: ${keepProfile.created_at}`)
      console.log(`   🗑️  Removing ${duplicateProfiles.length} duplicate(s)`)

      // Delete duplicate profiles
      for (const duplicate of duplicateProfiles) {
        console.log(`      - Deleting profile created at: ${duplicate.created_at}`)
        
        const { error: deleteError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', duplicate.id)
          .eq('created_at', duplicate.created_at) // Extra safety

        if (deleteError) {
          console.log(`      ❌ Failed to delete: ${deleteError.message}`)
        } else {
          console.log(`      ✅ Deleted successfully`)
          totalDuplicatesRemoved++
        }
      }
    }

    console.log(`\n📊 Summary:`)
    console.log(`   • Users with duplicates: ${duplicateGroups.length}`)
    console.log(`   • Duplicate profiles removed: ${totalDuplicatesRemoved}`)
    console.log(`   • Profiles remaining: ${profiles.length - totalDuplicatesRemoved}`)

    console.log('\n✅ Duplicate cleanup completed!')
    return true

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message)
    return false
  }
}

// Run the cleanup
cleanupDuplicateProfiles()
  .then(success => {
    if (success) {
      console.log('\n🎉 Profile cleanup completed successfully!')
      console.log('✅ The authentication flow should work better now')
    } else {
      console.log('\n❌ Profile cleanup failed.')
      console.log('🔧 Check the error messages above for details')
    }
  })
  .catch(error => {
    console.error('\n💥 Cleanup script failed:', error.message)
    process.exit(1)
  })
