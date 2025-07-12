import { collection, doc, setDoc, getDoc, updateDoc, arrayUnion, getDocs, Timestamp } from 'firebase/firestore'
import { getDb } from '@/lib/firebase'

/**
 * Generate a property ID using slugify(property name + address)
 */
function generatePropertyId(propertyName: string, propertyAddress: string): string {
  const combined = `${propertyName} ${propertyAddress}`.toLowerCase()

  // Remove special characters and replace spaces with hyphens
  const slugified = combined
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 50) // Limit length

  // Add timestamp suffix to ensure uniqueness
  const timestamp = Date.now().toString().slice(-6) // Last 6 digits of timestamp

  return `${slugified}-${timestamp}`
}

export interface ProfileProperty {
  id: string
  name: string
  address: string
  description?: string
  bedrooms?: number
  bathrooms?: number
  maxGuests?: number
  amenities?: string[]
  images?: string[]
  coverPhoto?: string
  pricePerNight?: number
  currency?: string
  status: 'active' | 'inactive' | 'pending_approval'
  createdAt: any
  updatedAt: any
}

export interface UserProfile {
  id: string
  email: string
  fullName: string
  role: 'client' | 'staff' | 'admin'
  properties: ProfileProperty[]
  preferences?: {
    notifications: boolean
    emailUpdates: boolean
  }
  createdAt: any
  updatedAt: any
}

export interface ClientBooking {
  id?: string
  propertyName: string
  propertyId?: string
  guestName: string
  guestEmail: string
  checkInDate: string
  checkOutDate: string
  nights: number
  guests: number
  price: number
  status: 'confirmed' | 'completed' | 'cancelled'
  bookingSource: string
  bookingReference?: string
  specialRequests?: string
  adminBookingId: string // Link back to admin booking
  syncedAt: any
  createdAt: any
  updatedAt: any
}

export class ProfileService {
  
  /**
   * Find user by email address
   */
  static async findUserByEmail(email: string): Promise<string | null> {
    try {
      console.log('🔍 PROFILE: Finding user by email:', email)

      const profilesRef = collection(getDb(), 'profiles')
      const snapshot = await getDocs(profilesRef)

      console.log('🔍 PROFILE: Total profiles found:', snapshot.docs.length)

      const allEmails: string[] = []
      for (const doc of snapshot.docs) {
        const profile = doc.data() as UserProfile
        allEmails.push(profile.email || 'no-email')

        console.log('🔍 PROFILE: Checking profile:', {
          id: profile.id,
          email: profile.email,
          matches: profile.email?.toLowerCase() === email.toLowerCase()
        })

        if (profile.email && profile.email.toLowerCase() === email.toLowerCase()) {
          console.log('✅ PROFILE: Found user by email:', profile.id)
          return profile.id
        }
      }

      console.log('❌ PROFILE: No user found with email:', email)
      console.log('❌ PROFILE: Available emails:', allEmails)
      return null

    } catch (error) {
      console.error('❌ PROFILE: Error finding user by email:', error)
      return null
    }
  }

  /**
   * Create a new user profile during registration
   */
  static async createUserProfile(
    userId: string,
    email: string,
    fullName: string,
    role: 'client' | 'staff' | 'admin' = 'client'
  ): Promise<boolean> {
    try {
      console.log('👤 PROFILE: Creating new user profile')
      console.log('👤 PROFILE: User ID:', userId)
      console.log('👤 PROFILE: Email:', email)
      console.log('👤 PROFILE: Name:', fullName)
      
      const profileData: UserProfile = {
        id: userId,
        email: email.toLowerCase().trim(),
        fullName: fullName.trim(),
        role,
        properties: [], // Start with empty properties array
        preferences: {
          notifications: true,
          emailUpdates: true
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }
      
      // Create profile document in profiles collection
      const profileRef = doc(getDb(), 'profiles', userId)
      await setDoc(profileRef, profileData)
      
      console.log('✅ PROFILE: User profile created successfully')
      return true
      
    } catch (error) {
      console.error('❌ PROFILE: Error creating user profile:', error)
      return false
    }
  }
  
  /**
   * Create property in user subcollection from onboarding data
   */
  static async createPropertyInUserSubcollection(
    userId: string,
    onboardingData: any
  ): Promise<string | null> {
    try {
      console.log('🏠 PROFILE: Creating property in user subcollection')
      console.log('🏠 PROFILE: User ID:', userId)
      console.log('🏠 PROFILE: Property Name:', onboardingData.propertyName)

      // Generate property ID using slugify
      const propertyId = generatePropertyId(
        onboardingData.propertyName || 'unnamed-property',
        onboardingData.propertyAddress || 'no-address'
      )

      console.log('🏠 PROFILE: Generated Property ID:', propertyId)

      // Create comprehensive property document
      const propertyDoc = {
        // Basic Info
        id: propertyId,
        name: onboardingData.propertyName,
        address: onboardingData.propertyAddress,
        googleMapsUrl: onboardingData.googleMapsUrl || '',

        // Property Details
        bedrooms: parseInt(onboardingData.bedrooms) || 0,
        bathrooms: parseInt(onboardingData.bathrooms) || 0,
        landSizeSqm: parseInt(onboardingData.landSizeSqm) || 0,
        villaSizeSqm: parseInt(onboardingData.villaSizeSqm) || 0,
        yearBuilt: parseInt(onboardingData.yearBuilt) || null,

        // Amenities
        hasPool: onboardingData.hasPool || false,
        hasGarden: onboardingData.hasGarden || false,
        hasAirConditioning: onboardingData.hasAirConditioning || false,
        hasParking: onboardingData.hasParking || false,
        hasLaundry: onboardingData.hasLaundry || false,
        hasBackupPower: onboardingData.hasBackupPower || false,
        hasSmartLock: onboardingData.hasSmartLock || false,

        // Utilities
        internetProvider: onboardingData.internetProvider || '',
        internetPackage: onboardingData.internetPackage || '',
        electricityProvider: onboardingData.electricityProvider || '',
        waterSource: onboardingData.waterSource || '',

        // Access & Staff
        accessDetails: onboardingData.accessDetails || '',
        gateRemoteDetails: onboardingData.gateRemoteDetails || '',
        onsiteStaff: onboardingData.onsiteStaff || '',

        // Smart Electric System
        hasSmartElectricSystem: onboardingData.hasSmartElectricSystem || false,
        smartSystemBrand: onboardingData.smartSystemBrand || '',
        smartDevicesControlled: onboardingData.smartDevicesControlled || [],
        smartSystemAppPlatform: onboardingData.smartSystemAppPlatform || '',
        hasHubGateway: onboardingData.hasHubGateway || false,
        hubGatewayLocation: onboardingData.hubGatewayLocation || '',
        linkedToPropertyWifi: onboardingData.linkedToPropertyWifi || false,
        controlAccountOwner: onboardingData.controlAccountOwner || '',
        loginCredentialsProvided: onboardingData.loginCredentialsProvided || false,
        loginCredentialsDetails: onboardingData.loginCredentialsDetails || '',
        hasActiveSchedulesAutomations: onboardingData.hasActiveSchedulesAutomations || false,
        schedulesAutomationsDetails: onboardingData.schedulesAutomationsDetails || '',
        smartSystemSpecialInstructions: onboardingData.smartSystemSpecialInstructions || '',

        // Rental & Marketing
        rentalRates: onboardingData.rentalRates || '',
        platformsListed: onboardingData.platformsListed || [],
        averageOccupancyRate: onboardingData.averageOccupancyRate || '',
        minimumStayRequirements: onboardingData.minimumStayRequirements || '',
        targetGuests: onboardingData.targetGuests || '',
        ownerBlackoutDates: onboardingData.ownerBlackoutDates || '',

        // Preferences & Rules
        petsAllowed: onboardingData.petsAllowed || false,
        partiesAllowed: onboardingData.partiesAllowed || false,
        smokingAllowed: onboardingData.smokingAllowed || false,
        maintenanceAutoApprovalLimit: onboardingData.maintenanceAutoApprovalLimit || '',

        // Current Condition
        repairsNeeded: onboardingData.repairsNeeded || '',

        // Photos & Media
        professionalPhotosStatus: onboardingData.professionalPhotosStatus || '',
        floorPlanImagesAvailable: onboardingData.floorPlanImagesAvailable || false,
        videoWalkthroughAvailable: onboardingData.videoWalkthroughAvailable || false,
        uploadedPhotos: onboardingData.uploadedPhotos || [],

        // Emergency Contact
        emergencyContactName: onboardingData.emergencyContactName || '',
        emergencyContactPhone: onboardingData.emergencyContactPhone || '',

        // Owner Information (for reference)
        ownerUserId: userId,

        // Status and Timestamps
        status: 'pending_approval',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),

        // Additional Notes
        notes: onboardingData.notes || onboardingData.repairsNeeded || ''
      }

      // Save to user's properties subcollection
      const propertyRef = doc(getDb(), 'users', userId, 'properties', propertyId)
      await setDoc(propertyRef, propertyDoc)

      console.log('✅ PROFILE: Property created in user subcollection successfully')
      return propertyId

    } catch (error) {
      console.error('❌ PROFILE: Error creating property in user subcollection:', error)
      return null
    }
  }

  /**
   * Add a property to user's profile from onboarding (legacy method - still used for backward compatibility)
   */
  static async addPropertyToProfile(
    userId: string,
    propertyData: Omit<ProfileProperty, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string | null> {
    try {
      console.log('🏠 PROFILE: Adding property to user profile (legacy)')
      console.log('🏠 PROFILE: User ID:', userId)
      console.log('🏠 PROFILE: Property:', propertyData.name)

      // Generate property ID
      const propertyId = `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Create complete property object
      const property: ProfileProperty = {
        ...propertyData,
        id: propertyId,
        status: propertyData.status || 'pending_approval',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }
      
      // Add property to user's profile properties array
      const profileRef = doc(getDb(), 'profiles', userId)
      await updateDoc(profileRef, {
        properties: arrayUnion(property),
        updatedAt: Timestamp.now()
      })
      
      console.log('✅ PROFILE: Property added to profile successfully')
      console.log('✅ PROFILE: Property ID:', propertyId)
      
      return propertyId
      
    } catch (error) {
      console.error('❌ PROFILE: Error adding property to profile:', error)
      return null
    }
  }
  
  /**
   * Get user profile by ID
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const profileRef = doc(getDb(), 'profiles', userId)
      const profileDoc = await getDoc(profileRef)
      
      if (profileDoc.exists()) {
        return {
          id: profileDoc.id,
          ...profileDoc.data()
        } as UserProfile
      }
      
      return null
      
    } catch (error) {
      console.error('❌ PROFILE: Error getting user profile:', error)
      return null
    }
  }
  
  /**
   * Get all user profiles (for client matching)
   */
  static async getAllProfiles(): Promise<UserProfile[]> {
    try {
      console.log('📋 PROFILE: Fetching all user profiles')
      
      const profilesRef = collection(getDb(), 'profiles')
      const profilesSnapshot = await getDocs(profilesRef)
      
      const profiles: UserProfile[] = []
      profilesSnapshot.forEach(doc => {
        profiles.push({
          id: doc.id,
          ...doc.data()
        } as UserProfile)
      })
      
      console.log(`📋 PROFILE: Retrieved ${profiles.length} profiles`)
      return profiles
      
    } catch (error) {
      console.error('❌ PROFILE: Error fetching profiles:', error)
      return []
    }
  }
  
  /**
   * Find client profile by property name
   */
  static async findClientByPropertyName(propertyName: string): Promise<{
    profile: UserProfile
    property: ProfileProperty
    confidence: number
    matchMethod: string
  } | null> {
    try {
      console.log('🔍 PROFILE: Searching for client by property name')
      console.log('🔍 PROFILE: Property name:', `"${propertyName}"`)
      
      const profiles = await this.getAllProfiles()
      const searchTerm = propertyName.toLowerCase().trim()
      
      // Log all profiles and their properties for debugging
      profiles.forEach((profile, index) => {
        console.log(`👤 PROFILE ${index + 1}: ${profile.email}`)
        if (profile.properties && Array.isArray(profile.properties)) {
          console.log(`   📋 Properties (${profile.properties.length}):`)
          profile.properties.forEach((prop, propIndex) => {
            console.log(`      ${propIndex + 1}. "${prop.name}"`)
          })
        } else {
          console.log(`   📋 Properties: None`)
        }
      })
      
      // Search for exact match first
      for (const profile of profiles) {
        if (!profile.properties || !Array.isArray(profile.properties)) continue
        
        for (const property of profile.properties) {
          if (!property.name) continue
          
          const propertyNameLower = property.name.toLowerCase().trim()
          console.log(`🔍 PROFILE: Comparing "${searchTerm}" with "${propertyNameLower}"`)
          
          // Exact match
          if (propertyNameLower === searchTerm) {
            console.log('✅ PROFILE: EXACT MATCH FOUND!')
            return {
              profile,
              property,
              confidence: 1.0,
              matchMethod: 'exact_property_name'
            }
          }
        }
      }
      
      // Search for fuzzy match
      for (const profile of profiles) {
        if (!profile.properties || !Array.isArray(profile.properties)) continue
        
        for (const property of profile.properties) {
          if (!property.name) continue
          
          const propertyNameLower = property.name.toLowerCase().trim()
          
          // Contains match
          if (propertyNameLower.includes(searchTerm) || searchTerm.includes(propertyNameLower)) {
            console.log('✅ PROFILE: FUZZY MATCH FOUND!')
            return {
              profile,
              property,
              confidence: 0.8,
              matchMethod: 'fuzzy_property_name'
            }
          }
        }
      }
      
      console.log('❌ PROFILE: No matching client found')
      return null
      
    } catch (error) {
      console.error('❌ PROFILE: Error finding client by property name:', error)
      return null
    }
  }
  
  /**
   * Create booking in client's profile subcollection
   */
  static async createClientBooking(
    clientId: string,
    bookingData: Omit<ClientBooking, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string | null> {
    try {
      console.log('📝 PROFILE: Creating booking in client profile')
      console.log('📝 PROFILE: Client ID:', clientId)
      console.log('📝 PROFILE: Property:', bookingData.propertyName)
      
      const booking: ClientBooking = {
        ...bookingData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }
      
      // Create booking in client's bookings subcollection
      const bookingsRef = collection(getDb(), 'profiles', clientId, 'bookings')
      const bookingRef = doc(bookingsRef)
      await setDoc(bookingRef, booking)
      
      console.log('✅ PROFILE: Client booking created successfully')
      console.log('✅ PROFILE: Booking ID:', bookingRef.id)
      
      return bookingRef.id
      
    } catch (error) {
      console.error('❌ PROFILE: Error creating client booking:', error)
      return null
    }
  }

  /**
   * Get all properties from user's subcollection
   */
  static async getUserProperties(userId: string): Promise<any[]> {
    try {
      console.log('🏠 PROFILE: Getting user properties from subcollection')
      console.log('🏠 PROFILE: User ID:', userId)

      const propertiesRef = collection(getDb(), 'users', userId, 'properties')
      const snapshot = await getDocs(propertiesRef)

      const properties = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      console.log('✅ PROFILE: Found properties in subcollection:', properties.length)
      return properties

    } catch (error) {
      console.error('❌ PROFILE: Error getting user properties:', error)
      return []
    }
  }

  /**
   * Get a specific property from user's subcollection
   */
  static async getUserProperty(userId: string, propertyId: string): Promise<any | null> {
    try {
      console.log('🏠 PROFILE: Getting specific user property')
      console.log('🏠 PROFILE: User ID:', userId)
      console.log('🏠 PROFILE: Property ID:', propertyId)

      const propertyRef = doc(getDb(), 'users', userId, 'properties', propertyId)
      const propertyDoc = await getDoc(propertyRef)

      if (propertyDoc.exists()) {
        console.log('✅ PROFILE: Found property in subcollection')
        return {
          id: propertyDoc.id,
          ...propertyDoc.data()
        }
      } else {
        console.log('❌ PROFILE: Property not found in subcollection')
        return null
      }

    } catch (error) {
      console.error('❌ PROFILE: Error getting user property:', error)
      return null
    }
  }
}
