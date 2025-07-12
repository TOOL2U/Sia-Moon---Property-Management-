'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'

export default function ForcePropertyCreationPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const forceCreateProperty = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      console.log('🔧 FORCING property creation...')

      const response = await fetch('/api/debug/create-property-from-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const responseData = await response.json()
      
      console.log('📥 Force creation response:', responseData)
      
      setResult({
        status: response.status,
        success: response.ok,
        data: responseData
      })

    } catch (error) {
      console.error('❌ Force creation error:', error)
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
            <CardTitle className="text-white">🔧 FORCE Property Creation</CardTitle>
            <CardDescription className="text-gray-300">
              Force create property from vika's onboarding data to debug the issue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Problem Description */}
            <div className="bg-red-900/20 border border-red-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-red-300">🚨 PROBLEM</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>vika has 4 onboarding submissions for "Parents House"</li>
                <li>vika's profile shows properties: [] (EMPTY)</li>
                <li>Onboarding webhook is NOT creating properties</li>
                <li>Need to force property creation to test the system</li>
              </ul>
            </div>

            {/* Force Creation Button */}
            <Button 
              onClick={forceCreateProperty}
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {isLoading ? 'FORCING Property Creation...' : 'FORCE CREATE PROPERTY NOW'}
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

            {/* Expected Result */}
            <div className="bg-green-900/20 border border-green-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-green-300">✅ EXPECTED RESULT</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Property "Parents House - FORCED CREATION" should be created</li>
                <li>Property should appear in vika's profile</li>
                <li>Property ID should be returned</li>
                <li>Then we can fix the onboarding webhook</li>
              </ul>
            </div>

            {/* Next Steps */}
            <div className="bg-blue-900/20 border border-blue-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-blue-300">🎯 NEXT STEPS</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Force create property to test ProfileService</li>
                <li>Check if property appears in vika's profile</li>
                <li>If successful, fix onboarding webhook</li>
                <li>If failed, fix ProfileService.addPropertyToProfile</li>
              </ol>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}
