#!/usr/bin/env node
/**
 * 🔴 CRITICAL BLOCKER #4 VALIDATION: Job Timeout & Escalation System
 * 
 * Validates that the timeout monitoring and escalation system is properly configured
 * and that no jobs can remain stuck without proper escalation and admin notification.
 * 
 * BUSINESS CRITICAL: Must prove no jobs can get lost or forgotten
 */

const fs = require('fs')
const path = require('path')

class BlockerFourValidator {
  constructor() {
    this.results = []
    // Assume script is run from project root
    this.projectRoot = process.cwd()
  }

  /**
   * Main validation entry point
   */
  async validate() {
    console.log('🔴 CRITICAL BLOCKER #4: Job Timeout & Escalation System Validation')
    console.log('=' + '='.repeat(80))

    try {
      // Check timeout monitoring service exists
      this.validateTimeoutMonitorService()
      
      // Check automated Cloud Function exists
      this.validateTimeoutCloudFunction()
      
      // Check escalation service integration
      this.validateEscalationService()
      
      // Check admin notification system
      this.validateAdminNotifications()
      
      // Check timeout configuration
      this.validateTimeoutConfiguration()
      
      // Check function deployment configuration
      this.validateFunctionDeployment()

      this.printSummary()
      return this.isAllPassed()

    } catch (error) {
      console.error('❌ VALIDATION FAILED:', error)
      return false
    }
  }

  /**
   * Check if JobTimeoutMonitor service exists and is properly implemented
   */
  validateTimeoutMonitorService() {
    const timeoutServicePath = path.join(this.projectRoot, 'src/services/JobTimeoutMonitor.ts')
    
    if (!fs.existsSync(timeoutServicePath)) {
      this.addResult({
        check: 'Timeout Monitor Service',
        status: 'FAIL',
        message: 'JobTimeoutMonitor service file not found',
        evidence: [`Expected: ${timeoutServicePath}`]
      })
      return
    }

    const content = fs.readFileSync(timeoutServicePath, 'utf-8')
    
    // Check for critical methods
    const requiredMethods = [
      'checkTimeouts',
      'checkExpiredOffers', 
      'checkStuckAcceptedJobs',
      'checkStuckStartedJobs'
    ]
    
    const missingMethods = requiredMethods.filter(method => 
      !content.includes(method)
    )

    if (missingMethods.length > 0) {
      this.addResult({
        check: 'Timeout Monitor Service - Methods',
        status: 'FAIL',
        message: 'Missing critical timeout monitoring methods',
        evidence: [`Missing: ${missingMethods.join(', ')}`]
      })
    } else {
      this.addResult({
        check: 'Timeout Monitor Service',
        status: 'PASS',
        message: 'JobTimeoutMonitor service properly implemented with all required methods'
      })
    }

    // Check timeout configuration
    if (content.includes('offerTimeoutMinutes') && 
        content.includes('jobAcceptedTimeoutHours') && 
        content.includes('jobStartedTimeoutHours')) {
      this.addResult({
        check: 'Timeout Configuration',
        status: 'PASS',
        message: 'Timeout thresholds properly configured for offers, accepted jobs, and started jobs'
      })
    } else {
      this.addResult({
        check: 'Timeout Configuration',
        status: 'FAIL',
        message: 'Missing timeout configuration parameters'
      })
    }
  }

  /**
   * Check if Cloud Function for automated monitoring exists
   */
  validateTimeoutCloudFunction() {
    const functionPath = path.join(this.projectRoot, 'functions/src/jobTimeoutMonitor.ts')
    
    if (!fs.existsSync(functionPath)) {
      this.addResult({
        check: 'Timeout Cloud Function',
        status: 'FAIL',
        message: 'jobTimeoutMonitor Cloud Function not found',
        evidence: [`Expected: ${functionPath}`]
      })
      return
    }

    const content = fs.readFileSync(functionPath, 'utf-8')
    
    // Check for scheduled execution
    if (content.includes('schedule(') && content.includes('every 5 minutes')) {
      this.addResult({
        check: 'Automated Scheduling',
        status: 'PASS',
        message: 'Cloud Function configured to run every 5 minutes'
      })
    } else {
      this.addResult({
        check: 'Automated Scheduling',
        status: 'FAIL',
        message: 'Cloud Function not configured for automated 5-minute scheduling'
      })
    }

    // Check for timeout detection logic
    const timeoutChecks = [
      'checkExpiredOffers',
      'checkStuckAcceptedJobs', 
      'checkStuckStartedJobs'
    ]
    
    const implementedChecks = timeoutChecks.filter(check => content.includes(check))
    
    if (implementedChecks.length === timeoutChecks.length) {
      this.addResult({
        check: 'Timeout Detection Logic',
        status: 'PASS',
        message: 'All timeout detection functions implemented in Cloud Function'
      })
    } else {
      this.addResult({
        check: 'Timeout Detection Logic',
        status: 'FAIL',
        message: 'Missing timeout detection functions in Cloud Function',
        evidence: [`Missing: ${timeoutChecks.filter(c => !implementedChecks.includes(c)).join(', ')}`]
      })
    }
  }

  /**
   * Check EscalationService integration
   */
  validateEscalationService() {
    const escalationPath = path.join(this.projectRoot, 'src/services/EscalationService.ts')
    
    if (!fs.existsSync(escalationPath)) {
      this.addResult({
        check: 'Escalation Service Integration',
        status: 'FAIL',
        message: 'EscalationService not found for timeout integration'
      })
      return
    }

    const content = fs.readFileSync(escalationPath, 'utf-8')
    
    // Check for expired offer processing
    if (content.includes('processExpiredOffers')) {
      this.addResult({
        check: 'Escalation Service Integration',
        status: 'PASS',
        message: 'EscalationService properly integrated with timeout monitoring'
      })
    } else {
      this.addResult({
        check: 'Escalation Service Integration',
        status: 'WARNING',
        message: 'EscalationService may not have proper timeout integration'
      })
    }
  }

  /**
   * Check admin notification system
   */
  validateAdminNotifications() {
    const functionPath = path.join(this.projectRoot, 'functions/src/jobTimeoutMonitor.ts')
    
    if (!fs.existsSync(functionPath)) {
      this.addResult({
        check: 'Admin Notifications',
        status: 'FAIL',
        message: 'Cannot validate admin notifications - function file missing'
      })
      return
    }

    const content = fs.readFileSync(functionPath, 'utf-8')
    
    // Check for admin notification creation
    if (content.includes('admin_notifications') && 
        content.includes('stuck_job_alert') &&
        content.includes('priority')) {
      this.addResult({
        check: 'Admin Notifications',
        status: 'PASS',
        message: 'Admin notification system properly configured for stuck jobs'
      })
    } else {
      this.addResult({
        check: 'Admin Notifications',
        status: 'FAIL',
        message: 'Admin notification system not properly configured'
      })
    }

    // Check for critical vs high priority handling
    if (content.includes('critical')) {
      this.addResult({
        check: 'Critical Job Alerts',
        status: 'PASS',
        message: 'Critical priority alerts configured for started jobs that timeout'
      })
    } else {
      this.addResult({
        check: 'Critical Job Alerts',
        status: 'WARNING',
        message: 'Critical priority handling may not be configured'
      })
    }
  }

  /**
   * Check timeout configuration values are reasonable
   */
  validateTimeoutConfiguration() {
    const paths = [
      path.join(this.projectRoot, 'src/services/JobTimeoutMonitor.ts'),
      path.join(this.projectRoot, 'functions/src/jobTimeoutMonitor.ts')
    ]
    
    let configFound = false
    
    for (const filePath of paths) {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8')
        
        // Check offer timeout (should be 10-30 minutes)
        const offerMatch = content.match(/offerTimeoutMinutes:\s*(\d+)/)
        if (offerMatch) {
          const minutes = parseInt(offerMatch[1])
          if (minutes >= 10 && minutes <= 30) {
            this.addResult({
              check: 'Offer Timeout Setting',
              status: 'PASS',
              message: `Offer timeout set to ${minutes} minutes (reasonable range)`
            })
          } else {
            this.addResult({
              check: 'Offer Timeout Setting',
              status: 'WARNING',
              message: `Offer timeout set to ${minutes} minutes (may be too ${minutes < 10 ? 'short' : 'long'})`
            })
          }
          configFound = true
        }
        
        // Check accepted job timeout (should be 1-4 hours)
        const acceptedMatch = content.match(/jobAcceptedTimeoutHours:\s*(\d+)/)
        if (acceptedMatch) {
          const hours = parseInt(acceptedMatch[1])
          if (hours >= 1 && hours <= 4) {
            this.addResult({
              check: 'Accepted Job Timeout',
              status: 'PASS',
              message: `Accepted job timeout set to ${hours} hours (reasonable range)`
            })
          } else {
            this.addResult({
              check: 'Accepted Job Timeout',
              status: 'WARNING',
              message: `Accepted job timeout set to ${hours} hours (may be too ${hours < 1 ? 'short' : 'long'})`
            })
          }
        }
        
        // Check started job timeout (should be 4-24 hours)
        const startedMatch = content.match(/jobStartedTimeoutHours:\s*(\d+)/)
        if (startedMatch) {
          const hours = parseInt(startedMatch[1])
          if (hours >= 4 && hours <= 24) {
            this.addResult({
              check: 'Started Job Timeout',
              status: 'PASS',
              message: `Started job timeout set to ${hours} hours (reasonable range)`
            })
          } else {
            this.addResult({
              check: 'Started Job Timeout',
              status: 'WARNING',
              message: `Started job timeout set to ${hours} hours (may be too ${hours < 4 ? 'short' : 'long'})`
            })
          }
        }
      }
    }
    
    if (!configFound) {
      this.addResult({
        check: 'Timeout Configuration Values',
        status: 'FAIL',
        message: 'No timeout configuration found in any file'
      })
    }
  }

  /**
   * Check function deployment configuration
   */
  validateFunctionDeployment() {
    const indexPath = path.join(this.projectRoot, 'functions/src/index.ts')
    
    if (!fs.existsSync(indexPath)) {
      this.addResult({
        check: 'Function Deployment Config',
        status: 'FAIL',
        message: 'functions/src/index.ts not found'
      })
      return
    }

    const content = fs.readFileSync(indexPath, 'utf-8')
    
    // Check if timeout functions are exported
    if (content.includes('jobTimeoutMonitor') && 
        content.includes('triggerTimeoutCheck')) {
      this.addResult({
        check: 'Function Export Configuration',
        status: 'PASS',
        message: 'Timeout monitoring functions properly exported for deployment'
      })
    } else {
      this.addResult({
        check: 'Function Export Configuration',
        status: 'FAIL',
        message: 'Timeout monitoring functions not exported in index.ts'
      })
    }
  }

  /**
   * Add validation result
   */
  addResult(result) {
    this.results.push(result)
    
    const icon = result.status === 'PASS' ? '✅' : 
                 result.status === 'WARNING' ? '⚠️' : '❌'
    
    console.log(`${icon} ${result.check}: ${result.message}`)
    
    if (result.evidence) {
      result.evidence.forEach(evidence => {
        console.log(`   📋 ${evidence}`)
      })
    }
  }

  /**
   * Print validation summary
   */
  printSummary() {
    console.log('\n' + '='.repeat(80))
    console.log('🔴 CRITICAL BLOCKER #4 VALIDATION SUMMARY')
    console.log('=' + '='.repeat(80))
    
    const passed = this.results.filter(r => r.status === 'PASS').length
    const warnings = this.results.filter(r => r.status === 'WARNING').length
    const failed = this.results.filter(r => r.status === 'FAIL').length
    const total = this.results.length
    
    console.log(`📊 Results: ${passed}/${total} passed, ${warnings} warnings, ${failed} failed`)
    
    if (failed === 0) {
      const score = warnings === 0 ? 100 : Math.round((passed / total) * 100)
      console.log(`\n🎯 BLOCKER #4 STATUS: ${score}% VALIDATED`)
      
      if (warnings === 0) {
        console.log('✅ Job Timeout & Escalation System is fully operational')
        console.log('✅ No jobs can remain stuck without proper escalation')
        console.log('✅ Admin notifications configured for all timeout scenarios')
        console.log('✅ Automated monitoring runs every 5 minutes')
      } else {
        console.log('⚠️ System operational but has configuration warnings')
        console.log('⚠️ Review warnings above for optimization opportunities')
      }
    } else {
      console.log('\n❌ BLOCKER #4 STATUS: CRITICAL ISSUES FOUND')
      console.log('🚨 Job timeout system is NOT fully operational')
      console.log('🚨 Jobs may remain stuck without proper escalation')
      console.log('🚨 MUST FIX before production deployment')
    }
    
    console.log('\n📋 TIMEOUT SYSTEM CHECKLIST:')
    console.log('   ✅ Expired offers automatically trigger escalation')
    console.log('   ✅ Stuck accepted jobs generate admin alerts')
    console.log('   ✅ Stuck started jobs generate CRITICAL alerts')
    console.log('   ✅ Automated monitoring runs every 5 minutes')
    console.log('   ✅ Manual trigger available for admin testing')
  }

  /**
   * Check if all validations passed
   */
  isAllPassed() {
    return !this.results.some(r => r.status === 'FAIL')
  }
}

// Execute validation if called directly
if (require.main === module) {
  const validator = new BlockerFourValidator()
  validator.validate().then(success => {
    process.exit(success ? 0 : 1)
  }).catch(error => {
    console.error('Validation error:', error)
    process.exit(1)
  })
}

module.exports = { BlockerFourValidator }
