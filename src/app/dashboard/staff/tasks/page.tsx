'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/SupabaseAuthContext'
import SupabaseService from '@/lib/supabaseService'
import { Task, Property } from '@/types/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  ClipboardList,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  Building,
  ArrowLeft,
  Play,
  Check,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function StaffTasksPage() {
  const { profile: user } = useAuth()
  const router = useRouter()
  
  const [tasks, setTasks] = useState<Task[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingTask, setUpdatingTask] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is staff
    if (user && user.role !== 'staff') {
      toast.error('Access denied. Staff access required.')
      router.push('/dashboard/client')
      return
    }
    
    if (user) {
      loadTasks()
    }
  }, [user, router])

  const loadTasks = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      
      // Load tasks assigned to current user and all properties
      const [tasksResult, propertiesResult] = await Promise.all([
        DatabaseService.getTasksByAssignee(user.id),
        DatabaseService.getAllProperties()
      ])

      if (tasksResult.error) {
        console.error('Error loading tasks:', tasksResult.error)
        toast.error('Failed to load your tasks')
      } else {
        // Sort tasks by due date and priority
        const sortedTasks = (tasksResult.data || []).sort((a, b) => {
          // First sort by status (pending and in_progress first)
          const statusOrder = { pending: 0, in_progress: 1, completed: 2, cancelled: 3 }
          const statusDiff = statusOrder[a.status] - statusOrder[b.status]
          if (statusDiff !== 0) return statusDiff
          
          // Then by priority
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
          const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
          if (priorityDiff !== 0) return priorityDiff
          
          // Finally by due date
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        })
        setTasks(sortedTasks)
      }

      if (propertiesResult.error) {
        console.error('Error loading properties:', propertiesResult.error)
      } else {
        setProperties(propertiesResult.data || [])
      }
      
    } catch (error) {
      console.error('Error loading tasks:', error)
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      setUpdatingTask(taskId)
      
      const updates: Partial<Task> = {
        status: newStatus
      }
      
      // If marking as completed, set completed_at timestamp
      if (newStatus === 'completed') {
        updates.completed_at = new Date().toISOString()
      }

      const { error } = await DatabaseService.updateTask(taskId, updates)

      if (error) {
        throw new Error(error.message)
      }

      toast.success(`Task marked as ${newStatus.replace('_', ' ')}`)
      await loadTasks() // Reload tasks to reflect changes
      
    } catch (error) {
      console.error('Error updating task status:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update task')
    } finally {
      setUpdatingTask(null)
    }
  }

  const getStatusBadge = (status: Task['status']) => {
    const variants = {
      pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      in_progress: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      completed: 'bg-green-500/10 text-green-500 border-green-500/20',
      cancelled: 'bg-red-500/10 text-red-500 border-red-500/20'
    }

    const icons = {
      pending: Clock,
      in_progress: Loader2,
      completed: CheckCircle,
      cancelled: XCircle
    }

    const Icon = icons[status]

    return (
      <Badge className={`${variants[status]} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: Task['priority']) => {
    const variants = {
      low: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
      medium: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      urgent: 'bg-red-500/10 text-red-500 border-red-500/20'
    }

    const icons = {
      low: Clock,
      medium: Clock,
      high: AlertTriangle,
      urgent: AlertTriangle
    }

    const Icon = icons[priority]

    return (
      <Badge className={`${variants[priority]} text-xs flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {priority}
      </Badge>
    )
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  const getTaskActions = (task: Task) => {
    const isUpdating = updatingTask === task.id

    switch (task.status) {
      case 'pending':
        return (
          <Button
            size="sm"
            onClick={() => updateTaskStatus(task.id, 'in_progress')}
            disabled={isUpdating}
            className="flex items-center gap-1"
          >
            {isUpdating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Play className="h-3 w-3" />
            )}
            Start Task
          </Button>
        )
      
      case 'in_progress':
        return (
          <Button
            size="sm"
            onClick={() => updateTaskStatus(task.id, 'completed')}
            disabled={isUpdating}
            className="flex items-center gap-1"
          >
            {isUpdating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Check className="h-3 w-3" />
            )}
            Complete
          </Button>
        )
      
      default:
        return null
    }
  }

  if (!user || user.role !== 'staff') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-neutral-400">Staff access required to view this page.</p>
          <Link href="/dashboard/client">
            <Button className="mt-4">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard/staff">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          
          <div>
            <h1 className="text-3xl font-bold mb-2">My Tasks</h1>
            <p className="text-neutral-400">Tasks assigned to you</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Total Tasks</p>
                  <p className="text-2xl font-bold">{tasks.length}</p>
                </div>
                <ClipboardList className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Pending</p>
                  <p className="text-2xl font-bold">{tasks.filter(t => t.status === 'pending').length}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">In Progress</p>
                  <p className="text-2xl font-bold">{tasks.filter(t => t.status === 'in_progress').length}</p>
                </div>
                <Loader2 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Completed</p>
                  <p className="text-2xl font-bold">{tasks.filter(t => t.status === 'completed').length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Tasks</CardTitle>
            <CardDescription>
              Tasks assigned to you, sorted by priority and due date
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-neutral-400">Loading your tasks...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardList className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Tasks Assigned</h3>
                <p className="text-neutral-400">
                  You don't have any tasks assigned to you yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => {
                  const property = properties.find(p => p.id === task.property_id)
                  const overdue = isOverdue(task.due_date) && task.status !== 'completed'
                  
                  return (
                    <div 
                      key={task.id} 
                      className={`border rounded-lg p-4 ${
                        overdue ? 'border-red-500/50 bg-red-500/5' : 'border-neutral-800'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-white">{task.title}</h3>
                            {getStatusBadge(task.status)}
                            {getPriorityBadge(task.priority)}
                            {overdue && (
                              <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-xs">
                                Overdue
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-neutral-400 text-sm mb-3">{task.description}</p>
                          
                          <div className="flex items-center gap-6 text-sm text-neutral-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>
                                Due: {new Date(task.due_date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            
                            {property && (
                              <div className="flex items-center gap-1">
                                <Building className="h-4 w-4" />
                                <span>{property.name}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-1">
                              <span className="capitalize">{task.type}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          {getTaskActions(task)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
