'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { 
  TestTube, 
  Play, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock,
  BrainCircuit,
  Database
} from 'lucide-react'
import { createTestBookings, createTestProperty, cleanupTestData } from '@/utils/aiBookingTestUtils'
import AIAutomationService from '@/services/AIAutomationService'

export default function AIBookingTestPanel() {
  const [isCreatingTests, setIsCreatingTests] = useState(false)
  const [isCreatingProperty, setIsCreatingProperty] = useState(false)
  const [isCleaning, setIsCleaning] = useState(false)
  const [testResults, setTestResults] = useState<any[]>([])

  const handleCreateTestProperty = async () => {
    setIsCreatingProperty(true)
    try {
      await createTestProperty()
    } catch (error) {
      console.error('Error creating test property:', error)
    } finally {
      setIsCreatingProperty(false)
    }
  }

  const handleCreateTestBookings = async () => {
    setIsCreatingTests(true)
    try {
      // Check if AI automation is enabled
      const aiEnabled = await AIAutomationService.isEnabled()
      
      if (!aiEnabled) {
        alert('⚠️ AI Automation is disabled. Enable it in Settings first to test automated booking approval.')
        return
      }

      const scenarios = await createTestBookings()
      setTestResults(scenarios)
    } catch (error) {
      console.error('Error creating test bookings:', error)
    } finally {
      setIsCreatingTests(false)
    }
  }

  const handleCleanupTestData = async () => {
    setIsCleaning(true)
    try {
      await cleanupTestData()
      setTestResults([])
    } catch (error) {
      console.error('Error cleaning up test data:', error)
    } finally {
      setIsCleaning(false)
    }
  }

  return (
    <Card className="bg-neutral-900 border-neutral-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-purple-400" />
          AI Booking Approval Testing
        </CardTitle>
        <p className="text-neutral-400 text-sm">
          Test the AI booking approval system with various validation scenarios
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Test Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={handleCreateTestProperty}
            disabled={isCreatingProperty}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isCreatingProperty ? (
              <Clock className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Database className="h-4 w-4 mr-2" />
            )}
            Create Test Property
          </Button>

          <Button
            onClick={handleCreateTestBookings}
            disabled={isCreatingTests}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isCreatingTests ? (
              <Clock className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Run AI Tests
          </Button>

          <Button
            onClick={handleCleanupTestData}
            disabled={isCleaning}
            variant="outline"
            className="border-red-600 text-red-400 hover:bg-red-900/20"
          >
            {isCleaning ? (
              <Clock className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Cleanup Test Data
          </Button>
        </div>

        {/* Test Scenarios */}
        {testResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-white font-medium flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              Test Scenarios Created
            </h3>
            
            <div className="grid grid-cols-1 gap-3">
              {testResults.map((scenario, index) => (
                <div
                  key={index}
                  className="bg-neutral-800 rounded-lg p-4 border border-neutral-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-medium">{scenario.name}</h4>
                    <Badge
                      variant={scenario.expectedResult === 'approved' ? 'success' : 'destructive'}
                      className="text-xs"
                    >
                      {scenario.expectedResult === 'approved' ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      Expected: {scenario.expectedResult}
                    </Badge>
                  </div>
                  
                  <p className="text-neutral-400 text-sm mb-2">
                    {scenario.description}
                  </p>
                  
                  {scenario.expectedReason && (
                    <p className="text-yellow-400 text-xs">
                      Expected reason: {scenario.expectedReason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <h3 className="text-blue-400 font-medium mb-2">Testing Instructions</h3>
          <ol className="text-blue-300 text-sm space-y-1 list-decimal list-inside">
            <li>Ensure AI Automation is enabled in Settings</li>
            <li>Click "Create Test Property" to set up test data</li>
            <li>Click "Run AI Tests" to create test bookings</li>
            <li>Monitor the console and Bookings page for AI processing</li>
            <li>Check the Audit Logs for detailed AI decisions</li>
            <li>Use "Cleanup Test Data" when finished testing</li>
          </ol>
        </div>

        {/* AI Status Indicator */}
        <div className="bg-neutral-800 rounded-lg p-4">
          <h3 className="text-white font-medium mb-2">AI System Status</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-neutral-400">Booking Approval:</span>
              <span className="text-green-400 ml-2">Active</span>
            </div>
            <div>
              <span className="text-neutral-400">Calendar Integration:</span>
              <span className="text-green-400 ml-2">Active</span>
            </div>
            <div>
              <span className="text-neutral-400">Audit Logging:</span>
              <span className="text-green-400 ml-2">Active</span>
            </div>
            <div>
              <span className="text-neutral-400">Error Handling:</span>
              <span className="text-green-400 ml-2">Active</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
