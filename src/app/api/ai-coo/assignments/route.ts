import { NextRequest, NextResponse } from 'next/server'

interface StaffAssignment {
  id: string
  staffName: string
  propertyName: string
  lat: number
  lng: number
  eta: number
  status: 'assigned' | 'en_route' | 'arrived' | 'completed'
  distance: number
  jobType: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignedAt: string
  staffId?: string
  propertyId?: string
  jobId?: string
}

// Mock data for development - replace with real database queries
function generateMockAssignments(): StaffAssignment[] {
  const mockStaff = [
    { id: 'staff-001', name: 'Somchai Thanakit' },
    { id: 'staff-002', name: 'Niran Pattaya' },
    { id: 'staff-003', name: 'Ploy Siriporn' },
    { id: 'staff-004', name: 'Kamon Jaidee' },
    { id: 'staff-005', name: 'Siriporn Nakorn' },
    { id: 'staff-006', name: 'Wichai Somjai' }
  ]

  const mockProperties = [
    { id: 'prop-001', name: 'Villa Breeze', lat: 9.6150, lng: 100.0850 },
    { id: 'prop-002', name: 'Ocean View Villa', lat: 9.6200, lng: 100.0900 },
    { id: 'prop-003', name: 'Sunset Paradise', lat: 9.6100, lng: 100.0800 },
    { id: 'prop-004', name: 'Palm Garden Resort', lat: 9.6250, lng: 100.0950 },
    { id: 'prop-005', name: 'Lotus Villa', lat: 9.6050, lng: 100.0750 },
    { id: 'prop-006', name: 'Emerald Bay Villa', lat: 9.6300, lng: 100.1000 }
  ]

  const mockJobTypes = ['Cleaning', 'Maintenance', 'Check-in Prep', 'Inspection', 'Repair', 'Landscaping']
  const priorities: ('low' | 'medium' | 'high' | 'urgent')[] = ['low', 'medium', 'high', 'urgent']
  const statuses: ('assigned' | 'en_route' | 'arrived' | 'completed')[] = ['assigned', 'en_route', 'arrived', 'completed']

  // Generate 4-8 active assignments
  const numAssignments = Math.floor(Math.random() * 5) + 4
  
  return Array.from({ length: numAssignments }, (_, i) => {
    const staff = mockStaff[i % mockStaff.length]
    const property = mockProperties[i % mockProperties.length]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    
    // Calculate realistic ETA based on status
    let eta = Math.floor(Math.random() * 45) + 5 // 5-50 minutes base
    if (status === 'arrived') eta = 0
    if (status === 'completed') eta = 0
    if (status === 'en_route') eta = Math.floor(Math.random() * 20) + 5 // 5-25 minutes
    
    return {
      id: `JOB-${String(i + 1).padStart(3, '0')}`,
      staffName: staff.name,
      propertyName: property.name,
      lat: property.lat + (Math.random() - 0.5) * 0.01, // Small random offset
      lng: property.lng + (Math.random() - 0.5) * 0.01,
      eta,
      status,
      distance: Math.round((Math.random() * 15 + 1) * 10) / 10, // 1-15 km
      jobType: mockJobTypes[Math.floor(Math.random() * mockJobTypes.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      assignedAt: new Date(Date.now() - Math.random() * 3600000).toISOString(), // Within last hour
      staffId: staff.id,
      propertyId: property.id,
      jobId: `job-${Date.now()}-${i}`
    }
  })
}

// GET /api/ai-coo/assignments - Get current staff assignments
export async function GET(request: NextRequest) {
  try {
    console.log('🗺️ AI COO: Getting staff assignments...')

    // In production, this would query your database for:
    // - Active job assignments
    // - Staff locations (if available)
    // - Property coordinates
    // - Real-time ETAs from mapping service
    
    // For now, return mock data
    const assignments = generateMockAssignments()
    
    // Calculate summary statistics
    const stats = {
      total: assignments.length,
      byStatus: assignments.reduce((acc, assignment) => {
        acc[assignment.status] = (acc[assignment.status] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      byPriority: assignments.reduce((acc, assignment) => {
        acc[assignment.priority] = (acc[assignment.priority] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      avgEta: assignments.length > 0 
        ? Math.round(assignments.reduce((sum, a) => sum + a.eta, 0) / assignments.length)
        : 0
    }

    console.log(`✅ AI COO: Returning ${assignments.length} staff assignments`)

    return NextResponse.json({
      success: true,
      assignments,
      stats,
      timestamp: new Date().toISOString(),
      message: `Found ${assignments.length} active staff assignments`
    })

  } catch (error) {
    console.error('❌ AI COO: Error getting staff assignments:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get staff assignments',
      assignments: [],
      stats: { total: 0, byStatus: {}, byPriority: {}, avgEta: 0 }
    }, { status: 500 })
  }
}

// POST /api/ai-coo/assignments - Create new assignment (for AI COO to use)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🤖 AI COO: Creating new staff assignment:', body)

    // Validate required fields
    const { staffId, propertyId, jobType, priority } = body
    if (!staffId || !propertyId || !jobType) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: staffId, propertyId, jobType'
      }, { status: 400 })
    }

    // In production, this would:
    // 1. Create job assignment in database
    // 2. Calculate optimal route and ETA
    // 3. Send notification to staff member
    // 4. Log the AI decision
    
    const newAssignment: StaffAssignment = {
      id: `JOB-${Date.now()}`,
      staffName: body.staffName || 'Unknown Staff',
      propertyName: body.propertyName || 'Unknown Property',
      lat: body.lat || 9.6150,
      lng: body.lng || 100.0850,
      eta: body.eta || 30,
      status: 'assigned',
      distance: body.distance || 5.0,
      jobType,
      priority: priority || 'medium',
      assignedAt: new Date().toISOString(),
      staffId,
      propertyId,
      jobId: body.jobId
    }

    console.log('✅ AI COO: Staff assignment created successfully')

    return NextResponse.json({
      success: true,
      assignment: newAssignment,
      message: 'Staff assignment created successfully'
    })

  } catch (error) {
    console.error('❌ AI COO: Error creating staff assignment:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create staff assignment'
    }, { status: 500 })
  }
}

// PUT /api/ai-coo/assignments - Update assignment status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { assignmentId, status, eta } = body

    console.log(`🔄 AI COO: Updating assignment ${assignmentId} status to ${status}`)

    // In production, this would update the database
    // For now, just return success
    
    return NextResponse.json({
      success: true,
      message: `Assignment ${assignmentId} updated to ${status}`,
      updatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ AI COO: Error updating assignment:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update assignment'
    }, { status: 500 })
  }
}
