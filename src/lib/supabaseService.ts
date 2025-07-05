import { supabase, handleSupabaseError, handleSupabaseSuccess } from './supabase'
import type { Database } from './supabase'

// Type aliases for easier use
type Property = Database['public']['Tables']['properties']['Row']
type PropertyInsert = Database['public']['Tables']['properties']['Insert']
type PropertyUpdate = Database['public']['Tables']['properties']['Update']

type Booking = Database['public']['Tables']['bookings']['Row']
type BookingInsert = Database['public']['Tables']['bookings']['Insert']
type BookingUpdate = Database['public']['Tables']['bookings']['Update']

type Task = Database['public']['Tables']['tasks']['Row']
type TaskInsert = Database['public']['Tables']['tasks']['Insert']
type TaskUpdate = Database['public']['Tables']['tasks']['Update']

type Report = Database['public']['Tables']['reports']['Row']
type ReportInsert = Database['public']['Tables']['reports']['Insert']
type ReportUpdate = Database['public']['Tables']['reports']['Update']

type Notification = Database['public']['Tables']['notifications']['Row']
type NotificationInsert = Database['public']['Tables']['notifications']['Insert']
type NotificationUpdate = Database['public']['Tables']['notifications']['Update']

type NotificationPreference = Database['public']['Tables']['notification_preferences']['Row']
type NotificationPreferenceInsert = Database['public']['Tables']['notification_preferences']['Insert']
type NotificationPreferenceUpdate = Database['public']['Tables']['notification_preferences']['Update']

type Profile = Database['public']['Tables']['profiles']['Row']
type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export interface DatabaseResponse<T> {
  success: boolean
  data: T | null
  error: string | null
}

class SupabaseService {
  // PROPERTY OPERATIONS
  static async getAllProperties(): Promise<DatabaseResponse<Property[]>> {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) return handleSupabaseError(error)
      return handleSupabaseSuccess(data || [])
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  static async getProperty(id: string): Promise<DatabaseResponse<Property>> {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single()

      if (error) return handleSupabaseError(error)
      return handleSupabaseSuccess(data)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  static async getPropertiesByOwner(ownerId: string): Promise<DatabaseResponse<Property[]>> {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', ownerId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) return handleSupabaseError(error)
      return handleSupabaseSuccess(data || [])
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  static async createProperty(property: PropertyInsert): Promise<DatabaseResponse<Property>> {
    try {
      const { data, error } = await supabase
        .from('properties')
        .insert(property)
        .select()
        .single()

      if (error) return handleSupabaseError(error)
      return handleSupabaseSuccess(data)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  static async updateProperty(id: string, updates: PropertyUpdate): Promise<DatabaseResponse<Property>> {
    try {
      const { data, error } = await supabase
        .from('properties')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) return handleSupabaseError(error)
      return handleSupabaseSuccess(data)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  static async deleteProperty(id: string): Promise<DatabaseResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('properties')
        .update({ is_active: false })
        .eq('id', id)

      if (error) return handleSupabaseError(error)
      return handleSupabaseSuccess(true)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // BOOKING OPERATIONS
  static async getAllBookings(): Promise<DatabaseResponse<Booking[]>> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          property:properties(id, name)
        `)
        .order('created_at', { ascending: false })

      if (error) return handleSupabaseError(error)
      return handleSupabaseSuccess(data || [])
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  static async getBooking(id: string): Promise<DatabaseResponse<Booking>> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          property:properties(id, name)
        `)
        .eq('id', id)
        .single()

      if (error) return handleSupabaseError(error)
      return handleSupabaseSuccess(data)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  static async getBookingsByProperty(propertyId: string): Promise<DatabaseResponse<Booking[]>> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('property_id', propertyId)
        .order('check_in', { ascending: false })

      if (error) return handleSupabaseError(error)
      return handleSupabaseSuccess(data || [])
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  static async createBooking(booking: BookingInsert): Promise<DatabaseResponse<Booking>> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert(booking)
        .select()
        .single()

      if (error) return handleSupabaseError(error)
      return handleSupabaseSuccess(data)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  static async updateBooking(id: string, updates: BookingUpdate): Promise<DatabaseResponse<Booking>> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) return handleSupabaseError(error)
      return handleSupabaseSuccess(data)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  static async deleteBooking(id: string): Promise<DatabaseResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id)

      if (error) return handleSupabaseError(error)
      return handleSupabaseSuccess(true)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // TASK OPERATIONS
  static async getAllTasks(): Promise<DatabaseResponse<Task[]>> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          property:properties(id, name),
          assigned_user:profiles!tasks_assigned_to_fkey(id, full_name, email)
        `)
        .order('created_at', { ascending: false })

      if (error) return handleSupabaseError(error)
      return handleSupabaseSuccess(data || [])
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  static async getTask(id: string): Promise<DatabaseResponse<Task>> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          property:properties(id, name),
          assigned_user:profiles!tasks_assigned_to_fkey(id, full_name, email)
        `)
        .eq('id', id)
        .single()

      if (error) return handleSupabaseError(error)
      return handleSupabaseSuccess(data)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  static async getTasksByProperty(propertyId: string): Promise<DatabaseResponse<Task[]>> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_user:profiles!tasks_assigned_to_fkey(id, full_name, email)
        `)
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })

      if (error) return handleSupabaseError(error)
      return handleSupabaseSuccess(data || [])
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  static async getTasksByUser(userId: string): Promise<DatabaseResponse<Task[]>> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          property:properties(id, name)
        `)
        .eq('assigned_to', userId)
        .order('created_at', { ascending: false })

      if (error) return handleSupabaseError(error)
      return handleSupabaseSuccess(data || [])
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  static async createTask(task: TaskInsert): Promise<DatabaseResponse<Task>> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert(task)
        .select()
        .single()

      if (error) return handleSupabaseError(error)
      return handleSupabaseSuccess(data)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  static async updateTask(id: string, updates: TaskUpdate): Promise<DatabaseResponse<Task>> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) return handleSupabaseError(error)
      return handleSupabaseSuccess(data)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  static async deleteTask(id: string): Promise<DatabaseResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)

      if (error) return handleSupabaseError(error)
      return handleSupabaseSuccess(true)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // REPORT OPERATIONS
  static async getAllReports(): Promise<DatabaseResponse<Report[]>> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          property:properties(id, name)
        `)
        .order('year', { ascending: false })
        .order('month', { ascending: false })

      if (error) return handleSupabaseError(error)
      return handleSupabaseSuccess(data || [])
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  static async getReport(id: string): Promise<DatabaseResponse<Report>> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          property:properties(id, name)
        `)
        .eq('id', id)
        .single()

      if (error) return handleSupabaseError(error)
      return handleSupabaseSuccess(data)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  static async getReportsByProperty(propertyId: string): Promise<DatabaseResponse<Report[]>> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('property_id', propertyId)
        .order('year', { ascending: false })
        .order('month', { ascending: false })

      if (error) return handleSupabaseError(error)
      return handleSupabaseSuccess(data || [])
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  static async createReport(report: ReportInsert): Promise<DatabaseResponse<Report>> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .insert(report)
        .select()
        .single()

      if (error) return handleSupabaseError(error)
      return handleSupabaseSuccess(data)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  static async updateReport(id: string, updates: ReportUpdate): Promise<DatabaseResponse<Report>> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) return handleSupabaseError(error)
      return handleSupabaseSuccess(data)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  static async deleteReport(id: string): Promise<DatabaseResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', id)

      if (error) return handleSupabaseError(error)
      return handleSupabaseSuccess(true)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // Generate report using database function
  static async generateMonthlyReport(
    propertyId: string,
    month: number,
    year: number
  ): Promise<DatabaseResponse<string>> {
    try {
      const { data, error } = await supabase
        .rpc('generate_monthly_report', {
          p_property_id: propertyId,
          p_month: month,
          p_year: year
        })

      if (error) return handleSupabaseError(error)
      return handleSupabaseSuccess(data)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // NOTIFICATION OPERATIONS
  static async getNotificationsByUser(userId: string): Promise<DatabaseResponse<Notification[]>> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) return handleSupabaseError(error)
      return handleSupabaseSuccess(data || [])
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  static async createNotification(notification: NotificationInsert): Promise<DatabaseResponse<Notification>> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert(notification)
        .select()
        .single()

      if (error) return handleSupabaseError(error)
      return handleSupabaseSuccess(data)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  static async updateNotification(id: string, updates: NotificationUpdate): Promise<DatabaseResponse<Notification>> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) return handleSupabaseError(error)
      return handleSupabaseSuccess(data)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  static async markNotificationAsRead(id: string): Promise<DatabaseResponse<Notification>> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({
          status: 'read',
          read_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) return handleSupabaseError(error)
      return handleSupabaseSuccess(data)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // Send notification using database function
  static async sendNotification(
    userId: string,
    category: string,
    title: string,
    message: string,
    data?: any,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal',
    channels: string[] = ['in_app']
  ): Promise<DatabaseResponse<string>> {
    try {
      const { data, error } = await supabase
        .rpc('send_notification', {
          p_user_id: userId,
          p_category: category,
          p_title: title,
          p_message: message,
          p_data: data,
          p_priority: priority,
          p_channels: channels
        })

      if (error) return handleSupabaseError(error)
      return handleSupabaseSuccess(data)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // NOTIFICATION PREFERENCES
  static async getNotificationPreferences(userId: string): Promise<DatabaseResponse<NotificationPreference>> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) return handleSupabaseError(error)
      return handleSupabaseSuccess(data)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  static async createNotificationPreference(preference: NotificationPreferenceInsert): Promise<DatabaseResponse<NotificationPreference>> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .insert(preference)
        .select()
        .single()

      if (error) return handleSupabaseError(error)
      return handleSupabaseSuccess(data)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  static async updateNotificationPreference(id: string, updates: NotificationPreferenceUpdate): Promise<DatabaseResponse<NotificationPreference>> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) return handleSupabaseError(error)
      return handleSupabaseSuccess(data)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // USER/PROFILE OPERATIONS
  static async getAllUsers(): Promise<DatabaseResponse<Profile[]>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) return handleSupabaseError(error)
      return handleSupabaseSuccess(data || [])
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  static async getUser(id: string): Promise<DatabaseResponse<Profile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (error) return handleSupabaseError(error)
      return handleSupabaseSuccess(data)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  static async updateUser(id: string, updates: ProfileUpdate): Promise<DatabaseResponse<Profile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) return handleSupabaseError(error)
      return handleSupabaseSuccess(data)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }
}

export default SupabaseService
