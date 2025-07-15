/**
 * Job Assignment System Types
 * Comprehensive type definitions for the villa property management job assignment system
 */

export type JobStatus = 'pending' | 'assigned' | 'accepted' | 'declined' | 'in_progress' | 'completed' | 'cancelled'
export type JobPriority = 'low' | 'medium' | 'high' | 'urgent'
export type JobType = 'cleaning' | 'maintenance' | 'checkin_prep' | 'checkout_process' | 'inspection' | 'setup' | 'concierge' | 'security' | 'custom'

export interface JobAssignment {
  id: string
  
  // Booking Integration
  bookingId: string
  bookingReference?: string
  propertyId: string
  propertyName: string
  propertyAddress?: string
  
  // Guest Information
  guestName: string
  guestEmail?: string
  guestPhone?: string
  checkInDate: string
  checkOutDate: string
  numberOfGuests: number
  
  // Job Details
  jobType: JobType
  title: string
  description: string
  priority: JobPriority
  estimatedDuration: number // in minutes
  
  // Staff Assignment
  assignedStaffId: string
  assignedStaffName: string
  assignedStaffEmail: string
  assignedStaffPhone?: string
  assignedStaffRole: string
  
  // Scheduling
  scheduledDate: string
  scheduledStartTime?: string
  scheduledEndTime?: string
  deadline: string
  
  // Status and Progress
  status: JobStatus
  progress: number // 0-100
  
  // Assignment Workflow
  assignedAt: string
  assignedBy: string // admin user ID
  assignedByName: string
  acceptedAt?: string
  declinedAt?: string
  startedAt?: string
  completedAt?: string
  cancelledAt?: string
  
  // Staff Response
  staffResponse?: {
    accepted: boolean
    responseAt: string
    notes?: string
    estimatedArrival?: string
    alternativeTime?: string
  }
  
  // Instructions and Requirements
  specialInstructions?: string
  requiredSkills: string[]
  requiredSupplies?: string[]
  accessInstructions?: string
  
  // Completion Data
  completionNotes?: string
  completionPhotos?: string[]
  qualityRating?: number // 1-5
  issuesReported?: string[]
  
  // Automation and Smart Features
  autoAssigned: boolean
  suggestionScore?: number // AI/algorithm confidence score
  alternativeStaff?: string[] // backup staff suggestions
  
  // Metadata
  createdAt: string
  updatedAt: string
  syncVersion: number
  lastSyncedAt: string
  
  // Mobile App Sync
  mobileNotificationSent: boolean
  mobileNotificationId?: string
  lastMobileSync?: string
}

export interface JobNotification {
  id: string
  
  // Target Information
  recipientId: string // staff member ID
  recipientEmail: string
  recipientName: string
  recipientRole: string
  
  // Job Reference
  jobAssignmentId: string
  bookingId: string
  
  // Notification Details
  type: 'job_assigned' | 'job_updated' | 'job_cancelled' | 'job_reminder' | 'job_overdue'
  title: string
  message: string
  priority: JobPriority
  
  // Status Tracking
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  sentAt?: string
  deliveredAt?: string
  readAt?: string
  failedAt?: string
  failureReason?: string
  
  // Action Required
  actionRequired: boolean
  actionType?: 'accept_decline' | 'start_job' | 'complete_job' | 'report_issue'
  actionUrl?: string
  actionDeadline?: string
  
  // Platform Targeting
  webNotification: boolean
  mobileNotification: boolean
  emailNotification: boolean
  smsNotification?: boolean
  
  // Metadata
  createdAt: string
  updatedAt: string
  expiresAt?: string
}

export interface StaffAvailability {
  staffId: string
  staffName: string
  staffEmail: string
  role: string
  
  // Current Status
  currentStatus: 'available' | 'busy' | 'off_duty' | 'on_break' | 'unavailable'
  lastStatusUpdate: string
  
  // Current Workload
  activeJobs: number
  pendingJobs: number
  todayJobs: number
  weeklyHours: number
  
  // Skills and Capabilities
  skills: string[]
  certifications?: string[]
  experienceLevel: 'junior' | 'intermediate' | 'senior' | 'expert'
  
  // Scheduling
  workingHours: {
    start: string
    end: string
    days: string[] // ['monday', 'tuesday', etc.]
  }
  timeOff: Array<{
    startDate: string
    endDate: string
    reason: string
    approved: boolean
  }>
  
  // Performance Metrics
  completionRate: number // percentage
  averageRating: number // 1-5
  totalJobsCompleted: number
  averageResponseTime: number // minutes
  punctualityScore: number // percentage
  
  // Location and Assignment Preferences
  assignedProperties: string[]
  preferredJobTypes: JobType[]
  maxDailyJobs?: number
  travelTime?: number // minutes between properties
  
  // Real-time Data
  lastSeen: string
  currentLocation?: {
    latitude: number
    longitude: number
    accuracy: number
    timestamp: string
  }
  
  // Metadata
  updatedAt: string
}

export interface JobSuggestion {
  staffId: string
  staffName: string
  staffRole: string
  
  // Matching Criteria
  skillMatch: number // 0-100 percentage
  availabilityMatch: number // 0-100 percentage
  locationMatch: number // 0-100 percentage
  workloadMatch: number // 0-100 percentage
  performanceScore: number // 0-100 percentage
  
  // Overall Score
  overallScore: number // 0-100 percentage
  confidence: 'low' | 'medium' | 'high'
  
  // Reasoning
  matchReasons: string[]
  concerns: string[]
  
  // Estimated Metrics
  estimatedResponseTime: number // minutes
  estimatedTravelTime: number // minutes
  estimatedCompletionTime: number // minutes
  
  // Alternative Options
  alternativeTimeSlots?: Array<{
    startTime: string
    endTime: string
    confidence: number
  }>
}

export interface JobAssignmentFilters {
  status?: JobStatus[]
  jobType?: JobType[]
  priority?: JobPriority[]
  assignedStaff?: string[]
  property?: string[]
  dateRange?: {
    start: string
    end: string
  }
  search?: string
  sortBy?: 'deadline' | 'priority' | 'created' | 'scheduled' | 'status'
  sortOrder?: 'asc' | 'desc'
}

export interface JobAssignmentStats {
  total: number
  pending: number
  assigned: number
  accepted: number
  declined: number
  inProgress: number
  completed: number
  cancelled: number
  overdue: number
  
  // Performance Metrics
  averageResponseTime: number // minutes
  averageCompletionTime: number // minutes
  completionRate: number // percentage
  acceptanceRate: number // percentage
  
  // Staff Metrics
  totalStaff: number
  availableStaff: number
  busyStaff: number
  averageWorkload: number
  
  // Today's Summary
  todayJobs: number
  todayCompleted: number
  todayPending: number
  todayOverdue: number
}

// API Response Types
export interface JobAssignmentResponse {
  success: boolean
  data?: JobAssignment
  message?: string
  error?: string
}

export interface JobAssignmentListResponse {
  success: boolean
  data: JobAssignment[]
  stats: JobAssignmentStats
  suggestions?: JobSuggestion[]
  error?: string
}

export interface StaffAvailabilityResponse {
  success: boolean
  data: StaffAvailability[]
  error?: string
}

export interface JobSuggestionResponse {
  success: boolean
  suggestions: JobSuggestion[]
  bookingDetails?: {
    id: string
    propertyName: string
    checkInDate: string
    checkOutDate: string
    guestName: string
    requirements: string[]
  }
  error?: string
}
