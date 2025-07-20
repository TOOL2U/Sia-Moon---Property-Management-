'use client'

import { googleMapsConfig } from '@/lib/env'
import db from '@/lib/db'

export interface PropertyMapData {
  id: string
  name: string
  address: string
  coordinates: {
    lat: number
    lng: number
  }
  status: 'active' | 'inactive' | 'maintenance' | 'cleaning'
  urgentTasks?: number
}

export interface StaffMapData {
  id: string
  name: string
  role: string
  status: 'available' | 'on_job' | 'traveling' | 'break' | 'offline'
  coordinates: {
    lat: number
    lng: number
  }
  currentTask?: string
  assignedProperty?: string
}

export interface TaskMapData {
  id: string
  title: string
  type: 'cleaning' | 'maintenance' | 'inspection' | 'guest_service'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  propertyId: string
  assignedStaffId?: string
  coordinates: {
    lat: number
    lng: number
  }
  status: 'pending' | 'in_progress' | 'completed'
}

class MapDataService {
  private static instance: MapDataService
  private geocodeCache = new Map<string, { lat: number; lng: number }>()

  static getInstance(): MapDataService {
    if (!MapDataService.instance) {
      MapDataService.instance = new MapDataService()
    }
    return MapDataService.instance
  }

  /**
   * Geocode an address to coordinates using Google Maps Geocoding API
   */
  async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    // Check cache first
    if (this.geocodeCache.has(address)) {
      return this.geocodeCache.get(address)!
    }

    if (!googleMapsConfig.enabled) {
      console.warn('Google Maps not configured, using default coordinates')
      return this.getDefaultCoordinates()
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${googleMapsConfig.apiKey}`
      )
      
      const data = await response.json()
      
      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location
        const coordinates = { lat: location.lat, lng: location.lng }
        
        // Cache the result
        this.geocodeCache.set(address, coordinates)
        return coordinates
      } else {
        console.warn('Geocoding failed for address:', address, data.status)
        return this.getDefaultCoordinates()
      }
    } catch (error) {
      console.error('Error geocoding address:', error)
      return this.getDefaultCoordinates()
    }
  }

  /**
   * Get default coordinates for Koh Phangan area
   */
  private getDefaultCoordinates(): { lat: number; lng: number } {
    // Default to Koh Phangan center with some random offset
    const baseLatitude = 9.7349
    const baseLongitude = 100.0269
    
    return {
      lat: baseLatitude + (Math.random() - 0.5) * 0.02, // ±0.01 degree variation
      lng: baseLongitude + (Math.random() - 0.5) * 0.02
    }
  }

  /**
   * Get all properties with their coordinates for map display
   */
  async getPropertiesForMap(): Promise<PropertyMapData[]> {
    try {
      const response = await db.getAllProperties()
      
      if (response.error || !response.data) {
        console.error('Failed to fetch properties:', response.error)
        return []
      }

      const propertiesWithCoordinates = await Promise.all(
        response.data.map(async (property) => {
          // Try to geocode the address
          const coordinates = await this.geocodeAddress(property.location || property.name)
          
          return {
            id: property.id,
            name: property.name,
            address: property.location || 'Address not specified',
            coordinates: coordinates || this.getDefaultCoordinates(),
            status: property.status === 'active' ? 'active' : 'inactive',
            urgentTasks: Math.floor(Math.random() * 3) // Mock urgent tasks for now
          } as PropertyMapData
        })
      )

      console.log(`📍 Loaded ${propertiesWithCoordinates.length} properties for map`)
      return propertiesWithCoordinates
    } catch (error) {
      console.error('Error loading properties for map:', error)
      return []
    }
  }

  /**
   * Get mock staff data with realistic coordinates
   * TODO: Replace with real staff location tracking
   */
  async getStaffForMap(): Promise<StaffMapData[]> {
    // Mock staff data with realistic Thai locations
    const mockStaff: StaffMapData[] = [
      {
        id: 'staff_001',
        name: 'Somchai Jaidee',
        role: 'Cleaner',
        status: 'on_job',
        coordinates: { lat: 9.7355, lng: 100.0275 },
        currentTask: 'Cleaning Ocean View Villa',
        assignedProperty: 'prop_001'
      },
      {
        id: 'staff_002', 
        name: 'Niran Thanakit',
        role: 'Maintenance',
        status: 'traveling',
        coordinates: { lat: 9.7340, lng: 100.0260 },
        currentTask: 'En route to Mountain Retreat',
        assignedProperty: 'prop_002'
      },
      {
        id: 'staff_003',
        name: 'Ploy Siriporn',
        role: 'Housekeeper',
        status: 'available',
        coordinates: { lat: 9.7365, lng: 100.0285 },
        currentTask: undefined,
        assignedProperty: undefined
      },
      {
        id: 'staff_004',
        name: 'Kamon Rattana',
        role: 'Security',
        status: 'on_job',
        coordinates: { lat: 9.7330, lng: 100.0250 },
        currentTask: 'Security patrol - Beachfront area',
        assignedProperty: 'prop_003'
      }
    ]

    console.log(`👥 Loaded ${mockStaff.length} staff members for map`)
    return mockStaff
  }

  /**
   * Get active tasks with property coordinates
   */
  async getTasksForMap(): Promise<TaskMapData[]> {
    try {
      const properties = await this.getPropertiesForMap()
      const tasksResponse = await db.getAllTasks()

      if (tasksResponse.error || !tasksResponse.data) {
        return []
      }

      const tasksWithCoordinates = tasksResponse.data
        .filter((task: any) => task.status !== 'completed')
        .map((task: any) => {
          // Find the property for this task
          const property = properties.find(p => p.id === task.property_id)
          
          return {
            id: task.id,
            title: task.title,
            type: task.type as any,
            priority: task.priority as any,
            propertyId: task.property_id || '',
            assignedStaffId: task.assigned_to,
            coordinates: property?.coordinates || this.getDefaultCoordinates(),
            status: task.status as any
          } as TaskMapData
        })

      console.log(`📋 Loaded ${tasksWithCoordinates.length} tasks for map`)
      return tasksWithCoordinates
    } catch (error) {
      console.error('Error loading tasks for map:', error)
      return []
    }
  }

  /**
   * Update property coordinates in database
   */
  async updatePropertyCoordinates(propertyId: string, coordinates: { lat: number; lng: number }): Promise<boolean> {
    try {
      // TODO: Add coordinates field to property database schema
      console.log(`📍 Would update property ${propertyId} coordinates:`, coordinates)
      return true
    } catch (error) {
      console.error('Error updating property coordinates:', error)
      return false
    }
  }

  /**
   * Simulate real-time staff location updates
   */
  startLocationTracking(callback: (staff: StaffMapData[]) => void): () => void {
    const interval = setInterval(async () => {
      const staff = await this.getStaffForMap()
      
      // Simulate small movements for active staff
      const updatedStaff = staff.map(member => {
        if (member.status === 'on_job' || member.status === 'traveling') {
          return {
            ...member,
            coordinates: {
              lat: member.coordinates.lat + (Math.random() - 0.5) * 0.001,
              lng: member.coordinates.lng + (Math.random() - 0.5) * 0.001
            }
          }
        }
        return member
      })
      
      callback(updatedStaff)
    }, 30000) // Update every 30 seconds

    // Return cleanup function
    return () => clearInterval(interval)
  }
}

export default MapDataService.getInstance()
