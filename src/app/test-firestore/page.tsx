'use client'

import { useState } from 'react'
import { collection, addDoc, getDocs, doc, getDoc, connectFirestoreEmulator } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { useAuthState } from 'react-firebase-hooks/auth'

export default function TestFirestore() {
  const [user, loading, error] = useAuthState(auth)
  const [testResult, setTestResult] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const testFirestoreConnection = async () => {
    setIsLoading(true)
    setTestResult('Testing Firestore connection...\n')

    try {
      // Test 1: Basic connection test
      setTestResult(prev => prev + '✅ Step 1: Firebase initialized\n')
      setTestResult(prev => prev + `✅ Step 1.1: Database instance: ${db ? 'Connected' : 'Not connected'}\n`)

      // Test 2: Check authentication state
      setTestResult(prev => prev + `🔍 Step 2: Auth state - User: ${user ? 'Authenticated' : 'Not authenticated'}\n`)
      if (user) {
        setTestResult(prev => prev + `✅ Step 2.1: User ID: ${user.uid}\n`)
        setTestResult(prev => prev + `✅ Step 2.2: User email: ${user.email}\n`)
      }

      // Test 3: Try to read from a simple collection (without auth requirement)
      setTestResult(prev => prev + '🔄 Step 3: Testing Firestore read (public collection)...\n')
      try {
        const testCollection = collection(db, 'public-test')
        const snapshot = await getDocs(testCollection)
        setTestResult(prev => prev + `✅ Step 3: Firestore read successful (${snapshot.size} documents)\n`)
      } catch (readError: any) {
        setTestResult(prev => prev + `❌ Step 3: Firestore read failed: ${readError.message}\n`)
        setTestResult(prev => prev + `❌ Step 3: Error code: ${readError.code}\n`)
      }

      // Test 4: Try to write to Firestore (if authenticated)
      if (user) {
        setTestResult(prev => prev + '🔄 Step 4: Testing Firestore write...\n')
        try {
          const docRef = await addDoc(collection(db, 'test'), {
            message: 'Test message',
            timestamp: new Date(),
            userId: user.uid
          })
          setTestResult(prev => prev + `✅ Step 4: Firestore write successful: ${docRef.id}\n`)
        } catch (writeError: any) {
          setTestResult(prev => prev + `❌ Step 4: Firestore write failed: ${writeError.message}\n`)
          setTestResult(prev => prev + `❌ Step 4: Error code: ${writeError.code}\n`)
        }

        // Test 5: Try to read user document
        setTestResult(prev => prev + '🔄 Step 5: Testing user document read...\n')
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid))
          if (userDoc.exists()) {
            setTestResult(prev => prev + `✅ Step 5: User document exists\n`)
            setTestResult(prev => prev + `✅ Step 5.1: User data: ${JSON.stringify(userDoc.data(), null, 2)}\n`)
          } else {
            setTestResult(prev => prev + `⚠️ Step 5: User document does not exist\n`)
          }
        } catch (userReadError: any) {
          setTestResult(prev => prev + `❌ Step 5: User document read failed: ${userReadError.message}\n`)
          setTestResult(prev => prev + `❌ Step 5: Error code: ${userReadError.code}\n`)
        }
      } else {
        setTestResult(prev => prev + '⚠️ Step 4-5: Skipping authenticated tests (user not signed in)\n')
      }

      setTestResult(prev => prev + '\n🎉 Connection test completed!')

    } catch (error: any) {
      console.error('Firestore test error:', error)
      setTestResult(prev => prev + `❌ General Error: ${error.message}\n`)
      setTestResult(prev => prev + `❌ Error code: ${error.code || 'unknown'}\n`)
      setTestResult(prev => prev + `❌ Error stack: ${error.stack}\n`)
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Firestore Connection Test</h1>
          <p>Loading authentication state...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Firestore Connection Test</h1>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
          {user ? (
            <div className="bg-green-900 p-4 rounded-lg">
              <p>✅ Authenticated as: {user.email}</p>
              <p>User ID: {user.uid}</p>
            </div>
          ) : (
            <div className="bg-red-900 p-4 rounded-lg">
              <p>❌ Not authenticated</p>
              <p>Please sign in first to test Firestore</p>
            </div>
          )}
        </div>

        <div className="mb-6">
          <button
            onClick={testFirestoreConnection}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-medium mr-4"
          >
            {isLoading ? 'Testing...' : 'Test Firestore Connection'}
          </button>
          <p className="text-sm text-gray-400 mt-2">
            This test will work with or without authentication
          </p>
        </div>

        {testResult && (
          <div className="bg-gray-900 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Test Results</h3>
            <pre className="whitespace-pre-wrap text-sm">{testResult}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
