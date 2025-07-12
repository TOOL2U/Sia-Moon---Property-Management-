'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

export default function TestAIPropertyMatchingPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [propertyName, setPropertyName] = useState('Villa Mango Beach')
  const [bookingId, setBookingId] = useState('')

  const testAction = async (action: string, data?: any) => {
    setIsLoading(true)
    setResult(null)

    try {
      console.log(`🧪 Testing AI property matching action: ${action}`)

      const response = await fetch('/api/test/ai-property-matching', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          bookingId: bookingId || undefined,
          testData: data
        })
      })

      const responseData = await response.json()
      
      console.log('📥 AI property matching test response:', responseData)
      
      setResult({
        status: response.status,
        success: response.ok,
        data: responseData
      })

    } catch (error) {
      console.error('❌ AI property matching test error:', error)
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
      <div className="max-w-6xl mx-auto">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">🤖 Test AI Property Matching</CardTitle>
            <CardDescription className="text-gray-300">
              Test the AI-powered property matching system for booking assignment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Input Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Property Name for Search</label>
                <Input
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  placeholder="Villa Mango Beach"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Booking ID (for existing booking test)</label>
                <Input
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                  placeholder="Enter booking ID"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>

            {/* Test Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                onClick={() => testAction('create_test_booking')}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? 'Testing...' : 'Create Test Booking'}
              </Button>
              
              <Button 
                onClick={() => testAction('test_property_search', { propertyName })}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? 'Searching...' : 'Test Property Search'}
              </Button>
              
              <Button 
                onClick={() => testAction('match_existing')}
                disabled={isLoading || !bookingId}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isLoading ? 'Matching...' : 'Match Existing Booking'}
              </Button>
              
              <Button 
                onClick={() => testAction('list_recent_bookings')}
                disabled={isLoading}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isLoading ? 'Loading...' : 'List Recent Bookings'}
              </Button>
            </div>

            {/* Custom Test Booking */}
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Create Custom Test Booking</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                <Button 
                  onClick={() => testAction('create_test_booking', {
                    property: 'Villa Sunset Paradise',
                    address: '123 Beach Road, Koh Samui',
                    guestName: 'Custom Test User',
                    guestEmail: 'custom@test.com',
                    checkInDate: '2025-09-01',
                    checkOutDate: '2025-09-05',
                    nights: 4,
                    guests: 2,
                    price: 28000
                  })}
                  disabled={isLoading}
                  className="bg-teal-600 hover:bg-teal-700 text-sm"
                >
                  Villa Sunset Paradise
                </Button>
                
                <Button 
                  onClick={() => testAction('create_test_booking', {
                    property: 'Donkey House',
                    address: '789 Jungle Road, Koh Phangan',
                    guestName: 'Donkey Test User',
                    guestEmail: 'donkey@test.com',
                    checkInDate: '2025-09-10',
                    checkOutDate: '2025-09-15',
                    nights: 5,
                    guests: 4,
                    price: 35000
                  })}
                  disabled={isLoading}
                  className="bg-yellow-600 hover:bg-yellow-700 text-sm"
                >
                  Donkey House
                </Button>
                
                <Button 
                  onClick={() => testAction('create_test_booking', {
                    property: 'Unknown Villa XYZ',
                    address: '999 Unknown Street',
                    guestName: 'No Match User',
                    guestEmail: 'nomatch@test.com',
                    checkInDate: '2025-09-20',
                    checkOutDate: '2025-09-25',
                    nights: 5,
                    guests: 2,
                    price: 20000
                  })}
                  disabled={isLoading}
                  className="bg-red-600 hover:bg-red-700 text-sm"
                >
                  Unknown Villa (No Match)
                </Button>
                
                <Button 
                  onClick={() => testAction('create_test_booking', {
                    property: 'Mango Beach Villa',
                    address: '55/45 Moo 8 Koh Phangan',
                    guestName: 'Fuzzy Match User',
                    guestEmail: 'fuzzy@test.com',
                    checkInDate: '2025-10-01',
                    checkOutDate: '2025-10-06',
                    nights: 5,
                    guests: 3,
                    price: 32000
                  })}
                  disabled={isLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-sm"
                >
                  Mango Beach Villa (Fuzzy)
                </Button>
              </div>
            </div>

            {/* Results */}
            {result && (
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">
                  {result.success ? '✅ Test Results' : '❌ Test Failed'}
                </h3>
                <div className="bg-gray-800 p-3 rounded text-sm overflow-auto max-h-96">
                  <pre>{JSON.stringify(result, null, 2)}</pre>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-900/20 border border-blue-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">🔍 AI Property Matching Features</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Exact Match:</strong> Perfect property name match (confidence: 100%)</li>
                <li><strong>Fuzzy Match:</strong> Partial name match using token similarity (confidence: 60-90%)</li>
                <li><strong>AI Similarity:</strong> Advanced token-based similarity analysis (confidence: 60-90%)</li>
                <li><strong>Auto Assignment:</strong> Successful matches automatically assign bookings to user profiles</li>
                <li><strong>Dual Storage:</strong> Assigned bookings saved to user subcollection and confirmed_bookings</li>
                <li><strong>Admin Alerts:</strong> Unmatched bookings flagged for admin attention</li>
              </ul>
            </div>

            {/* Expected Flow */}
            <div className="bg-green-900/20 border border-green-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-green-300">✅ Expected Matching Flow</h3>
              <div className="bg-gray-800 p-3 rounded text-sm font-mono">
                <pre>{`1. Booking approved in pending_bookings
2. AI matching triggered automatically
3. Search all /users/{userId}/properties for matches
4. If match found:
   - Assign to /users/{userId}/bookings/{bookingId}
   - Copy to /confirmed_bookings/{bookingId}
   - Update status to "assigned"
5. If no match:
   - Mark status as "unassigned"
   - Flag for admin attention`}</pre>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}
