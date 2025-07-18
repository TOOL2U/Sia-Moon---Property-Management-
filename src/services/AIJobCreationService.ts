import { sanitizeForFirestore } from '@/lib/utils'
import { getDb } from '@/lib/firebase'
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import IntelligentStaffAssignmentService from './IntelligentStaffAssignmentService'
import { MobileNotificationService } from './MobileNotificationService'

/**
 * AI-Powered Job Creation Service
 * Uses OpenAI to intelligently create and assign jobs to staff members
 */
export class AIJobCreationService {
  private static readonly OPENAI_API_URL =
    'https://api.openai.com/v1/chat/completions'

  /**
   * Create an AI-generated job and assign it to the best staff member
   */
  static async createAIJob(
    options: {
      jobType?: 'cleaning' | 'maintenance' | 'inspection' | 'preparation'
      priority?: 'low' | 'medium' | 'high' | 'urgent'
      propertyType?: 'villa' | 'apartment' | 'house'
      urgency?: 'routine' | 'urgent' | 'emergency'
      targetStaffEmail?: string
      customPrompt?: string
    } = {}
  ): Promise<{
    success: boolean
    jobId?: string
    assignedStaffId?: string
    message: string
    aiAnalysis?: any
  }> {
    try {
      console.log('🤖 AI: Starting intelligent job creation...')

      // Step 1: Generate job details using AI
      const jobDetails = await this.generateJobWithAI(options)

      if (!jobDetails.success) {
        return {
          success: false,
          message: `AI job generation failed: ${jobDetails.error}`,
        }
      }

      console.log('✅ AI: Generated job details:', jobDetails.job.title)

      // Step 2: Find the best staff member for this job
      let assignedStaffInfo

      if (options.targetStaffEmail) {
        // Use specific staff member if requested
        assignedStaffInfo = await this.getStaffByEmail(options.targetStaffEmail)
        if (!assignedStaffInfo) {
          return {
            success: false,
            message: `Staff member not found: ${options.targetStaffEmail}`,
          }
        }
      } else {
        // Use AI to find the best staff member
        const staffAssignment = await this.getAIStaffAssignment(jobDetails.job)
        if (
          !staffAssignment.success ||
          staffAssignment.suggestions.length === 0
        ) {
          return {
            success: false,
            message: 'No suitable staff members found for this job',
          }
        }

        const bestStaff = staffAssignment.suggestions[0]
        assignedStaffInfo = await this.getStaffById(bestStaff.staffId)

        if (!assignedStaffInfo) {
          return {
            success: false,
            message: 'Selected staff member not found',
          }
        }
      }

      console.log(
        `👤 AI: Selected staff member: ${assignedStaffInfo.name} (${assignedStaffInfo.email})`
      )

      // Step 3: Create the job document
      const jobId = await this.createJobDocument(
        jobDetails.job,
        assignedStaffInfo
      )

      // Step 4: Update job status to trigger notifications
      await this.updateJobToAssigned(jobId)

      // Step 5: Create mobile notification
      await this.createMobileNotification(
        jobId,
        jobDetails.job,
        assignedStaffInfo
      )

      console.log('🎉 AI: Job creation and assignment completed successfully!')

      return {
        success: true,
        jobId: jobId,
        assignedStaffId: assignedStaffInfo.userId,
        message: `AI successfully created and assigned job "${jobDetails.job.title}" to ${assignedStaffInfo.name}`,
        aiAnalysis: {
          jobGeneration: jobDetails.analysis,
          staffAssignment: assignedStaffInfo,
        },
      }
    } catch (error) {
      console.error('❌ AI: Error in job creation:', error)
      return {
        success: false,
        message: `AI job creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  /**
   * Generate job details using OpenAI
   */
  private static async generateJobWithAI(options: any): Promise<{
    success: boolean
    job?: any
    analysis?: any
    error?: string
  }> {
    let aiResponse = ''

    try {
      const prompt = this.buildJobGenerationPrompt(options)
      aiResponse = await this.callOpenAI(prompt)

      // Clean the AI response - remove markdown code blocks if present
      let cleanedResponse = aiResponse.trim()

      // Remove ```json and ``` if present
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse
          .replace(/^```json\s*/, '')
          .replace(/\s*```$/, '')
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse
          .replace(/^```\s*/, '')
          .replace(/\s*```$/, '')
      }

      console.log(
        '🤖 AI: Cleaned response:',
        cleanedResponse.substring(0, 200) + '...'
      )

      const jobData = JSON.parse(cleanedResponse)

      // Enhance with system data
      const enhancedJob = this.enhanceJobWithSystemData(jobData, options)

      return {
        success: true,
        job: enhancedJob,
        analysis: jobData.analysis,
      }
    } catch (error) {
      console.error('❌ AI: Error generating job:', error)

      // If it's a JSON parse error, log the actual response
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        console.error('❌ AI: Failed to parse JSON. Raw AI response was:')
        console.error('---START AI RESPONSE---')
        console.error(aiResponse || 'No response received')
        console.error('---END AI RESPONSE---')
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Build the AI prompt for job generation
   */
  private static buildJobGenerationPrompt(options: any): string {
    const currentDate = new Date().toISOString().split('T')[0]
    const currentTime = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    })

    return `You are an AI Property Management Assistant for Sia Moon. Create a realistic job assignment for villa property management.

CONTEXT:
- Current Date: ${currentDate}
- Current Time: ${currentTime}
- Job Type: ${options.jobType || 'cleaning'}
- Priority: ${options.priority || 'medium'}
- Property Type: ${options.propertyType || 'villa'}
- Urgency: ${options.urgency || 'routine'}
- Custom Requirements: ${options.customPrompt || 'Standard job requirements'}

TASK: Generate a comprehensive job assignment that includes:

1. Job title (be specific and professional)
2. Detailed description (what needs to be done)
3. Required skills and qualifications
4. Estimated duration in minutes
5. Special instructions
6. Priority level and reasoning
7. Scheduling recommendations

REQUIREMENTS:
- Make it realistic for a villa property management company
- Include specific tasks and expectations
- Consider guest turnover, property maintenance, and quality standards
- Add location details for a test villa
- Include any special equipment or supplies needed

RESPONSE FORMAT - RETURN ONLY VALID JSON (NO MARKDOWN, NO CODE BLOCKS):
{
  "title": "Specific job title",
  "description": "Detailed job description",
  "jobType": "${options.jobType || 'cleaning'}",
  "priority": "${options.priority || 'medium'}",
  "estimatedDuration": 120,
  "requiredSkills": ["skill1", "skill2"],
  "specialInstructions": "Specific instructions",
  "location": {
    "address": "123 Test Villa Street, Phuket",
    "coordinates": {"latitude": 7.9519, "longitude": 98.3381},
    "accessInstructions": "Access details",
    "parkingInstructions": "Parking details"
  },
  "requiredSupplies": ["supply1", "supply2"],
  "qualityChecklist": ["check1", "check2"],
  "analysis": {
    "reasoning": "Why this job is needed",
    "urgencyFactors": ["factor1", "factor2"],
    "expectedOutcome": "What should be achieved"
  }
}

IMPORTANT: Return ONLY the JSON object above. Do not wrap it in markdown code blocks or add any other text. Generate a realistic, actionable job assignment now:`
  }

  /**
   * Enhance AI-generated job with system data
   */
  private static enhanceJobWithSystemData(aiJob: any, options: any): any {
    const now = new Date()
    const todayFormatted = now.toISOString().split('T')[0]
    const tomorrowFormatted = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]

    return {
      ...aiJob,
      // System metadata
      id: `ai_job_${Date.now()}`,
      status: 'pending',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),

      // Scheduling
      scheduledDate: todayFormatted,
      scheduledStartTime: '14:00',
      scheduledEndTime: this.calculateEndTime(
        '14:00',
        aiJob.estimatedDuration || 120
      ),
      deadline: tomorrowFormatted,

      // Property details
      property: {
        id: `ai_property_${Date.now()}`,
        name: 'AI Test Villa',
        address: aiJob.location?.address || '123 AI Test Villa Street, Phuket',
        coordinates: aiJob.location?.coordinates || {
          latitude: 7.9519,
          longitude: 98.3381,
        },
        accessInstructions:
          aiJob.location?.accessInstructions ||
          'AI-generated access instructions',
        parkingInstructions:
          aiJob.location?.parkingInstructions || 'Parking available in front',
      },

      // Booking context
      booking: {
        id: `ai_booking_${Date.now()}`,
        guestName: 'AI Test Guest',
        guestCount: 4,
        checkInDate: todayFormatted,
        checkOutDate: tomorrowFormatted,
      },

      // AI metadata
      aiGenerated: true,
      aiModel: 'gpt-4-turbo',
      aiPromptOptions: sanitizeForFirestore(options),
      aiGeneratedAt: now.toISOString(),

      // Mobile optimization
      mobileOptimized: {
        essentialData: {
          title: `🤖 AI JOB: ${aiJob.title}`,
          address:
            aiJob.location?.address || '123 AI Test Villa Street, Phuket',
          scheduledTime: '14:00',
          priority: aiJob.priority || 'medium',
        },
      },

      // Notification flags
      notificationSent: true,
      mobileNotificationPending: true,
    }
  }

  /**
   * Calculate end time based on start time and duration
   */
  private static calculateEndTime(
    startTime: string,
    durationMinutes: number
  ): string {
    const [hours, minutes] = startTime.split(':').map(Number)
    const startDate = new Date()
    startDate.setHours(hours, minutes, 0, 0)

    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000)

    return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`
  }

  /**
   * Call OpenAI API
   */
  private static async callOpenAI(prompt: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const response = await fetch(this.OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText}`
      )
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || ''
  }

  /**
   * Get AI staff assignment suggestions
   */
  private static async getAIStaffAssignment(jobData: any) {
    return await IntelligentStaffAssignmentService.getAssignmentSuggestions({
      propertyName: jobData.property?.name || 'AI Test Villa',
      startDate: jobData.scheduledDate,
      endDate: jobData.deadline,
      priority: jobData.priority,
      requiredSkills: jobData.requiredSkills || [],
      estimatedDuration: jobData.estimatedDuration || 120,
      location: jobData.location,
    })
  }

  /**
   * Get staff member by email
   */
  private static async getStaffByEmail(email: string) {
    // For the test, return the known test staff
    if (email === 'staff@siamoon.com') {
      return {
        id: 'IDJrsXWiL2dCHVpveH97',
        userId: 'gTtR5gSKOtUEweLwchSnVreylMy1',
        name: 'Staff Member',
        email: 'staff@siamoon.com',
        role: 'cleaner',
      }
    }
    return null
  }

  /**
   * Get staff member by ID
   */
  private static async getStaffById(staffId: string) {
    // For the test, return the known test staff
    return {
      id: staffId,
      userId: 'gTtR5gSKOtUEweLwchSnVreylMy1',
      name: 'AI Selected Staff',
      email: 'staff@siamoon.com',
      role: 'cleaner',
    }
  }

  /**
   * Create job document in Firestore
   */
  private static async createJobDocument(
    jobData: any,
    staffInfo: any
  ): Promise<string> {
    const db = getDb()

    const jobDocument = {
      ...jobData,
      // Staff assignment
      assignedStaffId: staffInfo.userId, // Firebase UID for mobile app
      assignedStaffDocId: staffInfo.id,
      userId: staffInfo.userId, // Legacy field
      assignedStaffRef: {
        id: staffInfo.id,
        firebaseUid: staffInfo.userId,
        name: staffInfo.name,
        role: staffInfo.role,
      },

      // Assignment metadata
      assignedAt: serverTimestamp(),
      assignedBy: {
        id: 'ai-system',
        name: 'AI Job Creation System',
      },

      // Status tracking
      statusHistory: [
        {
          status: 'pending',
          timestamp: new Date().toISOString(),
          updatedBy: 'ai-system',
          notes: 'AI-generated job created and assigned',
        },
      ],
    }

    const jobRef = await addDoc(collection(db, 'jobs'), sanitizeForFirestore(jobDocument))
    console.log(`💾 AI: Job document created with ID: ${jobRef.id}`)

    return jobRef.id
  }

  /**
   * Update job status to assigned to trigger notifications
   */
  private static async updateJobToAssigned(jobId: string): Promise<void> {
    const db = getDb()
    await updateDoc(doc(db, 'jobs', jobId), {
      status: 'assigned',
      assignedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    console.log(`📝 AI: Job ${jobId} status updated to 'assigned'`)
  }

  /**
   * Create mobile notification for the assigned staff
   */
  private static async createMobileNotification(
    jobId: string,
    jobData: any,
    staffInfo: any
  ): Promise<void> {
    try {
      const notificationResult =
        await MobileNotificationService.createJobNotification(
          staffInfo.userId, // Firebase UID
          jobId,
          {
            ...jobData,
            title: `🤖 AI JOB: ${jobData.title}`,
            description: `AI-generated job: ${jobData.description}`,
            specialInstructions: `${jobData.specialInstructions}\n\n🤖 This job was intelligently created and assigned by AI.`,
          },
          'job_assigned'
        )

      if (notificationResult.success) {
        console.log(
          `📱 AI: Mobile notification created: ${notificationResult.notificationId}`
        )
      } else {
        console.warn(
          `⚠️ AI: Mobile notification failed: ${notificationResult.message}`
        )
      }
    } catch (error) {
      console.warn('⚠️ AI: Failed to create mobile notification:', error)
    }
  }
}

export default AIJobCreationService
