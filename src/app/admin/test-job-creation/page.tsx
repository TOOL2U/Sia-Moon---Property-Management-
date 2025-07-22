'use client'

/**
 * Test page for automatic job creation system
 */

import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { clientToast as toast } from '@/utils/clientToast'
import { useState } from 'react'

export default function TestJobCreationPage() {
  const [bookingId, setBookingId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleCreateJobs = async () => {
    if (!bookingId.trim()) {
      toast.error('Please enter a booking ID')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/bookings/create-jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookingId: bookingId.trim() }),
      })

      const data = await response.json()
      setResult(data)

      if (data.success) {
        toast.success(`Successfully created ${data.jobsCreated} jobs!`)
      } else {
        toast.error(data.error || 'Failed to create jobs')
      }
    } catch (error) {
      console.error('Error creating jobs:', error)
      toast.error('Failed to create jobs')
      setResult({ success: false, error: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  const handleCheckStatus = async () => {
    if (!bookingId.trim()) {
      toast.error('Please enter a booking ID')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/bookings/create-jobs?bookingId=${bookingId.trim()}`)
      const data = await response.json()
      setResult(data)

      if (data.success) {
        toast.success('Status retrieved successfully')
      } else {
        toast.error(data.error || 'Failed to get status')
      }
    } catch (error) {
      console.error('Error checking status:', error)
      toast.error('Failed to check status')
      setResult({ success: false, error: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSampleBooking = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/test/create-sample-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      setResult(data)

      if (data.success) {
        setBookingId(data.bookingId)
        toast.success(`Sample booking created: ${data.bookingId}`)
      } else {
        toast.error(data.error || 'Failed to create sample booking')
      }
    } catch (error) {
      console.error('Error creating sample booking:', error)
      toast.error('Failed to create sample booking')
      setResult({ success: false, error: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  const handleEnsureStaffAccount = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/test/ensure-staff-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      setResult(data)

      if (data.success) {
        toast.success('Staff account ready for job assignment')
      } else {
        toast.error(data.error || 'Failed to ensure staff account')
      }
    } catch (error) {
      console.error('Error ensuring staff account:', error)
      toast.error('Failed to ensure staff account')
      setResult({ success: false, error: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">
          🧪 Automatic Job Creation Test
        </h1>

        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Test Job Creation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Booking ID
              </label>
              <Input
                type="text"
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                placeholder="Enter booking ID to test job creation"
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div className="flex gap-4 flex-wrap">
              <Button
                onClick={handleEnsureStaffAccount}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {loading ? 'Checking...' : 'Ensure Staff Account'}
              </Button>

              <Button
                onClick={handleCreateSampleBooking}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Creating...' : 'Create Sample Booking'}
              </Button>

              <Button
                onClick={handleCreateJobs}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Creating...' : 'Create Jobs'}
              </Button>

              <Button
                onClick={handleCheckStatus}
                disabled={loading}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                {loading ? 'Checking...' : 'Check Status'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {result && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">
                {result.success ? '✅ Result' : '❌ Error'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm text-gray-300 bg-gray-900 p-4 rounded overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        <Card className="bg-gray-800 border-gray-700 mt-6">
          <CardHeader>
            <CardTitle className="text-white">📋 Standard Jobs Created</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-300 space-y-2">
              <p>When a booking is approved, the system automatically creates these 7 standard jobs:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Pre-arrival Cleaning</strong> - 24 hours before check-in (3 hours)</li>
                <li><strong>Property Inspection</strong> - 2 hours before check-in (1 hour)</li>
                <li><strong>Guest Check-in Setup</strong> - 30 minutes before check-in (30 minutes)</li>
                <li><strong>Mid-stay Maintenance Check</strong> - At midpoint for stays &gt; 3 days (45 minutes)</li>
                <li><strong>Pre-departure Inspection</strong> - 2 hours before check-out (30 minutes)</li>
                <li><strong>Post-checkout Cleaning</strong> - Immediately after check-out (2.5 hours)</li>
                <li><strong>Property Reset and Inventory</strong> - 1 hour after check-out (1 hour)</li>
              </ul>
              <p className="mt-4">
                <strong>All jobs are automatically assigned to:</strong> staff@siamoon.com
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 mt-6">
          <CardHeader>
            <CardTitle className="text-white">🔧 How to Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-300 space-y-2">
              <ol className="list-decimal list-inside space-y-2">
                <li><strong>Setup:</strong> Click "Ensure Staff Account" to create/verify staff@siamoon.com exists</li>
                <li><strong>Create Booking:</strong> Click "Create Sample Booking" to automatically create an approved booking</li>
                <li>The booking ID will be filled in automatically</li>
                <li><strong>Test Jobs:</strong> Click "Create Jobs" to manually trigger job creation (or wait for automatic creation)</li>
                <li>Check the jobs collection and calendar to see the created jobs</li>
                <li>Use "Check Status" to see if jobs were already created</li>
              </ol>
              <p className="mt-4 text-blue-400">
                <strong>Alternative:</strong> Manually create a booking with status 'approved' and enter its ID above.
              </p>
              <p className="mt-2 text-yellow-400">
                <strong>Note:</strong> Jobs are only created once per booking. The automatic system monitors for approved bookings and creates jobs immediately.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
