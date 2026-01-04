'use client'

import { AIActivity, aiActivityLogger, AISystemConfidence } from '@/services/AIActivityLogger'
import { Activity, AlertTriangle, Brain } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import AIActivityItem from './AIActivityItem'
import AIConfidenceMeter from './AIConfidenceMeter'
import AIStatusIndicator from './AIStatusIndicator'

interface AIBrainActivityProps {
  className?: string
}

export default function AIBrainActivity({ className = '' }: AIBrainActivityProps) {
  const [activities, setActivities] = useState<AIActivity[]>([])
  const [systemConfidence, setSystemConfidence] = useState<AISystemConfidence | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const mockGeneratedRef = useRef(false)

  // Set up real-time activity listener
  useEffect(() => {
    console.log('🤖 Setting up AI Brain Activity listener...')

    const unsubscribe = aiActivityLogger.setupActivityListener(
      (newActivities) => {
        setActivities(newActivities)
        setIsConnected(true)
        setError(null)
        setLoading(false)

        // Auto-scroll to top when new activities arrive
        if (scrollRef.current) {
          scrollRef.current.scrollTop = 0
        }
      },
      20 // Show latest 20 activities
    )

    // Load initial system confidence
    aiActivityLogger.getSystemConfidence()
      .then(confidence => {
        setSystemConfidence(confidence)
      })
      .catch(err => {
        console.error('❌ Error loading system confidence:', err)
      })

    // Simulate some initial activities if none exist (for development)
    // Only run once using ref to prevent infinite loops
    const mockTimer = setTimeout(() => {
      if (!mockGeneratedRef.current) {
        mockGeneratedRef.current = true
        generateMockActivities()
      }
    }, 2000)

    return () => {
      console.log('🔄 Cleaning up AI Brain Activity listener')
      clearTimeout(mockTimer)
      unsubscribe()
    }
  }, [])

  // Generate mock activities for development
  const generateMockActivities = async () => {
    try {
      // Log some sample activities
      await aiActivityLogger.logRouteOptimization({
        staffId: 'staff_001',
        jobIds: ['job_001', 'job_002', 'job_003'],
        timeSaved: 35,
        confidence: 92,
        reasoning: 'Optimized route reduces travel time by clustering nearby properties'
      })

      await aiActivityLogger.logDelayPrediction({
        jobId: 'job_004',
        propertyId: 'prop_001',
        delayRisk: 75,
        estimatedDelay: 25,
        reasoning: 'Traffic congestion and weather conditions indicate high delay probability',
        confidence: 88
      })

      await aiActivityLogger.logBookingDecision({
        bookingId: 'booking_001',
        decision: 'approved',
        reasoning: 'Guest profile and booking value meet approval criteria',
        confidence: 94,
        assignedStaffId: 'staff_002',
        revenueImpact: 4500
      })

      await aiActivityLogger.logAnomalyDetection({
        anomalyType: 'unusual_booking_pattern',
        description: 'Detected 3x normal booking volume for weekend period',
        severity: 'medium',
        confidence: 82,
        affectedEntities: {
          propertyIds: ['prop_001', 'prop_002']
        }
      })

    } catch (error) {
      console.error('❌ Error generating mock activities:', error)
    }
  }

  // Calculate activity statistics
  const activityStats = {
    total: activities.length,
    highImpact: activities.filter(a => a.impact === 'high' || a.impact === 'critical').length,
    automated: activities.filter(a => a.automated).length,
    avgConfidence: activities.length > 0
      ? Math.round(activities.reduce((sum, a) => sum + a.confidence, 0) / activities.length)
      : 0
  }

  if (loading) {
    return (
      <div className={`h-full w-full flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-400">Connecting to AI Brain...</p>
        </div>
      </div>
    )
  }

  if (error && !isConnected) {
    return (
      <div className={`h-full w-full flex items-center justify-center ${className}`}>
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-red-400">AI Brain Offline</p>
          <p className="text-xs text-gray-500 mt-1">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-full w-full flex flex-col bg-gray-800 ${className}`}>
      {/* Panel Header */}
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Brain className="h-4 w-4 text-purple-400" />
            <h2 className="text-sm font-semibold text-white">AI Brain</h2>
          </div>
          <AIStatusIndicator isConnected={isConnected} />
        </div>

        {/* System Confidence */}
        {systemConfidence && (
          <AIConfidenceMeter confidence={systemConfidence} />
        )}

        {/* Activity Statistics */}
        <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
          <div className="bg-gray-900 rounded p-1.5">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Decisions</span>
              <span className="text-white font-medium">{activityStats.total}</span>
            </div>
          </div>
          <div className="bg-gray-900 rounded p-1.5">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">High Impact</span>
              <span className="text-orange-400 font-medium">{activityStats.highImpact}</span>
            </div>
          </div>
          <div className="bg-gray-900 rounded p-1.5">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Automated</span>
              <span className="text-green-400 font-medium">{activityStats.automated}</span>
            </div>
          </div>
          <div className="bg-gray-900 rounded p-1.5">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Avg Confidence</span>
              <span className="text-blue-400 font-medium">{activityStats.avgConfidence}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="flex-1 overflow-hidden">
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
        >
          {activities.length > 0 ? (
            <div className="p-2 space-y-2">
              {activities.map((activity, index) => (
                <AIActivityItem
                  key={activity.id || index}
                  activity={activity}
                  isNew={index === 0}
                />
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No AI activity yet</p>
                <p className="text-xs text-gray-500">Waiting for decisions...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Panel Footer */}
      <div className="p-2 border-t border-gray-700 bg-gray-800/50">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
            }`} />
            <span className="text-gray-400">
              {isConnected ? 'Live Feed' : 'Disconnected'}
            </span>
          </div>
          <button
            onClick={() => window.open('/dashboard/ai', '_blank')}
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            Full AI Dashboard →
          </button>
        </div>
      </div>
    </div>
  )
}
