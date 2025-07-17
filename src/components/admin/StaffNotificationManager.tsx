'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { toast } from 'sonner'
import {
  Bell,
  BellOff,
  Smartphone,
  Monitor,
  Tablet,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Settings,
  Users,
  MessageSquare,
  Zap,
  AlertTriangle,
  Eye,
  Trash2,
  Loader2
} from 'lucide-react'
import JobAssignmentService from '@/services/JobAssignmentService'

interface StaffNotificationManagerProps {
  className?: string
}

interface StaffNotificationSettings {
  staffId: string
  staffName: string
  staffEmail: string
  notificationsEnabled: boolean
  deviceTokens: Array<{
    token: string
    platform: 'ios' | 'android' | 'web'
    lastActive: Date
  }>
  unreadCount: number
  lastNotificationAt?: Date
}

interface NotificationTemplate {
  id: string
  name: string
  title: string
  body: string
  type: 'job_assigned' | 'job_reminder' | 'system_alert' | 'custom'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  enabled: boolean
}

const defaultTemplates: NotificationTemplate[] = [
  {
    id: 'job_assigned',
    name: 'Job Assignment',
    title: '🎯 New Job Assignment',
    body: 'You have been assigned a new {jobType} job at {propertyName}',
    type: 'job_assigned',
    priority: 'high',
    enabled: true
  },
  {
    id: 'job_reminder',
    name: 'Job Reminder',
    title: '⏰ Job Reminder',
    body: 'Reminder: {jobTitle} is scheduled to start in 30 minutes',
    type: 'job_reminder',
    priority: 'medium',
    enabled: true
  },
  {
    id: 'system_alert',
    name: 'System Alert',
    title: '🚨 System Alert',
    body: 'Important system notification: {message}',
    type: 'system_alert',
    priority: 'urgent',
    enabled: true
  }
]

export function StaffNotificationManager({ className }: StaffNotificationManagerProps) {
  // State management
  const [staffSettings, setStaffSettings] = useState<StaffNotificationSettings[]>([])
  const [templates, setTemplates] = useState<NotificationTemplate[]>(defaultTemplates)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<string | null>(null)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [showEnabledOnly, setShowEnabledOnly] = useState(false)
  
  // Test notification state
  const [testNotification, setTestNotification] = useState({
    staffId: '',
    title: 'Test Notification',
    message: 'This is a test notification from Sia Moon admin panel',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
  })

  // Load staff notification settings
  const loadStaffSettings = async () => {
    try {
      setLoading(true)
      console.log('📋 Loading staff notification settings...')

      // Get all staff members
      const response = await fetch('/api/admin/staff-accounts')
      const staffData = await response.json()

      if (!staffData.success) {
        throw new Error(staffData.error)
      }

      // Get notification settings for each staff member
      const settingsPromises = staffData.data.map(async (staff: any) => {
        const notifications = await JobAssignmentService.getStaffNotifications(staff.id, 10, true)

        return {
          staffId: staff.id,
          staffName: staff.name,
          staffEmail: staff.email,
          notificationsEnabled: false, // FCM service removed
          deviceTokens: [], // FCM service removed
          unreadCount: notifications.notifications?.length || 0,
          lastNotificationAt: null // FCM service removed
        }
      })

      const settings = await Promise.all(settingsPromises)
      setStaffSettings(settings)

      console.log(`✅ Loaded notification settings for ${settings.length} staff members`)

    } catch (error) {
      console.error('❌ Error loading staff settings:', error)
      toast.error('Failed to load staff notification settings')
    } finally {
      setLoading(false)
    }
  }

  // Toggle notifications for staff member
  const toggleStaffNotifications = async (staffId: string, enabled: boolean) => {
    try {
      setSending(staffId)
      
      await FCMNotificationService.toggleNotifications(staffId, enabled)
      
      // Update local state
      setStaffSettings(prev => 
        prev.map(staff => 
          staff.staffId === staffId 
            ? { ...staff, notificationsEnabled: enabled }
            : staff
        )
      )

      toast.success(`Notifications ${enabled ? 'enabled' : 'disabled'} for staff member`)

    } catch (error) {
      console.error('❌ Error toggling notifications:', error)
      toast.error('Failed to update notification settings')
    } finally {
      setSending(null)
    }
  }

  // Send test notification - FCM service removed
  const sendTestNotification = async () => {
    toast.error('Push notification service not implemented')
  }

  // Filter staff settings
  const filteredStaff = staffSettings.filter(staff => {
    const matchesSearch = staff.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         staff.staffEmail.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = !showEnabledOnly || staff.notificationsEnabled
    
    return matchesSearch && matchesFilter
  })

  // Get platform icon
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'ios':
      case 'android':
        return <Smartphone className="w-4 h-4" />
      case 'web':
        return <Monitor className="w-4 h-4" />
      default:
        return <Tablet className="w-4 h-4" />
    }
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
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

  // Load data on mount
  useEffect(() => {
    loadStaffSettings()
  }, [])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card className="bg-gradient-to-r from-indigo-900/20 via-purple-900/20 to-pink-900/20 border-indigo-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
                  Staff Notification Manager
                </CardTitle>
                <p className="text-gray-400 mt-1">
                  Manage push notifications and device tokens for staff members
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={loadStaffSettings}
                variant="outline"
                className="border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/10"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters and Search */}
      <Card className="bg-gray-900/50 border-gray-700/50">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-64">
              <Search className="w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search staff by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                checked={showEnabledOnly}
                onCheckedChange={setShowEnabledOnly}
              />
              <span className="text-sm text-gray-300">Enabled only</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Notification Settings */}
      <Card className="bg-gray-900/30 border-gray-700/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Staff Notification Settings ({filteredStaff.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <span className="ml-3 text-gray-400">Loading staff settings...</span>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-400 mb-2">No Staff Found</h3>
              <p className="text-gray-500">
                {searchTerm ? 'Try adjusting your search' : 'No staff members available'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {filteredStaff.map((staff, index) => (
                  <motion.div
                    key={staff.staffId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className="bg-gray-800/50 border-gray-700/50 hover:border-gray-600/70 transition-all duration-300">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-white">{staff.staffName}</h4>
                              <p className="text-sm text-gray-400">{staff.staffEmail}</p>
                            </div>
                          </div>
                          
                          <Switch
                            checked={staff.notificationsEnabled}
                            onCheckedChange={(enabled) => toggleStaffNotifications(staff.staffId, enabled)}
                            disabled={sending === staff.staffId}
                          />
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Status:</span>
                            <Badge className={staff.notificationsEnabled 
                              ? 'bg-green-500/20 text-green-400 border-green-500/30'
                              : 'bg-red-500/20 text-red-400 border-red-500/30'
                            }>
                              {staff.notificationsEnabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Devices:</span>
                            <span className="text-white">{staff.deviceTokens.length}</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Unread:</span>
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                              {staff.unreadCount}
                            </Badge>
                          </div>
                          
                          {staff.lastNotificationAt && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400">Last Active:</span>
                              <span className="text-xs text-gray-500">
                                {staff.lastNotificationAt.toLocaleDateString()}
                              </span>
                            </div>
                          )}
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

      {/* Test Notification */}
      <Card className="bg-gray-900/30 border-gray-700/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Send Test Notification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Staff Member</label>
              <select
                value={testNotification.staffId}
                onChange={(e) => setTestNotification(prev => ({ ...prev, staffId: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white"
              >
                <option value="">Select staff member</option>
                {staffSettings.map(staff => (
                  <option key={staff.staffId} value={staff.staffId}>
                    {staff.staffName} ({staff.staffEmail})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
              <select
                value={testNotification.priority}
                onChange={(e) => setTestNotification(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
            <Input
              value={testNotification.title}
              onChange={(e) => setTestNotification(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Notification title"
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
            <textarea
              value={testNotification.message}
              onChange={(e) => setTestNotification(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Notification message"
              rows={3}
              className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white resize-none"
            />
          </div>
          
          <Button
            onClick={sendTestNotification}
            disabled={sending === 'test' || !testNotification.staffId || !testNotification.title}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            {sending === 'test' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Test Notification
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
