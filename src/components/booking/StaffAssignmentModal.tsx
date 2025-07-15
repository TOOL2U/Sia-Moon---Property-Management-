'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  Users,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  Plus,
  X,
  User
} from 'lucide-react'
import { BookingSyncService } from '@/lib/services/bookingSyncService'
import { TaskAssignment } from '@/types/booking-sync'

interface StaffMember {
  id: string
  name: string
  email: string
  role: string
  status: string
  skills: string[]
  assignedProperties: string[]
  averageRating: number
  completionRate: number
}

interface TaskTemplate {
  taskType: TaskAssignment['taskType']
  title: string
  description: string
  priority: TaskAssignment['priority']
  estimatedDuration: number
}

interface StaffAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  booking: {
    id: string
    propertyName: string
    guestName: string
    checkInDate: string
    checkOutDate: string
    guestCount: number
  }
  currentUser: {
    id: string
    name: string
  }
  onAssignmentComplete?: (assignments: TaskAssignment[]) => void
}

const taskTemplates: TaskTemplate[] = [
  {
    taskType: 'check_in',
    title: 'Guest Check-in',
    description: 'Welcome guests and assist with check-in process',
    priority: 'high',
    estimatedDuration: 30
  },
  {
    taskType: 'check_out',
    title: 'Guest Check-out',
    description: 'Assist with check-out and property inspection',
    priority: 'medium',
    estimatedDuration: 45
  },
  {
    taskType: 'cleaning',
    title: 'Property Cleaning',
    description: 'Deep clean property before guest arrival',
    priority: 'high',
    estimatedDuration: 120
  },
  {
    taskType: 'maintenance',
    title: 'Property Maintenance',
    description: 'Check and maintain property systems',
    priority: 'medium',
    estimatedDuration: 60
  },
  {
    taskType: 'inspection',
    title: 'Property Inspection',
    description: 'Inspect property condition and amenities',
    priority: 'medium',
    estimatedDuration: 30
  }
]

export default function StaffAssignmentModal({
  isOpen,
  onClose,
  booking,
  currentUser,
  onAssignmentComplete
}: StaffAssignmentModalProps) {
  const [availableStaff, setAvailableStaff] = useState<StaffMember[]>([])
  const [selectedStaff, setSelectedStaff] = useState<string[]>([])
  const [selectedTasks, setSelectedTasks] = useState<TaskTemplate[]>([])
  const [customTasks, setCustomTasks] = useState<TaskTemplate[]>([])
  const [generalInstructions, setGeneralInstructions] = useState('')
  const [specialRequirements, setSpecialRequirements] = useState('')
  const [deadline, setDeadline] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingStaff, setLoadingStaff] = useState(true)

  // Load available staff when modal opens
  useEffect(() => {
    if (isOpen) {
      loadAvailableStaff()
    }
  }, [isOpen])

  const loadAvailableStaff = async () => {
    try {
      setLoadingStaff(true)
      const staff = await BookingSyncService.getAvailableStaff()
      setAvailableStaff(staff)
    } catch (error) {
      console.error('Error loading staff:', error)
      toast.error('Failed to load available staff')
    } finally {
      setLoadingStaff(false)
    }
  }

  const handleStaffToggle = (staffId: string) => {
    setSelectedStaff(prev => 
      prev.includes(staffId) 
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    )
  }

  const handleTaskToggle = (task: TaskTemplate) => {
    setSelectedTasks(prev => {
      const exists = prev.find(t => t.taskType === task.taskType)
      if (exists) {
        return prev.filter(t => t.taskType !== task.taskType)
      } else {
        return [...prev, task]
      }
    })
  }

  const addCustomTask = () => {
    const newTask: TaskTemplate = {
      taskType: 'custom',
      title: '',
      description: '',
      priority: 'medium',
      estimatedDuration: 60
    }
    setCustomTasks(prev => [...prev, newTask])
  }

  const updateCustomTask = (index: number, field: keyof TaskTemplate, value: any) => {
    setCustomTasks(prev => prev.map((task, i) => 
      i === index ? { ...task, [field]: value } : task
    ))
  }

  const removeCustomTask = (index: number) => {
    setCustomTasks(prev => prev.filter((_, i) => i !== index))
  }

  const handleAssign = async () => {
    if (selectedStaff.length === 0) {
      toast.error('Please select at least one staff member')
      return
    }

    if (selectedTasks.length === 0 && customTasks.length === 0) {
      toast.error('Please select or create at least one task')
      return
    }

    try {
      setLoading(true)

      // Combine selected template tasks and custom tasks
      const allTasks = [
        ...selectedTasks,
        ...customTasks.filter(task => task.title.trim() !== '')
      ]

      const result = await BookingSyncService.assignStaffToBooking(
        booking.id,
        selectedStaff,
        currentUser.id,
        currentUser.name,
        allTasks.map(task => ({
          taskType: task.taskType,
          title: task.title,
          description: task.description,
          priority: task.priority,
          scheduledDate: booking.checkInDate,
          estimatedDuration: task.estimatedDuration
        })),
        {
          generalInstructions,
          specialRequirements,
          deadline
        }
      )

      if (result.success) {
        toast.success(result.message)
        onAssignmentComplete?.(result.createdTasks || [])
        onClose()
        
        // Reset form
        setSelectedStaff([])
        setSelectedTasks([])
        setCustomTasks([])
        setGeneralInstructions('')
        setSpecialRequirements('')
        setDeadline('')
      } else {
        toast.error(result.error || 'Failed to assign staff')
      }
    } catch (error) {
      console.error('Error assigning staff:', error)
      toast.error('Failed to assign staff')
    } finally {
      setLoading(false)
    }
  }

  const getStaffRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'manager': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'housekeeper': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'maintenance': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'concierge': return 'bg-green-500/20 text-green-400 border-green-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-neutral-900 border-neutral-800">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assign Staff to Booking
          </DialogTitle>
          <div className="text-neutral-400 text-sm">
            <p><strong>Property:</strong> {booking.propertyName}</p>
            <p><strong>Guest:</strong> {booking.guestName}</p>
            <p><strong>Check-in:</strong> {booking.checkInDate}</p>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Staff Selection */}
          <Card className="bg-neutral-800 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Select Staff Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStaff ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
                  <span className="ml-2 text-neutral-400">Loading staff...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableStaff.map((staff) => (
                    <div
                      key={staff.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedStaff.includes(staff.id)
                          ? 'bg-blue-500/20 border-blue-500/50'
                          : 'bg-neutral-700 border-neutral-600 hover:border-neutral-500'
                      }`}
                      onClick={() => handleStaffToggle(staff.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={selectedStaff.includes(staff.id)}
                          onCheckedChange={() => handleStaffToggle(staff.id)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-white font-medium">{staff.name}</h4>
                            <Badge className={getStaffRoleColor(staff.role)}>
                              {staff.role}
                            </Badge>
                          </div>
                          <p className="text-neutral-400 text-sm">{staff.email}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-neutral-500">
                              Rating: {staff.averageRating?.toFixed(1) || 'N/A'}
                            </span>
                            <span className="text-xs text-neutral-500">
                              Completion: {staff.completionRate?.toFixed(1) || 'N/A'}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Task Selection */}
          <Card className="bg-neutral-800 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Select Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Template Tasks */}
              <div>
                <Label className="text-white mb-2 block">Standard Tasks</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {taskTemplates.map((task) => (
                    <div
                      key={task.taskType}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedTasks.find(t => t.taskType === task.taskType)
                          ? 'bg-green-500/20 border-green-500/50'
                          : 'bg-neutral-700 border-neutral-600 hover:border-neutral-500'
                      }`}
                      onClick={() => handleTaskToggle(task)}
                    >
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={!!selectedTasks.find(t => t.taskType === task.taskType)}
                          onCheckedChange={() => handleTaskToggle(task)}
                        />
                        <div className="flex-1">
                          <h4 className="text-white font-medium">{task.title}</h4>
                          <p className="text-neutral-400 text-sm">{task.description}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <Badge className="bg-neutral-600 text-neutral-300">
                              {task.priority}
                            </Badge>
                            <span className="text-xs text-neutral-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {task.estimatedDuration}m
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="bg-neutral-700" />

              {/* Custom Tasks */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-white">Custom Tasks</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCustomTask}
                    className="border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Custom Task
                  </Button>
                </div>
                
                {customTasks.map((task, index) => (
                  <div key={index} className="p-3 bg-neutral-700 rounded-lg mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-white text-sm">Custom Task {index + 1}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCustomTask(index)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-neutral-300 text-xs">Title</Label>
                        <Input
                          value={task.title}
                          onChange={(e) => updateCustomTask(index, 'title', e.target.value)}
                          placeholder="Task title"
                          className="bg-neutral-800 border-neutral-600 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-neutral-300 text-xs">Priority</Label>
                        <Select
                          value={task.priority}
                          onValueChange={(value) => updateCustomTask(index, 'priority', value)}
                        >
                          <SelectTrigger className="bg-neutral-800 border-neutral-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-neutral-800 border-neutral-600">
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-neutral-300 text-xs">Description</Label>
                        <Textarea
                          value={task.description}
                          onChange={(e) => updateCustomTask(index, 'description', e.target.value)}
                          placeholder="Task description"
                          className="bg-neutral-800 border-neutral-600 text-white"
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label className="text-neutral-300 text-xs">Duration (minutes)</Label>
                        <Input
                          type="number"
                          value={task.estimatedDuration}
                          onChange={(e) => updateCustomTask(index, 'estimatedDuration', parseInt(e.target.value) || 60)}
                          className="bg-neutral-800 border-neutral-600 text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Additional Instructions */}
          <Card className="bg-neutral-800 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-white text-lg">Additional Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white">General Instructions</Label>
                <Textarea
                  value={generalInstructions}
                  onChange={(e) => setGeneralInstructions(e.target.value)}
                  placeholder="General instructions for all staff members..."
                  className="bg-neutral-700 border-neutral-600 text-white"
                  rows={3}
                />
              </div>
              
              <div>
                <Label className="text-white">Special Requirements</Label>
                <Textarea
                  value={specialRequirements}
                  onChange={(e) => setSpecialRequirements(e.target.value)}
                  placeholder="Any special requirements or considerations..."
                  className="bg-neutral-700 border-neutral-600 text-white"
                  rows={2}
                />
              </div>
              
              <div>
                <Label className="text-white">Deadline</Label>
                <Input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="bg-neutral-700 border-neutral-600 text-white"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-neutral-600 text-neutral-300 hover:bg-neutral-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={loading || selectedStaff.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Assign Staff ({selectedStaff.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
