'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { StaffTaskService } from '@/lib/services/staffTaskService'
import { 
  StaffTask, 
  StaffStats, 
  StaffTaskFilters,
  TASK_TYPES,
  TASK_PRIORITIES,
  TASK_STATUSES
} from '@/types/staff'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { 
  Calendar,
  Clock,
  CheckCircle,
  Play,
  AlertCircle,
  User,
  Home,
  MapPin,
  Filter,
  Search,
  RefreshCw,
  Bell,
  Settings,
  BarChart3,
  Loader2,
  Zap,
  Target,
  Timer,
  Users,
  ClipboardList,
  Star,
  TrendingUp,
  Activity
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { format, isToday, isTomorrow, isPast } from 'date-fns'

export default function StaffDashboard() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<StaffTask[]>([])
  const [filteredTasks, setFilteredTasks] = useState<StaffTask[]>([])
  const [stats, setStats] = useState<StaffStats>({
    totalTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    overdueeTasks: 0,
    todayTasks: 0,
    upcomingTasks: 0,
    averageCompletionTime: 0,
    completionRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [processingTaskId, setProcessingTaskId] = useState<string | null>(null)
  
  // Filters
  const [filters, setFilters] = useState<StaffTaskFilters>({
    sortBy: 'deadline',
    sortOrder: 'asc'
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')

  // Load tasks on component mount and when filters change
  useEffect(() => {
    if (user?.id) {
      loadTasks()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, filters])

  // Filter tasks when search or filter criteria change
  useEffect(() => {
    filterTasks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, searchTerm, statusFilter, priorityFilter, dateFilter])

  const loadTasks = async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)
      console.log('📋 Loading tasks for staff:', user.email)
      
      // Use user ID as staff ID (in real app, map user to staff profile)
      const staffId = user.id
      const response = await StaffTaskService.getTasksForStaff(staffId, filters)
      
      if (response.success) {
        setTasks(response.data)
        setStats(response.stats)
        console.log(`✅ Loaded ${response.data.length} tasks`)
      } else {
        console.error('❌ Failed to load tasks:', response.error)
        toast.error('Failed to load tasks')
      }
      
    } catch (error) {
      console.error('❌ Error loading tasks:', error)
      toast.error('Error loading tasks')
    } finally {
      setLoading(false)
    }
  }

  const filterTasks = () => {
    let filtered = [...tasks]
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(task =>
        task.propertyName.toLowerCase().includes(term) ||
        task.guestName.toLowerCase().includes(term) ||
        task.title.toLowerCase().includes(term) ||
        task.description.toLowerCase().includes(term)
      )
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter)
    }
    
    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter)
    }
    
    // Date filter
    if (dateFilter !== 'all') {
      const today = new Date()
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
      
      filtered = filtered.filter(task => {
        const taskDate = new Date(task.scheduledDate)
        
        switch (dateFilter) {
          case 'today':
            return isToday(taskDate)
          case 'tomorrow':
            return isTomorrow(taskDate)
          case 'overdue':
            return isPast(new Date(task.deadline)) && !['completed', 'cancelled'].includes(task.status)
          case 'upcoming':
            return taskDate > tomorrow
          default:
            return true
        }
      })
    }
    
    setFilteredTasks(filtered)
  }

  const handleTaskAction = async (
    taskId: string, 
    action: 'confirmed' | 'in_progress' | 'completed',
    notes?: string
  ) => {
    try {
      setProcessingTaskId(taskId)
      
      const response = await StaffTaskService.updateTaskStatus(taskId, action, notes)
      
      if (response.success) {
        // Update local state
        setTasks(prev => prev.map(task => 
          task.id === taskId 
            ? { ...task, status: action, updatedAt: new Date().toISOString() }
            : task
        ))
        
        const actionLabels = {
          confirmed: 'confirmed',
          in_progress: 'started',
          completed: 'completed'
        }
        
        toast.success(`Task ${actionLabels[action]} successfully!`)
        
        // Reload stats
        loadTasks()
      } else {
        toast.error(response.error || 'Failed to update task')
      }
      
    } catch (error) {
      console.error('❌ Error updating task:', error)
      toast.error('Error updating task')
    } finally {
      setProcessingTaskId(null)
    }
  }

  const getTaskTypeInfo = (type: string) => {
    return TASK_TYPES.find(t => t.value === type) || TASK_TYPES[0]
  }

  const getPriorityInfo = (priority: string) => {
    return TASK_PRIORITIES.find(p => p.value === priority) || TASK_PRIORITIES[0]
  }

  const getStatusInfo = (status: string) => {
    return TASK_STATUSES.find(s => s.value === status) || TASK_STATUSES[0]
  }

  const getTaskStatusBadge = (task: StaffTask) => {
    const statusInfo = getStatusInfo(task.status)
    const priorityInfo = getPriorityInfo(task.priority)
    
    // Check if overdue
    const isOverdue = isPast(new Date(task.deadline)) && !['completed', 'cancelled'].includes(task.status)
    
    if (isOverdue) {
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30 animate-pulse">
          <AlertCircle className="w-3 h-3 mr-1" />
          Overdue
        </Badge>
      )
    }
    
    const statusColors = {
      assigned: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
      confirmed: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      in_progress: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      completed: 'bg-green-500/20 text-green-300 border-green-500/30',
      cancelled: 'bg-red-500/20 text-red-300 border-red-500/30'
    }
    
    return (
      <Badge className={statusColors[task.status as keyof typeof statusColors]}>
        {statusInfo.label}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const priorityInfo = getPriorityInfo(priority)
    
    const priorityColors = {
      low: 'bg-green-500/20 text-green-300 border-green-500/30',
      medium: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      high: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      urgent: 'bg-red-500/20 text-red-300 border-red-500/30 animate-pulse'
    }
    
    return (
      <Badge className={priorityColors[priority as keyof typeof priorityColors]}>
        {priorityInfo.label}
      </Badge>
    )
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    
    if (isToday(date)) {
      return 'Today'
    } else if (isTomorrow(date)) {
      return 'Tomorrow'
    } else {
      return format(date, 'MMM dd, yyyy')
    }
  }

  const formatTime = (dateStr: string) => {
    return format(new Date(dateStr), 'h:mm a')
  }

  // Redirect non-staff users
  if (user && user.role !== 'staff' && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-400">This dashboard is only accessible to staff members.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="relative">
              <Loader2 className="w-12 h-12 animate-spin text-blue-400" />
              <div className="absolute inset-0 w-12 h-12 border-4 border-blue-400/20 rounded-full animate-ping"></div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-white">Loading Your Tasks</h3>
              <p className="text-neutral-400">Fetching your daily assignments...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <div className="relative">
                  <ClipboardList className="h-8 w-8 text-blue-400" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                Staff Dashboard
              </h1>
              <p className="text-gray-400 mt-2">
                Welcome back, {user?.full_name || user?.email} • {format(new Date(), 'EEEE, MMMM dd, yyyy')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={loadTasks}
                disabled={loading}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-neutral-600 text-neutral-400"
              >
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8"
        >
          <Card className="bg-gradient-to-r from-blue-600/20 to-blue-800/20 border-blue-500/30">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-400">{stats.totalTasks}</div>
              <p className="text-sm text-blue-300">Total Tasks</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-yellow-600/20 to-yellow-800/20 border-yellow-500/30">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-400">{stats.pendingTasks}</div>
              <p className="text-sm text-yellow-300">Pending</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-orange-600/20 to-orange-800/20 border-orange-500/30">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-400">{stats.inProgressTasks}</div>
              <p className="text-sm text-orange-300">In Progress</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-600/20 to-green-800/20 border-green-500/30">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-400">{stats.completedTasks}</div>
              <p className="text-sm text-green-300">Completed</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-600/20 to-red-800/20 border-red-500/30">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-400">{stats.overdueeTasks}</div>
              <p className="text-sm text-red-300">Overdue</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-600/20 to-purple-800/20 border-purple-500/30">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-400">{stats.todayTasks}</div>
              <p className="text-sm text-purple-300">Today</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-cyan-600/20 to-cyan-800/20 border-cyan-500/30">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-cyan-400">{stats.upcomingTasks}</div>
              <p className="text-sm text-cyan-300">Upcoming</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-emerald-600/20 to-emerald-800/20 border-emerald-500/30">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-emerald-400">{stats.completionRate.toFixed(0)}%</div>
              <p className="text-sm text-emerald-300">Completion</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filter & Search Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-neutral-800 border-neutral-700 text-white"
                  />
                </div>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    <SelectItem value="all">All Status</SelectItem>
                    {TASK_STATUSES.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Priority Filter */}
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue placeholder="All Priority" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    <SelectItem value="all">All Priority</SelectItem>
                    {TASK_PRIORITIES.map(priority => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Date Filter */}
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue placeholder="All Dates" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="tomorrow">Tomorrow</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select 
                  value={filters.sortBy || 'deadline'} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value as any }))}
                >
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    <SelectItem value="deadline">Sort by Deadline</SelectItem>
                    <SelectItem value="priority">Sort by Priority</SelectItem>
                    <SelectItem value="created">Sort by Created</SelectItem>
                    <SelectItem value="scheduled">Sort by Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tasks List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5" />
                Your Tasks
                <Badge variant="secondary" className="bg-neutral-700 text-neutral-300">
                  {filteredTasks.length} tasks
                </Badge>
                {stats.overdueeTasks > 0 && (
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 animate-pulse">
                    {stats.overdueeTasks} overdue
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredTasks.length === 0 ? (
                <div className="text-center py-16">
                  <div className="relative mb-6">
                    <ClipboardList className="w-24 h-24 text-neutral-600 mx-auto" />
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-300 mb-2">
                    {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || dateFilter !== 'all'
                      ? 'No tasks match your filters'
                      : 'No tasks assigned yet'
                    }
                  </h3>
                  <p className="text-neutral-400 mb-4">
                    {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || dateFilter !== 'all'
                      ? 'Try adjusting your filters to see more tasks'
                      : 'New tasks will appear here when bookings are approved'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {filteredTasks.map((task, index) => {
                      const taskTypeInfo = getTaskTypeInfo(task.taskType)
                      const isOverdue = isPast(new Date(task.deadline)) && !['completed', 'cancelled'].includes(task.status)
                      
                      return (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.05 }}
                          className={`
                            group relative p-6 rounded-xl border transition-all duration-200 hover:shadow-lg
                            ${isOverdue 
                              ? 'bg-red-900/20 border-red-500/50 hover:border-red-500/70' 
                              : 'bg-neutral-800/50 border-neutral-700 hover:border-neutral-600'
                            }
                          `}
                        >
                          {/* Task Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div className={`
                                w-12 h-12 rounded-full flex items-center justify-center text-2xl
                                ${taskTypeInfo.color === 'blue' ? 'bg-blue-500/20' :
                                  taskTypeInfo.color === 'green' ? 'bg-green-500/20' :
                                  taskTypeInfo.color === 'orange' ? 'bg-orange-500/20' :
                                  taskTypeInfo.color === 'purple' ? 'bg-purple-500/20' :
                                  taskTypeInfo.color === 'yellow' ? 'bg-yellow-500/20' :
                                  'bg-gray-500/20'
                                }
                              `}>
                                {taskTypeInfo.icon}
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-white">{task.title}</h3>
                                <p className="text-neutral-400 text-sm">{taskTypeInfo.label}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {getPriorityBadge(task.priority)}
                              {getTaskStatusBadge(task)}
                            </div>
                          </div>

                          {/* Task Details Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-lg">
                              <Home className="w-5 h-5 text-blue-400" />
                              <div>
                                <p className="text-sm text-neutral-400">Property</p>
                                <p className="text-white font-medium">{task.propertyName}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-lg">
                              <User className="w-5 h-5 text-green-400" />
                              <div>
                                <p className="text-sm text-neutral-400">Guest</p>
                                <p className="text-white font-medium">{task.guestName}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-lg">
                              <Calendar className="w-5 h-5 text-purple-400" />
                              <div>
                                <p className="text-sm text-neutral-400">Scheduled</p>
                                <p className="text-white font-medium">{formatDate(task.scheduledDate)}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-lg">
                              <Clock className="w-5 h-5 text-orange-400" />
                              <div>
                                <p className="text-sm text-neutral-400">Deadline</p>
                                <p className={`font-medium ${isOverdue ? 'text-red-400' : 'text-white'}`}>
                                  {formatTime(task.deadline)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Task Description */}
                          <div className="mb-4 p-4 bg-neutral-800/30 rounded-lg">
                            <p className="text-neutral-300 text-sm leading-relaxed">{task.description}</p>
                            {task.specialInstructions && (
                              <div className="mt-3 pt-3 border-t border-neutral-700">
                                <p className="text-sm font-medium text-blue-300 mb-1">Special Instructions:</p>
                                <p className="text-neutral-400 text-sm">{task.specialInstructions}</p>
                              </div>
                            )}
                          </div>

                          {/* Task Metadata */}
                          <div className="flex items-center justify-between text-xs text-neutral-500 mb-4">
                            <div className="flex items-center gap-4">
                              <span>Duration: {task.estimatedDuration} min</span>
                              <span>Check-in: {formatDate(task.checkInDate)}</span>
                              {task.guests && <span>Guests: {task.guests}</span>}
                            </div>
                            <div className="flex items-center gap-2">
                              {task.autoCreated && (
                                <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                                  <Zap className="w-3 h-3 mr-1" />
                                  Auto-created
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col sm:flex-row gap-3">
                            {task.status === 'assigned' && (
                              <>
                                <Button
                                  onClick={() => handleTaskAction(task.id, 'confirmed')}
                                  disabled={processingTaskId === task.id}
                                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                                >
                                  {processingTaskId === task.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                  ) : (
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                  )}
                                  Confirm Job
                                </Button>
                              </>
                            )}
                            
                            {task.status === 'confirmed' && (
                              <Button
                                onClick={() => handleTaskAction(task.id, 'in_progress')}
                                disabled={processingTaskId === task.id}
                                className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                              >
                                {processingTaskId === task.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                  <Play className="w-4 h-4 mr-2" />
                                )}
                                Start Job
                              </Button>
                            )}
                            
                            {task.status === 'in_progress' && (
                              <Button
                                onClick={() => handleTaskAction(task.id, 'completed', 'Task completed successfully')}
                                disabled={processingTaskId === task.id}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                                {processingTaskId === task.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                )}
                                Mark Complete
                              </Button>
                            )}
                            
                            {task.status === 'completed' && (
                              <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                                <CheckCircle className="w-5 h-5 text-green-400" />
                                <span className="text-green-400 font-medium">Task Completed</span>
                                {task.completedAt && (
                                  <span className="text-green-300 text-sm">
                                    on {formatDate(task.completedAt)}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
