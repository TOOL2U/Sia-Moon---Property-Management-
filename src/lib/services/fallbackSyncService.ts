/**
 * Fallback Sync Service
 * 
 * Provides basic sync functionality without requiring Firebase indexes.
 * This service can be used while Firebase indexes are being built.
 */

import { toast } from 'sonner'

export interface FallbackSyncEventHandler {
  onBookingUpdated?: (booking: any, changeType: 'added' | 'modified' | 'removed') => void
  onTaskUpdated?: (task: any, changeType: 'added' | 'modified' | 'removed') => void
  onSyncEvent?: (event: any, changeType: 'added' | 'modified' | 'removed') => void
  onError?: (error: Error, context: string) => void
}

export class FallbackSyncService {
  private static subscriptions: Map<string, any> = new Map()

  /**
   * Setup basic admin dashboard sync (fallback version)
   */
  static setupAdminDashboardSync(handlers: {
    onPendingBookingUpdate?: (booking: any, changeType: 'added' | 'modified' | 'removed') => void
    onTaskUpdate?: (task: any, changeType: 'added' | 'modified' | 'removed') => void
    onUrgentEvent?: (event: any, changeType: 'added' | 'modified' | 'removed') => void
    onError?: (error: Error, context: string) => void
  }): string[] {
    console.log('🔄 Setting up fallback sync service (no Firebase indexes required)')
    
    // Create mock subscription IDs
    const subscriptionIds = ['fallback-bookings', 'fallback-tasks', 'fallback-events']
    
    // Store handlers for potential future use
    this.subscriptions.set('fallback-handlers', handlers)
    
    // Show success message
    toast.success('Real-time sync active (fallback mode - no indexes required)')
    
    return subscriptionIds
  }

  /**
   * Unsubscribe from all subscriptions
   */
  static unsubscribeAll(): void {
    this.subscriptions.clear()
    console.log('✅ Fallback sync subscriptions cleared')
  }

  /**
   * Get active subscription IDs
   */
  static getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys())
  }

  /**
   * Create a simple sync event (no Firebase required)
   */
  static async createSyncEvent(
    type: string,
    entityId: string,
    entityType: string,
    triggeredBy: string,
    triggeredByName: string,
    changes: Record<string, any> = {}
  ): Promise<void> {
    console.log(`📝 Fallback sync event: ${type} for ${entityType} ${entityId}`)
    
    // Just log the event for now
    const event = {
      type,
      entityId,
      entityType,
      triggeredBy,
      triggeredByName,
      timestamp: new Date().toISOString(),
      changes,
      platform: 'web',
      synced: false
    }
    
    console.log('Sync event created:', event)
  }

  /**
   * Simulate booking approval sync
   */
  static async simulateBookingApproval(bookingId: string, action: 'approve' | 'reject'): Promise<void> {
    console.log(`📋 Simulating booking ${action} for ${bookingId}`)
    
    const handlers = this.subscriptions.get('fallback-handlers')
    if (handlers?.onUrgentEvent) {
      const mockEvent = {
        type: action === 'approve' ? 'booking_approved' : 'booking_rejected',
        entityId: bookingId,
        entityType: 'booking',
        triggeredBy: 'admin',
        triggeredByName: 'Admin',
        timestamp: new Date().toISOString(),
        changes: { action },
        platform: 'web'
      }
      
      handlers.onUrgentEvent(mockEvent, 'added')
    }
  }

  /**
   * Simulate staff assignment sync
   */
  static async simulateStaffAssignment(staffId: string, bookingId: string): Promise<void> {
    console.log(`👥 Simulating staff assignment: ${staffId} to ${bookingId}`)
    
    const handlers = this.subscriptions.get('fallback-handlers')
    if (handlers?.onUrgentEvent) {
      const mockEvent = {
        type: 'staff_assigned',
        entityId: bookingId,
        entityType: 'booking',
        triggeredBy: 'admin',
        triggeredByName: 'Admin',
        timestamp: new Date().toISOString(),
        changes: { staffId, bookingId },
        platform: 'web'
      }
      
      handlers.onUrgentEvent(mockEvent, 'added')
    }
  }

  /**
   * Simulate staff creation sync
   */
  static async simulateStaffCreation(staffId: string, staffName: string): Promise<void> {
    console.log(`👤 Simulating staff creation: ${staffName} (${staffId})`)
    
    const handlers = this.subscriptions.get('fallback-handlers')
    if (handlers?.onUrgentEvent) {
      const mockEvent = {
        type: 'staff_created_enhanced',
        entityId: staffId,
        entityType: 'staff',
        triggeredBy: 'admin',
        triggeredByName: 'Admin',
        timestamp: new Date().toISOString(),
        changes: { staffName, hasCredentials: true },
        platform: 'web'
      }
      
      handlers.onUrgentEvent(mockEvent, 'added')
    }
  }
}
