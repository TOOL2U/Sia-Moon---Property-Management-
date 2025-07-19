'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import {
  TestTube,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Clock,
  Target,
  Zap,
  Activity,
  TrendingUp,
  Users,
  Calendar,
  Building2,
  Bell,
  Loader2,
  Star,
  Award,
  Shield,
  Gauge
} from 'lucide-react'
import { motion } from 'framer-motion'

interface TestScenario {
  id: string
  name: string
  description: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  duration: string
  results?: {
    success: boolean
    score: number
    details: string
  }
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
}

export default function AIOperationsTestingAgent() {
  const [isRunning, setIsRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState<string | null>(null)
  const [testScenarios, setTestScenarios] = useState<TestScenario[]>([
    {
      id: 'booking-approval',
      name: 'Booking Approval Intelligence',
      description: 'Test AI decision-making for booking approvals with various scenarios',
      status: 'pending',
      progress: 0,
      duration: '2-3 minutes'
    },
    {
      id: 'staff-assignment',
      name: 'Smart Staff Assignment',
      description: 'Validate AI staff assignment algorithms and optimization',
      status: 'pending',
      progress: 0,
      duration: '3-4 minutes'
    },
    {
      id: 'calendar-sync',
      name: 'Calendar Integration',
      description: 'Test real-time calendar synchronization and conflict resolution',
      status: 'pending',
      progress: 0,
      duration: '1-2 minutes'
    },
    {
      id: 'notification-system',
      name: 'Notification Intelligence',
      description: 'Verify smart notification delivery and escalation protocols',
      status: 'pending',
      progress: 0,
      duration: '2-3 minutes'
    },
    {
      id: 'emergency-response',
      name: 'Emergency Response Coordination',
      description: 'Test AI emergency detection and response coordination',
      status: 'pending',
      progress: 0,
      duration: '4-5 minutes'
    },
    {
      id: 'revenue-optimization',
      name: 'Revenue Optimization Analysis',
      description: 'Validate AI pricing and revenue optimization algorithms',
      status: 'pending',
      progress: 0,
      duration: '3-4 minutes'
    }
  ])

  const runAllTests = async () => {
    setIsRunning(true)
    
    for (const scenario of testScenarios) {
      setCurrentTest(scenario.id)
      
      // Update scenario to running
      setTestScenarios(prev => prev.map(s => 
        s.id === scenario.id 
          ? { ...s, status: 'running', progress: 0 }
          : s
      ))

      // Simulate test execution with progress updates
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 200))
        setTestScenarios(prev => prev.map(s => 
          s.id === scenario.id 
            ? { ...s, progress }
            : s
        ))
      }

      // Complete the test with results
      const success = Math.random() > 0.1 // 90% success rate
      const score = success ? Math.floor(Math.random() * 20) + 80 : Math.floor(Math.random() * 50) + 30
      
      setTestScenarios(prev => prev.map(s => 
        s.id === scenario.id 
          ? { 
              ...s, 
              status: success ? 'completed' : 'failed',
              progress: 100,
              results: {
                success,
                score,
                details: success 
                  ? `Test completed successfully with ${score}% accuracy`
                  : `Test failed with ${score}% accuracy - requires attention`
              }
            }
          : s
      ))

      await new Promise(resolve => setTimeout(resolve, 500))
    }

    setCurrentTest(null)
    setIsRunning(false)
  }

  const resetTests = () => {
    setTestScenarios(prev => prev.map(s => ({
      ...s,
      status: 'pending',
      progress: 0,
      results: undefined
    })))
    setCurrentTest(null)
    setIsRunning(false)
  }

  const getStatusIcon = (status: TestScenario['status']) => {
    switch (status) {
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'failed':
        return <AlertTriangle className="w-5 h-5 text-red-400" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: TestScenario['status']) => {
    switch (status) {
      case 'running':
        return 'border-blue-700/30 bg-blue-900/20'
      case 'completed':
        return 'border-green-700/30 bg-green-900/20'
      case 'failed':
        return 'border-red-700/30 bg-red-900/20'
      default:
        return 'border-gray-700/30 bg-gray-900/20'
    }
  }

  const completedTests = testScenarios.filter(s => s.status === 'completed').length
  const failedTests = testScenarios.filter(s => s.status === 'failed').length
  const averageScore = testScenarios
    .filter(s => s.results)
    .reduce((acc, s) => acc + (s.results?.score || 0), 0) / 
    testScenarios.filter(s => s.results).length || 0

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-700/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <TestTube className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white text-2xl flex items-center gap-3">
                    AI Operations Testing Agent
                    <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/30">
                      READY
                    </Badge>
                  </CardTitle>
                  <p className="text-purple-200 mt-1">
                    Comprehensive AI system testing and validation suite
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={resetTests}
                  disabled={isRunning}
                  variant="outline"
                  size="sm"
                  className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
                <Button
                  onClick={runAllTests}
                  disabled={isRunning}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  {isRunning ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Running Tests...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Run All Tests
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Test Results Summary */}
      {(completedTests > 0 || failedTests > 0) && (
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-r from-gray-900/50 to-slate-900/50 border-gray-700/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <Award className="w-4 h-4 text-white" />
                </div>
                Test Results Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-900/20 border border-green-700/30 rounded-lg">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-400">{completedTests}</div>
                  <div className="text-sm text-green-300">Tests Passed</div>
                </div>
                <div className="text-center p-4 bg-red-900/20 border border-red-700/30 rounded-lg">
                  <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-red-400">{failedTests}</div>
                  <div className="text-sm text-red-300">Tests Failed</div>
                </div>
                <div className="text-center p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                  <Star className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-400">{averageScore.toFixed(1)}%</div>
                  <div className="text-sm text-blue-300">Average Score</div>
                </div>
                <div className="text-center p-4 bg-purple-900/20 border border-purple-700/30 rounded-lg">
                  <Gauge className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-400">
                    {((completedTests / (completedTests + failedTests)) * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-purple-300">Success Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Test Scenarios */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {testScenarios.map((scenario) => (
            <Card
              key={scenario.id}
              className={`${getStatusColor(scenario.status)} border backdrop-blur-sm transition-all duration-300`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(scenario.status)}
                    <div>
                      <CardTitle className="text-white text-lg">{scenario.name}</CardTitle>
                      <p className="text-gray-300 text-sm mt-1">{scenario.description}</p>
                    </div>
                  </div>
                  <Badge
                    className={`${
                      scenario.status === 'completed'
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : scenario.status === 'failed'
                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : scenario.status === 'running'
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                    }`}
                  >
                    {scenario.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">Duration: {scenario.duration}</span>
                    <span className="text-gray-300">{scenario.progress}%</span>
                  </div>
                  <Progress value={scenario.progress} className="h-2" />
                  
                  {scenario.results && (
                    <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-white font-medium">Results:</span>
                        <Badge
                          className={`${
                            scenario.results.success
                              ? 'bg-green-500/20 text-green-400 border-green-500/30'
                              : 'bg-red-500/20 text-red-400 border-red-500/30'
                          }`}
                        >
                          {scenario.results.score}% Score
                        </Badge>
                      </div>
                      <p className="text-gray-300 text-sm">{scenario.results.details}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
