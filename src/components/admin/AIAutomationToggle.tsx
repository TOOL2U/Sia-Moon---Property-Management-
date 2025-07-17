'use client'

import { useState, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Loader2, AlertTriangle, CheckCircle2, BrainCircuit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import AIAutomationService, { AIAutomationSettings } from '@/services/AIAutomationService'
import { useAuth } from '@/contexts/AuthContext'

export default function AIAutomationToggle() {
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastModified, setLastModified] = useState<Date | null>(null)
  const [modifiedBy, setModifiedBy] = useState<string>('system')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingState, setPendingState] = useState(false)
  
  const { user } = useAuth()

  useEffect(() => {
    // Initialize settings if they don't exist
    AIAutomationService.initializeSettings()
    
    // Set up real-time listener
    const unsubscribe = AIAutomationService.subscribeToSettings(
      (settings: AIAutomationSettings) => {
        setEnabled(settings.enabled)
        setLastModified(settings.lastModified ? new Date(settings.lastModified.toDate()) : null)
        setModifiedBy(settings.modifiedBy)
        setLoading(false)
      },
      (error) => {
        setError('Failed to load AI automation settings')
        setLoading(false)
        console.error('Error in AI automation settings listener:', error)
      }
    )

    return () => {
      unsubscribe()
    }
  }, [])

  const handleToggleChange = (checked: boolean) => {
    if (!checked) {
      // Show confirmation dialog when disabling
      setPendingState(checked)
      setShowConfirmDialog(true)
    } else {
      // Enable without confirmation
      updateAIAutomation(checked)
    }
  }

  const updateAIAutomation = async (newState: boolean) => {
    if (!user) {
      setError('You must be logged in to change settings')
      return
    }

    try {
      setLoading(true)
      await AIAutomationService.updateSettings(
        newState,
        user.uid,
        user.displayName || user.email || 'Admin User'
      )
      setShowConfirmDialog(false)
    } catch (error) {
      setError('Failed to update AI automation settings')
      console.error('Error updating AI automation:', error)
    } finally {
      setLoading(false)
    }
  }

  const confirmDisable = () => {
    updateAIAutomation(pendingState)
  }

  const cancelDisable = () => {
    setShowConfirmDialog(false)
    setPendingState(enabled) // Reset to current state
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BrainCircuit className={`h-5 w-5 ${enabled ? 'text-green-400' : 'text-neutral-400'}`} />
            <Label htmlFor="ai-automation" className="text-lg font-medium text-white">
              Enable AI Operations
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
            ) : enabled ? (
              <div className="flex items-center space-x-1 text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs">Active</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-red-400">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs">Inactive</span>
              </div>
            )}
            <Switch
              id="ai-automation"
              checked={enabled}
              onCheckedChange={handleToggleChange}
              disabled={loading}
              className={`${enabled ? 'bg-green-500' : 'bg-red-500'}`}
            />
          </div>
        </div>
        <p className="text-sm text-neutral-400 ml-7">
          Allow AI to automatically manage bookings, job assignments, and staff scheduling
        </p>
        {lastModified && (
          <p className="text-xs text-neutral-500 ml-7">
            Last modified: {lastModified.toLocaleString()} by {modifiedBy}
          </p>
        )}
        {error && (
          <p className="text-xs text-red-400 ml-7">
            {error}
          </p>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Disable AI Operations?
            </DialogTitle>
            <DialogDescription className="text-neutral-400">
              Disabling AI operations will require manual oversight for all bookings, job assignments, and staff scheduling.
              Calendar events will not be created automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-neutral-800 p-4 rounded-md text-sm text-yellow-400 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Important:</p>
              <p className="text-neutral-300">
                You will need to manually create calendar events, assign jobs to staff, and process bookings
                until AI operations are re-enabled.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={cancelDisable}
              className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDisable}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Disable AI Operations
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
