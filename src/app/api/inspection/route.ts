/**
 * Property Inspection API - Phase 3
 * Handles inspection workflow completion and issue resolution
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/firebase'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { operationsAutomationService } from '@/services/OperationsAutomationService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { taskId, inspectionResult } = body
    
    console.log(`🔍 Processing inspection for task ${taskId}`)
    
    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'Task ID is required' },
        { status: 400 }
      )
    }
    
    if (!inspectionResult) {
      return NextResponse.json(
        { success: false, error: 'Inspection result is required' },
        { status: 400 }
      )
    }
    
    // Validate inspection result format
    const { passed, photosReviewed, approvalNotes, issuesFound } = inspectionResult
    
    if (typeof passed !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Inspection "passed" must be true or false' },
        { status: 400 }
      )
    }
    
    if (typeof photosReviewed !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Photo review status must be true or false' },
        { status: 400 }
      )
    }
    
    if (!photosReviewed) {
      return NextResponse.json(
        { success: false, error: 'Photos must be reviewed before completing inspection' },
        { status: 400 }
      )
    }
    
    // Process inspection through automation service
    await operationsAutomationService.handleInspectionWorkflow(taskId, inspectionResult)
    
    const responseMessage = passed 
      ? 'Inspection passed - property marked as ready'
      : 'Inspection failed - maintenance tasks created'
    
    return NextResponse.json({
      success: true,
      message: responseMessage,
      taskId,
      inspectionPassed: passed,
      maintenanceRequired: !passed,
      issuesFound: !passed ? issuesFound : undefined
    })
    
  } catch (error) {
    console.error('❌ Error processing inspection:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process inspection',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
