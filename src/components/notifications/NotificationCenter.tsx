'use client'

import { useState } from 'react'
import { useNotifications } from '@/hooks/useNotifications'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  Bell, 
  BellRing, 
  Check, 
  CheckCheck, 
  X,
  Settings,
  FileText,
  ClipboardList,
  DollarSign,
  Calendar,
  Wrench,
  AlertTriangle,
  Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import { Notification } from '@/lib/db'
import { toDate } from '@/utils/dateUtils'

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead
  } = useNotifications()
  
  const [showSettings, setShowSettings] = useState(false)
  
  const getNotificationIcon = (category: string) => {
    switch (category) {
      case 'report_generated': return FileText
      case 'task_assigned':
      case 'task_completed': return ClipboardList
      case 'invoice_created': return DollarSign
      case 'booking_confirmed': return Calendar
      case 'maintenance_required': return Wrench
      case 'system_alert': return AlertTriangle
      default: return Bell
    }
  }
  
  const getNotificationColor = (category: string, priority: string) => {
    if (priority === 'urgent') return 'text-red-400'
    
    switch (category) {
      case 'report_generated': return 'text-blue-400'
      case 'task_assigned': return 'text-green-400'
      case 'task_completed': return 'text-emerald-400'
      case 'invoice_created': return 'text-yellow-400'
      case 'booking_confirmed': return 'text-purple-400'
      case 'maintenance_required': return 'text-orange-400'
      case 'system_alert': return 'text-red-400'
      default: return 'text-neutral-400'
    }
  }
  
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/20">Urgent</Badge>
      case 'high':
        return <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20">High</Badge>
      case 'normal':
        return null
      case 'low':
        return <Badge className="bg-neutral-500/10 text-neutral-400 border-neutral-500/20">Low</Badge>
      default:
        return null
    }
  }
  
  const handleNotificationClick = async (notification: Notification) => {
    if (notification.status !== 'read') {
      await markAsRead(notification.id)
    }
    
    // Handle navigation based on notification data
    if (notification.data?.report_url) {
      window.open(notification.data.report_url, '_blank')
    } else if (notification.data?.task_url) {
      window.open(notification.data.task_url, '_blank')
    }
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="fixed right-4 top-16 w-96 max-h-[80vh] bg-neutral-950 border border-neutral-800 rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-white">Notifications</h2>
            {unreadCount > 0 && (
              <Badge className="bg-primary-500/10 text-primary-400 border-primary-500/20">
                {unreadCount}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="text-neutral-400 hover:text-white"
            >
              <Settings className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-neutral-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Actions */}
        {unreadCount > 0 && (
          <div className="p-3 border-b border-neutral-800">
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="w-full flex items-center gap-2"
            >
              <CheckCheck className="h-3 w-3" />
              Mark all as read
            </Button>
          </div>
        )}
        
        {/* Notifications List */}
        <div className="overflow-y-auto max-h-96">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
              <span className="ml-2 text-neutral-400">Loading notifications...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center p-8">
              <Bell className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No notifications</h3>
              <p className="text-neutral-400">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-800">
              {notifications.map((notification) => {
                const IconComponent = getNotificationIcon(notification.category)
                const iconColor = getNotificationColor(notification.category, notification.priority)
                const isUnread = notification.status !== 'read'
                
                return (
                  <div
                    key={notification.id}
                    className={`p-4 cursor-pointer transition-colors hover:bg-neutral-900 ${
                      isUnread ? 'bg-neutral-900/50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 ${iconColor}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`font-medium ${isUnread ? 'text-white' : 'text-neutral-300'}`}>
                            {notification.title}
                          </h4>
                          
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {getPriorityBadge(notification.priority)}
                            {isUnread && (
                              <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        
                        <p className={`text-sm mt-1 ${isUnread ? 'text-neutral-300' : 'text-neutral-400'}`}>
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-neutral-500">
                            {format(toDate(notification.created_at), 'MMM d, h:mm a')}
                          </span>
                          
                          {isUnread && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                markAsRead(notification.id)
                              }}
                              className="text-xs text-neutral-400 hover:text-white h-6 px-2"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Mark read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        
        {/* Settings Panel */}
        {showSettings && (
          <div className="border-t border-neutral-800 p-4">
            <NotificationSettings onClose={() => setShowSettings(false)} />
          </div>
        )}
      </div>
    </div>
  )
}

function NotificationSettings({ onClose }: { onClose: () => void }) {
  const { preferences, updatePreferences, registerForPush, unregisterFromPush } = useNotifications()
  
  if (!preferences) {
    return (
      <div className="text-center py-4">
        <p className="text-neutral-400">Loading preferences...</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Notification Settings</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-300">Email notifications</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => updatePreferences({ email_enabled: !preferences.email_enabled })}
            className={preferences.email_enabled ? 'bg-green-500/10 text-green-400' : ''}
          >
            {preferences.email_enabled ? 'Enabled' : 'Disabled'}
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-300">Push notifications</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => preferences.push_enabled ? unregisterFromPush() : registerForPush()}
            className={preferences.push_enabled ? 'bg-green-500/10 text-green-400' : ''}
          >
            {preferences.push_enabled ? 'Enabled' : 'Disabled'}
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-300">Report notifications</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => updatePreferences({ email_reports: !preferences.email_reports })}
            className={preferences.email_reports ? 'bg-green-500/10 text-green-400' : ''}
          >
            {preferences.email_reports ? 'On' : 'Off'}
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-300">Task notifications</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => updatePreferences({ email_tasks: !preferences.email_tasks })}
            className={preferences.email_tasks ? 'bg-green-500/10 text-green-400' : ''}
          >
            {preferences.email_tasks ? 'On' : 'Off'}
          </Button>
        </div>
      </div>
    </div>
  )
}
