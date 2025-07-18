'use client'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { clientToast as toast } from '@/utils/clientToast'
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw,
  Settings,
  Smartphone,
  UserCheck,
  Users,
  UserX,
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface StaffStatus {
  email: string
  name: string
  isReady: boolean
  firebaseUid?: string
  issues?: string[]
}

interface SetupSummary {
  totalStaff: number
  readyStaff: number
  notReadyStaff: number
  readinessPercentage: number
}

export default function MobileStaffSetupPanel() {
  const [loading, setLoading] = useState(false)
  const [setupStatus, setSetupStatus] = useState<SetupSummary | null>(null)
  const [staffList, setStaffList] = useState<StaffStatus[]>([])
  const [showDetails, setShowDetails] = useState(false)

  // Load initial status
  useEffect(() => {
    loadSetupStatus()
  }, [])

  const loadSetupStatus = async () => {
    try {
      const response = await fetch(
        '/api/admin/setup-mobile-staff?action=status'
      )
      const data = await response.json()

      if (data.success) {
        setSetupStatus(data.data.summary)
      }
    } catch (error) {
      console.error('Error loading setup status:', error)
    }
  }

  const loadStaffDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        '/api/admin/setup-mobile-staff?action=staff_list'
      )
      const data = await response.json()

      if (data.success) {
        setStaffList(data.data.staffStatus)
        setSetupStatus(data.data.summary)
        setShowDetails(true)
      } else {
        toast.error('Failed to load staff details')
      }
    } catch (error) {
      toast.error('Error loading staff details')
      console.error('Error loading staff details:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupAllStaff = async () => {
    try {
      setLoading(true)
      toast.loading('Setting up all staff for mobile app...', {
        id: 'setup-staff',
      })

      const response = await fetch('/api/admin/setup-mobile-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setup_all_staff' }),
      })

      const data = await response.json()

      if (data.success) {
        const { summary } = data.data
        toast.success(
          `✅ Mobile setup complete!\n` +
            `${summary.newlySetup} staff newly setup\n` +
            `${summary.alreadySetup} already ready\n` +
            `${summary.failed} failed`,
          { id: 'setup-staff', duration: 6000 }
        )

        // Refresh status
        await loadSetupStatus()
        if (showDetails) {
          await loadStaffDetails()
        }
      } else {
        toast.error(`❌ Setup failed: ${data.error}`, { id: 'setup-staff' })
      }
    } catch (error) {
      toast.error('Error setting up staff for mobile', { id: 'setup-staff' })
      console.error('Error setting up staff:', error)
    } finally {
      setLoading(false)
    }
  }

  const verifyStaffReadiness = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/setup-mobile-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_staff_readiness' }),
      })

      const data = await response.json()

      if (data.success) {
        const { summary } = data.data
        setSetupStatus(summary)
        toast.success(
          `📊 Verification complete!\n` +
            `${summary.readyStaff}/${summary.totalStaff} staff ready (${summary.readinessPercentage}%)`
        )
      } else {
        toast.error('Failed to verify staff readiness')
      }
    } catch (error) {
      toast.error('Error verifying staff readiness')
      console.error('Error verifying staff:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (percentage: number) => {
    if (percentage === 100) return 'text-green-400'
    if (percentage >= 80) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getStatusBadge = (isReady: boolean) => {
    if (isReady) {
      return <Badge className="bg-green-600 text-white">Ready</Badge>
    }
    return <Badge className="bg-red-600 text-white">Not Ready</Badge>
  }

  return (
    <Card className="bg-neutral-900 border-neutral-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          Mobile Staff Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Overview */}
        {setupStatus && (
          <div className="bg-neutral-800 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">Setup Status</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {setupStatus.totalStaff}
                </div>
                <div className="text-sm text-neutral-400">Total Staff</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {setupStatus.readyStaff}
                </div>
                <div className="text-sm text-neutral-400">Ready</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">
                  {setupStatus.notReadyStaff}
                </div>
                <div className="text-sm text-neutral-400">Not Ready</div>
              </div>
              <div className="text-center">
                <div
                  className={`text-2xl font-bold ${getStatusColor(setupStatus.readinessPercentage)}`}
                >
                  {setupStatus.readinessPercentage}%
                </div>
                <div className="text-sm text-neutral-400">Ready</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            onClick={setupAllStaff}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Settings className="w-4 h-4 mr-2" />
            )}
            Setup All Staff
          </Button>

          <Button
            onClick={verifyStaffReadiness}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Verify Status
          </Button>

          <Button
            onClick={loadStaffDetails}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Users className="w-4 h-4 mr-2" />
            )}
            View Details
          </Button>
        </div>

        {/* Staff Details */}
        {showDetails && staffList.length > 0 && (
          <div className="bg-neutral-800 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">Staff Details</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {staffList.map((staff, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-neutral-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {staff.isReady ? (
                      <UserCheck className="w-5 h-5 text-green-400" />
                    ) : (
                      <UserX className="w-5 h-5 text-red-400" />
                    )}
                    <div>
                      <div className="text-white font-medium">{staff.name}</div>
                      <div className="text-sm text-neutral-400">
                        {staff.email}
                      </div>
                      {staff.firebaseUid && (
                        <div className="text-xs text-neutral-500">
                          UID: {staff.firebaseUid.substring(0, 8)}...
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(staff.isReady)}
                    {staff.issues && staff.issues.length > 0 && (
                      <div className="text-xs text-red-400">
                        {staff.issues.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Mobile Staff Setup Instructions</span>
          </div>
          <div className="text-sm text-blue-300 space-y-1">
            <p>
              1. <strong>Setup All Staff</strong>: Creates Firebase Auth
              accounts for all staff members
            </p>
            <p>
              2. <strong>Verify Status</strong>: Checks which staff are ready
              for mobile app
            </p>
            <p>
              3. <strong>View Details</strong>: Shows individual staff readiness
              status
            </p>
            <p>
              4. Staff will receive password reset emails to set their mobile
              app passwords
            </p>
          </div>
        </div>

        {/* Success Indicator */}
        {setupStatus && setupStatus.readinessPercentage === 100 && (
          <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">
                All Staff Ready for Mobile App! 🎉
              </span>
            </div>
            <p className="text-sm text-green-300 mt-1">
              All {setupStatus.totalStaff} staff members can now receive job
              assignments on the mobile app.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
