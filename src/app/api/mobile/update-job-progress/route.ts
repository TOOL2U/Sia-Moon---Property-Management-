import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/firebase'
import { 
  doc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  collection,
  getDoc
} from 'firebase/firestore'

interface JobProgressUpdate {
  jobId: string
  staffId: string
  currentStage: 'not_started' | 'traveling' | 'on_site' | 'in_progress' | 'quality_check' | 'completed'
  progressPercentage: number
  notes?: string
  photos?: string[]
  location?: {
    lat: number
    lng: number
  }
  estimatedCompletion?: string
}

export async function POST(request: NextRequest) {
  try {
    const updateData: JobProgressUpdate = await request.json()
    
    console.log(`📱 Mobile job progress update for job ${updateData.jobId} by staff ${updateData.staffId}`)

    const db = getDb()
    if (!db) {
      return NextResponse.json(
        { error: 'Firebase not initialized' },
        { status: 500 }
      )
    }

    // Validate required fields
    if (!updateData.jobId || !updateData.staffId || !updateData.currentStage) {
      return NextResponse.json(
        { error: 'Missing required fields: jobId, staffId, currentStage' },
        { status: 400 }
      )
    }

    // Calculate delay risk based on progress and time
    const delayRisk = calculateDelayRisk(updateData)

    // Prepare progress document
    const progressDoc = {
      jobId: updateData.jobId,
      staffId: updateData.staffId,
      currentStage: updateData.currentStage,
      progressPercentage: Math.min(100, Math.max(0, updateData.progressPercentage)),
      delayRisk,
      lastUpdate: new Date().toISOString(),
      updatedAt: serverTimestamp(),
      
      // Optional fields
      ...(updateData.notes && { notes: updateData.notes }),
      ...(updateData.photos && { photos: updateData.photos }),
      ...(updateData.location && { 
        staffLocation: {
          lat: updateData.location.lat,
          lng: updateData.location.lng,
          lastUpdate: new Date().toISOString()
        }
      }),
      ...(updateData.estimatedCompletion && { 
        estimatedCompletion: updateData.estimatedCompletion 
      })
    }

    // Update job_progress collection
    const progressRef = doc(db, 'job_progress', updateData.jobId)
    await setDoc(progressRef, progressDoc, { merge: true })

    // Update main job status if stage indicates completion
    if (updateData.currentStage === 'completed') {
      const jobRef = doc(db, 'jobs', updateData.jobId)
      await updateDoc(jobRef, {
        status: 'completed',
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      
      console.log(`✅ Job ${updateData.jobId} marked as completed`)
    } else if (updateData.currentStage === 'in_progress') {
      const jobRef = doc(db, 'jobs', updateData.jobId)
      await updateDoc(jobRef, {
        status: 'in_progress',
        updatedAt: serverTimestamp()
      })
    }

    // Log the update for monitoring
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'job_progress_update',
      jobId: updateData.jobId,
      staffId: updateData.staffId,
      stage: updateData.currentStage,
      progress: updateData.progressPercentage,
      delayRisk,
      source: 'mobile_app'
    }

    // Store in progress_logs collection for analytics
    const logRef = doc(collection(db, 'progress_logs'))
    await setDoc(logRef, logEntry)

    // Trigger notifications if high delay risk
    if (delayRisk > 70) {
      await triggerDelayAlert(updateData.jobId, delayRisk, updateData.staffId)
    }

    const response = {
      success: true,
      jobId: updateData.jobId,
      progressPercentage: progressDoc.progressPercentage,
      currentStage: updateData.currentStage,
      delayRisk,
      lastUpdate: progressDoc.lastUpdate,
      message: 'Job progress updated successfully'
    }

    console.log(`✅ Job progress updated: ${updateData.currentStage} (${progressDoc.progressPercentage}%)`)

    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ Error updating job progress:', error)
    return NextResponse.json(
      { error: 'Failed to update job progress' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    const staffId = searchParams.get('staffId')

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId parameter required' },
        { status: 400 }
      )
    }

    const db = getDb()
    if (!db) {
      return NextResponse.json(
        { error: 'Firebase not initialized' },
        { status: 500 }
      )
    }

    // Get current progress
    const progressRef = doc(db, 'job_progress', jobId)
    const progressSnap = await getDoc(progressRef)

    if (!progressSnap.exists()) {
      return NextResponse.json({
        jobId,
        currentStage: 'not_started',
        progressPercentage: 0,
        delayRisk: 0,
        lastUpdate: new Date().toISOString()
      })
    }

    const progressData = progressSnap.data()
    
    return NextResponse.json({
      jobId,
      currentStage: progressData.currentStage || 'not_started',
      progressPercentage: progressData.progressPercentage || 0,
      delayRisk: progressData.delayRisk || 0,
      lastUpdate: progressData.lastUpdate || progressData.updatedAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
      estimatedCompletion: progressData.estimatedCompletion,
      staffLocation: progressData.staffLocation,
      notes: progressData.notes,
      photos: progressData.photos
    })
  } catch (error) {
    console.error('❌ Error fetching job progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job progress' },
      { status: 500 }
    )
  }
}

function calculateDelayRisk(updateData: JobProgressUpdate): number {
  // Simple delay risk calculation based on stage and progress
  const stageExpectedProgress = {
    'not_started': 0,
    'traveling': 20,
    'on_site': 40,
    'in_progress': 60,
    'quality_check': 80,
    'completed': 100
  }

  const expectedProgress = stageExpectedProgress[updateData.currentStage]
  const actualProgress = updateData.progressPercentage

  // If actual progress is significantly behind expected, increase risk
  const progressGap = expectedProgress - actualProgress
  let risk = Math.max(0, progressGap * 2) // 2% risk per 1% progress gap

  // Add time-based risk factors
  const now = new Date()
  const currentHour = now.getHours()
  
  // Higher risk during peak hours
  if (currentHour >= 14 && currentHour <= 17) {
    risk += 10
  }

  // Add random variation for realism (in production, this would be ML-based)
  risk += Math.random() * 20

  return Math.min(100, Math.max(0, Math.round(risk)))
}

async function triggerDelayAlert(jobId: string, delayRisk: number, staffId: string) {
  try {
    console.log(`🚨 High delay risk detected for job ${jobId}: ${delayRisk}%`)
    
    // In a real implementation, this would:
    // 1. Send push notification to managers
    // 2. Create escalation ticket
    // 3. Trigger automated reassignment if needed
    // 4. Update dashboard alerts
    
    // For now, just log the alert
    const db = getDb()
    if (!db) return

    const alertDoc = {
      type: 'delay_alert',
      jobId,
      staffId,
      delayRisk,
      triggeredAt: new Date().toISOString(),
      status: 'active',
      severity: delayRisk > 90 ? 'critical' : delayRisk > 80 ? 'high' : 'medium'
    }

    const alertRef = doc(collection(db, 'delay_alerts'))
    await setDoc(alertRef, alertDoc)

    console.log(`📢 Delay alert created for job ${jobId}`)
  } catch (error) {
    console.error('❌ Error triggering delay alert:', error)
  }
}
