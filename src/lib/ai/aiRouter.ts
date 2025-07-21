/**
 * AI Router - Intelligent routing between multiple AI models
 * Supports ChatGPT (OpenAI GPT-4) and Claude (Anthropic)
 */

export type AIModel = 'auto' | 'chatgpt' | 'claude'
export type TaskType = 'analysis' | 'planning' | 'action' | 'creative' | 'technical' | 'general'

export interface AIRouterConfig {
  preferredModel?: AIModel
  taskType?: TaskType
  forceModel?: AIModel
}

export interface AIResponse {
  response: string
  model: AIModel
  confidence: number
  reasoning?: string
  actionRequired?: boolean
  suggestedAction?: any
  commands?: any[]
  hasCommands?: boolean
}

/**
 * Analyze message content to determine optimal AI model
 */
export function analyzeMessageForRouting(message: string): {
  taskType: TaskType
  suggestedModel: AIModel
  confidence: number
  reasoning: string
} {
  const lowerMessage = message.toLowerCase()
  
  // Analysis and planning tasks - Claude excels at these
  const analysisKeywords = [
    'analyze', 'analysis', 'review', 'evaluate', 'assess', 'examine',
    'compare', 'contrast', 'study', 'investigate', 'research',
    'trends', 'patterns', 'insights', 'metrics', 'performance',
    'financial', 'revenue', 'costs', 'profitability', 'roi'
  ]
  
  const planningKeywords = [
    'plan', 'planning', 'strategy', 'roadmap', 'schedule',
    'organize', 'structure', 'framework', 'approach',
    'optimize', 'improve', 'enhance', 'streamline'
  ]
  
  // Action and execution tasks - ChatGPT excels at these
  const actionKeywords = [
    'create', 'make', 'build', 'generate', 'add', 'insert',
    'assign', 'reassign', 'approve', 'reject', 'update',
    'modify', 'change', 'edit', 'delete', 'remove',
    'execute', 'run', 'perform', 'do', 'complete'
  ]
  
  // Creative tasks - ChatGPT tends to be more creative
  const creativeKeywords = [
    'write', 'compose', 'draft', 'design', 'creative',
    'brainstorm', 'ideate', 'imagine', 'invent',
    'story', 'narrative', 'description', 'content'
  ]
  
  // Technical tasks - Claude excels at technical reasoning
  const technicalKeywords = [
    'technical', 'code', 'programming', 'debug', 'troubleshoot',
    'algorithm', 'logic', 'system', 'architecture', 'database',
    'api', 'integration', 'configuration', 'setup'
  ]
  
  // Count keyword matches
  const analysisScore = analysisKeywords.filter(keyword => lowerMessage.includes(keyword)).length
  const planningScore = planningKeywords.filter(keyword => lowerMessage.includes(keyword)).length
  const actionScore = actionKeywords.filter(keyword => lowerMessage.includes(keyword)).length
  const creativeScore = creativeKeywords.filter(keyword => lowerMessage.includes(keyword)).length
  const technicalScore = technicalKeywords.filter(keyword => lowerMessage.includes(keyword)).length
  
  // Determine task type and model
  const scores = {
    analysis: analysisScore,
    planning: planningScore,
    action: actionScore,
    creative: creativeScore,
    technical: technicalScore
  }
  
  const maxScore = Math.max(...Object.values(scores))
  const taskType = Object.keys(scores).find(key => scores[key as keyof typeof scores] === maxScore) as TaskType || 'general'
  
  // Model routing logic
  let suggestedModel: AIModel = 'chatgpt' // default
  let reasoning = ''
  
  if (taskType === 'analysis' || taskType === 'technical') {
    suggestedModel = 'claude'
    reasoning = `Claude excels at ${taskType} tasks with deep reasoning and technical accuracy`
  } else if (taskType === 'planning') {
    suggestedModel = 'claude'
    reasoning = 'Claude is excellent at strategic planning and structured thinking'
  } else if (taskType === 'action' || taskType === 'creative') {
    suggestedModel = 'chatgpt'
    reasoning = `ChatGPT is optimized for ${taskType} tasks and execution`
  } else {
    suggestedModel = 'chatgpt'
    reasoning = 'ChatGPT as default for general queries'
  }
  
  // Calculate confidence based on keyword density
  const totalWords = message.split(' ').length
  const keywordDensity = maxScore / totalWords
  const confidence = Math.min(0.5 + (keywordDensity * 2), 1.0) // Base 50% + keyword density
  
  return {
    taskType,
    suggestedModel,
    confidence,
    reasoning
  }
}

/**
 * Route message to appropriate AI model
 */
export function routeAIMessage(
  message: string, 
  config: AIRouterConfig = {}
): {
  model: AIModel
  reasoning: string
  confidence: number
  taskType: TaskType
} {
  // If force model is specified, use it
  if (config.forceModel && config.forceModel !== 'auto') {
    return {
      model: config.forceModel,
      reasoning: `Forced to use ${config.forceModel} by user selection`,
      confidence: 1.0,
      taskType: config.taskType || 'general'
    }
  }
  
  // If preferred model is specified and not auto, use it
  if (config.preferredModel && config.preferredModel !== 'auto') {
    return {
      model: config.preferredModel,
      reasoning: `Using preferred model ${config.preferredModel}`,
      confidence: 0.8,
      taskType: config.taskType || 'general'
    }
  }
  
  // Use intelligent routing
  const analysis = analyzeMessageForRouting(message)
  
  return {
    model: analysis.suggestedModel,
    reasoning: analysis.reasoning,
    confidence: analysis.confidence,
    taskType: analysis.taskType
  }
}

/**
 * Get model display information
 */
export function getModelInfo(model: AIModel) {
  switch (model) {
    case 'chatgpt':
      return {
        name: 'ChatGPT',
        fullName: 'OpenAI GPT-4',
        icon: '🤖',
        color: 'bg-green-600',
        strengths: ['Actions', 'Creativity', 'General Tasks'],
        description: 'Excellent for task execution and creative solutions'
      }
    case 'claude':
      return {
        name: 'Claude',
        fullName: 'Anthropic Claude Sonnet',
        icon: '🧠',
        color: 'bg-purple-600',
        strengths: ['Analysis', 'Planning', 'Technical Reasoning'],
        description: 'Superior analytical thinking and strategic planning'
      }
    case 'auto':
      return {
        name: 'Auto',
        fullName: 'Intelligent Routing',
        icon: '⚡',
        color: 'bg-blue-600',
        strengths: ['Smart Selection', 'Optimal Performance'],
        description: 'Automatically selects the best model for each task'
      }
    default:
      return {
        name: 'Unknown',
        fullName: 'Unknown Model',
        icon: '❓',
        color: 'bg-gray-600',
        strengths: [],
        description: 'Unknown AI model'
      }
  }
}

/**
 * Get available AI models
 */
export function getAvailableModels(): Array<{
  value: AIModel
  label: string
  description: string
  available: boolean
}> {
  return [
    {
      value: 'auto',
      label: '⚡ Auto (Smart Routing)',
      description: 'Automatically selects the best model',
      available: true
    },
    {
      value: 'chatgpt',
      label: '🤖 ChatGPT (GPT-4)',
      description: 'Best for actions and creativity',
      available: !!process.env.NEXT_PUBLIC_OPENAI_AVAILABLE
    },
    {
      value: 'claude',
      label: '🧠 Claude (Sonnet)',
      description: 'Best for analysis and planning',
      available: !!process.env.NEXT_PUBLIC_ANTHROPIC_AVAILABLE
    }
  ]
}

/**
 * Validate model availability
 */
export function isModelAvailable(model: AIModel): boolean {
  switch (model) {
    case 'auto':
      return true // Auto is always available as it falls back
    case 'chatgpt':
      return !!process.env.OPENAI_API_KEY
    case 'claude':
      return !!process.env.ANTHROPIC_API_KEY
    default:
      return false
  }
}

/**
 * Get fallback model if primary is unavailable
 */
export function getFallbackModel(primaryModel: AIModel): AIModel {
  if (primaryModel === 'auto') {
    // For auto, try ChatGPT first, then Claude
    if (isModelAvailable('chatgpt')) return 'chatgpt'
    if (isModelAvailable('claude')) return 'claude'
    return 'chatgpt' // Final fallback even if not available (will show error)
  }
  
  if (primaryModel === 'chatgpt' && !isModelAvailable('chatgpt')) {
    return isModelAvailable('claude') ? 'claude' : 'chatgpt'
  }
  
  if (primaryModel === 'claude' && !isModelAvailable('claude')) {
    return isModelAvailable('chatgpt') ? 'chatgpt' : 'claude'
  }
  
  return primaryModel
}
