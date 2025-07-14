'use client'

import React, { useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { fetchSignInMethodsForEmail, sendPasswordResetEmail } from 'firebase/auth'
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

interface CleanupResult {
  step: string
  status: 'success' | 'error' | 'info'
  message: string
}

export default function CleanupUsersPage() {
  const [email, setEmail] = useState('shaunducker1@gmail.com')
  const [results, setResults] = useState<CleanupResult[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const addResult = (step: string, status: 'success' | 'error' | 'info', message: string) => {
    const result: CleanupResult = { step, status, message }
    setResults(prev => [...prev, result])
    console.log(`${status.toUpperCase()}: ${step} - ${message}`)
  }

  const clearResults = () => {
    setResults([])
  }

  const checkUserExistence = async () => {
    if (!email) {
      addResult('Validation', 'error', 'Please enter an email address')
      return
    }

    setIsProcessing(true)
    clearResults()

    try {
      addResult('Start', 'info', `Checking user existence for: ${email}`)

      // Step 1: Check Firebase Auth
      if (auth) {
        try {
          const signInMethods = await fetchSignInMethodsForEmail(auth, email)
          if (signInMethods.length > 0) {
            addResult('Firebase Auth', 'info', `User EXISTS with sign-in methods: ${signInMethods.join(', ')}`)
          } else {
            addResult('Firebase Auth', 'success', 'User does NOT exist in Firebase Auth')
          }
        } catch (error: any) {
          if (error.code === 'auth/user-not-found') {
            addResult('Firebase Auth', 'success', 'User does NOT exist in Firebase Auth')
          } else {
            addResult('Firebase Auth', 'error', `Error checking: ${error.message}`)
          }
        }
      }

      // Step 2: Check Firestore profiles collection
      if (db) {
        const profilesRef = collection(db, 'profiles')
        const profileQuery = query(profilesRef, where('email', '==', email))
        const profileSnapshot = await getDocs(profileQuery)
        
        if (!profileSnapshot.empty) {
          addResult('Firestore Profiles', 'info', `Found ${profileSnapshot.size} profile(s)`)
          profileSnapshot.forEach(doc => {
            const data = doc.data()
            addResult('Profile Details', 'info', `ID: ${doc.id}, Name: ${data.fullName}, Role: ${data.role}`)
          })
        } else {
          addResult('Firestore Profiles', 'success', 'No profiles found')
        }

        // Step 3: Check Firestore users collection
        const usersRef = collection(db, 'users')
        const userQuery = query(usersRef, where('email', '==', email))
        const userSnapshot = await getDocs(userQuery)
        
        if (!userSnapshot.empty) {
          addResult('Firestore Users', 'info', `Found ${userSnapshot.size} user document(s)`)
          userSnapshot.forEach(doc => {
            const data = doc.data()
            addResult('User Details', 'info', `ID: ${doc.id}, Name: ${data.fullName}, Role: ${data.role}`)
          })
        } else {
          addResult('Firestore Users', 'success', 'No user documents found')
        }
      }

      // Step 4: Check localStorage
      const localUsers = localStorage.getItem('villa_management_users')
      if (localUsers) {
        const users = JSON.parse(localUsers)
        const foundUser = users.find((u: any) => u.email === email)
        if (foundUser) {
          addResult('localStorage', 'info', `Found user: ${foundUser.name} (${foundUser.role})`)
        } else {
          addResult('localStorage', 'success', 'User not found in localStorage')
        }
      } else {
        addResult('localStorage', 'success', 'No localStorage data found')
      }

    } catch (error) {
      addResult('Error', 'error', `Unexpected error: ${error}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const cleanupUserData = async () => {
    if (!email) {
      addResult('Validation', 'error', 'Please enter an email address')
      return
    }

    setIsProcessing(true)
    addResult('Cleanup', 'info', `Starting cleanup for: ${email}`)

    try {
      // Clean Firestore profiles
      if (db) {
        const profilesRef = collection(db, 'profiles')
        const profileQuery = query(profilesRef, where('email', '==', email))
        const profileSnapshot = await getDocs(profileQuery)
        
        for (const docSnapshot of profileSnapshot.docs) {
          await deleteDoc(doc(db, 'profiles', docSnapshot.id))
          addResult('Cleanup Profiles', 'success', `Deleted profile: ${docSnapshot.id}`)
        }

        // Clean Firestore users
        const usersRef = collection(db, 'users')
        const userQuery = query(usersRef, where('email', '==', email))
        const userSnapshot = await getDocs(userQuery)
        
        for (const docSnapshot of userSnapshot.docs) {
          await deleteDoc(doc(db, 'users', docSnapshot.id))
          addResult('Cleanup Users', 'success', `Deleted user document: ${docSnapshot.id}`)
        }
      }

      // Clean localStorage
      const localUsers = localStorage.getItem('villa_management_users')
      if (localUsers) {
        const users = JSON.parse(localUsers)
        const filteredUsers = users.filter((u: any) => u.email !== email)
        if (users.length !== filteredUsers.length) {
          localStorage.setItem('villa_management_users', JSON.stringify(filteredUsers))
          addResult('Cleanup localStorage', 'success', 'Removed user from localStorage')
        }
      }

      addResult('Cleanup Complete', 'success', 'All Firestore and localStorage data cleaned')
      addResult('Note', 'info', 'Firebase Auth user (if exists) must be deleted manually or will expire')

    } catch (error) {
      addResult('Cleanup Error', 'error', `Error during cleanup: ${error}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const sendPasswordReset = async () => {
    if (!email || !auth) {
      addResult('Password Reset', 'error', 'Email required and Firebase Auth must be initialized')
      return
    }

    try {
      await sendPasswordResetEmail(auth, email)
      addResult('Password Reset', 'success', 'Password reset email sent (if user exists)')
    } catch (error: any) {
      addResult('Password Reset', 'error', `Failed: ${error.message}`)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'info':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">User Cleanup Tool</CardTitle>
            <CardDescription className="text-neutral-400">
              Check and clean up user data across all systems to resolve signup conflicts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address to check/cleanup"
                className="flex-1"
              />
            </div>

            <div className="flex gap-4 flex-wrap">
              <Button 
                onClick={checkUserExistence} 
                disabled={isProcessing}
              >
                {isProcessing ? 'Checking...' : 'Check User Existence'}
              </Button>
              
              <Button 
                onClick={cleanupUserData} 
                disabled={isProcessing}
                variant="outline"
              >
                {isProcessing ? 'Cleaning...' : 'Cleanup User Data'}
              </Button>

              <Button 
                onClick={sendPasswordReset} 
                disabled={isProcessing}
                variant="ghost"
              >
                Send Password Reset
              </Button>

              <Button onClick={clearResults} variant="ghost">
                Clear Results
              </Button>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div className="text-sm text-yellow-200">
                  <p className="font-semibold">Important Notes:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>This tool cleans Firestore and localStorage data only</li>
                    <li>Firebase Auth users cannot be deleted from client-side code</li>
                    <li>If a Firebase Auth user exists, you may need to use password reset</li>
                    <li>Always backup important data before cleanup</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.length === 0 ? (
                <p className="text-neutral-500">No results yet. Click "Check User Existence" to start.</p>
              ) : (
                results.map((result, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-neutral-800 rounded-lg">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="font-medium text-white">{result.step}</div>
                      <div className="text-sm text-neutral-300">{result.message}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
