import { db } from '@/lib/firebase'
import { clientToast as toast } from '@/utils/clientToast'
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'

export interface AIAutomationSettings {
  enabled: boolean
  lastModified: any // Firebase Timestamp
  modifiedBy: string
}

export interface AIAutomationState {
  enabled: boolean
  lastModified: Date | null
  modifiedBy: string
  loading: boolean
  error: string | null
}

class AIAutomationService {
  private readonly SETTINGS_COLLECTION = 'settings'
  private readonly AI_AUTOMATION_DOC = 'aiAutomation'
  private listeners: (() => void)[] = []

  /**
   * Get current AI automation settings
   * Now delegates to the new AISettingsService for consistency
   */
  async getSettings(): Promise<AIAutomationSettings> {
    try {
      // First try to get from new AI Settings Service
      try {
        const aiSettings = await AISettingsService.getSettings()
        return {
          enabled: aiSettings.automation.masterEnabled,
          lastModified: aiSettings.updatedAt,
          modifiedBy: aiSettings.lastModifiedBy,
        }
      } catch (aiSettingsError) {
        console.warn(
          'Could not get settings from AISettingsService, falling back to legacy:',
          aiSettingsError
        )
      }

      // Fallback to legacy settings
      const docRef = doc(db, this.SETTINGS_COLLECTION, this.AI_AUTOMATION_DOC)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return docSnap.data() as AIAutomationSettings
      } else {
        // Return default settings if document doesn't exist
        return {
          enabled: false,
          lastModified: null,
          modifiedBy: 'system',
        }
      }
    } catch (error) {
      console.error('❌ Error getting AI automation settings:', error)
      throw error
    }
  }

  /**
   * Update AI automation settings
   */
  async updateSettings(
    enabled: boolean,
    userId: string,
    userName: string
  ): Promise<void> {
    try {
      // Update the new AI Settings Service first
      try {
        await AISettingsService.updateSettings(
          {
            automation: {
              masterEnabled: enabled,
              // Keep other automation settings unchanged
            },
          },
          `${userName} (${userId})`
        )
        console.log('✅ Updated AI Settings Service with master toggle')
      } catch (aiSettingsError) {
        console.warn(
          'Could not update AISettingsService, updating legacy only:',
          aiSettingsError
        )
      }

      // Also update legacy settings for backward compatibility
      const docRef = doc(db, this.SETTINGS_COLLECTION, this.AI_AUTOMATION_DOC)

      const settings: AIAutomationSettings = {
        enabled,
        lastModified: serverTimestamp(),
        modifiedBy: `${userName} (${userId})`,
      }

      await setDoc(docRef, settings, { merge: true })

      // Log the change
      console.log(
        `🤖 AI Automation ${enabled ? 'ENABLED' : 'DISABLED'} by ${userName}`
      )

      // Show appropriate toast message
      if (enabled) {
        toast.success('🤖 AI Operations Enabled - Automation is now active')
      } else {
        toast.warning('⚠️ AI Operations Disabled - Manual oversight required')
      }
    } catch (error) {
      console.error('❌ Error updating AI automation settings:', error)
      toast.error('Failed to update AI automation settings')
      throw error
    }
  }

  /**
   * Set up real-time listener for AI automation settings
   */
  subscribeToSettings(
    callback: (settings: AIAutomationSettings) => void,
    onError?: (error: Error) => void
  ): () => void {
    const docRef = doc(db, this.SETTINGS_COLLECTION, this.AI_AUTOMATION_DOC)

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const settings = docSnap.data() as AIAutomationSettings
          callback(settings)
        } else {
          // Document doesn't exist, use defaults
          callback({
            enabled: false,
            lastModified: null,
            modifiedBy: 'system',
          })
        }
      },
      (error) => {
        console.error('❌ Error in AI automation settings listener:', error)
        if (onError) {
          onError(error)
        }
      }
    )

    this.listeners.push(unsubscribe)
    return unsubscribe
  }

  /**
   * Check if AI automation is currently enabled
   */
  async isEnabled(): Promise<boolean> {
    try {
      const settings = await this.getSettings()
      return settings.enabled
    } catch (error) {
      console.error('❌ Error checking AI automation status:', error)
      // Default to disabled on error for safety
      return false
    }
  }

  /**
   * Initialize default settings if they don't exist
   */
  async initializeSettings(): Promise<void> {
    try {
      const docRef = doc(db, this.SETTINGS_COLLECTION, this.AI_AUTOMATION_DOC)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        console.log('🔧 Initializing AI automation settings with defaults')
        await setDoc(docRef, {
          enabled: false,
          lastModified: serverTimestamp(),
          modifiedBy: 'system',
        })
      }
    } catch (error) {
      console.error('❌ Error initializing AI automation settings:', error)
    }
  }

  /**
   * Cleanup all listeners
   */
  cleanup(): void {
    this.listeners.forEach((unsubscribe) => unsubscribe())
    this.listeners = []
    console.log('🧹 AI Automation Service listeners cleaned up')
  }
}

// Export singleton instance
const aiAutomationService = new AIAutomationService()
export default aiAutomationService
