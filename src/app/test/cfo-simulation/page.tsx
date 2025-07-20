'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

export default function CFOSimulationTestPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const runCFOUploadSimulation = async () => {
    setIsRunning(true)
    setError(null)
    setResult(null)

    const uploadData = {
      fileName: "July_Expenses.xlsx",
      uploadedBy: "admin@siamoon.com",
      totalAmount: 24500,
      category: "Staff Payments",
      notes: "Monthly payout for cleaners"
    }

    try {
      console.log('🧪 Starting AI CFO P&L Upload Simulation...')
      console.log('📊 Upload Data:', uploadData)

      // Import the simulation function dynamically
      const { simulateCFOUpload } = await import('@/lib/ai/simulateAIActions')
      
      const simulationResult = await simulateCFOUpload(uploadData)
      console.log('💰 AI CFO Simulation Result:', simulationResult)

      setResult(simulationResult)

    } catch (err) {
      console.error('❌ CFO Simulation failed:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            💰 AI CFO P&L Upload Simulation
          </h1>
          <p className="text-purple-200">
            Test the AI CFO expense analysis and budget compliance system
          </p>
        </div>

        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              📊 Test P&L Upload Details
            </CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300 space-y-2">
            <div><strong>File Name:</strong> July_Expenses.xlsx</div>
            <div><strong>Uploaded By:</strong> admin@siamoon.com</div>
            <div><strong>Total Amount:</strong> ฿24,500</div>
            <div><strong>Category:</strong> Staff Payments</div>
            <div><strong>Notes:</strong> Monthly payout for cleaners</div>
            <div><strong>Expected Analysis:</strong> Budget compliance, anomaly detection, approval recommendation</div>
          </CardContent>
        </Card>

        <div className="text-center mb-6">
          <Button
            onClick={runCFOUploadSimulation}
            disabled={isRunning}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg"
          >
            {isRunning ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                Analyzing Upload...
              </>
            ) : (
              <>
                💰 Run AI CFO Simulation
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
          <Card className="bg-purple-900/50 border-purple-700">
            <CardHeader>
              <CardTitle className="text-purple-200 flex items-center gap-2">
                💰 AI CFO Analysis Results
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-white font-semibold mb-3">Simulation Status</h3>
                  <div className="space-y-2">
                    <div>
                      <strong>Status:</strong> 
                      <Badge className={`ml-2 ${result.success ? 'bg-green-600' : 'bg-red-600'}`}>
                        {result.success ? 'SUCCESS' : 'FAILED'}
                      </Badge>
                    </div>
                    <div><strong>Agent:</strong> AI {result.agent}</div>
                    <div><strong>Duration:</strong> {result.duration}ms</div>
                    <div><strong>Test Case:</strong> {result.testCase}</div>
                    <div><strong>Timestamp:</strong> {new Date(result.timestamp).toLocaleString()}</div>
                  </div>
                </div>

                {result.response && (
                  <div>
                    <h3 className="text-white font-semibold mb-3">CFO Decision</h3>
                    <div className="space-y-2">
                      {result.response.decision && (
                        <div>
                          <strong>Decision:</strong>
                          <Badge className={`ml-2 ${
                            result.response.decision === 'approved' ? 'bg-green-600' :
                            result.response.decision === 'rejected' ? 'bg-red-600' : 'bg-yellow-600'
                          }`}>
                            {result.response.decision.toUpperCase()}
                          </Badge>
                        </div>
                      )}
                      {result.response.confidence && (
                        <div>
                          <strong>Confidence:</strong> {(result.response.confidence * 100).toFixed(1)}%
                        </div>
                      )}
                      {result.response.budgetImpact && (
                        <div><strong>Budget Impact:</strong> {result.response.budgetImpact}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {result.response && result.response.analysis && (
                <div className="mt-6">
                  <h3 className="text-white font-semibold mb-3">Financial Analysis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.response.analysis.budgetCompliance && (
                      <div className="bg-slate-700 p-3 rounded">
                        <h4 className="text-purple-300 font-medium mb-2">Budget Compliance</h4>
                        <p className="text-sm">{result.response.analysis.budgetCompliance}</p>
                      </div>
                    )}
                    {result.response.analysis.anomalies && result.response.analysis.anomalies.length > 0 && (
                      <div className="bg-slate-700 p-3 rounded">
                        <h4 className="text-yellow-300 font-medium mb-2">Anomalies Detected</h4>
                        <ul className="text-sm space-y-1">
                          {result.response.analysis.anomalies.map((anomaly: any, index: number) => (
                            <li key={index}>• {anomaly.description || anomaly}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {result.response.analysis.categoryBreakdown && (
                      <div className="bg-slate-700 p-3 rounded">
                        <h4 className="text-blue-300 font-medium mb-2">Category Breakdown</h4>
                        <div className="text-sm space-y-1">
                          {Object.entries(result.response.analysis.categoryBreakdown).map(([category, amount]: [string, any]) => (
                            <div key={category} className="flex justify-between">
                              <span>{category}:</span>
                              <span>฿{amount.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.response.recommendations && result.response.recommendations.length > 0 && (
                      <div className="bg-slate-700 p-3 rounded">
                        <h4 className="text-green-300 font-medium mb-2">Recommendations</h4>
                        <ul className="text-sm space-y-1">
                          {result.response.recommendations.map((rec: string, index: number) => (
                            <li key={index}>• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {result.response && (
                <div className="mt-6 p-4 bg-slate-700 rounded">
                  <h3 className="text-white font-semibold mb-2">Raw CFO Response</h3>
                  <pre className="text-xs text-slate-300 overflow-auto max-h-64">
                    {JSON.stringify(result.response, null, 2)}
                  </pre>
                </div>
              )}

              {result.error && (
                <div className="mt-6 p-4 bg-red-900/50 rounded border border-red-700">
                  <h3 className="text-red-200 font-semibold mb-2">Error Details</h3>
                  <p className="text-red-300 text-sm">{result.error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm">
            💡 This simulation tests AI CFO expense analysis, budget compliance checking, and anomaly detection
          </p>
        </div>
      </div>
    </div>
  )
}
