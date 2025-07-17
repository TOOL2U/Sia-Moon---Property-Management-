/**
 * Admin Individual Job API Route
 * Handles individual job operations (GET, PATCH, DELETE)
 */

import { getDb } from '@/lib/firebase'
import { deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore'
import { NextRequest, NextResponse } from 'next/server'

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
      job: jobData,
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
        {
          success: false,
          error: 'Missing required fields: updates, updatedBy',
        },
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

    // Handle staff assignment updates
    let staffRef = null
    if (
      updates.assignedStaffId &&
      updates.assignedStaffId !== currentJob.assignedStaffId
    ) {
      // Get new staff details from staff_accounts collection
      const staffDoc = await getDoc(
        doc(db, 'staff_accounts', updates.assignedStaffId)
      )
      if (staffDoc.exists()) {
        const staffData = staffDoc.data()
        staffRef = {
          id: updates.assignedStaffId,
          name: staffData.name,
          phone: staffData.phone,
          role: staffData.role,
          skills: staffData.skills || [],
        }
      }
    }

    // Prepare update data
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString(),
      lastModifiedBy: updatedBy,
    }

    // Add staff reference if staff assignment changed
    if (staffRef) {
      updateData.assignedStaffRef = staffRef
    }

    // Add to status history if status is being updated
    if (updates.status && updates.status !== currentJob.status) {
      const statusHistoryEntry = {
        status: updates.status,
        timestamp: new Date().toISOString(),
        updatedBy: updatedBy.name || updatedBy.id,
        notes: `Status updated to ${updates.status}`,
      }

      updateData.statusHistory = [
        ...(currentJob.statusHistory || []),
        statusHistoryEntry,
      ]
    }

    // Add to status history if staff assignment is being updated
    if (
      updates.assignedStaffId &&
      updates.assignedStaffId !== currentJob.assignedStaffId
    ) {
      const staffChangeEntry = {
        status: currentJob.status, // Keep current status
        timestamp: new Date().toISOString(),
        updatedBy: updatedBy.name || updatedBy.id,
        notes: `Staff assignment changed to ${updates.assignedStaffName || 'new staff member'}`,
      }

      updateData.statusHistory = [
        ...(updateData.statusHistory || currentJob.statusHistory || []),
        staffChangeEntry,
      ]
    }

    // Update the job
    await updateDoc(jobRef, updateData)

    console.log('✅ Job updated successfully:', jobId)

    return NextResponse.json({
      success: true,
      jobId,
      message: 'Job updated successfully',
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
      message: 'Job deleted successfully',
    })
  } catch (error) {
    console.error('❌ Error in DELETE /api/admin/jobs/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
