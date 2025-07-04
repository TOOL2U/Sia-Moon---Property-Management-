'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function TestPropertyPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [propertyName, setPropertyName] = useState('Test Villa')
  const [propertyAddress, setPropertyAddress] = useState('123 Test Street, Phuket')
  const supabase = createClient()

  const testDirectInsert = async () => {
    setLoading(true)
    setResult(null)

    try {
      console.log('Testing direct property insert...')
      
      const { data, error } = await supabase
        .from('properties')
        .insert([
          {
            name: propertyName,
            address: propertyAddress,
            client_id: '550e8400-e29b-41d4-a716-446655440001' // Use the seed user ID directly
          }
        ])
        .select()

      console.log('Insert result:', { data, error })

      if (error) {
        setResult({
          success: false,
          error: error,
          message: `Error: ${error.message}`,
          details: JSON.stringify(error, null, 2)
        })
      } else {
        setResult({
          success: true,
          data: data,
          message: 'Property created successfully!',
          details: JSON.stringify(data, null, 2)
        })
      }
    } catch (err) {
      console.error('Caught error:', err)
      setResult({
        success: false,
        error: err,
        message: `Caught error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        details: JSON.stringify(err, null, 2)
      })
    } finally {
      setLoading(false)
    }
  }

  const testUserExists = async () => {
    setLoading(true)
    setResult(null)

    try {
      console.log('Testing if user exists...')
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', '550e8400-e29b-41d4-a716-446655440001')
        .single()

      console.log('User check result:', { data, error })

      if (error) {
        setResult({
          success: false,
          error: error,
          message: `User check error: ${error.message}`,
          details: JSON.stringify(error, null, 2)
        })
      } else {
        setResult({
          success: true,
          data: data,
          message: 'User exists!',
          details: JSON.stringify(data, null, 2)
        })
      }
    } catch (err) {
      console.error('Caught error:', err)
      setResult({
        success: false,
        error: err,
        message: `Caught error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        details: JSON.stringify(err, null, 2)
      })
    } finally {
      setLoading(false)
    }
  }

  const testAllUsers = async () => {
    setLoading(true)
    setResult(null)

    try {
      console.log('Getting all users...')
      
      const { data, error } = await supabase
        .from('users')
        .select('*')

      console.log('All users result:', { data, error })

      if (error) {
        setResult({
          success: false,
          error: error,
          message: `Error getting users: ${error.message}`,
          details: JSON.stringify(error, null, 2)
        })
      } else {
        setResult({
          success: true,
          data: data,
          message: `Found ${data?.length || 0} users`,
          details: JSON.stringify(data, null, 2)
        })
      }
    } catch (err) {
      console.error('Caught error:', err)
      setResult({
        success: false,
        error: err,
        message: `Caught error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        details: JSON.stringify(err, null, 2)
      })
    } finally {
      setLoading(false)
    }
  }

  const createTestUser = async () => {
    setLoading(true)
    setResult(null)

    try {
      console.log('Creating test user...')
      
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            name: 'John Smith',
            email: 'john.smith@example.com',
            role: 'client'
          }
        ])
        .select()

      console.log('Create user result:', { data, error })

      if (error) {
        setResult({
          success: false,
          error: error,
          message: `Error creating user: ${error.message}`,
          details: JSON.stringify(error, null, 2)
        })
      } else {
        setResult({
          success: true,
          data: data,
          message: 'User created successfully!',
          details: JSON.stringify(data, null, 2)
        })
      }
    } catch (err) {
      console.error('Caught error:', err)
      setResult({
        success: false,
        error: err,
        message: `Caught error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        details: JSON.stringify(err, null, 2)
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Test Property Creation</h1>
        
        {/* Form Inputs */}
        <Card>
          <CardHeader>
            <CardTitle>Property Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Property Name"
              value={propertyName}
              onChange={(e) => setPropertyName(e.target.value)}
            />
            <Input
              label="Property Address"
              value={propertyAddress}
              onChange={(e) => setPropertyAddress(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Test Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Database Tests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button onClick={testAllUsers} disabled={loading}>
                1. Check All Users
              </Button>
              <Button onClick={testUserExists} disabled={loading}>
                2. Check Test User Exists
              </Button>
              <Button onClick={createTestUser} disabled={loading}>
                3. Create Test User
              </Button>
              <Button onClick={testDirectInsert} disabled={loading}>
                4. Insert Property
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className={result.success ? 'text-green-800' : 'text-red-800'}>
                {result.success ? '✅ Success' : '❌ Error'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 font-medium">{result.message}</p>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                {result.details}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
