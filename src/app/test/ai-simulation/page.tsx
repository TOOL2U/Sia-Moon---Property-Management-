'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export default function AISimulationTestPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const runBookingSimulation = async () => {
    setIsRunning(true)
    setError(null)
    setResult(null)

    const bookingData = {
      address: "Property villa-777, Lat: 9.1234, Lng: 99.4567, Koh Phangan, Thailand",
      jobType: "cleaning",
      value: 3800,
      customerType: "standard",
      scheduledDate: "2025-08-01T10:00:00Z",
      customerName: "Test Customer",
      contactInfo: "+66 81 234 5678",
      notes: "Standard cleaning and check-in support",
      urgent: false,
      simulationMode: true,
      testBookingId: "test-booking-001"
    }

    try {
      console.log('🧪 Starting AI COO Booking Simulation...')
      console.log('📋 Booking Data:', bookingData)

      const response = await fetch('/api/ai-coo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData)
      })

      if (!response.ok) {
        throw new Error(`AI COO API error: ${response.status} ${response.statusText}`)
      }

      const cooDecision = await response.json()
      console.log('🤖 AI COO Decision:', cooDecision)

      setResult(cooDecision)

      // Log to AI system
      const logEntry = {
        agent: 'COO',
        action: 'booking_simulation',
        input: bookingData,
        output: cooDecision,
        confidence: cooDecision.confidence || 0,
        timestamp: new Date().toISOString(),
        simulationMode: true,
        testCase: 'test-booking-001'
      }

      try {
        await fetch('/api/ai-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logEntry)
        })
        console.log('✅ Simulation logged successfully')
      } catch (logError) {
        console.warn('⚠️ Failed to log simulation:', logError)
      }

    } catch (err) {
      console.error('❌ Simulation failed:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🧪 AI COO Booking Simulation
          </h1>
          <p className="text-blue-200">
            Test the AI COO decision-making system with realistic booking scenarios
          </p>
        </div>

        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              📋 Test Booking Details
            </CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300 space-y-2">
            <div><strong>Booking ID:</strong> test-booking-001</div>
            <div><strong>Property:</strong> villa-777</div>
            <div><strong>Location:</strong> 9.1234, 99.4567 (Koh Phangan)</div>
            <div><strong>Date/Time:</strong> August 1, 2025 at 10:00 AM</div>
            <div><strong>Value:</strong> ฿3,800</div>
            <div><strong>Service:</strong> Standard cleaning and check-in support</div>
            <div><strong>Customer:</strong> Test Customer</div>
          </CardContent>
        </Card>

        <div className="text-center mb-6">
          <Button
            onClick={runBookingSimulation}
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
          >
            {isRunning ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                Running Simulation...
              </>
            ) : (
              <>
                🚀 Run AI COO Simulation
              </>
            )}
          </Button>
        </div>

        {error && (
          <Card className="bg-red-900/50 border-red-700 mb-6">
            <CardHeader>
              <CardTitle className="text-red-200">❌ Simulation Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-300">{error}</p>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card className="bg-green-900/50 border-green-700">
            <CardHeader>
              <CardTitle className="text-green-200 flex items-center gap-2">
                🤖 AI COO Decision Results
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-white font-semibold mb-3">Decision Summary</h3>
                  <div className="space-y-2">
                    <div>
                      <strong>Decision:</strong> 
                      <span className={`ml-2 px-2 py-1 rounded text-sm ${
                        result.decision === 'approved' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-red-600 text-white'
                      }`}>
                        {result.decision?.toUpperCase() || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <strong>Confidence:</strong> {((result.confidence || 0) * 100).toFixed(1)}%
                    </div>
                    <div>
                      <strong>Reason:</strong> {result.reason || 'No reason provided'}
                    </div>
                    {result.escalate && (
                      <div className="text-yellow-300">
                        <strong>⚠️ Escalation Required</strong>
                      </div>
                    )}
                  </div>
                </div>

                {result.assignedStaff && (
                  <div>
                    <h3 className="text-white font-semibold mb-3">Staff Assignment</h3>
                    <div className="space-y-2">
                      <div><strong>Staff:</strong> {result.assignedStaff.name}</div>
                      <div><strong>ETA:</strong> {result.assignedStaff.eta}</div>
                      <div><strong>Distance:</strong> {result.assignedStaff.distance}km</div>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-white font-semibold mb-3">Cost & Timing</h3>
                  <div className="space-y-2">
                    <div><strong>Estimated Cost:</strong> ฿{result.estimatedCost?.toLocaleString() || 'N/A'}</div>
                    <div><strong>Scheduled:</strong> {result.scheduledTime || 'N/A'}</div>
                  </div>
                </div>

                {result.logs && result.logs.length > 0 && (
                  <div>
                    <h3 className="text-white font-semibold mb-3">AI Logs</h3>
                    <div className="text-xs space-y-1">
                      {result.logs.map((log: any, index: number) => (
                        <div key={index} className="bg-slate-700 p-2 rounded">
                          {log.message || log.action}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 bg-slate-700 rounded">
                <h3 className="text-white font-semibold mb-2">Raw Response</h3>
                <pre className="text-xs text-slate-300 overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
