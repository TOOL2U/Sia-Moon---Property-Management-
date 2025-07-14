/**
 * Staff Management Types
 * Comprehensive type definitions for staff operations and task management
 */

export interface StaffProfile {
  id: string
  name: string
  email: string
  phone?: string
  role: 'cleaner' | 'maintenance' | 'admin' | 'supervisor'
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
  
  // Assignment data
  assignedProperties?: string[]
  assignedRegions?: string[]
  workingHours?: {
    start: string
    end: string
    days: string[]
  }
  
  // Performance tracking
  completedTasks?: number
  averageRating?: number
  lastActive?: string
}

export interface StaffTask {
  id: string
  bookingId: string
  staffId: string
  staffName: string
  staffEmail: string
  
  // Booking details
  propertyName: string
  propertyId?: string
  guestName: string
  guestEmail?: string
  checkInDate: string
  checkOutDate: string
  guests?: number
  
  // Task details
  taskType: 'cleaning' | 'maintenance' | 'checkin_prep' | 'checkout_process' | 'inspection' | 'custom'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  estimatedDuration: number // in minutes
  
  // Status tracking
  status: 'assigned' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  confirmedAt?: string
  startedAt?: string
  completedAt?: string
  cancelledAt?: string
  
  // Scheduling
  scheduledDate: string
  scheduledTime?: string
  deadline: string
  
  // Additional data
  specialInstructions?: string
  requiredSupplies?: string[]
  photos?: string[]
  notes?: string
  completionNotes?: string
  
  // Metadata
  createdAt: string
  updatedAt: string
  createdBy: string // admin who approved the booking
  
  // Automation
  autoCreated: boolean
  automationRules?: string[]
}

export interface StaffTaskFilters {
  status?: string
  taskType?: string
  priority?: string
  dateRange?: {
    start: string
    end: string
  }
  property?: string
  sortBy?: 'deadline' | 'priority' | 'created' | 'scheduled'
  sortOrder?: 'asc' | 'desc'
}

export interface StaffFilters {
  search?: string
  role?: 'cleaner' | 'maintenance' | 'admin' | 'supervisor'
  status?: 'active' | 'inactive'
  region?: string
  sortBy?: 'name' | 'role' | 'status' | 'created'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface StaffStats {
  total: number
  active: number
  inactive: number
  byRole: Record<string, number>
  totalTasks: number
  pendingTasks: number
  inProgressTasks: number
  completedTasks: number
  overdueeTasks: number
  todayTasks: number
  upcomingTasks: number
  averageCompletionTime: number
  completionRate: number
}

export interface CreateStaffData {
  name: string
  email: string
  phone?: string
  role: 'cleaner' | 'maintenance' | 'admin' | 'supervisor'
  status?: 'active' | 'inactive'
  assignedProperties?: string[]
  assignedRegions?: string[]
}

export interface UpdateStaffData {
  name?: string
  email?: string
  phone?: string
  role?: 'cleaner' | 'maintenance' | 'admin' | 'supervisor'
  status?: 'active' | 'inactive'
  assignedProperties?: string[]
  assignedRegions?: string[]
}

export interface StaffFormErrors {
  name?: string
  email?: string
  phone?: string
  role?: string
  status?: string
  assignedProperties?: string
  assignedRegions?: string
  general?: string
}

export interface StaffApiResponse {
  success: boolean
  data?: StaffProfile
  message?: string
  error?: string
}

export interface StaffListResponse {
  success: boolean
  data: StaffProfile[]
  stats: StaffStats
  error?: string
}

export interface StaffTaskResponse {
  success: boolean
  data?: StaffTask
  message?: string
  error?: string
}

export interface StaffTaskListResponse {
  success: boolean
  data: StaffTask[]
  stats: StaffStats
  error?: string
}

// Constants for dropdowns and validation
export const STAFF_ROLES = [
  { value: 'cleaner', label: 'Cleaner', description: 'Responsible for cleaning and housekeeping tasks' },
  { value: 'maintenance', label: 'Maintenance', description: 'Handles property maintenance and repairs' },
  { value: 'supervisor', label: 'Supervisor', description: 'Oversees staff operations and quality control' },
  { value: 'admin', label: 'Admin', description: 'Administrative access and system management' }
] as const

export const STAFF_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' }
] as const

export const TASK_TYPES = [
  { value: 'cleaning', label: 'Cleaning', icon: '🧹', color: 'blue' },
  { value: 'maintenance', label: 'Maintenance', icon: '🔧', color: 'orange' },
  { value: 'checkin_prep', label: 'Check-in Prep', icon: '🏠', color: 'green' },
  { value: 'checkout_process', label: 'Check-out Process', icon: '🚪', color: 'purple' },
  { value: 'inspection', label: 'Inspection', icon: '🔍', color: 'yellow' },
  { value: 'custom', label: 'Custom Task', icon: '📋', color: 'gray' }
] as const

export const TASK_PRIORITIES = [
  { value: 'low', label: 'Low', color: 'green' },
  { value: 'medium', label: 'Medium', color: 'blue' },
  { value: 'high', label: 'High', color: 'orange' },
  { value: 'urgent', label: 'Urgent', color: 'red' }
] as const

export const TASK_STATUSES = [
  { value: 'assigned', label: 'Assigned', color: 'gray' },
  { value: 'confirmed', label: 'Confirmed', color: 'blue' },
  { value: 'in_progress', label: 'In Progress', color: 'yellow' },
  { value: 'completed', label: 'Completed', color: 'green' },
  { value: 'cancelled', label: 'Cancelled', color: 'red' }
] as const

// Property assignment rules (can be moved to database later)
export const PROPERTY_STAFF_ASSIGNMENTS = {
  // Beach properties
  'Sunset Villa': ['staff_cleaner_001', 'staff_maintenance_001'],
  'Ocean View Resort': ['staff_cleaner_002', 'staff_maintenance_001'],
  'Beachfront Paradise': ['staff_cleaner_001', 'staff_cleaner_003'],
  
  // Mountain properties
  'Mountain Retreat': ['staff_cleaner_003', 'staff_maintenance_002'],
  'Highland Villa': ['staff_cleaner_002', 'staff_maintenance_002'],
  
  // City properties
  'Downtown Loft': ['staff_cleaner_004', 'staff_maintenance_003'],
  'Urban Oasis': ['staff_cleaner_004', 'staff_maintenance_003'],
  
  // Default assignments by region
  'default_beach': ['staff_cleaner_001', 'staff_cleaner_002'],
  'default_mountain': ['staff_cleaner_003'],
  'default_city': ['staff_cleaner_004'],
  'default_maintenance': ['staff_maintenance_001', 'staff_maintenance_002', 'staff_maintenance_003']
} as const

// Task templates for different booking types
export const TASK_TEMPLATES = {
  standard_checkin: [
    {
      type: 'cleaning' as const,
      title: 'Pre-arrival Deep Clean',
      description: 'Complete deep cleaning of all rooms, bathrooms, and common areas',
      priority: 'high' as const,
      estimatedDuration: 180, // 3 hours
      requiredSupplies: ['cleaning_supplies', 'fresh_linens', 'towels']
    },
    {
      type: 'checkin_prep' as const,
      title: 'Check-in Preparation',
      description: 'Prepare welcome amenities, check utilities, and final inspection',
      priority: 'high' as const,
      estimatedDuration: 60, // 1 hour
      requiredSupplies: ['welcome_basket', 'keys', 'wifi_info']
    }
  ],
  maintenance_required: [
    {
      type: 'maintenance' as const,
      title: 'Property Maintenance Check',
      description: 'Inspect and fix any maintenance issues before guest arrival',
      priority: 'high' as const,
      estimatedDuration: 120, // 2 hours
      requiredSupplies: ['tools', 'spare_parts']
    }
  ],
  luxury_booking: [
    {
      type: 'cleaning' as const,
      title: 'Luxury Service Cleaning',
      description: 'Premium cleaning service with attention to luxury details',
      priority: 'urgent' as const,
      estimatedDuration: 240, // 4 hours
      requiredSupplies: ['premium_cleaning_supplies', 'luxury_linens', 'premium_amenities']
    },
    {
      type: 'checkin_prep' as const,
      title: 'VIP Welcome Setup',
      description: 'Prepare VIP welcome amenities and personalized touches',
      priority: 'urgent' as const,
      estimatedDuration: 90, // 1.5 hours
      requiredSupplies: ['vip_welcome_basket', 'flowers', 'champagne']
    }
  ]
} as const
