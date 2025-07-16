/**
 * Auto-Assignment Rules Engine
 * Modular system for automatically assigning jobs to staff based on configurable rules
 * 
 * Future Implementation Features:
 * - Workload-based assignment (lowest current jobs)
 * - Zone-based assignment (staff location proximity)
 * - History-based assignment (past performance, ratings)
 * - Skill-based matching (required skills vs staff capabilities)
 * - Availability-based assignment (staff schedules, time zones)
 * - Performance-based assignment (completion rates, ratings)
 */

import { JobData, JobType, JobPriority } from './JobAssignmentService'

// Assignment rule types
export type AssignmentRuleType = 
  | 'workload_balance'
  | 'zone_proximity' 
  | 'skill_match'
  | 'performance_history'
  | 'availability_check'
  | 'rating_threshold'
  | 'completion_rate'
  | 'custom_rule'

// Assignment rule configuration
export interface AssignmentRule {
  id: string
  name: string
  type: AssignmentRuleType
  priority: number // Higher number = higher priority
  enabled: boolean
  weight: number // 0-1, how much this rule influences the decision
  config: Record<string, any>
  conditions?: {
    jobTypes?: JobType[]
    priorities?: JobPriority[]
    timeRanges?: Array<{ start: string; end: string }>
    propertyZones?: string[]
  }
}

// Staff scoring result
export interface StaffScore {
  staffId: string
  staffName: string
  totalScore: number
  ruleScores: Record<string, {
    score: number
    weight: number
    reason: string
  }>
  disqualified: boolean
  disqualificationReason?: string
}

// Assignment recommendation
export interface AssignmentRecommendation {
  jobId: string
  recommendedStaffId: string
  confidence: number // 0-1
  alternativeStaff: Array<{
    staffId: string
    score: number
    reason: string
  }>
  reasoning: string[]
  appliedRules: string[]
  executionTime: number // milliseconds
}

// Staff data for assignment decisions
export interface StaffAssignmentData {
  id: string
  name: string
  email: string
  skills: string[]
  currentJobs: number
  maxConcurrentJobs: number
  averageRating: number
  completionRate: number
  averageCompletionTime: number // minutes
  location?: {
    latitude: number
    longitude: number
    zone: string
  }
  availability: {
    isAvailable: boolean
    schedule: Array<{
      day: string
      startTime: string
      endTime: string
    }>
    timeZone: string
  }
  performance: {
    jobsCompleted: number
    onTimeRate: number
    photoComplianceRate: number
    customerRating: number
  }
  preferences: {
    preferredJobTypes: JobType[]
    preferredZones: string[]
    maxTravelDistance: number // km
  }
}

class AutoAssignmentEngine {
  private rules: Map<string, AssignmentRule> = new Map()
  private isEnabled: boolean = false

  /**
   * Initialize the auto-assignment engine
   */
  async initialize(): Promise<void> {
    console.log('🤖 Initializing Auto-Assignment Engine...')
    
    // Load default rules
    await this.loadDefaultRules()
    
    // Load custom rules from database
    await this.loadCustomRules()
    
    this.isEnabled = true
    console.log(`✅ Auto-Assignment Engine initialized with ${this.rules.size} rules`)
  }

  /**
   * Load default assignment rules
   */
  private async loadDefaultRules(): Promise<void> {
    const defaultRules: AssignmentRule[] = [
      {
        id: 'workload_balance',
        name: 'Workload Balance',
        type: 'workload_balance',
        priority: 100,
        enabled: true,
        weight: 0.3,
        config: {
          maxJobsPerStaff: 5,
          preferLowerWorkload: true,
          workloadThreshold: 0.8
        }
      },
      {
        id: 'skill_match',
        name: 'Skill Matching',
        type: 'skill_match',
        priority: 90,
        enabled: true,
        weight: 0.25,
        config: {
          requireExactMatch: false,
          skillMatchThreshold: 0.7,
          bonusForExpertise: 0.2
        }
      },
      {
        id: 'zone_proximity',
        name: 'Zone Proximity',
        type: 'zone_proximity',
        priority: 80,
        enabled: true,
        weight: 0.2,
        config: {
          maxDistance: 50, // km
          sameZoneBonus: 0.3,
          distancePenaltyFactor: 0.1
        }
      },
      {
        id: 'performance_history',
        name: 'Performance History',
        type: 'performance_history',
        priority: 70,
        enabled: true,
        weight: 0.15,
        config: {
          minRating: 4.0,
          minCompletionRate: 0.85,
          performanceWeight: 0.4
        }
      },
      {
        id: 'availability_check',
        name: 'Availability Check',
        type: 'availability_check',
        priority: 95,
        enabled: true,
        weight: 0.1,
        config: {
          checkSchedule: true,
          bufferTime: 30, // minutes
          respectTimeZone: true
        }
      }
    ]

    defaultRules.forEach(rule => {
      this.rules.set(rule.id, rule)
    })
  }

  /**
   * Load custom rules from database
   * TODO: Implement database loading
   */
  private async loadCustomRules(): Promise<void> {
    // Placeholder for loading custom rules from Firestore
    console.log('📋 Loading custom assignment rules...')
    
    // Future implementation:
    // const customRules = await db.collection('assignment_rules').get()
    // customRules.forEach(doc => {
    //   const rule = doc.data() as AssignmentRule
    //   this.rules.set(rule.id, rule)
    // })
  }

  /**
   * Get staff recommendation for a job
   */
  async getStaffRecommendation(
    jobData: JobData,
    availableStaff: StaffAssignmentData[]
  ): Promise<AssignmentRecommendation | null> {
    if (!this.isEnabled) {
      console.log('⚠️ Auto-assignment engine is disabled')
      return null
    }

    const startTime = Date.now()
    console.log(`🎯 Getting staff recommendation for job: ${jobData.title}`)

    try {
      // Score all available staff
      const staffScores = await this.scoreAllStaff(jobData, availableStaff)
      
      // Filter out disqualified staff
      const qualifiedStaff = staffScores.filter(score => !score.disqualified)
      
      if (qualifiedStaff.length === 0) {
        console.log('❌ No qualified staff found for job assignment')
        return null
      }

      // Sort by total score (highest first)
      qualifiedStaff.sort((a, b) => b.totalScore - a.totalScore)
      
      const topStaff = qualifiedStaff[0]
      const alternatives = qualifiedStaff.slice(1, 4).map(staff => ({
        staffId: staff.staffId,
        score: staff.totalScore,
        reason: this.generateScoreReason(staff)
      }))

      const recommendation: AssignmentRecommendation = {
        jobId: jobData.id!,
        recommendedStaffId: topStaff.staffId,
        confidence: this.calculateConfidence(topStaff, qualifiedStaff),
        alternativeStaff: alternatives,
        reasoning: this.generateRecommendationReasoning(topStaff, jobData),
        appliedRules: Array.from(this.rules.keys()).filter(ruleId => 
          this.rules.get(ruleId)?.enabled
        ),
        executionTime: Date.now() - startTime
      }

      console.log(`✅ Staff recommendation generated in ${recommendation.executionTime}ms`)
      console.log(`🎯 Recommended: ${topStaff.staffName} (confidence: ${Math.round(recommendation.confidence * 100)}%)`)

      return recommendation

    } catch (error) {
      console.error('❌ Error generating staff recommendation:', error)
      return null
    }
  }

  /**
   * Score all available staff for a job
   */
  private async scoreAllStaff(
    jobData: JobData,
    availableStaff: StaffAssignmentData[]
  ): Promise<StaffScore[]> {
    const scores: StaffScore[] = []

    for (const staff of availableStaff) {
      const staffScore = await this.scoreStaffMember(jobData, staff)
      scores.push(staffScore)
    }

    return scores
  }

  /**
   * Score individual staff member for a job
   */
  private async scoreStaffMember(
    jobData: JobData,
    staff: StaffAssignmentData
  ): Promise<StaffScore> {
    const staffScore: StaffScore = {
      staffId: staff.id,
      staffName: staff.name,
      totalScore: 0,
      ruleScores: {},
      disqualified: false
    }

    // Apply each enabled rule
    for (const [ruleId, rule] of this.rules.entries()) {
      if (!rule.enabled) continue

      // Check if rule applies to this job
      if (!this.ruleApplies(rule, jobData)) continue

      try {
        const ruleResult = await this.applyRule(rule, jobData, staff)
        
        staffScore.ruleScores[ruleId] = ruleResult
        
        // If staff is disqualified by any rule, mark as disqualified
        if (ruleResult.score === -1) {
          staffScore.disqualified = true
          staffScore.disqualificationReason = ruleResult.reason
          break
        }

        // Add weighted score to total
        staffScore.totalScore += ruleResult.score * ruleResult.weight

      } catch (error) {
        console.error(`❌ Error applying rule ${ruleId}:`, error)
      }
    }

    return staffScore
  }

  /**
   * Check if a rule applies to a specific job
   */
  private ruleApplies(rule: AssignmentRule, jobData: JobData): boolean {
    if (!rule.conditions) return true

    // Check job type conditions
    if (rule.conditions.jobTypes && !rule.conditions.jobTypes.includes(jobData.jobType)) {
      return false
    }

    // Check priority conditions
    if (rule.conditions.priorities && !rule.conditions.priorities.includes(jobData.priority)) {
      return false
    }

    // Check time range conditions
    if (rule.conditions.timeRanges) {
      const now = new Date()
      const currentTime = now.toTimeString().slice(0, 5) // HH:MM format
      
      const inTimeRange = rule.conditions.timeRanges.some(range => 
        currentTime >= range.start && currentTime <= range.end
      )
      
      if (!inTimeRange) return false
    }

    // Check property zone conditions
    if (rule.conditions.propertyZones) {
      const jobZone = jobData.location?.zone || 'unknown'
      if (!rule.conditions.propertyZones.includes(jobZone)) {
        return false
      }
    }

    return true
  }

  /**
   * Apply a specific rule to score staff for a job
   * Returns -1 score for disqualification
   */
  private async applyRule(
    rule: AssignmentRule,
    jobData: JobData,
    staff: StaffAssignmentData
  ): Promise<{ score: number; weight: number; reason: string }> {
    
    switch (rule.type) {
      case 'workload_balance':
        return this.applyWorkloadRule(rule, staff)
      
      case 'skill_match':
        return this.applySkillMatchRule(rule, jobData, staff)
      
      case 'zone_proximity':
        return this.applyZoneProximityRule(rule, jobData, staff)
      
      case 'performance_history':
        return this.applyPerformanceRule(rule, staff)
      
      case 'availability_check':
        return this.applyAvailabilityRule(rule, jobData, staff)
      
      case 'rating_threshold':
        return this.applyRatingThresholdRule(rule, staff)
      
      case 'completion_rate':
        return this.applyCompletionRateRule(rule, staff)
      
      default:
        return {
          score: 0.5,
          weight: rule.weight,
          reason: `Unknown rule type: ${rule.type}`
        }
    }
  }

  /**
   * Apply workload balance rule
   */
  private applyWorkloadRule(
    rule: AssignmentRule,
    staff: StaffAssignmentData
  ): { score: number; weight: number; reason: string } {
    const maxJobs = rule.config.maxJobsPerStaff || 5
    const workloadRatio = staff.currentJobs / maxJobs

    // Disqualify if over capacity
    if (workloadRatio >= 1) {
      return {
        score: -1,
        weight: rule.weight,
        reason: `Staff at capacity (${staff.currentJobs}/${maxJobs} jobs)`
      }
    }

    // Score inversely proportional to workload
    const score = 1 - workloadRatio

    return {
      score,
      weight: rule.weight,
      reason: `Current workload: ${staff.currentJobs}/${maxJobs} jobs (${Math.round(workloadRatio * 100)}%)`
    }
  }

  /**
   * Apply skill matching rule
   */
  private applySkillMatchRule(
    rule: AssignmentRule,
    jobData: JobData,
    staff: StaffAssignmentData
  ): { score: number; weight: number; reason: string } {
    const requiredSkills = jobData.requiredSkills || []
    const staffSkills = staff.skills || []

    if (requiredSkills.length === 0) {
      return {
        score: 0.8,
        weight: rule.weight,
        reason: 'No specific skills required'
      }
    }

    const matchedSkills = requiredSkills.filter(skill => 
      staffSkills.includes(skill)
    )
    
    const matchRatio = matchedSkills.length / requiredSkills.length
    const threshold = rule.config.skillMatchThreshold || 0.7

    // Disqualify if below threshold and exact match required
    if (rule.config.requireExactMatch && matchRatio < 1) {
      return {
        score: -1,
        weight: rule.weight,
        reason: `Missing required skills: ${requiredSkills.filter(s => !staffSkills.includes(s)).join(', ')}`
      }
    }

    if (matchRatio < threshold) {
      return {
        score: -1,
        weight: rule.weight,
        reason: `Skill match below threshold: ${Math.round(matchRatio * 100)}% < ${Math.round(threshold * 100)}%`
      }
    }

    return {
      score: matchRatio,
      weight: rule.weight,
      reason: `Skill match: ${matchedSkills.length}/${requiredSkills.length} (${Math.round(matchRatio * 100)}%)`
    }
  }

  /**
   * Apply zone proximity rule
   */
  private applyZoneProximityRule(
    rule: AssignmentRule,
    jobData: JobData,
    staff: StaffAssignmentData
  ): { score: number; weight: number; reason: string } {
    // Placeholder implementation
    // TODO: Implement actual distance calculation
    
    const jobZone = jobData.location?.zone || 'unknown'
    const staffZone = staff.location?.zone || 'unknown'

    if (jobZone === staffZone) {
      return {
        score: 1.0,
        weight: rule.weight,
        reason: `Same zone: ${jobZone}`
      }
    }

    // Default score for different zones
    return {
      score: 0.6,
      weight: rule.weight,
      reason: `Different zone: staff in ${staffZone}, job in ${jobZone}`
    }
  }

  /**
   * Apply performance history rule
   */
  private applyPerformanceRule(
    rule: AssignmentRule,
    staff: StaffAssignmentData
  ): { score: number; weight: number; reason: string } {
    const minRating = rule.config.minRating || 4.0
    const minCompletionRate = rule.config.minCompletionRate || 0.85

    // Check minimum thresholds
    if (staff.averageRating < minRating) {
      return {
        score: -1,
        weight: rule.weight,
        reason: `Rating below minimum: ${staff.averageRating} < ${minRating}`
      }
    }

    if (staff.completionRate < minCompletionRate) {
      return {
        score: -1,
        weight: rule.weight,
        reason: `Completion rate below minimum: ${Math.round(staff.completionRate * 100)}% < ${Math.round(minCompletionRate * 100)}%`
      }
    }

    // Calculate performance score
    const ratingScore = staff.averageRating / 5.0
    const completionScore = staff.completionRate
    const performanceScore = (ratingScore + completionScore) / 2

    return {
      score: performanceScore,
      weight: rule.weight,
      reason: `Performance: ${staff.averageRating}/5 rating, ${Math.round(staff.completionRate * 100)}% completion`
    }
  }

  /**
   * Apply availability check rule
   */
  private applyAvailabilityRule(
    rule: AssignmentRule,
    jobData: JobData,
    staff: StaffAssignmentData
  ): { score: number; weight: number; reason: string } {
    if (!staff.availability.isAvailable) {
      return {
        score: -1,
        weight: rule.weight,
        reason: 'Staff marked as unavailable'
      }
    }

    // TODO: Implement schedule checking
    // For now, just check basic availability
    return {
      score: 1.0,
      weight: rule.weight,
      reason: 'Staff available'
    }
  }

  /**
   * Apply rating threshold rule
   */
  private applyRatingThresholdRule(
    rule: AssignmentRule,
    staff: StaffAssignmentData
  ): { score: number; weight: number; reason: string } {
    const threshold = rule.config.threshold || 4.0
    
    if (staff.averageRating < threshold) {
      return {
        score: -1,
        weight: rule.weight,
        reason: `Rating below threshold: ${staff.averageRating} < ${threshold}`
      }
    }

    return {
      score: staff.averageRating / 5.0,
      weight: rule.weight,
      reason: `Rating: ${staff.averageRating}/5`
    }
  }

  /**
   * Apply completion rate rule
   */
  private applyCompletionRateRule(
    rule: AssignmentRule,
    staff: StaffAssignmentData
  ): { score: number; weight: number; reason: string } {
    const threshold = rule.config.threshold || 0.8
    
    if (staff.completionRate < threshold) {
      return {
        score: -1,
        weight: rule.weight,
        reason: `Completion rate below threshold: ${Math.round(staff.completionRate * 100)}% < ${Math.round(threshold * 100)}%`
      }
    }

    return {
      score: staff.completionRate,
      weight: rule.weight,
      reason: `Completion rate: ${Math.round(staff.completionRate * 100)}%`
    }
  }

  /**
   * Calculate confidence score for recommendation
   */
  private calculateConfidence(
    topStaff: StaffScore,
    allQualifiedStaff: StaffScore[]
  ): number {
    if (allQualifiedStaff.length === 1) return 1.0

    const secondBest = allQualifiedStaff[1]
    const scoreDifference = topStaff.totalScore - secondBest.totalScore
    
    // Higher difference = higher confidence
    return Math.min(0.5 + scoreDifference, 1.0)
  }

  /**
   * Generate reasoning for recommendation
   */
  private generateRecommendationReasoning(
    staffScore: StaffScore,
    jobData: JobData
  ): string[] {
    const reasoning: string[] = []
    
    // Add top scoring reasons
    const sortedRules = Object.entries(staffScore.ruleScores)
      .sort(([,a], [,b]) => (b.score * b.weight) - (a.score * a.weight))
      .slice(0, 3)

    sortedRules.forEach(([ruleId, ruleScore]) => {
      const rule = this.rules.get(ruleId)
      if (rule && ruleScore.score > 0.7) {
        reasoning.push(`${rule.name}: ${ruleScore.reason}`)
      }
    })

    return reasoning
  }

  /**
   * Generate score reason for staff
   */
  private generateScoreReason(staffScore: StaffScore): string {
    const topRule = Object.entries(staffScore.ruleScores)
      .sort(([,a], [,b]) => (b.score * b.weight) - (a.score * a.weight))[0]

    return topRule ? topRule[1].reason : 'General scoring'
  }

  /**
   * Add or update assignment rule
   */
  async addRule(rule: AssignmentRule): Promise<void> {
    this.rules.set(rule.id, rule)
    
    // TODO: Save to database
    console.log(`✅ Added assignment rule: ${rule.name}`)
  }

  /**
   * Remove assignment rule
   */
  async removeRule(ruleId: string): Promise<void> {
    this.rules.delete(ruleId)
    
    // TODO: Remove from database
    console.log(`🗑️ Removed assignment rule: ${ruleId}`)
  }

  /**
   * Get all rules
   */
  getRules(): AssignmentRule[] {
    return Array.from(this.rules.values())
  }

  /**
   * Enable/disable auto-assignment
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
    console.log(`🤖 Auto-assignment engine ${enabled ? 'enabled' : 'disabled'}`)
  }

  /**
   * Check if engine is enabled
   */
  isEngineEnabled(): boolean {
    return this.isEnabled
  }
}

// Export singleton instance
export default new AutoAssignmentEngine()
