'use client'

export default function MissionPanelPlaceholder() {
  const mockMissions = [
    {
      id: 1,
      title: "Villa Cleaning - Sunset Bay",
      status: "in-progress",
      priority: "high",
      assignee: "Maria Santos",
      eta: "14:30",
      progress: 75
    },
    {
      id: 2,
      title: "Pool Maintenance - Ocean View",
      status: "pending",
      priority: "medium",
      assignee: "John Smith",
      eta: "16:00",
      progress: 0
    },
    {
      id: 3,
      title: "Guest Check-in - Paradise Villa",
      status: "completed",
      priority: "high",
      assignee: "Lisa Chen",
      eta: "Completed",
      progress: 100
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400'
      case 'in-progress': return 'text-blue-400'
      case 'pending': return 'text-yellow-400'
      default: return 'text-gray-400'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="h-full w-full flex flex-col">
      {/* Panel Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Active Missions</h2>
          <div className="text-sm text-gray-300">
            {mockMissions.filter(m => m.status !== 'completed').length} Active
          </div>
        </div>
      </div>

      {/* Mission List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {mockMissions.map((mission) => (
            <div key={mission.id} className="bg-gray-900 border border-gray-700 rounded-lg p-3">
              {/* Mission Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-white mb-1">
                    {mission.title}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(mission.priority)}`}></div>
                    <span className="text-xs text-gray-400 capitalize">{mission.priority}</span>
                  </div>
                </div>
                <div className={`text-xs font-medium ${getStatusColor(mission.status)} capitalize`}>
                  {mission.status.replace('-', ' ')}
                </div>
              </div>

              {/* Mission Details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Assignee:</span>
                  <span className="text-white">{mission.assignee}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">ETA:</span>
                  <span className="text-white">{mission.eta}</span>
                </div>
                
                {/* Progress Bar */}
                {mission.status !== 'pending' && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Progress:</span>
                      <span className="text-white">{mission.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-1.5">
                      <div 
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${mission.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Panel Footer */}
      <div className="p-3 border-t border-gray-700 bg-gray-800/50">
        <div className="text-center">
          <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
            View All Missions →
          </button>
        </div>
      </div>
    </div>
  )
}
