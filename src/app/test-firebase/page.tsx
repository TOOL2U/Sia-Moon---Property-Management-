'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CheckCircle, XCircle, User, Database, Shield } from 'lucide-react'

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
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🔥 Firebase Authentication Test</h1>
          <p className="text-neutral-400">Testing Firebase integration and authentication state</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Authentication Status */}
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="h-5 w-5" />
                Authentication Status
              </CardTitle>
              <CardDescription>Current authentication state</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <TestResult
                title="Firebase Configured"
                success={testResults.firebaseConfigured}
                description={testResults.firebaseConfigured ? "Firebase is properly configured" : "Firebase configuration missing"}
              />
              <TestResult
                title="Firebase Auth Working"
                success={testResults.authContextWorking}
                description={testResults.authContextWorking ? "Firebase Auth has active user" : "No active user in Firebase Auth"}
              />
              <TestResult
                title="User Data Loaded"
                success={testResults.userLoaded}
                description={testResults.userLoaded ? "User data loaded from Firebase" : "No user data available"}
              />
            </CardContent>
          </Card>

          {/* User Data */}
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="h-5 w-5" />
                User Data
              </CardTitle>
              <CardDescription>Current user information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {session ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-neutral-400">Email</p>
                    <p className="text-white">{session.user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-400">User ID</p>
                    <p className="text-white font-mono text-xs">{session.user.id}</p>
                  </div>
                  {profile && (
                    <div>
                      <p className="text-sm text-neutral-400">Full Name</p>
                      <p className="text-white">{profile.full_name}</p>
                    </div>
                  )}
                  <Badge variant="outline" className="text-green-400 border-green-400">
                    Authenticated
                  </Badge>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-neutral-400">No user session found</p>
                  <p className="text-sm text-neutral-500 mt-2">Please sign in to test authentication</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="bg-neutral-900 border-neutral-800 md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Database className="h-5 w-5" />
                Test Actions
              </CardTitle>
              <CardDescription>Actions to test Firebase functionality</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={() => window.location.href = '/auth/signup'}
                  variant="outline"
                >
                  Test Sign Up
                </Button>
                <Button 
                  onClick={() => window.location.href = '/auth/login'}
                  variant="outline"
                >
                  Test Sign In
                </Button>
                {user && (
                  <Button
                    onClick={signOut}
                    variant="outline"
                    className="border-red-500 text-red-400 hover:bg-red-500/10"
                  >
                    Test Sign Out
                  </Button>
                )}
                <Button 
                  onClick={() => window.location.href = '/dashboard'}
                  variant="outline"
                >
                  Test Dashboard Access
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Debug Info */}
        <Card className="bg-neutral-900 border-neutral-800 mt-6">
          <CardHeader>
            <CardTitle className="text-white">Debug Information</CardTitle>
            <CardDescription>Raw state data for debugging</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs text-neutral-400 bg-black p-4 rounded overflow-auto">
              {JSON.stringify({
                user: user ? {
                  uid: user.uid,
                  email: user.email,
                  emailVerified: user.emailVerified,
                  displayName: user.displayName
                } : null,
                loading,
                testResults
              }, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
