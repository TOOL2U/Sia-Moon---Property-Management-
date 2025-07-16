'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { toast } from 'sonner'
import {
  Briefcase,
  Clock,
  User,
  MapPin,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Play,
  Pause,
  RotateCcw,
  Search,
  Filter,
  Calendar,
  Users,
  TrendingUp,
  BarChart3,
  Loader2,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  Star,
  Target,
  Zap,
  Home
} from 'lucide-react'
import JobAssignmentService, { JobData, JobStatus, JobType, JobPriority } from '@/services/JobAssignmentService'
import TestJobService from '@/services/TestJobService'

interface JobManagementDashboardProps {
  className?: string
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 }
  }
}

const cardHoverVariants = {
  hover: {
    y: -4,
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: "easeOut"
    }
  }
}

export function JobManagementDashboard({ className }: JobManagementDashboardProps) {
  // State management
  const [jobs, setJobs] = useState<JobData[]>([])
  const [filteredJobs, setFilteredJobs] = useState<JobData[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [sendingTestJob, setSendingTestJob] = useState(false)

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<JobType | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<JobPriority | 'all'>('all')
  const [staffFilter, setStaffFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')

  // Real-time subscription
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null)

  // Load jobs with real-time updates
  const loadJobs = useCallback(() => {
    console.log('📋 Setting up real-time job subscription...')

    const unsubscribeFn = JobAssignmentService.subscribeToJobs((updatedJobs) => {
      console.log(`✅ Received ${updatedJobs.length} jobs via real-time subscription`)
      setJobs(updatedJobs)
      setLoading(false)
    })

    setUnsubscribe(() => unsubscribeFn)

    return unsubscribeFn
  }, [])

  // Filter jobs based on current filters
  useEffect(() => {
    let filtered = [...jobs]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.assignedStaffRef?.name && job.assignedStaffRef.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (job.propertyRef?.name && job.propertyRef.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (job.bookingRef?.guestName && job.bookingRef.guestName.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter)
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(job => job.jobType === typeFilter)
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(job => job.priority === priorityFilter)
    }

    // Staff filter
    if (staffFilter !== 'all') {
      filtered = filtered.filter(job => job.assignedStaffId === staffFilter)
    }

    // Date filter
    if (dateFilter !== 'all') {
      const today = new Date().toISOString().split('T')[0]
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(job => job.scheduledDate === today)
          break
        case 'tomorrow':
          filtered = filtered.filter(job => job.scheduledDate === tomorrow)
          break
        case 'week':
          const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          filtered = filtered.filter(job => job.scheduledDate >= today && job.scheduledDate <= weekFromNow)
          break
      }
    }

    setFilteredJobs(filtered)
  }, [jobs, searchTerm, statusFilter, typeFilter, priorityFilter, staffFilter, dateFilter])

  // Update job status
  const updateJobStatus = async (jobId: string, newStatus: JobStatus, notes?: string) => {
    try {
      setUpdating(jobId)
      console.log(`🔄 Updating job ${jobId} status to: ${newStatus}`)

      const result = await JobAssignmentService.updateJobStatus(
        jobId,
        newStatus,
        'admin_current', // TODO: Get from auth context
        notes
      )

      if (result.success) {
        toast.success(`Job status updated to ${newStatus}`)
        console.log(`✅ Job ${jobId} status updated successfully`)
      } else {
        toast.error(result.error || 'Failed to update job status')
      }
    } catch (error) {
      console.error('❌ Error updating job status:', error)
      toast.error('Failed to update job status')
    } finally {
      setUpdating(null)
    }
  }

  // Get status color
  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'assigned':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'accepted':
        return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
      case 'in_progress':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'verified':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  // Get priority color
  const getPriorityColor = (priority: JobPriority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'high':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'low':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  // Get job type icon
  const getJobTypeIcon = (jobType: JobType) => {
    switch (jobType) {
      case 'cleaning':
        return <Briefcase className="w-4 h-4" />
      case 'maintenance':
        return <Target className="w-4 h-4" />
      case 'inspection':
        return <Eye className="w-4 h-4" />
      case 'setup':
        return <Home className="w-4 h-4" />
      case 'checkout':
        return <CheckCircle className="w-4 h-4" />
      case 'emergency':
        return <Zap className="w-4 h-4" />
      default:
        return <Briefcase className="w-4 h-4" />
    }
  }

  // Calculate statistics
  const stats = {
    total: jobs.length,
    pending: jobs.filter(j => j.status === 'pending').length,
    assigned: jobs.filter(j => j.status === 'assigned').length,
    inProgress: jobs.filter(j => j.status === 'in_progress').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    urgent: jobs.filter(j => j.priority === 'urgent').length,
    todayJobs: jobs.filter(j => {
      const today = new Date().toISOString().split('T')[0]
      return j.scheduledDate === today
    }).length
  }

  // Get unique staff for filter
  const uniqueStaff = Array.from(new Set(jobs
    .filter(job => job.assignedStaffRef && job.assignedStaffRef.name)
    .map(job => ({
      id: job.assignedStaffId,
      name: job.assignedStaffRef.name
    }))))

  // Setup real-time subscription on mount
  useEffect(() => {
    const unsubscribeFn = loadJobs()
    
    return () => {
      if (unsubscribeFn) {
        unsubscribeFn()
      }
    }
  }, [loadJobs])

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [unsubscribe])

  // Send test job to mobile app
  const sendTestJobToMobile = async () => {
    try {
      setSendingTestJob(true)
      console.log('🧪 Sending test job to mobile app...')

      const result = await TestJobService.createTestJob()

      if (result.success) {
        toast.success('✅ Test job assigned to staff', {
          description: `Job ID: ${result.jobId} sent to mobile app`
        })
        console.log('✅ Test job sent successfully:', result.jobId)
      } else {
        toast.error('❌ Failed to send test job', {
          description: result.error || 'Unknown error occurred'
        })
        console.error('❌ Test job failed:', result.error)
      }

    } catch (error) {
      console.error('❌ Error sending test job:', error)
      toast.error('❌ Failed to send test job', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setSendingTestJob(false)
    }
  }

  // Send multiple test jobs
  const sendTestJobSuite = async () => {
    try {
      setSendingTestJob(true)
      console.log('🧪 Sending test job suite to mobile app...')

      const result = await TestJobService.createTestJobSuite()

      if (result.success) {
        toast.success(`✅ Test job suite created`, {
          description: `${result.jobs.length} test jobs sent to mobile app`
        })
        console.log('✅ Test job suite sent successfully:', result.jobs)
      } else {
        toast.error('❌ Failed to send test job suite', {
          description: `${result.errors.length} errors occurred`
        })
        console.error('❌ Test job suite failed:', result.errors)
      }

    } catch (error) {
      console.error('❌ Error sending test job suite:', error)
      toast.error('❌ Failed to send test job suite', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setSendingTestJob(false)
    }
  }

  return (
    <motion.div 
      className={`space-y-8 ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div 
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900/20 via-purple-900/20 to-pink-900/20 border border-indigo-500/20 p-8"
        variants={itemVariants}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 to-purple-600/5 backdrop-blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
                  Job Management Dashboard
                </h1>
                <p className="text-gray-400 mt-1 text-lg">
                  Real-time job tracking and staff assignment management
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Test Job Buttons */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={sendTestJobToMobile}
                  disabled={sendingTestJob}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-green-500/25 transition-all duration-300"
                >
                  {sendingTestJob ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4 mr-2" />
                  )}
                  Send Test Job
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={sendTestJobSuite}
                  disabled={sendingTestJob}
                  variant="outline"
                  className="border-green-500/50 text-green-300 hover:bg-green-500/10 transition-all duration-300"
                >
                  {sendingTestJob ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Target className="w-4 h-4 mr-2" />
                  )}
                  Test Suite
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-500/25 transition-all duration-300"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Statistics Dashboard */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6"
        variants={itemVariants}
      >
        <motion.div whileHover={cardHoverVariants.hover} className="group">
          <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 shadow-lg shadow-blue-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-blue-400 opacity-60" />
              </div>
              <div className="text-3xl font-bold text-blue-400 mb-1">{stats.total}</div>
              <p className="text-sm text-blue-300 font-medium">Total Jobs</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={cardHoverVariants.hover} className="group">
          <Card className="bg-gradient-to-br from-yellow-900/20 to-orange-800/20 border-yellow-500/30 hover:border-yellow-400/50 transition-all duration-300 shadow-lg shadow-yellow-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <AlertTriangle className="w-5 h-5 text-yellow-400 opacity-60" />
              </div>
              <div className="text-3xl font-bold text-yellow-400 mb-1">{stats.pending}</div>
              <p className="text-sm text-yellow-300 font-medium">Pending</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={cardHoverVariants.hover} className="group">
          <Card className="bg-gradient-to-br from-indigo-900/20 to-purple-800/20 border-indigo-500/30 hover:border-indigo-400/50 transition-all duration-300 shadow-lg shadow-indigo-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <User className="w-6 h-6 text-white" />
                </div>
                <Users className="w-5 h-5 text-indigo-400 opacity-60" />
              </div>
              <div className="text-3xl font-bold text-indigo-400 mb-1">{stats.assigned}</div>
              <p className="text-sm text-indigo-300 font-medium">Assigned</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={cardHoverVariants.hover} className="group">
          <Card className="bg-gradient-to-br from-purple-900/20 to-pink-800/20 border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 shadow-lg shadow-purple-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Play className="w-6 h-6 text-white" />
                </div>
                <BarChart3 className="w-5 h-5 text-purple-400 opacity-60" />
              </div>
              <div className="text-3xl font-bold text-purple-400 mb-1">{stats.inProgress}</div>
              <p className="text-sm text-purple-300 font-medium">In Progress</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={cardHoverVariants.hover} className="group">
          <Card className="bg-gradient-to-br from-green-900/20 to-emerald-800/20 border-green-500/30 hover:border-green-400/50 transition-all duration-300 shadow-lg shadow-green-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-400 opacity-60" />
              </div>
              <div className="text-3xl font-bold text-green-400 mb-1">{stats.completed}</div>
              <p className="text-sm text-green-300 font-medium">Completed</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={cardHoverVariants.hover} className="group">
          <Card className="bg-gradient-to-br from-red-900/20 to-rose-800/20 border-red-500/30 hover:border-red-400/50 transition-all duration-300 shadow-lg shadow-red-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-rose-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <AlertTriangle className="w-5 h-5 text-red-400 opacity-60" />
              </div>
              <div className="text-3xl font-bold text-red-400 mb-1">{stats.urgent}</div>
              <p className="text-sm text-red-300 font-medium">Urgent</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={cardHoverVariants.hover} className="group">
          <Card className="bg-gradient-to-br from-cyan-900/20 to-teal-800/20 border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300 shadow-lg shadow-cyan-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <Clock className="w-5 h-5 text-cyan-400 opacity-60" />
              </div>
              <div className="text-3xl font-bold text-cyan-400 mb-1">{stats.todayJobs}</div>
              <p className="text-sm text-cyan-300 font-medium">Today</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-r from-gray-900/50 to-slate-900/50 border-gray-700/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 flex-1 min-w-64">
                <Search className="w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search jobs, staff, properties, guests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 focus:border-indigo-500/50 transition-colors"
                />
              </div>

              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-48 bg-gray-800/50 border-gray-600/50 text-white">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                <SelectTrigger className="w-48 bg-gray-800/50 border-gray-600/50 text-white">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="setup">Setup</SelectItem>
                  <SelectItem value="checkout">Checkout</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={(value: any) => setPriorityFilter(value)}>
                <SelectTrigger className="w-48 bg-gray-800/50 border-gray-600/50 text-white">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-48 bg-gray-800/50 border-gray-600/50 text-white">
                  <SelectValue placeholder="Filter by date" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="tomorrow">Tomorrow</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                </SelectContent>
              </Select>

              {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || priorityFilter !== 'all' || dateFilter !== 'all') && (
                <Button
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('all')
                    setTypeFilter('all')
                    setPriorityFilter('all')
                    setStaffFilter('all')
                    setDateFilter('all')
                  }}
                  variant="outline"
                  size="sm"
                  className="border-gray-600/50 text-gray-300 hover:bg-gray-700/50"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Jobs List */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-r from-gray-900/30 to-slate-900/30 border-gray-700/30 backdrop-blur-sm">
          <CardHeader className="border-b border-gray-700/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-white" />
                </div>
                Job Assignments ({filteredJobs.length})
                <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/30">
                  Real-time
                </Badge>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">Loading Jobs</h3>
                  <p className="text-gray-400">Setting up real-time job monitoring...</p>
                </div>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-r from-gray-600/20 to-slate-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Briefcase className="h-10 w-10 text-gray-500" />
                </div>
                <h3 className="text-xl font-medium text-gray-400 mb-3">No jobs found</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || priorityFilter !== 'all' || dateFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'No jobs have been assigned yet'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {filteredJobs.map((job, index) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      whileHover={cardHoverVariants.hover}
                      className="group"
                    >
                      <Card className="bg-gradient-to-br from-gray-900/50 to-slate-900/50 border-gray-700/50 hover:border-gray-600/70 transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-4 flex-1">
                              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-110 transition-transform duration-300">
                                {getJobTypeIcon(job.jobType)}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-lg font-semibold text-white truncate">
                                    {job.title}
                                  </h3>
                                  <Badge className={getStatusColor(job.status)}>
                                    {job.status ? job.status.replace('_', ' ').toUpperCase() : 'UNKNOWN'}
                                  </Badge>
                                  <Badge className={getPriorityColor(job.priority)}>
                                    {job.priority ? job.priority.toUpperCase() : 'UNKNOWN'}
                                  </Badge>
                                </div>

                                <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                                  {job.description}
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                  <div className="flex items-center gap-2 text-gray-300">
                                    <User className="w-4 h-4 text-indigo-400" />
                                    <span className="truncate">{job.assignedStaffRef?.name || 'Unassigned'}</span>
                                  </div>

                                  <div className="flex items-center gap-2 text-gray-300">
                                    <Home className="w-4 h-4 text-purple-400" />
                                    <span className="truncate">{job.propertyRef?.name || 'Unknown Property'}</span>
                                  </div>

                                  <div className="flex items-center gap-2 text-gray-300">
                                    <Calendar className="w-4 h-4 text-cyan-400" />
                                    <span>
                                      {job.scheduledDate ? (
                                        typeof job.scheduledDate === 'object' && 'toDate' in job.scheduledDate
                                          ? job.scheduledDate.toDate().toLocaleDateString()
                                          : typeof job.scheduledDate === 'string'
                                          ? job.scheduledDate
                                          : new Date(job.scheduledDate).toLocaleDateString()
                                      ) : 'Not scheduled'} {job.scheduledStartTime && `at ${job.scheduledStartTime}`}
                                    </span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-sm">
                                  <div className="flex items-center gap-2 text-gray-400">
                                    <User className="w-4 h-4" />
                                    <span>Guest: {job.bookingRef?.guestName || 'Unknown Guest'}</span>
                                  </div>

                                  <div className="flex items-center gap-2 text-gray-400">
                                    <Clock className="w-4 h-4" />
                                    <span>Duration: {job.estimatedDuration} min</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 ml-4">
                              {job.status === 'pending' && (
                                <Button
                                  onClick={() => updateJobStatus(job.id!, 'assigned')}
                                  disabled={updating === job.id}
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  {updating === job.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Play className="w-3 h-3" />
                                  )}
                                </Button>
                              )}

                              {job.status === 'assigned' && (
                                <Button
                                  onClick={() => updateJobStatus(job.id!, 'in_progress')}
                                  disabled={updating === job.id}
                                  size="sm"
                                  className="bg-purple-600 hover:bg-purple-700"
                                >
                                  {updating === job.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Play className="w-3 h-3" />
                                  )}
                                </Button>
                              )}

                              {job.status === 'completed' && (
                                <Button
                                  onClick={() => updateJobStatus(job.id!, 'verified', 'Verified by admin')}
                                  disabled={updating === job.id}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  {updating === job.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <CheckCircle className="w-3 h-3" />
                                  )}
                                </Button>
                              )}

                              <Button
                                onClick={() => updateJobStatus(job.id!, 'cancelled', 'Cancelled by admin')}
                                disabled={updating === job.id}
                                size="sm"
                                variant="outline"
                                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                              >
                                {updating === job.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <XCircle className="w-3 h-3" />
                                )}
                              </Button>
                            </div>
                          </div>

                          {/* Special Instructions */}
                          {job.specialInstructions && (
                            <div className="mt-4 p-3 bg-gradient-to-r from-yellow-900/20 to-orange-900/20 rounded-lg border border-yellow-500/20">
                              <div className="flex items-center gap-2 mb-1">
                                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                                <span className="text-sm font-medium text-yellow-300">Special Instructions</span>
                              </div>
                              <p className="text-yellow-200 text-sm">{job.specialInstructions}</p>
                            </div>
                          )}

                          {/* Job Progress */}
                          <div className="mt-4 pt-4 border-t border-gray-700/30">
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>Created: {job.createdAt ? (
                                typeof job.createdAt === 'object' && 'toDate' in job.createdAt
                                  ? job.createdAt.toDate().toLocaleDateString()
                                  : new Date(job.createdAt as string).toLocaleDateString()
                              ) : 'Unknown'}</span>
                              <span>Job ID: {job.id}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
