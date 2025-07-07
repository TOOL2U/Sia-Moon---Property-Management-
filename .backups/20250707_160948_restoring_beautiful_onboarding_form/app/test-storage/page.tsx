'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import DatabaseService from '@/lib/dbService'
import { CheckCircle, XCircle, Loader2, Database, Users, Trash2 } from 'lucide-react'

export default function TestStoragePage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [storageData, setStorageData] = useState<any>({})

  const loadUsers = async () => {
    setLoading(true)
    try {
      const { data, error } = await DatabaseService.getAllUsers()
      if (error) {
        console.error('Error loading users:', error)
        return
      }
      setUsers(data || [])
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStorageData = () => {
    const storageKeys = [
      'sia_moon_users',
      'sia_moon_properties',
      'sia_moon_bookings',
      'sia_moon_villa_onboardings'
    ]

    const data: any = {}
    storageKeys.forEach(key => {
      const item = localStorage.getItem(key)
      if (item) {
        try {
          data[key] = JSON.parse(item)
        } catch (error) {
          data[key] = item
        }
      } else {
        data[key] = null
      }
    })
    setStorageData(data)
  }

  const clearStorage = () => {
    const storageKeys = [
      'sia_moon_users',
      'sia_moon_properties',
      'sia_moon_bookings',
      'sia_moon_villa_onboardings'
    ]

    storageKeys.forEach(key => {
      localStorage.removeItem(key)
    })
    
    setStorageData({})
    setUsers([])
    
    // Reload the page to reinitialize the database
    window.location.reload()
  }

  const createTestUser = async () => {
    setLoading(true)
    try {
      const testEmail = `test${Date.now()}@example.com`
      const { data, error } = await DatabaseService.createUserWithPassword(
        testEmail,
        'password123',
        'Test User',
        'client'
      )
      
      if (error) {
        console.error('Error creating test user:', error)
        return
      }
      
      console.log('Test user created:', data)
      await loadUsers()
      loadStorageData()
    } catch (error) {
      console.error('Error creating test user:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
    loadStorageData()
  }, [])

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">
            Local Storage Test
          </h1>
          <p className="text-neutral-400">
            Test localStorage persistence for the local database system.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Controls */}
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Database Controls</span>
              </CardTitle>
              <CardDescription className="text-neutral-400">
                Test database operations and storage persistence
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={loadUsers}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>Reload Users</span>
                  </div>
                )}
              </Button>

              <Button
                onClick={createTestUser}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                Create Test User
              </Button>

              <Button
                onClick={loadStorageData}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                Refresh Storage Data
              </Button>

              <Button
                onClick={clearStorage}
                disabled={loading}
                variant="outline"
                className="w-full text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Storage
              </Button>
            </CardContent>
          </Card>

          {/* Users List */}
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Current Users ({users.length})</CardTitle>
              <CardDescription className="text-neutral-400">
                Users currently in the database
              </CardDescription>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <p className="text-neutral-400 text-center py-4">No users found</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {users.map((user, index) => (
                    <div key={user.id || index} className="bg-neutral-800 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">{user.name}</p>
                          <p className="text-neutral-400 text-sm">{user.email}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2 py-1 rounded ${
                            user.role === 'staff' 
                              ? 'bg-blue-500/20 text-blue-400' 
                              : 'bg-green-500/20 text-green-400'
                          }`}>
                            {user.role}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Storage Data */}
          <Card className="bg-neutral-900 border-neutral-800 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-white">localStorage Data</CardTitle>
              <CardDescription className="text-neutral-400">
                Raw data stored in browser localStorage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(storageData).map(([key, value]) => (
                  <div key={key} className="bg-neutral-800 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">{key}</h4>
                    {value ? (
                      <div className="text-xs text-neutral-300 font-mono bg-neutral-900 p-2 rounded max-h-32 overflow-y-auto">
                        {Array.isArray(value) ? (
                          <div>
                            <span className="text-green-400">Array({value.length})</span>
                            {value.length > 0 && (
                              <pre className="mt-1">{JSON.stringify(value[0], null, 2)}</pre>
                            )}
                          </div>
                        ) : (
                          <pre>{JSON.stringify(value, null, 2)}</pre>
                        )}
                      </div>
                    ) : (
                      <p className="text-neutral-500 text-sm">No data</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="bg-neutral-900 border-neutral-800 mt-8">
          <CardHeader>
            <CardTitle className="text-white">Test Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-neutral-300">
              <p>
                <strong>1. Create Test User:</strong> Creates a new user and saves it to localStorage.
                The user should persist even after page refresh.
              </p>
              <p>
                <strong>2. Test Persistence:</strong> Refresh the page and check if the users are still there.
                They should be loaded from localStorage automatically.
              </p>
              <p>
                <strong>3. Test Signup:</strong> Go to the signup page and create a real account.
                Come back here and refresh to see if it was saved.
              </p>
              <p>
                <strong>4. Clear Storage:</strong> Removes all localStorage data and reloads the page
                to start fresh with only the default test users.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
