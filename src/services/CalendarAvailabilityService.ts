/**
 * Enhanced Calendar Availability Service
 * Manages property availability as the single source of truth
 * Handles blocking, conflict detection, and availability queries
 */

import { getDb } from '@/lib/firebase'
import { 
  collection, 
  addDoc, 
  query as firestoreQuery, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  Timestamp,
  orderBy,
  and,
  or
} from 'firebase/firestore'

export interface PropertyBlock {
  id?: string
  propertyId: string
  propertyName: string
  startDate: string // ISO format
  endDate: string // ISO format
  blockType: 'booking' | 'maintenance' | 'owner_use' | 'manual' | 'buffer'
  reason: string
  status: 'active' | 'cancelled' | 'completed'
  
  // Source tracking
  sourceType: 'pms_webhook' | 'manual_entry' | 'system_auto' | 'booking_approval'
  sourceId: string // External booking ID, manual entry ID, etc.
  
  // Metadata
  createdAt?: any
  createdBy: string
  updatedAt?: any
  updatedBy?: string
  
  // Optional details
  guestName?: string
  externalBookingId?: string
  bufferHours?: number // For cleaning/turnover buffers
  priority: 'low' | 'medium' | 'high' | 'critical'
  
  // Conflict resolution
  conflictResolved?: boolean
  conflictNotes?: string
}

export interface AvailabilityQuery {
  propertyId?: string
  propertyIds?: string[]
  startDate: string
  endDate: string
  excludeBlockIds?: string[]
  includeBlockTypes?: string[]
  excludeBlockTypes?: string[]
}

export interface AvailabilityResult {
  propertyId: string
  propertyName: string
  isAvailable: boolean
  conflicts: PropertyBlock[]
  suggestedAlternatives?: AlternativeDate[]
}

export interface AlternativeDate {
  startDate: string
  endDate: string
  confidence: number
  reason: string
}

export class CalendarAvailabilityService {
  private static readonly COLLECTION = 'property_availability_blocks'
  private static readonly BUFFER_HOURS = 4 // Default cleaning buffer

  /**
   * Block property dates for a booking or maintenance
   */
  static async blockProperty(block: Omit<PropertyBlock, 'id'>): Promise<{ success: boolean; blockId?: string; conflicts?: PropertyBlock[] }> {
    try {
      console.log(`🚫 Blocking property ${block.propertyName} from ${block.startDate} to ${block.endDate}`)
      
      const db = getDb()
      
      // Check for conflicts first
      const conflicts = await this.checkConflicts({
        propertyId: block.propertyId,
        startDate: block.startDate,
        endDate: block.endDate,
        excludeBlockTypes: block.blockType === 'buffer' ? ['buffer'] : undefined
      })
      
      if (conflicts.length > 0 && block.blockType !== 'buffer') {
        console.warn(`⚠️ Conflicts detected for property block:`, conflicts)
        return {
          success: false,
          conflicts
        }
      }
      
      // Add buffer periods for bookings
      const blocksToCreate = [block]
      if (block.blockType === 'booking') {
        // Add cleaning buffer after checkout
        const bufferBlock: Omit<PropertyBlock, 'id'> = {
          ...block,
          startDate: block.endDate,
          endDate: this.addHours(new Date(block.endDate), this.BUFFER_HOURS).toISOString(),
          blockType: 'buffer',
          reason: 'Cleaning/turnover buffer',
          bufferHours: this.BUFFER_HOURS,
          priority: 'medium'
        }
        blocksToCreate.push(bufferBlock)
      }
      
      // Create all blocks
      const blockIds = []
      for (const blockData of blocksToCreate) {
        const blockDoc = await addDoc(collection(db, this.COLLECTION), {
          ...blockData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          status: 'active'
        })
        blockIds.push(blockDoc.id)
      }
      
      console.log(`✅ Property blocked successfully:`, blockIds)
      
      return {
        success: true,
        blockId: blockIds[0],
        conflicts: []
      }
      
    } catch (error) {
      console.error('❌ Error blocking property:', error)
      return {
        success: false,
        conflicts: []
      }
    }
  }

  /**
   * Remove property block (for cancellations)
   */
  static async unblockProperty(
    sourceId: string, 
    sourceType: string, 
    reason: string = 'Cancellation'
  ): Promise<{ success: boolean; unblockedCount: number }> {
    try {
      console.log(`🔓 Unblocking property for source ${sourceType}:${sourceId}`)
      
      const db = getDb()
      
      // Find all blocks for this source
      const blocksQuery = firestoreQuery(
        collection(db, this.COLLECTION),
        where('sourceId', '==', sourceId),
        where('sourceType', '==', sourceType),
        where('status', '==', 'active')
      )
      
      const snapshot = await getDocs(blocksQuery)
      let unblockedCount = 0
      
      for (const blockDoc of snapshot.docs) {
        await updateDoc(doc(db, this.COLLECTION, blockDoc.id), {
          status: 'cancelled',
          updatedAt: serverTimestamp(),
          cancellationReason: reason
        })
        unblockedCount++
      }
      
      console.log(`✅ Unblocked ${unblockedCount} property blocks`)
      
      return {
        success: true,
        unblockedCount
      }
      
    } catch (error) {
      console.error('❌ Error unblocking property:', error)
      return {
        success: false,
        unblockedCount: 0
      }
    }
  }

  /**
   * Check property availability for specific dates
   */
  static async checkAvailability(query: AvailabilityQuery): Promise<AvailabilityResult[]> {
    try {
      console.log(`🔍 Checking availability:`, query)
      
      const db = getDb()
      const propertyIds = query.propertyIds || (query.propertyId ? [query.propertyId] : [])
      const results: AvailabilityResult[] = []
      
      for (const propertyId of propertyIds) {
        const conflicts = await this.checkConflicts({
          propertyId,
          startDate: query.startDate,
          endDate: query.endDate,
          excludeBlockIds: query.excludeBlockIds,
          includeBlockTypes: query.includeBlockTypes,
          excludeBlockTypes: query.excludeBlockTypes
        })
        
        const isAvailable = conflicts.length === 0
        
        // Get property name from first conflict or fetch from property collection
        let propertyName = propertyId
        if (conflicts.length > 0) {
          propertyName = conflicts[0].propertyName
        } else {
          // TODO: Fetch from properties collection
          propertyName = `Property ${propertyId}`
        }
        
        const result: AvailabilityResult = {
          propertyId,
          propertyName,
          isAvailable,
          conflicts
        }
        
        // Generate alternative dates if not available
        if (!isAvailable) {
          result.suggestedAlternatives = await this.findAlternativeDates(
            propertyId,
            query.startDate,
            query.endDate
          )
        }
        
        results.push(result)
      }
      
      console.log(`✅ Availability check complete: ${results.filter(r => r.isAvailable).length}/${results.length} properties available`)
      
      return results
      
    } catch (error) {
      console.error('❌ Error checking availability:', error)
      return []
    }
  }

  /**
   * Find conflicts for specific property and dates
   */
  static async checkConflicts(query: AvailabilityQuery): Promise<PropertyBlock[]> {
    try {
      const db = getDb()
      
      const startDate = new Date(query.startDate)
      const endDate = new Date(query.endDate)
      
      // Build Firestore query
      let firestoreQueryBuilder = firestoreQuery(
        collection(db, this.COLLECTION),
        where('propertyId', '==', query.propertyId),
        where('status', '==', 'active')
      )
      
      // Add block type filters if specified
      if (query.includeBlockTypes && query.includeBlockTypes.length > 0) {
        firestoreQueryBuilder = firestoreQuery(
          collection(db, this.COLLECTION),
          where('propertyId', '==', query.propertyId),
          where('status', '==', 'active'),
          where('blockType', 'in', query.includeBlockTypes)
        )
      }
      
      const snapshot = await getDocs(firestoreQueryBuilder)
      const conflicts: PropertyBlock[] = []
      
      snapshot.forEach((doc) => {
        const blockData = doc.data()
        const block = { id: doc.id, ...blockData } as PropertyBlock
        
        // Skip excluded blocks
        if (query.excludeBlockIds && query.excludeBlockIds.includes(block.id!)) {
          return
        }
        
        // Skip excluded block types
        if (query.excludeBlockTypes && query.excludeBlockTypes.includes(block.blockType)) {
          return
        }
        
        const blockStart = new Date(block.startDate)
        const blockEnd = new Date(block.endDate)
        
        // Check for date overlap
        if (startDate < blockEnd && endDate > blockStart) {
          conflicts.push(block)
        }
      })
      
      return conflicts
      
    } catch (error) {
      console.error('❌ Error checking conflicts:', error)
      return []
    }
  }

  /**
   * Find alternative available dates
   */
  static async findAlternativeDates(
    propertyId: string, 
    requestedStart: string, 
    requestedEnd: string
  ): Promise<AlternativeDate[]> {
    try {
      const startDate = new Date(requestedStart)
      const endDate = new Date(requestedEnd)
      const duration = endDate.getTime() - startDate.getTime()
      
      const alternatives: AlternativeDate[] = []
      
      // Check 30 days before and after requested dates
      for (let i = -30; i <= 30; i++) {
        if (i === 0) continue // Skip the requested dates
        
        const altStart = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000))
        const altEnd = new Date(altStart.getTime() + duration)
        
        const conflicts = await this.checkConflicts({
          propertyId,
          startDate: altStart.toISOString(),
          endDate: altEnd.toISOString()
        })
        
        if (conflicts.length === 0) {
          alternatives.push({
            startDate: altStart.toISOString(),
            endDate: altEnd.toISOString(),
            confidence: Math.max(0.1, 1 - Math.abs(i) / 30), // Higher confidence for closer dates
            reason: i < 0 ? 'Earlier dates available' : 'Later dates available'
          })
          
          if (alternatives.length >= 3) break // Limit to 3 suggestions
        }
      }
      
      return alternatives.sort((a, b) => b.confidence - a.confidence)
      
    } catch (error) {
      console.error('❌ Error finding alternatives:', error)
      return []
    }
  }

  /**
   * Get all blocks for a property in date range
   */
  static async getPropertyBlocks(
    propertyId: string,
    startDate?: string,
    endDate?: string
  ): Promise<PropertyBlock[]> {
    try {
      const db = getDb()
      
      let blocksQuery = firestoreQuery(
        collection(db, this.COLLECTION),
        where('propertyId', '==', propertyId),
        where('status', '==', 'active'),
        orderBy('startDate', 'asc')
      )
      
      const snapshot = await getDocs(blocksQuery)
      let blocks: PropertyBlock[] = []
      
      snapshot.forEach((doc) => {
        const blockData = doc.data()
        blocks.push({ id: doc.id, ...blockData } as PropertyBlock)
      })
      
      // Filter by date range if provided
      if (startDate && endDate) {
        const rangeStart = new Date(startDate)
        const rangeEnd = new Date(endDate)
        
        blocks = blocks.filter(block => {
          const blockStart = new Date(block.startDate)
          const blockEnd = new Date(block.endDate)
          return blockStart < rangeEnd && blockEnd > rangeStart
        })
      }
      
      return blocks
      
    } catch (error) {
      console.error('❌ Error getting property blocks:', error)
      return []
    }
  }

  /**
   * Utility: Add hours to a date
   */
  private static addHours(date: Date, hours: number): Date {
    const result = new Date(date)
    result.setTime(result.getTime() + (hours * 60 * 60 * 1000))
    return result
  }

  /**
   * Create block from approved booking
   */
  static async createBookingBlock(bookingData: {
    bookingId: string
    externalBookingId?: string
    propertyId: string
    propertyName: string
    guestName: string
    checkInDate: string
    checkOutDate: string
    sourceType: string
  }): Promise<{ success: boolean; blockId?: string; conflicts?: PropertyBlock[] }> {
    
    const block: Omit<PropertyBlock, 'id'> = {
      propertyId: bookingData.propertyId,
      propertyName: bookingData.propertyName,
      startDate: bookingData.checkInDate,
      endDate: bookingData.checkOutDate,
      blockType: 'booking',
      reason: `Booking for ${bookingData.guestName}`,
      status: 'active',
      sourceType: bookingData.sourceType as any,
      sourceId: bookingData.externalBookingId || bookingData.bookingId,
      createdBy: 'system',
      guestName: bookingData.guestName,
      externalBookingId: bookingData.externalBookingId,
      priority: 'high'
    }
    
    return await this.blockProperty(block)
  }
}

export default CalendarAvailabilityService
