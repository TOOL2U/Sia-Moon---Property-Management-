import { PropertyService } from './services/propertyService'

export interface ClientMatchResult {
  clientId: string
  propertyId?: string
  propertyName: string
  confidence: number
  matchMethod: string
}

/**
 * Match a booking to a client profile based on property information
 */
export async function matchClientProfile(
  villaName: string,
  propertyId?: string
): Promise<ClientMatchResult | null> {
  try {
    console.log('🔍 CLIENT MATCHING: Attempting to match property:', villaName)
    
    // Get all properties from the system
    const allProperties = await PropertyService.getAllProperties()

    console.log(`🔍 CLIENT MATCHING: Found ${allProperties.length} properties in system`)
    console.log('🔍 CLIENT MATCHING: Property names:', allProperties.map(p => `"${p.name}"`))

    if (allProperties.length === 0) {
      console.log('⚠️ CLIENT MATCHING: No properties found in system')
      return null
    }
    
    // Try exact property ID match first
    if (propertyId) {
      const exactMatch = allProperties.find(p => p.id === propertyId)
      if (exactMatch) {
        console.log('✅ CLIENT MATCHING: Exact property ID match found')
        return {
          clientId: exactMatch.userId,
          propertyId: exactMatch.id,
          propertyName: exactMatch.name,
          confidence: 1.0,
          matchMethod: 'exact_property_id'
        }
      }
    }
    
    // Try exact name match with enhanced trimming
    console.log('🔍 CLIENT MATCHING: Testing exact name match...')
    console.log('🔍 CLIENT MATCHING: Looking for villa:', `"${villaName}"`)

    const exactNameMatch = allProperties.find(p => {
      const dbName = p.name?.toLowerCase().trim() || ''
      const searchName = villaName.toLowerCase().trim()

      console.log(`🔍 CLIENT MATCHING: Comparing "${searchName}" with "${dbName}"`)

      return dbName === searchName
    })
    
    if (exactNameMatch) {
      console.log('✅ CLIENT MATCHING: Exact property name match found')
      return {
        clientId: exactNameMatch.userId,
        propertyId: exactNameMatch.id,
        propertyName: exactNameMatch.name,
        confidence: 0.95,
        matchMethod: 'exact_property_name'
      }
    }
    
    // Try fuzzy name matching
    const fuzzyMatches = allProperties.map(property => {
      const similarity = calculateStringSimilarity(
        villaName.toLowerCase().trim(),
        property.name.toLowerCase().trim()
      )
      
      return {
        property,
        similarity
      }
    }).filter(match => match.similarity > 0.7) // Only consider matches above 70% similarity
    
    if (fuzzyMatches.length > 0) {
      // Sort by similarity and take the best match
      fuzzyMatches.sort((a, b) => b.similarity - a.similarity)
      const bestMatch = fuzzyMatches[0]
      
      console.log('✅ CLIENT MATCHING: Fuzzy property name match found')
      console.log('✅ CLIENT MATCHING: Similarity:', (bestMatch.similarity * 100).toFixed(1) + '%')
      
      return {
        clientId: bestMatch.property.userId,
        propertyId: bestMatch.property.id,
        propertyName: bestMatch.property.name,
        confidence: bestMatch.similarity * 0.9, // Reduce confidence for fuzzy matches
        matchMethod: 'fuzzy_property_name'
      }
    }
    
    console.log('❌ CLIENT MATCHING: No suitable property match found')
    return null
    
  } catch (error) {
    console.error('❌ CLIENT MATCHING: Error during client matching:', error)
    return null
  }
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const len1 = str1.length
  const len2 = str2.length
  
  if (len1 === 0) return len2 === 0 ? 1 : 0
  if (len2 === 0) return 0
  
  const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null))
  
  for (let i = 0; i <= len1; i++) {
    matrix[0][i] = i
  }
  
  for (let j = 0; j <= len2; j++) {
    matrix[j][0] = j
  }
  
  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      )
    }
  }
  
  const maxLen = Math.max(len1, len2)
  const distance = matrix[len2][len1]
  
  return (maxLen - distance) / maxLen
}

/**
 * Match client by email (fallback method)
 */
export async function matchClientByEmail(guestEmail: string): Promise<ClientMatchResult | null> {
  try {
    console.log('🔍 CLIENT MATCHING: Attempting to match by email:', guestEmail)
    
    // This would typically query a user database
    // For now, return null as we don't have email-based matching implemented
    console.log('⚠️ CLIENT MATCHING: Email-based matching not implemented yet')
    return null
    
  } catch (error) {
    console.error('❌ CLIENT MATCHING: Error during email matching:', error)
    return null
  }
}

/**
 * Enhanced client matching with multiple strategies
 */
export async function enhancedClientMatching(
  villaName: string,
  guestEmail?: string,
  propertyId?: string
): Promise<ClientMatchResult | null> {
  try {
    console.log('🔍 CLIENT MATCHING: Starting enhanced client matching')
    
    // Strategy 1: Property-based matching
    const propertyMatch = await matchClientProfile(villaName, propertyId)
    if (propertyMatch && propertyMatch.confidence > 0.8) {
      console.log('✅ CLIENT MATCHING: High-confidence property match found')
      return propertyMatch
    }
    
    // Strategy 2: Email-based matching (if available)
    if (guestEmail) {
      const emailMatch = await matchClientByEmail(guestEmail)
      if (emailMatch) {
        console.log('✅ CLIENT MATCHING: Email match found')
        return emailMatch
      }
    }
    
    // Strategy 3: Return best property match even if confidence is lower
    if (propertyMatch) {
      console.log('⚠️ CLIENT MATCHING: Returning lower-confidence property match')
      return propertyMatch
    }
    
    console.log('❌ CLIENT MATCHING: No client match found with any strategy')
    return null
    
  } catch (error) {
    console.error('❌ CLIENT MATCHING: Error during enhanced matching:', error)
    return null
  }
}
