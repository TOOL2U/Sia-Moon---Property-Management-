import { getDb } from '@/lib/firebase'
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore'

/**
 * Service to fix Firebase UID mapping for staff accounts
 * This ensures mobile app can properly query jobs assigned to staff
 */
export class StaffUidMappingService {
  /**
   * Update staff account with correct Firebase UID mapping
   */
  static async updateStaffFirebaseUid(email: string, firebaseUid: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🔧 Updating Firebase UID mapping for ${email} -> ${firebaseUid}`)
      const db = getDb()

      // Find staff account by email
      const staffQuery = query(
        collection(db, 'staff_accounts'),
        where('email', '==', email)
      )
      
      const staffSnapshot = await getDocs(staffQuery)
      
      if (staffSnapshot.empty) {
        return {
          success: false,
          message: `Staff account not found for email: ${email}`
        }
      }

      // Update the first matching staff account
      const staffDoc = staffSnapshot.docs[0]
      const staffRef = doc(db, 'staff_accounts', staffDoc.id)
      
      await updateDoc(staffRef, {
        firebaseUid: firebaseUid,
        userId: firebaseUid, // Legacy field for backward compatibility
        updatedAt: serverTimestamp(),
        lastModifiedBy: 'system-uid-mapping'
      })

      console.log(`✅ Updated staff account ${staffDoc.id} with Firebase UID: ${firebaseUid}`)
      
      return {
        success: true,
        message: `Successfully updated Firebase UID mapping for ${email}`
      }
    } catch (error) {
      console.error('❌ Error updating staff Firebase UID:', error)
      return {
        success: false,
        message: `Failed to update Firebase UID: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Fix the specific staff@siamoon.com account
   */
  static async fixStaffSiamoonAccount(): Promise<{ success: boolean; message: string }> {
    const STAFF_EMAIL = 'staff@siamoon.com'
    const FIREBASE_UID = 'gTtR5gSKOtUEweLwchSnVreylMy1'
    
    return await this.updateStaffFirebaseUid(STAFF_EMAIL, FIREBASE_UID)
  }

  /**
   * Verify staff account has correct Firebase UID
   */
  static async verifyStaffUidMapping(email: string): Promise<{ 
    success: boolean; 
    hasFirebaseUid: boolean; 
    firebaseUid?: string;
    staffDocId?: string;
  }> {
    try {
      const db = getDb()
      
      const staffQuery = query(
        collection(db, 'staff_accounts'),
        where('email', '==', email)
      )
      
      const staffSnapshot = await getDocs(staffQuery)
      
      if (staffSnapshot.empty) {
        return {
          success: false,
          hasFirebaseUid: false
        }
      }

      const staffDoc = staffSnapshot.docs[0]
      const staffData = staffDoc.data()
      const firebaseUid = staffData.firebaseUid || staffData.userId
      
      return {
        success: true,
        hasFirebaseUid: !!firebaseUid,
        firebaseUid: firebaseUid,
        staffDocId: staffDoc.id
      }
    } catch (error) {
      console.error('❌ Error verifying staff UID mapping:', error)
      return {
        success: false,
        hasFirebaseUid: false
      }
    }
  }

  /**
   * Get all staff accounts missing Firebase UID mapping
   */
  static async getStaffMissingUidMapping(): Promise<{
    success: boolean;
    staffAccounts: Array<{
      id: string;
      email: string;
      name: string;
      hasFirebaseUid: boolean;
      firebaseUid?: string;
    }>;
  }> {
    try {
      const db = getDb()
      const staffSnapshot = await getDocs(collection(db, 'staff_accounts'))
      
      const staffAccounts = staffSnapshot.docs.map(doc => {
        const data = doc.data()
        const firebaseUid = data.firebaseUid || data.userId
        
        return {
          id: doc.id,
          email: data.email || 'No email',
          name: data.name || 'No name',
          hasFirebaseUid: !!firebaseUid,
          firebaseUid: firebaseUid
        }
      })

      return {
        success: true,
        staffAccounts
      }
    } catch (error) {
      console.error('❌ Error getting staff accounts:', error)
      return {
        success: false,
        staffAccounts: []
      }
    }
  }
}

export default StaffUidMappingService
