// Property Management Type Definitions
// Comprehensive TypeScript interfaces for property management system

export interface Property {
  id: string
  name: string
  description: string
  type: PropertyType
  status: PropertyStatus
  ownerId: string
  ownerName: string
  ownerEmail: string
  
  // PMS Integration (External Property Matching)
  pmsIntegration?: {
    provider: PMSProvider           // Which PMS system
    pmsListingId?: string           // PRIMARY matching key from PMS
    airbnbListingId?: string        // Airbnb-specific listing ID
    bookingComListingId?: string    // Booking.com listing ID
    vrboListingId?: string          // VRBO/HomeAway listing ID
    externalIds?: Record<string, string>  // Future channels: { "expedia": "EXP123", ... }
    lastSyncedAt?: string
    syncEnabled: boolean
    syncErrors?: PMSSyncError[]
  }
  
  // Location Information
  location: PropertyLocation
  
  // Property Details
  details: PropertyDetails
  
  // Amenities and Features
  amenities: PropertyAmenity[]
  features: PropertyFeature[]
  
  // Pricing Information
  pricing: PropertyPricing
  
  // Media and Images
  images: PropertyImage[]
  virtualTour?: string
  
  // Availability and Booking
  availability: PropertyAvailability
  bookingSettings: BookingSettings
  
  // Performance Metrics
  performance: PropertyPerformance
  
  // Maintenance and Status
  maintenance: MaintenanceInfo
  
  // Timestamps
  createdAt: string
  updatedAt: string
  lastBooking?: string
  
  // Admin Fields
  adminNotes?: string
  verificationStatus: VerificationStatus
  complianceStatus: ComplianceStatus
}

export type PropertyType = 
  | 'villa'
  | 'apartment'
  | 'house'
  | 'condo'
  | 'townhouse'
  | 'penthouse'
  | 'studio'
  | 'loft'
  | 'cabin'
  | 'cottage'
  | 'mansion'
  | 'other'

export type PropertyStatus = 
  | 'active'
  | 'inactive'
  | 'pending'
  | 'maintenance'
  | 'blocked'
  | 'suspended'
  | 'archived'

export type VerificationStatus = 
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'requires_update'

export type ComplianceStatus = 
  | 'compliant'
  | 'non_compliant'
  | 'pending_review'
  | 'requires_action'

// PMS Provider Types (Flexible for future expansion)
export type PMSProvider = 
  | 'hostaway'
  | 'guesty' 
  | 'smoobu'
  | 'lodgify'
  | 'cloudbeds'
  | 'hostfully'
  | 'streamline'
  | 'manual'      // Manual property management (no PMS)
  | 'other'

// PMS Sync Error Tracking
export interface PMSSyncError {
  timestamp: string
  error: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  resolved: boolean
  resolvedAt?: string
  resolvedBy?: string
}

export interface PropertyLocation {
  address: string
  city: string
  state: string
  country: string
  zipCode: string
  coordinates?: {
    latitude: number
    longitude: number
  }
  neighborhood?: string
  landmarks?: string[]
  distanceToBeach?: number
  distanceToAirport?: number
  distanceToCenter?: number
  
  // Navigation & Access (for mobile job dispatch)
  googleMapsLink?: string         // Direct Google Maps link
  accessInstructions?: string     // How to get there / find the property
  parkingInstructions?: string    // Where to park
  entryCode?: string              // Door/gate access code
  wifiPassword?: string           // WiFi for staff
  emergencyContact?: {            // On-site contact
    name: string
    phone: string
    relationship: string
  }
}

export interface PropertyDetails {
  bedrooms: number
  bathrooms: number
  maxGuests: number
  area: number // square feet
  floors?: number
  yearBuilt?: number
  propertyTax?: number
  hoaFees?: number
  insuranceCost?: number
  cleaningFee: number
  securityDeposit: number
  petPolicy: PetPolicy
  smokingPolicy: SmokingPolicy
  partyPolicy: PartyPolicy
  checkInTime: string
  checkOutTime: string
  minimumStay: number
  maximumStay?: number
}

export type PetPolicy = 'allowed' | 'not_allowed' | 'cats_only' | 'dogs_only' | 'small_pets_only'
export type SmokingPolicy = 'allowed' | 'not_allowed' | 'outdoor_only'
export type PartyPolicy = 'allowed' | 'not_allowed' | 'quiet_gatherings_only'

export interface PropertyAmenity {
  id: string
  name: string
  category: AmenityCategory
  description?: string
  available: boolean
  additionalCost?: number
}

export type AmenityCategory = 
  | 'kitchen'
  | 'bathroom'
  | 'bedroom'
  | 'entertainment'
  | 'outdoor'
  | 'safety'
  | 'accessibility'
  | 'services'
  | 'transportation'
  | 'other'

export interface PropertyFeature {
  id: string
  name: string
  type: FeatureType
  description?: string
  verified: boolean
}

export type FeatureType = 
  | 'luxury'
  | 'eco_friendly'
  | 'family_friendly'
  | 'business_ready'
  | 'romantic'
  | 'adventure'
  | 'cultural'
  | 'wellness'

export interface PropertyPricing {
  baseRate: number
  currency: string
  rateType: 'per_night' | 'per_week' | 'per_month'
  seasonalRates: SeasonalRate[]
  weekendPremium?: number
  holidayPremium?: number
  lastMinuteDiscount?: number
  earlyBirdDiscount?: number
  weeklyDiscount?: number
  monthlyDiscount?: number
  minimumRate?: number
  maximumRate?: number
  dynamicPricing: boolean
  priceHistory: PriceHistoryEntry[]
}

export interface SeasonalRate {
  id: string
  name: string
  startDate: string
  endDate: string
  rate: number
  minimumStay?: number
  active: boolean
}

export interface PriceHistoryEntry {
  date: string
  rate: number
  reason: string
  changedBy: string
}

export interface PropertyImage {
  id: string
  url: string
  thumbnailUrl?: string
  caption?: string
  order: number
  room?: string
  isMain: boolean
  uploadedAt: string
  size?: number
  dimensions?: {
    width: number
    height: number
  }
}

export interface PropertyAvailability {
  calendar: AvailabilityCalendar[]
  blockedDates: BlockedDate[]
  recurringBlocks: RecurringBlock[]
  instantBooking: boolean
  advanceBookingDays: number
  lastMinuteBookingHours: number
}

export interface AvailabilityCalendar {
  date: string
  available: boolean
  rate?: number
  minimumStay?: number
  notes?: string
}

export interface BlockedDate {
  id: string
  startDate: string
  endDate: string
  reason: BlockReason
  notes?: string
  createdBy: string
  createdAt: string
}

export type BlockReason = 
  | 'maintenance'
  | 'owner_use'
  | 'renovation'
  | 'seasonal_closure'
  | 'other'

export interface RecurringBlock {
  id: string
  name: string
  dayOfWeek?: number[]
  monthOfYear?: number[]
  startDate: string
  endDate?: string
  reason: BlockReason
  active: boolean
}

export interface BookingSettings {
  instantBooking: boolean
  requireApproval: boolean
  allowSameDayBooking: boolean
  cancellationPolicy: CancellationPolicy
  houseRules: string[]
  checkInInstructions: string
  wifiPassword?: string
  emergencyContact: EmergencyContact
}

export type CancellationPolicy = 
  | 'flexible'
  | 'moderate'
  | 'strict'
  | 'super_strict'
  | 'long_term'

export interface EmergencyContact {
  name: string
  phone: string
  email?: string
  relationship: string
}

export interface PropertyPerformance {
  totalRevenue: number
  monthlyRevenue: number
  yearlyRevenue: number
  averageDailyRate: number
  revPAR: number
  occupancyRate: number
  totalBookings: number
  averageStayLength: number
  guestRating: number
  responseRate: number
  responseTime: number // in hours
  superHostStatus: boolean
  bookingConversionRate: number
  repeatGuestRate: number
  revenueGrowth: {
    monthly: number
    quarterly: number
    yearly: number
  }
  seasonalPerformance: SeasonalPerformance[]
  competitivePosition: CompetitivePosition
}

export interface SeasonalPerformance {
  season: 'spring' | 'summer' | 'fall' | 'winter'
  occupancyRate: number
  averageRate: number
  revenue: number
  bookings: number
}

export interface CompetitivePosition {
  marketRank: number
  totalCompetitors: number
  pricePosition: 'below_market' | 'at_market' | 'above_market'
  ratingPosition: 'below_average' | 'average' | 'above_average'
  occupancyPosition: 'below_average' | 'average' | 'above_average'
}

export interface MaintenanceInfo {
  status: MaintenanceStatus
  lastInspection?: string
  nextInspection?: string
  activeIssues: MaintenanceIssue[]
  maintenanceHistory: MaintenanceRecord[]
  preferredVendors: Vendor[]
  maintenanceBudget: number
  yearlyMaintenanceCost: number
}

export type MaintenanceStatus = 
  | 'excellent'
  | 'good'
  | 'fair'
  | 'needs_attention'
  | 'critical'

export interface MaintenanceIssue {
  id: string
  title: string
  description: string
  category: MaintenanceCategory
  priority: Priority
  status: IssueStatus
  reportedBy: string
  reportedAt: string
  assignedTo?: string
  estimatedCost?: number
  actualCost?: number
  scheduledDate?: string
  completedDate?: string
  photos?: string[]
  notes?: string[]
}

export type MaintenanceCategory = 
  | 'plumbing'
  | 'electrical'
  | 'hvac'
  | 'appliances'
  | 'cleaning'
  | 'landscaping'
  | 'security'
  | 'structural'
  | 'cosmetic'
  | 'other'

export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type IssueStatus = 'open' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold'

export interface MaintenanceRecord {
  id: string
  date: string
  category: MaintenanceCategory
  description: string
  vendor?: string
  cost: number
  warranty?: string
  photos?: string[]
  rating?: number
  notes?: string
}

export interface Vendor {
  id: string
  name: string
  category: MaintenanceCategory[]
  contact: {
    phone: string
    email: string
    address?: string
  }
  rating: number
  verified: boolean
  preferredStatus: boolean
  averageCost: number
  responseTime: number
  lastUsed?: string
}

// Property Management Dashboard Types
export interface PropertyDashboard {
  overview: PropertyOverview
  performance: PropertyPerformanceMetrics
  maintenance: MaintenanceSummary
  revenue: PropertyRevenueSummary
  occupancy: OccupancySummary
  alerts: PropertyAlert[]
  recentActivity: PropertyActivity[]
}

export interface PropertyOverview {
  totalProperties: number
  activeProperties: number
  inactiveProperties: number
  maintenanceProperties: number
  averageOccupancy: number
  totalRevenue: number
  averageRating: number
  totalBookings: number
}

export interface PropertyPerformanceMetrics {
  topPerformers: Property[]
  underPerformers: Property[]
  averageADR: number
  averageRevPAR: number
  occupancyTrend: number
  revenueTrend: number
}

export interface MaintenanceSummary {
  activeIssues: number
  urgentIssues: number
  scheduledMaintenance: number
  maintenanceCosts: number
  averageResolutionTime: number
}

export interface PropertyRevenueSummary {
  totalRevenue: number
  monthlyRevenue: number
  revenueGrowth: number
  topRevenueProperties: Property[]
  revenueByType: Record<PropertyType, number>
}

export interface OccupancySummary {
  averageOccupancy: number
  occupancyTrend: number
  highestOccupancy: Property[]
  lowestOccupancy: Property[]
  seasonalOccupancy: Record<string, number>
}

export interface PropertyAlert {
  id: string
  propertyId: string
  propertyName: string
  type: AlertType
  severity: AlertSeverity
  message: string
  createdAt: string
  acknowledged: boolean
  actionRequired: boolean
}

export type AlertType = 
  | 'maintenance'
  | 'booking'
  | 'revenue'
  | 'compliance'
  | 'guest_issue'
  | 'system'

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical'

export interface PropertyActivity {
  id: string
  propertyId: string
  propertyName: string
  type: ActivityType
  description: string
  user: string
  timestamp: string
  metadata?: Record<string, any>
}

export type ActivityType = 
  | 'property_created'
  | 'property_updated'
  | 'status_changed'
  | 'booking_received'
  | 'maintenance_scheduled'
  | 'price_updated'
  | 'review_received'

// Property Filters and Search
export interface PropertyFilters {
  search?: string
  type?: PropertyType[]
  status?: PropertyStatus[]
  location?: {
    city?: string
    state?: string
    country?: string
  }
  priceRange?: {
    min?: number
    max?: number
  }
  occupancyRange?: {
    min?: number
    max?: number
  }
  revenueRange?: {
    min?: number
    max?: number
  }
  bedrooms?: {
    min?: number
    max?: number
  }
  amenities?: string[]
  features?: string[]
  ownerId?: string
  verificationStatus?: VerificationStatus[]
  maintenanceStatus?: MaintenanceStatus[]
  sortBy?: PropertySortField
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export type PropertySortField = 
  | 'name'
  | 'createdAt'
  | 'updatedAt'
  | 'revenue'
  | 'occupancy'
  | 'rating'
  | 'price'
  | 'location'
  | 'status'

// Property Analytics Types
export interface PropertyAnalytics {
  propertyId: string
  period: {
    startDate: string
    endDate: string
  }
  revenue: RevenueAnalytics
  occupancy: OccupancyAnalytics
  booking: BookingAnalytics
  guest: GuestAnalytics
  pricing: PricingAnalytics
  competition: CompetitionAnalytics
  forecast: PropertyForecast
}

export interface RevenueAnalytics {
  totalRevenue: number
  averageDailyRevenue: number
  revenueByMonth: MonthlyData[]
  revenueBySource: SourceData[]
  revenueGrowth: number
  seasonalRevenue: SeasonalData[]
}

export interface OccupancyAnalytics {
  averageOccupancy: number
  occupancyByMonth: MonthlyData[]
  occupancyTrend: number
  seasonalOccupancy: SeasonalData[]
  competitiveOccupancy: number
}

export interface BookingAnalytics {
  totalBookings: number
  averageStayLength: number
  bookingsByMonth: MonthlyData[]
  bookingsBySource: SourceData[]
  cancellationRate: number
  leadTime: number
  repeatBookingRate: number
}

export interface GuestAnalytics {
  averageRating: number
  totalReviews: number
  guestSatisfaction: number
  responseRate: number
  responseTime: number
  guestDemographics: DemographicData[]
}

export interface PricingAnalytics {
  averageRate: number
  priceOptimization: number
  competitivePosition: number
  priceElasticity: number
  optimalPricing: OptimalPricingData[]
}

export interface CompetitionAnalytics {
  marketPosition: number
  competitorCount: number
  averageCompetitorRate: number
  marketShare: number
  competitiveAdvantages: string[]
}

export interface PropertyForecast {
  revenueProjection: MonthlyProjection[]
  occupancyProjection: MonthlyProjection[]
  bookingProjection: MonthlyProjection[]
  confidence: number
}

export interface MonthlyData {
  month: string
  year: number
  value: number
}

export interface SourceData {
  source: string
  value: number
  percentage: number
}

export interface SeasonalData {
  season: string
  value: number
  change: number
}

export interface DemographicData {
  category: string
  value: number
  percentage: number
}

export interface OptimalPricingData {
  date: string
  currentPrice: number
  optimalPrice: number
  potentialRevenue: number
}

export interface MonthlyProjection {
  month: string
  year: number
  projected: number
  confidence: number
}

// Utility Types
export interface PropertySearchResult {
  properties: Property[]
  total: number
  page: number
  totalPages: number
  filters: PropertyFilters
}

export interface PropertyBulkOperation {
  propertyIds: string[]
  operation: BulkOperationType
  data?: any
}

export type BulkOperationType = 
  | 'update_status'
  | 'update_pricing'
  | 'schedule_maintenance'
  | 'export_data'
  | 'send_notification'

// Constants
export const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'villa', label: 'Villa' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'condo', label: 'Condo' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'studio', label: 'Studio' },
  { value: 'loft', label: 'Loft' },
  { value: 'cabin', label: 'Cabin' },
  { value: 'cottage', label: 'Cottage' },
  { value: 'mansion', label: 'Mansion' },
  { value: 'other', label: 'Other' }
]

export const PROPERTY_STATUSES: { value: PropertyStatus; label: string; color: string }[] = [
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'inactive', label: 'Inactive', color: 'gray' },
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'maintenance', label: 'Maintenance', color: 'orange' },
  { value: 'blocked', label: 'Blocked', color: 'red' },
  { value: 'suspended', label: 'Suspended', color: 'purple' },
  { value: 'archived', label: 'Archived', color: 'neutral' }
]
