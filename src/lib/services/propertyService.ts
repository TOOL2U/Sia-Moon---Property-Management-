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
  serverTimestamp,
  limit,
  startAfter,
  onSnapshot,
  writeBatch,
  DocumentSnapshot
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { getAuth } from 'firebase/auth'
import {
  Property as PropertyType,
  PropertyFilters,
  PropertySearchResult,
  PropertyDashboard,
  PropertyStatus,
  PropertyAlert,
  PropertyActivity,
  PropertyBulkOperation
} from '@/types/property'

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

  // ===== ENHANCED PROPERTY MANAGEMENT METHODS =====

  /**
   * Get all properties with advanced filtering and pagination
   */
  static async getAllPropertiesAdvanced(filters?: PropertyFilters): Promise<PropertySearchResult> {
    try {
      console.log('🏠 PropertyService: Fetching all properties with advanced filters:', filters)

      let q = collection(db, this.collection)

      // Apply filters
      if (filters?.status && filters.status.length > 0) {
        q = query(q, where('status', 'in', filters.status))
      }

      if (filters?.ownerId) {
        q = query(q, where('userId', '==', filters.ownerId))
      }

      // Apply sorting
      if (filters?.sortBy) {
        const sortOrder = filters.sortOrder || 'desc'
        q = query(q, orderBy(filters.sortBy === 'name' ? 'name' : 'updatedAt', sortOrder))
      } else {
        q = query(q, orderBy('updatedAt', 'desc'))
      }

      // Apply pagination
      if (filters?.limit) {
        q = query(q, limit(filters.limit))
      }

      const snapshot = await getDocs(q)
      const properties: Property[] = []

      snapshot.forEach((doc) => {
        const data = doc.data()
        properties.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
        } as Property)
      })

      // Apply client-side filters for complex queries
      let filteredProperties = properties

      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase()
        filteredProperties = properties.filter(property =>
          property.name?.toLowerCase().includes(searchTerm) ||
          property.city?.toLowerCase().includes(searchTerm) ||
          property.address?.toLowerCase().includes(searchTerm)
        )
      }

      if (filters?.priceRange) {
        filteredProperties = filteredProperties.filter(property => {
          const price = property.pricePerNight || 0
          return (!filters.priceRange!.min || price >= filters.priceRange!.min) &&
                 (!filters.priceRange!.max || price <= filters.priceRange!.max)
        })
      }

      const total = filteredProperties.length
      const page = filters?.page || 1
      const pageSize = filters?.limit || 20
      const totalPages = Math.ceil(total / pageSize)

      // Apply pagination to filtered results
      const startIndex = (page - 1) * pageSize
      const paginatedProperties = filteredProperties.slice(startIndex, startIndex + pageSize)

      console.log(`✅ PropertyService: Found ${total} properties, returning page ${page}/${totalPages}`)

      return {
        properties: paginatedProperties,
        total,
        page,
        totalPages,
        filters: filters || {}
      }

    } catch (error) {
      console.error('❌ PropertyService: Error fetching properties:', error)
      throw new Error('Failed to fetch properties')
    }
  }

  /**
   * Update property status with validation
   */
  static async updatePropertyStatus(propertyId: string, status: PropertyStatus, reason?: string): Promise<void> {
    try {
      console.log('🏠 PropertyService: Updating property status:', propertyId, status)

      const docRef = doc(db, this.collection, propertyId)
      const updateData: any = {
        status,
        isActive: status === 'active',
        updatedAt: Timestamp.now()
      }

      if (reason) {
        updateData.statusReason = reason
      }

      await updateDoc(docRef, updateData)

      console.log('✅ PropertyService: Property status updated successfully')

    } catch (error) {
      console.error('❌ PropertyService: Error updating property status:', error)
      throw new Error('Failed to update property status')
    }
  }

  /**
   * Perform bulk operations on multiple properties
   */
  static async performBulkOperation(operation: PropertyBulkOperation): Promise<void> {
    try {
      console.log('🏠 PropertyService: Performing bulk operation:', operation.operation)

      const batch = writeBatch(db)

      for (const propertyId of operation.propertyIds) {
        const docRef = doc(db, this.collection, propertyId)

        switch (operation.operation) {
          case 'update_status':
            batch.update(docRef, {
              status: operation.data.status,
              isActive: operation.data.status === 'active',
              updatedAt: Timestamp.now()
            })
            break

          case 'update_pricing':
            batch.update(docRef, {
              pricePerNight: operation.data.pricePerNight,
              updatedAt: Timestamp.now()
            })
            break

          default:
            console.warn('Unknown bulk operation:', operation.operation)
        }
      }

      await batch.commit()
      console.log(`✅ PropertyService: Bulk operation completed for ${operation.propertyIds.length} properties`)

    } catch (error) {
      console.error('❌ PropertyService: Error performing bulk operation:', error)
      throw new Error('Failed to perform bulk operation')
    }
  }

  /**
   * Generate property dashboard with comprehensive metrics
   */
  static async getPropertyDashboard(): Promise<PropertyDashboard> {
    try {
      console.log('🏠 PropertyService: Generating property dashboard')

      const allProperties = await this.getAllProperties()

      // Calculate overview metrics
      const totalProperties = allProperties.length
      const activeProperties = allProperties.filter(p => p.status === 'active').length
      const inactiveProperties = allProperties.filter(p => p.status === 'inactive').length
      const maintenanceProperties = allProperties.filter(p => p.status === 'pending_approval').length

      // Mock performance data for demonstration
      const mockPerformanceData = this.generateMockPerformanceData(allProperties)

      const dashboard: PropertyDashboard = {
        overview: {
          totalProperties,
          activeProperties,
          inactiveProperties,
          maintenanceProperties,
          averageOccupancy: mockPerformanceData.averageOccupancy,
          totalRevenue: mockPerformanceData.totalRevenue,
          averageRating: mockPerformanceData.averageRating,
          totalBookings: mockPerformanceData.totalBookings
        },
        performance: {
          topPerformers: mockPerformanceData.topPerformers,
          underPerformers: mockPerformanceData.underPerformers,
          averageADR: mockPerformanceData.averageADR,
          averageRevPAR: mockPerformanceData.averageRevPAR,
          occupancyTrend: 5.2,
          revenueTrend: 12.8
        },
        maintenance: {
          activeIssues: Math.floor(totalProperties * 0.1),
          urgentIssues: Math.floor(totalProperties * 0.02),
          scheduledMaintenance: Math.floor(totalProperties * 0.05),
          maintenanceCosts: totalProperties * 2500,
          averageResolutionTime: 3.5
        },
        revenue: {
          totalRevenue: mockPerformanceData.totalRevenue,
          monthlyRevenue: mockPerformanceData.totalRevenue / 12,
          revenueGrowth: 15.3,
          topRevenueProperties: mockPerformanceData.topPerformers.slice(0, 3),
          revenueByType: {
            villa: mockPerformanceData.totalRevenue * 0.6,
            apartment: mockPerformanceData.totalRevenue * 0.25,
            house: mockPerformanceData.totalRevenue * 0.15
          }
        },
        occupancy: {
          averageOccupancy: mockPerformanceData.averageOccupancy,
          occupancyTrend: 8.7,
          highestOccupancy: mockPerformanceData.topPerformers.slice(0, 3),
          lowestOccupancy: mockPerformanceData.underPerformers.slice(0, 3),
          seasonalOccupancy: {
            'Spring': 75.2,
            'Summer': 89.1,
            'Fall': 68.4,
            'Winter': 52.7
          }
        },
        alerts: this.generateMockAlerts(allProperties),
        recentActivity: this.generateMockActivity(allProperties)
      }

      console.log('✅ PropertyService: Dashboard generated successfully')
      return dashboard

    } catch (error) {
      console.error('❌ PropertyService: Error generating dashboard:', error)
      throw new Error('Failed to generate property dashboard')
    }
  }

  /**
   * Real-time property updates subscription
   */
  static subscribeToPropertyUpdates(callback: (properties: Property[]) => void): () => void {
    console.log('🏠 PropertyService: Setting up real-time property updates')

    const q = query(collection(db, this.collection), orderBy('updatedAt', 'desc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const properties: Property[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        properties.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
        } as Property)
      })

      console.log(`🔄 PropertyService: Real-time update - ${properties.length} properties`)
      callback(properties)
    }, (error) => {
      console.error('❌ PropertyService: Real-time update error:', error)
    })

    return unsubscribe
  }

  /**
   * Generate mock performance data for demonstration
   */
  private static generateMockPerformanceData(properties: Property[]) {
    const totalProperties = properties.length

    // Generate realistic mock data
    const averageOccupancy = 72.5 + Math.random() * 15 // 72.5-87.5%
    const averagePrice = 250 + Math.random() * 200 // $250-450 per night
    const totalRevenue = totalProperties * averagePrice * 365 * (averageOccupancy / 100)
    const averageRating = 4.2 + Math.random() * 0.6 // 4.2-4.8 stars
    const totalBookings = Math.floor(totalProperties * 50 * (averageOccupancy / 100))

    // Create mock top and bottom performers
    const propertiesWithMockData = properties.map(property => ({
      ...property,
      mockRevenue: (property.pricePerNight || averagePrice) * 365 * (0.6 + Math.random() * 0.4),
      mockOccupancy: 50 + Math.random() * 40,
      mockRating: 3.8 + Math.random() * 1.2
    }))

    const topPerformers = propertiesWithMockData
      .sort((a, b) => b.mockRevenue - a.mockRevenue)
      .slice(0, 5)

    const underPerformers = propertiesWithMockData
      .sort((a, b) => a.mockRevenue - b.mockRevenue)
      .slice(0, 5)

    return {
      averageOccupancy: Math.round(averageOccupancy * 100) / 100,
      totalRevenue: Math.round(totalRevenue),
      averageRating: Math.round(averageRating * 10) / 10,
      totalBookings,
      averageADR: Math.round(averagePrice),
      averageRevPAR: Math.round(averagePrice * (averageOccupancy / 100)),
      topPerformers,
      underPerformers
    }
  }

  /**
   * Generate mock alerts for demonstration
   */
  private static generateMockAlerts(properties: Property[]): PropertyAlert[] {
    const alerts: PropertyAlert[] = []

    // Generate some sample alerts
    properties.slice(0, 5).forEach((property, index) => {
      if (property.status === 'pending_approval') {
        alerts.push({
          id: `alert-${index}`,
          propertyId: property.id,
          propertyName: property.name,
          type: 'compliance',
          severity: 'warning',
          message: `Property pending approval - requires admin review`,
          createdAt: new Date().toISOString(),
          acknowledged: false,
          actionRequired: true
        })
      }

      if (!property.isActive) {
        alerts.push({
          id: `alert-inactive-${index}`,
          propertyId: property.id,
          propertyName: property.name,
          type: 'booking',
          severity: 'info',
          message: `Property is inactive and not receiving bookings`,
          createdAt: new Date().toISOString(),
          acknowledged: false,
          actionRequired: false
        })
      }
    })

    return alerts
  }

  /**
   * Generate mock activity for demonstration
   */
  private static generateMockActivity(properties: Property[]): PropertyActivity[] {
    const activities: PropertyActivity[] = []

    properties.slice(0, 10).forEach((property, index) => {
      activities.push({
        id: `activity-${index}`,
        propertyId: property.id,
        propertyName: property.name,
        type: 'property_updated',
        description: 'Property information updated',
        user: 'admin',
        timestamp: new Date(Date.now() - index * 3600000).toISOString()
      })
    })

    return activities
  }

  /**
   * Get properties by status
   */
  static async getPropertiesByStatus(status: PropertyStatus): Promise<Property[]> {
    try {
      console.log('🏠 PropertyService: Fetching properties by status:', status)

      const q = query(
        collection(db, this.collection),
        where('status', '==', status),
        orderBy('updatedAt', 'desc')
      )

      const snapshot = await getDocs(q)
      const properties: Property[] = []

      snapshot.forEach((doc) => {
        const data = doc.data()
        properties.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
        } as Property)
      })

      console.log(`✅ PropertyService: Found ${properties.length} properties with status ${status}`)
      return properties

    } catch (error) {
      console.error('❌ PropertyService: Error fetching properties by status:', error)
      throw new Error('Failed to fetch properties by status')
    }
  }

  /**
   * Search properties by text
   */
  static async searchProperties(searchTerm: string): Promise<Property[]> {
    try {
      console.log('🏠 PropertyService: Searching properties:', searchTerm)

      const allProperties = await this.getAllProperties()
      const searchTermLower = searchTerm.toLowerCase()

      const filteredProperties = allProperties.filter(property =>
        property.name?.toLowerCase().includes(searchTermLower) ||
        property.city?.toLowerCase().includes(searchTermLower) ||
        property.address?.toLowerCase().includes(searchTermLower) ||
        property.country?.toLowerCase().includes(searchTermLower)
      )

      console.log(`✅ PropertyService: Found ${filteredProperties.length} properties matching search`)
      return filteredProperties

    } catch (error) {
      console.error('❌ PropertyService: Error searching properties:', error)
      throw new Error('Failed to search properties')
    }
  }
}
