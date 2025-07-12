'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { 
  Brain, 
  TestTube, 
  Play, 
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Target,
  Eye,
  Bot
} from 'lucide-react'
import toast from 'react-hot-toast'

interface TestResult {
  success: boolean
  message: string
  booking_id?: string
  ai_analysis?: any // eslint-disable-line @typescript-eslint/no-explicit-any
  test_booking?: Record<string, unknown>
  error?: string
}

export default function AIBookingAnalysisTestPage() {
  const [loading, setLoading] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [recentBookings, setRecentBookings] = useState<Record<string, unknown>[]>([])
  const [customBookingData, setCustomBookingData] = useState({
    guest_name: 'Jane Smith',
    guest_email: 'jane.smith@example.com',
    guest_phone: '+1234567890',
    check_in: '2025-09-15',
    check_out: '2025-09-20',
    guests: 4,
    total_amount: 2500,
    currency: 'USD',
    source: 'Booking.com',
    notes: 'Looking for a 4-bedroom villa with ocean view and private pool'
  })

  const runTestBooking = async () => {
    try {
      setLoading(true)
      setTestResult(null)
      
      const response = await fetch('/api/test/ai-booking-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_test_booking' })
      })

      const result = await response.json()
      setTestResult(result)
      
      if (result.success) {
        toast.success('Test booking created and AI analysis completed!')
      } else {
        toast.error(result.error || 'Test failed')
      }
    } catch (error) {
      console.error('Test error:', error)
      toast.error('Failed to run test')
      setTestResult({
        success: false,
        message: 'Failed to run test',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  const runCustomBookingTest = async () => {
    try {
      setLoading(true)
      setTestResult(null)
      
      const bookingData = {
        id: `test-${Date.now()}`,
        property_id: '',
        ...customBookingData,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const response = await fetch('/api/ai-booking-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_data: bookingData })
      })

      const result = await response.json()
      setTestResult(result)
      
      if (result.success) {
        toast.success('Custom booking AI analysis completed!')
      } else {
        toast.error(result.error || 'Analysis failed')
      }
    } catch (error) {
      console.error('Custom test error:', error)
      toast.error('Failed to run custom test')
      setTestResult({
        success: false,
        message: 'Failed to run custom test',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadRecentBookings = async () => {
    try {
      const response = await fetch('/api/test/ai-booking-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list_recent_bookings' })
      })

      const result = await response.json()
      if (result.success) {
        setRecentBookings(result.bookings || [])
        toast.success('Recent bookings loaded')
      } else {
        toast.error(result.error || 'Failed to load bookings')
      }
    } catch (error) {
      console.error('Load bookings error:', error)
      toast.error('Failed to load recent bookings')
    }
  }

  const analyzeExistingBooking = async (bookingId: string) => {
    try {
      setLoading(true)
      setTestResult(null)
      
      const response = await fetch('/api/ai-booking-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId })
      })

      const result = await response.json()
      setTestResult(result)
      
      if (result.success) {
        toast.success('Existing booking analyzed!')
      } else {
        toast.error(result.error || 'Analysis failed')
      }
    } catch (error) {
      console.error('Analyze existing booking error:', error)
      toast.error('Failed to analyze existing booking')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'needs_review':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'needs_review':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Bot className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">AI Booking Analysis Test</h1>
          </div>
          <p className="text-gray-600">
            Test the AI Property Management Agent with sample bookings and analyze the results.
          </p>
        </div>

        {/* Test Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="w-5 h-5" />
                Quick Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Create a test booking and run AI analysis automatically.
              </p>
              <Button 
                onClick={runTestBooking}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Running Test...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Test Booking
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Custom Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Guest Name
                  </label>
                  <Input
                    value={customBookingData.guest_name}
                    onChange={(e) => setCustomBookingData({...customBookingData, guest_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Guest Email
                  </label>
                  <Input
                    value={customBookingData.guest_email}
                    onChange={(e) => setCustomBookingData({...customBookingData, guest_email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Check-in
                  </label>
                  <Input
                    type="date"
                    value={customBookingData.check_in}
                    onChange={(e) => setCustomBookingData({...customBookingData, check_in: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Check-out
                  </label>
                  <Input
                    type="date"
                    value={customBookingData.check_out}
                    onChange={(e) => setCustomBookingData({...customBookingData, check_out: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Guests
                  </label>
                  <Input
                    type="number"
                    value={customBookingData.guests}
                    onChange={(e) => setCustomBookingData({...customBookingData, guests: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Amount
                  </label>
                  <Input
                    type="number"
                    value={customBookingData.total_amount}
                    onChange={(e) => setCustomBookingData({...customBookingData, total_amount: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Booking Notes
                </label>
                <textarea
                  value={customBookingData.notes}
                  onChange={(e) => setCustomBookingData({...customBookingData, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
              <Button 
                onClick={runCustomBookingTest}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Run Custom Analysis
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bookings */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Recent Bookings
              </CardTitle>
              <Button onClick={loadRecentBookings} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Load Recent
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentBookings.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No recent bookings loaded. Click Load Recent to view existing bookings.
              </p>
            ) : (
              <div className="space-y-3">
                {recentBookings.map((booking, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{String(booking.guest_name || 'Unknown Guest')}</p>
                      <p className="text-sm text-gray-600">
                        {String(booking.check_in || 'N/A')} to {String(booking.check_out || 'N/A')} • {String(booking.guests || 0)} guests
                      </p>
                      <p className="text-xs text-gray-500">
                        {String(booking.source || 'Unknown')} • {String(booking.currency || 'USD')} {String(booking.total_amount || 0)}
                      </p>
                    </div>
                    <Button
                      onClick={() => analyzeExistingBooking(String(booking.id || ''))}
                      size="sm"
                      disabled={loading}
                    >
                      <Brain className="w-4 h-4 mr-1" />
                      Analyze
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Results */}
        {testResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(testResult.success ? (
                  (testResult.ai_analysis as any)?.analysis?.status || 'success'
                ) : 'error')}
                Test Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {testResult.success ? 'Success' : 'Failed'}
                </Badge>
                <span className="text-sm text-gray-600">{testResult.message}</span>
              </div>

              {testResult.success && testResult.ai_analysis?.analysis && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-900">Status</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusIcon((testResult.ai_analysis as any).analysis?.status || 'unknown')}
                        <Badge className={getStatusColor((testResult.ai_analysis as any).analysis?.status || 'unknown')}>
                          {(testResult.ai_analysis as any).analysis?.status || 'unknown'}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium text-green-900">Confidence</p>
                      <p className="text-lg font-bold text-green-800 mt-1">
                        {(testResult.ai_analysis as any).analysis?.confidence_score || 0}%
                      </p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm font-medium text-purple-900">Property Match</p>
                      <p className="text-sm text-purple-800 mt-1">
                        {(testResult.ai_analysis as any).analysis?.matched_property_id || 'No match'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">AI Summary</p>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {(testResult.ai_analysis as any).analysis?.summary || 'No summary available'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">AI Reasoning</p>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {(testResult.ai_analysis as any).analysis?.reasoning || 'No reasoning available'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Suggested Actions</p>
                    <div className="flex flex-wrap gap-2">
                      {((testResult.ai_analysis as any).analysis?.suggested_actions || []).map((action: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {String(action).replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {!testResult.success && testResult.error && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-sm font-medium text-red-900">Error Details</p>
                  <p className="text-sm text-red-800 mt-1">{testResult.error}</p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-4 border-t">
                <Button
                  onClick={() => window.open('/admin/ai-log', '_blank')}
                  variant="outline"
                  size="sm"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View AI Log
                </Button>
                {testResult.booking_id && (
                  <Button
                    onClick={() => window.open(`/admin/bookings?search=${testResult.booking_id}`, '_blank')}
                    variant="outline"
                    size="sm"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Booking
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
