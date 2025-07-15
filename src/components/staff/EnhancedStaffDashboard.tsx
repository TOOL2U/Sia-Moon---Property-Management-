'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Separator } from '@/components/ui/Separator'
import { toast } from 'sonner'
import {
  Bell,
  BellRing,
  Calendar,
  Clock,
  MapPin,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react'
import { useRealTimeJobNotifications } from '@/hooks/useRealTimeJobNotifications'
import { formatDistanceToNow } from 'date-fns'

interface EnhancedStaffDashboardProps {
  staffId: string
  staffName: string
  staffRole: string
}

export function EnhancedStaffDashboard({
  staffId,
  staffName,
  staffRole
}: EnhancedStaffDashboardProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'completed' | 'notifications'>('pending')
  
  const {
    pendingJobs,
    activeJobs,
    completedJobs,
    notifications,
    unreadCount,
    isLoading,
    error,
    acceptJob,
    declineJob,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    refreshData
  } = useRealTimeJobNotifications(staffId)

  const handleAcceptJob = async (jobId: string) => {
    try {
      await acceptJob(jobId)
      toast.success('Job accepted successfully!')
    } catch (error) {
      toast.error('Failed to accept job')
    }
  }

  const handleDeclineJob = async (jobId: string) => {
    try {
      await declineJob(jobId)
      toast.success('Job declined')
    } catch (error) {
      toast.error('Failed to decline job')
    }
  }

  const handleMarkNotificationRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId)
    } catch (error) {
      toast.error('Failed to mark notification as read')
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-500'
      case 'accepted': return 'bg-green-500'
      case 'in-progress': return 'bg-orange-500'
      case 'completed': return 'bg-gray-500'
      default: return 'bg-gray-400'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-400">Loading dashboard...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-400 mb-4">{error}</p>
        <Button onClick={refreshData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Staff Dashboard</h1>
          <p className="text-gray-400">Welcome back, {staffName}</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={refreshData}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <div className="relative">
            <Bell className="h-6 w-6 text-gray-400" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pending Jobs</p>
                <p className="text-2xl font-bold text-white">{pendingJobs.length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Jobs</p>
                <p className="text-2xl font-bold text-white">{activeJobs.length}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-white">{completedJobs.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Notifications</p>
                <p className="text-2xl font-bold text-white">{unreadCount}</p>
              </div>
              <BellRing className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
        {[
          { key: 'pending', label: 'Pending Jobs', count: pendingJobs.length },
          { key: 'active', label: 'Active Jobs', count: activeJobs.length },
          { key: 'completed', label: 'Completed', count: completedJobs.length },
          { key: 'notifications', label: 'Notifications', count: unreadCount }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <Badge className="ml-2 bg-red-500 text-white text-xs">
                {tab.count}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === 'pending' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Pending Job Assignments</h2>
            {pendingJobs.length === 0 ? (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-400">No pending jobs. Great work!</p>
                </CardContent>
              </Card>
            ) : (
              pendingJobs.map((job) => (
                <Card key={job.id} className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">{job.title}</CardTitle>
                      <Badge className={`${getPriorityColor(job.priority)} text-white`}>
                        {job.priority}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center text-gray-400">
                        <MapPin className="h-4 w-4 mr-2" />
                        {job.propertyName}
                      </div>
                      <div className="flex items-center text-gray-400">
                        <Calendar className="h-4 w-4 mr-2" />
                        {job.scheduledDate}
                      </div>
                      <div className="flex items-center text-gray-400">
                        <Clock className="h-4 w-4 mr-2" />
                        {job.estimatedDuration} minutes
                      </div>
                      <div className="flex items-center text-gray-400">
                        <User className="h-4 w-4 mr-2" />
                        {job.assignedBy.name}
                      </div>
                    </div>
                    
                    {job.specialInstructions && (
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Special Instructions:</p>
                        <p className="text-sm text-gray-300">{job.specialInstructions}</p>
                      </div>
                    )}

                    <Separator className="bg-gray-700" />
                    
                    <div className="flex space-x-3">
                      <Button
                        onClick={() => handleAcceptJob(job.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept Job
                      </Button>
                      <Button
                        onClick={() => handleDeclineJob(job.id)}
                        variant="outline"
                        className="flex-1 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Decline
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'active' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Active Jobs</h2>
            {activeJobs.length === 0 ? (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-8 text-center">
                  <Clock className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                  <p className="text-gray-400">No active jobs at the moment.</p>
                </CardContent>
              </Card>
            ) : (
              activeJobs.map((job) => (
                <Card key={job.id} className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">{job.title}</CardTitle>
                      <div className="flex space-x-2">
                        <Badge className={`${getStatusColor(job.status)} text-white`}>
                          {job.status}
                        </Badge>
                        <Badge className={`${getPriorityColor(job.priority)} text-white`}>
                          {job.priority}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        {job.propertyName}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {job.scheduledDate}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Notifications</h2>
              {unreadCount > 0 && (
                <Button
                  onClick={markAllNotificationsAsRead}
                  variant="outline"
                  size="sm"
                >
                  Mark All Read
                </Button>
              )}
            </div>
            {notifications.length === 0 ? (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-8 text-center">
                  <Bell className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No notifications yet.</p>
                </CardContent>
              </Card>
            ) : (
              notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`bg-gray-800 border-gray-700 ${
                    notification.status !== 'read' ? 'border-blue-500' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{notification.title}</h4>
                        <p className="text-sm text-gray-400 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {notification.createdAt && formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true })}
                        </p>
                      </div>
                      {notification.status !== 'read' && (
                        <Button
                          onClick={() => notification.id && handleMarkNotificationRead(notification.id)}
                          variant="ghost"
                          size="sm"
                        >
                          Mark Read
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
