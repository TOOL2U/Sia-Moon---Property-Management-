'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/SupabaseAuthContext'
import { useNotifications } from '@/hooks/useNotifications'
import SupabaseService from '@/lib/supabaseService'
import { User } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  Bell, 
  Send, 
  Mail, 
  Smartphone, 
  Monitor,
  TestTube,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  FileText,
  ClipboardList
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function TestNotificationsPage() {
  const { profile: user } = useAuth()
  const { notifications, unreadCount, loadNotifications } = useNotifications()
  const [users, setUsers] = useState<User[]>([])
  const [testResults, setTestResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<string>('')
  
  useEffect(() => {
    loadUsers()
  }, [])
  
  const loadUsers = async () => {
    try {
      const result = await SupabaseService.getAllUsers()
      if (result.data) {
        setUsers(result.data)
        if (result.data.length > 0 && !selectedUser) {
          setSelectedUser(result.data[0].id)
        }
      }
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }
  
  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }
  
  const reset = () => {
    setTestResults([])
  }
  
  const testEmailNotification = async () => {
    if (!selectedUser) {
      addTestResult('❌ No user selected')
      return
    }
    
    try {
      addTestResult('📧 Testing email notification...')
      
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser,
          category: 'report_generated',
          title: 'Test Email Notification',
          message: 'This is a test email notification from the notification system.',
          data: {
            property_name: 'Test Villa',
            report_period: 'December 2024',
            net_income: 'USD 2,500.00',
            occupancy_rate: '85.5%',
            total_bookings: '12'
          },
          priority: 'normal',
          channels: ['email'],
          emailSubject: 'Test Email Notification - Sia Moon',
          emailTemplate: 'report_generated'
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        addTestResult('✅ Email notification sent successfully')
        addTestResult(`📧 Delivery results: ${JSON.stringify(result.deliveryResults)}`)
      } else {
        addTestResult(`❌ Email notification failed: ${result.error}`)
      }
      
    } catch (error) {
      addTestResult(`❌ Error sending email notification: ${error}`)
    }
  }
  
  const testPushNotification = async () => {
    if (!selectedUser) {
      addTestResult('❌ No user selected')
      return
    }
    
    try {
      addTestResult('📱 Testing push notification...')
      
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser,
          category: 'task_assigned',
          title: 'Test Push Notification',
          message: 'This is a test push notification from the notification system.',
          data: {
            task_title: 'Clean Pool Area',
            property_name: 'Test Villa',
            due_date: 'Tomorrow',
            priority: 'Normal'
          },
          priority: 'normal',
          channels: ['push'],
          pushTitle: 'New Task Assigned',
          pushBody: 'Clean Pool Area - Test Villa',
          pushUrl: '/dashboard/staff/tasks'
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        addTestResult('✅ Push notification sent successfully')
        addTestResult(`📱 Delivery results: ${JSON.stringify(result.deliveryResults)}`)
      } else {
        addTestResult(`❌ Push notification failed: ${result.error}`)
      }
      
    } catch (error) {
      addTestResult(`❌ Error sending push notification: ${error}`)
    }
  }
  
  const testInAppNotification = async () => {
    if (!selectedUser) {
      addTestResult('❌ No user selected')
      return
    }
    
    try {
      addTestResult('🔔 Testing in-app notification...')
      
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser,
          category: 'maintenance_required',
          title: 'Test In-App Notification',
          message: 'This is a test in-app notification that will appear in the notification center.',
          data: {
            property_name: 'Test Villa',
            issue: 'Pool filter needs replacement',
            priority: 'normal'
          },
          priority: 'normal',
          channels: ['in_app']
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        addTestResult('✅ In-app notification created successfully')
        await loadNotifications() // Refresh notifications
      } else {
        addTestResult(`❌ In-app notification failed: ${result.error}`)
      }
      
    } catch (error) {
      addTestResult(`❌ Error creating in-app notification: ${error}`)
    }
  }
  
  const testMultiChannelNotification = async () => {
    if (!selectedUser) {
      addTestResult('❌ No user selected')
      return
    }
    
    try {
      addTestResult('📢 Testing multi-channel notification...')
      
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser,
          category: 'system_alert',
          title: 'Test Multi-Channel Notification',
          message: 'This notification will be sent via email, push, and in-app channels.',
          data: {
            alert_type: 'system_maintenance',
            scheduled_time: '2:00 AM UTC'
          },
          priority: 'high',
          channels: ['email', 'push', 'in_app'],
          emailSubject: 'System Alert - Scheduled Maintenance',
          emailTemplate: 'system_alert',
          pushTitle: 'System Alert',
          pushBody: 'Scheduled maintenance tonight at 2:00 AM UTC'
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        addTestResult('✅ Multi-channel notification sent successfully')
        addTestResult(`📊 Delivery results: ${JSON.stringify(result.deliveryResults)}`)
        await loadNotifications() // Refresh notifications
      } else {
        addTestResult(`❌ Multi-channel notification failed: ${result.error}`)
      }
      
    } catch (error) {
      addTestResult(`❌ Error sending multi-channel notification: ${error}`)
    }
  }
  
  const testBulkNotification = async () => {
    try {
      addTestResult('👥 Testing bulk notification...')
      
      const userIds = users.slice(0, 3).map(u => u.id) // Send to first 3 users
      
      const response = await fetch('/api/notifications/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds,
          category: 'system_alert',
          title: 'Test Bulk Notification',
          message: 'This is a test bulk notification sent to multiple users.',
          data: {
            announcement: 'New feature release',
            version: '2.0.0'
          },
          priority: 'normal',
          channels: ['in_app'],
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        addTestResult(`✅ Bulk notification sent: ${result.summary.successful}/${result.summary.total} successful`)
        await loadNotifications() // Refresh notifications
      } else {
        addTestResult(`❌ Bulk notification failed: ${result.error}`)
      }
      
    } catch (error) {
      addTestResult(`❌ Error sending bulk notification: ${error}`)
    }
  }
  
  const runAllTests = async () => {
    reset()
    setLoading(true)
    
    try {
      addTestResult('🚀 Starting comprehensive notification tests...')
      
      // Test 1: In-app notification
      await testInAppNotification()
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Test 2: Email notification
      await testEmailNotification()
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Test 3: Push notification
      await testPushNotification()
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Test 4: Multi-channel notification
      await testMultiChannelNotification()
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Test 5: Bulk notification
      await testBulkNotification()
      
      addTestResult('🎉 All notification tests completed!')
      
    } catch (error) {
      addTestResult(`❌ Test suite failed: ${error}`)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">
            Notification System Test
          </h1>
          <p className="text-neutral-400">
            Test all aspects of the notification system including email, push, and in-app notifications.
          </p>
        </div>
        
        {/* Current User Info */}
        {user && (
          <Card className="bg-neutral-900 border-neutral-800 mb-8">
            <CardHeader>
              <CardTitle className="text-white">Current User</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{user.name}</p>
                  <p className="text-neutral-400">{user.email}</p>
                  <Badge className="mt-2">{user.role}</Badge>
                </div>
                
                <div className="text-right">
                  <p className="text-sm text-neutral-400">Unread Notifications</p>
                  <p className="text-2xl font-bold text-primary-400">{unreadCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Test Configuration */}
        <Card className="bg-neutral-900 border-neutral-800 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Test Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Target User
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select a user</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email}) - {user.role}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-end">
                <Button
                  onClick={runAllTests}
                  disabled={loading || !selectedUser}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Running Tests...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4 mr-2" />
                      Run All Tests
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Individual Test Buttons */}
        <Card className="bg-neutral-900 border-neutral-800 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Individual Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button
                onClick={testEmailNotification}
                disabled={loading || !selectedUser}
                variant="outline"
                className="flex items-center gap-2 h-12"
              >
                <Mail className="h-4 w-4" />
                Test Email
              </Button>
              
              <Button
                onClick={testPushNotification}
                disabled={loading || !selectedUser}
                variant="outline"
                className="flex items-center gap-2 h-12"
              >
                <Smartphone className="h-4 w-4" />
                Test Push
              </Button>
              
              <Button
                onClick={testInAppNotification}
                disabled={loading || !selectedUser}
                variant="outline"
                className="flex items-center gap-2 h-12"
              >
                <Monitor className="h-4 w-4" />
                Test In-App
              </Button>
              
              <Button
                onClick={testMultiChannelNotification}
                disabled={loading || !selectedUser}
                variant="outline"
                className="flex items-center gap-2 h-12"
              >
                <Bell className="h-4 w-4" />
                Multi-Channel
              </Button>
              
              <Button
                onClick={testBulkNotification}
                disabled={loading}
                variant="outline"
                className="flex items-center gap-2 h-12"
              >
                <Users className="h-4 w-4" />
                Bulk Notification
              </Button>
              
              <Button
                onClick={loadNotifications}
                variant="outline"
                className="flex items-center gap-2 h-12"
              >
                <Bell className="h-4 w-4" />
                Refresh Notifications
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Test Results */}
        <Card className="bg-neutral-900 border-neutral-800 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Test Results</CardTitle>
            <CardDescription>Real-time test execution results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 h-64 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-neutral-500 text-center">No test results yet. Run a test to see results here.</p>
              ) : (
                <div className="space-y-1">
                  {testResults.map((result, index) => (
                    <div key={index} className="text-sm font-mono">
                      {result.includes('✅') && <span className="text-green-400">{result}</span>}
                      {result.includes('❌') && <span className="text-red-400">{result}</span>}
                      {result.includes('⚠️') && <span className="text-yellow-400">{result}</span>}
                      {!result.includes('✅') && !result.includes('❌') && !result.includes('⚠️') && (
                        <span className="text-neutral-300">{result}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center mt-4">
              <Button
                onClick={reset}
                variant="outline"
                size="sm"
                disabled={testResults.length === 0}
              >
                Clear Results
              </Button>
              
              <div className="text-sm text-neutral-400">
                {testResults.length} test results
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Recent Notifications */}
        {notifications.length > 0 && (
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Recent Notifications</CardTitle>
              <CardDescription>Latest notifications for testing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notifications.slice(0, 5).map((notification) => (
                  <div key={notification.id} className="flex items-start gap-3 p-3 bg-neutral-800 rounded-lg">
                    <div className="flex-shrink-0">
                      {notification.category === 'report_generated' && <FileText className="h-4 w-4 text-blue-400" />}
                      {notification.category === 'task_assigned' && <ClipboardList className="h-4 w-4 text-green-400" />}
                      {notification.category === 'system_alert' && <AlertTriangle className="h-4 w-4 text-red-400" />}
                      {!['report_generated', 'task_assigned', 'system_alert'].includes(notification.category) && <Bell className="h-4 w-4 text-neutral-400" />}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{notification.title}</h4>
                      <p className="text-sm text-neutral-400 mt-1">{notification.message}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className="text-xs">{notification.category}</Badge>
                        <Badge className="text-xs">{notification.priority}</Badge>
                        <span className="text-xs text-neutral-500">
                          {new Date(notification.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Instructions */}
        <Card className="bg-neutral-900 border-neutral-800 mt-8">
          <CardHeader>
            <CardTitle className="text-white">Test Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-neutral-300">
              <p>
                <strong>1. Email Test:</strong> Sends a test email notification using the Make.com webhook integration.
              </p>
              <p>
                <strong>2. Push Test:</strong> Sends a test push notification via OneSignal (requires user to have push enabled).
              </p>
              <p>
                <strong>3. In-App Test:</strong> Creates an in-app notification that appears in the notification center.
              </p>
              <p>
                <strong>4. Multi-Channel:</strong> Sends the same notification via email, push, and in-app channels.
              </p>
              <p>
                <strong>5. Bulk Notification:</strong> Sends a notification to multiple users at once.
              </p>
              <p>
                <strong>6. Run All Tests:</strong> Executes all tests in sequence to validate the complete notification system.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
