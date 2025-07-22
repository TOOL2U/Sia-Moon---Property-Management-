import { db } from '@/lib/firebase'
import {
    addDoc,
    collection,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
    where
} from 'firebase/firestore'

export interface StaffLocation {
  id?: string
  staffId: string
  latitude: number
  longitude: number
  timestamp: Timestamp
  status: 'working' | 'traveling' | 'break' | 'emergency' | 'offline'
  accuracy: number
  speed?: number
  heading?: number
  batteryLevel?: number
}

export interface PropertyStatus {
  id?: string
  propertyId: string
  status: 'occupied' | 'vacant' | 'cleaning' | 'maintenance' | 'checkout' | 'checkin'
  guestCount: number
  lastUpdated: Timestamp
  nextEvent?: {
    type: 'checkin' | 'checkout'
    time: Timestamp
  }
}

class StaffGPSService {
  private locationListeners: Map<string, () => void> = new Map()
  private propertyListeners: Map<string, () => void> = new Map()

  /**
   * Update staff location in real-time
   */
  async updateStaffLocation(location: Omit<StaffLocation, 'id' | 'timestamp'>): Promise<void> {
    if (!db) {
      throw new Error('Firebase not initialized')
    }

    try {
      const locationData = {
        staffId: location.staffId,
        latitude: location.latitude,
        longitude: location.longitude,
        status: location.status,
        accuracy: location.accuracy,
        timestamp: serverTimestamp(),
        lastUpdated: new Date().toISOString(),
        ...(location.speed !== undefined && { speed: location.speed }),
        ...(location.heading !== undefined && { heading: location.heading }),
        ...(location.batteryLevel !== undefined && { batteryLevel: location.batteryLevel })
      }

      await addDoc(collection(db, 'staff_locations'), locationData)
      console.log(`✅ Location updated for staff ${location.staffId}`)
    } catch (error) {
      console.error('❌ Error updating staff location:', error)
      throw error
    }
  }

  /**
   * Subscribe to real-time staff location updates
   */
  subscribeToStaffLocations(
    callback: (locations: StaffLocation[]) => void,
    options: {
      activeOnly?: boolean
      maxAge?: number // minutes
    } = {}
  ): () => void {
    if (!db) {
      console.error('Firebase not initialized')
      return () => {}
    }

    const { activeOnly = true, maxAge = 30 } = options

    // Query for recent locations
    const cutoffTime = new Date()
    cutoffTime.setMinutes(cutoffTime.getMinutes() - maxAge)

    // Use simpler query to avoid composite index requirement
    let q = query(
      collection(db, 'staff_locations'),
      orderBy('timestamp', 'desc'),
      limit(activeOnly ? 50 : 100)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const locations: StaffLocation[] = []
      const latestByStaff = new Map<string, StaffLocation>()

      snapshot.docs.forEach((doc) => {
        const data = doc.data()
        const location: StaffLocation = {
          id: doc.id,
          staffId: data.staffId,
          latitude: data.latitude,
          longitude: data.longitude,
          timestamp: data.timestamp,
          status: data.status,
          accuracy: data.accuracy,
          speed: data.speed,
          heading: data.heading,
          batteryLevel: data.batteryLevel
        }

        // Keep only the latest location per staff member
        const existing = latestByStaff.get(location.staffId)
        if (!existing || location.timestamp.toMillis() > existing.timestamp.toMillis()) {
          latestByStaff.set(location.staffId, location)
        }
      })

      let uniqueLocations = Array.from(latestByStaff.values())

      // Filter for active staff if requested
      if (activeOnly) {
        uniqueLocations = uniqueLocations.filter(location =>
          ['working', 'traveling', 'break', 'emergency'].includes(location.status)
        )
      }

      callback(uniqueLocations)
    }, (error) => {
      console.error('❌ Error in staff locations subscription:', error)
    })

    return unsubscribe
  }

  /**
   * Subscribe to property status updates
   */
  subscribeToPropertyStatus(
    callback: (properties: PropertyStatus[]) => void
  ): () => void {
    if (!db) {
      console.error('Firebase not initialized')
      return () => {}
    }

    const q = query(
      collection(db, 'property_status'),
      orderBy('lastUpdated', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const propertiesMap = new Map<string, PropertyStatus>()

      snapshot.docs.forEach((doc) => {
        const data = doc.data()
        const property: PropertyStatus = {
          id: doc.id,
          propertyId: data.propertyId,
          status: data.status,
          guestCount: data.guestCount,
          lastUpdated: data.lastUpdated,
          nextEvent: data.nextEvent
        }

        // Keep only the latest status per property
        const existing = propertiesMap.get(property.propertyId)
        if (!existing || property.lastUpdated.toMillis() > existing.lastUpdated.toMillis()) {
          propertiesMap.set(property.propertyId, property)
        }
      })

      const uniqueProperties = Array.from(propertiesMap.values())
      callback(uniqueProperties)
    }, (error) => {
      console.error('❌ Error in property status subscription:', error)
    })

    return unsubscribe
  }

  /**
   * Update property status
   */
  async updatePropertyStatus(propertyId: string, status: Partial<PropertyStatus>): Promise<void> {
    if (!db) {
      throw new Error('Firebase not initialized')
    }

    try {
      const statusData = {
        propertyId,
        status: status.status,
        guestCount: status.guestCount || 0,
        lastUpdated: serverTimestamp(),
        ...(status.nextEvent && { nextEvent: status.nextEvent })
      }

      // For now, just add a new document (in production, you'd update existing)
      await addDoc(collection(db, 'property_status'), statusData)

      console.log(`✅ Property status updated for ${propertyId}`)
    } catch (error) {
      console.error('❌ Error updating property status:', error)
      throw error
    }
  }

  /**
   * Get staff location history
   */
  subscribeToStaffHistory(
    staffId: string,
    callback: (locations: StaffLocation[]) => void,
    hours: number = 24
  ): () => void {
    if (!db) {
      console.error('Firebase not initialized')
      return () => {}
    }

    const cutoffTime = new Date()
    cutoffTime.setHours(cutoffTime.getHours() - hours)

    const q = query(
      collection(db, 'staff_locations'),
      where('staffId', '==', staffId),
      orderBy('timestamp', 'desc'),
      limit(100)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const locations: StaffLocation[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        staffId: doc.data().staffId,
        latitude: doc.data().latitude,
        longitude: doc.data().longitude,
        timestamp: doc.data().timestamp,
        status: doc.data().status,
        accuracy: doc.data().accuracy,
        speed: doc.data().speed,
        heading: doc.data().heading,
        batteryLevel: doc.data().batteryLevel
      }))

      callback(locations)
    })

    return unsubscribe
  }

  /**
   * Cleanup all listeners
   */
  cleanup(): void {
    this.locationListeners.forEach((unsubscribe) => unsubscribe())
    this.propertyListeners.forEach((unsubscribe) => unsubscribe())
    this.locationListeners.clear()
    this.propertyListeners.clear()
  }
}

export const staffGPSService = new StaffGPSService()
export default staffGPSService
