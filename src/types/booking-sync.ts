/**
 * Booking Sync Types for Cross-Platform Integration
 * 
 * These types define the data structures for syncing booking approvals
 * and staff assignments between web and mobile platforms via Firebase.
 */

import { Timestamp } from 'firebase/firestore'

// Base booking status types
export type BookingStatus = 
  | 'pending_approval' 
  | 'approved' 
  | 'rejected' 
  | 'completed' 
  | 'cancelled'
  | 'in_progress'

// Task assignment status types
export type TaskStatus = 
  | 'assigned' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled'
  | 'overdue'

// Staff role types for assignments
export type StaffRole = 
  | 'housekeeper' 
  | 'maintenance' 
  | 'manager' 
  | 'concierge'
  | 'security'
  | 'chef'

// Priority levels for tasks
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

/**
 * Enhanced Booking interface for cross-platform sync
 */
export interface SyncBooking {
  id: string
  
  // Guest Information
  guestName: string
  guestEmail: string
  guestPhone?: string
  guestCount: number
  
  // Property Information
  propertyId?: string
  propertyName: string
  villaName: string // For compatibility
  address?: string
  
  // Booking Details
  checkInDate: string
  checkOutDate: string
  nights: number
  price: number
  currency: string
  
  // Status and Approval
  status: BookingStatus
  approvedAt?: Timestamp | null
  approvedBy?: string // Admin user ID who approved
  rejectedAt?: Timestamp | null
  rejectedBy?: string // Admin user ID who rejected
  rejectionReason?: string
  
  // Source and Metadata
  source: string // 'make_com_automation', 'direct', 'platform', etc.
  bookingReference?: string
  specialRequests?: string
  notes?: string
  
  // Timestamps
  createdAt: Timestamp
  updatedAt: Timestamp
  
  // Assignment Information
  assignedStaff?: string[] // Array of staff IDs
  assignedTasks?: string[] // Array of task IDs
  
  // Financial Information
  paymentStatus?: string
  paymentMethod?: string
  totalAmount: number
  
  // Sync metadata
  lastSyncedAt?: Timestamp
  syncVersion?: number
  duplicateCheckHash?: string
}

/**
 * Task Assignment interface for staff management
 */
export interface TaskAssignment {
  id: string
  
  // Assignment Details
  bookingId: string
  staffId: string
  assignedBy: string // Admin user ID who assigned
  
  // Task Information
  title: string
  description?: string
  taskType: 'cleaning' | 'maintenance' | 'check_in' | 'check_out' | 'inspection' | 'custom'
  priority: TaskPriority
  
  // Status and Progress
  status: TaskStatus
  progress?: number // 0-100 percentage
  
  // Scheduling
  scheduledDate?: string
  estimatedDuration?: number // in minutes
  actualStartTime?: Timestamp
  actualEndTime?: Timestamp
  
  // Location and Property
  propertyId?: string
  propertyName: string
  location?: string // Specific area within property
  
  // Notes and Communication
  notes?: string
  staffNotes?: string
  completionNotes?: string
  
  // Timestamps
  createdAt: Timestamp
  updatedAt: Timestamp
  completedAt?: Timestamp
  
  // Sync metadata
  lastSyncedAt?: Timestamp
  syncVersion?: number
}

/**
 * Staff Profile interface for assignments
 */
export interface StaffProfile {
  id: string
  name: string
  email: string
  phone?: string
  role: StaffRole
  status: 'active' | 'inactive' | 'on_leave'
  
  // Assignment capabilities
  assignedProperties: string[]
  skills: string[]
  maxConcurrentTasks?: number
  
  // Performance metrics
  completedTasks: number
  averageRating: number
  completionRate: number
  
  // Availability
  workingHours?: {
    start: string
    end: string
    days: string[]
  }
  
  // Contact and emergency
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
  
  // Timestamps
  createdAt: Timestamp
  updatedAt: Timestamp
}

/**
 * Booking Approval Action interface
 */
export interface BookingApprovalAction {
  bookingId: string
  action: 'approve' | 'reject'
  adminId: string
  adminName: string
  timestamp: Timestamp
  notes?: string
  reason?: string
  
  // Additional approval details
  approvalLevel?: 'standard' | 'manager' | 'admin'
  requiresFollowUp?: boolean
  followUpDate?: string
  
  // Notification settings
  notifyGuest?: boolean
  notifyStaff?: boolean
  customMessage?: string
}

/**
 * Staff Assignment Action interface
 */
export interface StaffAssignmentAction {
  bookingId: string
  staffIds: string[]
  assignedBy: string
  assignedByName: string
  timestamp: Timestamp
  
  // Assignment details
  tasks: {
    taskType: TaskAssignment['taskType']
    title: string
    description?: string
    priority: TaskPriority
    scheduledDate?: string
    estimatedDuration?: number
  }[]
  
  // Instructions and notes
  generalInstructions?: string
  specialRequirements?: string
  deadline?: string
  
  // Notification settings
  notifyStaff?: boolean
  urgentNotification?: boolean
}

/**
 * Real-time sync event interface
 */
export interface SyncEvent {
  id: string
  type: 'booking_approved' | 'booking_rejected' | 'staff_assigned' | 'task_completed' | 'booking_updated' | 'staff_created' | 'staff_created_enhanced' | 'staff_updated' | 'staff_deleted'
  entityId: string // booking ID, task ID, or staff ID
  entityType: 'booking' | 'task' | 'assignment' | 'staff'
  
  // Event details
  triggeredBy: string
  triggeredByName: string
  timestamp: Timestamp
  
  // Change details
  changes: Record<string, any>
  previousValues?: Record<string, any>
  
  // Platform information
  platform: 'web' | 'mobile'
  deviceInfo?: string
  
  // Sync status
  synced: boolean
  syncedAt?: Timestamp
  syncErrors?: string[]
}

/**
 * Notification interface for cross-platform alerts
 */
export interface CrossPlatformNotification {
  id: string
  
  // Recipient information
  recipientId: string
  recipientType: 'admin' | 'staff' | 'guest'
  
  // Notification content
  title: string
  message: string
  type: 'booking_approval' | 'task_assignment' | 'status_update' | 'reminder' | 'alert'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  
  // Related entities
  bookingId?: string
  taskId?: string
  propertyId?: string
  
  // Delivery settings
  channels: ('push' | 'email' | 'sms' | 'in_app')[]
  deliveryStatus: Record<string, 'pending' | 'sent' | 'delivered' | 'failed'>
  
  // Timestamps
  createdAt: Timestamp
  scheduledFor?: Timestamp
  expiresAt?: Timestamp
  
  // Interaction tracking
  read: boolean
  readAt?: Timestamp
  actionTaken?: boolean
  actionTakenAt?: Timestamp
}

/**
 * API Response types for booking operations
 */
export interface BookingApprovalResponse {
  success: boolean
  bookingId: string
  newStatus: BookingStatus
  approvedBy: string
  approvedAt: Timestamp
  message: string
  syncedToMobile?: boolean
  notificationsSent?: string[]
}

export interface StaffAssignmentResponse {
  success: boolean
  bookingId: string
  assignedStaff: StaffProfile[]
  createdTasks: TaskAssignment[]
  assignedBy: string
  assignedAt: Timestamp
  message: string
  syncedToMobile?: boolean
  notificationsSent?: string[]
}

/**
 * Filter and query interfaces
 */
export interface BookingSyncFilters {
  status?: BookingStatus[]
  dateRange?: {
    start: string
    end: string
  }
  propertyIds?: string[]
  assignedStaff?: string[]
  source?: string[]
  syncStatus?: 'synced' | 'pending' | 'failed'
}

export interface TaskAssignmentFilters {
  status?: TaskStatus[]
  staffIds?: string[]
  taskTypes?: TaskAssignment['taskType'][]
  priority?: TaskPriority[]
  dateRange?: {
    start: string
    end: string
  }
  propertyIds?: string[]
}
