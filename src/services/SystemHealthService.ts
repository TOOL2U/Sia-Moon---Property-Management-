/**
 * System Health Service
 * Monitors critical services and provides health status for Command Center
 */

import { getDb } from '@/lib/firebase'
import { collection, doc, getDoc, getDocs, limit, query } from 'firebase/firestore'

export type ServiceStatus = 'healthy' | 'warning' | 'error' | 'checking'

export interface ServiceHealth {
  name: string
  status: ServiceStatus
  responseTime: number // in milliseconds
  lastCheck: Date
  errorMessage?: string
  details?: Record<string, any>
}

export interface SystemHealthSummary {
  overall: ServiceStatus
  services: ServiceHealth[]
  lastUpdated: Date
  uptime: number // percentage
}

class SystemHealthService {
  private healthCache: Map<string, ServiceHealth> = new Map()
  private readonly CACHE_DURATION = 30000 // 30 seconds

  /**
   * Check all system services health
   */
  async checkAllServices(): Promise<SystemHealthSummary> {
    console.log('🔍 Checking all system services...')
    
    const services = await Promise.allSettled([
      this.checkFirebaseHealth(),
      this.checkAIServiceHealth(),
      this.checkMobileSyncHealth(),
      this.checkNotificationHealth(),
      this.checkCalendarHealth()
    ])

    const serviceResults: ServiceHealth[] = services.map((result, index) => {
      const serviceName = ['Firebase', 'AI Service', 'Mobile Sync', 'Notifications', 'Calendar'][index]
      
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        return {
          name: serviceName,
          status: 'error' as ServiceStatus,
          responseTime: 0,
          lastCheck: new Date(),
          errorMessage: result.reason?.message || 'Unknown error'
        }
      }
    })

    // Calculate overall status
    const overall = this.calculateOverallStatus(serviceResults)
    const uptime = this.calculateUptime(serviceResults)

    const summary: SystemHealthSummary = {
      overall,
      services: serviceResults,
      lastUpdated: new Date(),
      uptime
    }

    console.log(`✅ System health check complete: ${overall} (${uptime}% uptime)`)
    return summary
  }

  /**
   * Check Firebase/Firestore connectivity
   */
  async checkFirebaseHealth(): Promise<ServiceHealth> {
    const startTime = Date.now()
    
    try {
      const db = getDb()
      if (!db) {
        throw new Error('Firebase not initialized')
      }

      // Test read operation
      const testQuery = query(collection(db, 'staff_accounts'), limit(1))
      await getDocs(testQuery)

      const responseTime = Date.now() - startTime
      
      return {
        name: 'Firebase',
        status: responseTime < 1000 ? 'healthy' : 'warning',
        responseTime,
        lastCheck: new Date(),
        details: {
          database: 'connected',
          latency: `${responseTime}ms`
        }
      }
    } catch (error) {
      return {
        name: 'Firebase',
        status: 'error',
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown Firebase error'
      }
    }
  }

  /**
   * Check AI service endpoints
   */
  async checkAIServiceHealth(): Promise<ServiceHealth> {
    const startTime = Date.now()
    
    try {
      // Test AI COO endpoint
      const response = await fetch('/api/health/ai-service', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      const responseTime = Date.now() - startTime
      
      if (response.ok) {
        const data = await response.json()
        return {
          name: 'AI Service',
          status: responseTime < 2000 ? 'healthy' : 'warning',
          responseTime,
          lastCheck: new Date(),
          details: data
        }
      } else {
        throw new Error(`AI Service returned ${response.status}`)
      }
    } catch (error) {
      return {
        name: 'AI Service',
        status: 'error',
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
        errorMessage: error instanceof Error ? error.message : 'AI Service unavailable'
      }
    }
  }

  /**
   * Check mobile app sync status
   */
  async checkMobileSyncHealth(): Promise<ServiceHealth> {
    const startTime = Date.now()
    
    try {
      // Check recent staff location updates as proxy for mobile sync
      const db = getDb()
      if (!db) throw new Error('Database not available')

      const recentLocations = query(
        collection(db, 'staff_locations'),
        limit(5)
      )
      
      const snapshot = await getDocs(recentLocations)
      const responseTime = Date.now() - startTime
      
      // Check if we have recent location updates (within last 10 minutes)
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
      const recentUpdates = snapshot.docs.filter(doc => {
        const data = doc.data()
        const timestamp = data.timestamp?.toDate() || new Date(0)
        return timestamp > tenMinutesAgo
      })

      const status: ServiceStatus = recentUpdates.length > 0 ? 'healthy' : 'warning'
      
      return {
        name: 'Mobile Sync',
        status,
        responseTime,
        lastCheck: new Date(),
        details: {
          activeDevices: recentUpdates.length,
          totalLocations: snapshot.docs.length,
          lastUpdate: recentUpdates.length > 0 ? 'Recent' : 'Stale'
        }
      }
    } catch (error) {
      return {
        name: 'Mobile Sync',
        status: 'error',
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Mobile sync check failed'
      }
    }
  }

  /**
   * Check notification service
   */
  async checkNotificationHealth(): Promise<ServiceHealth> {
    const startTime = Date.now()
    
    try {
      // Test notification endpoint
      const response = await fetch('/api/health/notifications', {
        method: 'GET'
      })

      const responseTime = Date.now() - startTime
      
      if (response.ok) {
        return {
          name: 'Notifications',
          status: 'healthy',
          responseTime,
          lastCheck: new Date(),
          details: {
            service: 'operational'
          }
        }
      } else {
        throw new Error(`Notification service returned ${response.status}`)
      }
    } catch (error) {
      return {
        name: 'Notifications',
        status: 'warning', // Non-critical service
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Notification service unavailable'
      }
    }
  }

  /**
   * Check calendar integration
   */
  async checkCalendarHealth(): Promise<ServiceHealth> {
    const startTime = Date.now()
    
    try {
      const db = getDb()
      if (!db) throw new Error('Database not available')

      // Check if we have recent calendar events
      const eventsQuery = query(collection(db, 'calendarEvents'), limit(1))
      await getDocs(eventsQuery)

      const responseTime = Date.now() - startTime
      
      return {
        name: 'Calendar',
        status: 'healthy',
        responseTime,
        lastCheck: new Date(),
        details: {
          integration: 'active'
        }
      }
    } catch (error) {
      return {
        name: 'Calendar',
        status: 'warning',
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Calendar check failed'
      }
    }
  }

  /**
   * Calculate overall system status
   */
  private calculateOverallStatus(services: ServiceHealth[]): ServiceStatus {
    const errorCount = services.filter(s => s.status === 'error').length
    const warningCount = services.filter(s => s.status === 'warning').length
    
    if (errorCount > 1) return 'error' // Multiple critical failures
    if (errorCount === 1) return 'warning' // One critical failure
    if (warningCount > 2) return 'warning' // Multiple warnings
    
    return 'healthy'
  }

  /**
   * Calculate system uptime percentage
   */
  private calculateUptime(services: ServiceHealth[]): number {
    const healthyServices = services.filter(s => s.status === 'healthy').length
    return Math.round((healthyServices / services.length) * 100)
  }

  /**
   * Get cached health or check if expired
   */
  async getCachedHealth(serviceName: string): Promise<ServiceHealth | null> {
    const cached = this.healthCache.get(serviceName)
    if (!cached) return null
    
    const age = Date.now() - cached.lastCheck.getTime()
    if (age > this.CACHE_DURATION) {
      this.healthCache.delete(serviceName)
      return null
    }
    
    return cached
  }

  /**
   * Cache health result
   */
  private cacheHealth(health: ServiceHealth): void {
    this.healthCache.set(health.name, health)
  }
}

// Export singleton instance
export const systemHealthService = new SystemHealthService()
export default systemHealthService
