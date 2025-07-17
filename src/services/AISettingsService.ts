/**
 * AI Settings Service
 * Manages AI configuration, automation settings, and performance tuning
 */

import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

// AI Settings interface
export interface AISettings {
  id: string
  
  // AI Automation Controls
  automation: {
    masterEnabled: boolean
    bookingApproval: boolean
    jobAssignment: boolean
    calendarUpdates: boolean
    notifications: boolean
    confidenceThresholds: {
      bookingApproval: number // 0-1
      jobAssignment: number // 0-1
      calendarUpdates: number // 0-1
      notifications: number // 0-1
    }
  }
  
  // Performance Tuning
  performance: {
    jobAssignmentAlgorithm: 'skills-based' | 'availability-based' | 'performance-based' | 'balanced'
    bookingApprovalCriteria: {
      guestHistoryWeight: number // 0-1
      propertyAvailabilityCheck: boolean
      pricingValidation: boolean
      minimumLeadTime: number // hours
    }
    notifications: {
      frequency: 'immediate' | 'batched' | 'scheduled'
      batchInterval: number // minutes
      quietHours: {
        enabled: boolean
        start: string // HH:MM
        end: string // HH:MM
      }
    }
  }
  
  // Feedback & Learning
  learning: {
    adminFeedbackWeight: number // 0-1
    dataRetention: {
      aiLogs: number // days
      feedback: number // days
    }
    modelRetraining: {
      frequency: 'daily' | 'weekly' | 'monthly' | 'manual'
      minimumFeedbackCount: number
    }
  }
  
  // Integration Settings
  integration: {
    mobileSync: {
      enabled: boolean
      syncInterval: number // minutes
      offlineSupport: boolean
    }
    realTimeUpdates: {
      enabled: boolean
      updateInterval: number // seconds
    }
    apiLimits: {
      requestsPerMinute: number
      maxConcurrentRequests: number
    }
  }
  
  // Dashboard Customization
  dashboard: {
    defaultTimeRange: '24h' | '7d' | '30d' | '90d'
    kpiDisplayPreferences: {
      showApprovalTime: boolean
      showAssignmentAccuracy: boolean
      showJobsPerStaff: boolean
      showSatisfaction: boolean
    }
    alertThresholds: {
      lowAccuracy: number // percentage
      highResponseTime: number // seconds
      lowSatisfaction: number // percentage
    }
  }
  
  // Metadata
  createdAt: Timestamp
  updatedAt: Timestamp
  lastModifiedBy: string
}

// Default AI Settings
export const DEFAULT_AI_SETTINGS: Omit<AISettings, 'id' | 'createdAt' | 'updatedAt' | 'lastModifiedBy'> = {
  automation: {
    masterEnabled: true,
    bookingApproval: true,
    jobAssignment: true,
    calendarUpdates: true,
    notifications: true,
    confidenceThresholds: {
      bookingApproval: 0.8,
      jobAssignment: 0.75,
      calendarUpdates: 0.9,
      notifications: 0.7
    }
  },
  performance: {
    jobAssignmentAlgorithm: 'balanced',
    bookingApprovalCriteria: {
      guestHistoryWeight: 0.3,
      propertyAvailabilityCheck: true,
      pricingValidation: true,
      minimumLeadTime: 2
    },
    notifications: {
      frequency: 'immediate',
      batchInterval: 15,
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '07:00'
      }
    }
  },
  learning: {
    adminFeedbackWeight: 0.8,
    dataRetention: {
      aiLogs: 90,
      feedback: 365
    },
    modelRetraining: {
      frequency: 'weekly',
      minimumFeedbackCount: 10
    }
  },
  integration: {
    mobileSync: {
      enabled: true,
      syncInterval: 5,
      offlineSupport: true
    },
    realTimeUpdates: {
      enabled: true,
      updateInterval: 30
    },
    apiLimits: {
      requestsPerMinute: 100,
      maxConcurrentRequests: 10
    }
  },
  dashboard: {
    defaultTimeRange: '24h',
    kpiDisplayPreferences: {
      showApprovalTime: true,
      showAssignmentAccuracy: true,
      showJobsPerStaff: true,
      showSatisfaction: true
    },
    alertThresholds: {
      lowAccuracy: 70,
      highResponseTime: 300,
      lowSatisfaction: 60
    }
  }
}

class AISettingsService {
  private readonly SETTINGS_COLLECTION = 'aiSettings'
  private readonly SETTINGS_DOC_ID = 'global'

  /**
   * Get current AI settings
   */
  async getSettings(): Promise<AISettings> {
    try {
      const settingsRef = doc(db, this.SETTINGS_COLLECTION, this.SETTINGS_DOC_ID)
      const settingsDoc = await getDoc(settingsRef)

      if (settingsDoc.exists()) {
        return { id: settingsDoc.id, ...settingsDoc.data() } as AISettings
      } else {
        // Create default settings if none exist
        const defaultSettings = await this.createDefaultSettings()
        return defaultSettings
      }
    } catch (error) {
      console.error('Error getting AI settings:', error)
      throw new Error('Failed to load AI settings')
    }
  }

  /**
   * Update AI settings
   */
  async updateSettings(updates: Partial<Omit<AISettings, 'id' | 'createdAt' | 'updatedAt' | 'lastModifiedBy'>>, updatedBy: string = 'admin'): Promise<void> {
    try {
      const settingsRef = doc(db, this.SETTINGS_COLLECTION, this.SETTINGS_DOC_ID)
      
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        lastModifiedBy: updatedBy
      }

      await updateDoc(settingsRef, updateData)
      console.log('✅ AI settings updated successfully')
    } catch (error) {
      console.error('Error updating AI settings:', error)
      throw new Error('Failed to update AI settings')
    }
  }

  /**
   * Reset settings to defaults
   */
  async resetToDefaults(updatedBy: string = 'admin'): Promise<AISettings> {
    try {
      const settingsRef = doc(db, this.SETTINGS_COLLECTION, this.SETTINGS_DOC_ID)
      
      const defaultSettings: Omit<AISettings, 'id'> = {
        ...DEFAULT_AI_SETTINGS,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        lastModifiedBy: updatedBy
      }

      await setDoc(settingsRef, defaultSettings)
      console.log('✅ AI settings reset to defaults')
      
      return { id: this.SETTINGS_DOC_ID, ...defaultSettings } as AISettings
    } catch (error) {
      console.error('Error resetting AI settings:', error)
      throw new Error('Failed to reset AI settings')
    }
  }

  /**
   * Create default settings
   */
  private async createDefaultSettings(): Promise<AISettings> {
    try {
      const settingsRef = doc(db, this.SETTINGS_COLLECTION, this.SETTINGS_DOC_ID)
      
      const defaultSettings: Omit<AISettings, 'id'> = {
        ...DEFAULT_AI_SETTINGS,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        lastModifiedBy: 'system'
      }

      await setDoc(settingsRef, defaultSettings)
      console.log('✅ Default AI settings created')
      
      return { id: this.SETTINGS_DOC_ID, ...defaultSettings } as AISettings
    } catch (error) {
      console.error('Error creating default AI settings:', error)
      throw new Error('Failed to create default AI settings')
    }
  }

  /**
   * Get specific setting value
   */
  async getSetting<K extends keyof AISettings>(key: K): Promise<AISettings[K] | null> {
    try {
      const settings = await this.getSettings()
      return settings[key]
    } catch (error) {
      console.error(`Error getting setting ${String(key)}:`, error)
      return null
    }
  }

  /**
   * Check if AI automation is enabled
   */
  async isAutomationEnabled(): Promise<boolean> {
    try {
      const automation = await this.getSetting('automation')
      return automation?.masterEnabled ?? true
    } catch (error) {
      console.error('Error checking automation status:', error)
      return false
    }
  }
}

// Export singleton instance
const aiSettingsService = new AISettingsService()
export default aiSettingsService
