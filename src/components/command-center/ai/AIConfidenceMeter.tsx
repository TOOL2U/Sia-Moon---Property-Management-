'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react'
import { AISystemConfidence } from '@/services/AIActivityLogger'

interface AIConfidenceMeterProps {
  confidence: AISystemConfidence
  showDetails?: boolean
}

export default function AIConfidenceMeter({ confidence, showDetails = false }: AIConfidenceMeterProps) {
  const [expanded, setExpanded] = useState(false)

  // Get confidence color and styling
  const getConfidenceStyles = () => {
    if (confidence.overall >= 90) {
      return {
        color: 'text-green-400',
        bg: 'bg-green-400',
        ring: 'ring-green-400/30',
        text: 'Excellent'
      }
    } else if (confidence.overall >= 80) {
      return {
        color: 'text-blue-400',
        bg: 'bg-blue-400',
        ring: 'ring-blue-400/30',
        text: 'Good'
      }
    } else if (confidence.overall >= 70) {
      return {
        color: 'text-yellow-400',
        bg: 'bg-yellow-400',
        ring: 'ring-yellow-400/30',
        text: 'Fair'
      }
    } else {
      return {
        color: 'text-red-400',
        bg: 'bg-red-400',
        ring: 'ring-red-400/30',
        text: 'Poor'
      }
    }
  }

  const styles = getConfidenceStyles()

  // Get trend icon
  const getTrendIcon = () => {
    switch (confidence.trend) {
      case 'improving':
        return <TrendingUp className="h-3 w-3 text-green-400" />
      case 'declining':
        return <TrendingDown className="h-3 w-3 text-red-400" />
      default:
        return <Minus className="h-3 w-3 text-gray-400" />
    }
  }

  // Get factor color
  const getFactorColor = (value: number) => {
    if (value >= 90) return 'text-green-400'
    if (value >= 80) return 'text-blue-400'
    if (value >= 70) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="space-y-2">
      {/* Main Confidence Display */}
      <div 
        className={`
          bg-gray-900 rounded-lg p-2 cursor-pointer transition-all duration-200
          ${showDetails ? 'hover:bg-gray-800' : ''}
          ${expanded ? `ring-1 ${styles.ring}` : ''}
        `}
        onClick={() => showDetails && setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="text-xs text-gray-400">System Confidence</div>
            {showDetails && (
              <Info className="h-3 w-3 text-gray-500" />
            )}
          </div>
          <div className="flex items-center space-x-2">
            {getTrendIcon()}
            <span className={`text-sm font-bold ${styles.color}`}>
              {confidence.overall}%
            </span>
          </div>
        </div>

        {/* Confidence Bar */}
        <div className="mt-2">
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full transition-all duration-500 ${styles.bg}`}
              style={{ width: `${confidence.overall}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-500">AI Health</span>
            <span className={`text-xs ${styles.color}`}>
              {styles.text}
            </span>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      {expanded && showDetails && (
        <div className="bg-gray-900 rounded-lg p-2 space-y-2 animate-in slide-in-from-top-2 duration-200">
          <div className="text-xs text-gray-400 mb-2">Confidence Factors</div>
          
          {/* Decision Accuracy */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-300">Decision Accuracy</span>
            <div className="flex items-center space-x-2">
              <div className="w-16 bg-gray-700 rounded-full h-1">
                <div 
                  className={`h-1 rounded-full ${getFactorColor(confidence.factors.decisionAccuracy) === 'text-green-400' ? 'bg-green-400' : 
                    getFactorColor(confidence.factors.decisionAccuracy) === 'text-blue-400' ? 'bg-blue-400' :
                    getFactorColor(confidence.factors.decisionAccuracy) === 'text-yellow-400' ? 'bg-yellow-400' : 'bg-red-400'}`}
                  style={{ width: `${confidence.factors.decisionAccuracy}%` }}
                />
              </div>
              <span className={`text-xs font-medium ${getFactorColor(confidence.factors.decisionAccuracy)}`}>
                {confidence.factors.decisionAccuracy}%
              </span>
            </div>
          </div>

          {/* Prediction Success */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-300">Prediction Success</span>
            <div className="flex items-center space-x-2">
              <div className="w-16 bg-gray-700 rounded-full h-1">
                <div 
                  className={`h-1 rounded-full ${getFactorColor(confidence.factors.predictionSuccess) === 'text-green-400' ? 'bg-green-400' : 
                    getFactorColor(confidence.factors.predictionSuccess) === 'text-blue-400' ? 'bg-blue-400' :
                    getFactorColor(confidence.factors.predictionSuccess) === 'text-yellow-400' ? 'bg-yellow-400' : 'bg-red-400'}`}
                  style={{ width: `${confidence.factors.predictionSuccess}%` }}
                />
              </div>
              <span className={`text-xs font-medium ${getFactorColor(confidence.factors.predictionSuccess)}`}>
                {confidence.factors.predictionSuccess}%
              </span>
            </div>
          </div>

          {/* System Uptime */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-300">System Uptime</span>
            <div className="flex items-center space-x-2">
              <div className="w-16 bg-gray-700 rounded-full h-1">
                <div 
                  className={`h-1 rounded-full ${getFactorColor(confidence.factors.systemUptime) === 'text-green-400' ? 'bg-green-400' : 
                    getFactorColor(confidence.factors.systemUptime) === 'text-blue-400' ? 'bg-blue-400' :
                    getFactorColor(confidence.factors.systemUptime) === 'text-yellow-400' ? 'bg-yellow-400' : 'bg-red-400'}`}
                  style={{ width: `${confidence.factors.systemUptime}%` }}
                />
              </div>
              <span className={`text-xs font-medium ${getFactorColor(confidence.factors.systemUptime)}`}>
                {confidence.factors.systemUptime}%
              </span>
            </div>
          </div>

          {/* User Satisfaction */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-300">User Satisfaction</span>
            <div className="flex items-center space-x-2">
              <div className="w-16 bg-gray-700 rounded-full h-1">
                <div 
                  className={`h-1 rounded-full ${getFactorColor(confidence.factors.userSatisfaction) === 'text-green-400' ? 'bg-green-400' : 
                    getFactorColor(confidence.factors.userSatisfaction) === 'text-blue-400' ? 'bg-blue-400' :
                    getFactorColor(confidence.factors.userSatisfaction) === 'text-yellow-400' ? 'bg-yellow-400' : 'bg-red-400'}`}
                  style={{ width: `${confidence.factors.userSatisfaction}%` }}
                />
              </div>
              <span className={`text-xs font-medium ${getFactorColor(confidence.factors.userSatisfaction)}`}>
                {confidence.factors.userSatisfaction}%
              </span>
            </div>
          </div>

          {/* Trend Information */}
          <div className="pt-2 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Trend</span>
              <div className="flex items-center space-x-1">
                {getTrendIcon()}
                <span className={`text-xs capitalize ${
                  confidence.trend === 'improving' ? 'text-green-400' :
                  confidence.trend === 'declining' ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {confidence.trend}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
