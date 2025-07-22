'use client'

import { useState, useEffect } from 'react'

export default function AIActivityPlaceholder() {
  const [activities, setActivities] = useState([
    { id: 1, action: "Analyzing booking patterns", timestamp: new Date(), type: "analysis" },
    { id: 2, action: "Optimizing staff schedules", timestamp: new Date(Date.now() - 30000), type: "optimization" },
    { id: 3, action: "Processing guest feedback", timestamp: new Date(Date.now() - 60000), type: "processing" }
  ])

  // Simulate real-time AI activity
  useEffect(() => {
    const interval = setInterval(() => {
      const newActivity = {
        id: Date.now(),
        action: getRandomActivity(),
        timestamp: new Date(),
        type: getRandomType()
      }
      
      setActivities(prev => [newActivity, ...prev.slice(0, 4)]) // Keep only 5 most recent
    }, 8000) // New activity every 8 seconds

    return () => clearInterval(interval)
  }, [])

  const getRandomActivity = () => {
    const activities = [
      "Analyzing guest preferences",
      "Optimizing cleaning routes",
      "Predicting maintenance needs",
      "Processing booking requests",
      "Monitoring staff performance",
      "Analyzing revenue patterns",
      "Optimizing resource allocation",
      "Processing guest communications"
    ]
    return activities[Math.floor(Math.random() * activities.length)]
  }

  const getRandomType = () => {
    const types = ["analysis", "optimization", "processing", "monitoring"]
    return types[Math.floor(Math.random() * types.length)]
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'analysis': return 'text-blue-400'
      case 'optimization': return 'text-green-400'
      case 'processing': return 'text-yellow-400'
      case 'monitoring': return 'text-purple-400'
      default: return 'text-gray-400'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'analysis': return '📊'
      case 'optimization': return '⚡'
      case 'processing': return '⚙️'
      case 'monitoring': return '👁️'
      default: return '🤖'
    }
  }

  return (
    <div className="h-full w-full flex flex-col">
      {/* Panel Header */}
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">AI Activity</h2>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-300">Active</span>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-2">
          {activities.map((activity, index) => (
            <div 
              key={activity.id} 
              className={`bg-gray-900 border border-gray-700 rounded p-2 transition-all duration-300 ${
                index === 0 ? 'border-blue-500/50 bg-blue-500/5' : ''
              }`}
            >
              <div className="flex items-start space-x-2">
                <span className="text-sm">{getTypeIcon(activity.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate">
                    {activity.action}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-xs ${getTypeColor(activity.type)} capitalize`}>
                      {activity.type}
                    </span>
                    <span className="text-xs text-gray-400">
                      {activity.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Panel Footer */}
      <div className="p-2 border-t border-gray-700 bg-gray-800/50">
        <div className="text-center">
          <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
            View AI Logs →
          </button>
        </div>
      </div>
    </div>
  )
}
