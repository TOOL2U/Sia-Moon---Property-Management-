/**
 * Multi-Model AI Logger - Comprehensive logging for multi-model AI interactions
 */

import { getDb } from '@/lib/firebase'
import { addDoc, collection, serverTimestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import { AIModel } from './aiRouter'

export interface MultiModelLogEntry {
  id?: string
  timestamp: any // Firestore timestamp
  sessionId: string
  userId: string
  userMessage: string
  aiResponse: string
  model: AIModel
  actualModel?: AIModel // In case of fallback
  taskType?: string
  routingReason?: string
  confidence?: number
  responseTime: number // milliseconds
  tokenUsage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
    cost?: number // Estimated cost in USD
  }
  success: boolean
  error?: string
  commandsDetected?: number
  commandsExecuted?: number
  executionResults?: Array<{
    commandId: string
    success: boolean
    message: string
  }>
  source: 'ai_chat' | 'api' | 'test'
  metadata?: Record<string, any>
}

export interface ModelUsageStats {
  totalInteractions: number
  modelUsage: Record<AIModel, number>
  averageResponseTime: number
  successRate: number
  commandExecutionRate: number
  topTaskTypes: Array<{ type: string; count: number }>
  totalCost: number
  recentActivity: MultiModelLogEntry[]
}

/**
 * Multi-Model AI Logger Service
 */
export class MultiModelLogger {
  private db = getDb()
  private logsCollection = collection(this.db, 'ai_multi_model_logs')

  /**
   * Log multi-model AI interaction
   */
  async logInteraction(entry: Omit<MultiModelLogEntry, 'id' | 'timestamp'>): Promise<string> {
    try {
      const logEntry: Omit<MultiModelLogEntry, 'id'> = {
        ...entry,
        timestamp: serverTimestamp()
      }

      const docRef = await addDoc(this.logsCollection, logEntry)
      
      console.log(`📊 MULTI-MODEL LOG: Logged interaction ${docRef.id} - ${entry.model} (${entry.responseTime}ms)`)
      
      return docRef.id
    } catch (error) {
      console.error('❌ MULTI-MODEL LOG: Failed to log interaction:', error)
      throw error
    }
  }

  /**
   * Log AI interaction with automatic timing and cost calculation
   */
  async logTimedInteraction(
    sessionId: string,
    userId: string,
    userMessage: string,
    startTime: number,
    result: {
      success: boolean
      response?: string
      model: AIModel
      actualModel?: AIModel
      error?: string
      tokenUsage?: any
      routingReason?: string
      confidence?: number
      taskType?: string
      commandsDetected?: number
      commandsExecuted?: number
      executionResults?: any[]
    },
    source: 'ai_chat' | 'api' | 'test' = 'ai_chat',
    metadata?: Record<string, any>
  ): Promise<string> {
    const responseTime = Date.now() - startTime

    // Calculate estimated cost
    let estimatedCost = 0
    if (result.tokenUsage) {
      const model = result.actualModel || result.model
      estimatedCost = this.calculateCost(model, result.tokenUsage)
    }

    return await this.logInteraction({
      sessionId,
      userId,
      userMessage: userMessage.substring(0, 1000), // Limit message length
      aiResponse: result.response?.substring(0, 2000) || '', // Limit response length
      model: result.model,
      actualModel: result.actualModel,
      taskType: result.taskType,
      routingReason: result.routingReason,
      confidence: result.confidence,
      responseTime,
      tokenUsage: result.tokenUsage ? {
        ...result.tokenUsage,
        cost: estimatedCost
      } : undefined,
      success: result.success,
      error: result.error,
      commandsDetected: result.commandsDetected || 0,
      commandsExecuted: result.commandsExecuted || 0,
      executionResults: result.executionResults || [],
      source,
      metadata
    })
  }

  /**
   * Calculate estimated cost for API usage
   */
  private calculateCost(model: AIModel, tokenUsage: any): number {
    // Pricing as of 2024 (approximate, in USD per 1K tokens)
    const pricing = {
      chatgpt: {
        input: 0.03,  // GPT-4 input
        output: 0.06  // GPT-4 output
      },
      claude: {
        input: 0.015, // Claude Sonnet input
        output: 0.075 // Claude Sonnet output
      }
    }

    if (!pricing[model as keyof typeof pricing]) return 0

    const modelPricing = pricing[model as keyof typeof pricing]
    const inputCost = (tokenUsage.promptTokens || 0) * modelPricing.input / 1000
    const outputCost = (tokenUsage.completionTokens || 0) * modelPricing.output / 1000

    return inputCost + outputCost
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(
    userId?: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<ModelUsageStats> {
    try {
      let q = query(this.logsCollection, orderBy('timestamp', 'desc'))
      
      if (userId) {
        q = query(q, where('userId', '==', userId))
      }
      
      if (timeRange) {
        q = query(q, where('timestamp', '>=', timeRange.start))
        q = query(q, where('timestamp', '<=', timeRange.end))
      }

      const snapshot = await getDocs(q)
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MultiModelLogEntry))

      // Calculate statistics
      const totalInteractions = logs.length
      const modelUsage: Record<string, number> = {}
      let totalResponseTime = 0
      let successCount = 0
      let commandExecutionCount = 0
      let totalCost = 0
      const taskTypeCounts: Record<string, number> = {}

      logs.forEach(log => {
        // Model usage
        const model = log.actualModel || log.model
        modelUsage[model] = (modelUsage[model] || 0) + 1

        // Response time
        totalResponseTime += log.responseTime

        // Success rate
        if (log.success) successCount++

        // Command execution
        if (log.commandsExecuted && log.commandsExecuted > 0) {
          commandExecutionCount++
        }

        // Cost tracking
        if (log.tokenUsage?.cost) {
          totalCost += log.tokenUsage.cost
        }

        // Task types
        if (log.taskType) {
          taskTypeCounts[log.taskType] = (taskTypeCounts[log.taskType] || 0) + 1
        }
      })

      const averageResponseTime = totalInteractions > 0 ? totalResponseTime / totalInteractions : 0
      const successRate = totalInteractions > 0 ? successCount / totalInteractions : 0
      const commandExecutionRate = totalInteractions > 0 ? commandExecutionCount / totalInteractions : 0

      const topTaskTypes = Object.entries(taskTypeCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      return {
        totalInteractions,
        modelUsage: modelUsage as Record<AIModel, number>,
        averageResponseTime,
        successRate,
        commandExecutionRate,
        totalCost,
        topTaskTypes,
        recentActivity: logs.slice(0, 10) // Last 10 interactions
      }
    } catch (error) {
      console.error('❌ MULTI-MODEL LOG: Failed to get usage stats:', error)
      throw error
    }
  }

  /**
   * Get model performance comparison
   */
  async getModelPerformance(timeRange?: { start: Date; end: Date }): Promise<{
    models: Array<{
      model: AIModel
      totalUses: number
      averageResponseTime: number
      successRate: number
      averageConfidence: number
      totalCost: number
      averageCostPerInteraction: number
    }>
  }> {
    try {
      let q = query(this.logsCollection, orderBy('timestamp', 'desc'))
      
      if (timeRange) {
        q = query(q, where('timestamp', '>=', timeRange.start))
        q = query(q, where('timestamp', '<=', timeRange.end))
      }

      const snapshot = await getDocs(q)
      const logs = snapshot.docs.map(doc => doc.data() as MultiModelLogEntry)

      const modelStats: Record<string, {
        uses: number
        totalResponseTime: number
        successes: number
        totalConfidence: number
        confidenceCount: number
        totalCost: number
      }> = {}

      logs.forEach(log => {
        const model = log.actualModel || log.model
        
        if (!modelStats[model]) {
          modelStats[model] = {
            uses: 0,
            totalResponseTime: 0,
            successes: 0,
            totalConfidence: 0,
            confidenceCount: 0,
            totalCost: 0
          }
        }

        const stats = modelStats[model]
        stats.uses++
        stats.totalResponseTime += log.responseTime
        if (log.success) stats.successes++
        if (log.confidence) {
          stats.totalConfidence += log.confidence
          stats.confidenceCount++
        }
        if (log.tokenUsage?.cost) {
          stats.totalCost += log.tokenUsage.cost
        }
      })

      const models = Object.entries(modelStats).map(([model, stats]) => ({
        model: model as AIModel,
        totalUses: stats.uses,
        averageResponseTime: stats.uses > 0 ? stats.totalResponseTime / stats.uses : 0,
        successRate: stats.uses > 0 ? stats.successes / stats.uses : 0,
        averageConfidence: stats.confidenceCount > 0 ? stats.totalConfidence / stats.confidenceCount : 0,
        totalCost: stats.totalCost,
        averageCostPerInteraction: stats.uses > 0 ? stats.totalCost / stats.uses : 0
      }))

      return { models }
    } catch (error) {
      console.error('❌ MULTI-MODEL LOG: Failed to get model performance:', error)
      throw error
    }
  }
}

// Singleton instance
let multiModelLogger: MultiModelLogger | null = null

/**
 * Get singleton instance of MultiModelLogger
 */
export function getMultiModelLogger(): MultiModelLogger {
  if (!multiModelLogger) {
    multiModelLogger = new MultiModelLogger()
  }
  return multiModelLogger
}

/**
 * Convenience function to log multi-model AI interaction
 */
export async function logMultiModelInteraction(
  sessionId: string,
  userId: string,
  userMessage: string,
  startTime: number,
  result: any,
  source: 'ai_chat' | 'api' | 'test' = 'ai_chat',
  metadata?: Record<string, any>
): Promise<string> {
  const logger = getMultiModelLogger()
  return await logger.logTimedInteraction(
    sessionId,
    userId,
    userMessage,
    startTime,
    result,
    source,
    metadata
  )
}
