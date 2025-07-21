/**
 * AI Memory System - Persistent memory for AI agents
 * Stores context, preferences, and command history for intelligent decision making
 */

import { getDb } from '@/lib/firebase'
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  serverTimestamp,
  collection,
  addDoc
} from 'firebase/firestore'

export interface AICommand {
  id: string
  type: string
  description: string
  data: Record<string, any>
  timestamp: any // Firestore timestamp
  status: 'pending' | 'approved' | 'rejected' | 'executed'
  executionResult?: {
    success: boolean
    message: string
    details?: any
  }
}

export interface RejectedSuggestion {
  id: string
  suggestion: string
  reason?: string
  timestamp: any // Firestore timestamp
  context?: Record<string, any>
}

export interface AIPreferences {
  defaultStaffAssignments: Record<string, string> // propertyId -> staffId
  preferredSchedulingTimes: Record<string, string> // taskType -> timeSlot
  communicationStyle: 'formal' | 'casual' | 'detailed' | 'concise'
  autoApprovalThreshold: number // 0-100, confidence threshold for auto-approval
  notificationPreferences: {
    emailOnCommand: boolean
    emailOnRejection: boolean
    slackIntegration: boolean
  }
  customRules: Array<{
    condition: string
    action: string
    priority: number
  }>
}

export interface AIMemoryData {
  adminId: string
  sessionId?: string
  recentCommands: AICommand[]
  rejectedSuggestions: RejectedSuggestion[]
  preferences: AIPreferences
  conversationContext: Array<{
    message: string
    response: string
    timestamp: any
    model: string
  }>
  lastUpdated: any // Firestore timestamp
  createdAt: any // Firestore timestamp
  version: number
}

/**
 * Default AI preferences
 */
const DEFAULT_PREFERENCES: AIPreferences = {
  defaultStaffAssignments: {},
  preferredSchedulingTimes: {
    cleaning: '09:00',
    maintenance: '10:00',
    inspection: '14:00'
  },
  communicationStyle: 'detailed',
  autoApprovalThreshold: 85,
  notificationPreferences: {
    emailOnCommand: true,
    emailOnRejection: true,
    slackIntegration: false
  },
  customRules: []
}

/**
 * AI Memory Service
 */
export class AIMemoryService {
  private db = getDb()
  private memoryCollection = collection(this.db, 'ai_memory')
  private auditCollection = collection(this.db, 'ai_memory_audit')

  /**
   * Get AI memory for admin
   */
  async getMemory(adminId: string): Promise<AIMemoryData> {
    try {
      const memoryRef = doc(this.memoryCollection, adminId)
      const memorySnap = await getDoc(memoryRef)

      if (memorySnap.exists()) {
        return memorySnap.data() as AIMemoryData
      } else {
        // Create new memory document
        const newMemory: AIMemoryData = {
          adminId,
          recentCommands: [],
          rejectedSuggestions: [],
          preferences: DEFAULT_PREFERENCES,
          conversationContext: [],
          lastUpdated: serverTimestamp(),
          createdAt: serverTimestamp(),
          version: 1
        }

        await setDoc(memoryRef, newMemory)
        console.log(`🧠 AI MEMORY: Created new memory for admin ${adminId}`)
        
        return newMemory
      }
    } catch (error) {
      console.error('❌ AI MEMORY: Failed to get memory:', error)
      throw error
    }
  }

  /**
   * Add command to memory
   */
  async addCommand(
    adminId: string, 
    command: Omit<AICommand, 'id' | 'timestamp'>
  ): Promise<string> {
    try {
      const commandWithId: AICommand = {
        ...command,
        id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: serverTimestamp()
      }

      const memoryRef = doc(this.memoryCollection, adminId)
      
      await updateDoc(memoryRef, {
        recentCommands: arrayUnion(commandWithId),
        lastUpdated: serverTimestamp(),
        version: serverTimestamp() // Use timestamp as version for simplicity
      })

      // Keep only last 50 commands
      const memory = await this.getMemory(adminId)
      if (memory.recentCommands.length > 50) {
        const oldestCommands = memory.recentCommands.slice(0, -50)
        await updateDoc(memoryRef, {
          recentCommands: arrayRemove(...oldestCommands)
        })
      }

      // Audit log
      await this.logAuditEvent(adminId, 'command_added', {
        commandId: commandWithId.id,
        commandType: command.type,
        description: command.description
      })

      console.log(`🧠 AI MEMORY: Added command ${commandWithId.id} for admin ${adminId}`)
      return commandWithId.id

    } catch (error) {
      console.error('❌ AI MEMORY: Failed to add command:', error)
      throw error
    }
  }

  /**
   * Update command status
   */
  async updateCommandStatus(
    adminId: string,
    commandId: string,
    status: AICommand['status'],
    executionResult?: AICommand['executionResult']
  ): Promise<void> {
    try {
      const memory = await this.getMemory(adminId)
      const updatedCommands = memory.recentCommands.map(cmd => 
        cmd.id === commandId 
          ? { ...cmd, status, executionResult, timestamp: serverTimestamp() }
          : cmd
      )

      const memoryRef = doc(this.memoryCollection, adminId)
      await updateDoc(memoryRef, {
        recentCommands: updatedCommands,
        lastUpdated: serverTimestamp()
      })

      // Audit log
      await this.logAuditEvent(adminId, 'command_updated', {
        commandId,
        newStatus: status,
        executionResult
      })

      console.log(`🧠 AI MEMORY: Updated command ${commandId} status to ${status}`)

    } catch (error) {
      console.error('❌ AI MEMORY: Failed to update command status:', error)
      throw error
    }
  }

  /**
   * Add rejected suggestion
   */
  async addRejectedSuggestion(
    adminId: string,
    suggestion: string,
    reason?: string,
    context?: Record<string, any>
  ): Promise<string> {
    try {
      const rejectedSuggestion: RejectedSuggestion = {
        id: `rej_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        suggestion,
        reason,
        context,
        timestamp: serverTimestamp()
      }

      const memoryRef = doc(this.memoryCollection, adminId)
      
      await updateDoc(memoryRef, {
        rejectedSuggestions: arrayUnion(rejectedSuggestion),
        lastUpdated: serverTimestamp()
      })

      // Keep only last 20 rejected suggestions
      const memory = await this.getMemory(adminId)
      if (memory.rejectedSuggestions.length > 20) {
        const oldestRejections = memory.rejectedSuggestions.slice(0, -20)
        await updateDoc(memoryRef, {
          rejectedSuggestions: arrayRemove(...oldestRejections)
        })
      }

      // Audit log
      await this.logAuditEvent(adminId, 'suggestion_rejected', {
        suggestionId: rejectedSuggestion.id,
        suggestion,
        reason
      })

      console.log(`🧠 AI MEMORY: Added rejected suggestion for admin ${adminId}`)
      return rejectedSuggestion.id

    } catch (error) {
      console.error('❌ AI MEMORY: Failed to add rejected suggestion:', error)
      throw error
    }
  }

  /**
   * Update preferences
   */
  async updatePreferences(
    adminId: string,
    preferences: Partial<AIPreferences>
  ): Promise<void> {
    try {
      const memoryRef = doc(this.memoryCollection, adminId)
      
      await updateDoc(memoryRef, {
        preferences: {
          ...DEFAULT_PREFERENCES,
          ...preferences
        },
        lastUpdated: serverTimestamp()
      })

      // Audit log
      await this.logAuditEvent(adminId, 'preferences_updated', {
        updatedFields: Object.keys(preferences),
        preferences
      })

      console.log(`🧠 AI MEMORY: Updated preferences for admin ${adminId}`)

    } catch (error) {
      console.error('❌ AI MEMORY: Failed to update preferences:', error)
      throw error
    }
  }

  /**
   * Add conversation context
   */
  async addConversationContext(
    adminId: string,
    message: string,
    response: string,
    model: string
  ): Promise<void> {
    try {
      const contextEntry = {
        message: message.substring(0, 500), // Limit length
        response: response.substring(0, 1000), // Limit length
        timestamp: serverTimestamp(),
        model
      }

      const memoryRef = doc(this.memoryCollection, adminId)
      
      await updateDoc(memoryRef, {
        conversationContext: arrayUnion(contextEntry),
        lastUpdated: serverTimestamp()
      })

      // Keep only last 20 conversation entries
      const memory = await this.getMemory(adminId)
      if (memory.conversationContext.length > 20) {
        const oldestContext = memory.conversationContext.slice(0, -20)
        await updateDoc(memoryRef, {
          conversationContext: arrayRemove(...oldestContext)
        })
      }

      console.log(`🧠 AI MEMORY: Added conversation context for admin ${adminId}`)

    } catch (error) {
      console.error('❌ AI MEMORY: Failed to add conversation context:', error)
      throw error
    }
  }

  /**
   * Clear memory (with confirmation)
   */
  async clearMemory(
    adminId: string,
    type: 'all' | 'commands' | 'suggestions' | 'context' | 'preferences'
  ): Promise<void> {
    try {
      const memoryRef = doc(this.memoryCollection, adminId)
      const updates: any = { lastUpdated: serverTimestamp() }

      switch (type) {
        case 'all':
          updates.recentCommands = []
          updates.rejectedSuggestions = []
          updates.conversationContext = []
          updates.preferences = DEFAULT_PREFERENCES
          break
        case 'commands':
          updates.recentCommands = []
          break
        case 'suggestions':
          updates.rejectedSuggestions = []
          break
        case 'context':
          updates.conversationContext = []
          break
        case 'preferences':
          updates.preferences = DEFAULT_PREFERENCES
          break
      }

      await updateDoc(memoryRef, updates)

      // Audit log
      await this.logAuditEvent(adminId, 'memory_cleared', { type })

      console.log(`🧠 AI MEMORY: Cleared ${type} memory for admin ${adminId}`)

    } catch (error) {
      console.error('❌ AI MEMORY: Failed to clear memory:', error)
      throw error
    }
  }

  /**
   * Log audit event
   */
  private async logAuditEvent(
    adminId: string,
    action: string,
    details: Record<string, any>
  ): Promise<void> {
    try {
      await addDoc(this.auditCollection, {
        adminId,
        action,
        details,
        timestamp: serverTimestamp(),
        source: 'ai_memory_system'
      })
    } catch (error) {
      console.error('❌ AI MEMORY: Failed to log audit event:', error)
      // Don't throw - audit logging shouldn't break main functionality
    }
  }
}

// Singleton instance
let aiMemoryService: AIMemoryService | null = null

/**
 * Get singleton instance of AIMemoryService
 */
export function getAIMemoryService(): AIMemoryService {
  if (!aiMemoryService) {
    aiMemoryService = new AIMemoryService()
  }
  return aiMemoryService
}
