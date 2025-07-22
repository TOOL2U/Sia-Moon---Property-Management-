#!/usr/bin/env node
/**
 * Fix Firebase null checking issues across the codebase
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Get all TypeScript files with Firebase collection errors
function getFilesWithFirebaseErrors() {
  try {
    const output = execSync('npx tsc --noEmit 2>&1 | grep -E "error TS2769.*Collection" | cut -d"(" -f1 | sort -u', { encoding: 'utf8' })
    return output.trim().split('\n').filter(file => file.length > 0)
  } catch (error) {
    console.log('No files found with Firebase collection errors')
    return []
  }
}

// Fix Firebase db null checking in a file
function fixFirebaseNullChecking(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`)
    return false
  }

  let content = fs.readFileSync(filePath, 'utf8')
  let modified = false

  // Pattern 1: collection(db, 'collection_name') -> collection(db!, 'collection_name')
  const collectionPattern = /collection\(db,\s*['"`]([^'"`]+)['"`]\)/g
  if (collectionPattern.test(content)) {
    content = content.replace(collectionPattern, "collection(db!, '$1')")
    modified = true
    console.log(`✅ Fixed collection(db, ...) in ${filePath}`)
  }

  // Pattern 2: doc(db, 'collection', id) -> doc(db!, 'collection', id)
  const docPattern = /doc\(db,\s*['"`]([^'"`]+)['"`]/g
  if (docPattern.test(content)) {
    content = content.replace(docPattern, "doc(db!, '$1'")
    modified = true
    console.log(`✅ Fixed doc(db, ...) in ${filePath}`)
  }

  // Pattern 3: Add null check at the beginning of functions that use db
  const needsNullCheck = /(?:collection|doc|getDocs|setDoc|updateDoc|deleteDoc)\(db[!,]/
  if (needsNullCheck.test(content) && !content.includes('if (!db)')) {
    // Find the first occurrence of db usage and add a null check before it
    const lines = content.split('\n')
    let insertIndex = -1

    for (let i = 0; i < lines.length; i++) {
      if (needsNullCheck.test(lines[i])) {
        // Find the start of the function
        for (let j = i; j >= 0; j--) {
          if (lines[j].match(/^\s*(const|function|export|async)/)) {
            insertIndex = j + 1
            break
          }
        }
        break
      }
    }

    if (insertIndex > 0) {
      lines.splice(insertIndex, 0, '    if (!db) throw new Error("Firebase not initialized")')
      content = lines.join('\n')
      modified = true
      console.log(`✅ Added null check in ${filePath}`)
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content)
    return true
  }

  return false
}

// Main execution
async function main() {
  console.log('🔧 Fixing Firebase null checking issues...\n')

  const files = getFilesWithFirebaseErrors()
  console.log(`Found ${files.length} files with Firebase errors`)

  let fixedCount = 0

  for (const file of files) {
    const fullPath = path.resolve(file)
    if (fixFirebaseNullChecking(fullPath)) {
      fixedCount++
    }
  }

  console.log(`\n📊 Results:`)
  console.log(`✅ Fixed ${fixedCount} files`)
  console.log(`📁 Total files processed: ${files.length}`)

  // Check current error count
  try {
    const errorCount = execSync('npx tsc --noEmit 2>&1 | grep -c "error TS"', { encoding: 'utf8' }).trim()
    console.log(`🎯 Current TypeScript errors: ${errorCount}`)
  } catch (error) {
    console.log('✅ No TypeScript errors found!')
  }
}

main().catch(console.error)
