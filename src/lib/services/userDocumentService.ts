/**
 * User Document Service
 * 
 * Manages user documents in Firestore for authentication and authorization.
 * Handles user profile creation, updates, and role management.
 */

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { getDb } from '@/lib/firebase'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: 'client' | 'staff' | 'admin'
  createdAt: Timestamp | any
  updatedAt: Timestamp | any
  isActive: boolean
  mustChangePassword?: boolean
  createdBy?: string
  lastLoginAt?: Timestamp | null
  profilePicture?: string
  preferences?: {
    language?: string
    timezone?: string
    notifications?: {
      email: boolean
      push: boolean
      sms: boolean
    }
  }
  metadata?: {
    lastIpAddress?: string
    userAgent?: string
    loginCount?: number
    failedLoginAttempts?: number
    accountLockedUntil?: Timestamp | null
  }
}

export interface CreateUserProfileData {
  id: string
  email: string
  full_name: string
  role: 'client' | 'staff' | 'admin'
  mustChangePassword?: boolean
  createdBy?: string
  isActive?: boolean
  preferences?: UserProfile['preferences']
}

export interface UpdateUserProfileData {
  full_name?: string
  email?: string
  role?: 'client' | 'staff' | 'admin'
  isActive?: boolean
  mustChangePassword?: boolean
  lastLoginAt?: Timestamp
  profilePicture?: string
  preferences?: UserProfile['preferences']
  metadata?: UserProfile['metadata']
}

export interface UserServiceResult {
  success: boolean
  message: string
  error?: string
  user?: UserProfile
  users?: UserProfile[]
}

export class UserDocumentService {
  private static db = getDb()

  /**
   * Create a new user profile document
   */
  static async createUserProfile(userData: CreateUserProfileData): Promise<UserServiceResult> {
    try {
      console.log('👤 Creating user profile document:', userData.email)

      // Check if user already exists
      const existingUser = await this.getUserProfile(userData.id)
      if (existingUser.success && existingUser.user) {
        return {
          success: false,
          message: 'User profile already exists',
          error: 'A user profile with this ID already exists'
        }
      }

      const userProfile: UserProfile = {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: userData.isActive ?? true,
        mustChangePassword: userData.mustChangePassword ?? true,
        createdBy: userData.createdBy || 'system',
        lastLoginAt: null,
        preferences: {
          language: 'en',
          timezone: 'UTC',
          notifications: {
            email: true,
            push: true,
            sms: false
          },
          ...userData.preferences
        },
        metadata: {
          loginCount: 0,
          failedLoginAttempts: 0,
          accountLockedUntil: null
        }
      }

      await setDoc(doc(this.db, 'users', userData.id), userProfile)
      console.log('✅ User profile document created successfully')

      return {
        success: true,
        message: 'User profile created successfully',
        user: userProfile
      }

    } catch (error: any) {
      console.error('❌ Error creating user profile:', error)
      return {
        success: false,
        message: 'Failed to create user profile',
        error: error.message
      }
    }
  }

  /**
   * Get user profile by ID
   */
  static async getUserProfile(userId: string): Promise<UserServiceResult> {
    try {
      const userDoc = await getDoc(doc(this.db, 'users', userId))
      
      if (!userDoc.exists()) {
        return {
          success: false,
          message: 'User profile not found',
          error: 'No user profile found with the specified ID'
        }
      }

      const user = { id: userDoc.id, ...userDoc.data() } as UserProfile

      return {
        success: true,
        message: 'User profile retrieved successfully',
        user
      }

    } catch (error: any) {
      console.error('❌ Error getting user profile:', error)
      return {
        success: false,
        message: 'Failed to retrieve user profile',
        error: error.message
      }
    }
  }

  /**
   * Get user profile by email
   */
  static async getUserProfileByEmail(email: string): Promise<UserServiceResult> {
    try {
      const usersRef = collection(this.db, 'users')
      const q = query(usersRef, where('email', '==', email))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        return {
          success: false,
          message: 'User profile not found',
          error: 'No user profile found with the specified email'
        }
      }

      const userDoc = querySnapshot.docs[0]
      const user = { id: userDoc.id, ...userDoc.data() } as UserProfile

      return {
        success: true,
        message: 'User profile retrieved successfully',
        user
      }

    } catch (error: any) {
      console.error('❌ Error getting user profile by email:', error)
      return {
        success: false,
        message: 'Failed to retrieve user profile',
        error: error.message
      }
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(userId: string, updates: UpdateUserProfileData): Promise<UserServiceResult> {
    try {
      console.log('📝 Updating user profile:', userId)

      // Check if user exists
      const existingUser = await this.getUserProfile(userId)
      if (!existingUser.success || !existingUser.user) {
        return {
          success: false,
          message: 'User profile not found',
          error: 'Cannot update non-existent user profile'
        }
      }

      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      }

      await updateDoc(doc(this.db, 'users', userId), updateData)
      console.log('✅ User profile updated successfully')

      // Get updated user profile
      const updatedUser = await this.getUserProfile(userId)

      return {
        success: true,
        message: 'User profile updated successfully',
        user: updatedUser.user
      }

    } catch (error: any) {
      console.error('❌ Error updating user profile:', error)
      return {
        success: false,
        message: 'Failed to update user profile',
        error: error.message
      }
    }
  }

  /**
   * Delete user profile
   */
  static async deleteUserProfile(userId: string): Promise<UserServiceResult> {
    try {
      console.log('🗑️ Deleting user profile:', userId)

      // Check if user exists
      const existingUser = await this.getUserProfile(userId)
      if (!existingUser.success || !existingUser.user) {
        return {
          success: false,
          message: 'User profile not found',
          error: 'Cannot delete non-existent user profile'
        }
      }

      await deleteDoc(doc(this.db, 'users', userId))
      console.log('✅ User profile deleted successfully')

      return {
        success: true,
        message: 'User profile deleted successfully'
      }

    } catch (error: any) {
      console.error('❌ Error deleting user profile:', error)
      return {
        success: false,
        message: 'Failed to delete user profile',
        error: error.message
      }
    }
  }

  /**
   * Get all users by role
   */
  static async getUsersByRole(role: 'client' | 'staff' | 'admin'): Promise<UserServiceResult> {
    try {
      const usersRef = collection(this.db, 'users')
      const q = query(usersRef, where('role', '==', role), where('isActive', '==', true))
      const querySnapshot = await getDocs(q)

      const users: UserProfile[] = []
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() } as UserProfile)
      })

      return {
        success: true,
        message: `Retrieved ${users.length} ${role} users`,
        users
      }

    } catch (error: any) {
      console.error('❌ Error getting users by role:', error)
      return {
        success: false,
        message: 'Failed to retrieve users',
        error: error.message
      }
    }
  }

  /**
   * Update user login metadata
   */
  static async updateLoginMetadata(userId: string, metadata: {
    lastIpAddress?: string
    userAgent?: string
    incrementLoginCount?: boolean
    resetFailedAttempts?: boolean
  }): Promise<UserServiceResult> {
    try {
      const updateData: any = {
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      if (metadata.lastIpAddress) {
        updateData['metadata.lastIpAddress'] = metadata.lastIpAddress
      }

      if (metadata.userAgent) {
        updateData['metadata.userAgent'] = metadata.userAgent
      }

      if (metadata.incrementLoginCount) {
        // Get current user to increment login count
        const userResult = await this.getUserProfile(userId)
        if (userResult.success && userResult.user) {
          const currentCount = userResult.user.metadata?.loginCount || 0
          updateData['metadata.loginCount'] = currentCount + 1
        }
      }

      if (metadata.resetFailedAttempts) {
        updateData['metadata.failedLoginAttempts'] = 0
        updateData['metadata.accountLockedUntil'] = null
      }

      await updateDoc(doc(this.db, 'users', userId), updateData)

      return {
        success: true,
        message: 'Login metadata updated successfully'
      }

    } catch (error: any) {
      console.error('❌ Error updating login metadata:', error)
      return {
        success: false,
        message: 'Failed to update login metadata',
        error: error.message
      }
    }
  }

  /**
   * Handle failed login attempt
   */
  static async handleFailedLogin(userId: string): Promise<UserServiceResult> {
    try {
      const userResult = await this.getUserProfile(userId)
      if (!userResult.success || !userResult.user) {
        return {
          success: false,
          message: 'User not found',
          error: 'Cannot update failed login for non-existent user'
        }
      }

      const currentAttempts = userResult.user.metadata?.failedLoginAttempts || 0
      const newAttempts = currentAttempts + 1
      const maxAttempts = 5 // Lock account after 5 failed attempts

      const updateData: any = {
        'metadata.failedLoginAttempts': newAttempts,
        updatedAt: serverTimestamp()
      }

      // Lock account if max attempts reached
      if (newAttempts >= maxAttempts) {
        const lockUntil = new Date()
        lockUntil.setMinutes(lockUntil.getMinutes() + 30) // Lock for 30 minutes
        updateData['metadata.accountLockedUntil'] = lockUntil
        updateData.isActive = false
      }

      await updateDoc(doc(this.db, 'users', userId), updateData)

      return {
        success: true,
        message: newAttempts >= maxAttempts 
          ? 'Account locked due to too many failed attempts'
          : 'Failed login attempt recorded'
      }

    } catch (error: any) {
      console.error('❌ Error handling failed login:', error)
      return {
        success: false,
        message: 'Failed to handle failed login',
        error: error.message
      }
    }
  }

  /**
   * Check if user account is locked
   */
  static async isAccountLocked(userId: string): Promise<boolean> {
    try {
      const userResult = await this.getUserProfile(userId)
      if (!userResult.success || !userResult.user) {
        return false
      }

      const user = userResult.user
      const lockUntil = user.metadata?.accountLockedUntil

      if (!lockUntil) {
        return false
      }

      const now = new Date()
      const lockDate = lockUntil instanceof Date ? lockUntil : new Date(lockUntil.seconds * 1000)

      return now < lockDate

    } catch (error) {
      console.error('❌ Error checking account lock status:', error)
      return false
    }
  }
}
