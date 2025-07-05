#!/usr/bin/env node

/**
 * Fix Auth Migration Script
 * Automatically fixes all files that still use useLocalAuth
 */

const fs = require('fs')
const path = require('path')

// Files to update
const filesToUpdate = [
  'src/app/dashboard/client/reports/page.tsx',
  'src/app/test-profile/page.tsx',
  'src/app/test-notifications/page.tsx',
  'src/app/dashboard/client/onboarding/[id]/page.tsx',
  'src/app/test-supabase-reports/page.tsx',
  'src/app/admin/page.tsx',
  'src/app/admin/onboarding/[id]/page.tsx'
]

// Replacement patterns
const replacements = [
  {
    from: "import { useLocalAuth } from '@/hooks/useLocalAuth'",
    to: "import { useAuth } from '@/contexts/SupabaseAuthContext'"
  },
  {
    from: "import DatabaseService from '@/lib/dbService'",
    to: "import SupabaseService from '@/lib/supabaseService'"
  },
  {
    from: "const { user } = useLocalAuth()",
    to: "const { profile: user } = useAuth()"
  },
  {
    from: "const { user: authUser } = useLocalAuth()",
    to: "const { profile: authUser } = useAuth()"
  },
  {
    from: "DatabaseService.",
    to: "SupabaseService."
  },
  {
    from: "import { useReports } from '@/hooks/useReports'",
    to: "import { useSupabaseReports } from '@/hooks/useSupabaseReports'"
  },
  {
    from: "useReports()",
    to: "useSupabaseReports()"
  }
]

function updateFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`)
      return false
    }

    let content = fs.readFileSync(filePath, 'utf8')
    let updated = false

    // Apply replacements
    replacements.forEach(({ from, to }) => {
      if (content.includes(from)) {
        content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to)
        updated = true
      }
    })

    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(`✅ Updated: ${filePath}`)
      return true
    } else {
      console.log(`ℹ️  No changes needed: ${filePath}`)
      return false
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message)
    return false
  }
}

function main() {
  console.log('🔧 Fixing auth migration issues...\n')

  let totalUpdated = 0

  filesToUpdate.forEach(file => {
    if (updateFile(file)) {
      totalUpdated++
    }
  })

  console.log(`\n📊 Summary:`)
  console.log(`   • Files checked: ${filesToUpdate.length}`)
  console.log(`   • Files updated: ${totalUpdated}`)
  console.log(`   • Files unchanged: ${filesToUpdate.length - totalUpdated}`)

  if (totalUpdated > 0) {
    console.log('\n✅ Auth migration fixes applied successfully!')
    console.log('🎯 Next steps:')
    console.log('   • Restart the development server')
    console.log('   • Test the affected pages')
    console.log('   • Verify authentication works correctly')
  } else {
    console.log('\n✅ All files are already up to date!')
  }
}

main()
