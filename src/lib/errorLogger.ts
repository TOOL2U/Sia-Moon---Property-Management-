// Error Logging Service for Production
// Centralized error handling and logging

export interface ErrorLogData {
  message: string
  stack?: string
  level: 'error' | 'warning' | 'info'
  context?: Record<string, any>
  userId?: string
  timestamp: string
  userAgent: string
  url: string
  component?: string
  action?: string
}

export class ErrorLogger {
  private static instance: ErrorLogger
  private isProduction = process.env.NODE_ENV === 'production'

  private constructor() {}

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger()
    }
    return ErrorLogger.instance
  }

  // Log error with context
  logError(error: Error | string, context?: Record<string, any>, component?: string) {
    const errorData = this.createErrorData(error, 'error', context, component)
    this.sendToLoggingService(errorData)
  }

  // Log warning
  logWarning(message: string, context?: Record<string, any>, component?: string) {
    const errorData = this.createErrorData(message, 'warning', context, component)
    this.sendToLoggingService(errorData)
  }

  // Log info
  logInfo(message: string, context?: Record<string, any>, component?: string) {
    const errorData = this.createErrorData(message, 'info', context, component)
    this.sendToLoggingService(errorData)
  }

  // Log authentication errors
  logAuthError(error: Error | string, action: string, email?: string) {
    const context = {
      action,
      email: email ? this.maskEmail(email) : undefined,
      type: 'authentication'
    }
    this.logError(error, context, 'Auth')
  }

  // Log database errors
  logDatabaseError(error: Error | string, operation: string, table?: string) {
    const context = {
      operation,
      table,
      type: 'database'
    }
    this.logError(error, context, 'Database')
  }

  // Log API errors
  logApiError(error: Error | string, endpoint: string, method: string, statusCode?: number) {
    const context = {
      endpoint,
      method,
      statusCode,
      type: 'api'
    }
    this.logError(error, context, 'API')
  }

  // Log user action errors
  logUserActionError(error: Error | string, action: string, userId?: string) {
    const context = {
      action,
      userId,
      type: 'user_action'
    }
    this.logError(error, context, 'UserAction')
  }

  private createErrorData(
    error: Error | string,
    level: 'error' | 'warning' | 'info',
    context?: Record<string, any>,
    component?: string
  ): ErrorLogData {
    const errorMessage = typeof error === 'string' ? error : error.message
    const errorStack = typeof error === 'string' ? undefined : error.stack

    return {
      message: errorMessage,
      stack: errorStack,
      level,
      context,
      component,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'Server',
      url: typeof window !== 'undefined' ? window.location.href : 'Server'
    }
  }

  private async sendToLoggingService(errorData: ErrorLogData) {
    // Console logging for development
    if (!this.isProduction) {
      const logMethod = errorData.level === 'error' ? console.error : 
                      errorData.level === 'warning' ? console.warn : console.log
      
      logMethod(`[${errorData.level.toUpperCase()}] ${errorData.component || 'App'}:`, {
        message: errorData.message,
        context: errorData.context,
        stack: errorData.stack
      })
      return
    }

    // Production logging
    try {
      // Option 1: Send to your own API endpoint
      await this.sendToInternalAPI(errorData)

      // Option 2: Send to external service (Sentry, LogRocket, etc.)
      // await this.sendToExternalService(errorData)

    } catch (loggingError) {
      // Fallback: at least log to console if logging service fails
      console.error('Failed to send error to logging service:', loggingError)
      console.error('Original error:', errorData)
    }
  }

  private async sendToInternalAPI(errorData: ErrorLogData) {
    try {
      const response = await fetch('/api/log-error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData)
      })

      if (!response.ok) {
        throw new Error(`Logging API responded with status: ${response.status}`)
      }
    } catch (error) {
      throw new Error(`Failed to send to internal API: ${error}`)
    }
  }

  // Example integration with external services
  private async sendToExternalService(errorData: ErrorLogData) {
    // Example: Sentry integration
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(new Error(errorData.message), {
    //     level: errorData.level,
    //     tags: {
    //       component: errorData.component
    //     },
    //     extra: errorData.context
    //   })
    // }

    // Example: Custom webhook
    // await fetch(process.env.NEXT_PUBLIC_ERROR_WEBHOOK_URL!, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorData)
    // })
  }

  private maskEmail(email: string): string {
    const [username, domain] = email.split('@')
    if (username.length <= 2) return email
    
    const maskedUsername = username[0] + '*'.repeat(username.length - 2) + username[username.length - 1]
    return `${maskedUsername}@${domain}`
  }
}

// Singleton instance
export const errorLogger = ErrorLogger.getInstance()

// Convenience functions
export const logError = (error: Error | string, context?: Record<string, any>, component?: string) => {
  errorLogger.logError(error, context, component)
}

export const logWarning = (message: string, context?: Record<string, any>, component?: string) => {
  errorLogger.logWarning(message, context, component)
}

export const logInfo = (message: string, context?: Record<string, any>, component?: string) => {
  errorLogger.logInfo(message, context, component)
}

export const logAuthError = (error: Error | string, action: string, email?: string) => {
  errorLogger.logAuthError(error, action, email)
}

export const logDatabaseError = (error: Error | string, operation: string, table?: string) => {
  errorLogger.logDatabaseError(error, operation, table)
}

export const logApiError = (error: Error | string, endpoint: string, method: string, statusCode?: number) => {
  errorLogger.logApiError(error, endpoint, method, statusCode)
}

export const logUserActionError = (error: Error | string, action: string, userId?: string) => {
  errorLogger.logUserActionError(error, action, userId)
}
