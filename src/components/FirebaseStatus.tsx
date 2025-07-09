'use client'

import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'

interface FirebaseStatusProps {
  showInProduction?: boolean
}

export default function FirebaseStatus({ showInProduction = false }: FirebaseStatusProps) {
  const [status, setStatus] = useState<{
    auth: boolean
    db: boolean
    config: any
    error?: string
  }>({
    auth: false,
    db: false,
    config: null
  })

  useEffect(() => {
    // Only show in development or if explicitly enabled for production
    if (process.env.NODE_ENV === 'production' && !showInProduction) {
      return
    }

    const checkFirebaseStatus = () => {
      try {
        const config = {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing',
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing',
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing',
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? '✅ Set' : '❌ Missing',
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? '✅ Set' : '❌ Missing',
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? '✅ Set' : '❌ Missing',
        }

        setStatus({
          auth: !!auth,
          db: !!db,
          config,
          error: (!auth || !db) ? 'Firebase services not initialized' : undefined
        })
      } catch (error) {
        setStatus({
          auth: false,
          db: false,
          config: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    checkFirebaseStatus()
  }, [showInProduction])

  // Don't render in production unless explicitly enabled
  if (process.env.NODE_ENV === 'production' && !showInProduction) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg max-w-sm text-xs z-50">
      <h3 className="font-bold mb-2">🔥 Firebase Status</h3>
      
      <div className="space-y-1">
        <div>Auth: {status.auth ? '✅' : '❌'}</div>
        <div>Database: {status.db ? '✅' : '❌'}</div>
        
        {status.error && (
          <div className="text-red-400 mt-2">
            Error: {status.error}
          </div>
        )}
        
        <details className="mt-2">
          <summary className="cursor-pointer">Environment Variables</summary>
          <div className="mt-1 space-y-1">
            {status.config && Object.entries(status.config).map(([key, value]) => (
              <div key={key} className="text-xs">
                {key}: {value as string}
              </div>
            ))}
          </div>
        </details>
      </div>
    </div>
  )
}
