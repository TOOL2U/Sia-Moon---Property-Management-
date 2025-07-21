import { routeAIMessage } from '@/lib/ai/aiRouter'
import { parseCommands } from '@/lib/ai/commandParser'
import { getMultiModelClient } from '@/lib/ai/multiModelClient'
import { logMultiModelInteraction } from '@/lib/ai/multiModelLogger'
import { getDb } from '@/lib/firebase'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/ai-chat
 * Handle AI chat conversations with system context
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🤖 AI CHAT: Processing chat request')

    const body = await request.json()
    const {
      message,
      context,
      aiAutomationEnabled,
      conversationHistory,
      selectedModel = 'auto',
      sessionId = `session_${Date.now()}`,
      userId = 'anonymous'
    } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      )
    }

    // Start timing for performance logging
    const startTime = Date.now()

    // Load AI memory for context-aware responses
    let memoryContext = ''
    try {
      // TODO: Implement AI memory service
      // For now, use empty memory context
      memoryContext = ''
    } catch (error) {
      console.error('Failed to load AI memory:', error)
      memoryContext = ''
    }

    // Build system prompt with context and memory
    const systemPrompt = buildSystemPrompt(context, aiAutomationEnabled) + memoryContext

    // Format conversation history for AI
    const formattedHistory = conversationHistory?.map((msg: any) => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.message
    })) || []

    // Detect intents from user message for direct action execution
    let detectedIntents: any[] = []
    let intentExecutionResults: any[] = []
    let skipAIModel = false
    let aiResponse: any

    console.log('🔍 AI INTENT: Starting intent detection for message:', message)

    try {
      // Import intent detection (dynamic import to avoid build issues)
      const { detectIntent } = await import('@/lib/ai/intentDetector')
      const { executeAction } = await import('@/lib/ai/actionRouter')

      console.log('📦 AI INTENT: Modules imported successfully')

      detectedIntents = detectIntent(message)
      console.log(`🎯 AI INTENT: Detected ${detectedIntents.length} intents:`, detectedIntents.map(i => i.action))

      if (detectedIntents.length === 0) {
        console.log('❌ AI INTENT: No intents detected from message:', message)
      }

      // If we have ANY intents, skip AI model and execute directly (for testing)
      if (detectedIntents.length > 0) {
        console.log('🚀 AI INTENT: Intents detected, skipping AI model call for direct execution')

        // Set a default response that will be overridden by execution results
        aiResponse = {
          response: 'Processing your request...',
          actionRequired: false,
          model: 'intent-execution',
          actualModel: 'intent-execution',
          taskType: 'action',
          confidence: detectedIntents.length > 0 ? Math.max(...detectedIntents.map(i => i.confidence)) : 0.5,
          responseTime: 0,
          routingReason: 'Intent detected - executing directly'
        }

        skipAIModel = true
        console.log('✅ AI INTENT: Set skipAIModel = true, aiResponse ready')
      }

      // Execute intents if detected
      if (detectedIntents.length > 0) {
        console.log('🚀 AI INTENT: Executing detected intents...')

        // Check automation settings and execute allowed intents
        for (const intent of detectedIntents) {
          try {
            // Import automation settings
            const { canExecuteAIAction } = await import('@/lib/ai/aiAutomationSettings')

            // Check if action can be executed
            const permission = await canExecuteAIAction(
              intent.action,
              intent.safetyLevel,
              intent.confidence,
              intentExecutionResults.length
            )

            if (permission.allowed && !permission.requiresConfirmation) {
              console.log(`🚀 Executing intent: ${intent.action} (confidence: ${Math.round(intent.confidence * 100)}%)`)

              const executionResult = await executeAction(intent, {
                userId: userId,
                sessionId: sessionId,
                timestamp: new Date(),
                source: 'ai_chat_intent'
              })

              intentExecutionResults.push({
                intent: intent.action,
                success: executionResult.success,
                message: executionResult.message,
                data: executionResult.data,
                confidence: intent.confidence,
                safetyLevel: intent.safetyLevel,
                autoExecuted: true
              })

              console.log(`${executionResult.success ? '✅' : '❌'} Intent ${intent.action}: ${executionResult.message}`)
            } else if (permission.allowed && permission.requiresConfirmation) {
              // Add to pending confirmations
              intentExecutionResults.push({
                intent: intent.action,
                success: false,
                message: `⏳ Action requires confirmation: ${permission.reason || 'Manual approval needed'}`,
                data: intent.parameters,
                confidence: intent.confidence,
                safetyLevel: intent.safetyLevel,
                requiresConfirmation: true,
                autoExecuted: false
              })

              console.log(`⏳ Intent ${intent.action} requires confirmation: ${permission.reason}`)
            } else {
              // Action not allowed
              intentExecutionResults.push({
                intent: intent.action,
                success: false,
                message: `🚫 Action blocked: ${permission.reason || 'Not permitted'}`,
                data: intent.parameters,
                confidence: intent.confidence,
                safetyLevel: intent.safetyLevel,
                blocked: true,
                autoExecuted: false
              })

              console.log(`🚫 Intent ${intent.action} blocked: ${permission.reason}`)
            }
          } catch (error) {
            console.error(`❌ Failed to process intent ${intent.action}:`, error)
            intentExecutionResults.push({
              intent: intent.action,
              success: false,
              message: `❌ Failed to process action: ${error instanceof Error ? error.message : 'Unknown error'}`,
              confidence: intent.confidence,
              error: true,
              autoExecuted: false
            })
          }
        }

        // If intents were executed successfully, update the AI response
        if (intentExecutionResults.some(r => r.success)) {
          const successfulIntents = intentExecutionResults.filter(r => r.success)
          const successMessages = successfulIntents.map(r => r.message).join('\n\n')

          // Replace AI response with execution results
          aiResponse.response = successMessages
          aiResponse.actionRequired = false // Actions already executed

          console.log('🎉 AI AGENT: Actions executed successfully, updated response')
          console.log('📝 New response:', aiResponse.response)
        } else if (intentExecutionResults.length > 0) {
          // Some intents detected but not executed (blocked, require confirmation, etc.)
          const blockedIntents = intentExecutionResults.filter(r => !r.success)
          const blockedMessages = blockedIntents.map(r => r.message).join('\n\n')

          // Update response to show why actions weren't executed
          aiResponse.response = `I detected the following actions but couldn't execute them:\n\n${blockedMessages}`

          console.log('⚠️ AI AGENT: Some intents blocked or require confirmation')
        }
      }

    } catch (error) {
      console.error('❌ Intent detection/execution failed:', error)
    }

    // Route to appropriate AI model
    const routing = routeAIMessage ? routeAIMessage(message, {
      preferredModel: selectedModel as any,
      forceModel: selectedModel !== 'auto' ? selectedModel as any : undefined
    }) : { model: 'chatgpt' as any, reasoning: 'Default routing', confidence: 0.5, taskType: 'general' as any }

    // Get multi-model client and call AI service
    const multiModelClient = getMultiModelClient ? getMultiModelClient() : null

    // Check if we should skip AI model call for high-confidence intents
    if (skipAIModel) {
      console.log('⚡ Using pre-set AI response for intent execution')
      // aiResponse is already set in the intent detection section
    } else if (multiModelClient) {
      try {
        const clientResponse = await multiModelClient.chat(message, routing.model, {
          systemPrompt,
          conversationHistory: formattedHistory,
          temperature: 0.7,
          maxTokens: 1000
        })

        aiResponse = {
          response: clientResponse.response || 'No response generated',
          actionRequired: false,
          suggestedAction: null,
          model: clientResponse.model,
          actualModel: clientResponse.model,
          success: clientResponse.success,
          error: clientResponse.error,
          tokenUsage: clientResponse.usage,
          routingReason: routing.reasoning,
          confidence: routing.confidence,
          taskType: routing.taskType,
          responseTime: Date.now() - startTime
        }
      } catch (error) {
        console.log('⚠️ Multi-model client failed, falling back to simulation')
        // Fallback to simulation if API keys not available
        aiResponse = await callAIService(systemPrompt, message, formattedHistory)
        aiResponse.model = routing.model
        aiResponse.routingReason = routing.reasoning + ' (simulated - API keys not configured)'
        aiResponse.confidence = routing.confidence
        aiResponse.taskType = routing.taskType
        aiResponse.responseTime = Date.now() - startTime
      }
    } else {
      // Fallback to original system
      aiResponse = await callAIService(systemPrompt, message, formattedHistory)
      aiResponse.model = routing.model
      aiResponse.routingReason = routing.reasoning + ' (fallback mode)'
      aiResponse.confidence = routing.confidence
      aiResponse.taskType = routing.taskType
      aiResponse.responseTime = Date.now() - startTime
    }

    // Parse commands from AI response
    const commandParsingResult = parseCommands ? parseCommands(aiResponse.response) : { hasCommands: false, commands: [] }

    // Also parse commands from the user message (for direct commands)
    const userCommandResult = parseCommands ? parseCommands(message) : { hasCommands: false, commands: [] }

    // Combine commands from both AI response and user message
    const allCommands = [
      ...(commandParsingResult.commands || []),
      ...(userCommandResult.commands || [])
    ]

    const hasAnyCommands = allCommands.length > 0

    // Store conversation in memory

    // Execute commands automatically if detected
    let executionResults: any[] = []
    if (hasAnyCommands && allCommands.length > 0) {
      console.log(`🤖 AI AGENT: Detected ${allCommands.length} commands, executing automatically...`)

      // Import command executor
      try {
        const { executeCommand } = await import('@/lib/ai/commandExecutor')

        for (const command of allCommands) {
          console.log(`🔧 Executing command: ${command.type} - ${command.description}`)

          const executionResult = await executeCommand(command, {
            adminId: userId,
            sessionId: sessionId,
            timestamp: new Date(),
            source: 'ai_chat_auto'
          })

          executionResults.push({
            commandId: command.id,
            type: command.type,
            success: executionResult.success,
            message: executionResult.message,
            details: executionResult.details
          })

          console.log(`${executionResult.success ? '✅' : '❌'} Command ${command.type}: ${executionResult.message}`)
        }

        // If commands were executed successfully, update the AI response
        if (executionResults.some(r => r.success)) {
          const successfulCommands = executionResults.filter(r => r.success)
          const successMessages = successfulCommands.map(r => r.message).join('\n\n')

          // Enhance the AI response with execution results
          aiResponse.response = successMessages || aiResponse.response
          aiResponse.actionRequired = false // Commands already executed
        }

      } catch (error) {
        console.error('❌ Failed to execute commands:', error)
        executionResults.push({
          commandId: 'error',
          type: 'execution_error',
          success: false,
          message: `Failed to execute commands: ${error instanceof Error ? error.message : 'Unknown error'}`
        })
      }
    }

    // Store conversation in memory
    try {
      // TODO: Implement AI memory service
      // const aiMemoryService = getAIMemoryService ? getAIMemoryService() : null
      // if (aiMemoryService) {
      //   await aiMemoryService.addConversationContext(
      //     userId,
      //     message,
      //     aiResponse.response,
      //     aiResponse.model || 'unknown'
      //   )
      //
      //   // Store commands in memory if any were detected
      //   if (hasAnyCommands) {
      //     for (const command of allCommands) {
      //       await aiMemoryService.addCommand(userId, {
      //         type: command.type,
      //         description: command.description,
      //         data: command.data,
      //         status: 'pending'
      //       })
      //     }
      //   }
      // }
    } catch (error) {
      console.error('Failed to store conversation in memory:', error)
      // Don't fail the request if memory storage fails
    }

    // Log the interaction (original system)
    await logChatInteraction(message, aiResponse.response, context)

    // Log multi-model interaction
    if (logMultiModelInteraction) {
      try {
        await logMultiModelInteraction(
          sessionId,
          userId,
          message,
          startTime,
          {
            success: aiResponse.success !== false,
            response: aiResponse.response,
            model: aiResponse.model,
            actualModel: aiResponse.actualModel,
            error: aiResponse.error,
            tokenUsage: aiResponse.tokenUsage,
            routingReason: aiResponse.routingReason,
            confidence: aiResponse.confidence,
            taskType: aiResponse.taskType,
            commandsDetected: commandParsingResult.commands?.length || 0,
            commandsExecuted: 0 // Will be updated when commands are executed
          },
          'ai_chat'
        )
      } catch (logError) {
        console.error('❌ Failed to log multi-model interaction:', logError)
      }
    }

    console.log('✅ AI CHAT: Response generated successfully', {
      model: aiResponse.model,
      actualModel: aiResponse.actualModel,
      taskType: aiResponse.taskType,
      confidence: aiResponse.confidence,
      responseTime: aiResponse.responseTime,
      hasCommands: commandParsingResult.hasCommands,
      commandCount: commandParsingResult.commands?.length || 0
    })

    return NextResponse.json({
      success: true,
      response: aiResponse.response,
      actionRequired: aiResponse.actionRequired || (hasAnyCommands && executionResults.some(r => !r.success)),
      suggestedAction: aiResponse.suggestedAction,
      commands: allCommands,
      hasCommands: hasAnyCommands,
      executionResults: executionResults,
      commandsExecuted: executionResults.filter(r => r.success).length,
      intents: detectedIntents,
      intentExecutionResults: intentExecutionResults,
      intentsExecuted: intentExecutionResults.filter(r => r.success).length,
      model: aiResponse.model,
      actualModel: aiResponse.actualModel,
      taskType: aiResponse.taskType,
      confidence: aiResponse.confidence,
      responseTime: aiResponse.responseTime,
      routingReason: aiResponse.routingReason,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ AI CHAT: Error processing request:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function buildSystemPrompt(context: any, aiAutomationEnabled: boolean): string {
  const automationStatus = aiAutomationEnabled ? 'ON' : 'OFF'

  return `You are the AI COO for a property management system. The user may request changes or ask questions about operational data.

CURRENT SYSTEM STATUS:
- AI Automation: ${automationStatus}
- Timestamp: ${context?.timestamp || new Date().toISOString()}

CURRENT DATA CONTEXT:
- Bookings: ${context?.bookings ? JSON.stringify(context.bookings).substring(0, 500) + '...' : 'Not available'}
- Jobs: ${context?.jobs ? JSON.stringify(context.jobs).substring(0, 300) + '...' : 'Not available'}
- Staff: ${context?.staff ? JSON.stringify(context.staff).substring(0, 300) + '...' : 'Not available'}
- Calendar: ${context?.calendar ? JSON.stringify(context.calendar).substring(0, 300) + '...' : 'Not available'}

CAPABILITIES:
- Analyze operational data and provide insights
- Suggest staff reassignments and optimizations
- Help with booking management and calendar coordination
- Provide financial analysis and reporting
- Recommend process improvements

IMPORTANT GUIDELINES:
- Always be helpful and professional
- Provide specific, actionable advice when possible
- If suggesting data changes, clearly explain the reasoning
- Ask for confirmation before making any system modifications
- Reference specific data from the context when relevant

Please respond to the user's query with relevant insights and recommendations based on the current system state.`
}

async function callAIService(systemPrompt: string, userMessage: string, conversationHistory: any[]) {
  // This is a placeholder for AI service integration
  // You can integrate with OpenAI, Claude, or any other AI service here

  try {
    // Example using OpenAI (uncomment and configure as needed)
    /*
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ]

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7,
    })

    const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.'
    */

    // For now, return a simulated intelligent response
    const response = generateSimulatedResponse(userMessage, systemPrompt)

    // Analyze if the response suggests an action
    const actionAnalysis = analyzeForActions(response)

    return {
      response,
      actionRequired: actionAnalysis.actionRequired,
      suggestedAction: actionAnalysis.suggestedAction
    }

  } catch (error) {
    console.error('Error calling AI service:', error)
    throw new Error('AI service unavailable')
  }
}

function generateSimulatedResponse(userMessage: string, systemPrompt: string): string {
  const lowerMessage = userMessage.toLowerCase()

  // Booking-related queries
  if (lowerMessage.includes('booking') || lowerMessage.includes('reservation')) {
    return `Based on the current booking data, I can help you with booking management. Here are some insights:

📊 **Booking Analysis:**
- I can see your current booking status and occupancy rates
- Found 3 pending bookings that need immediate attention
- Identified potential scheduling conflicts that need resolution

🎯 **Actionable Recommendations:**
I recommend the following immediate actions:
- Approve booking abc123 - all requirements met
- Update booking def456 with new check-in instructions
- Create job for Villa Sunset cleaning on 26 July

Would you like me to execute these booking actions or analyze other management tasks?`
  }

  // Staff-related queries
  if (lowerMessage.includes('staff') || lowerMessage.includes('assign') || lowerMessage.includes('schedule')) {
    return `I can help optimize your staff assignments and scheduling:

👥 **Staff Management Insights:**
- Current staff availability and workload distribution
- Skill matching for optimal job assignments
- Schedule optimization to reduce conflicts

🔧 **Actionable Recommendations:**
Based on current workload analysis, I recommend:
- Assign staff John Doe to job job_123 for better efficiency
- Reassign Maria from job job_456 to job job_789 to balance workload

Would you like me to execute these staff assignments or analyze other scheduling optimizations?`
  }

  // Calendar-related queries
  if (lowerMessage.includes('calendar') || lowerMessage.includes('event') || lowerMessage.includes('schedule')) {
    return `Let me help you with calendar and event management:

📅 **Calendar Analysis:**
- Current event distribution and potential conflicts
- Optimal scheduling recommendations
- Integration opportunities between bookings and staff schedules

⚡ **Optimization Opportunities:**
- Identify scheduling gaps that could be filled
- Suggest event timing adjustments for better flow
- Coordinate cross-functional activities

What specific calendar management task would you like assistance with?`
  }

  // Financial queries
  if (lowerMessage.includes('financial') || lowerMessage.includes('revenue') || lowerMessage.includes('cost')) {
    return `I can provide financial analysis and insights:

💰 **Financial Overview:**
- Revenue trends and booking performance
- Cost optimization opportunities
- Profitability analysis by property/service

📈 **Key Metrics:**
- Occupancy rates and revenue per booking
- Staff efficiency and cost per service
- Seasonal trends and forecasting

Would you like me to dive deeper into any specific financial metrics or generate a detailed report?`
  }

  // General operational queries
  if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
    return `I'm your AI COO Assistant! Here's how I can help you manage operations:

🎯 **Core Capabilities:**
- **Booking Management**: Analyze reservations, optimize pricing, manage conflicts
- **Staff Operations**: Optimize assignments, balance workloads, suggest training
- **Calendar Coordination**: Manage events, prevent conflicts, optimize scheduling
- **Financial Analysis**: Track revenue, analyze costs, identify opportunities
- **Process Optimization**: Suggest improvements, automate workflows

💡 **Smart Features:**
- Real-time data analysis from your current system state
- Actionable recommendations with reasoning
- Automated task execution (with your approval)
- Cross-functional insights and coordination

Just ask me about any operational challenge, and I'll provide specific insights and recommendations based on your current data!`
  }

  // Default response
  return `I understand you're asking about: "${userMessage}"

As your AI COO, I'm analyzing your current operational data to provide the best insights. Based on the system context, I can help you with:

🔍 **Current Focus Areas:**
- Booking optimization and management
- Staff assignment and scheduling efficiency
- Calendar coordination and event management
- Financial performance and cost analysis

💡 **Next Steps:**
Could you be more specific about what you'd like to accomplish? For example:
- "Analyze my current bookings for this week"
- "Suggest staff reassignments for better efficiency"
- "Show me financial performance trends"
- "Help me resolve calendar conflicts"

I'm here to provide actionable insights based on your real operational data!`
}

function analyzeForActions(response: string): { actionRequired: boolean; suggestedAction?: any } {
  const lowerResponse = response.toLowerCase()

  // Check if response suggests specific actions
  if (lowerResponse.includes('suggest') && (lowerResponse.includes('reassign') || lowerResponse.includes('assign'))) {
    return {
      actionRequired: true,
      suggestedAction: {
        type: 'staff_reassign',
        description: 'Optimize staff assignments based on current workload',
        data: { action: 'staff_optimization' }
      }
    }
  }

  if (lowerResponse.includes('booking') && lowerResponse.includes('modify')) {
    return {
      actionRequired: true,
      suggestedAction: {
        type: 'booking_modify',
        description: 'Update booking details or status',
        data: { action: 'booking_update' }
      }
    }
  }

  return { actionRequired: false }
}

async function logChatInteraction(userMessage: string, aiResponse: string, context: any) {
  try {
    const db = getDb()

    await addDoc(collection(db, 'ai_chat_logs'), {
      userMessage,
      aiResponse: aiResponse.substring(0, 1000), // Limit response length in logs
      timestamp: serverTimestamp(),
      contextSummary: {
        aiAutomationEnabled: context?.aiAutomationEnabled || false,
        dataAvailable: {
          bookings: !!context?.bookings,
          jobs: !!context?.jobs,
          staff: !!context?.staff,
          calendar: !!context?.calendar
        }
      },
      source: 'ai_chat_interface'
    })

    console.log('✅ AI CHAT: Interaction logged successfully')
  } catch (error) {
    console.error('❌ AI CHAT: Failed to log interaction:', error)
    // Don't throw error - logging failure shouldn't break the chat
  }
}
