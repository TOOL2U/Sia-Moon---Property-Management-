'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import {
    AlertTriangle,
    ArrowLeft,
    Home,
    Lock,
    Mail,
    Settings,
    Shield,
    User
} from 'lucide-react'
import Link from 'next/link'
import { use } from 'react'

interface UnauthorizedPageProps {
  searchParams?: Promise<{
    reason?: string
    feature?: string
    returnUrl?: string
  }>
}

export default function UnauthorizedPage({ searchParams }: UnauthorizedPageProps) {
  // Use React.use() to unwrap the searchParams promise
  const params = searchParams ? use(searchParams) : {}
  const reason = params?.reason || 'insufficient_privileges'
  const feature = params?.feature || 'AI Dashboard'
  const returnUrl = params?.returnUrl || '/dashboard'

  // Get appropriate message based on reason
  const getErrorMessage = () => {
    switch (reason) {
      case 'no_session':
        return {
          title: '🔐 Authentication Required',
          description: 'You must be logged in to access this feature.',
          action: 'Please sign in to continue.',
          icon: User
        }
      case 'insufficient_privileges':
        return {
          title: '🚫 Access Denied',
          description: 'You do not have permission to view this page.',
          action: 'Contact your administrator for access.',
          icon: Shield
        }
      case 'admin_required':
        return {
          title: '👑 Admin Access Required',
          description: 'This feature requires administrator privileges.',
          action: 'Only admins can access AI Dashboard features.',
          icon: Settings
        }
      case 'feature_restricted':
        return {
          title: '🔒 Feature Restricted',
          description: `Access to ${feature} is restricted.`,
          action: 'Your current role does not include this permission.',
          icon: Lock
        }
      default:
        return {
          title: '🚫 Access Denied',
          description: 'You do not have permission to view this page.',
          action: 'Contact your administrator for access.',
          icon: Shield
        }
    }
  }

  const errorInfo = getErrorMessage()
  const IconComponent = errorInfo.icon

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Main Error Card */}
        <Card className="border-red-200 shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <IconComponent className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {errorInfo.title}
            </CardTitle>
            <p className="text-gray-600 mt-2">
              {errorInfo.description}
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Error Details */}
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                {errorInfo.action}
              </AlertDescription>
            </Alert>

            {/* Feature Information */}
            {feature && feature !== 'AI Dashboard' && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Requested Feature:</strong>
                </p>
                <Badge variant="outline" className="mt-1">
                  {feature}
                </Badge>
              </div>
            )}

            {/* Admin Contact Information */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Need Access?
              </h3>
              <p className="text-sm text-blue-800 mb-3">
                Contact your system administrator to request access to AI Dashboard features.
              </p>
              <div className="space-y-1 text-xs text-blue-700">
                <p><strong>Admin Email:</strong> admin@siamoon.com</p>
                <p><strong>Required Role:</strong> Admin or AI Manager</p>
                <p><strong>Access Level:</strong> Level 5+ for basic features, Level 8+ for settings</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-4">
              <Button asChild className="w-full">
                <Link href={returnUrl}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Link>
              </Button>

              <Button variant="outline" asChild className="w-full">
                <Link href="/dashboard">
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard Home
                </Link>
              </Button>

              <Button variant="ghost" asChild className="w-full">
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  Main Site
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Development Information */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-yellow-800 flex items-center gap-2">
                🚧 Development Mode
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-yellow-700">
                You're in development mode. To bypass authentication for testing:
              </p>
              <div className="bg-yellow-100 p-3 rounded border border-yellow-200">
                <p className="text-xs font-mono text-yellow-800">
                  NEXT_PUBLIC_BYPASS_AUTH=true
                </p>
              </div>
              <p className="text-xs text-yellow-600">
                Add this to your .env.local file to enable development bypass.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Security Notice */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            This page is protected by role-based access control.
            <br />
            Unauthorized access attempts are logged.
          </p>
        </div>
      </div>
    </div>
  )
}
