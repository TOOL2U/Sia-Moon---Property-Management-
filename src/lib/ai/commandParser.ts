/**
 * AI Command Parser - Extracts actionable commands from AI responses
 */

export interface ParsedCommand {
  id: string
  type: 'assign_staff' | 'approve_booking' | 'reschedule_job' | 'update_calendar' | 'create_job' | 'update_booking' | 'delete_job' | 'reassign_staff'
  collection: string
  documentId?: string
  operation: 'create' | 'update' | 'delete' | 'assign'
  data: any
  description: string
  confidence: number
  originalText: string
  requiresConfirmation: boolean
  safetyLevel: 'safe' | 'caution' | 'dangerous'
}

export interface CommandParsingResult {
  hasCommands: boolean
  commands: ParsedCommand[]
  originalMessage: string
}

// Command patterns for different operations
const COMMAND_PATTERNS = [
  // Staff assignment patterns
  {
    pattern: /assign\s+(?:staff\s+)?([a-zA-Z\s]+)\s+to\s+job\s+([a-zA-Z0-9\-_]+)/gi,
    type: 'assign_staff' as const,
    collection: 'jobs',
    operation: 'update' as const,
    safetyLevel: 'safe' as const,
    extractor: (match: RegExpMatchArray) => ({
      staffName: match[1].trim(),
      jobId: match[2].trim()
    })
  },

  // Booking approval patterns
  {
    pattern: /approve\s+booking\s+(?:id\s+)?([a-zA-Z0-9\-_]+)/gi,
    type: 'approve_booking' as const,
    collection: 'bookings',
    operation: 'update' as const,
    safetyLevel: 'caution' as const,
    extractor: (match: RegExpMatchArray) => ({
      bookingId: match[1].trim(),
      status: 'approved'
    })
  },

  // Job rescheduling patterns
  {
    pattern: /reschedule\s+(?:cleaning\s+)?job\s+(?:on\s+)?([a-zA-Z0-9\s,\-_]+)\s+to\s+([a-zA-Z0-9\s,\-_]+)/gi,
    type: 'reschedule_job' as const,
    collection: 'jobs',
    operation: 'update' as const,
    safetyLevel: 'caution' as const,
    extractor: (match: RegExpMatchArray) => ({
      originalDate: match[1].trim(),
      newDate: match[2].trim()
    })
  },

  // Calendar update patterns
  {
    pattern: /update\s+calendar\s+(?:to\s+)?(?:reflect\s+)?(?:booking\s+)?(?:changes?|for\s+booking\s+([a-zA-Z0-9\-_]+))/gi,
    type: 'update_calendar' as const,
    collection: 'calendarEvents',
    operation: 'update' as const,
    safetyLevel: 'safe' as const,
    extractor: (match: RegExpMatchArray) => ({
      bookingId: match[1]?.trim() || null
    })
  },

  // Job creation patterns
  {
    pattern: /create\s+(?:new\s+)?(?:cleaning\s+)?job\s+for\s+([a-zA-Z0-9\s,\-_]+)(?:\s+on\s+([a-zA-Z0-9\s,\-_]+))?/gi,
    type: 'create_job' as const,
    collection: 'jobs',
    operation: 'create' as const,
    safetyLevel: 'safe' as const,
    extractor: (match: RegExpMatchArray) => ({
      property: match[1].trim(),
      date: match[2]?.trim() || null
    })
  },

  // Booking update patterns
  {
    pattern: /update\s+booking\s+([a-zA-Z0-9\-_]+)\s+(?:with\s+)?(.+)/gi,
    type: 'update_booking' as const,
    collection: 'bookings',
    operation: 'update' as const,
    safetyLevel: 'caution' as const,
    extractor: (match: RegExpMatchArray) => ({
      bookingId: match[1].trim(),
      updates: match[2].trim()
    })
  },

  // Job deletion patterns (dangerous)
  {
    pattern: /delete\s+job\s+([a-zA-Z0-9\-_]+)(?:\s+with\s+override)?/gi,
    type: 'delete_job' as const,
    collection: 'jobs',
    operation: 'delete' as const,
    safetyLevel: 'dangerous' as const,
    extractor: (match: RegExpMatchArray) => ({
      jobId: match[1].trim(),
      hasOverride: match[0].includes('override')
    })
  },

  // Booking creation patterns
  {
    pattern: /create\s+(?:a\s+)?(?:new\s+)?(?:sample\s+)?booking\s+(?:for\s+)?(?:property\s+)?['""]?([^'""\n,]+)['""]?/gi,
    type: 'create_booking' as const,
    collection: 'bookings',
    operation: 'create' as const,
    safetyLevel: 'safe' as const,
    extractor: (match: RegExpMatchArray, fullText: string) => {
      // Extract property name from the match or look for it in the full text
      const propertyName = match[1]?.trim() ||
        fullText.match(/(?:property|at)\s+['""]?([^'""\n,]+)['""]?/i)?.[1]?.trim() ||
        'Unknown Property'

      // Look for guest details in the full text
      const guestMatch = fullText.match(/(?:guest|for)\s+['""]?([^'""\n,]+)['""]?/i)
      const emailMatch = fullText.match(/email[:\s]+([^\s,\n]+)/i)
      const checkInMatch = fullText.match(/check[- ]?in[:\s]+([^\s,\n]+)/i)
      const checkOutMatch = fullText.match(/check[- ]?out[:\s]+([^\s,\n]+)/i)
      const guestCountMatch = fullText.match(/(\d+)\s+guests?/i)

      return {
        propertyName: propertyName,
        guestName: guestMatch?.[1]?.trim() || 'Sample Guest',
        guestEmail: emailMatch?.[1]?.trim() || 'sample.guest@example.com',
        checkInDate: checkInMatch?.[1]?.trim() || '2025-08-01',
        checkOutDate: checkOutMatch?.[1]?.trim() || '2025-08-07',
        guestCount: guestCountMatch?.[1] ? parseInt(guestCountMatch[1]) : 2,
        price: 0,
        specialRequests: ''
      }
    }
  },

  // Staff reassignment patterns
  {
    pattern: /reassign\s+([a-zA-Z\s]+)\s+from\s+job\s+([a-zA-Z0-9\-_]+)\s+to\s+job\s+([a-zA-Z0-9\-_]+)/gi,
    type: 'reassign_staff' as const,
    collection: 'jobs',
    operation: 'update' as const,
    safetyLevel: 'caution' as const,
    extractor: (match: RegExpMatchArray) => ({
      staffName: match[1].trim(),
      fromJobId: match[2].trim(),
      toJobId: match[3].trim()
    })
  }
]

/**
 * Parse AI response for actionable commands
 */
export function parseCommands(aiResponse: string): CommandParsingResult {
  const commands: ParsedCommand[] = []
  let commandCounter = 0

  for (const pattern of COMMAND_PATTERNS) {
    const matches = Array.from(aiResponse.matchAll(pattern.pattern))

    for (const match of matches) {
      try {
        const extractedData = pattern.extractor(match)
        const commandId = `cmd_${Date.now()}_${commandCounter++}`

        const command: ParsedCommand = {
          id: commandId,
          type: pattern.type,
          collection: pattern.collection,
          operation: pattern.operation,
          data: extractedData,
          description: generateCommandDescription(pattern.type, extractedData),
          confidence: calculateConfidence(match, pattern),
          originalText: match[0],
          requiresConfirmation: true,
          safetyLevel: pattern.safetyLevel
        }

        // Add document ID if available
        if (extractedData.jobId) {
          command.documentId = extractedData.jobId
        } else if (extractedData.bookingId) {
          command.documentId = extractedData.bookingId
        }

        commands.push(command)
      } catch (error) {
        console.error('Error parsing command:', error)
      }
    }
  }

  return {
    hasCommands: commands.length > 0,
    commands,
    originalMessage: aiResponse
  }
}

/**
 * Generate human-readable description for command
 */
function generateCommandDescription(type: string, data: any): string {
  switch (type) {
    case 'assign_staff':
      return `Assign ${data.staffName} to job ${data.jobId}`

    case 'approve_booking':
      return `Approve booking ${data.bookingId}`

    case 'reschedule_job':
      return `Reschedule job from ${data.originalDate} to ${data.newDate}`

    case 'update_calendar':
      return data.bookingId
        ? `Update calendar for booking ${data.bookingId}`
        : 'Update calendar to reflect changes'

    case 'create_job':
      return data.date
        ? `Create job for ${data.property} on ${data.date}`
        : `Create job for ${data.property}`

    case 'update_booking':
      return `Update booking ${data.bookingId}: ${data.updates}`

    case 'delete_job':
      return `Delete job ${data.jobId}${data.hasOverride ? ' (with override)' : ''}`

    case 'reassign_staff':
      return `Reassign ${data.staffName} from job ${data.fromJobId} to job ${data.toJobId}`

    default:
      return 'Unknown command'
  }
}

/**
 * Calculate confidence score for command recognition
 */
function calculateConfidence(match: RegExpMatchArray, pattern: any): number {
  let confidence = 0.7 // Base confidence

  // Increase confidence for exact matches
  if (match[0].toLowerCase().includes(pattern.type.replace('_', ' '))) {
    confidence += 0.2
  }

  // Increase confidence for complete parameter extraction
  if (match.length > 1 && match.every(m => m && m.trim())) {
    confidence += 0.1
  }

  return Math.min(confidence, 1.0)
}

/**
 * Validate command before execution
 */
export function validateCommand(command: ParsedCommand): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Basic validation
  if (!command.type || !command.collection || !command.operation) {
    errors.push('Invalid command structure')
  }

  // Type-specific validation
  switch (command.type) {
    case 'assign_staff':
      if (!command.data.staffName || !command.data.jobId) {
        errors.push('Staff name and job ID are required')
      }
      break

    case 'approve_booking':
      if (!command.data.bookingId) {
        errors.push('Booking ID is required')
      }
      break

    case 'delete_job':
      if (!command.data.hasOverride && command.safetyLevel === 'dangerous') {
        errors.push('Job deletion requires override keyword')
      }
      break
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
