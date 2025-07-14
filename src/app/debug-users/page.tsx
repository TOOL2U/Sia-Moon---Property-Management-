'use client'

import React, { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, getDocs, doc, deleteDoc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { deleteUser, fetchSignInMethodsForEmail } from 'firebase/auth'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

interface FirebaseUser {
  uid: string
  email: string
  displayName?: string
  createdAt?: string
}

interface FirestoreProfile {
  id: string
  email: string
  fullName: string
  role: string
  createdAt?: any
}

interface LocalUser {
  id: string
  email: string
  name: string
  role: string
  created_at: string
}

export default function DebugUsersPage() {
  const [firebaseUsers, setFirebaseUsers] = useState<FirebaseUser[]>([])
  const [firestoreProfiles, setFirestoreProfiles] = useState<FirestoreProfile[]>([])
  const [firestoreUsers, setFirestoreUsers] = useState<FirestoreProfile[]>([])
  const [localUsers, setLocalUsers] = useState<LocalUser[]>([])
  const [testEmail, setTestEmail] = useState('shaunducker1@gmail.com')
  const [logs, setLogs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `[${timestamp}] ${message}`
    console.log(logMessage)
    setLogs(prev => [...prev, logMessage])
  }

  const loadAllUserData = async () => {
    setLoading(true)
    addLog('🔄 Loading all user data...')

    try {
      // Load Firestore profiles collection
      if (db) {
        const profilesRef = collection(db, 'profiles')
        const profilesSnapshot = await getDocs(profilesRef)
        const profiles: FirestoreProfile[] = []
        profilesSnapshot.forEach(doc => {
          profiles.push({ id: doc.id, ...doc.data() } as FirestoreProfile)
        })
        setFirestoreProfiles(profiles)
        addLog(`📋 Found ${profiles.length} profiles in Firestore profiles collection`)

        // Load Firestore users collection
        const usersRef = collection(db, 'users')
        const usersSnapshot = await getDocs(usersRef)
        const users: FirestoreProfile[] = []
        usersSnapshot.forEach(doc => {
          users.push({ id: doc.id, ...doc.data() } as FirestoreProfile)
        })
        setFirestoreUsers(users)
        addLog(`👥 Found ${users.length} users in Firestore users collection`)
      }

      // Load localStorage users
      const localData = localStorage.getItem('villa_management_users')
      if (localData) {
        const parsed = JSON.parse(localData)
        setLocalUsers(parsed)
        addLog(`💾 Found ${parsed.length} users in localStorage`)
      } else {
        setLocalUsers([])
        addLog('💾 No users found in localStorage')
      }

      // Note: We can't directly list Firebase Auth users from client-side
      addLog('🔥 Firebase Auth users can only be checked individually')

    } catch (error) {
      addLog(`❌ Error loading user data: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const checkEmailInFirebaseAuth = async (email: string) => {
    try {
      addLog(`🔍 Checking if ${email} exists in Firebase Auth...`)
      
      if (!auth) {
        addLog('❌ Firebase Auth not initialized')
        return
      }

      const signInMethods = await fetchSignInMethodsForEmail(auth, email)
      
      if (signInMethods.length > 0) {
        addLog(`✅ Email ${email} EXISTS in Firebase Auth with methods: ${signInMethods.join(', ')}`)
      } else {
        addLog(`❌ Email ${email} does NOT exist in Firebase Auth`)
      }
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        addLog(`❌ Email ${email} does NOT exist in Firebase Auth`)
      } else {
        addLog(`❌ Error checking Firebase Auth: ${error.message}`)
      }
    }
  }

  const clearLocalStorage = () => {
    localStorage.removeItem('villa_management_users')
    localStorage.removeItem('villa_management_staff')
    localStorage.removeItem('villa_management_bookings')
    setLocalUsers([])
    addLog('🧹 Cleared all localStorage data')
  }

  const synchronizeUserProfiles = async () => {
    setLoading(true)
    addLog('🔄 Starting user profile synchronization...')

    try {
      // Step 1: Get all users from Firestore users collection
      if (db) {
        const usersRef = collection(db, 'users')
        const usersSnapshot = await getDocs(usersRef)

        for (const userDoc of usersSnapshot.docs) {
          const userData = userDoc.data()
          const userId = userDoc.id

          addLog(`👤 Processing user: ${userData.email} (${userId})`)

          // Step 2: Check if profile exists in profiles collection
          const profileRef = doc(db, 'profiles', userId)
          const profileDoc = await getDoc(profileRef)

          if (!profileDoc.exists()) {
            addLog(`❌ Missing profile for user: ${userData.email}`)

            // Step 3: Create missing profile
            const profileData = {
              id: userId,
              email: userData.email?.toLowerCase().trim() || '',
              fullName: userData.fullName || userData.name || 'Unknown User',
              role: userData.role || 'client',
              properties: [], // Will be populated from subcollection
              preferences: {
                notifications: true,
                emailUpdates: true
              },
              createdAt: userData.createdAt || new Date(),
              updatedAt: new Date()
            }

            await setDoc(profileRef, profileData)
            addLog(`✅ Created profile for: ${userData.email}`)
          } else {
            addLog(`✅ Profile exists for: ${userData.email}`)
          }

          // Step 4: Check for properties in user subcollection
          const propertiesRef = collection(db, 'users', userId, 'properties')
          const propertiesSnapshot = await getDocs(propertiesRef)

          if (propertiesSnapshot.size > 0) {
            addLog(`🏠 Found ${propertiesSnapshot.size} properties for: ${userData.email}`)

            // Step 5: Update profile with property references
            const properties: any[] = []
            propertiesSnapshot.forEach(propDoc => {
              const propData = propDoc.data()
              properties.push({
                id: propDoc.id,
                name: propData.propertyName || propData.name || 'Unnamed Property',
                address: propData.propertyAddress || propData.address || '',
                status: propData.status || 'active',
                createdAt: propData.createdAt || new Date()
              })
            })

            // Update profile with property summary
            await updateDoc(profileRef, {
              properties: properties,
              updatedAt: new Date()
            })

            addLog(`✅ Updated profile with ${properties.length} property references`)
          }
        }

        addLog('✅ User profile synchronization completed')
      }
    } catch (error) {
      addLog(`❌ Error during synchronization: ${error}`)
    } finally {
      setLoading(false)
      // Reload data to show changes
      loadAllUserData()
    }
  }

  const deleteFirestoreProfile = async (userId: string, collection: string) => {
    try {
      if (!db) {
        addLog('❌ Firestore not initialized')
        return
      }

      await deleteDoc(doc(db, collection, userId))
      addLog(`🗑️ Deleted user ${userId} from ${collection} collection`)
      
      // Reload data
      loadAllUserData()
    } catch (error) {
      addLog(`❌ Error deleting from ${collection}: ${error}`)
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  useEffect(() => {
    loadAllUserData()
  }, [])

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">User Database Debug Tool</CardTitle>
            <CardDescription className="text-neutral-400">
              Check and synchronize user data across Firebase Auth, Firestore, and localStorage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              <Button onClick={loadAllUserData} disabled={loading}>
                {loading ? 'Loading...' : 'Reload All Data'}
              </Button>
              <Button onClick={synchronizeUserProfiles} disabled={loading} variant="default">
                {loading ? 'Synchronizing...' : 'Synchronize Profiles'}
              </Button>
              <Button onClick={clearLocalStorage} variant="outline">
                Clear localStorage
              </Button>
              <Button onClick={clearLogs} variant="ghost">
                Clear Logs
              </Button>
            </div>

            <div className="flex gap-2">
              <Input
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Email to check"
                className="flex-1"
              />
              <Button onClick={() => checkEmailInFirebaseAuth(testEmail)}>
                Check Firebase Auth
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Firestore Profiles */}
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Firestore Profiles ({firestoreProfiles.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {firestoreProfiles.map(profile => (
                  <div key={profile.id} className="flex justify-between items-center p-2 bg-neutral-800 rounded">
                    <div className="text-sm">
                      <div className="text-white">{profile.fullName}</div>
                      <div className="text-neutral-400">{profile.email}</div>
                      <div className="text-neutral-500">{profile.role}</div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteFirestoreProfile(profile.id, 'profiles')}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
                {firestoreProfiles.length === 0 && (
                  <p className="text-neutral-500">No profiles found</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Firestore Users */}
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Firestore Users ({firestoreUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {firestoreUsers.map(user => (
                  <div key={user.id} className="flex justify-between items-center p-2 bg-neutral-800 rounded">
                    <div className="text-sm">
                      <div className="text-white">{user.fullName}</div>
                      <div className="text-neutral-400">{user.email}</div>
                      <div className="text-neutral-500">{user.role}</div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteFirestoreProfile(user.id, 'users')}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
                {firestoreUsers.length === 0 && (
                  <p className="text-neutral-500">No users found</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* localStorage Users */}
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">localStorage Users ({localUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {localUsers.map(user => (
                  <div key={user.id} className="p-2 bg-neutral-800 rounded">
                    <div className="text-sm">
                      <div className="text-white">{user.name}</div>
                      <div className="text-neutral-400">{user.email}</div>
                      <div className="text-neutral-500">{user.role}</div>
                    </div>
                  </div>
                ))}
                {localUsers.length === 0 && (
                  <p className="text-neutral-500">No local users found</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Debug Logs */}
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Debug Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black p-4 rounded-lg max-h-64 overflow-y-auto">
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
    </div>
  )
}
