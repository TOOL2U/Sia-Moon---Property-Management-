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

// TODO: Add proper types when financial_transactions table is defined
type FinancialTransaction = {
  id: string
  property_id: string
  amount: number
  currency: string
  type: 'income' | 'expense'
  description: string
  date: string
  created_at: string
  updated_at: string
}

// TODO: Add proper types when villa_onboardings table is defined
type VillaOnboarding = {
  id: string
  user_id: string
  property_name: string
  status: 'pending' | 'in_progress' | 'completed'
  created_at: string
  updated_at: string
}

// Response type for consistent error handling
interface DatabaseResponse<T> {
  success: boolean
  data: T | null
  error: string | null
}

class SupabaseService {
  private static checkSupabaseAvailable(): boolean {
    if (!supabase) {
      console.warn('⚠️ Supabase not configured - operation skipped')
      return false
    }
    return true
  }

  // VILLA ONBOARDING OPERATIONS
  // TODO: Define VillaOnboarding type if not present in supabase schema
  static async getAllVillaOnboardings(): Promise<DatabaseResponse<VillaOnboarding[]>> {
    if (!this.checkSupabaseAvailable()) {
      return handleSupabaseError(new Error('Supabase not configured'));
    }
    // TypeScript: supabase is possibly null, so assert after check
    const supabaseClient = supabase!;
    try {
      const { data, error } = await supabaseClient
        .from('villa_onboardings')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return handleSupabaseError(error);
      return handleSupabaseSuccess(data || []);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  static async createVillaOnboarding(data: Omit<VillaOnboarding, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResponse<VillaOnboarding>> {
    if (!this.checkSupabaseAvailable()) {
      return handleSupabaseError(new Error('Supabase not configured'));
    }
    const supabaseClient = supabase!;
    try {
      const { data: result, error } = await supabaseClient
        .from('villa_onboardings')
        .insert(data)
        .select()
        .single();
      if (error) return handleSupabaseError(error);
      return handleSupabaseSuccess(result);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  static async getVillaOnboarding(id: string): Promise<DatabaseResponse<VillaOnboarding>> {
    if (!this.checkSupabaseAvailable()) {
      return handleSupabaseError(new Error('Supabase not configured'));
    }
    const supabaseClient = supabase!;
    try {
      const { data, error } = await supabaseClient
        .from('villa_onboardings')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return handleSupabaseError(error);
      return handleSupabaseSuccess(data);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  static async updateVillaOnboarding(id: string, updates: Partial<VillaOnboarding>): Promise<DatabaseResponse<VillaOnboarding>> {
    if (!this.checkSupabaseAvailable()) {
      return handleSupabaseError(new Error('Supabase not configured'));
    }
    const supabaseClient = supabase!;
    try {
      const { data, error } = await supabaseClient
        .from('villa_onboardings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) return handleSupabaseError(error);
      return handleSupabaseSuccess(data);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  // PROPERTY OPERATIONS
  static async getAllProperties(userId?: string): Promise<DatabaseResponse<Property[]>> {
    if (!this.checkSupabaseAvailable()) {
      return handleSupabaseError(new Error('Supabase not configured'));
    }
    const supabaseClient = supabase!;
    try {
      // Get current user if not provided
      if (!userId) {
        const { data: { user } } = await supabaseClient.auth.getUser()
        if (!user) {
          return handleSupabaseError(new Error('Authentication required'))
        }
        userId = user.id
      }

      const { data, error } = await supabaseClient
        .from('properties')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });
      if (error) return handleSupabaseError(error);
      return handleSupabaseSuccess(data || []);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  static async getPropertiesByOwner(ownerId: string): Promise<DatabaseResponse<Property[]>> {
    // Development mode: Return mock data for demo user
    const isDevelopmentBypass = process.env.NODE_ENV === 'development' &&
                               process.env.NEXT_PUBLIC_DEV_SESSION_BYPASS === 'true' &&
                               ownerId === 'demo-user-id'

    if (isDevelopmentBypass) {
      console.log('🔧 Development mode: Returning mock properties data')
      const mockProperties: Property[] = [
        {
          id: 'demo-property-1',
          name: 'Sunset Villa Bali',
          description: 'Luxury beachfront villa with stunning sunset views',
          address: 'Jl. Sunset Road 123',
          city: 'Seminyak',
          country: 'Indonesia',
          bedrooms: 4,
          bathrooms: 3,
          max_guests: 8,
          price_per_night: 250,
          currency: 'USD',
          amenities: ['Pool', 'WiFi', 'Kitchen', 'Beach Access'],
          images: ['https://example.com/villa1.jpg'],
          owner_id: 'demo-user-id',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'demo-property-2',
          name: 'Mountain Retreat Ubud',
          description: 'Peaceful villa surrounded by rice terraces',
          address: 'Jl. Raya Ubud 456',
          city: 'Ubud',
          country: 'Indonesia',
          bedrooms: 3,
          bathrooms: 2,
          max_guests: 6,
          price_per_night: 180,
          currency: 'USD',
          amenities: ['Pool', 'WiFi', 'Garden', 'Yoga Deck'],
          images: ['https://example.com/villa2.jpg'],
          owner_id: 'demo-user-id',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
      return handleSupabaseSuccess(mockProperties)
    }

    if (!this.checkSupabaseAvailable()) {
      return handleSupabaseError(new Error('Supabase not configured'));
    }
    const supabaseClient = supabase!;
    try {
      const { data, error } = await supabaseClient
        .from('properties')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });
      if (error) return handleSupabaseError(error);
      return handleSupabaseSuccess(data || []);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  static async getProperty(id: string): Promise<DatabaseResponse<Property>> {
    if (!this.checkSupabaseAvailable()) {
      return handleSupabaseError(new Error('Supabase not configured'));
    }
    const supabaseClient = supabase!;
    try {
      const { data, error } = await supabaseClient
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return handleSupabaseError(error);
      return handleSupabaseSuccess(data);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  static async createProperty(property: PropertyInsert): Promise<DatabaseResponse<Property>> {
    if (!this.checkSupabaseAvailable()) {
      return handleSupabaseError(new Error('Supabase not configured'));
    }
    const supabaseClient = supabase!;
    try {
      const { data, error } = await supabaseClient
        .from('properties')
        .insert(property)
        .select()
        .single();
      if (error) return handleSupabaseError(error);
      return handleSupabaseSuccess(data);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  static async updateProperty(id: string, updates: PropertyUpdate): Promise<DatabaseResponse<Property>> {
    if (!this.checkSupabaseAvailable()) {
      return handleSupabaseError(new Error('Supabase not configured'));
    }
    const supabaseClient = supabase!;
    try {
      const { data, error } = await supabaseClient
        .from('properties')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) return handleSupabaseError(error);
      return handleSupabaseSuccess(data);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  static async deleteProperty(id: string): Promise<DatabaseResponse<void>> {
    if (!this.checkSupabaseAvailable()) {
      return handleSupabaseError(new Error('Supabase not configured'));
    }
    const supabaseClient = supabase!;
    try {
      const { error } = await supabaseClient
        .from('properties')
        .delete()
        .eq('id', id);
      if (error) return handleSupabaseError(error);
      return handleSupabaseSuccess(undefined);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  // BOOKING OPERATIONS
  static async getAllBookings(userId?: string): Promise<DatabaseResponse<Booking[]>> {
    if (!this.checkSupabaseAvailable()) {
      return handleSupabaseError(new Error('Supabase not configured'));
    }
    const supabaseClient = supabase!;
    try {
      // Get current user if not provided
      if (!userId) {
        const { data: { user } } = await supabaseClient.auth.getUser()
        if (!user) {
          return handleSupabaseError(new Error('Authentication required'))
        }
        userId = user.id
      }

      const { data, error } = await supabaseClient
        .from('bookings')
        .select(`
          *,
          properties (
            name,
            location
          )
        `)
        .eq('user_id', userId)
        .order('check_in', { ascending: true });
      if (error) return handleSupabaseError(error);
      return handleSupabaseSuccess(data || []);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  static async getBooking(id: string): Promise<DatabaseResponse<Booking>> {
    if (!this.checkSupabaseAvailable()) {
      return handleSupabaseError(new Error('Supabase not configured'));
    }
    const supabaseClient = supabase!;
    try {
      const { data, error } = await supabaseClient
        .from('bookings')
        .select(`
          *,
          properties (
            name,
            location
          )
        `)
        .eq('id', id)
        .single();
      if (error) return handleSupabaseError(error);
      return handleSupabaseSuccess(data);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  static async createBooking(booking: BookingInsert): Promise<DatabaseResponse<Booking>> {
    if (!this.checkSupabaseAvailable()) {
      return handleSupabaseError(new Error('Supabase not configured'));
    }
    const supabaseClient = supabase!;
    try {
      const { data, error } = await supabaseClient
        .from('bookings')
        .insert(booking)
        .select()
        .single();
      if (error) return handleSupabaseError(error);
      return handleSupabaseSuccess(data);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  static async updateBooking(id: string, updates: BookingUpdate): Promise<DatabaseResponse<Booking>> {
    if (!this.checkSupabaseAvailable()) {
      return handleSupabaseError(new Error('Supabase not configured'));
    }
    const supabaseClient = supabase!;
    try {
      const { data, error } = await supabaseClient
        .from('bookings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) return handleSupabaseError(error);
      return handleSupabaseSuccess(data);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  static async deleteBooking(id: string): Promise<DatabaseResponse<void>> {
    if (!this.checkSupabaseAvailable()) {
      return handleSupabaseError(new Error('Supabase not configured'));
    }
    const supabaseClient = supabase!;
    try {
      const { error } = await supabaseClient
        .from('bookings')
        .delete()
        .eq('id', id);
      if (error) return handleSupabaseError(error);
      return handleSupabaseSuccess(undefined);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  static async getBookingsByProperty(propertyId: string): Promise<DatabaseResponse<Booking[]>> {
    // Development mode: Return mock data for demo properties
    const isDevelopmentBypass = process.env.NODE_ENV === 'development' &&
                               process.env.NEXT_PUBLIC_DEV_SESSION_BYPASS === 'true' &&
                               (propertyId === 'demo-property-1' || propertyId === 'demo-property-2')

    if (isDevelopmentBypass) {
      console.log('🔧 Development mode: Returning mock bookings data for property:', propertyId)
      const mockBookings: Booking[] = [
        {
          id: 'demo-booking-1',
          property_id: propertyId,
          guest_name: 'John Smith',
          guest_email: 'john@example.com',
          guest_phone: '+1234567890',
          check_in: '2024-02-15',
          check_out: '2024-02-20',
          guests: 4,
          total_amount: 1250,
          currency: 'USD',
          status: 'confirmed',
          booking_source: 'direct',
          special_requests: 'Late check-in requested',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'demo-booking-2',
          property_id: propertyId,
          guest_name: 'Sarah Johnson',
          guest_email: 'sarah@example.com',
          guest_phone: '+1987654321',
          check_in: '2024-03-01',
          check_out: '2024-03-07',
          guests: 2,
          total_amount: 1080,
          currency: 'USD',
          status: 'pending',
          booking_source: 'airbnb',
          special_requests: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
      return handleSupabaseSuccess(mockBookings)
    }

    if (!this.checkSupabaseAvailable()) {
      return handleSupabaseError(new Error('Supabase not configured'));
    }
    const supabaseClient = supabase!;
    try {
      const { data, error } = await supabaseClient
        .from('bookings')
        .select(`
          *,
          properties (
            name,
            address
          )
        `)
        .eq('property_id', propertyId)
        .order('check_in', { ascending: true });
      if (error) return handleSupabaseError(error);
      return handleSupabaseSuccess(data || []);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  // USER OPERATIONS
  static async getUser(id: string): Promise<DatabaseResponse<{ id: string; email?: string; full_name?: string; role?: string }>> {
    if (!this.checkSupabaseAvailable()) {
      return handleSupabaseError(new Error('Supabase not configured'));
    }
    const supabaseClient = supabase!;
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return handleSupabaseError(error);
      return handleSupabaseSuccess(data);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  static async getAllUsers(): Promise<DatabaseResponse<{ id: string; email?: string; full_name?: string; role?: string }[]>> {
    if (!this.checkSupabaseAvailable()) {
      return handleSupabaseError(new Error('Supabase not configured'));
    }
    const supabaseClient = supabase!;
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return handleSupabaseError(error);
      return handleSupabaseSuccess(data || []);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  // TASK OPERATIONS
  static async getTasksByProperty(propertyId: string): Promise<DatabaseResponse<Task[]>> {
    if (!this.checkSupabaseAvailable()) {
      return handleSupabaseError(new Error('Supabase not configured'));
    }
    const supabaseClient = supabase!;
    try {
      const { data, error } = await supabaseClient
        .from('tasks')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });
      if (error) return handleSupabaseError(error);
      return handleSupabaseSuccess(data || []);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  // REPORT OPERATIONS
  static async getReportsByProperty(propertyId: string): Promise<DatabaseResponse<Report[]>> {
    // Development mode: Return mock data for demo properties
    const isDevelopmentBypass = process.env.NODE_ENV === 'development' &&
                               process.env.NEXT_PUBLIC_DEV_SESSION_BYPASS === 'true' &&
                               (propertyId === 'demo-property-1' || propertyId === 'demo-property-2')

    if (isDevelopmentBypass) {
      console.log('🔧 Development mode: Returning mock reports data for property:', propertyId)
      const mockReports: Report[] = [
        {
          id: 'demo-report-1',
          property_id: propertyId,
          month: 1,
          year: 2024,
          total_income: 3500,
          total_expenses: 800,
          net_income: 2700,
          occupancy_rate: 85,
          total_bookings: 12,
          currency: 'USD',
          notes: 'Strong performance this month',
          pdf_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
      return handleSupabaseSuccess(mockReports)
    }

    if (!this.checkSupabaseAvailable()) {
      return handleSupabaseError(new Error('Supabase not configured'));
    }
    const supabaseClient = supabase!;
    try {
      const { data, error } = await supabaseClient
        .from('reports')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });
      if (error) return handleSupabaseError(error);
      return handleSupabaseSuccess(data || []);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  // NOTIFICATION OPERATIONS
  static async getNotificationsByUser(userId: string): Promise<DatabaseResponse<Notification[]>> {
    if (!this.checkSupabaseAvailable()) {
      return handleSupabaseError(new Error('Supabase not configured'));
    }
    const supabaseClient = supabase!;
    try {
      const { data, error } = await supabaseClient
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) return handleSupabaseError(error);
      return handleSupabaseSuccess(data || []);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  static async createNotification(notification: NotificationInsert): Promise<DatabaseResponse<Notification>> {
    if (!this.checkSupabaseAvailable()) {
      return handleSupabaseError(new Error('Supabase not configured'));
    }
    const supabaseClient = supabase!;
    try {
      const { data, error } = await supabaseClient
        .from('notifications')
        .insert(notification)
        .select()
        .single();
      if (error) return handleSupabaseError(error);
      return handleSupabaseSuccess(data);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  static async updateNotification(id: string, updates: NotificationUpdate): Promise<DatabaseResponse<Notification>> {
    if (!this.checkSupabaseAvailable()) {
      return handleSupabaseError(new Error('Supabase not configured'));
    }
    const supabaseClient = supabase!;
    try {
      const { data, error } = await supabaseClient
        .from('notifications')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) return handleSupabaseError(error);
      return handleSupabaseSuccess(data);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  static async markNotificationAsRead(id: string): Promise<DatabaseResponse<Notification>> {
    if (!this.checkSupabaseAvailable()) {
      return handleSupabaseError(new Error('Supabase not configured'));
    }
    const supabaseClient = supabase!;
    try {
      const { data, error } = await supabaseClient
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      if (error) return handleSupabaseError(error);
      return handleSupabaseSuccess(data);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  static async markAllNotificationsAsRead(userId: string): Promise<DatabaseResponse<void>> {
    if (!this.checkSupabaseAvailable()) {
      return handleSupabaseError(new Error('Supabase not configured'));
    }
    const supabaseClient = supabase!;
    try {
      const { error } = await supabaseClient
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_read', false);
      if (error) return handleSupabaseError(error);
      return handleSupabaseSuccess(undefined);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  static async deleteNotification(id: string): Promise<DatabaseResponse<void>> {
    if (!this.checkSupabaseAvailable()) {
      return handleSupabaseError(new Error('Supabase not configured'));
    }
    const supabaseClient = supabase!;
    try {
      const { error } = await supabaseClient
        .from('notifications')
        .delete()
        .eq('id', id);
      if (error) return handleSupabaseError(error);
      return handleSupabaseSuccess(undefined);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  // TASK OPERATIONS (Additional methods)
  static async getAllTasks(): Promise<DatabaseResponse<Task[]>> {
    if (!this.checkSupabaseAvailable()) {
      return handleSupabaseError(new Error('Supabase not configured'));
    }
    const supabaseClient = supabase!;
    try {
      const { data, error } = await supabaseClient
        .from('tasks')
        .select(`
          *,
          properties (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });
      if (error) return handleSupabaseError(error);
      return handleSupabaseSuccess(data || []);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  static async createTask(task: TaskInsert): Promise<DatabaseResponse<Task>> {
    if (!this.checkSupabaseAvailable()) {
      return handleSupabaseError(new Error('Supabase not configured'));
    }
    const supabaseClient = supabase!;
    try {
      const { data, error } = await supabaseClient
        .from('tasks')
        .insert(task)
        .select()
        .single();
      if (error) return handleSupabaseError(error);
      return handleSupabaseSuccess(data);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  static async updateTask(id: string, updates: TaskUpdate): Promise<DatabaseResponse<Task>> {
    if (!this.checkSupabaseAvailable()) {
      return handleSupabaseError(new Error('Supabase not configured'));
    }
    const supabaseClient = supabase!;
    try {
      const { data, error } = await supabaseClient
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) return handleSupabaseError(error);
      return handleSupabaseSuccess(data);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  // NOTIFICATION PREFERENCES OPERATIONS
  static async getNotificationPreferences(userId: string): Promise<DatabaseResponse<NotificationPreferences>> {
    if (!this.checkSupabaseAvailable()) {
      return handleSupabaseError(new Error('Supabase not configured'));
    }
    const supabaseClient = supabase!;
    try {
      const { data, error } = await supabaseClient
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // If no preferences exist, return default preferences
        if (error.code === 'PGRST116') {
          const defaultPreferences = {
            user_id: userId,
            email_notifications: true,
            push_notifications: true,
            booking_updates: true,
            maintenance_alerts: true,
            payment_reminders: true,
            marketing_emails: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          return handleSupabaseSuccess(defaultPreferences);
        }
        return handleSupabaseError(error);
      }
      return handleSupabaseSuccess(data);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  static async updateNotificationPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<DatabaseResponse<NotificationPreferences>> {
    if (!this.checkSupabaseAvailable()) {
      return handleSupabaseError(new Error('Supabase not configured'));
    }
    const supabaseClient = supabase!;
    try {
      const { data, error } = await supabaseClient
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      if (error) return handleSupabaseError(error);
      return handleSupabaseSuccess(data);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }
}

export default SupabaseService;
