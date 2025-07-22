import { NextResponse } from 'next/server'
import { staffGPSService } from '@/services/StaffGPSService'

export async function POST() {
  try {
    // Mock property status updates
    const mockPropertyUpdates = [
      {
        propertyId: 'villa-001',
        status: 'cleaning' as const,
        guestCount: 0
      },
      {
        propertyId: 'villa-002', 
        status: 'occupied' as const,
        guestCount: 4
      },
      {
        propertyId: 'villa-003',
        status: 'maintenance' as const,
        guestCount: 0
      }
    ]

    // Update property statuses
    for (const property of mockPropertyUpdates) {
      await staffGPSService.updatePropertyStatus(property.propertyId, {
        status: property.status,
        guestCount: property.guestCount
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Property statuses updated successfully',
      data: {
        propertiesUpdated: mockPropertyUpdates.length
      }
    })

  } catch (error) {
    console.error('❌ Error updating property statuses:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update property statuses',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Property Status Update Test',
    usage: 'POST to this endpoint to update mock property statuses',
    note: 'This will create test property statuses in Firebase'
  })
}
