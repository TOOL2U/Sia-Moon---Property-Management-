// AI API Logger - Tracks all AI endpoint usage, performance, and errors

import { promises as fs } from 'fs'
import path from 'path'

// Interface for API log entry
export interface AIAPILogEntry {
  id: string
  timestamp: string
  endpoint: string
  method: string
  payload: any
  status: number
  error: boolean
  errorMessage?: string
  responseTime?: number
  userAgent?: string
  ipAddress?: string
  requestSize?: number
  responseSize?: number
  metadata?: Record<string, any>
}

// Interface for API log data structure
interface APILogData {
  logs: AIAPILogEntry[]
  lastUpdated: string
  version: number
  totalRequests: number
  stats: {
    totalRequests: number
    successfulRequests: number
    errorRequests: number
    averageResponseTime: number
    endpointStats: Record<string, {
      count: number
      errors: number
      avgResponseTime: number
    }>
  }
}

// Path to the API log file
const API_LOG_PATH = path.join(process.cwd(), 'logs', 'ai_api.json')

/**
 * Ensure the API log file exists
 */
async function ensureAPILogFile(): Promise<void> {
  try {
    const logDir = path.dirname(API_LOG_PATH)
    
    // Create logs directory if it doesn't exist
    try {
      await fs.access(logDir)
    } catch {
      await fs.mkdir(logDir, { recursive: true })
      console.log('📁 Created logs directory for AI API monitoring')
    }
    
    // Create API log file if it doesn't exist
    try {
      await fs.access(API_LOG_PATH)
    } catch {
      const initialData: APILogData = {
        logs: [],
        lastUpdated: new Date().toISOString(),
        version: 1,
        totalRequests: 0,
        stats: {
          totalRequests: 0,
          successfulRequests: 0,
          errorRequests: 0,
          averageResponseTime: 0,
          endpointStats: {}
        }
      }
      await fs.writeFile(API_LOG_PATH, JSON.stringify(initialData, null, 2))
      console.log('📋 Created initial AI API log file')
    }
  } catch (error) {
    console.error('❌ Error ensuring API log file:', error)
    throw error
  }
}

/**
 * Read API log from file
 */
async function readAPILog(): Promise<APILogData> {
  try {
    await ensureAPILogFile()
    const fileContent = await fs.readFile(API_LOG_PATH, 'utf-8')
    const data = JSON.parse(fileContent) as APILogData
    
    // Ensure data has required fields
    if (!data.logs || !Array.isArray(data.logs)) {
      throw new Error('Invalid API log data structure')
    }
    
    return {
      logs: data.logs,
      lastUpdated: data.lastUpdated || new Date().toISOString(),
      version: data.version || 1,
      totalRequests: data.totalRequests || data.logs.length,
      stats: data.stats || {
        totalRequests: data.logs.length,
        successfulRequests: data.logs.filter(log => !log.error).length,
        errorRequests: data.logs.filter(log => log.error).length,
        averageResponseTime: 0,
        endpointStats: {}
      }
    }
  } catch (error) {
    console.error('❌ Error reading API log:', error)
    
    // Return empty log if file is corrupted
    return {
      logs: [],
      lastUpdated: new Date().toISOString(),
      version: 1,
      totalRequests: 0,
      stats: {
        totalRequests: 0,
        successfulRequests: 0,
        errorRequests: 0,
        averageResponseTime: 0,
        endpointStats: {}
      }
    }
  }
}

/**
 * Calculate statistics from logs
 */
function calculateStats(logs: AIAPILogEntry[]): APILogData['stats'] {
  const totalRequests = logs.length
  const successfulRequests = logs.filter(log => !log.error).length
  const errorRequests = logs.filter(log => log.error).length
  
  // Calculate average response time
  const responseTimes = logs.filter(log => log.responseTime).map(log => log.responseTime!)
  const averageResponseTime = responseTimes.length > 0 
    ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
    : 0
  
  // Calculate endpoint statistics
  const endpointStats: Record<string, { count: number; errors: number; avgResponseTime: number }> = {}
  
  logs.forEach(log => {
    if (!endpointStats[log.endpoint]) {
      endpointStats[log.endpoint] = { count: 0, errors: 0, avgResponseTime: 0 }
    }
    
    endpointStats[log.endpoint].count++
    if (log.error) {
      endpointStats[log.endpoint].errors++
    }
  })
  
  // Calculate average response time per endpoint
  Object.keys(endpointStats).forEach(endpoint => {
    const endpointLogs = logs.filter(log => log.endpoint === endpoint && log.responseTime)
    if (endpointLogs.length > 0) {
      const avgTime = endpointLogs.reduce((sum, log) => sum + (log.responseTime || 0), 0) / endpointLogs.length
      endpointStats[endpoint].avgResponseTime = avgTime
    }
  })
  
  return {
    totalRequests,
    successfulRequests,
    errorRequests,
    averageResponseTime,
    endpointStats
  }
}

/**
 * Write API log to file
 */
async function writeAPILog(logs: AIAPILogEntry[]): Promise<APILogData> {
  try {
    await ensureAPILogFile()
    
    // Read current data to preserve version
    const currentData = await readAPILog()
    
    const stats = calculateStats(logs)
    
    const newData: APILogData = {
      logs: logs.map((log, index) => ({
        ...log,
        id: log.id || `api-${Date.now()}-${index}`
      })),
      lastUpdated: new Date().toISOString(),
      version: currentData.version + 1,
      totalRequests: logs.length,
      stats
    }
    
    await fs.writeFile(API_LOG_PATH, JSON.stringify(newData, null, 2))
    console.log('💾 Updated AI API log, version:', newData.version)
    
    return newData
  } catch (error) {
    console.error('❌ Error writing API log:', error)
    throw error
  }
}

/**
 * Log an AI API call - Main function as specified in Prompt 16
 */
export async function logAIAPICall({
  endpoint,
  method = 'POST',
  payload,
  status,
  error,
  errorMessage,
  responseTime,
  userAgent,
  ipAddress,
  requestSize,
  responseSize,
  metadata
}: {
  endpoint: string
  method?: string
  payload: any
  status: number
  error: boolean
  errorMessage?: string
  responseTime?: number
  userAgent?: string
  ipAddress?: string
  requestSize?: number
  responseSize?: number
  metadata?: Record<string, any>
}): Promise<string> {
  try {
    console.log(`📊 API Logger: Logging call to ${endpoint}`)
    
    const currentData = await readAPILog()
    
    // Generate unique ID for the log entry
    const logId = `api-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    
    // Create sanitized payload (remove sensitive data)
    const sanitizedPayload = sanitizePayload(payload)
    
    const newLogEntry: AIAPILogEntry = {
      id: logId,
      timestamp: new Date().toISOString(),
      endpoint,
      method,
      payload: sanitizedPayload,
      status,
      error,
      errorMessage,
      responseTime,
      userAgent,
      ipAddress,
      requestSize: requestSize || JSON.stringify(payload).length,
      responseSize,
      metadata
    }
    
    // Add new log entry to the beginning of the list (most recent first)
    const updatedLogs = [newLogEntry, ...currentData.logs]
    
    // Keep only the last 1000 entries to prevent file from growing too large
    const trimmedLogs = updatedLogs.slice(0, 1000)
    
    await writeAPILog(trimmedLogs)
    
    console.log(`✅ API Logger: Entry saved with ID: ${logId}`)
    
    return logId
    
  } catch (error) {
    console.error('❌ API Logger: Error saving log entry:', error)
    throw new Error(`Failed to log API call: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get API log entries with filtering and pagination
 */
export async function getAPILogEntries(
  options: {
    limit?: number
    offset?: number
    endpoint?: string
    status?: number
    error?: boolean
    startDate?: string
    endDate?: string
  } = {}
): Promise<{
  logs: AIAPILogEntry[]
  total: number
  hasMore: boolean
  stats: APILogData['stats']
}> {
  try {
    const {
      limit = 50,
      offset = 0,
      endpoint,
      status,
      error,
      startDate,
      endDate
    } = options
    
    console.log('📊 API Logger: Getting log entries with filters:', options)
    
    const data = await readAPILog()
    let filteredLogs = data.logs
    
    // Apply filters
    if (endpoint) {
      filteredLogs = filteredLogs.filter(log => log.endpoint === endpoint)
    }
    
    if (status !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.status === status)
    }
    
    if (error !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.error === error)
    }
    
    if (startDate) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) >= new Date(startDate)
      )
    }
    
    if (endDate) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) <= new Date(endDate)
      )
    }
    
    // Apply pagination
    const total = filteredLogs.length
    const paginatedLogs = filteredLogs.slice(offset, offset + limit)
    const hasMore = offset + limit < total
    
    console.log(`📊 API Logger: Returning ${paginatedLogs.length} of ${total} log entries`)
    
    return {
      logs: paginatedLogs,
      total,
      hasMore,
      stats: data.stats
    }
    
  } catch (error) {
    console.error('❌ API Logger: Error getting log entries:', error)
    throw new Error(`Failed to get API log entries: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Sanitize payload to remove sensitive information
 */
function sanitizePayload(payload: any): any {
  if (!payload || typeof payload !== 'object') {
    return payload
  }
  
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth', 'credential']
  const sanitized = { ...payload }
  
  // Remove or mask sensitive fields
  Object.keys(sanitized).forEach(key => {
    const keyLower = key.toLowerCase()
    if (sensitiveFields.some(field => keyLower.includes(field))) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizePayload(sanitized[key])
    }
  })
  
  return sanitized
}

/**
 * Get API usage statistics
 */
export async function getAPIUsageStats(): Promise<{
  totalRequests: number
  successRate: number
  errorRate: number
  averageResponseTime: number
  topEndpoints: Array<{
    endpoint: string
    count: number
    errorRate: number
    avgResponseTime: number
  }>
  recentActivity: Array<{
    hour: string
    requests: number
    errors: number
  }>
}> {
  try {
    console.log('📈 API Logger: Generating usage statistics')
    
    const data = await readAPILog()
    const logs = data.logs
    
    const totalRequests = logs.length
    const successfulRequests = logs.filter(log => !log.error).length
    const errorRequests = logs.filter(log => log.error).length
    
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0
    const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0
    
    // Calculate average response time
    const responseTimes = logs.filter(log => log.responseTime).map(log => log.responseTime!)
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0
    
    // Get top endpoints
    const topEndpoints = Object.entries(data.stats.endpointStats)
      .map(([endpoint, stats]) => ({
        endpoint,
        count: stats.count,
        errorRate: stats.count > 0 ? (stats.errors / stats.count) * 100 : 0,
        avgResponseTime: stats.avgResponseTime
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
    
    // Calculate recent activity (last 24 hours by hour)
    const recentActivity = []
    const now = new Date()
    
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now)
      hour.setHours(hour.getHours() - i, 0, 0, 0)
      const nextHour = new Date(hour)
      nextHour.setHours(nextHour.getHours() + 1)
      
      const hourLogs = logs.filter(log => {
        const logTime = new Date(log.timestamp)
        return logTime >= hour && logTime < nextHour
      })
      
      recentActivity.push({
        hour: hour.toISOString().substring(11, 16), // HH:MM format
        requests: hourLogs.length,
        errors: hourLogs.filter(log => log.error).length
      })
    }
    
    return {
      totalRequests,
      successRate,
      errorRate,
      averageResponseTime,
      topEndpoints,
      recentActivity
    }
    
  } catch (error) {
    console.error('❌ API Logger: Error generating usage statistics:', error)
    throw new Error(`Failed to generate API usage statistics: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Save to storage (abstraction for future database integration)
 */
async function saveToStorage(collection: string, data: any): Promise<void> {
  // For now, this is handled by the file-based logging above
  // In production, this could be extended to save to Supabase or other databases
  console.log(`💾 Saving to storage collection: ${collection}`)
}
