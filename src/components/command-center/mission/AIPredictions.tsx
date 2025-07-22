'use client'

import { useState, useEffect } from 'react'
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Cloud, 
  Car, 
  Users,
  RefreshCw,
  Lightbulb,
  Target
} from 'lucide-react'

interface AIPrediction {
  id: string
  type: 'bottleneck' | 'delay' | 'optimization' | 'weather' | 'traffic' | 'guest_behavior' | 'anomaly'
  title: string
  description: string
  confidence: number
  impact: 'low' | 'medium' | 'high' | 'critical'
  recommendation?: string
  affectedJobs?: string[]
  estimatedSavings?: number
  timeframe: string
}

interface DayOperationsPrediction {
  date: string
  predictions: AIPrediction[]
  confidence: number
  generatedAt: string
  summary: {
    totalJobs: number
    expectedCompletionRate: number
    riskLevel: 'low' | 'medium' | 'high'
    bottlenecks: number
    optimizations: number
  }
}

interface AIPredictionsProps {
  jobs: any[]
}

export default function AIPredictions({ jobs }: AIPredictionsProps) {
  const [predictions, setPredictions] = useState<DayOperationsPrediction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  // Fetch AI predictions
  const fetchPredictions = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/predict-day-operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          jobs: jobs.map(job => ({
            id: job.id,
            type: job.jobType,
            scheduledTime: job.scheduledDate,
            duration: job.estimatedDuration,
            priority: job.priority,
            assignedStaff: job.assignedStaffId,
            property: job.propertyRef,
            booking: job.bookingRef
          }))
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch AI predictions')
      }

      const data = await response.json()
      setPredictions(data)
      setLastRefresh(new Date())
    } catch (err) {
      console.error('Error fetching AI predictions:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      
      // Fallback to mock data for development
      setPredictions(getMockPredictions())
    } finally {
      setLoading(false)
    }
  }

  // Mock predictions for development
  const getMockPredictions = (): DayOperationsPrediction => ({
    date: new Date().toISOString().split('T')[0],
    confidence: 87,
    generatedAt: new Date().toISOString(),
    summary: {
      totalJobs: jobs.length,
      expectedCompletionRate: 92,
      riskLevel: jobs.length > 8 ? 'high' : jobs.length > 5 ? 'medium' : 'low',
      bottlenecks: Math.floor(jobs.length * 0.2),
      optimizations: Math.floor(jobs.length * 0.3)
    },
    predictions: [
      {
        id: '1',
        type: 'traffic',
        title: 'Traffic Delays Expected',
        description: 'Heavy traffic on Patong Beach Road between 2-4 PM may delay 3 jobs by 15-30 minutes.',
        confidence: 85,
        impact: 'medium',
        recommendation: 'Reschedule Villa Sunset cleaning to 4:30 PM or assign closer staff.',
        affectedJobs: jobs.slice(0, 3).map(j => j.id),
        timeframe: '2:00 PM - 4:00 PM'
      },
      {
        id: '2',
        type: 'optimization',
        title: 'Route Optimization Available',
        description: 'Reordering Maria\'s jobs could save 45 minutes of travel time.',
        confidence: 92,
        impact: 'medium',
        recommendation: 'Swap Villa Breeze and Ocean View jobs to optimize route.',
        estimatedSavings: 45,
        timeframe: 'All day'
      },
      {
        id: '3',
        type: 'guest_behavior',
        title: 'Early Checkout Predicted',
        description: 'Guest at Villa Paradise likely to check out 2 hours early based on booking pattern.',
        confidence: 78,
        impact: 'low',
        recommendation: 'Prepare cleaning crew for earlier start time.',
        affectedJobs: jobs.slice(1, 2).map(j => j.id),
        timeframe: '10:00 AM - 12:00 PM'
      },
      {
        id: '4',
        type: 'weather',
        title: 'Rain Risk for Outdoor Tasks',
        description: '40% chance of rain between 3-5 PM may affect pool maintenance and garden work.',
        confidence: 73,
        impact: 'medium',
        recommendation: 'Move outdoor tasks to morning or have indoor backup tasks ready.',
        affectedJobs: jobs.filter(j => j.jobType?.includes('pool') || j.jobType?.includes('garden')).map(j => j.id),
        timeframe: '3:00 PM - 5:00 PM'
      }
    ]
  })

  useEffect(() => {
    fetchPredictions()
  }, [jobs])

  // Get prediction icon
  const getPredictionIcon = (type: string) => {
    switch (type) {
      case 'traffic': return Car
      case 'weather': return Cloud
      case 'optimization': return Target
      case 'guest_behavior': return Users
      case 'bottleneck': return AlertTriangle
      case 'anomaly': return AlertTriangle
      default: return Lightbulb
    }
  }

  // Get impact color
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'text-red-400 border-red-500'
      case 'high': return 'text-orange-400 border-orange-500'
      case 'medium': return 'text-yellow-400 border-yellow-500'
      default: return 'text-blue-400 border-blue-500'
    }
  }

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'text-green-400'
    if (confidence >= 70) return 'text-yellow-400'
    return 'text-orange-400'
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-400">Analyzing operations...</p>
        </div>
      </div>
    )
  }

  if (error && !predictions) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-red-400">AI analysis unavailable</p>
          <button 
            onClick={fetchPredictions}
            className="text-xs text-blue-400 hover:text-blue-300 mt-2"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!predictions || predictions.predictions.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No insights available</p>
          <p className="text-xs text-gray-500">Check back later</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-3 space-y-3">
        {/* AI Summary Header */}
        <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Brain className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-medium text-white">AI Analysis</span>
            </div>
            <button 
              onClick={fetchPredictions}
              className="text-purple-400 hover:text-purple-300"
              disabled={loading}
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-400">Completion Rate</span>
              <div className={`font-medium ${
                predictions.summary.expectedCompletionRate >= 90 ? 'text-green-400' :
                predictions.summary.expectedCompletionRate >= 80 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {predictions.summary.expectedCompletionRate}%
              </div>
            </div>
            <div>
              <span className="text-gray-400">Risk Level</span>
              <div className={`font-medium capitalize ${
                predictions.summary.riskLevel === 'low' ? 'text-green-400' :
                predictions.summary.riskLevel === 'medium' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {predictions.summary.riskLevel}
              </div>
            </div>
            <div>
              <span className="text-gray-400">Confidence</span>
              <div className={`font-medium ${getConfidenceColor(predictions.confidence)}`}>
                {predictions.confidence}%
              </div>
            </div>
            <div>
              <span className="text-gray-400">Optimizations</span>
              <div className="text-blue-400 font-medium">
                {predictions.summary.optimizations}
              </div>
            </div>
          </div>
        </div>

        {/* Predictions List */}
        {predictions.predictions
          .filter(p => p.confidence >= 70) // Only show high-confidence predictions
          .sort((a, b) => b.confidence - a.confidence)
          .map((prediction) => {
            const Icon = getPredictionIcon(prediction.type)
            
            return (
              <div 
                key={prediction.id}
                className={`border rounded-lg p-3 ${getImpactColor(prediction.impact)} bg-gray-900/50`}
              >
                {/* Prediction Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Icon className={`h-4 w-4 ${getImpactColor(prediction.impact).split(' ')[0]}`} />
                    <h4 className="text-sm font-medium text-white">
                      {prediction.title}
                    </h4>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs ${getConfidenceColor(prediction.confidence)}`}>
                      {prediction.confidence}%
                    </div>
                    <div className="text-xs text-gray-400">
                      {prediction.timeframe}
                    </div>
                  </div>
                </div>

                {/* Prediction Description */}
                <p className="text-xs text-gray-300 mb-2">
                  {prediction.description}
                </p>

                {/* Recommendation */}
                {prediction.recommendation && (
                  <div className="bg-gray-800/50 rounded p-2 mb-2">
                    <div className="flex items-start space-x-2">
                      <Lightbulb className="h-3 w-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-yellow-300">
                        {prediction.recommendation}
                      </span>
                    </div>
                  </div>
                )}

                {/* Impact Metrics */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    {prediction.affectedJobs && (
                      <span className="text-gray-400">
                        {prediction.affectedJobs.length} jobs affected
                      </span>
                    )}
                    {prediction.estimatedSavings && (
                      <span className="text-green-400">
                        {prediction.estimatedSavings}min savings
                      </span>
                    )}
                  </div>
                  <span className={`capitalize ${getImpactColor(prediction.impact).split(' ')[0]}`}>
                    {prediction.impact} impact
                  </span>
                </div>
              </div>
            )
          })}

        {/* Last Updated */}
        <div className="text-center text-xs text-gray-500">
          Updated {lastRefresh.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </div>
  )
}
