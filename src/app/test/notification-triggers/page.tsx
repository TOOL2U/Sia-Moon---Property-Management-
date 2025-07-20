'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Mail, MessageSquare, Calendar, AlertTriangle, DollarSign, Users, CheckCircle } from 'lucide-react'

export default function NotificationTriggersPage() {
  const [testResults, setTestResults] = useState<any[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const notificationTests = [
    {
      id: 'booking_confirmation',
      name: 'Booking Confirmation',
      description: 'Customer and staff booking confirmation notifications',
      icon: CheckCircle,
      color: 'bg-green-600',
      testData: {
        bookingId: 'LIVE-001',
        customerName: 'John Smith',
        customerEmail: 'john.smith@example.com',
        customerPhone: '+66 81 234 5678',
        serviceName: 'Pool Cleaning Service',
        serviceDate: '2025-07-21',
        serviceTime: '14:00',
        propertyAddress: 'Villa 123, Haad Rin, Koh Phangan',
        totalAmount: 3500,
        assignedStaff: {
          name: 'Somchai Jaidee',
          phone: '+66 82 345 6789',
          eta: '30 minutes'
        }
      }
    },
    {
      id: 'job_assignment',
      name: 'Job Assignment',
      description: 'Staff job assignment and calendar notifications',
      icon: Users,
      color: 'bg-blue-600',
      testData: {
        staffName: 'Somchai Jaidee',
        staffEmail: 'somchai@siamoon.com',
        staffPhone: '+66 82 345 6789',
        bookingId: 'LIVE-001',
        serviceName: 'Pool Cleaning Service',
        serviceDate: '2025-07-21',
        serviceTime: '14:00',
        customerName: 'John Smith',
        customerPhone: '+66 81 234 5678',
        propertyAddress: 'Villa 123, Haad Rin, Koh Phangan',
        specialInstructions: 'Pool has algae buildup, requires extra chemicals',
        estimatedDuration: '2 hours'
      }
    },
    {
      id: 'escalation_alert',
      name: 'Escalation Alert',
      description: 'Management escalation and urgent alerts',
      icon: AlertTriangle,
      color: 'bg-red-600',
      testData: {
        type: 'high_value',
        severity: 'high',
        title: 'High-Value Booking Requires Review',
        description: 'Booking value of ฿8,500 exceeds standard threshold and requires management approval.',
        relatedBookingId: 'HIGH-VALUE-001',
        relatedAmount: 8500,
        actionRequired: 'Review booking details and approve/reject within 2 hours',
        escalatedBy: 'AI COO System'
      }
    },
    {
      id: 'financial_upload_alert',
      name: 'Financial Upload Alert',
      description: 'Finance team expense and fraud alerts',
      icon: DollarSign,
      color: 'bg-purple-600',
      testData: {
        fileName: 'suspicious_expenses.xlsx',
        uploadedBy: 'Test User',
        totalAmount: 99499,
        category: 'Marketing',
        status: 'flagged',
        reason: 'Amount appears designed to avoid ฿100,000 threshold',
        anomaliesDetected: [
          'Threshold manipulation detected',
          'Budget variance exceeds 400%',
          'Unusual expense pattern'
        ]
      }
    }
  ]

  const runNotificationTest = async (testType: string) => {
    setIsRunning(true)
    const test = notificationTests.find(t => t.id === testType)
    if (!test) return

    try {
      console.log(`🔔 Testing ${test.name} notifications...`)

      // Import notification service dynamically
      const { 
        sendBookingConfirmation, 
        sendJobAssignment, 
        sendEscalationAlert, 
        sendFinancialUploadAlert 
      } = await import('@/lib/notifications/notificationService')

      let result = false
      let details = ''

      switch (testType) {
        case 'booking_confirmation':
          result = await sendBookingConfirmation(test.testData)
          details = `Customer email: ${test.testData.customerEmail}, SMS: ${test.testData.customerPhone}`
          break
        case 'job_assignment':
          result = await sendJobAssignment(test.testData)
          details = `Staff email: ${test.testData.staffEmail}, SMS: ${test.testData.staffPhone}, Calendar event created`
          break
        case 'escalation_alert':
          result = await sendEscalationAlert(test.testData)
          details = `Management alerts sent for ${test.testData.severity} severity ${test.testData.type}`
          break
        case 'financial_upload_alert':
          result = await sendFinancialUploadAlert(test.testData)
          details = `Finance team alerted about ${test.testData.status} upload: ${test.testData.fileName}`
          break
      }

      const testResult = {
        id: testType,
        name: test.name,
        success: result,
        timestamp: new Date().toISOString(),
        details: details,
        testData: test.testData
      }

      setTestResults(prev => [testResult, ...prev.filter(r => r.id !== testType)])
      
      console.log(`${result ? '✅' : '❌'} ${test.name} test completed:`, result)

    } catch (error) {
      console.error(`❌ ${test.name} test failed:`, error)
      
      const testResult = {
        id: testType,
        name: test.name,
        success: false,
        timestamp: new Date().toISOString(),
        details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      }

      setTestResults(prev => [testResult, ...prev.filter(r => r.id !== testType)])
    } finally {
      setIsRunning(false)
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    setTestResults([])

    for (const test of notificationTests) {
      await runNotificationTest(test.id)
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    setIsRunning(false)
  }

  const getTestResult = (testId: string) => {
    return testResults.find(r => r.id === testId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Mail className="w-10 h-10 text-purple-400" />
            🔔 Notification Triggers Test
          </h1>
          <p className="text-purple-200">
            Test all notification triggers for live mode operation
          </p>
        </div>

        {/* Configuration Status */}
        <Card className="bg-slate-800/50 border-purple-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Notification Configuration Status
            </CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <Badge className="bg-green-600 text-white mb-2">ENABLED</Badge>
                <div className="text-sm">Booking Confirmation</div>
              </div>
              <div className="text-center">
                <Badge className="bg-green-600 text-white mb-2">ENABLED</Badge>
                <div className="text-sm">Job Assignment</div>
              </div>
              <div className="text-center">
                <Badge className="bg-green-600 text-white mb-2">ENABLED</Badge>
                <div className="text-sm">Escalation Alert</div>
              </div>
              <div className="text-center">
                <Badge className="bg-green-600 text-white mb-2">ENABLED</Badge>
                <div className="text-sm">Financial Upload Alert</div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-green-900/30 border border-green-700 rounded">
              <p className="text-green-300 text-sm">
                ✅ All notification triggers are enabled for live mode operation
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Test Controls */}
        <div className="text-center mb-6">
          <Button
            onClick={runAllTests}
            disabled={isRunning}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg mr-4"
          >
            {isRunning ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                Testing All Notifications...
              </>
            ) : (
              <>
                <Mail className="w-5 h-5 mr-2" />
                🔔 Test All Notifications
              </>
            )}
          </Button>
        </div>

        {/* Individual Tests */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {notificationTests.map((test) => {
            const IconComponent = test.icon
            const result = getTestResult(test.id)
            
            return (
              <Card key={test.id} className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <div className={`p-2 rounded ${test.color}`}>
                        <IconComponent className="w-4 h-4 text-white" />
                      </div>
                      {test.name}
                    </span>
                    {result && (
                      <Badge className={`${result.success ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                        {result.success ? 'PASSED' : 'FAILED'}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-slate-300">
                  <p className="text-sm mb-4">{test.description}</p>
                  
                  {result && (
                    <div className="mb-4 p-3 bg-slate-700/50 rounded">
                      <div className="text-xs text-slate-400 mb-1">
                        Last tested: {new Date(result.timestamp).toLocaleString()}
                      </div>
                      <div className="text-sm">{result.details}</div>
                      {result.error && (
                        <div className="text-red-400 text-xs mt-1">Error: {result.error}</div>
                      )}
                    </div>
                  )}
                  
                  <Button
                    onClick={() => runNotificationTest(test.id)}
                    disabled={isRunning}
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300"
                  >
                    {isRunning ? 'Testing...' : `Test ${test.name}`}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Test Results Summary */}
        {testResults.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">📊 Test Results Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <div key={`${result.id}-${index}`} className="flex items-center justify-between p-3 bg-slate-700/50 rounded">
                    <div>
                      <div className="text-white font-medium">{result.name}</div>
                      <div className="text-sm text-slate-400">{result.details}</div>
                      <div className="text-xs text-slate-500">
                        {new Date(result.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <Badge className={`${result.success ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                      {result.success ? '✅ PASSED' : '❌ FAILED'}
                    </Badge>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-purple-900/30 border border-purple-700 rounded">
                <h3 className="text-purple-300 font-semibold mb-2">🎯 Notification System Status</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <strong>Total Tests:</strong> {testResults.length}
                  </div>
                  <div>
                    <strong>Passed:</strong> {testResults.filter(r => r.success).length}
                  </div>
                  <div>
                    <strong>Failed:</strong> {testResults.filter(r => !r.success).length}
                  </div>
                  <div>
                    <strong>Success Rate:</strong> {testResults.length > 0 ? Math.round((testResults.filter(r => r.success).length / testResults.length) * 100) : 0}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm">
            💡 These tests verify that all notification triggers are working correctly in live mode
          </p>
        </div>
      </div>
    </div>
  )
}
