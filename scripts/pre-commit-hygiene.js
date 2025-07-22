#!/usr/bin/env node

/**
 * 🔍 Pre-commit Build Hygiene Checker
 * 
 * This script runs before commits to ensure:
 * - No build artifacts are committed
 * - No cache files are committed
 * - No sensitive files are committed
 * - Dependencies are properly managed
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// ANSI color codes
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

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

// Files and directories that should never be committed
const FORBIDDEN_PATTERNS = [
  // Build artifacts
  '.next/',
  'out/',
  'dist/',
  'build/',
  '.vercel/',
  '.turbo/',
  
  // Cache files
  'node_modules/.cache/',
  '.eslintcache',
  '.tsbuildinfo',
  '.swc/',
  '.jest-cache/',
  '.parcel-cache/',
  
  // Logs
  '*.log',
  'npm-debug.log*',
  'yarn-debug.log*',
  'yarn-error.log*',
  
  // Temporary files
  '*.tmp',
  '*.temp',
  '.DS_Store',
  'Thumbs.db',
  
  // Sensitive files
  '.env.local',
  '.env.production',
  '*-service-account.json',
  '*.pem',
  '*.key',
  
  // Test artifacts
  'coverage/',
  'test-results/',
  'playwright-report/',
  
  // Development files
  'debug-*.js',
  'test-*.js',
  '*.debug.log'
]

/**
 * Get staged files from git
 */
function getStagedFiles() {
  try {
    const result = execSync('git diff --cached --name-only', { encoding: 'utf8' })
    return result.trim().split('\n').filter(file => file.length > 0)
  } catch (error) {
    log('⚠️  Could not get staged files from git', 'yellow')
    return []
  }
}

/**
 * Check if a file matches forbidden patterns
 */
function isForbiddenFile(filePath) {
  return FORBIDDEN_PATTERNS.some(pattern => {
    if (pattern.includes('*')) {
      // Handle glob patterns
      const regex = new RegExp(pattern.replace(/\*/g, '.*'))
      return regex.test(filePath)
    } else {
      // Handle exact matches and directory patterns
      return filePath.includes(pattern) || filePath.startsWith(pattern)
    }
  })
}

/**
 * Check staged files for forbidden content
 */
function checkStagedFiles() {
  log('🔍 Checking staged files...', 'cyan')
  
  const stagedFiles = getStagedFiles()
  const forbiddenFiles = []
  
  if (stagedFiles.length === 0) {
    log('ℹ️  No staged files found', 'blue')
    return true
  }
  
  stagedFiles.forEach(file => {
    if (isForbiddenFile(file)) {
      forbiddenFiles.push(file)
    }
  })
  
  if (forbiddenFiles.length > 0) {
    log('❌ Forbidden files found in staging area:', 'red')
    forbiddenFiles.forEach(file => {
      log(`  - ${file}`, 'red')
    })
    
    log('\n💡 To fix this:', 'yellow')
    log('  1. Remove files from staging: git reset HEAD <file>', 'blue')
    log('  2. Add files to .gitignore if needed', 'blue')
    log('  3. Clean build artifacts: npm run clean', 'blue')
    
    return false
  }
  
  log(`✅ All ${stagedFiles.length} staged files are clean`, 'green')
  return true
}

/**
 * Check for large files
 */
function checkLargeFiles() {
  log('\n📏 Checking for large files...', 'cyan')
  
  const stagedFiles = getStagedFiles()
  const largeFiles = []
  const MAX_SIZE = 1024 * 1024 // 1MB
  
  stagedFiles.forEach(file => {
    try {
      if (fs.existsSync(file)) {
        const stats = fs.statSync(file)
        if (stats.size > MAX_SIZE) {
          largeFiles.push({
            file,
            size: Math.round(stats.size / (1024 * 1024) * 100) / 100
          })
        }
      }
    } catch (error) {
      // Skip files that can't be read
    }
  })
  
  if (largeFiles.length > 0) {
    log('⚠️  Large files detected:', 'yellow')
    largeFiles.forEach(({ file, size }) => {
      log(`  - ${file}: ${size}MB`, 'yellow')
    })
    
    log('\n💡 Consider:', 'blue')
    log('  - Using Git LFS for large assets', 'blue')
    log('  - Optimizing images with Cloudinary', 'blue')
    log('  - Moving large files to CDN', 'blue')
    
    // Don't fail for large files, just warn
  } else {
    log('✅ No large files detected', 'green')
  }
  
  return true
}

/**
 * Check .gitignore is up to date
 */
function checkGitignore() {
  log('\n📝 Checking .gitignore...', 'cyan')
  
  if (!fs.existsSync('.gitignore')) {
    log('❌ .gitignore file not found!', 'red')
    return false
  }
  
  const gitignoreContent = fs.readFileSync('.gitignore', 'utf8')
  
  // Essential patterns that should be in .gitignore
  const essentialPatterns = [
    '.next',
    'node_modules',
    '.env.local',
    '.vercel',
    '*.log'
  ]
  
  const missingPatterns = essentialPatterns.filter(pattern => 
    !gitignoreContent.includes(pattern)
  )
  
  if (missingPatterns.length > 0) {
    log('⚠️  Missing essential .gitignore patterns:', 'yellow')
    missingPatterns.forEach(pattern => {
      log(`  - ${pattern}`, 'yellow')
    })
  } else {
    log('✅ .gitignore looks good', 'green')
  }
  
  return true
}

/**
 * Check package.json for issues
 */
function checkPackageJson() {
  log('\n📦 Checking package.json...', 'cyan')
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    
    // Check for missing scripts
    const essentialScripts = ['build', 'start', 'lint', 'clean']
    const missingScripts = essentialScripts.filter(script => 
      !packageJson.scripts || !packageJson.scripts[script]
    )
    
    if (missingScripts.length > 0) {
      log('⚠️  Missing essential scripts:', 'yellow')
      missingScripts.forEach(script => {
        log(`  - ${script}`, 'yellow')
      })
    }
    
    // Check for security vulnerabilities in dependencies
    try {
      execSync('npm audit --audit-level high --json', { stdio: 'ignore' })
      log('✅ No high-severity vulnerabilities found', 'green')
    } catch (error) {
      log('⚠️  Security vulnerabilities detected. Run: npm audit', 'yellow')
    }
    
    return true
    
  } catch (error) {
    log('❌ Could not read or parse package.json', 'red')
    return false
  }
}

/**
 * Check TypeScript configuration
 */
function checkTypeScript() {
  log('\n🔧 Checking TypeScript...', 'cyan')
  
  try {
    // Run TypeScript check
    execSync('npx tsc --noEmit', { stdio: 'ignore' })
    log('✅ TypeScript check passed', 'green')
    return true
  } catch (error) {
    log('❌ TypeScript errors found. Run: npm run type-check', 'red')
    return false
  }
}

/**
 * Main pre-commit check
 */
function main() {
  const args = process.argv.slice(2)
  const skipChecks = args.includes('--skip-checks')
  const verbose = args.includes('--verbose')
  
  log('🔍 Villa Management - Pre-commit Hygiene Check', 'bright')
  log('=' .repeat(50), 'blue')
  
  if (skipChecks) {
    log('⏭️  Skipping checks (--skip-checks flag)', 'yellow')
    return
  }
  
  let allPassed = true
  
  // Run all checks
  const checks = [
    { name: 'Staged Files', fn: checkStagedFiles, critical: true },
    { name: 'Large Files', fn: checkLargeFiles, critical: false },
    { name: '.gitignore', fn: checkGitignore, critical: false },
    { name: 'package.json', fn: checkPackageJson, critical: false },
    { name: 'TypeScript', fn: checkTypeScript, critical: true }
  ]
  
  for (const check of checks) {
    try {
      const passed = check.fn()
      if (!passed && check.critical) {
        allPassed = false
      }
    } catch (error) {
      if (verbose) {
        log(`❌ ${check.name} check failed: ${error.message}`, 'red')
      }
      if (check.critical) {
        allPassed = false
      }
    }
  }
  
  log('\n' + '=' .repeat(50), 'blue')
  
  if (allPassed) {
    log('🎉 All hygiene checks passed! Commit is ready.', 'green')
    process.exit(0)
  } else {
    log('❌ Some critical checks failed. Please fix before committing.', 'red')
    log('\n💡 To bypass checks (not recommended): git commit --no-verify', 'yellow')
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  main()
}

module.exports = { 
  checkStagedFiles, 
  checkLargeFiles, 
  checkGitignore, 
  checkPackageJson, 
  checkTypeScript 
}
