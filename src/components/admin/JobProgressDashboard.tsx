'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import toast from 'react-hot-toast'
import {
  Activity,
  Clock,
  Users,
  CheckCircle,
  AlertTriangle,
  Camera,
  MapPin,
  Calendar,
  Timer,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Filter,
  Search,
  Eye,
  Play,
  Pause,
  Square,
  Star,
  Zap,
  Briefcase,
  Image,
  Phone,
  Mail,
  ExternalLink,
  Download,
  FileText,
  MessageSquare,
  Navigation,
  Target,
  Award,
  Loader2
} from 'lucide-react'
import JobAssignmentService, { JobData, JobStatus } from '@/services/JobAssignmentService'
import { JobStatusTracker } from './JobStatusTracker'
import TestJobService from '@/services/TestJobService'
import { toDate, formatDuration, getDifferenceInMinutes, isToday } from '@/utils/dateUtils'

interface JobProgressDashboardProps {
  className?: string
}

interface DashboardStats {
  totalJobs: number
  activeJobs: number
  completedToday: number
  averageCompletionTime: number
  staffUtilization: number
  photoComplianceRate: number
  onTimeCompletionRate: number
  urgentJobs: number
}

interface StaffPerformance {
  staffId: string
  name: string
  avatar?: string
  activeJobs: number
  completedToday: number
  averageRating: number
  onTimeRate: number
  photoComplianceRate: number
  currentLocation?: {
    latitude: number
    longitude: number
    lastUpdated: string
  }
  status: 'available' | 'busy' | 'offline'
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

export function JobProgressDashboard({ className }: JobProgressDashboardProps) {
  // State management
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    activeJobs: 0,
    completedToday: 0,
    averageCompletionTime: 0,
    staffUtilization: 0,
    photoComplianceRate: 0,
    onTimeCompletionRate: 0,
    urgentJobs: 0
  })
  
  const [staffPerformance, setStaffPerformance] = useState<StaffPerformance[]>([])
  const [recentJobs, setRecentJobs] = useState<JobData[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedTimeRange, setSelectedTimeRange] = useState<'today' | 'week' | 'month'>('today')
  const [sendingTestJob, setSendingTestJob] = useState(false)

  // Real-time subscription
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null)

  // Load dashboard data with real-time updates
  const loadDashboardData = useCallback(() => {
    console.log('📊 Setting up real-time job progress dashboard...')

    const unsubscribeFn = JobAssignmentService.subscribeToJobs((updatedJobs) => {
      console.log(`✅ Received ${updatedJobs.length} jobs for dashboard`)
      
      // Calculate dashboard statistics
      const dashboardStats = calculateDashboardStats(updatedJobs)
      setStats(dashboardStats)

      // Calculate staff performance
      const staffPerf = calculateStaffPerformance(updatedJobs)
      setStaffPerformance(staffPerf)

      // Set recent jobs (last 10)
      const sortedJobs = updatedJobs
        .sort((a, b) => toDate(b.updatedAt).getTime() - toDate(a.updatedAt).getTime())
        .slice(0, 10)
      setRecentJobs(sortedJobs)

      setLoading(false)
    })

    setUnsubscribe(() => unsubscribeFn)
    return unsubscribeFn
  }, [selectedTimeRange])

  // Calculate dashboard statistics
  const calculateDashboardStats = (jobs: JobData[]): DashboardStats => {
    const today = new Date().toISOString().split('T')[0]
    const now = new Date()
    
    const totalJobs = jobs.length
    const activeJobs = jobs.filter(j => ['assigned', 'accepted', 'in_progress'].includes(j.status)).length
    const completedToday = jobs.filter(j =>
      j.status === 'completed' &&
      j.completedAt &&
      toDate(j.completedAt).toISOString().split('T')[0] === today
    ).length
    
    const completedJobs = jobs.filter(j => j.status === 'completed' && j.completedAt)
    const averageCompletionTime = completedJobs.length > 0
      ? completedJobs.reduce((acc, job) => {
          const created = toDate(job.createdAt)
          const completed = toDate(job.completedAt)
          return acc + (completed.getTime() - created.getTime()) / (1000 * 60) // minutes
        }, 0) / completedJobs.length
      : 0

    const staffIds = Array.from(new Set(jobs.map(j => j.assignedStaffId)))
    const activeStaff = staffIds.filter(staffId => 
      jobs.some(j => j.assignedStaffId === staffId && ['assigned', 'accepted', 'in_progress'].includes(j.status))
    )
    const staffUtilization = staffIds.length > 0 ? (activeStaff.length / staffIds.length) * 100 : 0

    const jobsWithPhotos = jobs.filter(j => j.completionPhotos && j.completionPhotos.length > 0)
    const photoRequiredJobs = jobs.filter(j => ['cleaning', 'maintenance'].includes(j.jobType))
    const photoComplianceRate = photoRequiredJobs.length > 0 
      ? (jobsWithPhotos.length / photoRequiredJobs.length) * 100 
      : 100

    const onTimeJobs = completedJobs.filter(job => {
      if (!job.deadline) return true
      const deadline = toDate(job.deadline)
      const completed = toDate(job.completedAt)
      return completed <= deadline
    })
    const onTimeCompletionRate = completedJobs.length > 0 
      ? (onTimeJobs.length / completedJobs.length) * 100 
      : 100

    const urgentJobs = jobs.filter(j => j.priority === 'urgent' && j.status !== 'completed').length

    return {
      totalJobs,
      activeJobs,
      completedToday,
      averageCompletionTime,
      staffUtilization,
      photoComplianceRate,
      onTimeCompletionRate,
      urgentJobs
    }
  }

  // Calculate staff performance metrics
  const calculateStaffPerformance = (jobs: JobData[]): StaffPerformance[] => {
    const staffMap = new Map<string, StaffPerformance>()
    const today = new Date().toISOString().split('T')[0]

    jobs.forEach(job => {
      const staffId = job.assignedStaffId
      if (!staffId) return

      if (!staffMap.has(staffId)) {
        staffMap.set(staffId, {
          staffId,
          name: job.assignedStaffRef?.name || job.assignedStaffName || 'Unknown Staff',
          avatar: job.assignedStaffRef?.avatar || job.assignedStaffAvatar,
          activeJobs: 0,
          completedToday: 0,
          averageRating: job.assignedStaffRef?.rating || 4.5,
          onTimeRate: 0,
          photoComplianceRate: 0,
          status: 'available'
        })
      }

      const staff = staffMap.get(staffId)!

      // Count active jobs
      if (['assigned', 'accepted', 'in_progress'].includes(job.status)) {
        staff.activeJobs++
        staff.status = 'busy'
      }

      // Count completed today
      if (job.status === 'completed' && job.completedAt) {
        const completedDate = toDate(job.completedAt).toISOString().split('T')[0]
        if (completedDate === today) {
          staff.completedToday++
        }
      }
    })

    return Array.from(staffMap.values()).sort((a, b) => b.activeJobs - a.activeJobs)
  }

  // Use centralized formatDuration from dateUtils

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'busy':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'offline':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    }
  }

  // Refresh dashboard
  const refreshDashboard = async () => {
    setRefreshing(true)
    try {
      if (unsubscribe) {
        unsubscribe()
      }
      loadDashboardData()
      toast.success('Dashboard refreshed')
    } catch (error) {
      console.error('❌ Error refreshing dashboard:', error)
      toast.error('Failed to refresh dashboard')
    } finally {
      setTimeout(() => setRefreshing(false), 1000)
    }
  }

  // Send test job to mobile app
  const sendTestJobToMobile = async () => {
    try {
      setSendingTestJob(true)
      console.log('🧪 Sending test job to mobile app...')

      const result = await TestJobService.createTestJob()

      if (result.success) {
        toast.success(`✅ Test job assigned to staff\nJob ID: ${result.jobId} sent to mobile app`)
        console.log('✅ Test job sent successfully:', result.jobId)
      } else {
        toast.error(`❌ Failed to send test job\n${result.error || 'Unknown error occurred'}`)
        console.error('❌ Test job failed:', result.error)
      }

    } catch (error) {
      console.error('❌ Error sending test job:', error)
      toast.error(`❌ Failed to send test job\n${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSendingTestJob(false)
    }
  }

  // Setup real-time subscription on mount
  useEffect(() => {
    const unsubscribeFn = loadDashboardData()
    
    return () => {
      if (unsubscribeFn) {
        unsubscribeFn()
      }
    }
  }, [loadDashboardData])

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [unsubscribe])

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
                <Activity className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
                  Job Progress Dashboard
                </h1>
                <p className="text-gray-400 mt-1 text-lg">
                  Real-time monitoring of all job progress across staff members
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                Live Updates
              </Badge>

              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value as any)}
                className="bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>

              <Button
                onClick={sendTestJobToMobile}
                disabled={sendingTestJob}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-green-500/25"
              >
                {sendingTestJob ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                Test Job
              </Button>

              <Button
                onClick={refreshDashboard}
                variant="outline"
                disabled={refreshing}
                className="border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/10"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Statistics Dashboard */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-6"
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
              <div className="text-3xl font-bold text-blue-400 mb-1">{stats.totalJobs}</div>
              <p className="text-sm text-blue-300 font-medium">Total Jobs</p>
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
                <Activity className="w-5 h-5 text-purple-400 opacity-60" />
              </div>
              <div className="text-3xl font-bold text-purple-400 mb-1">{stats.activeJobs}</div>
              <p className="text-sm text-purple-300 font-medium">Active Jobs</p>
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
                <Calendar className="w-5 h-5 text-green-400 opacity-60" />
              </div>
              <div className="text-3xl font-bold text-green-400 mb-1">{stats.completedToday}</div>
              <p className="text-sm text-green-300 font-medium">Completed Today</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={cardHoverVariants.hover} className="group">
          <Card className="bg-gradient-to-br from-yellow-900/20 to-orange-800/20 border-yellow-500/30 hover:border-yellow-400/50 transition-all duration-300 shadow-lg shadow-yellow-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Timer className="w-6 h-6 text-white" />
                </div>
                <Clock className="w-5 h-5 text-yellow-400 opacity-60" />
              </div>
              <div className="text-3xl font-bold text-yellow-400 mb-1">
                {formatDuration(stats.averageCompletionTime)}
              </div>
              <p className="text-sm text-yellow-300 font-medium">Avg Completion</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={cardHoverVariants.hover} className="group">
          <Card className="bg-gradient-to-br from-indigo-900/20 to-blue-800/20 border-indigo-500/30 hover:border-indigo-400/50 transition-all duration-300 shadow-lg shadow-indigo-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <BarChart3 className="w-5 h-5 text-indigo-400 opacity-60" />
              </div>
              <div className="text-3xl font-bold text-indigo-400 mb-1">
                {Math.round(stats.staffUtilization)}%
              </div>
              <p className="text-sm text-indigo-300 font-medium">Staff Utilization</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={cardHoverVariants.hover} className="group">
          <Card className="bg-gradient-to-br from-cyan-900/20 to-teal-800/20 border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300 shadow-lg shadow-cyan-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <Image className="w-5 h-5 text-cyan-400 opacity-60" />
              </div>
              <div className="text-3xl font-bold text-cyan-400 mb-1">
                {Math.round(stats.photoComplianceRate)}%
              </div>
              <p className="text-sm text-cyan-300 font-medium">Photo Compliance</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={cardHoverVariants.hover} className="group">
          <Card className="bg-gradient-to-br from-emerald-900/20 to-green-800/20 border-emerald-500/30 hover:border-emerald-400/50 transition-all duration-300 shadow-lg shadow-emerald-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <Award className="w-5 h-5 text-emerald-400 opacity-60" />
              </div>
              <div className="text-3xl font-bold text-emerald-400 mb-1">
                {Math.round(stats.onTimeCompletionRate)}%
              </div>
              <p className="text-sm text-emerald-300 font-medium">On-Time Rate</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={cardHoverVariants.hover} className="group">
          <Card className="bg-gradient-to-br from-red-900/20 to-rose-800/20 border-red-500/30 hover:border-red-400/50 transition-all duration-300 shadow-lg shadow-red-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-rose-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <Zap className="w-5 h-5 text-red-400 opacity-60" />
              </div>
              <div className="text-3xl font-bold text-red-400 mb-1">{stats.urgentJobs}</div>
              <p className="text-sm text-red-300 font-medium">Urgent Jobs</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Staff Performance Overview */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-r from-gray-900/30 to-slate-900/30 border-gray-700/30 backdrop-blur-sm">
          <CardHeader className="border-b border-gray-700/50">
            <CardTitle className="text-white flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              Staff Performance Overview
              <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/30">
                {staffPerformance.length} Active
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <span className="ml-3 text-gray-400">Loading staff performance...</span>
              </div>
            ) : staffPerformance.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-400 mb-2">No Active Staff</h3>
                <p className="text-gray-500">No staff members are currently assigned to jobs</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence>
                  {staffPerformance.map((staff, index) => (
                    <motion.div
                      key={staff.staffId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      whileHover={cardHoverVariants.hover}
                      className="group"
                    >
                      <Card className="bg-gray-800/50 border-gray-700/50 hover:border-gray-600/70 transition-all duration-300">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-4">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={staff.avatar} />
                              <AvatarFallback className="bg-indigo-500 text-white">
                                {staff.name?.split(' ').map(n => n[0]).join('') || 'US'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-white truncate">{staff.name}</h4>
                              <Badge className={getStatusColor(staff.status)}>
                                {staff.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="w-6 h-6 p-0 text-gray-400 hover:text-white"
                                onClick={() => toast.info('Contact feature coming soon')}
                              >
                                <Phone className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="w-6 h-6 p-0 text-gray-400 hover:text-white"
                                onClick={() => toast.info('Message feature coming soon')}
                              >
                                <MessageSquare className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-400">Active Jobs</span>
                              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                                {staff.activeJobs}
                              </Badge>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-400">Completed Today</span>
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                {staff.completedToday}
                              </Badge>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-400">Rating</span>
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                <span className="text-white font-medium">
                                  {staff.averageRating.toFixed(1)}
                                </span>
                              </div>
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

      {/* Job Status Tracker */}
      <motion.div variants={itemVariants}>
        <JobStatusTracker
          showAllJobs={true}
          className="mt-0"
        />
      </motion.div>
    </motion.div>
  )
}
