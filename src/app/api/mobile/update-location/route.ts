import { NextRequest, NextResponse } from 'next/server'
import { staffGPSService } from '@/services/StaffGPSService'

interface LocationUpdateRequest {
  staffId: string
  latitude: number
  longitude: number
  accuracy: number
  status?: 'working' | 'traveling' | 'break' | 'emergency' | 'offline'
  speed?: number
  heading?: number
  batteryLevel?: number
  timestamp?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: LocationUpdateRequest = await request.json()

    // Validate required fields
    if (!body.staffId || typeof body.latitude !== 'number' || typeof body.longitude !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields: staffId, latitude, longitude' },
        { status: 400 }
      )
    }

    // Validate coordinates
    if (body.latitude < -90 || body.latitude > 90 || body.longitude < -180 || body.longitude > 180) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      )
    }

    // Validate accuracy (should be positive)
    if (body.accuracy < 0) {
      return NextResponse.json(
        { error: 'Accuracy must be positive' },
        { status: 400 }
      )
    }

    // Check if location is too old (more than 5 minutes)
    if (body.timestamp) {
      const locationTime = new Date(body.timestamp)
      const now = new Date()
      const ageMinutes = (now.getTime() - locationTime.getTime()) / (1000 * 60)
      
      if (ageMinutes > 5) {
        return NextResponse.json(
          { error: 'Location data is too old' },
          { status: 400 }
        )
      }
    }

    // Update staff location
    await staffGPSService.updateStaffLocation({
      staffId: body.staffId,
      latitude: body.latitude,
      longitude: body.longitude,
      accuracy: body.accuracy,
      status: body.status || 'working',
      speed: body.speed,
      heading: body.heading,
      batteryLevel: body.batteryLevel
    })

    return NextResponse.json({
      success: true,
      message: 'Location updated successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error updating staff location:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update location',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Health check endpoint for mobile apps
  return NextResponse.json({
    status: 'ok',
    service: 'Staff GPS Location Service',
    timestamp: new Date().toISOString(),
    endpoints: {
      updateLocation: 'POST /api/mobile/update-location'
    }
  })
}
