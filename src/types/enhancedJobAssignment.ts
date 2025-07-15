/**
 * Enhanced Job Assignment System Types
 * Comprehensive TypeScript interfaces for professional job assignment management
 */

import { Timestamp } from 'firebase/firestore'

// ============================================================================
// CORE ENUMS
// ============================================================================

export type JobStatus = 
  | 'pending' 
  | 'assigned' 
  | 'in_progress' 
  | 'paused'
  | 'completed' 
  | 'verified'
  | 'cancelled'
  | 'overdue'

export type JobPriority = 'urgent' | 'high' | 'medium' | 'low'

export type JobCategory = 
  | 'cleaning'
  | 'maintenance'
  | 'inspection'
  | 'security'
  | 'landscaping'
  | 'pool_maintenance'
  | 'guest_services'
  | 'emergency'
  | 'inventory'
  | 'setup'

export type StaffStatus = 
  | 'available'
  | 'on_job'
  | 'offline'
  | 'break'
  | 'emergency'
  | 'traveling'

export type LocationAccuracy = 'high' | 'medium' | 'low'

// ============================================================================
// LOCATION & TRACKING TYPES
// ============================================================================

export interface GPSLocation {
  latitude: number
  longitude: number
  accuracy: LocationAccuracy
  timestamp: Date
  address?: string
  isInsideGeofence?: boolean
}

export interface StaffLocation {
  staffId: string
  staffName: string
  currentLocation: GPSLocation
  lastUpdated: Date
  status: StaffStatus
  currentJobId?: string
  batteryLevel?: number
  isOnline: boolean
}

export interface LocationHistory {
  id: string
  staffId: string
  locations: GPSLocation[]
  date: string
  totalDistance: number
  timeSpent: number
  propertiesVisited: string[]
}

export interface Geofence {
  id: string
  propertyId: string
  propertyName: string
  center: { latitude: number; longitude: number }
  radius: number // in meters
  isActive: boolean
  alertOnEntry: boolean
  alertOnExit: boolean
}

export interface GeofenceAlert {
  id: string
  staffId: string
  staffName: string
  geofenceId: string
  propertyName: string
  type: 'entry' | 'exit'
  timestamp: Date
  location: GPSLocation
  acknowledged: boolean
}

// ============================================================================
// JOB ASSIGNMENT TYPES
// ============================================================================

export interface JobAssignment {
  id: string
  title: string
  description: string
  category: JobCategory
  priority: JobPriority
  status: JobStatus
  
  // Assignment Details
  assignedStaff: string[]
  assignedStaffNames: string[]
  assignedBy: string
  assignedAt: Date
  
  // Property Information
  propertyId: string
  propertyName: string
  propertyAddress: string
  location: GPSLocation
  
  // Scheduling
  scheduledStartDate: Date
  scheduledStartTime: string
  scheduledEndDate?: Date
  scheduledEndTime?: string
  estimatedDuration: number // in minutes
  
  // Tracking
  actualStartTime?: Date
  actualEndTime?: Date
  actualDuration?: number
  timeSpent: number
  
  // Requirements
  requiredSkills: string[]
  requiredEquipment: string[]
  requiredSupplies: string[]
  specialInstructions?: string
  
  // Progress & Communication
  progressPercentage: number
  lastUpdate: Date
  updates: JobUpdate[]
  photos: JobPhoto[]
  
  // Integration
  bookingId?: string
  isRecurring: boolean
  recurringPattern?: RecurringPattern
  
  // Metadata
  createdAt: Date
  createdBy: string
  updatedAt: Date
  completedAt?: Date
  verifiedAt?: Date
  verifiedBy?: string
  
  // Cost Tracking
  estimatedCost: number
  actualCost: number
  laborCost: number
  supplyCost: number
  equipmentCost: number
}

export interface JobUpdate {
  id: string
  jobId: string
  staffId: string
  staffName: string
  timestamp: Date
  type: 'status_change' | 'progress_update' | 'message' | 'photo' | 'issue'
  message: string
  oldStatus?: JobStatus
  newStatus?: JobStatus
  progressPercentage?: number
  location?: GPSLocation
  photos?: string[]
}

export interface JobPhoto {
  id: string
  jobId: string
  staffId: string
  url: string
  thumbnail: string
  caption?: string
  timestamp: Date
  location?: GPSLocation
  type: 'before' | 'during' | 'after' | 'issue' | 'completion'
}

export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom'
  interval: number
  daysOfWeek?: number[]
  endDate?: Date
  maxOccurrences?: number
}

// ============================================================================
// STAFF MONITORING TYPES
// ============================================================================

export interface StaffMember {
  id: string
  name: string
  email: string
  phone: string
  role: string
  status: StaffStatus
  avatar?: string
  
  // Location & Tracking
  currentLocation?: GPSLocation
  lastSeen: Date
  isOnline: boolean
  
  // Job Information
  currentJobs: string[]
  completedJobsToday: number
  totalJobsAssigned: number
  
  // Performance
  rating: number
  completionRate: number
  averageJobTime: number
  
  // Skills & Availability
  skills: string[]
  availability: StaffAvailability
  workingHours: WorkingHours
  
  // Equipment & Supplies
  assignedEquipment: string[]
  currentSupplies: string[]
  
  // Communication
  lastMessage?: Date
  unreadMessages: number
  
  // Metadata
  hiredDate: Date
  isActive: boolean
}

export interface StaffAvailability {
  isAvailable: boolean
  availableUntil?: Date
  unavailableReason?: string
  maxConcurrentJobs: number
  currentJobCount: number
}

export interface WorkingHours {
  monday: DaySchedule
  tuesday: DaySchedule
  wednesday: DaySchedule
  thursday: DaySchedule
  friday: DaySchedule
  saturday: DaySchedule
  sunday: DaySchedule
}

export interface DaySchedule {
  isWorkingDay: boolean
  startTime: string
  endTime: string
  breakStart?: string
  breakEnd?: string
}

// ============================================================================
// COMMUNICATION TYPES
// ============================================================================

export interface StaffMessage {
  id: string
  fromStaffId: string
  toStaffId?: string
  jobId?: string
  message: string
  timestamp: Date
  type: 'direct' | 'job_related' | 'broadcast' | 'emergency'
  isRead: boolean
  attachments?: MessageAttachment[]
}

export interface MessageAttachment {
  id: string
  type: 'photo' | 'video' | 'document' | 'location'
  url: string
  filename: string
  size: number
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface JobAnalytics {
  totalJobs: number
  completedJobs: number
  pendingJobs: number
  overdueJobs: number
  averageCompletionTime: number
  completionRate: number
  
  // By Category
  jobsByCategory: Record<JobCategory, number>
  completionByCategory: Record<JobCategory, number>
  
  // By Priority
  jobsByPriority: Record<JobPriority, number>
  
  // By Staff
  jobsByStaff: Record<string, number>
  performanceByStaff: Record<string, StaffPerformance>
  
  // Time Analysis
  peakHours: number[]
  averageJobDuration: number
  timeEfficiency: number
  
  // Cost Analysis
  totalCost: number
  averageCostPerJob: number
  costByCategory: Record<JobCategory, number>
  
  // Property Analysis
  jobsByProperty: Record<string, number>
  propertyPerformance: Record<string, PropertyPerformance>
}

export interface StaffPerformance {
  staffId: string
  staffName: string
  totalJobs: number
  completedJobs: number
  completionRate: number
  averageJobTime: number
  rating: number
  onTimePercentage: number
  qualityScore: number
  efficiency: number
}

export interface PropertyPerformance {
  propertyId: string
  propertyName: string
  totalJobs: number
  completedJobs: number
  averageJobTime: number
  totalCost: number
  maintenanceFrequency: number
  issueCount: number
}

// ============================================================================
// FILTER & SEARCH TYPES
// ============================================================================

export interface JobFilters {
  status?: JobStatus[]
  category?: JobCategory[]
  priority?: JobPriority[]
  assignedStaff?: string[]
  properties?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  searchQuery?: string
  sortBy?: 'createdAt' | 'scheduledStartDate' | 'priority' | 'status' | 'property'
  sortOrder?: 'asc' | 'desc'
}

export interface StaffFilters {
  status?: StaffStatus[]
  skills?: string[]
  availability?: boolean
  location?: {
    center: GPSLocation
    radius: number
  }
  searchQuery?: string
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface JobAssignmentResponse {
  success: boolean
  data?: JobAssignment[]
  stats?: JobAnalytics
  error?: string
}

export interface StaffLocationResponse {
  success: boolean
  data?: StaffLocation[]
  error?: string
}

export interface CreateJobRequest {
  title: string
  description: string
  category: JobCategory
  priority: JobPriority
  propertyId: string
  assignedStaff: string[]
  scheduledStartDate: Date
  scheduledStartTime: string
  estimatedDuration: number
  requiredSkills?: string[]
  requiredEquipment?: string[]
  requiredSupplies?: string[]
  specialInstructions?: string
  bookingId?: string
}

export interface UpdateJobRequest {
  status?: JobStatus
  assignedStaff?: string[]
  scheduledStartDate?: Date
  scheduledStartTime?: string
  progressPercentage?: number
  actualCost?: number
  notes?: string
}
