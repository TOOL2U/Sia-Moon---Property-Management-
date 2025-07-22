import { getDb } from '@/lib/firebase'
import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore'

/**
 * Test Job Session Service for AI Audit System Integration
 * Creates realistic job session data that flows from job creation to completion
 */

export interface TestJobSessionData {
  // Core identifiers
  jobId: string
  staffId: string
  sessionId: string

  // Performance timing
  startTime: string
  endTime: string
  totalDuration: number // minutes

  // Location verification
  startLocation: {
    latitude: number
    longitude: number
    accuracy: number
    timestamp: string
  }
  endLocation: {
    latitude: number
    longitude: number
    accuracy: number
    timestamp: string
  }

  // Task execution metrics (enhanced with requirements)
  checklistData: Array<{
    id: string
    title: string
    required: boolean
    completed: boolean
    completedAt?: string
    notes?: string
    category?: 'safety' | 'cleaning' | 'maintenance' | 'inspection' | 'photo' | 'other'
    estimatedTime?: number
  }>

  // Property requirements completion
  requirementsCompletion: Array<{
    requirementId: string
    description: string
    category: 'safety' | 'cleaning' | 'maintenance' | 'inspection' | 'photo' | 'other'
    isRequired: boolean
    isCompleted: boolean
    completedAt?: string
    photos: string[]
    notes: string
    estimatedTime?: number
    actualTime?: number
  }>

  // Documentation quality
  photos: Record<string, {
    id: string
    filename: string
    timestamp: string
    description: string
  }>
  notes: string[]

  // Calculated performance metrics
  checklistCompletionRate: number
  requiredTasksCompleted: boolean
  photoCount: number
  noteCount: number

  // Context for analysis
  jobDetails: {
    title: string
    description: string
    category: string
    priority: string
    estimatedDuration: number
    specialInstructions?: string
  }

  staffDetails: {
    staffId: string
    name: string
    role: string
    department: string
  }

  // Legacy compatibility
  status: 'completed' | 'in_progress' | 'paused'
  createdAt: any
  updatedAt: any
}

export class TestJobSessionService {
  private static db = getDb()

  /**
   * Create a complete job workflow: Job creation → Job session completion
   */
  static async createCompleteJobWorkflow(staffId: string, staffName: string, options?: {
    jobType?: 'cleaning' | 'maintenance' | 'inspection'
    performance?: 'excellent' | 'good' | 'average' | 'poor'
    duration?: number
    location?: { lat: number; lng: number }
  }) {
    try {
      console.log(`🔄 Creating complete job workflow for ${staffName}...`)

      const jobType = options?.jobType || 'cleaning'
      const performance = options?.performance || 'excellent'
      const baseDuration = options?.duration || 90
      const location = options?.location || { lat: 9.7108, lng: 100.0136 }

      // Step 1: Create initial job (matching TEST_JOB_INTEGRATION.md schema)
      const jobId = `test_job_${Date.now()}`
      const job = await this.createInitialJob(jobId, staffId, jobType, location)

      // Step 2: Simulate job session completion
      const sessionData = await this.createJobSessionCompletion(
        jobId,
        staffId,
        staffName,
        jobType,
        performance,
        baseDuration,
        location
      )

      console.log(`✅ Complete job workflow created:`)
      console.log(`   Job ID: ${jobId}`)
      console.log(`   Session ID: ${sessionData.sessionId}`)
      console.log(`   Performance: ${performance}`)
      console.log(`   Duration: ${sessionData.totalDuration} minutes`)

      return {
        success: true,
        jobId,
        sessionId: sessionData.sessionId,
        performanceScore: this.calculatePerformanceScore(sessionData),
        data: sessionData
      }

    } catch (error) {
      console.error('❌ Error creating complete job workflow:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Create initial job (compatible with mobile app schema)
   */
  private static async createInitialJob(
    jobId: string,
    staffId: string,
    jobType: string,
    location: { lat: number; lng: number }
  ) {
    const jobData = {
      id: jobId,
      assignedStaffId: staffId,
      status: 'pending' as const,
      propertyId: 'test_property_001',
      bookingId: `booking_${Date.now()}`,
      title: this.getJobTitle(jobType),
      description: this.getJobDescription(jobType),
      startTime: new Date().toISOString(),
      location: {
        lat: location.lat,
        lng: location.lng
      },
      photos: [],
      createdAt: serverTimestamp()
    }

    // Create job in /jobs collection (for mobile app)
    await setDoc(doc(this.db, 'jobs', jobId), jobData)

    console.log(`📱 Initial job created in /jobs collection: ${jobId}`)
    return jobData
  }

  /**
   * Create job session completion data (for AI audit system)
   */
  private static async createJobSessionCompletion(
    jobId: string,
    staffId: string,
    staffName: string,
    jobType: string,
    performance: string,
    baseDuration: number,
    location: { lat: number; lng: number }
  ): Promise<TestJobSessionData> {

    const now = new Date()
    const startTime = new Date(now.getTime() - (baseDuration * 60 * 1000))
    const endTime = now

    // Adjust performance based on quality level
    const performanceMultipliers = {
      excellent: { completion: 1.0, duration: 0.9, photos: 1.2, notes: 1.1 },
      good: { completion: 0.95, duration: 1.0, photos: 1.0, notes: 1.0 },
      average: { completion: 0.85, duration: 1.1, photos: 0.8, notes: 0.9 },
      poor: { completion: 0.7, duration: 1.3, photos: 0.6, notes: 0.7 }
    }

    const multiplier = performanceMultipliers[performance as keyof typeof performanceMultipliers]
    const actualDuration = Math.round(baseDuration * multiplier.duration)

    const sessionData: TestJobSessionData = {
      jobId,
      staffId,
      sessionId: `session_${Date.now()}`,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      totalDuration: actualDuration,

      startLocation: {
        latitude: location.lat + (Math.random() - 0.5) * 0.001,
        longitude: location.lng + (Math.random() - 0.5) * 0.001,
        accuracy: 5.0,
        timestamp: startTime.toISOString()
      },
      endLocation: {
        latitude: location.lat + (Math.random() - 0.5) * 0.001,
        longitude: location.lng + (Math.random() - 0.5) * 0.001,
        accuracy: 3.0,
        timestamp: endTime.toISOString()
      },

      checklistData: this.generateChecklistData(jobType, multiplier.completion),
      requirementsCompletion: this.generateRequirementsCompletion(jobType, multiplier.completion, startTime),
      photos: this.generatePhotoData(Math.round(3 * multiplier.photos), startTime),
      notes: this.generateNotes(Math.round(3 * multiplier.notes), jobType, performance),

      checklistCompletionRate: Math.round(100 * multiplier.completion),
      requiredTasksCompleted: multiplier.completion >= 0.8,
      photoCount: Math.round(3 * multiplier.photos),
      noteCount: Math.round(3 * multiplier.notes),

      jobDetails: {
        title: this.getJobTitle(jobType),
        description: this.getJobDescription(jobType),
        category: jobType,
        priority: 'high',
        estimatedDuration: baseDuration,
        specialInstructions: this.getSpecialInstructions(jobType)
      },

      staffDetails: {
        staffId,
        name: staffName,
        role: this.getStaffRole(jobType),
        department: this.getDepartment(jobType)
      },

      status: 'completed',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }

    // Store in job_sessions collection (for AI audit)
    await addDoc(collection(this.db, 'job_sessions'), sessionData)

    console.log(`🤖 Job session created in /job_sessions collection: ${sessionData.sessionId}`)
    return sessionData
  }

  /**
   * Create test scenarios for different staff and job types
   */
  static async createTestScenarios() {
    const scenarios = [
      { staffId: 'gTtR5gSKOtUEweLwchSnVreylMy1', staffName: 'Staff Member', jobType: 'cleaning', performance: 'excellent' },
      { staffId: 'VPPtbGl8WhMicZURHOgQ9BUzJd02', staffName: 'Admin User', jobType: 'maintenance', performance: 'good' },
      { staffId: 'gTtR5gSKOtUEweLwchSnVreylMy1', staffName: 'Staff Member', jobType: 'inspection', performance: 'average' }
    ]

    const results = []
    for (const scenario of scenarios) {
      const result = await this.createCompleteJobWorkflow(
        scenario.staffId,
        scenario.staffName,
        {
          jobType: scenario.jobType as any,
          performance: scenario.performance as any,
          duration: 60 + Math.random() * 60 // 60-120 minutes
        }
      )
      results.push(result)

      // Wait between scenarios
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    return results
  }

  // Helper methods for generating realistic data
  private static getJobTitle(jobType: string): string {
    const titles = {
      cleaning: 'Villa Deep Clean Service',
      maintenance: 'Property Maintenance Check',
      inspection: 'Quality Inspection Review'
    }
    return titles[jobType as keyof typeof titles] || 'General Service'
  }

  private static getJobDescription(jobType: string): string {
    const descriptions = {
      cleaning: 'Complete deep cleaning service for luxury villa including all rooms, bathrooms, and common areas',
      maintenance: 'Comprehensive maintenance check including plumbing, electrical, and general repairs',
      inspection: 'Quality assurance inspection to ensure property meets standards'
    }
    return descriptions[jobType as keyof typeof descriptions] || 'General service task'
  }

  private static getSpecialInstructions(jobType: string): string {
    const instructions = {
      cleaning: 'Pay special attention to guest bathrooms and kitchen areas',
      maintenance: 'Check all electrical outlets and water pressure',
      inspection: 'Document any issues found with photos and detailed notes'
    }
    return instructions[jobType as keyof typeof instructions] || 'Follow standard procedures'
  }

  private static getStaffRole(jobType: string): string {
    const roles = {
      cleaning: 'Housekeeper',
      maintenance: 'Maintenance Tech',
      inspection: 'Quality Inspector'
    }
    return roles[jobType as keyof typeof roles] || 'Staff'
  }

  private static getDepartment(jobType: string): string {
    const departments = {
      cleaning: 'Housekeeping',
      maintenance: 'Maintenance',
      inspection: 'Quality Assurance'
    }
    return departments[jobType as keyof typeof departments] || 'Operations'
  }

  private static generateRequirementsCompletion(
    jobType: string,
    completionRate: number,
    startTime: Date
  ) {
    const requirementTemplates = {
      cleaning: [
        {
          requirementId: 'safety_walkthrough',
          description: 'Complete safety walkthrough of property',
          category: 'safety' as const,
          isRequired: true,
          estimatedTime: 10
        },
        {
          requirementId: 'before_photos',
          description: 'Take before photos of all rooms',
          category: 'photo' as const,
          isRequired: true,
          estimatedTime: 5
        },
        {
          requirementId: 'bathroom_cleaning',
          description: 'Clean all bathrooms thoroughly',
          category: 'cleaning' as const,
          isRequired: true,
          estimatedTime: 30
        },
        {
          requirementId: 'vacuum_carpets',
          description: 'Vacuum all carpeted areas',
          category: 'cleaning' as const,
          isRequired: true,
          estimatedTime: 20
        },
        {
          requirementId: 'after_photos',
          description: 'Take after photos of completed work',
          category: 'photo' as const,
          isRequired: true,
          estimatedTime: 5
        }
      ],
      maintenance: [
        {
          requirementId: 'safety_equipment',
          description: 'Check all safety equipment (smoke detectors, fire extinguishers)',
          category: 'safety' as const,
          isRequired: true,
          estimatedTime: 15
        },
        {
          requirementId: 'damage_documentation',
          description: 'Document any damage or issues found',
          category: 'inspection' as const,
          isRequired: true,
          estimatedTime: 10
        },
        {
          requirementId: 'plumbing_test',
          description: 'Test all plumbing fixtures',
          category: 'maintenance' as const,
          isRequired: false,
          estimatedTime: 20
        }
      ],
      inspection: [
        {
          requirementId: 'room_inspection',
          description: 'Inspect all rooms for quality standards',
          category: 'inspection' as const,
          isRequired: true,
          estimatedTime: 25
        },
        {
          requirementId: 'amenity_check',
          description: 'Check all amenities and equipment',
          category: 'inspection' as const,
          isRequired: true,
          estimatedTime: 15
        },
        {
          requirementId: 'photo_documentation',
          description: 'Photo documentation of findings',
          category: 'photo' as const,
          isRequired: true,
          estimatedTime: 10
        }
      ]
    }

    const templates = requirementTemplates[jobType as keyof typeof requirementTemplates] || requirementTemplates.cleaning
    const completedCount = Math.floor(templates.length * completionRate)

    return templates.map((template, index) => {
      const isCompleted = index < completedCount
      const completedAt = isCompleted
        ? new Date(startTime.getTime() + (index + 1) * 15 * 60 * 1000).toISOString()
        : undefined

      return {
        ...template,
        isCompleted,
        completedAt,
        photos: isCompleted && template.category === 'photo' ? [`photo_${template.requirementId}_1`, `photo_${template.requirementId}_2`] : [],
        notes: isCompleted ? `${template.description} completed successfully` : '',
        actualTime: isCompleted ? Math.round((template.estimatedTime || 10) * (0.8 + Math.random() * 0.4)) : undefined
      }
    })
  }

  private static generateChecklistData(jobType: string, completionRate: number) {
    const checklists = {
      cleaning: [
        { id: 'clean_bathrooms', title: 'Clean all bathrooms', required: true },
        { id: 'vacuum_rooms', title: 'Vacuum all rooms', required: true },
        { id: 'kitchen_clean', title: 'Clean kitchen thoroughly', required: true },
        { id: 'restock_supplies', title: 'Restock amenities', required: false }
      ],
      maintenance: [
        { id: 'check_plumbing', title: 'Check plumbing systems', required: true },
        { id: 'test_electrical', title: 'Test electrical outlets', required: true },
        { id: 'inspect_hvac', title: 'Inspect HVAC system', required: true },
        { id: 'check_safety', title: 'Safety equipment check', required: false }
      ],
      inspection: [
        { id: 'room_inspection', title: 'Inspect all rooms', required: true },
        { id: 'amenity_check', title: 'Check amenities', required: true },
        { id: 'cleanliness_review', title: 'Cleanliness review', required: true },
        { id: 'photo_documentation', title: 'Photo documentation', required: false }
      ]
    }

    const tasks = checklists[jobType as keyof typeof checklists] || checklists.cleaning
    const completedCount = Math.floor(tasks.length * completionRate)

    return tasks.map((task, index) => ({
      ...task,
      completed: index < completedCount,
      completedAt: index < completedCount ? new Date(Date.now() - (tasks.length - index) * 10 * 60 * 1000).toISOString() : undefined,
      notes: index < completedCount ? 'Completed successfully' : undefined
    }))
  }

  private static generatePhotoData(count: number, startTime: Date) {
    const photos: Record<string, any> = {}
    for (let i = 0; i < count; i++) {
      const photoId = `photo_${i + 1}`
      photos[photoId] = {
        id: photoId,
        filename: `job_${Date.now()}_${i + 1}`,
        timestamp: new Date(startTime.getTime() + i * 20 * 60 * 1000).toISOString(),
        description: `Work progress photo ${i + 1}`
      }
    }
    return photos
  }

  private static generateNotes(count: number, jobType: string, performance: string): string[] {
    const noteTemplates = {
      excellent: [
        'Job completed ahead of schedule with exceptional quality',
        'All requirements exceeded expectations',
        'Client will be very satisfied with the results'
      ],
      good: [
        'Job completed on time with good quality',
        'All requirements met successfully',
        'Standard procedures followed correctly'
      ],
      average: [
        'Job completed with acceptable quality',
        'Most requirements met adequately',
        'Some minor issues noted for improvement'
      ],
      poor: [
        'Job completed but quality concerns noted',
        'Several requirements not fully met',
        'Requires follow-up and additional training'
      ]
    }

    const templates = noteTemplates[performance as keyof typeof noteTemplates] || noteTemplates.good
    return templates.slice(0, count)
  }

  private static calculatePerformanceScore(sessionData: TestJobSessionData): number {
    const completionWeight = 0.4
    const timeWeight = 0.3
    const documentationWeight = 0.3

    const completionScore = sessionData.checklistCompletionRate
    const timeScore = Math.max(0, 100 - (sessionData.totalDuration - sessionData.jobDetails.estimatedDuration) / sessionData.jobDetails.estimatedDuration * 100)
    const documentationScore = Math.min(100, (sessionData.photoCount * 20) + (sessionData.noteCount * 15))

    return Math.round(
      completionScore * completionWeight +
      timeScore * timeWeight +
      documentationScore * documentationWeight
    )
  }
}
