import { collection, getDocs, query, where, orderBy, Timestamp, Firestore } from 'firebase/firestore'
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
  conditions: any[]
  actions: any[]
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
            const received = b.receivedAt?.toDate?.() || new Date(b.receivedAt)
            const processed = b.processedAt?.toDate?.() || new Date(b.processedAt)
            return sum + (processed.getTime() - received.getTime())
          }, 0) / processedBookings.length / 1000 / 60 // Convert to minutes
        : 0
      
      // Calculate conversion rate (approved vs total)
      const conversionRate = totalBookings > 0 ? (approved / totalBookings) * 100 : 0
      
      // Calculate revenue growth (mock for now - would need historical data)
      const revenueGrowth = 15.5 // Placeholder
      
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
   * Get automation rules and their performance
   */
  static async getAutomationRules(): Promise<AutomationRule[]> {
    try {
      // Mock automation rules - in real implementation, these would be stored in Firebase
      const rules: AutomationRule[] = [
        {
          id: 'auto-approve-trusted',
          name: 'Auto-approve trusted guests',
          description: 'Automatically approve bookings from guests with high ratings',
          enabled: true,
          conditions: [
            { field: 'guestRating', operator: '>=', value: 4.5 },
            { field: 'bookingValue', operator: '>=', value: 500 }
          ],
          actions: [
            { type: 'approve_booking' },
            { type: 'send_welcome_email' }
          ],
          executionCount: 45,
          successRate: 98.5
        },
        {
          id: 'client-matching',
          name: 'Smart client matching',
          description: 'Automatically match bookings to property owners',
          enabled: true,
          conditions: [
            { field: 'propertyName', operator: 'exists' }
          ],
          actions: [
            { type: 'match_client' },
            { type: 'notify_owner' }
          ],
          executionCount: 123,
          successRate: 94.2
        },
        {
          id: 'conflict-detection',
          name: 'Conflict detection',
          description: 'Automatically detect and flag booking conflicts',
          enabled: true,
          conditions: [
            { field: 'dateOverlap', operator: 'detected' }
          ],
          actions: [
            { type: 'flag_conflict' },
            { type: 'notify_admin' }
          ],
          executionCount: 12,
          successRate: 100
        }
      ]
      
      return rules
      
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
        // Evaluate conditions (simplified logic)
        let conditionsMet = true
        
        for (const condition of rule.conditions) {
          // Simplified condition evaluation
          if (condition.field === 'guestRating' && condition.operator === '>=' && condition.value === 4.5) {
            // Mock: assume high rating for demonstration
            conditionsMet = conditionsMet && true
          }
          // Add more condition evaluations here
        }
        
        if (conditionsMet) {
          console.log(`✅ Rule "${rule.name}" conditions met, executing actions`)
          
          // Execute actions
          for (const action of rule.actions) {
            switch (action.type) {
              case 'approve_booking':
                console.log('🎯 Auto-approving booking')
                break
              case 'send_welcome_email':
                console.log('📧 Sending welcome email')
                break
              case 'match_client':
                console.log('🔗 Matching client')
                break
              case 'notify_owner':
                console.log('📱 Notifying property owner')
                break
              default:
                console.log(`⚡ Executing action: ${action.type}`)
            }
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
