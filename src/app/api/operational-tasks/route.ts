/**
 * Operational Tasks API - Phase 3
 * Handles task management for cleaning, inspection, and maintenance workflows
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/firebase'
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore'
import { operationsAutomationService } from '@/services/OperationsAutomationService'

// GET /api/operational-tasks - Get tasks with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get('staffId')
    const status = searchParams.get('status')
    const taskType = searchParams.get('taskType')
    const propertyId = searchParams.get('propertyId')
    
    console.log('📋 Getting operational tasks with filters:', { staffId, status, taskType, propertyId })
    
    const db = getDb()
    let tasksQuery = query(collection(db, 'operational_tasks'))
    
    // Apply filters
    const conditions = []
    if (staffId) conditions.push(where('assignedStaffId', '==', staffId))
    if (status) conditions.push(where('status', '==', status))
    if (taskType) conditions.push(where('taskType', '==', taskType))
    if (propertyId) conditions.push(where('propertyId', '==', propertyId))
    
    if (conditions.length > 0) {
      tasksQuery = query(collection(db, 'operational_tasks'), ...conditions, orderBy('scheduledDateTime'))
    } else {
      tasksQuery = query(collection(db, 'operational_tasks'), orderBy('scheduledDateTime'))
    }
    
    const snapshot = await getDocs(tasksQuery)
    const tasks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      scheduledDateTime: doc.data().scheduledDateTime?.toDate?.()?.toISOString(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString()
    }))
    
    console.log(`✅ Retrieved ${tasks.length} tasks`)
    
    return NextResponse.json({
      success: true,
      tasks,
      count: tasks.length
    })
    
  } catch (error) {
    console.error('❌ Error getting operational tasks:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve tasks',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/operational-tasks - Create or update task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, taskId, ...taskData } = body
    
    console.log(`📋 Processing task ${action}:`, taskId || 'new')
    
    const db = getDb()
    
    if (action === 'create') {
      // Create new task
      const newTask = {
        ...taskData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'pending'
      }
      
      const docRef = await addDoc(collection(db, 'operational_tasks'), newTask)
      
      return NextResponse.json({
        success: true,
        message: 'Task created successfully',
        taskId: docRef.id
      })
      
    } else if (action === 'update') {
      // Update existing task
      if (!taskId) {
        return NextResponse.json(
          { success: false, error: 'Task ID required for update' },
          { status: 400 }
        )
      }
      
      const updateData = {
        ...taskData,
        updatedAt: serverTimestamp()
      }
      
      await updateDoc(doc(db, 'operational_tasks', taskId), updateData)
      
      return NextResponse.json({
        success: true,
        message: 'Task updated successfully',
        taskId
      })
      
    } else if (action === 'start') {
      // Start task
      if (!taskId) {
        return NextResponse.json(
          { success: false, error: 'Task ID required to start task' },
          { status: 400 }
        )
      }
      
      await updateDoc(doc(db, 'operational_tasks', taskId), {
        status: 'in_progress',
        actualStartTime: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      
      return NextResponse.json({
        success: true,
        message: 'Task started successfully',
        taskId
      })
      
    } else if (action === 'complete') {
      // Complete task
      if (!taskId) {
        return NextResponse.json(
          { success: false, error: 'Task ID required to complete task' },
          { status: 400 }
        )
      }
      
      const { completionData } = body
      
      // Validate required completion data based on task type
      if (taskData.taskType === 'cleaning') {
        if (!completionData.photosUploaded || completionData.photosUploaded.length === 0) {
          return NextResponse.json(
            { success: false, error: 'Photo upload required for cleaning completion' },
            { status: 400 }
          )
        }
        
        if (!completionData.checklistCompleted) {
          return NextResponse.json(
            { success: false, error: 'Cleaning checklist must be completed' },
            { status: 400 }
          )
        }
        
        // Handle cleaning completion workflow
        await operationsAutomationService.handleCleaningCompletion(taskId, completionData)
      }
      
      await updateDoc(doc(db, 'operational_tasks', taskId), {
        status: 'completed',
        actualEndTime: serverTimestamp(),
        completedAt: serverTimestamp(),
        completionNotes: completionData.notes || '',
        photosUploaded: completionData.photosUploaded || [],
        checklistCompleted: completionData.checklistCompleted || false,
        updatedAt: serverTimestamp()
      })
      
      return NextResponse.json({
        success: true,
        message: 'Task completed successfully',
        taskId
      })
      
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be: create, update, start, or complete' },
        { status: 400 }
      )
    }
    
  } catch (error) {
    console.error('❌ Error processing task action:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process task action',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
