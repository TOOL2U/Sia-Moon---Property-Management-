'use client'

import { useEffect, useState } from 'react'

export default function DebugEnvPage() {
  const [envStatus, setEnvStatus] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const status = {
        // Environment info
        nodeEnv: process.env.NODE_ENV,
        
        // Firebase environment variables
        firebaseApiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 
          `✅ Set (${process.env.NEXT_PUBLIC_FIREBASE_API_KEY.substring(0, 10)}...)` : 
          '❌ Missing',
        firebaseAuthDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '❌ Missing',
        firebaseProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '❌ Missing',
        firebaseStorageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '❌ Missing',
        firebaseMessagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '❌ Missing',
        firebaseAppId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? 
          `✅ Set (${process.env.NEXT_PUBLIC_FIREBASE_APP_ID.substring(0, 20)}...)` : 
          '❌ Missing',
        
        // Other variables
        appUrl: process.env.NEXT_PUBLIC_APP_URL || '❌ Missing',
        webhookUrl: process.env.NEXT_PUBLIC_MAKE_WEBHOOK_URL || '❌ Missing',
        
        // Runtime info
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
        location: typeof window !== 'undefined' ? window.location.href : 'Server'
      }
      
      setEnvStatus(status)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [])

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-red-400">Debug Error</h1>
          <div className="bg-red-900/20 border border-red-500 p-4 rounded">
            <p className="text-red-400">Error: {error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!envStatus) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Loading Debug Info...</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 Environment Debug Page</h1>
        
        <div className="space-y-6">
          {/* Environment Status */}
          <div className="bg-gray-900 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Environment Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Node Environment:</strong> {envStatus.nodeEnv}
              </div>
              <div>
                <strong>Timestamp:</strong> {envStatus.timestamp}
              </div>
              <div className="md:col-span-2">
                <strong>Location:</strong> {envStatus.location}
              </div>
            </div>
          </div>

          {/* Firebase Variables */}
          <div className="bg-gray-900 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">🔥 Firebase Environment Variables</h2>
            <div className="space-y-2 text-sm">
              <div><strong>API Key:</strong> {envStatus.firebaseApiKey}</div>
              <div><strong>Auth Domain:</strong> {envStatus.firebaseAuthDomain}</div>
              <div><strong>Project ID:</strong> {envStatus.firebaseProjectId}</div>
              <div><strong>Storage Bucket:</strong> {envStatus.firebaseStorageBucket}</div>
              <div><strong>Messaging Sender ID:</strong> {envStatus.firebaseMessagingSenderId}</div>
              <div><strong>App ID:</strong> {envStatus.firebaseAppId}</div>
            </div>
          </div>

          {/* Other Variables */}
          <div className="bg-gray-900 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">🌐 Other Environment Variables</h2>
            <div className="space-y-2 text-sm">
              <div><strong>App URL:</strong> {envStatus.appUrl}</div>
              <div><strong>Webhook URL:</strong> {envStatus.webhookUrl}</div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-900/20 border border-blue-500 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">📋 Next Steps</h2>
            <ul className="space-y-2 text-sm">
              <li>• All Firebase variables should show ✅ Set</li>
              <li>• If any show ❌ Missing, check your Netlify environment variables</li>
              <li>• After fixing variables, redeploy your site</li>
              <li>• Check browser console for any JavaScript errors</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
