'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { auth } from '@/lib/firebase'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { CheckCircle, XCircle, AlertTriangle, User, Key, Mail } from 'lucide-react'

export default function DebugAuthPage() {
  const [testEmail, setTestEmail] = useState('test@example.com')
  const [testPassword, setTestPassword] = useState('testpassword123')
  const [logs, setLogs] = useState<string[]>([])
  const [authStatus, setAuthStatus] = useState<'unknown' | 'connected' | 'error'>('unknown')

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `[${timestamp}] ${message}`
    console.log(logMessage)
    setLogs(prev => [...prev, logMessage])
  }

  useEffect(() => {
    // Test Firebase auth initialization
    if (auth) {
      setAuthStatus('connected')
      addLog('✅ Firebase Auth initialized successfully')
      addLog(`🔗 Auth app: ${auth.app.name}`)
    } else {
      setAuthStatus('error')
      addLog('❌ Firebase Auth not initialized')
    }
  }, [])

  const testSignIn = async () => {
    addLog('🔐 Testing sign in...')
    try {
      if (!auth) {
        throw new Error('Firebase Auth not initialized')
      }

      addLog(`📧 Attempting to sign in with: ${testEmail}`)
      const userCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword)
      addLog(`✅ Sign in successful! User ID: ${userCredential.user.uid}`)
      addLog(`📧 User email: ${userCredential.user.email}`)
      addLog(`✅ Email verified: ${userCredential.user.emailVerified}`)
    } catch (error: any) {
      addLog(`❌ Sign in failed: ${error.code} - ${error.message}`)
      
      // Provide specific error guidance
      if (error.code === 'auth/user-not-found') {
        addLog('💡 User not found. Try creating the user first.')
      } else if (error.code === 'auth/wrong-password') {
        addLog('💡 Wrong password. Check the password and try again.')
      } else if (error.code === 'auth/invalid-email') {
        addLog('💡 Invalid email format.')
      } else if (error.code === 'auth/invalid-credential') {
        addLog('💡 Invalid credentials. User may not exist or password is wrong.')
      }
    }
  }

  const testCreateUser = async () => {
    addLog('👤 Testing user creation...')
    try {
      if (!auth) {
        throw new Error('Firebase Auth not initialized')
      }

      addLog(`📧 Attempting to create user: ${testEmail}`)
      const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword)
      addLog(`✅ User created successfully! User ID: ${userCredential.user.uid}`)
      addLog(`📧 User email: ${userCredential.user.email}`)
    } catch (error: any) {
      addLog(`❌ User creation failed: ${error.code} - ${error.message}`)
      
      if (error.code === 'auth/email-already-in-use') {
        addLog('💡 Email already in use. Try signing in instead.')
      } else if (error.code === 'auth/weak-password') {
        addLog('💡 Password is too weak. Use at least 6 characters.')
      }
    }
  }

  const testSignOut = async () => {
    addLog('🚪 Testing sign out...')
    try {
      if (!auth) {
        throw new Error('Firebase Auth not initialized')
      }

      await auth.signOut()
      addLog('✅ Sign out successful')
    } catch (error: any) {
      addLog(`❌ Sign out failed: ${error.message}`)
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  const testWithKnownUser = () => {
    setTestEmail('shaun@siamoon.com')
    setTestPassword('your-actual-password')
    addLog('🔧 Set to known admin user. Update password and test.')
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="h-5 w-5" />
              Firebase Authentication Debug Tool
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Test Email
                </label>
                <Input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                  className="bg-neutral-800 border-neutral-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Test Password
                </label>
                <Input
                  type="password"
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  placeholder="password123"
                  className="bg-neutral-800 border-neutral-700"
                />
              </div>
            </div>

            <div className="flex gap-4 flex-wrap">
              <Button onClick={testSignIn} className="bg-blue-600 hover:bg-blue-700">
                <Key className="h-4 w-4 mr-2" />
                Test Sign In
              </Button>
              <Button onClick={testCreateUser} className="bg-green-600 hover:bg-green-700">
                <User className="h-4 w-4 mr-2" />
                Create Test User
              </Button>
              <Button onClick={testSignOut} variant="outline">
                🚪 Sign Out
              </Button>
              <Button onClick={testWithKnownUser} variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Use Admin User
              </Button>
              <Button onClick={clearLogs} variant="ghost">
                Clear Logs
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Firebase Status */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">Firebase Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg">
              <span className="font-medium text-neutral-300">Firebase Auth</span>
              <div className="flex items-center gap-2">
                {authStatus === 'connected' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : authStatus === 'error' ? (
                  <XCircle className="h-4 w-4 text-red-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                )}
                <span className="text-sm text-white">
                  {authStatus === 'connected' ? 'Connected' : 
                   authStatus === 'error' ? 'Error' : 'Unknown'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debug Logs */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">Debug Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black p-4 rounded-lg max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-neutral-500">No logs yet. Click a test button to start.</p>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, index) => (
                    <div key={index} className="text-sm font-mono text-green-400">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-neutral-300">
              <div>
                <h4 className="font-semibold text-white">1. Test Firebase Connection</h4>
                <p className="text-sm">Check if Firebase Auth is properly initialized.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white">2. Create Test User</h4>
                <p className="text-sm">Create a new user account for testing login functionality.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white">3. Test Sign In</h4>
                <p className="text-sm">Try signing in with the created user credentials.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white">4. Use Admin User</h4>
                <p className="text-sm">Test with the admin user (shaun@siamoon.com) - update password first.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
