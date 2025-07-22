#!/usr/bin/env node

/**
 * 🧹 Comprehensive Build & Cache Cleanup Script
 * 
 * This script provides various cleanup options for the project:
 * - Build artifacts (.next, out, dist, etc.)
 * - Cache files (node_modules/.cache, .eslintcache, etc.)
 * - Dependencies (node_modules, lock files)
 * - Temporary files and logs
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

// Directories and files to clean
const CLEANUP_TARGETS = {
  build: [
    '.next',
    'out',
    'dist',
    'build',
    '.vercel',
    '.turbo',
    '.swc'
  ],
  cache: [
    'node_modules/.cache',
    '.eslintcache',
    '.tsbuildinfo',
    '.nyc_output',
    'coverage',
    '.jest-cache',
    '.parcel-cache'
  ],
  deps: [
    'node_modules',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml'
  ],
  temp: [
    '*.log',
    '*.tmp',
    '.DS_Store',
    'Thumbs.db',
    '.env.local.backup',
    '.firebase/debug.log'
  ],
  logs: [
    'logs',
    '*.log',
    'npm-debug.log*',
    'yarn-debug.log*',
    'yarn-error.log*',
    'lerna-debug.log*'
  ]
}

/**
 * Log with colors
 */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

/**
 * Check if path exists
 */
function pathExists(targetPath) {
  try {
    return fs.existsSync(targetPath)
  } catch (error) {
    return false
  }
}

/**
 * Get file/directory size in MB
 */
function getSize(targetPath) {
  try {
    const stats = fs.statSync(targetPath)
    if (stats.isDirectory()) {
      const result = execSync(`du -sm "${targetPath}" 2>/dev/null || echo "0"`, { encoding: 'utf8' })
      return parseInt(result.split('\t')[0]) || 0
    } else {
      return Math.round(stats.size / (1024 * 1024) * 100) / 100
    }
  } catch (error) {
    return 0
  }
}

/**
 * Remove directory or file
 */
function removeTarget(target) {
  try {
    if (pathExists(target)) {
      const size = getSize(target)
      
      if (process.platform === 'win32') {
        execSync(`rmdir /s /q "${target}" 2>nul || del /q "${target}" 2>nul`, { stdio: 'ignore' })
      } else {
        execSync(`rm -rf "${target}"`, { stdio: 'ignore' })
      }
      
      log(`  ✅ Removed ${target} (${size}MB)`, 'green')
      return size
    } else {
      log(`  ⏭️  ${target} (not found)`, 'yellow')
      return 0
    }
  } catch (error) {
    log(`  ❌ Failed to remove ${target}: ${error.message}`, 'red')
    return 0
  }
}

/**
 * Clean specific category
 */
function cleanCategory(category) {
  log(`\n🧹 Cleaning ${category} files...`, 'cyan')
  
  const targets = CLEANUP_TARGETS[category] || []
  let totalSize = 0
  
  for (const target of targets) {
    totalSize += removeTarget(target)
  }
  
  log(`📊 Total ${category} cleanup: ${totalSize}MB`, 'magenta')
  return totalSize
}

/**
 * Run dependency check
 */
function checkDependencies() {
  log('\n🔍 Checking for unused dependencies...', 'cyan')
  
  try {
    // Check if depcheck is available
    execSync('npx depcheck --version', { stdio: 'ignore' })
    
    log('Running depcheck analysis...', 'blue')
    const result = execSync('npx depcheck --json', { encoding: 'utf8' })
    const analysis = JSON.parse(result)
    
    if (analysis.dependencies && analysis.dependencies.length > 0) {
      log('📦 Unused dependencies found:', 'yellow')
      analysis.dependencies.forEach(dep => {
        log(`  - ${dep}`, 'yellow')
      })
    } else {
      log('✅ No unused dependencies found', 'green')
    }
    
    if (analysis.devDependencies && analysis.devDependencies.length > 0) {
      log('🛠️  Unused dev dependencies found:', 'yellow')
      analysis.devDependencies.forEach(dep => {
        log(`  - ${dep}`, 'yellow')
      })
    }
    
  } catch (error) {
    log('⚠️  Could not run dependency check. Install depcheck: npm i -g depcheck', 'yellow')
  }
}

/**
 * Show disk usage
 */
function showDiskUsage() {
  log('\n💾 Current disk usage:', 'cyan')
  
  const targets = [
    'node_modules',
    '.next',
    '.vercel',
    '.turbo',
    'out',
    'dist'
  ]
  
  targets.forEach(target => {
    if (pathExists(target)) {
      const size = getSize(target)
      log(`  ${target}: ${size}MB`, size > 100 ? 'red' : size > 50 ? 'yellow' : 'green')
    }
  })
}

/**
 * Main cleanup function
 */
function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'help'
  
  log('🧹 Villa Management - Build & Cache Cleanup', 'bright')
  log('=' .repeat(50), 'blue')
  
  switch (command) {
    case 'all':
      log('🚀 Running complete cleanup...', 'bright')
      let totalCleaned = 0
      totalCleaned += cleanCategory('build')
      totalCleaned += cleanCategory('cache')
      totalCleaned += cleanCategory('temp')
      totalCleaned += cleanCategory('logs')
      log(`\n🎉 Total cleanup completed: ${totalCleaned}MB freed!`, 'green')
      break
      
    case 'build':
      cleanCategory('build')
      break
      
    case 'cache':
      cleanCategory('cache')
      break
      
    case 'deps':
      cleanCategory('deps')
      log('\n⚠️  Remember to run "npm install" to restore dependencies!', 'yellow')
      break
      
    case 'temp':
      cleanCategory('temp')
      break
      
    case 'logs':
      cleanCategory('logs')
      break
      
    case 'check':
      showDiskUsage()
      checkDependencies()
      break
      
    case 'production':
      log('🏭 Production cleanup (build + cache only)...', 'bright')
      let prodCleaned = 0
      prodCleaned += cleanCategory('build')
      prodCleaned += cleanCategory('cache')
      log(`\n✅ Production cleanup completed: ${prodCleaned}MB freed!`, 'green')
      break
      
    case 'help':
    default:
      log('\n📖 Available commands:', 'bright')
      log('  all        - Clean everything (build, cache, temp, logs)', 'blue')
      log('  build      - Clean build artifacts (.next, out, dist, etc.)', 'blue')
      log('  cache      - Clean cache files (node_modules/.cache, etc.)', 'blue')
      log('  deps       - Clean dependencies (node_modules, lock files)', 'blue')
      log('  temp       - Clean temporary files (logs, .DS_Store, etc.)', 'blue')
      log('  logs       - Clean log files', 'blue')
      log('  production - Clean build + cache (safe for production)', 'blue')
      log('  check      - Show disk usage and check dependencies', 'blue')
      log('  help       - Show this help message', 'blue')
      log('\n💡 Usage: node scripts/clean.js [command]', 'cyan')
      log('💡 Example: node scripts/clean.js all', 'cyan')
      break
  }
  
  log('\n' + '=' .repeat(50), 'blue')
}

// Run the script
if (require.main === module) {
  main()
}

module.exports = { cleanCategory, checkDependencies, showDiskUsage }
