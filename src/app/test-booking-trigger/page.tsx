'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Calendar,
  Home,
  DollarSign,
  Mail,
  Loader2
} from 'lucide-react'

interface TestBooking {
  name: string
  description: string
  payload: any
}

const testBookings: TestBooking[] = [
  {
    name: 'Standard Booking',
    description: 'Complete booking with all fields',
    payload: {
      guestName: 'John Smith',
      guestEmail: 'john.smith@gmail.com',
      checkIn: '2025-08-15',
      checkOut: '2025-08-22',
      property: 'Villa Sunset Paradise',
      propertyId: 'villa-sunset-001',
      bookingReference: 'BDC-789456123',
      totalAmount: 2800,
      currency: 'USD',
      guests: 4,
      specialRequests: 'Late check-in around 8 PM, ground floor preferred',
      bookingSource: 'booking.com',
      rawEmailData: {
        subject: 'New booking confirmation - Villa Sunset Paradise',
        from: 'noreply@booking.com',
        receivedAt: new Date().toISOString(),
        messageId: 'msg-12345-booking-com'
      },
      parsedAt: new Date().toISOString()
    }
  },
  {
    name: 'Weekend Getaway',
    description: 'Short stay with special requests',
    payload: {
      guestName: 'Sarah Johnson',
      guestEmail: 'sarah.j.travels@yahoo.com',
      checkIn: '2025-09-06',
      checkOut: '2025-09-08',
      property: 'Ocean View Villa',
      propertyId: 'villa-ocean-002',
      bookingReference: 'BDC-456789012',
      totalAmount: 950,
      currency: 'USD',
      guests: 2,
      specialRequests: 'Honeymoon trip, champagne welcome would be appreciated',
      bookingSource: 'booking.com',
      rawEmailData: {
        subject: 'Booking confirmation - Ocean View Villa',
        from: 'reservations@booking.com',
        receivedAt: new Date().toISOString(),
        messageId: 'msg-67890-booking-com'
      },
      parsedAt: new Date().toISOString()
    }
  },
  {
    name: 'Family Vacation',
    description: 'Large group with children',
    payload: {
      guestName: 'Michael Rodriguez',
      guestEmail: 'mike.rodriguez.family@hotmail.com',
      checkIn: '2025-07-20',
      checkOut: '2025-07-27',
      property: 'Mountain Retreat Villa',
      propertyId: 'villa-mountain-003',
      bookingReference: 'BDC-123456789',
      totalAmount: 4200,
      currency: 'USD',
      guests: 6,
      specialRequests: 'Traveling with children ages 5, 8, and 12. Need high chair and extra towels',
      bookingSource: 'booking.com',
      rawEmailData: {
        subject: 'Your booking is confirmed - Mountain Retreat Villa',
        from: 'confirmations@booking.com',
        receivedAt: new Date().toISOString(),
        messageId: 'msg-11111-booking-com'
      },
      parsedAt: new Date().toISOString()
    }
  },
  {
    name: 'Business Trip',
    description: 'Single guest, business requirements',
    payload: {
      guestName: 'Emma Chen',
      guestEmail: 'e.chen@techcorp.com',
      checkIn: '2025-08-03',
      checkOut: '2025-08-05',
      property: 'Executive Villa Downtown',
      propertyId: 'villa-executive-004',
      bookingReference: 'BDC-987654321',
      totalAmount: 1600,
      currency: 'USD',
      guests: 1,
      specialRequests: 'Business traveler, need reliable WiFi and quiet workspace',
      bookingSource: 'booking.com',
      rawEmailData: {
        subject: 'Booking confirmed - Executive Villa Downtown',
        from: 'business@booking.com',
        receivedAt: new Date().toISOString(),
        messageId: 'msg-22222-booking-com'
      },
      parsedAt: new Date().toISOString()
    }
  },
  {
    name: 'Minimal Data',
    description: 'Missing optional fields (tests validation)',
    payload: {
      guestName: 'Alex Thompson',
      checkIn: '2025-09-15',
      checkOut: '2025-09-18',
      property: 'Beachfront Villa',
      bookingSource: 'booking.com',
      rawEmailData: {
        subject: 'Booking notification',
        from: 'auto@booking.com',
        receivedAt: new Date().toISOString()
      },
      parsedAt: new Date().toISOString()
    }
  }
]

interface TestResult {
  success: boolean
  data?: any
  error?: string
  processingTime?: number
}

export default function TestBookingTrigger() {
  const [results, setResults] = useState<{ [key: string]: TestResult }>({})
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({})
  const [allLoading, setAllLoading] = useState(false)

  const sendTestBooking = async (booking: TestBooking, index: number) => {
    const key = `${index}-${booking.name}`
    setLoading(prev => ({ ...prev, [key]: true }))

    try {
      const response = await fetch('/api/booking-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Test-Trigger-Web',
          'X-Test-Source': 'web-interface'
        },
        body: JSON.stringify(booking.payload)
      })

      const data = await response.json()

      if (response.ok) {
        setResults(prev => ({
          ...prev,
          [key]: {
            success: true,
            data,
            processingTime: data.metadata?.processingTimeMs
          }
        }))
      } else {
        setResults(prev => ({
          ...prev,
          [key]: {
            success: false,
            error: data.error || 'Unknown error'
          }
        }))
      }
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [key]: {
          success: false,
          error: error instanceof Error ? error.message : 'Network error'
        }
      }))
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }))
    }
  }

  const sendAllBookings = async () => {
    setAllLoading(true)
    setResults({})

    for (let i = 0; i < testBookings.length; i++) {
      await sendTestBooking(testBookings[i], i)
      if (i < testBookings.length - 1) {
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    setAllLoading(false)
  }

  const getResultIcon = (key: string) => {
    if (loading[key]) return <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
    if (!results[key]) return <Clock className="w-4 h-4 text-neutral-400" />
    if (results[key].success) return <CheckCircle className="w-4 h-4 text-green-400" />
    return <XCircle className="w-4 h-4 text-red-400" />
  }

  const getResultBadge = (key: string) => {
    if (loading[key]) return <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">Sending...</Badge>
    if (!results[key]) return <Badge variant="secondary" className="bg-neutral-500/20 text-neutral-400">Ready</Badge>
    if (results[key].success) return <Badge variant="secondary" className="bg-green-500/20 text-green-400">Success</Badge>
    return <Badge variant="secondary" className="bg-red-500/20 text-red-400">Failed</Badge>
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🧪 Booking Test Trigger</h1>
          <p className="text-neutral-400">
            Send test booking data to your webhook endpoint to simulate Make.com integration
          </p>
          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-blue-400 text-sm">
              <strong>Endpoint:</strong> /api/booking-test | 
              <strong> Purpose:</strong> Test parsed booking.com email data pipeline
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-8">
          <Card className="bg-neutral-950 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Send className="w-5 h-5" />
                Test Controls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button
                  onClick={sendAllBookings}
                  disabled={allLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {allLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending All...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send All Tests
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setResults({})
                    setLoading({})
                  }}
                  disabled={allLoading}
                >
                  Clear Results
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Bookings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {testBookings.map((booking, index) => {
            const key = `${index}-${booking.name}`
            const result = results[key]
            
            return (
              <Card key={index} className="bg-neutral-950 border-neutral-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      {getResultIcon(key)}
                      {booking.name}
                    </CardTitle>
                    {getResultBadge(key)}
                  </div>
                  <p className="text-neutral-400 text-sm">{booking.description}</p>
                </CardHeader>
                <CardContent>
                  {/* Booking Details */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-neutral-500" />
                      <span className="text-neutral-300">{booking.payload.guestName}</span>
                      {booking.payload.guestEmail && (
                        <>
                          <Mail className="w-4 h-4 text-neutral-500 ml-2" />
                          <span className="text-neutral-400">{booking.payload.guestEmail}</span>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-neutral-500" />
                      <span className="text-neutral-300">
                        {booking.payload.checkIn} → {booking.payload.checkOut}
                      </span>
                      <span className="text-neutral-400">
                        ({booking.payload.guests || 'N/A'} guests)
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Home className="w-4 h-4 text-neutral-500" />
                      <span className="text-neutral-300">{booking.payload.property}</span>
                    </div>
                    
                    {booking.payload.totalAmount && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-neutral-500" />
                        <span className="text-green-400 font-medium">
                          ${booking.payload.totalAmount.toLocaleString()} {booking.payload.currency}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Result */}
                  {result && (
                    <div className="mb-4 p-3 rounded-lg border border-neutral-700 bg-neutral-900/50">
                      {result.success ? (
                        <div className="text-green-400 text-sm">
                          <p className="font-medium">✅ Success</p>
                          <p>Processing time: {result.processingTime}ms</p>
                          <p>Stored in Firebase: {result.data?.metadata?.storedInFirebase ? 'Yes' : 'No'}</p>
                          {result.data?.metadata?.missingFields && (
                            <p className="text-yellow-400">
                              Missing fields: {result.data.metadata.missingFields.join(', ')}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="text-red-400 text-sm">
                          <p className="font-medium">❌ Failed</p>
                          <p>{result.error}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Send Button */}
                  <Button
                    onClick={() => sendTestBooking(booking, index)}
                    disabled={loading[key] || allLoading}
                    variant="outline"
                    className="w-full"
                  >
                    {loading[key] ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Test
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Instructions */}
        <div className="mt-8">
          <Card className="bg-neutral-950 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">📖 How to Use</CardTitle>
            </CardHeader>
            <CardContent className="text-neutral-300 space-y-2">
              <p>1. <strong>Individual Tests:</strong> Click "Send Test" on any booking to test specific scenarios</p>
              <p>2. <strong>Batch Testing:</strong> Click "Send All Tests" to test all scenarios at once</p>
              <p>3. <strong>Monitor Results:</strong> Check the success/failure status and processing times</p>
              <p>4. <strong>Server Logs:</strong> Check your server console for detailed logging information</p>
              <p>5. <strong>Firebase Data:</strong> Test payloads are stored in the booking_test_logs collection</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
