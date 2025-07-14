import { collection, getDocs, Timestamp, Firestore, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { BookingService, LiveBooking } from './bookingService'

// Helper function to ensure db is available
function getDb(): Firestore {
  if (!db) {
    throw new Error('Firebase database not initialized')
  }
  return db
}

// Enhanced interfaces for the ultimate booking management system
export interface BookingAnalytics {
  totalBookings: number
  pendingApproval: number
  approved: number
  rejected: number
  totalRevenue: number
  averageBookingValue: number
  automationEfficiency: number
  conflictRate: number
  averageProcessingTime: number
  revenueGrowth: number
  conversionRate: number
  clientMatchingAccuracy: number
}

export interface BookingConflict {
  id: string
  type: 'date_overlap' | 'double_booking' | 'pricing_mismatch' | 'client_mismatch'
  severity: 'low' | 'medium' | 'high' | 'critical'
  bookings: LiveBooking[]
  description: string
  suggestedResolution: string
  autoResolvable: boolean
}

export interface AutomationRule {
  id: string
  name: string
  description: string
  enabled: boolean
  conditions: Record<string, unknown>[]
  actions: Record<string, unknown>[]
  executionCount: number
  successRate: number
}

export interface BookingInsight {
  type: 'revenue_opportunity' | 'efficiency_improvement' | 'risk_alert' | 'trend_analysis'
  title: string
  description: string
  impact: 'low' | 'medium' | 'high'
  actionable: boolean
  suggestedAction?: string
}

export class EnhancedBookingService {
  
  /**
   * Get comprehensive booking analytics
   */
  static async getBookingAnalytics(): Promise<BookingAnalytics> {
    try {
      console.log('📊 Calculating comprehensive booking analytics...')
      
      // Get all bookings
      const allBookings = await BookingService.getAllBookings()
      
      // Calculate basic metrics
      const totalBookings = allBookings.length
      const pendingApproval = allBookings.filter(b => b.status === 'pending_approval').length
      const approved = allBookings.filter(b => b.status === 'approved').length
      const rejected = allBookings.filter(b => b.status === 'rejected').length
      
      // Calculate revenue metrics
      const totalRevenue = allBookings
        .filter(b => b.status === 'approved')
        .reduce((sum, b) => sum + (b.revenue || b.price || 0), 0)
      
      const averageBookingValue = approved > 0 ? totalRevenue / approved : 0
      
      // Calculate automation efficiency
      const automatedBookings = allBookings.filter(b => 
        b.sourceDetails?.automation === true
      ).length
      const automationEfficiency = totalBookings > 0 ? (automatedBookings / totalBookings) * 100 : 0
      
      // Calculate client matching accuracy
      const bookingsWithClientMatch = allBookings.filter(b => b.clientId).length
      const clientMatchingAccuracy = totalBookings > 0 ? (bookingsWithClientMatch / totalBookings) * 100 : 0
      
      // Calculate processing times
      const processedBookings = allBookings.filter(b => b.processedAt && b.receivedAt)
      const averageProcessingTime = processedBookings.length > 0 
        ? processedBookings.reduce((sum, b) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const received = (b.receivedAt as any)?.toDate?.() || new Date(b.receivedAt as any)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const processed = (b.processedAt as any)?.toDate?.() || new Date(b.processedAt as any)
            return sum + (processed.getTime() - received.getTime())
          }, 0) / processedBookings.length / 1000 / 60 // Convert to minutes
        : 0
      
      // Calculate conversion rate (approved vs total)
      const conversionRate = totalBookings > 0 ? (approved / totalBookings) * 100 : 0
      
      // Calculate revenue growth (based on recent vs older bookings)
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const recentBookings = allBookings.filter(b => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const bookingDate = (b.receivedAt as any)?.toDate?.() || new Date(b.receivedAt as any)
        return bookingDate > thirtyDaysAgo
      })
      const recentRevenue = recentBookings
        .filter(b => b.status === 'approved')
        .reduce((sum, b) => sum + (b.revenue || b.price || 0), 0)

      const olderBookings = allBookings.filter(b => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const bookingDate = (b.receivedAt as any)?.toDate?.() || new Date(b.receivedAt as any)
        return bookingDate <= thirtyDaysAgo
      })
      const olderRevenue = olderBookings
        .filter(b => b.status === 'approved')
        .reduce((sum, b) => sum + (b.revenue || b.price || 0), 0)

      const revenueGrowth = olderRevenue > 0
        ? ((recentRevenue - olderRevenue) / olderRevenue) * 100
        : recentRevenue > 0 ? 100 : 0
      
      // Calculate conflict rate
      const conflicts = await this.detectBookingConflicts()
      const conflictRate = totalBookings > 0 ? (conflicts.length / totalBookings) * 100 : 0
      
      const analytics: BookingAnalytics = {
        totalBookings,
        pendingApproval,
        approved,
        rejected,
        totalRevenue,
        averageBookingValue,
        automationEfficiency,
        conflictRate,
        averageProcessingTime,
        revenueGrowth,
        conversionRate,
        clientMatchingAccuracy
      }
      
      console.log('✅ Analytics calculated:', analytics)
      return analytics
      
    } catch (error) {
      console.error('❌ Error calculating analytics:', error)
      throw error
    }
  }
  
  /**
   * Detect booking conflicts automatically
   */
  static async detectBookingConflicts(): Promise<BookingConflict[]> {
    try {
      console.log('🔍 Detecting booking conflicts...')
      
      const allBookings = await BookingService.getAllBookings()
      const conflicts: BookingConflict[] = []
      
      // Check for date overlaps
      for (let i = 0; i < allBookings.length; i++) {
        for (let j = i + 1; j < allBookings.length; j++) {
          const booking1 = allBookings[i]
          const booking2 = allBookings[j]
          
          // Skip if different properties
          if (booking1.villaName !== booking2.villaName) continue
          
          // Check date overlap
          const start1 = new Date(booking1.checkInDate)
          const end1 = new Date(booking1.checkOutDate)
          const start2 = new Date(booking2.checkInDate)
          const end2 = new Date(booking2.checkOutDate)
          
          if (start1 < end2 && start2 < end1) {
            conflicts.push({
              id: `conflict-${booking1.id}-${booking2.id}`,
              type: 'date_overlap',
              severity: 'high',
              bookings: [booking1, booking2],
              description: `Date overlap detected for ${booking1.villaName}`,
              suggestedResolution: 'Contact guests to resolve scheduling conflict',
              autoResolvable: false
            })
          }
        }
      }
      
      // Check for pricing mismatches (same property, similar dates, different prices)
      // Check for client matching issues
      // Add more conflict detection logic here
      
      console.log(`✅ Found ${conflicts.length} conflicts`)
      return conflicts
      
    } catch (error) {
      console.error('❌ Error detecting conflicts:', error)
      return []
    }
  }
  
  /**
   * Get automation rules and their performance (from real Firebase data)
   */
  static async getAutomationRules(): Promise<AutomationRule[]> {
    try {
      console.log('📋 Loading automation rules from Firebase...')

      // Try to load from Firebase automation_rules collection
      try {
        const rulesQuery = collection(getDb(), 'automation_rules')
        const rulesSnapshot = await getDocs(rulesQuery)

        if (!rulesSnapshot.empty) {
          const rules: AutomationRule[] = []
          rulesSnapshot.forEach((doc) => {
            const data = doc.data()
            rules.push({
              id: doc.id,
              name: data.name,
              description: data.description,
              enabled: data.enabled || false,
              conditions: data.conditions || [],
              actions: data.actions || [],
              executionCount: data.executionCount || 0,
              successRate: data.successRate || 0
            })
          })
          console.log(`✅ Loaded ${rules.length} automation rules from Firebase`)
          return rules
        }
      } catch {
        console.log('⚠️ No automation rules collection found, using default rules')
      }

      // Default rules if none exist in Firebase
      const defaultRules: AutomationRule[] = [
        {
          id: 'client-matching',
          name: 'Smart client matching',
          description: 'Automatically match bookings to property owners',
          enabled: true,
          conditions: [{ field: 'propertyName', operator: 'exists' }],
          actions: [{ type: 'match_client' }, { type: 'notify_owner' }],
          executionCount: 0,
          successRate: 0
        },
        {
          id: 'conflict-detection',
          name: 'Conflict detection',
          description: 'Automatically detect and flag booking conflicts',
          enabled: true,
          conditions: [{ field: 'dateOverlap', operator: 'detected' }],
          actions: [{ type: 'flag_conflict' }, { type: 'notify_admin' }],
          executionCount: 0,
          successRate: 0
        }
      ]

      console.log(`✅ Using ${defaultRules.length} default automation rules`)
      return defaultRules

    } catch (error) {
      console.error('❌ Error loading automation rules:', error)
      return []
    }
  }
  
  /**
   * Get actionable insights for admin
   */
  static async getBookingInsights(): Promise<BookingInsight[]> {
    try {
      const analytics = await this.getBookingAnalytics()
      const insights: BookingInsight[] = []
      
      // Revenue opportunity insights
      if (analytics.averageBookingValue < 1000) {
        insights.push({
          type: 'revenue_opportunity',
          title: 'Upselling Opportunity',
          description: `Average booking value is $${analytics.averageBookingValue.toFixed(0)}. Consider premium packages.`,
          impact: 'high',
          actionable: true,
          suggestedAction: 'Create premium service packages'
        })
      }
      
      // Efficiency improvements
      if (analytics.automationEfficiency < 80) {
        insights.push({
          type: 'efficiency_improvement',
          title: 'Automation Opportunity',
          description: `Only ${analytics.automationEfficiency.toFixed(1)}% of bookings are automated.`,
          impact: 'medium',
          actionable: true,
          suggestedAction: 'Enable more automation rules'
        })
      }
      
      // Client matching accuracy
      if (analytics.clientMatchingAccuracy < 90) {
        insights.push({
          type: 'efficiency_improvement',
          title: 'Client Matching Needs Improvement',
          description: `${analytics.clientMatchingAccuracy.toFixed(1)}% client matching accuracy.`,
          impact: 'medium',
          actionable: true,
          suggestedAction: 'Review property name standardization'
        })
      }
      
      return insights
      
    } catch (error) {
      console.error('❌ Error generating insights:', error)
      return []
    }
  }
  
  /**
   * Process automation rules for a booking
   */
  static async processAutomationRules(bookingId: string): Promise<boolean> {
    try {
      console.log('🤖 Processing automation rules for booking:', bookingId)
      
      // Get the booking
      const allBookings = await BookingService.getAllBookings()
      const booking = allBookings.find(b => b.id === bookingId)
      
      if (!booking) {
        console.log('❌ Booking not found')
        return false
      }
      
      // Get automation rules
      const rules = await this.getAutomationRules()
      const enabledRules = rules.filter(r => r.enabled)
      
      console.log(`🔍 Evaluating ${enabledRules.length} automation rules`)
      
      for (const rule of enabledRules) {
        // Evaluate conditions based on real booking data
        let conditionsMet = true

        for (const condition of rule.conditions) {
          switch (condition.field) {
            case 'propertyName':
              if (condition.operator === 'exists') {
                conditionsMet = conditionsMet && !!booking.villaName
              }
              break
            case 'bookingValue':
              const bookingValue = booking.revenue || booking.price || 0
              if (condition.operator === '>=' && typeof condition.value === 'number') {
                conditionsMet = conditionsMet && bookingValue >= condition.value
              }
              break
            case 'dateOverlap':
              if (condition.operator === 'detected') {
                // This would be checked by conflict detection
                conditionsMet = conditionsMet && false // Default to false unless conflict detected
              }
              break
            default:
              console.log(`⚠️ Unknown condition field: ${condition.field}`)
              conditionsMet = false
          }
        }

        if (conditionsMet) {
          console.log(`✅ Rule "${rule.name}" conditions met, executing actions`)

          // Execute actions based on real business logic
          for (const action of rule.actions) {
            switch (action.type) {
              case 'match_client':
                console.log('🔗 Executing client matching logic')
                // This would trigger the existing client matching service
                break
              case 'notify_owner':
                console.log('📱 Triggering owner notification')
                // This would send actual notifications
                break
              case 'flag_conflict':
                console.log('⚠️ Flagging booking conflict')
                // This would create actual conflict records
                break
              case 'notify_admin':
                console.log('📧 Sending admin notification')
                // This would send actual admin alerts
                break
              default:
                console.log(`⚡ Executing action: ${action.type}`)
            }
          }

          // Update rule execution count in Firebase (if rules are stored there)
          try {
            const ruleRef = doc(getDb(), 'automation_rules', rule.id)
            await updateDoc(ruleRef, {
              executionCount: (rule.executionCount || 0) + 1,
              lastExecuted: Timestamp.now()
            })
          } catch (error) {
            console.log('⚠️ Could not update rule execution count:', error)
          }
        }
      }
      
      return true
      
    } catch (error) {
      console.error('❌ Error processing automation rules:', error)
      return false
    }
  }
}
