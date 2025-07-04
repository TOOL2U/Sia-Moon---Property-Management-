'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function AuthDebugPage() {
  const [email, setEmail] = useState('john.smith@example.com')
  const [password, setPassword] = useState('password123')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const testSignIn = async () => {
    setLoading(true)
    setResult(null)

    try {
      console.log('Testing sign in with:', email, password)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('Sign in result:', { data, error })

      setResult({
        success: !error,
        data: data,
        error: error,
        message: error ? `Error: ${error.message}` : 'Sign in successful!',
        details: JSON.stringify({ data, error }, null, 2)
      })

    } catch (err) {
      console.error('Caught error:', err)
      setResult({
        success: false,
        error: err,
        message: `Caught error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        details: JSON.stringify(err, null, 2)
      })
    } finally {
      setLoading(false)
    }
  }

  const testGetSession = async () => {
    setLoading(true)
    setResult(null)

    try {
      console.log('Getting current session...')
      
      const { data, error } = await supabase.auth.getSession()

      console.log('Session result:', { data, error })

      setResult({
        success: !error,
        data: data,
        error: error,
        message: error ? `Error: ${error.message}` : data.session ? 'Session found!' : 'No active session',
        details: JSON.stringify({ data, error }, null, 2)
      })

    } catch (err) {
      console.error('Caught error:', err)
      setResult({
        success: false,
        error: err,
        message: `Caught error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        details: JSON.stringify(err, null, 2)
      })
    } finally {
      setLoading(false)
    }
  }

  const testGetUser = async () => {
    setLoading(true)
    setResult(null)

    try {
      console.log('Getting current user...')
      
      const { data, error } = await supabase.auth.getUser()

      console.log('User result:', { data, error })

      setResult({
        success: !error,
        data: data,
        error: error,
        message: error ? `Error: ${error.message}` : data.user ? 'User found!' : 'No user',
        details: JSON.stringify({ data, error }, null, 2)
      })

    } catch (err) {
      console.error('Caught error:', err)
      setResult({
        success: false,
        error: err,
        message: `Caught error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        details: JSON.stringify(err, null, 2)
      })
    } finally {
      setLoading(false)
    }
  }

  const testUserProfile = async () => {
    setLoading(true)
    setResult(null)

    try {
      console.log('Getting user profile...')
      
      // First get the current user
      const { data: authData, error: authError } = await supabase.auth.getUser()
      
      if (authError || !authData.user) {
        throw new Error('No authenticated user found')
      }

      // Then get their profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      console.log('Profile result:', { profileData, profileError })

      setResult({
        success: !profileError,
        data: { auth: authData, profile: profileData },
        error: profileError,
        message: profileError ? `Profile error: ${profileError.message}` : 'Profile found!',
        details: JSON.stringify({ auth: authData, profile: profileData, error: profileError }, null, 2)
      })

    } catch (err) {
      console.error('Caught error:', err)
      setResult({
        success: false,
        error: err,
        message: `Caught error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        details: JSON.stringify(err, null, 2)
      })
    } finally {
      setLoading(false)
    }
  }

  const testSignOut = async () => {
    setLoading(true)
    setResult(null)

    try {
      console.log('Signing out...')
      
      const { error } = await supabase.auth.signOut()

      console.log('Sign out result:', { error })

      setResult({
        success: !error,
        error: error,
        message: error ? `Error: ${error.message}` : 'Signed out successfully!',
        details: JSON.stringify({ error }, null, 2)
      })

    } catch (err) {
      console.error('Caught error:', err)
      setResult({
        success: false,
        error: err,
        message: `Caught error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        details: JSON.stringify(err, null, 2)
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Authentication Debug</h1>
        
        {/* Test Credentials */}
        <Card>
          <CardHeader>
            <CardTitle>Test Credentials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Test Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Authentication Tests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button onClick={testSignIn} disabled={loading}>
                1. Test Sign In
              </Button>
              <Button onClick={testGetSession} disabled={loading}>
                2. Get Session
              </Button>
              <Button onClick={testGetUser} disabled={loading}>
                3. Get User
              </Button>
              <Button onClick={testUserProfile} disabled={loading}>
                4. Get Profile
              </Button>
              <Button onClick={testSignOut} disabled={loading} variant="outline">
                5. Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Environment Info */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div><strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL}</div>
              <div><strong>Auth Bypass:</strong> {process.env.NEXT_PUBLIC_BYPASS_AUTH}</div>
              <div><strong>Anon Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}</div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className={result.success ? 'text-green-800' : 'text-red-800'}>
                {result.success ? '✅ Success' : '❌ Error'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 font-medium">{result.message}</p>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto max-h-96">
                {result.details}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
