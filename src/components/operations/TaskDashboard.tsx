/**
 * Operations Task Dashboard - Phase 3
 * Central dashboard for viewing and managing operational tasks
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  User, 
  Calendar,
  MapPin,
  Search,
  Filter,
  RefreshCw,
  Play,
  Pause,
  XCircle,
  Camera,
  Wrench,
  Home
} from 'lucide-react'

import CleaningChecklist from './CleaningChecklist'
import PropertyInspection from './PropertyInspection'

interface OperationalTask {
  id: string
  type: 'checkout' | 'cleaning' | 'inspection' | 'maintenance'
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  bookingId: string
  propertyName: string
  guestName: string
  scheduledDate: Date
  assignedTo?: {
    id: string
    name: string
    role: string
  }
  estimatedDuration: number // minutes
  actualStartTime?: Date
  actualEndTime?: Date
  completionData?: any
  issues?: Array<{
    description: string
    priority: string
    resolved: boolean
  }>
  location: {
    address: string
    coordinates?: { lat: number; lng: number }
  }
  requirements: string[]
  notes?: string
}

import { MobileStaffMonitoring } from './MobileStaffIntegration'

interface TaskDashboardProps {
  currentUser: {
    id: string
    name: string
    role: 'admin' | 'staff' | 'cleaner' | 'inspector'
    firebaseUid?: string
  }
  onTaskUpdate?: (taskId: string, updates: Partial<OperationalTask>) => void
  staffProfiles?: Array<{
    id: string
    name: string
    email: string
    role: string
    status: string
    firebaseUid: string
  }>
}

// Mock data for demonstration
const MOCK_TASKS: OperationalTask[] = [
  {
    id: 'task_1',
    type: 'checkout',
    status: 'completed',
    priority: 'medium',
    bookingId: 'booking_123',
    propertyName: 'Villa Seaside',
    guestName: 'John Smith',
    scheduledDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    assignedTo: { id: 'auto', name: 'Automatic', role: 'system' },
    estimatedDuration: 30,
    actualStartTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    actualEndTime: new Date(Date.now() - 90 * 60 * 1000),
    location: { address: '123 Beach Dr, Miami, FL' },
    requirements: ['Guest checkout confirmed', 'Keys collected'],
    completionData: { checkoutTime: new Date(), damageReport: false }
  },
  {
    id: 'task_2',
    type: 'cleaning',
    status: 'in_progress',
    priority: 'high',
    bookingId: 'booking_123',
    propertyName: 'Villa Seaside',
    guestName: 'John Smith',
    scheduledDate: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    assignedTo: { id: 'cleaner_1', name: 'Maria Garcia', role: 'cleaner' },
    estimatedDuration: 120,
    actualStartTime: new Date(Date.now() - 30 * 60 * 1000),
    location: { address: '123 Beach Dr, Miami, FL' },
    requirements: ['Deep cleaning', 'Linen change', 'Photo documentation']
  },
  {
    id: 'task_3',
    type: 'inspection',
    status: 'pending',
    priority: 'high',
    bookingId: 'booking_123',
    propertyName: 'Villa Seaside',
    guestName: 'John Smith',
    scheduledDate: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    estimatedDuration: 45,
    location: { address: '123 Beach Dr, Miami, FL' },
    requirements: ['Post-cleaning inspection', 'Quality check', 'Guest-ready verification']
  },
  {
    id: 'task_4',
    type: 'cleaning',
    status: 'assigned',
    priority: 'medium',
    bookingId: 'booking_456',
    propertyName: 'Ocean View Condo',
    guestName: 'Sarah Johnson',
    scheduledDate: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
    assignedTo: { id: 'cleaner_2', name: 'Carlos Rodriguez', role: 'cleaner' },
    estimatedDuration: 90,
    location: { address: '456 Ocean Ave, Miami, FL' },
    requirements: ['Standard cleaning', 'Amenities restock']
  },
  {
    id: 'task_5',
    type: 'maintenance',
    status: 'pending',
    priority: 'critical',
    bookingId: 'booking_789',
    propertyName: 'Downtown Loft',
    guestName: 'Mike Wilson',
    scheduledDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    estimatedDuration: 180,
    location: { address: '789 City St, Miami, FL' },
    requirements: ['AC repair', 'Electrical check'],
    issues: [{ description: 'AC not cooling properly', priority: 'critical', resolved: false }]
  }
]

export default function TaskDashboard({ currentUser, onTaskUpdate, staffProfiles }: TaskDashboardProps) {
  const [tasks, setTasks] = useState<OperationalTask[]>(MOCK_TASKS)
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [showTaskDetail, setShowTaskDetail] = useState(false)

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.guestName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    const matchesType = typeFilter === 'all' || task.type === typeFilter
    
    // Show tasks relevant to current user role
    if (currentUser.role === 'cleaner') {
      return matchesSearch && matchesStatus && matchesType && 
             (task.type === 'cleaning' && (task.assignedTo?.id === currentUser.id || !task.assignedTo))
    }
    if (currentUser.role === 'inspector') {
      return matchesSearch && matchesStatus && matchesType && task.type === 'inspection'
    }
    
    return matchesSearch && matchesStatus && matchesType
  })

  // Group tasks by status for display
  const tasksByStatus = {
    pending: filteredTasks.filter(t => t.status === 'pending'),
    assigned: filteredTasks.filter(t => t.status === 'assigned'),
    in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
    completed: filteredTasks.filter(t => t.status === 'completed'),
    failed: filteredTasks.filter(t => t.status === 'failed')
  }

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'checkout': return Calendar
      case 'cleaning': return Home
      case 'inspection': return CheckCircle
      case 'maintenance': return Wrench
      default: return Clock
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'assigned': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'in_progress': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'failed': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-600'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 60) {
      return `${diffMins}m ago`
    }
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) {
      return `${diffHours}h ago`
    }
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  const handleTaskAction = (taskId: string, action: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id !== taskId) return task
      
      switch (action) {
        case 'start':
          return {
            ...task,
            status: 'in_progress',
            actualStartTime: new Date(),
            assignedTo: task.assignedTo || currentUser
          }
        case 'complete':
          return {
            ...task,
            status: 'completed',
            actualEndTime: new Date()
          }
        case 'assign_self':
          return {
            ...task,
            status: 'assigned',
            assignedTo: currentUser
          }
        default:
          return task
      }
    }))
    
    onTaskUpdate?.(taskId, { status: action === 'start' ? 'in_progress' : action === 'complete' ? 'completed' : 'assigned' })
  }

  const handleOpenTaskDetail = (taskId: string) => {
    setSelectedTask(taskId)
    setShowTaskDetail(true)
  }

  const selectedTaskData = tasks.find(t => t.id === selectedTask)

  const TaskCard = ({ task }: { task: OperationalTask }) => {
    const Icon = getTaskIcon(task.type)
    const isOverdue = task.scheduledDate < new Date() && task.status !== 'completed'
    
    return (
      <Card className={`cursor-pointer transition-shadow hover:shadow-md ${isOverdue ? 'border-red-300' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Icon className="w-5 h-5 text-gray-600" />
              <div>
                <h3 className="font-medium text-sm">{task.propertyName}</h3>
                <p className="text-xs text-gray-500">{task.guestName}</p>
              </div>
            </div>
            <div className="text-right">
              <Badge 
                variant="outline" 
                className={`text-xs ${getStatusColor(task.status)}`}
              >
                {task.status.replace('_', ' ')}
              </Badge>
              {isOverdue && (
                <Badge variant="destructive" className="text-xs mt-1 block">
                  OVERDUE
                </Badge>
              )}
            </div>
          </div>
          
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Type:</span>
              <span className="capitalize">{task.type}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Priority:</span>
              <Badge 
                variant="outline" 
                className={`text-xs ${getPriorityColor(task.priority)} text-white border-0`}
              >
                {task.priority.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Duration:</span>
              <span>{formatDuration(task.estimatedDuration)}</span>
            </div>
            {task.assignedTo && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Assigned:</span>
                <span>{task.assignedTo.name}</span>
              </div>
            )}
            {task.actualStartTime && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Started:</span>
                <span>{formatTimeAgo(task.actualStartTime)}</span>
              </div>
            )}
            {task.issues && task.issues.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Issues:</span>
                <Badge variant="destructive" className="text-xs">
                  {task.issues.length}
                </Badge>
              </div>
            )}
          </div>
          
          <div className="mt-3 pt-3 border-t space-y-2">
            {task.status === 'pending' && !task.assignedTo && currentUser.role !== 'admin' && (
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  handleTaskAction(task.id, 'assign_self')
                }}
              >
                Assign to Me
              </Button>
            )}
            {task.status === 'assigned' && task.assignedTo?.id === currentUser.id && (
              <Button 
                size="sm" 
                className="w-full text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  handleTaskAction(task.id, 'start')
                }}
              >
                <Play className="w-3 h-3 mr-1" />
                Start Task
              </Button>
            )}
            {task.status === 'in_progress' && task.assignedTo?.id === currentUser.id && (
              <Button 
                size="sm" 
                variant="outline"
                className="w-full text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  handleOpenTaskDetail(task.id)
                }}
              >
                Open Workflow
              </Button>
            )}
            {task.status === 'completed' && (
              <div className="text-center text-xs text-green-600 font-medium">
                ✅ Completed {task.actualEndTime && formatTimeAgo(task.actualEndTime)}
              </div>
            )}
            <Button 
              size="sm" 
              variant="ghost" 
              className="w-full text-xs"
              onClick={() => handleOpenTaskDetail(task.id)}
            >
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Operations Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {currentUser.name} ({currentUser.role})
          </p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by property or guest name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Types</option>
              <option value="checkout">Checkout</option>
              <option value="cleaning">Cleaning</option>
              <option value="inspection">Inspection</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Task Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
          <Card key={status}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{statusTasks.length}</div>
              <div className="text-sm text-gray-600 capitalize">
                {status.replace('_', ' ')}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tasks Display */}
      <Tabs value={statusFilter === 'all' ? 'overview' : statusFilter} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="assigned">Assigned</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
            <div key={status}>
              <h3 className="text-lg font-semibold mb-3 capitalize">
                {status.replace('_', ' ')} ({statusTasks.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {statusTasks.slice(0, 6).map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
              {statusTasks.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  No {status.replace('_', ' ')} tasks
                </p>
              )}
            </div>
          ))}
        </TabsContent>
        
        {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
          <TabsContent key={status} value={status}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {statusTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
            {statusTasks.length === 0 && (
              <p className="text-gray-500 text-center py-8">
                No {status.replace('_', ' ')} tasks found
              </p>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Task Detail Modal */}
      {showTaskDetail && selectedTaskData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto w-full">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {selectedTaskData.type === 'cleaning' ? 'Cleaning Workflow' : 
                   selectedTaskData.type === 'inspection' ? 'Inspection Workflow' : 
                   'Task Details'}
                </h2>
                <Button
                  variant="ghost"
                  onClick={() => setShowTaskDetail(false)}
                >
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <div className="p-4">
              {selectedTaskData.type === 'cleaning' && selectedTaskData.status === 'in_progress' && (
                <CleaningChecklist
                  taskId={selectedTaskData.id}
                  propertyName={selectedTaskData.propertyName}
                  guestName={selectedTaskData.guestName}
                  onComplete={(completionData) => {
                    handleTaskAction(selectedTaskData.id, 'complete')
                    setShowTaskDetail(false)
                  }}
                  readOnly={selectedTaskData.assignedTo?.id !== currentUser.id}
                />
              )}
              {selectedTaskData.type === 'inspection' && selectedTaskData.status === 'in_progress' && (
                <PropertyInspection
                  taskId={selectedTaskData.id}
                  propertyName={selectedTaskData.propertyName}
                  cleaningTaskId="task_2"
                  inspectorName={currentUser.name}
                  onComplete={(inspectionData) => {
                    handleTaskAction(selectedTaskData.id, 'complete')
                    setShowTaskDetail(false)
                  }}
                  readOnly={selectedTaskData.assignedTo?.id !== currentUser.id}
                />
              )}
              {(selectedTaskData.type !== 'cleaning' && selectedTaskData.type !== 'inspection') || selectedTaskData.status !== 'in_progress' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2">Task Information</h3>
                      <div className="space-y-1 text-sm">
                        <p><strong>Type:</strong> {selectedTaskData.type}</p>
                        <p><strong>Status:</strong> {selectedTaskData.status}</p>
                        <p><strong>Priority:</strong> {selectedTaskData.priority}</p>
                        <p><strong>Duration:</strong> {formatDuration(selectedTaskData.estimatedDuration)}</p>
                        {selectedTaskData.assignedTo && (
                          <p><strong>Assigned to:</strong> {selectedTaskData.assignedTo.name}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Property Information</h3>
                      <div className="space-y-1 text-sm">
                        <p><strong>Property:</strong> {selectedTaskData.propertyName}</p>
                        <p><strong>Guest:</strong> {selectedTaskData.guestName}</p>
                        <p><strong>Address:</strong> {selectedTaskData.location.address}</p>
                        <p><strong>Booking ID:</strong> {selectedTaskData.bookingId}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Requirements</h3>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {selectedTaskData.requirements.map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  </div>
                  
                  {selectedTaskData.issues && selectedTaskData.issues.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Issues</h3>
                      <div className="space-y-2">
                        {selectedTaskData.issues.map((issue, index) => (
                          <div key={index} className="p-2 border rounded bg-red-50">
                            <p className="text-sm">{issue.description}</p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {issue.priority}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
