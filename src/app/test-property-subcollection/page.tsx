'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAuth } from '@/contexts/AuthContext'

export default function TestPropertySubcollectionPage() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testPropertySubcollection = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      console.log('🧪 Testing property subcollection structure...')

      const response = await fetch('/api/test/property-subcollection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id || 'BAVZJE8LpNXuKzYJiGY55ukF8Ew2' // vika's user ID for testing
        })
      })

      const responseData = await response.json()
      
      console.log('📥 Property subcollection test response:', responseData)
      
      setResult({
        status: response.status,
        success: response.ok,
        data: responseData
      })

    } catch (error) {
      console.error('❌ Property subcollection test error:', error)
      setResult({
        status: 'error',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">🧪 Test Property Subcollection Structure</CardTitle>
            <CardDescription className="text-gray-300">
              Test the new /users/{`{userId}`}/properties/{`{propertyId}`} structure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* User Info */}
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Current User</h3>
              <p><strong>ID:</strong> {user?.id || 'Not logged in'}</p>
              <p><strong>Email:</strong> {user?.email || 'Not logged in'}</p>
            </div>

            {/* Test Button */}
            <Button 
              onClick={testPropertySubcollection}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Testing Property Subcollection...' : 'Test Property Subcollection Structure'}
            </Button>

            {/* Results */}
            {result && (
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">
                  {result.success ? '✅ Success' : '❌ Error'}
                </h3>
                <div className="bg-gray-800 p-3 rounded text-sm overflow-auto">
                  <pre>{JSON.stringify(result, null, 2)}</pre>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-900/20 border border-blue-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">🔍 What This Tests</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Creates a test property in /users/{`{userId}`}/properties/{`{propertyId}`}</li>
                <li>Uses slugify(property name + address) for property ID</li>
                <li>Tests the new property subcollection structure</li>
                <li>Verifies property creation and retrieval</li>
                <li>Shows ownership linkage from property → user</li>
              </ul>
            </div>

            {/* Expected Structure */}
            <div className="bg-green-900/20 border border-green-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-green-300">✅ Expected Structure</h3>
              <div className="bg-gray-800 p-3 rounded text-sm font-mono">
                <pre>{`/users/{userId}/properties/{propertyId}
├── id: "villa-sunset-123-main-street-456789"
├── name: "Villa Sunset 123"
├── address: "123 Main Street"
├── bedrooms: 3
├── bathrooms: 2
├── amenities: {...}
├── utilities: {...}
├── ownerUserId: "{userId}"
├── status: "pending_approval"
├── createdAt: Timestamp
└── updatedAt: Timestamp`}</pre>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}
