/**
 * Booking Types for Job Engine Integration
 */

export interface ServiceBooking {
  bookingId: string
  propertyId: string
  guestId: string
  startDate: Date
  endDate: Date
  status: 'confirmed' | 'cancelled' | 'modified'
  services: BookingService[]
  location: {
    address: string
    coordinates: { lat: number; lng: number }
  }
}

export interface BookingService {
  serviceId: string
  name: string
  requiresRole: 'cleaner' | 'inspector' | 'maintenance'
  estimatedDuration: number
  priority: 'low' | 'normal' | 'high' | 'critical'
}

export interface BookingModification {
  bookingId: string
  changes: {
    checkOutDate?: Date
    guestName?: string
    propertyName?: string
    specialInstructions?: string
  }
}
