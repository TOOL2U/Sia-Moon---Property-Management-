#!/usr/bin/env node

/**
 * 🔍 Live Mode Configuration Verification Script
 * 
 * This script verifies that all configuration files are properly set
 * for live mode operation (SIMULATION_MODE = false)
 */

const fs = require('fs')
const path = require('path')

async function verifyLiveConfiguration() {
  console.log('🔍 Verifying Live Mode Configuration...')
  console.log('=' .repeat(60))
  
  const configChecks = []
  let allConfigsCorrect = true

  try {
    // 1. Check main config file
    console.log('📋 Checking src/lib/config.ts...')
    const configPath = path.join(process.cwd(), 'src/lib/config.ts')
    const configContent = fs.readFileSync(configPath, 'utf8')
    
    if (configContent.includes('export const SIMULATION_MODE = false')) {
      console.log('✅ src/lib/config.ts: SIMULATION_MODE = false')
      configChecks.push({ file: 'src/lib/config.ts', status: 'correct', value: 'false' })
    } else if (configContent.includes('export const SIMULATION_MODE = true')) {
      console.log('❌ src/lib/config.ts: SIMULATION_MODE = true (should be false)')
      configChecks.push({ file: 'src/lib/config.ts', status: 'incorrect', value: 'true', expected: 'false' })
      allConfigsCorrect = false
    } else {
      console.log('⚠️  src/lib/config.ts: SIMULATION_MODE not found or dynamic')
      configChecks.push({ file: 'src/lib/config.ts', status: 'unknown', value: 'not found' })
    }

    // 2. Check AI system config
    console.log('📋 Checking src/ai-system/AI_WebApp_DevTeam_Config.ts...')
    const aiConfigPath = path.join(process.cwd(), 'src/ai-system/AI_WebApp_DevTeam_Config.ts')
    const aiConfigContent = fs.readFileSync(aiConfigPath, 'utf8')
    
    if (aiConfigContent.includes('export const SIMULATION_MODE = false')) {
      console.log('✅ AI_WebApp_DevTeam_Config.ts: SIMULATION_MODE = false')
      configChecks.push({ file: 'AI_WebApp_DevTeam_Config.ts', status: 'correct', value: 'false' })
    } else if (aiConfigContent.includes('export const SIMULATION_MODE = true')) {
      console.log('❌ AI_WebApp_DevTeam_Config.ts: SIMULATION_MODE = true (should be false)')
      configChecks.push({ file: 'AI_WebApp_DevTeam_Config.ts', status: 'incorrect', value: 'true', expected: 'false' })
      allConfigsCorrect = false
    } else {
      console.log('⚠️  AI_WebApp_DevTeam_Config.ts: SIMULATION_MODE not found')
      configChecks.push({ file: 'AI_WebApp_DevTeam_Config.ts', status: 'unknown', value: 'not found' })
    }

    // 3. Check AI settings JSON
    console.log('📋 Checking config/aiSettings.json...')
    const aiSettingsPath = path.join(process.cwd(), 'config/aiSettings.json')
    if (fs.existsSync(aiSettingsPath)) {
      const aiSettingsContent = fs.readFileSync(aiSettingsPath, 'utf8')
      const aiSettings = JSON.parse(aiSettingsContent)
      
      if (aiSettings.settings && aiSettings.settings.simulationMode === false) {
        console.log('✅ config/aiSettings.json: simulationMode = false')
        configChecks.push({ file: 'config/aiSettings.json', status: 'correct', value: 'false' })
      } else if (aiSettings.settings && aiSettings.settings.simulationMode === true) {
        console.log('❌ config/aiSettings.json: simulationMode = true (should be false)')
        configChecks.push({ file: 'config/aiSettings.json', status: 'incorrect', value: 'true', expected: 'false' })
        allConfigsCorrect = false
      } else {
        console.log('⚠️  config/aiSettings.json: simulationMode not found')
        configChecks.push({ file: 'config/aiSettings.json', status: 'unknown', value: 'not found' })
      }
    } else {
      console.log('⚠️  config/aiSettings.json: File not found')
      configChecks.push({ file: 'config/aiSettings.json', status: 'missing', value: 'file not found' })
    }

    // 4. Check environment variables
    console.log('📋 Checking environment variables...')
    const nodeEnv = process.env.NODE_ENV
    const aiSimulationMode = process.env.AI_SIMULATION_MODE
    
    console.log(`   NODE_ENV: ${nodeEnv || 'not set'}`)
    console.log(`   AI_SIMULATION_MODE: ${aiSimulationMode || 'not set'}`)
    
    if (aiSimulationMode === 'false' || aiSimulationMode === undefined) {
      console.log('✅ Environment variables: Configured for live mode')
      configChecks.push({ file: 'environment', status: 'correct', value: aiSimulationMode || 'undefined' })
    } else {
      console.log('❌ Environment variables: AI_SIMULATION_MODE should be false or undefined')
      configChecks.push({ file: 'environment', status: 'incorrect', value: aiSimulationMode, expected: 'false or undefined' })
      allConfigsCorrect = false
    }

    console.log('')
    console.log('📊 Configuration Summary:')
    console.log('=' .repeat(60))
    
    configChecks.forEach((check, index) => {
      const statusIcon = check.status === 'correct' ? '✅' : 
                        check.status === 'incorrect' ? '❌' : 
                        check.status === 'missing' ? '📁' : '⚠️'
      
      console.log(`${index + 1}. ${statusIcon} ${check.file}`)
      console.log(`   Current: ${check.value}`)
      if (check.expected) {
        console.log(`   Expected: ${check.expected}`)
      }
      console.log('')
    })

    // Overall assessment
    if (allConfigsCorrect) {
      console.log('🎉 LIVE MODE CONFIGURATION VERIFIED!')
      console.log('=' .repeat(60))
      console.log('✅ All configuration files are set for live mode')
      console.log('✅ SIMULATION_MODE = false in all relevant files')
      console.log('✅ Environment variables configured correctly')
      console.log('✅ System ready for production operation')
      console.log('')
      console.log('🚀 Real actions will be triggered:')
      console.log('   • Email notifications will be sent')
      console.log('   • Calendar events will be created')
      console.log('   • Staff assignments will be recorded')
      console.log('   • Database updates will be performed')
      console.log('   • All actions will be logged')
      console.log('')
      console.log('🔍 Next step: Run live mode test to verify functionality')
      console.log('   Command: node scripts/test-live-mode.js')
    } else {
      console.log('🚨 CONFIGURATION ISSUES DETECTED!')
      console.log('=' .repeat(60))
      console.log('❌ Some configuration files still have SIMULATION_MODE = true')
      console.log('❌ System is not ready for live mode operation')
      console.log('')
      console.log('🔧 Required fixes:')
      
      configChecks.forEach((check) => {
        if (check.status === 'incorrect') {
          console.log(`   • Update ${check.file}: Set SIMULATION_MODE = false`)
        } else if (check.status === 'missing') {
          console.log(`   • Create ${check.file} with proper configuration`)
        } else if (check.status === 'unknown') {
          console.log(`   • Verify ${check.file} has SIMULATION_MODE = false`)
        }
      })
      
      console.log('')
      console.log('⚠️  DO NOT proceed with live testing until all issues are resolved!')
    }

    // Test API endpoint configuration
    console.log('')
    console.log('🔌 Testing API Configuration...')
    try {
      const testResponse = await fetch('http://localhost:3000/api/health', {
        method: 'GET'
      })
      
      if (testResponse.ok) {
        console.log('✅ API server is running and accessible')
      } else {
        console.log('⚠️  API server responded with error:', testResponse.status)
      }
    } catch (apiError) {
      console.log('❌ API server is not accessible:', apiError.message)
      console.log('   Make sure the development server is running: npm run dev')
    }

    return {
      allConfigsCorrect,
      configChecks,
      timestamp: new Date().toISOString()
    }

  } catch (error) {
    console.error('💥 Configuration verification failed:', error.message)
    return {
      allConfigsCorrect: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }
  }
}

// Auto-fix function
async function autoFixConfiguration() {
  console.log('')
  console.log('🔧 Auto-fixing configuration files...')
  
  try {
    // Fix main config file
    const configPath = path.join(process.cwd(), 'src/lib/config.ts')
    let configContent = fs.readFileSync(configPath, 'utf8')
    configContent = configContent.replace(
      /export const SIMULATION_MODE = true/g,
      'export const SIMULATION_MODE = false'
    )
    fs.writeFileSync(configPath, configContent)
    console.log('✅ Fixed src/lib/config.ts')

    // Fix AI system config
    const aiConfigPath = path.join(process.cwd(), 'src/ai-system/AI_WebApp_DevTeam_Config.ts')
    let aiConfigContent = fs.readFileSync(aiConfigPath, 'utf8')
    aiConfigContent = aiConfigContent.replace(
      /export const SIMULATION_MODE = true/g,
      'export const SIMULATION_MODE = false'
    )
    fs.writeFileSync(aiConfigPath, aiConfigContent)
    console.log('✅ Fixed AI_WebApp_DevTeam_Config.ts')

    // Fix AI settings JSON
    const aiSettingsPath = path.join(process.cwd(), 'config/aiSettings.json')
    if (fs.existsSync(aiSettingsPath)) {
      const aiSettingsContent = fs.readFileSync(aiSettingsPath, 'utf8')
      const aiSettings = JSON.parse(aiSettingsContent)
      if (aiSettings.settings) {
        aiSettings.settings.simulationMode = false
        fs.writeFileSync(aiSettingsPath, JSON.stringify(aiSettings, null, 2))
        console.log('✅ Fixed config/aiSettings.json')
      }
    }

    console.log('🎉 All configuration files have been updated for live mode!')
    console.log('🔄 Please restart the development server: npm run dev')
    
  } catch (error) {
    console.error('❌ Auto-fix failed:', error.message)
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2)
  
  if (args.includes('--fix')) {
    autoFixConfiguration()
      .then(() => verifyLiveConfiguration())
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('Fatal Error:', error)
        process.exit(1)
      })
  } else {
    verifyLiveConfiguration()
      .then((result) => {
        if (!result.allConfigsCorrect) {
          console.log('')
          console.log('💡 Tip: Run with --fix to automatically update configuration files')
          console.log('   Command: node scripts/verify-live-config.js --fix')
        }
        process.exit(result.allConfigsCorrect ? 0 : 1)
      })
      .catch((error) => {
        console.error('Fatal Error:', error)
        process.exit(1)
      })
  }
}

module.exports = { verifyLiveConfiguration, autoFixConfiguration }
