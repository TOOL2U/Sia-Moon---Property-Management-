'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { AlertTriangle, Shield, DollarSign, Eye, TrendingUp, Flag } from 'lucide-react'

export default function AnomalySimulationPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [anomalyAnalysis, setAnomalyAnalysis] = useState<any[]>([])

  const runSuspiciousExpenseTest = async () => {
    setIsRunning(true)
    setError(null)
    setResult(null)
    setAnomalyAnalysis([])

    const suspiciousUpload = {
      fileName: "anomaly_expense.xlsx",
      uploadedBy: "admin@siamoon.com",
      totalAmount: 99499,
      category: "Marketing",
      notes: "Offline event costs in Bangkok"
    }

    try {
      console.log('💸 Starting Suspicious Expense Anomaly Test...')
      console.log('📋 Suspicious Upload Data:', suspiciousUpload)

      // First, analyze the anomalies
      const anomalies = analyzeExpenseAnomalies(suspiciousUpload)
      setAnomalyAnalysis(anomalies)

      // Import the simulation function dynamically
      const { simulateCFOUpload } = await import('@/lib/ai/simulateAIActions')
      
      const simulationResult = await simulateCFOUpload(suspiciousUpload)
      console.log('💰 AI CFO Anomaly Result:', simulationResult)

      setResult(simulationResult)

    } catch (err) {
      console.error('❌ Anomaly simulation failed:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsRunning(false)
    }
  }

  const analyzeExpenseAnomalies = (upload: any) => {
    const monthlyMarketingBudget = 20000 // ฿20,000 typical monthly marketing budget
    const anomalies = []

    // Amount anomaly
    if (upload.totalAmount > monthlyMarketingBudget * 2) {
      anomalies.push({
        type: 'amount_anomaly',
        severity: 'high',
        description: `Amount ฿${upload.totalAmount.toLocaleString()} is ${Math.round(upload.totalAmount / monthlyMarketingBudget * 100)}% of monthly marketing budget`,
        riskLevel: upload.totalAmount > 50000 ? 'critical' : 'high',
        recommendation: 'Requires executive approval and detailed justification'
      })
    }

    // Round number anomaly
    if (upload.totalAmount.toString().endsWith('99')) {
      anomalies.push({
        type: 'round_number_pattern',
        severity: 'medium',
        description: 'Amount ends in 99 - potential attempt to stay under ฿100,000 threshold',
        riskLevel: 'medium',
        recommendation: 'Verify if amount is artificially structured to avoid approval limits'
      })
    }

    // Category mismatch
    if (upload.category === 'Marketing' && upload.totalAmount > 50000) {
      anomalies.push({
        type: 'category_budget_mismatch',
        severity: 'high',
        description: 'Marketing expense significantly exceeds typical category spending',
        riskLevel: 'high',
        recommendation: 'Review marketing strategy and ROI justification'
      })
    }

    // Location anomaly
    if (upload.notes.includes('Bangkok') && upload.totalAmount > 30000) {
      anomalies.push({
        type: 'location_expense_anomaly',
        severity: 'medium',
        description: 'High-value expense in Bangkok (outside normal Koh Phangan operations)',
        riskLevel: 'medium',
        recommendation: 'Verify business justification for Bangkok activities'
      })
    }

    // Threshold manipulation
    if (upload.totalAmount >= 99000 && upload.totalAmount < 100000) {
      anomalies.push({
        type: 'threshold_manipulation',
        severity: 'critical',
        description: 'Amount appears designed to stay just under ฿100,000 approval threshold',
        riskLevel: 'critical',
        recommendation: 'Immediate escalation - potential fraud indicator'
      })
    }

    return anomalies
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600'
      case 'high': return 'bg-orange-600'
      case 'medium': return 'bg-yellow-600'
      default: return 'bg-gray-600'
    }
  }

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return <Shield className="w-4 h-4 text-red-400" />
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-400" />
      case 'medium': return <Eye className="w-4 h-4 text-yellow-400" />
      default: return <Flag className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Shield className="w-10 h-10 text-red-400" />
            💸 AI CFO Anomaly Detection Test
          </h1>
          <p className="text-red-200">
            Test AI CFO's fraud detection and anomaly analysis with suspicious expense patterns
          </p>
        </div>

        <Card className="bg-slate-800/50 border-red-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-red-400" />
              Suspicious Expense Upload
            </CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div><strong>File Name:</strong> anomaly_expense.xlsx</div>
                <div><strong>Uploaded By:</strong> admin@siamoon.com</div>
                <div className="flex items-center gap-2">
                  <strong>Total Amount:</strong> 
                  <Badge className="bg-red-600 text-white">
                    ฿99,499 (SUSPICIOUS)
                  </Badge>
                </div>
              </div>
              <div>
                <div><strong>Category:</strong> Marketing</div>
                <div><strong>Location:</strong> Bangkok (Outside normal operations)</div>
                <div><strong>Description:</strong> Offline event costs</div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-red-900/30 border border-red-700 rounded">
              <h4 className="text-red-300 font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Fraud Detection Triggers
              </h4>
              <ul className="text-sm space-y-1">
                <li>• <strong>Amount Anomaly:</strong> ฿99,499 is 497% of monthly marketing budget</li>
                <li>• <strong>Threshold Manipulation:</strong> Just under ฿100,000 approval limit</li>
                <li>• <strong>Round Number Pattern:</strong> Ends in 99 (suspicious pattern)</li>
                <li>• <strong>Location Anomaly:</strong> Bangkok expense outside Koh Phangan operations</li>
                <li>• <strong>Category Mismatch:</strong> Exceeds typical marketing spending by 400%</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mb-6">
          <Button
            onClick={runSuspiciousExpenseTest}
            disabled={isRunning}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg"
          >
            {isRunning ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                Analyzing Anomalies...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5 mr-2" />
                💸 Test Anomaly Detection
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

        {anomalyAnalysis.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-yellow-400" />
                  Detected Anomalies
                </span>
                <Badge variant="secondary">
                  {anomalyAnalysis.length} anomalies
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {anomalyAnalysis.map((anomaly, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${
                    anomaly.severity === 'critical' ? 'bg-red-900/30 border-red-700' :
                    anomaly.severity === 'high' ? 'bg-orange-900/30 border-orange-700' :
                    'bg-yellow-900/30 border-yellow-700'
                  }`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {getRiskIcon(anomaly.riskLevel)}
                        <h3 className="text-white font-medium">{anomaly.type.replace(/_/g, ' ').toUpperCase()}</h3>
                        <Badge className={`${getSeverityColor(anomaly.severity)} text-white text-xs`}>
                          {anomaly.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <Badge className={`${
                        anomaly.riskLevel === 'critical' ? 'bg-red-600' :
                        anomaly.riskLevel === 'high' ? 'bg-orange-600' : 'bg-yellow-600'
                      } text-white text-xs`}>
                        {anomaly.riskLevel.toUpperCase()} RISK
                      </Badge>
                    </div>
                    
                    <p className="text-slate-300 mb-3">{anomaly.description}</p>
                    
                    <div className="bg-slate-700/50 p-3 rounded">
                      <h4 className="text-white font-medium mb-1">Recommendation:</h4>
                      <p className="text-slate-300 text-sm">{anomaly.recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  💰 AI CFO Fraud Analysis Results
                </span>
                {result.response?.decision && (
                  <Badge className={`${
                    result.response.decision === 'rejected' ? 'bg-red-600' :
                    result.response.decision === 'flagged' ? 'bg-yellow-600' : 'bg-green-600'
                  } text-white`}>
                    {result.response.decision.toUpperCase()}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-white font-semibold mb-3">CFO Decision</h3>
                  <div className="space-y-2">
                    <div>
                      <strong>Decision:</strong> 
                      <span className={`ml-2 px-2 py-1 rounded text-sm ${
                        result.response?.decision === 'rejected' ? 'bg-red-600 text-white' :
                        result.response?.decision === 'flagged' ? 'bg-yellow-600 text-white' :
                        'bg-green-600 text-white'
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
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-semibold mb-3">Risk Assessment</h3>
                  <div className="space-y-2">
                    <div>
                      <strong>Fraud Risk:</strong>
                      <Badge className="ml-2 bg-red-600 text-white">HIGH</Badge>
                    </div>
                    <div>
                      <strong>Escalation Required:</strong>
                      <Badge className={`ml-2 ${result.response?.escalate ? 'bg-red-600' : 'bg-green-600'} text-white`}>
                        {result.response?.escalate ? 'YES' : 'NO'}
                      </Badge>
                    </div>
                    <div>
                      <strong>Budget Impact:</strong>
                      <span className="ml-2 text-red-400">497% of monthly budget</span>
                    </div>
                  </div>
                </div>
              </div>

              {result.response?.analysis && (
                <div className="mt-6">
                  <h3 className="text-white font-semibold mb-3">Detailed Analysis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.response.analysis.anomalies && result.response.analysis.anomalies.length > 0 && (
                      <div className="bg-red-900/30 border border-red-700 p-3 rounded">
                        <h4 className="text-red-300 font-medium mb-2">Detected Anomalies</h4>
                        <ul className="text-sm space-y-1">
                          {result.response.analysis.anomalies.map((anomaly: any, index: number) => (
                            <li key={index}>• {anomaly.description || anomaly}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {result.response.analysis.budgetImpact && (
                      <div className="bg-orange-900/30 border border-orange-700 p-3 rounded">
                        <h4 className="text-orange-300 font-medium mb-2">Budget Impact</h4>
                        <p className="text-sm">{result.response.analysis.budgetImpact}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {result.response?.recommendations && result.response.recommendations.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-white font-semibold mb-3">AI Recommendations</h3>
                  <div className="bg-blue-900/30 border border-blue-700 p-4 rounded">
                    <ul className="space-y-2">
                      {result.response.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <TrendingUp className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                          <span className="text-blue-300">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="mt-6 p-4 bg-slate-700 rounded">
                <h3 className="text-white font-semibold mb-2">Raw CFO Response</h3>
                <pre className="text-xs text-slate-300 overflow-auto max-h-32">
                  {JSON.stringify(result.response, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm">
            💡 This test verifies AI CFO's ability to detect suspicious expense patterns and potential fraud
          </p>
        </div>
      </div>
    </div>
  )
}
