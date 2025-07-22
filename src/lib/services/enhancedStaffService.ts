/**
 * Enhanced Staff Service with Firebase Integration
 *
 * Comprehensive staff management service that integrates Firebase Authentication,
 * user document creation, and staff profile management for cross-platform sync.
 */

import { getDb } from '@/lib/firebase'
import {
    collection,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    Timestamp,
    updateDoc
} from 'firebase/firestore'
import { CreateStaffUserData, FirebaseAuthService } from './firebaseAuthService'
// UserDocumentService removed - service not available
// import { UserDocumentService } from './userDocumentService'
import { CreateStaffData, StaffProfile } from '@/types/staff'

export interface EnhancedCreateStaffData extends CreateStaffData {
  // Authentication credentials
  email: string
  temporaryPassword?: string
  mustChangePassword?: boolean

  // Additional Firebase-specific fields
  firebaseUid?: string
  userRole?: 'staff' | 'admin'

  // Enhanced profile data
  profilePicture?: string
  certifications?: Array<{
    name: string
    issuer: string
    dateObtained: string
    expiryDate?: string
    certificateUrl?: string
  }>

  // Work history
  workHistory?: Array<{
    company: string
    position: string
    startDate: string
    endDate?: string
    description?: string
  }>

  // Training records
  trainingRecords?: Array<{
    trainingName: string
    provider: string
    completedDate: string
    certificateUrl?: string
    expiryDate?: string
  }>
}

export interface EnhancedStaffProfile extends StaffProfile {
  firebaseUid: string
  userId: string
  email: string
  profilePicture?: string
  certifications?: Array<{
    id: string
    name: string
    issuer: string
    dateObtained: string
    expiryDate?: string
    certificateUrl?: string
  }>
  workHistory?: Array<{
    id: string
    company: string
    position: string
    startDate: string
    endDate?: string
    description?: string
  }>
  trainingRecords?: Array<{
    id: string
    trainingName: string
    provider: string
    completedDate: string
    certificateUrl?: string
    expiryDate?: string
  }>
  createdAt: Timestamp
  updatedAt: Timestamp
  lastSyncedAt?: Timestamp
  syncVersion: number
}

export interface StaffCreationResult {
  success: boolean
  message: string
  error?: string
  staffProfile?: EnhancedStaffProfile
  userCredentials?: {
    email: string
    temporaryPassword: string
    mustChangePassword: boolean
  }
  firebaseUid?: string
}

export class EnhancedStaffService {
  private static db = getDb()

  /**
   * Create a complete staff member with Firebase Auth user
   */
  static async createStaffWithAuth(staffData: EnhancedCreateStaffData): Promise<StaffCreationResult> {
    try {
      console.log('🏗️ Creating complete staff member with authentication:', staffData.name)
      console.log('📋 Staff data received:', staffData)

      // Generate temporary password if not provided
      const temporaryPassword = staffData.temporaryPassword ||
        FirebaseAuthService.generateTemporaryPassword(12)

      // Prepare Firebase Auth user data
      const authUserData: CreateStaffUserData = {
        email: staffData.email,
        password: temporaryPassword,
        name: staffData.name,
        role: staffData.userRole || 'staff',
        staffProfile: {
          name: staffData.name,
          role: staffData.role,
          phone: staffData.phone,
          address: staffData.address,
          assignedProperties: staffData.assignedProperties || [],
          skills: staffData.skills || [],
          status: staffData.status || 'active',
          emergencyContact: staffData.emergencyContact,
          employment: staffData.employment,
          personalDetails: staffData.personalDetails
        }
      }

      // Create Firebase Auth user and basic documents
      console.log('📞 Calling FirebaseAuthService.createStaffUser with:', authUserData)
      const authResult = await FirebaseAuthService.createStaffUser(authUserData)
      console.log('📋 Auth result:', authResult)

      if (!authResult.success || !authResult.userId) {
        return {
          success: false,
          message: authResult.message,
          error: authResult.error
        }
      }

      // Create enhanced staff profile with additional data
      const enhancedProfile: Omit<EnhancedStaffProfile, 'id'> = {
        firebaseUid: authResult.userId,
        userId: authResult.userId,
        name: staffData.name,
        email: staffData.email,
        phone: staffData.phone || '',
        address: staffData.address || '',
        role: staffData.role,
        status: staffData.status || 'active',
        assignedProperties: staffData.assignedProperties || [],
        skills: staffData.skills || [],
        emergencyContact: staffData.emergencyContact,
        employment: staffData.employment,
        personalDetails: staffData.personalDetails,
        profilePicture: staffData.profilePicture,

        // Enhanced fields with IDs
        certifications: staffData.certifications?.map((cert, index) => ({
          id: `cert_${Date.now()}_${index}`,
          ...cert
        })) || [],

        workHistory: staffData.workHistory?.map((work, index) => ({
          id: `work_${Date.now()}_${index}`,
          ...work
        })) || [],

        trainingRecords: staffData.trainingRecords?.map((training, index) => ({
          id: `training_${Date.now()}_${index}`,
          ...training
        })) || [],

        // Performance and availability (initialized)
        performanceMetrics: {
          tasksCompleted: 0,
          averageRating: 0,
          totalRatings: 0,
          completionRate: 0,
          punctualityScore: 0
        },

        availability: {
          status: 'available',
          schedule: {},
          timeOff: []
        },

        // Timestamps and sync
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
        lastSyncedAt: serverTimestamp() as any,
        syncVersion: 1
      }

      // Update the staff document with enhanced data
      await setDoc(doc(this.db, 'staff', authResult.userId), enhancedProfile)
      console.log('✅ Enhanced staff profile created')

      // Create staff account document for mobile app authentication
      const staffAccount = {
        firebaseUid: authResult.userId,
        email: staffData.email,
        name: staffData.name,
        role: staffData.role,
        status: staffData.status || 'active',
        phone: staffData.phone || '',
        assignedProperties: staffData.assignedProperties || [],
        skills: staffData.skills || [],
        hasCredentials: true,
        mustChangePassword: staffData.mustChangePassword ?? true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: null,
        loginCount: 0,
        isActive: true,
        syncVersion: 1
      }

      await setDoc(doc(this.db, 'staff_accounts', authResult.userId), staffAccount)
      console.log('✅ Staff account created for mobile app authentication')

      // Create sync event for mobile app
      await this.createSyncEvent(
        'staff_created_enhanced',
        authResult.userId,
        'staff',
        'admin',
        'Admin',
        {
          action: 'enhanced_staff_created',
          email: staffData.email,
          role: staffData.role,
          hasCredentials: true,
          assignedProperties: staffData.assignedProperties?.length || 0,
          skills: staffData.skills?.length || 0
        }
      )

      return {
        success: true,
        message: 'Staff member created successfully with authentication',
        staffProfile: { id: authResult.userId, ...enhancedProfile } as EnhancedStaffProfile,
        userCredentials: {
          email: staffData.email,
          temporaryPassword,
          mustChangePassword: staffData.mustChangePassword ?? true
        },
        firebaseUid: authResult.userId
      }

    } catch (error: any) {
      console.error('❌ Error creating staff with auth:', error)
      return {
        success: false,
        message: 'Failed to create staff member',
        error: error.message
      }
    }
  }

  /**
   * Get enhanced staff profile by ID
   */
  static async getEnhancedStaffProfile(staffId: string): Promise<{
    success: boolean
    message: string
    error?: string
    staff?: EnhancedStaffProfile
  }> {
    try {
      const staffDoc = await getDoc(doc(this.db, 'staff', staffId))

      if (!staffDoc.exists()) {
        return {
          success: false,
          message: 'Staff member not found',
          error: 'No staff profile found with the specified ID'
        }
      }

      const staff = { id: staffDoc.id, ...staffDoc.data() } as EnhancedStaffProfile

      return {
        success: true,
        message: 'Staff profile retrieved successfully',
        staff
      }

    } catch (error: any) {
      console.error('❌ Error getting enhanced staff profile:', error)
      return {
        success: false,
        message: 'Failed to retrieve staff profile',
        error: error.message
      }
    }
  }

  /**
   * Update enhanced staff profile
   */
  static async updateEnhancedStaffProfile(
    staffId: string,
    updates: Partial<EnhancedStaffProfile>
  ): Promise<StaffCreationResult> {
    try {
      console.log('📝 Updating enhanced staff profile:', staffId)

      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        syncVersion: (updates.syncVersion || 1) + 1,
        lastSyncedAt: serverTimestamp()
      }

      // Remove ID from updates to avoid Firestore error
      delete updateData.id

      await updateDoc(doc(this.db, 'staff', staffId), updateData)

      // If email is updated, also update user document
      if (updates.email) {
        // UserDocumentService temporarily disabled - service removed during cleanup
        // TODO: Implement user profile update using available services
        console.log('User profile update requested for:', staffId, { email: updates.email })
      }

      // Create sync event
      await this.createSyncEvent(
        'staff_updated',
        staffId,
        'staff',
        'admin',
        'Admin',
        {
          action: 'staff_profile_updated',
          updatedFields: Object.keys(updates)
        }
      )

      return {
        success: true,
        message: 'Staff profile updated successfully'
      }

    } catch (error: any) {
      console.error('❌ Error updating enhanced staff profile:', error)
      return {
        success: false,
        message: 'Failed to update staff profile',
        error: error.message
      }
    }
  }

  /**
   * Get all staff members with enhanced profiles
   */
  static async getAllEnhancedStaff(): Promise<{
    success: boolean
    message: string
    error?: string
    staff?: EnhancedStaffProfile[]
  }> {
    try {
      const staffRef = collection(this.db, 'staff')
      const q = query(staffRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)

      const staff: EnhancedStaffProfile[] = []
      querySnapshot.forEach((doc) => {
        staff.push({ id: doc.id, ...doc.data() } as EnhancedStaffProfile)
      })

      return {
        success: true,
        message: `Retrieved ${staff.length} staff members`,
        staff
      }

    } catch (error: any) {
      console.error('❌ Error getting all enhanced staff:', error)
      return {
        success: false,
        message: 'Failed to retrieve staff members',
        error: error.message
      }
    }
  }

  /**
   * Delete staff member and all associated data
   */
  static async deleteStaffMember(staffId: string): Promise<StaffCreationResult> {
    try {
      console.log('🗑️ Deleting staff member:', staffId)

      // Delete from Firebase Auth and user documents
      const authResult = await FirebaseAuthService.deleteStaffUser(staffId)

      if (!authResult.success) {
        return {
          success: false,
          message: authResult.message,
          error: authResult.error
        }
      }

      return {
        success: true,
        message: 'Staff member deleted successfully'
      }

    } catch (error: any) {
      console.error('❌ Error deleting staff member:', error)
      return {
        success: false,
        message: 'Failed to delete staff member',
        error: error.message
      }
    }
  }

  /**
   * Reset staff member password
   */
  static async resetStaffPassword(email: string): Promise<StaffCreationResult> {
    try {
      const result = await FirebaseAuthService.sendStaffPasswordReset(email)
      return {
        success: result.success,
        message: result.message,
        error: result.error
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to reset password',
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
