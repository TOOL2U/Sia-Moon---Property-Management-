'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/RealAuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function DebugUserPage() {
  const [dbUsers, setDbUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setDbUsers(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createTestUser = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            name: 'Development User',
            email: 'dev@siamoon.com',
            role: 'client'
          }
        ])
        .select()

      if (error) throw error
      
      await fetchUsers()
      setError('')
    } catch (err: any) {
      setError(err.message)
    }
  }

  const testPropertyInsert = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .insert([
          {
            name: 'Test Villa',
            address: 'Test Address, Phuket',
            client_id: user?.id || '550e8400-e29b-41d4-a716-446655440001'
          }
        ])
        .select()

      if (error) throw error
      
      setError(`Success! Property created: ${JSON.stringify(data)}`)
    } catch (err: any) {
      setError(`Property insert failed: ${err.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Debug User & Database</h1>
        
        {/* Auth Context User */}
        <Card>
          <CardHeader>
            <CardTitle>Auth Context User</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </CardContent>
        </Card>

        {/* Database Users */}
        <Card>
          <CardHeader>
            <CardTitle>Database Users</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <div>
                <p className="mb-4">Found {dbUsers.length} users in database:</p>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                  {JSON.stringify(dbUsers, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Test Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={createTestUser}>
              Create Test User (550e8400...)
            </Button>
            
            <Button onClick={testPropertyInsert} variant="outline">
              Test Property Insert
            </Button>
            
            <Button onClick={fetchUsers} variant="outline">
              Refresh Users
            </Button>
            
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-red-700">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Database Connection Test */}
        <Card>
          <CardHeader>
            <CardTitle>Database Connection</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
            <p>Auth Bypass: {process.env.NEXT_PUBLIC_BYPASS_AUTH}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
