'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { AlertTriangle, XCircle, CheckCircle, AlertCircle } from 'lucide-react'

export default function ValidationSimulationPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const runBadBookingSimulation = async () => {
    setIsRunning(true)
    setError(null)
    setResult(null)

    const badBooking = {
      bookingId: "bad-booking-004",
      propertyId: "", // missing ID
      location: null, // invalid location
      date: "2025-08-05",
      time: "11:00",
      value: 4200,
      notes: ""
    }

    try {
      console.log('❌ Starting Bad Booking Validation Test...')
      console.log('📋 Invalid Booking Data:', badBooking)

      // Import the simulation function dynamically
      const { simulateCOOBooking } = await import('@/lib/ai/simulateAIActions')
      
      const simulationResult = await simulateCOOBooking(badBooking)
      console.log('🤖 AI COO Validation Result:', simulationResult)

      setResult(simulationResult)

    } catch (err) {
      console.error('❌ Validation simulation failed:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsRunning(false)
    }
  }

  const getValidationStatus = () => {
    if (!result?.response) return null
    
    const isRejected = result.response.decision === 'rejected'
    const hasValidationErrors = result.response.validationErrors?.length > 0
    
    return {
      rejected: isRejected,
      hasErrors: hasValidationErrors,
      color: isRejected ? 'bg-red-600' : 'bg-yellow-600',
      status: isRejected ? 'REJECTED' : 'UNEXPECTED APPROVAL'
    }
  }

  const validationStatus = getValidationStatus()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <XCircle className="w-10 h-10 text-red-400" />
            ❌ AI COO Validation Test
          </h1>
          <p className="text-orange-200">
            Test AI COO's data validation and error handling with intentionally bad booking data
          </p>
        </div>

        <Card className="bg-slate-800/50 border-red-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Invalid Booking Data
            </CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div><strong>Booking ID:</strong> bad-booking-004</div>
                <div className="flex items-center gap-2">
                  <strong>Property ID:</strong> 
                  <Badge className="bg-red-600 text-white text-xs">
                    EMPTY STRING
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <strong>Location:</strong> 
                  <Badge className="bg-red-600 text-white text-xs">
                    NULL
                  </Badge>
                </div>
              </div>
              <div>
                <div><strong>Date/Time:</strong> August 5, 2025 at 11:00 AM</div>
                <div><strong>Value:</strong> ฿4,200</div>
                <div className="flex items-center gap-2">
                  <strong>Notes:</strong> 
                  <Badge className="bg-yellow-600 text-white text-xs">
                    EMPTY
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-red-900/30 border border-red-700 rounded">
              <h4 className="text-red-300 font-semibold mb-2 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Validation Issues
              </h4>
              <ul className="text-sm space-y-1">
                <li>• <strong>Missing Property ID:</strong> Empty string instead of valid property identifier</li>
                <li>• <strong>Invalid Location:</strong> Null location data (no coordinates)</li>
                <li>• <strong>Missing Service Details:</strong> Empty notes field</li>
                <li>• <strong>Incomplete Address:</strong> Cannot determine property location</li>
                <li>• <strong>Expected Outcome:</strong> AI should reject this booking</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mb-6">
          <Button
            onClick={runBadBookingSimulation}
            disabled={isRunning}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg"
          >
            {isRunning ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                Testing Validation...
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 mr-2" />
                ❌ Test Bad Booking Validation
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
                  🤖 AI COO Validation Results
                </span>
                {validationStatus && (
                  <Badge className={validationStatus.color}>
                    {validationStatus.rejected ? '✅ PROPERLY REJECTED' : '⚠️ VALIDATION FAILED'}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-white font-semibold mb-3">Validation Results</h3>
                  <div className="space-y-2">
                    <div>
                      <strong>Decision:</strong> 
                      <span className={`ml-2 px-2 py-1 rounded text-sm ${
                        result.response?.decision === 'rejected' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-red-600 text-white'
                      }`}>
                        {result.response?.decision?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </div>
                    <div>
                      <strong>Confidence:</strong> 
                      <span className={`ml-2 ${
                        (result.response?.confidence || 0) >= 0.9 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {((result.response?.confidence || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <strong>Processing Time:</strong> {result.duration}ms
                    </div>
                    <div>
                      <strong>Validation Status:</strong>
                      <span className={`ml-2 ${
                        result.response?.decision === 'rejected' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {result.response?.decision === 'rejected' ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-semibold mb-3">Error Analysis</h3>
                  <div className="space-y-2">
                    <div>
                      <strong>Data Completeness:</strong>
                      <Badge className="ml-2 bg-red-600">INCOMPLETE</Badge>
                    </div>
                    <div>
                      <strong>Location Validity:</strong>
                      <Badge className="ml-2 bg-red-600">INVALID</Badge>
                    </div>
                    <div>
                      <strong>Property Reference:</strong>
                      <Badge className="ml-2 bg-red-600">MISSING</Badge>
                    </div>
                  </div>
                </div>
              </div>

              {result.response?.reason && (
                <div className="mt-6">
                  <h3 className="text-white font-semibold mb-3">AI Reasoning</h3>
                  <div className={`p-4 rounded ${
                    result.response.decision === 'rejected' 
                      ? 'bg-green-900/30 border border-green-700' 
                      : 'bg-red-900/30 border border-red-700'
                  }`}>
                    <p className="text-slate-300">{result.response.reason}</p>
                  </div>
                </div>
              )}

              {result.response?.validationErrors && result.response.validationErrors.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-white font-semibold mb-3">Validation Errors Detected</h3>
                  <div className="bg-red-900/30 border border-red-700 p-4 rounded">
                    <ul className="space-y-2">
                      {result.response.validationErrors.map((error: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                          <span className="text-red-300">{error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="mt-6">
                <h3 className="text-white font-semibold mb-3">Expected vs Actual Behavior</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-900/30 border border-green-700 p-4 rounded">
                    <h4 className="text-green-300 font-medium mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Expected Behavior
                    </h4>
                    <ul className="text-sm space-y-1 text-green-200">
                      <li>• Reject booking due to missing data</li>
                      <li>• High confidence in rejection ({'>'}90%)</li>
                      <li>• Clear validation error messages</li>
                      <li>• No staff assignment attempted</li>
                      <li>• Proper error logging</li>
                    </ul>
                  </div>
                  <div className={`p-4 rounded border ${
                    result.response?.decision === 'rejected' 
                      ? 'bg-green-900/30 border-green-700' 
                      : 'bg-red-900/30 border-red-700'
                  }`}>
                    <h4 className={`font-medium mb-2 flex items-center gap-2 ${
                      result.response?.decision === 'rejected' ? 'text-green-300' : 'text-red-300'
                    }`}>
                      {result.response?.decision === 'rejected' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      Actual Behavior
                    </h4>
                    <ul className={`text-sm space-y-1 ${
                      result.response?.decision === 'rejected' ? 'text-green-200' : 'text-red-200'
                    }`}>
                      <li>• Decision: {result.response?.decision || 'Unknown'}</li>
                      <li>• Confidence: {((result.response?.confidence || 0) * 100).toFixed(1)}%</li>
                      <li>• Validation: {result.response?.validationErrors?.length > 0 ? 'Errors detected' : 'No errors reported'}</li>
                      <li>• Staff Assignment: {result.response?.assignedStaff ? 'Attempted' : 'None'}</li>
                      <li>• Status: {result.response?.decision === 'rejected' ? '✅ Correct' : '❌ Incorrect'}</li>
                    </ul>
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
            💡 This test verifies that the AI COO properly validates booking data and rejects incomplete requests
          </p>
        </div>
      </div>
    </div>
  )
}
