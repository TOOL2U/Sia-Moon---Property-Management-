import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Use the centralized Firebase db instance

// Utility function to remove all undefined fields from data object
function removeUndefined(obj: Record<string, any>): Record<string, any> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  )
}

export interface OnboardingSubmission {
  id: string
  userId?: string
  
  // Owner Details
  ownerFullName: string
  ownerNationality?: string
  ownerContactNumber: string
  ownerEmail: string
  preferredContactMethod?: string
  bankDetails?: string

  // Property Details
  propertyName: string
  propertyAddress: string
  googleMapsUrl?: string
  bedrooms?: number
  bathrooms?: number
  landSizeSqm?: number
  villaSizeSqm?: number
  yearBuilt?: number

  // Amenities
  hasPool?: boolean
  hasGarden?: boolean
  hasAirConditioning?: boolean
  internetProvider?: string
  hasParking?: boolean
  hasLaundry?: boolean
  hasBackupPower?: boolean

  // Access & Staff
  accessDetails?: string
  hasSmartLock?: boolean
  gateRemoteDetails?: string
  onsiteStaff?: string

  // Utilities
  electricityProvider?: string
  waterSource?: string
  internetPackage?: string

  // Smart Electric System
  hasSmartElectricSystem?: boolean
  smartSystemBrand?: string
  smartDevicesControlled?: string[]
  smartDevicesOther?: string
  canControlManuallyWifiDown?: boolean
  smartSystemAppPlatform?: string
  hasHubGateway?: boolean
  hubGatewayLocation?: string
  linkedToPropertyWifi?: boolean
  controlAccountOwner?: string
  controlAccountOwnerOther?: string
  loginCredentialsProvided?: boolean
  loginCredentialsDetails?: string
  hasActiveSchedulesAutomations?: boolean
  schedulesAutomationsDetails?: string
  smartSystemSpecialInstructions?: string

  // Rental & Marketing
  rentalRates?: string
  platformsListed?: string[]
  averageOccupancyRate?: string
  minimumStayRequirements?: string
  targetGuests?: string
  ownerBlackoutDates?: string

  // Preferences & Rules
  petsAllowed?: boolean
  partiesAllowed?: boolean
  smokingAllowed?: boolean
  maintenanceAutoApprovalLimit?: string

  // Current Condition
  repairsNeeded?: string

  // Photos & Media
  professionalPhotosStatus?: string
  floorPlanImagesAvailable?: boolean
  videoWalkthroughAvailable?: boolean
  uploadedPhotos?: string[] // URLs to uploaded photos

  // Emergency Contact
  emergencyContactName?: string
  emergencyContactPhone?: string

  // Additional Notes
  notes?: string

  // Metadata
  submissionType?: string
  status?: 'pending' | 'reviewed' | 'approved' | 'rejected'
  createdAt: Timestamp
  updatedAt: Timestamp
}

export class OnboardingService {
  private static collection = 'onboarding_submissions'

  /**
   * Create a new onboarding submission
   */
  static async createSubmission(data: Omit<OnboardingSubmission, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized')
      }

      const submissionData = {
        ...data,
        status: 'pending' as const,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }

      // Remove undefined values before submitting to Firestore
      const cleanedData = removeUndefined(submissionData)
      const docRef = await addDoc(collection(db, this.collection), cleanedData)
      console.log('✅ Onboarding submission created:', docRef.id)
      return docRef.id
    } catch (error) {
      console.error('❌ Error creating onboarding submission:', error)
      throw error
    }
  }

  /**
   * Get all onboarding submissions (admin only)
   */
  static async getAllSubmissions(): Promise<OnboardingSubmission[]> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized')
      }

      const q = query(
        collection(db, this.collection),
        orderBy('createdAt', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      const submissions: OnboardingSubmission[] = []

      querySnapshot.forEach((doc) => {
        submissions.push({
          id: doc.id,
          ...doc.data()
        } as OnboardingSubmission)
      })

      console.log(`✅ Retrieved ${submissions.length} onboarding submissions`)
      return submissions
    } catch (error) {
      console.error('❌ Error fetching onboarding submissions:', error)
      throw error
    }
  }

  /**
   * Get a specific onboarding submission by ID
   */
  static async getSubmissionById(id: string): Promise<OnboardingSubmission | null> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized')
      }

      const docRef = doc(db, this.collection, id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as OnboardingSubmission
      }

      return null
    } catch (error) {
      console.error('❌ Error fetching onboarding submission:', error)
      throw error
    }
  }

  /**
   * Update submission status
   */
  static async updateSubmissionStatus(
    id: string, 
    status: 'pending' | 'reviewed' | 'approved' | 'rejected'
  ): Promise<void> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized')
      }

      const docRef = doc(db, this.collection, id)
      await updateDoc(docRef, {
        status,
        updatedAt: Timestamp.now()
      })

      console.log(`✅ Updated submission ${id} status to ${status}`)
    } catch (error) {
      console.error('❌ Error updating submission status:', error)
      throw error
    }
  }

  /**
   * Get submissions by user ID
   */
  static async getSubmissionsByUserId(userId: string): Promise<OnboardingSubmission[]> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized')
      }

      const q = query(
        collection(db, this.collection),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      const submissions: OnboardingSubmission[] = []

      querySnapshot.forEach((doc) => {
        submissions.push({
          id: doc.id,
          ...doc.data()
        } as OnboardingSubmission)
      })

      return submissions
    } catch (error) {
      console.error('❌ Error fetching user submissions:', error)
      throw error
    }
  }

  /**
   * Delete a submission (admin only)
   */
  static async deleteSubmission(id: string): Promise<void> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized')
      }

      await deleteDoc(doc(db, this.collection, id))
      console.log(`✅ Deleted submission ${id}`)
    } catch (error) {
      console.error('❌ Error deleting submission:', error)
      throw error
    }
  }
}
