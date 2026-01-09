/**
 * PropertyMatchingService
 * 
 * Deterministic property matching using external IDs.
 * NEVER uses fuzzy string matching - always requires explicit IDs.
 * 
 * Matching Priority:
 * 1. pmsListingId (most reliable - from PMS system)
 * 2. airbnbListingId (backup - channel specific)
 * 3. bookingComListingId (backup - channel specific)
 * 4. vrboListingId (backup - channel specific)
 * 5. propertyExternalId (manual override - direct property ID)
 * 6. FAIL - requires manual review
 */

import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, limit, doc, getDoc } from 'firebase/firestore'
import type { Property } from '@/types/property'

export interface PropertyMatchInput {
  // PMS System IDs
  pmsListingId?: string
  pmsProvider?: string
  
  // Channel-specific IDs
  airbnbListingId?: string
  bookingComListingId?: string
  vrboListingId?: string
  
  // Manual override
  propertyExternalId?: string
  
  // Display only (NOT used for matching)
  propertyName?: string
}

export interface PropertyMatchResult {
  success: boolean
  propertyId?: string
  property?: Property
  matchMethod: MatchMethod
  confidence: MatchConfidence
  requiresReview: boolean
  warnings: string[]
  errors: string[]
}

export type MatchMethod = 
  | 'pmsListingId'
  | 'airbnbListingId'
  | 'bookingComListingId'
  | 'vrboListingId'
  | 'propertyExternalId'
  | 'none'

export type MatchConfidence = 'high' | 'medium' | 'low'

export class PropertyMatchingService {
  /**
   * Match property using stable external IDs (NO fuzzy matching)
   * 
   * @param input - Property identifiers from booking
   * @returns PropertyMatchResult with matched property or failure details
   */
  static async matchProperty(input: PropertyMatchInput): Promise<PropertyMatchResult> {
    const warnings: string[] = []
    const errors: string[] = []
    
    console.log('🔍 Attempting property match with:', {
      pmsListingId: input.pmsListingId,
      airbnbListingId: input.airbnbListingId,
      propertyName: input.propertyName
    })
    
    // PRIORITY 1: Match by pmsListingId (most reliable)
    if (input.pmsListingId) {
      try {
        const result = await this.matchByPMSListingId(input.pmsListingId)
        if (result) {
          console.log('✅ Property matched via pmsListingId')
          return {
            success: true,
            propertyId: result.id,
            property: result as Property,
            matchMethod: 'pmsListingId',
            confidence: 'high',
            requiresReview: false,
            warnings: [],
            errors: []
          }
        }
        warnings.push(`No property found with pmsListingId: ${input.pmsListingId}`)
      } catch (error) {
        errors.push(`Error matching by pmsListingId: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
    
    // PRIORITY 2: Match by airbnbListingId
    if (input.airbnbListingId) {
      try {
        const result = await this.matchByAirbnbListingId(input.airbnbListingId)
        if (result) {
          console.log('✅ Property matched via airbnbListingId')
          warnings.push('Matched via Airbnb ID - consider adding pmsListingId for better reliability')
          return {
            success: true,
            propertyId: result.id,
            property: result as Property,
            matchMethod: 'airbnbListingId',
            confidence: 'medium',
            requiresReview: false,
            warnings,
            errors
          }
        }
        warnings.push(`No property found with airbnbListingId: ${input.airbnbListingId}`)
      } catch (error) {
        errors.push(`Error matching by airbnbListingId: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
    
    // PRIORITY 3: Match by bookingComListingId
    if (input.bookingComListingId) {
      try {
        const result = await this.matchByBookingComListingId(input.bookingComListingId)
        if (result) {
          console.log('✅ Property matched via bookingComListingId')
          warnings.push('Matched via Booking.com ID - consider adding pmsListingId for better reliability')
          return {
            success: true,
            propertyId: result.id,
            property: result as Property,
            matchMethod: 'bookingComListingId',
            confidence: 'medium',
            requiresReview: false,
            warnings,
            errors
          }
        }
        warnings.push(`No property found with bookingComListingId: ${input.bookingComListingId}`)
      } catch (error) {
        errors.push(`Error matching by bookingComListingId: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
    
    // PRIORITY 4: Match by vrboListingId
    if (input.vrboListingId) {
      try {
        const result = await this.matchByVrboListingId(input.vrboListingId)
        if (result) {
          console.log('✅ Property matched via vrboListingId')
          warnings.push('Matched via VRBO ID - consider adding pmsListingId for better reliability')
          return {
            success: true,
            propertyId: result.id,
            property: result as Property,
            matchMethod: 'vrboListingId',
            confidence: 'medium',
            requiresReview: false,
            warnings,
            errors
          }
        }
        warnings.push(`No property found with vrboListingId: ${input.vrboListingId}`)
      } catch (error) {
        errors.push(`Error matching by vrboListingId: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
    
    // PRIORITY 5: Match by propertyExternalId (manual override - direct document ID)
    if (input.propertyExternalId) {
      try {
        const result = await this.matchByPropertyId(input.propertyExternalId)
        if (result) {
          console.log('✅ Property matched via propertyExternalId (manual override)')
          warnings.push('Matched via manual external ID - this is a fallback method')
          return {
            success: true,
            propertyId: result.id,
            property: result as Property,
            matchMethod: 'propertyExternalId',
            confidence: 'medium',
            requiresReview: false,
            warnings,
            errors
          }
        }
        warnings.push(`No property found with ID: ${input.propertyExternalId}`)
      } catch (error) {
        errors.push(`Error matching by propertyExternalId: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
    
    // FAIL-SAFE: No match found
    console.error('❌ NO PROPERTY MATCH FOUND')
    errors.push('⚠️ NO PROPERTY MATCH - Manual intervention required')
    warnings.push(`Property name from booking: ${input.propertyName || 'Unknown'}`)
    
    return {
      success: false,
      matchMethod: 'none',
      confidence: 'low',
      requiresReview: true,
      warnings,
      errors
    }
  }
  
  /**
   * Match by PMS Listing ID (primary method)
   */
  private static async matchByPMSListingId(pmsListingId: string): Promise<any | null> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized')
      }
      
      const q = query(
        collection(db, 'properties'),
        where('pmsIntegration.pmsListingId', '==', pmsListingId),
        limit(1)
      )
      const snapshot = await getDocs(q)
      
      if (snapshot.empty) {
        return null
      }
      
      return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      }
    } catch (error) {
      console.error('Error in matchByPMSListingId:', error)
      throw error
    }
  }
  
  /**
   * Match by Airbnb Listing ID
   */
  private static async matchByAirbnbListingId(airbnbListingId: string): Promise<any | null> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized')
      }
      
      const q = query(
        collection(db, 'properties'),
        where('pmsIntegration.airbnbListingId', '==', airbnbListingId),
        limit(1)
      )
      const snapshot = await getDocs(q)
      
      if (snapshot.empty) {
        return null
      }
      
      return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      }
    } catch (error) {
      console.error('Error in matchByAirbnbListingId:', error)
      throw error
    }
  }
  
  /**
   * Match by Booking.com Listing ID
   */
  private static async matchByBookingComListingId(bookingComListingId: string): Promise<any | null> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized')
      }
      
      const q = query(
        collection(db, 'properties'),
        where('pmsIntegration.bookingComListingId', '==', bookingComListingId),
        limit(1)
      )
      const snapshot = await getDocs(q)
      
      if (snapshot.empty) {
        return null
      }
      
      return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      }
    } catch (error) {
      console.error('Error in matchByBookingComListingId:', error)
      throw error
    }
  }
  
  /**
   * Match by VRBO Listing ID
   */
  private static async matchByVrboListingId(vrboListingId: string): Promise<any | null> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized')
      }
      
      const q = query(
        collection(db, 'properties'),
        where('pmsIntegration.vrboListingId', '==', vrboListingId),
        limit(1)
      )
      const snapshot = await getDocs(q)
      
      if (snapshot.empty) {
        return null
      }
      
      return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      }
    } catch (error) {
      console.error('Error in matchByVrboListingId:', error)
      throw error
    }
  }
  
  /**
   * Match by direct Property ID (manual override)
   */
  private static async matchByPropertyId(propertyId: string): Promise<any | null> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized')
      }
      
      const docRef = doc(db, 'properties', propertyId)
      const docSnap = await getDoc(docRef)
      
      if (!docSnap.exists()) {
        return null
      }
      
      return {
        id: docSnap.id,
        ...docSnap.data()
      }
    } catch (error) {
      console.error('Error in matchByPropertyId:', error)
      throw error
    }
  }
  
  /**
   * Validate property has required data for job creation
   */
  static validatePropertyForJobCreation(property: Property): {
    valid: boolean
    missingFields: string[]
  } {
    const missingFields: string[] = []
    
    if (!property.name) missingFields.push('name')
    if (!property.location?.address) missingFields.push('location.address')
    if (!property.location?.coordinates?.latitude) missingFields.push('location.coordinates.latitude')
    if (!property.location?.coordinates?.longitude) missingFields.push('location.coordinates.longitude')
    
    return {
      valid: missingFields.length === 0,
      missingFields
    }
  }
  
  /**
   * Generate Google Maps link if missing
   */
  static generateGoogleMapsLink(property: Property): string {
    if (property.location?.googleMapsLink) {
      return property.location.googleMapsLink
    }
    
    const lat = property.location?.coordinates?.latitude
    const lng = property.location?.coordinates?.longitude
    
    if (lat && lng) {
      return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    }
    
    // Fallback to address search
    if (property.location?.address) {
      const encodedAddress = encodeURIComponent(property.location.address)
      return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`
    }
    
    return ''
  }
}
