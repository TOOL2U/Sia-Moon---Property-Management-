import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface BookingAIAnalysis {
  tags: string[]
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical'
  urgencyScore: number
  priorityReason: string
  suggestedActions: string[]
  riskFactors: string[]
  insights: string[]
}

export async function POST(request: NextRequest) {
  let bookingData: any = {}

  try {
    bookingData = await request.json()

    console.log('🤖 OPENAI API: Analyzing booking with AI...')
    
    const checkInDate = new Date(bookingData.checkInDate)
    const now = new Date()
    const daysUntilCheckIn = Math.ceil((checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    const prompt = `
Analyze this villa booking and provide insights:

BOOKING DETAILS:
- Guest: ${bookingData.guestName}
- Email: ${bookingData.guestEmail || 'Not provided'}
- Property: ${bookingData.villaName}
- Check-in: ${bookingData.checkInDate} (${daysUntilCheckIn} days from now)
- Check-out: ${bookingData.checkOutDate}
- Price: $${bookingData.price}
- Guests: ${bookingData.guests || 'Not specified'}
- Special Requests: ${bookingData.specialRequests || 'None'}

Please provide a JSON response with:
1. tags: Array of relevant tags (e.g., "high-value", "last-minute", "family", "luxury", "repeat-guest", "special-occasion")
2. urgencyLevel: "low", "medium", "high", or "critical"
3. urgencyScore: Number from 1-100
4. priorityReason: Brief explanation of urgency level
5. suggestedActions: Array of recommended actions for staff
6. riskFactors: Array of potential issues to watch for
7. insights: Array of helpful observations about this booking

Consider factors like:
- Days until check-in (urgency increases as date approaches)
- Booking value (higher value = higher priority)
- Special requests complexity
- Guest count vs property capacity
- Seasonal demand patterns
- Potential preparation requirements
`

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert villa booking analyst. Provide detailed, actionable insights for property management staff. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from OpenAI')
    }

    // Parse JSON response
    const analysis = JSON.parse(response) as BookingAIAnalysis
    
    console.log('✅ OPENAI API: Booking analysis completed')
    console.log('🏷️ Tags:', analysis.tags)
    console.log('⚡ Urgency:', analysis.urgencyLevel, `(${analysis.urgencyScore}/100)`)
    
    return NextResponse.json({
      success: true,
      analysis
    })
    
  } catch (error) {
    console.error('❌ OPENAI API: Error analyzing booking:', error)

    // Fallback analysis based on simple rules
    const daysUntilCheckIn = bookingData.checkInDate ?
      Math.ceil((new Date(bookingData.checkInDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) :
      7
    
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
    
    return NextResponse.json({
      success: true,
      analysis: {
        tags: fallbackTags,
        urgencyLevel,
        urgencyScore,
        priorityReason: `${daysUntilCheckIn} days until check-in`,
        suggestedActions: ['Review booking details', 'Prepare property'],
        riskFactors: ['Limited preparation time'],
        insights: ['Fallback analysis - OpenAI unavailable']
      }
    })
  }
}
