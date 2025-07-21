'use client'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { db } from '@/lib/firebase'
import NotificationService, { type Notification, type NotificationMetrics } from '@/services/NotificationService'
import { collection, getDocs, orderBy, query, Timestamp, where } from 'firebase/firestore'
import {
    AlertTriangle,
    Bell,
    CheckCircle,
    Clock,
    Mail,
    MessageSquare,
    RefreshCw,
    Send,
    Smartphone,
    TrendingUp,
    Users,
    XCircle
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface NotificationStats {
  totalNotifications: number
  unreadNotifications: number
  deliveredNotifications: number
  failedNotifications: number
  recentNotifications: Notification[]
}

export default function NotificationDashboard() {
  const [metrics, setMetrics] = useState<NotificationMetrics>({
    totalSent: 0,
    deliverySuccessRate: 0,
    averageDeliveryTime: 0,
    responseRate: 0,
    unacceptedJobs: 0,
    escalatedJobs: 0,
    lastNotificationSent: null
  })

  const [stats, setStats] = useState<NotificationStats>({
    totalNotifications: 0,
    unreadNotifications: 0,
    deliveredNotifications: 0,
    failedNotifications: 0,
    recentNotifications: []
  })

  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    // Initial load
    refreshData()

    // Set up periodic refresh every 30 seconds
    const interval = setInterval(refreshData, 30000)

    return () => clearInterval(interval)
  }, [])

  const refreshData = async () => {
    try {
      // Get service metrics
      const serviceMetrics = NotificationService.getMetrics()
      setMetrics(serviceMetrics)

      // Get notification statistics
      await loadNotificationStats()
    } catch (error) {
      console.error('Error refreshing notification data:', error)
    }
  }

  const loadNotificationStats = async () => {
    try {
      if (!db) throw new Error("Firebase not initialized")

      // Get total notifications from last 24 hours
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)

      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('createdAt', '>=', Timestamp.fromDate(yesterday)),
        orderBy('createdAt', 'desc')
      )

      const notificationsSnapshot = await getDocs(notificationsQuery)
      const notifications: Notification[] = []

      let unreadCount = 0
      let deliveredCount = 0
      let failedCount = 0

      notificationsSnapshot.forEach((doc) => {
        const notification = { id: doc.id, ...doc.data() } as Notification
        notifications.push(notification)

        if (!notification.read) unreadCount++
        if (notification.deliveryStatus === 'delivered') deliveredCount++
        if (notification.deliveryStatus === 'failed') failedCount++
      })

      setStats({
        totalNotifications: notifications.length,
        unreadNotifications: unreadCount,
        deliveredNotifications: deliveredCount,
        failedNotifications: failedCount,
        recentNotifications: notifications.slice(0, 10) // Last 10 notifications
      })
    } catch (error) {
      console.error('Error loading notification stats:', error)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshData()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const getDeliveryRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-400'
    if (rate >= 85) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getDeliveryRateBadge = (rate: number) => {
    if (rate >= 95) return 'default'
    if (rate >= 85) return 'secondary'
    return 'destructive'
  }

  const getNotificationTypeIcon = (type: string) => {
    switch (type) {
      case 'job_assignment':
        return <Users className="h-4 w-4" />
      case 'job_reminder':
        return <Clock className="h-4 w-4" />
      case 'admin_alert':
        return <AlertTriangle className="h-4 w-4" />
      case 'job_accepted':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'job_assignment':
        return 'text-blue-400'
      case 'job_reminder':
        return 'text-yellow-400'
      case 'admin_alert':
        return 'text-red-400'
      case 'job_accepted':
        return 'text-green-400'
      default:
        return 'text-neutral-400'
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'secondary'
      case 'low':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const formatTimeAgo = (timestamp: Timestamp) => {
    const now = new Date()
    const time = timestamp.toDate()
    const diffMs = now.getTime() - time.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  return (
    <Card className="bg-neutral-900 border-neutral-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-400" />
            Notification Dashboard
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="border-neutral-700 hover:bg-neutral-800"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <p className="text-neutral-400 text-sm">
          Real-time notification system monitoring and management
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
            <div className="flex items-center gap-2 mb-2">
              <Send className="h-4 w-4 text-blue-400" />
              <span className="text-neutral-400 text-sm">Delivery Rate</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${getDeliveryRateColor(metrics.deliverySuccessRate)}`}>
                {metrics.deliverySuccessRate.toFixed(1)}%
              </span>
              <Badge variant={getDeliveryRateBadge(metrics.deliverySuccessRate)} className="text-xs">
                {metrics.deliverySuccessRate >= 95 ? 'Excellent' : metrics.deliverySuccessRate >= 85 ? 'Good' : 'Poor'}
              </Badge>
            </div>
          </div>

          <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-green-400" />
              <span className="text-neutral-400 text-sm">Avg Delivery</span>
            </div>
            <div className="text-2xl font-bold text-green-400">
              {metrics.averageDeliveryTime.toFixed(0)}ms
            </div>
            <div className="text-xs text-neutral-500">
              delivery time
            </div>
          </div>

          <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-neutral-400 text-sm">Unaccepted</span>
            </div>
            <div className="text-2xl font-bold text-red-400">
              {metrics.unacceptedJobs}
            </div>
            <div className="text-xs text-neutral-500">
              jobs requiring attention
            </div>
          </div>

          <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-purple-400" />
              <span className="text-neutral-400 text-sm">Response Rate</span>
            </div>
            <div className="text-2xl font-bold text-purple-400">
              {metrics.responseRate.toFixed(1)}%
            </div>
            <div className="text-xs text-neutral-500">
              staff response rate
            </div>
          </div>
        </div>

        {/* 24-Hour Statistics */}
        <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
          <h3 className="text-white font-medium mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-blue-400" />
            24-Hour Notification Statistics
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {stats.totalNotifications}
              </div>
              <div className="text-sm text-neutral-400">Total Sent</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {stats.unreadNotifications}
              </div>
              <div className="text-sm text-neutral-400">Unread</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {stats.deliveredNotifications}
              </div>
              <div className="text-sm text-neutral-400">Delivered</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">
                {stats.failedNotifications}
              </div>
              <div className="text-sm text-neutral-400">Failed</div>
            </div>
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
          <h3 className="text-white font-medium mb-3 flex items-center gap-2">
            <Bell className="h-4 w-4 text-purple-400" />
            Recent Notifications
          </h3>

          {stats.recentNotifications.length === 0 ? (
            <div className="text-center py-4 text-neutral-400">
              No recent notifications
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {stats.recentNotifications.map((notification) => (
                <div key={notification.id} className="flex items-center justify-between p-3 bg-neutral-900 rounded border border-neutral-700">
                  <div className="flex items-center gap-3">
                    <div className={`${getNotificationTypeColor(notification.type)}`}>
                      {getNotificationTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium text-sm">{notification.title}</span>
                        <Badge variant={getPriorityBadge(notification.priority)} className="text-xs">
                          {notification.priority}
                        </Badge>
                      </div>
                      <div className="text-xs text-neutral-400 truncate max-w-md">
                        {notification.message}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      {notification.deliveryChannels.includes('push') && (
                        <Smartphone className="h-3 w-3 text-blue-400" />
                      )}
                      {notification.deliveryChannels.includes('email') && (
                        <Mail className="h-3 w-3 text-green-400" />
                      )}
                      {notification.read ? (
                        <CheckCircle className="h-3 w-3 text-green-400" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-400" />
                      )}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {formatTimeAgo(notification.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Performance Targets */}
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <h3 className="text-blue-400 font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Notification Performance Targets
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-blue-300">Delivery Success Rate:</span>
                <span className="text-blue-200 font-medium">≥ 95%</span>
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-blue-300">Delivery Time:</span>
                <span className="text-blue-200 font-medium">≤ 5 seconds</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-blue-300">Job Acceptance Rate:</span>
                <span className="text-blue-200 font-medium">≥ 80%</span>
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-blue-300">Response Time:</span>
                <span className="text-blue-200 font-medium">≤ 30 minutes</span>
              </div>
            </div>
          </div>
        </div>

        {/* System Health Indicator */}
        <div className="text-center">
          {metrics.deliverySuccessRate >= 95 && metrics.unacceptedJobs === 0 ? (
            <div className="flex items-center justify-center gap-2 text-green-400">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Notification System Operating Optimally</span>
            </div>
          ) : metrics.deliverySuccessRate >= 85 ? (
            <div className="flex items-center justify-center gap-2 text-yellow-400">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Notification System Performance Acceptable</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-red-400">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">Notification System Issues Detected - Investigation Required</span>
            </div>
          )}
          <div className="text-xs text-neutral-500 mt-1">
            Last notification: {metrics.lastNotificationSent?.toLocaleTimeString() || 'Never'}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
