import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

/**
 * Test API to create sample job session data
 * This simulates what the mobile app would create
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Creating test job session data...')
    
    const db = getDb()
    
    // Sample job session data structure
    const sampleJobSession = {
      staffId: 'gTtR5gSKOtUEweLwchSnVreylMy1', // staff@siamoon.com UID
      staffName: 'Staff Siamoon',
      startTime: serverTimestamp(),
      endTime: serverTimestamp(),
      status: 'completed',
      location: {
        latitude: 25.2048,
        longitude: 55.2708,
        timestamp: serverTimestamp()
      },
      photos: [
        {
          url: 'https://example.com/before-photo.jpg',
          timestamp: serverTimestamp(),
          type: 'before'
        },
        {
          url: 'https://example.com/after-photo.jpg',
          timestamp: serverTimestamp(),
          type: 'after'
        }
      ],
      notes: 'Job completed successfully. All tasks finished on time.',
      completionData: {
        tasksCompleted: [
          'Cleaned all rooms',
          'Restocked supplies',
          'Checked amenities',
          'Prepared for next guest'
        ],
        issuesFound: [
          'Minor stain on carpet in bedroom 2',
          'Light bulb needs replacement in bathroom'
        ],
        suppliesUsed: [
          'Cleaning supplies',
          'Fresh towels',
          'Toiletries'
        ],
        timeSpent: 95 // minutes
      },
      aiAuditTriggered: true,
      auditScore: 8.7,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    
    // Create job session document with jobId as document ID
    const jobId = `test_job_${Date.now()}`
    const sessionRef = await addDoc(collection(db, 'job_sessions'), {
      ...sampleJobSession,
      jobId
    })
    
    console.log(`✅ Created test job session: ${sessionRef.id}`)
    
    return NextResponse.json({
      success: true,
      message: 'Test job session created successfully',
      sessionId: sessionRef.id,
      jobId: jobId,
      data: {
        staffId: sampleJobSession.staffId,
        staffName: sampleJobSession.staffName,
        status: sampleJobSession.status,
        auditScore: sampleJobSession.auditScore,
        timeSpent: sampleJobSession.completionData.timeSpent
      }
    })
    
  } catch (error) {
    console.error('❌ Error creating test job session:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to create test job session',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Job Sessions Test API',
    description: 'POST to create a test job session for Staff Reports integration',
    endpoints: {
      'POST /api/test/job-sessions': 'Create test job session data',
      'GET /api/test/job-sessions': 'This help message'
    },
    sampleData: {
      staffId: 'gTtR5gSKOtUEweLwchSnVreylMy1',
      staffName: 'Staff Siamoon',
      status: 'completed',
      auditScore: 8.7,
      timeSpent: 95
    }
  })
}
