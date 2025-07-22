import { NextRequest, NextResponse } from 'next/server'
import { aiActivityLogger, AIActivity } from '@/services/AIActivityLogger'

export async function POST(request: NextRequest) {
  try {
    const activityData: Omit<AIActivity, 'id' | 'timestamp'> = await request.json()
    
    console.log(`🤖 AI Activity log request: ${activityData.type} - ${activityData.description}`)

    // Validate required fields
    if (!activityData.type || !activityData.description || !activityData.confidence) {
      return NextResponse.json(
        { error: 'Missing required fields: type, description, confidence' },
        { status: 400 }
      )
    }

    // Validate confidence range
    if (activityData.confidence < 0 || activityData.confidence > 100) {
      return NextResponse.json(
        { error: 'Confidence must be between 0 and 100' },
        { status: 400 }
      )
    }

    // Log the activity
    const activityId = await aiActivityLogger.logActivity(activityData)

    const response = {
      success: true,
      activityId,
      message: 'AI activity logged successfully',
      activity: {
        id: activityId,
        type: activityData.type,
        description: activityData.description,
        confidence: activityData.confidence,
        impact: activityData.impact,
        timestamp: new Date().toISOString()
      }
    }

    console.log(`✅ AI Activity logged: ${activityId}`)

    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ Error logging AI activity:', error)
    return NextResponse.json(
      { error: 'Failed to log AI activity' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '20')
    const source = searchParams.get('source')

    console.log(`📊 AI Activity query: type=${type}, limit=${limit}, source=${source}`)

    // For now, return mock data since we don't have a query method yet
    // In production, this would query the Firebase collection with filters
    const mockActivities = [
      {
        id: '1',
        type: 'route_optimization',
        description: 'Optimized route for 3 jobs, saving 35 minutes',
        reasoning: 'Clustered nearby properties to reduce travel time',
        impact: 'medium',
        confidence: 92,
        automated: true,
        relatedEntities: {
          staffIds: ['staff_001'],
          jobIds: ['job_001', 'job_002', 'job_003']
        },
        metadata: {
          timeSaved: 35,
          efficiencyGain: 25
        },
        source: 'system',
        status: 'completed',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        type: 'delay_prediction',
        description: 'Predicted 75% delay risk for upcoming job',
        reasoning: 'Traffic congestion and weather conditions indicate high delay probability',
        impact: 'high',
        confidence: 88,
        automated: true,
        relatedEntities: {
          jobIds: ['job_004'],
          propertyIds: ['prop_001']
        },
        metadata: {
          delayRisk: 75,
          estimatedDelay: 25
        },
        source: 'system',
        status: 'active',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        type: 'booking_decision',
        description: 'Booking approved with 94% confidence',
        reasoning: 'Guest profile and booking value meet approval criteria',
        impact: 'medium',
        confidence: 94,
        automated: true,
        relatedEntities: {
          bookingIds: ['booking_001'],
          staffIds: ['staff_002']
        },
        metadata: {
          decision: 'approved',
          revenueImpact: 4500
        },
        source: 'ai_coo',
        status: 'completed',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
      }
    ]

    // Apply filters
    let filteredActivities = mockActivities
    
    if (type) {
      filteredActivities = filteredActivities.filter(activity => activity.type === type)
    }
    
    if (source) {
      filteredActivities = filteredActivities.filter(activity => activity.source === source)
    }

    // Apply limit
    filteredActivities = filteredActivities.slice(0, limit)

    const response = {
      success: true,
      activities: filteredActivities,
      total: filteredActivities.length,
      filters: { type, source, limit }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ Error querying AI activities:', error)
    return NextResponse.json(
      { error: 'Failed to query AI activities' },
      { status: 500 }
    )
  }
}
