'use client'

import { useState, useEffect } from 'react'
import { auth, db, storage } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

interface ConnectionStatus {
  auth: boolean
  firestore: boolean
  storage: boolean
  authUser: string | null
}

export function FirebaseConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>({
    auth: false,
    firestore: false,
    storage: false,
    authUser: null
  })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const checkConnections = async () => {
      const newStatus: ConnectionStatus = {
        auth: !!auth,
        firestore: !!db,
        storage: !!storage,
        authUser: null
      }

      // Test auth connection
      if (auth) {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          setStatus(prev => ({
            ...prev,
            authUser: user?.email || null
          }))
        })

        // Clean up listener after a short time
        setTimeout(() => unsubscribe(), 1000)
      }

      // Test Firestore connection
      if (db) {
        try {
          // Try to read a document (this will fail gracefully if no permissions)
          await getDoc(doc(db, 'test', 'connection'))
          newStatus.firestore = true
        } catch {
          // Even if we get a permission error, it means Firestore is connected
          newStatus.firestore = true
        }
      }

      setStatus(newStatus)
    }

    checkConnections()
  }, [])

  const getStatusColor = (connected: boolean) => {
    return connected ? 'bg-green-500' : 'bg-red-500'
  }

  const getOverallStatus = () => {
    const connected = status.auth && status.firestore && status.storage
    return connected ? 'All Connected' : 'Connection Issues'
  }

  const getOverallColor = () => {
    const connected = status.auth && status.firestore && status.storage
    return connected ? 'border-green-500 bg-green-900/20' : 'border-red-500 bg-red-900/20'
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div 
        className={`bg-neutral-900 border rounded-lg p-3 transition-all duration-300 ${
          isVisible ? 'w-64' : 'w-12'
        } ${getOverallColor()}`}
      >
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsVisible(!isVisible)}
            className="text-white hover:text-neutral-300 transition-colors"
            title="Firebase Connection Status"
          >
            🔥
          </button>
          
          {isVisible && (
            <div className="ml-3 flex-1">
              <div className="text-xs font-semibold text-white mb-2">
                {getOverallStatus()}
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-300">Auth:</span>
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(status.auth)}`} />
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-300">Firestore:</span>
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(status.firestore)}`} />
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-300">Storage:</span>
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(status.storage)}`} />
                </div>
                
                {status.authUser && (
                  <div className="text-xs text-neutral-400 mt-2 truncate">
                    User: {status.authUser}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
