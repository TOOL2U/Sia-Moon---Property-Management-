import { staffGPSService } from '@/services/StaffGPSService'
import { Timestamp } from 'firebase/firestore'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Mock staff locations around Bali
    const mockStaffLocations = [
      {
        staffId: 'staff-001',
        latitude: -8.6905,
        longitude: 115.1729,
        accuracy: 5,
        status: 'working' as const,
        speed: 0,
        batteryLevel: 85
      },
      {
        staffId: 'staff-002',
        latitude: -8.6482,
        longitude: 115.1378,
        accuracy: 8,
        status: 'traveling' as const,
        speed: 25,
        heading: 45,
        batteryLevel: 72
      },
      {
        staffId: 'staff-003',
        latitude: -8.5069,
        longitude: 115.2625,
        accuracy: 3,
        status: 'working' as const,
        speed: 0,
        batteryLevel: 91
      },
      {
        staffId: 'staff-004',
        latitude: -8.3405,
        longitude: 115.0920,
        accuracy: 12,
        status: 'break' as const,
        speed: 0,
        batteryLevel: 45
      }
    ]

    // Mock property statuses
    const mockPropertyStatuses = [
      {
        propertyId: 'villa-001',
        status: 'cleaning' as const,
        guestCount: 0,
        nextEvent: {
          type: 'checkin' as const,
          time: Timestamp.fromDate(new Date(Date.now() + 2 * 60 * 60 * 1000)) // 2 hours from now
        }
      },
      {
        propertyId: 'villa-002',
        status: 'occupied' as const,
        guestCount: 4,
        nextEvent: {
          type: 'checkout' as const,
          time: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)) // 24 hours from now
        }
      },
      {
        propertyId: 'villa-003',
        status: 'maintenance' as const,
        guestCount: 0
      }
    ]

    // Seed staff locations
    for (const location of mockStaffLocations) {
      await staffGPSService.updateStaffLocation(location)
    }

    // Seed property statuses
    for (const property of mockPropertyStatuses) {
      await staffGPSService.updatePropertyStatus(property.propertyId, {
        status: property.status,
        guestCount: property.guestCount,
        nextEvent: property.nextEvent
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Mock GPS and property data seeded successfully',
      data: {
        staffLocations: mockStaffLocations.length,
        propertyStatuses: mockPropertyStatuses.length
      }
    })

  } catch (error) {
    console.error('❌ Error seeding test data:', error)
    return NextResponse.json(
      {
        error: 'Failed to seed test data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'GPS Test Data Seeder',
    usage: 'POST to this endpoint to seed mock GPS and property data',
    note: 'This will create test staff locations and property statuses in Firebase'
  })
}
