/**
 * Staff Management Types
 * Comprehensive type definitions for staff operations and task management
 */

export interface StaffProfile {
  id: string
  userId?: string // Firebase Auth user ID if linked
  name: string
  email: string
  phone?: string
  address?: string
  role: 'cleaner' | 'maintenance' | 'admin' | 'supervisor' | 'housekeeper' | 'concierge' | 'security' | 'gardener' | 'chef' | 'driver' | 'manager'
  status: 'active' | 'inactive' | 'on-leave' | 'suspended' | 'terminated' | 'pending'
  created_at: string
  updated_at: string

  // Assignment data
  assignedProperties?: string[]
  assignedRegions?: string[]
  skills?: string[]
  workingHours?: {
    start: string
    end: string
    days: string[]
  }

  // Personal details
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
  personalDetails?: {
    dateOfBirth?: string
    nationalId?: string
    profileImage?: string
  }
  employment?: {
    startDate: string
    endDate?: string
    employmentType: 'full-time' | 'part-time' | 'contract' | 'temporary'
    hourlyRate?: number
    salary?: number
  }

  // Performance tracking
  completedTasks?: number
  totalAssignedTasks?: number
  averageRating?: number
  completionRate?: number
  lastActive?: string
  createdBy?: string
  lastModifiedBy?: string
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

export interface StaffFilters {
  search?: string
  role?: string
  status?: string
  department?: string
  sortBy?: 'name' | 'role' | 'status' | 'created_at'
  sortOrder?: 'asc' | 'desc'
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

export interface StaffStats {
  total: number
  active: number
  inactive: number
  onLeave: number
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
  averageRating: number
  performanceMetrics: {
    topPerformers: StaffProfile[]
    lowPerformers: StaffProfile[]
    recentHires: StaffProfile[]
    staffUtilization: number
    averageTasksPerStaff: number
  }
}

export interface StaffFormErrors {
  name?: string
  email?: string
  role?: string
  phone?: string
  status?: string
  assignedProperties?: string
  assignedRegions?: string
  general?: string
}

export interface CreateStaffData {
  name: string
  email: string
  phone?: string
  address?: string
  role: 'cleaner' | 'maintenance' | 'admin' | 'supervisor' | 'housekeeper' | 'concierge' | 'security' | 'gardener' | 'chef' | 'driver' | 'manager'
  status?: 'active' | 'inactive' | 'on-leave' | 'suspended' | 'terminated' | 'pending'
  assignedProperties?: string[]
  assignedRegions?: string[]
  skills?: string[]
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
  employment?: {
    employmentType: 'full-time' | 'part-time' | 'contract' | 'temporary'
    hourlyRate?: number
    salary?: number
    startDate: string
  }
  personalDetails?: {
    dateOfBirth?: string
    nationalId?: string
  }
}

export interface UpdateStaffData {
  name?: string
  email?: string
  phone?: string
  address?: string
  role?: 'cleaner' | 'maintenance' | 'admin' | 'supervisor' | 'housekeeper' | 'concierge' | 'security' | 'gardener' | 'chef' | 'driver' | 'manager'
  status?: 'active' | 'inactive' | 'on-leave' | 'suspended' | 'terminated' | 'pending'
  assignedProperties?: string[]
  assignedRegions?: string[]
  skills?: string[]
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
  employment?: {
    employmentType: 'full-time' | 'part-time' | 'contract' | 'temporary'
    hourlyRate?: number
    salary?: number
    startDate: string
  }
  personalDetails?: {
    dateOfBirth?: string
    nationalId?: string
  }
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
  { value: 'housekeeper', label: 'Housekeeper', description: 'Professional housekeeping services' },
  { value: 'maintenance', label: 'Maintenance', description: 'Handles property maintenance and repairs' },
  { value: 'manager', label: 'Manager', description: 'Property and operations management' },
  { value: 'concierge', label: 'Concierge', description: 'Guest services and assistance' },
  { value: 'security', label: 'Security', description: 'Property security and safety' },
  { value: 'gardener', label: 'Gardener', description: 'Landscaping and garden maintenance' },
  { value: 'chef', label: 'Chef', description: 'Culinary services and meal preparation' },
  { value: 'driver', label: 'Driver', description: 'Transportation services' },
  { value: 'supervisor', label: 'Supervisor', description: 'Oversees staff and operations' },
  { value: 'admin', label: 'Admin', description: 'Administrative and management tasks' }
] as const

export const STAFF_STATUSES = [
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'inactive', label: 'Inactive', color: 'gray' },
  { value: 'on-leave', label: 'On Leave', color: 'yellow' },
  { value: 'suspended', label: 'Suspended', color: 'red' },
  { value: 'terminated', label: 'Terminated', color: 'red' },
  { value: 'pending', label: 'Pending', color: 'blue' }
] as const

export const EMPLOYMENT_TYPES = [
  { value: 'full-time', label: 'Full Time' },
  { value: 'part-time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'temporary', label: 'Temporary' }
] as const

export const COMMON_SKILLS = [
  'Cleaning',
  'Maintenance',
  'Plumbing',
  'Electrical',
  'Gardening',
  'Cooking',
  'Customer Service',
  'Security',
  'First Aid',
  'Languages',
  'Driving',
  'Pool Maintenance',
  'HVAC',
  'Painting',
  'Carpentry'
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
