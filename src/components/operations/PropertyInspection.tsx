/**
 * Property Inspection Component - Phase 3
 * Post-cleaning inspection interface with issue logging and approval workflow
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Checkbox'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Camera, 
  Clock, 
  User, 
  Home,
  Wrench,
  Upload
} from 'lucide-react'

interface InspectionItem {
  id: string
  area: string
  item: string
  required: boolean
  passed: boolean | null
  notes?: string
  photoRequired: boolean
  photoUploaded?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
}

interface Issue {
  id: string
  area: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: 'cleaning' | 'maintenance' | 'damage' | 'safety'
  photoRequired: boolean
  photoUploaded?: string
  estimatedCost?: number
  requiresExternalContractor: boolean
}

interface PropertyInspectionProps {
  taskId: string
  propertyName: string
  cleaningTaskId: string
  inspectorName: string
  onComplete: (inspectionData: {
    passed: boolean
    issues: Issue[]
    totalScore: number
    inspectionNotes: string
    photosUploaded: string[]
    nextCheckInBlocked: boolean
  }) => void
  onStart?: () => void
  readOnly?: boolean
  initialItems?: InspectionItem[]
}

const DEFAULT_INSPECTION_ITEMS: InspectionItem[] = [
  // Living Areas
  { 
    id: 'living_1', 
    area: 'Living Room', 
    item: 'Furniture arranged and cushions fluffed', 
    required: true, 
    passed: null, 
    photoRequired: false,
    priority: 'medium'
  },
  { 
    id: 'living_2', 
    area: 'Living Room', 
    item: 'No visible dust on surfaces', 
    required: true, 
    passed: null, 
    photoRequired: false,
    priority: 'high'
  },
  { 
    id: 'living_3', 
    area: 'Living Room', 
    item: 'Windows and mirrors streak-free', 
    required: true, 
    passed: null, 
    photoRequired: false,
    priority: 'medium'
  },
  { 
    id: 'living_4', 
    area: 'Living Room', 
    item: 'Floors vacuumed/swept with no debris', 
    required: true, 
    passed: null, 
    photoRequired: false,
    priority: 'high'
  },
  
  // Kitchen
  { 
    id: 'kitchen_1', 
    area: 'Kitchen', 
    item: 'Countertops clean and sanitized', 
    required: true, 
    passed: null, 
    photoRequired: false,
    priority: 'high'
  },
  { 
    id: 'kitchen_2', 
    area: 'Kitchen', 
    item: 'Appliances clean inside and out', 
    required: true, 
    passed: null, 
    photoRequired: false,
    priority: 'high'
  },
  { 
    id: 'kitchen_3', 
    area: 'Kitchen', 
    item: 'All dishes washed and put away', 
    required: true, 
    passed: null, 
    photoRequired: false,
    priority: 'critical'
  },
  { 
    id: 'kitchen_4', 
    area: 'Kitchen', 
    item: 'Sink and faucet spotless', 
    required: true, 
    passed: null, 
    photoRequired: false,
    priority: 'medium'
  },
  { 
    id: 'kitchen_5', 
    area: 'Kitchen', 
    item: 'Trash removed and fresh bags installed', 
    required: true, 
    passed: null, 
    photoRequired: false,
    priority: 'critical'
  },
  
  // Bedrooms
  { 
    id: 'bedroom_1', 
    area: 'Bedroom', 
    item: 'Fresh linens with hospital corners', 
    required: true, 
    passed: null, 
    photoRequired: true,
    priority: 'critical'
  },
  { 
    id: 'bedroom_2', 
    area: 'Bedroom', 
    item: 'No wrinkles or stains on bedding', 
    required: true, 
    passed: null, 
    photoRequired: false,
    priority: 'high'
  },
  { 
    id: 'bedroom_3', 
    area: 'Bedroom', 
    item: 'Floors thoroughly cleaned', 
    required: true, 
    passed: null, 
    photoRequired: false,
    priority: 'high'
  },
  { 
    id: 'bedroom_4', 
    area: 'Bedroom', 
    item: 'Nightstands and surfaces dust-free', 
    required: true, 
    passed: null, 
    photoRequired: false,
    priority: 'medium'
  },
  
  // Bathrooms
  { 
    id: 'bathroom_1', 
    area: 'Bathroom', 
    item: 'Toilet cleaned and disinfected', 
    required: true, 
    passed: null, 
    photoRequired: false,
    priority: 'critical'
  },
  { 
    id: 'bathroom_2', 
    area: 'Bathroom', 
    item: 'Shower/bathtub spotless and dry', 
    required: true, 
    passed: null, 
    photoRequired: false,
    priority: 'high'
  },
  { 
    id: 'bathroom_3', 
    area: 'Bathroom', 
    item: 'Fresh towels and amenities stocked', 
    required: true, 
    passed: null, 
    photoRequired: false,
    priority: 'critical'
  },
  { 
    id: 'bathroom_4', 
    area: 'Bathroom', 
    item: 'Mirror and fixtures clean', 
    required: true, 
    passed: null, 
    photoRequired: false,
    priority: 'medium'
  },
  { 
    id: 'bathroom_5', 
    area: 'Bathroom', 
    item: 'Floor mopped and dry', 
    required: true, 
    passed: null, 
    photoRequired: false,
    priority: 'high'
  },
  
  // General/Safety
  { 
    id: 'general_1', 
    area: 'General', 
    item: 'All lights functioning properly', 
    required: true, 
    passed: null, 
    photoRequired: false,
    priority: 'high'
  },
  { 
    id: 'general_2', 
    area: 'General', 
    item: 'Temperature set to 72°F (22°C)', 
    required: true, 
    passed: null, 
    photoRequired: false,
    priority: 'medium'
  },
  { 
    id: 'general_3', 
    area: 'General', 
    item: 'All windows and doors secure', 
    required: true, 
    passed: null, 
    photoRequired: false,
    priority: 'high'
  },
  { 
    id: 'general_4', 
    area: 'General', 
    item: 'Property ready for guest arrival', 
    required: true, 
    passed: null, 
    photoRequired: true,
    priority: 'critical'
  }
]

export default function PropertyInspection({
  taskId,
  propertyName,
  cleaningTaskId,
  inspectorName,
  onComplete,
  onStart,
  readOnly = false,
  initialItems
}: PropertyInspectionProps) {
  const [items, setItems] = useState<InspectionItem[]>(initialItems || DEFAULT_INSPECTION_ITEMS)
  const [issues, setIssues] = useState<Issue[]>([])
  const [inspectionNotes, setInspectionNotes] = useState('')
  const [isStarted, setIsStarted] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [newIssue, setNewIssue] = useState<Partial<Issue>>({})
  const [showAddIssue, setShowAddIssue] = useState(false)

  // Calculate inspection stats
  const totalItems = items.length
  const inspectedItems = items.filter(item => item.passed !== null).length
  const passedItems = items.filter(item => item.passed === true).length
  const failedItems = items.filter(item => item.passed === false).length
  const criticalItems = items.filter(item => item.priority === 'critical').length
  const criticalPassed = items.filter(item => item.priority === 'critical' && item.passed === true).length
  const criticalFailed = items.filter(item => item.priority === 'critical' && item.passed === false).length
  
  const inspectionComplete = inspectedItems === totalItems
  const allCriticalPassed = criticalFailed === 0
  const overallPassed = inspectionComplete && allCriticalPassed && issues.filter(i => i.priority === 'critical').length === 0
  
  const totalScore = totalItems > 0 ? Math.round((passedItems / totalItems) * 100) : 0

  // Group items by area
  const itemsByArea = items.reduce((groups, item) => {
    if (!groups[item.area]) {
      groups[item.area] = []
    }
    groups[item.area].push(item)
    return groups
  }, {} as Record<string, InspectionItem[]>)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-600'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return XCircle
      case 'high': return AlertTriangle
      default: return CheckCircle
    }
  }

  const handleItemInspection = (itemId: string, passed: boolean) => {
    if (readOnly) return
    
    setItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, passed }
        : item
    ))
  }

  const handleItemNotes = (itemId: string, notes: string) => {
    if (readOnly) return
    
    setItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, notes }
        : item
    ))
  }

  const handlePhotoUpload = async (itemId: string) => {
    if (readOnly) return
    
    setUploadingPhoto(itemId)
    
    try {
      // Simulate photo upload - in real implementation, this would upload to Firebase Storage
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const photoUrl = `https://example.com/inspection-photos/${itemId}-${Date.now()}.jpg`
      
      setItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, photoUploaded: photoUrl }
          : item
      ))
      
      console.log(`📸 Inspection photo uploaded for ${itemId}`)
    } catch (error) {
      console.error('❌ Photo upload failed:', error)
      alert('Photo upload failed. Please try again.')
    } finally {
      setUploadingPhoto(null)
    }
  }

  const handleAddIssue = () => {
    if (!newIssue.area || !newIssue.description) return
    
    const issue: Issue = {
      id: Date.now().toString(),
      area: newIssue.area!,
      description: newIssue.description!,
      priority: newIssue.priority || 'medium',
      category: newIssue.category || 'cleaning',
      photoRequired: newIssue.photoRequired || false,
      estimatedCost: newIssue.estimatedCost,
      requiresExternalContractor: newIssue.requiresExternalContractor || false
    }
    
    setIssues(prev => [...prev, issue])
    setNewIssue({})
    setShowAddIssue(false)
    
    console.log(`⚠️ Issue added: ${issue.description}`)
  }

  const handleStart = () => {
    if (readOnly) return
    
    setIsStarted(true)
    setStartTime(new Date())
    onStart?.()
    console.log(`🔍 Inspection started for ${propertyName}`)
  }

  const handleComplete = () => {
    if (readOnly || !inspectionComplete) return
    
    const allPhotosUploaded = items
      .filter(item => item.photoRequired)
      .map(item => item.photoUploaded)
      .filter(Boolean) as string[]
    
    const issuePhotos = issues
      .filter(issue => issue.photoUploaded)
      .map(issue => issue.photoUploaded!)
    
    const completionData = {
      passed: overallPassed,
      issues: issues,
      totalScore: totalScore,
      inspectionNotes: inspectionNotes.trim(),
      photosUploaded: [...allPhotosUploaded, ...issuePhotos],
      nextCheckInBlocked: !overallPassed || criticalFailed > 0
    }
    
    onComplete(completionData)
    console.log(`✅ Inspection ${overallPassed ? 'PASSED' : 'FAILED'} for ${propertyName}`)
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
                Post-Cleaning Property Inspection
              </CardTitle>
              <p className="text-gray-600 mt-1">
                {propertyName} • Inspector: {inspectorName}
              </p>
              <p className="text-sm text-gray-500">
                Following Cleaning Task: {cleaningTaskId}
              </p>
            </div>
            <div className="text-right">
              <Badge 
                variant={overallPassed ? 'default' : criticalFailed > 0 ? 'destructive' : 'secondary'}
                className="text-sm"
              >
                {totalScore}% Score
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-lg font-semibold">{inspectedItems}/{totalItems}</div>
              <div className="text-sm text-gray-500">Inspected</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">{passedItems}</div>
              <div className="text-sm text-gray-500">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-red-600">{failedItems}</div>
              <div className="text-sm text-gray-500">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{issues.length}</div>
              <div className="text-sm text-gray-500">Issues</div>
            </div>
          </div>
          
          {/* Critical Items Status */}
          <div className="bg-gray-50 border rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-gray-800">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Critical Items:</span>
              <span className="text-sm">
                {criticalPassed}/{criticalItems} passed
                {criticalFailed > 0 && (
                  <span className="text-red-600 font-medium ml-2">
                    ({criticalFailed} FAILED - Property Not Ready)
                  </span>
                )}
              </span>
            </div>
          </div>
          
          {!isStarted && !readOnly && (
            <Button onClick={handleStart} className="w-full">
              <User className="w-4 h-4 mr-2" />
              Start Inspection
            </Button>
          )}
          
          {isStarted && inspectionComplete && !readOnly && (
            <Button 
              onClick={handleComplete} 
              className={`w-full ${
                overallPassed ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {overallPassed ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Property Ready - Complete Inspection
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Property NOT Ready - Log Issues
                </>
              )}
            </Button>
          )}
          
          {isStarted && !inspectionComplete && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-blue-800">
                <Clock className="w-4 h-4" />
                <span className="font-medium">
                  Complete Inspection: {inspectedItems}/{totalItems} items reviewed
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inspection Items by Area */}
      {isStarted && Object.entries(itemsByArea).map(([area, areaItems]) => (
        <Card key={area}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Home className="w-5 h-5" />
              {area}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {areaItems.map((item) => (
              <div key={item.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{item.item}</p>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getPriorityColor(item.priority)} text-white border-0`}
                      >
                        {item.priority.toUpperCase()}
                      </Badge>
                      {item.required && (
                        <Badge variant="outline" className="text-xs">
                          Required
                        </Badge>
                      )}
                    </div>
                    
                    {!readOnly && (
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          variant={item.passed === true ? 'default' : 'outline'}
                          onClick={() => handleItemInspection(item.id, true)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Pass
                        </Button>
                        <Button
                          size="sm"
                          variant={item.passed === false ? 'destructive' : 'outline'}
                          onClick={() => handleItemInspection(item.id, false)}
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Fail
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4">
                    {item.passed === true && (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    )}
                    {item.passed === false && (
                      <XCircle className="w-6 h-6 text-red-600" />
                    )}
                  </div>
                </div>
                
                {item.photoRequired && (
                  <div className="mt-3">
                    {item.photoUploaded ? (
                      <Badge variant="default" className="bg-green-600">
                        <Camera className="w-3 h-3 mr-1" />
                        Photo Uploaded
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePhotoUpload(item.id)}
                        disabled={readOnly || uploadingPhoto === item.id}
                      >
                        {uploadingPhoto === item.id ? (
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
                
                {(item.passed === false || item.notes) && (
                  <Textarea
                    placeholder="Add notes about this inspection item..."
                    value={item.notes || ''}
                    onChange={(e) => handleItemNotes(item.id, e.target.value)}
                    disabled={readOnly}
                    className="mt-3 text-sm"
                    rows={2}
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Issues Section */}
      {isStarted && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                Issues Found ({issues.length})
              </span>
              {!readOnly && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddIssue(true)}
                >
                  Add Issue
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {issues.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No issues found. Property inspection looking good! 🎉
              </p>
            ) : (
              <div className="space-y-3">
                {issues.map((issue) => (
                  <div key={issue.id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getPriorityColor(issue.priority)} text-white border-0`}
                          >
                            {issue.priority.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {issue.category}
                          </Badge>
                          <span className="text-sm text-gray-600">{issue.area}</span>
                        </div>
                        <p className="text-sm">{issue.description}</p>
                        {issue.estimatedCost && (
                          <p className="text-sm text-green-600 font-medium mt-1">
                            Estimated Cost: ${issue.estimatedCost}
                          </p>
                        )}
                        {issue.requiresExternalContractor && (
                          <Badge variant="destructive" className="text-xs mt-1">
                            Requires External Contractor
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Add Issue Form */}
            {showAddIssue && (
              <div className="border-t pt-4 mt-4 space-y-3">
                <h4 className="font-medium">Add New Issue</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Area (e.g., Kitchen)"
                    value={newIssue.area || ''}
                    onChange={(e) => setNewIssue(prev => ({...prev, area: e.target.value}))}
                  />
                  <select
                    className="px-3 py-2 border rounded-md"
                    value={newIssue.category || ''}
                    onChange={(e) => setNewIssue(prev => ({...prev, category: e.target.value as Issue['category']}))}
                  >
                    <option value="">Select Category</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="damage">Damage</option>
                    <option value="safety">Safety</option>
                  </select>
                </div>
                <Textarea
                  placeholder="Issue description..."
                  value={newIssue.description || ''}
                  onChange={(e) => setNewIssue(prev => ({...prev, description: e.target.value}))}
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleAddIssue}
                    disabled={!newIssue.area || !newIssue.description}
                  >
                    Add Issue
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddIssue(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Final Notes */}
      {isStarted && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Inspection Summary Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Add overall inspection notes, guest-ready status, or recommendations..."
              value={inspectionNotes}
              onChange={(e) => setInspectionNotes(e.target.value)}
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
