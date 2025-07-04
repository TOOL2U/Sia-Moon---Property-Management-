'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function TestConnectionPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const testConnection = async () => {
    console.log('🔍 Starting connection test...')
    setLoading(true)
    setResult(null)

    try {
      console.log('Testing Supabase connection...')

      // Test 1: Basic connection
      console.log('Step 1: Testing basic connection...')
      const { data: healthCheck, error: healthError } = await supabase
        .from('users')
        .select('count')
        .limit(1)

      console.log('Health check result:', { healthCheck, healthError })

      // Test 2: Check auth status
      console.log('Step 2: Checking auth status...')
      const { data: authData, error: authError } = await supabase.auth.getSession()

      console.log('Auth check result:', { authData, authError })

      // Test 3: Try to read users table
      console.log('Step 3: Testing users table access...')
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(5)

      console.log('Users table result:', { usersData, usersError })

      setResult({
        success: true,
        tests: {
          connection: {
            success: !healthError,
            error: healthError,
            message: healthError ? `Connection failed: ${healthError.message}` : 'Connection successful!'
          },
          auth: {
            success: !authError,
            error: authError,
            session: authData.session,
            message: authError ? `Auth error: ${authError.message}` : authData.session ? 'User is logged in' : 'No active session'
          },
          database: {
            success: !usersError,
            error: usersError,
            data: usersData,
            message: usersError ? `Database error: ${usersError.message}` : `Found ${usersData?.length || 0} users in database`
          }
        },
        environment: {
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          authBypass: process.env.NEXT_PUBLIC_BYPASS_AUTH
        }
      })

    } catch (err) {
      console.error('Test failed:', err)
      setResult({
        success: false,
        error: err,
        message: `Test failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      })
    } finally {
      setLoading(false)
    }
  }

  const testUserCreation = async () => {
    setLoading(true)
    setResult(null)

    try {
      console.log('Testing user creation...')
      
      // Try to create a test user
      const { data, error } = await supabase.auth.signUp({
        email: 'test@example.com',
        password: 'testpass123',
      })

      console.log('User creation result:', { data, error })

      setResult({
        success: !error,
        data: data,
        error: error,
        message: error ? `User creation failed: ${error.message}` : 'User creation test successful!',
        details: JSON.stringify({ data, error }, null, 2)
      })

    } catch (err) {
      console.error('User creation test failed:', err)
      setResult({
        success: false,
        error: err,
        message: `User creation test failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Supabase Connection Test</h1>
        
        {/* Environment Info */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div><strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set'}</div>
              <div><strong>Anon Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set ✅' : 'Missing ❌'}</div>
              <div><strong>Auth Bypass:</strong> {process.env.NEXT_PUBLIC_BYPASS_AUTH || 'false'}</div>
            </div>
          </CardContent>
        </Card>

        {/* Test Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Connection Tests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Simple test button */}
            <Button
              onClick={() => {
                console.log('✅ Simple test button works!')
                alert('Button click detected! Check console for more details.')
              }}
              variant="outline"
              size="sm"
            >
              🧪 Simple Test (Click Me First)
            </Button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                onClick={() => {
                  console.log('🔘 Test Connection button clicked!')
                  testConnection()
                }}
                disabled={loading}
              >
                {loading ? 'Testing...' : 'Test Connection & Database'}
              </Button>
              <Button
                onClick={() => {
                  console.log('🔘 Test User Creation button clicked!')
                  testUserCreation()
                }}
                disabled={loading}
                variant="outline"
              >
                {loading ? 'Testing...' : 'Test User Creation'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className={result.success ? 'text-green-800' : 'text-red-800'}>
                {result.success ? '✅ Test Results' : '❌ Test Failed'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.tests ? (
                <div className="space-y-4">
                  {Object.entries(result.tests).map(([testName, testResult]: [string, any]) => (
                    <div key={testName} className="border rounded p-4">
                      <h4 className={`font-semibold ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                        {testName.toUpperCase()}: {testResult.success ? '✅' : '❌'}
                      </h4>
                      <p className="text-sm mt-1">{testResult.message}</p>
                      {testResult.error && (
                        <pre className="text-xs bg-red-50 p-2 rounded mt-2 overflow-x-auto">
                          {JSON.stringify(testResult.error, null, 2)}
                        </pre>
                      )}
                      {testResult.data && (
                        <pre className="text-xs bg-green-50 p-2 rounded mt-2 overflow-x-auto max-h-32">
                          {JSON.stringify(testResult.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                  
                  <div className="border rounded p-4">
                    <h4 className="font-semibold">Environment Info</h4>
                    <pre className="text-xs bg-gray-50 p-2 rounded mt-2">
                      {JSON.stringify(result.environment, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mb-4 font-medium">{result.message}</p>
                  {result.details && (
                    <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto max-h-96">
                      {result.details}
                    </pre>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
