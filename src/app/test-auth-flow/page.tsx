'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/SupabaseAuthContext'
import { useRouter } from 'next/navigation'

export default function TestAuthFlow() {
  const { signIn, profile, loading } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('shaun@gmail.com')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')

  const handleTest = async () => {
    try {
      setStatus('🔄 Starting login test...')
      console.log('🔄 Starting login test...')
      
      const success = await signIn(email, password)
      
      if (success) {
        setStatus('✅ Login successful! Attempting redirect...')
        console.log('✅ Login successful! Attempting redirect...')
        
        // Wait a moment for auth state to update
        setTimeout(() => {
          console.log('🔄 Executing redirect to dashboard...')
          router.push('/dashboard')
        }, 500)
      } else {
        setStatus('❌ Login failed')
        console.log('❌ Login failed')
      }
    } catch (error) {
      setStatus(`❌ Error: ${error}`)
      console.error('❌ Error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Test Auth Flow</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            onClick={handleTest}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Login & Redirect'}
          </button>
          
          {status && (
            <div className="p-3 bg-gray-100 rounded-md">
              <p className="text-sm">{status}</p>
            </div>
          )}
          
          {profile && (
            <div className="p-3 bg-green-100 rounded-md">
              <p className="text-sm font-medium">Current User:</p>
              <p className="text-sm">Email: {profile.email}</p>
              <p className="text-sm">Role: {profile.role}</p>
              <p className="text-sm">ID: {profile.id}</p>
            </div>
          )}
        </div>
        
        <div className="mt-6 text-center">
          <a href="/auth/login" className="text-blue-600 hover:underline">
            Go to actual login page
          </a>
        </div>
      </div>
    </div>
  )
}
