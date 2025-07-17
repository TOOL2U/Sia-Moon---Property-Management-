'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Settings } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import AIAutomationService from '@/services/AIAutomationService'

interface AIDisabledWarningProps {
  context: 'bookings' | 'jobs' | 'calendar' | 'staff'
  className?: string
}

export default function AIDisabledWarning({ context, className = '' }: AIDisabledWarningProps) {
  const [aiEnabled, setAiEnabled] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Set up real-time listener for AI automation status
    const unsubscribe = AIAutomationService.subscribeToSettings(
      (settings) => {
        setAiEnabled(settings.enabled)
        setLoading(false)
      },
      (error) => {
        console.error('Error monitoring AI automation status:', error)
        setLoading(false)
      }
    )

    return () => {
      unsubscribe()
    }
  }, [])

  if (loading || aiEnabled) {
    return null
  }

  const getContextMessage = () => {
    switch (context) {
      case 'bookings':
        return 'Booking approvals will not automatically create calendar events'
      case 'jobs':
        return 'Job assignments will not automatically create calendar events'
      case 'calendar':
        return 'Calendar events must be created manually'
      case 'staff':
        return 'Staff assignments will not be automated'
      default:
        return 'Manual oversight required for all operations'
    }
  }

  const scrollToSettings = () => {
    // Scroll to settings section if on the same page
    const settingsElement = document.querySelector('[data-section="settings"]')
    if (settingsElement) {
      settingsElement.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className={`bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-yellow-400 font-medium">AI Operations Disabled</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={scrollToSettings}
              className="border-yellow-600 text-yellow-400 hover:bg-yellow-900/30 text-xs"
            >
              <Settings className="h-3 w-3 mr-1" />
              Settings
            </Button>
          </div>
          <p className="text-yellow-300 text-sm mt-1">
            {getContextMessage()}. Enable AI operations in Settings to restore automation.
          </p>
        </div>
      </div>
    </div>
  )
}
