'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { clientToast as toast } from '@/utils/clientToast'
import { 
  Crown, 
  Brain, 
  Target, 
  TrendingUp, 
  Users, 
  Calendar, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  BarChart3,
  Zap,
  Eye,
  Settings,
  Activity,
  Loader2
} from 'lucide-react'

interface COODecision {
  id: string
  type: string
  decision: any
  reasoning: string[]
  confidence: number
  timestamp: string
  status: 'pending' | 'executing' | 'completed' | 'failed'
  metrics: any
}

export default function AICOODashboard() {
  const [decisions, setDecisions] = useState<COODecision[]>([])
  const [loading, setLoading] = useState(false)
  const [activeScenario, setActiveScenario] = useState<string | null>(null)
  const [cooMetrics, setCooMetrics] = useState({
    totalDecisions: 0,
    successRate: 0,
    avgConfidence: 0,
    activeOperations: 0
  })

  // Load recent COO decisions
  useEffect(() => {
    loadCOODecisions()
  }, [])

  const loadCOODecisions = async () => {
    try {
      // Placeholder for loading decisions from Firebase
      // In a real implementation, this would fetch from ai_coo_decisions collection
      const mockDecisions: COODecision[] = [
        {
          id: '1',
          type: 'booking',
          decision: { action: 'approve', outcome: 'booking_approved' },
          reasoning: ['Guest profile verified', 'Calendar availability confirmed', 'Revenue optimization achieved'],
          confidence: 0.92,
          timestamp: new Date().toISOString(),
          status: 'completed',
          metrics: { revenue: 2500, satisfaction: 4.8 }
        }
      ]
      
      setDecisions(mockDecisions)
      setCooMetrics({
        totalDecisions: mockDecisions.length,
        successRate: 95.2,
        avgConfidence: 0.89,
        activeOperations: 3
      })
    } catch (error) {
      console.error('Error loading COO decisions:', error)
    }
  }

  const executeCOOScenario = async (scenarioType: string, scenarioData: any) => {
    try {
      setLoading(true)
      setActiveScenario(scenarioType)
      toast.loading(`🤖 AI COO: Analyzing ${scenarioType} scenario...`, { id: 'coo-decision' })

      const response = await fetch('/api/admin/ai-coo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'make_decision',
          scenario: {
            type: scenarioType,
            data: scenarioData,
            context: {
              currentTime: new Date().toISOString(),
              operationalMode: 'autonomous',
              priority: 'high'
            }
          }
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success(
          `🤖 AI COO Decision Complete!\nConfidence: ${Math.round(result.confidence * 100)}%`,
          { id: 'coo-decision', duration: 6000 }
        )

        // Add new decision to list
        const newDecision: COODecision = {
          id: Date.now().toString(),
          type: scenarioType,
          decision: result.decision,
          reasoning: result.reasoning,
          confidence: result.confidence,
          timestamp: new Date().toISOString(),
          status: 'completed',
          metrics: result.metrics
        }

        setDecisions(prev => [newDecision, ...prev])
        loadCOODecisions() // Refresh metrics
      } else {
        toast.error(`❌ AI COO Decision Failed`, { id: 'coo-decision' })
      }
    } catch (error) {
      toast.error('Error in AI COO decision making', { id: 'coo-decision' })
      console.error('Error executing COO scenario:', error)
    } finally {
      setLoading(false)
      setActiveScenario(null)
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-400'
    if (confidence >= 0.7) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'executing': return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
      case 'failed': return <AlertTriangle className="w-4 h-4 text-red-400" />
      default: return <Clock className="w-4 h-4 text-yellow-400" />
    }
  }

  return (
    <div className="space-y-6">
      {/* AI COO Header */}
      <Card className="bg-gradient-to-r from-purple-900 to-blue-900 border-purple-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-3">
            <Crown className="w-6 h-6" />
            AI Chief Operations Officer Dashboard
            <Badge className="bg-purple-600 text-white">AUTONOMOUS</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{cooMetrics.totalDecisions}</div>
              <div className="text-sm text-purple-200">Total Decisions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{cooMetrics.successRate}%</div>
              <div className="text-sm text-purple-200">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{Math.round(cooMetrics.avgConfidence * 100)}%</div>
              <div className="text-sm text-purple-200">Avg Confidence</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{cooMetrics.activeOperations}</div>
              <div className="text-sm text-purple-200">Active Operations</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operational Scenarios */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI COO Operational Scenarios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              onClick={() => executeCOOScenario('booking', {
                guestName: 'VIP Guest',
                checkIn: '2025-01-20',
                checkOut: '2025-01-25',
                guests: 4,
                revenue: 2500
              })}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white h-20 flex flex-col items-center justify-center"
            >
              {loading && activeScenario === 'booking' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Calendar className="w-5 h-5 mb-1" />
                  <span className="text-sm">Booking Decision</span>
                </>
              )}
            </Button>

            <Button
              onClick={() => executeCOOScenario('job_assignment', {
                jobType: 'cleaning',
                priority: 'high',
                property: 'Villa Sunset',
                requirements: ['deep_cleaning', 'guest_preparation']
              })}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white h-20 flex flex-col items-center justify-center"
            >
              {loading && activeScenario === 'job_assignment' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Users className="w-5 h-5 mb-1" />
                  <span className="text-sm">Staff Assignment</span>
                </>
              )}
            </Button>

            <Button
              onClick={() => executeCOOScenario('emergency', {
                type: 'maintenance',
                severity: 'high',
                description: 'Pool filtration system failure',
                guestImpact: 'immediate'
              })}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white h-20 flex flex-col items-center justify-center"
            >
              {loading && activeScenario === 'emergency' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 mb-1" />
                  <span className="text-sm">Emergency Response</span>
                </>
              )}
            </Button>

            <Button
              onClick={() => executeCOOScenario('calendar', {
                conflicts: 2,
                bookings: 5,
                maintenance: 1,
                optimization: 'revenue'
              })}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white h-20 flex flex-col items-center justify-center"
            >
              {loading && activeScenario === 'calendar' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Settings className="w-5 h-5 mb-1" />
                  <span className="text-sm">Calendar Optimization</span>
                </>
              )}
            </Button>

            <Button
              onClick={() => executeCOOScenario('performance', {
                period: 'weekly',
                metrics: ['occupancy', 'revenue', 'satisfaction'],
                analysis: 'comprehensive'
              })}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700 text-white h-20 flex flex-col items-center justify-center"
            >
              {loading && activeScenario === 'performance' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <BarChart3 className="w-5 h-5 mb-1" />
                  <span className="text-sm">Performance Analysis</span>
                </>
              )}
            </Button>

            <Button
              onClick={() => executeCOOScenario('comprehensive_test', {
                scenarios: ['booking', 'job_assignment', 'emergency'],
                duration: '24_hours',
                mode: 'full_autonomy'
              })}
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white h-20 flex flex-col items-center justify-center"
            >
              {loading && activeScenario === 'comprehensive_test' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Zap className="w-5 h-5 mb-1" />
                  <span className="text-sm">Full Day Test</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Decisions */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Eye className="w-5 h-5" />
            AI COO Decision Transparency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {decisions.length === 0 ? (
              <div className="text-center py-8">
                <Brain className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No AI COO decisions yet</p>
                <p className="text-sm text-gray-500">Execute a scenario to see AI decision making</p>
              </div>
            ) : (
              decisions.map((decision) => (
                <div key={decision.id} className="bg-neutral-800 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(decision.status)}
                      <div>
                        <h4 className="text-white font-medium capitalize">{decision.type} Decision</h4>
                        <p className="text-sm text-gray-400">
                          {new Date(decision.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getConfidenceColor(decision.confidence)}`}>
                        {Math.round(decision.confidence * 100)}%
                      </div>
                      <div className="text-xs text-gray-400">Confidence</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <h5 className="text-sm font-medium text-white mb-1">Decision:</h5>
                      <p className="text-sm text-gray-300">
                        {decision.decision?.action || 'No action specified'} - {decision.decision?.outcome || 'No outcome specified'}
                      </p>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-white mb-1">AI Reasoning:</h5>
                      <ul className="text-sm text-gray-300 space-y-1">
                        {decision.reasoning.map((reason, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-blue-400 mt-1">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {decision.metrics && Object.keys(decision.metrics).length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-white mb-1">Metrics:</h5>
                        <div className="flex gap-4 text-sm">
                          {Object.entries(decision.metrics).map(([key, value]) => (
                            <span key={key} className="text-gray-300">
                              {key}: <span className="text-blue-400">{String(value)}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI COO Capabilities */}
      <Card className="bg-blue-900/20 border-blue-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="w-5 h-5" />
            AI COO Operational Capabilities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-white font-medium mb-3">Core Operations</h4>
              <ul className="text-sm text-blue-300 space-y-1">
                <li>• Autonomous booking approval/rejection with reasoning</li>
                <li>• Intelligent staff assignment with confidence scoring</li>
                <li>• Emergency response coordination and escalation</li>
                <li>• Calendar optimization and conflict resolution</li>
                <li>• Performance monitoring and improvement recommendations</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3">Decision Transparency</h4>
              <ul className="text-sm text-blue-300 space-y-1">
                <li>• Complete reasoning chains for all decisions</li>
                <li>• Confidence scores and risk assessments</li>
                <li>• Alternative options considered</li>
                <li>• Success metrics and KPI tracking</li>
                <li>• Continuous learning and optimization</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
