'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { AlertTriangle, DollarSign, Shield, Users } from 'lucide-react'

export default function EscalationSimulationPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const runHighValueBookingSimulation = async () => {
    setIsRunning(true)
    setError(null)
    setResult(null)

    const highValueBooking = {
      bookingId: "high-risk-003",
      propertyId: "villa-222",
      location: { lat: 9.333, lng: 99.777 },
      date: "2025-08-03",
      time: "14:00",
      value: 6500, // Above ฿5,000 escalation threshold
      notes: "Private chef & security booking"
    }

    try {
      console.log('🚨 Starting High-Value Booking Escalation Test...')
      console.log('📋 High-Risk Booking Data:', highValueBooking)

      // Import the simulation function dynamically
      const { simulateCOOBooking } = await import('@/lib/ai/simulateAIActions')
      
      const simulationResult = await simulateCOOBooking(highValueBooking)
      console.log('🤖 AI COO Escalation Result:', simulationResult)

      setResult(simulationResult)

    } catch (err) {
      console.error('❌ Escalation simulation failed:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsRunning(false)
    }
  }

  const getEscalationStatus = () => {
    if (!result?.response) return null
    
    const isEscalated = result.response.escalate || result.response.confidence < 0.7
    return {
      escalated: isEscalated,
      reason: isEscalated ? 'High-value booking requires human review' : 'Auto-approved',
      color: isEscalated ? 'bg-red-600' : 'bg-green-600'
    }
  }

  const escalationStatus = getEscalationStatus()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <AlertTriangle className="w-10 h-10 text-red-400" />
            🚨 AI COO Escalation Test
          </h1>
          <p className="text-red-200">
            Test high-value booking scenarios that trigger AI escalation protocols
          </p>
        </div>

        <Card className="bg-slate-800/50 border-red-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-red-400" />
              High-Value Booking Details
            </CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div><strong>Booking ID:</strong> high-risk-003</div>
                <div><strong>Property:</strong> villa-222</div>
                <div><strong>Location:</strong> 9.333, 99.777 (Koh Phangan)</div>
                <div><strong>Date/Time:</strong> August 3, 2025 at 2:00 PM</div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <strong>Value:</strong> 
                  <Badge className="bg-red-600 text-white">
                    ฿6,500 (HIGH VALUE)
                  </Badge>
                </div>
                <div><strong>Service:</strong> Private chef & security booking</div>
                <div><strong>Risk Level:</strong> <span className="text-red-400">HIGH</span></div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-red-900/30 border border-red-700 rounded">
              <h4 className="text-red-300 font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Escalation Triggers
              </h4>
              <ul className="text-sm space-y-1">
                <li>• <strong>High Value:</strong> ฿6,500 exceeds ฿5,000 threshold</li>
                <li>• <strong>Special Services:</strong> Private chef and security required</li>
                <li>• <strong>Risk Assessment:</strong> Premium service complexity</li>
                <li>• <strong>Expected Outcome:</strong> Human review required</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mb-6">
          <Button
            onClick={runHighValueBookingSimulation}
            disabled={isRunning}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg"
          >
            {isRunning ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                Testing Escalation...
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 mr-2" />
                🚨 Test High-Value Escalation
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
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  🤖 AI COO Escalation Results
                </span>
                {escalationStatus && (
                  <Badge className={escalationStatus.color}>
                    {escalationStatus.escalated ? '🚨 ESCALATED' : '✅ AUTO-APPROVED'}
                  </Badge>
                )}
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
                        result.response?.decision === 'approved' 
                          ? 'bg-green-600 text-white' 
                          : result.response?.decision === 'rejected'
                          ? 'bg-red-600 text-white'
                          : 'bg-yellow-600 text-white'
                      }`}>
                        {result.response?.decision?.toUpperCase() || 'PENDING'}
                      </span>
                    </div>
                    <div>
                      <strong>Confidence:</strong> 
                      <span className={`ml-2 ${
                        (result.response?.confidence || 0) >= 0.8 ? 'text-green-400' :
                        (result.response?.confidence || 0) >= 0.6 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {((result.response?.confidence || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <strong>Processing Time:</strong> {result.duration}ms
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-semibold mb-3">Escalation Analysis</h3>
                  <div className="space-y-2">
                    <div>
                      <strong>Escalation Required:</strong>
                      <Badge className={`ml-2 ${result.response?.escalate ? 'bg-red-600' : 'bg-green-600'}`}>
                        {result.response?.escalate ? 'YES' : 'NO'}
                      </Badge>
                    </div>
                    <div>
                      <strong>Risk Level:</strong>
                      <span className="ml-2 text-red-400">HIGH VALUE</span>
                    </div>
                    <div>
                      <strong>Review Type:</strong>
                      <span className="ml-2">Human Manager Required</span>
                    </div>
                  </div>
                </div>
              </div>

              {result.response?.reason && (
                <div className="mt-6">
                  <h3 className="text-white font-semibold mb-3">AI Reasoning</h3>
                  <div className="bg-slate-700 p-4 rounded">
                    <p className="text-slate-300">{result.response.reason}</p>
                  </div>
                </div>
              )}

              {result.response?.assignedStaff && (
                <div className="mt-6">
                  <h3 className="text-white font-semibold mb-3">Proposed Staff Assignment</h3>
                  <div className="bg-slate-700 p-4 rounded">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <strong>Staff:</strong> {result.response.assignedStaff.name}
                      </div>
                      <div>
                        <strong>ETA:</strong> {result.response.assignedStaff.eta}
                      </div>
                      <div>
                        <strong>Distance:</strong> {result.response.assignedStaff.distance}km
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6">
                <h3 className="text-white font-semibold mb-3">Escalation Protocol</h3>
                <div className="bg-yellow-900/30 border border-yellow-600 p-4 rounded">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-yellow-400 mt-0.5" />
                    <div>
                      <h4 className="text-yellow-300 font-medium mb-2">Next Steps Required:</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Manager review and approval required</li>
                        <li>• Verify private chef and security arrangements</li>
                        <li>• Confirm special service pricing</li>
                        <li>• Validate customer payment method</li>
                        <li>• Schedule premium staff assignment</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-slate-700 rounded">
                <h3 className="text-white font-semibold mb-2">Raw AI Response</h3>
                <pre className="text-xs text-slate-300 overflow-auto max-h-32">
                  {JSON.stringify(result.response, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm">
            💡 This test verifies that high-value bookings ({'>'}฿5,000) trigger proper escalation protocols
          </p>
        </div>
      </div>
    </div>
  )
}
