import { getDb } from '@/lib/firebase'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Test API to create sample job session data
 * This simulates what the mobile app would create
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Creating test job session data...')

    const db = getDb()

    // Sample job session data structure matching AI audit requirements
    const now = new Date()
    const startTime = new Date(now.getTime() - (2 * 60 * 60 * 1000)) // 2 hours ago
    const endTime = new Date(now.getTime() - (30 * 60 * 1000)) // 30 minutes ago

    const sampleJobSession = {
      staffId: 'gTtR5gSKOtUEweLwchSnVreylMy1', // staff@siamoon.com UID
      staffName: 'Staff Siamoon',
      sessionId: `session_${Date.now()}`,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      totalDuration: 90, // minutes
      status: 'completed',
      // Location verification
      startLocation: {
        latitude: 25.2048,
        longitude: 55.2708,
        accuracy: 5.0,
        timestamp: startTime.toISOString()
      },
      endLocation: {
        latitude: 25.2050,
        longitude: 55.2710,
        accuracy: 3.0,
        timestamp: endTime.toISOString()
      },

      // Task execution metrics
      checklistData: [
        {
          id: 'task_1',
          title: 'Clean bathrooms',
          required: true,
          completed: true,
          completedAt: new Date(startTime.getTime() + 30 * 60 * 1000).toISOString(),
          notes: 'Used disinfectant spray'
        },
        {
          id: 'task_2',
          title: 'Vacuum all rooms',
          required: true,
          completed: true,
          completedAt: new Date(startTime.getTime() + 60 * 60 * 1000).toISOString(),
          notes: 'Completed thoroughly'
        },
        {
          id: 'task_3',
          title: 'Restock supplies',
          required: false,
          completed: true,
          completedAt: new Date(startTime.getTime() + 80 * 60 * 1000).toISOString(),
          notes: 'All supplies restocked'
        }
      ],
      // Documentation quality
      photos: {
        'photo_1': {
          id: 'photo_1',
          filename: `job_${Date.now()}_before`,
          timestamp: new Date(startTime.getTime() + 15 * 60 * 1000).toISOString(),
          description: 'Bathroom before cleaning'
        },
        'photo_2': {
          id: 'photo_2',
          filename: `job_${Date.now()}_during`,
          timestamp: new Date(startTime.getTime() + 45 * 60 * 1000).toISOString(),
          description: 'Work in progress'
        },
        'photo_3': {
          id: 'photo_3',
          filename: `job_${Date.now()}_after`,
          timestamp: new Date(startTime.getTime() + 85 * 60 * 1000).toISOString(),
          description: 'Completed work'
        }
      },
      notes: [
        'Job completed successfully. All tasks finished on time.',
        'Used eco-friendly cleaning products as requested.',
        'Minor maintenance issue noted in bathroom - reported to supervisor.'
      ],

      // Calculated performance metrics
      checklistCompletionRate: 100,
      requiredTasksCompleted: true,
      photoCount: 3,
      noteCount: 3,
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
