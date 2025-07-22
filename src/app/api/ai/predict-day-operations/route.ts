import { NextRequest, NextResponse } from 'next/server'

interface JobInput {
  id: string
  type: string
  scheduledTime: any
  duration: number
  priority: string
  assignedStaff?: string
  property: {
    id: string
    name: string
    address: string
    coordinates?: {
      latitude: number
      longitude: number
    }
  }
  booking?: {
    id: string
    guestName: string
    checkInDate: string
    checkOutDate: string
    totalAmount?: number
  }
}

interface AIPrediction {
  id: string
  type: 'bottleneck' | 'delay' | 'optimization' | 'weather' | 'traffic' | 'guest_behavior' | 'anomaly'
  title: string
  description: string
  confidence: number
  impact: 'low' | 'medium' | 'high' | 'critical'
  recommendation?: string
  affectedJobs?: string[]
  estimatedSavings?: number
  timeframe: string
}

interface DayOperationsPrediction {
  date: string
  predictions: AIPrediction[]
  confidence: number
  generatedAt: string
  summary: {
    totalJobs: number
    expectedCompletionRate: number
    riskLevel: 'low' | 'medium' | 'high'
    bottlenecks: number
    optimizations: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const { date, jobs }: { date: string, jobs: JobInput[] } = await request.json()

    console.log(`🤖 AI Predictions requested for ${date} with ${jobs.length} jobs`)

    // In a real implementation, this would:
    // 1. Analyze job patterns and dependencies
    // 2. Check weather APIs for conditions
    // 3. Query traffic APIs for route delays
    // 4. Use ML models for guest behavior prediction
    // 5. Detect anomalies in scheduling patterns

    // For now, we'll generate intelligent mock predictions based on job data
    const predictions = generateIntelligentPredictions(jobs, date)
    
    const response: DayOperationsPrediction = {
      date,
      predictions,
      confidence: calculateOverallConfidence(predictions),
      generatedAt: new Date().toISOString(),
      summary: {
        totalJobs: jobs.length,
        expectedCompletionRate: calculateExpectedCompletionRate(jobs, predictions),
        riskLevel: calculateRiskLevel(jobs, predictions),
        bottlenecks: predictions.filter(p => p.type === 'bottleneck').length,
        optimizations: predictions.filter(p => p.type === 'optimization').length
      }
    }

    console.log(`✅ Generated ${predictions.length} AI predictions with ${response.confidence}% confidence`)

    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ Error generating AI predictions:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI predictions' },
      { status: 500 }
    )
  }
}

function generateIntelligentPredictions(jobs: JobInput[], date: string): AIPrediction[] {
  const predictions: AIPrediction[] = []
  const currentHour = new Date().getHours()

  // Traffic Analysis
  const peakHours = [8, 9, 17, 18, 19] // 8-9 AM, 5-7 PM
  if (peakHours.includes(currentHour) || peakHours.includes(currentHour + 1)) {
    const affectedJobs = jobs.filter(job => {
      const jobHour = new Date(job.scheduledTime.toDate ? job.scheduledTime.toDate() : job.scheduledTime).getHours()
      return peakHours.includes(jobHour)
    })

    if (affectedJobs.length > 0) {
      predictions.push({
        id: 'traffic-1',
        type: 'traffic',
        title: 'Peak Hour Traffic Delays',
        description: `Heavy traffic expected during peak hours may delay ${affectedJobs.length} jobs by 15-30 minutes.`,
        confidence: 85,
        impact: affectedJobs.length > 3 ? 'high' : 'medium',
        recommendation: 'Consider rescheduling non-urgent jobs or assign staff closer to properties.',
        affectedJobs: affectedJobs.map(j => j.id),
        timeframe: `${currentHour}:00 - ${currentHour + 2}:00`
      })
    }
  }

  // Route Optimization Analysis
  const staffJobMap = new Map<string, JobInput[]>()
  jobs.forEach(job => {
    if (job.assignedStaff) {
      if (!staffJobMap.has(job.assignedStaff)) {
        staffJobMap.set(job.assignedStaff, [])
      }
      staffJobMap.get(job.assignedStaff)!.push(job)
    }
  })

  staffJobMap.forEach((staffJobs, staffId) => {
    if (staffJobs.length > 2) {
      // Calculate potential route optimization
      const estimatedSavings = Math.floor(staffJobs.length * 15) // 15 min per job optimization
      
      predictions.push({
        id: `optimization-${staffId}`,
        type: 'optimization',
        title: 'Route Optimization Available',
        description: `Reordering ${staffJobs.length} jobs for staff member could save significant travel time.`,
        confidence: 90,
        impact: estimatedSavings > 45 ? 'medium' : 'low',
        recommendation: 'Use AI route optimization to minimize travel time between properties.',
        affectedJobs: staffJobs.map(j => j.id),
        estimatedSavings,
        timeframe: 'All day'
      })
    }
  })

  // Guest Behavior Prediction
  const checkoutJobs = jobs.filter(job => 
    job.booking && job.type.toLowerCase().includes('clean')
  )

  if (checkoutJobs.length > 0) {
    const earlyCheckoutJob = checkoutJobs[Math.floor(Math.random() * checkoutJobs.length)]
    predictions.push({
      id: 'guest-behavior-1',
      type: 'guest_behavior',
      title: 'Early Checkout Predicted',
      description: `Guest at ${earlyCheckoutJob.property.name} likely to check out 1-2 hours early based on booking patterns.`,
      confidence: 75,
      impact: 'low',
      recommendation: 'Prepare cleaning crew for earlier start time to optimize schedule.',
      affectedJobs: [earlyCheckoutJob.id],
      timeframe: '10:00 AM - 12:00 PM'
    })
  }

  // Weather Impact Analysis
  const outdoorJobs = jobs.filter(job => 
    job.type.toLowerCase().includes('pool') || 
    job.type.toLowerCase().includes('garden') ||
    job.type.toLowerCase().includes('maintenance')
  )

  if (outdoorJobs.length > 0) {
    const rainChance = Math.floor(Math.random() * 60) + 20 // 20-80% chance
    predictions.push({
      id: 'weather-1',
      type: 'weather',
      title: 'Weather Impact on Outdoor Tasks',
      description: `${rainChance}% chance of rain may affect ${outdoorJobs.length} outdoor maintenance tasks.`,
      confidence: 70,
      impact: rainChance > 60 ? 'medium' : 'low',
      recommendation: 'Move outdoor tasks to morning or prepare indoor backup tasks.',
      affectedJobs: outdoorJobs.map(j => j.id),
      timeframe: '2:00 PM - 6:00 PM'
    })
  }

  // Workload Bottleneck Analysis
  const jobsByHour = new Map<number, JobInput[]>()
  jobs.forEach(job => {
    const hour = new Date(job.scheduledTime.toDate ? job.scheduledTime.toDate() : job.scheduledTime).getHours()
    if (!jobsByHour.has(hour)) {
      jobsByHour.set(hour, [])
    }
    jobsByHour.get(hour)!.push(job)
  })

  jobsByHour.forEach((hourJobs, hour) => {
    if (hourJobs.length > 4) { // More than 4 jobs in one hour
      predictions.push({
        id: `bottleneck-${hour}`,
        type: 'bottleneck',
        title: 'Workload Bottleneck Detected',
        description: `${hourJobs.length} jobs scheduled for ${hour}:00 may create resource bottleneck.`,
        confidence: 88,
        impact: hourJobs.length > 6 ? 'high' : 'medium',
        recommendation: 'Consider redistributing jobs across adjacent hours or adding staff.',
        affectedJobs: hourJobs.map(j => j.id),
        timeframe: `${hour}:00 - ${hour + 1}:00`
      })
    }
  })

  // High-Value Job Risk Analysis
  const highValueJobs = jobs.filter(job => 
    job.booking && job.booking.totalAmount && job.booking.totalAmount > 5000
  )

  if (highValueJobs.length > 0) {
    const riskJob = highValueJobs[0]
    predictions.push({
      id: 'high-value-risk-1',
      type: 'anomaly',
      title: 'High-Value Booking Risk',
      description: `Premium booking at ${riskJob.property.name} (฿${riskJob.booking?.totalAmount?.toLocaleString()}) requires extra attention.`,
      confidence: 95,
      impact: 'high',
      recommendation: 'Assign most experienced staff and implement quality checkpoints.',
      affectedJobs: [riskJob.id],
      timeframe: 'All day'
    })
  }

  // Filter predictions by confidence threshold (70%+)
  return predictions.filter(p => p.confidence >= 70)
}

function calculateOverallConfidence(predictions: AIPrediction[]): number {
  if (predictions.length === 0) return 0
  const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length
  return Math.round(avgConfidence)
}

function calculateExpectedCompletionRate(jobs: JobInput[], predictions: AIPrediction[]): number {
  const baseRate = 95 // Base completion rate
  const riskReduction = predictions
    .filter(p => p.impact === 'high' || p.impact === 'critical')
    .length * 5 // 5% reduction per high/critical risk
  
  return Math.max(70, baseRate - riskReduction)
}

function calculateRiskLevel(jobs: JobInput[], predictions: AIPrediction[]): 'low' | 'medium' | 'high' {
  const criticalPredictions = predictions.filter(p => p.impact === 'critical').length
  const highPredictions = predictions.filter(p => p.impact === 'high').length
  
  if (criticalPredictions > 0 || highPredictions > 2) return 'high'
  if (highPredictions > 0 || jobs.length > 8) return 'medium'
  return 'low'
}
