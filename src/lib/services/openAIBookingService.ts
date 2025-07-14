// OpenAI client moved to server-side API routes to avoid client-side environment variable issues

export interface BookingAIAnalysis {
  tags: string[]
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical'
  urgencyScore: number
  priorityReason: string
  suggestedActions: string[]
  riskFactors: string[]
  insights: string[]
}

export class OpenAIBookingService {
  
  /**
   * Analyze booking with OpenAI for tags, urgency, and insights
   */
  static async analyzeBooking(bookingData: {
    guestName: string
    villaName: string
    checkInDate: string
    checkOutDate: string
    price: number
    specialRequests?: string
    guestEmail?: string
    guests?: number
  }): Promise<BookingAIAnalysis> {
    try {
      console.log('🤖 OPENAI: Analyzing booking with AI...')

      // Call server-side API route for OpenAI analysis
      const response = await fetch('/api/openai/analyze-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData)
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'API request failed')
      }

      console.log('✅ OPENAI: Booking analysis completed')
      console.log('🏷️ Tags:', result.analysis.tags)
      console.log('⚡ Urgency:', result.analysis.urgencyLevel, `(${result.analysis.urgencyScore}/100)`)

      return result.analysis
      
    } catch (error) {
      console.error('❌ OPENAI: Error analyzing booking:', error)
      
      // Fallback analysis based on simple rules
      const daysUntilCheckIn = Math.ceil((new Date(bookingData.checkInDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      
      let urgencyLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
      let urgencyScore = 25
      
      if (daysUntilCheckIn <= 1) {
        urgencyLevel = 'critical'
        urgencyScore = 95
      } else if (daysUntilCheckIn <= 3) {
        urgencyLevel = 'high'
        urgencyScore = 80
      } else if (daysUntilCheckIn <= 7) {
        urgencyLevel = 'medium'
        urgencyScore = 60
      }
      
      const fallbackTags = []
      if (bookingData.price > 15000) fallbackTags.push('high-value')
      if (daysUntilCheckIn <= 3) fallbackTags.push('last-minute')
      if (bookingData.guests && bookingData.guests > 6) fallbackTags.push('large-group')
      if (bookingData.specialRequests) fallbackTags.push('special-requests')
      
      return {
        tags: fallbackTags,
        urgencyLevel,
        urgencyScore,
        priorityReason: `${daysUntilCheckIn} days until check-in`,
        suggestedActions: ['Review booking details', 'Prepare property'],
        riskFactors: ['Limited preparation time'],
        insights: ['Fallback analysis - OpenAI unavailable']
      }
    }
  }
  
  /**
   * Generate booking summary for admin
   */
  static async generateBookingSummary(bookings: any[]): Promise<string> {
    try {
      console.log('📊 OPENAI: Generating booking summary...')

      // Call server-side API route for OpenAI summary generation
      const response = await fetch('/api/openai/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookings })
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'API request failed')
      }

      console.log('✅ OPENAI: Summary generated')
      return result.summary
      
    } catch (error) {
      console.error('❌ OPENAI: Error generating summary:', error)
      return 'AI summary temporarily unavailable. Please review bookings manually.'
    }
  }
}
