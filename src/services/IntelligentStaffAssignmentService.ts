/**
 * Intelligent Staff Assignment Service
 * Advanced AI-based staff assignment logic with OpenAI integration
 */

import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore'
import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
})

interface JobData {
  id: string
  title: string
  type: string
  propertyId: string
  propertyName: string
  propertyZone?: string
  propertyLocation?: {
    latitude: number
    longitude: number
    address: string
  }
  startDate: string
  endDate: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  requiredSkills: string[]
  estimatedDuration: number // minutes
  description?: string
}

interface StaffMember {
  id: string
  name: string
  email: string
  role: string
  skills: string[]
  currentJobs: number
  maxConcurrentJobs: number
  lastKnownZone?: string
  location?: {
    latitude: number
    longitude: number
    zone: string
  }
  performance: {
    rating: number
    completedJobs: number
    onTimeRate: number
    averageCompletionTime: number
  }
  availability: {
    isAvailable: boolean
    workingHours: {
      start: string
      end: string
    }
  }
  propertyHistory: Array<{
    propertyId: string
    jobsCompleted: number
    lastJobDate: string
    averageRating: number
  }>
}

interface AssignmentSuggestion {
  staffId: string
  staffName: string
  confidence: number // 0-1
  score: number // 0-100
  reasons: string[]
  matchFactors: {
    proximityScore: number
    workloadScore: number
    experienceScore: number
    skillScore: number
    availabilityScore: number
  }
  estimatedTravelTime?: number // minutes
  currentWorkload: {
    todayJobs: number
    activeJobs: number
    utilization: number // 0-1
  }
}

interface AIAssignmentResult {
  suggestions: AssignmentSuggestion[]
  aiRecommendation?: {
    recommendedStaffId: string
    reasoning: string
    confidence: number
  }
  fallbackAssignment?: {
    staffId: string
    reason: string
  }
  executionTime: number
}

class IntelligentStaffAssignmentService {
  private readonly STAFF_COLLECTION = 'staff_accounts'
  private readonly JOBS_COLLECTION = 'jobs'
  private readonly PROPERTIES_COLLECTION = 'properties'
  private readonly CALENDAR_EVENTS_COLLECTION = 'calendarEvents'

  /**
   * Get intelligent staff assignment suggestions
   */
  async getAssignmentSuggestions(jobData: JobData): Promise<AIAssignmentResult> {
    const startTime = Date.now()
    console.log(`🤖 Getting intelligent staff assignment for: ${jobData.title}`)

    try {
      // Get all available staff
      const staff = await this.getAllStaff()
      
      // Get property details for location-based matching
      const propertyDetails = await this.getPropertyDetails(jobData.propertyId)
      
      // Score each staff member
      const suggestions: AssignmentSuggestion[] = []
      
      for (const staffMember of staff) {
        const suggestion = await this.scoreStaffMember(staffMember, jobData, propertyDetails)
        if (suggestion.score > 0) {
          suggestions.push(suggestion)
        }
      }

      // Sort by score (highest first)
      suggestions.sort((a, b) => b.score - a.score)
      
      // Get top 3 suggestions
      const topSuggestions = suggestions.slice(0, 3)
      
      // Get AI recommendation using OpenAI
      const aiRecommendation = await this.getAIRecommendation(jobData, topSuggestions)
      
      // Determine fallback if no good matches
      const fallbackAssignment = this.getFallbackAssignment(staff, jobData)

      const result: AIAssignmentResult = {
        suggestions: topSuggestions,
        aiRecommendation,
        fallbackAssignment,
        executionTime: Date.now() - startTime
      }

      console.log(`✅ Generated ${topSuggestions.length} staff suggestions in ${result.executionTime}ms`)
      
      return result

    } catch (error) {
      console.error('❌ Error getting staff assignment suggestions:', error)
      return {
        suggestions: [],
        executionTime: Date.now() - startTime
      }
    }
  }

  /**
   * Score a staff member for a specific job
   */
  private async scoreStaffMember(
    staff: StaffMember, 
    jobData: JobData, 
    propertyDetails: any
  ): Promise<AssignmentSuggestion> {
    let totalScore = 0
    const reasons: string[] = []
    const matchFactors = {
      proximityScore: 0,
      workloadScore: 0,
      experienceScore: 0,
      skillScore: 0,
      availabilityScore: 0
    }

    // 1. Availability Check (25% weight)
    const availabilityScore = this.calculateAvailabilityScore(staff, jobData)
    matchFactors.availabilityScore = availabilityScore
    totalScore += availabilityScore * 0.25

    if (availabilityScore === 0) {
      reasons.push('Not available during job time')
      return this.createSuggestion(staff, 0, reasons, matchFactors, jobData)
    } else if (availabilityScore > 80) {
      reasons.push('Available during working hours')
    }

    // 2. Workload Balance (25% weight)
    const workloadScore = this.calculateWorkloadScore(staff)
    matchFactors.workloadScore = workloadScore
    totalScore += workloadScore * 0.25

    if (staff.currentJobs === 0) {
      reasons.push('No current jobs - fully available')
    } else if (staff.currentJobs <= 2) {
      reasons.push(`Light workload (${staff.currentJobs} jobs)`)
    } else {
      reasons.push(`Busy (${staff.currentJobs} jobs)`)
    }

    // 3. Proximity/Location (20% weight)
    const proximityScore = this.calculateProximityScore(staff, jobData, propertyDetails)
    matchFactors.proximityScore = proximityScore
    totalScore += proximityScore * 0.20

    if (proximityScore > 80) {
      reasons.push('Very close to property')
    } else if (proximityScore > 60) {
      reasons.push('Nearby location')
    } else if (proximityScore > 40) {
      reasons.push('Moderate distance')
    } else {
      reasons.push('Far from property')
    }

    // 4. Property Experience (15% weight)
    const experienceScore = this.calculateExperienceScore(staff, jobData)
    matchFactors.experienceScore = experienceScore
    totalScore += experienceScore * 0.15

    const propertyHistory = staff.propertyHistory.find(h => h.propertyId === jobData.propertyId)
    if (propertyHistory && propertyHistory.jobsCompleted > 0) {
      reasons.push(`${propertyHistory.jobsCompleted} jobs at this property`)
    }

    // 5. Skill Matching (15% weight)
    const skillScore = this.calculateSkillScore(staff, jobData)
    matchFactors.skillScore = skillScore
    totalScore += skillScore * 0.15

    const matchingSkills = this.getMatchingSkills(staff.skills, jobData.requiredSkills)
    if (matchingSkills.length > 0) {
      reasons.push(`Skills: ${matchingSkills.join(', ')}`)
    }

    return this.createSuggestion(staff, totalScore, reasons, matchFactors, jobData)
  }

  /**
   * Calculate availability score based on working hours and current schedule
   */
  private calculateAvailabilityScore(staff: StaffMember, jobData: JobData): number {
    if (!staff.availability.isAvailable) return 0

    const jobStart = new Date(jobData.startDate)
    const jobHour = jobStart.getHours()
    
    const workStart = parseInt(staff.availability.workingHours.start.split(':')[0])
    const workEnd = parseInt(staff.availability.workingHours.end.split(':')[0])

    // Check if job is within working hours
    if (jobHour >= workStart && jobHour < workEnd) {
      return 100
    } else if (jobHour >= workStart - 1 && jobHour < workEnd + 1) {
      return 70 // Slightly outside normal hours
    } else {
      return 30 // Outside normal hours but still possible
    }
  }

  /**
   * Calculate workload score (lower workload = higher score)
   */
  private calculateWorkloadScore(staff: StaffMember): number {
    const utilization = staff.currentJobs / staff.maxConcurrentJobs
    
    if (utilization === 0) return 100
    if (utilization <= 0.3) return 90
    if (utilization <= 0.5) return 75
    if (utilization <= 0.7) return 60
    if (utilization <= 0.9) return 40
    return 20 // Overloaded
  }

  /**
   * Calculate proximity score based on location and zone
   */
  private calculateProximityScore(staff: StaffMember, jobData: JobData, propertyDetails: any): number {
    // Zone-based matching
    if (staff.lastKnownZone && propertyDetails?.zone) {
      if (staff.lastKnownZone === propertyDetails.zone) {
        return 100 // Same zone
      }
    }

    // Location-based matching
    if (staff.location && jobData.propertyLocation) {
      const distance = this.calculateDistance(
        { lat: staff.location.latitude, lng: staff.location.longitude },
        { lat: jobData.propertyLocation.latitude, lng: jobData.propertyLocation.longitude }
      )

      if (distance < 2) return 100
      if (distance < 5) return 85
      if (distance < 10) return 70
      if (distance < 20) return 50
      if (distance < 50) return 30
      return 10
    }

    return 50 // Default score when no location data
  }

  /**
   * Calculate experience score based on property history
   */
  private calculateExperienceScore(staff: StaffMember, jobData: JobData): number {
    const propertyHistory = staff.propertyHistory.find(h => h.propertyId === jobData.propertyId)
    
    if (!propertyHistory) return 30 // No experience at this property
    
    const jobsCompleted = propertyHistory.jobsCompleted
    const daysSinceLastJob = Math.floor(
      (Date.now() - new Date(propertyHistory.lastJobDate).getTime()) / (1000 * 60 * 60 * 24)
    )

    let score = Math.min(jobsCompleted * 10, 80) // Max 80 points for experience
    
    // Recency bonus/penalty
    if (daysSinceLastJob <= 7) score += 20
    else if (daysSinceLastJob <= 30) score += 10
    else if (daysSinceLastJob > 90) score -= 10

    // Rating bonus
    if (propertyHistory.averageRating >= 4.5) score += 10
    else if (propertyHistory.averageRating >= 4.0) score += 5

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Calculate skill matching score
   */
  private calculateSkillScore(staff: StaffMember, jobData: JobData): number {
    if (jobData.requiredSkills.length === 0) return 70 // Default when no specific skills required

    const matchingSkills = this.getMatchingSkills(staff.skills, jobData.requiredSkills)
    const matchPercentage = matchingSkills.length / jobData.requiredSkills.length

    return Math.round(matchPercentage * 100)
  }

  /**
   * Get matching skills between staff and job requirements
   */
  private getMatchingSkills(staffSkills: string[], requiredSkills: string[]): string[] {
    return staffSkills.filter(skill => 
      requiredSkills.some(required => 
        skill.toLowerCase().includes(required.toLowerCase()) ||
        required.toLowerCase().includes(skill.toLowerCase())
      )
    )
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    const R = 6371 // Earth's radius in km
    const dLat = this.toRadians(point2.lat - point1.lat)
    const dLng = this.toRadians(point2.lng - point1.lng)
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  /**
   * Create assignment suggestion object
   */
  private createSuggestion(
    staff: StaffMember, 
    score: number, 
    reasons: string[], 
    matchFactors: any, 
    jobData: JobData
  ): AssignmentSuggestion {
    return {
      staffId: staff.id,
      staffName: staff.name,
      confidence: Math.min(score / 100, 1),
      score: Math.round(score),
      reasons,
      matchFactors,
      currentWorkload: {
        todayJobs: staff.currentJobs,
        activeJobs: staff.currentJobs,
        utilization: staff.currentJobs / staff.maxConcurrentJobs
      }
    }
  }

  /**
   * Get AI recommendation using OpenAI
   */
  private async getAIRecommendation(
    jobData: JobData, 
    suggestions: AssignmentSuggestion[]
  ): Promise<{ recommendedStaffId: string; reasoning: string; confidence: number } | undefined> {
    if (suggestions.length === 0) return undefined

    try {
      const prompt = this.buildAIPrompt(jobData, suggestions)
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an AI assistant for a property management company. Analyze staff assignments and provide the best recommendation with clear reasoning."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.3
      })

      const response = completion.choices[0]?.message?.content
      if (!response) return undefined

      // Parse AI response (simplified - in production, use more robust parsing)
      const lines = response.split('\n')
      const recommendedLine = lines.find(line => line.toLowerCase().includes('recommend'))
      const reasoningLine = lines.find(line => line.toLowerCase().includes('because') || line.toLowerCase().includes('reason'))

      if (recommendedLine && reasoningLine) {
        // Extract staff name from recommendation
        const topSuggestion = suggestions[0]
        
        return {
          recommendedStaffId: topSuggestion.staffId,
          reasoning: reasoningLine.trim(),
          confidence: topSuggestion.confidence
        }
      }

    } catch (error) {
      console.error('❌ Error getting AI recommendation:', error)
    }

    return undefined
  }

  /**
   * Build prompt for OpenAI
   */
  private buildAIPrompt(jobData: JobData, suggestions: AssignmentSuggestion[]): string {
    const jobInfo = `Job: ${jobData.title} (${jobData.type}) at ${jobData.propertyName}
Time: ${new Date(jobData.startDate).toLocaleString()}
Priority: ${jobData.priority}
Required Skills: ${jobData.requiredSkills.join(', ')}`

    const staffOptions = suggestions.map((s, index) => 
      `${index + 1}. ${s.staffName}: ${s.score}/100 score, ${s.currentWorkload.todayJobs} jobs today, ${s.reasons.join(', ')}`
    ).join('\n')

    return `${jobInfo}

Staff Options:
${staffOptions}

Which staff member should be assigned to this job and why? Consider workload balance, proximity, experience, and skills. Provide a clear recommendation with reasoning.`
  }

  /**
   * Get fallback assignment when no good matches found
   */
  private getFallbackAssignment(staff: StaffMember[], jobData: JobData): { staffId: string; reason: string } | undefined {
    // Find staff with lowest workload
    const availableStaff = staff.filter(s => s.availability.isAvailable)
    if (availableStaff.length === 0) return undefined

    const leastBusy = availableStaff.reduce((prev, current) => 
      prev.currentJobs < current.currentJobs ? prev : current
    )

    return {
      staffId: leastBusy.id,
      reason: `Assigned to ${leastBusy.name} (lowest workload: ${leastBusy.currentJobs} jobs)`
    }
  }

  /**
   * Get all staff members with their current data
   */
  private async getAllStaff(): Promise<StaffMember[]> {
    try {
      const staffRef = collection(db, this.STAFF_COLLECTION)
      const snapshot = await getDocs(staffRef)
      
      const staff: StaffMember[] = []
      
      for (const doc of snapshot.docs) {
        const data = doc.data()
        
        // Get current job count
        const currentJobs = await this.getCurrentJobCount(doc.id)
        
        // Get property history
        const propertyHistory = await this.getPropertyHistory(doc.id)
        
        staff.push({
          id: doc.id,
          name: data.name || 'Unknown Staff',
          email: data.email || '',
          role: data.role || 'staff',
          skills: data.skills || [],
          currentJobs,
          maxConcurrentJobs: data.maxConcurrentJobs || 5,
          lastKnownZone: data.lastKnownZone,
          location: data.location,
          performance: {
            rating: data.rating || 4.0,
            completedJobs: data.completedJobs || 0,
            onTimeRate: data.onTimeRate || 0.9,
            averageCompletionTime: data.averageCompletionTime || 120
          },
          availability: {
            isAvailable: data.isAvailable !== false,
            workingHours: data.workingHours || { start: '08:00', end: '17:00' }
          },
          propertyHistory
        })
      }

      return staff

    } catch (error) {
      console.error('❌ Error fetching staff:', error)
      return []
    }
  }

  /**
   * Get current job count for a staff member
   */
  private async getCurrentJobCount(staffId: string): Promise<number> {
    try {
      const jobsRef = collection(db, this.CALENDAR_EVENTS_COLLECTION)
      const q = query(
        jobsRef,
        where('staffId', '==', staffId),
        where('status', 'in', ['pending', 'accepted', 'in_progress'])
      )
      
      const snapshot = await getDocs(q)
      return snapshot.size

    } catch (error) {
      console.error('❌ Error getting current job count:', error)
      return 0
    }
  }

  /**
   * Get property history for a staff member
   */
  private async getPropertyHistory(staffId: string): Promise<Array<{
    propertyId: string
    jobsCompleted: number
    lastJobDate: string
    averageRating: number
  }>> {
    try {
      const jobsRef = collection(db, this.CALENDAR_EVENTS_COLLECTION)
      const q = query(
        jobsRef,
        where('staffId', '==', staffId),
        where('status', '==', 'completed'),
        orderBy('endDate', 'desc'),
        limit(50)
      )
      
      const snapshot = await getDocs(q)
      const propertyMap = new Map()
      
      snapshot.forEach(doc => {
        const data = doc.data()
        const propertyId = data.propertyId
        
        if (!propertyMap.has(propertyId)) {
          propertyMap.set(propertyId, {
            propertyId,
            jobsCompleted: 0,
            lastJobDate: data.endDate,
            totalRating: 0,
            ratingCount: 0
          })
        }
        
        const property = propertyMap.get(propertyId)
        property.jobsCompleted++
        
        if (data.rating) {
          property.totalRating += data.rating
          property.ratingCount++
        }
        
        // Update last job date if this is more recent
        if (new Date(data.endDate) > new Date(property.lastJobDate)) {
          property.lastJobDate = data.endDate
        }
      })
      
      return Array.from(propertyMap.values()).map(p => ({
        propertyId: p.propertyId,
        jobsCompleted: p.jobsCompleted,
        lastJobDate: p.lastJobDate,
        averageRating: p.ratingCount > 0 ? p.totalRating / p.ratingCount : 4.0
      }))

    } catch (error) {
      console.error('❌ Error getting property history:', error)
      return []
    }
  }

  /**
   * Get property details
   */
  private async getPropertyDetails(propertyId: string): Promise<any> {
    try {
      const propertyRef = doc(db, this.PROPERTIES_COLLECTION, propertyId)
      const propertyDoc = await getDoc(propertyRef)
      
      if (propertyDoc.exists()) {
        return propertyDoc.data()
      }
      
      return null

    } catch (error) {
      console.error('❌ Error getting property details:', error)
      return null
    }
  }

  /**
   * Format assignment suggestion for display
   */
  formatSuggestion(suggestion: AssignmentSuggestion): string {
    const confidence = Math.round(suggestion.confidence * 100)
    const topReasons = suggestion.reasons.slice(0, 2).join(', ')
    
    return `${suggestion.staffName} (${confidence}% match: ${topReasons})`
  }
}

// Export singleton instance
export default new IntelligentStaffAssignmentService()
