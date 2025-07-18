import { getDb } from '@/lib/firebase'
import { collection, getDocs, query, orderBy, doc, getDoc, addDoc, updateDoc, deleteDoc, where } from 'firebase/firestore'
import { EnhancedStaffProfile } from '@/types/staff'

/**
 * Server-side Staff Service using Firebase Client SDK
 * This service is designed for server-side operations (API routes)
 * Note: This uses the client SDK but should work with proper authentication
 */
export class ServerStaffService {
  /**
   * Get all staff members using Firebase Client SDK
   */
  static async getAllEnhancedStaff(): Promise<{
    success: boolean
    message: string
    error?: string
    staff?: EnhancedStaffProfile[]
  }> {
    try {
      console.log('🔍 SERVER: Getting all staff from Firebase Client SDK...')

      const staffRef = collection(getDb(), 'staff')
      const q = query(staffRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)

      const staff: EnhancedStaffProfile[] = []
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data()
        staff.push({
          id: docSnapshot.id,
          ...data,
          // Convert Firestore timestamps to proper format
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        } as EnhancedStaffProfile)
      })

      console.log(`✅ SERVER: Found ${staff.length} staff members`)

      return {
        success: true,
        message: `Found ${staff.length} staff members`,
        staff
      }
    } catch (error) {
      console.error('❌ SERVER: Error getting all enhanced staff:', error)
      return {
        success: false,
        message: 'Failed to retrieve staff members',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get a specific staff member by ID using Firebase Client SDK
   */
  static async getStaffById(staffId: string): Promise<{
    success: boolean
    message: string
    error?: string
    staff?: EnhancedStaffProfile
  }> {
    try {
      console.log(`🔍 SERVER: Getting staff member ${staffId} from Firebase Client SDK...`)

      const staffRef = doc(getDb(), 'staff', staffId)
      const docSnapshot = await getDoc(staffRef)

      if (!docSnapshot.exists()) {
        return {
          success: false,
          message: 'Staff member not found',
          error: 'Staff member not found'
        }
      }

      const data = docSnapshot.data()
      const staff: EnhancedStaffProfile = {
        id: docSnapshot.id,
        ...data,
        // Convert Firestore timestamps to proper format
        createdAt: data?.createdAt,
        updatedAt: data?.updatedAt
      } as EnhancedStaffProfile

      console.log(`✅ SERVER: Found staff member: ${staff.name}`)

      return {
        success: true,
        message: 'Staff member found',
        staff
      }
    } catch (error) {
      console.error(`❌ SERVER: Error getting staff member ${staffId}:`, error)
      return {
        success: false,
        message: 'Failed to retrieve staff member',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Create a new staff member using Firebase Admin SDK
   */
  static async createStaff(staffData: Partial<EnhancedStaffProfile>): Promise<{
    success: boolean
    message: string
    error?: string
    staffId?: string
  }> {
    try {
      console.log('🔍 SERVER: Creating staff member with Firebase Admin SDK...')
      
      const staffRef = adminDb.collection('staff')
      const now = new Date()
      
      const newStaffData = {
        ...staffData,
        createdAt: now,
        updatedAt: now
      }

      const docRef = await staffRef.add(newStaffData)
      
      console.log(`✅ SERVER: Created staff member with ID: ${docRef.id}`)
      
      return {
        success: true,
        message: 'Staff member created successfully',
        staffId: docRef.id
      }
    } catch (error) {
      console.error('❌ SERVER: Error creating staff member:', error)
      return {
        success: false,
        message: 'Failed to create staff member',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Update a staff member using Firebase Admin SDK
   */
  static async updateStaff(staffId: string, updates: Partial<EnhancedStaffProfile>): Promise<{
    success: boolean
    message: string
    error?: string
  }> {
    try {
      console.log(`🔍 SERVER: Updating staff member ${staffId} with Firebase Admin SDK...`)
      
      const staffRef = adminDb.collection('staff').doc(staffId)
      
      const updateData = {
        ...updates,
        updatedAt: new Date()
      }

      await staffRef.update(updateData)
      
      console.log(`✅ SERVER: Updated staff member ${staffId}`)
      
      return {
        success: true,
        message: 'Staff member updated successfully'
      }
    } catch (error) {
      console.error(`❌ SERVER: Error updating staff member ${staffId}:`, error)
      return {
        success: false,
        message: 'Failed to update staff member',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Delete a staff member using Firebase Admin SDK
   */
  static async deleteStaff(staffId: string): Promise<{
    success: boolean
    message: string
    error?: string
  }> {
    try {
      console.log(`🔍 SERVER: Deleting staff member ${staffId} with Firebase Admin SDK...`)
      
      const staffRef = adminDb.collection('staff').doc(staffId)
      await staffRef.delete()
      
      console.log(`✅ SERVER: Deleted staff member ${staffId}`)
      
      return {
        success: true,
        message: 'Staff member deleted successfully'
      }
    } catch (error) {
      console.error(`❌ SERVER: Error deleting staff member ${staffId}:`, error)
      return {
        success: false,
        message: 'Failed to delete staff member',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get staff members by role using Firebase Admin SDK
   */
  static async getStaffByRole(role: string): Promise<{
    success: boolean
    message: string
    error?: string
    staff?: EnhancedStaffProfile[]
  }> {
    try {
      console.log(`🔍 SERVER: Getting staff members with role ${role} from Firebase Admin SDK...`)
      
      const staffRef = adminDb.collection('staff')
      const querySnapshot = await staffRef.where('role', '==', role).get()

      const staff: EnhancedStaffProfile[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        staff.push({ 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        } as EnhancedStaffProfile)
      })

      console.log(`✅ SERVER: Found ${staff.length} staff members with role ${role}`)
      
      return {
        success: true,
        message: `Found ${staff.length} staff members with role ${role}`,
        staff
      }
    } catch (error) {
      console.error(`❌ SERVER: Error getting staff by role ${role}:`, error)
      return {
        success: false,
        message: 'Failed to retrieve staff members by role',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
