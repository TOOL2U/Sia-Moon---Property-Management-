/**
 * AI Automation Settings
 * Controls when AI can perform real actions vs just suggestions
 */

import { getDb } from '@/lib/firebase'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

export interface AIAutomationSettings {
  enabled: boolean
  autoExecuteLevel: 'none' | 'safe' | 'caution' | 'all'
  requireConfirmation: boolean
  confidenceThreshold: number
  allowedActions: string[]
  restrictedActions: string[]
  maxActionsPerSession: number
  auditLogging: boolean
  notifyOnExecution: boolean
  emergencyStop: boolean
  lastUpdated: any
  updatedBy: string
}

const DEFAULT_SETTINGS: AIAutomationSettings = {
  enabled: true,
  autoExecuteLevel: 'safe', // Only auto-execute safe actions
  requireConfirmation: true,
  confidenceThreshold: 0.8, // 80% confidence required
  allowedActions: [
    'createBooking',
    'createCalendarEvent',
    'createJob',
    'sendStaffNotification'
  ],
  restrictedActions: [
    'deleteBooking',
    'cancelBooking',
    'fireStaff',
    'deleteProperty'
  ],
  maxActionsPerSession: 10,
  auditLogging: true,
  notifyOnExecution: true,
  emergencyStop: false,
  lastUpdated: null,
  updatedBy: 'system'
}

/**
 * AI Automation Settings Service
 */
export class AIAutomationSettingsService {
  private db = getDb()
  private settingsDoc = doc(this.db, 'ai_settings', 'automation')

  /**
   * Get current automation settings
   */
  async getSettings(): Promise<AIAutomationSettings> {
    try {
      const settingsSnap = await getDoc(this.settingsDoc)
      
      if (settingsSnap.exists()) {
        return { ...DEFAULT_SETTINGS, ...settingsSnap.data() } as AIAutomationSettings
      } else {
        // Create default settings
        await this.updateSettings(DEFAULT_SETTINGS, 'system')
        return DEFAULT_SETTINGS
      }
    } catch (error) {
      console.error('Failed to get AI automation settings:', error)
      return DEFAULT_SETTINGS
    }
  }

  /**
   * Update automation settings
   */
  async updateSettings(
    updates: Partial<AIAutomationSettings>,
    updatedBy: string
  ): Promise<void> {
    try {
      const currentSettings = await this.getSettings()
      
      const newSettings: AIAutomationSettings = {
        ...currentSettings,
        ...updates,
        lastUpdated: serverTimestamp(),
        updatedBy
      }
      
      await setDoc(this.settingsDoc, newSettings)
      console.log('✅ AI automation settings updated by:', updatedBy)
    } catch (error) {
      console.error('Failed to update AI automation settings:', error)
      throw error
    }
  }

  /**
   * Check if AI can execute a specific action
   */
  async canExecuteAction(
    action: string,
    safetyLevel: 'safe' | 'caution' | 'dangerous',
    confidence: number,
    sessionActionCount: number = 0
  ): Promise<{
    allowed: boolean
    reason?: string
    requiresConfirmation: boolean
  }> {
    try {
      const settings = await this.getSettings()
      
      // Check if automation is enabled
      if (!settings.enabled) {
        return {
          allowed: false,
          reason: 'AI automation is disabled',
          requiresConfirmation: false
        }
      }
      
      // Check emergency stop
      if (settings.emergencyStop) {
        return {
          allowed: false,
          reason: 'Emergency stop is active',
          requiresConfirmation: false
        }
      }
      
      // Check if action is restricted
      if (settings.restrictedActions.includes(action)) {
        return {
          allowed: false,
          reason: `Action '${action}' is restricted`,
          requiresConfirmation: false
        }
      }
      
      // Check if action is in allowed list (if list is not empty)
      if (settings.allowedActions.length > 0 && !settings.allowedActions.includes(action)) {
        return {
          allowed: false,
          reason: `Action '${action}' is not in allowed actions list`,
          requiresConfirmation: false
        }
      }
      
      // Check confidence threshold
      if (confidence < settings.confidenceThreshold) {
        return {
          allowed: false,
          reason: `Confidence ${Math.round(confidence * 100)}% below threshold ${Math.round(settings.confidenceThreshold * 100)}%`,
          requiresConfirmation: false
        }
      }
      
      // Check session action limit
      if (sessionActionCount >= settings.maxActionsPerSession) {
        return {
          allowed: false,
          reason: `Session action limit reached (${settings.maxActionsPerSession})`,
          requiresConfirmation: false
        }
      }
      
      // Check auto-execute level
      const canAutoExecute = this.checkAutoExecuteLevel(settings.autoExecuteLevel, safetyLevel)
      
      if (!canAutoExecute) {
        return {
          allowed: true,
          reason: `Action requires manual confirmation (safety level: ${safetyLevel})`,
          requiresConfirmation: true
        }
      }
      
      // Check if confirmation is always required
      if (settings.requireConfirmation) {
        return {
          allowed: true,
          reason: 'Confirmation required by settings',
          requiresConfirmation: true
        }
      }
      
      // Action can be executed automatically
      return {
        allowed: true,
        requiresConfirmation: false
      }
      
    } catch (error) {
      console.error('Failed to check action permission:', error)
      return {
        allowed: false,
        reason: 'Failed to check permissions',
        requiresConfirmation: false
      }
    }
  }

  /**
   * Check if safety level allows auto-execution
   */
  private checkAutoExecuteLevel(
    autoExecuteLevel: 'none' | 'safe' | 'caution' | 'all',
    safetyLevel: 'safe' | 'caution' | 'dangerous'
  ): boolean {
    switch (autoExecuteLevel) {
      case 'none':
        return false
      case 'safe':
        return safetyLevel === 'safe'
      case 'caution':
        return safetyLevel === 'safe' || safetyLevel === 'caution'
      case 'all':
        return true
      default:
        return false
    }
  }

  /**
   * Enable emergency stop
   */
  async enableEmergencyStop(userId: string): Promise<void> {
    await this.updateSettings({ emergencyStop: true }, userId)
    console.log('🚨 AI automation emergency stop activated by:', userId)
  }

  /**
   * Disable emergency stop
   */
  async disableEmergencyStop(userId: string): Promise<void> {
    await this.updateSettings({ emergencyStop: false }, userId)
    console.log('✅ AI automation emergency stop deactivated by:', userId)
  }

  /**
   * Get automation status summary
   */
  async getStatusSummary(): Promise<{
    status: 'active' | 'limited' | 'disabled' | 'emergency'
    message: string
    settings: AIAutomationSettings
  }> {
    const settings = await this.getSettings()
    
    if (settings.emergencyStop) {
      return {
        status: 'emergency',
        message: 'Emergency stop is active - all AI automation disabled',
        settings
      }
    }
    
    if (!settings.enabled) {
      return {
        status: 'disabled',
        message: 'AI automation is disabled',
        settings
      }
    }
    
    if (settings.autoExecuteLevel === 'none' || settings.requireConfirmation) {
      return {
        status: 'limited',
        message: 'AI automation requires manual confirmation for all actions',
        settings
      }
    }
    
    return {
      status: 'active',
      message: `AI automation is active (level: ${settings.autoExecuteLevel})`,
      settings
    }
  }
}

// Singleton instance
let aiAutomationSettingsService: AIAutomationSettingsService | null = null

/**
 * Get singleton instance of AIAutomationSettingsService
 */
export function getAIAutomationSettingsService(): AIAutomationSettingsService {
  if (!aiAutomationSettingsService) {
    aiAutomationSettingsService = new AIAutomationSettingsService()
  }
  return aiAutomationSettingsService
}

/**
 * Convenience function to check if action can be executed
 */
export async function canExecuteAIAction(
  action: string,
  safetyLevel: 'safe' | 'caution' | 'dangerous',
  confidence: number,
  sessionActionCount: number = 0
): Promise<{
  allowed: boolean
  reason?: string
  requiresConfirmation: boolean
}> {
  const service = getAIAutomationSettingsService()
  return await service.canExecuteAction(action, safetyLevel, confidence, sessionActionCount)
}
