/**
 * Job Prioritization Logic for Command Center Mission Panel
 * Implements critical path analysis and smart scheduling
 */

interface JobData {
  id: string
  title: string
  jobType: string
  status: 'pending' | 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  scheduledDate: any
  deadline?: string
  assignedStaffId?: string
  propertyRef: {
    id: string
    name: string
    address: string
    coordinates?: {
      latitude: number
      longitude: number
    }
  }
  bookingRef?: {
    id: string
    guestName: string
    checkInDate: string
    checkOutDate: string
    totalAmount?: number
  }
  estimatedDuration: number
  specialInstructions?: string
  requiredSkills?: string[]
}

interface PriorityScore {
  jobId: string
  score: number
  factors: {
    timeUrgency: number
    revenueImpact: number
    guestImpact: number
    dependencyImpact: number
    resourceAvailability: number
  }
  reasoning: string[]
}

/**
 * Calculate priority score for a job based on multiple factors
 */
export function calculateJobPriority(job: JobData, allJobs: JobData[]): PriorityScore {
  const factors = {
    timeUrgency: calculateTimeUrgency(job),
    revenueImpact: calculateRevenueImpact(job),
    guestImpact: calculateGuestImpact(job),
    dependencyImpact: calculateDependencyImpact(job, allJobs),
    resourceAvailability: calculateResourceAvailability(job, allJobs)
  }

  // Weighted scoring
  const weights = {
    timeUrgency: 0.3,
    revenueImpact: 0.25,
    guestImpact: 0.2,
    dependencyImpact: 0.15,
    resourceAvailability: 0.1
  }

  const score = Object.entries(factors).reduce((total, [key, value]) => {
    return total + (value * weights[key as keyof typeof weights])
  }, 0)

  const reasoning = generateReasoningText(job, factors)

  return {
    jobId: job.id,
    score: Math.round(score * 100) / 100,
    factors,
    reasoning
  }
}

/**
 * Calculate time urgency based on deadlines and checkout times
 */
function calculateTimeUrgency(job: JobData): number {
  let urgency = 0

  // Base priority scoring
  const priorityScores = { urgent: 100, high: 75, medium: 50, low: 25 }
  urgency += priorityScores[job.priority] || 25

  // Deadline proximity
  if (job.deadline) {
    const now = new Date()
    const deadline = new Date(job.deadline)
    const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    if (hoursUntilDeadline <= 0) urgency += 100 // Overdue
    else if (hoursUntilDeadline <= 1) urgency += 80
    else if (hoursUntilDeadline <= 2) urgency += 60
    else if (hoursUntilDeadline <= 4) urgency += 40
    else if (hoursUntilDeadline <= 8) urgency += 20
  }

  // Checkout deadline urgency
  if (job.bookingRef?.checkOutDate) {
    const checkoutDate = new Date(job.bookingRef.checkOutDate)
    const now = new Date()
    const hoursUntilCheckout = (checkoutDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    if (hoursUntilCheckout <= 2) urgency += 60 // Critical checkout window
    else if (hoursUntilCheckout <= 4) urgency += 40
    else if (hoursUntilCheckout <= 8) urgency += 20
  }

  return Math.min(100, urgency)
}

/**
 * Calculate revenue impact and financial risk
 */
function calculateRevenueImpact(job: JobData): number {
  let impact = 0

  // Booking value impact
  if (job.bookingRef?.totalAmount) {
    const amount = job.bookingRef.totalAmount
    if (amount >= 10000) impact += 100 // Premium booking
    else if (amount >= 7500) impact += 80
    else if (amount >= 5000) impact += 60
    else if (amount >= 3000) impact += 40
    else if (amount >= 1500) impact += 20
  }

  // Job type revenue impact
  const highRevenueTypes = ['cleaning', 'maintenance', 'setup']
  if (highRevenueTypes.some(type => job.jobType.toLowerCase().includes(type))) {
    impact += 30
  }

  // Repeat guest bonus (would need guest history data)
  // For now, assume 10% of guests are repeat customers
  if (Math.random() < 0.1) {
    impact += 20
  }

  return Math.min(100, impact)
}

/**
 * Calculate guest experience impact
 */
function calculateGuestImpact(job: JobData): number {
  let impact = 0

  // VIP guest detection (would need guest profile data)
  // For now, use booking amount as proxy
  if (job.bookingRef?.totalAmount && job.bookingRef.totalAmount > 8000) {
    impact += 50 // VIP guest
  }

  // Guest arrival/departure impact
  if (job.bookingRef) {
    const now = new Date()
    const checkin = new Date(job.bookingRef.checkInDate)
    const checkout = new Date(job.bookingRef.checkOutDate)
    
    // Jobs affecting guest arrival
    if (Math.abs(checkin.getTime() - now.getTime()) < 4 * 60 * 60 * 1000) {
      impact += 40
    }
    
    // Jobs affecting guest departure
    if (Math.abs(checkout.getTime() - now.getTime()) < 2 * 60 * 60 * 1000) {
      impact += 60
    }
  }

  // Special request impact
  if (job.specialInstructions && job.specialInstructions.length > 50) {
    impact += 20 // Complex special requests
  }

  return Math.min(100, impact)
}

/**
 * Calculate dependency impact on other jobs
 */
function calculateDependencyImpact(job: JobData, allJobs: JobData[]): number {
  let impact = 0

  // Jobs that block other jobs (e.g., cleaning before check-in)
  const blockingTypes = ['cleaning', 'maintenance', 'repair']
  if (blockingTypes.some(type => job.jobType.toLowerCase().includes(type))) {
    // Count dependent jobs at same property
    const dependentJobs = allJobs.filter(otherJob => 
      otherJob.id !== job.id &&
      otherJob.propertyRef.id === job.propertyRef.id &&
      new Date(otherJob.scheduledDate.toDate ? otherJob.scheduledDate.toDate() : otherJob.scheduledDate) > 
      new Date(job.scheduledDate.toDate ? job.scheduledDate.toDate() : job.scheduledDate)
    )
    
    impact += Math.min(50, dependentJobs.length * 15)
  }

  // Critical path jobs (setup before events, cleaning before checkin)
  if (job.jobType.toLowerCase().includes('setup') || 
      job.jobType.toLowerCase().includes('preparation')) {
    impact += 40
  }

  return Math.min(100, impact)
}

/**
 * Calculate resource availability impact
 */
function calculateResourceAvailability(job: JobData, allJobs: JobData[]): number {
  let availability = 100 // Start with full availability

  // Staff workload impact
  if (job.assignedStaffId) {
    const staffJobs = allJobs.filter(otherJob => 
      otherJob.assignedStaffId === job.assignedStaffId &&
      otherJob.status !== 'completed' &&
      otherJob.status !== 'cancelled'
    )
    
    // Reduce availability based on staff workload
    availability -= Math.min(50, (staffJobs.length - 1) * 10)
  }

  // Required skills scarcity
  if (job.requiredSkills && job.requiredSkills.length > 0) {
    const specializedSkills = ['electrical', 'plumbing', 'hvac', 'pool']
    const hasSpecializedSkill = job.requiredSkills.some(skill => 
      specializedSkills.some(specialized => 
        skill.toLowerCase().includes(specialized)
      )
    )
    
    if (hasSpecializedSkill) {
      availability -= 20 // Specialized skills are scarcer
    }
  }

  return Math.max(0, availability)
}

/**
 * Generate human-readable reasoning for priority score
 */
function generateReasoningText(job: JobData, factors: PriorityScore['factors']): string[] {
  const reasoning: string[] = []

  if (factors.timeUrgency > 80) {
    reasoning.push('Critical deadline approaching')
  } else if (factors.timeUrgency > 60) {
    reasoning.push('Time-sensitive task')
  }

  if (factors.revenueImpact > 80) {
    reasoning.push('High-value booking at risk')
  } else if (factors.revenueImpact > 60) {
    reasoning.push('Significant revenue impact')
  }

  if (factors.guestImpact > 70) {
    reasoning.push('Critical for guest experience')
  } else if (factors.guestImpact > 50) {
    reasoning.push('Affects guest satisfaction')
  }

  if (factors.dependencyImpact > 40) {
    reasoning.push('Blocks other critical tasks')
  }

  if (factors.resourceAvailability < 50) {
    reasoning.push('Limited staff availability')
  }

  if (reasoning.length === 0) {
    reasoning.push('Standard priority task')
  }

  return reasoning
}

/**
 * Sort jobs by priority score (highest first)
 */
export function prioritizeJobs(jobs: JobData[]): JobData[] {
  const jobsWithPriority = jobs.map(job => ({
    job,
    priority: calculateJobPriority(job, jobs)
  }))

  return jobsWithPriority
    .sort((a, b) => b.priority.score - a.priority.score)
    .map(item => item.job)
}

/**
 * Calculate revenue at risk for delayed jobs
 */
export function calculateRevenueAtRisk(jobs: JobData[]): number {
  return jobs.reduce((total, job) => {
    if (job.status === 'pending' || job.status === 'assigned') {
      // Jobs not yet started are at risk
      return total + (job.bookingRef?.totalAmount || 0)
    }
    return total
  }, 0)
}
