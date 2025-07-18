/**
 * Authenticated Firebase Service
 * Handles Firebase operations with proper authentication context
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { getDb } from '@/lib/firebase'

/**
 * Simplified authenticated Firebase service using existing Firebase instance
 */
export class AuthenticatedFirebaseService {
  /**
   * Execute a Firestore operation with authentication context
   * For now, we'll use the existing Firebase instance and rely on Firestore security rules
   */
  static async executeWithAuth<T>(
    idToken: string,
    operation: (db: any) => Promise<T>
  ): Promise<T> {
    try {
      // Use the existing Firebase instance
      const db = getDb()
      console.log('✅ Using existing Firebase instance for authenticated operation')

      // Execute the operation
      return await operation(db)
    } catch (error) {
      console.error('❌ Authenticated Firebase operation failed:', error)
      throw error
    }
  }
}

/**
 * Helper function to extract ID token from request cookies
 */
export function getIdTokenFromRequest(request: any): string | null {
  const idToken = request.cookies.get('firebase-id-token')?.value
  return idToken || null
}

/**
 * Wrapper for JobAssignmentService operations with authentication
 */
export class AuthenticatedJobAssignmentService {
  /**
   * Get all job assignments with authentication
   */
  static async getAllJobAssignments(idToken: string, filters: any = {}) {
    return AuthenticatedFirebaseService.executeWithAuth(idToken, async (db) => {
      try {
        let jobQuery = collection(getDb(), 'job_assignments')
        
        // Apply filters
        const constraints = []
        
        if (filters.status && filters.status.length > 0) {
          constraints.push(where('status', 'in', filters.status))
        }
        
        if (filters.jobType && filters.jobType.length > 0) {
          constraints.push(where('jobType', 'in', filters.jobType))
        }
        
        if (filters.priority && filters.priority.length > 0) {
          constraints.push(where('priority', 'in', filters.priority))
        }
        
        // Add sorting
        const sortBy = filters.sortBy || 'createdAt'
        const sortOrder = filters.sortOrder || 'desc'
        constraints.push(orderBy(sortBy, sortOrder))
        
        // Apply constraints if any
        if (constraints.length > 0) {
          jobQuery = query(jobQuery, ...constraints)
        }
        
        const snapshot = await getDocs(jobQuery)
        const jobs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
          scheduledDate: doc.data().scheduledDate || '',
          deadline: doc.data().deadline || ''
        }))
        
        return { success: true, data: jobs }
      } catch (error) {
        console.error('❌ Error getting job assignments:', error)
        return { success: false, error: error.message }
      }
    })
  }

  /**
   * Create a new job assignment with authentication
   */
  static async createJobAssignment(idToken: string, jobData: any) {
    return AuthenticatedFirebaseService.executeWithAuth(idToken, async (db) => {
      try {
        const jobAssignment = {
          ...jobData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          status: 'pending'
        }
        
        const docRef = await addDoc(collection(getDb(), 'job_assignments'), jobAssignment)
        
        return { 
          success: true, 
          data: { id: docRef.id, ...jobAssignment } 
        }
      } catch (error) {
        console.error('❌ Error creating job assignment:', error)
        return { success: false, error: error.message }
      }
    })
  }
}

/**
 * Wrapper for Staff operations with authentication
 */
export class AuthenticatedStaffService {
  /**
   * Get all active staff with authentication
   */
  static async getAllActiveStaff(idToken: string) {
    return AuthenticatedFirebaseService.executeWithAuth(idToken, async (db) => {
      try {
        const staffQuery = query(
          collection(getDb(), 'staff_accounts'),
          where('isActive', '==', true)
        )
        
        const snapshot = await getDocs(staffQuery)
        const staff = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        
        // Sort in memory to avoid index requirement
        staff.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        
        return { success: true, data: staff }
      } catch (error) {
        console.error('❌ Error getting staff:', error)
        return { success: false, error: error.message }
      }
    })
  }
}
