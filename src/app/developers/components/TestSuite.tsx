'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/RealAuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TestTube, Database, Shield, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface TestResult {
  name: string
  status: 'success' | 'error' | 'warning'
  message: string
  details?: any
}

export default function TestSuite() {
  const [results, setResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(false)
  const [testEmail, setTestEmail] = useState('test@example.com')
  const [testPassword, setTestPassword] = useState('testpass123')
  const { user } = useAuth()
  const supabase = createClient()

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result])
  }

  const clearResults = () => {
    setResults([])
  }

  const runAllTests = async () => {
    setLoading(true)
    clearResults()

    // Test 1: Environment Variables
    addResult({
      name: 'Environment Variables',
      status: process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'success' : 'error',
      message: process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
        ? 'All required environment variables are set' 
        : 'Missing required environment variables',
      details: {
        supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        authBypass: process.env.NEXT_PUBLIC_BYPASS_AUTH
      }
    })

    // Test 2: Supabase Connection
    try {
      const { data, error } = await supabase.from('users').select('count').limit(1)
      addResult({
        name: 'Supabase Connection',
        status: error ? 'error' : 'success',
        message: error ? `Connection failed: ${error.message}` : 'Successfully connected to Supabase',
        details: { data, error }
      })
    } catch (err) {
      addResult({
        name: 'Supabase Connection',
        status: 'error',
        message: `Connection error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        details: err
      })
    }

    // Test 3: Authentication Status
    try {
      const { data: authData, error: authError } = await supabase.auth.getSession()
      addResult({
        name: 'Authentication Status',
        status: authError ? 'error' : authData.session ? 'success' : 'warning',
        message: authError 
          ? `Auth error: ${authError.message}` 
          : authData.session 
            ? 'User is authenticated' 
            : 'No active session',
        details: { session: authData.session, error: authError }
      })
    } catch (err) {
      addResult({
        name: 'Authentication Status',
        status: 'error',
        message: `Auth check failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        details: err
      })
    }

    // Test 4: Database Access
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(5)

      addResult({
        name: 'Database Access',
        status: usersError ? 'warning' : 'success',
        message: usersError 
          ? `Database access limited: ${usersError.message}` 
          : `Successfully accessed users table (${usersData?.length || 0} records)`,
        details: { data: usersData, error: usersError }
      })
    } catch (err) {
      addResult({
        name: 'Database Access',
        status: 'error',
        message: `Database error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        details: err
      })
    }

    // Test 5: User Context
    addResult({
      name: 'User Context',
      status: user ? 'success' : 'warning',
      message: user ? `User context loaded: ${user.email} (${user.role})` : 'No user in context',
      details: user
    })

    setLoading(false)
  }

  const testSignIn = async () => {
    setLoading(true)
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      })

      addResult({
        name: 'Sign In Test',
        status: error ? 'error' : 'success',
        message: error ? `Sign in failed: ${error.message}` : 'Sign in successful',
        details: { data, error }
      })
    } catch (err) {
      addResult({
        name: 'Sign In Test',
        status: 'error',
        message: `Sign in error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        details: err
      })
    }

    setLoading(false)
  }

  const testSignOut = async () => {
    setLoading(true)
    
    try {
      const { error } = await supabase.auth.signOut()

      addResult({
        name: 'Sign Out Test',
        status: error ? 'error' : 'success',
        message: error ? `Sign out failed: ${error.message}` : 'Sign out successful',
        details: { error }
      })
    } catch (err) {
      addResult({
        name: 'Sign Out Test',
        status: 'error',
        message: `Sign out error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        details: err
      })
    }

    setLoading(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'error': return <XCircle className="h-5 w-5 text-red-600" />
      case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-600" />
      default: return <TestTube className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'border-green-200 bg-green-50'
      case 'error': return 'border-red-200 bg-red-50'
      case 'warning': return 'border-yellow-200 bg-yellow-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  return (
    <div className="space-y-6">
      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Test Suite Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Test Email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com"
            />
            <Input
              label="Test Password"
              type="password"
              value={testPassword}
              onChange={(e) => setTestPassword(e.target.value)}
              placeholder="testpass123"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button onClick={runAllTests} disabled={loading}>
              <Database className="mr-2 h-4 w-4" />
              Run All Tests
            </Button>
            <Button onClick={testSignIn} disabled={loading} variant="outline">
              <Shield className="mr-2 h-4 w-4" />
              Test Sign In
            </Button>
            <Button onClick={testSignOut} disabled={loading} variant="outline">
              <User className="mr-2 h-4 w-4" />
              Test Sign Out
            </Button>
            <Button onClick={clearResults} disabled={loading} variant="outline">
              Clear Results
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div key={index} className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}>
                  <div className="flex items-start gap-3">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <h4 className="font-semibold">{result.name}</h4>
                      <p className="text-sm mt-1">{result.message}</p>
                      {result.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-600 cursor-pointer">View Details</summary>
                          <pre className="text-xs bg-white p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
