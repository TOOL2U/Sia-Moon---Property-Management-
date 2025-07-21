/**
 * AI Intent Detection System
 * Detects structured intent from user messages and extracts action parameters
 */

export interface DetectedIntent {
  action: string
  confidence: number
  parameters: Record<string, any>
  requiresConfirmation: boolean
  safetyLevel: 'safe' | 'caution' | 'dangerous'
  description: string
  originalText: string
}

export interface IntentPattern {
  patterns: RegExp[]
  action: string
  safetyLevel: 'safe' | 'caution' | 'dangerous'
  requiresConfirmation: boolean
  extractor: (match: RegExpMatchArray, fullText: string) => Record<string, any>
  description: string
}

/**
 * Intent patterns for different actions
 */
const INTENT_PATTERNS: IntentPattern[] = [
  // Booking Creation
  {
    patterns: [
      /create\s+(?:a\s+)?(?:new\s+)?booking\s+(?:for\s+)?(?:property\s+)?['""]?([^'""\n,]+)['""]?/gi,
      /make\s+(?:a\s+)?booking\s+(?:for\s+)?(?:property\s+)?['""]?([^'""\n,]+)['""]?/gi,
      /book\s+(?:property\s+)?['""]?([^'""\n,]+)['""]?/gi
    ],
    action: 'createBooking',
    safetyLevel: 'safe',
    requiresConfirmation: false,
    description: 'Create a new booking',
    extractor: (match: RegExpMatchArray, fullText: string) => {
      const propertyName = match[1]?.trim() || extractPropertyName(fullText)
      const guestName = extractGuestName(fullText) || 'Sample Guest'
      const guestEmail = extractEmail(fullText) || `${guestName.toLowerCase().replace(/\s+/g, '.')}@example.com`
      const dates = extractDates(fullText)
      const guestCount = extractGuestCount(fullText) || 2

      return {
        propertyName,
        guestName,
        guestEmail,
        checkInDate: dates.checkIn || getDefaultCheckIn(),
        checkOutDate: dates.checkOut || getDefaultCheckOut(),
        guestCount,
        price: 0,
        specialRequests: extractSpecialRequests(fullText) || ''
      }
    }
  },

  // Booking Approval
  {
    patterns: [
      /approve\s+booking\s+([a-zA-Z0-9]+)/gi,
      /confirm\s+booking\s+([a-zA-Z0-9]+)/gi,
      /accept\s+booking\s+([a-zA-Z0-9]+)/gi
    ],
    action: 'approveBooking',
    safetyLevel: 'caution',
    requiresConfirmation: true,
    description: 'Approve a pending booking',
    extractor: (match: RegExpMatchArray, fullText: string) => ({
      bookingId: match[1]?.trim(),
      sendConfirmation: fullText.includes('send confirmation') || fullText.includes('notify guest'),
      notes: extractNotes(fullText)
    })
  },

  // Staff Assignment
  {
    patterns: [
      /assign\s+(?:staff\s+)?['""]?([^'""\n,]+)['""]?\s+to\s+(?:job\s+)?['""]?([^'""\n,]+)['""]?/gi,
      /give\s+(?:job\s+)?['""]?([^'""\n,]+)['""]?\s+to\s+(?:staff\s+)?['""]?([^'""\n,]+)['""]?/gi
    ],
    action: 'assignStaffToJob',
    safetyLevel: 'safe',
    requiresConfirmation: false,
    description: 'Assign staff member to a job',
    extractor: (match: RegExpMatchArray, fullText: string) => {
      // Check if it's "assign staff X to job Y" or "assign job X to staff Y"
      const isStaffFirst = /assign\s+staff/.test(fullText)

      return {
        staffName: isStaffFirst ? match[1]?.trim() : match[2]?.trim(),
        jobId: isStaffFirst ? match[2]?.trim() : match[1]?.trim(),
        priority: extractPriority(fullText) || 'medium',
        notes: extractNotes(fullText) || ''
      }
    }
  },

  // Calendar Event Creation
  {
    patterns: [
      /(?:create|add|schedule)\s+(?:a\s+)?(?:calendar\s+)?event\s+(?:for\s+)?['""]?([^'""\n,]+)['""]?/gi,
      /(?:add|put)\s+['""]?([^'""\n,]+)['""]?\s+(?:on|to)\s+(?:the\s+)?calendar/gi
    ],
    action: 'createCalendarEvent',
    safetyLevel: 'safe',
    requiresConfirmation: false,
    description: 'Create a calendar event',
    extractor: (match: RegExpMatchArray, fullText: string) => {
      const eventTitle = match[1]?.trim() || 'New Event'
      const dates = extractDates(fullText)
      const property = extractPropertyName(fullText)

      return {
        title: eventTitle,
        property: property || 'Unknown Property',
        date: dates.checkIn || dates.single || getDefaultCheckIn(),
        startTime: extractTime(fullText) || '09:00',
        duration: extractDuration(fullText) || 120,
        eventType: extractEventType(fullText) || 'general',
        description: extractNotes(fullText) || ''
      }
    }
  },

  // Job Creation
  {
    patterns: [
      /create\s+(?:a\s+)?(?:new\s+)?job\s+(?:for\s+)?['""]?([^'""\n,]+)['""]?/gi,
      /schedule\s+(?:a\s+)?(?:cleaning|maintenance|inspection)\s+(?:for\s+)?['""]?([^'""\n,]+)['""]?/gi
    ],
    action: 'createJob',
    safetyLevel: 'safe',
    requiresConfirmation: false,
    description: 'Create a new job',
    extractor: (match: RegExpMatchArray, fullText: string) => ({
      property: match[1]?.trim() || extractPropertyName(fullText) || 'Unknown Property',
      jobType: extractJobType(fullText) || 'cleaning',
      scheduledDate: extractDates(fullText).single || getDefaultCheckIn(),
      priority: extractPriority(fullText) || 'medium',
      description: extractNotes(fullText) || `${extractJobType(fullText) || 'Job'} for ${match[1]?.trim()}`,
      estimatedDuration: extractDuration(fullText) || 120
    })
  },

  // Staff Notification
  {
    patterns: [
      /(?:send|notify)\s+(?:staff\s+)?['""]?([^'""\n,]+)['""]?\s+about\s+['""]?([^'""\n,]+)['""]?/gi,
      /notify\s+['""]?([^'""\n,]+)['""]?\s+(?:that|about)\s+['""]?([^'""\n,]+)['""]?/gi
    ],
    action: 'sendStaffNotification',
    safetyLevel: 'safe',
    requiresConfirmation: false,
    description: 'Send notification to staff',
    extractor: (match: RegExpMatchArray, fullText: string) => ({
      staffName: match[1]?.trim(),
      message: match[2]?.trim(),
      priority: extractPriority(fullText) || 'normal',
      type: extractNotificationType(fullText) || 'general'
    })
  }
]

/**
 * Detect intent from user message
 */
export function detectIntent(message: string): DetectedIntent[] {
  console.log('🔍 INTENT DETECTOR: Processing message:', message)
  const detectedIntents: DetectedIntent[] = []

  for (const intentPattern of INTENT_PATTERNS) {
    console.log(`🔍 INTENT DETECTOR: Testing pattern for action: ${intentPattern.action}`)

    for (const pattern of intentPattern.patterns) {
      const matches = Array.from(message.matchAll(pattern))
      console.log(`🔍 INTENT DETECTOR: Pattern ${pattern.source} found ${matches.length} matches`)

      for (const match of matches) {
        try {
          console.log(`🔍 INTENT DETECTOR: Processing match:`, match[0])
          const parameters = intentPattern.extractor(match, message)
          const confidence = calculateConfidence(match, message, intentPattern)

          console.log(`🔍 INTENT DETECTOR: Extracted parameters:`, parameters)
          console.log(`🔍 INTENT DETECTOR: Confidence: ${Math.round(confidence * 100)}%`)

          detectedIntents.push({
            action: intentPattern.action,
            confidence,
            parameters,
            requiresConfirmation: intentPattern.requiresConfirmation,
            safetyLevel: intentPattern.safetyLevel,
            description: intentPattern.description,
            originalText: match[0]
          })
        } catch (error) {
          console.error('Error extracting parameters for intent:', error)
        }
      }
    }
  }

  console.log(`🔍 INTENT DETECTOR: Total intents detected: ${detectedIntents.length}`)

  // Sort by confidence and remove duplicates
  const finalIntents = detectedIntents
    .sort((a, b) => b.confidence - a.confidence)
    .filter((intent, index, arr) =>
      arr.findIndex(i => i.action === intent.action) === index
    )

  console.log(`🔍 INTENT DETECTOR: Final intents after deduplication:`, finalIntents.map(i => `${i.action} (${Math.round(i.confidence * 100)}%)`))

  return finalIntents
}

/**
 * Helper functions for parameter extraction
 */
function extractPropertyName(text: string): string | null {
  const patterns = [
    /(?:property|at|for)\s+['""]?([^'""\n,]+)['""]?/i,
    /['""]([^'""\n,]+)['""]?\s+(?:property|house|villa)/i
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[1].trim()
  }

  return null
}

function extractGuestName(text: string): string | null {
  const patterns = [
    /(?:guest|for|customer)\s+['""]?([^'""\n,]+)['""]?/i,
    /['""]([^'""\n,]+)['""]?\s+(?:booking|reservation)/i
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[1].trim()
  }

  return null
}

function extractEmail(text: string): string | null {
  const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
  const match = text.match(emailPattern)
  return match ? match[1] : null
}

function extractDates(text: string): { checkIn?: string; checkOut?: string; single?: string } {
  const datePatterns = {
    checkIn: /check[- ]?in\s+(?:date\s+)?['""]?([^'""\n,]+)['""]?/i,
    checkOut: /check[- ]?out\s+(?:date\s+)?['""]?([^'""\n,]+)['""]?/i,
    single: /(?:on|for)\s+([0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4}|[a-zA-Z]+ [0-9]{1,2})/i
  }

  const result: any = {}

  for (const [key, pattern] of Object.entries(datePatterns)) {
    const match = text.match(pattern)
    if (match) {
      result[key] = normalizeDate(match[1].trim())
    }
  }

  return result
}

function extractGuestCount(text: string): number | null {
  const match = text.match(/(\d+)\s+guests?/i)
  return match ? parseInt(match[1]) : null
}

function extractSpecialRequests(text: string): string | null {
  const patterns = [
    /(?:special|additional|extra)\s+(?:requests?|requirements?|notes?)[:\s]+([^.!?\n]+)/i,
    /notes?[:\s]+([^.!?\n]+)/i
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[1].trim()
  }

  return null
}

function extractNotes(text: string): string | null {
  return extractSpecialRequests(text)
}

function extractPriority(text: string): string | null {
  const priorities = ['urgent', 'high', 'medium', 'low']
  for (const priority of priorities) {
    if (text.toLowerCase().includes(priority)) {
      return priority
    }
  }
  return null
}

function extractJobType(text: string): string | null {
  const jobTypes = ['cleaning', 'maintenance', 'inspection', 'setup', 'repair']
  for (const jobType of jobTypes) {
    if (text.toLowerCase().includes(jobType)) {
      return jobType
    }
  }
  return null
}

function extractEventType(text: string): string | null {
  const eventTypes = ['booking', 'cleaning', 'maintenance', 'inspection', 'meeting']
  for (const eventType of eventTypes) {
    if (text.toLowerCase().includes(eventType)) {
      return eventType
    }
  }
  return null
}

function extractTime(text: string): string | null {
  const timePattern = /(\d{1,2}):(\d{2})\s*(am|pm)?/i
  const match = text.match(timePattern)
  if (match) {
    let hour = parseInt(match[1])
    const minute = match[2]
    const ampm = match[3]?.toLowerCase()

    if (ampm === 'pm' && hour !== 12) hour += 12
    if (ampm === 'am' && hour === 12) hour = 0

    return `${hour.toString().padStart(2, '0')}:${minute}`
  }
  return null
}

function extractDuration(text: string): number | null {
  const patterns = [
    /(\d+)\s*hours?/i,
    /(\d+)\s*minutes?/i,
    /(\d+)\s*mins?/i
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const value = parseInt(match[1])
      return pattern.source.includes('hour') ? value * 60 : value
    }
  }

  return null
}

function extractNotificationType(text: string): string | null {
  const types = ['urgent', 'reminder', 'update', 'assignment', 'general']
  for (const type of types) {
    if (text.toLowerCase().includes(type)) {
      return type
    }
  }
  return null
}

function normalizeDate(dateStr: string): string {
  // Try to parse and normalize the date
  try {
    const date = new Date(dateStr)
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]
    }
  } catch (error) {
    // If parsing fails, return as-is
  }

  return dateStr
}

function getDefaultCheckIn(): string {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
}

function getDefaultCheckOut(): string {
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  return nextWeek.toISOString().split('T')[0]
}

function calculateConfidence(match: RegExpMatchArray, fullText: string, pattern: IntentPattern): number {
  let confidence = 0.7 // Base confidence

  // Increase confidence based on match quality
  if (match[0].length > 10) confidence += 0.1
  if (match.length > 2) confidence += 0.1 // Multiple capture groups

  // Increase confidence if we found additional context
  if (extractPropertyName(fullText)) confidence += 0.1
  if (extractDates(fullText).checkIn || extractDates(fullText).single) confidence += 0.1

  return Math.min(confidence, 1.0)
}
