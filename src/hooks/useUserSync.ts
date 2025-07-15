import { useCallback } from 'react'
import { UserSyncService } from '@/lib/services/userSyncService'

/**
 * Hook for user synchronization operations
 * Provides methods to ensure data consistency during user operations
 */
export const useUserSync = () => {
  
  /**
   * Ensure a specific user has proper profile synchronization
   * Call this after user signup or profile updates
   */
  const syncUserProfile = useCallback(async (userId: string, userData: {
    email: string
    fullName: string
    role?: 'client' | 'staff' | 'admin'
  }) => {
    try {
      console.log('🔄 Syncing user profile:', userData.email)
      
      // Ensure profile exists and is up to date
      const profileResult = await UserSyncService.ensureUserProfile(userId, userData)
      
      if (!profileResult.success) {
        console.error('❌ Failed to sync user profile:', profileResult.message)
        return { success: false, error: profileResult.message }
      }
      
      // Link any existing properties
      const propertiesResult = await UserSyncService.linkUserProperties(userId, userData.email)
      
      if (!propertiesResult.success) {
        console.warn('⚠️ Failed to link user properties:', propertiesResult.message)
        // Don't fail the entire operation for property linking issues
      }
      
      console.log('✅ User profile synchronized successfully')
      return { 
        success: true, 
        profileCreated: profileResult.details?.created || false,
        profileUpdated: profileResult.details?.updated || false,
        propertiesLinked: propertiesResult.details?.propertyCount || 0
      }
      
    } catch (error) {
      console.error('❌ Error during user sync:', error)
      return { success: false, error: `Sync failed: ${error}` }
    }
  }, [])

  /**
   * Sync user profile after property creation
   * Call this after onboarding form submission
   */
  const syncAfterPropertyCreation = useCallback(async (userId: string, userEmail: string) => {
    try {
      console.log('🏠 Syncing user profile after property creation:', userEmail)
      
      // Link the newly created properties to the user profile
      const result = await UserSyncService.linkUserProperties(userId, userEmail)
      
      if (!result.success) {
        console.error('❌ Failed to sync properties:', result.message)
        return { success: false, error: result.message }
      }
      
      console.log(`✅ Synced ${result.details?.propertyCount || 0} properties for user`)
      return { 
        success: true, 
        propertiesLinked: result.details?.propertyCount || 0 
      }
      
    } catch (error) {
      console.error('❌ Error during property sync:', error)
      return { success: false, error: `Property sync failed: ${error}` }
    }
  }, [])

  /**
   * Validate user data consistency
   * Call this to check if a user's data is properly synchronized
   */
  const validateUserConsistency = useCallback(async (userId: string) => {
    try {
      console.log('🔍 Validating user consistency:', userId)
      
      // This is a simplified version - the full validation is in UserSyncService
      const result = await UserSyncService.validateDataConsistency()
      
      // Filter results for this specific user
      const userIssues = result.issues.filter(issue => issue.includes(userId))
      const userRecommendations = result.recommendations.filter(rec => rec.includes(userId))
      
      return {
        success: true,
        isConsistent: userIssues.length === 0,
        issues: userIssues,
        recommendations: userRecommendations
      }
      
    } catch (error) {
      console.error('❌ Error during validation:', error)
      return { 
        success: false, 
        error: `Validation failed: ${error}`,
        isConsistent: false,
        issues: [],
        recommendations: []
      }
    }
  }, [])

  /**
   * Auto-sync user profile during authentication
   * Call this in auth state change handlers
   */
  const autoSyncOnAuth = useCallback(async (firebaseUser: any) => {
    try {
      if (!firebaseUser) return { success: true }
      
      console.log('🔄 Auto-syncing user on auth:', firebaseUser.email)
      
      const userData = {
        email: firebaseUser.email || '',
        fullName: firebaseUser.displayName || 'Unknown User',
        role: (firebaseUser.email === 'shaun@siamoon.com' ? 'admin' : 'client') as 'admin' | 'client'
      }
      
      return await syncUserProfile(firebaseUser.uid, userData)
      
    } catch (error) {
      console.error('❌ Error during auto-sync:', error)
      return { success: false, error: `Auto-sync failed: ${error}` }
    }
  }, [syncUserProfile])

  return {
    syncUserProfile,
    syncAfterPropertyCreation,
    validateUserConsistency,
    autoSyncOnAuth
  }
}
