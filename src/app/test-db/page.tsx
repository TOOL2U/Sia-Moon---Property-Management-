'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function TestDatabasePage() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const runTests = async () => {
    setLoading(true)
    setResults([])
    const testResults: any[] = []

    try {
      // Test 1: Users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
      
      testResults.push({
        test: 'Users Table',
        success: !usersError,
        data: users,
        error: usersError?.message
      })

      // Test 2: Properties with joins
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select(`
          *,
          users!properties_client_id_fkey(name, email)
        `)
      
      testResults.push({
        test: 'Properties Table (with joins)',
        success: !propertiesError,
        data: properties,
        error: propertiesError?.message
      })

      // Test 3: Bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          properties(name)
        `)
      
      testResults.push({
        test: 'Bookings Table',
        success: !bookingsError,
        data: bookings,
        error: bookingsError?.message
      })

      // Test 4: Tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          properties(name),
          users!tasks_staff_id_fkey(name)
        `)
      
      testResults.push({
        test: 'Tasks Table',
        success: !tasksError,
        data: tasks,
        error: tasksError?.message
      })

      // Test 5: Reports
      const { data: reports, error: reportsError } = await supabase
        .from('reports')
        .select(`
          *,
          properties(name)
        `)
      
      testResults.push({
        test: 'Reports Table',
        success: !reportsError,
        data: reports,
        error: reportsError?.message
      })

      // Test 6: Views
      const { data: propertySummary, error: viewError } = await supabase
        .from('property_summary')
        .select('*')
      
      testResults.push({
        test: 'Property Summary View',
        success: !viewError,
        data: propertySummary,
        error: viewError?.message
      })

      // Test 7: Functions
      const { data: occupancyResult, error: funcError } = await supabase
        .rpc('calculate_occupancy_rate', {
          property_uuid: '550e8400-e29b-41d4-a716-446655440003',
          start_date: '2024-02-01',
          end_date: '2024-02-28'
        })
      
      testResults.push({
        test: 'Occupancy Rate Function',
        success: !funcError,
        data: occupancyResult,
        error: funcError?.message
      })

    } catch (error) {
      testResults.push({
        test: 'General Error',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    setResults(testResults)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Database Schema Test
          </h1>
          <p className="text-gray-600 mb-6">
            Test the villa management database schema and verify all tables, views, and functions are working correctly.
          </p>
          
          <Button onClick={runTests} disabled={loading}>
            {loading ? 'Running Tests...' : 'Run Database Tests'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {results.map((result, index) => (
            <Card key={index} className={result.success ? 'border-green-200' : 'border-red-200'}>
              <CardHeader>
                <CardTitle className={`flex items-center ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  <span className="mr-2">
                    {result.success ? '✅' : '❌'}
                  </span>
                  {result.test}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.success ? (
                  <div>
                    <p className="text-green-700 mb-2">
                      ✓ Test passed successfully
                    </p>
                    {result.data && (
                      <div className="bg-green-50 p-3 rounded text-sm">
                        <strong>Records found:</strong> {Array.isArray(result.data) ? result.data.length : 1}
                        {Array.isArray(result.data) && result.data.length > 0 && (
                          <pre className="mt-2 text-xs overflow-x-auto">
                            {JSON.stringify(result.data[0], null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-red-700 mb-2">
                      ✗ Test failed
                    </p>
                    <div className="bg-red-50 p-3 rounded text-sm">
                      <strong>Error:</strong> {result.error}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {results.length > 0 && (
          <div className="mt-8 p-6 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Test Summary</h3>
            <div className="flex items-center space-x-6">
              <div className="text-green-600">
                ✅ Passed: {results.filter(r => r.success).length}
              </div>
              <div className="text-red-600">
                ❌ Failed: {results.filter(r => !r.success).length}
              </div>
              <div className="text-gray-600">
                Total: {results.length}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
