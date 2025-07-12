import { collection, getDocs, Firestore } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Helper function to ensure db is available
function getDb(): Firestore {
  if (!db) {
    throw new Error('Firebase database not initialized')
  }
  return db
}

export interface ProfileProperty {
  id?: string
  name: string
  address?: string
  description?: string
  [key: string]: any // Allow for additional property fields
}

export interface UserProfile {
  id: string
  email: string
  fullName?: string
  role?: string
  properties?: ProfileProperty[]
  [key: string]: any // Allow for additional profile fields
}

export interface ClientMatchResult {
  clientId: string
  propertyId?: string
  propertyName: string
  confidence: number
  matchMethod: string
  profileEmail?: string
}

/**
 * Enhanced client matching service that works with profiles collection
 * where each user profile contains their properties as an array
 */
export class ProfileBasedClientMatching {
  
  /**
   * Match a booking property name to a client profile
   */
  static async matchClientByPropertyName(
    propertyName: string
  ): Promise<ClientMatchResult | null> {
    try {
      console.log('🔍 PROFILE MATCHING: Starting property-based client matching')
      console.log('🔍 PROFILE MATCHING: Looking for property:', `"${propertyName}"`)
      
      // Get all user profiles from the profiles collection
      const profilesRef = collection(getDb(), 'profiles')
      const profilesSnapshot = await getDocs(profilesRef)
      
      const profiles: UserProfile[] = []
      profilesSnapshot.forEach(doc => {
        const data = doc.data()
        profiles.push({
          id: doc.id,
          ...data
        } as UserProfile)
      })
      
      console.log(`📋 PROFILE MATCHING: Found ${profiles.length} user profiles to check`)
      
      if (profiles.length === 0) {
        console.log('⚠️ PROFILE MATCHING: No profiles found in database')
        return null
      }
      
      // Log all profiles for debugging
      profiles.forEach((profile, index) => {
        console.log(`👤 PROFILE ${index + 1}: ${profile.email} (ID: ${profile.id})`)
        if (profile.properties && Array.isArray(profile.properties)) {
          console.log(`   📋 Properties (${profile.properties.length}):`)
          profile.properties.forEach((prop, propIndex) => {
            console.log(`      ${propIndex + 1}. "${prop.name}"`)
          })
        } else {
          console.log(`   📋 Properties: None or not an array`)
        }
      })
      
      // Search for exact property name match
      const searchTerm = propertyName.toLowerCase().trim()
      console.log(`🔍 PROFILE MATCHING: Searching for: "${searchTerm}"`)
      
      for (const profile of profiles) {
        if (!profile.properties || !Array.isArray(profile.properties)) {
          console.log(`⚠️ PROFILE MATCHING: Profile ${profile.email} has no properties array`)
          continue
        }
        
        for (const property of profile.properties) {
          if (!property.name) {
            console.log(`⚠️ PROFILE MATCHING: Property in ${profile.email} has no name`)
            continue
          }
          
          const propertyNameLower = property.name.toLowerCase().trim()
          console.log(`🔍 PROFILE MATCHING: Comparing "${searchTerm}" with "${propertyNameLower}"`)
          
          // Exact match
          if (propertyNameLower === searchTerm) {
            console.log('✅ PROFILE MATCHING: EXACT MATCH FOUND!')
            console.log('✅ PROFILE MATCHING: Client:', profile.email)
            console.log('✅ PROFILE MATCHING: Property:', property.name)
            
            return {
              clientId: profile.id,
              propertyId: property.id || property.name,
              propertyName: property.name,
              confidence: 1.0,
              matchMethod: 'exact_property_name_in_profile',
              profileEmail: profile.email
            }
          }
          
          // Partial match (contains)
          if (propertyNameLower.includes(searchTerm) || searchTerm.includes(propertyNameLower)) {
            console.log('✅ PROFILE MATCHING: PARTIAL MATCH FOUND!')
            console.log('✅ PROFILE MATCHING: Client:', profile.email)
            console.log('✅ PROFILE MATCHING: Property:', property.name)
            
            return {
              clientId: profile.id,
              propertyId: property.id || property.name,
              propertyName: property.name,
              confidence: 0.8,
              matchMethod: 'partial_property_name_in_profile',
              profileEmail: profile.email
            }
          }
        }
      }
      
      console.log('❌ PROFILE MATCHING: No matching property found in any profile')
      return null
      
    } catch (error) {
      console.error('❌ PROFILE MATCHING: Error during client matching:', error)
      return null
    }
  }
  
  /**
   * Get all profiles for debugging
   */
  static async getAllProfiles(): Promise<UserProfile[]> {
    try {
      console.log('📋 PROFILE MATCHING: Fetching all profiles for debugging')
      
      const profilesRef = collection(getDb(), 'profiles')
      const profilesSnapshot = await getDocs(profilesRef)
      
      const profiles: UserProfile[] = []
      profilesSnapshot.forEach(doc => {
        const data = doc.data()
        profiles.push({
          id: doc.id,
          ...data
        } as UserProfile)
      })
      
      console.log(`📋 PROFILE MATCHING: Retrieved ${profiles.length} profiles`)
      return profiles
      
    } catch (error) {
      console.error('❌ PROFILE MATCHING: Error fetching profiles:', error)
      return []
    }
  }
  
  /**
   * Get a specific profile by ID
   */
  static async getProfileById(profileId: string): Promise<UserProfile | null> {
    try {
      const profiles = await this.getAllProfiles()
      return profiles.find(p => p.id === profileId) || null
    } catch (error) {
      console.error('❌ PROFILE MATCHING: Error fetching profile:', error)
      return null
    }
  }
  
  /**
   * Verify if a profile exists and has properties
   */
  static async verifyProfileHasProperties(profileId: string): Promise<boolean> {
    try {
      const profile = await this.getProfileById(profileId)
      return !!(profile && profile.properties && Array.isArray(profile.properties) && profile.properties.length > 0)
    } catch (error) {
      console.error('❌ PROFILE MATCHING: Error verifying profile:', error)
      return false
    }
  }
  
  /**
   * Enhanced matching with multiple strategies
   */
  static async enhancedClientMatching(
    propertyName: string,
    guestEmail?: string
  ): Promise<ClientMatchResult | null> {
    try {
      console.log('🚀 PROFILE MATCHING: Starting enhanced client matching')
      console.log('🚀 PROFILE MATCHING: Property:', propertyName)
      console.log('🚀 PROFILE MATCHING: Guest email:', guestEmail)
      
      // Strategy 1: Property name matching in profiles
      const propertyMatch = await this.matchClientByPropertyName(propertyName)
      if (propertyMatch && propertyMatch.confidence > 0.7) {
        console.log('✅ PROFILE MATCHING: High-confidence property match found')
        return propertyMatch
      }
      
      // Strategy 2: Email-based matching (if guest email matches profile email)
      if (guestEmail) {
        console.log('🔍 PROFILE MATCHING: Trying email-based matching')
        const profiles = await this.getAllProfiles()
        const emailMatch = profiles.find(p => 
          p.email && p.email.toLowerCase().trim() === guestEmail.toLowerCase().trim()
        )
        
        if (emailMatch) {
          console.log('✅ PROFILE MATCHING: Email match found')
          return {
            clientId: emailMatch.id,
            propertyName: propertyName,
            confidence: 0.9,
            matchMethod: 'email_match_in_profile',
            profileEmail: emailMatch.email
          }
        }
      }
      
      // Strategy 3: Return lower confidence property match if available
      if (propertyMatch) {
        console.log('⚠️ PROFILE MATCHING: Returning lower-confidence property match')
        return propertyMatch
      }
      
      console.log('❌ PROFILE MATCHING: No client match found with any strategy')
      return null
      
    } catch (error) {
      console.error('❌ PROFILE MATCHING: Error during enhanced matching:', error)
      return null
    }
  }
}
