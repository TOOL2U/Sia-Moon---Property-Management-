/**
 * Job Escalation Engine
 * Handles automatic job escalation and reassignment workflows
 * 
 * Future Implementation Features:
 * - Time-based escalation (15 minutes no acceptance)
 * - Multi-level escalation (staff -> supervisor -> admin)
 * - Automatic reassignment to alternative staff
 * - Escalation notifications and alerts
 * - Custom escalation rules per job type/priority
 * - Integration with notification system
 */

import { JobData, JobStatus, JobPriority } from './JobAssignmentService'
import AutoAssignmentEngine from './AutoAssignmentEngine'

// Escalation trigger types
export type EscalationTrigger = 
  | 'time_based'
  | 'rejection_based'
  | 'no_response'
  | 'staff_unavailable'
  | 'manual_escalation'
  | 'system_failure'

// Escalation action types
export type EscalationAction = 
  | 'reassign_staff'
  | 'notify_supervisor'
  | 'notify_admin'
  | 'increase_priority'
  | 'send_reminder'
  | 'create_alert'
  | 'custom_action'

// Escalation rule configuration
export interface EscalationRule {
  id: string
  name: string
  trigger: EscalationTrigger
  enabled: boolean
  priority: number
  conditions: {
    jobTypes?: string[]
    priorities?: JobPriority[]
    timeThresholds?: {
      warning: number // minutes
      escalation: number // minutes
      critical: number // minutes
    }
    maxAttempts?: number
    staffRoles?: string[]
  }
  actions: Array<{
    type: EscalationAction
    delay: number // minutes
    config: Record<string, any>
  }>
  notifications: {
    channels: ('email' | 'sms' | 'push' | 'slack')[]
    recipients: string[]
    template: string
  }
}

// Escalation event
export interface EscalationEvent {
  id: string
  jobId: string
  ruleId: string
  trigger: EscalationTrigger
  triggeredAt: Date
  status: 'pending' | 'processing' | 'completed' | 'failed'
  attempts: number
  nextActionAt?: Date
  completedActions: Array<{
    type: EscalationAction
    executedAt: Date
    success: boolean
    result?: any
    error?: string
  }>
  metadata: {
    originalStaffId?: string
    currentStaffId?: string
    escalationLevel: number
    timeElapsed: number // minutes
  }
}

// Escalation context
export interface EscalationContext {
  job: JobData
  originalAssignment: {
    staffId: string
    assignedAt: Date
  }
  currentAssignment?: {
    staffId: string
    assignedAt: Date
  }
  escalationHistory: EscalationEvent[]
  availableStaff: string[]
  supervisors: string[]
  admins: string[]
}

class JobEscalationEngine {
  private rules: Map<string, EscalationRule> = new Map()
  private activeEscalations: Map<string, EscalationEvent> = new Map()
  private escalationTimers: Map<string, NodeJS.Timeout> = new Map()
  private isEnabled: boolean = false

  /**
   * Initialize the escalation engine
   */
  async initialize(): Promise<void> {
    console.log('⚡ Initializing Job Escalation Engine...')
    
    // Load default escalation rules
    await this.loadDefaultRules()
    
    // Load custom rules from database
    await this.loadCustomRules()
    
    // Resume active escalations
    await this.resumeActiveEscalations()
    
    this.isEnabled = true
    console.log(`✅ Job Escalation Engine initialized with ${this.rules.size} rules`)
  }

  /**
   * Load default escalation rules
   */
  private async loadDefaultRules(): Promise<void> {
    const defaultRules: EscalationRule[] = [
      {
        id: 'no_acceptance_15min',
        name: 'No Acceptance - 15 Minutes',
        trigger: 'time_based',
        enabled: true,
        priority: 100,
        conditions: {
          timeThresholds: {
            warning: 10,
            escalation: 15,
            critical: 30
          },
          maxAttempts: 3
        },
        actions: [
          {
            type: 'send_reminder',
            delay: 10,
            config: {
              reminderType: 'push_notification',
              message: 'Job assignment pending acceptance'
            }
          },
          {
            type: 'reassign_staff',
            delay: 15,
            config: {
              useAutoAssignment: true,
              excludeOriginalStaff: true
            }
          },
          {
            type: 'notify_supervisor',
            delay: 20,
            config: {
              escalationLevel: 1,
              includeJobDetails: true
            }
          }
        ],
        notifications: {
          channels: ['push', 'email'],
          recipients: ['assigned_staff', 'supervisor'],
          template: 'job_escalation_alert'
        }
      },
      {
        id: 'urgent_job_immediate',
        name: 'Urgent Job - Immediate Escalation',
        trigger: 'time_based',
        enabled: true,
        priority: 200,
        conditions: {
          priorities: ['urgent'],
          timeThresholds: {
            warning: 2,
            escalation: 5,
            critical: 10
          }
        },
        actions: [
          {
            type: 'send_reminder',
            delay: 2,
            config: {
              reminderType: 'urgent_notification',
              sound: 'urgent_alert'
            }
          },
          {
            type: 'notify_supervisor',
            delay: 5,
            config: {
              escalationLevel: 1,
              urgentFlag: true
            }
          },
          {
            type: 'notify_admin',
            delay: 10,
            config: {
              escalationLevel: 2,
              requireImmediate: true
            }
          }
        ],
        notifications: {
          channels: ['push', 'sms', 'email'],
          recipients: ['assigned_staff', 'supervisor', 'admin'],
          template: 'urgent_job_escalation'
        }
      },
      {
        id: 'staff_rejection_reassign',
        name: 'Staff Rejection - Auto Reassign',
        trigger: 'rejection_based',
        enabled: true,
        priority: 150,
        conditions: {
          maxAttempts: 2
        },
        actions: [
          {
            type: 'reassign_staff',
            delay: 0,
            config: {
              useAutoAssignment: true,
              excludeRejectedStaff: true,
              increasePriority: true
            }
          }
        ],
        notifications: {
          channels: ['push'],
          recipients: ['new_assigned_staff'],
          template: 'job_reassignment_notification'
        }
      }
    ]

    defaultRules.forEach(rule => {
      this.rules.set(rule.id, rule)
    })
  }

  /**
   * Load custom rules from database
   */
  private async loadCustomRules(): Promise<void> {
    // Placeholder for loading custom escalation rules
    console.log('📋 Loading custom escalation rules...')
    
    // Future implementation:
    // const customRules = await db.collection('escalation_rules').get()
    // customRules.forEach(doc => {
    //   const rule = doc.data() as EscalationRule
    //   this.rules.set(rule.id, rule)
    // })
  }

  /**
   * Resume active escalations after restart
   */
  private async resumeActiveEscalations(): Promise<void> {
    // Placeholder for resuming active escalations
    console.log('🔄 Resuming active escalations...')
    
    // Future implementation:
    // const activeEscalations = await db.collection('active_escalations').get()
    // activeEscalations.forEach(doc => {
    //   const escalation = doc.data() as EscalationEvent
    //   this.resumeEscalation(escalation)
    // })
  }

  /**
   * Start escalation monitoring for a job
   */
  async startEscalationMonitoring(jobData: JobData): Promise<void> {
    if (!this.isEnabled) return

    console.log(`⚡ Starting escalation monitoring for job: ${jobData.id}`)

    // Find applicable rules for this job
    const applicableRules = this.getApplicableRules(jobData)

    // Set up timers for each applicable rule
    for (const rule of applicableRules) {
      await this.setupEscalationTimer(jobData, rule)
    }
  }

  /**
   * Stop escalation monitoring for a job
   */
  async stopEscalationMonitoring(jobId: string): Promise<void> {
    console.log(`🛑 Stopping escalation monitoring for job: ${jobId}`)

    // Clear any active timers
    const timerKey = `${jobId}_timer`
    const timer = this.escalationTimers.get(timerKey)
    if (timer) {
      clearTimeout(timer)
      this.escalationTimers.delete(timerKey)
    }

    // Remove active escalation
    this.activeEscalations.delete(jobId)

    // TODO: Update database
  }

  /**
   * Handle job status change for escalation
   */
  async handleJobStatusChange(
    jobId: string,
    oldStatus: JobStatus,
    newStatus: JobStatus
  ): Promise<void> {
    // Stop escalation if job is accepted or completed
    if (['accepted', 'in_progress', 'completed', 'verified'].includes(newStatus)) {
      await this.stopEscalationMonitoring(jobId)
      return
    }

    // Handle rejection-based escalation
    if (newStatus === 'cancelled' && oldStatus === 'assigned') {
      await this.triggerEscalation(jobId, 'rejection_based')
    }
  }

  /**
   * Manually trigger escalation
   */
  async triggerEscalation(
    jobId: string,
    trigger: EscalationTrigger,
    context?: Partial<EscalationContext>
  ): Promise<void> {
    console.log(`🚨 Triggering escalation for job ${jobId}: ${trigger}`)

    // Find applicable rules for this trigger
    const applicableRules = Array.from(this.rules.values())
      .filter(rule => rule.trigger === trigger && rule.enabled)
      .sort((a, b) => b.priority - a.priority)

    if (applicableRules.length === 0) {
      console.log(`⚠️ No escalation rules found for trigger: ${trigger}`)
      return
    }

    // Execute the highest priority rule
    const rule = applicableRules[0]
    await this.executeEscalationRule(jobId, rule, trigger, context)
  }

  /**
   * Get applicable rules for a job
   */
  private getApplicableRules(jobData: JobData): EscalationRule[] {
    return Array.from(this.rules.values()).filter(rule => {
      if (!rule.enabled) return false

      // Check job type conditions
      if (rule.conditions.jobTypes && !rule.conditions.jobTypes.includes(jobData.jobType)) {
        return false
      }

      // Check priority conditions
      if (rule.conditions.priorities && !rule.conditions.priorities.includes(jobData.priority)) {
        return false
      }

      return true
    })
  }

  /**
   * Setup escalation timer for a rule
   */
  private async setupEscalationTimer(jobData: JobData, rule: EscalationRule): Promise<void> {
    if (rule.trigger !== 'time_based') return

    const thresholds = rule.conditions.timeThresholds
    if (!thresholds) return

    // Set timer for escalation threshold
    const escalationDelay = thresholds.escalation * 60 * 1000 // Convert to milliseconds
    const timerKey = `${jobData.id}_${rule.id}_timer`

    const timer = setTimeout(async () => {
      await this.triggerEscalation(jobData.id!, 'time_based')
    }, escalationDelay)

    this.escalationTimers.set(timerKey, timer)
    console.log(`⏰ Set escalation timer for job ${jobData.id}: ${thresholds.escalation} minutes`)
  }

  /**
   * Execute escalation rule
   */
  private async executeEscalationRule(
    jobId: string,
    rule: EscalationRule,
    trigger: EscalationTrigger,
    context?: Partial<EscalationContext>
  ): Promise<void> {
    console.log(`🎯 Executing escalation rule: ${rule.name}`)

    // Create escalation event
    const escalationEvent: EscalationEvent = {
      id: `escalation_${jobId}_${Date.now()}`,
      jobId,
      ruleId: rule.id,
      trigger,
      triggeredAt: new Date(),
      status: 'processing',
      attempts: 1,
      completedActions: [],
      metadata: {
        escalationLevel: 1,
        timeElapsed: 0 // TODO: Calculate actual time elapsed
      }
    }

    this.activeEscalations.set(jobId, escalationEvent)

    // Execute actions in sequence
    for (const action of rule.actions) {
      try {
        // Wait for action delay
        if (action.delay > 0) {
          await this.delay(action.delay * 60 * 1000) // Convert to milliseconds
        }

        const result = await this.executeEscalationAction(jobId, action, context)
        
        escalationEvent.completedActions.push({
          type: action.type,
          executedAt: new Date(),
          success: result.success,
          result: result.data,
          error: result.error
        })

        console.log(`✅ Executed escalation action: ${action.type}`)

      } catch (error) {
        console.error(`❌ Error executing escalation action ${action.type}:`, error)
        
        escalationEvent.completedActions.push({
          type: action.type,
          executedAt: new Date(),
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    escalationEvent.status = 'completed'
    
    // TODO: Save escalation event to database
    console.log(`🎉 Escalation rule completed: ${rule.name}`)
  }

  /**
   * Execute individual escalation action
   */
  private async executeEscalationAction(
    jobId: string,
    action: { type: EscalationAction; config: Record<string, any> },
    context?: Partial<EscalationContext>
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    
    switch (action.type) {
      case 'reassign_staff':
        return this.executeReassignStaff(jobId, action.config, context)
      
      case 'notify_supervisor':
        return this.executeNotifySupervisor(jobId, action.config, context)
      
      case 'notify_admin':
        return this.executeNotifyAdmin(jobId, action.config, context)
      
      case 'send_reminder':
        return this.executeSendReminder(jobId, action.config, context)
      
      case 'increase_priority':
        return this.executeIncreasePriority(jobId, action.config, context)
      
      case 'create_alert':
        return this.executeCreateAlert(jobId, action.config, context)
      
      default:
        return {
          success: false,
          error: `Unknown escalation action: ${action.type}`
        }
    }
  }

  /**
   * Execute reassign staff action
   */
  private async executeReassignStaff(
    jobId: string,
    config: Record<string, any>,
    context?: Partial<EscalationContext>
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    console.log(`🔄 Executing staff reassignment for job: ${jobId}`)

    try {
      // TODO: Implement actual staff reassignment
      // This would integrate with AutoAssignmentEngine and JobAssignmentService
      
      if (config.useAutoAssignment) {
        // Use auto-assignment engine to find new staff
        // const recommendation = await AutoAssignmentEngine.getStaffRecommendation(jobData, availableStaff)
        // if (recommendation) {
        //   await JobAssignmentService.reassignJob(jobId, recommendation.recommendedStaffId)
        // }
      }

      return {
        success: true,
        data: { message: 'Staff reassignment initiated' }
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Reassignment failed'
      }
    }
  }

  /**
   * Execute notify supervisor action
   */
  private async executeNotifySupervisor(
    jobId: string,
    config: Record<string, any>,
    context?: Partial<EscalationContext>
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    console.log(`📢 Notifying supervisor for job: ${jobId}`)

    try {
      // TODO: Implement supervisor notification
      // This would integrate with the notification system
      
      return {
        success: true,
        data: { message: 'Supervisor notified' }
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Supervisor notification failed'
      }
    }
  }

  /**
   * Execute notify admin action
   */
  private async executeNotifyAdmin(
    jobId: string,
    config: Record<string, any>,
    context?: Partial<EscalationContext>
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    console.log(`🚨 Notifying admin for job: ${jobId}`)

    try {
      // TODO: Implement admin notification
      // This would create high-priority alerts in the admin dashboard
      
      return {
        success: true,
        data: { message: 'Admin notified' }
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Admin notification failed'
      }
    }
  }

  /**
   * Execute send reminder action
   */
  private async executeSendReminder(
    jobId: string,
    config: Record<string, any>,
    context?: Partial<EscalationContext>
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    console.log(`⏰ Sending reminder for job: ${jobId}`)

    try {
      // TODO: Implement reminder sending
      // This would send push notifications or other reminders to staff
      
      return {
        success: true,
        data: { message: 'Reminder sent' }
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Reminder sending failed'
      }
    }
  }

  /**
   * Execute increase priority action
   */
  private async executeIncreasePriority(
    jobId: string,
    config: Record<string, any>,
    context?: Partial<EscalationContext>
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    console.log(`⬆️ Increasing priority for job: ${jobId}`)

    try {
      // TODO: Implement priority increase
      // This would update the job priority in the database
      
      return {
        success: true,
        data: { message: 'Priority increased' }
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Priority increase failed'
      }
    }
  }

  /**
   * Execute create alert action
   */
  private async executeCreateAlert(
    jobId: string,
    config: Record<string, any>,
    context?: Partial<EscalationContext>
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    console.log(`🚨 Creating alert for job: ${jobId}`)

    try {
      // TODO: Implement alert creation
      // This would create system alerts visible in admin dashboards
      
      return {
        success: true,
        data: { message: 'Alert created' }
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Alert creation failed'
      }
    }
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Add or update escalation rule
   */
  async addRule(rule: EscalationRule): Promise<void> {
    this.rules.set(rule.id, rule)
    
    // TODO: Save to database
    console.log(`✅ Added escalation rule: ${rule.name}`)
  }

  /**
   * Remove escalation rule
   */
  async removeRule(ruleId: string): Promise<void> {
    this.rules.delete(ruleId)
    
    // TODO: Remove from database
    console.log(`🗑️ Removed escalation rule: ${ruleId}`)
  }

  /**
   * Get all rules
   */
  getRules(): EscalationRule[] {
    return Array.from(this.rules.values())
  }

  /**
   * Get active escalations
   */
  getActiveEscalations(): EscalationEvent[] {
    return Array.from(this.activeEscalations.values())
  }

  /**
   * Enable/disable escalation engine
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
    console.log(`⚡ Job Escalation Engine ${enabled ? 'enabled' : 'disabled'}`)
  }

  /**
   * Check if engine is enabled
   */
  isEngineEnabled(): boolean {
    return this.isEnabled
  }
}

// Export singleton instance
export default new JobEscalationEngine()
