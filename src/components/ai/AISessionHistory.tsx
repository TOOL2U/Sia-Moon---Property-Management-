'use client'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/Separator'
import {
    AlertCircle,
    CheckCircle,
    ChevronDown,
    ChevronRight,
    Clock,
    Play,
    RotateCcw,
    Settings,
    Trash2,
    XCircle
} from 'lucide-react'
import { useEffect, useState } from 'react'
// Mock AI Memory Service for now
interface AIMemoryData {
  adminId: string
  recentCommands: AICommand[]
  rejectedSuggestions: RejectedSuggestion[]
  preferences: any
  conversationContext: any[]
}

interface AICommand {
  id: string
  type: string
  description: string
  status: 'pending' | 'approved' | 'rejected' | 'executed'
  timestamp: any
  data: any
  executionResult?: any
}

interface RejectedSuggestion {
  id: string
  suggestion: string
  reason?: string
  timestamp: any
}

// Mock service that uses localStorage for persistence
const getAIMemoryService = () => ({
  async getMemory(adminId: string): Promise<AIMemoryData> {
    const stored = localStorage.getItem(`ai_memory_${adminId}`)
    if (stored) {
      return JSON.parse(stored)
    }

    // Return default memory structure
    return {
      adminId,
      recentCommands: [
        {
          id: 'cmd_1',
          type: 'assign_staff',
          description: 'Assign John Doe to cleaning job at Villa Paradise',
          status: 'executed',
          timestamp: new Date(),
          data: { staffName: 'John Doe', jobId: 'job_123' },
          executionResult: { success: true, message: 'Staff assigned successfully' }
        },
        {
          id: 'cmd_2',
          type: 'approve_booking',
          description: 'Approve booking abc123 for Villa Sunset',
          status: 'approved',
          timestamp: new Date(),
          data: { bookingId: 'abc123' }
        }
      ],
      rejectedSuggestions: [
        {
          id: 'rej_1',
          suggestion: 'Assign Maria to job job_456 (she is on vacation)',
          reason: 'Staff member is unavailable',
          timestamp: new Date()
        }
      ],
      preferences: {
        communicationStyle: 'detailed',
        autoApprovalThreshold: 85,
        defaultStaffAssignments: {
          'villa-paradise': 'John Doe',
          'villa-sunset': 'Maria Smith'
        }
      },
      conversationContext: []
    }
  },

  async clearMemory(adminId: string, type: string) {
    console.log(`Clearing ${type} memory for ${adminId}`)
    // In a real implementation, this would clear specific memory types
  }
})

interface AISessionHistoryProps {
  adminId: string
  onRerunCommand?: (command: AICommand) => void
  onClearMemory?: (type: string) => void
  className?: string
}

export function AISessionHistory({
  adminId,
  onRerunCommand,
  onClearMemory,
  className = ''
}: AISessionHistoryProps) {
  // Initialize with sample data immediately
  const [memory, setMemory] = useState<AIMemoryData>({
    adminId,
    recentCommands: [
      {
        id: 'cmd_1',
        type: 'assign_staff',
        description: 'Assign John Doe to cleaning job at Villa Paradise',
        status: 'executed',
        timestamp: new Date(),
        data: { staffName: 'John Doe', jobId: 'job_123' },
        executionResult: { success: true, message: 'Staff assigned successfully' }
      },
      {
        id: 'cmd_2',
        type: 'approve_booking',
        description: 'Approve booking abc123 for Villa Sunset',
        status: 'approved',
        timestamp: new Date(),
        data: { bookingId: 'abc123' }
      },
      {
        id: 'cmd_3',
        type: 'update_calendar',
        description: 'Add cleaning event for Villa Paradise on July 25th',
        status: 'pending',
        timestamp: new Date(),
        data: { property: 'Villa Paradise', date: '2024-07-25', eventType: 'cleaning' }
      }
    ],
    rejectedSuggestions: [
      {
        id: 'rej_1',
        suggestion: 'Assign Maria to job job_456',
        reason: 'Staff member is on vacation',
        timestamp: new Date()
      },
      {
        id: 'rej_2',
        suggestion: 'Schedule maintenance on Sunday',
        reason: 'No weekend maintenance policy',
        timestamp: new Date()
      }
    ],
    preferences: {
      communicationStyle: 'detailed',
      autoApprovalThreshold: 85,
      defaultStaffAssignments: {
        'villa-paradise': 'John Doe',
        'villa-sunset': 'Maria Smith',
        'villa-ocean': 'Alex Johnson'
      }
    },
    conversationContext: []
  })
  const [loading, setLoading] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    commands: true,
    rejected: false,
    preferences: false,
    context: false
  })

  // Load memory data (simplified since we start with sample data)
  useEffect(() => {
    console.log('🧠 AI Memory initialized with sample data')
  }, [adminId])

  const loadMemory = async () => {
    // For now, just refresh the existing data
    console.log('🔄 AI Memory refreshed')
  }

  const handleRerunCommand = (command: AICommand) => {
    if (onRerunCommand) {
      onRerunCommand(command)
    }
  }

  const handleClearMemory = async (type: string) => {
    try {
      const aiMemoryService = getAIMemoryService()
      await aiMemoryService.clearMemory(adminId, type as any)
      await loadMemory() // Reload data

      if (onClearMemory) {
        onClearMemory(type)
      }
    } catch (error) {
      console.error('Failed to clear memory:', error)
    }
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const getStatusIcon = (status: AICommand['status']) => {
    switch (status) {
      case 'executed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: AICommand['status']) => {
    switch (status) {
      case 'executed':
        return 'bg-green-600'
      case 'approved':
        return 'bg-blue-600'
      case 'rejected':
        return 'bg-red-600'
      case 'pending':
        return 'bg-yellow-600'
      default:
        return 'bg-gray-600'
    }
  }

  // Always show the memory interface since we have sample data

  return (
    <Card className={`bg-slate-800 border-slate-700 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="h-5 w-5" />
            AI Session History
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadMemory()}
            className="text-slate-400 hover:text-white"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Recent Commands */}
        <Collapsible
          open={expandedSections.commands}
          onOpenChange={() => toggleSection('commands')}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded hover:bg-slate-700 transition-colors">
            <div className="flex items-center gap-2">
              {expandedSections.commands ?
                <ChevronDown className="h-4 w-4 text-slate-400" /> :
                <ChevronRight className="h-4 w-4 text-slate-400" />
              }
              <span className="text-white font-medium">🕒 Recent Commands</span>
              <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                {memory.recentCommands.length}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleClearMemory('commands')
              }}
              className="text-slate-400 hover:text-red-400"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            {memory.recentCommands.length === 0 ? (
              <div className="text-slate-400 text-sm text-center py-2">
                No recent commands
              </div>
            ) : (
              memory.recentCommands.slice(-10).reverse().map((command) => (
                <div key={command.id} className="bg-slate-700 rounded p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(command.status)}
                      <span className="text-white text-sm font-medium">
                        {command.type}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getStatusColor(command.status)} text-white border-none`}
                      >
                        {command.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRerunCommand(command)}
                        className="text-slate-400 hover:text-blue-400 h-6 w-6 p-0"
                        title="Re-run command"
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-slate-300 text-sm">
                    {command.description}
                  </div>
                  {command.executionResult && (
                    <div className="text-xs text-slate-400">
                      Result: {command.executionResult.message}
                    </div>
                  )}
                </div>
              ))
            )}
          </CollapsibleContent>
        </Collapsible>

        <Separator className="bg-slate-600" />

        {/* Rejected Suggestions */}
        <Collapsible
          open={expandedSections.rejected}
          onOpenChange={() => toggleSection('rejected')}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded hover:bg-slate-700 transition-colors">
            <div className="flex items-center gap-2">
              {expandedSections.rejected ?
                <ChevronDown className="h-4 w-4 text-slate-400" /> :
                <ChevronRight className="h-4 w-4 text-slate-400" />
              }
              <span className="text-white font-medium">❌ Rejected Suggestions</span>
              <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                {memory.rejectedSuggestions.length}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleClearMemory('suggestions')
              }}
              className="text-slate-400 hover:text-red-400"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            {memory.rejectedSuggestions.length === 0 ? (
              <div className="text-slate-400 text-sm text-center py-2">
                No rejected suggestions
              </div>
            ) : (
              memory.rejectedSuggestions.slice(-5).reverse().map((rejection) => (
                <div key={rejection.id} className="bg-slate-700 rounded p-3">
                  <div className="text-slate-300 text-sm mb-1">
                    {rejection.suggestion}
                  </div>
                  {rejection.reason && (
                    <div className="text-xs text-slate-400">
                      Reason: {rejection.reason}
                    </div>
                  )}
                </div>
              ))
            )}
          </CollapsibleContent>
        </Collapsible>

        <Separator className="bg-slate-600" />

        {/* Preferences */}
        <Collapsible
          open={expandedSections.preferences}
          onOpenChange={() => toggleSection('preferences')}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded hover:bg-slate-700 transition-colors">
            <div className="flex items-center gap-2">
              {expandedSections.preferences ?
                <ChevronDown className="h-4 w-4 text-slate-400" /> :
                <ChevronRight className="h-4 w-4 text-slate-400" />
              }
              <span className="text-white font-medium">⚙️ Preferences</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleClearMemory('preferences')
              }}
              className="text-slate-400 hover:text-red-400"
            >
              <Settings className="h-3 w-3" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            <div className="bg-slate-700 rounded p-3 space-y-2">
              <div className="text-sm">
                <span className="text-slate-400">Communication Style:</span>
                <span className="text-white ml-2">{memory.preferences.communicationStyle}</span>
              </div>
              <div className="text-sm">
                <span className="text-slate-400">Auto-Approval Threshold:</span>
                <span className="text-white ml-2">{memory.preferences.autoApprovalThreshold}%</span>
              </div>
              {Object.keys(memory.preferences.defaultStaffAssignments).length > 0 && (
                <div className="text-sm">
                  <span className="text-slate-400">Default Staff:</span>
                  <div className="mt-1 space-y-1">
                    {Object.entries(memory.preferences.defaultStaffAssignments).map(([property, staff]) => (
                      <div key={property} className="text-xs text-slate-300 ml-2">
                        {property}: {staff}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Clear All Button */}
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleClearMemory('all')}
            className="w-full text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All Memory
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
