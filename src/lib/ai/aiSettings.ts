// AI Settings Management - Central configuration for all AI agents

import { promises as fs } from 'fs'
import path from 'path'

// Interface for AI settings
export interface AISettings {
  temperature: number
  escalationThreshold: number
  simulationMode: boolean
  fallbackMessage: string
  maxTokens: number
  timeoutMs: number
  retryAttempts: number
  confidenceBoost: number
  debugMode: boolean
  modelVersion: string
  customPromptSuffix: string
  rateLimit: {
    requestsPerMinute: number
    enabled: boolean
  }
  security: {
    requireAuth: boolean
    allowedIPs: string[]
    logAllRequests: boolean
  }
}

// Default AI settings
export const DEFAULT_AI_SETTINGS: AISettings = {
  temperature: 0.4,
  escalationThreshold: 0.75,
  simulationMode: process.env.NODE_ENV !== 'production',
  fallbackMessage: "I apologize, but I'm unable to process this request at the moment. Please contact our support team for assistance.",
  maxTokens: 2000,
  timeoutMs: 30000,
  retryAttempts: 3,
  confidenceBoost: 0.0,
  debugMode: process.env.NODE_ENV === 'development',
  modelVersion: "gpt-4",
  customPromptSuffix: "",
  rateLimit: {
    requestsPerMinute: 60,
    enabled: true
  },
  security: {
    requireAuth: true,
    allowedIPs: [],
    logAllRequests: true
  }
}

// Path to the AI settings file
const AI_SETTINGS_PATH = path.join(process.cwd(), 'config', 'aiSettings.json')

// Interface for settings data structure
interface AISettingsData {
  settings: AISettings
  lastUpdated: string
  version: number
  updatedBy?: string
  changelog: Array<{
    timestamp: string
    changes: Partial<AISettings>
    updatedBy?: string
    reason?: string
  }>
}

/**
 * Ensure the AI settings file exists
 */
async function ensureAISettingsFile(): Promise<void> {
  try {
    const configDir = path.dirname(AI_SETTINGS_PATH)
    
    // Create config directory if it doesn't exist
    try {
      await fs.access(configDir)
    } catch {
      await fs.mkdir(configDir, { recursive: true })
      console.log('📁 Created config directory for AI settings')
    }
    
    // Create AI settings file if it doesn't exist
    try {
      await fs.access(AI_SETTINGS_PATH)
    } catch {
      const initialData: AISettingsData = {
        settings: DEFAULT_AI_SETTINGS,
        lastUpdated: new Date().toISOString(),
        version: 1,
        changelog: [{
          timestamp: new Date().toISOString(),
          changes: DEFAULT_AI_SETTINGS,
          reason: 'Initial settings creation'
        }]
      }
      await fs.writeFile(AI_SETTINGS_PATH, JSON.stringify(initialData, null, 2))
      console.log('⚙️ Created initial AI settings file')
    }
  } catch (error) {
    console.error('❌ Error ensuring AI settings file:', error)
    throw error
  }
}

/**
 * Read AI settings from file
 */
async function readAISettings(): Promise<AISettingsData> {
  try {
    await ensureAISettingsFile()
    const fileContent = await fs.readFile(AI_SETTINGS_PATH, 'utf-8')
    const data = JSON.parse(fileContent) as AISettingsData
    
    // Ensure data has required fields and merge with defaults
    const settings = { ...DEFAULT_AI_SETTINGS, ...data.settings }
    
    return {
      settings,
      lastUpdated: data.lastUpdated || new Date().toISOString(),
      version: data.version || 1,
      updatedBy: data.updatedBy,
      changelog: data.changelog || []
    }
  } catch (error) {
    console.error('❌ Error reading AI settings:', error)
    
    // Return default settings if file is corrupted
    return {
      settings: DEFAULT_AI_SETTINGS,
      lastUpdated: new Date().toISOString(),
      version: 1,
      changelog: []
    }
  }
}

/**
 * Write AI settings to file
 */
async function writeAISettings(
  settings: AISettings, 
  updatedBy?: string, 
  reason?: string,
  changes?: Partial<AISettings>
): Promise<AISettingsData> {
  try {
    await ensureAISettingsFile()
    
    // Read current data to preserve version and changelog
    const currentData = await readAISettings()
    
    const newData: AISettingsData = {
      settings,
      lastUpdated: new Date().toISOString(),
      version: currentData.version + 1,
      updatedBy,
      changelog: [
        {
          timestamp: new Date().toISOString(),
          changes: changes || settings,
          updatedBy,
          reason
        },
        ...currentData.changelog.slice(0, 49) // Keep last 50 changelog entries
      ]
    }
    
    await fs.writeFile(AI_SETTINGS_PATH, JSON.stringify(newData, null, 2))
    console.log('💾 Updated AI settings, version:', newData.version)
    
    return newData
  } catch (error) {
    console.error('❌ Error writing AI settings:', error)
    throw error
  }
}

/**
 * Get current AI settings - Main function used by AI agents
 */
export async function getAISettings(): Promise<AISettings> {
  try {
    console.log('⚙️ AI Settings: Loading current configuration...')
    
    const data = await readAISettings()
    
    console.log(`✅ AI Settings: Loaded version ${data.version}`)
    
    return data.settings
    
  } catch (error) {
    console.error('❌ AI Settings: Error loading settings, using defaults:', error)
    return DEFAULT_AI_SETTINGS
  }
}

/**
 * Update AI settings with validation
 */
export async function updateAISettings(
  newSettings: Partial<AISettings>,
  updatedBy?: string,
  reason?: string
): Promise<{
  success: boolean
  settings: AISettings
  version: number
  errors?: string[]
}> {
  try {
    console.log('⚙️ AI Settings: Updating configuration...')
    
    // Validate settings
    const validationErrors = validateAISettings(newSettings)
    if (validationErrors.length > 0) {
      return {
        success: false,
        settings: DEFAULT_AI_SETTINGS,
        version: 0,
        errors: validationErrors
      }
    }
    
    // Get current settings and merge with updates
    const currentData = await readAISettings()
    const updatedSettings: AISettings = {
      ...currentData.settings,
      ...newSettings
    }
    
    // Save updated settings
    const savedData = await writeAISettings(updatedSettings, updatedBy, reason, newSettings)
    
    console.log(`✅ AI Settings: Updated successfully to version ${savedData.version}`)
    
    return {
      success: true,
      settings: savedData.settings,
      version: savedData.version
    }
    
  } catch (error) {
    console.error('❌ AI Settings: Error updating settings:', error)
    
    return {
      success: false,
      settings: DEFAULT_AI_SETTINGS,
      version: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }
  }
}

/**
 * Validate AI settings
 */
function validateAISettings(settings: Partial<AISettings>): string[] {
  const errors: string[] = []
  
  // Validate temperature
  if (settings.temperature !== undefined) {
    if (typeof settings.temperature !== 'number' || settings.temperature < 0 || settings.temperature > 2) {
      errors.push('Temperature must be a number between 0 and 2')
    }
  }
  
  // Validate escalation threshold
  if (settings.escalationThreshold !== undefined) {
    if (typeof settings.escalationThreshold !== 'number' || settings.escalationThreshold < 0 || settings.escalationThreshold > 1) {
      errors.push('Escalation threshold must be a number between 0 and 1')
    }
  }
  
  // Validate simulation mode
  if (settings.simulationMode !== undefined) {
    if (typeof settings.simulationMode !== 'boolean') {
      errors.push('Simulation mode must be a boolean')
    }
  }
  
  // Validate fallback message
  if (settings.fallbackMessage !== undefined) {
    if (typeof settings.fallbackMessage !== 'string' || settings.fallbackMessage.length < 10) {
      errors.push('Fallback message must be a string with at least 10 characters')
    }
  }
  
  // Validate max tokens
  if (settings.maxTokens !== undefined) {
    if (typeof settings.maxTokens !== 'number' || settings.maxTokens < 100 || settings.maxTokens > 8000) {
      errors.push('Max tokens must be a number between 100 and 8000')
    }
  }
  
  // Validate timeout
  if (settings.timeoutMs !== undefined) {
    if (typeof settings.timeoutMs !== 'number' || settings.timeoutMs < 1000 || settings.timeoutMs > 120000) {
      errors.push('Timeout must be a number between 1000 and 120000 milliseconds')
    }
  }
  
  // Validate retry attempts
  if (settings.retryAttempts !== undefined) {
    if (typeof settings.retryAttempts !== 'number' || settings.retryAttempts < 0 || settings.retryAttempts > 10) {
      errors.push('Retry attempts must be a number between 0 and 10')
    }
  }
  
  // Validate confidence boost
  if (settings.confidenceBoost !== undefined) {
    if (typeof settings.confidenceBoost !== 'number' || settings.confidenceBoost < -0.5 || settings.confidenceBoost > 0.5) {
      errors.push('Confidence boost must be a number between -0.5 and 0.5')
    }
  }
  
  return errors
}

/**
 * Get AI settings changelog
 */
export async function getAISettingsChangelog(): Promise<AISettingsData['changelog']> {
  try {
    const data = await readAISettings()
    return data.changelog
  } catch (error) {
    console.error('❌ AI Settings: Error getting changelog:', error)
    return []
  }
}

/**
 * Reset AI settings to defaults
 */
export async function resetAISettings(updatedBy?: string): Promise<{
  success: boolean
  settings: AISettings
  version: number
}> {
  try {
    console.log('🔄 AI Settings: Resetting to defaults...')
    
    const savedData = await writeAISettings(
      DEFAULT_AI_SETTINGS, 
      updatedBy, 
      'Reset to default settings',
      DEFAULT_AI_SETTINGS
    )
    
    console.log(`✅ AI Settings: Reset to defaults, version ${savedData.version}`)
    
    return {
      success: true,
      settings: savedData.settings,
      version: savedData.version
    }
    
  } catch (error) {
    console.error('❌ AI Settings: Error resetting settings:', error)
    
    return {
      success: false,
      settings: DEFAULT_AI_SETTINGS,
      version: 0
    }
  }
}
