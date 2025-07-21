'use client'

import RealTimeCalendar from '@/components/calendar/RealTimeCalendar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Calendar, Home, Play, Users, Zap } from 'lucide-react'
import { useState } from 'react'

/**
 * 🧪 Real-Time Calendar Test Page
 *
 * Demonstrates Phase 2 real-time calendar features:
 * - Live calendar updates
 * - Real-time conflict detection
 * - Multi-user synchronization
 * - Server-sent events
 */

export default function TestRealTimeCalendarPage() {
  const [testConfig, setTestConfig] = useState({
    propertyName: '',
    eventTypes: [] as string[],
    showConflicts: true,
    dateRange: {
      start: new Date().toISOString().split('T')[0],
      end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  })

  const [isRunningTest, setIsRunningTest] = useState(false)

  // Run test workflow to generate events
  const runTestWorkflow = async (testType: string) => {
    setIsRunningTest(true)
    try {
      const response = await fetch('/api/test-calendar-workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testType,
          propertyName: testConfig.propertyName || 'Maya House',
          guestName: `Test Guest ${Date.now()}`,
          title: `Test Job ${Date.now()}`,
          checkInDate: '2026-12-01',
          checkOutDate: '2026-12-05'
        })
      })

      const result = await response.json()
      console.log('Test workflow result:', result)

      if (result.success) {
        alert(`✅ ${testType} test completed successfully! Check the calendar for real-time updates.`)
      } else {
        alert(`❌ Test failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Test error:', error)
      alert(`❌ Test error: ${error}`)
    } finally {
      setIsRunningTest(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            🔄 Real-Time Calendar System
          </h1>
          <p className="text-xl text-neutral-400">
            Phase 2: Advanced Calendar Integration & Automation
          </p>
          <div className="flex items-center justify-center gap-4">
            <Badge className="bg-blue-500/20 border-blue-500/30 text-blue-400">
              <Zap className="w-3 h-3 mr-1" />
              Live Updates
            </Badge>
            <Badge className="bg-green-500/20 border-green-500/30 text-green-400">
              <Users className="w-3 h-3 mr-1" />
              Multi-User Sync
            </Badge>
            <Badge className="bg-purple-500/20 border-purple-500/30 text-purple-400">
              <Calendar className="w-3 h-3 mr-1" />
              Conflict Detection
            </Badge>
          </div>
        </div>

        {/* Test Controls */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Play className="w-5 h-5" />
              Test Real-Time Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-white">Property Filter</Label>
                <Input
                  value={testConfig.propertyName}
                  onChange={(e) => setTestConfig(prev => ({ ...prev, propertyName: e.target.value }))}
                  placeholder="Maya House"
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Event Types</Label>
                <Select>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="booking">Bookings Only</SelectItem>
                    <SelectItem value="job">Jobs Only</SelectItem>
                    <SelectItem value="maintenance">Maintenance Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-white">Date Range</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={testConfig.dateRange.start}
                    onChange={(e) => setTestConfig(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: e.target.value }
                    }))}
                    className="bg-neutral-800 border-neutral-700 text-white"
                  />
                  <Input
                    type="date"
                    value={testConfig.dateRange.end}
                    onChange={(e) => setTestConfig(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: e.target.value }
                    }))}
                    className="bg-neutral-800 border-neutral-700 text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => runTestWorkflow('booking-confirmation')}
                disabled={isRunningTest}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Home className="w-4 h-4 mr-2" />
                Test Booking Workflow
              </Button>
              <Button
                onClick={() => runTestWorkflow('job-lifecycle')}
                disabled={isRunningTest}
                className="bg-green-600 hover:bg-green-700"
              >
                <Users className="w-4 h-4 mr-2" />
                Test Job Workflow
              </Button>
              <Button
                onClick={() => runTestWorkflow('full-workflow')}
                disabled={isRunningTest}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Zap className="w-4 h-4 mr-2" />
                Test Full Workflow
              </Button>
            </div>

            <div className="text-sm text-neutral-400">
              💡 <strong>How to test:</strong> Click any test button above to create calendar events.
              Watch the calendar below update in real-time without page refresh!
            </div>
          </CardContent>
        </Card>

        {/* Real-Time Calendar */}
        <RealTimeCalendar
          propertyName={testConfig.propertyName || undefined}
          dateRange={testConfig.dateRange}
          eventTypes={testConfig.eventTypes.length > 0 ? testConfig.eventTypes : undefined}
          showConflicts={testConfig.showConflicts}
        />

        {/* Features Overview */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">🚀 Phase 2 Features Implemented</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-blue-400">✅ Real-Time Synchronization</h3>
                <ul className="space-y-1 text-sm text-neutral-300">
                  <li>• Server-Sent Events (SSE) for live updates</li>
                  <li>• Automatic reconnection on connection loss</li>
                  <li>• Multi-user calendar synchronization</li>
                  <li>• Real-time conflict detection</li>
                  <li>• Live status indicators</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-green-400">✅ Advanced Features</h3>
                <ul className="space-y-1 text-sm text-neutral-300">
                  <li>• Conflict alerts with severity levels</li>
                  <li>• Property and date range filtering</li>
                  <li>• Event type categorization</li>
                  <li>• Automatic event updates</li>
                  <li>• Heartbeat monitoring</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Endpoints */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">🔗 API Endpoints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-blue-400 border-blue-400">GET</Badge>
                <code className="text-neutral-300">/api/calendar-stream</code>
                <span className="text-neutral-400">Real-time calendar events stream</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-green-400 border-green-400">POST</Badge>
                <code className="text-neutral-300">/api/booking-confirmation-webhook</code>
                <span className="text-neutral-400">Booking confirmation workflow</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-green-400 border-green-400">POST</Badge>
                <code className="text-neutral-300">/api/job-status-webhook</code>
                <span className="text-neutral-400">Job status change workflow</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-purple-400 border-purple-400">POST</Badge>
                <code className="text-neutral-300">/api/test-calendar-workflows</code>
                <span className="text-neutral-400">Test workflow automation</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
