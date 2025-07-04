/**
 * Database Service Layer
 * 
 * This service provides a clean abstraction over the database operations.
 * It can easily switch between local database and Supabase by changing the import.
 * All methods return consistent data structures regardless of the underlying database.
 * 
 * Features:
 * - Consistent API for all database operations
 * - Easy switching between local and Supabase
 * - Proper error handling and logging
 * - TypeScript support with proper types
 */

import db, { User, Property, Booking, DatabaseResponse } from '@/lib/db'
// TODO: For production, replace with:
// import { createClient } from '@supabase/supabase-js'

export class DatabaseService {
  // USER OPERATIONS
  static async getUser(id: string): Promise<DatabaseResponse<User>> {
    try {
      console.log('🔍 Getting user:', id)
      const result = await db.getUser(id)
      console.log('📝 User result:', result.data ? 'Found' : 'Not found')
      return result
    } catch (error) {
      console.error('❌ Error getting user:', error)
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  static async getUserByEmail(email: string): Promise<DatabaseResponse<User>> {
    try {
      console.log('🔍 Getting user by email:', email)
      const result = await db.getUserByEmail(email)
      console.log('📝 User by email result:', result.data ? 'Found' : 'Not found')
      return result
    } catch (error) {
      console.error('❌ Error getting user by email:', error)
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  static async getAllUsers(): Promise<DatabaseResponse<User[]>> {
    try {
      console.log('🔍 Getting all users')
      const result = await db.getAllUsers()
      console.log('📝 All users result:', result.data?.length || 0, 'users found')
      return result
    } catch (error) {
      console.error('❌ Error getting all users:', error)
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  static async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResponse<User>> {
    try {
      console.log('🔄 Creating user:', userData.email)
      const result = await db.addUser(userData)
      console.log('📝 Create user result:', result.data ? 'Success' : 'Failed')
      return result
    } catch (error) {
      console.error('❌ Error creating user:', error)
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  static async updateUser(id: string, updates: Partial<Omit<User, 'id' | 'created_at'>>): Promise<DatabaseResponse<User>> {
    try {
      console.log('🔄 Updating user:', id)
      const result = await db.updateUser(id, updates)
      console.log('📝 Update user result:', result.data ? 'Success' : 'Failed')
      return result
    } catch (error) {
      console.error('❌ Error updating user:', error)
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  // PROPERTY OPERATIONS
  static async getProperty(id: string): Promise<DatabaseResponse<Property>> {
    try {
      console.log('🔍 Getting property:', id)
      const result = await db.getProperty(id)
      console.log('📝 Property result:', result.data ? 'Found' : 'Not found')
      return result
    } catch (error) {
      console.error('❌ Error getting property:', error)
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  static async getAllProperties(): Promise<DatabaseResponse<Property[]>> {
    try {
      console.log('🔍 Getting all properties')
      const result = await db.getAllProperties()
      console.log('📝 All properties result:', result.data?.length || 0, 'properties found')
      return result
    } catch (error) {
      console.error('❌ Error getting all properties:', error)
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  static async getPropertiesByOwner(ownerId: string): Promise<DatabaseResponse<Property[]>> {
    try {
      console.log('🔍 Getting properties by owner:', ownerId)
      const result = await db.getPropertiesByOwner(ownerId)
      console.log('📝 Properties by owner result:', result.data?.length || 0, 'properties found')
      return result
    } catch (error) {
      console.error('❌ Error getting properties by owner:', error)
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  static async createProperty(propertyData: Omit<Property, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResponse<Property>> {
    try {
      console.log('🔄 Creating property:', propertyData.name)
      const result = await db.addProperty(propertyData)
      console.log('📝 Create property result:', result.data ? 'Success' : 'Failed')
      return result
    } catch (error) {
      console.error('❌ Error creating property:', error)
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  // BOOKING OPERATIONS
  static async getAllBookings(): Promise<DatabaseResponse<Booking[]>> {
    try {
      console.log('🔍 Getting all bookings')
      const result = await db.getAllBookings()
      console.log('📝 All bookings result:', result.data?.length || 0, 'bookings found')
      return result
    } catch (error) {
      console.error('❌ Error getting all bookings:', error)
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  static async getBookingsByProperty(propertyId: string): Promise<DatabaseResponse<Booking[]>> {
    try {
      console.log('🔍 Getting bookings by property:', propertyId)
      const result = await db.getBookingsByProperty(propertyId)
      console.log('📝 Bookings by property result:', result.data?.length || 0, 'bookings found')
      return result
    } catch (error) {
      console.error('❌ Error getting bookings by property:', error)
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  static async createBooking(bookingData: Omit<Booking, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResponse<Booking>> {
    try {
      console.log('🔄 Creating booking for property:', bookingData.property_id)
      const result = await db.addBooking(bookingData)
      console.log('📝 Create booking result:', result.data ? 'Success' : 'Failed')
      return result
    } catch (error) {
      console.error('❌ Error creating booking:', error)
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  // UTILITY METHODS
  static async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔍 Testing database connection...')
      const result = await db.getAllUsers()
      return {
        success: !result.error,
        message: result.error ? result.error.message : 'Database connection successful'
      }
    } catch (error) {
      console.error('❌ Database connection test failed:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Export default instance
export default DatabaseService

// TODO: For Supabase migration, replace the above with:
// 
// import { createClient } from '@supabase/supabase-js'
// 
// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// )
// 
// export class DatabaseService {
//   static async getUser(id: string) {
//     const { data, error } = await supabase
//       .from('users')
//       .select('*')
//       .eq('id', id)
//       .single()
//     return { data, error }
//   }
//   
//   static async getUserByEmail(email: string) {
//     const { data, error } = await supabase
//       .from('users')
//       .select('*')
//       .eq('email', email)
//       .single()
//     return { data, error }
//   }
//   
//   // ... other methods following the same pattern
// }
