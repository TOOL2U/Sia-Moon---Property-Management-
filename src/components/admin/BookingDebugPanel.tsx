'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { toast } from 'sonner'

export function BookingDebugPanel() {
  const [bookingId, setBookingId] = useState('')
  const [debugResults, setDebugResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const debugBooking = async () => {
    if (!bookingId.trim()) {
      toast.error('Please enter a booking ID')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/debug/bookings?bookingId=${encodeURIComponent(bookingId)}`)
      const result = await response.json()
      
      setDebugResults(result)
      
      if (result.success) {
        const foundIn = Object.entries(result.collections)
          .filter(([_, data]: [string, any]) => data.exists)
          .map(([collection]) => collection)
        
        if (foundIn.length > 0) {
          toast.success(`Booking found in: ${foundIn.join(', ')}`)
        } else {
          toast.error('Booking not found in any collection')
        }
      } else {
        toast.error('Debug failed')
      }
    } catch (error) {
      console.error('Debug error:', error)
      toast.error('Debug request failed')
    } finally {
      setLoading(false)
    }
  }

  const testRejection = async () => {
    if (!bookingId.trim()) {
      toast.error('Please enter a booking ID')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/bookings/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: bookingId.trim(),
          action: 'reject',
          adminId: 'debug-admin',
          adminName: 'Debug Admin',
          notes: 'Test rejection from debug panel',
          reason: 'Test rejection from debug panel'
        })
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success('Booking rejected successfully!')
        console.log('✅ Rejection successful:', result)
      } else {
        toast.error(`Rejection failed: ${result.error}`)
        console.error('❌ Rejection failed:', result)
      }
    } catch (error) {
      console.error('Rejection error:', error)
      toast.error('Rejection request failed')
    } finally {
      setLoading(false)
    }
  }

  const getAllBookings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/bookings')
      const result = await response.json()
      
      setDebugResults(result)
      
      if (result.success) {
        const totalBookings = Object.values(result.collections)
          .reduce((sum: number, collection: any) => sum + (collection.count || 0), 0)
        
        toast.success(`Found ${totalBookings} total bookings`)
      } else {
        toast.error('Failed to get bookings')
      }
    } catch (error) {
      console.error('Debug error:', error)
      toast.error('Debug request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-gray-900/50 border-gray-700/50">
      <CardHeader>
        <CardTitle className="text-white">Booking Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter booking ID to debug"
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
            className="bg-gray-800 border-gray-600 text-white"
          />
          <Button
            onClick={debugBooking}
            disabled={loading}
            variant="outline"
            className="border-gray-600 text-gray-300"
          >
            Debug
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={testRejection}
            disabled={loading || !bookingId.trim()}
            className="bg-red-600 hover:bg-red-700"
          >
            Test Rejection
          </Button>
          <Button
            onClick={getAllBookings}
            disabled={loading}
            variant="outline"
            className="border-gray-600 text-gray-300"
          >
            Get All Bookings
          </Button>
        </div>

        {debugResults && (
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-white font-medium mb-2">Debug Results:</h3>
            <pre className="text-gray-300 text-xs overflow-auto max-h-96">
              {JSON.stringify(debugResults, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
