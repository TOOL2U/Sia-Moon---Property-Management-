'use client'

import { useState } from 'react'
// TODO: Switch back to Supabase for production
// import { createClient } from '@/lib/supabase/client'
import DatabaseService from '@/lib/dbService'
import { useLocalAuth } from '@/hooks/useLocalAuth'

export default function TestProfilePage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const { user: authUser } = useLocalAuth()

  const testProfile = async () => {
    setLoading(true)

    try {
      console.log('🔍 Testing local database...')

      // Test 1: Get all users
      const { data: allUsers, error: allError } = await DatabaseService.getAllUsers()
      console.log('All users:', allUsers, 'Error:', allError)

      // Test 2: Find by email
      const { data: userByEmail, error: emailError } = await DatabaseService.getUserByEmail('test@example.com')
      console.log('User by email:', userByEmail, 'Error:', emailError)

      // Test 3: Test connection
      const connectionTest = await DatabaseService.testConnection()
      console.log('Connection test:', connectionTest)

      setResult({
        allUsers,
        allError: allError?.message,
        userByEmail,
        emailError: emailError?.message,
        authUser: authUser ? {
          id: authUser.id,
          email: authUser.email,
          role: authUser.role
        } : null,
        connectionTest
      })
    } catch (error: any) {
      console.error('❌ Test error:', error)
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const createTestProfile = async () => {
    setLoading(true)

    try {
      console.log('🔄 Creating test profile...')

      const { data, error } = await DatabaseService.createUser({
        email: 'newuser@example.com',
        name: 'New Test User',
        role: 'client'
      })

      console.log('Created profile:', data, 'Error:', error)
      setResult({ created: data, error: error?.message })
    } catch (error: any) {
      console.error('❌ Create error:', error)
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Test Profile Database</h1>
      
      <div className="space-y-4">
        <button
          onClick={testProfile}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Profile Lookup'}
        </button>
        
        <button
          onClick={createTestProfile}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Test Profile'}
        </button>
      </div>
      
      {result && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h2 className="font-bold mb-2">Result:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
