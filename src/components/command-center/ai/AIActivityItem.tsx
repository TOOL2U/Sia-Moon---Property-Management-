'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Clock, Zap, TrendingUp } from 'lucide-react'
import ActivityTypeIcon from './ActivityTypeIcon'
import { AIActivity } from '@/services/AIActivityLogger'

interface AIActivityItemProps {
  activity: AIActivity
  isNew?: boolean
}

export default function AIActivityItem({ activity, isNew = false }: AIActivityItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Get impact styling
  const getImpactStyles = () => {
    switch (activity.impact) {
      case 'critical':
        return {
          border: 'border-red-500/50',
          bg: 'bg-red-900/10',
          text: 'text-red-400',
          pulse: 'animate-pulse'
        }
      case 'high':
        return {
          border: 'border-orange-500/50',
          bg: 'bg-orange-900/10',
          text: 'text-orange-400',
          pulse: ''
        }
      case 'medium':
        return {
          border: 'border-blue-500/50',
          bg: 'bg-blue-900/10',
          text: 'text-blue-400',
          pulse: ''
        }
      default:
        return {
          border: 'border-gray-600',
          bg: 'bg-gray-900/50',
          text: 'text-gray-400',
          pulse: ''
        }
    }
  }

  const styles = getImpactStyles()

  // Get confidence color
  const getConfidenceColor = () => {
    if (activity.confidence >= 90) return 'text-green-400'
    if (activity.confidence >= 80) return 'text-blue-400'
    if (activity.confidence >= 70) return 'text-yellow-400'
    return 'text-orange-400'
  }

  // Format timestamp
  const formatTimestamp = () => {
    if (!activity.timestamp) return 'Unknown'
    
    const date = activity.timestamp.toDate ? activity.timestamp.toDate() : new Date(activity.timestamp)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    return date.toLocaleDateString()
  }

  // Get status indicator
  const getStatusIndicator = () => {
    switch (activity.status) {
      case 'completed':
        return <div className="w-2 h-2 bg-green-400 rounded-full" />
      case 'active':
        return <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
      case 'failed':
        return <div className="w-2 h-2 bg-red-400 rounded-full" />
      case 'cancelled':
        return <div className="w-2 h-2 bg-gray-400 rounded-full" />
      default:
        return <div className="w-2 h-2 bg-yellow-400 rounded-full" />
    }
  }

  // Get metadata display
  const getMetadataDisplay = () => {
    if (!activity.metadata) return null

    const items = []
    
    if (activity.metadata.timeSaved) {
      items.push({
        icon: Clock,
        label: 'Time Saved',
        value: `${activity.metadata.timeSaved}min`,
        color: 'text-green-400'
      })
    }
    
    if (activity.metadata.costSaved) {
      items.push({
        icon: TrendingUp,
        label: 'Cost Saved',
        value: `฿${activity.metadata.costSaved}`,
        color: 'text-green-400'
      })
    }
    
    if (activity.metadata.efficiencyGain) {
      items.push({
        icon: Zap,
        label: 'Efficiency',
        value: `+${Math.round(activity.metadata.efficiencyGain)}%`,
        color: 'text-blue-400'
      })
    }
    
    if (activity.metadata.riskReduced) {
      items.push({
        icon: TrendingUp,
        label: 'Risk Reduced',
        value: `${Math.round(activity.metadata.riskReduced)}%`,
        color: 'text-purple-400'
      })
    }

    return items
  }

  const metadataItems = getMetadataDisplay()

  return (
    <div 
      className={`
        border rounded-lg p-2 transition-all duration-300 cursor-pointer
        ${styles.border} ${styles.bg} ${styles.pulse}
        ${isNew ? 'ring-2 ring-purple-500/30 shadow-lg' : ''}
        hover:shadow-md
      `}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Activity Header */}
      <div className="flex items-start space-x-2">
        <div className="flex-shrink-0 mt-0.5">
          <ActivityTypeIcon type={activity.type} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white font-medium truncate">
                {activity.description}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`text-xs capitalize ${styles.text}`}>
                  {activity.type.replace('_', ' ')}
                </span>
                <span className={`text-xs font-medium ${getConfidenceColor()}`}>
                  {activity.confidence}%
                </span>
                {activity.automated && (
                  <span className="text-xs text-purple-400">AUTO</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-1 ml-2">
              {getStatusIndicator()}
              <span className="text-xs text-gray-400">
                {formatTimestamp()}
              </span>
              {isExpanded ? (
                <ChevronDown className="h-3 w-3 text-gray-400" />
              ) : (
                <ChevronRight className="h-3 w-3 text-gray-400" />
              )}
            </div>
          </div>

          {/* Quick Metadata */}
          {metadataItems && metadataItems.length > 0 && (
            <div className="flex items-center space-x-3 mt-1">
              {metadataItems.slice(0, 2).map((item, index) => {
                const Icon = item.icon
                return (
                  <div key={index} className="flex items-center space-x-1">
                    <Icon className={`h-3 w-3 ${item.color}`} />
                    <span className={`text-xs ${item.color}`}>
                      {item.value}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-600 space-y-2">
          {/* Reasoning */}
          <div className="bg-gray-800/50 rounded p-2">
            <div className="text-xs text-gray-400 mb-1">AI Reasoning</div>
            <div className="text-xs text-gray-200">{activity.reasoning}</div>
          </div>

          {/* Full Metadata */}
          {metadataItems && metadataItems.length > 0 && (
            <div className="bg-gray-800/50 rounded p-2">
              <div className="text-xs text-gray-400 mb-2">Impact Metrics</div>
              <div className="grid grid-cols-2 gap-2">
                {metadataItems.map((item, index) => {
                  const Icon = item.icon
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <Icon className={`h-3 w-3 ${item.color}`} />
                        <span className="text-xs text-gray-300">{item.label}</span>
                      </div>
                      <span className={`text-xs font-medium ${item.color}`}>
                        {item.value}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Related Entities */}
          {(activity.relatedEntities.jobIds?.length || 
            activity.relatedEntities.staffIds?.length || 
            activity.relatedEntities.propertyIds?.length) && (
            <div className="bg-gray-800/50 rounded p-2">
              <div className="text-xs text-gray-400 mb-2">Related Entities</div>
              <div className="space-y-1">
                {activity.relatedEntities.jobIds?.length && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">Jobs:</span>
                    <div className="flex flex-wrap gap-1">
                      {activity.relatedEntities.jobIds.slice(0, 3).map((id, index) => (
                        <span key={index} className="text-xs bg-blue-900/30 text-blue-300 px-1 py-0.5 rounded">
                          {id.slice(-4)}
                        </span>
                      ))}
                      {activity.relatedEntities.jobIds.length > 3 && (
                        <span className="text-xs text-gray-400">
                          +{activity.relatedEntities.jobIds.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {activity.relatedEntities.staffIds?.length && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">Staff:</span>
                    <div className="flex flex-wrap gap-1">
                      {activity.relatedEntities.staffIds.slice(0, 2).map((id, index) => (
                        <span key={index} className="text-xs bg-green-900/30 text-green-300 px-1 py-0.5 rounded">
                          {id.slice(-4)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Source and Status */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">Source:</span>
              <span className="text-purple-300 uppercase">{activity.source.replace('_', ' ')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">Status:</span>
              <span className={`capitalize ${
                activity.status === 'completed' ? 'text-green-400' :
                activity.status === 'active' ? 'text-blue-400' :
                activity.status === 'failed' ? 'text-red-400' : 'text-gray-400'
              }`}>
                {activity.status}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
