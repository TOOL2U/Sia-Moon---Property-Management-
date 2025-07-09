import { useState } from 'react'
import { Task, User } from '@/types'

/**
 * Type definition for task notification data
 */
export interface TaskNotificationData {
  task: Task
  assignee: User
  property?: {
    id: string
    name: string
    location: string
  }
}

/**
 * Type definition for the hook's return value
 */
export interface UseTaskNotificationsReturn {
  /** Whether the notification is currently being sent */
  isLoading: boolean
  /** Whether the notification was sent successfully */
  isSuccess: boolean
  /** Error message if notification failed */
  error: string | null
  /** Function to send task assignment notification */
  sendTaskAssignmentNotification: (data: TaskNotificationData) => Promise<void>
  /** Function to reset the hook state */
  reset: () => void
}

/**
 * Custom React hook for sending task assignment email notifications via Make.com webhook
 * 
 * This hook handles sending email notifications to staff members when tasks are assigned.
 * It uses the same Make.com webhook infrastructure as the onboarding form.
 * 
 * @example
 * ```tsx
 * const { isLoading, isSuccess, error, sendTaskAssignmentNotification, reset } = useTaskNotifications()
 * 
 * const handleTaskAssignment = async () => {
 *   await sendTaskAssignmentNotification({
 *     task: newTask,
 *     assignee: staffMember,
 *     property: propertyDetails
 *   })
 * }
 * ```
 */
export const useTaskNotifications = (): UseTaskNotificationsReturn => {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Send task assignment notification email
   */
  const sendTaskAssignmentNotification = async (data: TaskNotificationData): Promise<void> => {
    // Validate required environment variable
    const webhookUrl = process.env.NEXT_PUBLIC_MAKE_WEBHOOK_URL
    if (!webhookUrl) {
      const errorMsg = 'Webhook URL not configured. Please contact support.'
      console.warn('⚠️ NEXT_PUBLIC_MAKE_WEBHOOK_URL is not set in environment variables')
      setError(errorMsg)
      throw new Error(errorMsg)
    }

    // Validate required data
    if (!data.task || !data.assignee) {
      const errorMsg = 'Task and assignee information are required'
      console.warn('⚠️ Missing required task notification data')
      setError(errorMsg)
      throw new Error(errorMsg)
    }

    // Reset previous states
    setIsLoading(true)
    setError(null)
    setIsSuccess(false)

    try {
      console.log('🚀 Sending task assignment notification to:', {
        assignee: data.assignee.email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Mask email for logging
        task: data.task.title,
        type: data.task.task_type
      })

      // Prepare notification payload
      const notificationPayload = {
        // Email recipient
        name: data.assignee.email, // Use email as name since User doesn't have name field
        email: data.assignee.email,
        phone: '', // Not needed for task notifications
        
        // Task details in the property_address field (repurposing for task info)
        property_address: data.property ? `${data.property.name} - ${data.property.location}` : 'No property specified',
        
        // Task information in the notes field
        notes: `TASK ASSIGNMENT - ${data.task.title}

Task Type: ${data.task.task_type.toUpperCase()}
Priority: ${data.task.priority.toUpperCase()}
Due Date: ${data.task.due_date ? new Date(data.task.due_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }) : 'Not specified'}

Description: ${data.task.description || 'No description provided'}

${data.property ? `Property: ${data.property.name}
Location: ${data.property.location}` : ''}

Please log into the staff dashboard to view full task details and update status.

Task ID: ${data.task.id}`
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationPayload)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // Log successful notification
      console.log('✅ Task assignment notification sent successfully to Make.com')
      setIsSuccess(true)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('❌ Failed to send task assignment notification:', errorMessage)
      
      // Provide user-friendly error messages
      let userFriendlyError: string
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        userFriendlyError = 'Network error. Please check your internet connection and try again.'
      } else if (errorMessage.includes('HTTP 4')) {
        userFriendlyError = 'Invalid request. Please try again.'
      } else if (errorMessage.includes('HTTP 5')) {
        userFriendlyError = 'Server error. Please try again in a few moments.'
      } else {
        userFriendlyError = 'Failed to send notification. Please try again or contact support if the problem persists.'
      }
      
      setError(userFriendlyError)
      throw new Error(userFriendlyError)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Reset all hook states to initial values
   */
  const reset = (): void => {
    setIsLoading(false)
    setIsSuccess(false)
    setError(null)
  }

  return {
    isLoading,
    isSuccess,
    error,
    sendTaskAssignmentNotification,
    reset
  }
}

export default useTaskNotifications
