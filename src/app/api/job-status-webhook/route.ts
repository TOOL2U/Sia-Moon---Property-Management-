import { db } from '@/lib/firebase'
import JobCalendarWorkflow from '@/services/JobCalendarWorkflow'
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore'
import { NextRequest, NextResponse } from 'next/server'

/**
 * 🔧 Job Status Change Webhook
 * 
 * Triggers calendar integration when job status changes
 * Handles automatic calendar event creation, updates, and removal
 */

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Job Status Webhook: Processing request...')

    const body = await request.json()
    const { jobId, oldStatus, newStatus, triggeredBy } = body

    // Validate required fields
    if (!jobId || !newStatus) {
      console.error('❌ Missing required fields:', { jobId, oldStatus, newStatus })
      return NextResponse.json(
        { success: false, error: 'Missing required fields: jobId, newStatus' },
        { status: 400 }
      )
    }

    console.log('✅ Processing job status change:', { jobId, oldStatus, newStatus, triggeredBy })

    // Get job details
    if (!db) {
      return NextResponse.json({ success: false, error: 'Firebase not initialized' }, { status: 500 })
    }

    const jobRef = doc(db, 'job_assignments', jobId)
    const jobSnap = await getDoc(jobRef)

    if (!jobSnap.exists()) {
      console.error('❌ Job not found:', jobId)
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    const jobData = jobSnap.data()
    console.log('📋 Job data retrieved:', {
      id: jobId,
      title: jobData.title,
      type: jobData.type,
      property: jobData.propertyName,
      assignedStaff: jobData.assignedStaffName,
      oldStatus,
      newStatus
    })

    // Initialize and run the job calendar workflow
    const workflow = new JobCalendarWorkflow()
    
    const result = await workflow.processJobStatusChange({
      jobId,
      jobData: {
        ...jobData,
        id: jobId
      },
      oldStatus,
      newStatus,
      triggeredBy: triggeredBy || 'job-status-webhook'
    })

    console.log('🎯 Job calendar workflow result:', {
      success: result.success,
      calendarAction: result.calendarIntegration?.action,
      eventId: result.calendarIntegration?.eventId
    })

    // Log the workflow execution
    await addDoc(collection(db, 'ai_action_logs'), {
      timestamp: serverTimestamp(),
      agent: 'job-calendar-workflow',
      action: 'process_job_status_change',
      jobId,
      oldStatus,
      newStatus,
      result,
      triggeredBy: triggeredBy || 'system',
      success: result.success,
      details: {
        calendarIntegration: result.calendarIntegration,
        databaseUpdates: result.databaseUpdates
      }
    })

    if (result.success) {
      console.log('✅ Job calendar workflow completed successfully')
      return NextResponse.json({
        success: true,
        message: 'Job calendar workflow completed successfully',
        result,
        calendarEventId: result.calendarIntegration?.eventId
      })
    } else {
      console.error('❌ Job calendar workflow failed:', result.message)
      return NextResponse.json({
        success: false,
        message: result.message || 'Job calendar workflow failed',
        result
      }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Job status webhook error:', error)
    
    // Log the error
    try {
      await addDoc(collection(db, 'ai_action_logs'), {
        timestamp: serverTimestamp(),
        agent: 'job-status-webhook',
        action: 'error',
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
    message: 'Job Status Webhook is active',
    description: 'This webhook triggers calendar integration when job status changes',
    statusColors: {
      unassigned: '#6b7280 (Gray)',
      assigned: '#f59e0b (Yellow)',
      accepted: '#3b82f6 (Blue)',
      'in-progress': '#3b82f6 (Blue)',
      completed: '#10b981 (Green)',
      cancelled: '#ef4444 (Red)'
    },
    usage: {
      method: 'POST',
      body: {
        jobId: 'string (required)',
        oldStatus: 'string (optional)',
        newStatus: 'string (required)',
        triggeredBy: 'string (optional)'
      }
    }
  })
}
