import { db } from '@/lib/firebase'
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  Timestamp 
} from 'firebase/firestore'

export interface SyncResult {
  success: boolean
  message: string
  details?: any
}

export interface UserSyncReport {
  totalUsers: number
  profilesCreated: number
  profilesUpdated: number
  propertiesLinked: number
  orphanedProfilesRemoved: number
  errors: string[]
  details: {
    usersProcessed: string[]
    profilesCreated: string[]
    propertiesLinked: { userId: string; propertyCount: number }[]
  }
}

export class UserSyncService {
  
  /**
   * Comprehensive user profile synchronization
   * Ensures all Firebase Auth users have proper profiles and property links
   */
  static async synchronizeAllUsers(): Promise<UserSyncReport> {
    const report: UserSyncReport = {
      totalUsers: 0,
      profilesCreated: 0,
      profilesUpdated: 0,
      propertiesLinked: 0,
      orphanedProfilesRemoved: 0,
      errors: [],
      details: {
        usersProcessed: [],
        profilesCreated: [],
        propertiesLinked: []
      }
    }

    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized')
      }

      console.log('🔄 Starting comprehensive user synchronization...')

      // Step 1: Get all users from the users collection
      const usersRef = collection(db, 'users')
      const usersSnapshot = await getDocs(usersRef)
      report.totalUsers = usersSnapshot.size

      console.log(`👥 Found ${report.totalUsers} users to process`)

      // Step 2: Process each user
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id
        const userData = userDoc.data()
        
        try {
          console.log(`👤 Processing user: ${userData.email} (${userId})`)
          report.details.usersProcessed.push(userData.email || userId)

          // Step 2a: Ensure profile exists in profiles collection
          const profileResult = await this.ensureUserProfile(userId, userData)
          if (profileResult.success && profileResult.details?.created) {
            report.profilesCreated++
            report.details.profilesCreated.push(userData.email || userId)
          } else if (profileResult.success && profileResult.details?.updated) {
            report.profilesUpdated++
          }

          // Step 2b: Link properties from user subcollection to profile
          const propertiesResult = await this.linkUserProperties(userId, userData.email)
          if (propertiesResult.success && propertiesResult.details?.propertyCount > 0) {
            report.propertiesLinked += propertiesResult.details.propertyCount
            report.details.propertiesLinked.push({
              userId: userData.email || userId,
              propertyCount: propertiesResult.details.propertyCount
            })
          }

        } catch (error) {
          const errorMsg = `Error processing user ${userData.email}: ${error}`
          console.error(errorMsg)
          report.errors.push(errorMsg)
        }
      }

      // Step 3: Clean up orphaned profiles (profiles without corresponding users)
      const orphanCleanupResult = await this.cleanupOrphanedProfiles()
      report.orphanedProfilesRemoved = orphanCleanupResult.details?.removedCount || 0

      console.log('✅ User synchronization completed')
      console.log('📊 Sync Report:', report)

      return report

    } catch (error) {
      const errorMsg = `Fatal error during synchronization: ${error}`
      console.error(errorMsg)
      report.errors.push(errorMsg)
      return report
    }
  }

  /**
   * Ensure a user has a proper profile in the profiles collection
   */
  static async ensureUserProfile(userId: string, userData: any): Promise<SyncResult> {
    try {
      const profileRef = doc(db!, 'profiles', userId)
      const profileDoc = await getDoc(profileRef)

      // Determine if user should be admin
      const isAdmin = userData.email?.toLowerCase() === 'shaun@siamoon.com'
      const userRole = isAdmin ? 'admin' : (userData.role || 'client')

      if (!profileDoc.exists()) {
        // Create missing profile
        const profileData = {
          id: userId,
          email: userData.email?.toLowerCase().trim() || '',
          fullName: userData.fullName || userData.name || 'Unknown User',
          role: userRole,
          properties: [], // Will be populated by linkUserProperties
          preferences: {
            notifications: userData.preferences?.notifications ?? true,
            emailUpdates: userData.preferences?.emailUpdates ?? true
          },
          createdAt: userData.createdAt || Timestamp.now(),
          updatedAt: Timestamp.now()
        }

        await setDoc(profileRef, profileData)
        console.log(`✅ Created profile for: ${userData.email}`)
        
        return {
          success: true,
          message: 'Profile created',
          details: { created: true }
        }
      } else {
        // Update existing profile if needed
        const existingProfile = profileDoc.data()
        const updates: any = {}

        // Check if email needs updating
        if (userData.email && existingProfile.email !== userData.email.toLowerCase().trim()) {
          updates.email = userData.email.toLowerCase().trim()
        }

        // Check if fullName needs updating
        if (userData.fullName && existingProfile.fullName !== userData.fullName) {
          updates.fullName = userData.fullName
        }

        // Check if role needs updating (with admin override)
        const isAdmin = userData.email?.toLowerCase() === 'shaun@siamoon.com'
        const correctRole = isAdmin ? 'admin' : (userData.role || 'client')
        if (existingProfile.role !== correctRole) {
          updates.role = correctRole
        }

        if (Object.keys(updates).length > 0) {
          updates.updatedAt = Timestamp.now()
          await updateDoc(profileRef, updates)
          console.log(`✅ Updated profile for: ${userData.email}`)
          
          return {
            success: true,
            message: 'Profile updated',
            details: { updated: true }
          }
        }

        return {
          success: true,
          message: 'Profile already exists and is up to date'
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `Error ensuring profile: ${error}`
      }
    }
  }

  /**
   * Link properties from user subcollection to user profile
   */
  static async linkUserProperties(userId: string, userEmail: string): Promise<SyncResult> {
    try {
      // Get properties from user subcollection
      const propertiesRef = collection(db!, 'users', userId, 'properties')
      const propertiesSnapshot = await getDocs(propertiesRef)

      if (propertiesSnapshot.size === 0) {
        return {
          success: true,
          message: 'No properties to link',
          details: { propertyCount: 0 }
        }
      }

      // Build property summary for profile
      const properties: any[] = []
      propertiesSnapshot.forEach(propDoc => {
        const propData = propDoc.data()
        properties.push({
          id: propDoc.id,
          name: propData.propertyName || propData.name || 'Unnamed Property',
          address: propData.propertyAddress || propData.address || '',
          description: propData.description || '',
          bedrooms: propData.bedrooms || 0,
          bathrooms: propData.bathrooms || 0,
          maxGuests: propData.maxGuests || 0,
          pricePerNight: propData.pricePerNight || 0,
          currency: propData.currency || 'USD',
          status: propData.status || 'active',
          createdAt: propData.createdAt || Timestamp.now(),
          updatedAt: propData.updatedAt || Timestamp.now()
        })
      })

      // Update profile with property references
      const profileRef = doc(db!, 'profiles', userId)
      await updateDoc(profileRef, {
        properties: properties,
        updatedAt: Timestamp.now()
      })

      console.log(`✅ Linked ${properties.length} properties for: ${userEmail}`)

      return {
        success: true,
        message: `Linked ${properties.length} properties`,
        details: { propertyCount: properties.length }
      }

    } catch (error) {
      return {
        success: false,
        message: `Error linking properties: ${error}`
      }
    }
  }

  /**
   * Clean up orphaned profiles (profiles without corresponding users)
   */
  static async cleanupOrphanedProfiles(): Promise<SyncResult> {
    try {
      const profilesRef = collection(db!, 'profiles')
      const profilesSnapshot = await getDocs(profilesRef)
      
      const usersRef = collection(db!, 'users')
      const usersSnapshot = await getDocs(usersRef)
      
      // Create set of valid user IDs
      const validUserIds = new Set<string>()
      usersSnapshot.forEach(doc => {
        validUserIds.add(doc.id)
      })

      let removedCount = 0
      
      // Check each profile
      for (const profileDoc of profilesSnapshot.docs) {
        if (!validUserIds.has(profileDoc.id)) {
          console.log(`🗑️ Removing orphaned profile: ${profileDoc.id}`)
          await deleteDoc(profileDoc.ref)
          removedCount++
        }
      }

      return {
        success: true,
        message: `Removed ${removedCount} orphaned profiles`,
        details: { removedCount }
      }

    } catch (error) {
      return {
        success: false,
        message: `Error cleaning up orphaned profiles: ${error}`
      }
    }
  }

  /**
   * Validate data consistency across all collections
   */
  static async validateDataConsistency(): Promise<{
    isConsistent: boolean
    issues: string[]
    recommendations: string[]
  }> {
    const issues: string[] = []
    const recommendations: string[] = []

    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized')
      }

      // Check 1: Users without profiles
      const usersRef = collection(db, 'users')
      const usersSnapshot = await getDocs(usersRef)
      
      for (const userDoc of usersSnapshot.docs) {
        const profileRef = doc(db, 'profiles', userDoc.id)
        const profileDoc = await getDoc(profileRef)
        
        if (!profileDoc.exists()) {
          const userData = userDoc.data()
          issues.push(`User ${userData.email} (${userDoc.id}) has no profile`)
          recommendations.push(`Create profile for ${userData.email}`)
        }
      }

      // Check 2: Profiles without users
      const profilesRef = collection(db, 'profiles')
      const profilesSnapshot = await getDocs(profilesRef)
      
      for (const profileDoc of profilesSnapshot.docs) {
        const userRef = doc(db, 'users', profileDoc.id)
        const userDoc = await getDoc(userRef)
        
        if (!userDoc.exists()) {
          const profileData = profileDoc.data()
          issues.push(`Profile ${profileData.email} (${profileDoc.id}) has no corresponding user`)
          recommendations.push(`Remove orphaned profile for ${profileData.email}`)
        }
      }

      // Check 3: Properties without proper user links
      for (const userDoc of usersSnapshot.docs) {
        const propertiesRef = collection(db, 'users', userDoc.id, 'properties')
        const propertiesSnapshot = await getDocs(propertiesRef)
        
        if (propertiesSnapshot.size > 0) {
          const profileRef = doc(db, 'profiles', userDoc.id)
          const profileDoc = await getDoc(profileRef)
          
          if (profileDoc.exists()) {
            const profileData = profileDoc.data()
            const profilePropertyCount = profileData.properties?.length || 0
            
            if (profilePropertyCount !== propertiesSnapshot.size) {
              const userData = userDoc.data()
              issues.push(`User ${userData.email} has ${propertiesSnapshot.size} properties but profile shows ${profilePropertyCount}`)
              recommendations.push(`Sync properties for ${userData.email}`)
            }
          }
        }
      }

      return {
        isConsistent: issues.length === 0,
        issues,
        recommendations
      }

    } catch (error) {
      issues.push(`Error during validation: ${error}`)
      return {
        isConsistent: false,
        issues,
        recommendations
      }
    }
  }
}
