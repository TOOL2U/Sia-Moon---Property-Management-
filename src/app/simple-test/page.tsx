'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

export default function SimpleTestPage() {
  const [message, setMessage] = useState('')
  const [count, setCount] = useState(0)

  const handleClick = () => {
    console.log('Button clicked!')
    setCount(prev => prev + 1)
    setMessage(`Button clicked ${count + 1} times!`)
  }

  const testAlert = () => {
    alert('Alert test works!')
    console.log('Alert button clicked')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Simple Test Page</h1>
        
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-xl font-semibold">Button Tests</h2>
          
          <div className="space-y-4">
            <Button onClick={testAlert}>
              Test Alert
            </Button>
            
            <Button onClick={handleClick}>
              Test State Update (Clicked {count} times)
            </Button>
            
            {message && (
              <div className="p-4 bg-green-100 text-green-800 rounded">
                {message}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Environment Check</h2>
          <div className="space-y-2 text-sm">
            <div>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</div>
            <div>Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</div>
            <div>Auth Bypass: {process.env.NEXT_PUBLIC_BYPASS_AUTH || 'false'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
