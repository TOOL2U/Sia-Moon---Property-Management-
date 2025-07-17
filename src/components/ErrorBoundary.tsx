'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    }
  }

  static getDerivedStateFromError(error: Error): State {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Update state with error info
    this.setState({
      error,
      errorInfo
    })

    // Log detailed error information
    console.error('🚨 ErrorBoundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString()
    })

    // Check if this is a Firebase Timestamp error
    if (error.message.includes('Objects are not valid as a React child') && 
        error.message.includes('seconds, nanoseconds')) {
      console.error('🔥 FIREBASE TIMESTAMP ERROR DETECTED:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        suggestion: 'A Firebase Timestamp object is being rendered directly. Use toDate() or formatLocalDateTime() from @/utils/dateUtils'
      })
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    })
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <Card className="bg-red-900/20 border-red-500/30 max-w-2xl w-full">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center gap-3">
                <AlertTriangle className="w-6 h-6" />
                Application Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Error Message */}
              <div className="bg-red-950/50 border border-red-500/20 rounded-lg p-4">
                <h3 className="text-red-300 font-medium mb-2">Error Details:</h3>
                <p className="text-red-200 text-sm font-mono">
                  {this.state.error?.message || 'Unknown error occurred'}
                </p>
                <p className="text-red-400 text-xs mt-2">
                  Error ID: {this.state.errorId}
                </p>
              </div>

              {/* Firebase Timestamp Error Help */}
              {this.state.error?.message.includes('Objects are not valid as a React child') && 
               this.state.error?.message.includes('seconds, nanoseconds') && (
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                  <h3 className="text-yellow-300 font-medium mb-2 flex items-center gap-2">
                    <Bug className="w-4 h-4" />
                    Firebase Timestamp Error Detected
                  </h3>
                  <p className="text-yellow-200 text-sm mb-2">
                    A Firebase Timestamp object is being rendered directly as a React child.
                  </p>
                  <p className="text-yellow-200 text-sm">
                    <strong>Solution:</strong> Use <code className="bg-yellow-800/30 px-1 rounded">toDate()</code> or{' '}
                    <code className="bg-yellow-800/30 px-1 rounded">formatLocalDateTime()</code> from{' '}
                    <code className="bg-yellow-800/30 px-1 rounded">@/utils/dateUtils</code>
                  </p>
                </div>
              )}

              {/* Component Stack (Development Only) */}
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4">
                  <summary className="text-gray-300 font-medium cursor-pointer mb-2">
                    Component Stack (Development)
                  </summary>
                  <pre className="text-gray-400 text-xs overflow-auto max-h-40">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              {/* Error Stack (Development Only) */}
              {process.env.NODE_ENV === 'development' && this.state.error?.stack && (
                <details className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4">
                  <summary className="text-gray-300 font-medium cursor-pointer mb-2">
                    Error Stack (Development)
                  </summary>
                  <pre className="text-gray-400 text-xs overflow-auto max-h-40">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={this.handleRetry}
                  variant="outline"
                  className="border-red-500/50 text-red-300 hover:bg-red-500/10"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="border-gray-500/50 text-gray-300 hover:bg-gray-500/10"
                >
                  Reload Page
                </Button>
              </div>

              {/* Help Text */}
              <div className="text-gray-400 text-sm">
                <p>If this error persists, please:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Check the browser console for detailed error information</li>
                  <li>Try refreshing the page</li>
                  <li>Clear your browser cache and cookies</li>
                  <li>Contact support if the issue continues</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
