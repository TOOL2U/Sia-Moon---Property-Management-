import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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
