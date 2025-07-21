import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { addDoc, collection, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore'

/**
 * 📱 Mobile App - Job Completion API
 * 
 * Receives job completion data from mobile app for audit report generation
 */

interface JobCompletionData {
  staffId: string
  jobId: string
  jobType: string
  propertyId: string
  propertyName: string
  startTime: string
  endTime: string
  completionStatus: 'completed' | 'partial' | 'cancelled'
  gpsLocations: {
    latitude: number
    longitude: number
    timestamp: string
    accuracy: number
  }[]
  photos: {
    type: 'before' | 'after' | 'during'
    url: string
    timestamp: string
    gpsLocation?: {
      latitude: number
      longitude: number
    }
  }[]
  notes?: string
  qualityRating?: number // 1-5 stars from customer/system
  aiInteractions?: {
    timestamp: string
    query: string
    response: string
    helpful: boolean
  }[]
}

export async function POST(request: NextRequest) {
  try {
    console.log('📱 Mobile App: Job completion data received')

    const jobData: JobCompletionData = await request.json()

    // Validate required fields
    if (!jobData.staffId || !jobData.jobId || !jobData.jobType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: staffId, jobId, jobType' },
        { status: 400 }
      )
    }

    console.log('📋 Processing job completion:', {
      staffId: jobData.staffId,
      jobId: jobData.jobId,
      jobType: jobData.jobType,
      status: jobData.completionStatus
    })

    // Calculate job metrics
    const startTime = new Date(jobData.startTime)
    const endTime = new Date(jobData.endTime)
    const completionTimeMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))

    // Calculate GPS accuracy (average of all location points)
    const avgGpsAccuracy = jobData.gpsLocations.length > 0
      ? jobData.gpsLocations.reduce((sum, loc) => sum + loc.accuracy, 0) / jobData.gpsLocations.length
      : 0

    // Calculate photo compliance (has both before and after photos)
    const hasBeforePhoto = jobData.photos.some(p => p.type === 'before')
    const hasAfterPhoto = jobData.photos.some(p => p.type === 'after')
    const photoCompliance = hasBeforePhoto && hasAfterPhoto ? 1.0 : 0.5

    // Store job completion data for audit processing
    const jobCompletionRecord = {
      ...jobData,
      calculatedMetrics: {
        completionTimeMinutes,
        avgGpsAccuracy,
        photoCompliance,
        photoCount: jobData.photos.length,
        gpsPointCount: jobData.gpsLocations.length,
        aiInteractionCount: jobData.aiInteractions?.length || 0
      },
      receivedAt: serverTimestamp(),
      processed: false
    }

    // Store in mobile_job_completions collection for audit processing
    const jobCompletionRef = await addDoc(
      collection(db, 'mobile_job_completions'), 
      jobCompletionRecord
    )

    console.log('✅ Job completion stored:', jobCompletionRef.id)

    // Update the original job record if it exists
    try {
      const jobRef = doc(db, 'job_assignments', jobData.jobId)
      const jobDoc = await getDoc(jobRef)
      
      if (jobDoc.exists()) {
        await updateDoc(jobRef, {
          status: jobData.completionStatus,
          completedAt: serverTimestamp(),
          completionData: {
            completionTimeMinutes,
            photoCount: jobData.photos.length,
            gpsAccuracy: avgGpsAccuracy,
            qualityRating: jobData.qualityRating
          },
          updatedAt: serverTimestamp()
        })
        console.log('✅ Job record updated:', jobData.jobId)
      }
    } catch (error) {
      console.warn('⚠️ Could not update job record:', error)
    }

    // Log the mobile app interaction
    await addDoc(collection(db, 'ai_action_logs'), {
      timestamp: serverTimestamp(),
      agent: 'mobile-app',
      action: 'job_completion_received',
      staffId: jobData.staffId,
      jobId: jobData.jobId,
      success: true,
      details: {
        jobType: jobData.jobType,
        completionStatus: jobData.completionStatus,
        completionTime: completionTimeMinutes,
        photoCount: jobData.photos.length,
        gpsPoints: jobData.gpsLocations.length,
        aiInteractions: jobData.aiInteractions?.length || 0
      }
    })

    // Trigger audit report generation if this is the end of a week
    // (This would typically be handled by a scheduled function)
    const now = new Date()
    if (now.getDay() === 0) { // Sunday
      console.log('📊 End of week detected, audit report generation may be triggered')
    }

    return NextResponse.json({
      success: true,
      message: 'Job completion data received and processed',
      jobCompletionId: jobCompletionRef.id,
      metrics: jobCompletionRecord.calculatedMetrics
    })

  } catch (error) {
    console.error('❌ Mobile App Job Completion Error:', error)
    
    // Log the error
    try {
      await addDoc(collection(db, 'ai_action_logs'), {
        timestamp: serverTimestamp(),
        agent: 'mobile-app',
        action: 'job_completion_error',
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      })
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Mobile App Job Completion API is active',
    description: 'This endpoint receives job completion data from the mobile app for audit report generation',
    expectedData: {
      staffId: 'string (required)',
      jobId: 'string (required)',
      jobType: 'string (required)',
      propertyId: 'string (required)',
      propertyName: 'string (required)',
      startTime: 'ISO string (required)',
      endTime: 'ISO string (required)',
      completionStatus: 'completed | partial | cancelled (required)',
      gpsLocations: 'array of GPS points with lat/lng/timestamp/accuracy',
      photos: 'array of photo objects with type/url/timestamp',
      notes: 'string (optional)',
      qualityRating: 'number 1-5 (optional)',
      aiInteractions: 'array of AI interaction objects (optional)'
    }
  })
}
