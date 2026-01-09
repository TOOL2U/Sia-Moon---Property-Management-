import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Lazy initialize OpenAI client
function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'placeholder-key-not-configured') {
    return null
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

export async function POST(request: NextRequest) {
  try {
    const { bookings } = await request.json()

    console.log('📊 OPENAI API: Generating booking summary...')

    const totalBookings = bookings.length
    const pendingBookings = bookings.filter((b: any) => b.status === 'pending_approval').length
    const totalRevenue = bookings.reduce((sum: number, b: any) => sum + (b.price || 0), 0)
    const avgBookingValue = totalRevenue / totalBookings

    const urgentBookings = bookings.filter((b: any) => {
      const daysUntil = Math.ceil((new Date(b.checkInDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      return daysUntil <= 3
    }).length

    const openai = getOpenAIClient()

    // If OpenAI is not configured, return a basic summary
    if (!openai) {
      console.log('⚠️ OpenAI not configured, using basic summary')
      return NextResponse.json({
        success: true,
        summary: `Current Status: ${totalBookings} total bookings with ${pendingBookings} pending approval. Total revenue: $${totalRevenue.toLocaleString()}. ${urgentBookings} urgent bookings require immediate attention. Priority: Review and approve pending bookings, especially those with check-in dates within 3 days.`
      })
    }

    const prompt = `
Generate a concise executive summary for villa booking management:

CURRENT METRICS:
- Total Bookings: ${totalBookings}
- Pending Approval: ${pendingBookings}
- Total Revenue: $${totalRevenue.toLocaleString()}
- Average Booking Value: $${avgBookingValue.toFixed(0)}
- Urgent Bookings (≤3 days): ${urgentBookings}

Provide a brief, professional summary highlighting:
1. Current status and key metrics
2. Priority actions needed
3. Revenue insights
4. Operational recommendations

Keep it under 150 words and actionable for property managers.
`

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a property management consultant providing executive summaries."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 200
    })

    const summary = completion.choices[0]?.message?.content || 'Summary unavailable'
    
    console.log('✅ OPENAI API: Summary generated')
    
    return NextResponse.json({
      success: true,
      summary
    })
    
  } catch (error) {
    console.error('❌ OPENAI API: Error generating summary:', error)
    
    return NextResponse.json({
      success: true,
      summary: 'AI summary temporarily unavailable. Please review bookings manually.'
    })
  }
}
