'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import StaffAuditReports from '@/components/admin/StaffAuditReports'
import { Smartphone, Play, Zap, Users, FileText, Clock, CheckCircle } from 'lucide-react'

/**
 * 🧪 Mobile App Integration Test Page
 * 
 * Demonstrates live mobile app integration with:
 * - Job completion data ingestion
 * - Real-time audit report reception
 * - Live dashboard updates
 */

export default function TestMobileIntegrationPage() {
  const [simulationConfig, setSimulationConfig] = useState({
    simulationType: 'both',
    duration: 2, // minutes
    frequency: 15, // seconds
    staffIds: ['staff_001', 'staff_002', 'staff_003']
  })

  const [isRunningSimulation, setIsRunningSimulation] = useState(false)
  const [simulationResults, setSimulationResults] = useState<any>(null)

  // Sample staff list for the audit reports component
  const sampleStaffList = [
    { id: 'staff_001', name: 'John Smith', role: 'cleaner', status: 'active' },
    { id: 'staff_002', name: 'Maria Garcia', role: 'maintenance', status: 'active' },
    { id: 'staff_003', name: 'David Chen', role: 'manager', status: 'active' }
  ]

  // Run mobile app simulation
  const runSimulation = async () => {
    setIsRunningSimulation(true)
    setSimulationResults(null)

    try {
      console.log('🧪 Starting mobile app simulation...')

      const response = await fetch('/api/mobile/test-simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(simulationConfig)
      })

      const result = await response.json()
      
      if (result.success) {
        setSimulationResults(result)
        console.log('✅ Simulation completed:', result)
      } else {
        console.error('❌ Simulation failed:', result.error)
        alert(`Simulation failed: ${result.error}`)
      }

    } catch (error) {
      console.error('❌ Simulation error:', error)
      alert(`Simulation error: ${error}`)
    } finally {
      setIsRunningSimulation(false)
    }
  }

  // Test individual API endpoints
  const testJobCompletion = async () => {
    try {
      const testData = {
        staffId: 'staff_001',
        jobId: `test_job_${Date.now()}`,
        jobType: 'cleaning',
        propertyId: 'prop_001',
        propertyName: 'Maya House',
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        endTime: new Date().toISOString(),
        completionStatus: 'completed',
        gpsLocations: [{
          latitude: 13.7563,
          longitude: 100.5018,
          timestamp: new Date().toISOString(),
          accuracy: 0.95
        }],
        photos: [
          {
            type: 'before',
            url: 'https://example.com/before.jpg',
            timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString()
          },
          {
            type: 'after',
            url: 'https://example.com/after.jpg',
            timestamp: new Date().toISOString()
          }
        ],
        qualityRating: 5
      }

      const response = await fetch('/api/mobile/job-completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      })

      const result = await response.json()
      
      if (result.success) {
        alert('✅ Job completion test successful!')
        console.log('Job completion result:', result)
      } else {
        alert(`❌ Job completion test failed: ${result.error}`)
      }

    } catch (error) {
      console.error('Job completion test error:', error)
      alert(`❌ Job completion test error: ${error}`)
    }
  }

  const testAuditReport = async () => {
    try {
      const now = new Date()
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay() + 1)
      weekStart.setHours(0, 0, 0, 0)
      
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)

      const testData = {
        staffId: 'staff_001',
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        trustScore: 87,
        qualityScore: 92,
        metrics: {
          jobsCompleted: 12,
          jobsAccepted: 14,
          averageCompletionTime: 65,
          onTimeCompletionRate: 0.85,
          photoComplianceRate: 0.95,
          gpsAccuracy: 0.88,
          aiUsageCount: 3,
          responseTime: 12
        },
        insights: {
          strengths: ['Excellent attention to detail', 'Consistent performance'],
          concerns: ['Occasional GPS accuracy issues'],
          recommendations: ['Review GPS settings on mobile device'],
          behavioralPatterns: ['Performs best on morning assignments']
        },
        trends: {
          trustScoreTrend: 'improving',
          qualityTrend: 'stable',
          productivityTrend: 'improving'
        },
        aiAnalysis: 'This staff member shows excellent performance with consistent improvement trends.',
        weekNumber: Math.ceil((weekStart.getDate() - weekStart.getDay() + 1) / 7),
        year: weekStart.getFullYear(),
        generatedBy: 'test-interface',
        dataPoints: 25,
        confidenceLevel: 0.92
      }

      const response = await fetch('/api/mobile/audit-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      })

      const result = await response.json()
      
      if (result.success) {
        alert('✅ Audit report test successful!')
        console.log('Audit report result:', result)
      } else {
        alert(`❌ Audit report test failed: ${result.error}`)
      }

    } catch (error) {
      console.error('Audit report test error:', error)
      alert(`❌ Audit report test error: ${error}`)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
            📱 Mobile App Integration Test
          </h1>
          <p className="text-xl text-neutral-400">
            Live testing of mobile app data ingestion and real-time audit reports
          </p>
          <div className="flex items-center justify-center gap-4">
            <Badge className="bg-blue-500/20 border-blue-500/30 text-blue-400">
              <Smartphone className="w-3 h-3 mr-1" />
              Mobile Data
            </Badge>
            <Badge className="bg-green-500/20 border-green-500/30 text-green-400">
              <Zap className="w-3 h-3 mr-1" />
              Real-time Updates
            </Badge>
            <Badge className="bg-purple-500/20 border-purple-500/30 text-purple-400">
              <FileText className="w-3 h-3 mr-1" />
              Live Reports
            </Badge>
          </div>
        </div>

        {/* Test Controls */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Play className="w-5 h-5" />
              Mobile App Simulation Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-white text-sm">Simulation Type</label>
                <Select 
                  value={simulationConfig.simulationType} 
                  onValueChange={(value) => setSimulationConfig(prev => ({ ...prev, simulationType: value }))}
                >
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="job_completion">Job Completions Only</SelectItem>
                    <SelectItem value="audit_report">Audit Reports Only</SelectItem>
                    <SelectItem value="both">Both (Recommended)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-white text-sm">Duration (minutes)</label>
                <Input
                  type="number"
                  value={simulationConfig.duration}
                  onChange={(e) => setSimulationConfig(prev => ({ ...prev, duration: parseInt(e.target.value) || 2 }))}
                  className="bg-neutral-800 border-neutral-700 text-white"
                  min="1"
                  max="10"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-white text-sm">Frequency (seconds)</label>
                <Input
                  type="number"
                  value={simulationConfig.frequency}
                  onChange={(e) => setSimulationConfig(prev => ({ ...prev, frequency: parseInt(e.target.value) || 15 }))}
                  className="bg-neutral-800 border-neutral-700 text-white"
                  min="5"
                  max="60"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-white text-sm">Staff Count</label>
                <div className="text-white bg-neutral-800 border border-neutral-700 rounded px-3 py-2">
                  {simulationConfig.staffIds.length} staff
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={runSimulation}
                disabled={isRunningSimulation}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Play className="w-4 h-4 mr-2" />
                {isRunningSimulation ? 'Running Simulation...' : 'Start Full Simulation'}
              </Button>
              
              <Button 
                onClick={testJobCompletion}
                disabled={isRunningSimulation}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Test Job Completion
              </Button>
              
              <Button 
                onClick={testAuditReport}
                disabled={isRunningSimulation}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <FileText className="w-4 h-4 mr-2" />
                Test Audit Report
              </Button>
            </div>

            {simulationResults && (
              <div className="mt-4 p-4 bg-neutral-800 rounded-lg">
                <h3 className="text-white font-medium mb-2">Simulation Results:</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-neutral-400">Job Completions:</span>
                    <div className="text-green-400 font-medium">{simulationResults.results.jobCompletions}</div>
                  </div>
                  <div>
                    <span className="text-neutral-400">Audit Reports:</span>
                    <div className="text-blue-400 font-medium">{simulationResults.results.auditReports}</div>
                  </div>
                  <div>
                    <span className="text-neutral-400">Errors:</span>
                    <div className="text-red-400 font-medium">{simulationResults.results.errors}</div>
                  </div>
                  <div>
                    <span className="text-neutral-400">Duration:</span>
                    <div className="text-white font-medium">{simulationConfig.duration}m</div>
                  </div>
                </div>
              </div>
            )}

            <div className="text-sm text-neutral-400">
              💡 <strong>How to test:</strong> Start the simulation to generate live mobile app data. 
              Watch the audit reports below update in real-time as the mobile app sends data!
            </div>
          </CardContent>
        </Card>

        {/* Live Staff Audit Reports */}
        <StaffAuditReports staffList={sampleStaffList} />

        {/* API Status */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">📡 Mobile App API Endpoints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-green-400 border-green-400">POST</Badge>
                <code className="text-neutral-300">/api/mobile/job-completion</code>
                <span className="text-neutral-400">Receives job completion data from mobile app</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-blue-400 border-blue-400">POST</Badge>
                <code className="text-neutral-300">/api/mobile/audit-report</code>
                <span className="text-neutral-400">Receives completed audit reports from mobile app</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-purple-400 border-purple-400">POST</Badge>
                <code className="text-neutral-300">/api/mobile/test-simulator</code>
                <span className="text-neutral-400">Simulates mobile app sending live test data</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
