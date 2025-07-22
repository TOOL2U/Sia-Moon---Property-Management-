import { JobsCollectionInitializer } from '@/services/JobsCollectionInitializer'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Initialize Jobs Collection API
 * Creates the jobs and staff_notifications collections if they don't exist
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'initialize_collections':
        console.log('🔧 API: Initializing jobs collections...')
        const initResult = await JobsCollectionInitializer.initializeJobsCollection()
        return NextResponse.json(initResult)

      case 'create_test_job':
        console.log('🧪 API: Creating test job for staff@siamoon.com...')
        const testResult = await JobsCollectionInitializer.createTestJobForStaffSiamoon()
        return NextResponse.json(testResult)

      case 'verify_collections':
        console.log('✅ API: Verifying collections...')
        const verifyResult = await JobsCollectionInitializer.verifyCollections()
        return NextResponse.json(verifyResult)

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action parameter' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('❌ API Error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'verify_collections':
        console.log('✅ API: Verifying collections (GET)...')
        const verifyResult = await JobsCollectionInitializer.verifyCollections()
        return NextResponse.json(verifyResult)

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action parameter' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('❌ API Error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
