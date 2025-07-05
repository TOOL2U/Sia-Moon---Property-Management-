'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/SupabaseAuthContext'
import SupabaseService from '@/lib/supabaseService'
import { useTaskNotifications } from '@/hooks/useTaskNotifications'
import { Task, User, Property } from '@/types/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import {
  Plus,
  Users,
  ClipboardList,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Send,
  Loader2,
  Building,
  User as UserIcon,
  RefreshCw,
  FileText
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface TaskFormData {
  title: string
  description: string
  type: 'cleaning' | 'maintenance' | 'inspection' | 'other'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to: string
  property_id: string
  due_date: string
}

export default function AdminDashboardPage() {
  const { profile: user } = useAuth()
  const router = useRouter()
  const { sendTaskAssignmentNotification, isLoading: notificationLoading } = useTaskNotifications()
  
  const [tasks, setTasks] = useState<Task[]>([])
  const [staffMembers, setStaffMembers] = useState<User[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    type: 'cleaning',
    priority: 'medium',
    assigned_to: '',
    property_id: '',
    due_date: ''
  })

  useEffect(() => {
    // Check if user is admin/staff with admin privileges
    if (user && user.role !== 'staff') {
      toast.error('Access denied. Admin access required.')
      router.push('/dashboard/client')
      return
    }
    
    if (user) {
      loadDashboardData()
    }
  }, [user, router])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load all data in parallel
      const [tasksResult, usersResult, propertiesResult] = await Promise.all([
        DatabaseService.getAllTasks(),
        DatabaseService.getAllUsers(),
        DatabaseService.getAllProperties()
      ])

      if (tasksResult.error) {
        console.error('Error loading tasks:', tasksResult.error)
        toast.error('Failed to load tasks')
      } else {
        setTasks(tasksResult.data || [])
      }

      if (usersResult.error) {
        console.error('Error loading users:', usersResult.error)
        toast.error('Failed to load staff members')
      } else {
        // Filter for staff members only
        const staff = (usersResult.data || []).filter(u => u.role === 'staff')
        setStaffMembers(staff)
      }

      if (propertiesResult.error) {
        console.error('Error loading properties:', propertiesResult.error)
        toast.error('Failed to load properties')
      } else {
        setProperties(propertiesResult.data || [])
      }
      
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.assigned_to || !formData.due_date) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setFormLoading(true)
      
      // Create the task
      const { data: newTask, error } = await DatabaseService.createTask({
        ...formData,
        status: 'pending',
        created_by: user!.id
      })

      if (error || !newTask) {
        throw new Error(error?.message || 'Failed to create task')
      }

      // Find assignee and property details for notification
      const assignee = staffMembers.find(s => s.id === formData.assigned_to)
      const property = properties.find(p => p.id === formData.property_id)

      if (assignee) {
        try {
          // Send email notification
          await sendTaskAssignmentNotification({
            task: newTask,
            assignee,
            property: property ? {
              id: property.id,
              name: property.name,
              location: property.location
            } : undefined
          })
          
          toast.success('Task created and notification sent successfully!')
        } catch (notificationError) {
          // Task was created but notification failed
          console.warn('Task created but notification failed:', notificationError)
          toast.success('Task created successfully, but notification email failed to send.')
        }
      } else {
        toast.success('Task created successfully!')
      }

      // Reset form and reload data
      setFormData({
        title: '',
        description: '',
        type: 'cleaning',
        priority: 'medium',
        assigned_to: '',
        property_id: '',
        due_date: ''
      })
      setShowCreateForm(false)
      await loadDashboardData()
      
    } catch (error) {
      console.error('Error creating task:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create task')
    } finally {
      setFormLoading(false)
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

    return (
      <Badge className={`${variants[priority]} text-xs`}>
        {priority}
      </Badge>
    )
  }

  if (!user || user.role !== 'staff') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-neutral-400">Admin access required to view this page.</p>
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
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-neutral-400">Manage tasks and staff assignments</p>
            </div>
            
            <div className="flex gap-3">
              <Link href="/dashboard/admin/booking-sync">
                <Button variant="outline" className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Booking Sync
                </Button>
              </Link>

              <Link href="/dashboard/admin/reports">
                <Button variant="outline" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Reports
                </Button>
              </Link>

              <Button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Task
              </Button>
            </div>
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
                  <p className="text-sm text-neutral-400">Staff Members</p>
                  <p className="text-2xl font-bold">{staffMembers.length}</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create Task Form */}
        {showCreateForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create New Task</CardTitle>
              <CardDescription>
                Assign a new task to a staff member
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTask} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Title */}
                  <div>
                    <Input
                      label="Task Title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Enter task title"
                      required
                      disabled={formLoading}
                    />
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Task Type
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      disabled={formLoading}
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                      required
                    >
                      <option value="cleaning">Cleaning</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="inspection">Inspection</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Priority
                    </label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      disabled={formLoading}
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                      required
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  {/* Assigned To */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Assign To
                    </label>
                    <select
                      name="assigned_to"
                      value={formData.assigned_to}
                      onChange={handleInputChange}
                      disabled={formLoading}
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                      required
                    >
                      <option value="">Select staff member</option>
                      {staffMembers.map(staff => (
                        <option key={staff.id} value={staff.id}>
                          {staff.name} ({staff.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Property */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Property (Optional)
                    </label>
                    <select
                      name="property_id"
                      value={formData.property_id}
                      onChange={handleInputChange}
                      disabled={formLoading}
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    >
                      <option value="">No property specified</option>
                      {properties.map(property => (
                        <option key={property.id} value={property.id}>
                          {property.name} - {property.location}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Due Date */}
                  <div>
                    <Input
                      label="Due Date"
                      name="due_date"
                      type="datetime-local"
                      value={formData.due_date}
                      onChange={handleInputChange}
                      required
                      disabled={formLoading}
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter task description..."
                    rows={4}
                    disabled={formLoading}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    required
                  />
                </div>

                {/* Form Actions */}
                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={formLoading || notificationLoading}
                    className="flex items-center gap-2"
                  >
                    {formLoading || notificationLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating Task...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Create & Notify
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    disabled={formLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Tasks List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
            <CardDescription>
              All tasks in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-neutral-400">Loading tasks...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardList className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Tasks Yet</h3>
                <p className="text-neutral-400 mb-6">
                  Create your first task to get started.
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Task
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.slice(0, 10).map((task) => {
                  const assignee = staffMembers.find(s => s.id === task.assigned_to)
                  const property = properties.find(p => p.id === task.property_id)
                  
                  return (
                    <div key={task.id} className="border border-neutral-800 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-white">{task.title}</h3>
                            {getStatusBadge(task.status)}
                            {getPriorityBadge(task.priority)}
                          </div>
                          
                          <p className="text-neutral-400 text-sm mb-3">{task.description}</p>
                          
                          <div className="flex items-center gap-6 text-sm text-neutral-500">
                            {assignee && (
                              <div className="flex items-center gap-1">
                                <UserIcon className="h-4 w-4" />
                                <span>{assignee.name}</span>
                              </div>
                            )}
                            
                            {property && (
                              <div className="flex items-center gap-1">
                                <Building className="h-4 w-4" />
                                <span>{property.name}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                
                {tasks.length > 10 && (
                  <div className="text-center pt-4">
                    <p className="text-neutral-400 text-sm">
                      Showing 10 of {tasks.length} tasks
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
