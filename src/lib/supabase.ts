import { createClient } from '@supabase/supabase-js'

// Types for our database
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'client' | 'staff' | 'admin'
          avatar_url: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'client' | 'staff' | 'admin'
          avatar_url?: string | null
          phone?: string | null
        }
        Update: {
          email?: string
          full_name?: string | null
          role?: 'client' | 'staff' | 'admin'
          avatar_url?: string | null
          phone?: string | null
        }
      }
      properties: {
        Row: {
          id: string
          name: string
          description: string | null
          address: string | null
          city: string | null
          country: string | null
          bedrooms: number
          bathrooms: number
          max_guests: number
          price_per_night: number
          currency: string
          amenities: string[]
          images: string[]
          owner_id: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          description?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          bedrooms?: number
          bathrooms?: number
          max_guests?: number
          price_per_night?: number
          currency?: string
          amenities?: string[]
          images?: string[]
          owner_id: string
          is_active?: boolean
        }
        Update: {
          name?: string
          description?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          bedrooms?: number
          bathrooms?: number
          max_guests?: number
          price_per_night?: number
          currency?: string
          amenities?: string[]
          images?: string[]
          is_active?: boolean
        }
      }
      bookings: {
        Row: {
          id: string
          property_id: string
          guest_name: string
          guest_email: string
          guest_phone: string | null
          check_in: string
          check_out: string
          guests: number
          total_amount: number
          currency: string
          status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'completed'
          booking_source: string
          special_requests: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          property_id: string
          guest_name: string
          guest_email: string
          guest_phone?: string | null
          check_in: string
          check_out: string
          guests?: number
          total_amount: number
          currency?: string
          status?: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'completed'
          booking_source?: string
          special_requests?: string | null
        }
        Update: {
          guest_name?: string
          guest_email?: string
          guest_phone?: string | null
          check_in?: string
          check_out?: string
          guests?: number
          total_amount?: number
          currency?: string
          status?: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'completed'
          booking_source?: string
          special_requests?: string | null
        }
      }
      tasks: {
        Row: {
          id: string
          property_id: string | null
          title: string
          description: string | null
          task_type: string
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          priority: 'low' | 'normal' | 'high' | 'urgent'
          assigned_to: string | null
          due_date: string | null
          completed_at: string | null
          cost: number
          currency: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          property_id?: string | null
          title: string
          description?: string | null
          task_type?: string
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          assigned_to?: string | null
          due_date?: string | null
          completed_at?: string | null
          cost?: number
          currency?: string
          notes?: string | null
        }
        Update: {
          title?: string
          description?: string | null
          task_type?: string
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          assigned_to?: string | null
          due_date?: string | null
          completed_at?: string | null
          cost?: number
          currency?: string
          notes?: string | null
        }
      }
      reports: {
        Row: {
          id: string
          property_id: string
          month: number
          year: number
          total_income: number
          total_expenses: number
          net_income: number
          occupancy_rate: number
          total_bookings: number
          currency: string
          notes: string | null
          pdf_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          property_id: string
          month: number
          year: number
          total_income?: number
          total_expenses?: number
          net_income?: number
          occupancy_rate?: number
          total_bookings?: number
          currency?: string
          notes?: string | null
          pdf_url?: string | null
        }
        Update: {
          total_income?: number
          total_expenses?: number
          net_income?: number
          occupancy_rate?: number
          total_bookings?: number
          currency?: string
          notes?: string | null
          pdf_url?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          category: string
          title: string
          message: string
          data: any
          status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read'
          priority: 'low' | 'normal' | 'high' | 'urgent'
          channels: string[]
          sent_at: string | null
          delivered_at: string | null
          read_at: string | null
          email_subject: string | null
          email_template: string | null
          push_title: string | null
          push_body: string | null
          push_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          type?: string
          category: string
          title: string
          message: string
          data?: any
          status?: 'pending' | 'sent' | 'delivered' | 'failed' | 'read'
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          channels?: string[]
          sent_at?: string | null
          delivered_at?: string | null
          read_at?: string | null
          email_subject?: string | null
          email_template?: string | null
          push_title?: string | null
          push_body?: string | null
          push_url?: string | null
        }
        Update: {
          type?: string
          category?: string
          title?: string
          message?: string
          data?: any
          status?: 'pending' | 'sent' | 'delivered' | 'failed' | 'read'
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          channels?: string[]
          sent_at?: string | null
          delivered_at?: string | null
          read_at?: string | null
          email_subject?: string | null
          email_template?: string | null
          push_title?: string | null
          push_body?: string | null
          push_url?: string | null
        }
      }
      notification_preferences: {
        Row: {
          id: string
          user_id: string
          email_enabled: boolean
          email_reports: boolean
          email_tasks: boolean
          email_invoices: boolean
          email_bookings: boolean
          email_maintenance: boolean
          email_marketing: boolean
          push_enabled: boolean
          push_tasks: boolean
          push_urgent_only: boolean
          push_quiet_hours_start: string | null
          push_quiet_hours_end: string | null
          in_app_enabled: boolean
          in_app_sound: boolean
          onesignal_player_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          email_enabled?: boolean
          email_reports?: boolean
          email_tasks?: boolean
          email_invoices?: boolean
          email_bookings?: boolean
          email_maintenance?: boolean
          email_marketing?: boolean
          push_enabled?: boolean
          push_tasks?: boolean
          push_urgent_only?: boolean
          push_quiet_hours_start?: string | null
          push_quiet_hours_end?: string | null
          in_app_enabled?: boolean
          in_app_sound?: boolean
          onesignal_player_id?: string | null
        }
        Update: {
          email_enabled?: boolean
          email_reports?: boolean
          email_tasks?: boolean
          email_invoices?: boolean
          email_bookings?: boolean
          email_maintenance?: boolean
          email_marketing?: boolean
          push_enabled?: boolean
          push_tasks?: boolean
          push_urgent_only?: boolean
          push_quiet_hours_start?: string | null
          push_quiet_hours_end?: string | null
          in_app_enabled?: boolean
          in_app_sound?: boolean
          onesignal_player_id?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_report_metrics: {
        Args: {
          p_property_id: string
          p_month: number
          p_year: number
        }
        Returns: {
          total_income: number
          total_expenses: number
          net_income: number
          occupancy_rate: number
          total_bookings: number
        }[]
      }
      generate_monthly_report: {
        Args: {
          p_property_id: string
          p_month: number
          p_year: number
        }
        Returns: string
      }
      send_notification: {
        Args: {
          p_user_id: string
          p_category: string
          p_title: string
          p_message: string
          p_data?: any
          p_priority?: 'low' | 'normal' | 'high' | 'urgent'
          p_channels?: string[]
        }
        Returns: string
      }
    }
    Enums: {
      user_role: 'client' | 'staff' | 'admin'
      booking_status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'completed'
      task_status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
      task_priority: 'low' | 'normal' | 'high' | 'urgent'
      notification_status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read'
      notification_priority: 'low' | 'normal' | 'high' | 'urgent'
    }
  }
}

// Create Supabase client for client-side usage
export const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Check if environment variables are properly configured
  if (!supabaseUrl || !supabaseKey ||
      supabaseUrl.includes('your_supabase_url_here') ||
      supabaseKey.includes('your_supabase_anon_key_here')) {

    // Allow bypass only in development
    if (process.env.NODE_ENV === 'development' &&
        process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
      console.warn('🚨 Supabase not configured - using auth bypass for development')
      // Return null to indicate Supabase is not available
      return null
    } else {
      console.error('❌ Supabase environment variables not configured properly')
      throw new Error('Supabase configuration required. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.')
    }
  }

  // Validate URL format
  try {
    new URL(supabaseUrl)
  } catch (urlError) {
    console.error('❌ Invalid Supabase URL format:', supabaseUrl)
    throw new Error('Invalid Supabase URL format. Please check your NEXT_PUBLIC_SUPABASE_URL environment variable.')
  }

  // Validate key format (basic check)
  if (supabaseKey.length < 100) {
    console.error('❌ Supabase anonymous key appears to be invalid (too short)')
    throw new Error('Invalid Supabase anonymous key. Please check your NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.')
  }

  try {
    console.log('🔗 Creating Supabase client with URL:', supabaseUrl.substring(0, 30) + '...')
    return createClient<Database>(supabaseUrl, supabaseKey)
  } catch (clientError) {
    console.error('❌ Failed to create Supabase client:', clientError)
    throw new Error('Failed to initialize Supabase client. Please check your configuration.')
  }
}

// Export default client (can be null if not configured)
export const supabase = createSupabaseClient()

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error)
  return {
    success: false,
    error: error?.message || 'An unexpected error occurred',
    data: null
  }
}

// Helper function for successful responses
export const handleSupabaseSuccess = (data: any) => {
  return {
    success: true,
    error: null,
    data
  }
}
