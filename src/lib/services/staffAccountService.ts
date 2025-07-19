import { db } from '@/lib/firebase'
import bcrypt from 'bcryptjs'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'

/**
 * Staff Account Service
 * Manages staff accounts in the staff_accounts collection with bcrypt password hashing
 * This is separate from regular users and provides better organization
 * Implements secure authentication system compatible with mobile app
 */

// User roles and permissions
export const USER_ROLES = {
  ADMIN: 'admin', // Full system access
  MANAGER: 'manager', // Property management access
  CLEANER: 'cleaner', // Housekeeping tasks
  MAINTENANCE: 'maintenance', // Maintenance tasks
  STAFF: 'staff', // General staff access
} as const

// Role hierarchy for permission checking
const ROLE_HIERARCHY = {
  admin: 5,
  manager: 4,
  maintenance: 3,
  cleaner: 2,
  staff: 1,
} as const

/**
 * Check if user has required permission level
 */
export const hasPermission = (
  userRole: string,
  requiredRole: string
): boolean => {
  return (
    (ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] || 0) >=
    (ROLE_HIERARCHY[requiredRole as keyof typeof ROLE_HIERARCHY] || 0)
  )
}

export interface StaffAccountData {
  // Basic Information
  name: string
  email: string
  password: string // Plain text password (will be hashed)
  phone: string
  address: string
  role: 'admin' | 'manager' | 'cleaner' | 'maintenance' | 'staff'
  department?: string

  // Legacy Authentication fields
  temporaryPassword?: string
  mustChangePassword?: boolean
  status?: 'active' | 'inactive' | 'suspended'

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
  email: string
  passwordHash: string // bcrypt hash with 12 salt rounds
  name: string
  phone: string
  address: string
  role: 'admin' | 'manager' | 'cleaner' | 'maintenance' | 'staff'
  department?: string
  isActive: boolean
  createdAt: any
  updatedAt: any
  lastLogin?: any | null
  // Legacy fields for backward compatibility
  firebaseUid?: string
  status?: 'active' | 'inactive' | 'suspended'
  assignedProperties?: string[]
  skills?: string[]
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
  hasCredentials?: boolean
  createdBy?: string
  lastModifiedBy?: string
  // Expo Push Notification fields
  expoPushToken?: string
  expoPushTokenPlatform?: 'ios' | 'android'
  expoPushTokenAppVersion?: string
  expoPushTokenUpdatedAt?: any
  expoPushTokenIsValid?: boolean
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
  private static get db() {
    if (!db) {
      throw new Error('Firebase db is not initialized')
    }
    return db
  }

  /**
   * Create a new staff account with bcrypt password hashing
   */
  static async createStaffAccount(
    staffData: StaffAccountData
  ): Promise<StaffAccountCreationResult> {
    try {
      console.log('🏗️ Creating staff account:', staffData.name)
      console.log('📋 Staff data (password hidden):', {
        ...staffData,
        password: '[HIDDEN]',
      })

      // Validate required fields
      if (!staffData.email || !staffData.password || !staffData.name) {
        return {
          success: false,
          message:
            'Missing required fields: email, password, and name are required',
          error: 'Missing required fields',
        }
      }

      // Check if user already exists
      console.log(
        '🔍 Checking if user already exists with email:',
        staffData.email
      )
      const existingUserQuery = query(
        collection(StaffAccountService.db, 'staff_accounts'),
        where('email', '==', staffData.email.toLowerCase().trim())
      )
      const existingUserSnapshot = await getDocs(existingUserQuery)

      if (!existingUserSnapshot.empty) {
        console.log('⚠️ User already exists in staff_accounts collection')
        return {
          success: false,
          message: 'Staff account already exists',
          error: 'A staff account with this email already exists',
        }
      }

      // Hash the password with 12 salt rounds (as required)
      console.log('🔐 Hashing password with bcrypt...')
      const passwordHash = await bcrypt.hash(staffData.password, 12)
      console.log('✅ Password hashed successfully')

      // Use the password from staffData, or temporaryPassword as fallback
      const actualPassword = staffData.password || staffData.temporaryPassword
      if (!actualPassword) {
        return {
          success: false,
          message: 'Password is required',
          error: 'No password provided',
        }
      }

      // Create staff account document (filter out undefined values for Firebase)
      const staffAccount: Omit<StaffAccount, 'id'> = {
        email: staffData.email.toLowerCase().trim(),
        passwordHash: passwordHash, // Store hashed password
        name: staffData.name,
        phone: staffData.phone || '',
        address: staffData.address || '',
        role: staffData.role as
          | 'admin'
          | 'manager'
          | 'cleaner'
          | 'maintenance'
          | 'staff',
        department: staffData.department || '',
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: null,

        // Legacy fields for backward compatibility
        assignedProperties: staffData.assignedProperties || [],
        skills: staffData.skills || [],
        createdBy: 'admin', // TODO: Get from current user context
        lastModifiedBy: 'admin',
      }

      // Only add optional fields if they have values (Firebase doesn't allow undefined)
      if (staffData.emergencyContact && staffData.emergencyContact.name) {
        staffAccount.emergencyContact = staffData.emergencyContact
      }

      if (staffData.employment) {
        staffAccount.employment = staffData.employment
      }

      if (
        staffData.personalDetails &&
        (staffData.personalDetails.dateOfBirth ||
          staffData.personalDetails.nationalId)
      ) {
        staffAccount.personalDetails = staffData.personalDetails
      }

      // Save to staff_accounts collection
      const staffAccountRef = doc(
        collection(StaffAccountService.db, 'staff_accounts')
      )
      await setDoc(staffAccountRef, staffAccount)
      console.log(
        '✅ Staff account created in staff_accounts collection with ID:',
        staffAccountRef.id
      )

      const finalStaffAccount: StaffAccount = {
        id: staffAccountRef.id,
        ...staffAccount,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      return {
        success: true,
        message:
          'Staff account created successfully with secure password hashing',
        staffAccount: finalStaffAccount,
        userCredentials: {
          email: staffData.email,
          temporaryPassword: '[HIDDEN FOR SECURITY]', // Never return plain text passwords
          firebaseUid: staffAccountRef.id, // Use firebaseUid instead of id
        },
      }
    } catch (error) {
      console.error('❌ Error creating staff account:', error)
      return {
        success: false,
        message: 'Failed to create staff account',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Verify staff login credentials
   */
  static async verifyStaffLogin(
    email: string,
    password: string
  ): Promise<{
    success: boolean
    error?: string
    user?: Omit<StaffAccount, 'passwordHash'>
  }> {
    try {
      console.log('🔐 Verifying staff login for email:', email)

      // 1. Query staff_accounts collection
      const q = query(
        collection(StaffAccountService.db, 'staff_accounts'),
        where('email', '==', email.toLowerCase().trim()),
        where('isActive', '==', true)
      )

      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        console.log('❌ No active staff account found with email:', email)
        return { success: false, error: 'Invalid credentials' }
      }

      const userDoc = querySnapshot.docs[0]
      const userData = userDoc.data() as StaffAccount

      // 2. Verify password using bcrypt
      console.log('🔐 Verifying password hash...')
      const passwordMatch = await bcrypt.compare(
        password,
        userData.passwordHash
      )

      if (!passwordMatch) {
        console.log('❌ Password verification failed')
        return { success: false, error: 'Invalid credentials' }
      }

      console.log('✅ Password verification successful')

      // 3. Update last login timestamp
      const lastLogin = new Date()
      await updateDoc(
        doc(StaffAccountService.db, 'staff_accounts', userDoc.id),
        {
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      )

      // 4. Return user data (excluding password hash)
      const { passwordHash, ...userWithoutPassword } = {
        ...userData,
        id: userDoc.id,
        lastLogin,
      }

      return {
        success: true,
        user: userWithoutPassword as Omit<StaffAccount, 'passwordHash'>,
      }
    } catch (error) {
      console.error('❌ Authentication error:', error)
      return { success: false, error: 'Authentication failed' }
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

      const staffAccountsRef = collection(
        StaffAccountService.db,
        'staff_accounts'
      )
      const q = query(staffAccountsRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)

      const staffAccounts: StaffAccount[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        const { passwordHash, ...staffData } = data // Exclude passwordHash from returned data

        staffAccounts.push({
          id: doc.id,
          ...staffData,
          // Convert Firestore timestamps to proper format
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
          lastLogin: data.lastLogin?.toDate?.() || null,
        } as StaffAccount)
      })

      console.log(`✅ Found ${staffAccounts.length} staff accounts`)

      return {
        success: true,
        message: `Found ${staffAccounts.length} staff accounts`,
        staffAccounts,
      }
    } catch (error) {
      console.error('❌ Error getting staff accounts:', error)
      return {
        success: false,
        message: 'Failed to retrieve staff accounts',
        error: error instanceof Error ? error.message : 'Unknown error',
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

      const staffAccountRef = doc(
        StaffAccountService.db,
        'staff_accounts',
        staffId
      )
      const docSnapshot = await getDoc(staffAccountRef)

      if (!docSnapshot.exists()) {
        return {
          success: false,
          message: 'Staff account not found',
          error: 'Staff account not found',
        }
      }
      const data = docSnapshot.data()
      if (!data) {
        return {
          success: false,
          message: 'Staff account not found',
          error: 'Staff account data is null',
        }
      }

      const staffAccount: StaffAccount = {
        id: docSnapshot.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
        lastLogin: data.lastLogin?.toDate?.() || null,
      } as StaffAccount

      console.log(`✅ Found staff account: ${staffAccount.name}`)

      return {
        success: true,
        message: 'Staff account found',
        staffAccount,
      }
    } catch (error) {
      console.error(`❌ Error getting staff account ${staffId}:`, error)
      return {
        success: false,
        message: 'Failed to retrieve staff account',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Update a staff account
   */
  static async updateStaffAccount(
    staffId: string,
    updates: Partial<StaffAccountData>
  ): Promise<{
    success: boolean
    message: string
    error?: string
  }> {
    try {
      console.log(`🔍 Updating staff account ${staffId}...`)

      const staffAccountRef = doc(
        StaffAccountService.db,
        'staff_accounts',
        staffId
      )

      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        lastModifiedBy: 'admin', // TODO: Get from current user context
      }

      await updateDoc(staffAccountRef, updateData)

      console.log(`✅ Updated staff account ${staffId}`)

      return {
        success: true,
        message: 'Staff account updated successfully',
      }
    } catch (error) {
      console.error(`❌ Error updating staff account ${staffId}:`, error)
      return {
        success: false,
        message: 'Failed to update staff account',
        error: error instanceof Error ? error.message : 'Unknown error',
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

      const staffAccountRef = doc(
        StaffAccountService.db,
        'staff_accounts',
        staffId
      )
      await deleteDoc(staffAccountRef)

      console.log(`✅ Deleted staff account ${staffId}`)

      return {
        success: true,
        message: 'Staff account deleted successfully',
      }
    } catch (error) {
      console.error(`❌ Error deleting staff account ${staffId}:`, error)
      return {
        success: false,
        message: 'Failed to delete staff account',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}
