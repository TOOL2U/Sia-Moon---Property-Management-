#!/usr/bin/env node

/**
 * 📊 Bundle Analysis Script
 * 
 * Analyzes the Next.js bundle and provides insights on:
 * - Bundle size breakdown
 * - Largest dependencies
 * - Tree-shaking opportunities
 * - Performance recommendations
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

/**
 * Check if bundle analysis files exist
 */
function checkAnalysisFiles() {
  const analysisDir = '.next/analyze'
  const serverAnalysis = path.join(analysisDir, 'bundle', 'server.html')
  const clientAnalysis = path.join(analysisDir, 'bundle', 'client.html')
  
  return {
    hasAnalysis: fs.existsSync(analysisDir),
    serverExists: fs.existsSync(serverAnalysis),
    clientExists: fs.existsSync(clientAnalysis),
    analysisDir,
    serverAnalysis,
    clientAnalysis
  }
}

/**
 * Run bundle analysis
 */
function runBundleAnalysis() {
  log('📊 Running bundle analysis...', 'cyan')
  
  try {
    // Set environment variable for analysis
    process.env.ANALYZE = 'true'
    
    log('🔨 Building with analysis enabled...', 'blue')
    execSync('npm run build:analyze', { stdio: 'inherit' })
    
    const analysis = checkAnalysisFiles()
    
    if (analysis.hasAnalysis) {
      log('✅ Bundle analysis completed!', 'green')
      log(`📁 Analysis files created in: ${analysis.analysisDir}`, 'blue')
      
      if (analysis.clientExists) {
        log(`🌐 Client bundle: ${analysis.clientAnalysis}`, 'blue')
      }
      
      if (analysis.serverExists) {
        log(`🖥️  Server bundle: ${analysis.serverAnalysis}`, 'blue')
      }
      
      return analysis
    } else {
      log('❌ Bundle analysis failed - no analysis files generated', 'red')
      return null
    }
    
  } catch (error) {
    log(`❌ Bundle analysis failed: ${error.message}`, 'red')
    return null
  }
}

/**
 * Analyze package.json for large dependencies
 */
function analyzeDependencies() {
  log('\n📦 Analyzing dependencies...', 'cyan')
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }
    
    // Get installed package sizes
    const packageSizes = []
    
    for (const [name, version] of Object.entries(dependencies)) {
      try {
        const packagePath = path.join('node_modules', name)
        if (fs.existsSync(packagePath)) {
          const result = execSync(`du -sm "${packagePath}" 2>/dev/null || echo "0"`, { encoding: 'utf8' })
          const size = parseInt(result.split('\t')[0]) || 0
          packageSizes.push({ name, version, size })
        }
      } catch (error) {
        // Skip packages that can't be analyzed
      }
    }
    
    // Sort by size (largest first)
    packageSizes.sort((a, b) => b.size - a.size)
    
    log('📊 Largest dependencies:', 'yellow')
    packageSizes.slice(0, 10).forEach((pkg, index) => {
      const color = pkg.size > 10 ? 'red' : pkg.size > 5 ? 'yellow' : 'green'
      log(`  ${index + 1}. ${pkg.name}: ${pkg.size}MB`, color)
    })
    
    // Check for potential tree-shaking opportunities
    const heavyPackages = packageSizes.filter(pkg => pkg.size > 5)
    if (heavyPackages.length > 0) {
      log('\n🌳 Tree-shaking opportunities:', 'magenta')
      heavyPackages.forEach(pkg => {
        log(`  - ${pkg.name} (${pkg.size}MB) - Consider importing specific modules`, 'yellow')
      })
    }
    
    return packageSizes
    
  } catch (error) {
    log(`❌ Dependency analysis failed: ${error.message}`, 'red')
    return []
  }
}

/**
 * Check for unused dependencies
 */
function checkUnusedDependencies() {
  log('\n🔍 Checking for unused dependencies...', 'cyan')
  
  try {
    // Check if depcheck is available
    execSync('npx depcheck --version', { stdio: 'ignore' })
    
    const result = execSync('npx depcheck --json', { encoding: 'utf8' })
    const analysis = JSON.parse(result)
    
    let hasUnused = false
    
    if (analysis.dependencies && analysis.dependencies.length > 0) {
      hasUnused = true
      log('📦 Unused dependencies:', 'red')
      analysis.dependencies.forEach(dep => {
        log(`  - ${dep}`, 'red')
      })
    }
    
    if (analysis.devDependencies && analysis.devDependencies.length > 0) {
      hasUnused = true
      log('🛠️  Unused dev dependencies:', 'yellow')
      analysis.devDependencies.forEach(dep => {
        log(`  - ${dep}`, 'yellow')
      })
    }
    
    if (!hasUnused) {
      log('✅ No unused dependencies found!', 'green')
    }
    
    return analysis
    
  } catch (error) {
    log('⚠️  Could not check unused dependencies. Install depcheck:', 'yellow')
    log('  npm install -g depcheck', 'blue')
    return null
  }
}

/**
 * Provide optimization recommendations
 */
function provideRecommendations(packageSizes, unusedDeps) {
  log('\n💡 Optimization Recommendations:', 'bright')
  
  // Bundle size recommendations
  const totalSize = packageSizes.reduce((sum, pkg) => sum + pkg.size, 0)
  if (totalSize > 500) {
    log('📦 Bundle Size:', 'yellow')
    log(`  - Total dependencies: ${totalSize}MB (consider reducing)`, 'yellow')
    log('  - Use dynamic imports for large components', 'blue')
    log('  - Consider code splitting for routes', 'blue')
  } else {
    log('📦 Bundle size looks good!', 'green')
  }
  
  // Tree-shaking recommendations
  const heavyPackages = packageSizes.filter(pkg => pkg.size > 10)
  if (heavyPackages.length > 0) {
    log('\n🌳 Tree-shaking:', 'yellow')
    heavyPackages.forEach(pkg => {
      log(`  - ${pkg.name}: Use specific imports instead of full package`, 'blue')
    })
  }
  
  // Unused dependencies
  if (unusedDeps && (unusedDeps.dependencies?.length > 0 || unusedDeps.devDependencies?.length > 0)) {
    log('\n🗑️  Cleanup:', 'yellow')
    log('  - Remove unused dependencies to reduce bundle size', 'blue')
    log('  - Run: npm uninstall <package-name>', 'blue')
  }
  
  // General recommendations
  log('\n🚀 General Optimizations:', 'cyan')
  log('  - Enable gzip compression in production', 'blue')
  log('  - Use Next.js Image optimization', 'blue')
  log('  - Implement proper caching headers', 'blue')
  log('  - Consider using a CDN for static assets', 'blue')
}

/**
 * Open bundle analyzer in browser
 */
function openAnalyzer(analysisPath) {
  if (!analysisPath || !fs.existsSync(analysisPath)) {
    log('❌ Analysis file not found', 'red')
    return
  }
  
  try {
    const opener = process.platform === 'darwin' ? 'open' : 
                   process.platform === 'win32' ? 'start' : 'xdg-open'
    
    execSync(`${opener} "${analysisPath}"`)
    log('🌐 Opening bundle analyzer in browser...', 'green')
  } catch (error) {
    log(`⚠️  Could not open browser. Open manually: ${analysisPath}`, 'yellow')
  }
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'analyze'
  
  log('📊 Villa Management - Bundle Analyzer', 'bright')
  log('=' .repeat(50), 'blue')
  
  switch (command) {
    case 'analyze':
    case 'run':
      const analysis = runBundleAnalysis()
      if (analysis && analysis.clientExists) {
        setTimeout(() => openAnalyzer(analysis.clientAnalysis), 1000)
      }
      break
      
    case 'deps':
      analyzeDependencies()
      checkUnusedDependencies()
      break
      
    case 'report':
      log('📋 Generating comprehensive report...', 'cyan')
      const packageSizes = analyzeDependencies()
      const unusedDeps = checkUnusedDependencies()
      provideRecommendations(packageSizes, unusedDeps)
      break
      
    case 'open':
      const existing = checkAnalysisFiles()
      if (existing.clientExists) {
        openAnalyzer(existing.clientAnalysis)
      } else {
        log('❌ No analysis files found. Run "analyze" first.', 'red')
      }
      break
      
    case 'help':
    default:
      log('\n📖 Available commands:', 'bright')
      log('  analyze  - Run bundle analysis and open in browser', 'blue')
      log('  deps     - Analyze dependencies and check for unused ones', 'blue')
      log('  report   - Generate comprehensive optimization report', 'blue')
      log('  open     - Open existing bundle analysis in browser', 'blue')
      log('  help     - Show this help message', 'blue')
      log('\n💡 Usage: node scripts/analyze-bundle.js [command]', 'cyan')
      break
  }
  
  log('\n' + '=' .repeat(50), 'blue')
}

// Run the script
if (require.main === module) {
  main()
}

module.exports = { 
  runBundleAnalysis, 
  analyzeDependencies, 
  checkUnusedDependencies, 
  provideRecommendations 
}
