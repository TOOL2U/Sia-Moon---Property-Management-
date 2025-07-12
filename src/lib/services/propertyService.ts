import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  query, 
  orderBy, 
  where,
  Timestamp 
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface Property {
  id: string
  userId: string // Owner of the property
  
  // Basic Information
  name: string
  description?: string
  address: string
  city?: string
  country?: string
  
  // Property Details
  bedrooms?: number
  bathrooms?: number
  maxGuests?: number
  landSizeSqm?: number
  villaSizeSqm?: number
  yearBuilt?: number
  
  // Amenities
  amenities?: string[]
  hasPool?: boolean
  hasGarden?: boolean
  hasAirConditioning?: boolean
  hasParking?: boolean
  hasLaundry?: boolean
  hasBackupPower?: boolean
  
  // Utilities
  electricityProvider?: string
  waterSource?: string
  internetProvider?: string
  internetPackage?: string
  
  // Access & Staff
  accessDetails?: string
  hasSmartLock?: boolean
  gateRemoteDetails?: string
  onsiteStaff?: string
  
  // Rental Information
  pricePerNight?: number
  currency?: string
  minimumStay?: number
  platformsListed?: string[]
  averageOccupancyRate?: string
  
  // Rules & Preferences
  petsAllowed?: boolean
  partiesAllowed?: boolean
  smokingAllowed?: boolean
  
  // Emergency Contact
  emergencyContactName?: string
  emergencyContactPhone?: string
  
  // Media
  coverPhoto?: string // Primary cover photo URL (first uploaded photo from onboarding)
  images?: string[] // All property photos
  professionalPhotosStatus?: string
  floorPlanImagesAvailable?: boolean
  videoWalkthroughAvailable?: boolean
  
  // Booking Integration
  airbnbIcalUrl?: string
  bookingComIcalUrl?: string
  syncEnabled?: boolean
  lastSync?: Timestamp
  
  // Status
  status: 'active' | 'inactive' | 'pending_approval'
  isActive: boolean
  
  // Metadata
  onboardingSubmissionId?: string // Link to original onboarding submission
  createdAt: Timestamp
  updatedAt: Timestamp
}

interface OnboardingData {
  propertyName?: string
  propertyAddress?: string
  bedrooms?: number
  bathrooms?: number
  landSizeSqm?: number
  villaSizeSqm?: number
  yearBuilt?: number
  hasPool?: boolean
  hasGarden?: boolean
  hasAirConditioning?: boolean
  hasParking?: boolean
  hasLaundry?: boolean
  hasBackupPower?: boolean
  electricityProvider?: string
  waterSource?: string
  internetProvider?: string
  internetPackage?: string
  accessDetails?: string
  [key: string]: unknown
}

export class PropertyService {
  private static collection = 'properties'

  /**
   * Create a new property
   */
  static async createProperty(data: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized')
      }

      const propertyData = {
        ...data,
        status: data.status || 'pending_approval' as const,
        isActive: data.isActive ?? true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }

      const docRef = await addDoc(collection(db, this.collection), propertyData)
      console.log('✅ Property created:', docRef.id)
      return docRef.id
    } catch (error) {
      console.error('❌ Error creating property:', error)
      throw error
    }
  }

  /**
   * Create property from onboarding submission
   */
  static async createPropertyFromOnboarding(
    onboardingData: OnboardingData, 
    userId: string, 
    submissionId: string
  ): Promise<string> {
    try {
      const propertyData: Omit<Property, 'id' | 'createdAt' | 'updatedAt'> = {
        userId,
        onboardingSubmissionId: submissionId,
        
        // Basic Information
        name: onboardingData.propertyName || '',
        description: `Property managed by Sia Moon Property Management. ${onboardingData.notes || ''}`.trim(),
        address: onboardingData.propertyAddress || '',
        city: onboardingData.propertyAddress?.split(',')[1]?.trim() || '',
        country: 'Thailand',
        
        // Property Details
        bedrooms: onboardingData.bedrooms,
        bathrooms: onboardingData.bathrooms,
        maxGuests: onboardingData.bedrooms ? onboardingData.bedrooms * 2 : 4, // Estimate
        landSizeSqm: onboardingData.landSizeSqm,
        villaSizeSqm: onboardingData.villaSizeSqm,
        yearBuilt: onboardingData.yearBuilt,
        
        // Amenities
        amenities: this.extractAmenities(onboardingData),
        hasPool: onboardingData.hasPool,
        hasGarden: onboardingData.hasGarden,
        hasAirConditioning: onboardingData.hasAirConditioning,
        hasParking: onboardingData.hasParking,
        hasLaundry: onboardingData.hasLaundry,
        hasBackupPower: onboardingData.hasBackupPower,
        
        // Utilities
        electricityProvider: onboardingData.electricityProvider,
        waterSource: onboardingData.waterSource,
        internetProvider: onboardingData.internetProvider,
        internetPackage: onboardingData.internetPackage,
        
        // Access & Staff
        accessDetails: String(onboardingData.accessDetails || ''),
        hasSmartLock: Boolean(onboardingData.hasSmartLock),
        gateRemoteDetails: String(onboardingData.gateRemoteDetails || ''),
        onsiteStaff: String(onboardingData.onsiteStaff || ''),
        
        // Rental Information
        currency: 'THB',
        platformsListed: Array.isArray(onboardingData.platformsListed) ? onboardingData.platformsListed : [],
        averageOccupancyRate: String(onboardingData.averageOccupancyRate || ''),

        // Rules & Preferences
        petsAllowed: Boolean(onboardingData.petsAllowed),
        partiesAllowed: Boolean(onboardingData.partiesAllowed),
        smokingAllowed: Boolean(onboardingData.smokingAllowed),

        // Emergency Contact
        emergencyContactName: String(onboardingData.emergencyContactName || ''),
        emergencyContactPhone: String(onboardingData.emergencyContactPhone || ''),
        
        // Media - Set cover photo as first uploaded image
        coverPhoto: Array.isArray(onboardingData.uploadedPhotos) && onboardingData.uploadedPhotos.length > 0
          ? onboardingData.uploadedPhotos[0]
          : undefined,
        images: Array.isArray(onboardingData.uploadedPhotos) ? onboardingData.uploadedPhotos : [],
        professionalPhotosStatus: String(onboardingData.professionalPhotosStatus || ''),
        floorPlanImagesAvailable: Boolean(onboardingData.floorPlanImagesAvailable),
        videoWalkthroughAvailable: Boolean(onboardingData.videoWalkthroughAvailable),
        
        // Status
        status: 'pending_approval',
        isActive: false, // Will be activated after admin approval
        
        // Booking Integration (to be configured later)
        syncEnabled: false
      }

      return await this.createProperty(propertyData)
    } catch (error) {
      console.error('❌ Error creating property from onboarding:', error)
      throw error
    }
  }

  /**
   * Get all properties for a user
   */
  static async getPropertiesByUserId(userId: string): Promise<Property[]> {
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
      const properties: Property[] = []

      querySnapshot.forEach((doc) => {
        properties.push({
          id: doc.id,
          ...doc.data()
        } as Property)
      })

      console.log(`✅ Retrieved ${properties.length} properties for user ${userId}`)
      return properties
    } catch (error) {
      console.error('❌ Error fetching user properties:', error)
      throw error
    }
  }

  /**
   * Get all properties (admin only)
   */
  static async getAllProperties(): Promise<Property[]> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized')
      }

      const q = query(
        collection(db, this.collection),
        orderBy('createdAt', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      const properties: Property[] = []

      querySnapshot.forEach((doc) => {
        properties.push({
          id: doc.id,
          ...doc.data()
        } as Property)
      })

      console.log(`✅ Retrieved ${properties.length} properties`)
      return properties
    } catch (error) {
      console.error('❌ Error fetching all properties:', error)
      throw error
    }
  }

  /**
   * Get a specific property by ID
   */
  static async getPropertyById(id: string): Promise<Property | null> {
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
        } as Property
      }

      return null
    } catch (error) {
      console.error('❌ Error fetching property:', error)
      throw error
    }
  }

  /**
   * Update property status
   */
  static async updatePropertyStatus(id: string, status: Property['status']): Promise<void> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized')
      }

      const docRef = doc(db, this.collection, id)
      await updateDoc(docRef, {
        status,
        isActive: status === 'active',
        updatedAt: Timestamp.now()
      })

      console.log(`✅ Updated property ${id} status to ${status}`)
    } catch (error) {
      console.error('❌ Error updating property status:', error)
      throw error
    }
  }

  /**
   * Update property cover photo
   */
  static async updateCoverPhoto(propertyId: string, coverPhotoUrl: string): Promise<void> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized')
      }

      const propertyRef = doc(db, this.collection, propertyId)
      await updateDoc(propertyRef, {
        coverPhoto: coverPhotoUrl,
        updatedAt: Timestamp.now()
      })

      console.log('✅ Property cover photo updated:', propertyId)
    } catch (error) {
      console.error('❌ Error updating property cover photo:', error)
      throw error
    }
  }

  /**
   * Extract amenities from onboarding data
   */
  private static extractAmenities(data: OnboardingData): string[] {
    const amenities: string[] = []

    if (data.hasPool) amenities.push('Pool')
    if (data.hasGarden) amenities.push('Garden')
    if (data.hasAirConditioning) amenities.push('Air Conditioning')
    if (data.hasParking) amenities.push('Parking')
    if (data.hasLaundry) amenities.push('Laundry')
    if (data.hasBackupPower) amenities.push('Backup Power')
    if (data.hasSmartLock) amenities.push('Smart Lock')
    if (data.internetProvider) amenities.push('Internet')

    return amenities
  }
}
