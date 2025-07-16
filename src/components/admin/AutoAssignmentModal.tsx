'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'
import {
  X,
  Loader2,
  Zap,
  User,
  MapPin,
  Clock,
  Star,
  Briefcase,
  Target,
  Brain,
  CheckCircle,
  AlertTriangle,
  TrendingUp
} from 'lucide-react'
import IntelligentStaffAssignmentService from '@/services/IntelligentStaffAssignmentService'
import CalendarEventService from '@/services/CalendarEventService'

interface CalendarEvent {
  id: string
  title: string
  startDate: string
  endDate: string
  propertyId: string
  propertyName: string
  type: string
  status: string
  assignedStaff?: string
  staffId?: string
  description?: string
}

interface AutoAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  event: CalendarEvent | null
  onAssignmentComplete: (eventId: string, staffId: string, staffName: string) => void
}

export default function AutoAssignmentModal({
  isOpen,
  onClose,
  event,
  onAssignmentComplete
}: AutoAssignmentModalProps) {
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [aiRecommendation, setAiRecommendation] = useState<any>(null)
  const [fallbackAssignment, setFallbackAssignment] = useState<any>(null)
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null)
  const [assigning, setAssigning] = useState(false)
  const [executionTime, setExecutionTime] = useState<number>(0)

  // Load AI suggestions when modal opens
  useEffect(() => {
    if (isOpen && event) {
      loadAISuggestions()
    }
  }, [isOpen, event])

  const loadAISuggestions = async () => {
    if (!event) return

    try {
      setLoading(true)
      console.log('🤖 Loading AI staff assignment suggestions...')

      const jobData = {
        id: event.id,
        title: event.title,
        type: event.type,
        propertyId: event.propertyId,
        propertyName: event.propertyName,
        startDate: event.startDate,
        endDate: event.endDate,
        priority: 'medium' as const,
        requiredSkills: getRequiredSkills(event.type),
        estimatedDuration: calculateDuration(event.startDate, event.endDate)
      }

      const result = await IntelligentStaffAssignmentService.getAssignmentSuggestions(jobData)
      
      setSuggestions(result.suggestions)
      setAiRecommendation(result.aiRecommendation)
      setFallbackAssignment(result.fallbackAssignment)
      setExecutionTime(result.executionTime)

      console.log(`✅ Loaded ${result.suggestions.length} AI suggestions in ${result.executionTime}ms`)

    } catch (error) {
      console.error('❌ Error loading AI suggestions:', error)
      toast.error('Failed to load AI suggestions')
    } finally {
      setLoading(false)
    }
  }

  const handleAssignStaff = async (staffId: string, staffName: string) => {
    if (!event) return

    try {
      setAssigning(true)
      setSelectedStaff(staffId)

      console.log(`👤 Assigning ${staffName} to event ${event.id}`)

      const result = await CalendarEventService.updateEventStaff(event.id, staffId, staffName)

      if (result.success) {
        toast.success(`✅ ${staffName} assigned successfully`)
        onAssignmentComplete(event.id, staffId, staffName)
        onClose()
      } else {
        toast.error(`❌ Failed to assign staff: ${result.error}`)
      }

    } catch (error) {
      console.error('❌ Error assigning staff:', error)
      toast.error('Failed to assign staff')
    } finally {
      setAssigning(false)
      setSelectedStaff(null)
    }
  }

  const getRequiredSkills = (jobType: string): string[] => {
    const skillMap: Record<string, string[]> = {
      'Cleaning': ['cleaning', 'housekeeping', 'sanitization'],
      'Maintenance': ['maintenance', 'repair', 'technical'],
      'Check-in': ['guest services', 'hospitality'],
      'Check-out': ['inspection', 'housekeeping'],
      'Inspection': ['quality control', 'assessment']
    }
    return skillMap[jobType] || []
  }

  const calculateDuration = (startDate: string, endDate: string): number => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60)) // minutes
  }

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-400'
    if (confidence >= 0.6) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    if (score >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  if (!isOpen || !event) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                AI Staff Assignment
              </h2>
              <p className="text-gray-400 mt-1">
                {event.title} • {new Date(event.startDate).toLocaleString()}
              </p>
            </div>
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-400 hover:bg-gray-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Job Details */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <MapPin className="w-4 h-4 text-blue-400" />
              {event.propertyName}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Clock className="w-4 h-4 text-green-400" />
              {calculateDuration(event.startDate, event.endDate)} minutes
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Briefcase className="w-4 h-4 text-purple-400" />
              {event.type}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              <span className="ml-3 text-gray-400">Analyzing staff assignments...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* AI Recommendation */}
              {aiRecommendation && (
                <Card className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-purple-500/30">
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Brain className="w-5 h-5 text-purple-400" />
                      <h3 className="font-semibold text-white">AI Recommendation</h3>
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                        {Math.round(aiRecommendation.confidence * 100)}% confidence
                      </Badge>
                    </div>
                    <p className="text-gray-300 text-sm mb-3">{aiRecommendation.reasoning}</p>
                    <Button
                      onClick={() => {
                        const recommendedStaff = suggestions.find(s => s.staffId === aiRecommendation.recommendedStaffId)
                        if (recommendedStaff) {
                          handleAssignStaff(recommendedStaff.staffId, recommendedStaff.staffName)
                        }
                      }}
                      disabled={assigning}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      {assigning && selectedStaff === aiRecommendation.recommendedStaffId ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Accept AI Recommendation
                    </Button>
                  </div>
                </Card>
              )}

              {/* Staff Suggestions */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-400" />
                  Staff Suggestions
                  {executionTime > 0 && (
                    <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                      {executionTime}ms
                    </Badge>
                  )}
                </h3>

                {suggestions.length > 0 ? (
                  <div className="space-y-3">
                    {suggestions.map((suggestion, index) => (
                      <Card key={suggestion.staffId} className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
                        <div className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                  {suggestion.staffName.charAt(0)}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-white">{suggestion.staffName}</h4>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${
                                      suggestion.currentWorkload.utilization < 0.5 ? 'bg-green-400' : 
                                      suggestion.currentWorkload.utilization < 0.8 ? 'bg-yellow-400' : 'bg-red-400'
                                    }`}></div>
                                    <span className="text-sm text-gray-400">
                                      {suggestion.currentWorkload.todayJobs} jobs today
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className={`px-2 py-1 rounded text-xs font-medium ${getScoreColor(suggestion.score)} text-white`}>
                                    {suggestion.score}/100
                                  </div>
                                  <span className={`text-sm font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                                    {Math.round(suggestion.confidence * 100)}%
                                  </span>
                                </div>
                              </div>

                              <div className="text-sm text-gray-300 mb-3">
                                <strong>Match factors:</strong> {suggestion.reasons.slice(0, 3).join(', ')}
                              </div>

                              {/* Match Factor Breakdown */}
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                                <div className="text-center">
                                  <div className="text-gray-400">Proximity</div>
                                  <div className="font-medium text-white">{suggestion.matchFactors.proximityScore}/100</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-gray-400">Workload</div>
                                  <div className="font-medium text-white">{suggestion.matchFactors.workloadScore}/100</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-gray-400">Experience</div>
                                  <div className="font-medium text-white">{suggestion.matchFactors.experienceScore}/100</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-gray-400">Skills</div>
                                  <div className="font-medium text-white">{suggestion.matchFactors.skillScore}/100</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-gray-400">Available</div>
                                  <div className="font-medium text-white">{suggestion.matchFactors.availabilityScore}/100</div>
                                </div>
                              </div>
                            </div>

                            <Button
                              onClick={() => handleAssignStaff(suggestion.staffId, suggestion.staffName)}
                              disabled={assigning}
                              className={`ml-4 ${
                                index === 0 
                                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                              }`}
                            >
                              {assigning && selectedStaff === suggestion.staffId ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <User className="w-4 h-4 mr-2" />
                              )}
                              {index === 0 ? 'Assign Best Match' : 'Assign'}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                    <p className="text-gray-400">No suitable staff found for this assignment</p>
                    
                    {/* Fallback Assignment */}
                    {fallbackAssignment && (
                      <Card className="mt-4 bg-yellow-900/20 border-yellow-500/30">
                        <div className="p-4">
                          <h4 className="font-medium text-yellow-300 mb-2">Fallback Assignment Available</h4>
                          <p className="text-sm text-gray-300 mb-3">{fallbackAssignment.reason}</p>
                          <Button
                            onClick={() => {
                              const fallbackStaff = suggestions.find(s => s.staffId === fallbackAssignment.staffId)
                              if (fallbackStaff) {
                                handleAssignStaff(fallbackAssignment.staffId, fallbackStaff.staffName)
                              }
                            }}
                            disabled={assigning}
                            variant="outline"
                            className="border-yellow-500/50 text-yellow-300 hover:bg-yellow-500/10"
                          >
                            Use Fallback Assignment
                          </Button>
                        </div>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              AI-powered staff matching with proximity, workload, and experience analysis
            </div>
            <div className="flex gap-3">
              <Button
                onClick={onClose}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={loadAISuggestions}
                disabled={loading}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <TrendingUp className="w-4 h-4 mr-2" />
                )}
                Refresh Suggestions
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
