'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
    AlertCircle,
    CheckCircle,
    Copy,
    DollarSign,
    Download,
    Play,
    RotateCcw,
    TestTube,
    User
} from 'lucide-react'
import { useState } from 'react'

interface TestResponse {
  success: boolean
  simulated?: boolean
  note?: string
  decision?: string
  confidence?: number
  summary?: string
  escalate?: boolean
  [key: string]: any
}

interface TestScenario {
  name: string
  description: string
  endpoint: string
  payload: any
  expectedOutcome: string
}

export default function SimulationTester() {
  const [response, setResponse] = useState<TestResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customPayload, setCustomPayload] = useState('')
  const [selectedScenario, setSelectedScenario] = useState<TestScenario | null>(null)

  // Predefined test scenarios
  const testScenarios: TestScenario[] = [
    {
      name: "Standard Cleaning Booking",
      description: "Test a typical villa cleaning booking",
      endpoint: "/api/ai-coo",
      payload: {
        jobType: "Deep Cleaning",
        address: "123 Villa Road, Ko Phangan",
        value: 3200,
        customerType: "regular",
        urgency: "normal"
      },
      expectedOutcome: "Should approve and assign available staff"
    },
    {
      name: "High-Value Booking",
      description: "Test escalation for expensive bookings",
      endpoint: "/api/ai-coo",
      payload: {
        jobType: "Full Property Management",
        address: "456 Luxury Villa, Samui",
        value: 12000,
        customerType: "vip",
        urgency: "high"
      },
      expectedOutcome: "Should escalate due to high value"
    },
    {
      name: "Incomplete Booking Data",
      description: "Test validation with missing information",
      endpoint: "/api/ai-coo",
      payload: {
        jobType: "Cleaning",
        // Missing address
        value: 2500
      },
      expectedOutcome: "Should reject due to missing address"
    },
    {
      name: "Standard Expense Analysis",
      description: "Test typical monthly expenses",
      endpoint: "/api/ai-cfo",
      payload: {
        expenses: [
          { date: "2025-07-01", category: "Maintenance", amount: 3200, description: "Pool cleaning supplies" },
          { date: "2025-07-05", category: "Utilities", amount: 1800, description: "Electricity bill" },
          { date: "2025-07-10", category: "Staff", amount: 15000, description: "Monthly salaries" }
        ]
      },
      expectedOutcome: "Should analyze and approve normal expenses"
    },
    {
      name: "High-Value Expense",
      description: "Test escalation for expensive items",
      endpoint: "/api/ai-cfo",
      payload: {
        expenses: [
          { date: "2025-07-15", category: "Equipment", amount: 25000, description: "New pool filtration system" }
        ]
      },
      expectedOutcome: "Should escalate due to high value"
    },
    {
      name: "Invalid Financial Data",
      description: "Test validation with malformed data",
      endpoint: "/api/ai-cfo",
      payload: {
        // Missing expenses array
        invalidField: "test"
      },
      expectedOutcome: "Should reject due to invalid data structure"
    }
  ]

  // Run a predefined test scenario
  const runScenarioTest = async (scenario: TestScenario) => {
    setLoading(true)
    setError(null)
    setSelectedScenario(scenario)

    try {
      console.log(`🧪 Running test scenario: ${scenario.name}`)

      const res = await fetch(scenario.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(scenario.payload)
      })

      const data = await res.json()
      setResponse(data)

      console.log(`✅ Test completed:`, data)

    } catch (err) {
      console.error('❌ Test failed:', err)
      setError(err instanceof Error ? err.message : 'Test failed')
    } finally {
      setLoading(false)
    }
  }

  // Run custom test with user-provided payload
  const runCustomTest = async (endpoint: string) => {
    if (!customPayload.trim()) {
      setError('Please provide a JSON payload')
      return
    }

    setLoading(true)
    setError(null)
    setSelectedScenario(null)

    try {
      const payload = JSON.parse(customPayload)
      console.log(`🧪 Running custom test on ${endpoint}`)

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      setResponse(data)

      console.log(`✅ Custom test completed:`, data)

    } catch (err) {
      console.error('❌ Custom test failed:', err)
      if (err instanceof SyntaxError) {
        setError('Invalid JSON payload')
      } else {
        setError(err instanceof Error ? err.message : 'Custom test failed')
      }
    } finally {
      setLoading(false)
    }
  }

  // Clear test results
  const clearResults = () => {
    setResponse(null)
    setError(null)
    setSelectedScenario(null)
  }

  // Copy response to clipboard
  const copyResponse = async () => {
    if (response) {
      await navigator.clipboard.writeText(JSON.stringify(response, null, 2))
    }
  }

  // Download response as JSON file
  const downloadResponse = () => {
    if (response) {
      const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ai-test-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  // Quick test function for predefined scenarios
  const runQuickTest = async (testType: string) => {
    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      let endpoint = ''
      let payload = {}

      switch (testType) {
        case 'booking1':
          endpoint = '/api/ai-coo'
          payload = {
            jobType: 'Cleaning',
            address: 'Villa Sunset, Phuket',
            value: 3500,
            customerType: 'regular',
            urgency: 'normal'
          }
          break
        case 'booking2':
          endpoint = '/api/ai-coo'
          payload = {
            jobType: 'Deep Cleaning',
            address: 'Luxury Villa Paradise, Koh Samui',
            value: 12000,
            customerType: 'premium',
            urgency: 'high',
            specialRequirements: ['Pool cleaning', 'Garden maintenance']
          }
          break
        case 'cfo':
          endpoint = '/api/ai-cfo'
          payload = {
            expenses: [
              {
                date: new Date().toISOString().split('T')[0],
                category: 'Cleaning Supplies',
                amount: 2500,
                description: 'Monthly cleaning supplies purchase'
              },
              {
                date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
                category: 'Staff Wages',
                amount: 15000,
                description: 'Weekly staff payments'
              }
            ]
          }
          break
        default:
          throw new Error('Unknown test type')
      }

      console.log(`🧪 Running quick test: ${testType}`)
      console.log('📦 Payload:', payload)

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }

      const data = await res.json()
      console.log(`✅ Quick test ${testType} response:`, data)

      setResponse(data)
      setSelectedScenario(null)

    } catch (err) {
      console.error(`❌ Quick test ${testType} failed:`, err)
      setError(err instanceof Error ? err.message : 'Test failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full bg-neutral-900 border-neutral-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-white">
              🧪 Test AI Decisions
            </CardTitle>
            <p className="text-neutral-400 text-sm mt-1">
              Use this tool to run test bookings or expense data through the AI in safe simulation mode.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-900/20 text-blue-400 border-blue-500/30">
              <TestTube className="h-3 w-3 mr-1" />
              Simulation Mode
            </Badge>
            <Button variant="outline" size="sm" onClick={clearResults}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Quick Test Buttons */}
        <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4">
          <h3 className="font-medium text-white mb-3 flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Quick AI Tests
          </h3>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => runQuickTest('booking1')}
              disabled={loading}
              size="sm"
              variant="outline"
              className="bg-neutral-700 hover:bg-neutral-600 text-white border-neutral-600"
            >
              <Play className="h-3 w-3 mr-1" />
              Test Booking 1
            </Button>
            <Button
              onClick={() => runQuickTest('booking2')}
              disabled={loading}
              size="sm"
              variant="outline"
              className="bg-neutral-700 hover:bg-neutral-600 text-white border-neutral-600"
            >
              <AlertCircle className="h-3 w-3 mr-1" />
              Test Booking 2 (Escalation)
            </Button>
            <Button
              onClick={() => runQuickTest('cfo')}
              disabled={loading}
              size="sm"
              variant="outline"
              className="bg-neutral-700 hover:bg-neutral-600 text-white border-neutral-600"
            >
              <DollarSign className="h-3 w-3 mr-1" />
              Run CFO Test
            </Button>
          </div>
          <p className="text-xs text-neutral-400 mt-2">
            Quick tests run predefined scenarios. Check console for detailed results.
            <br />
            <a
              href="/docs/ai-test-scenarios.md"
              target="_blank"
              className="underline hover:text-neutral-300"
            >
              📖 View Test Scenarios Documentation
            </a>
          </p>
        </div>

        {/* Test Tabs */}
        <Tabs defaultValue="scenarios" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scenarios">Predefined Scenarios</TabsTrigger>
            <TabsTrigger value="custom">Custom Tests</TabsTrigger>
          </TabsList>

          {/* Predefined Scenarios Tab */}
          <TabsContent value="scenarios" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testScenarios.map((scenario, index) => (
                <Card key={index} className="border-2 hover:border-neutral-600 transition-colors bg-neutral-800">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-sm text-white">{scenario.name}</h3>
                          <p className="text-xs text-neutral-400 mt-1">
                            {scenario.description}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {scenario.endpoint.includes('coo') ? (
                            <User className="h-3 w-3 mr-1" />
                          ) : (
                            <DollarSign className="h-3 w-3 mr-1" />
                          )}
                          {scenario.endpoint.includes('coo') ? 'COO' : 'CFO'}
                        </Badge>
                      </div>

                      <div className="text-xs text-neutral-400">
                        <strong>Expected:</strong> {scenario.expectedOutcome}
                      </div>

                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => runScenarioTest(scenario)}
                        disabled={loading}
                      >
                        {loading && selectedScenario === scenario ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                            Running...
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3 mr-2" />
                            Run Test
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Custom Tests Tab */}
          <TabsContent value="custom" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  JSON Payload
                </label>
                <Textarea
                  value={customPayload}
                  onChange={(e) => setCustomPayload(e.target.value)}
                  placeholder={`{
  "jobType": "Cleaning",
  "address": "123 Test Villa",
  "value": 5000
}`}
                  className="min-h-[120px] font-mono text-sm"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => runCustomTest('/api/ai-coo')}
                  disabled={loading || !customPayload.trim()}
                  className="flex-1"
                >
                  <User className="h-4 w-4 mr-2" />
                  Test AI COO
                </Button>
                <Button
                  variant="outline"
                  onClick={() => runCustomTest('/api/ai-cfo')}
                  disabled={loading || !customPayload.trim()}
                  className="flex-1"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Test AI CFO
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Response Display */}
        {response && (
          <Card className="border-2 border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h3 className="font-medium">Test Results</h3>
                  {response.simulated && (
                    <Badge variant="outline" className="bg-blue-900/20 text-blue-400 border-blue-500/30">
                      Simulated
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={copyResponse}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={downloadResponse}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-neutral-800 text-neutral-300 p-3 rounded border border-neutral-700 overflow-auto max-h-96">
                {JSON.stringify(response, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}
