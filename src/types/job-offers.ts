/**
 * Job Offers - Phase 5 Auto-Dispatch
 * Production-safe role-based auto-dispatch with first-accept-wins atomic transactions
 */

export interface JobOffer {
  offerId: string
  jobId: string
  propertyId: string
  requiredRole: 'cleaner' | 'inspector' | 'maintenance'
  eligibleStaffIds: string[] // Snapshot at offer creation - never dynamically recalc
  status: 'open' | 'accepted' | 'expired' | 'cancelled'
  acceptedByStaffId?: string
  offeredAt: Date
  expiresAt: Date
  acceptanceAt?: Date
  attemptNumber: number // 1, 2, 3... for escalation ladder
  createdBy: 'system' | 'admin'
  cancelReason?: string
  meta?: {
    payout?: number
    estimatedDuration: number
    notes?: string
    priority: 'low' | 'medium' | 'high' | 'critical'
  }
}

export interface OfferCreationRequest {
  jobId: string
  propertyId: string
  requiredRole: 'cleaner' | 'inspector' | 'maintenance'
  scheduledStart: Date
  scheduledEnd: Date
  estimatedDuration: number
  priority: 'low' | 'medium' | 'high' | 'critical'
  attemptNumber?: number
  createdBy?: 'system' | 'admin'
  meta?: {
    payout?: number
    notes?: string
  }
}

export interface OfferAcceptance {
  offerId: string
  staffId: string
  timestamp: Date
}

export interface OfferEligibilityRules {
  role: 'cleaner' | 'inspector' | 'maintenance'
  isActive: boolean
  isSuspended: boolean
  hasValidPushToken: boolean
  availabilityStatus?: 'available' | 'busy' | 'off'
  conflictCheck?: boolean
}

export interface DispatchSettings {
  DISPATCH_WINDOW_DAYS: number // default: 14
  OFFER_EXPIRY_MINUTES: number // default: 15
  MAX_ATTEMPTS: number // default: 3
  ESCALATION_MODE: 'broaden_pool' | 'notify_manager' | 'admin_alert'
  AUTO_DISPATCH_ENABLED: boolean
  MINIMUM_NOTICE_HOURS: number // default: 2
}

export interface AuditEvent {
  eventId: string
  type: 'offer_created' | 'offer_notified' | 'offer_accepted' | 'offer_expired' | 'offer_cancelled' | 'job_assigned' | 'job_unassigned' | 'manual_override' | 'escalation_triggered'
  timestamp: Date
  actor: 'system' | string // system or staffId/adminId
  jobId?: string
  offerId?: string
  propertyId?: string
  details: Record<string, any>
}

export interface OfferNotification {
  notificationId: string
  staffId: string
  offerId: string
  jobId: string
  propertyId: string
  title: string
  body: string
  deepLink: string // app://offers/{offerId}
  sentAt: Date
  deliveryStatus: 'pending' | 'sent' | 'failed'
  readAt?: Date
}

// Escalation ladder configuration
export const ESCALATION_LADDER = {
  ATTEMPT_1: {
    description: 'Primary eligible staff for role',
    eligibility: 'role_match_primary',
    expiryMinutes: 15
  },
  ATTEMPT_2: {
    description: 'All staff with required role',
    eligibility: 'role_match_all',
    expiryMinutes: 30
  },
  ATTEMPT_3: {
    description: 'All staff + manager notification',
    eligibility: 'role_match_all_plus_manager',
    expiryMinutes: 60,
    escalate: true
  }
} as const

// Offer status transitions
export const OFFER_STATUS_TRANSITIONS: Record<JobOffer['status'], JobOffer['status'][]> = {
  open: ['accepted', 'expired', 'cancelled'],
  accepted: [], // Terminal state
  expired: [], // Terminal state  
  cancelled: [] // Terminal state
}

// Default dispatch settings
export const DEFAULT_DISPATCH_SETTINGS: DispatchSettings = {
  DISPATCH_WINDOW_DAYS: 14,
  OFFER_EXPIRY_MINUTES: 15,
  MAX_ATTEMPTS: 3,
  ESCALATION_MODE: 'broaden_pool',
  AUTO_DISPATCH_ENABLED: true,
  MINIMUM_NOTICE_HOURS: 2
} as const

/**
 * Validation helpers
 */
export function isValidOfferTransition(from: JobOffer['status'], to: JobOffer['status']): boolean {
  return OFFER_STATUS_TRANSITIONS[from]?.includes(to) || false
}

export function calculateOfferExpiry(
  startTime: Date, 
  expiryMinutes: number = DEFAULT_DISPATCH_SETTINGS.OFFER_EXPIRY_MINUTES
): Date {
  const expiry = new Date(Date.now() + (expiryMinutes * 60 * 1000))
  // Don't expire after job start time
  return expiry < startTime ? startTime : expiry
}

export function isOfferExpired(offer: JobOffer): boolean {
  return offer.status === 'open' && new Date() > offer.expiresAt
}
