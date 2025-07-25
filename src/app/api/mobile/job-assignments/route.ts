/**
 * Mobile Job Assignments API
 * Handles job assignments for mobile app staff interface
 */

import { getDb } from '@/lib/firebase'
import { createMobileErrorResponse, createMobileSuccessResponse, withMobileAuth } from '@/lib/middleware/mobileAuth'
import { JobAssignment } from '@/types/jobAssignment'
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/mobile/job-assignments
 * Get job assignments for authenticated staff member
 */
export async function GET(request: NextRequest) {
  return withMobileAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(request.url)
      const status = searchParams.get('status')
      const limit_param = searchParams.get('limit')

      const db = getDb()

      if (!db) {
        return NextResponse.json(
          { success: false, error: 'Database not initialized' },
          { status: 500 }
        )
      }

      let q = query(
        collection(db, 'job_assignments'),
        where('assignedStaffId', '==', auth.staffId),
        orderBy('createdAt', 'desc')
      )

      // Filter by status if provided
      if (status) {
        const statusArray = status.split(',')
        q = query(
          collection(db, 'job_assignments'),
          where('assignedStaffId', '==', auth.staffId),
          where('status', 'in', statusArray),
          orderBy('createdAt', 'desc')
        )
      }

      const snapshot = await getDocs(q)
      const assignments: JobAssignment[] = []

      snapshot.forEach(doc => {
        assignments.push({ id: doc.id, ...doc.data() } as JobAssignment)
      })

      // Apply limit if specified
      const limitNum = limit_param ? parseInt(limit_param) : undefined
      const limitedAssignments = limitNum ? assignments.slice(0, limitNum) : assignments

      return createMobileSuccessResponse({
        assignments: limitedAssignments,
        total: assignments.length,
        pending: assignments.filter(a => a.status === 'assigned').length,
        accepted: assignments.filter(a => a.status === 'accepted').length,
        inProgress: assignments.filter(a => a.status === 'in_progress').length,
        completed: assignments.filter(a => a.status === 'completed').length
      })
    } catch (error) {
      console.error('❌ Error fetching mobile job assignments:', error)
      return createMobileErrorResponse('Failed to fetch job assignments')
    }
  })(request)
}
