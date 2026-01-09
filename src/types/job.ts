/**
 * Job Entity - Phase 4
 * First-class operational job model for booking → job automation
 * 
 * This is the authoritative record for all operational work.
 * Jobs are NOT messages or tasks - they are operational commands.
 */

export interface Job {
  jobId: string
  bookingId: string
  propertyId: string
  jobType: 'cleaning' | 'inspection' | 'maintenance'
  requiredRole: 'cleaner' | 'inspector' | 'maintenance'
  scheduledStart: Date
  scheduledEnd: Date
  status: 'pending' | 'offered' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  assignedStaffId?: string | null
  createdBy: 'system' | string
  
  // Auto-dispatch integration
  offerIdActive?: string | null // Current active offer for this job
  
  // Job metadata
  priority: 'low' | 'medium' | 'high' | 'critical'
  estimatedDuration: number // minutes
  
  // Booking context
  guestName: string
  propertyName: string
  checkInDate: Date
  checkOutDate: Date
  
  // Job specifics
  requirements: string[]
  specialInstructions?: string
  
  // Tracking
  createdAt: Date
  updatedAt: Date
  assignedAt?: Date
  startedAt?: Date
  completedAt?: Date
  cancelledAt?: Date
  
  // Results (when completed)
  completionNotes?: string
  rating?: number
  issues?: Array<{
    description: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    resolved: boolean
  }>
  photosUploaded?: string[]
}

export interface JobCreationRequest {
  bookingId: string
  propertyId: string
  guestName: string
  propertyName: string
  checkInDate: Date
  checkOutDate: Date
  requirements?: string[]
  specialInstructions?: string
}

export interface JobStatusUpdate {
  jobId: string
  status: Job['status']
  assignedStaffId?: string | null
  completionData?: {
    notes?: string
    rating?: number
    issues?: Job['issues']
    photosUploaded?: string[]
  }
  updatedBy: string
}

export interface JobQuery {
  bookingId?: string
  propertyId?: string
  jobType?: Job['jobType']
  requiredRole?: Job['requiredRole']
  status?: Job['status']
  assignedStaffId?: string
  dateRange?: {
    start: Date
    end: Date
  }
}

export interface JobValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Job timing configuration
 * These determine when jobs are automatically scheduled
 */
export const JOB_TIMING_CONFIG = {
  // Cleaning job starts this many minutes after checkout
  CLEANING_DELAY_AFTER_CHECKOUT: 30,
  
  // Standard job durations in minutes
  DURATION: {
    cleaning: 120,    // 2 hours
    inspection: 45,   // 45 minutes
    maintenance: 180  // 3 hours (varies by issue)
  },
  
  // Buffer between jobs
  BUFFER_BETWEEN_JOBS: 15, // 15 minutes
  
  // Default checkout time (11:00 AM)
  DEFAULT_CHECKOUT_TIME: '11:00'
} as const

/**
 * Role mapping for job types
 * Enforces which roles can work on which job types
 */
export const JOB_ROLE_MAPPING = {
  cleaning: ['cleaner'],
  inspection: ['inspector', 'supervisor'],
  maintenance: ['maintenance', 'technician', 'supervisor']
} as const

/**
 * Job workflow sequences
 * Defines the order and dependencies of operational jobs
 */
export const JOB_WORKFLOW = {
  STANDARD_SEQUENCE: [
    { type: 'cleaning', requiredRole: 'cleaner', dependencies: [] },
    { type: 'inspection', requiredRole: 'inspector', dependencies: ['cleaning'] }
  ]
} as const
