'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { getDb } from '@/lib/firebase'

export default function TestBookingsAPIPage() {
  const [pendingBookings, setPendingBookings] = useState<any[]>([])
  const [liveBookings, setLiveBookings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)

  const fetchBookings = async () => {
    setIsLoading(true)
    try {
      const db = getDb()
      
      // Fetch pending bookings
      const pendingQuery = query(
        collection(db, 'pending_bookings'),
        orderBy('createdAt', 'desc'),
        limit(5)
      )
      const pendingSnapshot = await getDocs(pendingQuery)
      const pendingData = pendingSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      // Fetch live bookings
      const liveQuery = query(
        collection(db, 'live_bookings'),
        orderBy('createdAt', 'desc'),
        limit(5)
      )
      const liveSnapshot = await getDocs(liveQuery)
      const liveData = liveSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      setPendingBookings(pendingData)
      setLiveBookings(liveData)
      
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const testBookingAPI = async () => {
    setIsLoading(true)
    setTestResult(null)

    try {
      const testBooking = {
        property: "Test Villa API",
        address: "999 Test Street, Test Island",
        guestName: "API Test User",
        guestEmail: "test@api.com",
        checkInDate: "2025-09-01",
        checkOutDate: "2025-09-05",
        nights: "4",
        guests: "2",
        price: "20000",
        subject: "API Test Booking",
        date: new Date().toISOString()
      }

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testBooking)
      })

      const result = await response.json()
      setTestResult({
        status: response.status,
        success: response.ok,
        data: result
      })

      // Refresh bookings after test
      if (response.ok) {
        setTimeout(fetchBookings, 1000)
      }

    } catch (error) {
      console.error('Error testing booking API:', error)
      setTestResult({
        status: 'error',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <Card className="bg-gray-800 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white">🧪 Test Bookings API</CardTitle>
            <CardDescription className="text-gray-300">
              Test the upgraded /api/bookings endpoint and view saved data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Test Buttons */}
            <div className="flex gap-4">
              <Button 
                onClick={testBookingAPI}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? 'Testing...' : 'Test Booking API'}
              </Button>
              
              <Button 
                onClick={fetchBookings}
                disabled={isLoading}
                variant="outline"
              >
                {isLoading ? 'Loading...' : 'Refresh Data'}
              </Button>
            </div>

            {/* Test Results */}
            {testResult && (
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">
                  {testResult.success ? '✅ API Test Success' : '❌ API Test Failed'}
                </h3>
                <div className="bg-gray-800 p-3 rounded text-sm overflow-auto">
                  <pre>{JSON.stringify(testResult, null, 2)}</pre>
                </div>
              </div>
            )}

            {/* Pending Bookings */}
            <div className="bg-green-900/20 border border-green-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-green-300">
                📋 Pending Bookings Collection ({pendingBookings.length})
              </h3>
              {pendingBookings.length > 0 ? (
                <div className="space-y-2">
                  {pendingBookings.map((booking, index) => (
                    <div key={booking.id} className="bg-gray-800 p-3 rounded text-sm">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div><strong>Property:</strong> {booking.property}</div>
                        <div><strong>Guest:</strong> {booking.guestName}</div>
                        <div><strong>Check-in:</strong> {booking.checkInDate}</div>
                        <div><strong>Price:</strong> {booking.price} THB</div>
                      </div>
                      <div className="mt-2 text-xs text-gray-400">
                        ID: {booking.id} | Status: {booking.status}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No pending bookings found</p>
              )}
            </div>

            {/* Live Bookings */}
            <div className="bg-blue-900/20 border border-blue-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-blue-300">
                🔴 Live Bookings Collection ({liveBookings.length})
              </h3>
              {liveBookings.length > 0 ? (
                <div className="space-y-2">
                  {liveBookings.map((booking, index) => (
                    <div key={booking.id} className="bg-gray-800 p-3 rounded text-sm">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div><strong>Property:</strong> {booking.property}</div>
                        <div><strong>Guest:</strong> {booking.guestName}</div>
                        <div><strong>Check-in:</strong> {booking.checkInDate}</div>
                        <div><strong>Price:</strong> {booking.price} THB</div>
                      </div>
                      <div className="mt-2 text-xs text-gray-400">
                        ID: {booking.id} | Status: {booking.status}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No live bookings found</p>
              )}
            </div>

            {/* API Documentation */}
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">📖 API Features</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>✅ Accepts Make.com JSON format</li>
                <li>✅ Validates and sanitizes input data</li>
                <li>✅ Saves to both pending_bookings and live_bookings collections</li>
                <li>✅ Sets status: "pending_approval" and serverTimestamp()</li>
                <li>✅ Prevents duplicate bookings</li>
                <li>✅ Maintains compatibility with existing admin dashboards</li>
                <li>✅ Authentication for production (API key or development mode)</li>
              </ul>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}
