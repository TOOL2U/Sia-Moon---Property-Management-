/**
 * Admin Individual Job API Route
 * Handles individual job operations (GET, PATCH, DELETE)
 */

import { NextRequest, NextResponse } from 'next/server'
import JobAssignmentService from '@/services/JobAssignmentService'
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { getDb } from '@/lib/firebase'

/**
 * GET /api/admin/jobs/[id]
 * Get a specific job by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication is handled by middleware

    const jobId = params.id
    console.log('📋 Getting job:', jobId)

    // Get job from Firestore
    const db = getDb()
    const jobRef = doc(db, 'jobs', jobId)
    const jobDoc = await getDoc(jobRef)

    if (!jobDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    const jobData = { id: jobDoc.id, ...jobDoc.data() }
    console.log('✅ Retrieved job:', jobData.title)

    return NextResponse.json({
      success: true,
      job: jobData
    })
  } catch (error) {
    console.error('❌ Error in GET /api/admin/jobs/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/jobs/[id]
 * Update a specific job
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication is handled by middleware
    const jobId = params.id
    const body = await request.json()
    const { updates, updatedBy } = body

    if (!updates || !updatedBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: updates, updatedBy' },
        { status: 400 }
      )
    }

    console.log('🔧 Updating job:', jobId, updates)

    // Get current job data
    const db = getDb()
    const jobRef = doc(db, 'jobs', jobId)
    const jobDoc = await getDoc(jobRef)

    if (!jobDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    const currentJob = jobDoc.data()

    // Prepare update data
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString(),
      lastModifiedBy: updatedBy
    }

    // Add to status history if status is being updated
    if (updates.status && updates.status !== currentJob.status) {
      const statusHistoryEntry = {
        status: updates.status,
        timestamp: new Date().toISOString(),
        updatedBy: updatedBy.name || updatedBy.id,
        notes: `Status updated to ${updates.status}`
      }

      updateData.statusHistory = [
        ...(currentJob.statusHistory || []),
        statusHistoryEntry
      ]
    }

    // Update the job
    await updateDoc(jobRef, updateData)

    console.log('✅ Job updated successfully:', jobId)

    return NextResponse.json({
      success: true,
      jobId,
      message: 'Job updated successfully'
    })
  } catch (error) {
    console.error('❌ Error in PATCH /api/admin/jobs/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/jobs/[id]
 * Delete a specific job
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication is handled by middleware
    const jobId = params.id
    const body = await request.json()
    const { deletedBy } = body

    if (!deletedBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: deletedBy' },
        { status: 400 }
      )
    }

    console.log('🗑️ Deleting job:', jobId)

    // Get current job data to check if it can be deleted
    const db = getDb()
    const jobRef = doc(db, 'jobs', jobId)
    const jobDoc = await getDoc(jobRef)

    if (!jobDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    const jobData = jobDoc.data()

    // Check if job can be safely deleted
    const safeDeletionStatuses = ['pending', 'assigned', 'cancelled']
    if (!safeDeletionStatuses.includes(jobData.status)) {
      console.log('⚠️ Warning: Deleting job with status:', jobData.status)
      // Still allow deletion but log warning
    }

    // Instead of hard delete, we could mark as deleted
    // For now, we'll do a hard delete as requested
    await deleteDoc(jobRef)

    console.log('✅ Job deleted successfully:', jobId)

    // TODO: Send notification to assigned staff about job cancellation
    // TODO: Update any related booking status if applicable

    return NextResponse.json({
      success: true,
      jobId,
      message: 'Job deleted successfully'
    })
  } catch (error) {
    console.error('❌ Error in DELETE /api/admin/jobs/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
