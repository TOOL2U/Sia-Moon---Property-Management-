'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EndToEndBookingAutomation } from '@/lib/services/endToEndBookingAutomation'
import { ProfileService } from '@/lib/services/profileService'
import { toast } from 'react-hot-toast'

interface Profile {
  id: string;
  email: string;
  fullName?: string;
  properties?: Property[];
}

interface Property {
  id: string;
  name: string;
}

interface MatchResult {
  clientId: string;
  propertyId: string;
  propertyName: string;
  confidence: number;
  matchMethod: string;
  profile: Profile;
  property: Property;
}

interface TestResult {
  matchResult: MatchResult | null;
}

interface Results {
  searchTerm: string;
  totalProperties: number;
  allProperties: Profile[];
  matchResult: MatchResult | null;
  testResult: TestResult;
  error?: string;
}

export default function ClientSyncTestPage() {
  const [propertyName, setPropertyName] = useState('Donkey House')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<Results | null>(null)

  const testClientMatching = async () => {
    setIsLoading(true)
    try {
      console.log('🔍 Testing client matching for:', propertyName)
      
      // Test the complete end-to-end automation
      const testResult = await EndToEndBookingAutomation.testAutomation(propertyName)

      // Get all profiles for display
      const profiles = await ProfileService.getAllProfiles()
      console.log('📋 Found profiles:', profiles)
      console.log('🧪 Test result:', testResult)
      console.log('🎯 Match result:', testResult.matchResult)
      
      setResults({
        searchTerm: propertyName,
        totalProperties: profiles.length,
        allProperties: profiles,
        matchResult: testResult.matchResult,
        testResult
      })
      
      if (testResult.matchResult) {
        toast.success(`✅ Match found! Client: ${testResult.matchResult.profile.email}`)
      } else {
        toast.error('❌ No client match found')
      }
      
    } catch (error) {
      console.error('❌ Error testing client matching:', error)
      toast.error('Error testing client matching')
      setResults({ 
        searchTerm: propertyName,
        totalProperties: 0,
        allProperties: [],
        matchResult: null,
        testResult: { matchResult: null },
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testBookingSync = async () => {
    if (!results?.matchResult) {
      toast.error('No client match found - run client matching test first')
      return
    }

    setIsLoading(true)
    try {
      console.log('🚀 Testing booking sync...')
      
      // Create a mock booking for testing
      const mockBooking = {
        id: 'test-booking-' + Date.now(),
        villaName: propertyName,
        guestName: 'Test Guest',
        guestEmail: 'test@example.com',
        checkInDate: '2025-08-01',
        checkOutDate: '2025-08-03',
        price: 1200,
        revenue: 1200,
        guests: 2,
        bookingSource: 'test',
        status: 'approved' as const,
        matchConfidence: 0.95,
        receivedAt: new Date(),
        processedAt: new Date()
      }

      const clientBookingId = await ProfileService.createClientBooking(
        results.matchResult.profile.id,
        {
          propertyName: mockBooking.villaName,
          propertyId: results.matchResult.property.id,
          guestName: mockBooking.guestName,
          guestEmail: mockBooking.guestEmail || '',
          checkInDate: mockBooking.checkInDate,
          checkOutDate: mockBooking.checkOutDate,
          nights: 2,
          guests: mockBooking.guests || 2,
          price: mockBooking.price || 0,
          status: 'confirmed',
          bookingSource: 'test',
          adminBookingId: mockBooking.id,
          syncedAt: new Date()
        }
      )

      if (clientBookingId) {
        toast.success(`✅ Test booking created! ID: ${clientBookingId}`)
        console.log('✅ Test booking created:', clientBookingId)
      } else {
        toast.error('❌ Failed to create test booking')
      }

    } catch (error) {
      console.error('❌ Error testing booking sync:', error)
      toast.error('Error testing booking sync')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Client Sync Debug</h1>
          <p className="text-neutral-400">Test client matching and booking synchronization</p>
        </div>

        {/* Test Controls */}
        <Card className="bg-neutral-900 border-neutral-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Test Client Matching</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Property Name
                </label>
                <Input
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  placeholder="Enter property name to test"
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
              
              <div className="flex gap-4">
                <Button
                  onClick={testClientMatching}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? 'Testing...' : 'Test Client Matching'}
                </Button>
                
                {results?.matchResult && (
                  <Button
                    onClick={testBookingSync}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? 'Testing...' : 'Test Booking Sync'}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {results && (
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Search Term</h3>
                  <p className="text-neutral-300">&quot;{results.searchTerm}&quot;</p>
                </div>

                {results.totalProperties !== undefined && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      User Profiles Found ({results.totalProperties})
                    </h3>
                    <div className="space-y-2">
                      {results.allProperties?.map((profile: Profile, index: number) => (
                        <div key={index} className="bg-neutral-800 p-3 rounded">
                          <p className="text-white font-medium">{profile.email}</p>
                          <p className="text-neutral-400 text-sm">
                            ID: {profile.id} | Name: {profile.fullName || 'N/A'}
                          </p>
                          {profile.properties && Array.isArray(profile.properties) && (
                            <div className="mt-2">
                              <p className="text-neutral-300 text-sm font-medium">
                                Properties ({profile.properties.length}):
                              </p>
                              {profile.properties.map((prop: Property, propIndex: number) => (
                                <p key={propIndex} className="text-neutral-400 text-xs ml-2">
                                  • &quot;{prop.name}&quot;
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {results.matchResult && (
                  <div>
                    <h3 className="text-lg font-semibold text-green-400 mb-2">✅ Match Found</h3>
                    <div className="bg-green-900/20 border border-green-800 p-4 rounded">
                      <p><strong>Client ID:</strong> {results.matchResult.clientId}</p>
                      <p><strong>Property ID:</strong> {results.matchResult.propertyId}</p>
                      <p><strong>Property Name:</strong> {results.matchResult.propertyName}</p>
                      <p><strong>Confidence:</strong> {(results.matchResult.confidence * 100).toFixed(1)}%</p>
                      <p><strong>Method:</strong> {results.matchResult.matchMethod}</p>
                    </div>
                  </div>
                )}

                {results.matchResult === null && !results.error && (
                  <div>
                    <h3 className="text-lg font-semibold text-red-400 mb-2">❌ No Match Found</h3>
                    <p className="text-neutral-300">
                      No client profile found with a property matching &quot;{results.searchTerm}&quot;
                    </p>
                  </div>
                )}

                {results.error && (
                  <div>
                    <h3 className="text-lg font-semibold text-red-400 mb-2">❌ Error</h3>
                    <p className="text-red-300">{results.error}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
