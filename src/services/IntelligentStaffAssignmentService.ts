/**
 * Intelligent Staff Assignment Service
 * Provides AI-powered staff assignment suggestions and automation
 */

import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { getDb } from '@/lib/firebase'

export interface AssignmentSuggestion {
  staffId: string
  staffName: string
  confidence: number
  reasons: string[]
  availability: 'available' | 'busy' | 'unavailable'
  skillMatch: number
  locationProximity: number
  performanceScore: number
}

export interface AssignmentJobData {
  propertyName: string
  startDate: string
  endDate: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  requiredSkills: string[]
  estimatedDuration: number
  location?: {
    address: string
    coordinates?: { latitude: number; longitude: number }
  }
}

export interface AssignmentResult {
  success: boolean
  suggestions: AssignmentSuggestion[]
  totalCandidates: number
  processingTime: number
}

class IntelligentStaffAssignmentService {
  private static instance: IntelligentStaffAssignmentService
  private get staffCollection() { return collection(getDb(), 'staff_accounts') }
  private get jobsCollection() { return collection(getDb(), 'jobs') }

  static getInstance(): IntelligentStaffAssignmentService {
    if (!IntelligentStaffAssignmentService.instance) {
      IntelligentStaffAssignmentService.instance = new IntelligentStaffAssignmentService()
    }
    return IntelligentStaffAssignmentService.instance
  }

  /**
   * Get intelligent staff assignment suggestions
   */
  async getAssignmentSuggestions(jobData: AssignmentJobData): Promise<AssignmentResult> {
    const startTime = Date.now()
    
    try {
      console.log('🤖 Getting AI assignment suggestions for:', jobData.propertyName)

      // Get all active staff members
      const staffQuery = query(
        this.staffCollection,
        where('isActive', '==', true),
        orderBy('name', 'asc')
      )

      const staffSnapshot = await getDocs(staffQuery)
      const allStaff: any[] = []
      
      staffSnapshot.forEach((doc) => {
        allStaff.push({ id: doc.id, ...doc.data() })
      })

      if (allStaff.length === 0) {
        return {
          success: false,
          suggestions: [],
          totalCandidates: 0,
          processingTime: Date.now() - startTime
        }
      }

      // Calculate suggestions for each staff member
      const suggestions: AssignmentSuggestion[] = []

      for (const staff of allStaff) {
        const suggestion = await this.calculateStaffSuggestion(staff, jobData)
        suggestions.push(suggestion)
      }

      // Sort by confidence score (highest first)
      suggestions.sort((a, b) => b.confidence - a.confidence)

      // Return top 5 suggestions
      const topSuggestions = suggestions.slice(0, 5)

      console.log(`✅ Generated ${topSuggestions.length} AI suggestions in ${Date.now() - startTime}ms`)

      return {
        success: true,
        suggestions: topSuggestions,
        totalCandidates: allStaff.length,
        processingTime: Date.now() - startTime
      }

    } catch (error) {
      console.error('❌ Error getting assignment suggestions:', error)
      return {
        success: false,
        suggestions: [],
        totalCandidates: 0,
        processingTime: Date.now() - startTime
      }
    }
  }

  /**
   * Calculate suggestion score for a staff member
   */
  private async calculateStaffSuggestion(
    staff: any,
    jobData: AssignmentJobData
  ): Promise<AssignmentSuggestion> {
    const reasons: string[] = []
    let confidence = 0

    // 1. Skill Match Analysis (30% weight)
    const skillMatch = this.calculateSkillMatch(staff.skills || [], jobData.requiredSkills)
    confidence += skillMatch * 0.3

    if (skillMatch > 0.8) {
      reasons.push(`Excellent skill match (${Math.round(skillMatch * 100)}%)`)
    } else if (skillMatch > 0.5) {
      reasons.push(`Good skill match (${Math.round(skillMatch * 100)}%)`)
    } else {
      reasons.push(`Basic skill match (${Math.round(skillMatch * 100)}%)`)
    }

    // 2. Availability Analysis (25% weight)
    const availability = await this.checkStaffAvailability(staff.id, jobData.startDate, jobData.endDate)
    let availabilityScore = 0

    switch (availability) {
      case 'available':
        availabilityScore = 1
        reasons.push('Fully available during requested time')
        break
      case 'busy':
        availabilityScore = 0.3
        reasons.push('Partially available (has other assignments)')
        break
      case 'unavailable':
        availabilityScore = 0
        reasons.push('Not available during requested time')
        break
    }

    confidence += availabilityScore * 0.25

    // 3. Performance Score (20% weight)
    const performanceScore = await this.calculatePerformanceScore(staff.id)
    confidence += performanceScore * 0.2

    if (performanceScore > 0.8) {
      reasons.push('Excellent performance history')
    } else if (performanceScore > 0.6) {
      reasons.push('Good performance history')
    } else {
      reasons.push('Average performance history')
    }

    // 4. Location Proximity (15% weight)
    const locationScore = this.calculateLocationProximity(staff.location, jobData.location)
    confidence += locationScore * 0.15

    if (locationScore > 0.8) {
      reasons.push('Very close to property location')
    } else if (locationScore > 0.5) {
      reasons.push('Reasonably close to property location')
    }

    // 5. Workload Balance (10% weight)
    const workloadScore = await this.calculateWorkloadBalance(staff.id)
    confidence += workloadScore * 0.1

    if (workloadScore > 0.7) {
      reasons.push('Good workload balance')
    } else if (workloadScore < 0.3) {
      reasons.push('Heavy current workload')
    }

    // Ensure confidence is between 0 and 1
    confidence = Math.max(0, Math.min(1, confidence))

    return {
      staffId: staff.id,
      staffName: staff.name,
      confidence,
      reasons,
      availability,
      skillMatch,
      locationProximity: locationScore,
      performanceScore
    }
  }

  /**
   * Calculate skill match percentage
   */
  private calculateSkillMatch(staffSkills: string[], requiredSkills: string[]): number {
    if (requiredSkills.length === 0) return 1

    const matchedSkills = requiredSkills.filter(skill => 
      staffSkills.some(staffSkill => 
        staffSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(staffSkill.toLowerCase())
      )
    )

    return matchedSkills.length / requiredSkills.length
  }

  /**
   * Check staff availability during the specified time period
   */
  private async checkStaffAvailability(
    staffId: string,
    startDate: string,
    endDate: string
  ): Promise<'available' | 'busy' | 'unavailable'> {
    try {
      // Query for existing assignments during the time period
      const assignmentsQuery = query(
        this.jobsCollection,
        where('assignedStaffId', '==', staffId),
        where('status', 'in', ['assigned', 'accepted', 'in_progress']),
        where('scheduledDate', '>=', startDate.split('T')[0]),
        where('scheduledDate', '<=', endDate.split('T')[0])
      )

      const assignmentsSnapshot = await getDocs(assignmentsQuery)
      const conflictingAssignments = assignmentsSnapshot.size

      if (conflictingAssignments === 0) {
        return 'available'
      } else if (conflictingAssignments <= 2) {
        return 'busy'
      } else {
        return 'unavailable'
      }
    } catch (error) {
      console.warn('Could not check availability, defaulting to busy:', error)
      return 'busy'
    }
  }

  /**
   * Calculate performance score based on historical data
   */
  private async calculatePerformanceScore(staffId: string): Promise<number> {
    try {
      // Query for completed jobs by this staff member
      const completedJobsQuery = query(
        this.jobsCollection,
        where('assignedStaffId', '==', staffId),
        where('status', '==', 'completed'),
        orderBy('completedAt', 'desc'),
        limit(10) // Last 10 completed jobs
      )

      const completedJobsSnapshot = await getDocs(completedJobsQuery)
      
      if (completedJobsSnapshot.empty) {
        return 0.5 // Default score for new staff
      }

      let totalScore = 0
      let jobCount = 0

      completedJobsSnapshot.forEach((doc) => {
        const job = doc.data()
        
        // Base score for completion
        let jobScore = 0.7

        // Bonus for on-time completion
        if (job.completedAt && job.scheduledDate) {
          const completedDate = new Date(job.completedAt.toDate())
          const scheduledDate = new Date(job.scheduledDate)
          
          if (completedDate <= scheduledDate) {
            jobScore += 0.2
          }
        }

        // Bonus for verification
        if (job.verifiedAt) {
          jobScore += 0.1
        }

        totalScore += Math.min(1, jobScore)
        jobCount++
      })

      return jobCount > 0 ? totalScore / jobCount : 0.5
    } catch (error) {
      console.warn('Could not calculate performance score:', error)
      return 0.5
    }
  }

  /**
   * Calculate location proximity score
   */
  private calculateLocationProximity(
    staffLocation: any,
    jobLocation: any
  ): number {
    // If no location data available, return neutral score
    if (!staffLocation?.coordinates || !jobLocation?.coordinates) {
      return 0.5
    }

    // Calculate distance using Haversine formula
    const distance = this.calculateDistance(
      staffLocation.coordinates.latitude,
      staffLocation.coordinates.longitude,
      jobLocation.coordinates.latitude,
      jobLocation.coordinates.longitude
    )

    // Convert distance to score (closer = higher score)
    // Assuming distances are in kilometers
    if (distance <= 5) return 1      // Within 5km
    if (distance <= 10) return 0.8   // Within 10km
    if (distance <= 20) return 0.6   // Within 20km
    if (distance <= 50) return 0.4   // Within 50km
    return 0.2                       // Further than 50km
  }

  /**
   * Calculate workload balance score
   */
  private async calculateWorkloadBalance(staffId: string): Promise<number> {
    try {
      // Count current active assignments
      const activeJobsQuery = query(
        this.jobsCollection,
        where('assignedStaffId', '==', staffId),
        where('status', 'in', ['assigned', 'accepted', 'in_progress'])
      )

      const activeJobsSnapshot = await getDocs(activeJobsQuery)
      const activeJobCount = activeJobsSnapshot.size

      // Convert to score (fewer active jobs = higher score)
      if (activeJobCount === 0) return 1
      if (activeJobCount <= 2) return 0.8
      if (activeJobCount <= 4) return 0.6
      if (activeJobCount <= 6) return 0.4
      return 0.2
    } catch (error) {
      console.warn('Could not calculate workload balance:', error)
      return 0.5
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1)
    const dLon = this.toRad(lon2 - lon1)
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  /**
   * Convert degrees to radians
   */
  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180)
  }
}

export default IntelligentStaffAssignmentService.getInstance()
