/**
 * AI Scheduling Service
 * Provides intelligent staff suggestions and conflict detection for calendar events
 */

import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'

interface StaffMember {
  id: string
  name: string
  email: string
  skills: string[]
  location?: {
    latitude: number
    longitude: number
    zone: string
  }
  availability: {
    isAvailable: boolean
    workingHours: {
      start: string
      end: string
    }
  }
  performance: {
    rating: number
    completedJobs: number
    onTimeRate: number
  }
}

interface CalendarEvent {
  id: string
  title: string
  startDate: string
  endDate: string
  staffId: string | null
  propertyId: string | null
  type: string
  status: string
  propertyName?: string
  assignedStaff?: string
}

interface StaffSuggestion {
  staffId: string
  staffName: string
  confidence: number // 0-1
  reasons: string[]
  score: number
  availability: 'available' | 'busy' | 'unknown'
  distance?: number // km
  currentJobs: number
}

interface ConflictCheck {
  hasConflict: boolean
  conflictingEvents: CalendarEvent[]
  suggestions: string[]
}

class AISchedulingService {
  private readonly CALENDAR_EVENTS_COLLECTION = 'calendarEvents'
  private readonly STAFF_COLLECTION = 'staff_accounts'

  /**
   * Get AI-powered staff suggestions for a job
   */
  async getStaffSuggestions(
    eventData: {
      startDate: string
      endDate: string
      propertyId?: string
      type: string
      propertyLocation?: { latitude: number; longitude: number }
    }
  ): Promise<StaffSuggestion[]> {
    try {
      console.log('🧠 Getting AI staff suggestions for event:', eventData)

      // Get all available staff
      const staff = await this.getAllStaff()
      
      // Get current job assignments for the time period
      const currentAssignments = await this.getStaffAssignments(eventData.startDate, eventData.endDate)
      
      // Score each staff member
      const suggestions: StaffSuggestion[] = []
      
      for (const staffMember of staff) {
        const suggestion = await this.scoreStaffMember(staffMember, eventData, currentAssignments)
        suggestions.push(suggestion)
      }

      // Sort by score (highest first)
      suggestions.sort((a, b) => b.score - a.score)
      
      // Return top 5 suggestions
      const topSuggestions = suggestions.slice(0, 5)
      
      console.log(`✅ Generated ${topSuggestions.length} staff suggestions`)
      return topSuggestions

    } catch (error) {
      console.error('❌ Error getting staff suggestions:', error)
      return []
    }
  }

  /**
   * Check for scheduling conflicts
   */
  async checkConflicts(
    staffId: string,
    startDate: string,
    endDate: string,
    excludeEventId?: string
  ): Promise<ConflictCheck> {
    try {
      console.log(`🔍 Checking conflicts for staff ${staffId} from ${startDate} to ${endDate}`)

      const eventsRef = collection(db, this.CALENDAR_EVENTS_COLLECTION)
      const conflictQuery = query(
        eventsRef,
        where('staffId', '==', staffId),
        where('status', 'in', ['pending', 'accepted', 'in_progress'])
      )

      const snapshot = await getDocs(conflictQuery)
      const conflictingEvents: CalendarEvent[] = []

      const eventStart = new Date(startDate)
      const eventEnd = new Date(endDate)

      snapshot.forEach((doc) => {
        if (excludeEventId && doc.id === excludeEventId) return

        const data = doc.data()
        const existingStart = new Date(data.startDate)
        const existingEnd = new Date(data.endDate)

        // Check for time overlap
        if (
          (eventStart >= existingStart && eventStart < existingEnd) ||
          (eventEnd > existingStart && eventEnd <= existingEnd) ||
          (eventStart <= existingStart && eventEnd >= existingEnd)
        ) {
          conflictingEvents.push({
            id: doc.id,
            title: data.title,
            startDate: data.startDate,
            endDate: data.endDate,
            staffId: data.staffId,
            propertyId: data.propertyId,
            type: data.type,
            status: data.status,
            propertyName: data.propertyName,
            assignedStaff: data.assignedStaff
          })
        }
      })

      const hasConflict = conflictingEvents.length > 0
      const suggestions = hasConflict ? this.generateConflictSuggestions(conflictingEvents) : []

      console.log(`${hasConflict ? '⚠️' : '✅'} Conflict check: ${conflictingEvents.length} conflicts found`)

      return {
        hasConflict,
        conflictingEvents,
        suggestions
      }

    } catch (error) {
      console.error('❌ Error checking conflicts:', error)
      return {
        hasConflict: false,
        conflictingEvents: [],
        suggestions: ['Error checking conflicts. Please try again.']
      }
    }
  }

  /**
   * Get all staff members
   */
  private async getAllStaff(): Promise<StaffMember[]> {
    try {
      const staffRef = collection(db, this.STAFF_COLLECTION)
      const snapshot = await getDocs(staffRef)
      
      const staff: StaffMember[] = []
      
      snapshot.forEach((doc) => {
        const data = doc.data()
        staff.push({
          id: doc.id,
          name: data.name || data.fullName || 'Unknown Staff',
          email: data.email || '',
          skills: data.skills || [],
          location: data.location,
          availability: {
            isAvailable: data.isAvailable !== false,
            workingHours: data.workingHours || { start: '08:00', end: '17:00' }
          },
          performance: {
            rating: data.rating || 4.0,
            completedJobs: data.completedJobs || 0,
            onTimeRate: data.onTimeRate || 0.9
          }
        })
      })

      return staff

    } catch (error) {
      console.error('❌ Error fetching staff:', error)
      return []
    }
  }

  /**
   * Get current staff assignments for a time period
   */
  private async getStaffAssignments(startDate: string, endDate: string): Promise<Record<string, CalendarEvent[]>> {
    try {
      const eventsRef = collection(db, this.CALENDAR_EVENTS_COLLECTION)
      const assignmentsQuery = query(
        eventsRef,
        where('status', 'in', ['pending', 'accepted', 'in_progress'])
      )

      const snapshot = await getDocs(assignmentsQuery)
      const assignments: Record<string, CalendarEvent[]> = {}

      const periodStart = new Date(startDate)
      const periodEnd = new Date(endDate)

      snapshot.forEach((doc) => {
        const data = doc.data()
        if (!data.staffId) return

        const eventStart = new Date(data.startDate)
        const eventEnd = new Date(data.endDate)

        // Check if event overlaps with the period
        if (
          (eventStart >= periodStart && eventStart < periodEnd) ||
          (eventEnd > periodStart && eventEnd <= periodEnd) ||
          (eventStart <= periodStart && eventEnd >= periodEnd)
        ) {
          if (!assignments[data.staffId]) {
            assignments[data.staffId] = []
          }

          assignments[data.staffId].push({
            id: doc.id,
            title: data.title,
            startDate: data.startDate,
            endDate: data.endDate,
            staffId: data.staffId,
            propertyId: data.propertyId,
            type: data.type,
            status: data.status,
            propertyName: data.propertyName,
            assignedStaff: data.assignedStaff
          })
        }
      })

      return assignments

    } catch (error) {
      console.error('❌ Error fetching staff assignments:', error)
      return {}
    }
  }

  /**
   * Score a staff member for a job
   */
  private async scoreStaffMember(
    staff: StaffMember,
    eventData: any,
    currentAssignments: Record<string, CalendarEvent[]>
  ): Promise<StaffSuggestion> {
    let score = 0
    const reasons: string[] = []
    const currentJobs = currentAssignments[staff.id]?.length || 0

    // Availability check (40% weight)
    if (!staff.availability.isAvailable) {
      return {
        staffId: staff.id,
        staffName: staff.name,
        confidence: 0,
        reasons: ['Staff marked as unavailable'],
        score: 0,
        availability: 'busy',
        currentJobs
      }
    }

    // Check working hours
    const eventTime = new Date(eventData.startDate)
    const eventHour = eventTime.getHours()
    const workStart = parseInt(staff.availability.workingHours.start.split(':')[0])
    const workEnd = parseInt(staff.availability.workingHours.end.split(':')[0])

    if (eventHour >= workStart && eventHour < workEnd) {
      score += 40
      reasons.push('Available during working hours')
    } else {
      score += 10
      reasons.push('Outside normal working hours')
    }

    // Workload balance (30% weight)
    if (currentJobs === 0) {
      score += 30
      reasons.push('No current jobs assigned')
    } else if (currentJobs <= 2) {
      score += 20
      reasons.push(`Light workload (${currentJobs} jobs)`)
    } else if (currentJobs <= 4) {
      score += 10
      reasons.push(`Moderate workload (${currentJobs} jobs)`)
    } else {
      score += 0
      reasons.push(`Heavy workload (${currentJobs} jobs)`)
    }

    // Performance rating (20% weight)
    const performanceScore = (staff.performance.rating / 5) * 20
    score += performanceScore
    reasons.push(`${staff.performance.rating}/5 rating`)

    // Skill matching (10% weight)
    const requiredSkills = this.getRequiredSkills(eventData.type)
    const matchingSkills = staff.skills.filter(skill => 
      requiredSkills.some(required => 
        skill.toLowerCase().includes(required.toLowerCase())
      )
    )

    if (matchingSkills.length > 0) {
      score += 10
      reasons.push(`Matching skills: ${matchingSkills.join(', ')}`)
    } else {
      score += 5
      reasons.push('General skills applicable')
    }

    // Location proximity (bonus points)
    if (eventData.propertyLocation && staff.location) {
      const distance = this.calculateDistance(
        eventData.propertyLocation,
        { latitude: staff.location.latitude, longitude: staff.location.longitude }
      )
      
      if (distance < 5) {
        score += 5
        reasons.push(`Very close (${distance.toFixed(1)}km)`)
      } else if (distance < 15) {
        score += 3
        reasons.push(`Nearby (${distance.toFixed(1)}km)`)
      } else {
        reasons.push(`${distance.toFixed(1)}km away`)
      }
    }

    const confidence = Math.min(score / 100, 1)
    const availability = currentJobs === 0 ? 'available' : currentJobs > 4 ? 'busy' : 'available'

    return {
      staffId: staff.id,
      staffName: staff.name,
      confidence,
      reasons,
      score,
      availability,
      currentJobs
    }
  }

  /**
   * Get required skills for job type
   */
  private getRequiredSkills(jobType: string): string[] {
    const skillMap: Record<string, string[]> = {
      'Cleaning': ['cleaning', 'housekeeping', 'sanitization'],
      'Maintenance': ['maintenance', 'repair', 'technical', 'plumbing', 'electrical'],
      'Check-in': ['guest services', 'hospitality', 'customer service'],
      'Check-out': ['inspection', 'guest services', 'housekeeping'],
      'Inspection': ['inspection', 'quality control', 'assessment']
    }

    return skillMap[jobType] || []
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  private calculateDistance(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number {
    const R = 6371 // Earth's radius in km
    const dLat = this.toRadians(point2.latitude - point1.latitude)
    const dLon = this.toRadians(point2.longitude - point1.longitude)
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(point1.latitude)) * Math.cos(this.toRadians(point2.latitude)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  /**
   * Generate conflict resolution suggestions
   */
  private generateConflictSuggestions(conflicts: CalendarEvent[]): string[] {
    const suggestions: string[] = []
    
    if (conflicts.length === 1) {
      const conflict = conflicts[0]
      const conflictStart = new Date(conflict.startDate)
      const conflictEnd = new Date(conflict.endDate)
      
      suggestions.push(`Conflict with "${conflict.title}" from ${conflictStart.toLocaleTimeString()} to ${conflictEnd.toLocaleTimeString()}`)
      suggestions.push('Consider rescheduling to a different time slot')
      suggestions.push('Or assign to a different staff member')
    } else {
      suggestions.push(`${conflicts.length} scheduling conflicts detected`)
      suggestions.push('Staff member is heavily booked during this time')
      suggestions.push('Recommend choosing a different staff member or time slot')
    }

    return suggestions
  }

  /**
   * Get formatted suggestion explanation
   */
  formatSuggestionExplanation(suggestion: StaffSuggestion): string {
    const topReasons = suggestion.reasons.slice(0, 2)
    const confidence = Math.round(suggestion.confidence * 100)
    
    return `${suggestion.staffName} (${confidence}% match: ${topReasons.join(', ')})`
  }
}

// Export singleton instance
export default new AISchedulingService()
