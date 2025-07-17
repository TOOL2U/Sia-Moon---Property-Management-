'use client'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { clientToast as toast } from '@/utils/clientToast'
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Loader2,
  RefreshCw,
  Smartphone,
  TestTube,
  Users,
  Wifi,
  WifiOff,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface MobileStatus {
  activeStaffCount: number
  testJobsCount: number
  deviceTokens: {
    totalTokens: number
    activeTokens: number
    platforms: {
      ios: number
      android: number
      web: number
    }
  }
  firebaseAdminConfigured: boolean
  timestamp: string
}

export function MobileIntegrationStatus() {
  const [status, setStatus] = useState<MobileStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Load mobile integration status
  const loadStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        '/api/admin/test-mobile-integration?action=status'
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON')
      }

      const data = await response.json()

      if (data.success) {
        setStatus(data.status)
        setLastRefresh(new Date())
      } else {
        toast.error('Failed to load mobile status')
        console.error('Failed to load mobile status:', data.error)
      }
    } catch (error) {
      toast.error('Error loading mobile status')
      console.error('Error loading mobile status:', error)

      // Set default status if API fails
      setStatus({
        activeStaffCount: 0,
        testJobsCount: 0,
        deviceTokens: {
          totalTokens: 0,
          activeTokens: 0,
          platforms: {
            ios: 0,
            android: 0,
            web: 0,
          },
        },
        firebaseAdminConfigured: false,
        timestamp: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }

  // Send test job to mobile app
  const sendTestJob = async () => {
    try {
      setTesting(true)
      const response = await fetch('/api/admin/test-mobile-integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_test_job' }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(
          `✅ Test job created!\nAssigned to: ${data.data.assignedStaffName}`
        )
        console.log('Test job created:', data.data)

        // Refresh status
        await loadStatus()
      } else {
        toast.error(`❌ Failed to create test job: ${data.error}`)
      }
    } catch (error) {
      toast.error('Error creating test job')
      console.error('Error creating test job:', error)
    } finally {
      setTesting(false)
    }
  }

  // Send test notification
  const sendTestNotification = async () => {
    try {
      setTesting(true)
      const response = await fetch('/api/admin/test-mobile-integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_notifications' }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(
          `✅ Test notifications sent to ${data.data.staffCount} staff members`
        )
        console.log('Test notifications sent:', data.data)
      } else {
        toast.error(`❌ Failed to send test notifications: ${data.error}`)
      }
    } catch (error) {
      toast.error('Error sending test notifications')
      console.error('Error sending test notifications:', error)
    } finally {
      setTesting(false)
    }
  }

  // Create test job suite
  const createTestSuite = async () => {
    try {
      setTesting(true)
      const response = await fetch('/api/admin/test-mobile-integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_test_suite' }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(
          `✅ Test suite created!\n${data.data.jobsCreated} jobs assigned to staff`
        )
        console.log('Test suite created:', data.data)

        // Refresh status
        await loadStatus()
      } else {
        toast.error(`❌ Failed to create test suite: ${data.error}`)
      }
    } catch (error) {
      toast.error('Error creating test suite')
      console.error('Error creating test suite:', error)
    } finally {
      setTesting(false)
    }
  }

  useEffect(() => {
    loadStatus()

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !status) {
    return (
      <Card className="bg-neutral-900 border-neutral-800">
        <CardContent className="flex items-center justify-center h-48">
          <div className="flex items-center gap-2 text-neutral-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading mobile integration status...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStatusIcon = (isConnected: boolean) => {
    return isConnected ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    )
  }

  const getStatusBadge = (isConnected: boolean, label: string) => {
    return (
      <Badge variant={isConnected ? 'success' : 'destructive'}>
        {isConnected ? '✅' : '❌'} {label}
      </Badge>
    )
  }

  return (
    <Card className="bg-neutral-900 border-neutral-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          Mobile App Integration
        </CardTitle>
        <div className="flex items-center gap-2">
          {lastRefresh && (
            <span className="text-xs text-neutral-400">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={loadStatus}
            disabled={loading}
            className="border-neutral-700 hover:bg-neutral-800"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Status Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-neutral-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-neutral-300">Active Staff</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {status?.activeStaffCount || 0}
            </div>
          </div>

          <div className="bg-neutral-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TestTube className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-neutral-300">Test Jobs</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {status?.testJobsCount || 0}
            </div>
          </div>

          <div className="bg-neutral-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="w-4 h-4 text-green-400" />
              <span className="text-sm text-neutral-300">Device Tokens</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {status?.deviceTokens?.activeTokens || 0}/
              {status?.deviceTokens?.totalTokens || 0}
            </div>
          </div>

          <div className="bg-neutral-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              {status?.firebaseAdminConfigured ? (
                <Wifi className="w-4 h-4 text-green-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" />
              )}
              <span className="text-sm text-neutral-300">Firebase Admin</span>
            </div>
            <div className="text-sm font-medium">
              {getStatusBadge(
                status?.firebaseAdminConfigured || false,
                status?.firebaseAdminConfigured ? 'Connected' : 'Not Configured'
              )}
            </div>
          </div>
        </div>

        {/* Platform Breakdown */}
        {status?.deviceTokens && (
          <div className="bg-neutral-800 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">Device Platforms</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-white">
                  {status.deviceTokens?.platforms?.ios || 0}
                </div>
                <div className="text-xs text-neutral-400">iOS</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-white">
                  {status.deviceTokens?.platforms?.android || 0}
                </div>
                <div className="text-xs text-neutral-400">Android</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-white">
                  {status.deviceTokens?.platforms?.web || 0}
                </div>
                <div className="text-xs text-neutral-400">Web</div>
              </div>
            </div>
          </div>
        )}

        {/* Test Actions */}
        <div className="bg-neutral-800 rounded-lg p-4">
          <h4 className="text-white font-medium mb-3">Mobile App Testing</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              onClick={sendTestJob}
              disabled={testing}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {testing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <TestTube className="w-4 h-4 mr-2" />
              )}
              Send Test Job
            </Button>

            <Button
              onClick={sendTestNotification}
              disabled={testing}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {testing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Bell className="w-4 h-4 mr-2" />
              )}
              Test Notifications
            </Button>

            <Button
              onClick={createTestSuite}
              disabled={testing}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {testing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <TestTube className="w-4 h-4 mr-2" />
              )}
              Create Test Suite
            </Button>
          </div>
        </div>

        {/* Warnings */}
        {!status?.firebaseAdminConfigured && (
          <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-400">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">
                Firebase Admin SDK Not Configured
              </span>
            </div>
            <p className="text-sm text-yellow-300 mt-1">
              Push notifications will be queued but not sent. Configure
              FIREBASE_PRIVATE_KEY environment variable.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
