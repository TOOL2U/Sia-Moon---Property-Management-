'use client'

import { useEffect, useState } from 'react'

export default function DebugFirebase() {
  const [config, setConfig] = useState<any>(null)

  useEffect(() => {
    // Get all Firebase environment variables
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
    }

    const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId']
    const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig])

    setConfig({
      ...firebaseConfig,
      missingFields,
      isComplete: missingFields.length === 0
    })
  }, [])

  if (!config) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Firebase Configuration Debug</h1>
        
        <div className="space-y-6">
          <div className="bg-neutral-900 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Configuration Status</h2>
            <div className={`p-4 rounded-lg ${config.isComplete ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
              {config.isComplete ? '✅ Configuration Complete' : '❌ Configuration Incomplete'}
            </div>
            
            {config.missingFields.length > 0 && (
              <div className="mt-4 p-4 bg-red-900 text-red-300 rounded-lg">
                <h3 className="font-semibold">Missing Fields:</h3>
                <ul className="list-disc list-inside mt-2">
                  {config.missingFields.map((field: string) => (
                    <li key={field}>{field}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="bg-neutral-900 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
            <div className="space-y-3">
              {Object.entries(config).map(([key, value]) => {
                if (key === 'missingFields' || key === 'isComplete') return null
                
                const envVarName = `NEXT_PUBLIC_FIREBASE_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`
                const hasValue = !!value
                
                return (
                  <div key={key} className="flex items-center justify-between p-3 bg-neutral-800 rounded">
                    <div>
                      <div className="font-mono text-sm text-blue-400">{envVarName}</div>
                      <div className="text-xs text-neutral-400">{key}</div>
                    </div>
                    <div className={`px-3 py-1 rounded text-sm ${hasValue ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                      {hasValue ? '✅ Set' : '❌ Missing'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-neutral-900 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Values (Masked)</h2>
            <div className="space-y-2 font-mono text-sm">
              {Object.entries(config).map(([key, value]) => {
                if (key === 'missingFields' || key === 'isComplete') return null
                
                let displayValue = 'NOT SET'
                if (value) {
                  if (key === 'apiKey' || key === 'appId') {
                    displayValue = `${String(value).substring(0, 10)}...`
                  } else {
                    displayValue = String(value)
                  }
                }
                
                return (
                  <div key={key} className="text-neutral-300">
                    <span className="text-blue-400">{key}:</span> {displayValue}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-neutral-900 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Required Environment Variables</h2>
            <div className="bg-neutral-800 p-4 rounded font-mono text-sm">
              <div className="text-green-400 mb-2"># Add these to your Vercel environment variables:</div>
              <div className="space-y-1 text-neutral-300">
                <div>NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCDaTQsNpWw0y-g6VeXDYG57eCNtfloxxw</div>
                <div>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=operty-b54dc.firebaseapp.com</div>
                <div>NEXT_PUBLIC_FIREBASE_PROJECT_ID=operty-b54dc</div>
                <div>NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=operty-b54dc.firebasestorage.app</div>
                <div>NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=914547669275</div>
                <div>NEXT_PUBLIC_FIREBASE_APP_ID=1:914547669275:web:0897d32d59b17134a53bbe</div>
                <div className="text-neutral-500"># Optional:</div>
                <div>NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-R1PELW8B8Q</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
