import { NextRequest, NextResponse } from "next/server"

// Dynamic rule loading function
async function loadCompanyRules(): Promise<string[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ai-policy`, {
      cache: "no-store"
    })

    if (response.ok) {
      const data = await response.json()
      return data.rules || []
    } else {
      console.warn('⚠️ AI COO: Failed to load dynamic rules, using fallback')
      return [
        "Reject bookings missing address or job type information",
        "Never assign staff more than 5km away unless marked as remote-capable",
        "Flag jobs over ฿5,000 for human review (reduce confidence)",
        "Prioritize staff with highest ratings for VIP customers",
        "Ensure minimum 2-hour gap between staff assignments"
      ]
    }
  } catch (error) {
    console.error('❌ AI COO: Error loading dynamic rules:', error)
    return [
      "Reject bookings missing address or job type information",
      "Never assign staff more than 5km away unless marked as remote-capable",
      "Flag jobs over ฿5,000 for human review (reduce confidence)",
      "Prioritize staff with highest ratings for VIP customers",
      "Ensure minimum 2-hour gap between staff assignments"
    ]
  }
}

// Mock logAIAction function for now
async function logAIAction(entry: any) {
  console.log('📝 AI COO: Logging action:', entry)

  try {
    const response = await fetch('/api/ai-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    })

    if (response.ok) {
      console.log('✅ AI COO: Action logged successfully')
    } else {
      console.warn('⚠️ AI COO: Failed to log action to API')
    }
  } catch (error) {
    console.error('❌ AI COO: Error logging action:', error)
  }
}

// Updated booking request interface
interface BookingRequest {
  address: string
  jobType: string
  value?: number
  urgent?: boolean
  customerType?: 'standard' | 'premium' | 'vip'
  scheduledDate?: string
  notes?: string
  customerName?: string
  contactInfo?: string
}

// Decision types
type COODecision = 'approved' | 'rejected'

interface COODecisionResponse {
  decision: COODecision
  reason: string
  confidence: number
  escalate: boolean
  logs: AILogEntry[]
  assignedStaff?: {
    id: string
    name: string
    eta: string
    distance: number
  }
}

/**
 * POST /api/ai-coo
 * Process booking requests through AI COO decision-making
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now()

  try {
    console.log('🤖 AI COO: Processing booking request...')

    // Step 1: Parse and validate booking data
    const booking = await req.json()
    console.log('📋 AI COO: Received booking:', {
      address: booking.address,
      jobType: booking.jobType,
      value: booking.value
    })

    // Validate required fields using our helper function
    const validation = { isValid: true, errors: [] as string[] }

    if (!booking || !booking.address || !booking.jobType) {
      validation.isValid = false
      validation.errors.push('Missing required fields: address and jobType are required')
    }

    if (!validation.isValid) {
      console.log('❌ AI COO: Validation failed:', validation.errors)

      // Log the rejection using centralized logging
      await logAIAction({
        agent: "COO",
        decision: "reject",
        confidence: 0.95,
        rationale: `Validation failed: ${validation.errors.join(', ')}`,
        escalate: false,
        source: "booking",
        status: "completed",
        notes: "Invalid booking data provided",
        metadata: { errors: validation.errors, booking }
      })

      return NextResponse.json({
        success: false,
        error: "Invalid booking data",
        details: validation.errors,
        decision: "reject",
        confidence: 0.95,
        reason: `Validation failed: ${validation.errors.join(', ')}`
      }, { status: 400 })
    }

    // Step 2: Enrich context with staff and location data
    console.log('👥 AI COO: Fetching staff information...')
    const staff = [
      { id: 'staff_001', name: 'Maria Santos', skills: ['cleaning', 'housekeeping'], availability: 'available' },
      { id: 'staff_002', name: 'John Wilson', skills: ['maintenance', 'plumbing'], availability: 'available' }
    ]

    if (staff.length === 0) {
      console.log('⚠️ AI COO: No staff available')

      await logAIAction({
        agent: "COO",
        decision: "escalate",
        confidence: 0.3,
        rationale: "No staff available for assignment",
        escalate: true,
        source: "booking",
        status: "escalated",
        notes: "System unable to find available staff",
        metadata: { booking }
      })

      return NextResponse.json({
        success: false,
        decision: "escalate",
        confidence: 0.3,
        reason: "No staff available for assignment",
        escalate: true
      })
    }

    // Step 3: Load dynamic company rules
    console.log('📋 AI COO: Loading dynamic company rules...')
    const companyRules = await loadCompanyRules()
    console.log(`📋 AI COO: Loaded ${companyRules.length} company rules`)

    // Step 4: Load AI settings for decision parameters
    console.log('⚙️ AI COO: Loading AI settings...')
    const { getAISettings } = await import("@/lib/ai/aiSettings")
    const aiSettings = await getAISettings()
    console.log(`⚙️ AI COO: Using temperature=${aiSettings.temperature}, escalationThreshold=${aiSettings.escalationThreshold}`)

    // Step 5: Apply company rules and policies
    const isHighValue = booking.value && booking.value > 5000

    // Step 5: Generate AI decision (mock for now)
    let decision = 'approve'
    let confidence = 0.85
    let reason = 'Booking meets all company criteria'
    let assignedStaff = ['staff_001']

    if (isHighValue) {
      confidence = 0.65
      reason = 'High-value booking requires human review'
    }

    if (!booking.address || !booking.jobType) {
      decision = 'reject'
      confidence = 0.95
      reason = 'Missing required information'
      assignedStaff = []
    }

    const shouldEscalate = confidence < aiSettings.escalationThreshold || isHighValue

    console.log('📊 AI COO: Decision made:', {
      decision,
      confidence,
      escalate: shouldEscalate,
      staffAssigned: assignedStaff.length
    })

    // Step 5: Log the AI action using centralized logging
    await logAIAction({
      agent: "COO",
      decision,
      confidence,
      rationale: reason,
      escalate: shouldEscalate,
      source: "booking",
      status: shouldEscalate ? "escalated" : "completed",
      notes: isHighValue ? 'High-value booking flagged' : undefined,
      metadata: {
        booking,
        assignedStaff,
        processingTime: Date.now() - startTime,
        isHighValue
      }
    })

    // Step 6: Return AI decision
    const response = {
      success: true,
      decision,
      confidence,
      assignedStaff: assignedStaff.length > 0 ? assignedStaff : undefined,
      reason,
      escalate: shouldEscalate,
      metadata: {
        processingTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    }

    console.log(`✅ AI COO: Request processed successfully in ${Date.now() - startTime}ms`)

    // Check if simulation mode is enabled
    const SIMULATION_MODE = process.env.NODE_ENV !== 'production' || process.env.AI_SIMULATION_MODE === 'true'

    if (SIMULATION_MODE) {
      console.log("🧪 SIMULATION MODE ON: No real action performed.")
      return NextResponse.json({
        ...response,
        simulated: true,
        note: "No actual job was assigned. This was a simulation run.",
        simulationMode: true,
        originalResponse: response
      })
    } else {
      // In production, proceed with real updates: assign job, update DB, send notifications
      console.log("🚀 PRODUCTION MODE: Real actions will be performed")
      // TODO: Add real staff assignment logic here
      // TODO: Update database with assignment
      // TODO: Send notifications to staff and customer
    }

    // Log the API call for monitoring
    try {
      const { logAIAPICall } = await import("@/lib/ai/apiLogger")
      await logAIAPICall({
        endpoint: "/api/ai-coo",
        method: "POST",
        payload: booking,
        status: 200,
        error: false,
        responseTime: Date.now() - startTime,
        metadata: {
          decision: response.decision,
          confidence: response.confidence,
          escalate: response.escalate,
          simulated: response.simulated || false
        }
      })
    } catch (logError) {
      console.warn('⚠️ AI COO: Failed to log API call:', logError)
      // Don't fail the request if logging fails
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ AI COO: Error processing booking:', error)

    // Log the error using centralized logging
    try {
      await logAIAction({
        agent: "COO",
        decision: "error",
        confidence: 0.0,
        rationale: `System error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        escalate: true,
        source: "booking",
        status: "failed",
        notes: "AI COO system error occurred",
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          processingTime: Date.now() - startTime
        }
      })
    } catch (logError) {
      console.error('❌ AI COO: Failed to log error:', logError)
    }

    // Log the API error for monitoring
    try {
      const { logAIAPICall } = await import("@/lib/ai/apiLogger")
      await logAIAPICall({
        endpoint: "/api/ai-coo",
        method: "POST",
        payload: booking,
        status: 500,
        error: true,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime,
        metadata: {
          decision: "escalate",
          confidence: 0.0,
          escalate: true
        }
      })
    } catch (logError) {
      console.warn('⚠️ AI COO: Failed to log API error:', logError)
    }

    return NextResponse.json({
      success: false,
      error: "AI COO processing failed",
      decision: "escalate",
      confidence: 0.0,
      reason: "System error occurred - requires human intervention",
      escalate: true,
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * GET /api/ai-coo
 * Get AI COO status and configuration
 */
export async function GET(req: NextRequest) {
  try {
    console.log('📊 AI COO: Status check requested')

    const staff = [
      { id: 'staff_001', name: 'Maria Santos', availability: 'available' },
      { id: 'staff_002', name: 'John Wilson', availability: 'available' },
      { id: 'staff_003', name: 'Lisa Chen', availability: 'available' },
      { id: 'staff_004', name: 'David Kumar', availability: 'busy' },
      { id: 'staff_005', name: 'Anna Rodriguez', availability: 'available' }
    ]

    const availableStaff = staff.filter(s => s.availability === 'available')

    return NextResponse.json({
      success: true,
      status: "operational",
      version: "1.0.0",
      capabilities: [
        "booking_analysis",
        "staff_assignment",
        "cost_estimation",
        "priority_assessment",
        "escalation_management"
      ],
      statistics: {
        totalStaff: staff.length,
        availableStaff: availableStaff.length,
        confidenceThresholds: {
          AUTO_APPROVE: 0.8,
          HUMAN_REVIEW: 0.7,
          AUTO_REJECT: 0.3,
          ESCALATION: 0.6
        },
        supportedJobTypes: ['cleaning', 'maintenance', 'deep-clean', 'laundry', 'organizing', 'gardening', 'pool-cleaning']
      },
      lastUpdate: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ AI COO: Status check failed:', error)

    return NextResponse.json({
      success: false,
      status: "error",
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}


