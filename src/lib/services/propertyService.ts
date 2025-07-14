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
  Timestamp,
  setDoc,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { getAuth } from 'firebase/auth'

// Utility function to create URL-friendly slugs
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

// Utility function to sanitize data for Firestore (removes undefined values)
function sanitizeForFirestore(obj: any): any {
  if (obj === null || obj === undefined) {
    return null
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirestore(item)).filter(item => item !== undefined)
  }

  if (typeof obj === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        sanitized[key] = sanitizeForFirestore(value)
      }
    }
    return sanitized
  }

  return obj
}

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
   * Create property directly in user's subcollection from onboarding data
   * This is the NEW method that saves to /users/{userId}/properties/{propertyId}
   */
  static async createPropertyInUserProfile(
    onboardingData: OnboardingData,
    userId: string
  ): Promise<string> {
    try {
      console.log('🏠 Creating property in user profile subcollection')
      console.log('👤 User ID:', userId)
      console.log('📋 Onboarding data:', onboardingData)

      // Validate required data
      if (!userId) {
        throw new Error('User ID is required')
      }
      if (!onboardingData.propertyName || typeof onboardingData.propertyName !== 'string') {
        throw new Error('Property name is required and must be a string')
      }
      if (!onboardingData.propertyAddress || typeof onboardingData.propertyAddress !== 'string') {
        throw new Error('Property address is required and must be a string')
      }

      // Log incoming data for debugging
      console.log('📋 Incoming onboarding data types:')
      console.log('- propertyName:', typeof onboardingData.propertyName, onboardingData.propertyName)
      console.log('- propertyAddress:', typeof onboardingData.propertyAddress, onboardingData.propertyAddress)
      console.log('- bedrooms:', typeof onboardingData.bedrooms, onboardingData.bedrooms)
      console.log('- bathrooms:', typeof onboardingData.bathrooms, onboardingData.bathrooms)
      console.log('- landSizeSqm:', typeof onboardingData.landSizeSqm, onboardingData.landSizeSqm)
      console.log('- villaSizeSqm:', typeof onboardingData.villaSizeSqm, onboardingData.villaSizeSqm)

      // Generate property ID using slugify
      const propertyId = slugify(onboardingData.propertyName + ' ' + onboardingData.propertyAddress)
      console.log('🔑 Generated property ID:', propertyId)

      // Prepare property data for user subcollection with safe fallbacks
      const rawPropertyData = {
        // Basic Information
        name: onboardingData.propertyName,
        address: onboardingData.propertyAddress,
        bedrooms: typeof onboardingData.bedrooms === 'number' ? onboardingData.bedrooms :
                 (onboardingData.bedrooms ? parseInt(String(onboardingData.bedrooms)) : 0),
        bathrooms: typeof onboardingData.bathrooms === 'number' ? onboardingData.bathrooms :
                  (onboardingData.bathrooms ? parseInt(String(onboardingData.bathrooms)) : 0),
        landSizeSqm: typeof onboardingData.landSizeSqm === 'number' ? onboardingData.landSizeSqm :
                    (onboardingData.landSizeSqm ? parseFloat(String(onboardingData.landSizeSqm)) : 0),
        villaSizeSqm: typeof onboardingData.villaSizeSqm === 'number' ? onboardingData.villaSizeSqm :
                     (onboardingData.villaSizeSqm ? parseFloat(String(onboardingData.villaSizeSqm)) : 0),

        // Amenities (convert to array)
        amenities: this.extractAmenities(onboardingData),

        // Utilities (as object)
        utilities: {
          electricityProvider: onboardingData.electricityProvider || '',
          waterSource: onboardingData.waterSource || '',
          internetProvider: onboardingData.internetProvider || '',
          internetPackage: onboardingData.internetPackage || ''
        },

        // Additional fields (ensure boolean values)
        hasPool: Boolean(onboardingData.hasPool),
        hasGarden: Boolean(onboardingData.hasGarden),
        hasAirConditioning: Boolean(onboardingData.hasAirConditioning),
        hasParking: Boolean(onboardingData.hasParking),
        hasLaundry: Boolean(onboardingData.hasLaundry),
        hasBackupPower: Boolean(onboardingData.hasBackupPower),

        // Media - Set cover photo as first uploaded image
        coverPhoto: Array.isArray(onboardingData.uploadedPhotos) && onboardingData.uploadedPhotos.length > 0
          ? onboardingData.uploadedPhotos[0]
          : null,
        images: Array.isArray(onboardingData.uploadedPhotos) ? onboardingData.uploadedPhotos : [],

        // Status
        status: 'active',
        isActive: true,

        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      // Sanitize data to remove any undefined values
      const propertyData = sanitizeForFirestore(rawPropertyData)

      console.log('🧹 Raw property data:', rawPropertyData)
      console.log('💾 Sanitized property data:', propertyData)

      console.log('💾 Property data to save:', propertyData)

      // Validate Firestore connection
      if (!db) {
        throw new Error('Firebase Firestore not initialized')
      }

      // Save to user's properties subcollection
      const propertyRef = doc(db, 'users', userId, 'properties', propertyId)
      await setDoc(propertyRef, propertyData)

      console.log('✅ Property saved to user profile:', propertyId)
      console.log('📍 Firestore path: /users/' + userId + '/properties/' + propertyId)

      return propertyId
    } catch (error) {
      console.error('❌ Error creating property in user profile:', error)
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
   * Get properties from user's subcollection (NEW METHOD)
   * Reads from /users/{userId}/properties
   */
  static async getPropertiesFromUserProfile(userId: string): Promise<any[]> {
    try {
      console.log('🏠 Loading properties from user profile subcollection')
      console.log('👤 User ID:', userId)

      if (!userId) {
        throw new Error('User ID is required')
      }

      // Validate Firestore connection
      if (!db) {
        throw new Error('Firebase Firestore not initialized')
      }

      // Query user's properties subcollection
      const propertiesRef = collection(db, 'users', userId, 'properties')
      const q = query(propertiesRef, orderBy('createdAt', 'desc'))

      const querySnapshot = await getDocs(q)
      const properties: any[] = []

      querySnapshot.forEach((doc) => {
        properties.push({
          id: doc.id,
          ...doc.data()
        })
      })

      console.log(`✅ Retrieved ${properties.length} properties from user profile`)
      console.log('📍 Firestore path: /users/' + userId + '/properties')
      return properties
    } catch (error) {
      console.error('❌ Error fetching properties from user profile:', error)
      throw error
    }
  }

  /**
   * Get a specific property from user's subcollection
   * Reads from /users/{userId}/properties/{propertyId}
   */
  static async getPropertyFromUserProfile(userId: string, propertyId: string): Promise<any | null> {
    try {
      console.log('🏠 Loading specific property from user profile subcollection')
      console.log('👤 User ID:', userId)
      console.log('🏠 Property ID:', propertyId)

      if (!userId || !propertyId) {
        throw new Error('User ID and Property ID are required')
      }

      // Validate Firestore connection
      if (!db) {
        throw new Error('Firebase Firestore not initialized')
      }

      // Get specific property document from user's subcollection
      const propertyRef = doc(db, 'users', userId, 'properties', propertyId)
      const propertyDoc = await getDoc(propertyRef)

      if (propertyDoc.exists()) {
        const propertyData = {
          id: propertyDoc.id,
          ...propertyDoc.data()
        }
        console.log('✅ Retrieved property from user profile')
        console.log('📍 Firestore path: /users/' + userId + '/properties/' + propertyId)
        return propertyData
      } else {
        console.log('❌ Property not found in user profile subcollection')
        return null
      }
    } catch (error) {
      console.error('❌ Error fetching property from user profile:', error)
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
