'use client'

import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Badge } from '@/components/ui/Badge'
import { AlertTriangle, CheckCircle, Shield, X } from 'lucide-react'
import React from 'react'

interface ActionConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  onCancel: () => void
  intent: {
    action: string
    description: string
    parameters: Record<string, any>
    safetyLevel: 'safe' | 'caution' | 'dangerous'
    confidence: number
  }
}

export function ActionConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  intent
}: ActionConfirmationDialogProps) {
  const getSafetyIcon = (level: string) => {
    switch (level) {
      case 'safe':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'caution':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'dangerous':
        return <Shield className="h-5 w-5 text-red-500" />
      default:
        return <Shield className="h-5 w-5 text-gray-500" />
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

  const getActionTitle = (action: string) => {
    switch (action) {
      case 'createBooking':
        return 'Create Booking'
      case 'approveBooking':
        return 'Approve Booking'
      case 'assignStaffToJob':
        return 'Assign Staff to Job'
      case 'createCalendarEvent':
        return 'Create Calendar Event'
      case 'createJob':
        return 'Create Job'
      case 'sendStaffNotification':
        return 'Send Staff Notification'
      default:
        return action.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
    }
  }

  const formatParameters = (params: Record<string, any>) => {
    return Object.entries(params)
      .filter(([key, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => ({
        key: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        value: typeof value === 'object' ? JSON.stringify(value) : String(value)
      }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {getSafetyIcon(intent.safetyLevel)}
            <span>Confirm Action</span>
            <Badge 
              variant="outline" 
              className={`text-xs ${getSafetyColor(intent.safetyLevel)} text-white border-none`}
            >
              {intent.safetyLevel.toUpperCase()}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-slate-700 rounded p-4 space-y-3">
            <div>
              <h4 className="font-medium text-white mb-1">Action</h4>
              <p className="text-slate-300 text-sm">{getActionTitle(intent.action)}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-white mb-1">Description</h4>
              <p className="text-slate-300 text-sm">{intent.description}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-white mb-1">Confidence</h4>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-600 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${intent.confidence * 100}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400">
                  {Math.round(intent.confidence * 100)}%
                </span>
              </div>
            </div>
            
            {formatParameters(intent.parameters).length > 0 && (
              <div>
                <h4 className="font-medium text-white mb-2">Parameters</h4>
                <div className="space-y-1">
                  {formatParameters(intent.parameters).map(({ key, value }) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-slate-400">{key}:</span>
                      <span className="text-slate-300 max-w-32 truncate">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {intent.safetyLevel === 'dangerous' && (
            <div className="bg-red-900/20 border border-red-500/30 rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <span className="text-red-400 font-medium text-sm">High Risk Action</span>
              </div>
              <p className="text-red-300 text-xs">
                This action may have significant consequences. Please review carefully before proceeding.
              </p>
            </div>
          )}
          
          {intent.safetyLevel === 'caution' && (
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <span className="text-yellow-400 font-medium text-sm">Caution Required</span>
              </div>
              <p className="text-yellow-300 text-xs">
                Please verify the details before confirming this action.
              </p>
            </div>
          )}
          
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={onConfirm}
              className={`${
                intent.safetyLevel === 'dangerous' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : intent.safetyLevel === 'caution'
                  ? 'bg-yellow-600 hover:bg-yellow-700'
                  : 'bg-green-600 hover:bg-green-700'
              } text-white`}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Confirm & Execute
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
