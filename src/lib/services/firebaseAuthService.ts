/**
 * Firebase Authentication Service
 * 
 * Handles Firebase Auth user creation, management, and credential operations
 * for staff members and user account management.
 */

import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateEmail,
  deleteUser,
  sendPasswordResetEmail,
  User as FirebaseUser,
  UserCredential
} from 'firebase/auth'
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore'
import { getAuth } from '@/lib/firebase'
import { getDb } from '@/lib/firebase'

export interface CreateStaffUserData {
  email: string
  password: string
  name: string
  role: 'staff' | 'admin' | 'client'
  staffProfile: {
    name: string
    role: string
    phone?: string
    address?: string
    assignedProperties: string[]
    skills: string[]
    status: string
    emergencyContact?: {
      name: string
      phone: string
      relationship: string
    }
    employment?: {
      employmentType: string
      startDate: string
      salary?: number
      benefits?: string[]
    }
    personalDetails?: {
      dateOfBirth?: string
      nationalId?: string
    }
  }
}

export interface UserCreationResult {
  success: boolean
  userId?: string
  staffId?: string
  message: string
  error?: string
  firebaseUser?: FirebaseUser
}

export interface StaffCredentials {
  email: string
  temporaryPassword: string
  mustChangePassword?: boolean
}

export class FirebaseAuthService {
  private static auth = getAuth()
  private static db = getDb()

  /**
   * Create a new Firebase Auth user for staff member
   */
  static async createStaffUser(userData: CreateStaffUserData): Promise<UserCreationResult> {
    try {
      console.log('🔐 Creating Firebase Auth user for staff:', userData.email)

      // Check if email already exists
      const existingUser = await this.checkEmailExists(userData.email)
      if (existingUser) {
        return {
          success: false,
          message: 'Email already exists',
          error: 'A user with this email address already exists in the system'
        }
      }

      // Create Firebase Auth user
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        this.auth,
        userData.email,
        userData.password
      )

      const firebaseUser = userCredential.user
      console.log('✅ Firebase Auth user created:', firebaseUser.uid)

      // Create user profile document in /users collection
      const userProfile = {
        id: firebaseUser.uid,
        email: userData.email,
        full_name: userData.name,
        role: userData.role,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true,
        mustChangePassword: true, // Force password change on first login
        createdBy: 'admin', // Track who created this user
        lastLoginAt: null
      }

      await setDoc(doc(this.db, 'users', firebaseUser.uid), userProfile)
      console.log('✅ User profile document created')

      // Create staff profile document in /staff collection
      const staffProfile = {
        id: firebaseUser.uid, // Use Firebase UID as staff ID
        userId: firebaseUser.uid,
        ...userData.staffProfile,
        email: userData.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true,
        firebaseUid: firebaseUser.uid,
        // Performance tracking
        performanceMetrics: {
          tasksCompleted: 0,
          averageRating: 0,
          totalRatings: 0,
          completionRate: 0,
          punctualityScore: 0
        },
        // Availability tracking
        availability: {
          status: 'available',
          schedule: {},
          timeOff: []
        }
      }

      await setDoc(doc(this.db, 'staff', firebaseUser.uid), staffProfile)
      console.log('✅ Staff profile document created')

      // Create sync event for cross-platform updates
      await this.createSyncEvent('staff_created', firebaseUser.uid, 'staff', 'admin', 'Admin', {
        action: 'staff_user_created',
        email: userData.email,
        role: userData.role,
        staffRole: userData.staffProfile.role
      })

      return {
        success: true,
        userId: firebaseUser.uid,
        staffId: firebaseUser.uid,
        message: 'Staff user created successfully',
        firebaseUser
      }

    } catch (error: any) {
      console.error('❌ Error creating staff user:', error)
      
      // Handle specific Firebase Auth errors
      let errorMessage = 'Failed to create staff user'
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email address is already in use'
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use at least 6 characters'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format'
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/password accounts are not enabled'
      }

      return {
        success: false,
        message: errorMessage,
        error: error.message
      }
    }
  }

  /**
   * Check if email already exists in Firebase Auth
   */
  static async checkEmailExists(email: string): Promise<boolean> {
    try {
      // Query users collection to check if email exists
      const usersRef = collection(this.db, 'users')
      const q = query(usersRef, where('email', '==', email))
      const querySnapshot = await getDocs(q)
      
      return !querySnapshot.empty
    } catch (error) {
      console.error('Error checking email existence:', error)
      return false
    }
  }

  /**
   * Generate secure temporary password
   */
  static generateTemporaryPassword(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''
    
    // Ensure at least one of each type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]
    password += '0123456789'[Math.floor(Math.random() * 10)]
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)]
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('')
  }

  /**
   * Update staff user credentials
   */
  static async updateStaffCredentials(
    userId: string, 
    updates: { email?: string; password?: string }
  ): Promise<UserCreationResult> {
    try {
      console.log('🔐 Updating staff credentials for user:', userId)

      // Get current user document
      const userDoc = await getDoc(doc(this.db, 'users', userId))
      if (!userDoc.exists()) {
        return {
          success: false,
          message: 'User not found',
          error: 'User document does not exist'
        }
      }

      const updateData: any = {
        updatedAt: serverTimestamp()
      }

      // Update email if provided
      if (updates.email) {
        updateData.email = updates.email
        
        // Also update staff profile
        await updateDoc(doc(this.db, 'staff', userId), {
          email: updates.email,
          updatedAt: serverTimestamp()
        })
      }

      // Update user document
      await updateDoc(doc(this.db, 'users', userId), updateData)

      return {
        success: true,
        userId,
        message: 'Staff credentials updated successfully'
      }

    } catch (error: any) {
      console.error('❌ Error updating staff credentials:', error)
      return {
        success: false,
        message: 'Failed to update credentials',
        error: error.message
      }
    }
  }

  /**
   * Delete staff user and all associated data
   */
  static async deleteStaffUser(userId: string): Promise<UserCreationResult> {
    try {
      console.log('🗑️ Deleting staff user:', userId)

      // Delete user document
      await deleteDoc(doc(this.db, 'users', userId))
      
      // Delete staff profile
      await deleteDoc(doc(this.db, 'staff', userId))

      // Create sync event
      await this.createSyncEvent('staff_deleted', userId, 'staff', 'admin', 'Admin', {
        action: 'staff_user_deleted'
      })

      return {
        success: true,
        userId,
        message: 'Staff user deleted successfully'
      }

    } catch (error: any) {
      console.error('❌ Error deleting staff user:', error)
      return {
        success: false,
        message: 'Failed to delete staff user',
        error: error.message
      }
    }
  }

  /**
   * Send password reset email to staff member
   */
  static async sendStaffPasswordReset(email: string): Promise<UserCreationResult> {
    try {
      await sendPasswordResetEmail(this.auth, email)
      
      return {
        success: true,
        message: 'Password reset email sent successfully'
      }
    } catch (error: any) {
      console.error('❌ Error sending password reset:', error)
      return {
        success: false,
        message: 'Failed to send password reset email',
        error: error.message
      }
    }
  }

  /**
   * Create sync event for cross-platform updates
   */
  private static async createSyncEvent(
    type: string,
    entityId: string,
    entityType: string,
    triggeredBy: string,
    triggeredByName: string,
    changes: Record<string, any> = {}
  ): Promise<void> {
    try {
      const syncEvent = {
        type,
        entityId,
        entityType,
        triggeredBy,
        triggeredByName,
        timestamp: serverTimestamp(),
        changes,
        platform: 'web',
        synced: false
      }

      await setDoc(doc(collection(this.db, 'sync_events')), syncEvent)
      console.log(`✅ Sync event created: ${type} for ${entityType} ${entityId}`)
    } catch (error) {
      console.error('❌ Error creating sync event:', error)
    }
  }
}
