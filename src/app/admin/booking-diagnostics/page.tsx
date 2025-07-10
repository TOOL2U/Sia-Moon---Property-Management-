'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Database,
  Webhook,
  Settings,
  RefreshCw,
  Eye,
  Send
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface DiagnosticResult {
  test: string
  status: 'success' | 'error' | 'warning' | 'pending'
  message: string
  details?: any
  timestamp: string
}

export default function BookingDiagnosticsPage() {
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [testBooking, setTestBooking] = useState({
    villaName: 'Test Villa Diagnostic',
    guestName: 'John Diagnostic Test',
    checkInDate: '2025-08-20',
    checkOutDate: '2025-08-22',
    price: '1200',
    specialRequests: 'Diagnostic test booking from admin panel'
  })

  const addResult = (test: string, status: DiagnosticResult['status'], message: string, details?: any) => {
    const result: DiagnosticResult = {
      test,
      status,
      message,
      details,
      timestamp: new Date().toISOString()
    }
    setResults(prev => [...prev, result])
    return result
  }

  const testWebhookEndpoint = async () => {
    addResult('Webhook Endpoint', 'pending', 'Testing webhook endpoint accessibility...')
    
    try {
      const response = await fetch('/api/booking-test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        addResult('Webhook Endpoint', 'success', 'Webhook endpoint is accessible', data)
        return true
      } else {
        addResult('Webhook Endpoint', 'error', `Webhook endpoint returned ${response.status}: ${response.statusText}`)
        return false
      }
    } catch (error) {
      addResult('Webhook Endpoint', 'error', `Failed to reach webhook endpoint: ${error}`)
      return false
    }
  }

  const testBookingSubmission = async () => {
    addResult('Booking Submission', 'pending', 'Submitting test booking...')
    
    try {
      const response = await fetch('/api/booking-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testBooking)
      })
      
      if (response.ok) {
        const data = await response.json()
        addResult('Booking Submission', 'success', 'Test booking submitted successfully', data)
        
        // Check if live booking was created
        if (data.metadata?.liveBookingCreated) {
          addResult('Live Booking Creation', 'success', `Live booking created with ID: ${data.metadata.liveBookingId}`)
        } else {
          addResult('Live Booking Creation', 'warning', 'Test booking processed but no live booking created', data.metadata)
        }
        
        // Check client matching
        if (data.metadata?.clientMatch) {
          addResult('Client Matching', 'success', `Client matched: ${data.metadata.clientMatch.clientId} (${data.metadata.clientMatch.confidence * 100}% confidence)`)
        } else {
          addResult('Client Matching', 'warning', 'No client match found for test booking')
        }
        
        return data
      } else {
        const errorText = await response.text()
        addResult('Booking Submission', 'error', `Booking submission failed: ${response.status} ${response.statusText}`, errorText)
        return null
      }
    } catch (error) {
      addResult('Booking Submission', 'error', `Booking submission error: ${error}`)
      return null
    }
  }

  const testFirebaseConnection = async () => {
    addResult('Firebase Connection', 'pending', 'Testing Firebase connection...')
    
    try {
      // Test by trying to fetch pending bookings
      const response = await fetch('/api/admin/bookings/pending', {
        method: 'GET'
      })
      
      if (response.ok) {
        const data = await response.json()
        addResult('Firebase Connection', 'success', `Firebase connected. Found ${data.bookings?.length || 0} pending bookings`, data)
        return true
      } else {
        addResult('Firebase Connection', 'warning', 'Firebase connection test endpoint not available - will create it')
        return false
      }
    } catch (error) {
      addResult('Firebase Connection', 'error', `Firebase connection failed: ${error}`)
      return false
    }
  }

  const runFullDiagnostic = async () => {
    setIsRunning(true)
    setResults([])
    
    addResult('Diagnostic Start', 'pending', 'Starting comprehensive booking system diagnostic...')
    
    // Test 1: Webhook endpoint accessibility
    await testWebhookEndpoint()
    
    // Test 2: Firebase connection
    await testFirebaseConnection()
    
    // Test 3: Submit test booking
    await testBookingSubmission()
    
    // Test 4: Check middleware
    addResult('Middleware Check', 'pending', 'Checking middleware configuration...')
    try {
      const middlewareResponse = await fetch('/api/booking-test', {
        method: 'OPTIONS'
      })
      addResult('Middleware Check', 'success', `Middleware allows OPTIONS: ${middlewareResponse.status}`)
    } catch (error) {
      addResult('Middleware Check', 'warning', `Middleware test inconclusive: ${error}`)
    }
    
    addResult('Diagnostic Complete', 'success', 'Diagnostic completed. Review results above.')
    setIsRunning(false)
  }

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'error': return <XCircle className="w-4 h-4 text-red-400" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      case 'pending': return <Clock className="w-4 h-4 text-blue-400 animate-spin" />
    }
  }

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'error': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'warning': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'pending': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <TestTube className="w-8 h-8 text-blue-400" />
            Booking System Diagnostics
          </h1>
          <p className="text-neutral-400">
            Comprehensive testing and debugging for the Make.com → Firebase booking pipeline
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Test Configuration */}
          <Card className="bg-neutral-950 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Test Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Villa Name</label>
                <Input
                  value={testBooking.villaName}
                  onChange={(e) => setTestBooking(prev => ({ ...prev, villaName: e.target.value }))}
                  className="bg-neutral-900 border-neutral-700 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Guest Name</label>
                <Input
                  value={testBooking.guestName}
                  onChange={(e) => setTestBooking(prev => ({ ...prev, guestName: e.target.value }))}
                  className="bg-neutral-900 border-neutral-700 text-white"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Check-in</label>
                  <Input
                    type="date"
                    value={testBooking.checkInDate}
                    onChange={(e) => setTestBooking(prev => ({ ...prev, checkInDate: e.target.value }))}
                    className="bg-neutral-900 border-neutral-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Check-out</label>
                  <Input
                    type="date"
                    value={testBooking.checkOutDate}
                    onChange={(e) => setTestBooking(prev => ({ ...prev, checkOutDate: e.target.value }))}
                    className="bg-neutral-900 border-neutral-700 text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Price</label>
                <Input
                  value={testBooking.price}
                  onChange={(e) => setTestBooking(prev => ({ ...prev, price: e.target.value }))}
                  className="bg-neutral-900 border-neutral-700 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Special Requests</label>
                <Textarea
                  value={testBooking.specialRequests}
                  onChange={(e) => setTestBooking(prev => ({ ...prev, specialRequests: e.target.value }))}
                  className="bg-neutral-900 border-neutral-700 text-white"
                  rows={3}
                />
              </div>
              
              <Button
                onClick={runFullDiagnostic}
                disabled={isRunning}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Running Diagnostics...
                  </>
                ) : (
                  <>
                    <TestTube className="w-4 h-4 mr-2" />
                    Run Full Diagnostic
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Diagnostic Results */}
          <Card className="bg-neutral-950 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Diagnostic Results
                {results.length > 0 && (
                  <Badge variant="secondary" className="bg-neutral-700 text-neutral-300">
                    {results.length} tests
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.length === 0 ? (
                <div className="text-center py-8">
                  <TestTube className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                  <p className="text-neutral-400">No diagnostic results yet</p>
                  <p className="text-neutral-500 text-sm">Run the diagnostic to see results</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className="p-3 bg-neutral-900 rounded-lg border border-neutral-700"
                    >
                      <div className="flex items-start gap-3">
                        {getStatusIcon(result.status)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-white">{result.test}</span>
                            <Badge
                              variant="secondary"
                              className={getStatusColor(result.status)}
                            >
                              {result.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-neutral-300">{result.message}</p>
                          {result.details && (
                            <details className="mt-2">
                              <summary className="text-xs text-neutral-500 cursor-pointer">
                                View Details
                              </summary>
                              <pre className="text-xs text-neutral-400 mt-1 p-2 bg-neutral-800 rounded overflow-x-auto">
                                {JSON.stringify(result.details, null, 2)}
                              </pre>
                            </details>
                          )}
                          <p className="text-xs text-neutral-500 mt-1">
                            {new Date(result.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
