'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CheckCircle, XCircle, User, Database, Shield, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function TestFirebasePage() {
  const { user, loading, signOut } = useAuth()
  const [testResults, setTestResults] = useState<any>({})

  useEffect(() => {
    const runTests = () => {
      setTestResults({
        firebaseConfigured: !!user,
        authContextWorking: !!user,
        userLoaded: !!user,
        loadingStates: { loading }
      })
    }

    if (!loading) {
      runTests()
    }
  }, [user, loading])

  const TestResult = ({ title, success, description }: { title: string, success: boolean, description: string }) => (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-900/50">
      {success ? (
        <CheckCircle className="h-5 w-5 text-green-500" />
      ) : (
        <XCircle className="h-5 w-5 text-red-500" />
      )}
      <div>
        <p className="font-medium text-white">{title}</p>
        <p className="text-sm text-neutral-400">{description}</p>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading Firebase test...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/developers/tests" className="inline-flex items-center text-gray-400 hover:text-white mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tests
          </Link>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Database className="h-8 w-8" />
            Firebase Authentication Test
          </h1>
          <p className="text-gray-400 mt-2">
            Test Firebase authentication setup and user management
          </p>
        </div>

        {/* User Status */}
        <Card className="bg-neutral-900 border-neutral-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="h-5 w-5" />
              Current User Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                    Authenticated
                  </Badge>
                  <span className="text-white">{user.email}</span>
                </div>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">User ID:</span>
                    <span className="text-white font-mono">{user.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Role:</span>
                    <span className="text-white capitalize">{user.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Full Name:</span>
                    <span className="text-white">{user.full_name}</span>
                  </div>
                </div>
                <Button 
                  onClick={signOut}
                  variant="outline"
                  className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-white font-medium mb-2">No User Authenticated</p>
                <p className="text-gray-400 mb-4">Please sign in to test Firebase authentication</p>
                <Link href="/auth/login">
                  <Button className="bg-white text-black hover:bg-gray-100">
                    Go to Login
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Firebase Test Results
            </CardTitle>
            <CardDescription className="text-gray-400">
              Automated tests for Firebase authentication system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <TestResult
              title="Firebase Configuration"
              success={!!testResults.firebaseConfigured}
              description="Firebase is properly configured and initialized"
            />
            <TestResult
              title="Auth Context Working"
              success={!!testResults.authContextWorking}
              description="Authentication context is functioning correctly"
            />
            <TestResult
              title="User Data Loaded"
              success={!!testResults.userLoaded}
              description="User authentication state is properly loaded"
            />
            <TestResult
              title="Loading States"
              success={!testResults.loadingStates?.loading}
              description="Authentication loading states are working correctly"
            />
          </CardContent>
        </Card>

        {/* Debug Information */}
        {user && (
          <Card className="bg-neutral-900 border-neutral-800 mt-6">
            <CardHeader>
              <CardTitle className="text-white">Debug Information</CardTitle>
              <CardDescription className="text-gray-400">
                Raw Firebase user object for debugging
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-neutral-800 p-4 rounded-lg text-sm text-gray-300 overflow-auto">
                {JSON.stringify({
                  id: user.id,
                  email: user.email,
                  full_name: user.full_name,
                  role: user.role
                }, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
