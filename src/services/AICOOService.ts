import { getDb } from '@/lib/firebase'
import { addDoc, collection, serverTimestamp, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'
import IntelligentStaffAssignmentService from './IntelligentStaffAssignmentService'
import { MobileNotificationService } from './MobileNotificationService'
import { AIWizardJobCreationService } from './AIWizardJobCreationService'

/**
 * AI Chief Operations Officer Service
 * Autonomous property management operations with full transparency
 */
export class AICOOService {
  private static readonly OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
  
  /**
   * AI COO Decision Making Engine
   */
  static async makeOperationalDecision(scenario: {
    type: 'booking' | 'calendar' | 'job_assignment' | 'emergency' | 'performance'
    data: any
    context: any
  }): Promise<{
    success: boolean
    decision: any
    reasoning: string[]
    confidence: number
    actions: any[]
    metrics: any
    recommendations: string[]
  }> {
    try {
      console.log(`🤖 AI COO: Making ${scenario.type} decision...`)
      
      // Generate AI analysis and decision
      const aiAnalysis = await this.generateAIAnalysis(scenario)
      
      // Execute decision actions
      const executionResults = await this.executeDecisionActions(aiAnalysis)
      
      // Log decision for transparency
      await this.logCOODecision(scenario, aiAnalysis, executionResults)
      
      return {
        success: true,
        decision: aiAnalysis.decision,
        reasoning: aiAnalysis.reasoning,
        confidence: aiAnalysis.confidence,
        actions: executionResults.actions,
        metrics: executionResults.metrics,
        recommendations: aiAnalysis.recommendations
      }
      
    } catch (error) {
      console.error('❌ AI COO: Decision making error:', error)
      return {
        success: false,
        decision: null,
        reasoning: [`Error in decision making: ${error instanceof Error ? error.message : 'Unknown error'}`],
        confidence: 0,
        actions: [],
        metrics: {},
        recommendations: []
      }
    }
  }

  /**
   * Generate comprehensive AI analysis for operational decisions
   */
  private static async generateAIAnalysis(scenario: any): Promise<any> {
    const prompt = this.buildCOOPrompt(scenario)
    
    const response = await fetch(this.OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 3000,
        temperature: 0.3 // Lower temperature for more consistent decisions
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const aiResponse = data.choices[0]?.message?.content || ''
    
    // Clean and parse response
    let cleanedResponse = aiResponse.trim()
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }
    
    return JSON.parse(cleanedResponse)
  }

  /**
   * Build comprehensive COO decision prompt
   */
  private static buildCOOPrompt(scenario: any): string {
    const currentDateTime = new Date().toISOString()
    
    return `You are an AI Chief Operations Officer for Sia Moon Property Management. Make a comprehensive operational decision for the following scenario.

SCENARIO TYPE: ${scenario.type}
CURRENT DATE/TIME: ${currentDateTime}
SCENARIO DATA: ${JSON.stringify(scenario.data, null, 2)}
CONTEXT: ${JSON.stringify(scenario.context, null, 2)}

As the AI COO, analyze this scenario and make operational decisions considering:

1. BUSINESS IMPACT: Revenue, costs, guest satisfaction, operational efficiency
2. RISK ASSESSMENT: Potential issues, mitigation strategies, contingency plans
3. RESOURCE OPTIMIZATION: Staff allocation, scheduling, equipment usage
4. GUEST EXPERIENCE: Service quality, communication, satisfaction metrics
5. OPERATIONAL EXCELLENCE: Process efficiency, quality standards, compliance
6. STRATEGIC ALIGNMENT: Long-term goals, brand reputation, market positioning

DECISION FRAMEWORK:
- Analyze all available data points
- Consider multiple decision options
- Evaluate pros/cons of each option
- Select optimal decision with clear reasoning
- Define specific action steps
- Identify success metrics
- Provide improvement recommendations

RETURN ONLY VALID JSON:
{
  "decision": {
    "action": "specific_action_to_take",
    "outcome": "expected_result",
    "timeline": "execution_timeframe",
    "priority": "low|medium|high|urgent"
  },
  "reasoning": [
    "Primary reason for this decision",
    "Supporting factor 1",
    "Supporting factor 2",
    "Risk mitigation consideration"
  ],
  "confidence": 0.95,
  "analysis": {
    "businessImpact": "Impact on revenue/operations",
    "riskAssessment": "Identified risks and mitigation",
    "resourceRequirements": "Staff/equipment needed",
    "guestImpact": "Effect on guest experience",
    "alternatives": "Other options considered"
  },
  "actionPlan": [
    {
      "step": 1,
      "action": "Immediate action to take",
      "responsible": "who_executes",
      "timeline": "when_to_complete",
      "success_criteria": "how_to_measure_success"
    }
  ],
  "metrics": {
    "kpi1": "value_to_track",
    "kpi2": "another_metric",
    "successThreshold": "minimum_acceptable_outcome"
  },
  "recommendations": [
    "Process improvement suggestion 1",
    "Optimization opportunity 2",
    "Strategic recommendation 3"
  ],
  "contingencyPlan": {
    "ifFails": "backup_action",
    "escalation": "when_to_escalate",
    "fallback": "alternative_approach"
  }
}`
  }

  /**
   * Execute AI COO decision actions
   */
  private static async executeDecisionActions(aiAnalysis: any): Promise<any> {
    const executionResults = {
      actions: [],
      metrics: {},
      notifications: [],
      updates: []
    }

    try {
      // Execute each action in the action plan
      for (const actionItem of aiAnalysis.actionPlan || []) {
        const actionResult = await this.executeSpecificAction(actionItem, aiAnalysis)
        executionResults.actions.push({
          ...actionItem,
          result: actionResult,
          executedAt: new Date().toISOString()
        })
      }

      // Update metrics
      executionResults.metrics = {
        ...aiAnalysis.metrics,
        executionTime: new Date().toISOString(),
        confidence: aiAnalysis.confidence,
        actionsCompleted: executionResults.actions.length
      }

      return executionResults

    } catch (error) {
      console.error('❌ AI COO: Action execution error:', error)
      return {
        actions: [],
        metrics: { error: error instanceof Error ? error.message : 'Unknown error' },
        notifications: [],
        updates: []
      }
    }
  }

  /**
   * Execute specific action based on type
   */
  private static async executeSpecificAction(actionItem: any, aiAnalysis: any): Promise<any> {
    try {
      switch (actionItem.action?.toLowerCase()) {
        case 'create_job':
          return await this.executeJobCreation(actionItem, aiAnalysis)
        
        case 'assign_staff':
          return await this.executeStaffAssignment(actionItem, aiAnalysis)
        
        case 'send_notification':
          return await this.executeNotification(actionItem, aiAnalysis)
        
        case 'update_calendar':
          return await this.executeCalendarUpdate(actionItem, aiAnalysis)
        
        case 'approve_booking':
          return await this.executeBookingApproval(actionItem, aiAnalysis)
        
        default:
          return {
            success: true,
            message: `Action logged: ${actionItem.action}`,
            type: 'logged_action'
          }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Execute job creation action
   */
  private static async executeJobCreation(actionItem: any, aiAnalysis: any): Promise<any> {
    try {
      const jobResult = await AIWizardJobCreationService.createAIJobViaWizard({
        jobType: actionItem.jobType || 'cleaning',
        priority: aiAnalysis.decision?.priority || 'medium',
        customPrompt: `AI COO Decision: ${actionItem.description || 'Operational job creation'}`
      })

      return {
        success: jobResult.success,
        jobId: jobResult.jobId,
        assignedStaff: jobResult.assignedStaffName,
        message: jobResult.message
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Job creation failed'
      }
    }
  }

  /**
   * Execute staff assignment action
   */
  private static async executeStaffAssignment(actionItem: any, aiAnalysis: any): Promise<any> {
    try {
      const assignmentResult = await IntelligentStaffAssignmentService.getAssignmentSuggestions({
        propertyName: actionItem.property || 'AI COO Property',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: aiAnalysis.decision?.priority || 'medium',
        requiredSkills: actionItem.requiredSkills || [],
        estimatedDuration: actionItem.duration || 120
      })

      return {
        success: assignmentResult.success,
        suggestions: assignmentResult.suggestions,
        totalCandidates: assignmentResult.totalCandidates
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Staff assignment failed'
      }
    }
  }

  /**
   * Execute notification action
   */
  private static async executeNotification(actionItem: any, aiAnalysis: any): Promise<any> {
    try {
      const notificationResult = await MobileNotificationService.createJobNotification(
        'gTtR5gSKOtUEweLwchSnVreylMy1', // Test staff UID
        'ai_coo_' + Date.now(),
        {
          title: `🤖 AI COO: ${actionItem.title || 'Operational Update'}`,
          description: actionItem.message || 'AI COO operational notification',
          priority: aiAnalysis.decision?.priority || 'medium'
        },
        'job_assigned'
      )

      return {
        success: notificationResult.success,
        notificationId: notificationResult.notificationId,
        message: notificationResult.message
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Notification failed'
      }
    }
  }

  /**
   * Execute calendar update action
   */
  private static async executeCalendarUpdate(actionItem: any, aiAnalysis: any): Promise<any> {
    // Placeholder for calendar update logic
    return {
      success: true,
      message: 'Calendar update logged',
      action: actionItem.action,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Execute booking approval action
   */
  private static async executeBookingApproval(actionItem: any, aiAnalysis: any): Promise<any> {
    // Placeholder for booking approval logic
    return {
      success: true,
      message: 'Booking approval logged',
      decision: aiAnalysis.decision?.action,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Log COO decision for transparency and audit
   */
  private static async logCOODecision(scenario: any, aiAnalysis: any, executionResults: any): Promise<void> {
    try {
      const db = getDb()
      
      const decisionLog = {
        // Core decision data
        scenarioType: scenario.type,
        scenarioData: scenario.data,
        context: scenario.context,
        
        // AI analysis
        decision: aiAnalysis.decision,
        reasoning: aiAnalysis.reasoning,
        confidence: aiAnalysis.confidence,
        analysis: aiAnalysis.analysis,
        actionPlan: aiAnalysis.actionPlan,
        recommendations: aiAnalysis.recommendations,
        
        // Execution results
        executionResults: executionResults,
        
        // Metadata
        timestamp: serverTimestamp(),
        aiModel: 'gpt-4-turbo',
        cooVersion: '1.0.0',
        
        // Audit trail
        decisionId: `ai_coo_${Date.now()}`,
        auditTrail: {
          decisionMadeAt: new Date().toISOString(),
          executedAt: new Date().toISOString(),
          success: executionResults.actions.length > 0
        }
      }

      await addDoc(collection(db, 'ai_coo_decisions'), decisionLog)
      console.log('✅ AI COO: Decision logged for transparency')
      
    } catch (error) {
      console.warn('⚠️ AI COO: Failed to log decision:', error)
    }
  }
}

export default AICOOService
