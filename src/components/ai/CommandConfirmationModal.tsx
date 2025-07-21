'use client'

import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { 
  AlertTriangle, 
  CheckCircle, 
  Shield, 
  X, 
  Clock,
  Database,
  User,
  Calendar,
  Briefcase,
  Trash2
} from 'lucide-react'
import React, { useState } from 'react'
import { ParsedCommand } from '@/lib/ai/commandParser'

interface CommandConfirmationModalProps {
  commands: ParsedCommand[]
  isOpen: boolean
  onConfirm: (commandId: string) => Promise<void>
  onReject: (commandId: string) => void
  onClose: () => void
  isExecuting?: boolean
}

export default function CommandConfirmationModal({
  commands,
  isOpen,
  onConfirm,
  onReject,
  onClose,
  isExecuting = false
}: CommandConfirmationModalProps) {
  const [executingCommands, setExecutingCommands] = useState<Set<string>>(new Set())

  if (!isOpen || commands.length === 0) return null

  const handleConfirm = async (commandId: string) => {
    setExecutingCommands(prev => new Set(prev).add(commandId))
    try {
      await onConfirm(commandId)
    } finally {
      setExecutingCommands(prev => {
        const newSet = new Set(prev)
        newSet.delete(commandId)
        return newSet
      })
    }
  }

  const getCommandIcon = (type: string) => {
    switch (type) {
      case 'assign_staff':
      case 'reassign_staff':
        return <User className="h-5 w-5" />
      case 'approve_booking':
      case 'update_booking':
        return <CheckCircle className="h-5 w-5" />
      case 'reschedule_job':
      case 'create_job':
        return <Briefcase className="h-5 w-5" />
      case 'update_calendar':
        return <Calendar className="h-5 w-5" />
      case 'delete_job':
        return <Trash2 className="h-5 w-5" />
      default:
        return <Database className="h-5 w-5" />
    }
  }

  const getSafetyColor = (level: string) => {
    switch (level) {
      case 'safe':
        return 'bg-green-600'
      case 'caution':
        return 'bg-yellow-600'
      case 'dangerous':
        return 'bg-red-600'
      default:
        return 'bg-gray-600'
    }
  }

  const getSafetyIcon = (level: string) => {
    switch (level) {
      case 'safe':
        return <CheckCircle className="h-4 w-4" />
      case 'caution':
        return <AlertTriangle className="h-4 w-4" />
      case 'dangerous':
        return <Shield className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-slate-900 border-slate-700">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-blue-400" />
              <CardTitle className="text-white">
                AI Command Confirmation
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-slate-400">
            The AI wants to execute the following commands. Please review and approve each action.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {commands.map((command) => {
            const isExecuting = executingCommands.has(command.id)
            
            return (
              <Card key={command.id} className="bg-slate-800 border-slate-600">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getCommandIcon(command.type)}
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      {/* Command Header */}
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-white">
                          {command.description}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="secondary" 
                            className={`${getSafetyColor(command.safetyLevel)} text-white`}
                          >
                            {getSafetyIcon(command.safetyLevel)}
                            <span className="ml-1 capitalize">{command.safetyLevel}</span>
                          </Badge>
                          <Badge variant="outline" className="text-slate-300">
                            {Math.round(command.confidence * 100)}% confidence
                          </Badge>
                        </div>
                      </div>

                      {/* Command Details */}
                      <div className="bg-slate-700/50 rounded-lg p-3 space-y-2">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-slate-400">Operation:</span>
                            <span className="ml-2 text-white capitalize">{command.operation}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Collection:</span>
                            <span className="ml-2 text-white">{command.collection}</span>
                          </div>
                          {command.documentId && (
                            <div className="col-span-2">
                              <span className="text-slate-400">Document ID:</span>
                              <span className="ml-2 text-white font-mono text-xs">{command.documentId}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Data Preview */}
                        <div>
                          <span className="text-slate-400 text-sm">Data:</span>
                          <div className="mt-1 bg-slate-800 rounded p-2 text-xs font-mono text-slate-300">
                            {JSON.stringify(command.data, null, 2)}
                          </div>
                        </div>
                        
                        {/* Original Text */}
                        <div>
                          <span className="text-slate-400 text-sm">Original AI Response:</span>
                          <div className="mt-1 text-sm text-slate-300 italic">
                            "{command.originalText}"
                          </div>
                        </div>
                      </div>

                      {/* Safety Warning */}
                      {command.safetyLevel === 'dangerous' && (
                        <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-red-400">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="font-medium">Dangerous Operation</span>
                          </div>
                          <p className="text-sm text-red-300 mt-1">
                            This action cannot be undone. Please verify this is the intended operation.
                          </p>
                        </div>
                      )}

                      {command.safetyLevel === 'caution' && (
                        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-yellow-400">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="font-medium">Caution Required</span>
                          </div>
                          <p className="text-sm text-yellow-300 mt-1">
                            This action will modify important data. Please review carefully.
                          </p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center gap-3 pt-2">
                        <Button
                          onClick={() => handleConfirm(command.id)}
                          disabled={isExecuting}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {isExecuting ? (
                            <>
                              <Clock className="h-4 w-4 mr-2 animate-spin" />
                              Executing...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve & Execute
                            </>
                          )}
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={() => onReject(command.id)}
                          disabled={isExecuting}
                          className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-700">
            <div className="text-sm text-slate-400">
              {commands.length} command{commands.length !== 1 ? 's' : ''} pending approval
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isExecuting}
                className="text-slate-400 hover:text-white"
              >
                Close
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
