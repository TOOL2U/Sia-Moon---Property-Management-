'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { AlertTriangle, DollarSign, Clock, Zap, TrendingUp, Target } from 'lucide-react'

export default function ThresholdSimulationPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [thresholdAnalysis, setThresholdAnalysis] = useState<any>(null)

  const runThresholdTest = async () => {
    setIsRunning(true)
    setError(null)
    setResult(null)
    setThresholdAnalysis(null)

    const thresholdBooking = {
      bookingId: "threshold-007",
      propertyId: "villa-777",
      location: { lat: 9.250, lng: 99.200 },
      date: "2025-08-10",
      time: "08:30",
      value: 4900,
      notes: "Last-minute urgent repair"
    }

    try {
      console.log('🎯 Starting Threshold Detection Test...')
      console.log('📋 Threshold Booking Data:', thresholdBooking)

      // Analyze threshold implications
      const analysis = analyzeThresholdImplications(thresholdBooking)
      setThresholdAnalysis(analysis)

      // Import the simulation function dynamically
      const { simulateCOOBooking } = await import('@/lib/ai/simulateAIActions')
      
      const simulationResult = await simulateCOOBooking(thresholdBooking)
      console.log('🤖 AI COO Threshold Result:', simulationResult)

      setResult(simulationResult)

    } catch (err) {
      console.error('❌ Threshold simulation failed:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsRunning(false)
    }
  }

  const analyzeThresholdImplications = (booking: any) => {
    const escalationThreshold = 5000
    const urgentThreshold = 3000
    const analysis = {
      thresholdDistance: escalationThreshold - booking.value,
      thresholdPercentage: (booking.value / escalationThreshold) * 100,
      isNearThreshold: booking.value >= escalationThreshold * 0.9,
      isUrgent: booking.notes.toLowerCase().includes('urgent'),
      isLastMinute: booking.notes.toLowerCase().includes('last-minute'),
      riskFactors: [],
      expectedBehavior: '',
      confidenceExpectation: ''
    }

    // Analyze risk factors
    if (analysis.isNearThreshold) {
      analysis.riskFactors.push('Near ฿5,000 escalation threshold')
    }
    
    if (analysis.isUrgent) {
      analysis.riskFactors.push('Urgent repair request')
    }
    
    if (analysis.isLastMinute) {
      analysis.riskFactors.push('Last-minute scheduling')
    }

    if (booking.value > urgentThreshold) {
      analysis.riskFactors.push('High-value service request')
    }

    // Determine expected AI behavior
    if (analysis.isNearThreshold && analysis.isUrgent) {
      analysis.expectedBehavior = 'Approve with elevated scrutiny and detailed reasoning'
      analysis.confidenceExpectation = '75-85% (cautious due to threshold proximity)'
    } else if (analysis.isNearThreshold) {
      analysis.expectedBehavior = 'Approve but flag for review due to high value'
      analysis.confidenceExpectation = '80-90% (high value requires attention)'
    } else if (analysis.isUrgent) {
      analysis.expectedBehavior = 'Fast-track approval with priority scheduling'
      analysis.confidenceExpectation = '85-95% (urgent but manageable value)'
    } else {
      analysis.expectedBehavior = 'Standard approval process'
      analysis.confidenceExpectation = '90%+ (routine high-value booking)'
    }

    return analysis
  }

  const getThresholdColor = (percentage: number) => {
    if (percentage >= 98) return 'bg-red-600'
    if (percentage >= 90) return 'bg-orange-600'
    if (percentage >= 80) return 'bg-yellow-600'
    return 'bg-green-600'
  }

  const getRiskLevel = (riskFactors: string[]) => {
    if (riskFactors.length >= 3) return { level: 'HIGH', color: 'bg-red-600' }
    if (riskFactors.length >= 2) return { level: 'MEDIUM', color: 'bg-yellow-600' }
    return { level: 'LOW', color: 'bg-green-600' }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-yellow-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Target className="w-10 h-10 text-yellow-400" />
            🎯 AI COO Threshold Detection Test
          </h1>
          <p className="text-yellow-200">
            Test AI COO's decision-making at critical value thresholds and urgent scenarios
          </p>
        </div>

        <Card className="bg-slate-800/50 border-yellow-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-yellow-400" />
              Threshold Booking Details
            </CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div><strong>Booking ID:</strong> threshold-007</div>
                <div><strong>Property:</strong> villa-777</div>
                <div><strong>Location:</strong> 9.250, 99.200 (Koh Phangan)</div>
                <div><strong>Date/Time:</strong> August 10, 2025 at 8:30 AM</div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <strong>Value:</strong> 
                  <Badge className="bg-yellow-600 text-white">
                    ฿4,900 (98% of threshold)
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <strong>Service:</strong> Last-minute urgent repair
                  <Badge className="bg-red-600 text-white text-xs">
                    <Zap className="w-3 h-3 mr-1" />
                    URGENT
                  </Badge>
                </div>
                <div><strong>Threshold Distance:</strong> ฿100 under ฿5,000 limit</div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-700 rounded">
              <h4 className="text-yellow-300 font-semibold mb-2 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Threshold Analysis
              </h4>
              <ul className="text-sm space-y-1">
                <li>• <strong>Escalation Threshold:</strong> ฿5,000 (company policy)</li>
                <li>• <strong>Current Value:</strong> ฿4,900 (98% of threshold)</li>
                <li>• <strong>Margin:</strong> Only ฿100 under escalation limit</li>
                <li>• <strong>Urgency Factor:</strong> Last-minute urgent repair</li>
                <li>• <strong>Expected Behavior:</strong> Approve with elevated scrutiny</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mb-6">
          <Button
            onClick={runThresholdTest}
            disabled={isRunning}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-3 text-lg"
          >
            {isRunning ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                Testing Threshold Logic...
              </>
            ) : (
              <>
                <Target className="w-5 h-5 mr-2" />
                🎯 Test Threshold Detection
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

        {thresholdAnalysis && (
          <Card className="bg-slate-800/50 border-slate-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                Threshold Risk Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-white font-semibold mb-3">Threshold Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Threshold Percentage:</span>
                      <Badge className={`${getThresholdColor(thresholdAnalysis.thresholdPercentage)} text-white`}>
                        {thresholdAnalysis.thresholdPercentage.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Distance to Limit:</span>
                      <span className="text-yellow-300">฿{thresholdAnalysis.thresholdDistance}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Near Threshold:</span>
                      <Badge className={thresholdAnalysis.isNearThreshold ? 'bg-red-600' : 'bg-green-600'}>
                        {thresholdAnalysis.isNearThreshold ? 'YES' : 'NO'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-semibold mb-3">Risk Assessment</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Urgency Level:</span>
                      <Badge className={thresholdAnalysis.isUrgent ? 'bg-red-600' : 'bg-green-600'}>
                        {thresholdAnalysis.isUrgent ? 'URGENT' : 'STANDARD'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Last-Minute:</span>
                      <Badge className={thresholdAnalysis.isLastMinute ? 'bg-orange-600' : 'bg-green-600'}>
                        {thresholdAnalysis.isLastMinute ? 'YES' : 'NO'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Overall Risk:</span>
                      <Badge className={`${getRiskLevel(thresholdAnalysis.riskFactors).color} text-white`}>
                        {getRiskLevel(thresholdAnalysis.riskFactors).level}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {thresholdAnalysis.riskFactors.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-white font-semibold mb-3">Identified Risk Factors</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {thresholdAnalysis.riskFactors.map((factor: string, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm">{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-900/30 border border-blue-700 p-3 rounded">
                  <h4 className="text-blue-300 font-medium mb-2">Expected AI Behavior</h4>
                  <p className="text-sm">{thresholdAnalysis.expectedBehavior}</p>
                </div>
                <div className="bg-green-900/30 border border-green-700 p-3 rounded">
                  <h4 className="text-green-300 font-medium mb-2">Confidence Expectation</h4>
                  <p className="text-sm">{thresholdAnalysis.confidenceExpectation}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  🤖 AI COO Threshold Decision
                </span>
                {result.response?.decision && (
                  <Badge className={`${
                    result.response.decision === 'approved' ? 'bg-green-600' :
                    result.response.decision === 'rejected' ? 'bg-red-600' : 'bg-yellow-600'
                  } text-white`}>
                    {result.response.decision.toUpperCase()}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-white font-semibold mb-3">Decision Analysis</h3>
                  <div className="space-y-2">
                    <div>
                      <strong>Decision:</strong> 
                      <span className={`ml-2 px-2 py-1 rounded text-sm ${
                        result.response?.decision === 'approved' ? 'bg-green-600 text-white' :
                        result.response?.decision === 'rejected' ? 'bg-red-600 text-white' :
                        'bg-yellow-600 text-white'
                      }`}>
                        {result.response?.decision?.toUpperCase() || 'PENDING'}
                      </span>
                    </div>
                    <div>
                      <strong>Confidence:</strong> 
                      <span className={`ml-2 ${
                        (result.response?.confidence || 0) >= 0.9 ? 'text-green-400' :
                        (result.response?.confidence || 0) >= 0.7 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {((result.response?.confidence || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <strong>Processing Time:</strong> {result.duration}ms
                    </div>
                    <div>
                      <strong>Escalation Required:</strong>
                      <Badge className={`ml-2 ${result.response?.escalate ? 'bg-red-600' : 'bg-green-600'} text-white`}>
                        {result.response?.escalate ? 'YES' : 'NO'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {result.response?.assignedStaff && (
                  <div>
                    <h3 className="text-white font-semibold mb-3">Staff Assignment</h3>
                    <div className="space-y-2">
                      <div><strong>Staff:</strong> {result.response.assignedStaff.name}</div>
                      <div><strong>ETA:</strong> {result.response.assignedStaff.eta}</div>
                      <div><strong>Distance:</strong> {result.response.assignedStaff.distance}km</div>
                      <div>
                        <strong>Urgency Handling:</strong>
                        <Badge className="ml-2 bg-orange-600 text-white">
                          PRIORITY SCHEDULING
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {result.response?.reason && (
                <div className="mt-6">
                  <h3 className="text-white font-semibold mb-3">AI Reasoning</h3>
                  <div className="bg-slate-700 p-4 rounded">
                    <p className="text-slate-300">{result.response.reason}</p>
                  </div>
                </div>
              )}

              <div className="mt-6">
                <h3 className="text-white font-semibold mb-3">Threshold Validation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-3 rounded border ${
                    result.response?.decision === 'approved' && !result.response?.escalate
                      ? 'bg-green-900/30 border-green-700'
                      : result.response?.escalate
                      ? 'bg-yellow-900/30 border-yellow-700'
                      : 'bg-red-900/30 border-red-700'
                  }`}>
                    <h4 className="font-medium mb-2">Threshold Handling</h4>
                    <div className="text-sm space-y-1">
                      <div>Value: ฿4,900 (98% of ฿5,000 limit)</div>
                      <div>Status: {result.response?.decision === 'approved' ? '✅ Approved under threshold' : '⚠️ Requires review'}</div>
                      <div>Logic: {result.response?.escalate ? 'Escalated due to proximity' : 'Auto-approved within limits'}</div>
                    </div>
                  </div>
                  
                  <div className={`p-3 rounded border ${
                    thresholdAnalysis?.isUrgent && result.response?.assignedStaff
                      ? 'bg-blue-900/30 border-blue-700'
                      : 'bg-gray-900/30 border-gray-700'
                  }`}>
                    <h4 className="font-medium mb-2">Urgency Handling</h4>
                    <div className="text-sm space-y-1">
                      <div>Urgency: {thresholdAnalysis?.isUrgent ? '🚨 Urgent repair' : '📅 Standard'}</div>
                      <div>Priority: {result.response?.assignedStaff ? '✅ Fast-tracked' : '⏳ Standard queue'}</div>
                      <div>Response: {result.response?.assignedStaff ? 'Staff assigned immediately' : 'Standard processing'}</div>
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
            💡 This test verifies AI COO's threshold detection and decision-making at critical value boundaries
          </p>
        </div>
      </div>
    </div>
  )
}
