'use client'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Separator } from '@/components/ui/Separator'
import { Switch } from '@/components/ui/switch'
import {
    AlertTriangle,
    Bell,
    Calendar,
    CheckCircle,
    Clock,
    Database,
    Play,
    Settings,
    Zap
} from 'lucide-react'
import React, { useState } from 'react'

interface WorkflowResult {
  success: boolean
  testResults?: {
    bookingCreated: {
      bookingId: string
      propertyName: string
      guestName: string
      checkInDate: string
      checkOutDate: string
      status: string
    }
    conflictsCreated: boolean
    workflowTriggered: boolean
    workflowResult?: any
  }
  nextSteps?: string[]
  error?: string
}

export default function BookingApprovalWorkflowPanel() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<WorkflowResult | null>(null)
  const [testConfig, setTestConfig] = useState({
    propertyName: 'Maya House',
    guestName: 'John Doe',
    guestEmail: 'john@example.com',
    checkInDate: '',
    checkOutDate: '',
    createConflicts: false
  })

  // Set default dates
  React.useEffect(() => {
    const checkIn = new Date()
    checkIn.setDate(checkIn.getDate() + 7)

    const checkOut = new Date()
    checkOut.setDate(checkOut.getDate() + 10)

    setTestConfig(prev => ({
      ...prev,
      checkInDate: checkIn.toISOString().split('T')[0],
      checkOutDate: checkOut.toISOString().split('T')[0]
    }))
  }, [])

  const runWorkflowTest = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      console.log('🧪 Running booking approval workflow test...')

      const response = await fetch('/api/test-booking-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testConfig)
      })

      const data = await response.json()
      setResult(data)

      if (data.success) {
        console.log('✅ Workflow test completed successfully:', data)
      } else {
        console.error('❌ Workflow test failed:', data)
      }

    } catch (error) {
      console.error('❌ Error running workflow test:', error)
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (success: boolean) => {
    return success ? (
      <Badge variant="outline" className="bg-green-500/20 border-green-500/30 text-green-400">
        <CheckCircle className="w-3 h-3 mr-1" />
        Success
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-red-500/20 border-red-500/30 text-red-400">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Failed
      </Badge>
    )
  }

  return (
    <div className="space-y-6 text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Automated Booking Approval Workflow</h2>
          <p className="text-neutral-400">
            Test and monitor the complete automated booking approval system
          </p>
        </div>
        <Badge variant="outline" className="bg-blue-500/20 border-blue-500/30 text-blue-400">
          <Zap className="w-3 h-3 mr-1" />
          AI-Powered
        </Badge>
      </div>

      {/* Workflow Overview */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Settings className="w-5 h-5" />
            Workflow Components
          </CardTitle>
          <CardDescription className="text-neutral-400">
            Complete automated system for booking approval and calendar integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-blue-400" />
              <div>
                <div className="font-medium text-sm text-white">Availability Check</div>
                <div className="text-xs text-neutral-400">Conflict Detection</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-purple-500/20 border border-purple-500/30 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-400" />
              <div>
                <div className="font-medium text-sm text-white">Calendar Integration</div>
                <div className="text-xs text-neutral-400">Event Creation</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-orange-500/20 border border-orange-500/30 rounded-lg">
              <Zap className="w-5 h-5 text-orange-400" />
              <div>
                <div className="font-medium text-sm text-white">AI Conflict Resolution</div>
                <div className="text-xs text-neutral-400">Smart Decisions</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
              <Bell className="w-5 h-5 text-green-400" />
              <div>
                <div className="font-medium text-sm text-white">Notifications</div>
                <div className="text-xs text-neutral-400">Stakeholder Alerts</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Configuration */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Play className="w-5 h-5" />
            Test Configuration
          </CardTitle>
          <CardDescription className="text-neutral-400">
            Configure and run a complete workflow test
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="propertyName" className="text-white">Property Name</Label>
              <Input
                id="propertyName"
                value={testConfig.propertyName}
                onChange={(e) => setTestConfig(prev => ({ ...prev, propertyName: e.target.value }))}
                placeholder="Maya House"
                className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guestName" className="text-white">Guest Name</Label>
              <Input
                id="guestName"
                value={testConfig.guestName}
                onChange={(e) => setTestConfig(prev => ({ ...prev, guestName: e.target.value }))}
                placeholder="John Doe"
                className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guestEmail" className="text-white">Guest Email</Label>
              <Input
                id="guestEmail"
                type="email"
                value={testConfig.guestEmail}
                onChange={(e) => setTestConfig(prev => ({ ...prev, guestEmail: e.target.value }))}
                placeholder="john@example.com"
                className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkInDate" className="text-white">Check-in Date</Label>
              <Input
                id="checkInDate"
                type="date"
                value={testConfig.checkInDate}
                onChange={(e) => setTestConfig(prev => ({ ...prev, checkInDate: e.target.value }))}
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkOutDate" className="text-white">Check-out Date</Label>
              <Input
                id="checkOutDate"
                type="date"
                value={testConfig.checkOutDate}
                onChange={(e) => setTestConfig(prev => ({ ...prev, checkOutDate: e.target.value }))}
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="createConflicts"
                checked={testConfig.createConflicts}
                onCheckedChange={(checked) => setTestConfig(prev => ({ ...prev, createConflicts: checked }))}
              />
              <Label htmlFor="createConflicts" className="text-white">Create Test Conflicts</Label>
            </div>
          </div>

          <Separator className="bg-neutral-700" />

          <div className="flex items-center justify-between">
            <div className="text-sm text-neutral-400">
              This will create a test booking and trigger the complete automated workflow
            </div>
            <Button
              onClick={runWorkflowTest}
              disabled={isLoading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  Running Test...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run Workflow Test
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {result && (
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Database className="w-5 h-5" />
              Test Results
              {getStatusBadge(result.success)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.success && result.testResults ? (
              <div className="space-y-4">
                {/* Booking Created */}
                <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                  <h4 className="font-medium text-green-400 mb-2">✅ Test Booking Created</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-neutral-300"><strong className="text-white">Booking ID:</strong> {result.testResults.bookingCreated.bookingId}</div>
                    <div className="text-neutral-300"><strong className="text-white">Property:</strong> {result.testResults.bookingCreated.propertyName}</div>
                    <div className="text-neutral-300"><strong className="text-white">Guest:</strong> {result.testResults.bookingCreated.guestName}</div>
                    <div className="text-neutral-300"><strong className="text-white">Status:</strong> {result.testResults.bookingCreated.status}</div>
                    <div className="text-neutral-300"><strong className="text-white">Check-in:</strong> {result.testResults.bookingCreated.checkInDate}</div>
                    <div className="text-neutral-300"><strong className="text-white">Check-out:</strong> {result.testResults.bookingCreated.checkOutDate}</div>
                  </div>
                </div>

                {/* Workflow Results */}
                {result.testResults.workflowResult && (
                  <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                    <h4 className="font-medium text-blue-400 mb-2">🔄 Workflow Execution</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-neutral-300">Availability Check: {result.testResults.workflowResult.availabilityCheck?.checkCompleted ? 'Completed' : 'Pending'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-purple-400" />
                        <span className="text-neutral-300">Calendar Integration: {result.testResults.workflowResult.calendarIntegration?.success ? 'Success' : 'Failed'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-orange-400" />
                        <span className="text-neutral-300">Notifications: {result.testResults.workflowResult.notifications?.sent?.length || 0} sent</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Next Steps */}
                {result.nextSteps && (
                  <div className="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                    <h4 className="font-medium text-yellow-400 mb-2">📋 Next Steps</h4>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {result.nextSteps.map((step, index) => (
                        <li key={index} className="text-neutral-300">{step}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                <h4 className="font-medium text-red-400 mb-2">❌ Test Failed</h4>
                <p className="text-sm text-neutral-300">{result.error || 'Unknown error occurred'}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
