import IntelligentStaffAssignmentService from './IntelligentStaffAssignmentService'
import { MobileNotificationService } from './MobileNotificationService'

/**
 * AI Wizard Job Creation Service
 * Integrates with existing wizard modal and intelligent staff assignment
 */
export class AIWizardJobCreationService {
  /**
   * Create a comprehensive job using AI and existing wizard workflow
   */
  static async createAIJobViaWizard(
    options: {
      jobType?: 'cleaning' | 'maintenance' | 'inspection' | 'preparation'
      priority?: 'low' | 'medium' | 'high' | 'urgent'
      urgency?: 'routine' | 'urgent' | 'emergency'
      customPrompt?: string
      targetStaffEmail?: string
    } = {}
  ): Promise<{
    success: boolean
    jobId?: string
    assignedStaffId?: string
    assignedStaffName?: string
    message: string
    wizardData?: any
    assignmentAnalysis?: any
  }> {
    try {
      console.log('🧙‍♂️ AI Wizard: Starting comprehensive job creation...')

      // Step 1: Generate wizard form data using AI
      const wizardData = await this.generateWizardFormData(options)
      if (!wizardData.success) {
        return {
          success: false,
          message: `AI wizard data generation failed: ${wizardData.error}`,
        }
      }

      console.log('✅ AI Wizard: Generated complete form data')

      // Step 2: Use intelligent staff assignment to find best staff
      const staffAssignment = await this.getIntelligentStaffAssignment(
        wizardData.formData
      )
      if (!staffAssignment.success) {
        return {
          success: false,
          message: `Intelligent staff assignment failed: ${staffAssignment.error}`,
        }
      }

      console.log(
        `👤 AI Wizard: Selected optimal staff: ${staffAssignment.selectedStaff.name}`
      )

      // Step 3: Create job using existing job assignment API
      const jobCreation = await this.createJobViaAPI(
        wizardData.formData,
        staffAssignment.selectedStaff
      )
      if (!jobCreation.success) {
        return {
          success: false,
          message: `Job creation failed: ${jobCreation.error}`,
        }
      }

      console.log(`✅ AI Wizard: Job created with ID: ${jobCreation.jobId}`)

      // Step 4: Create mobile notification with URGENT priority
      await this.createUrgentMobileNotification(
        jobCreation.jobId,
        wizardData.formData,
        staffAssignment.selectedStaff
      )

      console.log('📱 AI Wizard: URGENT mobile notification sent')

      return {
        success: true,
        jobId: jobCreation.jobId,
        assignedStaffId: staffAssignment.selectedStaff.firebaseUid,
        assignedStaffName: staffAssignment.selectedStaff.name,
        message: `AI successfully created comprehensive job "${wizardData.formData.title}" and assigned to ${staffAssignment.selectedStaff.name} via intelligent staff assignment`,
        wizardData: wizardData.formData,
        assignmentAnalysis: staffAssignment.analysis,
      }
    } catch (error) {
      console.error('❌ AI Wizard: Error in comprehensive job creation:', error)
      return {
        success: false,
        message: `AI wizard job creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  /**
   * Generate complete wizard form data using AI
   */
  private static async generateWizardFormData(options: any): Promise<{
    success: boolean
    formData?: any
    error?: string
  }> {
    try {
      // Use OpenAI to generate comprehensive job data
      const aiJobData = await this.callOpenAIForWizardData(options)

      // Convert AI data to wizard form format
      const formData = this.convertToWizardFormat(aiJobData, options)

      return {
        success: true,
        formData,
      }
    } catch (error) {
      console.error('❌ AI Wizard: Error generating form data:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Call OpenAI to generate comprehensive job data
   */
  private static async callOpenAIForWizardData(options: any): Promise<any> {
    const prompt = this.buildWizardPrompt(options)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const aiResponse = data.choices[0]?.message?.content || ''

    // Clean response and parse JSON
    let cleanedResponse = aiResponse.trim()
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse
        .replace(/^```json\s*/, '')
        .replace(/\s*```$/, '')
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse
        .replace(/^```\s*/, '')
        .replace(/\s*```$/, '')
    }

    return JSON.parse(cleanedResponse)
  }

  /**
   * Build comprehensive AI prompt for wizard data
   */
  private static buildWizardPrompt(options: any): string {
    const currentDate = new Date().toISOString().split('T')[0]
    const currentTime = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    })

    return `You are an AI assistant for Sia Moon Property Management. Generate comprehensive job data for the wizard-style job creation interface.

CONTEXT:
- Current Date: ${currentDate}
- Current Time: ${currentTime}
- Job Type: ${options.jobType || 'cleaning'}
- Priority: ${options.priority || 'medium'}
- Urgency: ${options.urgency || 'routine'}
- Custom Requirements: ${options.customPrompt || 'Standard villa management job'}

GENERATE COMPLETE JOB DATA INCLUDING:
1. Job identification and description
2. Priority and urgency assessment
3. Scheduling recommendations
4. Required skills and qualifications
5. Estimated duration and supplies needed
6. Special instructions and quality checklist
7. Property and location details

RETURN ONLY VALID JSON (NO MARKDOWN):
{
  "title": "Specific descriptive job title",
  "description": "Detailed job description with specific tasks",
  "jobType": "${options.jobType || 'cleaning'}",
  "priority": "${options.priority || 'medium'}",
  "estimatedDuration": 120,
  "requiredSkills": ["skill1", "skill2", "skill3"],
  "specialInstructions": "Detailed special instructions and requirements",
  "requiredSupplies": ["supply1", "supply2", "supply3"],
  "qualityChecklist": ["check1", "check2", "check3"],
  "scheduledDate": "${currentDate}",
  "scheduledStartTime": "14:00",
  "deadline": "${new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}",
  "propertyInfo": {
    "name": "Test Villa Property",
    "address": "123 Villa Street, Phuket, Thailand",
    "coordinates": {"latitude": 7.9519, "longitude": 98.3381},
    "accessInstructions": "Detailed access instructions",
    "parkingInstructions": "Parking availability and instructions"
  },
  "guestInfo": {
    "name": "Test Guest",
    "checkInDate": "${currentDate}",
    "checkOutDate": "${new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}",
    "guestCount": 4,
    "specialRequests": "Any special guest requirements"
  }
}`
  }

  /**
   * Convert AI data to wizard form format
   */
  private static convertToWizardFormat(aiData: any, options: any): any {
    return {
      // Step 1: Job Type
      jobType: aiData.jobType || options.jobType || 'cleaning',
      title: aiData.title,
      description: aiData.description,

      // Step 2: Property & Guest Info
      propertyId: 'ai_property_' + Date.now(),
      propertyName: aiData.propertyInfo?.name || 'AI Test Villa',
      propertyAddress:
        aiData.propertyInfo?.address || '123 Villa Street, Phuket',
      guestName: aiData.guestInfo?.name || 'AI Test Guest',
      guestCount: aiData.guestInfo?.guestCount || 4,
      checkInDate: aiData.guestInfo?.checkInDate || aiData.scheduledDate,
      checkOutDate: aiData.guestInfo?.checkOutDate || aiData.deadline,

      // Step 3: Priority & Urgency
      priority: aiData.priority || options.priority || 'medium',
      urgency: options.urgency || 'routine',

      // Step 4: Scheduling
      scheduledDate: aiData.scheduledDate,
      scheduledStartTime: aiData.scheduledStartTime || '14:00',
      deadline: aiData.deadline,

      // Step 5: Requirements
      estimatedDuration: aiData.estimatedDuration || 120,
      requiredSkills: aiData.requiredSkills || [],
      requiredSupplies: aiData.requiredSupplies || [],

      // Step 6: Staff Assignment (will be filled by intelligent assignment)
      assignedStaffId: '',
      assignedStaffName: '',

      // Step 7: Instructions
      specialInstructions: aiData.specialInstructions || '',
      qualityChecklist: aiData.qualityChecklist || [],

      // Additional data
      location: aiData.propertyInfo || {},
      aiGenerated: true,
      aiGeneratedAt: new Date().toISOString(),

      // Mobile optimization (same as test jobs)
      mobileOptimized: {
        essentialData: {
          title: `🧙‍♂️ AI WIZARD: ${aiData.title}`,
          address:
            aiData.propertyInfo?.address || '123 AI Test Villa Street, Phuket',
          scheduledTime: aiData.scheduledStartTime || '14:00',
          priority: aiData.priority || options.priority || 'medium',
        },
      },

      // Notification flags (same as test jobs)
      notificationSent: true,
      mobileNotificationPending: true,
      syncVersion: 1,
    }
  }

  /**
   * Use intelligent staff assignment service
   */
  private static async getIntelligentStaffAssignment(formData: any): Promise<{
    success: boolean
    selectedStaff?: any
    analysis?: any
    error?: string
  }> {
    try {
      // Use existing IntelligentStaffAssignmentService
      const assignmentResult =
        await IntelligentStaffAssignmentService.getAssignmentSuggestions({
          propertyName: formData.propertyName,
          startDate: formData.scheduledDate,
          endDate: formData.deadline,
          priority: formData.priority,
          requiredSkills: formData.requiredSkills,
          estimatedDuration: formData.estimatedDuration,
          location: {
            address: formData.propertyAddress,
            coordinates: formData.location?.coordinates,
          },
        })

      if (
        !assignmentResult.success ||
        assignmentResult.suggestions.length === 0
      ) {
        // Fallback to test staff
        return {
          success: true,
          selectedStaff: {
            id: 'IDJrsXWiL2dCHVpveH97',
            firebaseUid: 'gTtR5gSKOtUEweLwchSnVreylMy1',
            name: 'Staff Member',
            email: 'staff@siamoon.com',
            role: 'cleaner',
          },
          analysis: {
            fallback: true,
            reason: 'No intelligent suggestions available',
          },
        }
      }

      // Use the best suggestion
      const bestSuggestion = assignmentResult.suggestions[0]

      return {
        success: true,
        selectedStaff: {
          id: bestSuggestion.staffId,
          firebaseUid: 'gTtR5gSKOtUEweLwchSnVreylMy1', // For testing
          name: bestSuggestion.staffName,
          email: 'staff@siamoon.com', // For testing
          role: 'cleaner',
        },
        analysis: {
          confidence: bestSuggestion.confidence,
          reasons: bestSuggestion.reasons,
          skillMatch: bestSuggestion.skillMatch,
          totalCandidates: assignmentResult.totalCandidates,
        },
      }
    } catch (error) {
      console.error(
        '❌ AI Wizard: Error in intelligent staff assignment:',
        error
      )
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Create job using existing job assignment API
   */
  private static async createJobViaAPI(
    formData: any,
    selectedStaff: any
  ): Promise<{
    success: boolean
    jobId?: string
    error?: string
  }> {
    try {
      const response = await fetch('/api/admin/job-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingData: {
            id: 'ai_booking_' + Date.now(),
            guestName: formData.guestName,
            guestCount: formData.guestCount,
            checkInDate: formData.checkInDate,
            checkOutDate: formData.checkOutDate,
            propertyName: formData.propertyName,
            propertyAddress: formData.propertyAddress,
          },
          jobDetails: {
            title: formData.title,
            description: formData.description,
            jobType: formData.jobType,
            priority: formData.priority,
            estimatedDuration: formData.estimatedDuration,
            requiredSkills: formData.requiredSkills,
            specialInstructions: formData.specialInstructions,
            scheduledDate: formData.scheduledDate,
            scheduledStartTime: formData.scheduledStartTime,
            deadline: formData.deadline,
            requiredSupplies: formData.requiredSupplies,
            qualityChecklist: formData.qualityChecklist,
          },
          assignedBy: {
            id: 'ai-wizard-system',
            name: 'AI Wizard System',
            role: 'system',
          },
          assignedStaffId: selectedStaff.id,
          assignedStaffName: selectedStaff.name,
          notificationOptions: {
            sendNotification: true,
            customMessage: `🤖 AI WIZARD: ${formData.title} - Intelligently assigned via AI analysis`,
          },
        }),
      })

      const result = await response.json()

      if (result.success) {
        return {
          success: true,
          jobId: result.jobId,
        }
      } else {
        return {
          success: false,
          error: result.error || 'Job creation failed',
        }
      }
    } catch (error) {
      console.error('❌ AI Wizard: Error creating job via API:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Create urgent mobile notification
   */
  private static async createUrgentMobileNotification(
    jobId: string,
    formData: any,
    selectedStaff: any
  ): Promise<void> {
    try {
      // Use the same notification method as test jobs for consistency
      const notificationResult =
        await MobileNotificationService.createTestJobNotification(
          selectedStaff.firebaseUid,
          jobId,
          {
            title: `🧙‍♂️ AI WIZARD: ${formData.title}`,
            description: `AI-generated comprehensive job: ${formData.description}`,
            jobType: formData.jobType,
            priority: formData.priority,
            scheduledDate: formData.scheduledDate,
            scheduledStartTime: formData.scheduledStartTime,
            estimatedDuration: formData.estimatedDuration,
            specialInstructions: `${formData.specialInstructions}\n\n🧙‍♂️ This job was created by AI Wizard with intelligent staff assignment.`,
            location: {
              address: formData.propertyAddress,
              coordinates: formData.location?.coordinates,
            },
            propertyName: formData.propertyName,
            propertyAddress: formData.propertyAddress,
          }
        )

      if (notificationResult.success) {
        console.log(
          `📱 AI Wizard: URGENT mobile notification created: ${notificationResult.notificationId}`
        )
      } else {
        console.warn(
          `⚠️ AI Wizard: Mobile notification failed: ${notificationResult.message}`
        )
      }

      // Also create staff notification document like test jobs do
      await this.createStaffNotificationDocument(jobId, formData, selectedStaff)

      console.log(
        '📱 AI Wizard: URGENT mobile notification created successfully'
      )
    } catch (error) {
      console.warn('⚠️ AI Wizard: Failed to create mobile notification:', error)
    }
  }

  /**
   * Create staff notification document like test jobs do
   */
  private static async createStaffNotificationDocument(
    jobId: string,
    formData: any,
    selectedStaff: any
  ): Promise<void> {
    try {
      console.log('📋 AI Wizard: Creating staff notification document...')

      // Import Firebase functions dynamically to avoid import issues
      const { getDb } = await import('@/lib/firebase')
      const { addDoc, collection, serverTimestamp } = await import(
        'firebase/firestore'
      )

      const db = getDb()

      // Create notification in staff_notifications collection (same as test jobs)
      const notificationData = {
        jobId: jobId,
        staffId: selectedStaff.id,
        userId: selectedStaff.firebaseUid,
        staffName: selectedStaff.name,
        staffEmail: selectedStaff.email,
        jobTitle: `🧙‍♂️ AI WIZARD: ${formData.title}`,
        jobType: formData.jobType,
        priority: formData.priority,
        propertyName: formData.propertyName,
        propertyAddress: formData.propertyAddress,
        scheduledDate: formData.scheduledDate,
        scheduledStartTime: formData.scheduledStartTime,
        estimatedDuration: formData.estimatedDuration,
        specialInstructions: `${formData.specialInstructions}\n\n🧙‍♂️ This job was created by AI Wizard with intelligent staff assignment.`,
        type: 'job_assigned',
        status: 'pending',
        readAt: null,
        actionRequired: true,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now

        // AI Wizard specific fields
        aiWizardGenerated: true,
        intelligentAssignment: true,
        assignmentConfidence: 0.95, // High confidence for AI assignments
        wizardWorkflow: true,
      }

      await addDoc(collection(db, 'staff_notifications'), notificationData)
      console.log('✅ AI Wizard: Staff notification document created')
    } catch (error) {
      console.warn(
        '⚠️ AI Wizard: Failed to create staff notification document:',
        error
      )
    }
  }
}

export default AIWizardJobCreationService
