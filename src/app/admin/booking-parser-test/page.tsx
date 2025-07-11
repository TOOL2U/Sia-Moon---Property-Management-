'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Textarea } from '@/components/ui/Textarea'
import { 
  TestTube, 
  Play,
  RotateCcw
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface TestCase {
  name: string
  description: string
  payload: any
  expectedResult: 'success' | 'error' | 'warning'
}

const testCases: TestCase[] = [
  {
    name: 'Perfect Booking.com Email',
    description: 'Complete booking data with all fields',
    payload: {
      guestName: 'John Smith',
      guestEmail: 'john.smith@email.com',
      checkInDate: '2025-08-15',
      checkOutDate: '2025-08-17',
      villaName: 'Villa Sunset Paradise',
      propertyId: 'VSP001',
      bookingReference: 'BDC-123456789',
      price: '$1,250.00',
      currency: 'USD',
      guests: 2,
      specialRequests: 'Late check-in requested, vegetarian breakfast',
      bookingSource: 'booking.com',
      paymentStatus: 'paid'
    },
    expectedResult: 'success'
  },
  {
    name: 'Airbnb Format',
    description: 'Airbnb-style field names',
    payload: {
      guest_name: 'Maria Rodriguez',
      customer_email: 'maria.r@gmail.com',
      checkin: '2025-09-01',
      checkout: '2025-09-05',
      property: 'Ocean View Villa',
      confirmation_number: 'ABB987654321',
      total_amount: 2800,
      numberOfGuests: '4',
      requests: 'Pool access needed, early check-in if possible',
      platform: 'airbnb'
    },
    expectedResult: 'success'
  },
  {
    name: 'European Date Format',
    description: 'DD/MM/YYYY dates and European currency',
    payload: {
      guestName: 'Pierre Dubois',
      guestEmail: 'pierre@example.fr',
      checkIn: '15/08/2025',
      checkOut: '20/08/2025',
      accommodation: 'Château de Lumière',
      bookingId: 'EUR-789123',
      price: '€1.850,50',
      guests: 3,
      source: 'direct booking'
    },
    expectedResult: 'success'
  },
  {
    name: 'Minimal Required Data',
    description: 'Only essential fields provided',
    payload: {
      guestName: 'Jane Doe',
      checkInDate: '2025-07-20',
      checkOutDate: '2025-07-22',
      villaName: 'Simple Villa',
      price: 500
    },
    expectedResult: 'warning'
  },
  {
    name: 'Missing Guest Name',
    description: 'Critical field missing',
    payload: {
      checkInDate: '2025-08-01',
      checkOutDate: '2025-08-03',
      villaName: 'Test Villa',
      price: 800
    },
    expectedResult: 'error'
  },
  {
    name: 'Invalid Dates',
    description: 'Check-out before check-in',
    payload: {
      guestName: 'Invalid Date Guest',
      checkInDate: '2025-08-15',
      checkOutDate: '2025-08-10',
      villaName: 'Date Test Villa',
      price: 600
    },
    expectedResult: 'error'
  },
  {
    name: 'Malformed Price',
    description: 'Complex price format',
    payload: {
      guestName: 'Price Test Guest',
      checkInDate: '2025-08-01',
      checkOutDate: '2025-08-03',
      villaName: 'Price Villa',
      price: 'Total: $1,234.56 USD (includes taxes)',
      currency: 'USD'
    },
    expectedResult: 'success'
  },
  {
    name: 'Text Date Format',
    description: 'Dates in text format',
    payload: {
      guestName: 'Text Date Guest',
      arrival: 'August 15, 2025',
      departure: 'Aug 17, 2025',
      property_name: 'Text Date Villa',
      amount: 900
    },
    expectedResult: 'success'
  }
]

export default function BookingParserTestPage() {
  const [results, setResults] = useState<any[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [customPayload, setCustomPayload] = useState('')
  const [selectedTest, setSelectedTest] = useState<TestCase | null>(null)

  const runSingleTest = async (testCase: TestCase) => {
    try {
      console.log(`🧪 Running test: ${testCase.name}`)
      
      const response = await fetch('/api/booking-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testCase.payload)
      })
      
      const result = await response.json()
      
      return {
        testCase,
        response: result,
        status: response.status,
        success: response.ok,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        testCase,
        response: { error: error instanceof Error ? error.message : 'Unknown error' },
        status: 500,
        success: false,
        timestamp: new Date().toISOString()
      }
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    setResults([])
    
    console.log('🚀 Starting comprehensive parser tests...')
    
    const testResults = []
    for (const testCase of testCases) {
      const result = await runSingleTest(testCase)
      testResults.push(result)
      setResults([...testResults])
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    setIsRunning(false)
    toast.success(`Completed ${testResults.length} tests`)
  }

  const runCustomTest = async () => {
    if (!customPayload.trim()) {
      toast.error('Please enter a custom payload')
      return
    }
    
    try {
      const payload = JSON.parse(customPayload)
      const customTest: TestCase = {
        name: 'Custom Test',
        description: 'User-defined test case',
        payload,
        expectedResult: 'success'
      }
      
      const result = await runSingleTest(customTest)
      setResults([result])
      toast.success('Custom test completed')
    } catch (error) {
      toast.error('Invalid JSON payload')
    }
  }

  const getResultBadge = (result: any) => {
    if (result.success) {
      return <Badge className="bg-green-500/20 text-green-400">Success</Badge>
    } else {
      return <Badge className="bg-red-500/20 text-red-400">Error</Badge>
    }
  }

  const getExpectedBadge = (expected: string) => {
    switch (expected) {
      case 'success':
        return <Badge className="bg-green-500/20 text-green-400">Expected Success</Badge>
      case 'error':
        return <Badge className="bg-red-500/20 text-red-400">Expected Error</Badge>
      case 'warning':
        return <Badge className="bg-yellow-500/20 text-yellow-400">Expected Warning</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <TestTube className="w-8 h-8 text-blue-400" />
            Booking Email Parser Test Suite
          </h1>
          <p className="text-neutral-400">
            Comprehensive testing for booking email parsing reliability and accuracy
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Test Controls */}
          <Card className="bg-neutral-950 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Test Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={runAllTests}
                disabled={isRunning}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isRunning ? (
                  <>
                    <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run All Tests ({testCases.length})
                  </>
                )}
              </Button>
              
              <div className="border-t border-neutral-700 pt-4">
                <h3 className="text-white font-medium mb-2">Custom Test</h3>
                <Textarea
                  placeholder="Enter custom JSON payload..."
                  value={customPayload}
                  onChange={(e) => setCustomPayload(e.target.value)}
                  className="bg-neutral-900 border-neutral-700 text-white font-mono text-sm"
                  rows={8}
                />
                <Button
                  onClick={runCustomTest}
                  className="w-full mt-2 bg-purple-600 hover:bg-purple-700"
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  Run Custom Test
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Test Cases */}
          <Card className="bg-neutral-950 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Test Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {testCases.map((testCase, index) => (
                  <div
                    key={index}
                    className="p-3 bg-neutral-900 rounded border border-neutral-700 cursor-pointer hover:border-neutral-600"
                    onClick={() => setSelectedTest(testCase)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white">{testCase.name}</span>
                      {getExpectedBadge(testCase.expectedResult)}
                    </div>
                    <p className="text-sm text-neutral-400">{testCase.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Results */}
        {results.length > 0 && (
          <Card className="bg-neutral-950 border-neutral-800 mt-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                Test Results
                <Badge variant="secondary">{results.length} tests</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="p-4 bg-neutral-900 rounded border border-neutral-700"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-white">{result.testCase.name}</span>
                      <div className="flex items-center gap-2">
                        {getResultBadge(result)}
                        {getExpectedBadge(result.testCase.expectedResult)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-neutral-400 mb-1">Response Status:</p>
                        <p className="text-white">{result.status}</p>
                      </div>
                      <div>
                        <p className="text-neutral-400 mb-1">Timestamp:</p>
                        <p className="text-white">{new Date(result.timestamp).toLocaleTimeString()}</p>
                      </div>
                    </div>
                    
                    <details className="mt-3">
                      <summary className="text-neutral-400 cursor-pointer">View Response</summary>
                      <pre className="text-xs text-neutral-300 mt-2 p-3 bg-neutral-800 rounded overflow-x-auto">
                        {JSON.stringify(result.response, null, 2)}
                      </pre>
                    </details>
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
