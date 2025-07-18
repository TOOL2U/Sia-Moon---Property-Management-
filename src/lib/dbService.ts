/**
 * Database Service Layer
 *
 * This service provides a clean abstraction over the database operations.
 * Uses Firebase Firestore for production and local storage for development.
 * All methods return consistent data structures regardless of the underlying database.
 *
 * Features:
 * - Consistent API for all database operations
 * - Firebase Firestore integration
 * - Proper error handling and logging
 * - TypeScript support with proper types
 */

import db, { User, Property, Booking, VillaOnboarding, Task, DatabaseResponse } from '@/lib/db'
// TODO: For production, replace with Firebase Firestore service

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

  static async updateProperty(id: string, updates: Partial<Property>): Promise<DatabaseResponse<Property>> {
    try {
      console.log('🔄 Updating property:', id)
      const result = await db.updateProperty(id, updates)
      console.log('📝 Update property result:', result.data ? 'Success' : 'Failed')
      return result
    } catch (error) {
      console.error('❌ Error updating property:', error)
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

  static async getBooking(id: string): Promise<DatabaseResponse<Booking>> {
    try {
      console.log('🔍 Getting booking:', id)
      const result = await db.getBooking(id)
      console.log('📝 Booking result:', result.data ? 'Found' : 'Not found')
      return result
    } catch (error) {
      console.error('❌ Error getting booking:', error)
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

  static async updateBooking(id: string, updates: Partial<Booking>): Promise<DatabaseResponse<Booking>> {
    try {
      console.log('🔄 Updating booking:', id)
      const result = await db.updateBooking(id, updates)
      console.log('📝 Update booking result:', result.data ? 'Success' : 'Failed')
      return result
    } catch (error) {
      console.error('❌ Error updating booking:', error)
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  // VILLA ONBOARDING OPERATIONS
  static async getAllVillaOnboardings(): Promise<DatabaseResponse<VillaOnboarding[]>> {
    try {
      console.log('🔍 Getting all villa onboardings')
      const result = await db.getAllVillaOnboardings()
      console.log('📝 All villa onboardings result:', result.data?.length || 0, 'onboardings found')
      return result
    } catch (error) {
      console.error('❌ Error getting all villa onboardings:', error)
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  static async getVillaOnboarding(id: string): Promise<DatabaseResponse<VillaOnboarding>> {
    try {
      console.log('🔍 Getting villa onboarding:', id)
      const result = await db.getVillaOnboarding(id)
      console.log('📝 Villa onboarding result:', result.data ? 'Found' : 'Not found')
      return result
    } catch (error) {
      console.error('❌ Error getting villa onboarding:', error)
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  static async getVillaOnboardingsByUserId(userId: string): Promise<DatabaseResponse<VillaOnboarding[]>> {
    try {
      console.log('🔍 Getting villa onboardings for user:', userId)
      const result = await db.getVillaOnboardingsByUserId(userId)
      console.log('📝 User villa onboardings result:', result.data?.length || 0, 'onboardings found')
      return result
    } catch (error) {
      console.error('❌ Error getting user villa onboardings:', error)
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  static async createVillaOnboarding(onboardingData: Omit<VillaOnboarding, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResponse<VillaOnboarding>> {
    try {
      console.log('🔄 Creating villa onboarding for:', onboardingData.property_name)
      const result = await db.addVillaOnboarding(onboardingData)
      console.log('📝 Create villa onboarding result:', result.data ? 'Success' : 'Failed')
      return result
    } catch (error) {
      console.error('❌ Error creating villa onboarding:', error)
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  static async updateVillaOnboarding(id: string, updates: Partial<VillaOnboarding>): Promise<DatabaseResponse<VillaOnboarding>> {
    try {
      console.log('🔄 Updating villa onboarding:', id)
      const result = await db.updateVillaOnboarding(id, updates)
      console.log('📝 Update villa onboarding result:', result.data ? 'Success' : 'Failed')
      return result
    } catch (error) {
      console.error('❌ Error updating villa onboarding:', error)
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  static async deleteVillaOnboarding(id: string): Promise<DatabaseResponse<boolean>> {
    try {
      console.log('🔄 Deleting villa onboarding:', id)
      const result = await db.deleteVillaOnboarding(id)
      console.log('📝 Delete villa onboarding result:', result.data ? 'Success' : 'Failed')
      return result
    } catch (error) {
      console.error('❌ Error deleting villa onboarding:', error)
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  // TASK MANAGEMENT METHODS
  static async getAllTasks(): Promise<DatabaseResponse<Task[]>> {
    try {
      console.log('🔍 Getting all tasks')
      const result = await db.getAllTasks()
      console.log('📝 All tasks result:', result.data?.length || 0, 'tasks found')
      return result
    } catch (error) {
      console.error('❌ Error getting all tasks:', error)
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  static async getTask(id: string): Promise<DatabaseResponse<Task>> {
    try {
      console.log('🔍 Getting task:', id)
      const result = await db.getTask(id)
      console.log('📝 Task result:', result.data ? 'Found' : 'Not found')
      return result
    } catch (error) {
      console.error('❌ Error getting task:', error)
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  static async getTasksByAssignee(assigneeId: string): Promise<DatabaseResponse<Task[]>> {
    try {
      console.log('🔍 Getting tasks for assignee:', assigneeId)
      const result = await db.getTasksByAssignee(assigneeId)
      console.log('📝 Assignee tasks result:', result.data?.length || 0, 'tasks found')
      return result
    } catch (error) {
      console.error('❌ Error getting assignee tasks:', error)
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  static async getTasksByProperty(propertyId: string): Promise<DatabaseResponse<Task[]>> {
    try {
      console.log('🔍 Getting tasks for property:', propertyId)
      const result = await db.getTasksByProperty(propertyId)
      console.log('📝 Property tasks result:', result.data?.length || 0, 'tasks found')
      return result
    } catch (error) {
      console.error('❌ Error getting property tasks:', error)
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  static async createTask(taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResponse<Task>> {
    try {
      console.log('🔄 Creating task:', taskData.title)
      const result = await db.createTask(taskData)
      console.log('📝 Create task result:', result.data ? 'Success' : 'Failed')
      return result
    } catch (error) {
      console.error('❌ Error creating task:', error)
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  static async updateTask(id: string, updates: Partial<Task>): Promise<DatabaseResponse<Task>> {
    try {
      console.log('🔄 Updating task:', id)
      const result = await db.updateTask(id, updates)
      console.log('📝 Update task result:', result.data ? 'Success' : 'Failed')
      return result
    } catch (error) {
      console.error('❌ Error updating task:', error)
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  static async deleteTask(id: string): Promise<DatabaseResponse<boolean>> {
    try {
      console.log('🔄 Deleting task:', id)
      const result = await db.deleteTask(id)
      console.log('📝 Delete task result:', result.data ? 'Success' : 'Failed')
      return result
    } catch (error) {
      console.error('❌ Error deleting task:', error)
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  static async createCleaningTaskForBooking(bookingId: string): Promise<DatabaseResponse<Task>> {
    try {
      console.log('🔄 Creating cleaning task for booking:', bookingId)
      const result = await db.createCleaningTaskForBooking(bookingId)
      console.log('📝 Create cleaning task result:', result.data ? 'Success' : 'Failed')
      return result
    } catch (error) {
      console.error('❌ Error creating cleaning task:', error)
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

  // NOTIFICATION OPERATIONS
  static async createNotification(notification: any): Promise<DatabaseResponse<any>> {
    try {
      console.log('📢 Creating notification')
      const result = await db.createNotification(notification)
      console.log('✅ Notification created:', result.data ? 'Success' : 'Failed')
      return result
    } catch (error) {
      console.error('❌ Error creating notification:', error)
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  static async getNotificationsByUser(userId: string): Promise<DatabaseResponse<any[]>> {
    try {
      console.log('🔍 Getting notifications for user:', userId)
      const result = await db.getNotificationsByUser(userId)
      console.log('📝 Notifications result:', result.data?.length || 0, 'notifications')
      return result
    } catch (error) {
      console.error('❌ Error getting notifications:', error)
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  static async updateNotification(id: string, updates: any): Promise<DatabaseResponse<any>> {
    try {
      console.log('📝 Updating notification:', id)
      const result = await db.updateNotification(id, updates)
      console.log('✅ Notification updated:', result.data ? 'Success' : 'Failed')
      return result
    } catch (error) {
      console.error('❌ Error updating notification:', error)
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  static async markNotificationAsRead(id: string): Promise<DatabaseResponse<any>> {
    try {
      console.log('📖 Marking notification as read:', id)
      const result = await db.markNotificationAsRead(id)
      console.log('✅ Notification marked as read:', result.data ? 'Success' : 'Failed')
      return result
    } catch (error) {
      console.error('❌ Error marking notification as read:', error)
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  static async getNotificationPreferences(userId: string): Promise<DatabaseResponse<any>> {
    try {
      console.log('🔍 Getting notification preferences for user:', userId)
      const result = await db.getNotificationPreferences(userId)
      console.log('📝 Preferences result:', result.data ? 'Found' : 'Not found')
      return result
    } catch (error) {
      console.error('❌ Error getting notification preferences:', error)
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  static async createNotificationPreference(preference: any): Promise<DatabaseResponse<any>> {
    try {
      console.log('📢 Creating notification preference')
      const result = await db.createNotificationPreference(preference)
      console.log('✅ Notification preference created:', result.data ? 'Success' : 'Failed')
      return result
    } catch (error) {
      console.error('❌ Error creating notification preference:', error)
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  static async updateNotificationPreference(id: string, updates: any): Promise<DatabaseResponse<any>> {
    try {
      console.log('📝 Updating notification preference:', id)
      const result = await db.updateNotificationPreference(id, updates)
      console.log('✅ Notification preference updated:', result.data ? 'Success' : 'Failed')
      return result
    } catch (error) {
      console.error('❌ Error updating notification preference:', error)
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }
}

// Export default instance
export default DatabaseService

// TODO: For Firebase migration, replace the above with Firebase Firestore service
