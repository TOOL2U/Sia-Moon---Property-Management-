'use client'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { motion } from 'framer-motion'
import {
  CheckCircle,
  Clock,
  Loader2,
  Play,
  RefreshCw,
  TestTube,
  Users,
  Zap
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

interface StaffMember {
  id: string
  name: string
  email: string
  role: string
  firebaseUid?: string
}

interface TestResult {
  success: boolean
  jobId?: string
  sessionId?: string
  performanceScore?: number
  staffName?: string
  jobType?: string
  performance?: string
  error?: string
}

export function JobWorkflowTester() {
  const [loading, setLoading] = useState(false)
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [selectedStaff, setSelectedStaff] = useState<string>('')
  const [selectedJobType, setSelectedJobType] = useState<string>('cleaning')
  const [selectedPerformance, setSelectedPerformance] = useState<string>('excellent')
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [staffLoading, setStaffLoading] = useState(false)

  // Load staff data
  const loadStaffData = useCallback(async () => {
    try {
      setStaffLoading(true)
      const response = await fetch('/api/admin/staff-accounts')
      const data = await response.json()

      if (data.success && data.data) {
        const activeStaff: StaffMember[] = data.data
          .filter((staff: any) => staff.status === 'active' || staff.isActive)
          .map((staff: any) => ({
            id: staff.firebaseUid || staff.id,
            name: staff.name,
            email: staff.email,
            role: staff.role,
            firebaseUid: staff.firebaseUid
          }))

        setStaffMembers(activeStaff)
        console.log(`✅ Loaded ${activeStaff.length} staff members for testing`)
      }
    } catch (error) {
      console.error('❌ Error loading staff data:', error)
      toast.error('Failed to load staff data')
    } finally {
      setStaffLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStaffData()
  }, [loadStaffData])

  // Create single job workflow test
  const createJobWorkflow = useCallback(async () => {
    if (!selectedStaff) {
      toast.error('Please select a staff member')
      return
    }

    try {
      setLoading(true)
      const staffMember = staffMembers.find(s => s.id === selectedStaff)
      if (!staffMember) {
        toast.error('Staff member not found')
        return
      }

      console.log(`🧪 Creating job workflow test for ${staffMember.name}...`)

      const response = await fetch('/api/test/job-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: selectedStaff,
          staffName: staffMember.name,
          jobType: selectedJobType,
          performance: selectedPerformance
        })
      })

      const result = await response.json()
      
      if (result.success) {
        const testResult: TestResult = {
          success: true,
          jobId: result.data.jobId,
          sessionId: result.data.sessionId,
          performanceScore: result.data.performanceScore,
          staffName: result.data.staffName,
          jobType: result.data.jobType,
          performance: result.data.performance
        }
        
        setTestResults(prev => [testResult, ...prev.slice(0, 9)]) // Keep last 10 results
        
        toast.success(`✅ Job workflow created for ${staffMember.name}`)
        console.log(`✅ Test completed:`, testResult)
      } else {
        const errorResult: TestResult = {
          success: false,
          error: result.error,
          staffName: staffMember.name
        }
        setTestResults(prev => [errorResult, ...prev.slice(0, 9)])
        toast.error(`❌ Failed to create job workflow: ${result.error}`)
      }
    } catch (error) {
      console.error('❌ Error creating job workflow:', error)
      toast.error('Failed to create job workflow')
    } finally {
      setLoading(false)
    }
  }, [selectedStaff, selectedJobType, selectedPerformance, staffMembers])

  // Create multiple test scenarios
  const createTestScenarios = useCallback(async () => {
    try {
      setLoading(true)
      console.log('🧪 Creating multiple test scenarios...')

      const response = await fetch('/api/test/job-workflow?action=scenarios')
      const result = await response.json()

      if (result.success) {
        const newResults: TestResult[] = result.scenarios.map((scenario: any) => ({
          success: scenario.success,
          jobId: scenario.jobId,
          sessionId: scenario.sessionId,
          performanceScore: scenario.performanceScore,
          error: scenario.error
        }))

        setTestResults(prev => [...newResults, ...prev].slice(0, 10))
        toast.success(`✅ Created ${result.totalCreated} test scenarios`)
      } else {
        toast.error(`❌ Failed to create test scenarios: ${result.error}`)
      }
    } catch (error) {
      console.error('❌ Error creating test scenarios:', error)
      toast.error('Failed to create test scenarios')
    } finally {
      setLoading(false)
    }
  }, [])

  const getPerformanceColor = (score?: number): string => {
    if (!score) return 'text-gray-400'
    if (score >= 90) return 'text-green-400'
    if (score >= 70) return 'text-yellow-400'
    if (score >= 50) return 'text-orange-400'
    return 'text-red-400'
  }

  const getPerformanceBadge = (performance?: string): string => {
    switch (performance) {
      case 'excellent': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'good': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'average': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'poor': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <TestTube className="w-4 h-4 text-white" />
            </div>
            Job Workflow Tester
          </h2>
          <p className="text-gray-400 mt-1">Test complete job workflows from creation to AI audit analysis</p>
        </div>
        <Badge className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border-blue-500/30">
          Integration Testing
        </Badge>
      </div>

      {/* Test Controls */}
      <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Play className="w-5 h-5" />
            Create Test Job Workflow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Staff Member</label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff} disabled={staffLoading}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder={staffLoading ? "Loading..." : "Select staff"} />
                </SelectTrigger>
                <SelectContent>
                  {staffMembers.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{staff.name}</span>
                        <span className="text-gray-400">({staff.role})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Job Type</label>
              <Select value={selectedJobType} onValueChange={setSelectedJobType}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Performance Level</label>
              <Select value={selectedPerformance} onValueChange={setSelectedPerformance}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="average">Average</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button
                onClick={createJobWorkflow}
                disabled={loading || !selectedStaff}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white flex-1"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
              
              <Button
                onClick={createTestScenarios}
                disabled={loading}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <Zap className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Test Results ({testResults.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${result.success ? 'bg-green-400' : 'bg-red-400'}`} />
                    <div>
                      <p className="text-white font-medium">
                        {result.staffName} - {result.jobType}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {result.success ? `Job: ${result.jobId}` : `Error: ${result.error}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {result.performance && (
                      <Badge className={getPerformanceBadge(result.performance)}>
                        {result.performance}
                      </Badge>
                    )}
                    {result.performanceScore && (
                      <div className={`text-lg font-bold ${getPerformanceColor(result.performanceScore)}`}>
                        {result.performanceScore}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
