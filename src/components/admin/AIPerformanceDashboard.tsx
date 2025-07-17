'use client'

import AIDisabledWarning from '@/components/admin/AIDisabledWarning'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import AILogsService, {
  type AILog,
  type AILogFilters,
  type AIPerformanceKPIs,
} from '@/services/AILogsService'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  Brain,
  Calendar,
  Clock,
  Download,
  Eye,
  Filter,
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  Settings,
  Star,
  Target,
  ThumbsDown,
  ThumbsUp,
  Users,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import AISettingsModal from './AISettingsModal'

// Animation variants matching existing components
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
}

// Feedback dialog interface
interface FeedbackDialog {
  isOpen: boolean
  log: AILog | null
  rating: 'positive' | 'negative' | null
  comment: string
}

export default function AIPerformanceDashboard() {
  const [kpis, setKpis] = useState<AIPerformanceKPIs>({
    avgBookingApprovalTime: 0,
    jobAssignmentAccuracy: 0,
    avgJobsPerStaff: 0,
    calendarUpdatesTriggered: 0,
    staffResponseRate: 0,
    totalAIDecisions: 0,
    positiveRating: 0,
    negativeRating: 0,
    overallSatisfaction: 0,
  })

  const [logs, setLogs] = useState<AILog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [filters, setFilters] = useState<AILogFilters>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedDateRange, setSelectedDateRange] = useState('7d')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [feedbackDialog, setFeedbackDialog] = useState<FeedbackDialog>({
    isOpen: false,
    log: null,
    rating: null,
    comment: '',
  })
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true)

      // Calculate date range
      const dateRange = getDateRange(selectedDateRange)
      const currentFilters: AILogFilters = {
        ...filters,
        dateRange,
        searchTerm: searchTerm || undefined,
        type: selectedType !== 'all' ? [selectedType] : undefined,
        status: selectedStatus !== 'all' ? [selectedStatus] : undefined,
      }

      const [kpisData, logsData] = await Promise.all([
        AILogsService.calculateKPIs(dateRange),
        AILogsService.getAILogs(currentFilters, 50),
      ])

      setKpis(kpisData)
      setLogs(logsData.logs)
    } catch (error) {
      console.error('Error loading AI dashboard data:', error)
      toast.error('Failed to load AI performance data')
    } finally {
      setIsLoading(false)
    }
  }, [filters, searchTerm, selectedDateRange, selectedType, selectedStatus])

  // Get date range based on selection
  const getDateRange = (range: string) => {
    const now = new Date()
    const start = new Date()

    switch (range) {
      case '24h':
        start.setHours(now.getHours() - 24)
        break
      case '7d':
        start.setDate(now.getDate() - 7)
        break
      case '30d':
        start.setDate(now.getDate() - 30)
        break
      case '90d':
        start.setDate(now.getDate() - 90)
        break
      default:
        start.setDate(now.getDate() - 7)
    }

    return { start, end: now }
  }

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadDashboardData()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  // Handle feedback submission
  const handleFeedbackSubmit = async () => {
    if (!feedbackDialog.log || !feedbackDialog.rating) return

    try {
      await AILogsService.submitFeedback({
        decisionId: feedbackDialog.log.id,
        logId: feedbackDialog.log.id,
        rating: feedbackDialog.rating,
        comment: feedbackDialog.comment.trim() || undefined,
        adminId: 'current_admin', // Would get from auth context
        adminName: 'Admin User',
        helpful: true,
        category: 'accuracy',
      })

      toast.success('Feedback submitted successfully!', {
        description: 'Thank you for helping improve our AI systems',
      })

      // Close dialog and refresh KPIs
      setFeedbackDialog({
        isOpen: false,
        log: null,
        rating: null,
        comment: '',
      })

      // Refresh KPIs to reflect new feedback
      const updatedKpis = await AILogsService.calculateKPIs(
        getDateRange(selectedDateRange)
      )
      setKpis(updatedKpis)
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast.error('Failed to submit feedback')
    }
  }

  // Open feedback dialog
  const openFeedbackDialog = (log: AILog, rating: 'positive' | 'negative') => {
    setFeedbackDialog({
      isOpen: true,
      log,
      rating,
      comment: '',
    })
  }

  // Format action type for display
  const formatActionType = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Get action type icon
  const getActionTypeIcon = (type: string) => {
    switch (type) {
      case 'booking_approved':
      case 'booking_rejected':
        return <Calendar className="h-4 w-4" />
      case 'job_assigned':
      case 'job_created':
        return <Users className="h-4 w-4" />
      case 'calendar_updated':
        return <Calendar className="h-4 w-4" />
      case 'notification_sent':
        return <MessageSquare className="h-4 w-4" />
      default:
        return <Brain className="h-4 w-4" />
    }
  }

  // Get action type color
  const getActionTypeColor = (type: string) => {
    switch (type) {
      case 'booking_approved':
        return 'text-green-400'
      case 'booking_rejected':
        return 'text-red-400'
      case 'job_assigned':
      case 'job_created':
        return 'text-blue-400'
      case 'calendar_updated':
        return 'text-purple-400'
      case 'notification_sent':
        return 'text-yellow-400'
      default:
        return 'text-gray-400'
    }
  }

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return 'default'
      case 'pending':
        return 'secondary'
      case 'failed':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  // Format timestamp
  const formatTimestamp = (timestamp: any) => {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  // Initial load
  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // Search debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadDashboardData()
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* AI Disabled Warning */}
      <AIDisabledWarning context="ai-dashboard" />

      {/* Header Section */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-r from-gray-900/30 to-slate-900/30 border-gray-700/30 backdrop-blur-sm">
          <CardHeader className="border-b border-gray-700/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                AI Performance Dashboard
                <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/30">
                  Live Analytics
                </Badge>
              </CardTitle>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSettingsModalOpen(true)}
                  className="border-gray-600/50 text-gray-300 hover:bg-gray-700/50"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="border-gray-600/50 text-gray-300 hover:bg-gray-700/50"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="border-gray-600/50 text-gray-300 hover:bg-gray-700/50"
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
                  />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-600/50 text-gray-300 hover:bg-gray-700/50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              Real-time AI performance monitoring and admin feedback system
            </p>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Filters Section */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            variants={itemVariants}
          >
            <Card className="bg-gradient-to-r from-gray-900/20 to-slate-900/20 border-gray-700/30">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                      Time Range
                    </label>
                    <Select
                      value={selectedDateRange}
                      onValueChange={setSelectedDateRange}
                    >
                      <SelectTrigger className="bg-gray-800/50 border-gray-600/50 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24h">Last 24 Hours</SelectItem>
                        <SelectItem value="7d">Last 7 Days</SelectItem>
                        <SelectItem value="30d">Last 30 Days</SelectItem>
                        <SelectItem value="90d">Last 90 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                      Decision Type
                    </label>
                    <Select
                      value={selectedType}
                      onValueChange={setSelectedType}
                    >
                      <SelectTrigger className="bg-gray-800/50 border-gray-600/50 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="booking_approved">
                          Booking Approved
                        </SelectItem>
                        <SelectItem value="booking_rejected">
                          Booking Rejected
                        </SelectItem>
                        <SelectItem value="job_assigned">
                          Job Assigned
                        </SelectItem>
                        <SelectItem value="job_created">Job Created</SelectItem>
                        <SelectItem value="calendar_updated">
                          Calendar Updated
                        </SelectItem>
                        <SelectItem value="notification_sent">
                          Notification Sent
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                      Status
                    </label>
                    <Select
                      value={selectedStatus}
                      onValueChange={setSelectedStatus}
                    >
                      <SelectTrigger className="bg-gray-800/50 border-gray-600/50 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                      Search
                    </label>
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Search decisions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI Metrics Grid */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Average Approval Time */}
          <Card className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border-blue-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm font-medium">
                    Avg Approval Time
                  </p>
                  <p className="text-2xl font-bold text-blue-400">
                    {(kpis.avgBookingApprovalTime / 1000).toFixed(1)}s
                  </p>
                  <p className="text-blue-300/70 text-xs">booking processing</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignment Accuracy */}
          <Card className="bg-gradient-to-br from-green-600/20 to-green-800/20 border-green-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-200 text-sm font-medium">
                    Assignment Accuracy
                  </p>
                  <p className="text-2xl font-bold text-green-400">
                    {kpis.jobAssignmentAccuracy.toFixed(1)}%
                  </p>
                  <p className="text-green-300/70 text-xs">
                    successful assignments
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Target className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Jobs per Staff */}
          <Card className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-sm font-medium">
                    Jobs per Staff
                  </p>
                  <p className="text-2xl font-bold text-purple-400">
                    {kpis.avgJobsPerStaff.toFixed(1)}
                  </p>
                  <p className="text-purple-300/70 text-xs">average workload</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin Satisfaction */}
          <Card className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border-yellow-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-200 text-sm font-medium">
                    Admin Satisfaction
                  </p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {kpis.overallSatisfaction.toFixed(1)}%
                  </p>
                  <p className="text-yellow-300/70 text-xs">
                    positive feedback
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Star className="h-6 w-6 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* AI Decision Log Feed */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-r from-gray-900/30 to-slate-900/30 border-gray-700/30 backdrop-blur-sm">
          <CardHeader className="border-b border-gray-700/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                AI Decision Log ({logs.length})
                <Badge className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30">
                  Real-time
                </Badge>
              </CardTitle>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-600/50 text-gray-300 hover:bg-gray-700/50"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View All
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">
                    Loading AI Decisions
                  </h3>
                  <p className="text-gray-400">
                    Fetching comprehensive decision data...
                  </p>
                </div>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-r from-gray-600/20 to-slate-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Brain className="h-10 w-10 text-gray-500" />
                </div>
                <h3 className="text-xl font-medium text-gray-400 mb-3">
                  No AI decisions found
                </h3>
                <p className="text-gray-500 mb-6">
                  Try adjusting your filters or check back later for new AI
                  activity
                </p>
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  className="border-gray-600/50 text-gray-300 hover:bg-gray-700/50"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Data
                </Button>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {logs.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-gray-800/30 to-slate-800/30 border border-gray-700/50 rounded-lg p-4 hover:bg-gray-700/20 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`${getActionTypeColor(log.type)} bg-gray-800/50 p-2 rounded-lg`}
                        >
                          {getActionTypeIcon(log.type)}
                        </div>
                        <div>
                          <h4 className="font-medium text-white">
                            {formatActionType(log.type)}
                          </h4>
                          <p className="text-sm text-gray-400">
                            {log.refType}: {log.refId}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={getStatusBadge(log.status)}
                          className="mb-1"
                        >
                          {log.status}
                        </Badge>
                        <div className="text-xs text-gray-500">
                          {formatTimestamp(log.timestamp)}
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-300 mb-2">
                        <strong className="text-gray-200">Reason:</strong>{' '}
                        {log.reason}
                      </p>

                      {log.metadata.staffName && (
                        <p className="text-sm text-gray-400">
                          <strong>Staff:</strong> {log.metadata.staffName}
                        </p>
                      )}

                      {log.metadata.propertyName && (
                        <p className="text-sm text-gray-400">
                          <strong>Property:</strong> {log.metadata.propertyName}
                        </p>
                      )}

                      {log.metadata.clientName && (
                        <p className="text-sm text-gray-400">
                          <strong>Client:</strong> {log.metadata.clientName}
                        </p>
                      )}

                      {log.confidence && (
                        <p className="text-sm text-gray-400">
                          <strong>Confidence:</strong>{' '}
                          {(log.confidence * 100).toFixed(0)}%
                        </p>
                      )}
                    </div>

                    {/* Admin Feedback Section */}
                    <div className="border-t border-gray-700/50 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-300">
                          Was this decision helpful?
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openFeedbackDialog(log, 'positive')}
                            className="border-green-600/50 text-green-400 hover:bg-green-600/10 hover:border-green-500"
                          >
                            <ThumbsUp className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openFeedbackDialog(log, 'negative')}
                            className="border-red-600/50 text-red-400 hover:bg-red-600/10 hover:border-red-500"
                          >
                            <ThumbsDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Feedback Dialog */}
      <Dialog
        open={feedbackDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setFeedbackDialog({
              isOpen: false,
              log: null,
              rating: null,
              comment: '',
            })
          }
        }}
      >
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {feedbackDialog.rating === 'positive' ? (
                <ThumbsUp className="h-5 w-5 text-green-400" />
              ) : (
                <ThumbsDown className="h-5 w-5 text-red-400" />
              )}
              Provide Feedback
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Help us improve our AI systems by providing feedback on this
              decision.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {feedbackDialog.log && (
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                <h4 className="font-medium text-white mb-1">
                  {formatActionType(feedbackDialog.log.type)}
                </h4>
                <p className="text-sm text-gray-400 mb-2">
                  {feedbackDialog.log.reason}
                </p>
                <div className="text-xs text-gray-500">
                  {formatTimestamp(feedbackDialog.log.timestamp)}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Additional Comments (Optional)
              </label>
              <Textarea
                placeholder="Share your thoughts on this AI decision..."
                value={feedbackDialog.comment}
                onChange={(e) =>
                  setFeedbackDialog((prev) => ({
                    ...prev,
                    comment: e.target.value,
                  }))
                }
                className="bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 resize-none"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setFeedbackDialog({
                  isOpen: false,
                  log: null,
                  rating: null,
                  comment: '',
                })
              }
              className="border-gray-600/50 text-gray-300 hover:bg-gray-700/50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleFeedbackSubmit}
              className={`${
                feedbackDialog.rating === 'positive'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              } text-white`}
            >
              Submit Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Settings Modal */}
      <AISettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />
    </motion.div>
  )
}
