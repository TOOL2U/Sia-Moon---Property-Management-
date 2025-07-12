import { collection, getDocs, doc, setDoc, updateDoc, Timestamp, serverTimestamp } from 'firebase/firestore'
import { getDb } from '@/lib/firebase'
import { ProfileService } from './profileService'

export interface PropertyMatch {
  userId: string
  userEmail: string
  propertyId: string
  propertyName: string
  confidence: number
  matchMethod: 'exact' | 'fuzzy' | 'ai_similarity' | 'ai_embeddings'
  matchDetails?: string
}

export interface BookingAssignmentResult {
  success: boolean
  status: 'assigned' | 'unassigned'
  match?: PropertyMatch
  bookingId?: string
  userBookingId?: string
  confirmedBookingId?: string
  error?: string
}

/**
 * AI-powered property matching service for booking assignment
 * Supports exact matching, fuzzy matching, and AI-based similarity
 */
export class AIPropertyMatchingService {
  
  /**
   * Main entry point: Match booking property to user and assign booking
   */
  static async matchAndAssignBooking(
    bookingId: string,
    bookingData: any
  ): Promise<BookingAssignmentResult> {
    try {
      console.log('🎯 AI MATCHING: Starting property matching for booking:', bookingId)
      console.log('🏠 AI MATCHING: Property name:', bookingData.property || bookingData.villaName)
      
      const propertyName = bookingData.property || bookingData.villaName || ''
      
      if (!propertyName) {
        return {
          success: false,
          status: 'unassigned',
          error: 'No property name found in booking data'
        }
      }
      
      // Step 1: Find matching property and user
      const match = await this.findPropertyMatch(propertyName)
      
      if (!match) {
        console.log('❌ AI MATCHING: No property match found')
        return {
          success: true,
          status: 'unassigned',
          error: 'No matching property found'
        }
      }
      
      console.log('✅ AI MATCHING: Property match found!')
      console.log(`👤 User: ${match.userEmail}`)
      console.log(`🏠 Property: ${match.propertyName}`)
      console.log(`📊 Confidence: ${match.confidence}`)
      console.log(`🔧 Method: ${match.matchMethod}`)
      
      // Step 2: Assign booking to user
      const assignmentResult = await this.assignBookingToUser(bookingId, bookingData, match)
      
      return {
        success: assignmentResult.success,
        status: assignmentResult.success ? 'assigned' : 'unassigned',
        match,
        bookingId,
        userBookingId: assignmentResult.userBookingId,
        confirmedBookingId: assignmentResult.confirmedBookingId,
        error: assignmentResult.error
      }
      
    } catch (error) {
      console.error('❌ AI MATCHING: Error in matchAndAssignBooking:', error)
      return {
        success: false,
        status: 'unassigned',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  /**
   * Find matching property using multiple strategies
   */
  static async findPropertyMatch(propertyName: string): Promise<PropertyMatch | null> {
    try {
      console.log('🔍 AI MATCHING: Searching for property match:', propertyName)
      
      // Get all users
      const usersRef = collection(getDb(), 'users')
      const usersSnapshot = await getDocs(usersRef)
      
      const searchTerm = propertyName.toLowerCase().trim()
      let bestMatch: PropertyMatch | null = null
      
      // Strategy 1: Exact match
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id
        const userData = userDoc.data()
        
        console.log(`🔍 AI MATCHING: Checking user ${userData.email || userId}`)
        
        // Get user's properties from subcollection
        const userProperties = await ProfileService.getUserProperties(userId)
        
        for (const property of userProperties) {
          const propName = property.name?.toLowerCase().trim() || ''
          
          // Exact match
          if (propName === searchTerm) {
            console.log('✅ AI MATCHING: EXACT MATCH FOUND!')
            return {
              userId,
              userEmail: userData.email || '',
              propertyId: property.id,
              propertyName: property.name,
              confidence: 1.0,
              matchMethod: 'exact',
              matchDetails: 'Exact property name match'
            }
          }
        }
      }
      
      // Strategy 2: Fuzzy matching
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id
        const userData = userDoc.data()
        
        const userProperties = await ProfileService.getUserProperties(userId)
        
        for (const property of userProperties) {
          const propName = property.name?.toLowerCase().trim() || ''
          
          // Contains match
          if (propName.includes(searchTerm) || searchTerm.includes(propName)) {
            const confidence = this.calculateFuzzyConfidence(searchTerm, propName)
            
            if (!bestMatch || confidence > bestMatch.confidence) {
              bestMatch = {
                userId,
                userEmail: userData.email || '',
                propertyId: property.id,
                propertyName: property.name,
                confidence,
                matchMethod: 'fuzzy',
                matchDetails: `Fuzzy match: "${searchTerm}" ↔ "${propName}"`
              }
            }
          }
        }
      }
      
      // Strategy 3: AI Token Similarity (if no exact/fuzzy match)
      if (!bestMatch) {
        bestMatch = await this.findAISimilarityMatch(searchTerm, usersSnapshot.docs)
      }
      
      return bestMatch
      
    } catch (error) {
      console.error('❌ AI MATCHING: Error finding property match:', error)
      return null
    }
  }
  
  /**
   * Calculate fuzzy matching confidence
   */
  private static calculateFuzzyConfidence(search: string, target: string): number {
    const searchTokens = search.split(/\s+/)
    const targetTokens = target.split(/\s+/)
    
    let matches = 0
    for (const searchToken of searchTokens) {
      for (const targetToken of targetTokens) {
        if (searchToken.includes(targetToken) || targetToken.includes(searchToken)) {
          matches++
          break
        }
      }
    }
    
    return Math.min(0.9, matches / Math.max(searchTokens.length, targetTokens.length))
  }
  
  /**
   * AI-based similarity matching using token analysis
   */
  private static async findAISimilarityMatch(
    searchTerm: string, 
    userDocs: any[]
  ): Promise<PropertyMatch | null> {
    try {
      console.log('🤖 AI MATCHING: Running AI similarity analysis')
      
      let bestMatch: PropertyMatch | null = null
      
      for (const userDoc of userDocs) {
        const userId = userDoc.id
        const userData = userDoc.data()
        
        const userProperties = await ProfileService.getUserProperties(userId)
        
        for (const property of userProperties) {
          const propName = property.name?.toLowerCase().trim() || ''
          const similarity = this.calculateTokenSimilarity(searchTerm, propName)
          
          if (similarity > 0.6 && (!bestMatch || similarity > bestMatch.confidence)) {
            bestMatch = {
              userId,
              userEmail: userData.email || '',
              propertyId: property.id,
              propertyName: property.name,
              confidence: similarity,
              matchMethod: 'ai_similarity',
              matchDetails: `AI token similarity: ${(similarity * 100).toFixed(1)}%`
            }
          }
        }
      }
      
      if (bestMatch) {
        console.log('🤖 AI MATCHING: AI similarity match found!')
      }
      
      return bestMatch
      
    } catch (error) {
      console.error('❌ AI MATCHING: Error in AI similarity matching:', error)
      return null
    }
  }
  
  /**
   * Calculate token-based similarity score
   */
  private static calculateTokenSimilarity(str1: string, str2: string): number {
    const tokens1 = str1.toLowerCase().split(/\s+/)
    const tokens2 = str2.toLowerCase().split(/\s+/)
    
    const allTokens = new Set([...tokens1, ...tokens2])
    let commonTokens = 0
    
    for (const token of allTokens) {
      if (tokens1.includes(token) && tokens2.includes(token)) {
        commonTokens++
      }
    }
    
    return commonTokens / allTokens.size
  }
  
  /**
   * Assign booking to matched user
   */
  private static async assignBookingToUser(
    bookingId: string,
    bookingData: any,
    match: PropertyMatch
  ): Promise<{ success: boolean; userBookingId?: string; confirmedBookingId?: string; error?: string }> {
    try {
      console.log('📝 AI MATCHING: Assigning booking to user:', match.userEmail)
      
      // Create booking document for user's bookings subcollection
      const userBookingData = {
        ...bookingData,
        originalBookingId: bookingId,
        assignedPropertyId: match.propertyId,
        assignedPropertyName: match.propertyName,
        matchConfidence: match.confidence,
        matchMethod: match.matchMethod,
        matchDetails: match.matchDetails,
        status: 'assigned',
        assignedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
      
      // Save to user's bookings subcollection
      const userBookingsRef = collection(getDb(), 'users', match.userId, 'bookings')
      const userBookingRef = doc(userBookingsRef)
      await setDoc(userBookingRef, userBookingData)
      const userBookingId = userBookingRef.id
      
      // Copy to confirmed_bookings collection
      const confirmedBookingRef = doc(getDb(), 'confirmed_bookings', bookingId)
      await setDoc(confirmedBookingRef, {
        ...userBookingData,
        userBookingId,
        confirmedAt: serverTimestamp()
      })
      
      console.log('✅ AI MATCHING: Booking assigned successfully')
      console.log(`📋 User booking ID: ${userBookingId}`)
      console.log(`✅ Confirmed booking ID: ${bookingId}`)
      
      return {
        success: true,
        userBookingId,
        confirmedBookingId: bookingId
      }
      
    } catch (error) {
      console.error('❌ AI MATCHING: Error assigning booking to user:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
