'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Play,
  Users,
  Calendar,
  ArrowRight,
  Database,
  Target
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface TestResult {
  step: string
  status: 'pending' | 'running' | 'success' | 'error'
  message: string
  data?: Record<string, unknown>
  timestamp: string
}

interface TestBooking {
  id: string
  villaName: string
  guestName: string
  status: string
}

export default function BookingApprovalTestPage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [testBooking, setTestBooking] = useState<TestBooking | null>(null)

  const addResult = (step: string, status: TestResult['status'], message: string, data?: Record<string, unknown>) => {
    const result: TestResult = {
      step,
      status,
      message,
      data,
      timestamp: new Date().toLocaleTimeString()
    }
    setResults(prev => [...prev, result])
  }

  const clearResults = () => {
    setResults([])
    setTestBooking(null)
  }

  const runComprehensiveTest = async () => {
    setIsRunning(true)
    clearResults()
    
    try {
      // Step 1: Create a test booking
      addResult('Create Test Booking', 'running', 'Creating a test booking for "Donkey House"...')
      
      const createResponse = await fetch('/api/booking-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: 'Test Guest for Approval',
          guestEmail: 'test.approval@example.com',
          checkInDate: '2025-08-20',
          checkOutDate: '2025-08-22',
          villaName: 'Donkey House',
          propertyId: 'DONKEY001',
          bookingReference: `APPROVAL-TEST-${Date.now()}`,
          price: 2000,
          skipClientMatching: true // We'll test approval matching instead
        })
      })

      if (!createResponse.ok) {
        throw new Error(`Failed to create test booking: ${createResponse.status}`)
      }

      const createData = await createResponse.json()
      
      if (!createData.success || !createData.booking?.id) {
        throw new Error('Test booking creation failed')
      }

      const bookingId = createData.booking.id
      setTestBooking({
        id: bookingId,
        villaName: createData.booking.villaName,
        guestName: createData.booking.guestName,
        status: 'pending_approval'
      })

      addResult('Create Test Booking', 'success', `Test booking created: ${bookingId}`, {
        bookingId,
        villaName: createData.booking.villaName,
        status: 'pending_approval'
      })

      // Step 2: Approve the booking (this should trigger client matching)
      addResult('Approve Booking', 'running', 'Approving booking (should trigger client matching)...')
      
      const approveResponse = await fetch('/api/test/booking-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: bookingId,
          status: 'approved',
          adminNotes: 'Approved via automated test - testing client profile matching'
        })
      })

      if (!approveResponse.ok) {
        throw new Error(`Failed to approve booking: ${approveResponse.status}`)
      }

      const approveData = await approveResponse.json()
      
      if (!approveData.success) {
        throw new Error('Booking approval failed')
      }

      setTestBooking(prev => prev ? { ...prev, status: 'approved' } : null)

      addResult('Approve Booking', 'success', 'Booking approved successfully', {
        clientMatchingTriggered: approveData.clientMatchingTriggered,
        bookingId: bookingId,
        status: 'approved'
      })

      // Step 3: Wait a moment for async processes
      addResult('Processing', 'running', 'Waiting for client matching process to complete...')
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Step 4: Check if the booking was added to client profile
      addResult('Verify Client Matching', 'running', 'Checking if booking was matched to client profile...')
      
      const verifyResponse = await fetch(`/api/debug/client-matching?bookingId=${bookingId}`)
      
      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json()
        
        if (verifyData.success && verifyData.clientMatch) {
          addResult('Verify Client Matching', 'success', `Client match found: ${verifyData.clientMatch.profileEmail}`, {
            clientId: verifyData.clientMatch.clientId,
            profileEmail: verifyData.clientMatch.profileEmail,
            confidence: verifyData.clientMatch.confidence,
            matchMethod: verifyData.clientMatch.matchMethod
          })
        } else {
          addResult('Verify Client Matching', 'error', 'No client match found or client matching failed', verifyData)
        }
      } else {
        addResult('Verify Client Matching', 'error', 'Failed to verify client matching')
      }

      // Step 5: Check client bookings collection
      addResult('Check Client Bookings', 'running', 'Checking if booking appears in client bookings collection...')
      
      const clientBookingsResponse = await fetch('/api/debug/recent-bookings?limit=10')
      
      if (clientBookingsResponse.ok) {
        const clientBookingsData = await clientBookingsResponse.json()
        
        if (clientBookingsData.success) {
          const matchedBooking = clientBookingsData.bookings?.find((b: Record<string, unknown>) => 
            b.bookingId === bookingId || b.originalBookingId === bookingId
          )
          
          if (matchedBooking) {
            addResult('Check Client Bookings', 'success', 'Booking found in client bookings collection', {
              clientBooking: matchedBooking
            })
          } else {
            addResult('Check Client Bookings', 'error', 'Booking not found in client bookings collection')
          }
        } else {
          addResult('Check Client Bookings', 'error', 'Failed to fetch client bookings')
        }
      } else {
        addResult('Check Client Bookings', 'error', 'Failed to check client bookings')
      }

      toast.success('Comprehensive test completed!')

    } catch (error) {
      console.error('Test error:', error)
      addResult('Test Error', 'error', error instanceof Error ? error.message : 'Unknown error occurred')
      toast.error('Test failed - check results for details')
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return <TestTube className="w-4 h-4 text-gray-400" />
      case 'running': return <Play className="w-4 h-4 text-blue-400 animate-spin" />
      case 'success': return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'error': return <XCircle className="w-4 h-4 text-red-400" />
    }
  }

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return 'bg-gray-500/20 text-gray-400'
      case 'running': return 'bg-blue-500/20 text-blue-400'
      case 'success': return 'bg-green-500/20 text-green-400'
      case 'error': return 'bg-red-500/20 text-red-400'
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            🎯 Booking Approval → Client Matching Test
          </h1>
          <p className="text-gray-400 text-lg">
            Test the automated client profile matching when bookings are approved
          </p>
        </div>

        {/* Test Overview */}
        <Card className="bg-gray-900/50 border-gray-800 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              Test Workflow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="bg-blue-500/20 p-3 rounded-lg mb-2">
                  <Database className="w-6 h-6 text-blue-400 mx-auto" />
                </div>
                <p className="text-sm font-medium">Create Test Booking</p>
                <p className="text-xs text-gray-400">For &quot;Donkey House&quot;</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-600 mx-auto self-center" />
              <div className="text-center">
                <div className="bg-green-500/20 p-3 rounded-lg mb-2">
                  <CheckCircle className="w-6 h-6 text-green-400 mx-auto" />
                </div>
                <p className="text-sm font-medium">Approve Booking</p>
                <p className="text-xs text-gray-400">Triggers matching</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-600 mx-auto self-center" />
              <div className="text-center">
                <div className="bg-purple-500/20 p-3 rounded-lg mb-2">
                  <Users className="w-6 h-6 text-purple-400 mx-auto" />
                </div>
                <p className="text-sm font-medium">Match Client Profile</p>
                <p className="text-xs text-gray-400">Auto-add to donkey@gmail.com</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Test Booking */}
        {testBooking && (
          <Card className="bg-gray-900/50 border-gray-800 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-400" />
                Current Test Booking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Booking ID</p>
                  <p className="font-mono text-sm bg-gray-800 px-2 py-1 rounded">{testBooking.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Villa</p>
                  <p className="font-medium">{testBooking.villaName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Guest</p>
                  <p className="font-medium">{testBooking.guestName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <Badge className={
                    testBooking.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                    testBooking.status === 'pending_approval' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-gray-500/20 text-gray-400'
                  }>
                    {testBooking.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Controls */}
        <Card className="bg-gray-900/50 border-gray-800 mb-6">
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button 
                onClick={runComprehensiveTest}
                disabled={isRunning}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isRunning ? (
                  <>
                    <Play className="w-4 h-4 mr-2 animate-spin" />
                    Running Test...
                  </>
                ) : (
                  <>
                    <TestTube className="w-4 h-4 mr-2" />
                    Run Comprehensive Test
                  </>
                )}
              </Button>
              
              <Button 
                onClick={clearResults}
                disabled={isRunning}
                variant="outline"
                className="border-gray-600 hover:bg-gray-800"
              >
                Clear Results
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        {results.length > 0 && (
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="w-5 h-5 text-blue-400" />
                Test Results ({results.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div key={index} className="border-l-2 border-gray-700 pl-4">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(result.status)}
                      <span className="font-medium">{result.step}</span>
                      <Badge className={getStatusColor(result.status)}>
                        {result.status}
                      </Badge>
                      <span className="text-xs text-gray-500 ml-auto">{result.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">{result.message}</p>
                    {result.data && (
                      <div className="bg-gray-800 p-3 rounded text-xs font-mono text-gray-300 overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
