'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { isDevelopment, isProduction } from '@/lib/env'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (isDevelopment) {
      console.error('Error Boundary caught an error:', error, errorInfo)
    }

    // Log error to external service in production
    if (isProduction) {
      this.logErrorToService(error, errorInfo)
    }

    this.setState({
      error,
      errorInfo
    })
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // In production, you would send this to your error tracking service
    // Examples: Sentry, LogRocket, Bugsnag, etc.
    
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    // Example: Send to your error tracking service
    // fetch('/api/log-error', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorData)
    // })

    console.error('Production Error:', errorData)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full">
            <Card className="border-red-800 bg-red-950/20">
              <CardHeader className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-950 mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                </div>
                <CardTitle className="text-white">Something went wrong</CardTitle>
                <CardDescription className="text-neutral-400">
                  We're sorry, but something unexpected happened. Our team has been notified.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isDevelopment && this.state.error && (
                  <div className="p-3 bg-neutral-900 border border-neutral-700 rounded-lg">
                    <p className="text-xs text-red-400 font-mono break-all">
                      {this.state.error.message}
                    </p>
                  </div>
                )}
                
                <div className="flex flex-col space-y-2">
                  <Button
                    onClick={this.handleRetry}
                    variant="default"
                    className="flex items-center justify-center w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  
                  <Button
                    onClick={this.handleGoHome}
                    variant="outline"
                    className="flex items-center justify-center w-full"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Go Home
                  </Button>
                </div>

                <div className="text-center">
                  <p className="text-xs text-neutral-500">
                    If this problem persists, please contact support.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook version for functional components
export const useErrorHandler = () => {
  const handleError = (error: Error, errorInfo?: string) => {
    if (isDevelopment) {
      console.error('Error caught by useErrorHandler:', error, errorInfo)
    }

    if (isProduction) {
      // Log to external service
      const errorData = {
        message: error.message,
        stack: error.stack,
        additionalInfo: errorInfo,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }

      console.error('Production Error:', errorData)
      
      // Send to error tracking service
      // fetch('/api/log-error', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorData)
      // })
    }
  }

  return { handleError }
}
