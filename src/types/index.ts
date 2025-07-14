// User Profile type (matches database schema)
export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: 'client' | 'staff' | 'admin'
  avatar_url: string | null
  phone: string | null
  address: string | null // Address field for profile forms
  created_at: string
  updated_at: string
}

// Legacy User interface (for backward compatibility)
export interface User {
  id: string;
  email: string;
  role: 'client' | 'staff';
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  price_per_night: number;
  currency: string;
  amenities: string[];
  images: string[];
  owner_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  property_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone?: string | null;
  check_in: string;
  check_out: string;
  guests: number;
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'completed';
  total_amount: number;
  currency: string;
  source?: string; // Booking source (Airbnb, Booking.com, Direct, etc.)
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

// Task interface for maintenance and cleaning tasks (matches database schema)
export interface Task {
  id: string;
  property_id: string | null;
  title: string;
  description?: string | null;
  task_type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assigned_to?: string | null;
  due_date?: string | null;
  completed_at?: string | null;
  cost: number;
  currency: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

// Report interface for property reports (matches database schema)
export interface Report {
  id: string;
  property_id: string;
  month: number;
  year: number;
  total_income: number;
  total_expenses: number;
  net_income: number;
  occupancy_rate: number;
  total_bookings: number;
  currency: string;
  notes?: string | null;
  pdf_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export interface DashboardStats {
  totalProperties: number;
  totalBookings: number;
  totalRevenue: number;
  occupancyRate: number;
}

// Notification interface
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  read_at?: string | null;
  action_url?: string | null;
  created_at: string;
  updated_at: string;
}

// Notification Preferences interface
export interface NotificationPreferences {
  id?: string;
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  booking_updates: boolean;
  maintenance_alerts: boolean;
  payment_reminders: boolean;
  marketing_emails: boolean;
  created_at: string;
  updated_at: string;
}

// Insert types for database operations
export type NotificationInsert = Omit<Notification, 'id' | 'created_at' | 'updated_at'>;
export type NotificationUpdate = Partial<Omit<Notification, 'id' | 'user_id' | 'created_at'>>;
export type TaskInsert = Omit<Task, 'id' | 'created_at' | 'updated_at'>;
export type TaskUpdate = Partial<Omit<Task, 'id' | 'created_at'>>;
export type PropertyInsert = Omit<Property, 'id' | 'created_at' | 'updated_at'>;
export type PropertyUpdate = Partial<Omit<Property, 'id' | 'created_at'>>;

// Extended Report types for the Reports page
export interface ReportEntry {
  id: string;
  date: string;
  type: 'booking' | 'maintenance' | 'payment' | 'expense';
  property_id: string;
  property_name: string;
  status: 'completed' | 'pending' | 'cancelled';
  amount?: number;
  currency: string;
  description: string;
  guest_name?: string;
  staff_name?: string;
  created_at: string;
}

export interface ReportMetrics {
  totalProperties: number;
  activeBookings: number;
  completedMaintenance: number;
  monthlyRevenue: number;
  occupancyRate: number;
}

export interface ChartDataPoint {
  date: string;
  bookings?: number;
  maintenance?: number;
  revenue?: number;
  expenses?: number;
}

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

export interface ReportFilters {
  dateRange: DateRange;
  propertyId?: string;
  reportType?: 'all' | 'booking' | 'maintenance' | 'payment' | 'expense';
  status?: 'all' | 'completed' | 'pending' | 'cancelled';
  searchQuery: string;
}

// AI Log interface for property management agent
export interface AILog {
  id: string;
  booking_id: string;
  property_id: string | null;
  confidence_score: number;
  ai_summary: string;
  suggested_actions: string[];
  status: 'success' | 'error' | 'needs_review';
  ai_reasoning: string;
  feedback?: 'positive' | 'negative' | null;
  feedback_comment?: string | null;
  created_at: string;
  updated_at: string;
}

// AI Analysis Result interface
export interface AIAnalysisResult {
  matched_property_id: string | null;
  confidence_score: number;
  suggested_actions: string[];
  summary: string;
  reasoning: string;
  status: 'success' | 'error' | 'needs_review';
  error_message?: string;
}
