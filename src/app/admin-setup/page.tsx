'use client'

import React, { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, query, where } from 'firebase/firestore'
import { fetchSignInMethodsForEmail } from 'firebase/auth'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { CheckCircle, XCircle, AlertTriangle, Crown, User } from 'lucide-react'

interface AdminUser {
  email: string
  name: string
  role: string
}

export default function AdminSetupPage() {
  const [adminEmail] = useState('shaun@siamoon.com')
  const [adminName] = useState('Sia Moon Sanctuary')
  const [logs, setLogs] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [adminStatus, setAdminStatus] = useState<{
    firebaseAuthExists: boolean
    profileExists: boolean
    userDocExists: boolean
    hasAdminRole: boolean
  } | null>(null)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `[${timestamp}] ${message}`
    console.log(logMessage)
    setLogs(prev => [...prev, logMessage])
  }

  const checkAdminStatus = async () => {
    addLog('🔍 Checking admin user status...')
    
    const status = {
      firebaseAuthExists: false,
      profileExists: false,
      userDocExists: false,
      hasAdminRole: false
    }

    try {
      // Check Firebase Auth
      if (auth) {
        try {
          const signInMethods = await fetchSignInMethodsForEmail(auth, adminEmail)
          status.firebaseAuthExists = signInMethods.length > 0
          addLog(`🔥 Firebase Auth: ${status.firebaseAuthExists ? 'EXISTS' : 'NOT FOUND'}`)
        } catch (error: any) {
          addLog(`❌ Firebase Auth check failed: ${error.message}`)
        }
      }

      // Check profiles collection
      if (db) {
        const profilesRef = collection(db, 'profiles')
        const profileQuery = query(profilesRef, where('email', '==', adminEmail))
        const profileSnapshot = await getDocs(profileQuery)
        
        if (!profileSnapshot.empty) {
          status.profileExists = true
          const profileData = profileSnapshot.docs[0].data()
          status.hasAdminRole = profileData.role === 'admin'
          addLog(`👤 Profile: EXISTS (role: ${profileData.role})`)
        } else {
          addLog(`👤 Profile: NOT FOUND`)
        }

        // Check users collection
        const usersRef = collection(db, 'users')
        const userQuery = query(usersRef, where('email', '==', adminEmail))
        const userSnapshot = await getDocs(userQuery)
        
        if (!userSnapshot.empty) {
          status.userDocExists = true
          const userData = userSnapshot.docs[0].data()
          addLog(`📋 User document: EXISTS (role: ${userData.role})`)
        } else {
          addLog(`📋 User document: NOT FOUND`)
        }
      }

      setAdminStatus(status)
      
    } catch (error) {
      addLog(`❌ Error checking admin status: ${error}`)
    }
  }

  const setupAdminUser = async () => {
    setIsProcessing(true)
    addLog('🚀 Setting up admin user...')

    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized')
      }

      // Find user by email in users collection
      const usersRef = collection(db, 'users')
      const userQuery = query(usersRef, where('email', '==', adminEmail))
      const userSnapshot = await getDocs(userQuery)

      let userId: string | null = null

      if (!userSnapshot.empty) {
        // User exists, get the ID
        userId = userSnapshot.docs[0].id
        const userData = userSnapshot.docs[0].data()
        addLog(`✅ Found existing user: ${userId}`)

        // Update user document with admin role
        const userRef = doc(db, 'users', userId)
        await updateDoc(userRef, {
          role: 'admin',
          fullName: adminName,
          updatedAt: new Date()
        })
        addLog(`✅ Updated user document with admin role`)

      } else {
        addLog(`❌ User not found in users collection`)
        addLog(`💡 User needs to sign up first at: http://localhost:3000/auth/signup`)
        setIsProcessing(false)
        return
      }

      // Create/update profile in profiles collection
      if (userId) {
        const profileRef = doc(db, 'profiles', userId)
        const profileDoc = await getDoc(profileRef)

        const profileData = {
          id: userId,
          email: adminEmail.toLowerCase().trim(),
          fullName: adminName,
          role: 'admin' as const,
          properties: [],
          preferences: {
            notifications: true,
            emailUpdates: true
          },
          createdAt: profileDoc.exists() ? profileDoc.data().createdAt : new Date(),
          updatedAt: new Date()
        }

        await setDoc(profileRef, profileData)
        addLog(`✅ ${profileDoc.exists() ? 'Updated' : 'Created'} admin profile`)
      }

      addLog('🎉 Admin user setup completed successfully!')
      
      // Recheck status
      await checkAdminStatus()

    } catch (error) {
      addLog(`❌ Error setting up admin user: ${error}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  useEffect(() => {
    checkAdminStatus()
  }, [])

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Admin User Setup
            </CardTitle>
            <CardDescription className="text-neutral-400">
              Ensure {adminEmail} has proper admin privileges
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-neutral-800 p-4 rounded-lg">
              <h3 className="text-white font-semibold mb-2">Admin User Details:</h3>
              <div className="space-y-1 text-sm">
                <div className="text-neutral-300">Email: <span className="text-white">{adminEmail}</span></div>
                <div className="text-neutral-300">Name: <span className="text-white">{adminName}</span></div>
                <div className="text-neutral-300">Role: <span className="text-yellow-400">admin</span></div>
              </div>
            </div>

            <div className="flex gap-4 flex-wrap">
              <Button 
                onClick={checkAdminStatus} 
                disabled={isProcessing}
                variant="outline"
              >
                Check Status
              </Button>
              
              <Button 
                onClick={setupAdminUser} 
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                <Crown className="h-4 w-4" />
                {isProcessing ? 'Setting up...' : 'Setup Admin User'}
              </Button>

              <Button onClick={clearLogs} variant="ghost">
                Clear Logs
              </Button>
            </div>

            {adminStatus && (
              <div className="bg-neutral-800 p-4 rounded-lg">
                <h3 className="text-white font-semibold mb-3">Current Status:</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {adminStatus.firebaseAuthExists ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm text-neutral-300">
                      Firebase Auth Account: {adminStatus.firebaseAuthExists ? 'EXISTS' : 'MISSING'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {adminStatus.userDocExists ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm text-neutral-300">
                      User Document: {adminStatus.userDocExists ? 'EXISTS' : 'MISSING'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {adminStatus.profileExists ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm text-neutral-300">
                      Profile Document: {adminStatus.profileExists ? 'EXISTS' : 'MISSING'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {adminStatus.hasAdminRole ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm text-neutral-300">
                      Admin Role: {adminStatus.hasAdminRole ? 'ASSIGNED' : 'NOT ASSIGNED'}
                    </span>
                  </div>
                </div>

                {!adminStatus.firebaseAuthExists && (
                  <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                      <div className="text-sm text-yellow-200">
                        <p className="font-semibold">Action Required:</p>
                        <p>The admin user needs to sign up first at:</p>
                        <a 
                          href="/auth/signup" 
                          className="text-yellow-400 underline hover:text-yellow-300"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          http://localhost:3000/auth/signup
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Debug Logs */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">Setup Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black p-4 rounded-lg max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-neutral-500">No logs yet</p>
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
      </div>
    </div>
  )
}
