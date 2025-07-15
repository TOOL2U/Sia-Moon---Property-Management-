'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function TestFirebasePage() {
  const { user } = useAuth()
  const [testResult, setTestResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testFirebaseWrite = async () => {
    setLoading(true)
    setTestResult('Testing...')
    
    try {
      // Test Firebase Auth state
      const { auth, db } = await import('@/lib/firebase')
      const { collection, addDoc, Timestamp } = await import('firebase/firestore')
      
      console.log('🔍 Auth state:', {
        contextUser: user,
        firebaseUser: auth?.currentUser,
        uid: auth?.currentUser?.uid
      })
      
      if (!auth?.currentUser) {
        throw new Error('No Firebase authenticated user')
      }
      
      if (!db) {
        throw new Error('Firestore not initialized')
      }
      
      // Test write to onboarding_submissions
      const testData = {
        test: true,
        userId: user?.id,
        firebaseUid: auth.currentUser.uid,
        timestamp: Timestamp.now(),
        createdAt: Timestamp.now()
      }
      
      const docRef = await addDoc(collection(db, 'onboarding_submissions'), testData)
      setTestResult(`✅ Success! Document created: ${docRef.id}`)
      
    } catch (error: any) {
      console.error('❌ Test failed:', error)
      setTestResult(`❌ Error: ${error.message || error.code || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Firebase Test Page</h1>
        
        <div className="bg-neutral-900 p-6 rounded-lg mb-6">
          <h2 className="text-lg font-semibold mb-4">User Authentication Status</h2>
          <pre className="text-sm text-neutral-300">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
        
        <button
          onClick={testFirebaseWrite}
          disabled={loading || !user}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded-lg mb-4"
        >
          {loading ? 'Testing...' : 'Test Firebase Write'}
        </button>
        
        {testResult && (
          <div className="bg-neutral-900 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Test Result:</h3>
            <pre className="text-sm text-neutral-300">{testResult}</pre>
          </div>
        )}
        
        {!user && (
          <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-lg">
            <p className="text-red-400">⚠️ No authenticated user. Please sign in first.</p>
          </div>
        )}
      </div>
    </div>
  )
}
