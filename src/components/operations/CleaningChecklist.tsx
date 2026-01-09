/**
 * Cleaning Checklist Component - Phase 3
 * Interactive checklist for cleaners with photo upload enforcement
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Checkbox'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { Camera, CheckCircle, Clock, AlertCircle, Upload } from 'lucide-react'

interface CleaningTask {
  id: string
  room: string
  task: string
  required: boolean
  completed: boolean
  notes?: string
  photoRequired: boolean
  photoUploaded?: string
}

interface CleaningChecklistProps {
  taskId: string
  propertyName: string
  guestName: string
  onComplete: (completionData: {
    photosUploaded: string[]
    checklistCompleted: boolean
    completionNotes: string
    allTasksCompleted: boolean
  }) => void
  onStart?: () => void
  readOnly?: boolean
  initialTasks?: CleaningTask[]
}

const DEFAULT_CLEANING_TASKS: CleaningTask[] = [
  // Living Areas
  { id: 'living_1', room: 'Living Room', task: 'Vacuum/sweep floors', required: true, completed: false, photoRequired: false },
  { id: 'living_2', room: 'Living Room', task: 'Dust surfaces and furniture', required: true, completed: false, photoRequired: false },
  { id: 'living_3', room: 'Living Room', task: 'Clean windows and mirrors', required: true, completed: false, photoRequired: false },
  { id: 'living_4', room: 'Living Room', task: 'Arrange cushions and furniture', required: true, completed: false, photoRequired: true },
  
  // Kitchen
  { id: 'kitchen_1', room: 'Kitchen', task: 'Clean and sanitize countertops', required: true, completed: false, photoRequired: false },
  { id: 'kitchen_2', room: 'Kitchen', task: 'Clean appliances (microwave, fridge, oven)', required: true, completed: false, photoRequired: false },
  { id: 'kitchen_3', room: 'Kitchen', task: 'Wash dishes and put away', required: true, completed: false, photoRequired: false },
  { id: 'kitchen_4', room: 'Kitchen', task: 'Clean sink and faucet', required: true, completed: false, photoRequired: false },
  { id: 'kitchen_5', room: 'Kitchen', task: 'Take out trash and replace bags', required: true, completed: false, photoRequired: false },
  { id: 'kitchen_6', room: 'Kitchen', task: 'Final kitchen setup', required: true, completed: false, photoRequired: true },
  
  // Bedrooms
  { id: 'bedroom_1', room: 'Bedroom', task: 'Change bed linens', required: true, completed: false, photoRequired: true },
  { id: 'bedroom_2', room: 'Bedroom', task: 'Make beds with hospital corners', required: true, completed: false, photoRequired: false },
  { id: 'bedroom_3', room: 'Bedroom', task: 'Vacuum carpets/sweep floors', required: true, completed: false, photoRequired: false },
  { id: 'bedroom_4', room: 'Bedroom', task: 'Dust nightstands and surfaces', required: true, completed: false, photoRequired: false },
  { id: 'bedroom_5', room: 'Bedroom', task: 'Clean mirrors and windows', required: true, completed: false, photoRequired: false },
  
  // Bathrooms  
  { id: 'bathroom_1', room: 'Bathroom', task: 'Clean and disinfect toilet', required: true, completed: false, photoRequired: false },
  { id: 'bathroom_2', room: 'Bathroom', task: 'Clean shower/bathtub', required: true, completed: false, photoRequired: false },
  { id: 'bathroom_3', room: 'Bathroom', task: 'Clean sink and faucet', required: true, completed: false, photoRequired: false },
  { id: 'bathroom_4', room: 'Bathroom', task: 'Clean mirror and light fixtures', required: true, completed: false, photoRequired: false },
  { id: 'bathroom_5', room: 'Bathroom', task: 'Mop floor and replace towels', required: true, completed: false, photoRequired: false },
  { id: 'bathroom_6', room: 'Bathroom', task: 'Restock amenities (soap, shampoo, TP)', required: true, completed: false, photoRequired: false },
  { id: 'bathroom_7', room: 'Bathroom', task: 'Final bathroom setup', required: true, completed: false, photoRequired: true },
  
  // Final Tasks
  { id: 'final_1', room: 'General', task: 'Empty all trash bins', required: true, completed: false, photoRequired: false },
  { id: 'final_2', room: 'General', task: 'Check all lights and appliances work', required: true, completed: false, photoRequired: false },
  { id: 'final_3', room: 'General', task: 'Set temperature to 72°F', required: true, completed: false, photoRequired: false },
  { id: 'final_4', room: 'General', task: 'Lock all windows and doors', required: true, completed: false, photoRequired: false },
  { id: 'final_5', room: 'General', task: 'Overall property condition', required: true, completed: false, photoRequired: true }
]

export default function CleaningChecklist({
  taskId,
  propertyName,
  guestName,
  onComplete,
  onStart,
  readOnly = false,
  initialTasks
}: CleaningChecklistProps) {
  const [tasks, setTasks] = useState<CleaningTask[]>(initialTasks || DEFAULT_CLEANING_TASKS)
  const [completionNotes, setCompletionNotes] = useState('')
  const [isStarted, setIsStarted] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null)
  const [startTime, setStartTime] = useState<Date | null>(null)

  // Calculate completion stats
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(task => task.completed).length
  const requiredTasks = tasks.filter(task => task.required).length
  const completedRequiredTasks = tasks.filter(task => task.required && task.completed).length
  const photoRequiredTasks = tasks.filter(task => task.photoRequired).length
  const photosUploaded = tasks.filter(task => task.photoRequired && task.photoUploaded).length
  
  const allRequiredTasksCompleted = completedRequiredTasks === requiredTasks
  const allPhotosUploaded = photosUploaded === photoRequiredTasks
  const canComplete = allRequiredTasksCompleted && allPhotosUploaded
  
  const completionPercentage = Math.round((completedTasks / totalTasks) * 100)

  // Group tasks by room
  const tasksByRoom = tasks.reduce((groups, task) => {
    if (!groups[task.room]) {
      groups[task.room] = []
    }
    groups[task.room].push(task)
    return groups
  }, {} as Record<string, CleaningTask[]>)

  const handleTaskToggle = (taskId: string) => {
    if (readOnly) return
    
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, completed: !task.completed }
        : task
    ))
  }

  const handleTaskNotes = (taskId: string, notes: string) => {
    if (readOnly) return
    
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, notes }
        : task
    ))
  }

  const handlePhotoUpload = async (taskId: string) => {
    if (readOnly) return
    
    setUploadingPhoto(taskId)
    
    try {
      // Simulate photo upload - in real implementation, this would upload to Firebase Storage
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const photoUrl = `https://example.com/photos/${taskId}-${Date.now()}.jpg`
      
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, photoUploaded: photoUrl }
          : task
      ))
      
      console.log(`📸 Photo uploaded for task ${taskId}`)
    } catch (error) {
      console.error('❌ Photo upload failed:', error)
      alert('Photo upload failed. Please try again.')
    } finally {
      setUploadingPhoto(null)
    }
  }

  const handleStart = () => {
    if (readOnly) return
    
    setIsStarted(true)
    setStartTime(new Date())
    onStart?.()
    console.log(`▶️ Cleaning started for ${propertyName}`)
  }

  const handleComplete = () => {
    if (readOnly || !canComplete) return
    
    const allPhotosUploadedUrls = tasks
      .filter(task => task.photoRequired && task.photoUploaded)
      .map(task => task.photoUploaded!)
    
    const completionData = {
      photosUploaded: allPhotosUploadedUrls,
      checklistCompleted: allRequiredTasksCompleted,
      completionNotes: completionNotes.trim(),
      allTasksCompleted: completedTasks === totalTasks
    }
    
    onComplete(completionData)
    console.log(`✅ Cleaning completed for ${propertyName}`)
  }

  const formatElapsedTime = () => {
    if (!startTime) return ''
    const elapsed = new Date().getTime() - startTime.getTime()
    const minutes = Math.floor(elapsed / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`
    }
    return `${remainingMinutes}m`
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl font-bold">
                Post-Checkout Cleaning
              </CardTitle>
              <p className="text-gray-600 mt-1">
                {propertyName} • Guest: {guestName}
              </p>
            </div>
            <div className="text-right">
              <Badge 
                variant={canComplete ? 'default' : 'secondary'}
                className="text-sm"
              >
                {completionPercentage}% Complete
              </Badge>
              {isStarted && (
                <p className="text-sm text-gray-500 mt-1">
                  <Clock className="inline w-4 h-4 mr-1" />
                  {formatElapsedTime()}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="text-center">
              <div className="text-lg font-semibold">{completedTasks}/{totalTasks}</div>
              <div className="text-sm text-gray-500">Tasks Done</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{photosUploaded}/{photoRequiredTasks}</div>
              <div className="text-sm text-gray-500">Photos Required</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{completedRequiredTasks}/{requiredTasks}</div>
              <div className="text-sm text-gray-500">Required Tasks</div>
            </div>
          </div>
          
          {!isStarted && !readOnly && (
            <Button onClick={handleStart} className="w-full">
              <Clock className="w-4 h-4 mr-2" />
              Start Cleaning
            </Button>
          )}
          
          {isStarted && canComplete && !readOnly && (
            <Button onClick={handleComplete} className="w-full bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Cleaning
            </Button>
          )}
          
          {isStarted && !canComplete && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">Action Required:</span>
              </div>
              <ul className="text-sm text-yellow-700 mt-1 ml-6">
                {!allRequiredTasksCompleted && (
                  <li>Complete all required tasks ({completedRequiredTasks}/{requiredTasks})</li>
                )}
                {!allPhotosUploaded && (
                  <li>Upload all required photos ({photosUploaded}/{photoRequiredTasks})</li>
                )}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task List by Room */}
      {Object.entries(tasksByRoom).map(([room, roomTasks]) => (
        <Card key={room}>
          <CardHeader>
            <CardTitle className="text-lg">{room}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {roomTasks.map((task) => (
              <div key={task.id} className="border rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={task.completed}
                    onChange={() => handleTaskToggle(task.id)}
                    disabled={readOnly}
                    className="mt-1"
                  />
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                          {task.task}
                          {task.required && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Required
                            </Badge>
                          )}
                        </p>
                        
                        {task.photoRequired && (
                          <div className="mt-2 flex items-center gap-2">
                            {task.photoUploaded ? (
                              <Badge variant="default" className="bg-green-600">
                                <Camera className="w-3 h-3 mr-1" />
                                Photo Uploaded
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePhotoUpload(task.id)}
                                disabled={readOnly || uploadingPhoto === task.id}
                                className="text-xs"
                              >
                                {uploadingPhoto === task.id ? (
                                  <>
                                    <Upload className="w-3 h-3 mr-1 animate-spin" />
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <Camera className="w-3 h-3 mr-1" />
                                    Take Photo
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        )}
                        
                        {task.notes && (
                          <p className="text-sm text-gray-600 mt-1 italic">{task.notes}</p>
                        )}
                      </div>
                    </div>
                    
                    {task.completed && (
                      <Textarea
                        placeholder="Add notes about this task..."
                        value={task.notes || ''}
                        onChange={(e) => handleTaskNotes(task.id, e.target.value)}
                        disabled={readOnly}
                        className="mt-2 text-sm"
                        rows={2}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Completion Notes */}
      {isStarted && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Completion Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Add any notes about the cleaning process, issues encountered, or recommendations..."
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              disabled={readOnly}
              rows={4}
              className="w-full"
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
