/**
 * Multi-Model AI Client - Unified interface for ChatGPT and Claude
 */

import { AIModel, AIResponse } from './aiRouter'

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIClientConfig {
  model: AIModel
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
  conversationHistory?: AIMessage[]
}

export interface AIClientResponse {
  success: boolean
  response?: string
  model: AIModel
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  error?: string
  reasoning?: string
}

/**
 * OpenAI ChatGPT Client
 */
class ChatGPTClient {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async chat(
    message: string,
    config: AIClientConfig
  ): Promise<AIClientResponse> {
    try {
      console.log('🤖 CHATGPT: Sending request to OpenAI GPT-4')

      const messages: AIMessage[] = []
      
      // Add system prompt
      if (config.systemPrompt) {
        messages.push({
          role: 'system',
          content: config.systemPrompt
        })
      }
      
      // Add conversation history
      if (config.conversationHistory) {
        messages.push(...config.conversationHistory)
      }
      
      // Add current message
      messages.push({
        role: 'user',
        content: message
      })

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: messages,
          temperature: config.temperature || 0.7,
          max_tokens: config.maxTokens || 1000,
          stream: false
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      const aiResponse = data.choices[0]?.message?.content || 'No response generated'

      console.log('✅ CHATGPT: Response received successfully')

      return {
        success: true,
        response: aiResponse,
        model: 'chatgpt',
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0
        }
      }

    } catch (error) {
      console.error('❌ CHATGPT: Error calling OpenAI API:', error)
      
      return {
        success: false,
        model: 'chatgpt',
        error: error instanceof Error ? error.message : 'Unknown ChatGPT error'
      }
    }
  }
}

/**
 * Anthropic Claude Client
 */
class ClaudeClient {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async chat(
    message: string,
    config: AIClientConfig
  ): Promise<AIClientResponse> {
    try {
      console.log('🧠 CLAUDE: Sending request to Anthropic Claude')

      // Format messages for Claude
      let prompt = ''
      
      if (config.systemPrompt) {
        prompt += `System: ${config.systemPrompt}\n\n`
      }
      
      if (config.conversationHistory) {
        for (const msg of config.conversationHistory) {
          if (msg.role === 'user') {
            prompt += `Human: ${msg.content}\n\n`
          } else if (msg.role === 'assistant') {
            prompt += `Assistant: ${msg.content}\n\n`
          }
        }
      }
      
      prompt += `Human: ${message}\n\nAssistant:`

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: config.maxTokens || 1000,
          temperature: config.temperature || 0.7,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Anthropic API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      const aiResponse = data.content[0]?.text || 'No response generated'

      console.log('✅ CLAUDE: Response received successfully')

      return {
        success: true,
        response: aiResponse,
        model: 'claude',
        usage: {
          promptTokens: data.usage?.input_tokens || 0,
          completionTokens: data.usage?.output_tokens || 0,
          totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
        }
      }

    } catch (error) {
      console.error('❌ CLAUDE: Error calling Anthropic API:', error)
      
      return {
        success: false,
        model: 'claude',
        error: error instanceof Error ? error.message : 'Unknown Claude error'
      }
    }
  }
}

/**
 * Unified Multi-Model AI Client
 */
export class MultiModelAIClient {
  private chatgptClient?: ChatGPTClient
  private claudeClient?: ClaudeClient

  constructor() {
    // Initialize clients based on available API keys
    if (process.env.OPENAI_API_KEY) {
      this.chatgptClient = new ChatGPTClient(process.env.OPENAI_API_KEY)
    }
    
    if (process.env.ANTHROPIC_API_KEY) {
      this.claudeClient = new ClaudeClient(process.env.ANTHROPIC_API_KEY)
    }
  }

  /**
   * Send message to specified AI model
   */
  async chat(
    message: string,
    model: AIModel,
    config: Omit<AIClientConfig, 'model'> = {}
  ): Promise<AIClientResponse> {
    const fullConfig: AIClientConfig = { ...config, model }

    try {
      switch (model) {
        case 'chatgpt':
          if (!this.chatgptClient) {
            return {
              success: false,
              model: 'chatgpt',
              error: 'ChatGPT API key not configured'
            }
          }
          return await this.chatgptClient.chat(message, fullConfig)

        case 'claude':
          if (!this.claudeClient) {
            return {
              success: false,
              model: 'claude',
              error: 'Claude API key not configured'
            }
          }
          return await this.claudeClient.chat(message, fullConfig)

        default:
          return {
            success: false,
            model,
            error: `Unsupported model: ${model}`
          }
      }
    } catch (error) {
      console.error(`❌ MULTI-MODEL: Error with ${model}:`, error)
      
      return {
        success: false,
        model,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Check which models are available
   */
  getAvailableModels(): AIModel[] {
    const available: AIModel[] = ['auto'] // Auto is always available
    
    if (this.chatgptClient) {
      available.push('chatgpt')
    }
    
    if (this.claudeClient) {
      available.push('claude')
    }
    
    return available
  }

  /**
   * Test model connectivity
   */
  async testModel(model: AIModel): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.chat(
        'Hello, please respond with "OK" to confirm connectivity.',
        model,
        { maxTokens: 10, temperature: 0 }
      )
      
      return {
        success: response.success,
        error: response.error
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Test failed'
      }
    }
  }
}

// Singleton instance
let multiModelClient: MultiModelAIClient | null = null

/**
 * Get singleton instance of MultiModelAIClient
 */
export function getMultiModelClient(): MultiModelAIClient {
  if (!multiModelClient) {
    multiModelClient = new MultiModelAIClient()
  }
  return multiModelClient
}
