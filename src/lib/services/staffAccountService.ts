import { db } from '@/lib/firebase'
import { collection, doc, setDoc, getDocs, query, orderBy, serverTimestamp, deleteDoc, updateDoc, getDoc } from 'firebase/firestore'
import { FirebaseAuthService, CreateStaffUserData } from './firebaseAuthService'

/**
 * Staff Account Service
 * Manages staff accounts in the staff_accounts collection
 * This is separate from regular users and provides better organization
 */

export interface StaffAccountData {
  // Basic Information
  name: string
  email: string
  phone: string
  address: string
  role: string
  status: 'active' | 'inactive' | 'suspended'
  
  // Authentication
  temporaryPassword?: string
  mustChangePassword?: boolean
  
  // Assignment
  assignedProperties?: string[]
  skills?: string[]
  
  // Emergency Contact
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
  
  // Employment Details
  employment?: {
    employmentType: string
    startDate: string
    salary?: number
    benefits?: string[]
  }
  
  // Personal Details
  personalDetails?: {
    dateOfBirth?: string
    nationalId?: string
  }
}

export interface StaffAccount {
  id: string
  firebaseUid: string
  name: string
  email: string
  phone: string
  address: string
  role: string
  status: 'active' | 'inactive' | 'suspended'
  assignedProperties: string[]
  skills: string[]
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
  hasCredentials: boolean
  isActive: boolean
  createdAt: any
  updatedAt: any
  createdBy?: string
  lastModifiedBy?: string
}

export interface StaffAccountCreationResult {
  success: boolean
  message: string
  error?: string
  staffAccount?: StaffAccount
  userCredentials?: {
    email: string
    temporaryPassword: string
    firebaseUid: string
  }
}

export class StaffAccountService {
  private static db = db

  /**
   * Create a new staff account with Firebase Auth
   */
  static async createStaffAccount(staffData: StaffAccountData): Promise<StaffAccountCreationResult> {
    try {
      console.log('🏗️ Creating staff account:', staffData.name)
      console.log('📋 Staff data:', staffData)

      // Generate temporary password if not provided
      const temporaryPassword = staffData.temporaryPassword || 
        FirebaseAuthService.generateTemporaryPassword(12)

      // Prepare Firebase Auth user data
      const authUserData: CreateStaffUserData = {
        email: staffData.email,
        password: temporaryPassword,
        name: staffData.name,
        role: 'staff',
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

      // Create Firebase Auth user
      console.log('📞 Creating Firebase Auth user...')
      const authResult = await FirebaseAuthService.createStaffUser(authUserData)
      console.log('📋 Auth result:', authResult)

      if (!authResult.success || !authResult.userId) {
        return {
          success: false,
          message: authResult.message || 'Failed to create Firebase Auth user',
          error: authResult.error
        }
      }

      // Create staff account document
      const staffAccount: Omit<StaffAccount, 'id'> = {
        firebaseUid: authResult.userId,
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
        hasCredentials: true,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: 'admin', // TODO: Get from current user context
        lastModifiedBy: 'admin'
      }

      // Save to staff_accounts collection
      const staffAccountRef = doc(this.db, 'staff_accounts', authResult.userId)
      await setDoc(staffAccountRef, staffAccount)
      console.log('✅ Staff account created in staff_accounts collection')

      const finalStaffAccount: StaffAccount = {
        id: authResult.userId,
        ...staffAccount,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      return {
        success: true,
        message: 'Staff account created successfully',
        staffAccount: finalStaffAccount,
        userCredentials: {
          email: staffData.email,
          temporaryPassword: temporaryPassword,
          firebaseUid: authResult.userId
        }
      }

    } catch (error) {
      console.error('❌ Error creating staff account:', error)
      return {
        success: false,
        message: 'Failed to create staff account',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get all staff accounts
   */
  static async getAllStaffAccounts(): Promise<{
    success: boolean
    message: string
    error?: string
    staffAccounts?: StaffAccount[]
  }> {
    try {
      console.log('🔍 Getting all staff accounts...')
      
      const staffAccountsRef = collection(this.db, 'staff_accounts')
      const q = query(staffAccountsRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)

      const staffAccounts: StaffAccount[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        staffAccounts.push({ 
          id: doc.id, 
          ...data,
          // Convert Firestore timestamps to proper format
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date()
        } as StaffAccount)
      })

      console.log(`✅ Found ${staffAccounts.length} staff accounts`)
      
      return {
        success: true,
        message: `Found ${staffAccounts.length} staff accounts`,
        staffAccounts
      }
    } catch (error) {
      console.error('❌ Error getting staff accounts:', error)
      return {
        success: false,
        message: 'Failed to retrieve staff accounts',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get a specific staff account by ID
   */
  static async getStaffAccountById(staffId: string): Promise<{
    success: boolean
    message: string
    error?: string
    staffAccount?: StaffAccount
  }> {
    try {
      console.log(`🔍 Getting staff account ${staffId}...`)
      
      const staffAccountRef = doc(this.db, 'staff_accounts', staffId)
      const docSnapshot = await getDoc(staffAccountRef)

      if (!docSnapshot.exists()) {
        return {
          success: false,
          message: 'Staff account not found',
          error: 'Staff account not found'
        }
      }

      const data = docSnapshot.data()
      const staffAccount: StaffAccount = {
        id: docSnapshot.id,
        ...data,
        createdAt: data?.createdAt?.toDate?.() || new Date(),
        updatedAt: data?.updatedAt?.toDate?.() || new Date()
      } as StaffAccount

      console.log(`✅ Found staff account: ${staffAccount.name}`)
      
      return {
        success: true,
        message: 'Staff account found',
        staffAccount
      }
    } catch (error) {
      console.error(`❌ Error getting staff account ${staffId}:`, error)
      return {
        success: false,
        message: 'Failed to retrieve staff account',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Update a staff account
   */
  static async updateStaffAccount(staffId: string, updates: Partial<StaffAccountData>): Promise<{
    success: boolean
    message: string
    error?: string
  }> {
    try {
      console.log(`🔍 Updating staff account ${staffId}...`)
      
      const staffAccountRef = doc(this.db, 'staff_accounts', staffId)
      
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        lastModifiedBy: 'admin' // TODO: Get from current user context
      }

      await updateDoc(staffAccountRef, updateData)
      
      console.log(`✅ Updated staff account ${staffId}`)
      
      return {
        success: true,
        message: 'Staff account updated successfully'
      }
    } catch (error) {
      console.error(`❌ Error updating staff account ${staffId}:`, error)
      return {
        success: false,
        message: 'Failed to update staff account',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Delete a staff account
   */
  static async deleteStaffAccount(staffId: string): Promise<{
    success: boolean
    message: string
    error?: string
  }> {
    try {
      console.log(`🔍 Deleting staff account ${staffId}...`)
      
      // TODO: Also delete the Firebase Auth user
      // This would require Firebase Admin SDK
      
      const staffAccountRef = doc(this.db, 'staff_accounts', staffId)
      await deleteDoc(staffAccountRef)
      
      console.log(`✅ Deleted staff account ${staffId}`)
      
      return {
        success: true,
        message: 'Staff account deleted successfully'
      }
    } catch (error) {
      console.error(`❌ Error deleting staff account ${staffId}:`, error)
      return {
        success: false,
        message: 'Failed to delete staff account',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
