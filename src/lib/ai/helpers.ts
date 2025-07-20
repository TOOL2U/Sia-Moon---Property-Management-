// lib/ai/helpers.ts - Helper functions for AI COO decision making

export interface StaffMember {
  id: string
  name: string
  skills: string[]
  location: {
    lat: number
    lng: number
    address: string
  }
  availability: 'available' | 'busy' | 'off-duty'
  remoteCapable: boolean
  hourlyRate: number
  rating: number
  maxDistance: number // km
}

export interface ETAResult {
  staffId: string
  name: string
  estimatedMinutes: number
  distance: number // km
  available: boolean
  suitable: boolean
  skills: string[]
  hourlyRate: number
  rating: number
}

/**
 * Get list of available staff members
 */
export async function getStaffList(): Promise<StaffMember[]> {
  try {
    console.log('🔍 AI COO: Fetching staff list...')
    
    // In production, this would fetch from database
    // For now, return mock staff data
    const mockStaff: StaffMember[] = [
      {
        id: 'staff_001',
        name: 'Maria Santos',
        skills: ['cleaning', 'housekeeping', 'laundry'],
        location: {
          lat: 13.7563,
          lng: 100.5018,
          address: 'Bangkok Central'
        },
        availability: 'available',
        remoteCapable: false,
        hourlyRate: 350,
        rating: 4.8,
        maxDistance: 10
      },
      {
        id: 'staff_002',
        name: 'John Wilson',
        skills: ['maintenance', 'plumbing', 'electrical'],
        location: {
          lat: 13.7650,
          lng: 100.5380,
          address: 'Sukhumvit Area'
        },
        availability: 'available',
        remoteCapable: true,
        hourlyRate: 450,
        rating: 4.9,
        maxDistance: 15
      },
      {
        id: 'staff_003',
        name: 'Lisa Chen',
        skills: ['cleaning', 'organizing', 'deep-clean'],
        location: {
          lat: 13.7440,
          lng: 100.5330,
          address: 'Silom District'
        },
        availability: 'available',
        remoteCapable: false,
        hourlyRate: 380,
        rating: 4.7,
        maxDistance: 8
      },
      {
        id: 'staff_004',
        name: 'David Kumar',
        skills: ['maintenance', 'gardening', 'pool-cleaning'],
        location: {
          lat: 13.7308,
          lng: 100.5418,
          address: 'Sathorn Area'
        },
        availability: 'busy',
        remoteCapable: true,
        hourlyRate: 420,
        rating: 4.6,
        maxDistance: 12
      },
      {
        id: 'staff_005',
        name: 'Anna Rodriguez',
        skills: ['cleaning', 'housekeeping', 'organizing', 'laundry'],
        location: {
          lat: 13.7367,
          lng: 100.5480,
          address: 'Lumpini Area'
        },
        availability: 'available',
        remoteCapable: false,
        hourlyRate: 360,
        rating: 4.9,
        maxDistance: 9
      }
    ]

    console.log(`✅ AI COO: Found ${mockStaff.length} staff members`)
    return mockStaff

  } catch (error) {
    console.error('❌ AI COO: Error fetching staff list:', error)
    return []
  }
}

/**
 * Calculate ETA and distance for each staff member to booking location
 */
export async function getMapETA(bookingAddress: string, staff: StaffMember[]): Promise<ETAResult[]> {
  try {
    console.log(`🗺️ AI COO: Calculating ETA for ${staff.length} staff to ${bookingAddress}`)
    
    // Parse booking coordinates (in production, use geocoding API)
    const bookingCoords = parseAddress(bookingAddress)
    
    const etaResults: ETAResult[] = staff.map(member => {
      // Calculate distance using Haversine formula
      const distance = calculateDistance(
        member.location.lat,
        member.location.lng,
        bookingCoords.lat,
        bookingCoords.lng
      )
      
      // Estimate travel time (Bangkok traffic: ~20km/h average)
      const estimatedMinutes = Math.round((distance / 20) * 60)
      
      // Check if staff member is suitable for this distance
      const withinRange = distance <= member.maxDistance
      const suitable = member.availability === 'available' && 
                      (withinRange || member.remoteCapable)
      
      return {
        staffId: member.id,
        name: member.name,
        estimatedMinutes,
        distance: Math.round(distance * 10) / 10, // Round to 1 decimal
        available: member.availability === 'available',
        suitable,
        skills: member.skills,
        hourlyRate: member.hourlyRate,
        rating: member.rating
      }
    })
    
    // Sort by suitability, then by distance
    etaResults.sort((a, b) => {
      if (a.suitable && !b.suitable) return -1
      if (!a.suitable && b.suitable) return 1
      return a.distance - b.distance
    })
    
    console.log(`✅ AI COO: Calculated ETA for ${etaResults.length} staff members`)
    return etaResults

  } catch (error) {
    console.error('❌ AI COO: Error calculating ETA:', error)
    return []
  }
}

/**
 * Parse address to coordinates (mock implementation)
 */
function parseAddress(address: string): { lat: number; lng: number } {
  // In production, use Google Geocoding API or similar
  // For now, return mock coordinates based on common Bangkok areas
  
  const addressLower = address.toLowerCase()
  
  if (addressLower.includes('sukhumvit')) {
    return { lat: 13.7650, lng: 100.5380 }
  } else if (addressLower.includes('silom')) {
    return { lat: 13.7440, lng: 100.5330 }
  } else if (addressLower.includes('sathorn')) {
    return { lat: 13.7308, lng: 100.5418 }
  } else if (addressLower.includes('lumpini')) {
    return { lat: 13.7367, lng: 100.5480 }
  } else if (addressLower.includes('chatuchak')) {
    return { lat: 13.7997, lng: 100.5533 }
  } else if (addressLower.includes('thonglor')) {
    return { lat: 13.7307, lng: 100.5418 }
  } else {
    // Default to Bangkok center
    return { lat: 13.7563, lng: 100.5018 }
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  
  return distance
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Check if staff member has required skills for job type
 */
export function hasRequiredSkills(staffSkills: string[], jobType: string): boolean {
  const jobTypeSkillMap: Record<string, string[]> = {
    'cleaning': ['cleaning', 'housekeeping'],
    'maintenance': ['maintenance', 'plumbing', 'electrical'],
    'deep-clean': ['cleaning', 'deep-clean'],
    'laundry': ['laundry', 'housekeeping'],
    'organizing': ['organizing', 'housekeeping'],
    'gardening': ['gardening', 'maintenance'],
    'pool-cleaning': ['pool-cleaning', 'maintenance']
  }
  
  const requiredSkills = jobTypeSkillMap[jobType.toLowerCase()] || []
  return requiredSkills.some(skill => staffSkills.includes(skill))
}

/**
 * Calculate job priority based on various factors
 */
export function calculateJobPriority(booking: any): number {
  let priority = 5 // Base priority (1-10 scale)
  
  // Increase priority for urgent jobs
  if (booking.urgent) priority += 3
  
  // Increase priority for high-value bookings
  if (booking.value && booking.value > 3000) priority += 2
  
  // Increase priority for VIP customers
  if (booking.customerType === 'vip') priority += 2
  
  // Decrease priority for future bookings
  if (booking.scheduledDate) {
    const scheduledTime = new Date(booking.scheduledDate).getTime()
    const now = Date.now()
    const hoursUntil = (scheduledTime - now) / (1000 * 60 * 60)
    
    if (hoursUntil > 24) priority -= 1
    if (hoursUntil > 48) priority -= 1
  }
  
  return Math.max(1, Math.min(10, priority))
}

/**
 * Validate booking data
 */
export function validateBookingData(booking: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!booking) {
    errors.push('Booking data is required')
    return { isValid: false, errors }
  }
  
  if (!booking.address || typeof booking.address !== 'string') {
    errors.push('Valid address is required')
  }
  
  if (!booking.jobType || typeof booking.jobType !== 'string') {
    errors.push('Job type is required')
  }
  
  if (booking.value && (typeof booking.value !== 'number' || booking.value < 0)) {
    errors.push('Job value must be a positive number')
  }
  
  if (booking.scheduledDate && isNaN(new Date(booking.scheduledDate).getTime())) {
    errors.push('Scheduled date must be a valid date')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
