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
  Database,
  Bell,
  BarChart3,
  Monitor,
  RefreshCw
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface DataFlowTestResult {
  testName: string
  success: boolean
  dataFlow: {
    success: boolean
    bookingId?: string
    isDuplicate?: boolean
    clientMatched?: boolean
    notificationsSent?: boolean
    dashboardUpdated?: boolean
    reportsUpdated?: boolean
    errors: string[]
    warnings: string[]
  }
  timestamp: string
  processingTime: number
}

const testScenarios = [
  {
    name: 'Perfect Booking Flow',
    description: 'Complete booking with all fields and client match',
    payload: {
      guestName: 'John Perfect Test',
      guestEmail: 'john.perfect@test.com',
      checkInDate: '2025-08-20',
      checkOutDate: '2025-08-22',
      villaName: 'Perfect Test Villa',
      propertyId: 'PTV001',
      bookingReference: 'PERFECT-123456',
      price: 1500,
      currency: 'USD',
      guests: 2,
      specialRequests: 'Testing perfect booking flow',
      bookingSource: 'booking.com',
      paymentStatus: 'paid'
    }
  },
  {
    name: 'Minimal Data Flow',
    description: 'Booking with only required fields',
    payload: {
      guestName: 'Jane Minimal Test',
      checkInDate: '2025-08-25',
      checkOutDate: '2025-08-27',
      villaName: 'Minimal Test Villa',
      price: 800
    }
  },
  {
    name: 'Duplicate Detection Test',
    description: 'Send the same booking twice to test duplicate prevention',
    payload: {
      guestName: 'Duplicate Test Guest',
      checkInDate: '2025-09-01',
      checkOutDate: '2025-09-03',
      villaName: 'Duplicate Test Villa',
      price: 1200,
      bookingReference: 'DUPLICATE-TEST-123'
    }
  },
  {
    name: 'Urgent Booking Test',
    description: 'Booking with check-in tomorrow (urgent notifications)',
    payload: {
      guestName: 'Urgent Test Guest',
      checkInDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
      checkOutDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Day after tomorrow
      villaName: 'Urgent Test Villa',
      price: 2000,
      specialRequests: 'Urgent booking - arriving tomorrow'
    }
  }
]

export default function BookingDataFlowTestPage() {
  const [results, setResults] = useState<DataFlowTestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const runSingleTest = async (scenario: typeof testScenarios[0], isDuplicate = false) => {
    try {
      console.log(`🧪 Running data flow test: ${scenario.name}${isDuplicate ? ' (Duplicate)' : ''}`)
      
      const startTime = Date.now()
      const response = await fetch('/api/booking-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(scenario.payload)
      })
      
      const result = await response.json()
      const processingTime = Date.now() - startTime
      
      return {
        testName: `${scenario.name}${isDuplicate ? ' (Duplicate)' : ''}`,
        success: response.ok && result.status === 'success',
        dataFlow: result.dataFlow || {
          success: false,
          errors: ['No data flow information in response'],
          warnings: []
        },
        timestamp: new Date().toISOString(),
        processingTime
      }
    } catch (error) {
      return {
        testName: `${scenario.name}${isDuplicate ? ' (Duplicate)' : ''}`,
        success: false,
        dataFlow: {
          success: false,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          warnings: []
        },
        timestamp: new Date().toISOString(),
        processingTime: 0
      }
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    setResults([])
    
    console.log('🚀 Starting comprehensive data flow tests...')
    
    const testResults: DataFlowTestResult[] = []
    
    for (const scenario of testScenarios) {
      // Run the test
      const result = await runSingleTest(scenario)
      testResults.push(result)
      setResults([...testResults])
      
      // For duplicate test, run it twice
      if (scenario.name === 'Duplicate Detection Test') {
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
        const duplicateResult = await runSingleTest(scenario, true)
        testResults.push(duplicateResult)
        setResults([...testResults])
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    setIsRunning(false)
    
    const successCount = testResults.filter(r => r.success).length
    toast.success(`Completed ${testResults.length} tests (${successCount} successful)`)
  }

  const runSingleScenario = async (index: number) => {
    const scenario = testScenarios[index]
    const result = await runSingleTest(scenario)
    setResults(prev => [result, ...prev])
    toast.success(`Test "${scenario.name}" completed`)
  }

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="w-4 h-4 text-green-400" />
    ) : (
      <XCircle className="w-4 h-4 text-red-400" />
    )
  }

  const getDataFlowBadge = (dataFlow: DataFlowTestResult['dataFlow']) => {
    if (dataFlow.success) {
      return <Badge className="bg-green-500/20 text-green-400">Complete</Badge>
    } else if (dataFlow.warnings?.length > 0) {
      return <Badge className="bg-yellow-500/20 text-yellow-400">Partial</Badge>
    } else {
      return <Badge className="bg-red-500/20 text-red-400">Failed</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <TestTube className="w-8 h-8 text-blue-400" />
            Booking Data Flow Test Suite
          </h1>
          <p className="text-neutral-400">
            Comprehensive testing for Firebase → Dashboard → Reports → Notifications flow
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Test Scenarios */}
          <Card className="bg-neutral-950 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Test Scenarios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={runAllTests}
                disabled={isRunning}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Running All Tests...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run All Tests ({testScenarios.length})
                  </>
                )}
              </Button>
              
              <div className="space-y-3">
                {testScenarios.map((scenario, index) => (
                  <div
                    key={index}
                    className="p-3 bg-neutral-900 rounded border border-neutral-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white">{scenario.name}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => runSingleScenario(index)}
                        disabled={isRunning}
                        className="text-xs"
                      >
                        Run
                      </Button>
                    </div>
                    <p className="text-sm text-neutral-400">{scenario.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Test Results */}
          <Card className="bg-neutral-950 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                Test Results
                {results.length > 0 && (
                  <Badge variant="secondary">{results.length} tests</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.length === 0 ? (
                <div className="text-center py-8">
                  <TestTube className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                  <p className="text-neutral-400">No test results yet</p>
                  <p className="text-neutral-500 text-sm">Run tests to see results</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className="p-4 bg-neutral-900 rounded border border-neutral-700"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-white">{result.testName}</span>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result.success)}
                          {getDataFlowBadge(result.dataFlow)}
                        </div>
                      </div>
                      
                      {/* Data Flow Status */}
                      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        <div className="flex items-center gap-1">
                          <Database className="w-3 h-3" />
                          <span className={result.dataFlow.bookingId ? 'text-green-400' : 'text-red-400'}>
                            Firebase: {result.dataFlow.bookingId ? 'Stored' : 'Failed'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Bell className="w-3 h-3" />
                          <span className={result.dataFlow.notificationsSent ? 'text-green-400' : 'text-yellow-400'}>
                            Notifications: {result.dataFlow.notificationsSent ? 'Sent' : 'Partial'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Monitor className="w-3 h-3" />
                          <span className={result.dataFlow.dashboardUpdated ? 'text-green-400' : 'text-yellow-400'}>
                            Dashboard: {result.dataFlow.dashboardUpdated ? 'Updated' : 'Pending'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" />
                          <span className={result.dataFlow.reportsUpdated ? 'text-green-400' : 'text-yellow-400'}>
                            Reports: {result.dataFlow.reportsUpdated ? 'Updated' : 'Pending'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Errors and Warnings */}
                      {result.dataFlow.errors.length > 0 && (
                        <div className="mb-2">
                          <p className="text-red-400 text-xs font-medium">Errors:</p>
                          <ul className="text-red-300 text-xs list-disc list-inside">
                            {result.dataFlow.errors.map((error, i) => (
                              <li key={i}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {result.dataFlow.warnings.length > 0 && (
                        <div className="mb-2">
                          <p className="text-yellow-400 text-xs font-medium">Warnings:</p>
                          <ul className="text-yellow-300 text-xs list-disc list-inside">
                            {result.dataFlow.warnings.map((warning, i) => (
                              <li key={i}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="text-xs text-neutral-500">
                        {new Date(result.timestamp).toLocaleTimeString()} • {result.processingTime}ms
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
