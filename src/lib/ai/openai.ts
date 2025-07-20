// lib/ai/openai.ts - OpenAI integration for AI COO/CFO decision making

export interface AICompletionRequest {
  prompt: string
  maxTokens?: number
  temperature?: number
  model?: string
}

export interface AICompletionResponse {
  decision: string
  confidence: number
  assignedStaff?: string[]
  reason: string
  estimatedCost?: number
  estimatedDuration?: number
  priority?: number
  warnings?: string[]
}

/**
 * Create AI completion using OpenAI API (or mock for development)
 */
export async function createCompletion(request: AICompletionRequest): Promise<AICompletionResponse> {
  try {
    console.log('🤖 AI: Processing completion request...')
    
    // Check if OpenAI API key is available
    const apiKey = process.env.OPENAI_API_KEY
    
    if (apiKey && apiKey !== 'your-openai-api-key-here') {
      // Use real OpenAI API
      return await callOpenAI(request, apiKey)
    } else {
      // Use mock AI for development
      console.log('🔄 AI: Using mock AI (no OpenAI API key configured)')
      return await mockAICompletion(request)
    }

  } catch (error) {
    console.error('❌ AI: Error in completion:', error)
    
    // Fallback to mock AI on error
    console.log('🔄 AI: Falling back to mock AI due to error')
    return await mockAICompletion(request)
  }
}

/**
 * Call real OpenAI API
 */
async function callOpenAI(request: AICompletionRequest, apiKey: string): Promise<AICompletionResponse> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: request.model || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an AI COO assistant. Respond with valid JSON only.'
          },
          {
            role: 'user',
            content: request.prompt
          }
        ],
        max_tokens: request.maxTokens || 500,
        temperature: request.temperature || 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error('No content in OpenAI response')
    }

    // Parse JSON response
    const aiResponse = JSON.parse(content)
    
    console.log('✅ AI: OpenAI completion successful')
    return aiResponse

  } catch (error) {
    console.error('❌ AI: OpenAI API error:', error)
    throw error
  }
}

/**
 * Mock AI completion for development and testing
 */
async function mockAICompletion(request: AICompletionRequest): Promise<AICompletionResponse> {
  try {
    console.log('🎭 AI: Generating mock AI response...')
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
    
    // Parse the prompt to understand the booking context
    const prompt = request.prompt.toLowerCase()
    
    // Extract booking information from prompt
    const hasAddress = prompt.includes('address')
    const hasJobType = prompt.includes('jobtype') || prompt.includes('job type')
    const isHighValue = prompt.includes('5000') || prompt.includes('high-value')
    const isUrgent = prompt.includes('urgent') || prompt.includes('emergency')
    const isCleaning = prompt.includes('cleaning')
    const isMaintenance = prompt.includes('maintenance')
    
    // Determine decision based on context
    let decision: string
    let confidence: number
    let assignedStaff: string[] = []
    let reason: string
    let warnings: string[] = []
    
    // Validation checks
    if (!hasAddress || !hasJobType) {
      decision = 'reject'
      confidence = 0.95
      reason = 'Missing required information: address or job type not provided'
      warnings.push('Incomplete booking data')
    } else if (isHighValue) {
      decision = 'escalate'
      confidence = 0.65
      reason = 'High-value booking requires human review for quality assurance'
      warnings.push('High-value booking flagged for review')
    } else {
      // Normal booking processing
      decision = 'approve'
      confidence = 0.75 + Math.random() * 0.2 // 75-95% confidence
      
      // Assign appropriate staff based on job type
      if (isCleaning) {
        assignedStaff = ['staff_001', 'staff_003'] // Maria Santos, Lisa Chen
        reason = 'Assigned experienced cleaning staff with high ratings'
      } else if (isMaintenance) {
        assignedStaff = ['staff_002'] // John Wilson
        reason = 'Assigned maintenance specialist with electrical and plumbing skills'
      } else {
        assignedStaff = ['staff_005'] // Anna Rodriguez (versatile)
        reason = 'Assigned versatile staff member suitable for general tasks'
      }
      
      // Adjust confidence based on factors
      if (isUrgent) {
        confidence = Math.max(0.6, confidence - 0.1)
        warnings.push('Urgent booking may require expedited processing')
      }
    }
    
    // Calculate estimated cost and duration
    const estimatedCost = assignedStaff.length > 0 
      ? Math.round((300 + Math.random() * 200) * assignedStaff.length)
      : undefined
    
    const estimatedDuration = assignedStaff.length > 0 
      ? Math.round(60 + Math.random() * 120) // 1-3 hours
      : undefined
    
    const priority = isUrgent ? 8 : isHighValue ? 7 : Math.round(4 + Math.random() * 3)
    
    const response: AICompletionResponse = {
      decision,
      confidence: Math.round(confidence * 100) / 100,
      assignedStaff: assignedStaff.length > 0 ? assignedStaff : undefined,
      reason,
      estimatedCost,
      estimatedDuration,
      priority,
      warnings: warnings.length > 0 ? warnings : undefined
    }
    
    console.log('✅ AI: Mock completion generated:', {
      decision: response.decision,
      confidence: response.confidence,
      staffCount: assignedStaff.length
    })
    
    return response

  } catch (error) {
    console.error('❌ AI: Error in mock completion:', error)
    
    // Ultimate fallback
    return {
      decision: 'escalate',
      confidence: 0.5,
      reason: 'AI processing error - requires human review',
      warnings: ['AI system error occurred']
    }
  }
}

/**
 * Validate AI response format
 */
export function validateAIResponse(response: any): AICompletionResponse {
  const validated: AICompletionResponse = {
    decision: response.decision || 'escalate',
    confidence: typeof response.confidence === 'number' 
      ? Math.max(0, Math.min(1, response.confidence))
      : 0.5,
    reason: response.reason || 'No reason provided'
  }
  
  if (response.assignedStaff && Array.isArray(response.assignedStaff)) {
    validated.assignedStaff = response.assignedStaff
  }
  
  if (typeof response.estimatedCost === 'number' && response.estimatedCost > 0) {
    validated.estimatedCost = response.estimatedCost
  }
  
  if (typeof response.estimatedDuration === 'number' && response.estimatedDuration > 0) {
    validated.estimatedDuration = response.estimatedDuration
  }
  
  if (typeof response.priority === 'number') {
    validated.priority = Math.max(1, Math.min(10, response.priority))
  }
  
  if (response.warnings && Array.isArray(response.warnings)) {
    validated.warnings = response.warnings
  }
  
  return validated
}

/**
 * Format prompt for AI COO
 */
export function formatCOOPrompt(booking: any, staff: any[], rules: string[]): string {
  return `You are an AI COO for a villa property management company. Analyze this booking request and make a decision.

BOOKING REQUEST:
${JSON.stringify(booking, null, 2)}

AVAILABLE STAFF:
${JSON.stringify(staff, null, 2)}

COMPANY RULES:
${rules.map((rule, i) => `${i + 1}. ${rule}`).join('\n')}

DECISION REQUIRED:
Analyze the booking and respond with a JSON object containing:
- decision: "approve", "reject", or "escalate"
- confidence: number between 0 and 1
- assignedStaff: array of staff IDs (if approved)
- reason: detailed explanation of your decision
- estimatedCost: estimated cost in THB (if approved)
- estimatedDuration: estimated duration in minutes (if approved)
- priority: priority level 1-10
- warnings: array of any concerns or notes

Consider:
- Staff availability and skills
- Distance and travel time
- Job complexity and value
- Company policies and rules
- Customer requirements

Respond with valid JSON only.`
}

/**
 * Format prompt for AI CFO
 */
export function formatCFOPrompt(transaction: any, rules: string[]): string {
  return `You are an AI CFO for a villa property management company. Analyze this financial transaction and make a decision.

TRANSACTION:
${JSON.stringify(transaction, null, 2)}

COMPANY FINANCIAL RULES:
${rules.map((rule, i) => `${i + 1}. ${rule}`).join('\n')}

DECISION REQUIRED:
Analyze the transaction and respond with a JSON object containing:
- decision: "approve", "reject", or "escalate"
- confidence: number between 0 and 1
- reason: detailed explanation of your decision
- estimatedImpact: financial impact assessment
- priority: priority level 1-10
- warnings: array of any concerns or notes

Consider:
- Budget constraints
- Cash flow impact
- ROI potential
- Risk assessment
- Compliance requirements

Respond with valid JSON only.`
}
