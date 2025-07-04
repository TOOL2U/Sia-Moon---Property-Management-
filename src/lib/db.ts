/**
 * Local Database Abstraction Layer
 * 
 * This file provides a local in-memory database that mimics Supabase's structure and API.
 * It's designed for development purposes and can be easily swapped back to Supabase for production.
 * 
 * Features:
 * - Matches Supabase schema (users, properties, bookings)
 * - Returns Promises to mimic async behavior
 * - Same field names and data structures as Supabase
 * - Easy migration path back to Supabase
 */

// Types matching Supabase schema
export interface User {
  id: string
  email: string
  name: string
  role: 'client' | 'staff'
  created_at: string
  updated_at: string
}

export interface Property {
  id: string
  name: string
  description: string
  location: string
  owner_id: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  property_id: string
  guest_name: string
  guest_email: string
  check_in: string
  check_out: string
  status: 'confirmed' | 'pending' | 'cancelled'
  created_at: string
  updated_at: string
}

// Database response types (matching Supabase format)
export interface DatabaseResponse<T> {
  data: T | null
  error: DatabaseError | null
}

export interface DatabaseError {
  message: string
  code?: string
}

// In-memory database store
class LocalDatabase {
  private users: User[] = []
  private properties: Property[] = []
  private bookings: Booking[] = []

  constructor() {
    this.initializeTestData()
  }

  // Initialize with test data
  private initializeTestData() {
    // Test users
    this.users = [
      {
        id: '12b47961-1777-4dac-8744-74aa29d43730',
        email: 'test@example.com',
        name: 'Test User',
        role: 'client',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'staff-user-id',
        email: 'sarah.johnson@siamoon.com',
        name: 'Sarah Johnson',
        role: 'staff',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]

    // Test properties
    this.properties = [
      {
        id: 'prop-1',
        name: 'Villa Sunset',
        description: 'Beautiful beachfront villa',
        location: 'Phuket, Thailand',
        owner_id: '12b47961-1777-4dac-8744-74aa29d43730',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]

    // Test bookings
    this.bookings = [
      {
        id: 'booking-1',
        property_id: 'prop-1',
        guest_name: 'John Smith',
        guest_email: 'john.smith@email.com',
        check_in: '2024-07-15',
        check_out: '2024-07-22',
        status: 'confirmed' as const,
        created_at: new Date('2024-07-01').toISOString(),
        updated_at: new Date('2024-07-01').toISOString()
      },
      {
        id: 'booking-2',
        property_id: 'prop-1',
        guest_name: 'Sarah Johnson',
        guest_email: 'sarah.j@email.com',
        check_in: '2024-08-01',
        check_out: '2024-08-05',
        status: 'pending' as const,
        created_at: new Date('2024-07-20').toISOString(),
        updated_at: new Date('2024-07-20').toISOString()
      },
      {
        id: 'booking-3',
        property_id: 'prop-1',
        guest_name: 'Mike Wilson',
        guest_email: 'mike.wilson@email.com',
        check_in: '2024-06-10',
        check_out: '2024-06-17',
        status: 'cancelled' as const,
        created_at: new Date('2024-06-01').toISOString(),
        updated_at: new Date('2024-06-05').toISOString()
      }
    ]
  }

  // Utility methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }

  private delay(ms: number = 100): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // USER METHODS
  async getUser(id: string): Promise<DatabaseResponse<User>> {
    await this.delay()
    const user = this.users.find(u => u.id === id)
    return {
      data: user || null,
      error: user ? null : { message: 'User not found' }
    }
  }

  async getUserByEmail(email: string): Promise<DatabaseResponse<User>> {
    await this.delay()
    const user = this.users.find(u => u.email === email)
    return {
      data: user || null,
      error: user ? null : { message: 'User not found' }
    }
  }

  async getAllUsers(): Promise<DatabaseResponse<User[]>> {
    await this.delay()
    return {
      data: this.users,
      error: null
    }
  }

  async addUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResponse<User>> {
    await this.delay()
    
    // Check if user already exists
    const existingUser = this.users.find(u => u.email === userData.email)
    if (existingUser) {
      return {
        data: null,
        error: { message: 'User with this email already exists' }
      }
    }

    const newUser: User = {
      ...userData,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    this.users.push(newUser)
    return {
      data: newUser,
      error: null
    }
  }

  async updateUser(id: string, updates: Partial<Omit<User, 'id' | 'created_at'>>): Promise<DatabaseResponse<User>> {
    await this.delay()
    
    const userIndex = this.users.findIndex(u => u.id === id)
    if (userIndex === -1) {
      return {
        data: null,
        error: { message: 'User not found' }
      }
    }

    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updates,
      updated_at: new Date().toISOString()
    }

    return {
      data: this.users[userIndex],
      error: null
    }
  }

  async deleteUser(id: string): Promise<DatabaseResponse<boolean>> {
    await this.delay()
    
    const userIndex = this.users.findIndex(u => u.id === id)
    if (userIndex === -1) {
      return {
        data: null,
        error: { message: 'User not found' }
      }
    }

    this.users.splice(userIndex, 1)
    return {
      data: true,
      error: null
    }
  }

  // PROPERTY METHODS
  async getProperty(id: string): Promise<DatabaseResponse<Property>> {
    await this.delay()
    const property = this.properties.find(p => p.id === id)
    return {
      data: property || null,
      error: property ? null : { message: 'Property not found' }
    }
  }

  async getAllProperties(): Promise<DatabaseResponse<Property[]>> {
    await this.delay()
    return {
      data: this.properties,
      error: null
    }
  }

  async getPropertiesByOwner(ownerId: string): Promise<DatabaseResponse<Property[]>> {
    await this.delay()
    const properties = this.properties.filter(p => p.owner_id === ownerId)
    return {
      data: properties,
      error: null
    }
  }

  async addProperty(propertyData: Omit<Property, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResponse<Property>> {
    await this.delay()
    
    const newProperty: Property = {
      ...propertyData,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    this.properties.push(newProperty)
    return {
      data: newProperty,
      error: null
    }
  }

  // BOOKING METHODS
  async getAllBookings(): Promise<DatabaseResponse<Booking[]>> {
    await this.delay()
    return {
      data: this.bookings,
      error: null
    }
  }

  async getBookingsByProperty(propertyId: string): Promise<DatabaseResponse<Booking[]>> {
    await this.delay()
    const bookings = this.bookings.filter(b => b.property_id === propertyId)
    return {
      data: bookings,
      error: null
    }
  }

  async addBooking(bookingData: Omit<Booking, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResponse<Booking>> {
    await this.delay()
    
    const newBooking: Booking = {
      ...bookingData,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    this.bookings.push(newBooking)
    return {
      data: newBooking,
      error: null
    }
  }
}

// Singleton instance
const db = new LocalDatabase()

// Export the database instance
export default db

// TODO: Replace with Supabase client for production
// Example migration:
// import { createClient } from '@supabase/supabase-js'
// const supabase = createClient(url, key)
// 
// async getUser(id: string) {
//   const { data, error } = await supabase
//     .from('users')
//     .select('*')
//     .eq('id', id)
//     .single()
//   return { data, error }
// }
