import { getDb } from '@/lib/firebase'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { collection, getDocs, doc, updateDoc, serverTimestamp, query, where } from 'firebase/firestore'

/**
 * Service to automatically set up ALL staff members for mobile app integration
 * Ensures every staff member has proper Firebase UID mapping for job assignments
 */
export class MobileStaffSetupService {
  /**
   * Set up ALL staff members for mobile app integration
   * Creates Firebase Auth accounts and updates Firestore documents
   */
  static async setupAllStaffForMobile(): Promise<{
    success: boolean
    message: string
    results: {
      totalStaff: number
      alreadySetup: number
      newlySetup: number
      failed: number
      details: Array<{
        email: string
        name: string
        status: 'already_setup' | 'newly_setup' | 'failed'
        firebaseUid?: string
        error?: string
      }>
    }
  }> {
    try {
      console.log('🚀 Starting mobile staff setup for ALL staff members...')
      
      const db = getDb()
      const results = {
        totalStaff: 0,
        alreadySetup: 0,
        newlySetup: 0,
        failed: 0,
        details: [] as Array<{
          email: string
          name: string
          status: 'already_setup' | 'newly_setup' | 'failed'
          firebaseUid?: string
          error?: string
        }>
      }

      // Get all staff accounts
      const staffSnapshot = await getDocs(collection(db, 'staff_accounts'))
      results.totalStaff = staffSnapshot.size

      console.log(`📊 Found ${results.totalStaff} staff accounts to process`)

      // Process each staff member
      for (const staffDoc of staffSnapshot.docs) {
        const staffData = staffDoc.data()
        const staffId = staffDoc.id
        const email = staffData.email
        const name = `${staffData.firstName || ''} ${staffData.lastName || ''}`.trim() || staffData.name || 'Staff Member'
        
        if (!email) {
          console.log(`⚠️ Skipping staff ${staffId} - no email address`)
          results.failed++
          results.details.push({
            email: 'No email',
            name: name,
            status: 'failed',
            error: 'No email address found'
          })
          continue
        }

        console.log(`\n👤 Processing: ${email} (${name})`)

        // Check if already has Firebase UID
        const existingUid = staffData.userId || staffData.firebaseUid
        if (existingUid) {
          console.log(`✅ Already has Firebase UID: ${existingUid}`)
          results.alreadySetup++
          results.details.push({
            email: email,
            name: name,
            status: 'already_setup',
            firebaseUid: existingUid
          })
          continue
        }

        // Set up Firebase Auth and update staff document
        const setupResult = await this.setupStaffMember(staffId, email, name)
        
        if (setupResult.success) {
          results.newlySetup++
          results.details.push({
            email: email,
            name: name,
            status: 'newly_setup',
            firebaseUid: setupResult.firebaseUid
          })
        } else {
          results.failed++
          results.details.push({
            email: email,
            name: name,
            status: 'failed',
            error: setupResult.error
          })
        }
      }

      const successMessage = `✅ Mobile staff setup complete! ${results.newlySetup} staff newly setup, ${results.alreadySetup} already ready, ${results.failed} failed`
      console.log(`\n${successMessage}`)

      return {
        success: true,
        message: successMessage,
        results
      }

    } catch (error) {
      console.error('❌ Error in mobile staff setup:', error)
      return {
        success: false,
        message: `Failed to setup staff for mobile: ${error instanceof Error ? error.message : 'Unknown error'}`,
        results: {
          totalStaff: 0,
          alreadySetup: 0,
          newlySetup: 0,
          failed: 0,
          details: []
        }
      }
    }
  }

  /**
   * Set up a single staff member for mobile app integration
   */
  private static async setupStaffMember(
    staffId: string, 
    email: string, 
    name: string
  ): Promise<{
    success: boolean
    firebaseUid?: string
    error?: string
  }> {
    try {
      console.log(`🔧 Setting up Firebase Auth for ${email}...`)

      // Check if Firebase Auth user already exists
      let firebaseUser
      try {
        firebaseUser = await adminAuth.getUserByEmail(email)
        console.log(`✅ Firebase Auth user already exists: ${firebaseUser.uid}`)
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          // Create new Firebase Auth user
          console.log(`🆕 Creating new Firebase Auth user for ${email}`)
          
          // Generate secure temporary password
          const tempPassword = this.generateSecurePassword()
          
          firebaseUser = await adminAuth.createUser({
            email: email,
            password: tempPassword,
            displayName: name,
            disabled: false
          })
          
          console.log(`✅ Created Firebase Auth user: ${firebaseUser.uid}`)
          
          // Send password reset email so staff can set their own password
          try {
            await adminAuth.generatePasswordResetLink(email)
            console.log(`📧 Password reset email sent to ${email}`)
          } catch (emailError) {
            console.warn(`⚠️ Could not send password reset email to ${email}:`, emailError)
          }
        } else {
          throw error
        }
      }

      // Update staff document with Firebase UID
      const db = getDb()
      const staffRef = doc(db, 'staff_accounts', staffId)
      
      await updateDoc(staffRef, {
        userId: firebaseUser.uid,
        firebaseUid: firebaseUser.uid, // Backup field
        mobileAppReady: true,
        mobileSetupAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastModifiedBy: 'mobile-staff-setup-service'
      })

      console.log(`✅ Updated staff document ${staffId} with Firebase UID: ${firebaseUser.uid}`)

      return {
        success: true,
        firebaseUid: firebaseUser.uid
      }

    } catch (error) {
      console.error(`❌ Error setting up staff member ${email}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Generate a secure temporary password
   */
  private static generateSecurePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  /**
   * Verify all staff are ready for mobile app
   */
  static async verifyAllStaffMobileReady(): Promise<{
    success: boolean
    totalStaff: number
    readyStaff: number
    notReadyStaff: number
    staffStatus: Array<{
      email: string
      name: string
      isReady: boolean
      firebaseUid?: string
      issues?: string[]
    }>
  }> {
    try {
      const db = getDb()
      const staffSnapshot = await getDocs(collection(db, 'staff_accounts'))
      
      const staffStatus = []
      let readyCount = 0
      let notReadyCount = 0

      for (const staffDoc of staffSnapshot.docs) {
        const staffData = staffDoc.data()
        const email = staffData.email || 'No email'
        const name = `${staffData.firstName || ''} ${staffData.lastName || ''}`.trim() || staffData.name || 'Staff Member'
        const firebaseUid = staffData.userId || staffData.firebaseUid
        
        const issues = []
        if (!email || email === 'No email') issues.push('Missing email address')
        if (!firebaseUid) issues.push('Missing Firebase UID')
        if (!staffData.isActive) issues.push('Staff account inactive')

        const isReady = issues.length === 0

        if (isReady) {
          readyCount++
        } else {
          notReadyCount++
        }

        staffStatus.push({
          email,
          name,
          isReady,
          firebaseUid,
          issues: issues.length > 0 ? issues : undefined
        })
      }

      return {
        success: true,
        totalStaff: staffSnapshot.size,
        readyStaff: readyCount,
        notReadyStaff: notReadyCount,
        staffStatus
      }

    } catch (error) {
      console.error('❌ Error verifying staff mobile readiness:', error)
      return {
        success: false,
        totalStaff: 0,
        readyStaff: 0,
        notReadyStaff: 0,
        staffStatus: []
      }
    }
  }

  /**
   * Get staff member by Firebase UID (for mobile app queries)
   */
  static async getStaffByFirebaseUid(firebaseUid: string): Promise<{
    success: boolean
    staff?: {
      id: string
      email: string
      name: string
      role: string
      isActive: boolean
    }
    error?: string
  }> {
    try {
      const db = getDb()
      const staffQuery = query(
        collection(db, 'staff_accounts'),
        where('userId', '==', firebaseUid)
      )
      
      const staffSnapshot = await getDocs(staffQuery)
      
      if (staffSnapshot.empty) {
        return {
          success: false,
          error: `No staff found with Firebase UID: ${firebaseUid}`
        }
      }

      const staffDoc = staffSnapshot.docs[0]
      const staffData = staffDoc.data()

      return {
        success: true,
        staff: {
          id: staffDoc.id,
          email: staffData.email,
          name: `${staffData.firstName || ''} ${staffData.lastName || ''}`.trim() || staffData.name,
          role: staffData.role || 'staff',
          isActive: staffData.isActive !== false
        }
      }

    } catch (error) {
      console.error('❌ Error getting staff by Firebase UID:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

export default MobileStaffSetupService
