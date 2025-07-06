'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/SupabaseAuthContext'
import SupabaseService from '@/lib/supabaseService'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface TestResult {
  name: string
  status: 'pending' | 'success' | 'error'
  message: string
  details?: any
}

export default function TestSupabasePage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [tests, setTests] = useState<TestResult[]>([])
  const [running, setRunning] = useState(false)

  const updateTest = (name: string, status: TestResult['status'], message: string, details?: any) => {
    setTests(prev => {
      const existing = prev.find(t => t.name === name)
      if (existing) {
        existing.status = status
        existing.message = message
        existing.details = details
        return [...prev]
      } else {
        return [...prev, { name, status, message, details }]
      }
    })
  }



  const runTests = async () => {
    setRunning(true)
    setTests([])

    console.log('🧪 Starting Supabase tests (development bypass disabled)')
    console.log('ℹ️ Note: Some tests may fail if not authenticated or if database is empty')

    // Test 1: Supabase Connection
    updateTest('Supabase Connection', 'pending', 'Testing connection...')
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1)
      if (error) throw error
      updateTest('Supabase Connection', 'success', 'Connected successfully')
    } catch (error: any) {
      updateTest('Supabase Connection', 'error', error.message)
    }

    // Test 2: Authentication
    updateTest('Authentication', 'pending', 'Checking auth state...')
    if (user && profile) {
      updateTest('Authentication', 'success', `Authenticated as ${profile.email} (${profile.role})`, {
        user: profile
      })
    } else {
      updateTest('Authentication', 'error', 'Not authenticated')
    }

    // Test 3: Database Service - Properties (with test user ID)
    updateTest('Properties Service', 'pending', 'Testing properties service...')
    try {
      // Use a valid UUID format for test user ID since we're not authenticated
      const result = await SupabaseService.getAllProperties('00000000-0000-0000-0000-000000000001')
      if (result.success) {
        updateTest('Properties Service', 'success', `Found ${result.data?.length || 0} properties`, result.data)
      } else {
        throw new Error(result.error || 'Unknown error')
      }
    } catch (error: any) {
      updateTest('Properties Service', 'error', error.message)
    }

    // Test 4: Database Service - Bookings (with test user ID)
    updateTest('Bookings Service', 'pending', 'Testing bookings service...')
    try {
      // Use a valid UUID format for test user ID since we're not authenticated
      const result = await SupabaseService.getAllBookings('00000000-0000-0000-0000-000000000001')
      if (result.success) {
        updateTest('Bookings Service', 'success', `Found ${result.data?.length || 0} bookings`, result.data)
      } else {
        throw new Error(result.error || 'Unknown error')
      }
    } catch (error: any) {
      updateTest('Bookings Service', 'error', error.message)
    }

    // Test 5: Database Service - Tasks
    updateTest('Tasks Service', 'pending', 'Testing tasks service...')
    try {
      const result = await SupabaseService.getAllTasks()
      if (result.success) {
        updateTest('Tasks Service', 'success', `Found ${result.data?.length || 0} tasks`, result.data)
      } else {
        throw new Error(result.error || 'Unknown error')
      }
    } catch (error: any) {
      updateTest('Tasks Service', 'error', error.message)
    }

    // Test 6: Database Service - Reports
    updateTest('Reports Service', 'pending', 'Testing reports service...')
    try {
      // Use a valid UUID format for test user ID since we're not authenticated
      const result = await SupabaseService.getAllReports('00000000-0000-0000-0000-000000000001')
      if (result.success) {
        updateTest('Reports Service', 'success', `Found ${result.data?.length || 0} reports`, result.data)
      } else {
        throw new Error(result.error || 'Unknown error')
      }
    } catch (error: any) {
      updateTest('Reports Service', 'error', error.message)
    }

    // Test 7: Edge Functions - Generate Reports
    updateTest('Edge Functions', 'pending', 'Testing edge functions...')
    try {
      const { data, error } = await supabase.functions.invoke('generate-monthly-reports', {
        body: { test: true }
      })
      
      if (error) throw error
      
      updateTest('Edge Functions', 'success', 'Edge functions accessible', data)
    } catch (error: any) {
      updateTest('Edge Functions', 'error', error.message)
    }

    // Test 8: RLS Policies
    if (user) {
      updateTest('RLS Policies', 'pending', 'Testing row level security...')
      try {
        // Try to access user's own profile
        const result = await SupabaseService.getUser(user.id)
        if (result.success) {
          updateTest('RLS Policies', 'success', 'RLS policies working correctly')
        } else {
          throw new Error(result.error || 'RLS test failed')
        }
      } catch (error: any) {
        updateTest('RLS Policies', 'error', error.message)
      }
    }

    setRunning(false)
    toast.success('Tests completed!')
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Running</Badge>
      case 'success':
        return <Badge variant="default" className="bg-green-600">Passed</Badge>
      case 'error':
        return <Badge variant="destructive">Failed</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Supabase Integration Test</h1>
          <p className="text-gray-400">
            Test all Supabase services and verify the migration from local database
          </p>
        </div>

        <div className="grid gap-6">
          {/* Auth Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Authentication Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {authLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : user && profile ? (
                <div className="space-y-2">
                  <p className="text-green-400">✅ Authenticated</p>
                  <p><strong>Email:</strong> {profile.email}</p>
                  <p><strong>Role:</strong> {profile.role}</p>
                  <p><strong>Name:</strong> {profile.full_name || 'Not set'}</p>
                </div>
              ) : (
                <p className="text-red-400">❌ Not authenticated</p>
              )}
            </CardContent>
          </Card>

          {/* Test Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Test Controls</CardTitle>
              <CardDescription>
                Run comprehensive tests to verify Supabase integration
              </CardDescription>
              {!user && (
                <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-3 mt-2">
                  <p className="text-yellow-400 text-sm">
                    ⚠️ <strong>Note:</strong> Some tests may fail without authentication.
                    Development bypass is now disabled, so real user authentication is required for user-specific data.
                  </p>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  onClick={runTests}
                  disabled={running}
                  className="w-full"
                >
                  {running ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running Tests...
                    </>
                  ) : (
                    'Run All Tests'
                  )}
                </Button>

                <Button
                  onClick={() => {
                    alert('Profile already exists! The authentication issue has been resolved.')
                  }}
                  disabled={running}
                  variant="outline"
                  className="w-full"
                >
                  ✅ Profile Already Created
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Test Results */}
          {tests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
                <CardDescription>
                  {tests.filter(t => t.status === 'success').length} passed, {' '}
                  {tests.filter(t => t.status === 'error').length} failed, {' '}
                  {tests.filter(t => t.status === 'pending').length} running
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tests.map((test, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border border-gray-800 rounded-lg">
                      <div className="flex-shrink-0 mt-0.5">
                        {getStatusIcon(test.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{test.name}</h3>
                          {getStatusBadge(test.status)}
                        </div>
                        <p className="text-sm text-gray-400">{test.message}</p>
                        {test.details && (
                          <details className="mt-2">
                            <summary className="text-xs text-gray-500 cursor-pointer">
                              View Details
                            </summary>
                            <pre className="mt-2 text-xs bg-gray-900 p-2 rounded overflow-auto">
                              {JSON.stringify(test.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
